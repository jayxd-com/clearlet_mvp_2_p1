import { eq, desc, asc, and, or, inArray, sql, lte, gte, like } from "drizzle-orm"; // Added gte, like
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../drizzle/schema";
import { InsertUser, users, properties, InsertProperty, documents, messages, InsertMessage, inquiries, InsertInquiry, siteRoles, InsertSiteRole, userRoles, auditLogs, InsertAuditLog, savedProperties, applications, InsertApplication, contracts, InsertContract, contractTemplates, InsertContractTemplate, payments, InsertPayment, maintenanceRequests, InsertMaintenanceRequest, maintenanceComments, InsertMaintenanceComment, documentVault, InsertDocumentVault, notifications, InsertNotification, contractAmendments, InsertContractAmendment, contractRenewals, InsertContractRenewal, analyticsEvents, InsertAnalyticsEvent, savedFilters, InsertSavedFilter, userProfiles, keyCollections, moveInChecklists, InsertMoveInChecklist, checklistTemplates, InsertChecklistTemplate, moveOutChecklists, disputes, disputeEvidence, disputeTimeline, disputeMessages, informationRequests, InsertInformationRequest, informationRequestResponses, InsertInformationRequestResponse } from "../drizzle/schema";
import { ENV } from './env';
import { calculateTenantScore } from './tenantScore';

let _db: ReturnType<typeof drizzle> | null = null;
let _connectionPool: mysql.Pool | null = null;

// Parse DATABASE_URL into connection config
function parseDatabaseUrl(url: string): mysql.PoolOptions {
  const urlPattern = /^mysql:\/\/([^:@]+)(?::([^@]+))?@([^:]+):(\d+)\/(.+)$/;
  const match = url.match(urlPattern);
  
  if (!match) {
    throw new Error(`Invalid DATABASE_URL format: ${url}. Expected: mysql://user:password@host:port/database`);
  }
  
  const [, user, password, host, port, database] = match;
  
  return {
    host,
    port: parseInt(port),
    user,
    password: password || undefined,
    database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  };
}

// Lazily create the drizzle instance
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const config = parseDatabaseUrl(process.env.DATABASE_URL);
      _connectionPool = mysql.createPool(config);
      _db = drizzle(_connectionPool, { schema, mode: "default" });
      console.log("[Database] Connected successfully");
    } catch (error) {
      console.error("[Database] Failed to connect:", error);
      _db = null;
      _connectionPool = null;
    }
  }
  return _db;
}

// Close database connection
export async function closeDb() {
  if (_connectionPool) {
    try {
      await _connectionPool.end();
      console.log("[Database] Connection pool closed");
      _db = null;
      _connectionPool = null;
    } catch (error) {
      console.error("[Database] Failed to close connection pool:", error);
    }
  }
}

export function getConnectionPool(): mysql.Pool | null {
  return _connectionPool;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const normalizedEmail = email.toLowerCase();
  const result = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);
  return result[0];
}

// ========================================
// Property Functions
// ========================================

export async function createProperty(data: InsertProperty) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  try {
    // Filter out fields that may not exist in the database table
    // Only include fields that are actually being sent
    const {
      allowPets,
      petDeposit,
      petRestrictions,
      checklistTemplateId,
      ...insertData
    } = data as any;
    
    // Explicitly select only the columns that exist in the database
    // This prevents Drizzle from trying to insert columns that don't exist
    const safeInsertData: any = {};
    const allowedFields = [
      'userId', 'title', 'description', 'address', 'city', 'country', 'zipCode',
      'latitude', 'longitude', 'bedrooms', 'bathrooms', 'squareFeet',
      'rentPrice', 'currency', 'amenities', 'images', 'status', 'verifiedLandlord'
    ];
    
    for (const field of allowedFields) {
      if (field in insertData) {
        let value = insertData[field];
        
        // Validate latitude/longitude ranges
        if (field === 'latitude') {
          const lat = parseFloat(value);
          if (isNaN(lat) || lat < -90 || lat > 90) {
            console.warn(`[createProperty] Invalid latitude value: ${value}, skipping`);
            continue; // Skip invalid latitude
          }
          value = lat.toString();
        } else if (field === 'longitude') {
          const lng = parseFloat(value);
          if (isNaN(lng) || lng < -180 || lng > 180) {
            console.warn(`[createProperty] Invalid longitude value: ${value}, skipping`);
            continue; // Skip invalid longitude
          }
          value = lng.toString();
        }
        
        // Stringify JSON fields
        if ((field === 'amenities' || field === 'images') && value && typeof value === 'object') {
          value = JSON.stringify(value);
        }
        
        safeInsertData[field] = value;
      }
    }
    
    // Use raw SQL to insert only the columns that exist in the database
    // Drizzle's insert() includes all schema columns with defaults, so we bypass it
    const columns = Object.keys(safeInsertData);
    const values = Object.values(safeInsertData);
    const placeholders = columns.map(() => '?').join(', ');
    const columnNames = columns.map(col => `\`${col}\``).join(', ');
    
    // Get the raw connection to execute the query
    const connection = _connectionPool;
    if (!connection) throw new Error("Database connection not available");
    
    const [result] = await connection.execute(
      `INSERT INTO \`properties\` (${columnNames}) VALUES (${placeholders})`,
      values
    ) as any;
    
    const insertId = Number(result?.insertId);
    
    if (!insertId || isNaN(insertId)) {
      throw new Error("Failed to get insert ID from database result");
    }
    
    // Fetch and return the created property using raw SQL to avoid schema columns that don't exist
    const selectColumns = [
      'id', 'userId', 'title', 'description', 'address', 'city', 'country', 'zipCode',
      'latitude', 'longitude', 'bedrooms', 'bathrooms', 'squareFeet',
      'rentPrice', 'currency', 'amenities', 'images', 'status', 'verifiedLandlord',
      'createdAt', 'updatedAt'
    ].map(col => `\`${col}\``).join(', ');
    
    const [rows] = await connection.execute(
      `SELECT ${selectColumns} FROM \`properties\` WHERE \`id\` = ? LIMIT 1`,
      [insertId]
    ) as any;
    
    if (!rows || rows.length === 0) {
      throw new Error(`Property created but could not be retrieved (ID: ${insertId})`);
    }
    
    return rows[0];
  } catch (error: any) {
    console.error("[createProperty] Database error:", error);
    throw new Error(`Failed to create property: ${error.message || error}`);
  }
}

export async function getProperties(filters?: { city?: string; maxPrice?: number; bedrooms?: number; minArea?: number }) {
  try {
    const db = await getDb();
    if (!db) {
      console.error("[getProperties] Database not available");
      return [];
    }
    
    // Try using Drizzle ORM first
    try {
      const conditions = [eq(properties.status, "active")];
      
      if (filters?.city) {
        conditions.push(like(properties.city, `%${filters.city}%`));
      }
      if (filters?.maxPrice) {
        conditions.push(lte(properties.rentPrice, filters.maxPrice * 100)); // Convert to cents
      }
      if (filters?.bedrooms) { // Added bedrooms filter
        conditions.push(gte(properties.bedrooms, filters.bedrooms));
      }
      if (filters?.minArea) { // Added minArea filter
        conditions.push(gte(properties.squareFeet, filters.minArea));
      }
      
      const result = await db.select().from(properties).where(and(...conditions)).orderBy(desc(properties.createdAt));
      console.log(`[getProperties] Successfully fetched ${result.length} properties using Drizzle`);
      return result;
    } catch (drizzleError: any) {
      console.warn(`[getProperties] Drizzle query failed, trying raw SQL:`, drizzleError?.message);
      
      // Fallback to raw SQL query - only select columns that definitely exist
      const connection = _connectionPool;
      if (!connection) {
        console.error("[getProperties] Database connection pool not available");
        return [];
      }

      // Core columns that should always exist
      const coreColumns = [
        'id', 'userId', 'title', 'description', 'address', 'city', 'country', 'zipCode',
        'latitude', 'longitude', 'bedrooms', 'bathrooms', 'squareFeet',
        'rentPrice', 'currency', 'amenities', 'images', 'status', 'verifiedLandlord',
        'createdAt', 'updatedAt'
      ];

      // Build WHERE clause
      let whereClause = '`status` = "active"';
      const params: any[] = [];
      
      if (filters?.city) {
        whereClause += ' AND `city` LIKE ?';
        params.push(`%${filters.city}%`);
      }
      if (filters?.maxPrice) {
        whereClause += ' AND `rentPrice` <= ?';
        params.push(filters.maxPrice * 100); // Convert to cents
      }
      if (filters?.bedrooms) { // Added bedrooms to raw SQL
        whereClause += ' AND `bedrooms` >= ?';
        params.push(filters.bedrooms);
      }
      if (filters?.minArea) { // Added minArea to raw SQL
        whereClause += ' AND `squareFeet` >= ?';
        params.push(filters.minArea);
      }

      const selectColumns = coreColumns.map(col => `\`${col}\``).join(', ');
      const [rows] = await connection.execute(
        `SELECT ${selectColumns} FROM \`properties\` WHERE ${whereClause} ORDER BY \`createdAt\` DESC`,
        params
      ) as any;

      console.log(`[getProperties] Successfully fetched ${rows.length} properties using raw SQL`);
      return rows || [];
    }
  } catch (error: any) {
    console.error(`[getProperties] Error fetching properties:`, error);
    return [];
  }
}

export async function getPropertyById(id: number) {
  try {
    const db = await getDb();
    if (!db) {
      console.error("[getPropertyById] Database not available");
      throw new Error("Database not available");
    }
    
    console.log(`[getPropertyById] Fetching property with id: ${id}`);
    
    // Try using Drizzle ORM first
    try {
      const result = await db.select().from(properties).where(eq(properties.id, id)).limit(1);
      
      if (!result || result.length === 0 || !result[0]) {
        console.warn(`[getPropertyById] Property with id ${id} not found`);
        throw new Error(`Property not found: ${id}`);
      }
      
      console.log(`[getPropertyById] Successfully fetched property ${id} using Drizzle`);
      const property = result[0];
      
      // Fetch landlord/user information
      if (property.userId) {
        const user = await getUserById(property.userId);
        return {
          ...property,
          user: user || null,
          landlord: user || null,
        };
      }
      
      return property;
    } catch (drizzleError: any) {
      // If it's a "not found" error, re-throw it
      if (drizzleError?.message && drizzleError.message.includes("Property not found")) {
        throw drizzleError;
      }
      
      console.warn(`[getPropertyById] Drizzle query failed, trying raw SQL:`, drizzleError?.message);
      
      // Fallback to raw SQL query - only select columns that definitely exist
      const connection = _connectionPool;
      if (!connection) {
        throw new Error("Database connection pool not available");
      }
      
      // Core columns that should always exist (from initial schema)
      const coreColumns = [
        'id', 'userId', 'title', 'description', 'address', 'city', 'country', 'zipCode',
        'latitude', 'longitude', 'bedrooms', 'bathrooms', 'squareFeet',
        'rentPrice', 'currency', 'amenities', 'images', 'status', 'verifiedLandlord',
        'createdAt', 'updatedAt'
      ];
      
      // Optional columns that may not exist in older databases
      const optionalColumns = ['allowPets', 'petDeposit', 'petRestrictions', 'checklistTemplateId'];
      
      // Try to select all columns first, if that fails, use only core columns
      let selectColumns = [...coreColumns, ...optionalColumns].map(col => `\`${col}\``).join(', ');
      let rows: any;
      
      try {
        [rows] = await connection.execute(
          `SELECT ${selectColumns} FROM \`properties\` WHERE \`id\` = ? LIMIT 1`,
          [id]
        ) as any;
      } catch (columnError: any) {
        // If column doesn't exist error, try with only core columns
        if (columnError?.message && columnError.message.includes("Unknown column")) {
          console.warn(`[getPropertyById] Some columns don't exist, using core columns only`);
          selectColumns = coreColumns.map(col => `\`${col}\``).join(', ');
          [rows] = await connection.execute(
            `SELECT ${selectColumns} FROM \`properties\` WHERE \`id\` = ? LIMIT 1`,
            [id]
          ) as any;
        } else {
          throw columnError;
        }
      }
      
      if (!rows || rows.length === 0 || !rows[0]) {
        console.warn(`[getPropertyById] Property with id ${id} not found (raw SQL)`);
        throw new Error(`Property not found: ${id}`);
      }
      
      console.log(`[getPropertyById] Successfully fetched property ${id} using raw SQL`);
      const property = rows[0];
      
      // Fetch landlord/user information
      if (property.userId) {
        const user = await getUserById(property.userId);
        return {
          ...property,
          user: user || null,
          landlord: user || null,
        };
      }
      
      return property;
    }
  } catch (error: any) {
    console.error(`[getPropertyById] Error fetching property ${id}:`, error);
    // Re-throw with more context
    if (error.message && error.message.includes("Property not found")) {
      throw error;
    }
    throw new Error(`Failed to fetch property ${id}: ${error?.message || error}`);
  }
}

export async function getUserProperties(userId: number) {
  try {
    const db = await getDb();
    if (!db) {
      console.error("[getUserProperties] Database not available");
      return [];
    }
    
    // Use Drizzle ORM to query properties by userId
    // This handles type matching and JSON parsing automatically
    const result = await db
      .select()
      .from(properties)
      .where(eq(properties.userId, userId))
      .orderBy(desc(properties.createdAt));
    
    console.log(`[getUserProperties] Query executed successfully. Found ${result?.length || 0} properties for user ${userId}`);
    
    if (result && result.length > 0) {
      console.log(`[getUserProperties] Success! Sample property:`, {
        id: result[0].id,
        userId: result[0].userId,
        title: result[0].title,
        city: result[0].city
      });
      return result;
    } else {
      console.log(`[getUserProperties] No properties found for userId: ${userId}`);
      
      // Debug: Check what userIds exist in the database
      const allProperties = await db
        .select({ id: properties.id, userId: properties.userId, title: properties.title })
        .from(properties)
        .orderBy(desc(properties.createdAt))
        .limit(10);
      
      const uniqueUserIds = [...new Set(allProperties.map(p => p.userId))];
      console.log(`[getUserProperties] Available userIds in database:`, uniqueUserIds);
      return [];
    }
  } catch (error: any) {
    console.error("[getUserProperties] Error fetching properties:", error);
    console.error("[getUserProperties] Error message:", error?.message);
    console.error("[getUserProperties] Error stack:", error?.stack);
    
    // Fallback to raw SQL if Drizzle fails
    try {
      const connection = _connectionPool;
      if (!connection) {
        await getDb();
        if (!_connectionPool) {
          return [];
        }
      }
      
      const [rows] = await _connectionPool!.execute(
        `SELECT * FROM \`properties\` WHERE \`userId\` = ? ORDER BY \`createdAt\` DESC`,
        [userId]
      ) as any;
      
      console.log(`[getUserProperties] Fallback query found ${rows?.length || 0} properties`);
      return rows || [];
    } catch (fallbackError: any) {
      console.error("[getUserProperties] Fallback query also failed:", fallbackError);
      return [];
    }
  }
}

/**
 * Saved Properties - User favorites
 */
export async function toggleSavedProperty(userId: number, propertyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if already saved
  const existing = await db
    .select()
    .from(savedProperties)
    .where(and(eq(savedProperties.userId, userId), eq(savedProperties.propertyId, propertyId)))
    .limit(1);

  if (existing.length > 0) {
    // Remove from saved
    await db
      .delete(savedProperties)
      .where(and(eq(savedProperties.userId, userId), eq(savedProperties.propertyId, propertyId)));
    return { saved: false };
  } else {
    // Add to saved
    await db.insert(savedProperties).values({ userId, propertyId });
    return { saved: true };
  }
}

export async function getSavedProperties(userId: number) {
  const db = await getDb();
  if (!db) {
    console.log("[getSavedProperties] Database not available");
    return [];
  }

  try {
    const result = await db
      .select({
        property: properties,
        savedAt: savedProperties.createdAt,
      })
      .from(savedProperties)
      .innerJoin(properties, eq(savedProperties.propertyId, properties.id))
      .where(eq(savedProperties.userId, userId));

    console.log(`[getSavedProperties] Found ${result.length} saved properties for user ${userId}`);
    if (result.length > 0) {
      console.log("[getSavedProperties] Sample result:", {
        propertyId: result[0].property.id,
        propertyTitle: result[0].property.title,
        savedAt: result[0].savedAt
      });
    }
    return result;
  } catch (error: any) {
    console.error("[getSavedProperties] Error:", error);
    // Fallback to raw SQL if Drizzle fails
    const connection = getConnectionPool();
    if (!connection) {
      console.error("[getSavedProperties] Connection pool not available");
      return [];
    }
    
    try {
      const [rows] = await connection.execute(
        `SELECT p.*, sp.createdAt as savedAt 
         FROM savedProperties sp 
         INNER JOIN properties p ON sp.propertyId = p.id 
         WHERE sp.userId = ? 
         ORDER BY sp.createdAt DESC`,
        [userId]
      ) as any;
      
      console.log(`[getSavedProperties] Raw SQL found ${rows?.length || 0} saved properties`);
      
      return (rows || []).map((row: any) => ({
        property: row,
        savedAt: row.savedAt
      }));
    } catch (sqlError: any) {
      console.error("[getSavedProperties] Raw SQL error:", sqlError);
      return [];
    }
  }
}

export async function isPropertySaved(userId: number, propertyId: number) {
  const db = await getDb();
  if (!db) return false;

  const result = await db
    .select()
    .from(savedProperties)
    .where(and(eq(savedProperties.userId, userId), eq(savedProperties.propertyId, propertyId)))
    .limit(1);

  return result.length > 0;
}

// ========================================
// Applications - Formal rental applications
// ========================================

export async function createApplication(data: InsertApplication) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(applications).values(data);
  const insertId = Number(result[0].insertId);
  
  // Fetch and return the created application
  const createdApplication = await db.select().from(applications).where(eq(applications.id, insertId)).limit(1);
  return createdApplication[0];
}

export async function getUserApplications(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select({
      application: applications,
      property: properties,
      landlord: users, // Select landlord user details
    })
    .from(applications)
    .innerJoin(properties, eq(applications.propertyId, properties.id))
    .innerJoin(users, eq(applications.landlordId, users.id)) // Join with users table for landlord details
    .where(eq(applications.userId, userId))
    .orderBy(desc(applications.createdAt));
  
  return result;
}

export async function getLandlordApplications(landlordId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select({
      application: applications,
      property: properties,
      tenant: users,
      profile: userProfiles,
      contract: contracts,
    })
    .from(applications)
    .innerJoin(properties, eq(applications.propertyId, properties.id))
    .innerJoin(users, eq(applications.userId, users.id))
    .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
    .leftJoin(contracts, eq(applications.id, contracts.applicationId))
    .where(eq(applications.landlordId, landlordId))
    .orderBy(desc(applications.createdAt));
  
  return result.map(row => ({
    application: row.application,
    property: row.property,
    contract: row.contract ? { id: row.contract.id, status: row.contract.status } : null,
    tenant: {
      ...row.tenant,
      tenantScore: row.profile?.tenantScore || 0,
      monthlyIncome: row.profile?.annualSalary ? Math.floor(row.profile.annualSalary / 12 / 100) : 0, // Convert cents to EUR monthly
      employmentStatus: row.profile?.employmentStatus || 'unspecified',
    }
  }));
}

export async function updateApplicationStatus(applicationId: number, status: "pending" | "accepted" | "rejected" | "withdrawn") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.update(applications)
    .set({ status, updatedAt: new Date() })
    .where(eq(applications.id, applicationId));
}

export async function updatePropertyStatus(propertyId: number, status: "active" | "inactive" | "rented") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.update(properties)
    .set({ status, updatedAt: new Date() })
    .where(eq(properties.id, propertyId));
}

export async function getApplicationDetails(applicationId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select({
    id: applications.id,
    propertyId: applications.propertyId,
    userId: applications.userId,
    landlordId: applications.landlordId,
    status: applications.status,
    message: applications.message,
    moveInDate: applications.moveInDate,
    leaseLength: applications.leaseLength,
    numberOfOccupants: applications.numberOfOccupants,
    hasPets: applications.hasPets,
    petType: applications.petType,
    petCount: applications.petCount,
    shareIdDocument: applications.shareIdDocument,
    shareIncomeDocument: applications.shareIncomeDocument,
    shareEmploymentDocument: applications.shareEmploymentDocument,
    shareReferences: applications.shareReferences,
    createdAt: applications.createdAt,
    updatedAt: applications.updatedAt,
    tenantName: users.name,
    tenantEmail: users.email,
    tenantPhone: users.phone,
    verificationStatus: users.verificationStatus,
    propertyTitle: properties.title,
    propertyCity: properties.city,
  })
    .from(applications)
    .innerJoin(users, eq(applications.userId, users.id))
    .innerJoin(properties, eq(applications.propertyId, properties.id))
    .where(eq(applications.id, applicationId))
    .limit(1);
  
  return result[0];
}

export async function getApplicationsByTenantId(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(applications).where(eq(applications.userId, tenantId)).orderBy(desc(applications.createdAt));
}

export async function getApplicationsByLandlordId(landlordId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(applications).where(eq(applications.landlordId, landlordId)).orderBy(desc(applications.createdAt));
}

// ========================================
// Payments - Rent payment tracking
// ========================================

export async function createPayment(payment: InsertPayment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(payments).values(payment);
  const insertedId = Number((result as any).insertId);
  return { id: insertedId, ...payment };
}

export async function getPaymentById(paymentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const paymentResult = await db
    .select()
    .from(payments)
    .where(eq(payments.id, paymentId))
    .limit(1);

  if (!paymentResult[0]) return null;

  const payment = paymentResult[0];

  // Get related data
  const tenantResult = await db.select().from(users).where(eq(users.id, payment.tenantId)).limit(1);
  const landlordResult = await db.select().from(users).where(eq(users.id, payment.landlordId)).limit(1);
  const propertyResult = await db.select().from(properties).where(eq(properties.id, payment.propertyId)).limit(1);
  const contractResult = await db.select().from(contracts).where(eq(contracts.id, payment.contractId)).limit(1);

  return {
    ...payment,
    tenant: tenantResult[0],
    landlord: landlordResult[0],
    property: propertyResult[0],
    contract: contractResult[0],
  };
}

export async function getTenantPayments(tenantId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const paymentResults = await db
    .select()
    .from(payments)
    .where(eq(payments.tenantId, tenantId))
    .orderBy(desc(payments.createdAt));

  // Get related data for each payment
  const paymentsWithDetails = await Promise.all(
    paymentResults.map(async (payment) => {
      const propertyResult = await db.select().from(properties).where(eq(properties.id, payment.propertyId)).limit(1);
      const landlordResult = await db.select().from(users).where(eq(users.id, payment.landlordId)).limit(1);
      const contractResult = await db.select().from(contracts).where(eq(contracts.id, payment.contractId)).limit(1);

      return {
        ...payment,
        property: propertyResult[0],
        landlord: landlordResult[0],
        contract: contractResult[0],
      };
    })
  );

  return paymentsWithDetails;
}

export async function getLandlordPayments(landlordId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const paymentResults = await db
    .select()
    .from(payments)
    .where(eq(payments.landlordId, landlordId))
    .orderBy(desc(payments.createdAt));

  // Get related data for each payment
  const paymentsWithDetails = await Promise.all(
    paymentResults.map(async (payment) => {
      const propertyResult = await db.select().from(properties).where(eq(properties.id, payment.propertyId)).limit(1);
      const tenantResult = await db.select().from(users).where(eq(users.id, payment.tenantId)).limit(1);
      const contractResult = await db.select().from(contracts).where(eq(contracts.id, payment.contractId)).limit(1);

      return {
        ...payment,
        property: propertyResult[0],
        tenant: tenantResult[0],
        contract: contractResult[0],
      };
    })
  );

  return paymentsWithDetails;
}

export async function getPaymentsByContract(contractId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const paymentResults = await db
    .select()
    .from(payments)
    .where(eq(payments.contractId, contractId))
    .orderBy(desc(payments.createdAt));

  return paymentResults;
}

export async function updatePaymentStatus(
  paymentId: number,
  status: "pending" | "processing" | "completed" | "failed" | "refunded",
  stripeChargeId?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = {
    status,
  };

  if (status === "completed") {
    updateData.paidAt = new Date();
  }

  if (stripeChargeId) {
    updateData.stripeChargeId = stripeChargeId;
  }

  await db.update(payments).set(updateData).where(eq(payments.id, paymentId));

  return { success: true };
}

// ========================================
// Contracts - Digital rental contracts
// ========================================

export async function createContract(data: Omit<InsertContract, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Build contract data, ensuring checklistId is explicitly null if not provided
  const contractData: any = { ...data };
  
  // Explicitly set checklistId to null if it's undefined (not just delete it)
  // This ensures Drizzle properly handles it as NULL in SQL instead of using 'default'
  if (!('checklistId' in contractData) || contractData.checklistId === undefined) {
    contractData.checklistId = null;
  }
  
  // Use raw SQL to have full control over NULL handling
  // Only include columns that actually exist in the database
  const connection = _connectionPool;
  if (!connection) throw new Error("Database connection pool not available");
  
  // Build query with only existing columns (checklistId, tenantName, etc. may not exist)
  const query = `
    INSERT INTO contracts (
      propertyId, landlordId, tenantId, applicationId, startDate, endDate,
      monthlyRent, securityDeposit, currency, terms, specialConditions, status
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, 'EUR', ?, ?, ?
    )
  `;
  
  // Map sent_to_tenant to sent (database enum value)
  const dbStatus = contractData.status === "sent_to_tenant" ? "sent" : (contractData.status || 'draft');
  
  const params = [
    contractData.propertyId,
    contractData.landlordId,
    contractData.tenantId,
    contractData.applicationId || null,
    contractData.startDate,
    contractData.endDate,
    contractData.monthlyRent,
    contractData.securityDeposit,
    contractData.terms || '',
    contractData.specialConditions || '',
    dbStatus,
  ];
  
  const [insertResult] = await connection.execute(query, params);
  const insertId = Number((insertResult as any).insertId);
  
  // Fetch and return the created contract using raw SQL to avoid column mismatch
  const [rows] = await connection.execute(
    `SELECT * FROM contracts WHERE id = ? LIMIT 1`,
    [insertId]
  );
  const result = (rows as any[])[0];
  // Map status back to sent_to_tenant for API consistency
  if (result && result.status === "sent") {
    result.status = "sent_to_tenant";
  }
  return result;
}

export async function getLandlordContracts(landlordId: number) {
  const db = await getDb();
  if (!db) return [];
  
  try {
    const result = await db
      .select({
        contract: contracts,
        property: properties,
        tenant: users,
        checklist: moveInChecklists,
      })
      .from(contracts)
      .innerJoin(properties, eq(contracts.propertyId, properties.id))
      .innerJoin(users, eq(contracts.tenantId, users.id))
      .leftJoin(moveInChecklists, eq(contracts.id, moveInChecklists.contractId))
      .where(eq(contracts.landlordId, landlordId))
      .orderBy(desc(contracts.createdAt));
    
    // Flatten the structure for easier frontend consumption
    return result.map(row => ({
      ...row.contract,
      property: row.property,
      tenant: row.tenant,
      checklistStatus: row.checklist?.status || null,
    }));
  } catch (error: any) {
    // Fallback to raw SQL if Drizzle fails (e.g., missing columns)
    console.error("Drizzle query failed, using raw SQL fallback:", error.message);
    const connection = _connectionPool;
    if (!connection) return [];
    
    try {
      const [rows] = await connection.execute(
        `SELECT 
          c.*,
          p.id as property_id, p.title as property_title, p.address as property_address, p.city as property_city,
          u.id as tenant_id, u.name as tenant_name, u.email as tenant_email, u.phone as tenant_phone
        FROM contracts c
        INNER JOIN properties p ON c.propertyId = p.id
        INNER JOIN users u ON c.tenantId = u.id
        WHERE c.landlordId = ?
        ORDER BY c.createdAt DESC`,
        [landlordId]
      );
      
      return (rows as any[]).map((row: any) => ({
        id: row.id,
        propertyId: row.propertyId,
        landlordId: row.landlordId,
        tenantId: row.tenantId,
        applicationId: row.applicationId,
        startDate: row.startDate,
        endDate: row.endDate,
        monthlyRent: row.monthlyRent,
        securityDeposit: row.securityDeposit,
        currency: row.currency || 'EUR',
        terms: row.terms,
        specialConditions: row.specialConditions,
        status: row.status === "sent" ? "sent_to_tenant" : row.status, // Map sent to sent_to_tenant for API consistency
        landlordSignature: row.landlordSignature,
        landlordSignedAt: row.landlordSignedAt,
        tenantSignature: row.tenantSignature,
        tenantSignedAt: row.tenantSignedAt,
        contractPdfUrl: row.contractPdfUrl,
        // Payment fields
        depositPaid: row.depositPaid ? Boolean(row.depositPaid) : false,
        depositPaidAt: row.depositPaidAt,
        depositPaymentMethod: row.depositPaymentMethod,
        depositPaymentReference: row.depositPaymentReference,
        firstMonthRentPaid: row.firstMonthRentPaid ? Boolean(row.firstMonthRentPaid) : false,
        firstMonthRentPaidAt: row.firstMonthRentPaidAt,
        firstMonthRentPaymentMethod: row.firstMonthRentPaymentMethod,
        firstMonthRentPaymentReference: row.firstMonthRentPaymentReference,
        // Move-in tracking fields
        keysCollected: row.keysCollected ? Boolean(row.keysCollected) : false,
        keysCollectedAt: row.keysCollectedAt,
        moveInDate: row.moveInDate,
        checklistDeadline: row.checklistDeadline,
        checklistCompletedAt: row.checklistCompletedAt,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        property: {
          id: row.property_id,
          title: row.property_title,
          address: row.property_address,
          city: row.property_city,
        },
        tenant: {
          id: row.tenant_id,
          name: row.tenant_name,
          email: row.tenant_email,
          phone: row.tenant_phone,
        },
        checklistStatus: null,
      }));
    } catch (rawError) {
      console.error("Raw SQL query also failed:", rawError);
      return [];
    }
  }
}

export async function getTenantContracts(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  
  try {
    const result = await db
      .select({
        contract: contracts,
        property: properties,
        landlord: users,
      })
      .from(contracts)
      .innerJoin(properties, eq(contracts.propertyId, properties.id))
      .innerJoin(users, eq(contracts.landlordId, users.id))
      .where(eq(contracts.tenantId, tenantId))
      .orderBy(desc(contracts.createdAt));
    
    // Flatten the structure for easier frontend consumption
    return result.map(row => ({
      ...row.contract,
      property: row.property,
      landlord: row.landlord,
    }));
  } catch (error: any) {
    // Fallback to raw SQL if Drizzle fails (e.g., missing columns)
    console.warn(`[getTenantContracts] Drizzle query failed, falling back to raw SQL: ${error.message}`);
    const connection = _connectionPool;
    if (!connection) return [];
    
    try {
      const [rows] = await connection.execute(
        `SELECT 
          c.*,
          p.id as property_id, p.title as property_title, p.address as property_address, p.city as property_city,
          u_landlord.id as landlord_id, u_landlord.name as landlord_name, u_landlord.email as landlord_email, u_landlord.phone as landlord_phone
        FROM contracts c
        INNER JOIN properties p ON c.propertyId = p.id
        INNER JOIN users u_landlord ON c.landlordId = u_landlord.id
        WHERE c.tenantId = ?
        ORDER BY c.createdAt DESC`,
        [tenantId]
      );
      
      return (rows as any[]).map((row: any) => ({
        id: row.id,
        propertyId: row.propertyId,
        landlordId: row.landlordId,
        tenantId: row.tenantId,
        applicationId: row.applicationId,
        startDate: row.startDate,
        endDate: row.endDate,
        monthlyRent: row.monthlyRent,
        securityDeposit: row.securityDeposit,
        currency: row.currency || 'EUR',
        terms: row.terms,
        specialConditions: row.specialConditions,
        status: row.status === "sent" ? "sent_to_tenant" : row.status, // Map sent to sent_to_tenant for API consistency
        landlordSignature: row.landlordSignature,
        landlordSignedAt: row.landlordSignedAt,
        tenantSignature: row.tenantSignature,
        tenantSignedAt: row.tenantSignedAt,
        contractPdfUrl: row.contractPdfUrl,
        // Payment fields
        depositPaid: row.depositPaid ? Boolean(row.depositPaid) : false,
        depositPaidAt: row.depositPaidAt,
        depositPaymentMethod: row.depositPaymentMethod,
        depositPaymentReference: row.depositPaymentMethod,
        firstMonthRentPaid: row.firstMonthRentPaid ? Boolean(row.firstMonthRentPaid) : false,
        firstMonthRentPaidAt: row.firstMonthRentPaidAt,
        firstMonthRentPaymentMethod: row.firstMonthRentPaymentMethod,
        firstMonthRentPaymentReference: row.firstMonthRentPaymentReference,
        // Move-in tracking fields
        keysCollected: row.keysCollected ? Boolean(row.keysCollected) : false,
        keysCollectedAt: row.keysCollectedAt,
        moveInDate: row.moveInDate,
        checklistDeadline: row.checklistDeadline,
        checklistCompletedAt: row.checklistCompletedAt,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        property: {
          id: row.property_id,
          title: row.property_title,
          address: row.property_address,
          city: row.property_city,
        },
        landlord: {
          id: row.landlord_id,
          name: row.landlord_name,
          email: row.landlord_email,
          phone: row.landlord_phone,
        },
      }));
    } catch (rawError) {
      console.error("Raw SQL query also failed:", rawError);
      return [];
    }
  }
}

export async function getContractById(contractId: number) {
  const db = await getDb();
  if (!db) return null;
  
  try {
    // First try with Drizzle ORM
    const contractResult = await db
      .select()
      .from(contracts)
      .where(eq(contracts.id, contractId))
      .limit(1);
    
    if (contractResult.length === 0) return null;
    
    const contract = contractResult[0];
    
    // Get property
    const propertyResult = await db
      .select()
      .from(properties)
      .where(eq(properties.id, contract.propertyId))
      .limit(1);
    
    // Get landlord
    const landlordResult = await db
      .select()
      .from(users)
      .where(eq(users.id, contract.landlordId))
      .limit(1);
    
    // Get tenant
    const tenantResult = await db
      .select()
      .from(users)
      .where(eq(users.id, contract.tenantId))
      .limit(1);
    
    return {
      ...contract,
      property: propertyResult[0],
      landlord: landlordResult[0],
      tenant: tenantResult[0],
    };
  } catch (error: any) {
    // Fallback to raw SQL if Drizzle fails (e.g., missing columns)
    console.error("Drizzle query failed, using raw SQL fallback:", error.message);
    const connection = _connectionPool;
    if (!connection) return null;
    
    try {
      const [rows] = await connection.execute(
        `SELECT 
          c.*,
          p.id as property_id, p.title as property_title, p.address as property_address, p.city as property_city,
          u_landlord.id as landlord_id, u_landlord.name as landlord_name, u_landlord.email as landlord_email, u_landlord.phone as landlord_phone,
          u_tenant.id as tenant_id, u_tenant.name as tenant_name, u_tenant.email as tenant_email, u_tenant.phone as tenant_phone
        FROM contracts c
        INNER JOIN properties p ON c.propertyId = p.id
        INNER JOIN users u_landlord ON c.landlordId = u_landlord.id
        INNER JOIN users u_tenant ON c.tenantId = u_tenant.id
        WHERE c.id = ?
        LIMIT 1`,
        [contractId]
      );
      
      if ((rows as any[]).length === 0) return null;
      
      const row = (rows as any[])[0];
      
      return {
        id: row.id,
        propertyId: row.propertyId,
        landlordId: row.landlordId,
        tenantId: row.tenantId,
        applicationId: row.applicationId,
        startDate: row.startDate,
        endDate: row.endDate,
        monthlyRent: row.monthlyRent,
        securityDeposit: row.securityDeposit,
        currency: row.currency || 'EUR',
        terms: row.terms,
        specialConditions: row.specialConditions,
        status: row.status === "sent" ? "sent_to_tenant" : row.status, // Map sent to sent_to_tenant for API consistency
        landlordSignature: row.landlordSignature,
        landlordSignedAt: row.landlordSignedAt,
        tenantSignature: row.tenantSignature,
        tenantSignedAt: row.tenantSignedAt,
        contractPdfUrl: row.contractPdfUrl,
        // Payment fields
        depositPaid: row.depositPaid ? Boolean(row.depositPaid) : false,
        depositPaidAt: row.depositPaidAt,
        depositPaymentMethod: row.depositPaymentMethod,
        depositPaymentReference: row.depositPaymentReference,
        firstMonthRentPaid: row.firstMonthRentPaid ? Boolean(row.firstMonthRentPaid) : false,
        firstMonthRentPaidAt: row.firstMonthRentPaidAt,
        firstMonthRentPaymentMethod: row.firstMonthRentPaymentMethod,
        firstMonthRentPaymentReference: row.firstMonthRentPaymentReference,
        // Move-in tracking fields
        keysCollected: row.keysCollected ? Boolean(row.keysCollected) : false,
        keysCollectedAt: row.keysCollectedAt,
        moveInDate: row.moveInDate,
        checklistDeadline: row.checklistDeadline,
        checklistCompletedAt: row.checklistCompletedAt,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        property: {
          id: row.property_id,
          title: row.property_title,
          address: row.property_address,
          city: row.property_city,
        },
        landlord: {
          id: row.landlord_id,
          name: row.landlord_name,
          email: row.landlord_email,
          phone: row.landlord_phone,
        },
        tenant: {
          id: row.tenant_id,
          name: row.tenant_name,
          email: row.tenant_email,
          phone: row.tenant_phone,
        },
      };
    } catch (rawError) {
      console.error("Raw SQL query also failed:", rawError);
      return null;
    }
  }
}

export async function signContract(
  contractId: number,
  signatory: "landlord" | "tenant",
  signature: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Fetch contract using raw SQL to avoid column issues
  const connection = _connectionPool;
  if (!connection) throw new Error("Database connection pool not available");
  
  const [contractRows] = await connection.execute('SELECT * FROM contracts WHERE id = ?', [contractId]);
  if ((contractRows as any[]).length === 0) throw new Error("Contract not found");
  
  const contract = (contractRows as any[])[0];
  
  const now = new Date();
  let newStatus: string;
  let dbStatus: string;
  
  if (signatory === "landlord") {
    newStatus = contract.tenantSignature ? "fully_signed" : "sent_to_tenant";
    dbStatus = contract.tenantSignature ? "fully_signed" : "sent"; // Map to database enum
  } else {
    newStatus = contract.landlordSignature ? "fully_signed" : "tenant_signed";
    dbStatus = newStatus;
  }
  
  try {
    if (signatory === "landlord") {
      await connection.execute(
        'UPDATE contracts SET landlordSignature = ?, landlordSignedAt = ?, status = ? WHERE id = ?',
        [signature, now, dbStatus, contractId]
      );
    } else {
      await connection.execute(
        'UPDATE contracts SET tenantSignature = ?, tenantSignedAt = ?, status = ? WHERE id = ?',
        [signature, now, dbStatus, contractId]
      );
    }
    
    // Fetch updated contract using raw SQL
    const [rows] = await connection.execute('SELECT * FROM contracts WHERE id = ?', [contractId]);
    const result = (rows as any[])[0];
    // Map status back to sent_to_tenant for API consistency
    if (result && result.status === "sent") {
      result.status = "sent_to_tenant";
    }
    return result;
  } catch (error: any) {
    console.error(`[signContract] Failed to sign contract: ${error.message}`);
    throw error;
  }
}

export async function updateContractStatus(
  contractId: number,
  status: "draft" | "sent_to_tenant" | "tenant_signed" | "fully_signed" | "active" | "expired" | "terminated"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Map sent_to_tenant to sent (database enum value)
  const dbStatus = status === "sent_to_tenant" ? "sent" : status;
  
  try {
    const result = await db.update(contracts)
      .set({ status: dbStatus as any, updatedAt: new Date() })
      .where(eq(contracts.id, contractId));
    
    const updated = await db.select().from(contracts).where(eq(contracts.id, contractId)).limit(1);
    // Map status back to sent_to_tenant for API consistency
    if (updated[0] && (updated[0].status as string) === "sent") {
      updated[0].status = "sent_to_tenant" as any;
    }
    return updated[0];
  } catch (error: any) {
    // Fallback to raw SQL if Drizzle fails
    console.warn(`[updateContractStatus] Drizzle update failed, using raw SQL: ${error.message}`);
    const connection = _connectionPool;
    if (!connection) throw new Error("Database connection pool not available");
    
    const [updateResult] = await connection.execute(
      'UPDATE contracts SET status = ?, updatedAt = ? WHERE id = ?',
      [dbStatus, new Date(), contractId]
    );
    
    // Fetch updated contract using raw SQL
    const [rows] = await connection.execute('SELECT * FROM contracts WHERE id = ?', [contractId]);
    const result = (rows as any[])[0];
    // Map status back to sent_to_tenant for API consistency
    if (result && result.status === "sent") {
      result.status = "sent_to_tenant";
    }
    return result;
  }
}

export async function generateContractPdf(contractId: number): Promise<string> {
  const contract = await getContractById(contractId);
  
  if (!contract) {
    throw new Error("Contract not found");
  }
  
  if (!contract.property || !contract.landlord || !contract.tenant) {
    throw new Error("Contract data incomplete");
  }
  
  // Fetch tenant profile to get pets and occupants information
  const tenantProfile = await getUserProfile(contract.tenant.id);
  
  // Import PDF service dynamically
  const { generateContractPdf: generatePdf } = await import("./contract-pdf-service");
  
  const pdfUrl = await generatePdf({
    contractId: contract.id,
    propertyTitle: contract.property.title,
    propertyAddress: contract.property.address,
    landlordName: contract.landlord.name || "Landlord",
    landlordEmail: contract.landlord.email || "",
    landlordId: tenantProfile?.dniNie || "",
    tenantName: contract.tenant.name || "Tenant",
    tenantEmail: contract.tenant.email || "",
    tenantId: tenantProfile?.dniNie || "",
    tenantHasPets: tenantProfile?.hasPets || false,
    tenantPetType: tenantProfile?.petType || undefined,
    tenantPetCount: tenantProfile?.petCount || undefined,
    tenantNumberOfOccupants: tenantProfile?.numberOfOccupants || 1,
    tenantOccupantDetails: tenantProfile?.occupantDetails || undefined,
    tenantRequirements: tenantProfile?.tenantRequirements || undefined,
    monthlyRent: contract.monthlyRent,
    securityDeposit: contract.securityDeposit,
    startDate: contract.startDate.toLocaleDateString(),
    endDate: contract.endDate.toLocaleDateString(),
    terms: contract.terms || "Standard rental agreement terms apply.",
    specialConditions: contract.specialConditions || undefined,
    landlordSignature: contract.landlordSignature || undefined,
    tenantSignature: contract.tenantSignature || undefined,
    landlordSignedAt: contract.landlordSignedAt || undefined,
    tenantSignedAt: contract.tenantSignedAt || undefined,
  });
  
  // Update contract with PDF URL
  const db = await getDb();
  if (db) {
    await db
      .update(contracts)
      .set({ contractPdfUrl: pdfUrl })
      .where(eq(contracts.id, contractId));
  }
  
  return pdfUrl;
}

/**
 * Contract Templates - Reusable contract templates
 */
export async function createContractTemplate(data: Omit<InsertContractTemplate, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(contractTemplates).values(data);
  const insertId = Number(result[0].insertId);
  
  const created = await db.select().from(contractTemplates).where(eq(contractTemplates.id, insertId)).limit(1);
  return created[0];
}

export async function getUserContractTemplates(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(contractTemplates)
    .where(eq(contractTemplates.userId, userId))
    .orderBy(desc(contractTemplates.createdAt));
}

export async function getPublicContractTemplates() {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(contractTemplates)
    .where(eq(contractTemplates.isPublic, true))
    .orderBy(desc(contractTemplates.createdAt));
}

export async function getContractTemplateById(templateId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select()
    .from(contractTemplates)
    .where(eq(contractTemplates.id, templateId))
    .limit(1);
  
  return result[0] || null;
}

export async function updateContractTemplate(
  templateId: number,
  data: Partial<Omit<InsertContractTemplate, "id" | "userId" | "createdAt" | "updatedAt">>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(contractTemplates)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(contractTemplates.id, templateId));
  
  const updated = await db.select().from(contractTemplates).where(eq(contractTemplates.id, templateId)).limit(1);
  return updated[0];
}

export async function deleteContractTemplate(templateId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(contractTemplates).where(eq(contractTemplates.id, templateId));
  return { success: true };
}

export async function setDefaultTemplate(userId: number, templateId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // First, unset all default templates for this user
  await db
    .update(contractTemplates)
    .set({ isDefault: false })
    .where(eq(contractTemplates.userId, userId));
  
  // Then set the new default
  await db
    .update(contractTemplates)
    .set({ isDefault: true })
    .where(eq(contractTemplates.id, templateId));

  return { success: true };
}

export async function getLandlordDefaultTemplate(landlordId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select()
    .from(contractTemplates)
    .where(and(eq(contractTemplates.userId, landlordId), eq(contractTemplates.isDefault, true)))
    .limit(1);
  
  return result[0] || null;
}

// ========================================
// User Profiles - Extended tenant/landlord information
// ========================================

export async function getUserProfile(userId: number, useRawSQL: boolean = false) {
  const db = await getDb();
  if (!db) return null;
  
  const connection = _connectionPool;
  if (!connection) {
    console.error("[getUserProfile] Database connection pool not available");
    return null;
  }

  // Base columns that should always exist
  const baseColumns = [
    'id', 'userId', 'createdAt', 'updatedAt'
  ];
  
  // Optional columns that might not exist
  const optionalColumns = [
    'bio', 'address', 'city', 'country', 'profileImage',
    'verificationScore', 'dniNie', 'companyName', 'hasPets', 'petType', 'petCount',
    'numberOfOccupants', 'occupantDetails', 'tenantRequirements',
    'annualSalary', 'rentalHistory', 'employmentStatus'
  ];
  
  if (!useRawSQL) {
    // First try with Drizzle ORM
    try {
      const result = await db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, userId))
        .limit(1);
      
      return result.length > 0 ? result[0] : null;
    } catch (error: any) {
      // If columns don't exist, fallback to raw SQL
      if (error?.message?.includes("Unknown column") || error?.message?.includes("Failed query")) {
        console.warn(`[getUserProfile] Drizzle query failed, using raw SQL:`, error?.message);
        useRawSQL = true;
      } else {
        throw error;
      }
    }
  }
  
  // Use raw SQL - dynamically build column list based on what exists
  // Start with base columns and try to add optional ones
  let columnsToSelect = [...baseColumns];
  
  // Try to get all available columns by querying information_schema
  try {
    const [columnInfo] = await connection.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'userProfiles' 
       AND COLUMN_NAME IN (${optionalColumns.map(() => '?').join(',')})`,
      optionalColumns
    ) as any;
    
    const availableColumns = columnInfo.map((row: any) => row.COLUMN_NAME);
    columnsToSelect = [...baseColumns, ...availableColumns];
  } catch (schemaError: any) {
    console.warn(`[getUserProfile] Could not check column existence, using base columns only:`, schemaError?.message);
  }
  
  // Try to select with available columns
  try {
    const [rows] = await connection.execute(
      `SELECT ${columnsToSelect.map(col => `\`${col}\``).join(', ')} FROM \`userProfiles\` WHERE \`userId\` = ? LIMIT 1`,
      [userId]
    ) as any;
    
    return rows && rows.length > 0 ? rows[0] : null;
  } catch (error: any) {
    // If still fails, try with just base columns
    if (error?.message?.includes("Unknown column")) {
      console.warn(`[getUserProfile] Some columns don't exist, using base columns only:`, error?.message);
      try {
        const [rows] = await connection.execute(
          `SELECT ${baseColumns.map(col => `\`${col}\``).join(', ')} FROM \`userProfiles\` WHERE \`userId\` = ? LIMIT 1`,
          [userId]
        ) as any;
        
        return rows && rows.length > 0 ? rows[0] : null;
      } catch (sqlError: any) {
        console.error(`[getUserProfile] Raw SQL query failed:`, sqlError?.message);
        return null;
      }
    }
    throw error;
  }
}

export async function upsertUserProfile(data: {
  userId: number;
  bio?: string;
  address?: string;
  city?: string;
  country?: string;
  profileImage?: string;
  verificationScore?: number;
  dniNie?: string;
  companyName?: string;
  hasPets?: boolean;
  petType?: string;
  petCount?: number;
  numberOfOccupants?: number;
  occupantDetails?: string;
  tenantRequirements?: string;
  annualSalary?: number;
  rentalHistory?: number;
  employmentStatus?: "employed" | "self-employed" | "student" | "unemployed";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check if profile exists - use raw SQL to avoid column issues
  const existing = await getUserProfile(data.userId, true);
  
  // First, check which columns actually exist in the database
  const connection = _connectionPool;
  if (!connection) throw new Error("Database connection pool not available");
  
  let availableColumns: string[] = [];
  try {
    const [columnInfo] = await connection.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'userProfiles'`
    ) as any;
    
    availableColumns = columnInfo.map((row: any) => row.COLUMN_NAME);
  } catch (schemaError: any) {
    console.warn(`[upsertUserProfile] Could not check column existence:`, schemaError?.message);
    // If we can't check, assume only base columns exist
    availableColumns = ['id', 'userId', 'createdAt', 'updatedAt'];
  }
  
  // Build update/insert data with only fields that have values AND exist in database
  const updateColumns: string[] = [];
  const updateValues: any[] = [];
  
  // Map of field names to their database column names and value processors
  const fieldMappings: Array<{ field: keyof typeof data; column: string; processor?: (val: any) => any }> = [
    { field: 'bio', column: 'bio' },
    { field: 'address', column: 'address' },
    { field: 'city', column: 'city' },
    { field: 'country', column: 'country' },
    { field: 'profileImage', column: 'profileImage' },
    { field: 'verificationScore', column: 'verificationScore' },
    { field: 'dniNie', column: 'dniNie' },
    { field: 'companyName', column: 'companyName' },
    { field: 'hasPets', column: 'hasPets', processor: (val) => val ? 1 : 0 },
    { field: 'petType', column: 'petType' },
    { field: 'petCount', column: 'petCount' },
    { field: 'numberOfOccupants', column: 'numberOfOccupants' },
    { field: 'occupantDetails', column: 'occupantDetails' },
    { field: 'tenantRequirements', column: 'tenantRequirements' },
    { field: 'annualSalary', column: 'annualSalary' },
    { field: 'rentalHistory', column: 'rentalHistory' },
    { field: 'employmentStatus', column: 'employmentStatus' },
  ];
  
  for (const { field, column, processor } of fieldMappings) {
    if (data[field] !== undefined && availableColumns.includes(column)) {
      updateColumns.push(`\`${column}\``);
      const value = processor ? processor(data[field]) : (data[field] || null);
      updateValues.push(value);
    }
  }
  
  if (updateColumns.length === 0) {
    return existing; // Nothing to update
  }
  
  try {
    if (existing) {
      // Update existing profile
      const setClause = updateColumns.map((col) => `${col} = ?`).join(', ');
      await connection.execute(
        `UPDATE \`userProfiles\` SET ${setClause} WHERE \`userId\` = ?`,
        [...updateValues, data.userId]
      );
    } else {
      // Insert new profile
      const insertColumns = ['`userId`', ...updateColumns];
      const insertValues = [data.userId, ...updateValues];
      await connection.execute(
        `INSERT INTO \`userProfiles\` (${insertColumns.join(', ')}) VALUES (${insertColumns.map(() => '?').join(', ')})`,
        insertValues
      );
    }
  } catch (error: any) {
    // If columns don't exist (shouldn't happen since we checked, but just in case)
    if (error?.message?.includes("Unknown column")) {
      console.error(`[upsertUserProfile] Column doesn't exist despite check:`, error?.message);
      throw new Error(`Database column missing. Please run migrations. Original error: ${error.message}`);
    }
    throw error;
  }
  
  // Calculate and save tenant score if user is a tenant
  try {
    await calculateAndSaveTenantScore(data.userId);
  } catch (scoreError: any) {
    // Don't fail the update if score calculation fails
    console.warn(`[upsertUserProfile] Failed to calculate tenant score:`, scoreError?.message);
  }
  
  // Use raw SQL to avoid column issues when fetching the updated profile
  return getUserProfile(data.userId, true);
}

/**
 * Calculate and save ClearLet Tenant Score
 */
export async function calculateAndSaveTenantScore(userId: number) {
  const factors = await getTenantScoreFactors(userId);
  if (!factors) {
    console.warn(`[calculateAndSaveTenantScore] No factors found for user ${userId}`);
    return null;
  }

  const scoreResult = calculateTenantScore(factors);
  
  // Save the score to userProfiles
  const connection = _connectionPool;
  if (!connection) {
    console.error("[calculateAndSaveTenantScore] Database connection pool not available");
    return null;
  }

  // Check if tenantScore column exists
  try {
    const [columnInfo] = await connection.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'userProfiles' 
       AND COLUMN_NAME = 'tenantScore'`
    ) as any;

    if (columnInfo && columnInfo.length > 0) {
      // Column exists, update it
      await connection.execute(
        `UPDATE \`userProfiles\` SET \`tenantScore\` = ? WHERE \`userId\` = ?`,
        [scoreResult.totalScore, userId]
      );
      console.log(`[calculateAndSaveTenantScore] Saved tenant score ${scoreResult.totalScore} for user ${userId}`);
    } else {
      console.warn(`[calculateAndSaveTenantScore] tenantScore column doesn't exist yet`);
    }
  } catch (error: any) {
    console.warn(`[calculateAndSaveTenantScore] Failed to save tenant score:`, error?.message);
  }

  return scoreResult.totalScore;
}

export async function updateTenantProfilePets(userId: number, petsData: {
  hasPets: boolean;
  petType?: string;
  petCount?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(userProfiles)
    .set(petsData)
    .where(eq(userProfiles.userId, userId));
  
  return getUserProfile(userId);
}

export async function updateTenantProfileOccupants(userId: number, occupantsData: {
  numberOfOccupants: number;
  occupantDetails?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(userProfiles)
    .set(occupantsData)
    .where(eq(userProfiles.userId, userId));
  
  return getUserProfile(userId);
}

/**
 * Get tenant score factors from database for score calculation
 */
export async function getTenantScoreFactors(userId: number) {
  const db = await getDb();
  if (!db) return null;

  // Get user profile
  const profile = await getUserProfile(userId);
  if (!profile) return null;

  // Get user documents to check verification status
  const userDocuments = await db
    .select()
    .from(documents)
    .where(eq(documents.userId, userId));
  
  const hasVerifiedDocuments = userDocuments.some(
    doc => doc.verificationStatus === "verified"
  );

  // Get payment history from payments table
  let onTimePayments = 0;
  let latePayments = 0;
  
  try {
    // Get all completed payments for this tenant
    // Try Drizzle first, fallback to raw SQL if needed
    let tenantPayments: any[] = [];
    
    try {
      tenantPayments = await db
        .select()
        .from(payments)
        .where(and(
          eq(payments.tenantId, userId),
          eq(payments.status, "completed")
        ));
    } catch (drizzleError) {
      // Fallback to raw SQL if Drizzle fails
      console.warn("[getTenantScoreFactors] Drizzle query failed, using raw SQL:", drizzleError);
      const connection = getConnectionPool();
      if (connection) {
        const [rows] = await connection.execute(
          `SELECT * FROM payments WHERE tenantId = ? AND status = 'completed'`,
          [userId]
        ) as any;
        tenantPayments = rows || [];
      }
    }
    
    console.log(`[getTenantScoreFactors] Found ${tenantPayments.length} completed payments from payments table for user ${userId}`);
    
    // Calculate on-time vs late payments
    for (const payment of tenantPayments) {
      if (payment.paidAt) {
        if (payment.dueDate) {
          // Normalize dates to remove time component for fair comparison
          const paidDate = new Date(payment.paidAt);
          paidDate.setHours(0, 0, 0, 0);
          
          const dueDate = new Date(payment.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          
          // Payment is on-time if paid on or before due date
          if (paidDate <= dueDate) {
            onTimePayments++;
            console.log(`[getTenantScoreFactors] Payment ${payment.id} is on-time (paid: ${paidDate.toISOString()}, due: ${dueDate.toISOString()})`);
          } else {
            latePayments++;
            console.log(`[getTenantScoreFactors] Payment ${payment.id} is late (paid: ${paidDate.toISOString()}, due: ${dueDate.toISOString()})`);
          }
        } else {
          // If there's a paidAt date but no dueDate, consider it on-time
          onTimePayments++;
          console.log(`[getTenantScoreFactors] Payment ${payment.id} has no dueDate, counting as on-time`);
        }
      } else {
        console.log(`[getTenantScoreFactors] Payment ${payment.id} has no paidAt date, skipping`);
      }
    }
    
    console.log(`[getTenantScoreFactors] After payments table: onTime=${onTimePayments}, late=${latePayments}`);
    
    // Also count deposit and first month rent from contracts as payments
    try {
      let tenantContracts: any[] = [];
      
      try {
        tenantContracts = await db
          .select()
          .from(contracts)
          .where(eq(contracts.tenantId, userId));
      } catch (drizzleError) {
        // Fallback to raw SQL if Drizzle fails
        console.warn("[getTenantScoreFactors] Drizzle contracts query failed, using raw SQL:", drizzleError);
        const connection = getConnectionPool();
        if (connection) {
          const [rows] = await connection.execute(
            `SELECT * FROM contracts WHERE tenantId = ?`,
            [userId]
          ) as any;
          tenantContracts = rows || [];
        }
      }
      
      console.log(`[getTenantScoreFactors] Found ${tenantContracts.length} contracts for user ${userId}`);
      
      for (const contract of tenantContracts) {
        // Count deposit payment (check if fields exist)
        const depositPaid = contract.depositPaid || (contract as any).depositPaid;
        const depositPaidAt = contract.depositPaidAt || (contract as any).depositPaidAt;
        
        if (depositPaid && depositPaidAt) {
          // If there's a depositPaidAt, consider it on-time (deposits are usually paid upfront)
          onTimePayments++;
          console.log(`[getTenantScoreFactors] Contract ${contract.id} deposit paid, counting as on-time`);
        }
        
        // Count first month rent payment (check if fields exist)
        const firstMonthRentPaid = contract.firstMonthRentPaid || (contract as any).firstMonthRentPaid;
        const firstMonthRentPaidAt = contract.firstMonthRentPaidAt || (contract as any).firstMonthRentPaidAt;
        
        if (firstMonthRentPaid && firstMonthRentPaidAt && contract.startDate) {
          // Normalize dates to remove time component for fair comparison
          const rentPaidDate = new Date(firstMonthRentPaidAt);
          rentPaidDate.setHours(0, 0, 0, 0);
          
          const leaseStartDate = new Date(contract.startDate);
          leaseStartDate.setHours(0, 0, 0, 0);
          
          // First month rent should be paid before or on lease start date
          if (rentPaidDate <= leaseStartDate) {
            onTimePayments++;
            console.log(`[getTenantScoreFactors] Contract ${contract.id} first month rent is on-time`);
          } else {
            latePayments++;
            console.log(`[getTenantScoreFactors] Contract ${contract.id} first month rent is late`);
          }
        }
      }
      
      console.log(`[getTenantScoreFactors] After contracts: onTime=${onTimePayments}, late=${latePayments}`);
    } catch (contractError) {
      // If contracts query fails (e.g., missing columns), just skip contract payments
      console.warn("[getTenantScoreFactors] Could not fetch contract payments:", contractError);
    }
  } catch (error) {
    console.error("[getTenantScoreFactors] Error fetching payment history:", error);
    // Fallback to 0 if there's an error
    onTimePayments = 0;
    latePayments = 0;
  }
  
  console.log(`[getTenantScoreFactors] Final payment counts for user ${userId}: onTime=${onTimePayments}, late=${latePayments}, total=${onTimePayments + latePayments}`);

  // Get references count from verified reference documents
  const positiveReferences = userDocuments.filter(
    doc => doc.documentType === 'reference' && doc.verificationStatus === 'verified'
  ).length;
  const negativeReferences = 0; // TODO: Implement negative references from landlord feedback

  // Get evictions count
  // TODO: Implement eviction tracking
  const evictions = 0;

  return {
    rentalHistoryMonths: profile.rentalHistory || 0,
    employmentStatus: (profile.employmentStatus as "employed" | "self-employed" | "student" | "unemployed") || "unemployed",
    annualSalary: profile.annualSalary ? profile.annualSalary / 100 : 0, // Convert from cents to EUR
    onTimePayments,
    latePayments,
    evictions,
    positiveReferences,
    negativeReferences,
    isVerified: hasVerifiedDocuments || profile.verificationScore === 100,
  };
}

// ========================================
// Notifications - System notifications
// ========================================

export async function createNotification(data: InsertNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(notifications).values(data);
}

export async function getUserNotifications(
  userId: number,
  filters?: {
    type?: "contract" | "payment" | "maintenance" | "application" | "system" | "all";
    isRead?: boolean;
  }
) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(notifications.userId, userId)];
  
  if (filters?.type && filters.type !== "all") {
    // Only add filter if it matches one of the valid enum values
    const validTypes = ["contract", "payment", "maintenance", "application", "system", "checklist", "key_collection"];
    if (validTypes.includes(filters.type)) {
      conditions.push(eq(notifications.type, filters.type as any));
    }
  }
  
  if (filters?.isRead !== undefined) {
    conditions.push(eq(notifications.isRead, filters.isRead));
  }
  
  return db
    .select()
    .from(notifications)
    .where(and(...conditions))
    .orderBy(desc(notifications.createdAt));
}

export async function getUnreadNotificationCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  
  const result = await db
    .select()
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  
  return result.length;
}

export async function markNotificationAsRead(notificationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db
    .update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.id, notificationId));
}

export async function markAllNotificationsAsRead(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
}

// ========================================
// Tenant Specific Functions
// ========================================

export async function getTenantActiveRental(tenantId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get active or fully_signed contract for the tenant with property and landlord details
  const result = await db
    .select({
      contract: contracts,
      property: properties,
      landlord: users,
    })
    .from(contracts)
    .innerJoin(properties, eq(contracts.propertyId, properties.id))
    .innerJoin(users, eq(contracts.landlordId, users.id))
    .where(
      and(
        eq(contracts.tenantId, tenantId),
        or(
          eq(contracts.status, "active"),
          eq(contracts.status, "fully_signed")
        )
      )
    )
    .orderBy(desc(contracts.createdAt))
    .limit(1);
  
  if (result.length === 0) return null;
  
  return {
    ...result[0].contract,
    property: result[0].property,
    landlord: result[0].landlord,
  };
}

export async function getTenantActiveRentals(tenantId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get ALL active or fully_signed contracts for the tenant
  const results = await db
    .select({
      contract: contracts,
      property: properties,
      landlord: users,
    })
    .from(contracts)
    .innerJoin(properties, eq(contracts.propertyId, properties.id))
    .innerJoin(users, eq(contracts.landlordId, users.id))
    .where(
      and(
        eq(contracts.tenantId, tenantId),
        or(
          eq(contracts.status, "active"),
          eq(contracts.status, "fully_signed")
        )
      )
    )
    .orderBy(desc(contracts.createdAt));
  
  return results.map(row => ({
    ...row.contract,
    property: row.property,
    landlord: row.landlord,
  }));
}
