import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { getUserProfile, upsertUserProfile, getTenantScoreFactors } from "../db";
import { calculateTenantScore, getTenantScoreTier } from "../tenantScore";
import { TRPCError } from "@trpc/server";

export const profileRouter = router({
  getProfile: protectedProcedure
    .query(async ({ ctx }) => {
      const profile = await getUserProfile(ctx.user.id, true);
      return {
        ...profile,
        name: ctx.user.name,
        email: ctx.user.email,
        phone: ctx.user.phone,
        verificationStatus: ctx.user.verificationStatus,
      };
    }),
  
  getTenantScore: protectedProcedure
    .query(async ({ ctx }) => {
      const factors = await getTenantScoreFactors(ctx.user.id);
      if (!factors) {
        return {
          totalScore: 0,
          tier: "poor",
          label: "Building Trust",
          breakdown: {
            rentalHistory: { score: 0, weight: 0.25, maxScore: 25 },
            employment: { score: 0, weight: 0.2, maxScore: 20 },
            salary: { score: 0, weight: 0.2, maxScore: 20 },
            paymentHistory: { score: 0, weight: 0.2, maxScore: 20 },
            references: { score: 0, weight: 0.15, maxScore: 15 },
          },
          recommendation: "Complete your profile to get a score.",
        };
      }

      const scoreResult = calculateTenantScore(factors);
      const tier = getTenantScoreTier(scoreResult.totalScore);

      return {
        totalScore: scoreResult.totalScore,
        tier: tier.tier,
        label: tier.label,
        breakdown: scoreResult.breakdown,
        recommendation: tier.recommendation,
        factors: {
          rentalHistoryMonths: factors.rentalHistoryMonths,
          employmentStatus: factors.employmentStatus,
          annualSalary: factors.annualSalary,
          isVerified: factors.isVerified,
        },
      };
    }),

  getUserTenantScore: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const factors = await getTenantScoreFactors(input.userId);
      if (!factors) {
        return {
          totalScore: 0,
          tier: "poor",
          label: "Building Trust",
          breakdown: {
            rentalHistory: { score: 0, weight: 0.25, maxScore: 25 },
            employment: { score: 0, weight: 0.2, maxScore: 20 },
            salary: { score: 0, weight: 0.2, maxScore: 20 },
            paymentHistory: { score: 0, weight: 0.2, maxScore: 20 },
            references: { score: 0, weight: 0.15, maxScore: 15 },
          },
          recommendation: "No profile data available.",
        };
      }

      const scoreResult = calculateTenantScore(factors);
      const tier = getTenantScoreTier(scoreResult.totalScore);

      return {
        totalScore: scoreResult.totalScore,
        tier: tier.tier,
        label: tier.label,
        breakdown: scoreResult.breakdown,
        recommendation: tier.recommendation,
        factors: {
          rentalHistoryMonths: factors.rentalHistoryMonths,
          employmentStatus: factors.employmentStatus,
          annualSalary: factors.annualSalary,
          isVerified: factors.isVerified,
        },
      };
    }),

  update: protectedProcedure
    .input(z.object({
      name: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      bio: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      country: z.string().optional(),
      hasPets: z.boolean().optional(),
      petType: z.string().optional(),
      petCount: z.number().optional(),
      numberOfOccupants: z.number().optional(),
      occupantDetails: z.string().optional(),
      dniNie: z.string().optional(),
      companyName: z.string().optional(),
      annualSalary: z.number().optional(),
      rentalHistory: z.number().optional(),
      employmentStatus: z.enum(["employed", "self-employed", "student", "unemployed"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const { name, email, phone, ...profileData } = input;

      // Update user table
      if (name || email || phone) {
        await db.update(users)
          .set({ name, email, phone })
          .where(eq(users.id, ctx.user.id));
      }

      // Update profile table
      await upsertUserProfile({
        userId: ctx.user.id,
        ...profileData,
      });

      return { success: true };
    }),

  updateLanguage: protectedProcedure
    .input(z.object({
      language: z.enum(["en", "es"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db.update(users)
        .set({ 
          languagePreference: input.language,
          updatedAt: new Date()
        })
        .where(eq(users.id, ctx.user.id));

      return { success: true };
    }),
});
