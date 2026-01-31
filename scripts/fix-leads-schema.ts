import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL || "");
  
  try {
    console.log('Checking chatbot_leads indexes...');
    const [indexes] = await connection.execute('SHOW INDEX FROM chatbot_leads');
    
    // Find the unique index on email. Drizzle usually names it chatbot_leads_email_unique
    // or sometimes it's just 'email' if created manually.
    const emailUniqueIndex = (indexes as any[]).find(idx => idx.Column_name === 'email' && idx.Non_unique === 0);
    
    if (emailUniqueIndex) {
      console.log(`Dropping unique index: ${emailUniqueIndex.Key_name}`);
      await connection.execute(`ALTER TABLE chatbot_leads DROP INDEX 
${emailUniqueIndex.Key_name}
`);
      console.log('Unique index dropped successfully.');
    } else {
      console.log('No unique index on email column found.');
    }

    // Also add a non-unique index if it doesn't exist
    const emailIndex = (indexes as any[]).find(idx => idx.Column_name === 'email' && idx.Non_unique === 1);
    if (!emailIndex) {
      console.log('Adding non-unique index on email...');
      await connection.execute('CREATE INDEX idx_email ON chatbot_leads(email)');
      console.log('Index idx_email created.');
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await connection.end();
  }
}

run();
