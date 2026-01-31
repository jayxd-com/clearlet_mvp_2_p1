import { z } from "zod";
import { adminProcedure, router } from "../trpc";
import { getDb } from "../db";
import { eq, sql, desc, and } from "drizzle-orm";
import { siteRoles, userRoles, users, auditLogs } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";

export const adminRbacRouter = router({
  // --- Roles Management ---

  getRoles: adminProcedure.query(async () => {
    const db = await getDb() as any;
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    return await db.select().from(siteRoles).orderBy(desc(siteRoles.createdAt));
  }),

  createRole: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      permissions: z.array(z.string()),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Check if role name exists
      const existing = await db.select().from(siteRoles).where(eq(siteRoles.name, input.name));
      if (existing.length > 0) {
        throw new TRPCError({ code: "CONFLICT", message: "Role with this name already exists" });
      }

      await db.insert(siteRoles).values({
        name: input.name,
        description: input.description,
        permissions: JSON.stringify(input.permissions),
        isSystem: false,
      });

      // Audit Log
      await db.insert(auditLogs).values({
        adminId: ctx.user.id,
        action: "role_created",
        resourceType: "role",
        details: JSON.stringify({ name: input.name, permissions: input.permissions }),
        createdAt: new Date(),
      });

      return { success: true };
    }),

  updateRole: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1),
      description: z.string().optional(),
      permissions: z.array(z.string()),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const role = await db.select().from(siteRoles).where(eq(siteRoles.id, input.id));
      if (!role.length) throw new TRPCError({ code: "NOT_FOUND", message: "Role not found" });

      // System roles constraint check (optional, but good practice to prevent breaking core roles if any)
      // if (role[0].isSystem) ...

      await db.update(siteRoles)
        .set({
          name: input.name,
          description: input.description,
          permissions: JSON.stringify(input.permissions),
          updatedAt: new Date(),
        })
        .where(eq(siteRoles.id, input.id));

      // Audit Log
      await db.insert(auditLogs).values({
        adminId: ctx.user.id,
        action: "role_updated",
        resourceType: "role",
        resourceId: input.id,
        details: JSON.stringify({ name: input.name }),
        createdAt: new Date(),
      });

      return { success: true };
    }),

  deleteRole: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const role = await db.select().from(siteRoles).where(eq(siteRoles.id, input.id));
      if (!role.length) throw new TRPCError({ code: "NOT_FOUND", message: "Role not found" });

      if (role[0].isSystem) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Cannot delete system roles" });
      }

      // Check if users are assigned to this role
      const assignments = await db.select().from(userRoles).where(eq(userRoles.roleId, input.id));
      if (assignments.length > 0) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Cannot delete role with assigned users" });
      }

      await db.delete(siteRoles).where(eq(siteRoles.id, input.id));

      // Audit Log
      await db.insert(auditLogs).values({
        adminId: ctx.user.id,
        action: "role_deleted",
        resourceType: "role",
        resourceId: input.id,
        details: JSON.stringify({ name: role[0].name }),
        createdAt: new Date(),
      });

      return { success: true };
    }),

  // --- Admin Users Management ---

  getAdminUsers: adminProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(10),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const page = input?.page || 1;
      const limit = input?.limit || 10;
      const offset = (page - 1) * limit;

      // Get total count first
      const countResult = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.role, "admin"));
      const total = Number(countResult[0]?.count || 0);

      // Fetch users with role='admin' paginated
      const admins = await db.select()
        .from(users)
        .where(eq(users.role, "admin"))
        .limit(limit)
        .offset(offset)
        .orderBy(desc(users.createdAt));

      // Fetch their assigned custom roles
      if (db.query?.users && admins.length > 0) {
        const adminIds = admins.map((a: any) => a.id);
        
        const userRolesList = await db.select({
            userId: userRoles.userId,
            roleName: siteRoles.name,
            roleId: siteRoles.id
          })
          .from(userRoles)
          .innerJoin(siteRoles, eq(userRoles.roleId, siteRoles.id))
          .where(sql`${userRoles.userId} IN ${adminIds}`);

        const usersWithRoles = admins.map((admin: any) => {
            const role = userRolesList.find((ur: any) => ur.userId === admin.id);
            return {
                ...admin,
                assignedRole: role ? { id: role.roleId, name: role.roleName } : null
            };
        });

        return {
          users: usersWithRoles,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          }
        };
      }
      
      return {
        users: admins.map((a: any) => ({ ...a, assignedRole: null })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        }
      };
    }),

  assignRoleToUser: adminProcedure
    .input(z.object({
      userId: z.number(),
      roleId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Check if user exists and is admin
      const targetUser = await db.select().from(users).where(eq(users.id, input.userId));
      if (!targetUser.length) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      
      // Ensure user is an admin (or promote them?)
      // Requirement: "Admin User Management where admin can add more admins"
      // So if they aren't admin, we should promote them.
      if (targetUser[0].role !== 'admin') {
          await db.update(users).set({ role: 'admin', userType: 'admin' }).where(eq(users.id, input.userId));
      }

      // Check if role exists
      const role = await db.select().from(siteRoles).where(eq(siteRoles.id, input.roleId));
      if (!role.length) throw new TRPCError({ code: "NOT_FOUND", message: "Role not found" });

      // Assign role (upsert logic to replace existing role if we enforce 1 role per admin)
      // First delete existing assignments
      await db.delete(userRoles).where(eq(userRoles.userId, input.userId));
      
      // Insert new
      await db.insert(userRoles).values({
          userId: input.userId,
          roleId: input.roleId,
          assignedBy: ctx.user.id,
      });

      return { success: true };
    }),

  removeAdminAccess: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input, ctx }) => {
        const db = await getDb() as any;
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        if (input.userId === ctx.user.id) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot remove your own admin access" });
        }

        // Demote to user
        await db.update(users).set({ role: 'user', userType: 'tenant' }).where(eq(users.id, input.userId)); // Defaulting back to tenant? Or keep previous? Safe bet is tenant for now.

        // Remove role assignments
        await db.delete(userRoles).where(eq(userRoles.userId, input.userId));

        return { success: true };
    }),

  inviteAdminUser: adminProcedure
    .input(z.object({
      email: z.string().email(),
      name: z.string().min(1),
      roleId: z.string().optional(), // Optional custom role ID to assign immediately
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Check if user exists
      const existingUser = await db.select().from(users).where(eq(users.email, input.email));
      
      let userId: number;

      if (existingUser.length > 0) {
        // User exists, promote to admin
        userId = existingUser[0].id;
        await db.update(users)
          .set({ role: 'admin', userType: 'admin' })
          .where(eq(users.id, userId));
      } else {
        // Create new user
        const passwordHash = await bcrypt.hash("ClearLetAdmin123!", 10);
        const [result] = await db.insert(users).values({
          email: input.email,
          name: input.name,
          passwordHash,
          role: 'admin',
          userType: 'admin',
          verificationStatus: 'verified',
          profileComplete: true,
        });
        userId = result.insertId;
      }

      // Assign custom role if provided
      if (input.roleId) {
        await db.delete(userRoles).where(eq(userRoles.userId, userId));
        await db.insert(userRoles).values({
          userId: userId,
          roleId: parseInt(input.roleId),
          assignedBy: ctx.user.id,
        });
      }

      // Audit Log
      await db.insert(auditLogs).values({
        adminId: ctx.user.id,
        action: existingUser.length > 0 ? "user_promoted_admin" : "admin_created",
        resourceType: "user",
        resourceId: userId,
        details: JSON.stringify({ email: input.email, assignedRole: input.roleId }),
        createdAt: new Date(),
      });

      return { success: true, isNewUser: existingUser.length === 0 };
    }),
});
