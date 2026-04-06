import pg from 'pg';
import fs from 'fs';
const { Client } = pg;

async function testIPv6() {
  const url = `postgresql://postgres:8651942079Bh%40@[2406:da14:271:9900:8:e72c:1fad:5bab:b2f1]:5432/postgres?sslmode=require`;
  const client = new Client({ connectionString: url });
  try {
    await client.connect();
    fs.appendFileSync('out.log', `Connected to IPv6 directly!\n`);
    await client.end();
  } catch (err) {
    fs.appendFileSync('out.log', `IPv6 error: ${err.message}\n`);
  }
}

async function run() {
  fs.writeFileSync('out.log', 'Testing IPv6...\n');
  await testIPv6();
}
run();
