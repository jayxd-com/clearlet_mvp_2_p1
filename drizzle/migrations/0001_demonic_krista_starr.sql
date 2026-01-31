ALTER TABLE `properties` MODIFY COLUMN `status` enum('pending_verification','active','inactive','rented') DEFAULT 'pending_verification';--> statement-breakpoint
ALTER TABLE `users` ADD `isSuperAdmin` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `users` ADD `stripeAccountId` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `stripeOnboardingComplete` boolean DEFAULT false;