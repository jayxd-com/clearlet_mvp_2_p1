import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import { getDb } from "../db";
import { clearCoinWallets, clearCoinTransactions } from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const marketplaceRouter = router({
  getWalletBalance: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb() as any;
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    let wallet = await db.query.clearCoinWallets.findFirst({
      where: eq(clearCoinWallets.userId, ctx.user.id),
    });

    if (!wallet) {
      // Initialize wallet if it doesn't exist
      await db.insert(clearCoinWallets).values({
        userId: ctx.user.id,
        balance: 0,
        totalEarned: 0,
        totalSpent: 0,
      });

      wallet = await db.query.clearCoinWallets.findFirst({
        where: eq(clearCoinWallets.userId, ctx.user.id),
      });
    }

    return wallet;
  }),

  getTransactionHistory: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb() as any;
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const transactions = await db.query.clearCoinTransactions.findMany({
      where: eq(clearCoinTransactions.userId, ctx.user.id),
      orderBy: [desc(clearCoinTransactions.createdAt)],
      limit: 50,
    });

    return transactions;
  }),

  purchaseItem: protectedProcedure
    .input(z.object({
      itemId: z.string(),
      itemName: z.string(),
      price: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const wallet = await db.query.clearCoinWallets.findFirst({
        where: eq(clearCoinWallets.userId, ctx.user.id),
      });

      if (!wallet || wallet.balance < input.price) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Insufficient ClearCoin balance" });
      }

      const newBalance = wallet.balance - input.price;

      // Deduct from wallet
      await db.update(clearCoinWallets)
        .set({
          balance: newBalance,
          totalSpent: wallet.totalSpent + input.price,
          updatedAt: new Date(),
        })
        .where(eq(clearCoinWallets.userId, ctx.user.id));

      // Log transaction
      await db.insert(clearCoinTransactions).values({
        userId: ctx.user.id,
        transactionType: "spend",
        amount: input.price,
        reason: "marketplace_purchase",
        description: `Purchased ${input.itemName}`,
        balanceAfter: newBalance,
        createdAt: new Date(),
      });

      return { success: true, newBalance };
    }),
});
