-- Create admin table
CREATE TABLE IF NOT EXISTS admin (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone_number VARCHAR(30) NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin',
  is_first_login BOOLEAN DEFAULT FALSE,
  created_by INT NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  enrollment_number VARCHAR(100) UNIQUE NOT NULL,
  status ENUM('active', 'inactive', 'graduated') DEFAULT 'active',
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  is_first_login BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create certificates table
CREATE TABLE IF NOT EXISTS certificates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT,
  enrollment_number VARCHAR(100),
  student_name VARCHAR(255),
  start_date DATE,
  finished_date DATE,
  date_issued DATE,
  status VARCHAR(50) DEFAULT 'issued',
  blockchain_status VARCHAR(50) DEFAULT 'pending',
  exam_type VARCHAR(100),
  position_held VARCHAR(255),
  conduct VARCHAR(50),
  issuer_wallet VARCHAR(255),
  verification_code VARCHAR(255) UNIQUE,
  pdf_hash VARCHAR(255),
  blockchain_tx_hash VARCHAR(255),
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL,
  INDEX idx_enrollment (enrollment_number),
  INDEX idx_verification_code (verification_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create contact_messages table
CREATE TABLE IF NOT EXISTS contact_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'unread',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create student_log table
CREATE TABLE IF NOT EXISTS student_log (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  login DATETIME NULL,
  logout DATETIME NULL,
  INDEX idx_student_log_email (email),
  INDEX idx_student_log_login (login),
  INDEX idx_student_log_logout (logout)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create admin_log table
CREATE TABLE IF NOT EXISTS admin_log (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  login DATETIME NULL,
  logout DATETIME NULL,
  INDEX idx_admin_log_email (email),
  INDEX idx_admin_log_login (login),
  INDEX idx_admin_log_logout (logout)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create certificate_log table
CREATE TABLE IF NOT EXISTS certificate_log (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  userid INT NULL,
  userrole VARCHAR(50) NULL,
  email VARCHAR(255) NULL,
  action VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'success',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_certificate_log_user (userid, userrole),
  INDEX idx_certificate_log_email (email),
  INDEX idx_certificate_log_action (action),
  INDEX idx_certificate_log_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_email ON admin(email);
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_enrollment ON students(enrollment_number);
