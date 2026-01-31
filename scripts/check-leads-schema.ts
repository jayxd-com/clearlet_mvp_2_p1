import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL || "");
  
  try {
    console.log('Chatbot Leads Index Details:');
    const [indexes] = await connection.execute('SHOW INDEX FROM chatbot_leads');
    console.log(JSON.stringify(indexes, null, 2));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await connection.end();
  }
}

run();
