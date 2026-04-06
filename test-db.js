import { Client } from 'pg';

const client = new Client({
  connectionString: 'postgresql://postgres:8651942079Bh%40@db.scddpuivohgsnhwpmjwt.supabase.co:5432/postgres'
});

async function test() {
  try {
    await client.connect();
    console.log('Connected successfully!');
    await client.end();
  } catch (err) {
    console.error('Connection error:', err);
  }
}

test();
