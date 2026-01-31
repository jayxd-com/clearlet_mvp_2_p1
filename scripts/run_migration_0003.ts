import 'dotenv/config';
import mysql from 'mysql2/promise';

async function runMigration() {
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
  });

  console.log('Connected to database.');

  try {
    await connection.query("ALTER TABLE `chatbot_leads` ADD `nextFollowUpDate` timestamp");
    console.log("Added nextFollowUpDate column");
  } catch (e: any) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log("nextFollowUpDate already exists");
    } else {
      console.error("Migration failed:", e);
    }
  }

  await connection.end();
}

runMigration();
