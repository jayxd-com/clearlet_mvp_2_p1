import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, protectedProcedure, router, adminProcedure } from "../trpc";
import { getDb } from "../db";
import {
  chatbotConversations,
  chatbotMessages,
  chatbotLeads,
} from "../../drizzle/schema";
import { processMessage } from "../chatbot-engine";
import { eq, desc } from "drizzle-orm";

export const chatbotRouter = router({
  createConversation: publicProcedure
    .input(z.object({ language: z.enum(["en", "es"]).default("en") }))
    .mutation(async ({ input }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const sessionId = `session_${Date.now()}`;
      await db.insert(chatbotConversations).values({
        sessionId,
        language: input.language,
        status: "active",
      });

      return { conversationId: sessionId };
    }),

  sendMessage: publicProcedure
    .input(z.object({
      conversationId: z.string(),
      message: z.string(),
      language: z.enum(["en", "es"]).default("en"),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const conv = await db.query.chatbotConversations.findFirst({
        where: eq(chatbotConversations.sessionId, input.conversationId),
      });

      if (!conv) throw new TRPCError({ code: "NOT_FOUND" });

      // Save user message
      await db.insert(chatbotMessages).values({
        conversationId: conv.id,
        sender: "user",
        message: input.message,
      });

      // Get bot response
      const botResponse = await processMessage(input.message, input.language);

      // Save bot message
      await db.insert(chatbotMessages).values({
        conversationId: conv.id,
        sender: "bot",
        message: botResponse.message,
        intent: botResponse.intent,
        confidence: botResponse.confidence.toString(),
      });

      return botResponse;
    }),

  captureLead: publicProcedure
    .input(z.object({
      conversationId: z.string(),
      name: z.string(),
      email: z.string().email(),
      phone: z.string(),
      userType: z.enum(["tenant", "landlord", "both"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const conv = await db.query.chatbotConversations.findFirst({
        where: eq(chatbotConversations.sessionId, input.conversationId),
      });

      const [result] = await db.insert(chatbotLeads).values({
        name: input.name,
        email: input.email,
        phone: input.phone,
        userType: input.userType as any, // Cast if needed, or schema handles it
        interest: input.userType, // Save userType to interest column as requested
        conversationId: conv?.id,
      });

      if (conv) {
        await db.update(chatbotConversations)
          .set({ leadId: result.insertId, status: "lead_captured" })
          .where(eq(chatbotConversations.id, conv.id));
      }

      return { success: true };
    }),

  getLeads: adminProcedure.query(async () => {
    const db = await getDb() as any;
    return await db.query.chatbotLeads.findMany({
      orderBy: [desc(chatbotLeads.createdAt)],
    });
  }),
});
