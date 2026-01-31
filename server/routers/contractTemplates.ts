import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import { getDb } from "../db";
import { contractTemplates } from "../../drizzle/schema";
import { eq, or, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const contractTemplatesRouter = router({
  getUserTemplates: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb() as any;
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    return db.query.contractTemplates.findMany({
      where: eq(contractTemplates.userId, ctx.user.id),
      orderBy: [desc(contractTemplates.createdAt)],
    });
  }),

  getPublicTemplates: protectedProcedure.query(async () => {
    const db = await getDb() as any;
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    return db.query.contractTemplates.findMany({
      where: eq(contractTemplates.isPublic, true),
      orderBy: [desc(contractTemplates.createdAt)],
    });
  }),

  getById: protectedProcedure
    .input(z.object({ templateId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const template = await db.query.contractTemplates.findFirst({
        where: and(
          eq(contractTemplates.id, input.templateId),
          or(
            eq(contractTemplates.userId, ctx.user.id),
            eq(contractTemplates.isPublic, true)
          )
        ),
      });

      if (!template) throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });

      return template;
    }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      terms: z.string().min(1),
      specialConditions: z.string().optional(),
      isDefault: z.boolean().default(false),
      isPublic: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      if (input.isDefault) {
        await db.update(contractTemplates)
          .set({ isDefault: false })
          .where(eq(contractTemplates.userId, ctx.user.id));
      }

      const [result] = await db.insert(contractTemplates).values({
        userId: ctx.user.id,
        ...input,
      });

      return { id: result.insertId };
    }),

  update: protectedProcedure
    .input(z.object({
      templateId: z.number(),
      name: z.string().min(1),
      description: z.string().optional(),
      terms: z.string().min(1),
      specialConditions: z.string().optional(),
      isDefault: z.boolean(),
      isPublic: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const { templateId, ...data } = input;

      if (data.isDefault) {
        await db.update(contractTemplates)
          .set({ isDefault: false })
          .where(eq(contractTemplates.userId, ctx.user.id));
      }

      await db.update(contractTemplates)
        .set(data)
        .where(and(eq(contractTemplates.id, templateId), eq(contractTemplates.userId, ctx.user.id)));

      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ templateId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db.delete(contractTemplates)
        .where(and(eq(contractTemplates.id, input.templateId), eq(contractTemplates.userId, ctx.user.id)));

      return { success: true };
    }),

  setDefault: protectedProcedure
    .input(z.object({ templateId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db.update(contractTemplates)
        .set({ isDefault: false })
        .where(eq(contractTemplates.userId, ctx.user.id));

      await db.update(contractTemplates)
        .set({ isDefault: true })
        .where(and(eq(contractTemplates.id, input.templateId), eq(contractTemplates.userId, ctx.user.id)));

      return { success: true };
    }),
});
