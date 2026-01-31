import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import { getDb } from "../db";
import { messageTemplates } from "../../drizzle/schema";
import { eq, or, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const messageTemplatesRouter = router({
  getUserTemplates: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb() as any;
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    return db.query.messageTemplates.findMany({
      where: eq(messageTemplates.userId, ctx.user.id),
      orderBy: [desc(messageTemplates.createdAt)],
    });
  }),

  getDefaultTemplates: protectedProcedure.query(async () => {
    const db = await getDb() as any;
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    return db.query.messageTemplates.findMany({
      where: eq(messageTemplates.isDefault, true),
      orderBy: [desc(messageTemplates.createdAt)],
    });
  }),

  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      category: z.string().min(1),
      content: z.string().min(1),
      isDefault: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [result] = await db.insert(messageTemplates).values({
        userId: ctx.user.id,
        ...input,
      });

      return { id: result.insertId };
    }),

  update: protectedProcedure
    .input(z.object({
      templateId: z.number(),
      title: z.string().min(1),
      category: z.string().min(1),
      content: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const { templateId, ...data } = input;

      await db.update(messageTemplates)
        .set(data)
        .where(and(eq(messageTemplates.id, templateId), eq(messageTemplates.userId, ctx.user.id)));

      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ templateId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db.delete(messageTemplates)
        .where(and(eq(messageTemplates.id, input.templateId), eq(messageTemplates.userId, ctx.user.id)));

      return { success: true };
    }),
});
