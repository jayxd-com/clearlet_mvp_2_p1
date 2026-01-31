ALTER TABLE users ADD COLUMN stripeAccountId varchar(255);
ALTER TABLE users ADD COLUMN stripeOnboardingComplete boolean DEFAULT false;
ALTER TABLE users ADD COLUMN languagePreference varchar(10) DEFAULT 'en';
