-- ============================================
-- ADD CREDIT SCORE AND LEVEL FIELDS
-- ============================================
-- Run this in Supabase SQL Editor to add credit_score and level fields
-- to the users table for admin-controlled user progression

-- Add credit_score column (default: 1, range: 1-100)
ALTER TABLE users ADD COLUMN IF NOT EXISTS credit_score INTEGER DEFAULT 1 CHECK (credit_score >= 1 AND credit_score <= 100);

-- Add level column (default: 1, range: 1-10)
ALTER TABLE users ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1 CHECK (level >= 1 AND level <= 10);

-- Update existing users to have default values
UPDATE users SET credit_score = 1 WHERE credit_score IS NULL;
UPDATE users SET level = 1 WHERE level IS NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_credit_score ON users(credit_score);
CREATE INDEX IF NOT EXISTS idx_users_level ON users(level);

-- Verify the changes
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' 
AND column_name IN ('credit_score', 'level')
ORDER BY column_name;

-- ============================================
-- VERIFICATION QUERY
-- ============================================
-- Run this to see all users with their credit scores and levels
SELECT id, email, name, credit_score, level, account_balance, role
FROM users
ORDER BY created_at DESC
LIMIT 10;
