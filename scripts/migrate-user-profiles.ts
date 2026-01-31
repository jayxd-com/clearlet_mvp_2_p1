import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../drizzle/schema";
import { eq, sql } from "drizzle-orm";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is not set");
  process.exit(1);
}

async function migrate() {
  try {
    console.log("🚀 Starting user profiles migration...");

    const connection = await mysql.createConnection(DATABASE_URL!);
    const db = drizzle(connection, { schema, mode: "default" });

    // Get all users
    const allUsers = await db.select().from(schema.users);
    console.log(`Found ${allUsers.length} total users.`);

    let createdCount = 0;

    for (const user of allUsers) {
      // Check if profile exists
      const existingProfile = await db.query.userProfiles.findFirst({
        where: eq(schema.userProfiles.userId, user.id),
      });

      if (!existingProfile) {
        console.log(`Creating profile for user ID: ${user.id} (${user.email})`);
        
        await db.insert(schema.userProfiles).values({
          userId: user.id,
          verificationScore: user.verificationStatus === 'verified' ? 100 : 0,
          tenantScore: 0,
          // Pre-fill some data for seeded users if needed, or leave defaults
          bio: `Hello, I'm ${user.name}`,
        });
        
        createdCount++;
      }
    }

    console.log(`✅ Migration completed. Created ${createdCount} new profiles.`);
    await connection.end();
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

migrate();
