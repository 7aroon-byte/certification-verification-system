-- Migration: Add is_first_login flag to students table
-- This field tracks whether a student has changed their temporary password on first login

ALTER TABLE students ADD COLUMN is_first_login BOOLEAN DEFAULT true;

-- This ensures all existing students won't be forced to change password
-- Comment out the line below if you want existing students to be forced to change password
-- UPDATE students SET is_first_login = false WHERE id > 0;
