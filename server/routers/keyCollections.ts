import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import { getDb } from "../db";
import { keyCollections, contracts, properties, users } from "../../drizzle/schema";
import { eq, and, or, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { notifyKeyCollectionScheduled, notifyKeyCollectionConfirmed, notifyKeyCollectionCompleted } from "../notifications-service";

export const keyCollectionsRouter = router({
  getTenantCollections: protectedProcedure
    .query(async ({ ctx }) => {
      console.log(`[keyCollections.getTenantCollections] Fetching for user ID: ${ctx.user.id}`);
      try {
        const db = await getDb() as any;
        if (!db) {
          console.error("[keyCollections.getTenantCollections] DB not available");
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        }

        const results = await db
          .select({
            collection: keyCollections,
            contract: contracts,
            property: properties,
            landlord: users,
          })
          .from(keyCollections)
          .innerJoin(contracts, eq(keyCollections.contractId, contracts.id))
          .innerJoin(properties, eq(contracts.propertyId, properties.id))
          .innerJoin(users, eq(contracts.landlordId, users.id))
          .where(eq(contracts.tenantId, ctx.user.id))
          .orderBy(desc(keyCollections.createdAt));

        console.log(`[keyCollections.getTenantCollections] Found ${results.length} collections`);

        return results.map((row: any) => ({
          ...row.collection,
          property: row.property,
          landlord: row.landlord,
        }));
      } catch (error: any) {
        console.error("[keyCollections.getTenantCollections] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "An unexpected error occurred",
        });
      }
    }),

  getLandlordCollections: protectedProcedure
    .query(async ({ ctx }) => {
      console.log(`[keyCollections.getLandlordCollections] Fetching for landlord ID: ${ctx.user.id}`);
      try {
        const db = await getDb() as any;
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        const results = await db
          .select({
            collection: keyCollections,
            contract: contracts,
            property: properties,
            tenant: users,
          })
          .from(keyCollections)
          .innerJoin(contracts, eq(keyCollections.contractId, contracts.id))
          .innerJoin(properties, eq(contracts.propertyId, properties.id))
          .innerJoin(users, eq(contracts.tenantId, users.id))
          .where(eq(contracts.landlordId, ctx.user.id))
          .orderBy(desc(keyCollections.createdAt));

        return results.map((row: any) => ({
          ...row.collection,
          property: row.property,
          tenant: row.tenant,
        }));
      } catch (error: any) {
        console.error("[keyCollections.getLandlordCollections] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "An unexpected error occurred",
        });
      }
    }),

  getByContract: protectedProcedure
    .input(z.number())
    .query(async ({ ctx, input: contractId }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const collection = await db.query.keyCollections.findFirst({
        where: eq(keyCollections.contractId, contractId),
      });

      return collection;
    }),

  create: protectedProcedure
    .input(z.object({
      contractId: z.number(),
      collectionDate: z.coerce.date(),
      location: z.string(),
      landlordNotes: z.string().optional(),
      tenantNotes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [result] = await db.insert(keyCollections).values({
        contractId: input.contractId,
        collectionDate: input.collectionDate,
        location: input.location,
        landlordNotes: input.landlordNotes,
        tenantNotes: input.tenantNotes,
        status: "scheduled",
      });

      // Send Notification
      try {
        const contract = await db.query.contracts.findFirst({
          where: eq(contracts.id, input.contractId),
          with: { property: true }
        });
        if (contract) {
          await notifyKeyCollectionScheduled({
            landlordId: contract.landlordId,
            tenantId: contract.tenantId,
            propertyTitle: contract.property?.title || "Property",
            date: input.collectionDate.toLocaleDateString(),
          });
        }
      } catch (err) {
        console.error("Failed to send key collection scheduled notification:", err);
      }

      return { id: result.insertId };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      collectionDate: z.coerce.date().optional(),
      location: z.string().optional(),
      landlordNotes: z.string().optional(),
      tenantNotes: z.string().optional(),
      status: z.enum(["scheduled", "confirmed", "completed", "cancelled"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const { id, ...data } = input;
      await db.update(keyCollections).set(data).where(eq(keyCollections.id, id));

      // Send notification if scheduling details changed
      if (input.collectionDate || input.location || input.status === "scheduled") {
        try {
          const collectionResult = await db
            .select({
              collection: keyCollections,
              contract: contracts,
              property: properties,
            })
            .from(keyCollections)
            .innerJoin(contracts, eq(keyCollections.contractId, contracts.id))
            .leftJoin(properties, eq(contracts.propertyId, properties.id))
            .where(eq(keyCollections.id, id))
            .limit(1);
          
          if (collectionResult.length > 0) {
            const { collection, contract, property } = collectionResult[0];
            
            if (contract && contract.landlordId) {
              await notifyKeyCollectionScheduled({
                landlordId: contract.landlordId,
                tenantId: contract.tenantId,
                propertyTitle: property?.title || "Property",
                date: collection.collectionDate.toLocaleDateString(),
              });
            }
          }
        } catch (err) {
          console.error("Failed to send key collection update notification:", err);
        }
      }

      return { success: true };
    }),

  confirm: protectedProcedure
    .input(z.object({
      id: z.number(),
      role: z.enum(["landlord", "tenant"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const updateData = input.role === "landlord" 
        ? { landlordConfirmed: true } 
        : { tenantConfirmed: true };

      await db.update(keyCollections).set(updateData).where(eq(keyCollections.id, input.id));

      const updated = await db.query.keyCollections.findFirst({
        where: eq(keyCollections.id, input.id),
      });

      if (updated?.landlordConfirmed && updated?.tenantConfirmed) {
        await db.update(keyCollections)
          .set({ status: "confirmed" })
          .where(eq(keyCollections.id, input.id));

        // Notify both parties
        try {
          const contract = await db.query.contracts.findFirst({
            where: eq(contracts.id, updated.contractId),
            with: { property: true }
          });
          if (contract) {
            await notifyKeyCollectionConfirmed({
              landlordId: contract.landlordId,
              tenantId: contract.tenantId,
              propertyTitle: contract.property?.title || "Property",
            });
          }
        } catch (err) {
          console.error("Failed to send key collection confirmed notification:", err);
        }
      }

      return { success: true };
    }),

  complete: protectedProcedure
    .input(z.number())
    .mutation(async ({ ctx, input: id }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db.update(keyCollections)
        .set({ status: "completed", completedAt: new Date() })
        .where(eq(keyCollections.id, id));

      const collection = await db.query.keyCollections.findFirst({
        where: eq(keyCollections.id, id),
      });

      if (collection) {
        await db.update(contracts)
          .set({ keysCollected: true, keysCollectedAt: new Date(), status: "active" })
          .where(eq(contracts.id, collection.contractId));

        // Notify both parties
        try {
          const contract = await db.query.contracts.findFirst({
            where: eq(contracts.id, collection.contractId),
            with: { property: true }
          });
          if (contract) {
            await notifyKeyCollectionCompleted({
              landlordId: contract.landlordId,
              tenantId: contract.tenantId,
              propertyTitle: contract.property?.title || "Property",
            });
          }
        } catch (err) {
          console.error("Failed to send key collection completed notification:", err);
        }
      }

      return { success: true };
    }),
});