import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import { createConnectAccount, createAccountLink, createLoginLink, getAccount } from "../stripe-service";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const stripeRouter = router({
  // Create or retrieve Stripe Connect account for the landlord
  getConnectAccount: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.userType !== 'landlord') {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Only landlords can create Connect accounts' });
    }

    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

    // Check if user already has an account
    const user = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
    if (!user[0]) throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });

    let accountId = user[0].stripeAccountId;

    if (!accountId) {
      // Create new account
      const account = await createConnectAccount(user[0].email);
      accountId = account.id;

      // Save to DB
      await db.update(users).set({ stripeAccountId: accountId }).where(eq(users.id, ctx.user.id));
    }

    return { accountId };
  }),

  // Generate onboarding link
  getOnboardingLink: protectedProcedure
    .input(z.object({ returnUrl: z.string(), refreshUrl: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      const user = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
      if (!user[0] || !user[0].stripeAccountId) {
         throw new TRPCError({ code: 'BAD_REQUEST', message: 'No Stripe account found for this user' });
      }

      const accountLink = await createAccountLink(user[0].stripeAccountId, input.refreshUrl, input.returnUrl);
      return { url: accountLink.url };
    }),

  // Generate dashboard login link
  getLoginLink: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

    const user = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
    if (!user[0] || !user[0].stripeAccountId) {
       throw new TRPCError({ code: 'BAD_REQUEST', message: 'No Stripe account found' });
    }

    // Check status first
    const account = await getAccount(user[0].stripeAccountId);
    if (!account.charges_enabled) {
         throw new TRPCError({ code: 'BAD_REQUEST', message: 'Account onboarding incomplete' });
    }

    const loginLink = await createLoginLink(user[0].stripeAccountId);
    return { url: loginLink.url };
  }),

  // Check and update onboarding status
  checkStatus: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

    const user = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
    if (!user[0] || !user[0].stripeAccountId) {
       return { isComplete: false };
    }

    const account = await getAccount(user[0].stripeAccountId);
    const isComplete = account.charges_enabled; // Simplest check for Express accounts

    if (isComplete !== user[0].stripeOnboardingComplete) {
      await db.update(users).set({ stripeOnboardingComplete: isComplete }).where(eq(users.id, ctx.user.id));
    }

    return { isComplete };
  })
});
