import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL || "");
  
  try {
    console.log('Modifying properties status enum...');
    await connection.execute(`
      ALTER TABLE properties 
      MODIFY COLUMN status ENUM('pending_verification', 'active', 'inactive', 'rented') 
      NOT NULL DEFAULT 'pending_verification'
    `);
    console.log('Properties status enum updated successfully.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await connection.end();
  }
}

run();
