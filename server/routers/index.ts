import { router } from "../trpc";
import { authRouter } from "./auth";
import { profileRouter } from "./profile";
import { propertiesRouter } from "./properties";
import { applicationsRouter } from "./applications";
import { paymentsRouter } from "./payments";
import { contractsRouter } from "./contracts";
import { tenantRouter } from "./tenant";
import { landlordRouter } from "./landlord";
import { uploadRouter } from "./upload";
import { documentVaultRouter } from "./documentVault";
import { keyCollectionsRouter } from "./keyCollections";
import { messagesRouter } from "./messages";
import { informationRequestsRouter } from "./informationRequests";
import { maintenanceRouter } from "./maintenance";
import { checklistRouter } from "./checklist";
import { notificationsRouter } from "./notifications";
import { contractTemplatesRouter } from "./contractTemplates";
import { messageTemplatesRouter } from "./messageTemplates";
import { crmRouter } from "./crm";
import { viewingRouter } from "./viewing";
import { chatbotRouter } from "./chatbot";
import { marketplaceRouter } from "./marketplace";
import { adminRbacRouter } from "./admin-rbac";
import { adminPropertiesRouter } from "./admin-properties";
import { stripeRouter } from "./stripe";
import { contractModificationsRouter } from "./contract-modifications";

export const appRouter = router({
  auth: authRouter,
  contractModifications: contractModificationsRouter,
  profile: profileRouter,
  properties: propertiesRouter,
  applications: applicationsRouter,
  payments: paymentsRouter,
  contracts: contractsRouter,
  tenant: tenantRouter,
  landlord: landlordRouter,
  upload: uploadRouter,
  documentVault: documentVaultRouter,
  keyCollections: keyCollectionsRouter,
  messages: messagesRouter,
  informationRequests: informationRequestsRouter,
  maintenance: maintenanceRouter,
  checklist: checklistRouter,
  notifications: notificationsRouter,
  contractTemplates: contractTemplatesRouter,
  messageTemplates: messageTemplatesRouter,
  crm: crmRouter,
  viewing: viewingRouter,
  chatbot: chatbotRouter,
  marketplace: marketplaceRouter,
  adminRbac: adminRbacRouter,
  adminProperties: adminPropertiesRouter,
  stripe: stripeRouter,
});

export type AppRouter = typeof appRouter;
