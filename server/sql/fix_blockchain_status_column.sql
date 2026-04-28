-- Fix blockchain_status to support values like: pending, onchain, failed, revoked
-- Run this once in the target DB (e.g., certificatesystem)

ALTER TABLE certificates
  MODIFY COLUMN blockchain_status VARCHAR(50) NULL DEFAULT 'pending';

-- Backfill records that already have a transaction hash but still show issued/empty blockchain status
UPDATE certificates
SET blockchain_status = 'onchain'
WHERE blockchain_tx_hash IS NOT NULL
  AND blockchain_tx_hash <> ''
  AND (blockchain_status IS NULL OR blockchain_status = '' OR blockchain_status = 'issued');
