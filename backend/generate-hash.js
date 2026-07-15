/**
 * Run this script ONCE before seeding the database.
 * 
 * Usage:
 *   cd backend
 *   node generate-hash.js
 * 
 * Then copy the output hash into database/seed.sql where indicated.
 */

const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.question('Enter the password to hash (default: Admin@123): ', async (answer) => {
  const pwd = answer.trim() || 'Admin@123';
  const hash = await bcrypt.hash(pwd, 10);
  console.log('\n✅ Password hash generated successfully!\n');
  console.log(`Password:   ${pwd}`);
  console.log(`Hash:       ${hash}`);
  console.log('\n📋 Copy the hash above and paste it into database/seed.sql');
  console.log('   Replace the line:  SET @pwd_hash = \'$2b$10$PLACEHOLDER...\';');
  console.log(`   With:              SET @pwd_hash = '${hash}';`);
  rl.close();
});
