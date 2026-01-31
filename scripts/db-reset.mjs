import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root (one level up from scripts/)
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is not set. Make sure it is in your .env file.");
  process.exit(1);
}

async function reset() {
  try {
    // Parse URL manually to handle special characters if needed, or use URL object
    // mysql://user:pass@host:port/db
    const url = new URL(DATABASE_URL);
    const dbName = url.pathname.slice(1);
    
    const connection = await mysql.createConnection({
      host: url.hostname,
      port: parseInt(url.port) || 3306,
      user: url.username,
      password: url.password,
    });

    console.log(`🔄 Dropping database: ${dbName}...`);
    await connection.query(`DROP DATABASE IF EXISTS \`${dbName}\`;`);
    console.log(`✅ Database dropped.`);
    
    console.log(`🔄 Creating database: ${dbName}...`);
    await connection.query(`CREATE DATABASE \`${dbName}\`;`);
    console.log(`✅ Database created.`);
    
    await connection.end();
    console.log("🎉 Database reset successfully!");
    
  } catch (error) {
    console.error("❌ Error resetting database:", error);
    process.exit(1);
  }
}

reset();
