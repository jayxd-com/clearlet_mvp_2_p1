import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL || "");
  
  try {
    console.log('Checking users table columns...');
    const [columns] = await connection.execute('SHOW COLUMNS FROM users');
    
    const isSuperAdminExists = (columns as any[]).find(col => col.Field === 'isSuperAdmin');
    
    if (!isSuperAdminExists) {
      console.log('Adding isSuperAdmin column...');
      await connection.execute('ALTER TABLE users ADD COLUMN isSuperAdmin tinyint(1) DEFAULT 0');
      console.log('Column isSuperAdmin added successfully.');
    } else {
      console.log('Column isSuperAdmin already exists.');
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await connection.end();
  }
}

run();
