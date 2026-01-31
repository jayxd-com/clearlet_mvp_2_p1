import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import { getDb } from "../db";
import { documentVault } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const documentVaultRouter = router({
  getMyDocuments: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const userDocs = await db.query.documentVault.findMany({
        where: eq(documentVault.userId, ctx.user.id),
        orderBy: (documentVault: any, { desc }: any) => [desc(documentVault.createdAt)],
      });

      return userDocs;
    }),

  create: protectedProcedure
    .input(z.object({
      propertyId: z.number().optional(),
      contractId: z.number().optional(),
      fileName: z.string(),
      fileUrl: z.string(),
      fileKey: z.string(),
      fileSize: z.number(),
      mimeType: z.string(),
      category: z.enum(["insurance", "inspection", "lease", "receipt", "certificate", "other"]),
      description: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db.insert(documentVault).values({
        userId: ctx.user.id,
        ...input
      });

      return { success: true };
    }),
});
