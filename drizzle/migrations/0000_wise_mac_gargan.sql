CREATE TABLE `analyticsEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventType` varchar(100) NOT NULL,
	`eventCategory` enum('contract','payment','maintenance','application','user') NOT NULL,
	`userId` int,
	`propertyId` int,
	`contractId` int,
	`paymentId` int,
	`applicationId` int,
	`metadata` text,
	`eventTimestamp` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analyticsEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `applications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`userId` int NOT NULL,
	`landlordId` int NOT NULL,
	`status` enum('pending','accepted','rejected','withdrawn') DEFAULT 'pending',
	`moveInDate` timestamp,
	`leaseLength` int,
	`message` text,
	`shareIdDocument` boolean DEFAULT false,
	`shareIncomeDocument` boolean DEFAULT false,
	`shareEmploymentDocument` boolean DEFAULT false,
	`shareReferences` boolean DEFAULT false,
	`numberOfOccupants` int DEFAULT 1,
	`hasPets` boolean DEFAULT false,
	`petType` varchar(100),
	`petCount` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `applications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`adminId` int NOT NULL,
	`action` varchar(100) NOT NULL,
	`resourceType` varchar(100),
	`resourceId` int,
	`details` text,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chatbot_conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(255) NOT NULL,
	`userId` int,
	`visitorEmail` varchar(255),
	`visitorName` varchar(255),
	`language` varchar(10) DEFAULT 'en',
	`status` enum('active','closed','lead_captured') DEFAULT 'active',
	`leadId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chatbot_conversations_id` PRIMARY KEY(`id`),
	CONSTRAINT `chatbot_conversations_sessionId_unique` UNIQUE(`sessionId`)
);
--> statement-breakpoint
CREATE TABLE `chatbot_leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(255) NOT NULL,
	`name` varchar(255),
	`phone` varchar(20),
	`userType` enum('tenant','landlord','both','unknown') DEFAULT 'unknown',
	`interest` varchar(255),
	`source` varchar(100) DEFAULT 'chatbot',
	`status` enum('new','contacted','qualified','converted','rejected') DEFAULT 'new',
	`notes` text,
	`conversationId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chatbot_leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chatbot_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`sender` enum('user','bot') NOT NULL,
	`message` text NOT NULL,
	`intent` varchar(100),
	`confidence` varchar(10),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chatbot_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chatbot_responses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`intent` varchar(100) NOT NULL,
	`category` varchar(50) NOT NULL,
	`responseEn` text NOT NULL,
	`responseEs` text NOT NULL,
	`keywords` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chatbot_responses_id` PRIMARY KEY(`id`),
	CONSTRAINT `chatbot_responses_intent_unique` UNIQUE(`intent`)
);
--> statement-breakpoint
CREATE TABLE `checklistTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`landlordId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`propertyType` enum('apartment','house','studio','commercial','other') NOT NULL,
	`items` text NOT NULL,
	`isDefault` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `checklistTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clearCoinTransactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`transactionType` enum('earn','spend','transfer','bonus') NOT NULL,
	`amount` int NOT NULL,
	`reason` varchar(255) NOT NULL,
	`description` text,
	`relatedContractId` int,
	`relatedPaymentId` int,
	`relatedApplicationId` int,
	`balanceAfter` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `clearCoinTransactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clearCoinWallets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`balance` int NOT NULL DEFAULT 0,
	`totalEarned` int NOT NULL DEFAULT 0,
	`totalSpent` int NOT NULL DEFAULT 0,
	`walletAddress` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clearCoinWallets_id` PRIMARY KEY(`id`),
	CONSTRAINT `clearCoinWallets_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `contractAmendments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contractId` int NOT NULL,
	`proposedBy` int NOT NULL,
	`amendmentType` enum('rent_change','term_extension','terms_update','other') NOT NULL,
	`description` text NOT NULL,
	`changes` text NOT NULL,
	`newMonthlyRent` int,
	`newEndDate` timestamp,
	`newTerms` text,
	`status` enum('pending','approved','rejected','withdrawn') NOT NULL DEFAULT 'pending',
	`respondedBy` int,
	`respondedAt` timestamp,
	`responseMessage` text,
	`effectiveDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contractAmendments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contractRenewals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`originalContractId` int NOT NULL,
	`newContractId` int,
	`landlordId` int NOT NULL,
	`tenantId` int NOT NULL,
	`propertyId` int NOT NULL,
	`proposedStartDate` timestamp NOT NULL,
	`proposedEndDate` timestamp NOT NULL,
	`proposedMonthlyRent` int NOT NULL,
	`proposedSecurityDeposit` int NOT NULL,
	`proposedTerms` text,
	`status` enum('pending','accepted','rejected','expired') NOT NULL DEFAULT 'pending',
	`respondedAt` timestamp,
	`responseMessage` text,
	`offerExpiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contractRenewals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contractTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`terms` text NOT NULL,
	`specialConditions` text,
	`isDefault` boolean DEFAULT false,
	`isPublic` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contractTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contracts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`landlordId` int NOT NULL,
	`tenantId` int NOT NULL,
	`applicationId` int,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`monthlyRent` int NOT NULL,
	`securityDeposit` int NOT NULL,
	`currency` varchar(3) DEFAULT 'EUR',
	`terms` text,
	`specialConditions` text,
	`landlordSignature` text,
	`landlordSignedAt` timestamp,
	`tenantSignature` text,
	`tenantSignedAt` timestamp,
	`status` enum('draft','sent_to_tenant','tenant_signed','fully_signed','active','expired','terminated') NOT NULL DEFAULT 'draft',
	`checklistId` int,
	`tenantName` varchar(255),
	`tenantEmail` varchar(320),
	`tenantPhone` varchar(50),
	`tenantOccupants` int,
	`tenantPets` text,
	`contractPdfUrl` varchar(500),
	`rentAmount` int,
	`depositPaid` boolean DEFAULT false,
	`depositPaidAt` timestamp,
	`depositPaymentMethod` varchar(50),
	`depositPaymentReference` varchar(255),
	`firstMonthRentPaid` boolean DEFAULT false,
	`firstMonthRentPaidAt` timestamp,
	`firstMonthRentPaymentMethod` varchar(50),
	`firstMonthRentPaymentReference` varchar(255),
	`keysCollected` boolean DEFAULT false,
	`keysCollectedAt` timestamp,
	`moveInDate` timestamp,
	`checklistDeadline` timestamp,
	`checklistCompletedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contracts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `disputeEvidence` (
	`id` int AUTO_INCREMENT NOT NULL,
	`disputeId` int NOT NULL,
	`uploadedBy` int NOT NULL,
	`fileUrl` varchar(500) NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileType` varchar(50) NOT NULL,
	`fileSize` int,
	`evidenceType` enum('photo_before','photo_after','receipt','invoice','contract','correspondence','other') NOT NULL,
	`caption` text,
	`location` varchar(255),
	`comparisonPairId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `disputeEvidence_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `disputeMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`disputeId` int NOT NULL,
	`senderId` int NOT NULL,
	`senderRole` enum('tenant','landlord','admin') NOT NULL,
	`message` text NOT NULL,
	`isSystemMessage` boolean DEFAULT false,
	`isResolutionOffer` boolean DEFAULT false,
	`offeredAmount` int,
	`readBy` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `disputeMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `disputeTimeline` (
	`id` int AUTO_INCREMENT NOT NULL,
	`disputeId` int NOT NULL,
	`eventType` enum('created','evidence_added','response_submitted','status_changed','resolution_proposed','resolution_accepted','resolution_rejected','message_sent','escalated','closed') NOT NULL,
	`actorUserId` int NOT NULL,
	`actorRole` enum('tenant','landlord','admin') NOT NULL,
	`eventTitle` varchar(255) NOT NULL,
	`eventDescription` text,
	`previousStatus` varchar(50),
	`newStatus` varchar(50),
	`previousAmount` int,
	`newAmount` int,
	`relatedEvidenceId` int,
	`relatedMessageId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `disputeTimeline_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `disputes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contractId` int NOT NULL,
	`filedBy` enum('tenant','landlord') NOT NULL,
	`filedByUserId` int NOT NULL,
	`disputeType` enum('security_deposit','maintenance','damage_claim','cleaning_fee','rent_arrears','other') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`claimedAmount` int NOT NULL,
	`proposedResolution` int,
	`finalAmount` int,
	`status` enum('open','under_review','awaiting_response','negotiating','resolved','closed','escalated') DEFAULT 'open',
	`resolutionNotes` text,
	`resolvedAt` timestamp,
	`resolvedBy` int,
	`priority` enum('low','medium','high','urgent') DEFAULT 'medium',
	`moveOutChecklistId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `disputes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documentVault` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`propertyId` int,
	`contractId` int,
	`fileName` varchar(255) NOT NULL,
	`fileUrl` varchar(500) NOT NULL,
	`fileKey` varchar(500) NOT NULL,
	`fileSize` int NOT NULL,
	`mimeType` varchar(100) NOT NULL,
	`category` enum('insurance','inspection','lease','receipt','certificate','other') NOT NULL,
	`description` text,
	`sharedWith` text,
	`isPublic` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `documentVault_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`documentType` enum('id','income','employment','reference') NOT NULL,
	`fileUrl` varchar(500) NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`verificationStatus` enum('pending','verified','rejected') DEFAULT 'pending',
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `informationRequestResponses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requestId` int NOT NULL,
	`responseMessage` text NOT NULL,
	`attachments` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `informationRequestResponses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `informationRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationId` int NOT NULL,
	`landlordId` int NOT NULL,
	`tenantId` int NOT NULL,
	`requestMessage` text NOT NULL,
	`requestType` enum('document','clarification','reference','other') DEFAULT 'clarification',
	`status` enum('pending','responded','resolved') DEFAULT 'pending',
	`respondedAt` timestamp,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `informationRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inquiries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`userId` int NOT NULL,
	`landlordId` int NOT NULL,
	`status` enum('pending','accepted','rejected','withdrawn') DEFAULT 'pending',
	`message` text,
	`moveInDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inquiries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `keyCollections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contractId` int NOT NULL,
	`collectionDate` timestamp NOT NULL,
	`location` text NOT NULL,
	`status` enum('scheduled','confirmed','completed','cancelled') DEFAULT 'scheduled',
	`landlordConfirmed` boolean DEFAULT false,
	`tenantConfirmed` boolean DEFAULT false,
	`landlordNotes` text,
	`tenantNotes` text,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `keyCollections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `maintenanceComments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requestId` int NOT NULL,
	`userId` int NOT NULL,
	`comment` text NOT NULL,
	`isInternal` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `maintenanceComments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `maintenanceRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`tenantId` int NOT NULL,
	`landlordId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`category` enum('plumbing','electrical','heating','appliance','structural','pest','other') NOT NULL,
	`priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
	`status` enum('pending','in_progress','completed','cancelled') NOT NULL DEFAULT 'pending',
	`photos` text,
	`contractorId` int,
	`contractorName` varchar(255),
	`contractorPhone` varchar(20),
	`estimatedCost` int,
	`actualCost` int,
	`scheduledDate` timestamp,
	`completedDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `maintenanceRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messageTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`title` varchar(255) NOT NULL,
	`category` varchar(100) NOT NULL,
	`content` text NOT NULL,
	`isDefault` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `messageTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`senderId` int NOT NULL,
	`recipientId` int NOT NULL,
	`propertyId` int,
	`inquiryId` int,
	`content` text NOT NULL,
	`isRead` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `moveInChecklists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contractId` int NOT NULL,
	`items` text NOT NULL,
	`photos` text,
	`tenantSignature` text,
	`tenantSignedAt` timestamp,
	`landlordSignature` text,
	`landlordSignedAt` timestamp,
	`status` enum('draft','tenant_signed','completed') DEFAULT 'draft',
	`tenantNotes` text,
	`landlordNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `moveInChecklists_id` PRIMARY KEY(`id`),
	CONSTRAINT `moveInChecklists_contractId_unique` UNIQUE(`contractId`)
);
--> statement-breakpoint
CREATE TABLE `moveOutChecklists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contractId` int NOT NULL,
	`moveInChecklistId` int NOT NULL,
	`items` text NOT NULL,
	`photos` text,
	`damages` text,
	`totalDamageCost` int DEFAULT 0,
	`securityDepositAmount` int NOT NULL,
	`securityDepositReturned` int DEFAULT 0,
	`securityDepositDeductions` text,
	`tenantSignature` text,
	`tenantSignedAt` timestamp,
	`landlordSignature` text,
	`landlordSignedAt` timestamp,
	`status` enum('draft','tenant_signed','landlord_reviewed','completed','disputed') DEFAULT 'draft',
	`tenantNotes` text,
	`landlordNotes` text,
	`moveOutDate` date NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `moveOutChecklists_id` PRIMARY KEY(`id`),
	CONSTRAINT `moveOutChecklists_contractId_unique` UNIQUE(`contractId`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('contract','payment','maintenance','application','system','checklist','key_collection') NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`link` varchar(500),
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contractId` int NOT NULL,
	`tenantId` int NOT NULL,
	`landlordId` int NOT NULL,
	`propertyId` int NOT NULL,
	`amount` int NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'EUR',
	`status` enum('pending','processing','completed','failed','refunded') NOT NULL DEFAULT 'pending',
	`paymentMethod` varchar(50),
	`stripePaymentIntentId` varchar(255),
	`stripeChargeId` varchar(255),
	`dueDate` timestamp NOT NULL,
	`paidAt` timestamp,
	`description` text,
	`receiptUrl` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `properties` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`address` text NOT NULL,
	`city` varchar(100) NOT NULL,
	`country` varchar(100) NOT NULL,
	`zipCode` varchar(20),
	`latitude` decimal(10,8),
	`longitude` decimal(11,8),
	`bedrooms` int NOT NULL,
	`bathrooms` int NOT NULL,
	`squareFeet` int,
	`rentPrice` int NOT NULL,
	`currency` varchar(3) DEFAULT 'EUR',
	`amenities` json,
	`images` json,
	`status` enum('active','inactive','rented') DEFAULT 'active',
	`verifiedLandlord` boolean DEFAULT false,
	`allowPets` boolean DEFAULT false,
	`petDeposit` int,
	`petRestrictions` text,
	`checklistTemplateId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `properties_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `property_viewings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`property_id` int NOT NULL,
	`tenant_id` int NOT NULL,
	`landlord_id` int NOT NULL,
	`requested_date` timestamp NOT NULL,
	`requested_time_slot` varchar(50) NOT NULL,
	`status` enum('pending','approved','rejected','cancelled','completed','no_show') NOT NULL DEFAULT 'pending',
	`landlord_notes` text,
	`landlord_approved_at` timestamp,
	`tenant_message` text,
	`tenant_verification_status` varchar(50),
	`meeting_location` varchar(255),
	`meeting_instructions` text,
	`landlord_feedback` text,
	`tenant_feedback` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `property_viewings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `savedFilters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`filterType` enum('contracts','properties','applications','payments') NOT NULL,
	`criteria` text NOT NULL,
	`isDefault` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `savedFilters_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `savedProperties` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`propertyId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `savedProperties_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `siteRoles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`isSystem` boolean DEFAULT false,
	`permissions` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `siteRoles_id` PRIMARY KEY(`id`),
	CONSTRAINT `siteRoles_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `userProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`bio` text,
	`address` text,
	`city` varchar(100),
	`country` varchar(100),
	`profileImage` varchar(500),
	`verificationScore` int DEFAULT 0,
	`dniNie` varchar(20),
	`companyName` varchar(255),
	`hasPets` boolean DEFAULT false,
	`petType` varchar(100),
	`petCount` int DEFAULT 0,
	`numberOfOccupants` int DEFAULT 1,
	`occupantDetails` text,
	`tenantRequirements` text,
	`annualSalary` int,
	`rentalHistory` int,
	`employmentStatus` enum('employed','self-employed','student','unemployed'),
	`tenantScore` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userProfiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userRoles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`roleId` int NOT NULL,
	`assignedBy` int,
	`assignedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userRoles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` text,
	`email` varchar(320) NOT NULL,
	`phone` varchar(20),
	`loginMethod` varchar(64),
	`passwordHash` varchar(255),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`userType` enum('tenant','landlord','buyer','seller','admin') NOT NULL DEFAULT 'tenant',
	`profileComplete` boolean DEFAULT false,
	`verificationStatus` enum('unverified','pending','verified') DEFAULT 'unverified',
	`languagePreference` varchar(10) DEFAULT 'en',
	`themePreference` varchar(10) DEFAULT 'light',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `viewing_availability` (
	`id` int AUTO_INCREMENT NOT NULL,
	`property_id` int NOT NULL,
	`landlord_id` int NOT NULL,
	`available_date` timestamp NOT NULL,
	`time_slots` varchar(500) NOT NULL,
	`max_viewings_per_day` int NOT NULL DEFAULT 5,
	`current_viewing_count` int NOT NULL DEFAULT 0,
	`is_open` boolean NOT NULL DEFAULT true,
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `viewing_availability_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `viewing_feedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`viewing_id` int NOT NULL,
	`property_id` int NOT NULL,
	`tenant_id` int NOT NULL,
	`landlord_id` int NOT NULL,
	`tenant_rating` int,
	`tenant_comment` text,
	`tenant_liked` text,
	`tenant_disliked` text,
	`landlord_rating` int,
	`landlord_comment` text,
	`landlord_impression_of_tenant` varchar(50),
	`would_tenant_apply` boolean,
	`would_landlord_accept` boolean,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `viewing_feedback_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `viewing_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`viewing_id` int NOT NULL,
	`recipient_id` int NOT NULL,
	`recipient_type` enum('tenant','landlord') NOT NULL,
	`notification_type` enum('viewing_requested','viewing_approved','viewing_rejected','viewing_reminder_24h','viewing_reminder_1h','viewing_completed','feedback_requested') NOT NULL,
	`sent` boolean NOT NULL DEFAULT false,
	`sent_at` timestamp,
	`read` boolean NOT NULL DEFAULT false,
	`read_at` timestamp,
	`subject` varchar(255),
	`message` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `viewing_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_sessionId` ON `chatbot_conversations` (`sessionId`);--> statement-breakpoint
CREATE INDEX `idx_userId` ON `chatbot_conversations` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_leadId` ON `chatbot_conversations` (`leadId`);--> statement-breakpoint
CREATE INDEX `idx_email` ON `chatbot_leads` (`email`);--> statement-breakpoint
CREATE INDEX `idx_status` ON `chatbot_leads` (`status`);--> statement-breakpoint
CREATE INDEX `idx_createdAt` ON `chatbot_leads` (`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_conversationId` ON `chatbot_leads` (`conversationId`);--> statement-breakpoint
CREATE INDEX `idx_conversationId` ON `chatbot_messages` (`conversationId`);--> statement-breakpoint
CREATE INDEX `idx_intent` ON `chatbot_messages` (`intent`);--> statement-breakpoint
CREATE INDEX `idx_res_intent` ON `chatbot_responses` (`intent`);--> statement-breakpoint
CREATE INDEX `idx_res_category` ON `chatbot_responses` (`category`);--> statement-breakpoint
CREATE INDEX `idx_property_viewings_property` ON `property_viewings` (`property_id`);--> statement-breakpoint
CREATE INDEX `idx_property_viewings_tenant` ON `property_viewings` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `idx_property_viewings_landlord` ON `property_viewings` (`landlord_id`);--> statement-breakpoint
CREATE INDEX `idx_property_viewings_status` ON `property_viewings` (`status`);--> statement-breakpoint
CREATE INDEX `idx_property_viewings_date` ON `property_viewings` (`requested_date`);--> statement-breakpoint
CREATE INDEX `idx_viewing_availability_property` ON `viewing_availability` (`property_id`);--> statement-breakpoint
CREATE INDEX `idx_viewing_availability_landlord` ON `viewing_availability` (`landlord_id`);--> statement-breakpoint
CREATE INDEX `idx_viewing_availability_date` ON `viewing_availability` (`available_date`);--> statement-breakpoint
CREATE INDEX `idx_viewing_feedback_viewing` ON `viewing_feedback` (`viewing_id`);--> statement-breakpoint
CREATE INDEX `idx_viewing_feedback_property` ON `viewing_feedback` (`property_id`);--> statement-breakpoint
CREATE INDEX `idx_viewing_feedback_tenant` ON `viewing_feedback` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `idx_viewing_feedback_landlord` ON `viewing_feedback` (`landlord_id`);--> statement-breakpoint
CREATE INDEX `idx_viewing_notifications_viewing` ON `viewing_notifications` (`viewing_id`);--> statement-breakpoint
CREATE INDEX `idx_viewing_notifications_recipient` ON `viewing_notifications` (`recipient_id`);--> statement-breakpoint
CREATE INDEX `idx_viewing_notifications_type` ON `viewing_notifications` (`notification_type`);