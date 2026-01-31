import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import { getDb } from "../db";
import { moveInChecklists, contracts, checklistTemplates } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createPresignedUploadUrl, getPublicImageUrl } from "../s3";

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
      // In a real app, you'd upload the base64 to S3
      // For now, let's return a mock URL or use our S3 helper if adapted
      const key = `checklists/${input.checklistId}/${Date.now()}-${input.fileName}`;
      const publicUrl = getPublicImageUrl(key);
      
      return { url: publicUrl };
    }),

  sign: protectedProcedure
    .input(z.object({
      checklistId: z.number(),
      signature: z.string(), // base64
      role: z.enum(["tenant", "landlord"]).default("tenant"),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const updateData = input.role === "landlord" 
        ? { landlordSignature: input.signature, landlordSignedAt: new Date(), status: "completed" }
        : { tenantSignature: input.signature, tenantSignedAt: new Date(), status: "tenant_signed" };

      await db.update(moveInChecklists)
        .set(updateData)
        .where(eq(moveInChecklists.id, input.checklistId));

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
});
