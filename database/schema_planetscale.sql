-- =========================================================
-- Hostel Hub - PlanetScale Compatible Schema
-- Version 2.0 | Express.js + React + MySQL (Vitess)
-- NOTE: Foreign key constraints removed for PlanetScale
--       (Vitess engine does not enforce FKs)
-- =========================================================

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS notices;
DROP TABLE IF EXISTS leave_requests;
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS visitors;
DROP TABLE IF EXISTS complaints;
DROP TABLE IF EXISTS fees;
DROP TABLE IF EXISTS user_otps;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS rooms;
DROP TABLE IF EXISTS users;

-- =========================================================
-- USERS (authentication)
-- =========================================================
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'warden', 'student') NOT NULL DEFAULT 'student',
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(15),
    student_id INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    password_changed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL
);

-- =========================================================
-- USER OTPs
-- =========================================================
CREATE TABLE user_otps (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    otp VARCHAR(10) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    attempts INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- ROOMS
-- =========================================================
CREATE TABLE rooms (
    id INT PRIMARY KEY AUTO_INCREMENT,
    room_number VARCHAR(20) NOT NULL,
    block VARCHAR(20) NOT NULL DEFAULT 'A',
    floor INT NOT NULL DEFAULT 0,
    capacity INT NOT NULL DEFAULT 2,
    current_occupancy INT NOT NULL DEFAULT 0,
    room_type ENUM('Single', 'Double', 'Triple', 'Dormitory') DEFAULT 'Double',
    is_ac BOOLEAN DEFAULT FALSE,
    gender ENUM('Male', 'Female', 'Any') DEFAULT 'Any',
    monthly_rent DECIMAL(10,2) DEFAULT 5000.00,
    maintenance_status ENUM('Good', 'Needs Maintenance', 'Under Maintenance') DEFAULT 'Good',
    amenities TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY (block, room_number)
);

-- =========================================================
-- STUDENTS
-- =========================================================
CREATE TABLE students (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    age INT,
    gender ENUM('Male', 'Female', 'Other'),
    date_of_birth DATE,
    blood_group VARCHAR(5),
    aadhaar_number VARCHAR(12),
    phone VARCHAR(15),
    email VARCHAR(100) UNIQUE NOT NULL,
    address TEXT,
    course VARCHAR(100),
    department VARCHAR(100),
    year INT,
    room_id INT NULL,
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(15),
    parent_name VARCHAR(100),
    parent_phone VARCHAR(15),
    photo_path VARCHAR(255),
    admission_date DATE,
    status ENUM('Active', 'Inactive', 'Left') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =========================================================
-- FEES
-- =========================================================
CREATE TABLE fees (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    due_date DATE,
    paid_date DATE,
    fine_amount DECIMAL(10,2) DEFAULT 0.00,
    payment_mode ENUM('Cash', 'Online', 'Cheque', 'DD') DEFAULT 'Cash',
    transaction_id VARCHAR(100),
    status ENUM('Pending', 'Paid', 'Overdue', 'Partial') DEFAULT 'Pending',
    fee_type ENUM('Hostel Fee', 'Mess Fee', 'Electricity', 'Maintenance', 'Other') DEFAULT 'Hostel Fee',
    month_year VARCHAR(10),
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =========================================================
-- COMPLAINTS
-- =========================================================
CREATE TABLE complaints (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    category ENUM('Electricity', 'Plumbing', 'WiFi', 'Cleaning', 'Furniture', 'Security', 'Other') DEFAULT 'Other',
    description TEXT NOT NULL,
    priority ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
    status ENUM('Pending', 'In Progress', 'Resolved', 'Closed') DEFAULT 'Pending',
    assigned_to VARCHAR(100),
    resolution_notes TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =========================================================
-- VISITORS
-- =========================================================
CREATE TABLE visitors (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    visitor_name VARCHAR(100) NOT NULL,
    relation VARCHAR(50),
    phone VARCHAR(15),
    id_proof_type VARCHAR(50),
    id_proof_number VARCHAR(50),
    purpose TEXT,
    check_in TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    check_out TIMESTAMP NULL,
    approved_by VARCHAR(100),
    remarks TEXT
);

-- =========================================================
-- ATTENDANCE
-- =========================================================
CREATE TABLE attendance (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    date DATE NOT NULL,
    check_in_time TIME,
    check_out_time TIME,
    status ENUM('Present', 'Absent', 'On Leave', 'Night Out') DEFAULT 'Present',
    marked_by VARCHAR(100),
    remarks VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_attendance (student_id, date)
);

-- =========================================================
-- LEAVE REQUESTS
-- =========================================================
CREATE TABLE leave_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    reason TEXT NOT NULL,
    leave_type ENUM('Home Visit', 'Medical', 'Personal', 'Other') DEFAULT 'Personal',
    status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    reviewed_by VARCHAR(100),
    review_remarks TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =========================================================
-- NOTICES
-- =========================================================
CREATE TABLE notices (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    category ENUM('General', 'Fee', 'Maintenance', 'Rules', 'Event', 'Emergency') DEFAULT 'General',
    target_audience ENUM('All', 'Students', 'Wardens') DEFAULT 'All',
    posted_by VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    expires_at DATE NULL
);

-- =========================================================
-- NOTIFICATIONS
-- =========================================================
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT,
    type ENUM('Complaint', 'Fee', 'Leave', 'Student', 'Visitor', 'System', 'General', 'Notice', 'Room') DEFAULT 'General',
    is_read BOOLEAN DEFAULT FALSE,
    reference_url VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- AUDIT LOGS
-- =========================================================
CREATE TABLE audit_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    user_name VARCHAR(100),
    role VARCHAR(20),
    action VARCHAR(50) NOT NULL,
    module VARCHAR(50) NOT NULL,
    record_id VARCHAR(50),
    description TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- INDEXES for performance
-- =========================================================
CREATE INDEX idx_students_room ON students(room_id);
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_students_name ON students(name);
CREATE INDEX idx_students_student_id ON students(student_id);
CREATE INDEX idx_fees_student ON fees(student_id);
CREATE INDEX idx_fees_status ON fees(status);
CREATE INDEX idx_fees_due_date ON fees(due_date);
CREATE INDEX idx_complaints_student ON complaints(student_id);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_leave_student ON leave_requests(student_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_user_otps_user ON user_otps(user_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_timestamp ON audit_logs(created_at);
