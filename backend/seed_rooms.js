const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'hostel_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const blocks = [
  // BOYS HOSTEL
  { block: 'A', gender: 'Male', is_ac: false, washroom: 'Common Washroom', capacity: 6, num_rooms: 20 },
  { block: 'B', gender: 'Male', is_ac: false, washroom: 'Common Washroom', capacity: 4, num_rooms: 15 },
  { block: 'C', gender: 'Male', is_ac: false, washroom: 'Common Washroom', capacity: 2, num_rooms: 10 },
  { block: 'D', gender: 'Male', is_ac: true, washroom: 'Common Washroom', capacity: 4, num_rooms: 12 },
  { block: 'E', gender: 'Male', is_ac: true, washroom: 'Attached Washroom', capacity: 3, num_rooms: 10 },
  { block: 'F', gender: 'Male', is_ac: true, washroom: 'Attached Washroom', capacity: 2, num_rooms: 8 },

  // GIRLS HOSTEL
  { block: 'G', gender: 'Female', is_ac: false, washroom: 'Common Washroom', capacity: 6, num_rooms: 20 },
  { block: 'H', gender: 'Female', is_ac: false, washroom: 'Common Washroom', capacity: 4, num_rooms: 15 },
  { block: 'I', gender: 'Female', is_ac: false, washroom: 'Common Washroom', capacity: 2, num_rooms: 10 },
  { block: 'J', gender: 'Female', is_ac: true, washroom: 'Common Washroom', capacity: 4, num_rooms: 12 },
  { block: 'K', gender: 'Female', is_ac: true, washroom: 'Attached Washroom', capacity: 3, num_rooms: 10 },
  { block: 'L', gender: 'Female', is_ac: true, washroom: 'Attached Washroom', capacity: 2, num_rooms: 8 },
];

const getRoomType = (capacity) => {
  if (capacity === 1) return 'Single';
  if (capacity === 2) return 'Double';
  if (capacity === 3) return 'Triple';
  return 'Dormitory';
};

const getRent = (capacity, is_ac, washroom) => {
  let base = 3000;
  if (capacity === 2) base = 5000;
  if (capacity === 3) base = 4000;
  if (capacity === 4) base = 3500;
  if (is_ac) base += 2000;
  if (washroom === 'Attached Washroom') base += 1000;
  return base;
};

async function seedRooms() {
  const connection = await pool.getConnection();
  try {
    console.log('Clearing existing rooms...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    // We update students to remove room_id first so we don't break constraints
    await connection.query('UPDATE students SET room_id = NULL');
    await connection.query('TRUNCATE TABLE rooms');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('Seeding new room structure...');
    let totalRooms = 0;

    for (const b of blocks) {
      for (let i = 1; i <= b.num_rooms; i++) {
        // Floor is determined by room number (e.g., 1-10 is floor 1, 11-20 is floor 2)
        const floor = Math.ceil(i / 10); 
        // Room number logic: e.g. 101, 102 for floor 1. 201, 202 for floor 2.
        const room_seq = i % 10 === 0 ? 10 : i % 10;
        const room_number = `${floor}${String(room_seq).padStart(2, '0')}`;
        
        const room_type = getRoomType(b.capacity);
        const monthly_rent = getRent(b.capacity, b.is_ac, b.washroom);
        const amenities = `${b.washroom}${b.is_ac ? ', AC' : ''}`;

        await connection.query(`
          INSERT INTO rooms (room_number, block, floor, capacity, room_type, is_ac, gender, monthly_rent, maintenance_status, amenities)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          room_number,
          b.block,
          floor,
          b.capacity,
          room_type,
          b.is_ac,
          b.gender,
          monthly_rent,
          Math.random() > 0.95 ? 'Needs Maintenance' : 'Good',
          amenities
        ]);
        totalRooms++;
      }
      console.log(`Block ${b.block} created with ${b.num_rooms} rooms.`);
    }

    console.log(`Successfully seeded ${totalRooms} rooms!`);
  } catch (err) {
    console.error('Seeding failed:', err);
  } finally {
    connection.release();
    process.exit(0);
  }
}

seedRooms();
