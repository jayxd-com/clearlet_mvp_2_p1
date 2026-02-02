import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import { getDb } from "../db";
import { moveInChecklists, contracts, checklistTemplates, users, properties } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { TRPCError } from "@trpc/server";
import { createPresignedUploadUrl, getPublicImageUrl, putObject } from "../s3";
import { notifyChecklistSubmitted, notifyChecklistCompleted } from "../notifications-service";
import { generateChecklistPdf } from "../checklist-pdf-service";

export const checklistRouter = router({
  getTemplates: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      return db.query.checklistTemplates.findMany({
        where: eq(checklistTemplates.landlordId, ctx.user.id),
        orderBy: [desc(checklistTemplates.createdAt)],
      });
    }),

  createTemplate: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      propertyType: z.enum(["apartment", "house", "studio", "commercial", "other"]),
      items: z.string(), // JSON
      isDefault: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      if (input.isDefault) {
        await db.update(checklistTemplates)
          .set({ isDefault: false })
          .where(eq(checklistTemplates.landlordId, ctx.user.id));
      }

      const [result] = await db.insert(checklistTemplates).values({
        landlordId: ctx.user.id,
        ...input,
      });

      return { id: result.insertId };
    }),

  updateTemplate: protectedProcedure
    .input(z.object({
      templateId: z.number(),
      name: z.string().min(1),
      propertyType: z.enum(["apartment", "house", "studio", "commercial", "other"]),
      items: z.string(), // JSON
      isDefault: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      if (input.isDefault) {
        await db.update(checklistTemplates)
          .set({ isDefault: false })
          .where(eq(checklistTemplates.landlordId, ctx.user.id));
      }

      await db.update(checklistTemplates)
        .set({
          name: input.name,
          propertyType: input.propertyType,
          items: input.items,
          isDefault: input.isDefault,
          updatedAt: new Date(),
        })
        .where(and(eq(checklistTemplates.id, input.templateId), eq(checklistTemplates.landlordId, ctx.user.id)));

      return { success: true };
    }),

  deleteTemplate: protectedProcedure
    .input(z.object({ templateId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db.delete(checklistTemplates)
        .where(and(eq(checklistTemplates.id, input.templateId), eq(checklistTemplates.landlordId, ctx.user.id)));

      return { success: true };
    }),

  getByContractId: protectedProcedure
    .input(z.object({ contractId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const checklist = await db.query.moveInChecklists.findFirst({
        where: eq(moveInChecklists.contractId, input.contractId),
      });

      return checklist || null;
    }),

  updateItems: protectedProcedure
    .input(z.object({
      checklistId: z.number(),
      items: z.string(), // JSON string
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db.update(moveInChecklists)
        .set({ items: input.items, updatedAt: new Date() })
        .where(eq(moveInChecklists.id, input.checklistId));

      return { success: true };
    }),

  uploadPhoto: protectedProcedure
    .input(z.object({
      checklistId: z.number(),
      fileName: z.string(),
      photoData: z.string(), // base64
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const matches = input.photoData.match(/^data:(.+);base64,(.+)$/);
      if (!matches) throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid photo data" });

      const contentType = matches[1];
      const buffer = Buffer.from(matches[2], "base64");

      const key = `checklists/${input.checklistId}/${Date.now()}-${input.fileName}`;
      await putObject(key, buffer, contentType, "public-read");
      
      const publicUrl = getPublicImageUrl(key);
      
      return { url: publicUrl };
    }),

  submit: protectedProcedure
    .input(z.object({
      checklistId: z.number(),
      items: z.string(), // JSON
      signature: z.string(), // base64
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const checklistResult = await db
        .select({
          checklist: moveInChecklists,
          contract: contracts,
        })
        .from(moveInChecklists)
        .innerJoin(contracts, eq(moveInChecklists.contractId, contracts.id))
        .where(eq(moveInChecklists.id, input.checklistId))
        .limit(1);

      const row = checklistResult[0];
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Checklist not found" });
      if (row.contract.tenantId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });

      // Update checklist
      await db.update(moveInChecklists)
        .set({
          items: input.items,
          tenantSignature: input.signature,
          tenantSignedAt: new Date(),
          status: "tenant_signed", // Treated as "Pending Landlord Review" in UI
          updatedAt: new Date(),
        })
        .where(eq(moveInChecklists.id, input.checklistId));

      // Notify Landlord
      try {
        const property = await db.query.properties.findFirst({
          where: eq(properties.id, row.contract.propertyId),
        });
        
        await notifyChecklistSubmitted({
          landlordId: row.contract.landlordId,
          tenantName: ctx.user.name || "Tenant",
          contractId: row.contract.id,
          propertyTitle: property?.title || "Property",
        });
      } catch (e) {
        console.error("Failed to send checklist notification:", e);
      }

      return { success: true };
    }),

  sign: protectedProcedure
    .input(z.object({
      checklistId: z.number(),
      signature: z.string(), // base64
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const checklistResult = await db
        .select({
          checklist: moveInChecklists,
          contract: contracts,
        })
        .from(moveInChecklists)
        .innerJoin(contracts, eq(moveInChecklists.contractId, contracts.id))
        .where(eq(moveInChecklists.id, input.checklistId))
        .limit(1);

      const row = checklistResult[0];
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Checklist not found" });
      if (row.contract.landlordId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });

      // Update checklist
      await db.update(moveInChecklists)
        .set({
          landlordSignature: input.signature,
          landlordSignedAt: new Date(),
          landlordNotes: input.notes,
          status: "completed",
          updatedAt: new Date(),
        })
        .where(eq(moveInChecklists.id, input.checklistId));

      // Update Contract
      await db.update(contracts)
        .set({ checklistCompletedAt: new Date() })
        .where(eq(contracts.id, row.contract.id));

      // Notify Both
      try {
        const property = await db.query.properties.findFirst({
          where: eq(properties.id, row.contract.propertyId),
        });

        await notifyChecklistCompleted({
          landlordId: row.contract.landlordId,
          tenantId: row.contract.tenantId,
          contractId: row.contract.id,
          propertyTitle: property?.title || "Property",
        });
      } catch (e) {
        console.error("Failed to send completion notification:", e);
      }

      return { success: true };
    }),

  addNotes: protectedProcedure
    .input(z.object({
      checklistId: z.number(),
      notes: z.string(),
      role: z.enum(["tenant", "landlord"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const updateData = input.role === "tenant" 
        ? { tenantNotes: input.notes } 
        : { landlordNotes: input.notes };

      await db.update(moveInChecklists)
        .set(updateData)
        .where(eq(moveInChecklists.id, input.checklistId));

      return { success: true };
    }),

  complete: protectedProcedure
    .input(z.object({ checklistId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db.update(moveInChecklists)
        .set({ status: "completed", updatedAt: new Date() })
        .where(eq(moveInChecklists.id, input.checklistId));

      return { success: true };
    }),

  generatePdf: protectedProcedure
    .input(z.object({ checklistId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Fetch Checklist & Related Data
      const checklistResult = await db
        .select({
          checklist: moveInChecklists,
          contract: contracts,
          property: properties,
          landlord: users,
          tenant: users,
        })
        .from(moveInChecklists)
        .innerJoin(contracts, eq(moveInChecklists.contractId, contracts.id))
        .innerJoin(properties, eq(contracts.propertyId, properties.id))
        .innerJoin(users, eq(contracts.landlordId, users.id))
        .innerJoin(alias(users, "tenant"), eq(contracts.tenantId, alias(users, "tenant").id))
        .where(eq(moveInChecklists.id, input.checklistId))
        .limit(1);

      const row = checklistResult[0];
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Checklist not found" });

      const { checklist, contract, property, landlord, tenant } = row;

      // Access Control
      if (contract.tenantId !== ctx.user.id && contract.landlordId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      let parsedItems = { rooms: [] };
      try {
        const raw = JSON.parse(checklist.items);
        if (Array.isArray(raw)) parsedItems = { rooms: raw };
        else if (raw && raw.rooms) parsedItems = raw;
      } catch (e) {
        console.error("Failed to parse checklist items for PDF:", e);
      }

      // Generate PDF
      const pdfUrl = await generateChecklistPdf({
        checklistId: checklist.id,
        contractId: contract.id,
        propertyTitle: property.title,
        propertyAddress: property.address,
        landlordName: landlord.name || "Landlord",
        tenantName: tenant.name || "Tenant",
        checklistItems: parsedItems,
        landlordSignature: checklist.landlordSignature || undefined,
        tenantSignature: checklist.tenantSignature || undefined,
        landlordSignedAt: checklist.landlordSignedAt || undefined,
        tenantSignedAt: checklist.tenantSignedAt || undefined,
        landlordNotes: checklist.landlordNotes || undefined,
        tenantNotes: checklist.tenantNotes || undefined,
      });

      return { pdfUrl };
    }),
});
