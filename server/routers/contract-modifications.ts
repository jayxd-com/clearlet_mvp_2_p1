import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import { getDb } from "../db";
import { contractTerminations, contractAmendments, contracts, users, properties } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { 
  notifyContractTerminationRequested, 
  notifyContractTerminationResponded,
  notifyContractAmendmentRequested,
  notifyContractAmendmentResponded
} from "../notifications-service";

export const contractModificationsRouter = router({
  getPendingRequests: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb() as any;
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    // Fetch Terminations where user is the responder (landlord)
    const terminations = await db
      .select({
        request: contractTerminations,
        contract: contracts,
        requester: users,
        property: properties,
      })
      .from(contractTerminations)
      .innerJoin(contracts, eq(contractTerminations.contractId, contracts.id))
      .innerJoin(users, eq(contractTerminations.requestedBy, users.id))
      .innerJoin(properties, eq(contracts.propertyId, properties.id))
      .where(and(
        eq(contractTerminations.status, "pending"),
        eq(contracts.landlordId, ctx.user.id) // Only if I am the landlord
      ));

    // Fetch Amendments where user is the responder (landlord)
    const amendments = await db
      .select({
        request: contractAmendments,
        contract: contracts,
        requester: users,
        property: properties,
      })
      .from(contractAmendments)
      .innerJoin(contracts, eq(contractAmendments.contractId, contracts.id))
      .innerJoin(users, eq(contractAmendments.proposedBy, users.id))
      .innerJoin(properties, eq(contracts.propertyId, properties.id))
      .where(and(
        eq(contractAmendments.status, "pending"),
        eq(contracts.landlordId, ctx.user.id)
      ));

    return {
      terminations: terminations.map((t: any) => ({ ...t.request, contract: t.contract, requester: t.requester, property: t.property, requestType: "termination" })),
      amendments: amendments.map((a: any) => ({ ...a.request, contract: a.contract, requester: a.requester, property: a.property, requestType: "amendment" })),
    };
  }),

  // ==========================================
  // TERMINATIONS
  // ==========================================
  
  requestTermination: protectedProcedure
    .input(z.object({
      contractId: z.number(),
      reason: z.string().min(10),
      desiredEndDate: z.string(), // ISO date
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [contract] = await db.select().from(contracts).where(eq(contracts.id, input.contractId));
      if (!contract) throw new TRPCError({ code: "NOT_FOUND", message: "Contract not found" });

      // Validate Date is in the future
      const desiredDate = new Date(input.desiredEndDate);
      if (desiredDate <= new Date()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Termination date must be in the future" });
      }

      // Verify user is party to contract
      if (contract.tenantId !== ctx.user.id && contract.landlordId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
      }

      await db.insert(contractTerminations).values({
        contractId: input.contractId,
        requestedBy: ctx.user.id,
        reason: input.reason,
        desiredEndDate: new Date(input.desiredEndDate),
        status: "pending",
      });

      // Notify other party (Landlord)
      try {
        const [property] = await db.select().from(properties).where(eq(properties.id, contract.propertyId));
        const [requester] = await db.select().from(users).where(eq(users.id, ctx.user.id));
        
        await notifyContractTerminationRequested({
          landlordId: contract.landlordId,
          tenantName: requester.name,
          propertyTitle: property?.title || "Property",
          date: input.desiredEndDate,
        });
      } catch (err) {
        console.error("Failed to send termination notification:", err);
      }

      return { success: true };
    }),

  respondTermination: protectedProcedure
    .input(z.object({
      terminationId: z.number(),
      approved: z.boolean(),
      responseMessage: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [request] = await db.select().from(contractTerminations).where(eq(contractTerminations.id, input.terminationId));
      if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "Request not found" });

      const [contract] = await db.select().from(contracts).where(eq(contracts.id, request.contractId));
      
      // Verify responder is the OTHER party
      const isRequesterTenant = request.requestedBy === contract.tenantId;
      const expectedResponderId = isRequesterTenant ? contract.landlordId : contract.tenantId;

      if (ctx.user.id !== expectedResponderId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the other party can respond" });
      }

      const status = input.approved ? "approved" : "rejected";

      await db.update(contractTerminations)
        .set({
          status,
          respondedBy: ctx.user.id,
          respondedAt: new Date(),
          responseMessage: input.responseMessage,
        })
        .where(eq(contractTerminations.id, input.terminationId));

      if (input.approved) {
        // Update Contract Status
        await db.update(contracts)
          .set({ 
            status: "terminated", 
            endDate: request.desiredEndDate 
          })
          .where(eq(contracts.id, contract.id));

        // Update Property Status to 'active' so it's searchable again
        await db.update(properties)
          .set({ status: "active" })
          .where(eq(properties.id, contract.propertyId));
      }

      // Notify Requester (Tenant)
      try {
        const [property] = await db.select().from(properties).where(eq(properties.id, contract.propertyId));
        
        await notifyContractTerminationResponded({
          tenantId: request.requestedBy,
          propertyTitle: property?.title || "Property",
          status: input.approved ? "approved" : "rejected",
        });
      } catch (err) {
        console.error("Failed to send termination response notification:", err);
      }

      return { success: true };
    }),

  // ==========================================
  // AMENDMENTS (Change in Circumstances)
  // ==========================================

  requestAmendment: protectedProcedure
    .input(z.object({
      contractId: z.number(),
      type: z.enum(["rent_change", "term_extension", "terms_update", "other"]),
      description: z.string().min(10),
      changes: z.record(z.any()), // JSON object of proposed changes
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [contract] = await db.select().from(contracts).where(eq(contracts.id, input.contractId));
      if (!contract) throw new TRPCError({ code: "NOT_FOUND", message: "Contract not found" });

      await db.insert(contractAmendments).values({
        contractId: input.contractId,
        proposedBy: ctx.user.id,
        amendmentType: input.type,
        description: input.description,
        changes: JSON.stringify(input.changes),
        status: "pending",
      });

      // Notify other party (Landlord)
      try {
        const [property] = await db.select().from(properties).where(eq(properties.id, contract.propertyId));
        const [requester] = await db.select().from(users).where(eq(users.id, ctx.user.id));
        
        await notifyContractAmendmentRequested({
          landlordId: contract.landlordId,
          tenantName: requester.name,
          propertyTitle: property?.title || "Property",
        });
      } catch (err) {
        console.error("Failed to send amendment notification:", err);
      }

      return { success: true };
    }),
    
  respondAmendment: protectedProcedure
    .input(z.object({
      amendmentId: z.number(),
      approved: z.boolean(),
      responseMessage: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [amendment] = await db.select().from(contractAmendments).where(eq(contractAmendments.id, input.amendmentId));
      if (!amendment) throw new TRPCError({ code: "NOT_FOUND", message: "Amendment not found" });

      const [contract] = await db.select().from(contracts).where(eq(contracts.id, amendment.contractId));

      await db.update(contractAmendments)
        .set({
          status: input.approved ? "approved" : "rejected",
          respondedBy: ctx.user.id,
          respondedAt: new Date(),
          responseMessage: input.responseMessage,
        })
        .where(eq(contractAmendments.id, input.amendmentId));

      // Notify Requester (Tenant)
      try {
        const [property] = await db.select().from(properties).where(eq(properties.id, contract.propertyId));
        
        await notifyContractAmendmentResponded({
          tenantId: amendment.proposedBy,
          propertyTitle: property?.title || "Property",
          status: input.approved ? "approved" : "rejected",
        });
      } catch (err) {
        console.error("Failed to send amendment response notification:", err);
      }

      return { success: true };
    }),
});
