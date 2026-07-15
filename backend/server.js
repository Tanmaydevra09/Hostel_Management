require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');

const app = express();

// ── Security & Parsing Middleware ─────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? [process.env.FRONTEND_URL, true]  // allow same-origin + explicit URL
    : (process.env.FRONTEND_URL || 'http://localhost:5173'),
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Static file serving (student photos) ─────────────────────────────────────
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
app.use('/uploads', express.static(uploadDir));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',          require('./routes/auth.routes'));
app.use('/api/dashboard',     require('./routes/dashboard.routes'));
app.use('/api/students',      require('./routes/students.routes'));
app.use('/api/rooms',         require('./routes/rooms.routes'));
app.use('/api/fees',          require('./routes/fees.routes'));
app.use('/api/complaints',    require('./routes/complaints.routes'));
app.use('/api/visitors',      require('./routes/visitors.routes'));
app.use('/api/attendance',    require('./routes/attendance.routes'));
app.use('/api/leave',         require('./routes/leave.routes'));
app.use('/api/notices',       require('./routes/notices.routes'));
app.use('/api/notifications', require('./routes/notifications.routes'));
app.use('/api/reports',       require('./routes/reports.routes'));
app.use('/api/student-portal',require('./routes/student-portal.routes'));
app.use('/api/audit',         require('./routes/audit.routes'));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Error Handler ─────────────────────────────────────────────────────────────
app.use(require('./middleware/errorHandler'));

// ── Serve React Frontend in Production ────────────────────────────────────────
// NOTE: This MUST come after error handler so API errors are still caught
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '..', 'frontend', 'dist');
  app.use(express.static(frontendPath));

  // Catch-all: serve index.html for React Router (SPA)
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🏨  Hostel Management API running on port ${PORT}`);
  console.log(`📦  Environment: ${process.env.NODE_ENV || 'development'}`);
  if (process.env.NODE_ENV === 'production') {
    console.log(`🌐  Serving frontend from ../frontend/dist`);
  } else {
    console.log(`📊  Frontend dev server: http://localhost:5173`);
  }
  console.log(`🔑  Default Admin: admin / Admin@123\n`);
});
