import { createNotification, getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { sendSystemNotificationEmail } from "./email-service";
import { getTranslation } from "./translations";

/**
 * Workflow Notification Service
 * Ported from legacy project to handle system notifications
 */

async function getUser(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  return user;
}

// ============================================
// CONTRACT NOTIFICATIONS
// ============================================

export async function notifyContractSent(params: {
  landlordId: number;
  tenantId: number;
  contractId: number;
  propertyTitle: string;
}) {
  const { landlordId, tenantId, propertyTitle } = params;
  
  const tenant = await getUser(tenantId);
  const landlord = await getUser(landlordId);
  const tenantLang = tenant?.languagePreference || "en";
  const landlordLang = landlord?.languagePreference || "en";

  // Notify Tenant
  const tenantTitle = getTranslation(tenantLang, "contractReceivedTitle");
  const tenantMessage = getTranslation(tenantLang, "contractReceivedMessage", { propertyTitle });
  
  await createNotification({
    userId: tenantId,
    type: "contract",
    title: tenantTitle,
    message: tenantMessage,
    link: "/tenant/contracts",
  });

  if (tenant?.email) {
    await sendSystemNotificationEmail(
      tenant.email,
      tenant.name || "Tenant",
      tenantTitle,
      tenantMessage,
      "/tenant/contracts",
      getTranslation(tenantLang, "reviewContract"),
      tenantLang
    );
  }

  // Notify Landlord
  const landlordTitle = getTranslation(landlordLang, "contractSentTitle");
  const landlordMessage = getTranslation(landlordLang, "contractSentMessage", { propertyTitle });

  await createNotification({
    userId: landlordId,
    type: "contract",
    title: landlordTitle,
    message: landlordMessage,
    link: "/landlord/contracts",
  });

  if (landlord?.email) {
    await sendSystemNotificationEmail(
      landlord.email,
      landlord.name || "Landlord",
      landlordTitle,
      landlordMessage,
      "/landlord/contracts",
      getTranslation(landlordLang, "viewContracts"),
      landlordLang
    );
  }
}

export async function notifyContractSignedByTenant(params: {
  landlordId: number;
  tenantId: number;
  contractId: number;
  propertyTitle: string;
  tenantName: string;
}) {
  const { landlordId, tenantId, propertyTitle, tenantName } = params;
  
  const tenant = await getUser(tenantId);
  const landlord = await getUser(landlordId);
  const tenantLang = tenant?.languagePreference || "en";
  const landlordLang = landlord?.languagePreference || "en";

  // Notify Landlord
  const landlordTitle = getTranslation(landlordLang, "contractSignedTitle");
  const landlordMessage = getTranslation(landlordLang, "contractSignedMessage", { tenantName, propertyTitle });

  await createNotification({
    userId: landlordId,
    type: "contract",
    title: landlordTitle,
    message: landlordMessage,
    link: "/landlord/contracts",
  });

  if (landlord?.email) {
    await sendSystemNotificationEmail(
      landlord.email,
      landlord.name || "Landlord",
      landlordTitle,
      landlordMessage,
      "/landlord/contracts",
      getTranslation(landlordLang, "signContract"),
      landlordLang
    );
  }
  
  // Notify Tenant
  const tenantTitle = getTranslation(tenantLang, "contractSignatureConfirmedTitle");
  const tenantMessage = getTranslation(tenantLang, "contractSignatureConfirmedMessage", { propertyTitle });

  await createNotification({
    userId: tenantId,
    type: "contract",
    title: tenantTitle,
    message: tenantMessage,
    link: "/tenant/contracts",
  });

  if (tenant?.email) {
    await sendSystemNotificationEmail(
      tenant.email,
      tenant.name || "Tenant",
      tenantTitle,
      tenantMessage,
      "/tenant/contracts",
      getTranslation(tenantLang, "viewContract"),
      tenantLang
    );
  }
}

export async function notifyContractFullySigned(params: {
  landlordId: number;
  tenantId: number;
  contractId: number;
  propertyTitle: string;
}) {
  const { landlordId, tenantId, propertyTitle } = params;
  
  const tenant = await getUser(tenantId);
  const landlord = await getUser(landlordId);
  const tenantLang = tenant?.languagePreference || "en";
  const landlordLang = landlord?.languagePreference || "en";

  // Notify Tenant
  const tenantTitle = getTranslation(tenantLang, "contractExecutedTitle");
  const tenantMessage = getTranslation(tenantLang, "contractExecutedMessageTenant", { propertyTitle });

  await createNotification({
    userId: tenantId,
    type: "contract",
    title: tenantTitle,
    message: tenantMessage,
    link: "/tenant/contracts",
  });

  if (tenant?.email) {
    await sendSystemNotificationEmail(
      tenant.email,
      tenant.name || "Tenant",
      tenantTitle,
      tenantMessage,
      "/tenant/contracts",
      getTranslation(tenantLang, "viewContract"),
      tenantLang
    );
  }
  
  // Notify Landlord
  const landlordTitle = getTranslation(landlordLang, "contractExecutedTitle");
  const landlordMessage = getTranslation(landlordLang, "contractExecutedMessageLandlord", { propertyTitle });

  await createNotification({
    userId: landlordId,
    type: "contract",
    title: landlordTitle,
    message: landlordMessage,
    link: "/landlord/contracts",
  });

  if (landlord?.email) {
    await sendSystemNotificationEmail(
      landlord.email,
      landlord.name || "Landlord",
      landlordTitle,
      landlordMessage,
      "/landlord/contracts",
      getTranslation(landlordLang, "viewContract"),
      landlordLang
    );
  }
}

// ============================================
// PAYMENT NOTIFICATIONS
// ============================================

export async function notifyPaymentCompleted(params: {
  userId: number;
  amount: number;
  description: string;
  type: "rent" | "deposit";
}) {
  const { userId, amount, description } = params;
  
  const user = await getUser(userId);
  const lang = user?.languagePreference || "en";
  const title = getTranslation(lang, "paymentSuccessfulTitle");
  const message = getTranslation(lang, "paymentSuccessfulMessage", { amount: (amount / 100).toLocaleString(), description });

  await createNotification({
    userId,
    type: "payment",
    title,
    message,
    link: "/tenant/payments",
  });

  if (user?.email) {
    await sendSystemNotificationEmail(
      user.email,
      user.name || "User",
      title,
      message,
      "/tenant/payments",
      getTranslation(lang, "viewPayments"),
      lang
    );
  }
}

export async function notifyPaymentReceived(params: {
  landlordId: number;
  tenantName: string;
  amount: number;
  description: string;
  type: "rent" | "deposit";
}) {
  const { landlordId, tenantName, amount, description } = params;
  
  const landlord = await getUser(landlordId);
  const lang = landlord?.languagePreference || "en";
  const title = getTranslation(lang, "paymentReceivedTitle");
  const message = getTranslation(lang, "paymentReceivedMessage", { tenantName, amount: (amount / 100).toLocaleString(), description });

  await createNotification({
    userId: landlordId,
    type: "payment",
    title,
    message,
    link: "/landlord/earnings",
  });

  if (landlord?.email) {
    await sendSystemNotificationEmail(
      landlord.email,
      landlord.name || "Landlord",
      title,
      message,
      "/landlord/earnings",
      getTranslation(lang, "viewEarnings"),
      lang
    );
  }
}

// ============================================
// MAINTENANCE NOTIFICATIONS
// ============================================

export async function notifyMaintenanceRequestCreated(params: {
  landlordId: number;
  tenantName: string;
  propertyTitle: string;
  requestTitle: string;
}) {
  const { landlordId, tenantName, propertyTitle, requestTitle } = params;
  
  const landlord = await getUser(landlordId);
  const lang = landlord?.languagePreference || "en";
  const title = getTranslation(lang, "newMaintenanceRequestTitle");
  const message = getTranslation(lang, "newMaintenanceRequestMessage", { tenantName, propertyTitle, requestTitle });

  await createNotification({
    userId: landlordId,
    type: "maintenance",
    title,
    message,
    link: "/landlord/maintenance",
  });

  if (landlord?.email) {
    await sendSystemNotificationEmail(
      landlord.email,
      landlord.name || "Landlord",
      title,
      message,
      "/landlord/maintenance",
      getTranslation(lang, "viewRequest"),
      lang
    );
  }
}

export async function notifyMaintenanceStatusChanged(params: {
  tenantId: number;
  propertyTitle: string;
  requestTitle: string;
  status: string;
}) {
  const { tenantId, propertyTitle, requestTitle, status } = params;
  
  const tenant = await getUser(tenantId);
  const lang = tenant?.languagePreference || "en";
  const title = getTranslation(lang, "maintenanceUpdateTitle");
  const message = getTranslation(lang, "maintenanceUpdateMessage", { requestTitle, propertyTitle, status: status.replace('_', ' ') });

  await createNotification({
    userId: tenantId,
    type: "maintenance",
    title,
    message,
    link: "/tenant/maintenance",
  });

  if (tenant?.email) {
    await sendSystemNotificationEmail(
      tenant.email,
      tenant.name || "Tenant",
      title,
      message,
      "/tenant/maintenance",
      getTranslation(lang, "viewRequest"),
      lang
    );
  }
}

export async function notifyMaintenanceCommentAdded(params: {
  userId: number;
  requestTitle: string;
  isLandlord: boolean;
}) {
  const { userId, requestTitle, isLandlord } = params;
  
  const user = await getUser(userId);
  const lang = user?.languagePreference || "en";
  const title = getTranslation(lang, "newMaintenanceCommentTitle");
  const role = isLandlord ? getTranslation(lang, "landlord") : getTranslation(lang, "tenant");
  const message = getTranslation(lang, "newMaintenanceCommentMessage", { requestTitle, role });

  await createNotification({
    userId,
    type: "maintenance",
    title,
    message,
    link: isLandlord ? "/tenant/maintenance" : "/landlord/maintenance",
  });

  if (user?.email) {
    await sendSystemNotificationEmail(
      user.email,
      user.name || "User",
      title,
      message,
      isLandlord ? "/tenant/maintenance" : "/landlord/maintenance",
      getTranslation(lang, "viewComments"),
      lang
    );
  }
}

// ============================================
// APPLICATION NOTIFICATIONS
// ============================================

export async function notifyApplicationSubmitted(params: {
  landlordId: number;
  tenantName: string;
  propertyTitle: string;
}) {
  const { landlordId, tenantName, propertyTitle } = params;
  
  const landlord = await getUser(landlordId);
  const lang = landlord?.languagePreference || "en";
  const title = getTranslation(lang, "newApplicationTitle");
  const message = getTranslation(lang, "newApplicationMessage", { tenantName, propertyTitle });

  await createNotification({
    userId: landlordId,
    type: "application",
    title,
    message,
    link: "/landlord/applications",
  });

  if (landlord?.email) {
    await sendSystemNotificationEmail(
      landlord.email,
      landlord.name || "Landlord",
      title,
      message,
      "/landlord/applications",
      getTranslation(lang, "viewApplication"),
      lang
    );
  }
}

export async function notifyApplicationStatusChanged(params: {
  tenantId: number;
  propertyTitle: string;
  status: "accepted" | "rejected";
}) {
  const { tenantId, propertyTitle, status } = params;
  
  const tenant = await getUser(tenantId);
  const lang = tenant?.languagePreference || "en";
  const titleKey = status === "accepted" ? "applicationAcceptedTitle" : "applicationRejectedTitle";
  const title = getTranslation(lang, titleKey);
  const message = getTranslation(lang, "applicationStatusMessage", { propertyTitle, status: status === "accepted" ? "accepted" : "rejected" }); 

  await createNotification({
    userId: tenantId,
    type: "application",
    title,
    message,
    link: "/tenant/applications",
  });

  if (tenant?.email) {
    await sendSystemNotificationEmail(
      tenant.email,
      tenant.name || "Tenant",
      title,
      message,
      "/tenant/applications",
      getTranslation(lang, "viewApplications"),
      lang
    );
  }
}

// ============================================
// DOCUMENT NOTIFICATIONS
// ============================================

export async function notifyDocumentUploaded(params: {
  uploaderName: string;
  documentType: string;
}) {
  const { uploaderName, documentType } = params;
  
  const db = await getDb();
  if (!db) return;
  const admins = await db.select().from(users).where(eq(users.role, "admin"));
  
  for (const admin of admins) {
    const lang = admin.languagePreference || "en";
    const title = getTranslation(lang, "documentUploadedTitle");
    const message = getTranslation(lang, "documentUploadedMessage", { uploaderName, documentType });

    await createNotification({
      userId: admin.id,
      type: "system",
      title,
      message,
      link: "/admin/documents",
    });

    if (admin.email) {
      await sendSystemNotificationEmail(
        admin.email,
        admin.name || "Admin",
        title,
        message,
        "/admin/documents",
        getTranslation(lang, "verifyDocument"),
        lang
      );
    }
  }
}

export async function notifyDocumentVerified(params: {
  userId: number;
  documentName: string;
  status: "verified" | "rejected";
  notes?: string;
}) {
  const { userId, documentName, status, notes } = params;
  
  const user = await getUser(userId);
  const lang = user?.languagePreference || "en";
  const titleKey = status === "verified" ? "documentVerifiedTitle" : "documentRejectedTitle";
  const title = getTranslation(lang, titleKey);
  const messageKey = status === "verified" ? "documentVerifiedMessage" : "documentRejectedMessage";
  const message = getTranslation(lang, messageKey, { documentName, notes: notes ? ` Note: ${notes}` : "" });

  await createNotification({
    userId,
    type: "system",
    title,
    message,
    link: "/tenant/settings", // Redirect to tenant settings for document view
  });

  if (user?.email) {
    await sendSystemNotificationEmail(
      user.email,
      user.name || "User",
      title,
      message,
      "/tenant/settings",
      getTranslation(lang, "viewDocuments"),
      lang
    );
  }
}

// ============================================
// PROFILE NOTIFICATIONS
// ============================================

export async function notifyProfileStatusChanged(params: {
  userId: number;
  status: string;
}) {
  const { userId, status } = params;
  
  const user = await getUser(userId);
  const lang = user?.languagePreference || "en";
  
  const titleKey = status === "verified" ? "profileVerifiedTitle" : "profileStatusUpdateTitle";
  const messageKey = status === "verified" ? "profileVerifiedMessage" : "profileStatusUpdateMessage";
  
  const title = getTranslation(lang, titleKey);
  const message = getTranslation(lang, messageKey, { status });

  const settingsLink = user?.userType === 'landlord' ? '/landlord/settings' : '/tenant/settings';

  await createNotification({
    userId,
    type: "system",
    title,
    message,
    link: settingsLink,
  });

  if (user?.email) {
    await sendSystemNotificationEmail(
      user.email,
      user.name || "User",
      title,
      message,
      settingsLink,
      getTranslation(lang, "viewDetails"),
      lang
    );
  }
}

// ============================================
// VIEWING NOTIFICATIONS
// ============================================

export async function notifyViewingRequested(params: {
  landlordId: number;
  tenantName: string;
  propertyTitle: string;
}) {
  const { landlordId, tenantName, propertyTitle } = params;
  
  const landlord = await getUser(landlordId);
  const lang = landlord?.languagePreference || "en";
  const title = getTranslation(lang, "viewingRequestedTitle");
  const message = getTranslation(lang, "viewingRequestedMessage", { tenantName, propertyTitle });

  await createNotification({
    userId: landlordId,
    type: "application",
    title,
    message,
    link: "/landlord/viewings",
  });

  if (landlord?.email) {
    await sendSystemNotificationEmail(
      landlord.email,
      landlord.name || "Landlord",
      title,
      message,
      "/landlord/viewings",
      getTranslation(lang, "viewViewing"),
      lang
    );
  }
}

export async function notifyViewingApproved(params: {
  tenantId: number;
  propertyTitle: string;
}) {
  const { tenantId, propertyTitle } = params;
  
  const tenant = await getUser(tenantId);
  const lang = tenant?.languagePreference || "en";
  const title = getTranslation(lang, "viewingApprovedTitle");
  const message = getTranslation(lang, "viewingApprovedMessage", { propertyTitle });

  await createNotification({
    userId: tenantId,
    type: "application",
    title,
    message,
    link: "/tenant/viewings",
  });

  if (tenant?.email) {
    await sendSystemNotificationEmail(
      tenant.email,
      tenant.name || "Tenant",
      title,
      message,
      "/tenant/viewings",
      getTranslation(lang, "viewViewing"),
      lang
    );
  }
}

export async function notifyViewingRejected(params: {
  tenantId: number;
  propertyTitle: string;
}) {
  const { tenantId, propertyTitle } = params;
  
  const tenant = await getUser(tenantId);
  const lang = tenant?.languagePreference || "en";
  const title = getTranslation(lang, "viewingRejectedTitle");
  const message = getTranslation(lang, "viewingRejectedMessage", { propertyTitle });
  
  if (tenant?.email) {
    await sendSystemNotificationEmail(
      tenant.email,
      tenant.name || "Tenant",
      title,
      message,
      "/tenant/viewings",
      getTranslation(lang, "viewViewing"),
      lang
    );
  }
}

// ============================================
// KEY COLLECTION NOTIFICATIONS
// ============================================

export async function notifyKeyCollectionScheduled(params: {
  landlordId: number;
  tenantId: number;
  propertyTitle: string;
  date: string;
}) {
  console.log(`[notifyKeyCollectionScheduled] Triggered for L:${params.landlordId}, T:${params.tenantId}`);
  const { landlordId, tenantId, propertyTitle, date } = params;
  
  const tenant = await getUser(tenantId);
  const landlord = await getUser(landlordId);
  
  if (!landlord) {
    console.error(`[notifyKeyCollectionScheduled] Landlord ${landlordId} not found`);
  } else {
    console.log(`[notifyKeyCollectionScheduled] Landlord found: ${landlord.email}`);
  }

  const tenantLang = tenant?.languagePreference || "en";
  const landlordLang = landlord?.languagePreference || "en";

  const titleKey = "keyCollectionScheduledTitle";
  const messageKey = "keyCollectionScheduledMessage";

  // Notify Tenant
  const tenantTitle = getTranslation(tenantLang, titleKey);
  const tenantMessage = getTranslation(tenantLang, messageKey, { propertyTitle, date });
  
  await createNotification({
    userId: tenantId,
    type: "key_collection",
    title: tenantTitle,
    message: tenantMessage,
    link: "/tenant/keys",
  });

  if (tenant?.email) {
    await sendSystemNotificationEmail(
      tenant.email,
      tenant.name || "Tenant",
      tenantTitle,
      tenantMessage,
      "/tenant/keys",
      getTranslation(tenantLang, "viewKeyCollection"),
      tenantLang
    );
  }

  // Notify Landlord
  if (landlord) {
    const landlordTitle = getTranslation(landlordLang, titleKey);
    const landlordMessage = getTranslation(landlordLang, messageKey, { propertyTitle, date });

    console.log(`[notifyKeyCollectionScheduled] Creating notification for landlord ${landlordId}`);
    await createNotification({
      userId: landlordId,
      type: "key_collection",
      title: landlordTitle,
      message: landlordMessage,
      link: "/landlord/keys",
    });

    if (landlord.email) {
      console.log(`[notifyKeyCollectionScheduled] Sending email to landlord ${landlord.email}`);
      await sendSystemNotificationEmail(
        landlord.email,
        landlord.name || "Landlord",
        landlordTitle,
        landlordMessage,
        "/landlord/keys",
        getTranslation(landlordLang, "viewKeyCollection"),
        landlordLang
      );
    }
  }
}

export async function notifyKeyCollectionConfirmed(params: {
  landlordId: number;
  tenantId: number;
  propertyTitle: string;
}) {
  const { landlordId, tenantId, propertyTitle } = params;
  
  const tenant = await getUser(tenantId);
  const landlord = await getUser(landlordId);
  const tenantLang = tenant?.languagePreference || "en";
  const landlordLang = landlord?.languagePreference || "en";

  const titleKey = "keyCollectionConfirmedTitle";
  const messageKey = "keyCollectionConfirmedMessage";

  // Notify Tenant
  const tenantTitle = getTranslation(tenantLang, titleKey);
  const tenantMessage = getTranslation(tenantLang, messageKey, { propertyTitle });
  
  await createNotification({
    userId: tenantId,
    type: "key_collection",
    title: tenantTitle,
    message: tenantMessage,
    link: "/tenant/keys",
  });

  // Notify Landlord
  const landlordTitle = getTranslation(landlordLang, titleKey);
  const landlordMessage = getTranslation(landlordLang, messageKey, { propertyTitle });

  await createNotification({
    userId: landlordId,
    type: "key_collection",
    title: landlordTitle,
    message: landlordMessage,
    link: "/landlord/keys",
  });
}

export async function notifyKeyCollectionCompleted(params: {
  landlordId: number;
  tenantId: number;
  propertyTitle: string;
}) {
  const { landlordId, tenantId, propertyTitle } = params;
  
  const tenant = await getUser(tenantId);
  const landlord = await getUser(landlordId);
  const tenantLang = tenant?.languagePreference || "en";
  const landlordLang = landlord?.languagePreference || "en";

  const titleKey = "keyCollectionCompletedTitle";
  const messageKey = "keyCollectionCompletedMessage";

  // Notify Tenant
  const tenantTitle = getTranslation(tenantLang, titleKey);
  const tenantMessage = getTranslation(tenantLang, messageKey, { propertyTitle });
  
  await createNotification({
    userId: tenantId,
    type: "key_collection",
    title: tenantTitle,
    message: tenantMessage,
    link: "/tenant/my-home",
  });

  if (tenant?.email) {
    await sendSystemNotificationEmail(
      tenant.email,
      tenant.name || "Tenant",
      tenantTitle,
      tenantMessage,
      "/tenant/my-home",
      getTranslation(tenantLang, "viewDetails"),
      tenantLang
    );
  }

  // Notify Landlord
  const landlordTitle = getTranslation(landlordLang, titleKey);
  const landlordMessage = getTranslation(landlordLang, messageKey, { propertyTitle });

  await createNotification({
    userId: landlordId,
    type: "key_collection",
    title: landlordTitle,
    message: landlordMessage,
    link: "/landlord/properties",
  });
}

// ============================================
// CONTRACT MODIFICATION NOTIFICATIONS
// ============================================

export async function notifyContractTerminationRequested(params: {
  landlordId: number;
  tenantName: string;
  propertyTitle: string;
  date: string;
}) {
  const { landlordId, tenantName, propertyTitle, date } = params;
  
  const landlord = await getUser(landlordId);
  const lang = landlord?.languagePreference || "en";
  
  const title = getTranslation(lang, "contractTerminationRequestedTitle");
  const message = getTranslation(lang, "contractTerminationRequestedMessage", { tenantName, propertyTitle, date });

  await createNotification({
    userId: landlordId,
    type: "contract",
    title,
    message,
    link: "/landlord/contracts",
  });

  if (landlord?.email) {
    await sendSystemNotificationEmail(
      landlord.email,
      landlord.name || "Landlord",
      title,
      message,
      "/landlord/contracts",
      getTranslation(lang, "viewContracts"),
      lang
    );
  }
}

export async function notifyContractTerminationResponded(params: {
  tenantId: number;
  propertyTitle: string;
  status: "approved" | "rejected";
}) {
  const { tenantId, propertyTitle, status } = params;
  
  const tenant = await getUser(tenantId);
  const lang = tenant?.languagePreference || "en";
  
  const title = getTranslation(lang, "contractTerminationResponseTitle");
  const message = getTranslation(lang, "contractTerminationResponseMessage", { propertyTitle, status: status === "approved" ? "accepted" : "declined" });

  await createNotification({
    userId: tenantId,
    type: "contract",
    title,
    message,
    link: "/tenant/my-home",
  });

  if (tenant?.email) {
    await sendSystemNotificationEmail(
      tenant.email,
      tenant.name || "Tenant",
      title,
      message,
      "/tenant/my-home",
      getTranslation(lang, "viewDetails"),
      lang
    );
  }
}

export async function notifyContractAmendmentRequested(params: {
  landlordId: number;
  tenantName: string;
  propertyTitle: string;
}) {
  const { landlordId, tenantName, propertyTitle } = params;
  
  const landlord = await getUser(landlordId);
  const lang = landlord?.languagePreference || "en";
  
  const title = getTranslation(lang, "contractAmendmentRequestedTitle");
  const message = getTranslation(lang, "contractAmendmentRequestedMessage", { tenantName, propertyTitle });

  await createNotification({
    userId: landlordId,
    type: "contract",
    title,
    message,
    link: "/landlord/contracts",
  });

  if (landlord?.email) {
    await sendSystemNotificationEmail(
      landlord.email,
      landlord.name || "Landlord",
      title,
      message,
      "/landlord/contracts",
      getTranslation(lang, "viewContracts"),
      lang
    );
  }
}

export async function notifyContractAmendmentResponded(params: {
  tenantId: number;
  propertyTitle: string;
  status: "approved" | "rejected";
}) {
  const { tenantId, propertyTitle, status } = params;
  
  const tenant = await getUser(tenantId);
  const lang = tenant?.languagePreference || "en";
  
  const title = getTranslation(lang, "contractAmendmentResponseTitle");
  const message = getTranslation(lang, "contractAmendmentResponseMessage", { propertyTitle, status: status === "approved" ? "accepted" : "declined" });

  await createNotification({
    userId: tenantId,
    type: "contract",
    title,
    message,
    link: "/tenant/my-home",
  });

  if (tenant?.email) {
    await sendSystemNotificationEmail(
      tenant.email,
      tenant.name || "Tenant",
      title,
      message,
      "/tenant/my-home",
      getTranslation(lang, "viewDetails"),
      lang
    );
  }
}

export async function notifyChecklistSubmitted(params: {
  landlordId: number;
  tenantName: string;
  contractId: number;
  propertyTitle: string;
}) {
  const { landlordId, tenantName, propertyTitle, contractId } = params;
  const landlord = await getUser(landlordId);
  if (!landlord) return;

  const lang = landlord.languagePreference || "en";
  const subject = "Move-In Checklist Submitted";
  const message = `${tenantName} has submitted the move-in checklist for ${propertyTitle}. Please review and sign.`;

  await createNotification({
    userId: landlordId,
    type: "checklist",
    title: subject,
    message,
    link: `/landlord/checklist/${contractId}`,
  });

  if (landlord.email) {
    await sendSystemNotificationEmail(
      landlord.email,
      landlord.name || "Landlord",
      subject,
      message,
      `/landlord/checklist/${contractId}`,
      "Review Checklist",
      lang
    );
  }
}

export async function notifyChecklistCompleted(params: {
  landlordId: number;
  tenantId: number;
  contractId: number;
  propertyTitle: string;
}) {
  const { landlordId, tenantId, propertyTitle, contractId } = params;
  const landlord = await getUser(landlordId);
  const tenant = await getUser(tenantId);
  
  const subject = "Move-In Checklist Completed";
  const message = `The move-in checklist for ${propertyTitle} has been signed and completed.`;

  if (landlord) {
    await createNotification({
      userId: landlordId,
      type: "checklist",
      title: subject,
      message,
      link: `/landlord/checklist/${contractId}`,
    });
    if (landlord.email) {
      await sendSystemNotificationEmail(
        landlord.email,
        landlord.name || "Landlord",
        subject,
        message,
        `/landlord/checklist/${contractId}`,
        "View Checklist",
        landlord.languagePreference || "en"
      );
    }
  }

  if (tenant) {
    await createNotification({
      userId: tenantId,
      type: "checklist",
      title: subject,
      message,
      link: `/tenant/checklist/${contractId}`,
    });
    if (tenant.email) {
      await sendSystemNotificationEmail(
        tenant.email,
        tenant.name || "Tenant",
        subject,
        message,
        `/tenant/checklist/${contractId}`,
        "View Checklist",
        tenant.languagePreference || "en"
      );
    }
  }
}