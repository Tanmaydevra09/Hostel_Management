const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const config = {
  host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
  port: 4000,
  user: '2VwzvEHDYpnxdYU.root',
  password: 'wnpmI3QtuaESyH0Z',
  ssl: { rejectUnauthorized: true },
  connectTimeout: 30000,
  multipleStatements: true
};

async function setup() {
  console.log('Connecting to TiDB Cloud...');

  // Step 1: Create database
  const conn1 = await mysql.createConnection(config);
  console.log('✅ Connected!');
  await conn1.query('CREATE DATABASE IF NOT EXISTS hostel_hub;');
  console.log('✅ Database hostel_hub created!');
  await conn1.end();

  // Step 2: Run schema on hostel_hub
  const conn2 = await mysql.createConnection({ ...config, database: 'hostel_hub' });
  const schemaSQL = fs.readFileSync(path.join(__dirname, '../database/schema_planetscale.sql'), 'utf8');
  console.log('Running schema...');
  await conn2.query(schemaSQL);
  console.log('✅ All tables created!');

  // Step 3: Run seed data
  const seedSQL = fs.readFileSync(path.join(__dirname, '../database/seed_planetscale.sql'), 'utf8');
  console.log('Inserting seed data...');
  await conn2.query(seedSQL);
  console.log('✅ Seed data inserted!');

  await conn2.end();
  console.log('\n🎉 TiDB is ready! Database: hostel_hub');
  console.log('   Host:', config.host);
  console.log('   Port:', config.port);
  console.log('   User:', config.user);
}

setup().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
