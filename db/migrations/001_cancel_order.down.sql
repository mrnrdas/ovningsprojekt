-- Rollback för Migration 001: Ta bort cancelled_at från orders
ALTER TABLE orders DROP COLUMN IF EXISTS cancelled_at;
