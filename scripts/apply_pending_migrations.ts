import 'dotenv/config';
import mysql from 'mysql2/promise';

async function applyMigrations() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL not found');
    process.exit(1);
  }

  const urlPattern = /^mysql:\/\/([^:@]+)(?::([^@]+))?@([^:]+):(\d+)\/(.+)$/;
  const match = url.match(urlPattern);
  if (!match) {
    console.error('Invalid DATABASE_URL');
    process.exit(1);
  }
  const [, user, password, host, port, database] = match;

  const connection = await mysql.createConnection({
    host,
    port: parseInt(port),
    user,
    password: password || undefined,
    database,
    multipleStatements: true
  });

  console.log('Connected to database. Applying migrations...');

  const queries = [
    `CREATE TABLE IF NOT EXISTS appSettings (
        id int AUTO_INCREMENT NOT NULL,
        platformCommissionPercentage int NOT NULL DEFAULT 5,
        updatedAt timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT appSettings_id PRIMARY KEY(id)
    )`,
    `CREATE TABLE IF NOT EXISTS contractTerminations (
        id int AUTO_INCREMENT NOT NULL,
        contractId int NOT NULL,
        requestedBy int NOT NULL,
        reason text NOT NULL,
        desiredEndDate timestamp NOT NULL,
        status enum('pending','approved','rejected','cancelled') NOT NULL DEFAULT 'pending',
        respondedBy int,
        respondedAt timestamp,
        responseMessage text,
        createdAt timestamp NOT NULL DEFAULT (now()),
        updatedAt timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT contractTerminations_id PRIMARY KEY(id)
    )`,
    `CREATE TABLE IF NOT EXISTS payouts (
        id int AUTO_INCREMENT NOT NULL,
        landlordId int NOT NULL,
        adminId int NOT NULL,
        amount int NOT NULL,
        currency varchar(3) DEFAULT 'EUR',
        status enum('pending','processing','completed','failed') DEFAULT 'pending',
        method varchar(50) DEFAULT 'manual',
        reference varchar(255),
        description text,
        paidAt timestamp,
        createdAt timestamp NOT NULL DEFAULT (now()),
        updatedAt timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT payouts_id PRIMARY KEY(id)
    )`,
    // Columns - using separate try/catch for ALTERs as IF NOT EXISTS doesn't work for columns in MySQL 5.7/8.0 easily in one line without procedure
    { sql: "ALTER TABLE contracts ADD COLUMN language varchar(2) DEFAULT 'en'", name: "contracts.language" },
    { sql: "ALTER TABLE payments ADD COLUMN type enum('rent','deposit') DEFAULT 'rent' NOT NULL", name: "payments.type" },
    { sql: "ALTER TABLE payments ADD COLUMN platformFee int DEFAULT 0", name: "payments.platformFee" },
    { sql: "ALTER TABLE payments ADD COLUMN netAmount int DEFAULT 0", name: "payments.netAmount" }
  ];

  for (const q of queries) {
    if (typeof q === 'string') {
        try {
            await connection.query(q);
            console.log(`Executed: ${q.substring(0, 50)}...`);
        } catch (e: any) {
            console.warn(`Skipped (or error): ${q.substring(0, 30)}... - ${e.message}`);
        }
    } else {
        try {
            await connection.query(q.sql);
            console.log(`Added column: ${q.name}`);
        } catch (e: any) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log(`Column already exists: ${q.name}`);
            } else {
                console.error(`Error adding ${q.name}:`, e.message);
            }
        }
    }
  }

  await connection.end();
  console.log('Migration process finished.');
}

applyMigrations();
