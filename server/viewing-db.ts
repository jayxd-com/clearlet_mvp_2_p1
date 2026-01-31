import { eq, and, gte, lte, desc, asc, or, sql } from "drizzle-orm";
import {
  propertyViewings,
  viewingAvailability,
  viewingFeedback,
  viewingNotifications,
  users,
  properties,
} from "../drizzle/schema";

/**
 * VIEWING REQUEST OPERATIONS
 */

export async function createViewingRequest(db: any, data: any) {
  return await db.insert(propertyViewings).values(data);
}

export async function getPropertyViewings(db: any, propertyId: number) {
  return await db
    .select()
    .from(propertyViewings)
    .where(eq(propertyViewings.propertyId, propertyId))
    .orderBy(desc(propertyViewings.requestedDate));
}

export async function getTenantViewings(db: any, tenantId: number) {
  return await db
    .select({
      id: propertyViewings.id,
      status: propertyViewings.status,
      requestedDate: propertyViewings.requestedDate,
      requestedTimeSlot: propertyViewings.requestedTimeSlot,
      meetingLocation: propertyViewings.meetingLocation,
      meetingInstructions: propertyViewings.meetingInstructions,
      tenantMessage: propertyViewings.tenantMessage,
      createdAt: propertyViewings.createdAt,
      propertyId: propertyViewings.propertyId,
      property: {
        id: properties.id,
        title: properties.title,
        address: properties.address,
        images: properties.images,
      },
      feedback: {
        id: viewingFeedback.id,
        tenantRating: viewingFeedback.tenantRating,
        landlordRating: viewingFeedback.landlordRating,
      }
    })
    .from(propertyViewings)
    .innerJoin(properties, eq(propertyViewings.propertyId, properties.id))
    .leftJoin(viewingFeedback, eq(propertyViewings.id, viewingFeedback.viewingId))
    .where(eq(propertyViewings.tenantId, tenantId))
    .orderBy(desc(propertyViewings.requestedDate));
}

export async function getLandlordViewings(db: any, landlordId: number) {
  return await db
    .select({
      id: propertyViewings.id,
      status: propertyViewings.status,
      requestedDate: propertyViewings.requestedDate,
      requestedTimeSlot: propertyViewings.requestedTimeSlot,
      meetingLocation: propertyViewings.meetingLocation,
      meetingInstructions: propertyViewings.meetingInstructions,
      tenantMessage: propertyViewings.tenantMessage,
      createdAt: propertyViewings.createdAt,
      property: {
        id: properties.id,
        title: properties.title,
        address: properties.address,
        images: properties.images,
      },
      tenant: {
        id: users.id,
        name: users.name,
        email: users.email,
        verificationStatus: users.verificationStatus,
      },
      feedback: {
        id: viewingFeedback.id,
        tenantRating: viewingFeedback.tenantRating,
        landlordRating: viewingFeedback.landlordRating,
      }
    })
    .from(propertyViewings)
    .innerJoin(properties, eq(propertyViewings.propertyId, properties.id))
    .innerJoin(users, eq(propertyViewings.tenantId, users.id))
    .leftJoin(viewingFeedback, eq(propertyViewings.id, viewingFeedback.viewingId))
    .where(eq(propertyViewings.landlordId, landlordId))
    .orderBy(desc(propertyViewings.requestedDate));
}

export async function getViewingById(db: any, viewingId: number) {
  const viewing = await db
    .select()
    .from(propertyViewings)
    .where(eq(propertyViewings.id, viewingId))
    .limit(1);
  return viewing[0];
}

export async function updateViewingStatus(db: any, viewingId: number, status: string, notes?: string) {
  const updateData: any = { status, updatedAt: new Date() };
  if (status === "approved") updateData.landlordApprovedAt = new Date();
  if (notes) updateData.landlordNotes = notes;
  return await db.update(propertyViewings).set(updateData).where(eq(propertyViewings.id, viewingId));
}

export async function approveViewing(db: any, viewingId: number, meetingLocation?: string, meetingInstructions?: string) {
  return await db
    .update(propertyViewings)
    .set({
      status: "approved",
      landlordApprovedAt: new Date(),
      meetingLocation,
      meetingInstructions,
      updatedAt: new Date(),
    })
    .where(eq(propertyViewings.id, viewingId));
}

export async function rejectViewing(db: any, viewingId: number, reason?: string) {
  return await db
    .update(propertyViewings)
    .set({
      status: "rejected",
      landlordNotes: reason,
      updatedAt: new Date(),
    })
    .where(eq(propertyViewings.id, viewingId));
}

export async function markViewingCompleted(db: any, viewingId: number) {
  return await db
    .update(propertyViewings)
    .set({
      status: "completed",
      updatedAt: new Date(),
    })
    .where(eq(propertyViewings.id, viewingId));
}

export async function markViewingAsNoShow(db: any, viewingId: number) {
  return await db
    .update(propertyViewings)
    .set({
      status: "no_show",
      updatedAt: new Date(),
    })
    .where(eq(propertyViewings.id, viewingId));
}

/**
 * AVAILABILITY OPERATIONS
 */

export async function createViewingAvailability(db: any, data: any) {
  return await db.insert(viewingAvailability).values(data);
}

export async function getPropertyAvailability(db: any, propertyId: number) {
  return await db
    .select()
    .from(viewingAvailability)
    .where(and(eq(viewingAvailability.propertyId, propertyId), eq(viewingAvailability.isOpen, true)))
    .orderBy(asc(viewingAvailability.availableDate));
}

export async function getLandlordAvailability(db: any, landlordId: number) {
  return await db
    .select()
    .from(viewingAvailability)
    .where(eq(viewingAvailability.landlordId, landlordId))
    .orderBy(asc(viewingAvailability.availableDate));
}

export async function updateViewingAvailability(db: any, availabilityId: number, timeSlots: string[], maxViewingsPerDay?: number) {
  return await db
    .update(viewingAvailability)
    .set({
      timeSlots: JSON.stringify(timeSlots),
      maxViewingsPerDay,
      updatedAt: new Date(),
    })
    .where(eq(viewingAvailability.id, availabilityId));
}

export async function closeViewingAvailability(db: any, availabilityId: number) {
  return await db
    .update(viewingAvailability)
    .set({ isOpen: false, updatedAt: new Date() })
    .where(eq(viewingAvailability.id, availabilityId));
}

export async function deleteViewingAvailability(db: any, availabilityId: number) {
  return await db
    .delete(viewingAvailability)
    .where(eq(viewingAvailability.id, availabilityId));
}

/**
 * FEEDBACK OPERATIONS
 */

export async function createViewingFeedback(db: any, data: any) {
  return await db.insert(viewingFeedback).values(data);
}

export async function getViewingFeedback(db: any, viewingId: number) {
  const feedback = await db
    .select()
    .from(viewingFeedback)
    .where(eq(viewingFeedback.viewingId, viewingId))
    .limit(1);
  return feedback[0];
}

export async function updateViewingFeedback(db: any, feedbackId: number, data: any) {
  return await db
    .update(viewingFeedback)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(viewingFeedback.id, feedbackId));
}

/**
 * NOTIFICATION OPERATIONS
 */

export async function createViewingNotification(db: any, data: any) {
  return await db.insert(viewingNotifications).values(data);
}

export async function getUserViewingNotifications(db: any, userId: number) {
  return await db
    .select()
    .from(viewingNotifications)
    .where(eq(viewingNotifications.recipientId, userId))
    .orderBy(desc(viewingNotifications.createdAt));
}

/**
 * UTILITY OPERATIONS
 */

export async function isTenantVerified(db: any, userId: number) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });
  return user?.verificationStatus === "verified";
}

export async function checkViewingConflict(db: any, propertyId: number, date: Date, timeSlot: string) {
  const existing = await db
    .select()
    .from(propertyViewings)
    .where(
      and(
        eq(propertyViewings.propertyId, propertyId),
        eq(propertyViewings.requestedDate, date),
        eq(propertyViewings.requestedTimeSlot, timeSlot),
        eq(propertyViewings.status, "approved")
      )
    );
  return existing.length > 0;
}

export async function getLandlordViewingStats(db: any, landlordId: number) {
  const allViewings = await db
    .select()
    .from(propertyViewings)
    .where(
      and(
        eq(propertyViewings.landlordId, landlordId),
        sql`${propertyViewings.status} != 'cancelled'`
      )
    );
  const total = allViewings.length;
  const pending = allViewings.filter((v: any) => v.status === "pending").length;
  const approved = allViewings.filter((v: any) => v.status === "approved").length;
  
  return {
    totalViewings: total,
    pendingViewings: pending,
    approvedViewings: approved,
    responseRate: total > 0 ? Math.round(((total - pending) / total) * 100) : 100,
  };
}

export async function getPropertyViewingStats(db: any, propertyId: number) {
  const feedback = await db
    .select()
    .from(viewingFeedback)
    .where(eq(viewingFeedback.propertyId, propertyId));
  
  const ratings = feedback.map((f: any) => f.tenantRating).filter((r: any) => r != null);
  const avgRating = ratings.length > 0 ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : 0;
  
  return {
    totalFeedback: feedback.length,
    averageRating: Number(avgRating.toFixed(1)),
    feedback: feedback.map((f: any) => ({
      id: f.id,
      rating: f.tenantRating,
      comment: f.tenantComment,
      date: f.createdAt
    }))
  };
}
