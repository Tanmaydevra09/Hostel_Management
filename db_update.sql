ALTER TABLE notifications
MODIFY COLUMN type ENUM('Complaint', 'Fee', 'Leave', 'Student', 'Visitor', 'System') DEFAULT 'System';

ALTER TABLE notifications
ADD COLUMN reference_url VARCHAR(255) DEFAULT NULL;
