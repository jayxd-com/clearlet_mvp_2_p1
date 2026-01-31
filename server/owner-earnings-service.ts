import { getDb } from "./db";
import { clearCoinWallets, clearCoinTransactions, users } from "../drizzle/schema";
import { eq, sql } from "drizzle-orm";
import { REWARD_AMOUNTS } from "./config/rewards";

/**
 * Owner Earnings Service
 * Tracks site-wide activity and awards ClearCoins to the platform owner (Admin)
 */

/**
 * Get or initialize the owner's wallet
 */
async function getOwnerWallet(db: any) {
  // Find the first admin user
  const adminUser = await db.query.users.findFirst({
    where: eq(users.role, "admin"),
  });

  if (!adminUser) {
    console.warn("[OwnerEarnings] No admin user found to award coins");
    return null;
  }

  // Check if wallet exists
  let wallet = await db.query.clearCoinWallets.findFirst({
    where: eq(clearCoinWallets.userId, adminUser.id),
  });

  if (!wallet) {
    // Create wallet for owner
    await db.insert(clearCoinWallets).values({
      userId: adminUser.id,
      balance: 0,
      totalEarned: 0,
      totalSpent: 0,
    });
    
    wallet = await db.query.clearCoinWallets.findFirst({
      where: eq(clearCoinWallets.userId, adminUser.id),
    });
  }

  return { wallet, adminId: adminUser.id };
}

/**
 * Award ClearCoins to owner for site activity
 */
export async function awardOwnerForActivity(params: {
  activityType: keyof typeof REWARD_AMOUNTS;
  amount: number;
  description: string;
  relatedUserId?: number;
}): Promise<void> {
  const { activityType, amount, description, relatedUserId } = params;
  const db = await getDb() as any;
  if (!db) {
    console.warn("[OwnerEarnings] Database not available");
    return;
  }

  try {
    const result = await getOwnerWallet(db);
    if (!result) return;

    const { wallet, adminId } = result;

    // Update wallet balance
    const currentBalance = Number(wallet.balance || 0);
    const newBalance = currentBalance + amount;

    await db
      .update(clearCoinWallets)
      .set({
        balance: Math.floor(newBalance),
        totalEarned: sql`${clearCoinWallets.totalEarned} + ${amount}`,
        updatedAt: new Date(),
      })
      .where(eq(clearCoinWallets.userId, adminId));

    // Create transaction record
    await db.insert(clearCoinTransactions).values({
      userId: adminId,
      transactionType: "earn",
      amount: Math.floor(amount),
      reason: activityType,
      description,
      balanceAfter: Math.floor(newBalance),
      createdAt: new Date(),
    });

    console.log(`[OwnerEarnings] Awarded ${amount} CC to admin (${adminId}) for ${activityType}`);
  } catch (error) {
    console.error("[OwnerEarnings] Failed to award coins:", error);
  }
}

/**
 * Award ClearCoins to a specific user for activity
 */
export async function awardUserForActivity(params: {
  userId: number;
  activityType: string;
  amount: number;
  description: string;
  relatedContractId?: number;
  relatedPaymentId?: number;
  relatedApplicationId?: number;
}): Promise<void> {
  const { userId, activityType, amount, description, relatedContractId, relatedPaymentId, relatedApplicationId } = params;
  const db = await getDb() as any;
  if (!db) return;

  try {
    // Get or create wallet
    let wallet = await db.query.clearCoinWallets.findFirst({
      where: eq(clearCoinWallets.userId, userId),
    });

    if (!wallet) {
      await db.insert(clearCoinWallets).values({
        userId,
        balance: 0,
        totalEarned: 0,
        totalSpent: 0,
      });
      wallet = await db.query.clearCoinWallets.findFirst({
        where: eq(clearCoinWallets.userId, userId),
      });
    }

    const currentBalance = Number(wallet.balance || 0);
    const newBalance = currentBalance + amount;

    // Update wallet
    await db.update(clearCoinWallets)
      .set({
        balance: Math.floor(newBalance),
        totalEarned: sql`${clearCoinWallets.totalEarned} + ${amount}`,
        updatedAt: new Date(),
      })
      .where(eq(clearCoinWallets.userId, userId));

    // Log transaction
    await db.insert(clearCoinTransactions).values({
      userId,
      transactionType: "earn",
      amount: Math.floor(amount),
      reason: activityType,
      description,
      relatedContractId,
      relatedPaymentId,
      relatedApplicationId,
      balanceAfter: Math.floor(newBalance),
      createdAt: new Date(),
    });
  } catch (error) {
    console.error(`[ClearCoin] Failed to award coins to user ${userId}:`, error);
  }
}
