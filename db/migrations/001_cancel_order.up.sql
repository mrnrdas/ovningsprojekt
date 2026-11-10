-- Migration 001: Lägg till cancelled_at på orders för spårbarhet vid avbrytning
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
