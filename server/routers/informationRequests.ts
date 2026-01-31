import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import { getDb } from "../db";
import { informationRequests, informationRequestResponses, inquiries, properties, users } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const informationRequestsRouter = router({
  getMyPending: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const requests = await db.query.informationRequests.findMany({
        where: and(
          eq(informationRequests.tenantId, ctx.user.id),
          eq(informationRequests.status, "pending")
        ),
        with: {
          application: {
            with: {
              property: true,
            }
          },
          landlord: true,
        },
        orderBy: [desc(informationRequests.createdAt)],
      });

      return requests;
    }),

  respond: protectedProcedure
    .input(z.object({
      requestId: z.number(),
      responseMessage: z.string(),
      attachments: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const request = await db.query.informationRequests.findFirst({
        where: and(
          eq(informationRequests.id, input.requestId),
          eq(informationRequests.tenantId, ctx.user.id)
        ),
      });

      if (!request) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Request not found" });
      }

      // Create response
      await db.insert(informationRequestResponses).values({
        requestId: input.requestId,
        responseMessage: input.responseMessage,
        attachments: input.attachments ? JSON.stringify(input.attachments) : null,
      });

      // Update request status
      await db.update(informationRequests)
        .set({ status: "responded", respondedAt: new Date() })
        .where(eq(informationRequests.id, input.requestId));

      return { success: true };
    }),
});
