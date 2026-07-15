CREATE TABLE IF NOT EXISTS audit_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    user_name VARCHAR(100),
    role VARCHAR(20),
    action VARCHAR(50) NOT NULL,
    module VARCHAR(50) NOT NULL,
    record_id VARCHAR(50),
    description TEXT,
    ip_address VARCHAR(45),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Update notifications enum to include System just in case
ALTER TABLE notifications MODIFY COLUMN type ENUM('Complaint', 'Fee', 'Leave', 'Student', 'Visitor', 'System', 'General', 'Notice', 'Room') DEFAULT 'General';
