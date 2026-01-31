import { router, adminProcedure } from "../trpc";
import { z } from "zod";
import { getDb } from "../db";
import { properties, documentVault, users } from "../../drizzle/schema";
import { eq, desc, sql, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const adminPropertiesRouter = router({
  getAll: adminProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(10),
      search: z.string().optional(),
      status: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb() as any;
      const offset = (input.page - 1) * input.limit;

      let whereClause = undefined;
      const conditions = [];

      if (input.search) {
        conditions.push(sql`(${properties.title} LIKE ${`%${input.search}%`} OR ${properties.address} LIKE ${`%${input.search}%`})`);
      }
      
      if (input.status && input.status !== 'all') {
         conditions.push(eq(properties.status, input.status as any));
      }

      if (conditions.length > 0) {
        whereClause = and(...conditions);
      }

      // Use standard select with join to avoid MariaDB JSON syntax issues
      const rawItems = await db.select({
        property: properties,
        landlord: users
      })
      .from(properties)
      .leftJoin(users, eq(properties.userId, users.id))
      .where(whereClause)
      .limit(input.limit)
      .offset(offset)
      .orderBy(desc(properties.createdAt));

      // Map result to match expected structure
      const items = rawItems.map((item: any) => ({
        ...item.property,
        landlord: item.landlord
      }));

      const totalResult = await db.select({ count: sql<number>`count(*)` })
        .from(properties)
        .where(whereClause);
      
      const total = totalResult[0]?.count || 0;

      return {
        items,
        pagination: {
          total,
          totalPages: Math.ceil(total / input.limit),
          page: input.page,
          limit: input.limit
        }
      };
    }),

  approve: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb() as any;
      
      await db.update(properties)
        .set({ 
          verifiedLandlord: true,
          status: 'active'
        })
        .where(eq(properties.id, input.id));
        
      return { success: true };
    }),

  reject: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb() as any;
      
      await db.update(properties)
        .set({ 
          verifiedLandlord: false,
          status: 'inactive'
        })
        .where(eq(properties.id, input.id));
        
      return { success: true };
    }),

  updateStatus: adminProcedure
    .input(z.object({ 
      id: z.number(), 
      status: z.enum(["active", "inactive", "rented", "pending_verification"])
    }))
    .mutation(async ({ input }) => {
      const db = await getDb() as any;
      
      const prop = await db.query.properties.findFirst({
        where: eq(properties.id, input.id)
      });

      if (!prop) throw new TRPCError({ code: "NOT_FOUND" });
      
      if (!prop.verifiedLandlord) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Property must be approved first" });
      }

      await db.update(properties)
        .set({ status: input.status })
        .where(eq(properties.id, input.id));
        
      return { success: true };
    }),
    
  getDocuments: adminProcedure
    .input(z.object({ propertyId: z.number() }))
    .query(async ({ input }) => {
       const db = await getDb() as any;
       
       const docs = await db.query.documentVault.findMany({
         where: eq(documentVault.propertyId, input.propertyId)
       });
       
       return docs;
    })
});
