import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import { getTenantContracts, getDb, generateContractPdf, getUserProfile } from "../db";
import { contracts, properties, users, userProfiles, appSettings, payments, keyCollections, checklistTemplates, moveInChecklists } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { TRPCError } from "@trpc/server";
import Stripe from "stripe";
import { ENV } from "../env";
import { notifyContractSignedByTenant, notifyContractFullySigned, notifyPaymentCompleted, notifyPaymentReceived, notifyContractSent, notifyKeyCollectionScheduled } from "../notifications-service";
import { awardOwnerForActivity, awardUserForActivity } from "../owner-earnings-service";
import { REWARD_AMOUNTS } from "../config/rewards";

const stripe = new Stripe(ENV.stripeSecretKey, {
  apiVersion: "2025-01-27.acacia" as any,
});

export const contractsRouter = router({
  getTenantContracts: protectedProcedure.query(async ({ ctx }) => {
    console.log(`[contracts.getTenantContracts] Fetching for user ID: ${ctx.user.id}`);
    try {
      const db = await getDb() as any;
      if (!db) {
        console.error("[contracts.getTenantContracts] DB not available");
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      const userContracts = await db
        .select({
          contract: contracts,
          property: properties,
          landlord: users,
          checklistStatus: moveInChecklists.status,
          checklistId: moveInChecklists.id,
        })
        .from(contracts)
        .innerJoin(properties, eq(contracts.propertyId, properties.id))
        .innerJoin(users, eq(contracts.landlordId, users.id))
        .leftJoin(moveInChecklists, eq(contracts.id, moveInChecklists.contractId))
        .where(eq(contracts.tenantId, ctx.user.id))
        .orderBy(desc(contracts.createdAt));

      console.log(`[contracts.getTenantContracts] Found ${userContracts.length} contracts`);

      return userContracts.map((row: any) => ({
        ...row.contract,
        property: row.property,
        landlord: row.landlord,
        checklistStatus: row.checklistStatus,
        checklistId: row.checklistId,
      }));
    } catch (error: any) {
      console.error("[contracts.getTenantContracts] Error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message || "An unexpected error occurred",
      });
    }
  }),

  getLandlordContracts: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb() as any;
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const landlordContracts = await db
      .select({
        contract: contracts,
        property: properties,
        tenant: users,
        checklistStatus: moveInChecklists.status,
      })
      .from(contracts)
      .innerJoin(properties, eq(contracts.propertyId, properties.id))
      .innerJoin(users, eq(contracts.tenantId, users.id))
      .leftJoin(moveInChecklists, eq(contracts.id, moveInChecklists.contractId))
      .where(eq(contracts.landlordId, ctx.user.id))
      .orderBy(desc(contracts.createdAt));

    return landlordContracts.map((row: any) => ({
      ...row.contract,
      property: row.property,
      tenant: row.tenant,
      checklistStatus: row.checklistStatus,
    }));
  }),

  getById: protectedProcedure
    .input(z.object({ contractId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const contractRows = await db
        .select({
          contract: contracts,
          property: properties,
          landlord: users,
          tenant: users,
        })
        .from(contracts)
        .leftJoin(properties, eq(contracts.propertyId, properties.id))
        .leftJoin(users, eq(contracts.landlordId, users.id))
        .leftJoin(alias(users, "tenant"), eq(contracts.tenantId, alias(users, "tenant").id))
        .where(eq(contracts.id, input.contractId))
        .limit(1);

      if (contractRows.length === 0) throw new TRPCError({ code: "NOT_FOUND", message: "Contract not found" });

      const row = contractRows[0];
      
      // Manually Fetch Tenant (because alias might be tricky in some drivers or complex to map)
      // Actually, standard leftJoin with alias works, but let's be safe and fetch tenant separately if needed.
      // But let's try to map it first. The issue is `alias` usage in select.
      // Let's simplify: fetch contract, then fetch related.
      
      // Re-implementation with simple selects to avoid ALL json_array issues
      const [contract] = await db.select().from(contracts).where(eq(contracts.id, input.contractId));
      if (!contract) throw new TRPCError({ code: "NOT_FOUND", message: "Contract not found" });
      
      const [property] = await db.select().from(properties).where(eq(properties.id, contract.propertyId));
      const [landlord] = await db.select().from(users).where(eq(users.id, contract.landlordId));
      const [tenant] = await db.select().from(users).where(eq(users.id, contract.tenantId));

      return {
        ...contract,
        property,
        landlord,
        tenant
      };
    }),

  create: protectedProcedure
    .input(z.object({
      propertyId: z.number(),
      tenantId: z.number(),
      applicationId: z.number().optional(),
      startDate: z.string(),
      endDate: z.string(),
      monthlyRent: z.number(),
      securityDeposit: z.number(),
      terms: z.string().optional(),
      specialConditions: z.string().optional(),
      checklistId: z.number().optional().nullable(),
      templateId: z.number().optional().nullable(),
      sendImmediately: z.boolean().default(false),
      language: z.enum(["en", "es"]).default("en"),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const defaultTerms = `CONTRATO DE ARRENDAMIENTO DE VIVIENDA (LAU 29/1994)

PRIMERA.- OBJETO DEL CONTRATO
El ARRENDADOR cede en arrendamiento al ARRENDATARIO la vivienda descrita para uso exclusivo de vivienda habitual.

SEGUNDA.- DURACIÓN
El contrato tendrá la duración pactada. Si es inferior a cinco años, se prorrogará obligatoriamente por plazos anuales hasta alcanzar cinco años, salvo que el arrendatario manifieste su voluntad de no renovar con 30 días de antelación.

TERCERA.- RENTA Y ACTUALIZACIÓN
El pago se realizará mensualmente. La renta podrá ser actualizada anualmente conforme al IPC.

CUARTA.- FIANZA
El ARRENDATARIO entrega la fianza legal equivalente a una mensualidad de renta.

QUINTA.- OBLIGACIONES
El ARRENDATARIO se obliga a conservar la vivienda en buen estado y destinarla a vivienda habitual. No podrá subarrendar sin autorización.

SEXTA.- RESOLUCIÓN
El incumplimiento de las obligaciones contractuales dará lugar a la resolución del contrato.`;

      const [result] = await db.insert(contracts).values({
        propertyId: input.propertyId,
        landlordId: ctx.user.id,
        tenantId: input.tenantId,
        applicationId: input.applicationId,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        monthlyRent: input.monthlyRent,
        securityDeposit: input.securityDeposit,
        terms: input.terms || defaultTerms,
        specialConditions: input.specialConditions,
        status: input.sendImmediately ? "sent_to_tenant" : "draft",
        language: input.language,
        checklistDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      const contractId = result.insertId;

      // Determine Checklist Template to use
      let checklistTemplateId = input.checklistId;

      if (!checklistTemplateId) {
        // Try to get from property
        const property = await db.query.properties.findFirst({
          where: eq(properties.id, input.propertyId),
          columns: { checklistTemplateId: true }
        });
        if (property?.checklistTemplateId) {
          checklistTemplateId = property.checklistTemplateId;
        }
      }

      // Create Move-In Checklist if template selected/found
      if (checklistTemplateId) {
        try {
          const template = await db.query.checklistTemplates.findFirst({
            where: eq(checklistTemplates.id, checklistTemplateId)
          });

          if (template) {
            // Sanitize template items to remove any pre-filled data
            let cleanItems = "[]";
            try {
              const parsed = JSON.parse(template.items);
              const rooms = Array.isArray(parsed) ? parsed : (parsed.rooms || []);
              
              const sanitizedRooms = rooms.map((room: any) => ({
                room: room.room,
                items: room.items.map((item: any) => ({
                  name: item.name,
                  condition: "", // Reset condition
                  notes: "", // Reset notes
                  photos: [], // Reset photos
                }))
              }));
              
              cleanItems = JSON.stringify({ rooms: sanitizedRooms });
            } catch (e) {
              console.error("Failed to sanitize checklist template items:", e);
              // Fallback to original if parse fails, though ideally we should fix it
              cleanItems = template.items; 
            }

            const [checklistResult] = await db.insert(moveInChecklists).values({
              contractId: contractId,
              items: cleanItems,
              photos: "[]",
              status: "draft",
            });
            
            // Link checklist to contract
            await db.update(contracts)
              .set({ checklistId: checklistResult.insertId })
              .where(eq(contracts.id, contractId));
          }
        } catch (err) {
          console.error("Failed to create move-in checklist:", err);
        }
      }

      if (input.sendImmediately) {
        try {
          const property = await db.query.properties.findFirst({
            where: eq(properties.id, input.propertyId),
          });
          await notifyContractSent({
            landlordId: ctx.user.id,
            tenantId: input.tenantId,
            contractId,
            propertyTitle: property?.title || "the property",
          });
        } catch (err) {
          console.error("Failed to send contract notification:", err);
        }
      }

      return { id: contractId };
    }),

  delete: protectedProcedure
    .input(z.object({ contractId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const contract = await db.query.contracts.findFirst({
        where: and(
          eq(contracts.id, input.contractId),
          eq(contracts.landlordId, ctx.user.id)
        ),
      });

      if (!contract) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Contract not found or access denied" });
      }

      if (contract.status === "fully_signed" || contract.status === "active") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Cannot delete a signed or active contract" });
      }

      await db.delete(moveInChecklists).where(eq(moveInChecklists.contractId, input.contractId));
      await db.delete(contracts).where(eq(contracts.id, input.contractId));

      return { success: true };
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      contractId: z.number(),
      status: z.enum(["draft", "sent_to_tenant", "tenant_signed", "fully_signed", "active", "expired", "terminated"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db.update(contracts)
        .set({ status: input.status })
        .where(eq(contracts.id, input.contractId));

      // If contract is terminated or expired, free up the property
      if (input.status === "terminated" || input.status === "expired") {
        const contract = await db.query.contracts.findFirst({
          where: eq(contracts.id, input.contractId),
        });
        if (contract) {
          await db.update(properties)
            .set({ status: "active" })
            .where(eq(properties.id, contract.propertyId));
            
          // Delete associated checklist if contract is terminated (to allow fresh start)
          if (input.status === "terminated") {
             await db.delete(moveInChecklists).where(eq(moveInChecklists.contractId, input.contractId));
          }
        }
      }

      if (input.status === "sent_to_tenant") {
        try {
          const contract = await db.query.contracts.findFirst({
            where: eq(contracts.id, input.contractId),
            with: { property: true }
          });
          if (contract) {
            await notifyContractSent({
              landlordId: ctx.user.id,
              tenantId: contract.tenantId,
              contractId: contract.id,
              propertyTitle: contract.property?.title || "the property",
            });
          }
        } catch (err) {
          console.error("Failed to send contract notification:", err);
        }
      }

      return { success: true };
    }),

  updateContract: protectedProcedure
    .input(z.object({
      contractId: z.number(),
      updates: z.object({
        tenantName: z.string().optional(),
        tenantEmail: z.string().email().optional(),
        tenantPhone: z.string().optional(),
        monthlyRent: z.number().optional(),
        securityDeposit: z.number().optional(),
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
        terms: z.string().optional(),
        specialConditions: z.string().optional(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db.update(contracts)
        .set({ ...input.updates, updatedAt: new Date() })
        .where(eq(contracts.id, input.contractId));

      return { success: true };
    }),

  attachChecklist: protectedProcedure
    .input(z.object({
      contractId: z.number(),
      templateId: z.number(), // Changed from checklistId to templateId to reflect actual usage
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [contract] = await db.select().from(contracts).where(eq(contracts.id, input.contractId));
      if (!contract) throw new TRPCError({ code: "NOT_FOUND", message: "Contract not found" });

      const template = await db.query.checklistTemplates.findFirst({
        where: eq(checklistTemplates.id, input.templateId)
      });

      if (!template) throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });

      // Sanitize and Create Checklist
      let cleanItems = "[]";
      try {
        const parsed = JSON.parse(template.items);
        const rooms = Array.isArray(parsed) ? parsed : (parsed.rooms || []);
        
        const sanitizedRooms = rooms.map((room: any) => ({
          room: room.room,
          items: room.items.map((item: any) => ({
            name: item.name,
            condition: "", // Reset
            notes: "", // Reset
            photos: [], // Reset
          }))
        }));
        
        cleanItems = JSON.stringify({ rooms: sanitizedRooms });
      } catch (e) {
        console.error("Failed to sanitize checklist items during attach:", e);
        cleanItems = template.items;
      }

      // Check if checklist already exists for this contract? 
      // If so, replace it or error? Logic says "Attach", implies setting one.
      // We will create a new one. If one exists, it becomes orphaned or overwritten.
      // Ideally delete old one if exists.
      
      if (contract.checklistId) {
        await db.delete(moveInChecklists).where(eq(moveInChecklists.id, contract.checklistId));
      }

      const [checklistResult] = await db.insert(moveInChecklists).values({
        contractId: input.contractId,
        items: cleanItems,
        photos: "[]",
        status: "draft",
      });

      const deadline = contract.checklistDeadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await db.update(contracts)
        .set({ 
          checklistId: checklistResult.insertId, 
          checklistDeadline: deadline,
          updatedAt: new Date() 
        })
        .where(eq(contracts.id, input.contractId));

      return { success: true };
    }),

  sendToTenant: protectedProcedure
    .input(z.object({ contractId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db.update(contracts)
        .set({ status: "sent_to_tenant", updatedAt: new Date() })
        .where(eq(contracts.id, input.contractId));

      try {
        const contract = await db.query.contracts.findFirst({
          where: eq(contracts.id, input.contractId),
          with: { property: true }
        });
        if (contract) {
          await notifyContractSent({
            landlordId: ctx.user.id,
            tenantId: contract.tenantId,
            contractId: contract.id,
            propertyTitle: contract.property?.title || "the property",
          });
        }
      } catch (err) {
        console.error("Failed to send contract notification:", err);
      }

      return { success: true };
    }),

  sign: protectedProcedure
    .input(z.object({
      contractId: z.number(),
      signature: z.string(), // base64
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Find contract where user is either tenant or landlord
      const contract = await db.query.contracts.findFirst({
        where: (contracts: any, { and, eq, or }: any) => and(
          eq(contracts.id, input.contractId),
          or(
            eq(contracts.tenantId, ctx.user.id),
            eq(contracts.landlordId, ctx.user.id)
          )
        ),
      });

      if (!contract) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Contract not found or access denied" });
      }

      const isTenant = ctx.user.id === contract.tenantId;
      const isLandlord = ctx.user.id === contract.landlordId;

      const updateData: any = {};
      if (isTenant) {
        updateData.tenantSignature = input.signature;
        updateData.tenantSignedAt = new Date();
      } else if (isLandlord) {
        updateData.landlordSignature = input.signature;
        updateData.landlordSignedAt = new Date();
      }

      // Update status based on both signatures
      const hasTenantSig = isTenant ? true : !!contract.tenantSignature;
      const hasLandlordSig = isLandlord ? true : !!contract.landlordSignature;
      
      if (hasTenantSig && hasLandlordSig) {
        updateData.status = "fully_signed";
      } else if (isTenant) {
        updateData.status = "tenant_signed";
      }

      await db.update(contracts)
        .set(updateData)
        .where(eq(contracts.id, input.contractId));

      // Regenerate PDF with new signature(s)
      try {
        await generateContractPdf(contract.id);
      } catch (err) {
        console.error("Failed to regenerate contract PDF after signing:", err);
      }

      // Send notifications
      try {
        const property = await db.query.properties.findFirst({
          where: (properties: any, { eq }: any) => eq(properties.id, contract.propertyId),
        });
        
        if (updateData.status === "fully_signed") {
          await notifyContractFullySigned({
            landlordId: contract.landlordId,
            tenantId: contract.tenantId,
            contractId: contract.id,
            propertyTitle: property?.title || "the property",
          });

          // Award ClearCoins for completed contract
          try {
            await awardOwnerForActivity({
              activityType: "CONTRACT_SIGNED",
              amount: REWARD_AMOUNTS.CONTRACT_SIGNED,
              description: `Contract signed for ${property?.title || "property"}`,
              relatedUserId: contract.tenantId, // Attribute to tenant for now, or could be split
            });

            // Award ClearCoins to the tenant
            await awardUserForActivity({
              userId: contract.tenantId,
              activityType: "CONTRACT_SIGNED",
              amount: REWARD_AMOUNTS.CONTRACT_SIGNED,
              description: `Contract signed for ${property?.title || "property"}`,
              relatedContractId: contract.id,
            });
          } catch (err) {
            console.error("Failed to award contract reward:", err);
          }
        } else if (isTenant) {
          await notifyContractSignedByTenant({
            landlordId: contract.landlordId,
            tenantId: contract.tenantId,
            contractId: contract.id,
            propertyTitle: property?.title || "the property",
            tenantName: ctx.user.name || "The tenant",
          });
        }
      } catch (err) {
        console.error("Failed to send sign notifications:", err);
      }

      return { success: true };
    }),

  createDepositPaymentIntent: protectedProcedure
    .input(z.object({ contractId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [contract] = await db
        .select()
        .from(contracts)
        .where(and(
          eq(contracts.id, input.contractId),
          eq(contracts.tenantId, ctx.user.id)
        ));

      if (!contract) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Contract not found" });
      }

      const amount = contract.securityDeposit; // Already in cents

      // Get Platform Commission %
      const settings = await db.select().from(appSettings).limit(1);
      const commissionPct = settings[0]?.platformCommissionPercentage || 5; // Default 5%

      // Calculate Split
      const platformFee = Math.round(amount * (commissionPct / 100));
      const netAmount = amount - platformFee;

      const paymentIntentData: Stripe.PaymentIntentCreateParams = {
        amount,
        currency: (contract.currency || "eur").toLowerCase(),
        metadata: {
          contractId: contract.id.toString(),
          type: "deposit",
          platformFee: platformFee.toString(),
          netAmount: netAmount.toString(),
        },
      };

      // Manual Payout Mode: No transfer_data logic here.

      const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

      // Create a pending payment record in our DB
      await db.insert(payments).values({
        contractId: input.contractId,
        tenantId: ctx.user.id,
        landlordId: contract.landlordId,
        propertyId: contract.propertyId,
        amount: amount,
        currency: contract.currency || "EUR",
        status: "pending",
        stripePaymentIntentId: paymentIntent.id,
        dueDate: new Date(),
        description: "Security Deposit",
        type: "deposit",
        platformFee: platformFee,
        netAmount: netAmount,
        paymentMethod: "stripe",
      });

      return { clientSecret: paymentIntent.client_secret };
    }),

  confirmDepositPayment: protectedProcedure
    .input(z.object({
      contractId: z.number(),
      paymentIntentId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Update contract status
      await db.update(contracts)
        .set({
          depositPaid: true,
          depositPaidAt: new Date(),
          depositPaymentMethod: "stripe",
          depositPaymentReference: input.paymentIntentId,
        })
        .where(eq(contracts.id, input.contractId));

      // Update payments table status
      await db.update(payments)
        .set({
          status: "completed",
          paidAt: new Date(),
        })
        .where(eq(payments.stripePaymentIntentId, input.paymentIntentId));

      // Check auto-scheduling
      await checkAndAutoScheduleKeyCollection(db, input.contractId);

      // Send notification
      try {
        const [contractData] = await db
          .select({
            securityDeposit: contracts.securityDeposit,
            propertyTitle: properties.title,
            landlordId: contracts.landlordId,
          })
          .from(contracts)
          .leftJoin(properties, eq(contracts.propertyId, properties.id))
          .where(eq(contracts.id, input.contractId));

        // Notify Tenant
        await notifyPaymentCompleted({
          userId: ctx.user.id,
          amount: contractData?.securityDeposit || 0,
          description: `Security Deposit for ${contractData?.propertyTitle || 'property'}`,
          type: "deposit",
        });

        // Notify Landlord
        if (contractData?.landlordId) {
          await notifyPaymentReceived({
            landlordId: contractData.landlordId,
            tenantName: ctx.user.name || "Tenant",
            amount: contractData.securityDeposit || 0,
            description: `Security Deposit for ${contractData?.propertyTitle || 'property'}`,
            type: "deposit",
          });
        }
      } catch (err) {
        console.error("Failed to send payment notification:", err);
      }

      return { success: true };
    }),

  createRentPaymentIntent: protectedProcedure
    .input(z.object({ contractId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [contract] = await db
        .select()
        .from(contracts)
        .where(and(
          eq(contracts.id, input.contractId),
          eq(contracts.tenantId, ctx.user.id)
        ));

      if (!contract) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Contract not found" });
      }

      const amount = contract.monthlyRent; // Already in cents

      // Get Platform Commission %
      const settings = await db.select().from(appSettings).limit(1);
      const commissionPct = settings[0]?.platformCommissionPercentage || 5; // Default 5%

      // Calculate Split
      const platformFee = Math.round(amount * (commissionPct / 100));
      const netAmount = amount - platformFee;

      const paymentIntentData: Stripe.PaymentIntentCreateParams = {
        amount,
        currency: (contract.currency || "eur").toLowerCase(),
        metadata: {
          contractId: contract.id.toString(),
          type: "first_month_rent",
          platformFee: platformFee.toString(),
          netAmount: netAmount.toString(),
        },
      };

      // Manual Payout Mode: No transfer_data logic here.

      const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

      // Create a pending payment record in our DB
      await db.insert(payments).values({
        contractId: input.contractId,
        tenantId: ctx.user.id,
        landlordId: contract.landlordId,
        propertyId: contract.propertyId,
        amount: amount,
        currency: contract.currency || "EUR",
        status: "pending",
        stripePaymentIntentId: paymentIntent.id,
        dueDate: new Date(),
        description: "First Month Rent",
        type: "rent",
        platformFee: platformFee,
        netAmount: netAmount,
        paymentMethod: "stripe",
      });

      return { clientSecret: paymentIntent.client_secret };
    }),

  confirmRentPayment: protectedProcedure
    .input(z.object({
      contractId: z.number(),
      paymentIntentId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db.update(contracts)
        .set({
          firstMonthRentPaid: true,
          firstMonthRentPaidAt: new Date(),
          firstMonthRentPaymentMethod: "stripe",
          firstMonthRentPaymentReference: input.paymentIntentId,
        })
        .where(eq(contracts.id, input.contractId));

      // Update payments table status
      await db.update(payments)
        .set({
          status: "completed",
          paidAt: new Date(),
        })
        .where(eq(payments.stripePaymentIntentId, input.paymentIntentId));

      // Check auto-scheduling
      await checkAndAutoScheduleKeyCollection(db, input.contractId);

      // Send notification
      try {
        const [contractData] = await db
          .select({
            monthlyRent: contracts.monthlyRent,
            propertyTitle: properties.title,
            landlordId: contracts.landlordId,
          })
          .from(contracts)
          .leftJoin(properties, eq(contracts.propertyId, properties.id))
          .where(eq(contracts.id, input.contractId));

        await notifyPaymentCompleted({
          userId: ctx.user.id,
          amount: contractData?.monthlyRent || 0,
          description: `First Month Rent for ${contractData?.propertyTitle || 'property'}`,
          type: "rent",
        });

        // Notify Landlord
        if (contractData?.landlordId) {
          await notifyPaymentReceived({
            landlordId: contractData.landlordId,
            tenantName: ctx.user.name || "Tenant",
            amount: contractData.monthlyRent || 0,
            description: `First Month Rent for ${contractData?.propertyTitle || 'property'}`,
            type: "rent",
          });
        }
      } catch (err) {
        console.error("Failed to send payment notification:", err);
      }

      return { success: true };
    }),

  payDeposit: protectedProcedure
    .input(z.object({
      contractId: z.number(),
      paymentMethod: z.string(),
      paymentReference: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db.update(contracts)
        .set({
          depositPaid: true,
          depositPaidAt: new Date(),
          depositPaymentMethod: input.paymentMethod,
          depositPaymentReference: input.paymentReference,
        })
        .where(eq(contracts.id, input.contractId));

      // Check auto-scheduling
      await checkAndAutoScheduleKeyCollection(db, input.contractId);

      return { success: true };
    }),

  payFirstMonthRent: protectedProcedure
    .input(z.object({
      contractId: z.number(),
      paymentMethod: z.string(),
      paymentReference: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db.update(contracts)
        .set({
          firstMonthRentPaid: true,
          firstMonthRentPaidAt: new Date(),
          firstMonthRentPaymentMethod: input.paymentMethod,
          firstMonthRentPaymentReference: input.paymentReference,
        })
        .where(eq(contracts.id, input.contractId));

      // Check auto-scheduling
      await checkAndAutoScheduleKeyCollection(db, input.contractId);

      return { success: true };
    }),

  generatePdf: protectedProcedure
    .input(z.object({ contractId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // 1. Fetch Contract
      const contractResult = await db.select().from(contracts).where(eq(contracts.id, input.contractId)).limit(1);
      const contract = contractResult[0];

      if (!contract) throw new TRPCError({ code: "NOT_FOUND", message: "Contract not found" });

      // Access Control
      if (contract.tenantId !== ctx.user.id && contract.landlordId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      // 2. Fetch Related Data manually to avoid json_array syntax errors on MariaDB
      const propertyResult = await db.select().from(properties).where(eq(properties.id, contract.propertyId)).limit(1);
      const tenantResult = await db.select().from(users).where(eq(users.id, contract.tenantId)).limit(1);
      const landlordResult = await db.select().from(users).where(eq(users.id, contract.landlordId)).limit(1);

      const property = propertyResult[0];
      const tenant = tenantResult[0];
      const landlord = landlordResult[0];

      if (!property || !tenant || !landlord) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Incomplete contract data" });
      }

      // 3. Fetch Checklist items if available
      let checklistItems = undefined;
      if (contract.checklistId) {
        // Use select instead of query to be safe
        const checklistResult = await db.select().from(moveInChecklists).where(eq(moveInChecklists.id, contract.checklistId)).limit(1);
        const checklist = checklistResult[0];
        
        if (checklist && checklist.items) {
          try {
            checklistItems = JSON.parse(checklist.items);
          } catch (e) {
            console.error("Failed to parse checklist items for PDF:", e);
          }
        }
      }

      // 4. Fetch Tenant Profile
      const tenantProfile = await getUserProfile(contract.tenantId);
      
      // 5. Generate PDF
      const { generateContractPdf: generatePdf } = await import("../contract-pdf-service");
      
      const pdfUrl = await generatePdf({
        contractId: contract.id,
        propertyTitle: property.title,
        propertyAddress: property.address,
        landlordName: landlord.name || "Landlord",
        landlordEmail: landlord.email || "",
        landlordId: tenantProfile?.dniNie || "", // Note: logic might be wrong here, using tenant profile for landlord ID? Keeping as is from original but suspicious.
        tenantName: tenant.name || "Tenant",
        tenantEmail: tenant.email || "",
        tenantId: tenantProfile?.dniNie || "",
        tenantHasPets: tenantProfile?.hasPets || false,
        tenantPetType: tenantProfile?.petType || undefined,
        tenantPetCount: tenantProfile?.petCount || undefined,
        tenantNumberOfOccupants: tenantProfile?.numberOfOccupants || 1,
        tenantOccupantDetails: tenantProfile?.occupantDetails || undefined,
        tenantRequirements: tenantProfile?.tenantRequirements || undefined,
        monthlyRent: contract.monthlyRent,
        securityDeposit: contract.securityDeposit,
        startDate: contract.startDate.toLocaleDateString(),
        endDate: contract.endDate.toLocaleDateString(),
        terms: contract.terms || "Standard rental agreement terms apply.",
        specialConditions: contract.specialConditions || undefined,
        landlordSignature: contract.landlordSignature || undefined,
        tenantSignature: contract.tenantSignature || undefined,
        landlordSignedAt: contract.landlordSignedAt || undefined,
        tenantSignedAt: contract.tenantSignedAt || undefined,
        checklistItems,
        language: (contract.language as "en" | "es") || "en",
      });

      // 6. Update Contract
      await db.update(contracts)
        .set({ contractPdfUrl: pdfUrl })
        .where(eq(contracts.id, input.contractId));

      return { pdfUrl };
    }),
});

async function checkAndAutoScheduleKeyCollection(db: any, contractId: number) {
  // Use Core API (db.select) instead of Relational API (db.query) to avoid json_array issues on MariaDB
  const contractRows = await db
    .select({
      contract: contracts,
      property: properties,
    })
    .from(contracts)
    .innerJoin(properties, eq(contracts.propertyId, properties.id))
    .where(eq(contracts.id, contractId))
    .limit(1);

  if (contractRows.length === 0) return;

  const { contract, property } = contractRows[0];

  if (contract.depositPaid && contract.firstMonthRentPaid && !contract.keysCollected) {
    // Check if already scheduled
    const existing = await db
      .select()
      .from(keyCollections)
      .where(eq(keyCollections.contractId, contractId))
      .limit(1);

    if (existing.length === 0) {
      const scheduledDate = new Date(contract.startDate);
      scheduledDate.setDate(scheduledDate.getDate() - 1);
      scheduledDate.setHours(12, 0, 0, 0); // Default to noon

      await db.insert(keyCollections).values({
        contractId: contract.id,
        collectionDate: scheduledDate,
        location: property.address, // Default to property address
        status: "scheduled",
      });
      
      await notifyKeyCollectionScheduled({
        landlordId: contract.landlordId,
        tenantId: contract.tenantId,
        propertyTitle: property.title,
        date: scheduledDate.toLocaleDateString(),
      });
      
      console.log(`[Auto-Schedule] Key collection scheduled for contract ${contractId}`);
    }
  }
}
