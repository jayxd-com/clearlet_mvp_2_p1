import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import {
  createNotification,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
} from "../db";

export const notificationsRouter = router({
  /**
   * Get all notifications for the current user
   */
  list: protectedProcedure
    .input(
      z
        .object({
          type: z.enum(["contract", "payment", "maintenance", "application", "system", "all"]).optional(),
          isRead: z.boolean().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      return getUserNotifications(ctx.user.id, input);
    }),

  /**
   * Get unread notification count
   */
  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    return getUnreadNotificationCount(ctx.user.id);
  }),

  /**
   * Mark a notification as read
   */
  markAsRead: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ input }) => {
      await markNotificationAsRead(input.notificationId);
      return { success: true };
    }),

  /**
   * Mark all notifications as read
   */
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    await markAllNotificationsAsRead(ctx.user.id);
    return { success: true };
  }),

  /**
   * Create a notification (internal use)
   */
  create: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        type: z.enum(["contract", "payment", "maintenance", "application", "system"]),
        title: z.string(),
        message: z.string(),
        link: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      await createNotification(input);
      return { success: true };
    }),
});
