import { router, protectedProcedure, publicProcedure } from "../trpc";
import { z } from "zod";
import { getSavedProperties, getProperties, toggleSavedProperty, getPropertyById, getUserProperties, createProperty, updatePropertyStatus, getDb } from "../db";
import { properties } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { awardOwnerForActivity, awardUserForActivity } from "../owner-earnings-service";
import { REWARD_AMOUNTS } from "../config/rewards";

export const propertiesRouter = router({
  getProperties: publicProcedure // Properties are public
    .input(z.object({
      city: z.string().optional(),
      maxPrice: z.number().optional(),
      bedrooms: z.number().optional(),
      minArea: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      const properties = await getProperties(input);
      return properties;
    }),

  detail: publicProcedure
    .input(z.number())
    .query(async ({ input: id }) => {
      const property = await getPropertyById(id);
      return property;
    }),

  getSaved: protectedProcedure
    .query(async ({ ctx }) => {
      const savedProperties = await getSavedProperties(ctx.user.id);
      return savedProperties;
    }),

  toggleSaved: protectedProcedure
    .input(z.number()) // Expects propertyId as input
    .mutation(async ({ ctx, input: propertyId }) => {
      const result = await toggleSavedProperty(ctx.user.id, propertyId);
      return result;
    }),

  myListings: protectedProcedure
    .query(async ({ ctx }) => {
      const listings = await getUserProperties(ctx.user.id);
      return listings;
    }),

  getUserProperties: protectedProcedure
    .query(async ({ ctx }) => {
      const listings = await getUserProperties(ctx.user.id);
      return listings;
    }),

  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      address: z.string().min(1),
      city: z.string().min(1),
      country: z.string().min(1),
      zipCode: z.string().optional(),
      bedrooms: z.number().min(0),
      bathrooms: z.number().min(0),
      squareFeet: z.number().optional(),
      rentPrice: z.number().min(0), // Price in cents
      currency: z.string().default("EUR"),
      amenities: z.array(z.string()).optional(),
      images: z.array(z.string()).optional(),
      allowPets: z.boolean().optional(),
      petDeposit: z.number().optional(),
      petRestrictions: z.string().optional(),
      checklistTemplateId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await createProperty({
        ...input,
        userId: ctx.user.id,
        status: "pending_verification",
        verifiedLandlord: false,
        amenities: input.amenities || [],
        images: input.images || [],
      } as any);

      // Award ClearCoins to owner for new listing
      try {
        await awardOwnerForActivity({
          activityType: "PROPERTY_LISTED",
          amount: REWARD_AMOUNTS.PROPERTY_LISTED,
          description: `New property listed: ${input.title} by user ${ctx.user.id}`,
          relatedUserId: ctx.user.id,
        });

        // Award ClearCoins to the landlord
        await awardUserForActivity({
          userId: ctx.user.id,
          activityType: "PROPERTY_LISTED",
          amount: REWARD_AMOUNTS.PROPERTY_LISTED,
          description: `You listed a new property: ${input.title}`,
        });
      } catch (err) {
        console.error("Failed to award property listing reward:", err);
      }

      return result;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      data: z.any(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Check ownership
      const existing = await db.query.properties.findFirst({
        where: and(
          eq(properties.id, input.id),
          eq(properties.userId, ctx.user.id)
        ),
      });

      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Property not found or access denied" });

      await db.update(properties)
        .set(input.data)
        .where(eq(properties.id, input.id));

      return { success: true };
    }),

  toggleStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["active", "inactive", "rented"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      if (input.status === "active" && ctx.user.verificationStatus !== "verified") {
        throw new TRPCError({ code: "FORBIDDEN", message: "You must complete verification to publish properties." });
      }

      await db.update(properties)
        .set({ status: input.status })
        .where(and(eq(properties.id, input.id), eq(properties.userId, ctx.user.id)));

      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.number())
    .mutation(async ({ ctx, input: id }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db.delete(properties)
        .where(and(eq(properties.id, id), eq(properties.userId, ctx.user.id)));

      return { success: true };
    }),
});
