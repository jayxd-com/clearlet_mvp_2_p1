import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json, decimal, date, index } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  name: text("name"),
  email: varchar("email", { length: 320 }).notNull().unique(), // Enforced unique email for local auth
  phone: varchar("phone", { length: 20 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  passwordHash: varchar("passwordHash", { length: 255 }), // Required for local auth
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  isSuperAdmin: boolean("isSuperAdmin").default(false),
  userType: mysqlEnum("userType", ["tenant", "landlord", "buyer", "seller", "admin"]).default("tenant").notNull(),
  profileComplete: boolean("profileComplete").default(false),
  verificationStatus: mysqlEnum("verificationStatus", ["unverified", "pending", "verified"]).default("unverified"),
  stripeAccountId: varchar("stripeAccountId", { length: 255 }),
  stripeOnboardingComplete: boolean("stripeOnboardingComplete").default(false),
  languagePreference: varchar("languagePreference", { length: 10 }).default("en"),
  themePreference: varchar("themePreference", { length: 10 }).default("light"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * User profiles table - Extended user information
 */
export const userProfiles = mysqlTable("userProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  bio: text("bio"),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  country: varchar("country", { length: 100 }),
  profileImage: varchar("profileImage", { length: 500 }),
  verificationScore: int("verificationScore").default(0),
  dniNie: varchar("dniNie", { length: 20 }),
  companyName: varchar("companyName", { length: 255 }), // Optional company name for landlords
  // Tenant-specific fields
  hasPets: boolean("hasPets").default(false),
  petType: varchar("petType", { length: 100 }), // e.g., "dog", "cat", "dog and cat"
  petCount: int("petCount").default(0),
  numberOfOccupants: int("numberOfOccupants").default(1),
  occupantDetails: text("occupantDetails"), // JSON string with occupant info
  tenantRequirements: text("tenantRequirements"), // Additional requirements/preferences
  // Tenant financial and employment information
  annualSalary: int("annualSalary"), // Annual salary in cents (EUR)
  rentalHistory: int("rentalHistory"), // Rental history in months
  employmentStatus: mysqlEnum("employmentStatus", ["employed", "self-employed", "student", "unemployed"]),
  // ClearLet Tenant Score (0-100)
  tenantScore: int("tenantScore"), // Calculated tenant score based on rental history, employment, salary, payment history, references, and verification
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = typeof userProfiles.$inferInsert;

/**
 * Documents table - User verification documents (ID, financial records, etc.)
 */
export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  documentType: mysqlEnum("documentType", ["id", "income", "employment", "reference"]).notNull(),
  fileUrl: varchar("fileUrl", { length: 500 }).notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  verificationStatus: mysqlEnum("verificationStatus", ["pending", "verified", "rejected"]).default("pending"),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

/**
 * Properties table - Rental property listings
 */
export const properties = mysqlTable("properties", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  address: text("address").notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  country: varchar("country", { length: 100 }).notNull(),
  zipCode: varchar("zipCode", { length: 20 }),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  bedrooms: int("bedrooms").notNull(),
  bathrooms: int("bathrooms").notNull(),
  squareFeet: int("squareFeet"),
  rentPrice: int("rentPrice").notNull(),
  currency: varchar("currency", { length: 3 }).default("EUR"),
  amenities: json("amenities"),
  images: json("images"),
  status: mysqlEnum("status", ["pending_verification", "active", "inactive", "rented"]).default("pending_verification"),
  verifiedLandlord: boolean("verifiedLandlord").default(false),
  
  // Pet policy
  allowPets: boolean("allowPets").default(false),
  petDeposit: int("petDeposit"), // Additional deposit for pets in cents
  petRestrictions: text("petRestrictions"), // e.g., "Small dogs only, max 2 pets"
  
  // Checklist template
  checklistTemplateId: int("checklistTemplateId"), // Link to default checklist template for this property
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Property = typeof properties.$inferSelect;
export type InsertProperty = typeof properties.$inferInsert;

/**
 * Messages table - Direct communication between users
 */
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  senderId: int("senderId").notNull(),
  recipientId: int("recipientId").notNull(),
  propertyId: int("propertyId"),
  inquiryId: int("inquiryId"),
  content: text("content").notNull(),
  isRead: boolean("isRead").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

/**
 * Inquiries table - Property application/inquiry records
 */
export const inquiries = mysqlTable("inquiries", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("propertyId").notNull(),
  userId: int("userId").notNull(),
  landlordId: int("landlordId").notNull(),
  status: mysqlEnum("status", ["pending", "accepted", "rejected", "withdrawn"]).default("pending"),
  message: text("message"),
  moveInDate: timestamp("moveInDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Inquiry = typeof inquiries.$inferSelect;
export type InsertInquiry = typeof inquiries.$inferInsert;

/**
 * Saved Properties table - User's favorite/saved properties
 */
export const savedProperties = mysqlTable("savedProperties", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  propertyId: int("propertyId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SavedProperty = typeof savedProperties.$inferSelect;
export type InsertSavedProperty = typeof savedProperties.$inferInsert;

/**
 * Applications table - Formal rental applications with document sharing
 */
export const applications = mysqlTable("applications", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("propertyId").notNull(),
  userId: int("userId").notNull(),
  landlordId: int("landlordId").notNull(),
  status: mysqlEnum("status", ["pending", "accepted", "rejected", "withdrawn"]).default("pending"),
  moveInDate: timestamp("moveInDate"),
  leaseLength: int("leaseLength"), // in months
  message: text("message"),
  shareIdDocument: boolean("shareIdDocument").default(false),
  shareIncomeDocument: boolean("shareIncomeDocument").default(false),
  shareEmploymentDocument: boolean("shareEmploymentDocument").default(false),
  shareReferences: boolean("shareReferences").default(false), // Added
  numberOfOccupants: int("numberOfOccupants").default(1), // Added
  hasPets: boolean("hasPets").default(false), // Added
  petType: varchar("petType", { length: 100 }), // Added
  petCount: int("petCount"), // Added
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Application = typeof applications.$inferSelect;
export type InsertApplication = typeof applications.$inferInsert;

export const applicationRelations = relations(applications, ({ one }) => ({
  property: one(properties, {
    fields: [applications.propertyId],
    references: [properties.id],
  }),
  tenant: one(users, {
    fields: [applications.userId],
    references: [users.id],
  }),
  landlord: one(users, {
    fields: [applications.landlordId],
    references: [users.id],
  }),
}));

/**
 * Relations
 */
export const userRelations = relations(users, ({ many, one }) => ({
  profiles: many(userProfiles),
  documents: many(documents),
  properties: many(properties),
  sentMessages: many(messages, { relationName: "sender" }),
  receivedMessages: many(messages, { relationName: "recipient" }),
  inquiries: many(inquiries, { relationName: "tenant" }),
  landlordInquiries: many(inquiries, { relationName: "landlord" }),
}));

export const userProfileRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, {
    fields: [userProfiles.userId],
    references: [users.id],
  }),
}));

export const documentRelations = relations(documents, ({ one }) => ({
  user: one(users, {
    fields: [documents.userId],
    references: [users.id],
  }),
}));

export const propertyRelations = relations(properties, ({ one, many }) => ({
  landlord: one(users, {
    fields: [properties.userId],
    references: [users.id],
  }),
  inquiries: many(inquiries),
  messages: many(messages),
}));

export const messageRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: "sender",
  }),
  recipient: one(users, {
    fields: [messages.recipientId],
    references: [users.id],
    relationName: "recipient",
  }),
  property: one(properties, {
    fields: [messages.propertyId],
    references: [properties.id],
  }),
  inquiry: one(inquiries, {
    fields: [messages.inquiryId],
    references: [inquiries.id],
  }),
}));

export const inquiryRelations = relations(inquiries, ({ one, many }) => ({
  property: one(properties, {
    fields: [inquiries.propertyId],
    references: [properties.id],
  }),
  tenant: one(users, {
    fields: [inquiries.userId],
    references: [users.id],
    relationName: "tenant",
  }),
  landlord: one(users, {
    fields: [inquiries.landlordId],
    references: [users.id],
    relationName: "landlord",
  }),
  messages: many(messages),
}));


/**
 * Site Roles table - Define custom roles and permissions
 */
export const siteRoles = mysqlTable("siteRoles", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  isSystem: boolean("isSystem").default(false), // System roles cannot be deleted
  permissions: text("permissions"), // JSON array of permission strings
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SiteRole = typeof siteRoles.$inferSelect;
export type InsertSiteRole = typeof siteRoles.$inferInsert;

/**
 * User Roles junction table - Assign roles to users
 */
export const userRoles = mysqlTable("userRoles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  roleId: int("roleId").notNull(),
  assignedBy: int("assignedBy"), // Admin who assigned this role
  assignedAt: timestamp("assignedAt").defaultNow().notNull(),
});

export type UserRole = typeof userRoles.$inferSelect;
export type InsertUserRole = typeof userRoles.$inferInsert;

/**
 * Audit Logs table - Track all admin actions
 */
export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  adminId: int("adminId").notNull(),
  action: varchar("action", { length: 100 }).notNull(), // e.g., "document_approved", "user_promoted", "role_created"
  resourceType: varchar("resourceType", { length: 100 }), // e.g., "document", "user", "role"
  resourceId: int("resourceId"), // ID of the affected resource
  details: text("details"), // JSON with additional details
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

/**
 * Relations for roles
 */
export const siteRolesRelations = relations(siteRoles, ({ many }) => ({
  userRoles: many(userRoles),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
  role: one(siteRoles, {
    fields: [userRoles.roleId],
    references: [siteRoles.id],
  }),
  assignedByUser: one(users, {
    fields: [userRoles.assignedBy],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  admin: one(users, {
    fields: [auditLogs.adminId],
    references: [users.id],
  }),
}));

/**
 * Contracts table - Digital rental contracts between landlords and tenants
 */
export const contracts = mysqlTable("contracts", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("propertyId").notNull(),
  landlordId: int("landlordId").notNull(),
  tenantId: int("tenantId").notNull(),
  applicationId: int("applicationId"), // Link to the application that led to this contract
  
  // Contract details
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  monthlyRent: int("monthlyRent").notNull(),
  securityDeposit: int("securityDeposit").notNull(),
  currency: varchar("currency", { length: 3 }).default("EUR"),
  language: varchar("language", { length: 2 }).default("en"),
  
  // Contract terms
  terms: text("terms"), // Full contract text/terms
  specialConditions: text("specialConditions"), // Any special conditions or clauses
  
  // Signature tracking
  landlordSignature: text("landlordSignature"), // Base64 encoded signature image
  landlordSignedAt: timestamp("landlordSignedAt"),
  tenantSignature: text("tenantSignature"), // Base64 encoded signature image
  tenantSignedAt: timestamp("tenantSignedAt"),
  
  // Status tracking
  status: mysqlEnum("status", ["draft", "sent_to_tenant", "tenant_signed", "fully_signed", "active", "expired", "terminated"]).notNull().default("draft"),
  
  // Checklist linkage
  checklistId: int("checklistId"), // Link to move-in checklist
  
  // Tenant data (auto-pulled from profile)
  tenantName: varchar("tenantName", { length: 255 }),
  tenantEmail: varchar("tenantEmail", { length: 320 }),
  tenantPhone: varchar("tenantPhone", { length: 50 }),
  tenantOccupants: int("tenantOccupants"),
  tenantPets: text("tenantPets"), // JSON array of pet details
  
  // Document storage
  contractPdfUrl: varchar("contractPdfUrl", { length: 500 }), // URL to signed PDF
  
  // Rent amount for this specific contract (may differ from property listing price)
  rentAmount: int("rentAmount"), // Monthly rent in cents
  
  // Deposit payment tracking
  depositPaid: boolean("depositPaid").default(false),
  depositPaidAt: timestamp("depositPaidAt"),
  depositPaymentMethod: varchar("depositPaymentMethod", { length: 50 }), // bank_transfer, cash, bizum, other
  depositPaymentReference: varchar("depositPaymentReference", { length: 255 }),
  
  // First month rent payment tracking
  firstMonthRentPaid: boolean("firstMonthRentPaid").default(false),
  firstMonthRentPaidAt: timestamp("firstMonthRentPaidAt"),
  firstMonthRentPaymentMethod: varchar("firstMonthRentPaymentMethod", { length: 50 }),
  firstMonthRentPaymentReference: varchar("firstMonthRentPaymentReference", { length: 255 }),
  
  // Move-in tracking
  keysCollected: boolean("keysCollected").default(false),
  keysCollectedAt: timestamp("keysCollectedAt"),
  moveInDate: timestamp("moveInDate"),
  checklistDeadline: timestamp("checklistDeadline"),
  checklistCompletedAt: timestamp("checklistCompletedAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Contract = typeof contracts.$inferSelect;
export type InsertContract = typeof contracts.$inferInsert;

/**
 * Relations for contracts
 */
export const contractsRelations = relations(contracts, ({ one }) => ({
  property: one(properties, {
    fields: [contracts.propertyId],
    references: [properties.id],
  }),
  landlord: one(users, {
    fields: [contracts.landlordId],
    references: [users.id],
    relationName: "landlordContracts",
  }),
  tenant: one(users, {
    fields: [contracts.tenantId],
    references: [users.id],
    relationName: "tenantContracts",
  }),
  application: one(inquiries, {
    fields: [contracts.applicationId],
    references: [inquiries.id],
  }),
}));

// Add contracts to user relations
export const usersContractsRelations = relations(users, ({ many }) => ({
  landlordContracts: many(contracts, { relationName: "landlordContracts" }),
  tenantContracts: many(contracts, { relationName: "tenantContracts" }),
}));

/**
 * Contract Templates table - Reusable contract templates for landlords
 */
export const contractTemplates = mysqlTable("contractTemplates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Landlord who created the template
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  
  // Template content
  terms: text("terms").notNull(), // Main contract text
  specialConditions: text("specialConditions"), // Default special conditions
  
  // Template settings
  isDefault: boolean("isDefault").default(false), // Whether this is the user's default template
  isPublic: boolean("isPublic").default(false), // Whether other users can use this template
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ContractTemplate = typeof contractTemplates.$inferSelect;
export type InsertContractTemplate = typeof contractTemplates.$inferInsert;

/**
 * Relations for contract templates
 */
export const contractTemplatesRelations = relations(contractTemplates, ({ one }) => ({
  user: one(users, {
    fields: [contractTemplates.userId],
    references: [users.id],
  }),
}));


/**
 * Payments table - Track rent payments and transactions
 */
export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  contractId: int("contractId").notNull(),
  tenantId: int("tenantId").notNull(),
  landlordId: int("landlordId").notNull(),
  propertyId: int("propertyId").notNull(),
  
  amount: int("amount").notNull(), // Amount in cents
  currency: varchar("currency", { length: 3 }).default("EUR").notNull(),
  
  type: mysqlEnum("type", ["rent", "deposit"]).default("rent").notNull(), // Payment type
  
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed", "refunded"]).default("pending").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 50 }), // card, bank_transfer, etc.
  
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  stripeChargeId: varchar("stripeChargeId", { length: 255 }),
  
  platformFee: int("platformFee").default(0), // Platform commission in cents
  netAmount: int("netAmount").default(0), // Amount for landlord in cents
  
  dueDate: timestamp("dueDate").notNull(),
  paidAt: timestamp("paidAt"),
  
  description: text("description"),
  receiptUrl: varchar("receiptUrl", { length: 500 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

/**
 * Relations for payments
 */
export const paymentsRelations = relations(payments, ({ one }) => ({
  contract: one(contracts, {
    fields: [payments.contractId],
    references: [contracts.id],
  }),
  tenant: one(users, {
    fields: [payments.tenantId],
    references: [users.id],
  }),
  landlord: one(users, {
    fields: [payments.landlordId],
    references: [users.id],
  }),
  property: one(properties, {
    fields: [payments.propertyId],
    references: [properties.id],
  }),
}));


/**
 * Maintenance Requests table - Track property maintenance issues
 */
export const maintenanceRequests = mysqlTable("maintenanceRequests", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("propertyId").notNull(),
  tenantId: int("tenantId").notNull(),
  landlordId: int("landlordId").notNull(),
  
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: mysqlEnum("category", ["plumbing", "electrical", "heating", "appliance", "structural", "pest", "other"]).notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "cancelled"]).default("pending").notNull(),
  
  photos: text("photos"), // JSON array of photo URLs
  
  contractorId: int("contractorId"),
  contractorName: varchar("contractorName", { length: 255 }),
  contractorPhone: varchar("contractorPhone", { length: 20 }),
  
  estimatedCost: int("estimatedCost"), // Cost in cents
  actualCost: int("actualCost"), // Cost in cents
  
  scheduledDate: timestamp("scheduledDate"),
  completedDate: timestamp("completedDate"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MaintenanceRequest = typeof maintenanceRequests.$inferSelect;
export type InsertMaintenanceRequest = typeof maintenanceRequests.$inferInsert;

/**
 * Maintenance Comments table - Track updates and communication
 */
export const maintenanceComments = mysqlTable("maintenanceComments", {
  id: int("id").autoincrement().primaryKey(),
  requestId: int("requestId").notNull(),
  userId: int("userId").notNull(),
  
  comment: text("comment").notNull(),
  isInternal: boolean("isInternal").default(false), // Only visible to landlord
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MaintenanceComment = typeof maintenanceComments.$inferSelect;
export type InsertMaintenanceComment = typeof maintenanceComments.$inferInsert;

/**
 * Relations for maintenance requests
 */
export const maintenanceRequestsRelations = relations(maintenanceRequests, ({ one }) => ({
  property: one(properties, {
    fields: [maintenanceRequests.propertyId],
    references: [properties.id],
  }),
  tenant: one(users, {
    fields: [maintenanceRequests.tenantId],
    references: [users.id],
  }),
  landlord: one(users, {
    fields: [maintenanceRequests.landlordId],
    references: [users.id],
  }),
}));

export const maintenanceCommentsRelations = relations(maintenanceComments, ({ one }) => ({
  request: one(maintenanceRequests, {
    fields: [maintenanceComments.requestId],
    references: [maintenanceRequests.id],
  }),
  user: one(users, {
    fields: [maintenanceComments.userId],
    references: [users.id],
  }),
}));


/**
 * Document Vault table - Secure document storage and sharing
 */
export const documentVault = mysqlTable("documentVault", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Owner of the document
  propertyId: int("propertyId"), // Optional: Link to property
  contractId: int("contractId"), // Optional: Link to contract
  
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileUrl: varchar("fileUrl", { length: 500 }).notNull(),
  fileKey: varchar("fileKey", { length: 500 }).notNull(), // S3 key for deletion
  fileSize: int("fileSize").notNull(), // Size in bytes
  mimeType: varchar("mimeType", { length: 100 }).notNull(),
  
  category: mysqlEnum("category", ["insurance", "inspection", "lease", "receipt", "certificate", "other"]).notNull(),
  description: text("description"),
  
  // Sharing permissions
  sharedWith: text("sharedWith"), // JSON array of user IDs who can access
  isPublic: boolean("isPublic").default(false),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DocumentVault = typeof documentVault.$inferSelect;
export type InsertDocumentVault = typeof documentVault.$inferInsert;

/**
 * Relations for document vault
 */
export const documentVaultRelations = relations(documentVault, ({ one }) => ({
  user: one(users, {
    fields: [documentVault.userId],
    references: [users.id],
  }),
  property: one(properties, {
    fields: [documentVault.propertyId],
    references: [properties.id],
  }),
  contract: one(contracts, {
    fields: [documentVault.contractId],
    references: [contracts.id],
  }),
}));


/**
 * Notifications table - System notifications for users
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["contract", "payment", "maintenance", "application", "system", "checklist", "key_collection"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  link: varchar("link", { length: 500 }), // URL to navigate to when clicked
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Notifications Relations
 */
export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));


/**
 * Contract Amendments table - Track proposed changes to existing contracts
 */
export const contractAmendments = mysqlTable("contractAmendments", {
  id: int("id").autoincrement().primaryKey(),
  contractId: int("contractId").notNull(),
  proposedBy: int("proposedBy").notNull(), // User ID who proposed the amendment
  
  // Amendment details
  amendmentType: mysqlEnum("amendmentType", ["rent_change", "term_extension", "terms_update", "other"]).notNull(),
  description: text("description").notNull(),
  
  // Proposed changes (JSON with old and new values)
  changes: text("changes").notNull(), // JSON: { field: { old: value, new: value } }
  
  // New values (if applicable)
  newMonthlyRent: int("newMonthlyRent"),
  newEndDate: timestamp("newEndDate"),
  newTerms: text("newTerms"),
  
  // Status tracking
  status: mysqlEnum("status", ["pending", "approved", "rejected", "withdrawn"]).default("pending").notNull(),
  
  // Response
  respondedBy: int("respondedBy"),
  respondedAt: timestamp("respondedAt"),
  responseMessage: text("responseMessage"),
  
  // Effective date
  effectiveDate: timestamp("effectiveDate"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ContractAmendment = typeof contractAmendments.$inferSelect;
export type InsertContractAmendment = typeof contractAmendments.$inferInsert;

/**
 * Relations for contract amendments
 */
export const contractAmendmentsRelations = relations(contractAmendments, ({ one }) => ({
  contract: one(contracts, {
    fields: [contractAmendments.contractId],
    references: [contracts.id],
  }),
  proposer: one(users, {
    fields: [contractAmendments.proposedBy],
    references: [users.id],
    relationName: "amendmentProposer",
  }),
  responder: one(users, {
    fields: [contractAmendments.respondedBy],
    references: [users.id],
    relationName: "amendmentResponder",
  }),
}));


/**
 * Contract Renewals table - Track contract renewal offers and acceptances
 */
export const contractRenewals = mysqlTable("contractRenewals", {
  id: int("id").autoincrement().primaryKey(),
  originalContractId: int("originalContractId").notNull(),
  newContractId: int("newContractId"), // Created after acceptance
  
  landlordId: int("landlordId").notNull(),
  tenantId: int("tenantId").notNull(),
  propertyId: int("propertyId").notNull(),
  
  // Renewal terms
  proposedStartDate: timestamp("proposedStartDate").notNull(),
  proposedEndDate: timestamp("proposedEndDate").notNull(),
  proposedMonthlyRent: int("proposedMonthlyRent").notNull(),
  proposedSecurityDeposit: int("proposedSecurityDeposit").notNull(),
  proposedTerms: text("proposedTerms"),
  
  // Status tracking
  status: mysqlEnum("status", ["pending", "accepted", "rejected", "expired"]).default("pending").notNull(),
  
  // Response
  respondedAt: timestamp("respondedAt"),
  responseMessage: text("responseMessage"),
  
  // Expiration
  offerExpiresAt: timestamp("offerExpiresAt").notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ContractRenewal = typeof contractRenewals.$inferSelect;
export type InsertContractRenewal = typeof contractRenewals.$inferInsert;

/**
 * Relations for contract renewals
 */
export const contractRenewalsRelations = relations(contractRenewals, ({ one }) => ({
  originalContract: one(contracts, {
    fields: [contractRenewals.originalContractId],
    references: [contracts.id],
    relationName: "originalContract",
  }),
  newContract: one(contracts, {
    fields: [contractRenewals.newContractId],
    references: [contracts.id],
    relationName: "renewedContract",
  }),
  landlord: one(users, {
    fields: [contractRenewals.landlordId],
    references: [users.id],
  }),
  tenant: one(users, {
    fields: [contractRenewals.tenantId],
    references: [users.id],
  }),
  property: one(properties, {
    fields: [contractRenewals.propertyId],
    references: [properties.id],
  }),
}));

/**
 * Contract Terminations table - Track termination requests
 */
export const contractTerminations = mysqlTable("contractTerminations", {
  id: int("id").autoincrement().primaryKey(),
  contractId: int("contractId").notNull(),
  requestedBy: int("requestedBy").notNull(), // User ID
  
  reason: text("reason").notNull(),
  desiredEndDate: timestamp("desiredEndDate").notNull(),
  
  status: mysqlEnum("status", ["pending", "approved", "rejected", "cancelled"]).default("pending").notNull(),
  
  // Response
  respondedBy: int("respondedBy"),
  respondedAt: timestamp("respondedAt"),
  responseMessage: text("responseMessage"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ContractTermination = typeof contractTerminations.$inferSelect;
export type InsertContractTermination = typeof contractTerminations.$inferInsert;

export const contractTerminationsRelations = relations(contractTerminations, ({ one }) => ({
  contract: one(contracts, {
    fields: [contractTerminations.contractId],
    references: [contracts.id],
  }),
  requester: one(users, {
    fields: [contractTerminations.requestedBy],
    references: [users.id],
    relationName: "terminationRequester",
  }),
  responder: one(users, {
    fields: [contractTerminations.respondedBy],
    references: [users.id],
    relationName: "terminationResponder",
  }),
}));


/**
 * Analytics Events table - Track contract lifecycle and user actions
 */
export const analyticsEvents = mysqlTable("analyticsEvents", {
  id: int("id").autoincrement().primaryKey(),
  
  // Event details
  eventType: varchar("eventType", { length: 100 }).notNull(), // e.g., "contract_created", "contract_signed", "payment_completed"
  eventCategory: mysqlEnum("eventCategory", ["contract", "payment", "maintenance", "application", "user"]).notNull(),
  
  // Associated entities
  userId: int("userId"),
  propertyId: int("propertyId"),
  contractId: int("contractId"),
  paymentId: int("paymentId"),
  applicationId: int("applicationId"),
  
  // Event metadata
  metadata: text("metadata"), // JSON with additional event data
  
  // Timestamp
  eventTimestamp: timestamp("eventTimestamp").defaultNow().notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalyticsEvent = typeof analyticsEvents.$inferInsert;

/**
 * Relations for analytics events
 */
export const analyticsEventsRelations = relations(analyticsEvents, ({ one }) => ({
  user: one(users, {
    fields: [analyticsEvents.userId],
    references: [users.id],
  }),
  property: one(properties, {
    fields: [analyticsEvents.propertyId],
    references: [properties.id],
  }),
  contract: one(contracts, {
    fields: [analyticsEvents.contractId],
    references: [contracts.id],
  }),
  payment: one(payments, {
    fields: [analyticsEvents.paymentId],
    references: [payments.id],
  }),
  application: one(applications, {
    fields: [analyticsEvents.applicationId],
    references: [applications.id],
  }),
}));


/**
 * Saved Filters table - User-saved search/filter presets
 */
export const savedFilters = mysqlTable("savedFilters", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  
  // Filter context
  filterType: mysqlEnum("filterType", ["contracts", "properties", "applications", "payments"]).notNull(),
  
  // Filter criteria (JSON)
  criteria: text("criteria").notNull(), // JSON with filter parameters
  
  isDefault: boolean("isDefault").default(false),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SavedFilter = typeof savedFilters.$inferSelect;
export type InsertSavedFilter = typeof savedFilters.$inferInsert;

/**
 * Relations for saved filters
 */
export const savedFiltersRelations = relations(savedFilters, ({ one }) => ({
  user: one(users, {
    fields: [savedFilters.userId],
    references: [users.id],
  }),
}));

/**
 * Message Templates table - Pre-written messages for landlords
 */
export const messageTemplates = mysqlTable("messageTemplates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"), // Null for system default templates
  title: varchar("title", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  content: text("content").notNull(),
  isDefault: boolean("isDefault").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MessageTemplate = typeof messageTemplates.$inferSelect;
export type InsertMessageTemplate = typeof messageTemplates.$inferInsert;

/**
 * ClearCoin Wallets table - User token balances
 */
export const clearCoinWallets = mysqlTable("clearCoinWallets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  
  balance: int("balance").default(0).notNull(), // Store as integer (cents/points)
  
  totalEarned: int("totalEarned").default(0).notNull(),
  totalSpent: int("totalSpent").default(0).notNull(),
  
  // Future crypto integration
  walletAddress: varchar("walletAddress", { length: 255 }), // Blockchain wallet address
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ClearCoinWallet = typeof clearCoinWallets.$inferSelect;
export type InsertClearCoinWallet = typeof clearCoinWallets.$inferInsert;

/**
 * ClearCoin Transactions table - Token earning and spending history
 */
export const clearCoinTransactions = mysqlTable("clearCoinTransactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  
  transactionType: mysqlEnum("transactionType", ["earn", "spend", "transfer", "bonus"]).notNull(),
  
  amount: int("amount").notNull(), // Store as integer (cents/points)
  
  reason: varchar("reason", { length: 255 }).notNull(),
  description: text("description"),
  
  // Related entities
  relatedContractId: int("relatedContractId"),
  relatedPaymentId: int("relatedPaymentId"),
  relatedApplicationId: int("relatedApplicationId"),
  
  balanceAfter: int("balanceAfter").notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ClearCoinTransaction = typeof clearCoinTransactions.$inferSelect;
export type InsertClearCoinTransaction = typeof clearCoinTransactions.$inferInsert;

/**
 * Relations for ClearCoin tables
 */
export const clearCoinWalletsRelations = relations(clearCoinWallets, ({ one }) => ({
  user: one(users, {
    fields: [clearCoinWallets.userId],
    references: [users.id],
  }),
}));

export const clearCoinTransactionsRelations = relations(clearCoinTransactions, ({ one }) => ({
  user: one(users, {
    fields: [clearCoinTransactions.userId],
    references: [users.id],
  }),
  contract: one(contracts, {
    fields: [clearCoinTransactions.relatedContractId],
    references: [contracts.id],
  }),
  payment: one(payments, {
    fields: [clearCoinTransactions.relatedPaymentId],
    references: [payments.id],
  }),
  application: one(applications, {
    fields: [clearCoinTransactions.relatedApplicationId],
    references: [applications.id],
  }),
}));

/**
 * Key Collections table - Schedule and track key handover after contract signing
 */
export const keyCollections = mysqlTable("keyCollections", {
  id: int("id").autoincrement().primaryKey(),
  contractId: int("contractId").notNull(),
  collectionDate: timestamp("collectionDate").notNull(), // Date and time of key collection
  location: text("location").notNull(), // Address where keys will be collected
  status: mysqlEnum("status", ["scheduled", "confirmed", "completed", "cancelled"]).default("scheduled"),
  landlordConfirmed: boolean("landlordConfirmed").default(false),
  tenantConfirmed: boolean("tenantConfirmed").default(false),
  landlordNotes: text("landlordNotes"),
  tenantNotes: text("tenantNotes"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type KeyCollection = typeof keyCollections.$inferSelect;
export type InsertKeyCollection = typeof keyCollections.$inferInsert;

/**
 * Relations for key collections
 */
export const keyCollectionsRelations = relations(keyCollections, ({ one }) => ({
  contract: one(contracts, {
    fields: [keyCollections.contractId],
    references: [contracts.id],
  }),
}));

export const contractsKeyCollectionRelations = relations(contracts, ({ one }) => ({
  keyCollection: one(keyCollections, {
    fields: [contracts.id],
    references: [keyCollections.contractId],
  }),
}));


/**
 * Move-In Checklists table - Document property condition at move-in
 */
export const moveInChecklists = mysqlTable("moveInChecklists", {
  id: int("id").autoincrement().primaryKey(),
  contractId: int("contractId").notNull().unique(), // One checklist per contract
  
  // Checklist items (JSON array of rooms/areas with condition notes)
  items: text("items").notNull(), // JSON: [{ room: "Living Room", items: [{ name: "Walls", condition: "good", notes: "", photos: [] }] }]
  
  // Photos (JSON array of photo URLs)
  photos: text("photos"), // JSON: ["url1", "url2", ...]
  
  // Signatures
  tenantSignature: text("tenantSignature"), // Base64 encoded signature image
  tenantSignedAt: timestamp("tenantSignedAt"),
  landlordSignature: text("landlordSignature"), // Base64 encoded signature image
  landlordSignedAt: timestamp("landlordSignedAt"),
  
  // Status tracking
  status: mysqlEnum("status", ["draft", "tenant_signed", "completed"]).default("draft"),
  
  // Additional notes
  tenantNotes: text("tenantNotes"),
  landlordNotes: text("landlordNotes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MoveInChecklist = typeof moveInChecklists.$inferSelect;
export type InsertMoveInChecklist = typeof moveInChecklists.$inferInsert;

/**
 * Relations for move-in checklists
 */
export const moveInChecklistsRelations = relations(moveInChecklists, ({ one }) => ({
  contract: one(contracts, {
    fields: [moveInChecklists.contractId],
    references: [contracts.id],
  }),
}));


/**
 * Checklist Templates table - Customizable move-in checklist templates
 */
export const checklistTemplates = mysqlTable("checklistTemplates", {
  id: int("id").autoincrement().primaryKey(),
  landlordId: int("landlordId").notNull(), // Owner of the template
  
  name: varchar("name", { length: 255 }).notNull(),
  propertyType: mysqlEnum("propertyType", ["apartment", "house", "studio", "commercial", "other"]).notNull(),
  
  // Template structure (JSON array of rooms/areas with items)
  items: text("items").notNull(), // JSON: [{ room: "Living Room", items: [{ name: "Walls", required: true }] }]
  
  isDefault: boolean("isDefault").default(false), // System default templates
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ChecklistTemplate = typeof checklistTemplates.$inferSelect;
export type InsertChecklistTemplate = typeof checklistTemplates.$inferInsert;

/**
 * Relations for checklist templates
 */
export const checklistTemplatesRelations = relations(checklistTemplates, ({ one }) => ({
  landlord: one(users, {
    fields: [checklistTemplates.landlordId],
    references: [users.id],
  }),
}));


/**
 * Move-Out Checklists table - Document property condition at move-out with comparison to move-in
 */
export const moveOutChecklists = mysqlTable("moveOutChecklists", {
  id: int("id").autoincrement().primaryKey(),
  contractId: int("contractId").notNull().unique(), // One move-out checklist per contract
  moveInChecklistId: int("moveInChecklistId").notNull(), // Reference to original move-in checklist
  
  // Checklist items (JSON array matching move-in structure with updated conditions)
  items: text("items").notNull(), // JSON: [{ room: "Living Room", items: [{ name: "Walls", condition: "good", notes: "", photos: [], moveInCondition: "excellent" }] }]
  
  // Photos (JSON array of photo URLs)
  photos: text("photos"), // JSON: ["url1", "url2", ...]
  
  // Damage assessment
  damages: text("damages"), // JSON: [{ item: "Living Room - Walls", description: "Scratch on wall", cost: 50, responsible: "tenant" }]
  totalDamageCost: int("totalDamageCost").default(0), // Total cost of damages in cents
  
  // Security deposit calculation
  securityDepositAmount: int("securityDepositAmount").notNull(), // Original deposit in cents
  securityDepositReturned: int("securityDepositReturned").default(0), // Amount returned in cents
  securityDepositDeductions: text("securityDepositDeductions"), // JSON: [{ reason: "Wall repair", amount: 50 }]
  
  // Signatures
  tenantSignature: text("tenantSignature"), // Base64 encoded signature image
  tenantSignedAt: timestamp("tenantSignedAt"),
  landlordSignature: text("landlordSignature"), // Base64 encoded signature image
  landlordSignedAt: timestamp("landlordSignedAt"),
  
  // Status tracking
  status: mysqlEnum("status", ["draft", "tenant_signed", "landlord_reviewed", "completed", "disputed"]).default("draft"),
  
  // Additional notes
  tenantNotes: text("tenantNotes"),
  landlordNotes: text("landlordNotes"),
  
  // Move-out date
  moveOutDate: date("moveOutDate").notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MoveOutChecklist = typeof moveOutChecklists.$inferSelect;
export type InsertMoveOutChecklist = typeof moveOutChecklists.$inferInsert;

/**
 * Relations for move-out checklists
 */
export const moveOutChecklistsRelations = relations(moveOutChecklists, ({ one }) => ({
  contract: one(contracts, {
    fields: [moveOutChecklists.contractId],
    references: [contracts.id],
  }),
  moveInChecklist: one(moveInChecklists, {
    fields: [moveOutChecklists.moveInChecklistId],
    references: [moveInChecklists.id],
  }),
}));


/**
 * Disputes table - Security deposit and maintenance dispute tracking
 */
export const disputes = mysqlTable("disputes", {
  id: int("id").autoincrement().primaryKey(),
  contractId: int("contractId").notNull(),
  
  // Who filed the dispute
  filedBy: mysqlEnum("filedBy", ["tenant", "landlord"]).notNull(),
  filedByUserId: int("filedByUserId").notNull(),
  
  // Dispute details
  disputeType: mysqlEnum("disputeType", [
    "security_deposit", 
    "maintenance", 
    "damage_claim", 
    "cleaning_fee",
    "rent_arrears",
    "other"
  ]).notNull(),
  
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  
  // Financial details
  claimedAmount: int("claimedAmount").notNull(), // Amount in cents
  proposedResolution: int("proposedResolution"), // Counter-offer amount in cents
  finalAmount: int("finalAmount"), // Agreed settlement amount in cents
  
  // Status tracking
  status: mysqlEnum("status", [
    "open",
    "under_review", 
    "awaiting_response",
    "negotiating",
    "resolved",
    "closed",
    "escalated"
  ]).default("open"),
  
  // Resolution details
  resolutionNotes: text("resolutionNotes"),
  resolvedAt: timestamp("resolvedAt"),
  resolvedBy: int("resolvedBy"), // User ID who accepted the resolution
  
  // Priority and urgency
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium"),
  
  // Related entities
  moveOutChecklistId: int("moveOutChecklistId"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Dispute = typeof disputes.$inferSelect;
export type InsertDispute = typeof disputes.$inferInsert;

/**
 * Dispute Evidence table - Photos and documents supporting dispute claims
 */
export const disputeEvidence = mysqlTable("disputeEvidence", {
  id: int("id").autoincrement().primaryKey(),
  disputeId: int("disputeId").notNull(),
  uploadedBy: int("uploadedBy").notNull(), // User ID
  
  // File details
  fileUrl: varchar("fileUrl", { length: 500 }).notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileType: varchar("fileType", { length: 50 }).notNull(), // image/jpeg, application/pdf, etc.
  fileSize: int("fileSize"), // Size in bytes
  
  // Evidence metadata
  evidenceType: mysqlEnum("evidenceType", [
    "photo_before",
    "photo_after", 
    "receipt",
    "invoice",
    "contract",
    "correspondence",
    "other"
  ]).notNull(),
  
  caption: text("caption"), // Description of the evidence
  location: varchar("location", { length: 255 }), // Room or area in property
  
  // Photo comparison
  comparisonPairId: int("comparisonPairId"), // Link before/after photos
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DisputeEvidence = typeof disputeEvidence.$inferSelect;
export type InsertDisputeEvidence = typeof disputeEvidence.$inferInsert;

/**
 * Dispute Timeline table - Activity log for dispute progression
 */
export const disputeTimeline = mysqlTable("disputeTimeline", {
  id: int("id").autoincrement().primaryKey(),
  disputeId: int("disputeId").notNull(),
  
  // Event details
  eventType: mysqlEnum("eventType", [
    "created",
    "evidence_added",
    "response_submitted",
    "status_changed",
    "resolution_proposed",
    "resolution_accepted",
    "resolution_rejected",
    "message_sent",
    "escalated",
    "closed"
  ]).notNull(),
  
  actorUserId: int("actorUserId").notNull(), // Who performed the action
  actorRole: mysqlEnum("actorRole", ["tenant", "landlord", "admin"]).notNull(),
  
  // Event data
  eventTitle: varchar("eventTitle", { length: 255 }).notNull(),
  eventDescription: text("eventDescription"),
  
  // Status changes
  previousStatus: varchar("previousStatus", { length: 50 }),
  newStatus: varchar("newStatus", { length: 50 }),
  
  // Amount changes
  previousAmount: int("previousAmount"),
  newAmount: int("newAmount"),
  
  // Related evidence or message
  relatedEvidenceId: int("relatedEvidenceId"),
  relatedMessageId: int("relatedMessageId"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DisputeTimelineEvent = typeof disputeTimeline.$inferSelect;
export type InsertDisputeTimelineEvent = typeof disputeTimeline.$inferInsert;

/**
 * Dispute Messages table - Communication thread for dispute resolution
 */
export const disputeMessages = mysqlTable("disputeMessages", {
  id: int("id").autoincrement().primaryKey(),
  disputeId: int("disputeId").notNull(),
  
  senderId: int("senderId").notNull(),
  senderRole: mysqlEnum("senderRole", ["tenant", "landlord", "admin"]).notNull(),
  
  message: text("message").notNull(),
  
  // Message metadata
  isSystemMessage: boolean("isSystemMessage").default(false),
  isResolutionOffer: boolean("isResolutionOffer").default(false),
  offeredAmount: int("offeredAmount"), // If this is a resolution offer
  
  // Read status
  readBy: json("readBy"), // Array of user IDs who have read this message
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DisputeMessage = typeof disputeMessages.$inferSelect;
export type InsertDisputeMessage = typeof disputeMessages.$inferInsert;

/**
 * Relations for disputes
 */
export const disputesRelations = relations(disputes, ({ one, many }) => ({
  contract: one(contracts, {
    fields: [disputes.contractId],
    references: [contracts.id],
  }),
  filedByUser: one(users, {
    fields: [disputes.filedByUserId],
    references: [users.id],
  }),
  moveOutChecklist: one(moveOutChecklists, {
    fields: [disputes.moveOutChecklistId],
    references: [moveOutChecklists.id],
  }),
  evidence: many(disputeEvidence),
  timeline: many(disputeTimeline),
  messages: many(disputeMessages),
}));

export const disputeEvidenceRelations = relations(disputeEvidence, ({ one }) => ({
  dispute: one(disputes, {
    fields: [disputeEvidence.disputeId],
    references: [disputes.id],
  }),
  uploadedByUser: one(users, {
    fields: [disputeEvidence.uploadedBy],
    references: [users.id],
  }),
}));

export const disputeTimelineRelations = relations(disputeTimeline, ({ one }) => ({
  dispute: one(disputes, {
    fields: [disputeTimeline.disputeId],
    references: [disputes.id],
  }),
  actor: one(users, {
    fields: [disputeTimeline.actorUserId],
    references: [users.id],
  }),
}));

export const disputeMessagesRelations = relations(disputeMessages, ({ one }) => ({
  dispute: one(disputes, {
    fields: [disputeMessages.disputeId],
    references: [disputes.id],
  }),
  sender: one(users, {
    fields: [disputeMessages.senderId],
    references: [users.id],
  }),
}));


/**
 * Information Requests table - Landlord requests for additional information from tenants
 */
export const informationRequests = mysqlTable("informationRequests", {
  id: int("id").autoincrement().primaryKey(),
  applicationId: int("applicationId").notNull(), // Link to inquiries/applications table
  landlordId: int("landlordId").notNull(),
  tenantId: int("tenantId").notNull(),
  
  requestMessage: text("requestMessage").notNull(),
  requestType: mysqlEnum("requestType", ["document", "clarification", "reference", "other"]).default("clarification"),
  
  status: mysqlEnum("status", ["pending", "responded", "resolved"]).default("pending"),
  
  respondedAt: timestamp("respondedAt"),
  resolvedAt: timestamp("resolvedAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InformationRequest = typeof informationRequests.$inferSelect;
export type InsertInformationRequest = typeof informationRequests.$inferInsert;

/**
 * Information Request Responses table - Tenant responses to landlord information requests
 */
export const informationRequestResponses = mysqlTable("informationRequestResponses", {
  id: int("id").autoincrement().primaryKey(),
  requestId: int("requestId").notNull(),
  
  responseMessage: text("responseMessage").notNull(),
  attachments: text("attachments"), // JSON array of file URLs
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InformationRequestResponse = typeof informationRequestResponses.$inferSelect;
export type InsertInformationRequestResponse = typeof informationRequestResponses.$inferInsert;

/**
 * Relations for information requests
 */
export const informationRequestsRelations = relations(informationRequests, ({ one, many }) => ({
  application: one(inquiries, {
    fields: [informationRequests.applicationId],
    references: [inquiries.id],
  }),
  landlord: one(users, {
    fields: [informationRequests.landlordId],
    references: [users.id],
  }),
  tenant: one(users, {
    fields: [informationRequests.tenantId],
    references: [users.id],
  }),
  responses: many(informationRequestResponses),
}));

export const informationRequestResponsesRelations = relations(informationRequestResponses, ({ one }) => ({
  request: one(informationRequests, {
    fields: [informationRequestResponses.requestId],
    references: [informationRequests.id],
  }),
}));

/**
 * Property Viewing Requests
 * Tracks all viewing requests from tenants for properties
 */
export const propertyViewings = mysqlTable(
  "property_viewings",
  {
    id: int("id").autoincrement().primaryKey(),
    propertyId: int("property_id").notNull(),
    tenantId: int("tenant_id").notNull(),
    landlordId: int("landlord_id").notNull(),
    
    requestedDate: timestamp("requested_date").notNull(),
    requestedTimeSlot: varchar("requested_time_slot", { length: 50 }).notNull(),
    
    status: mysqlEnum("status", [
      "pending",
      "approved",
      "rejected",
      "cancelled",
      "completed",
      "no_show",
    ])
      .default("pending")
      .notNull(),
    
    landlordNotes: text("landlord_notes"),
    landlordApprovedAt: timestamp("landlord_approved_at"),
    tenantMessage: text("tenant_message"),
    tenantVerificationStatus: varchar("tenant_verification_status", { length: 50 }),
    
    meetingLocation: varchar("meeting_location", { length: 255 }),
    meetingInstructions: text("meeting_instructions"),
    
    landlordFeedback: text("landlord_feedback"),
    tenantFeedback: text("tenant_feedback"),
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    propertyIdx: index("idx_property_viewings_property").on(table.propertyId),
    tenantIdx: index("idx_property_viewings_tenant").on(table.tenantId),
    landlordIdx: index("idx_property_viewings_landlord").on(table.landlordId),
    statusIdx: index("idx_property_viewings_status").on(table.status),
    dateIdx: index("idx_property_viewings_date").on(table.requestedDate),
  })
);

/**
 * Viewing Availability Calendar
 */
export const viewingAvailability = mysqlTable(
  "viewing_availability",
  {
    id: int("id").autoincrement().primaryKey(),
    propertyId: int("property_id").notNull(),
    landlordId: int("landlord_id").notNull(),
    
    availableDate: timestamp("available_date").notNull(),
    timeSlots: varchar("time_slots", { length: 500 }).notNull(), // JSON: ["09:00-10:00"]
    
    maxViewingsPerDay: int("max_viewings_per_day").default(5).notNull(),
    currentViewingCount: int("current_viewing_count").default(0).notNull(),
    
    isOpen: boolean("is_open").default(true).notNull(),
    notes: text("notes"),
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    propertyIdx: index("idx_viewing_availability_property").on(table.propertyId),
    landlordIdx: index("idx_viewing_availability_landlord").on(table.landlordId),
    dateIdx: index("idx_viewing_availability_date").on(table.availableDate),
  })
);

/**
 * Viewing Feedback & Ratings
 */
export const viewingFeedback = mysqlTable(
  "viewing_feedback",
  {
    id: int("id").autoincrement().primaryKey(),
    viewingId: int("viewing_id").notNull(),
    propertyId: int("property_id").notNull(),
    tenantId: int("tenant_id").notNull(),
    landlordId: int("landlord_id").notNull(),
    
    tenantRating: int("tenant_rating"),
    tenantComment: text("tenant_comment"),
    tenantLiked: text("tenant_liked"),
    tenantDisliked: text("tenant_disliked"),
    
    landlordRating: int("landlord_rating"),
    landlordComment: text("landlord_comment"),
    landlordImpressionOfTenant: varchar("landlord_impression_of_tenant", { length: 50 }),
    
    wouldTenantApply: boolean("would_tenant_apply"),
    wouldLandlordAccept: boolean("would_landlord_accept"),
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    viewingIdx: index("idx_viewing_feedback_viewing").on(table.viewingId),
    propertyIdx: index("idx_viewing_feedback_property").on(table.propertyId),
    tenantIdx: index("idx_viewing_feedback_tenant").on(table.tenantId),
    landlordIdx: index("idx_viewing_feedback_landlord").on(table.landlordId),
  })
);

/**
 * Viewing Notifications & Reminders
 */
export const viewingNotifications = mysqlTable(
  "viewing_notifications",
  {
    id: int("id").autoincrement().primaryKey(),
    viewingId: int("viewing_id").notNull(),
    recipientId: int("recipient_id").notNull(),
    recipientType: mysqlEnum("recipient_type", ["tenant", "landlord"]).notNull(),
    
    notificationType: mysqlEnum("notification_type", [
      "viewing_requested",
      "viewing_approved",
      "viewing_rejected",
      "viewing_reminder_24h",
      "viewing_reminder_1h",
      "viewing_completed",
      "feedback_requested",
    ]).notNull(),
    
    sent: boolean("sent").default(false).notNull(),
    sentAt: timestamp("sent_at"),
    read: boolean("read").default(false).notNull(),
    readAt: timestamp("read_at"),
    
    subject: varchar("subject", { length: 255 }),
    message: text("message"),
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    viewingIdx: index("idx_viewing_notifications_viewing").on(table.viewingId),
    recipientIdx: index("idx_viewing_notifications_recipient").on(table.recipientId),
    typeIdx: index("idx_viewing_notifications_type").on(table.notificationType),
  })
);

export const propertyViewingsRelations = relations(propertyViewings, ({ one }) => ({
  property: one(properties, { fields: [propertyViewings.propertyId], references: [properties.id] }),
  tenant: one(users, { fields: [propertyViewings.tenantId], references: [users.id] }),
  landlord: one(users, { fields: [propertyViewings.landlordId], references: [users.id] }),
}));

export const viewingAvailabilityRelations = relations(viewingAvailability, ({ one }) => ({
  property: one(properties, { fields: [viewingAvailability.propertyId], references: [properties.id] }),
  landlord: one(users, { fields: [viewingAvailability.landlordId], references: [users.id] }),
}));

export const viewingFeedbackRelations = relations(viewingFeedback, ({ one }) => ({
  viewing: one(propertyViewings, { fields: [viewingFeedback.viewingId], references: [propertyViewings.id] }),
  property: one(properties, { fields: [viewingFeedback.propertyId], references: [properties.id] }),
  tenant: one(users, { fields: [viewingFeedback.tenantId], references: [users.id] }),
  landlord: one(users, { fields: [viewingFeedback.landlordId], references: [users.id] }),
}));

/**
 * Chatbot Conversations Table
 */
export const chatbotConversations = mysqlTable(
  "chatbot_conversations",
  {
    id: int("id").autoincrement().primaryKey(),
    sessionId: varchar("sessionId", { length: 255 }).notNull().unique(),
    userId: int("userId"),
    visitorEmail: varchar("visitorEmail", { length: 255 }),
    visitorName: varchar("visitorName", { length: 255 }),
    language: varchar("language", { length: 10 }).default("en"),
    status: mysqlEnum("status", ["active", "closed", "lead_captured"]).default("active"),
    leadId: int("leadId"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    sessionIdIndex: index("idx_sessionId").on(table.sessionId),
    userIdIndex: index("idx_userId").on(table.userId),
    leadIdIndex: index("idx_leadId").on(table.leadId),
  })
);

/**
 * Chatbot Messages Table
 */
export const chatbotMessages = mysqlTable(
  "chatbot_messages",
  {
    id: int("id").autoincrement().primaryKey(),
    conversationId: int("conversationId").notNull(),
    sender: mysqlEnum("sender", ["user", "bot"]).notNull(),
    message: text("message").notNull(),
    intent: varchar("intent", { length: 100 }),
    confidence: varchar("confidence", { length: 10 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    conversationIdIndex: index("idx_conversationId").on(table.conversationId),
    intentIndex: index("idx_intent").on(table.intent),
  })
);

/**
 * Chatbot Leads Table
 */
export const chatbotLeads = mysqlTable(
  "chatbot_leads",
  {
    id: int("id").autoincrement().primaryKey(),
    email: varchar("email", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }),
    phone: varchar("phone", { length: 20 }),
    userType: mysqlEnum("userType", ["tenant", "landlord", "both", "unknown"]).default("unknown"),
    interest: varchar("interest", { length: 255 }),
    source: varchar("source", { length: 100 }).default("chatbot"),
    status: mysqlEnum("status", ["new", "contacted", "qualified", "converted", "rejected"]).default("new"),
    notes: text("notes"),
    nextFollowUpDate: timestamp("nextFollowUpDate"),
    conversationId: int("conversationId"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    emailIndex: index("idx_email").on(table.email),
    statusIndex: index("idx_status").on(table.status),
    createdAtIndex: index("idx_createdAt").on(table.createdAt),
    conversationIdIndex: index("idx_conversationId").on(table.conversationId),
  })
);

/**
 * Chatbot Response Templates Table
 */
export const chatbotResponses = mysqlTable(
  "chatbot_responses",
  {
    id: int("id").autoincrement().primaryKey(),
    intent: varchar("intent", { length: 100 }).notNull().unique(),
    category: varchar("category", { length: 50 }).notNull(),
    responseEn: text("responseEn").notNull(),
    responseEs: text("responseEs").notNull(),
    keywords: text("keywords"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    intentIndex: index("idx_res_intent").on(table.intent),
    categoryIndex: index("idx_res_category").on(table.category),
  })
);

export const chatbotConversationsRelations = relations(chatbotConversations, ({ many, one }) => ({
  messages: many(chatbotMessages),
  lead: one(chatbotLeads, { fields: [chatbotConversations.leadId], references: [chatbotLeads.id] }),
}));

export const chatbotMessagesRelations = relations(chatbotMessages, ({ one }) => ({
  conversation: one(chatbotConversations, { fields: [chatbotMessages.conversationId], references: [chatbotConversations.id] }),
}));

export const chatbotLeadsRelations = relations(chatbotLeads, ({ one }) => ({
  conversation: one(chatbotConversations, { fields: [chatbotLeads.conversationId], references: [chatbotConversations.id] }),
}));

/**
 * App Settings - Global configuration
 */
export const appSettings = mysqlTable("appSettings", {
  id: int("id").autoincrement().primaryKey(),
  platformCommissionPercentage: int("platformCommissionPercentage").default(5).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AppSetting = typeof appSettings.$inferSelect;

/**
 * Payouts - Admin to Landlord payments
 */
export const payouts = mysqlTable("payouts", {
  id: int("id").autoincrement().primaryKey(),
  landlordId: int("landlordId").notNull(),
  adminId: int("adminId").notNull(),
  amount: int("amount").notNull(), // Amount in cents
  currency: varchar("currency", { length: 3 }).default("EUR"),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending"),
  method: varchar("method", { length: 50 }).default("manual"), // manual, bank_transfer, stripe
  reference: varchar("reference", { length: 255 }),
  description: text("description"),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Payout = typeof payouts.$inferSelect;
export type InsertPayout = typeof payouts.$inferInsert;

export const payoutsRelations = relations(payouts, ({ one }) => ({
  landlord: one(users, {
    fields: [payouts.landlordId],
    references: [users.id],
    relationName: "landlordPayouts",
  }),
  admin: one(users, {
    fields: [payouts.adminId],
    references: [users.id],
    relationName: "adminPayouts",
  }),
}));

