import { router, protectedProcedure, publicProcedure } from "../trpc";
import { z } from "zod";
import { getDb } from "../db";
import { messages, users, properties } from "../../drizzle/schema";
import { eq, and, or, sql, desc, asc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const messagesRouter = router({
  listConversations: protectedProcedure.query(async ({ ctx }) => {
    console.log(`[messages.listConversations] Fetching for user ID: ${ctx.user.id}`);
    try {
      const db = await getDb() as any;
      if (!db) {
        console.error("[messages.listConversations] DB not available");
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      // Fetch all messages involving the user
      const userMessages = await db.query.messages.findMany({
        where: (messages: any, { or, eq }: any) => or(
          eq(messages.senderId, ctx.user.id),
          eq(messages.recipientId, ctx.user.id)
        ),
        orderBy: (messages: any, { desc }: any) => [desc(messages.createdAt)],
      });

      console.log(`[messages.listConversations] Found ${userMessages.length} total messages`);

      const conversationsMap = new Map();

      for (const msg of userMessages) {
        const partnerId = msg.senderId === ctx.user.id ? msg.recipientId : msg.senderId;
        if (!conversationsMap.has(partnerId)) {
          const partner = await db.query.users.findFirst({
            where: (users: any, { eq }: any) => eq(users.id, partnerId),
          });

          conversationsMap.set(partnerId, {
            partnerId,
            partnerName: partner?.name || "Unknown User",
            partnerEmail: partner?.email || "",
            lastMessage: msg.content,
            lastMessageTime: msg.createdAt,
            unreadCount: msg.recipientId === ctx.user.id && !msg.isRead ? 1 : 0,
          });
        } else if (msg.recipientId === ctx.user.id && !msg.isRead) {
          conversationsMap.get(partnerId).unreadCount++;
        }
      }

      const result = Array.from(conversationsMap.values());
      console.log(`[messages.listConversations] Returning ${result.length} unique conversations`);
      return result;
    } catch (error: any) {
      console.error("[messages.listConversations] Error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message || "An unexpected error occurred",
      });
    }
  }),

  getConversation: protectedProcedure
    .input(z.number())
    .query(async ({ ctx, input: partnerId }) => {
      console.log(`[messages.getConversation] Fetching history with partner: ${partnerId}`);
      try {
        const db = await getDb() as any;
        if (!db) {
          console.error("[messages.getConversation] DB not available");
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        }

        // Mark messages as read
        await db.update(messages)
          .set({ isRead: true })
          .where(and(
            eq(messages.senderId, partnerId),
            eq(messages.recipientId, ctx.user.id),
            eq(messages.isRead, false)
          ));

        const conversation = await db.query.messages.findMany({
          where: or(
            and(eq(messages.senderId, ctx.user.id), eq(messages.recipientId, partnerId)),
            and(eq(messages.senderId, partnerId), eq(messages.recipientId, ctx.user.id))
          ),
          orderBy: [asc(messages.createdAt)],
        });

        console.log(`[messages.getConversation] Found ${conversation.length} messages`);
        return conversation;
      } catch (error: any) {
        console.error("[messages.getConversation] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "An unexpected error occurred",
        });
      }
    }),

  send: protectedProcedure
    .input(z.object({
      recipientId: z.number(),
      content: z.string(),
      propertyId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [result] = await db.insert(messages).values({
        senderId: ctx.user.id,
        recipientId: input.recipientId,
        content: input.content,
        propertyId: input.propertyId,
        isRead: false,
      });

      return { id: result.insertId };
    }),

  getUserInfo: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const user = await db.query.users.findFirst({
        where: eq(users.id, input.userId),
      });

      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });

      return {
        id: user.id,
        name: user.name,
        email: user.email,
      };
    }),

  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb() as any;
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(and(
        eq(messages.recipientId, ctx.user.id),
        eq(messages.isRead, false)
      ));

    return Number(result[0]?.count || 0);
  }),
});
