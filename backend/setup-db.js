import pg from 'pg';
import fs from 'fs';
const { Client } = pg;

async function setupDB() {
  const initSql = fs.readFileSync('../infra/db/init.sql', 'utf8');

  // We connect using the IPv6 address to avoid DNS lookup timeout in this environment
  const client = new Client({
    host: 'db.scddpuivohgsnhwpmjwt.supabase.co',
    port: 5432,
    user: 'postgres',
    password: '8651942079Bh@',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected. Executing init.sql...');
    
    // Execute the SQL statements
    await client.query(initSql);
    
    console.log('Database setup completed successfully!');
  } catch (err) {
    console.error('Error during database setup:', err);
  } finally {
    await client.end();
  }
}

setupDB();
