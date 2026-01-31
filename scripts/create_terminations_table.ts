import { getDb } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  console.log("Creating contractTerminations table...");

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS contractTerminations (
      id int AUTO_INCREMENT PRIMARY KEY NOT NULL,
      contractId int NOT NULL,
      requestedBy int NOT NULL,
      reason text NOT NULL,
      desiredEndDate timestamp NOT NULL,
      status enum('pending','approved','rejected','cancelled') NOT NULL DEFAULT 'pending',
      respondedBy int,
      respondedAt timestamp,
      responseMessage text,
      createdAt timestamp NOT NULL DEFAULT (now()),
      updatedAt timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
    );
  `);

  console.log("Table created successfully!");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
