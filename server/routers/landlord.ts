import { router, protectedProcedure } from "../trpc";
import { getDb, getLandlordApplications } from "../db";
import { eq, and, sql, desc } from "drizzle-orm";
import { properties, applications, contracts } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";

export const landlordRouter = router({
  getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb() as any;
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const landlordId = ctx.user.id;

    // 1. Active Listings Count
    const activeListings = await db
      .select({ count: sql<number>`count(*)` })
      .from(properties)
      .where(and(eq(properties.userId, landlordId), eq(properties.status, "active")));

    // 2. Total Properties Count
    const totalProperties = await db
      .select({ count: sql<number>`count(*)` })
      .from(properties)
      .where(eq(properties.userId, landlordId));

    // 3. Pending Applications Count
    const pendingApps = await db
      .select({ count: sql<number>`count(*)` })
      .from(applications)
      .where(and(eq(applications.landlordId, landlordId), eq(applications.status, "pending")));

    // 4. Active Contracts Count
    const activeContracts = await db
      .select({ count: sql<number>`count(*)` })
      .from(contracts)
      .where(and(eq(contracts.landlordId, landlordId), eq(contracts.status, "active")));

    return {
      activeListings: Number(activeListings[0]?.count || 0),
      totalProperties: Number(totalProperties[0]?.count || 0),
      pendingApplications: Number(pendingApps[0]?.count || 0),
      activeContracts: Number(activeContracts[0]?.count || 0),
    };
  }),

  getRecentApplications: protectedProcedure.query(async ({ ctx }) => {
    const apps = await getLandlordApplications(ctx.user.id);
    return apps.slice(0, 5);
  }),
});
