import { router, protectedProcedure } from "../trpc";
import { getUserApplications, createApplication, updateApplicationStatus, updatePropertyStatus, getPropertyById, getLandlordApplications, getApplicationDetails, getDb, getLandlordDefaultTemplate, getContractTemplateById } from "../db";
import { z } from "zod"; // Import z for schema validation
import { notifyApplicationSubmitted, notifyApplicationStatusChanged } from "../notifications-service";
import { TRPCError } from "@trpc/server";
import { contracts, documents, properties } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const applicationsRouter = router({
  myApplications: protectedProcedure.query(async ({ ctx }) => {
    const apps = await getUserApplications(ctx.user.id);
    return apps;
  }),

  landlordApplications: protectedProcedure.query(async ({ ctx }) => {
    const apps = await getLandlordApplications(ctx.user.id);
    return apps;
  }),

  getDetails: protectedProcedure
    .input(z.object({ applicationId: z.number() }))
    .query(async ({ input }) => {
      const details = await getApplicationDetails(input.applicationId);
      if (!details) throw new TRPCError({ code: "NOT_FOUND", message: "Application not found" });
      return details;
    }),

  landlordApplicationDetails: protectedProcedure
    .input(z.object({ applicationId: z.number() }))
    .query(async ({ ctx, input }) => {
      const app = await getApplicationDetails(input.applicationId);
      if (!app) throw new TRPCError({ code: "NOT_FOUND", message: "Application not found" });

      if (app.landlordId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database error" });

      const tenantDocs = await db.select().from(documents).where(eq(documents.userId, app.userId));
      const property = await getPropertyById(app.propertyId);
      const contract = await db.query.contracts.findFirst({
        where: eq(contracts.applicationId, app.id)
      });

      return {
        ...app,
        documents: tenantDocs,
        property,
        contract
      };
    }),

  createApplication: protectedProcedure
    .input(z.object({
      propertyId: z.number(),
      landlordId: z.number(),
      moveInDate: z.string(), // Client sends string, convert to Date in mutation
      leaseLength: z.number(),
      message: z.string(),
      shareIdDocument: z.boolean(),
      shareIncomeDocument: z.boolean(),
      shareEmploymentDocument: z.boolean(),
      shareReferences: z.boolean(),
      numberOfOccupants: z.number(),
      hasPets: z.boolean(),
      petType: z.string().optional().nullable(),
      petCount: z.number().optional().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.verificationStatus !== "verified") {
        throw new TRPCError({ code: "FORBIDDEN", message: "You must complete verification to apply for properties." });
      }

      const newApplication = await createApplication({
        userId: ctx.user.id,
        propertyId: input.propertyId,
        landlordId: input.landlordId,
        moveInDate: new Date(input.moveInDate), // Convert string to Date object
        leaseLength: input.leaseLength,
        message: input.message,
        shareIdDocument: input.shareIdDocument,
        shareIncomeDocument: input.shareIncomeDocument,
        shareEmploymentDocument: input.shareEmploymentDocument,
        shareReferences: input.shareReferences,
        numberOfOccupants: input.numberOfOccupants,
        hasPets: input.hasPets,
        petType: input.petType,
        petCount: input.petCount,
        status: "pending", // Default status
      });

      // Send notification to landlord
      try {
        const property = await getPropertyById(input.propertyId);
        await notifyApplicationSubmitted({
          landlordId: input.landlordId,
          tenantName: ctx.user.name || "A tenant",
          propertyTitle: property?.title || "your property",
        });
      } catch (err) {
        console.error("Failed to send application notification:", err);
      }

      return newApplication;
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      applicationId: z.number(),
      status: z.enum(["pending", "accepted", "rejected", "withdrawn"]),
      templateId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Get app details to find propertyId
      const app = await getApplicationDetails(input.applicationId);
      if (!app) throw new TRPCError({ code: "NOT_FOUND", message: "Application not found" });

      // In a real app, you'd verify landlordId ownership here
      await updateApplicationStatus(input.applicationId, input.status);

      // If accepted, mark property as rented to hide from search
      if (input.status === "accepted") {
        await updatePropertyStatus(app.propertyId, "rented");
      }

      // Send notification to tenant
      try {
        if (input.status === "accepted" || input.status === "rejected") {
          await notifyApplicationStatusChanged({
            tenantId: app.userId,
            propertyTitle: app.propertyTitle || "the property",
            status: input.status,
          });
        }
      } catch (err) {
        console.error("Failed to send application status notification:", err);
      }

      return { success: true };
    }),

  reject: protectedProcedure
    .input(z.object({
      applicationId: z.number(),
      feedback: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await updateApplicationStatus(input.applicationId, "rejected");

      // Send notification
      try {
        const app: any = await db.query.applications.findFirst({
          where: (applications: any, { eq }: any) => eq(applications.id, input.applicationId),
          with: { property: true }
        });
        
        if (app) {
          await notifyApplicationStatusChanged({
            tenantId: app.userId,
            propertyTitle: app.property?.title || "the property",
            status: "rejected",
          });
        }
      } catch (err) {
        console.error("Failed to send application rejection notification:", err);
      }

      return { success: true };
    }),

  withdraw: protectedProcedure
    .input(z.object({
      applicationId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const updatedApplication = await updateApplicationStatus(input.applicationId, "withdrawn");
      return updatedApplication;
    }),
});
