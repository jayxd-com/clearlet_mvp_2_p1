CREATE TABLE `appSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`platformCommissionPercentage` int NOT NULL DEFAULT 5,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `appSettings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contractTerminations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contractId` int NOT NULL,
	`requestedBy` int NOT NULL,
	`reason` text NOT NULL,
	`desiredEndDate` timestamp NOT NULL,
	`status` enum('pending','approved','rejected','cancelled') NOT NULL DEFAULT 'pending',
	`respondedBy` int,
	`respondedAt` timestamp,
	`responseMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contractTerminations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payouts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`landlordId` int NOT NULL,
	`adminId` int NOT NULL,
	`amount` int NOT NULL,
	`currency` varchar(3) DEFAULT 'EUR',
	`status` enum('pending','processing','completed','failed') DEFAULT 'pending',
	`method` varchar(50) DEFAULT 'manual',
	`reference` varchar(255),
	`description` text,
	`paidAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payouts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `contracts` ADD `language` varchar(2) DEFAULT 'en';--> statement-breakpoint
ALTER TABLE `payments` ADD `type` enum('rent','deposit') DEFAULT 'rent' NOT NULL;--> statement-breakpoint
ALTER TABLE `payments` ADD `platformFee` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `payments` ADD `netAmount` int DEFAULT 0;