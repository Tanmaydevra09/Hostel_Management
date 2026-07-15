const pool = require('../config/db');
const logAudit = require('../utils/auditLogger');

// ── GET /api/rooms ────────────────────────────────────────────────────────────
const getAllRooms = async (req, res, next) => {
  try {
    const { search, block, gender, is_ac, room_type, maintenance_status, availability } = req.query;

    let where = ['1=1'];
    const params = [];

    if (search) {
      where.push('(r.room_number LIKE ? OR r.block LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    if (block) { where.push('r.block = ?'); params.push(block); }
    if (gender) { where.push('r.gender = ?'); params.push(gender); }
    if (is_ac !== undefined) { where.push('r.is_ac = ?'); params.push(is_ac === 'true' ? 1 : 0); }
    if (room_type) { where.push('r.room_type = ?'); params.push(room_type); }
    if (maintenance_status) { where.push('r.maintenance_status = ?'); params.push(maintenance_status); }
    if (availability === 'available') where.push('r.current_occupancy < r.capacity');
    if (availability === 'full') where.push('r.current_occupancy >= r.capacity');

    const [rows] = await pool.query(`
      SELECT r.*,
        (r.capacity - r.current_occupancy) AS available_beds,
        ROUND((r.current_occupancy / r.capacity) * 100) AS occupancy_pct
      FROM rooms r WHERE ${where.join(' AND ')}
      ORDER BY r.block, r.floor, r.room_number
    `, params);

    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

// ── GET /api/rooms/:id ────────────────────────────────────────────────────────
const getRoomById = async (req, res, next) => {
  try {
    const [rooms] = await pool.query(`
      SELECT r.*, (r.capacity - r.current_occupancy) AS available_beds
      FROM rooms r WHERE r.id = ?
    `, [req.params.id]);
    if (rooms.length === 0) return res.status(404).json({ success: false, message: 'Room not found.' });

    const [students] = await pool.query(
      'SELECT id, student_id, name, course, department, year FROM students WHERE room_id = ?',
      [req.params.id]
    );

    res.json({ success: true, data: { ...rooms[0], students } });
  } catch (err) { next(err); }
};

// ── POST /api/rooms ───────────────────────────────────────────────────────────
const createRoom = async (req, res, next) => {
  try {
    const { room_number, block, floor, capacity, room_type, is_ac, gender, monthly_rent, amenities } = req.body;

    if (!room_number || !capacity) {
      return res.status(400).json({ success: false, message: 'room_number and capacity are required.' });
    }

    const [result] = await pool.query(`
      INSERT INTO rooms (room_number, block, floor, capacity, room_type, is_ac, gender, monthly_rent, amenities)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      room_number, block || 'A', floor || 0, capacity,
      room_type || 'Double', is_ac || false, gender || 'Any',
      monthly_rent || 5000.00, amenities || null
    ]);

    await logAudit(req, 'Create', 'Rooms', result.insertId, `Created room ${room_number}`);

    res.status(201).json({ success: true, message: 'Room created successfully.', id: result.insertId });
  } catch (err) { next(err); }
};

// ── PUT /api/rooms/:id ────────────────────────────────────────────────────────
const updateRoom = async (req, res, next) => {
  try {
    const { room_number, block, floor, capacity, room_type, is_ac, gender, monthly_rent, maintenance_status, amenities } = req.body;

    const [exists] = await pool.query('SELECT id FROM rooms WHERE id = ?', [req.params.id]);
    if (exists.length === 0) return res.status(404).json({ success: false, message: 'Room not found.' });

    await pool.query(`
      UPDATE rooms SET room_number=?, block=?, floor=?, capacity=?, room_type=?,
        is_ac=?, gender=?, monthly_rent=?, maintenance_status=?, amenities=?
      WHERE id=?
    `, [
      room_number, block, floor, capacity, room_type, is_ac, gender,
      monthly_rent, maintenance_status || 'Good', amenities || null, req.params.id
    ]);

    await logAudit(req, 'Update', 'Rooms', req.params.id, `Updated room details for room ${room_number}`);

    res.json({ success: true, message: 'Room updated successfully.' });
  } catch (err) { next(err); }
};

// ── DELETE /api/rooms/:id ─────────────────────────────────────────────────────
const deleteRoom = async (req, res, next) => {
  try {
    const [[{ occupancy }]] = await pool.query('SELECT current_occupancy FROM rooms WHERE id = ?', [req.params.id]);
    if (occupancy > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete a room that has occupants. Relocate students first.' });
    }
    await pool.query('DELETE FROM rooms WHERE id = ?', [req.params.id]);
    
    await logAudit(req, 'Delete', 'Rooms', req.params.id, `Deleted room ID ${req.params.id}`);
    
    res.json({ success: true, message: 'Room deleted successfully.' });
  } catch (err) { next(err); }
};

// ── POST /api/rooms/auto-allocate ─────────────────────────────────────────────
const autoAllocate = async (req, res, next) => {
  try {
    const { student_id, gender, preferred_block, prefer_ac } = req.body;

    if (!student_id) return res.status(400).json({ success: false, message: 'student_id is required.' });

    const [student] = await pool.query('SELECT * FROM students WHERE id = ?', [student_id]);
    if (student.length === 0) return res.status(404).json({ success: false, message: 'Student not found.' });
    if (student[0].room_id) return res.status(400).json({ success: false, message: 'Student already has a room assigned.' });

    let where = ['current_occupancy < capacity', "maintenance_status != 'Under Maintenance'"];
    const params = [];

    const genderFilter = gender || student[0].gender;
    if (genderFilter) {
      where.push("(gender = ? OR gender = 'Any')");
      params.push(genderFilter);
    }
    if (preferred_block) { where.push('block = ?'); params.push(preferred_block); }
    if (prefer_ac === true || prefer_ac === 'true') { where.push('is_ac = TRUE'); }

    const [availableRooms] = await pool.query(`
      SELECT *, (capacity - current_occupancy) AS available_beds
      FROM rooms WHERE ${where.join(' AND ')}
      ORDER BY ${preferred_block ? 'block = ? DESC,' : ''} is_ac DESC, available_beds DESC
      LIMIT 5
    `, params);

    if (availableRooms.length === 0) {
      return res.status(404).json({ success: false, message: 'No suitable rooms available matching the criteria.' });
    }

    res.json({ success: true, suggested_rooms: availableRooms });
  } catch (err) { next(err); }
};

// ── GET /api/rooms/meta/blocks ─────────────────────────────────────────────────
const getBlocks = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT DISTINCT block FROM rooms ORDER BY block');
    res.json({ success: true, blocks: rows.map(r => r.block) });
  } catch (err) { next(err); }
};

module.exports = { getAllRooms, getRoomById, createRoom, updateRoom, deleteRoom, autoAllocate, getBlocks };
