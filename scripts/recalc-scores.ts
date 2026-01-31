import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../drizzle/schema";
import { eq } from "drizzle-orm";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { getTenantScoreFactors } from "../server/db";
import { calculateTenantScore } from "../server/tenantScore";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is not set");
  process.exit(1);
}

// We need to mock getDb for the imported functions to work if they use it internally
// But getTenantScoreFactors uses getDb internally. 
// We can't easily mock the internal getDb call of the imported module without dependency injection or complex mocking.
// However, server/db.ts exports getDb. We can rely on it connecting if we set the env var.
// But wait, the imported `getTenantScoreFactors` calls `getUserProfile` which calls `getDb`.
// `getDb` reads process.env.DATABASE_URL. So it should work as long as env is loaded.

async function recalculate() {
  try {
    console.log("🔄 Starting tenant score recalculation...");

    const connection = await mysql.createConnection(DATABASE_URL!);
    const db = drizzle(connection, { schema, mode: "default" });

    // Get all users
    const allUsers = await db.select().from(schema.users);
    console.log(`Found ${allUsers.length} users.`);

    let updatedCount = 0;

    for (const user of allUsers) {
      if (user.userType === 'tenant') {
        try {
          // Calculate score using the logic
          // Note: We need to use the imported function which relies on the DB connection being established implicitly via getDb()
          // We might need to initialize the pool in db.ts first? 
          // Actually getDb() initializes lazy.
          
          const factors = await getTenantScoreFactors(user.id);
          
          if (factors) {
            const scoreResult = calculateTenantScore(factors);
            const newScore = scoreResult.totalScore;
            
            console.log(`User ${user.id} (${user.name}): Calculated Score = ${newScore}`);

            // Update profile directly
            await db.update(schema.userProfiles)
              .set({ tenantScore: newScore })
              .where(eq(schema.userProfiles.userId, user.id));
              
            updatedCount++;
          } else {
            console.log(`User ${user.id}: No factors found.`);
          }
        } catch (err) {
          console.error(`Failed to calc score for user ${user.id}:`, err);
        }
      }
    }

    console.log(`✅ Recalculation completed. Updated ${updatedCount} tenant profiles.`);
    await connection.end();
    
    // We also need to close the pool created by getDb() if it was used
    // But we can't access it easily. Process exit will handle it.
    process.exit(0);

  } catch (error) {
    console.error("❌ Recalculation failed:", error);
    process.exit(1);
  }
}

recalculate();
