-- Archived certificates table schema
-- Stores moved certificates older than the retention period
CREATE TABLE IF NOT EXISTS archived_certificates (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  original_certificate_id INT NULL,
  student_id INT NULL,
  enrollment_number VARCHAR(100) NULL,
  student_name VARCHAR(255) NULL,
  start_date DATE NULL,
  finished_date DATE NULL,
  date_issued DATE NULL,
  status VARCHAR(50) DEFAULT 'archived',
  blockchain_status VARCHAR(50) DEFAULT 'archived',
  exam_type VARCHAR(100) NULL,
  position_held VARCHAR(255) NULL,
  conduct VARCHAR(50) NULL,
  issuer_wallet VARCHAR(255) NULL,
  verification_code VARCHAR(255) NULL,
  pdf_hash VARCHAR(255) NULL,
  blockchain_tx_hash VARCHAR(255) NULL,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  archived_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_archived_verification_code (verification_code),
  INDEX idx_archived_pdf_hash (pdf_hash),
  INDEX idx_archived_tx_hash (blockchain_tx_hash),
  INDEX idx_archived_enrollment (enrollment_number),
  INDEX idx_archived_student (student_id),
  INDEX idx_archived_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Helpful note: run this file once during migration/setup:
-- mysql -u $DB_USER -p $DB_NAME < server/sql/create_archived_certificates.sql
