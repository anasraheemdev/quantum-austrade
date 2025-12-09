-- ============================================
-- BANKING & GAMIFICATION SETUP
-- ============================================

-- 1. Add Columns to Users Table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS credit_score INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;

-- 2. Add Constraints (Optional but good practice)
ALTER TABLE users 
ADD CONSTRAINT check_credit_score_range CHECK (credit_score >= 0 AND credit_score <= 100);

ALTER TABLE users 
ADD CONSTRAINT check_level_range CHECK (level >= 1 AND level <= 10);

-- 3. Verify
SELECT id, email, credit_score, level FROM users LIMIT 5;
