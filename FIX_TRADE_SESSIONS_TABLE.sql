-- ============================================
-- FIX TRADE SESSIONS TABLE
-- ============================================
-- The end_time column is causing issues because it's a GENERATED column
-- We need to make it nullable and remove the GENERATED constraint

-- Drop the existing end_time column
ALTER TABLE trade_sessions DROP COLUMN IF EXISTS end_time;

-- Add end_time as a regular nullable timestamp column
ALTER TABLE trade_sessions ADD COLUMN end_time TIMESTAMP;

-- Verify the fix
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'trade_sessions'
ORDER BY ordinal_position;
