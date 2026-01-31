import { router, publicProcedure, protectedProcedure } from "../trpc";
import { z } from "zod";
import { getDb, createNotification } from "../db";
import { users, userProfiles } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { TRPCError } from "@trpc/server";
import { awardOwnerForActivity, awardUserForActivity } from "../owner-earnings-service";
import { REWARD_AMOUNTS } from "../config/rewards";
import { sendWelcomeEmail } from "../email-service";
import { getTranslation } from "../translations";

export const authRouter = router({
  signUp: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string().min(2),
      role: z.enum(["tenant", "landlord"]),
      languagePreference: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, input.email),
      });

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User already exists",
        });
      }

      const passwordHash = await bcrypt.hash(input.password, 10);
      const userLang = input.languagePreference || "en";

      const [result] = await db.insert(users).values({
        email: input.email,
        passwordHash,
        name: input.name,
        userType: input.role,
        role: "user",
        verificationStatus: "unverified",
        languagePreference: userLang,
      });

      const userId = result.insertId;

      // Create empty user profile
      await db.insert(userProfiles).values({
        userId: userId,
        verificationScore: 0,
        tenantScore: 0,
      });

      // Award ClearCoins to owner for new signup
      try {
        await awardOwnerForActivity({
          activityType: "USER_SIGNUP",
          amount: REWARD_AMOUNTS.USER_SIGNUP,
          description: `New user signup: ${input.name} (${input.role})`,
          relatedUserId: userId,
        });

        // Award ClearCoins to the user for signing up
        await awardUserForActivity({
          userId: userId,
          activityType: "USER_SIGNUP",
          amount: REWARD_AMOUNTS.USER_SIGNUP,
          description: "Welcome bonus for signing up!",
        });

        // Notify user about the reward
        const welcomeTitle = getTranslation(userLang, "welcomeBonusTitle");
        const welcomeMessage = getTranslation(userLang, "welcomeBonusMessage", { amount: REWARD_AMOUNTS.USER_SIGNUP });

        await createNotification({
          userId,
          type: "system",
          title: welcomeTitle,
          message: welcomeMessage,
          link: "/tenant/wallet",
        });
      } catch (err) {
        console.error("Failed to award signup reward:", err);
      }

      // Send Welcome Email
      try {
        await sendWelcomeEmail(input.email, input.name, userLang);
      } catch (err) {
        console.error("Failed to send welcome email:", err);
      }

      const token = jwt.sign({ userId }, process.env.JWT_SECRET!, {
        expiresIn: "7d",
      });

      ctx.res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return { success: true };
    }),

  signIn: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const user = await db.query.users.findFirst({
        where: eq(users.email, input.email),
      });

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid credentials",
        });
      }

      const valid = await bcrypt.compare(input.password, user.passwordHash);

      if (!valid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid credentials",
        });
      }

      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
        expiresIn: "7d",
      });

      ctx.res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return { success: true, user };
    }),

  adminSignIn: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const user = await db.query.users.findFirst({
        where: eq(users.email, input.email),
      });

      if (!user || user.role !== "admin") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid admin credentials",
        });
      }

      const valid = await bcrypt.compare(input.password, user.passwordHash);

      if (!valid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid admin credentials",
        });
      }

      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
        expiresIn: "7d",
      });

      ctx.res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return { success: true, redirectPath: "/admin/dashboard" };
    }),

  me: protectedProcedure.query(({ ctx }) => {
    return ctx.user;
  }),

  logout: publicProcedure.mutation(({ ctx }) => {
    ctx.res.clearCookie("token");
    return { success: true };
  }),
});
