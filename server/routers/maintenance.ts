import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import { getDb } from "../db";
import { maintenanceRequests, maintenanceComments, properties, users } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { notifyMaintenanceRequestCreated, notifyMaintenanceStatusChanged, notifyMaintenanceCommentAdded } from "../notifications-service";

export const maintenanceRouter = router({
  getTenantRequests: protectedProcedure
    .query(async ({ ctx }) => {
      console.log(`[maintenance.getTenantRequests] Fetching for user ID: ${ctx.user.id}`);
      try {
        const db = await getDb() as any;
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        const results = await db
          .select({
            request: maintenanceRequests,
            property: properties,
          })
          .from(maintenanceRequests)
          .innerJoin(properties, eq(maintenanceRequests.propertyId, properties.id))
          .where(eq(maintenanceRequests.tenantId, ctx.user.id))
          .orderBy(desc(maintenanceRequests.createdAt));

        console.log(`[maintenance.getTenantRequests] Found ${results.length} requests`);

        return results.map((row: any) => ({
          ...row.request,
          property: row.property,
        }));
      } catch (error: any) {
        console.error("[maintenance.getTenantRequests] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "An unexpected error occurred",
        });
      }
    }),

  getLandlordRequests: protectedProcedure
    .query(async ({ ctx }) => {
      console.log(`[maintenance.getLandlordRequests] Fetching for landlord ID: ${ctx.user.id}`);
      try {
        const db = await getDb() as any;
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        const results = await db
          .select({
            request: maintenanceRequests,
            property: properties,
            tenant: users,
          })
          .from(maintenanceRequests)
          .innerJoin(properties, eq(maintenanceRequests.propertyId, properties.id))
          .innerJoin(users, eq(maintenanceRequests.tenantId, users.id))
          .where(eq(maintenanceRequests.landlordId, ctx.user.id))
          .orderBy(desc(maintenanceRequests.createdAt));

        console.log(`[maintenance.getLandlordRequests] Found ${results.length} requests`);

        return results.map((row: any) => ({
          ...row.request,
          property: row.property,
          tenant: row.tenant,
        }));
      } catch (error: any) {
        console.error("[maintenance.getLandlordRequests] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "An unexpected error occurred",
        });
      }
    }),

  getById: protectedProcedure
    .input(z.object({ requestId: z.number().optional() }))
    .query(async ({ input }) => {
      if (!input.requestId) return null;
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const results = await db
        .select({
          request: maintenanceRequests,
          property: properties,
          tenant: users,
        })
        .from(maintenanceRequests)
        .innerJoin(properties, eq(maintenanceRequests.propertyId, properties.id))
        .innerJoin(users, eq(maintenanceRequests.tenantId, users.id))
        .where(eq(maintenanceRequests.id, input.requestId))
        .limit(1);

      if (results.length === 0) return null;

      return {
        ...results[0].request,
        property: results[0].property,
        tenant: results[0].tenant,
      };
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      requestId: z.number(),
      status: z.enum(["pending", "in_progress", "completed", "cancelled"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db.update(maintenanceRequests)
        .set({ status: input.status, updatedAt: new Date() })
        .where(eq(maintenanceRequests.id, input.requestId));

      // Send notification to tenant
      try {
        const request: any = await db.query.maintenanceRequests.findFirst({
          where: (maintenanceRequests: any, { eq }: any) => eq(maintenanceRequests.id, input.requestId),
          with: { property: true }
        });
        
        if (request) {
          await notifyMaintenanceStatusChanged({
            tenantId: request.tenantId,
            propertyTitle: request.property?.title || "the property",
            requestTitle: request.title,
            status: input.status,
          });
        }
      } catch (err) {
        console.error("Failed to send maintenance status notification:", err);
      }

      return { success: true };
    }),


  assignContractor: protectedProcedure
    .input(z.object({
      requestId: z.number(),
      contractorName: z.string(),
      contractorPhone: z.string().optional(),
      estimatedCost: z.number().optional(),
      scheduledDate: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db.update(maintenanceRequests)
        .set({
          contractorName: input.contractorName,
          contractorPhone: input.contractorPhone,
          estimatedCost: input.estimatedCost ? Math.round(input.estimatedCost * 100) : null,
          scheduledDate: input.scheduledDate ? new Date(input.scheduledDate) : null,
          status: "in_progress",
          updatedAt: new Date(),
        })
        .where(eq(maintenanceRequests.id, input.requestId));

      // Send notification to tenant
      try {
        const request: any = await db.query.maintenanceRequests.findFirst({
          where: (maintenanceRequests: any, { eq }: any) => eq(maintenanceRequests.id, input.requestId),
          with: { property: true }
        });
        
        if (request) {
          await notifyMaintenanceStatusChanged({
            tenantId: request.tenantId,
            propertyTitle: request.property?.title || "the property",
            requestTitle: request.title,
            status: "in_progress (Contractor Assigned)",
          });
        }
      } catch (err) {
        console.error("Failed to send maintenance status notification:", err);
      }

      return { success: true };
    }),

  create: protectedProcedure
    .input(z.object({
      propertyId: z.number(),
      landlordId: z.number(),
      title: z.string(),
      description: z.string(),
      priority: z.enum(["low", "medium", "high", "urgent"]),
      category: z.enum(["plumbing", "electrical", "heating", "appliance", "structural", "pest", "other"]),
      photos: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [result] = await db.insert(maintenanceRequests).values({
        propertyId: input.propertyId,
        tenantId: ctx.user.id,
        landlordId: input.landlordId,
        title: input.title,
        description: input.description,
        priority: input.priority,
        category: input.category,
        photos: input.photos ? JSON.stringify(input.photos) : null,
        status: "pending",
      });

      // Send notification to landlord
      try {
        const property = await db.query.properties.findFirst({
          where: eq(properties.id, input.propertyId),
        });
        await notifyMaintenanceRequestCreated({
          landlordId: input.landlordId,
          tenantName: ctx.user.name || "A tenant",
          propertyTitle: property?.title || "your property",
          requestTitle: input.title,
        });
      } catch (err) {
        console.error("Failed to send maintenance notification:", err);
      }

      return { id: result.insertId };
    }),

  getComments: protectedProcedure
    .input(z.object({ requestId: z.number().optional() }))
    .query(async ({ input }) => {
      if (!input.requestId) return [];
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const results = await db
        .select({
          comment: maintenanceComments,
          user: users,
        })
        .from(maintenanceComments)
        .innerJoin(users, eq(maintenanceComments.userId, users.id))
        .where(eq(maintenanceComments.requestId, input.requestId))
        .orderBy(desc(maintenanceComments.createdAt));

      return results.map((row: any) => ({
        ...row.comment,
        user: row.user,
      }));
    }),

  addComment: protectedProcedure
    .input(z.object({
      requestId: z.number(),
      comment: z.string(),
      isInternal: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db.insert(maintenanceComments).values({
        requestId: input.requestId,
        userId: ctx.user.id,
        comment: input.comment,
        isInternal: input.isInternal || false,
      });

      // Send notification to the other party
      try {
        const request = await db.query.maintenanceRequests.findFirst({
          where: (maintenanceRequests: any, { eq }: any) => eq(maintenanceRequests.id, input.requestId),
        });
        
        if (request) {
          const isLandlord = ctx.user.id === request.landlordId;
          const recipientId = isLandlord ? request.tenantId : request.landlordId;
          
          await notifyMaintenanceCommentAdded({
            userId: recipientId,
            requestTitle: request.title,
            isLandlord,
          });
        }
      } catch (err) {
        console.error("Failed to send maintenance comment notification:", err);
      }

      return { success: true };
    }),
});
