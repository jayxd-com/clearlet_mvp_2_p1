import { z } from "zod";
import { adminProcedure, router } from "../trpc";
import { getDb, calculateAndSaveTenantScore, getUserProfile } from "../db";
import { isProfileComplete } from "../utils/profile";
import { eq, sql, and, gte, lte, desc, ne } from "drizzle-orm";
import { users, properties, contracts, payments, applications, maintenanceRequests, documents, auditLogs, chatbotLeads, chatbotMessages, chatbotConversations, analyticsEvents, documentVault, userProfiles } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";
import { createPresignedDownloadUrl, deleteObject } from "../s3";
import { ENV } from "../env";
import { notifyDocumentVerified, notifyProfileStatusChanged } from "../notifications-service";
import { awardUserForActivity } from "../owner-earnings-service";
import { REWARD_AMOUNTS } from "../config/rewards";

// Helper to sign URLs if they point to private storage
async function signDocumentUrl(fileUrl: string): Promise<string> {
  if (!fileUrl) return fileUrl;
  
  const bucketName = ENV.awsBucketName || "clearlet-uploads";
  
  // Check if it's an S3/MinIO URL
  if (fileUrl.includes(`/${bucketName}/`) || fileUrl.includes("amazonaws.com")) {
    try {
      // Extract the key. 
      let key = "";
      if (fileUrl.includes(`/${bucketName}/`)) {
        const parts = fileUrl.split(`/${bucketName}/`);
        if (parts.length > 1) key = parts[1];
      } else {
        // Fallback for standard S3 URLs
        const url = new URL(fileUrl);
        key = url.pathname.substring(1); 
      }

      if (key) {
        // console.log(`[signDocumentUrl] Signing key: ${key}`);
        return await createPresignedDownloadUrl(key);
      }
    } catch (e) {
      console.warn("Failed to sign URL:", fileUrl, e);
    }
  }
  return fileUrl;
}

export const crmRouter = router({
  getUserTimeline: adminProcedure
    .input(z.number())
    .query(async ({ input: userId }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      return db.query.analyticsEvents.findMany({
        where: eq(analyticsEvents.userId, userId),
        orderBy: [desc(analyticsEvents.eventTimestamp)],
        limit: 50,
      });
    }),

  getLeads: adminProcedure
    .input(
      z.object({
        search: z.string().optional(),
        status: z.enum(["new", "contacted", "qualified", "converted", "rejected"]).optional(),
        page: z.number().default(1),
        limit: z.number().default(10),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const page = input?.page || 1;
      const limit = input?.limit || 10;
      const offset = (page - 1) * limit;

      const conditions = [];
      if (input?.status) {
        conditions.push(eq(chatbotLeads.status, input.status));
      }
      if (input?.search) {
        const searchPattern = `%${input.search}%`;
        conditions.push(sql`(${chatbotLeads.name} LIKE ${searchPattern} OR ${chatbotLeads.email} LIKE ${searchPattern} OR ${chatbotLeads.interest} LIKE ${searchPattern})`);
      }

      const leads = await db.query.chatbotLeads.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        orderBy: [desc(chatbotLeads.createdAt)],
        limit: limit,
        offset: offset,
      });

      const [totalResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(chatbotLeads)
        .where(conditions.length > 0 ? and(...conditions) : undefined);
        
      const total = Number(totalResult?.count || 0);

      const activeCountResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(chatbotConversations)
        .where(eq(chatbotConversations.status, "active"));
      
      return {
        leads,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        stats: {
          total: total,
          activeConversations: Number(activeCountResult[0]?.count || 0)
        }
      };
    }),

  getLeadConversation: adminProcedure
    .input(z.object({ leadId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Find the conversation associated with this lead
      // We can look up via leadId in chatbotConversations or conversationId in chatbotLeads
      // Using chatbotLeads.conversationId is more direct if populated
      const lead = await db.query.chatbotLeads.findFirst({
        where: eq(chatbotLeads.id, input.leadId),
      });

      if (!lead || !lead.conversationId) return [];

      const messages = await db.query.chatbotMessages.findMany({
        where: eq(chatbotMessages.conversationId, lead.conversationId),
        orderBy: [sql`${chatbotMessages.createdAt} ASC`],
      });

      return messages;
    }),

  getLeadDetails: adminProcedure
    .input(z.object({ leadId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const lead = await db.query.chatbotLeads.findFirst({
        where: eq(chatbotLeads.id, input.leadId),
      });

      if (!lead) throw new TRPCError({ code: "NOT_FOUND", message: "Lead not found" });

      // Fetch history from audit logs
      const history = await db.query.auditLogs.findMany({
        where: and(
          eq(auditLogs.resourceType, "lead"),
          eq(auditLogs.resourceId, input.leadId)
        ),
        orderBy: [desc(auditLogs.createdAt)],
        with: {
          admin: true
        }
      });

      return {
        ...lead,
        history: history.map((log: any) => ({
          id: log.id,
          action: log.action,
          details: log.details,
          createdAt: log.createdAt,
          adminName: log.admin?.name || "System"
        }))
      };
    }),

  updateLeadNotes: adminProcedure
    .input(z.object({ leadId: z.number(), notes: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db.update(chatbotLeads)
        .set({ notes: input.notes, updatedAt: new Date() })
        .where(eq(chatbotLeads.id, input.leadId));

      return { success: true };
    }),

  scheduleFollowUp: adminProcedure
    .input(z.object({ leadId: z.number(), date: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const followUpDate = new Date(input.date);

      await db.update(chatbotLeads)
        .set({ nextFollowUpDate: followUpDate, updatedAt: new Date() })
        .where(eq(chatbotLeads.id, input.leadId));

      try {
        await db.insert(auditLogs).values({
          adminId: ctx.user.id,
          action: "lead_follow_up_scheduled",
          resourceType: "lead",
          resourceId: input.leadId,
          details: JSON.stringify({ date: input.date }),
          createdAt: new Date(),
        });
      } catch (e) {
        console.error("Failed to log follow-up:", e);
      }

      return { success: true };
    }),

  deleteLead: adminProcedure
    .input(z.object({ leadId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const lead = await db.query.chatbotLeads.findFirst({
        where: eq(chatbotLeads.id, input.leadId),
      });

      if (!lead) throw new TRPCError({ code: "NOT_FOUND", message: "Lead not found" });

      // Delete lead
      await db.delete(chatbotLeads).where(eq(chatbotLeads.id, input.leadId));

      try {
        await db.insert(auditLogs).values({
          adminId: ctx.user.id,
          action: "lead_deleted",
          resourceType: "lead",
          resourceId: input.leadId,
          details: JSON.stringify({ email: lead.email, name: lead.name }),
          createdAt: new Date(),
        });
      } catch (e) {
        console.error("Failed to log lead deletion:", e);
      }

      return { success: true };
    }),

  updateLeadStatus: adminProcedure
    .input(
      z.object({
        leadId: z.number(),
        status: z.enum(["new", "contacted", "qualified", "converted", "rejected"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db
        .update(chatbotLeads)
        .set({
          status: input.status,
          updatedAt: new Date(),
        })
        .where(eq(chatbotLeads.id, input.leadId));

      try {
        await db.insert(auditLogs).values({
          adminId: ctx.user.id,
          action: `lead_status_${input.status}`,
          resourceType: "lead",
          resourceId: input.leadId,
          details: JSON.stringify({ status: input.status }),
          createdAt: new Date(),
        });
      } catch (e) {
        console.error("Failed to record audit log:", e);
      }

      return { success: true };
    }),

  getUsers: adminProcedure
    .input(
      z.object({
        userType: z.enum(["tenant", "landlord"]).optional(),
        verificationStatus: z.enum(["unverified", "pending", "verified"]).optional(),
        search: z.string().optional(),
        page: z.number().default(1),
        limit: z.number().default(20),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const page = input?.page || 1;
      const limit = input?.limit || 20;
      const offset = (page - 1) * limit;

      const dbAny = db as any;
      const conditions = [ne(users.role, "admin")]; // Always exclude admin users from CRM management
      if (input?.userType) {
        conditions.push(eq(users.userType, input.userType));
      }
      if (input?.verificationStatus) {
        conditions.push(eq(users.verificationStatus, input.verificationStatus));
      }
      if (input?.search) {
        const searchPattern = `%${input.search}%`;
        conditions.push(sql`(${users.name} LIKE ${searchPattern} OR ${users.email} LIKE ${searchPattern} OR ${userProfiles.dniNie} LIKE ${searchPattern})`);
      }

      const allUsers = await db
        .select({
          user: users,
          profile: userProfiles,
        })
        .from(users)
        .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
        .where(and(...conditions))
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset);

      const [totalResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
        .where(and(...conditions));
        
      const total = Number(totalResult?.count || 0);

      return {
        users: allUsers.map((row: any) => ({
          ...row.user,
          dniNie: row.profile?.dniNie,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }),

  getUserDetails: adminProcedure
    .input(z.number())
    .query(async ({ input: userId }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });

      const userProperties = await db.select().from(properties).where(eq(properties.userId, userId));
      
      const userContracts = await db
        .select()
        .from(contracts)
        .where(sql`${contracts.tenantId} = ${userId} OR ${contracts.landlordId} = ${userId}`);

      const userApplications = await db.select().from(applications).where(eq(applications.userId, userId));
      const userPayments = await db.select().from(payments).where(eq(payments.tenantId, userId));
      
      const userMaintenance = await db
        .select()
        .from(maintenanceRequests)
        .where(sql`${maintenanceRequests.tenantId} = ${userId} OR ${maintenanceRequests.landlordId} = ${userId}`);

      const rawUserDocuments = await db.select().from(documents).where(eq(documents.userId, userId));
      const userDocuments = await Promise.all(rawUserDocuments.map(async (doc: any) => ({
        ...doc,
        fileUrl: await signDocumentUrl(doc.fileUrl)
      })));

      // Fetch property documents (ownership proofs)
      const propertyIds = userProperties.map((p: any) => p.id);
      let propertyDocuments: any[] = [];
      
      if (propertyIds.length > 0) {
        const rawPropDocs = await db.select()
          .from(documentVault)
          .where(sql`${documentVault.propertyId} IN ${propertyIds}`);
          
        propertyDocuments = await Promise.all(rawPropDocs.map(async (doc: any) => ({
          ...doc,
          fileUrl: await signDocumentUrl(doc.fileUrl)
        })));
      }

      return {
        user: user,
        properties: userProperties,
        contracts: userContracts,
        applications: userApplications,
        payments: userPayments,
        maintenanceRequests: userMaintenance,
        documents: userDocuments,
        propertyDocuments, // Add this
      };
    }),

  updateUserVerification: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        status: z.enum(["unverified", "pending", "verified"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Enforce profile completion before verifying
      if (input.status === "verified") {
        const targetUser = await db.query.users.findFirst({ where: eq(users.id, input.userId) });
        const targetProfile = await getUserProfile(input.userId);
        
        if (!isProfileComplete(targetUser, targetProfile)) {
          throw new TRPCError({ 
            code: "PRECONDITION_FAILED", 
            message: "User profile is incomplete. Personal details and location must be filled before verification." 
          });
        }
      }

      await db
        .update(users)
        .set({
          verificationStatus: input.status,
          updatedAt: new Date(),
        })
        .where(eq(users.id, input.userId));

      // Record audit log
      try {
        await db.insert(auditLogs).values({
          adminId: ctx.user.id,
          action: `user_verification_${input.status}`,
          resourceType: "user",
          resourceId: input.userId,
          details: JSON.stringify({ previousStatus: "unknown", newStatus: input.status }),
          createdAt: new Date(),
        });

        // Award ClearCoins if verified
        if (input.status === "verified") {
          await awardUserForActivity({
            userId: input.userId,
            activityType: "PROFILE_VERIFIED",
            amount: REWARD_AMOUNTS.PROFILE_VERIFIED,
            description: "Your profile has been verified!",
          });
        }

        // Notify user of status change (verified, pending, or unverified)
        await notifyProfileStatusChanged({
          userId: input.userId,
          status: input.status,
        });
      } catch (e) {
        console.error("Failed to record audit log or award coins:", e);
      }

      return { success: true };
    }),

  updateUserType: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        userType: z.enum(["tenant", "landlord", "buyer", "seller", "admin"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db.update(users).set({ userType: input.userType }).where(eq(users.id, input.userId));

      try {
        await db.insert(auditLogs).values({
          adminId: ctx.user.id,
          action: `user_type_${input.userType}`,
          resourceType: "user",
          resourceId: input.userId,
          details: JSON.stringify({ userType: input.userType }),
          createdAt: new Date(),
        });
      } catch (e) {
        console.error("Failed to record audit log:", e);
      }

      return { success: true };
    }),

  deleteUser: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      if (input.userId === ctx.user.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot delete your own account" });
      }

      // Soft delete: Anonymize data
      await db
        .update(users)
        .set({
          name: "Deleted User",
          email: null,
          phone: null,
          passwordHash: null,
          verificationStatus: "unverified",
        })
        .where(eq(users.id, input.userId));

      try {
        await db.insert(auditLogs).values({
          adminId: ctx.user.id,
          action: "user_deleted",
          resourceType: "user",
          resourceId: input.userId,
          details: JSON.stringify({ reason: "Admin deleted" }),
          createdAt: new Date(),
        });
      } catch (e) {
        console.error("Failed to record audit log:", e);
      }

      return { success: true };
    }),

  getConversionFunnel: adminProcedure.query(async () => {
    const db = await getDb() as any;
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const funnel = await db
      .select({
        totalApplications: sql<number>`count(*)`,
        approvedApplications: sql<number>`sum(case when status = 'approved' then 1 else 0 end)`,
      })
      .from(applications);
    
    const contractsStats = await db
      .select({
        signedContracts: sql<number>`count(case when status in ('pending_signatures', 'fully_signed', 'active') then 1 end)`,
        activeContracts: sql<number>`count(case when status = 'active' then 1 end)`,
      })
      .from(contracts);

    const totalApps = Number(funnel[0]?.totalApplications || 0);
    const approvedApps = Number(funnel[0]?.approvedApplications || 0);
    const signed = Number(contractsStats[0]?.signedContracts || 0);
    const active = Number(contractsStats[0]?.activeContracts || 0);

    return {
      applications: totalApps,
      approved: approvedApps,
      signed: signed,
      active: active,
      conversionRate: {
        approvalRate: totalApps > 0 ? (approvedApps / totalApps) * 100 : 0,
        signingRate: approvedApps > 0 ? (signed / approvedApps) * 100 : 0,
        activationRate: signed > 0 ? (active / signed) * 100 : 0,
      },
    };
  }),

  topProperties: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(20).default(10),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Count applications per property
      const topProps = await db
        .select({
          propertyId: properties.id,
          title: properties.title,
          city: properties.city,
          // Note: Subqueries in select are tricky in Drizzle without 'sql' helper
          applicationCount: sql<number>`(select count(*) from applications where applications.propertyId = properties.id)`,
        })
        .from(properties)
        .orderBy(sql`applicationCount desc`)
        .limit(input.limit);

      return topProps;
    }),

  updatePropertyVerification: adminProcedure
    .input(
      z.object({
        propertyId: z.number(),
        verified: z.boolean(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db
        .update(properties)
        .set({
          verifiedLandlord: input.verified,
          status: input.verified ? "active" : "pending_verification",
          updatedAt: new Date(),
        })
        .where(eq(properties.id, input.propertyId));

      // Record audit log
      try {
        await db.insert(auditLogs).values({
          adminId: ctx.user.id,
          action: `property_verification_${input.verified}`,
          resourceType: "property",
          resourceId: input.propertyId,
          details: JSON.stringify({ verified: input.verified }),
          createdAt: new Date(),
        });
      } catch (e) {
        console.error("Failed to record audit log:", e);
      }

      return { success: true };
    }),

  getAnalytics: adminProcedure.query(async () => {
    const db = await getDb() as any;
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const totalUsers = await db.select({ count: sql<number>`count(*)` }).from(users);
    const totalProperties = await db.select({ count: sql<number>`count(*)` }).from(properties);
    const totalContracts = await db.select({ count: sql<number>`count(*)` }).from(contracts);
    const totalRevenue = await db.select({ sum: sql<number>`sum(amount)` }).from(payments).where(eq(payments.status, "completed"));
    const totalPlatformRevenue = await db.select({ sum: sql<number>`sum(platformFee)` }).from(payments).where(eq(payments.status, "completed"));

    const tenants = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.userType, "tenant"));
    const landlords = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.userType, "landlord"));

    return {
      overview: {
        totalUsers: Number(totalUsers[0]?.count || 0),
        totalTenants: Number(tenants[0]?.count || 0),
        totalLandlords: Number(landlords[0]?.count || 0),
        totalProperties: Number(totalProperties[0]?.count || 0),
        activeProperties: Number(totalProperties[0]?.count || 0), // Simplification
        totalContracts: Number(totalContracts[0]?.count || 0),
        activeContracts: Number(totalContracts[0]?.count || 0), // Simplification
        totalRevenue: Number(totalRevenue[0]?.sum || 0),
        totalPlatformRevenue: Number(totalPlatformRevenue[0]?.sum || 0),
      }
    };
  }),

  getSystemHealth: adminProcedure.query(async () => {
    const db = await getDb() as any;
    
    const pendingUsers = await db.select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.verificationStatus, "pending"));

    const pendingDocs = await db.select({ count: sql<number>`count(*)` })
      .from(documents)
      .where(eq(documents.verificationStatus, "pending"));

    return {
      database: db ? "connected" : "disconnected",
      errors: 0,
      pendingVerifications: Number(pendingUsers[0]?.count || 0),
      pendingDocuments: Number(pendingDocs[0]?.count || 0),
      overduePayments: 0,
      lastChecked: new Date().toISOString(),
    };
  }),

  getDocuments: adminProcedure.query(async () => {
    try {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const results = await db
        .select({
          document: documents,
          user: users,
        })
        .from(documents)
        .leftJoin(users, eq(documents.userId, users.id))
        .orderBy(desc(documents.createdAt));

      const signedResults = await Promise.all(results.map(async (row: any) => ({
        ...row.document,
        fileUrl: await signDocumentUrl(row.document.fileUrl),
        userName: row.user?.name || "Unknown",
        userEmail: row.user?.email || "Unknown",
      })));

      return signedResults;
    } catch (error) {
      console.error("Error in getDocuments:", error);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch documents" });
    }
  }),

  updateDocumentStatus: adminProcedure
    .input(
      z.object({
        documentId: z.number(),
        status: z.enum(["pending", "verified", "rejected"]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // 0. Fetch document to get userId and fileName for notification
      const doc = await db.query.documents.findFirst({
        where: eq(documents.id, input.documentId),
      });

      if (!doc) throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" });

      // 1. Update document status
      await db
        .update(documents)
        .set({
          verificationStatus: input.status,
          updatedAt: new Date(),
        })
        .where(eq(documents.id, input.documentId));

      // 2. Log action
      try {
        await db.insert(auditLogs).values({
          adminId: ctx.user.id,
          action: `document_${input.status}`,
          resourceType: "document",
          resourceId: input.documentId,
          details: JSON.stringify({ notes: input.notes }),
          createdAt: new Date(),
        });
      } catch (e) {
        console.error("Failed to record audit log:", e);
      }

      // 3. Notify User
      if (input.status === "verified" || input.status === "rejected") {
        try {
          await notifyDocumentVerified({
            userId: doc.userId,
            documentName: doc.fileName,
            status: input.status,
            notes: input.notes,
          });
        } catch (err) {
          console.error("Failed to send user notification:", err);
        }
      }

      // 4. Recalculate Tenant Score if verified
      if (input.status === "verified") {
        try {
          await calculateAndSaveTenantScore(doc.userId);
          
          // 5. AUTO-VERIFY ACCOUNT IF ALL REQ DOCS ARE VERIFIED
          const user = await db.query.users.findFirst({
            where: (users: any, { eq }: any) => eq(users.id, doc.userId),
          });

          if (user && user.verificationStatus !== 'verified') {
            const allDocs = await db.query.documents.findMany({
              where: (documents: any, { eq }: any) => eq(documents.userId, doc.userId),
            });

            const verifiedDocTypes = allDocs
              .filter((d: any) => d.verificationStatus === 'verified')
              .map((d: any) => d.documentType);

            const requiredTypes = user.userType === 'tenant' 
              ? ["id", "income", "employment", "reference"]
              : ["id"];

            const isFullyVerified = requiredTypes.every(type => verifiedDocTypes.includes(type));

            if (isFullyVerified) {
              // Check profile completeness before auto-verifying
              const targetProfile = await getUserProfile(user.id);
              if (isProfileComplete(user, targetProfile)) {
                await db.update(users)
                  .set({ verificationStatus: 'verified', updatedAt: new Date() })
                  .where(eq(users.id, user.id));

                // Log auto-verification
                await db.insert(auditLogs).values({
                  adminId: ctx.user.id,
                  action: "user_auto_verified",
                  resourceType: "user",
                  resourceId: user.id,
                  details: JSON.stringify({ reason: "All required documents verified" }),
                  createdAt: new Date(),
                });

                // Award Coins
                await awardUserForActivity({
                  userId: user.id,
                  activityType: "PROFILE_VERIFIED",
                  amount: REWARD_AMOUNTS.PROFILE_VERIFIED,
                  description: "Your profile has been auto-verified after document approval!",
                });

                // Notify User
                await notifyProfileStatusChanged({
                  userId: user.id,
                  status: "verified",
                });
              }
            }
          }
        } catch (err) {
          console.error("Failed to update tenant score or auto-verify:", err);
        }
      }

      return { success: true };
    }),

  deleteDocument: adminProcedure
    .input(z.object({ documentId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const doc = await db.query.documents.findFirst({
        where: eq(documents.id, input.documentId),
      });

      if (!doc) throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" });

      // Extract Key and Delete from S3
      if (doc.fileUrl) {
        try {
          const urlParts = doc.fileUrl.split("/");
          // Try to find the 'uploads' segment to construct the key
          const keyIndex = urlParts.findIndex((p: string) => p === "uploads");
          if (keyIndex !== -1) {
            const key = urlParts.slice(keyIndex).join("/");
            await deleteObject(key);
          } else if (doc.fileUrl.includes("amazonaws.com")) {
             // Fallback for AWS URLs if structure is different
             const path = new URL(doc.fileUrl).pathname;
             const key = path.substring(1); // remove leading slash
             await deleteObject(key);
          }
        } catch (e) {
          console.error("Failed to delete file from S3:", e);
          // We continue to delete from DB to keep state clean
        }
      }

      // Delete from DB
      await db.delete(documents).where(eq(documents.id, input.documentId));

      // Audit Log
      try {
        await db.insert(auditLogs).values({
          adminId: ctx.user.id,
          action: "document_deleted",
          resourceType: "document",
          resourceId: input.documentId,
          details: JSON.stringify({ fileName: doc.fileName, reason: "Admin deleted" }),
          createdAt: new Date(),
        });
      } catch (e) {
        console.error("Failed to record audit log:", e);
      }

      return { success: true };
    }),

  getAuditLogs: adminProcedure.input(z.object({ limit: z.number(), offset: z.number() })).query(async ({ input }) => {
    try {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const results = await db
        .select({
          log: auditLogs,
          admin: users,
        })
        .from(auditLogs)
        .leftJoin(users, eq(auditLogs.adminId, users.id))
        .orderBy(desc(auditLogs.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return results.map((row: any) => ({
        ...row.log,
        adminName: row.admin?.name || "Unknown Admin",
      }));
    } catch (error) {
      console.error("Error in getAuditLogs:", error);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch audit logs" });
    }
  }),

  // Add procedures for enhanced analytics page
  getOverview: adminProcedure.query(async () => {
    const db = await getDb() as any;
    const totalUsers = await db.select({ count: sql<number>`count(*)` }).from(users);
    const verifiedUsers = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.verificationStatus, "verified"));
    const totalProperties = await db.select({ count: sql<number>`count(*)` }).from(properties);
    const totalApplications = await db.select({ count: sql<number>`count(*)` }).from(applications);
    const pendingApps = await db.select({ count: sql<number>`count(*)` }).from(applications).where(eq(applications.status, "pending"));
    const totalRevenue = await db.select({ sum: sql<number>`sum(amount)` }).from(payments).where(eq(payments.status, "completed"));
    const totalPlatformRevenue = await db.select({ sum: sql<number>`sum(platformFee)` }).from(payments).where(eq(payments.status, "completed"));
    const activeContracts = await db.select({ count: sql<number>`count(*)` }).from(contracts).where(eq(contracts.status, "active"));

    return {
      current: {
        totalUsers: Number(totalUsers[0]?.count || 0),
        verifiedUsers: Number(verifiedUsers[0]?.count || 0),
        totalProperties: Number(totalProperties[0]?.count || 0),
        totalApplications: Number(totalApplications[0]?.count || 0),
        pendingApplications: Number(pendingApps[0]?.count || 0),
        totalRevenue: Number(totalRevenue[0]?.sum || 0),
        totalPlatformRevenue: Number(totalPlatformRevenue[0]?.sum || 0),
        activeContracts: Number(activeContracts[0]?.count || 0),
      },
      growth: {
        users: 5, // Mock growth
        properties: 2,
      }
    };
  }),

  getUserGrowth: adminProcedure.input(z.object({ days: z.number() })).query(async () => {
    return [
      { date: new Date().toISOString(), count: 2 },
      { date: new Date(Date.now() - 86400000).toISOString(), count: 1 },
    ];
  }),

  getPropertyGrowth: adminProcedure.input(z.object({ days: z.number() })).query(async () => {
    return [
      { date: new Date().toISOString(), count: 1 },
    ];
  }),

  getRevenueGrowth: adminProcedure.input(z.object({ days: z.number() })).query(async () => {
    return [
      { date: new Date().toISOString(), total: 120000 },
    ];
  }),
});