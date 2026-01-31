import 'dotenv/config';
import mysql from 'mysql2/promise';

async function runMigration() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL not found');
    process.exit(1);
  }

  // Parse URL manually
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
    // 1. Create appSettings table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS appSettings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        platformCommissionPercentage INT DEFAULT 5 NOT NULL,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log("Created appSettings table");

    // Initialize default setting if empty
    const [rows] = await connection.query("SELECT * FROM appSettings LIMIT 1") as any;
    if (rows.length === 0) {
      await connection.query("INSERT INTO appSettings (platformCommissionPercentage) VALUES (5)");
      console.log("Initialized default commission to 5%");
    }

    // 2. Add columns to payments table
    try {
        await connection.query("ALTER TABLE payments ADD COLUMN platformFee INT DEFAULT 0");
        console.log("Added platformFee to payments");
    } catch (e: any) {
        if (e.code !== 'ER_DUP_FIELDNAME') throw e;
    }

    try {
        await connection.query("ALTER TABLE payments ADD COLUMN netAmount INT DEFAULT 0");
        console.log("Added netAmount to payments");
    } catch (e: any) {
        if (e.code !== 'ER_DUP_FIELDNAME') throw e;
    }

    // 3. Create payouts table (Admin -> Landlord)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS payouts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        landlordId INT NOT NULL,
        adminId INT NOT NULL,
        amount INT NOT NULL, -- Amount paid in cents
        currency VARCHAR(3) DEFAULT 'EUR',
        status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
        method VARCHAR(50) DEFAULT 'manual', -- 'manual', 'bank_transfer', 'stripe'
        reference VARCHAR(255), -- Bank transaction ID
        description TEXT,
        paidAt TIMESTAMP,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (landlordId) REFERENCES users(id),
        FOREIGN KEY (adminId) REFERENCES users(id)
      )
    `);
    console.log("Created payouts table");

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await connection.end();
  }
}

runMigration();
