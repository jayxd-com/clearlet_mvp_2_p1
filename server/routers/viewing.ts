import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, publicProcedure } from "../trpc";
import { getDb } from "../db";
import { eq, and, or, desc, asc } from "drizzle-orm";
import { properties, users, propertyViewings } from "../../drizzle/schema";
import {
  createViewingRequest,
  getPropertyViewings,
  getTenantViewings,
  getLandlordViewings,
  getViewingById,
  approveViewing,
  rejectViewing,
  markViewingCompleted,
  markViewingAsNoShow,
  createViewingAvailability,
  getPropertyAvailability,
  getLandlordAvailability,
  createViewingNotification,
  getLandlordViewingStats,
  getPropertyViewingStats,
  isTenantVerified,
  checkViewingConflict,
  closeViewingAvailability,
  updateViewingAvailability,
  deleteViewingAvailability,
  createViewingFeedback,
  getViewingFeedback,
  updateViewingFeedback,
} from "../viewing-db";
import { notifyViewingRequested, notifyViewingApproved, notifyViewingRejected } from "../notifications-service";

export const viewingRouter = router({
  getLandlordStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    return await getLandlordViewingStats(db, ctx.user.id);
  }),

  getPropertyStats: publicProcedure
    .input(z.object({ propertyId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return await getPropertyViewingStats(db, input.propertyId);
    }),

  requestViewing: protectedProcedure
    .input(
      z.object({
        propertyId: z.number(),
        requestedDate: z.string(), // ISO string from frontend
        requestedTimeSlot: z.string(),
        message: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const verified = await isTenantVerified(db, ctx.user.id);
      if (!verified) throw new TRPCError({ code: "FORBIDDEN", message: "Verification required" });

      const conflict = await checkViewingConflict(db, input.propertyId, new Date(input.requestedDate), input.requestedTimeSlot);
      if (conflict) throw new TRPCError({ code: "BAD_REQUEST", message: "Time slot already booked" });

      const props = await db.select().from(properties).where(eq(properties.id, input.propertyId)).limit(1);
      const property = props[0];

      if (!property) throw new TRPCError({ code: "NOT_FOUND", message: "Property not found" });

      const result = await createViewingRequest(db, {
        propertyId: input.propertyId,
        tenantId: ctx.user.id,
        landlordId: property.userId,
        requestedDate: new Date(input.requestedDate),
        requestedTimeSlot: input.requestedTimeSlot,
        tenantMessage: input.message,
        tenantVerificationStatus: ctx.user.verificationStatus,
        status: "pending",
      });

      const viewingId = result[0].insertId;

      await notifyViewingRequested({
        landlordId: property.userId,
        tenantName: ctx.user.name || "A tenant",
        propertyTitle: property.title,
      });

      return { success: true, viewingId };
    }),

  getTenantViewings: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    return await getTenantViewings(db, ctx.user.id);
  }),

  getLandlordViewings: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    return await getLandlordViewings(db, ctx.user.id);
  }),

  createAvailability: protectedProcedure
    .input(z.object({
      propertyId: z.number(),
      availableDate: z.string(),
      timeSlots: z.array(z.string()),
      maxViewingsPerDay: z.number().default(5),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      return await createViewingAvailability(db, {
        propertyId: input.propertyId,
        landlordId: ctx.user.id,
        availableDate: new Date(input.availableDate),
        timeSlots: JSON.stringify(input.timeSlots),
        maxViewingsPerDay: input.maxViewingsPerDay,
      });
    }),

  getPropertyAvailability: publicProcedure
    .input(z.object({ propertyId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      const availability = await getPropertyAvailability(db, input.propertyId);

      // Enhance with booked slots
      const enhancedAvailability = await Promise.all(availability.map(async (avail: any) => {
        // Use standard select instead of relational query
        const bookedViewings = await db
          .select()
          .from(propertyViewings)
          .where(
            and(
              eq(propertyViewings.propertyId, input.propertyId),
              eq(propertyViewings.requestedDate, avail.availableDate),
              eq(propertyViewings.status, "approved")
            )
          );

        return {
          ...avail,
          bookedSlots: bookedViewings.map((v: any) => v.requestedTimeSlot)
        };
      }));

      return enhancedAvailability;
    }),

  getLandlordAvailability: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    return await getLandlordAvailability(db, ctx.user.id);
  }),

  closeAvailability: protectedProcedure
    .input(z.object({ availabilityId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return await closeViewingAvailability(db, input.availabilityId);
    }),

  updateAvailability: protectedProcedure
    .input(z.object({
      availabilityId: z.number(),
      timeSlots: z.array(z.string()),
      maxViewingsPerDay: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return await updateViewingAvailability(db, input.availabilityId, input.timeSlots, input.maxViewingsPerDay);
    }),

  deleteAvailability: protectedProcedure
    .input(z.object({ availabilityId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return await deleteViewingAvailability(db, input.availabilityId);
    }),

  approveViewing: protectedProcedure
    .input(z.object({
      viewingId: z.number(),
      meetingLocation: z.string().optional(),
      meetingInstructions: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // 1. Fetch viewing details first
      const viewings = await db.select().from(propertyViewings).where(eq(propertyViewings.id, input.viewingId)).limit(1);
      const viewing = viewings[0];

      if (!viewing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Viewing request not found" });
      }

      // 1.5 Security check: Only the landlord can approve
      if (viewing.landlordId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You are not authorized to approve this viewing" });
      }

      // 2. Update viewing status to approved
      await approveViewing(db, input.viewingId, input.meetingLocation, input.meetingInstructions);

      // 3. Fetch property details for notification
      const props = await db.select({ title: properties.title }).from(properties).where(eq(properties.id, viewing.propertyId)).limit(1);
      const propertyTitle = props[0]?.title || "the property";

      // 4. Notify the approved tenant
      await notifyViewingApproved({
        tenantId: viewing.tenantId,
        propertyTitle,
      });

      // 5. Auto-reject other pending requests for the SAME slot
      try {
        const otherPending = await db.select()
          .from(propertyViewings)
          .where(
            and(
              eq(propertyViewings.propertyId, viewing.propertyId),
              eq(propertyViewings.requestedDate, viewing.requestedDate),
              eq(propertyViewings.requestedTimeSlot, viewing.requestedTimeSlot),
              eq(propertyViewings.status, "pending")
            )
          );

        for (const other of otherPending) {
          // Skip the one we just approved (though its status is already 'approved' now)
          if (other.id === viewing.id) continue;

          // Update status to rejected
          await db.update(propertyViewings)
            .set({ 
              status: "rejected", 
              landlordNotes: "Another request was approved for this time slot.",
              updatedAt: new Date() 
            })
            .where(eq(propertyViewings.id, other.id));

          // Notify the rejected tenants
          await notifyViewingRejected({
            tenantId: other.tenantId,
            propertyTitle,
          });
        }
      } catch (err) {
        console.error("Failed to auto-reject conflicting viewings:", err);
      }

      return { success: true };
    }),

  rejectViewing: protectedProcedure
    .input(z.object({
      viewingId: z.number(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // 1. Fetch viewing details
      const viewings = await db.select().from(propertyViewings).where(eq(propertyViewings.id, input.viewingId)).limit(1);
      const viewing = viewings[0];

      if (!viewing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Viewing request not found" });
      }

      // 1.5 Security check: Only the landlord can reject
      if (viewing.landlordId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You are not authorized to reject this viewing" });
      }

      // 2. Reject the viewing
      await rejectViewing(db, input.viewingId, input.reason);

      // 3. Fetch property details
      const props = await db.select({ title: properties.title }).from(properties).where(eq(properties.id, viewing.propertyId)).limit(1);
      const propertyTitle = props[0]?.title || "the property";

      // 4. Notify the tenant
      await notifyViewingRejected({
        tenantId: viewing.tenantId,
        propertyTitle,
      });

      return { success: true };
    }),

  completeViewing: protectedProcedure
    .input(z.object({ viewingId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const viewing = await getViewingById(db, input.viewingId);
      if (!viewing) throw new TRPCError({ code: "NOT_FOUND", message: "Viewing not found" });

      if (viewing.landlordId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
      }

      await markViewingCompleted(db, input.viewingId);

      // Create feedback notification for the tenant
      await createViewingNotification(db, {
        viewingId: input.viewingId,
        recipientId: viewing.tenantId,
        recipientType: "tenant",
        notificationType: "feedback_requested",
        subject: "Viewing Completed - Feedback Requested",
        message: "Your property viewing has been marked as complete. Please share your feedback!",
      });

      return { success: true };
    }),

  markNoShow: protectedProcedure
    .input(z.object({ viewingId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const viewing = await getViewingById(db, input.viewingId);
      if (!viewing) throw new TRPCError({ code: "NOT_FOUND", message: "Viewing not found" });

      if (viewing.landlordId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
      }

      await markViewingAsNoShow(db, input.viewingId);
      return { success: true };
    }),

  submitFeedback: protectedProcedure
    .input(z.object({
      viewingId: z.number(),
      rating: z.number().min(1).max(5),
      comment: z.string().optional(),
      liked: z.array(z.string()).optional(),
      disliked: z.array(z.string()).optional(),
      wouldApplyOrAccept: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const viewing = await getViewingById(db, input.viewingId);
      if (!viewing) throw new TRPCError({ code: "NOT_FOUND", message: "Viewing not found" });

      const existingFeedback = await getViewingFeedback(db, input.viewingId);
      const isLandlord = ctx.user.id === viewing.landlordId;
      const isTenant = ctx.user.id === viewing.tenantId;

      if (!isLandlord && !isTenant) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
      }

      const feedbackData: any = isLandlord ? {
        landlordRating: input.rating,
        landlordComment: input.comment,
        wouldLandlordAccept: input.wouldApplyOrAccept,
      } : {
        tenantRating: input.rating,
        tenantComment: input.comment,
        tenantLiked: JSON.stringify(input.liked || []),
        tenantDisliked: JSON.stringify(input.disliked || []),
        wouldTenantApply: input.wouldApplyOrAccept,
      };

      if (existingFeedback) {
        await updateViewingFeedback(db, existingFeedback.id, feedbackData);
      } else {
        await createViewingFeedback(db, {
          viewingId: input.viewingId,
          propertyId: viewing.propertyId,
          tenantId: viewing.tenantId,
          landlordId: viewing.landlordId,
          ...feedbackData,
        });
      }

      return { success: true };
    }),

  getViewingFeedback: protectedProcedure
    .input(z.object({ viewingId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      const feedback = await getViewingFeedback(db, input.viewingId);
      if (!feedback) return null;

      return {
        ...feedback,
        tenantLiked: feedback.tenantLiked ? JSON.parse(feedback.tenantLiked) : [],
        tenantDisliked: feedback.tenantDisliked ? JSON.parse(feedback.tenantDisliked) : [],
      };
    }),
});
