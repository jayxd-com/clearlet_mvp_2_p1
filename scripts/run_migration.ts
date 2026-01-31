import 'dotenv/config';
import mysql from 'mysql2/promise';

async function runMigration() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL not found in environment');
    process.exit(1);
  }

  // Parse URL manually since we can't rely on the db.ts helper easily here without more imports
  const urlPattern = /^mysql:\/\/([^:@]+)(?::([^@]+))?@([^:]+):(\d+)\/(.+)$/;
  const match = url.match(urlPattern);

  if (!match) {
    console.error('Invalid DATABASE_URL format');
    process.exit(1);
  }

  const [, user, password, host, port, database] = match;

  const connection = await mysql.createConnection({
    host,
    port: parseInt(port),
    user,
    password: password || undefined,
    database,
  });

  console.log('Connected to database.');

  try {
    // Add stripeAccountId
    try {
        await connection.query("ALTER TABLE users ADD COLUMN stripeAccountId varchar(255)");
        console.log("Added stripeAccountId column");
    } catch (e: any) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log("stripeAccountId already exists");
        } else {
            throw e;
        }
    }

    // Add stripeOnboardingComplete
    try {
        await connection.query("ALTER TABLE users ADD COLUMN stripeOnboardingComplete boolean DEFAULT false");
        console.log("Added stripeOnboardingComplete column");
    } catch (e: any) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log("stripeOnboardingComplete already exists");
        } else {
            throw e;
        }
    }

     // Add languagePreference
    try {
        await connection.query("ALTER TABLE users ADD COLUMN languagePreference varchar(10) DEFAULT 'en'");
        console.log("Added languagePreference column");
    } catch (e: any) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log("languagePreference already exists");
        } else {
            throw e;
        }
    }

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await connection.end();
  }
}

runMigration();
