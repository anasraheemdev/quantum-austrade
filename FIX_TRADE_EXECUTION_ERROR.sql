-- ============================================
-- COMPREHENSIVE FIX FOR TRADE SESSIONS
-- ============================================
-- Run this in your Supabase SQL Editor to fix the trade execution error

-- Step 1: Drop and recreate the trade_sessions table with correct schema
DROP TABLE IF EXISTS trade_sessions CASCADE;

-- Step 2: Create the correct trade_sessions table
CREATE TABLE trade_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  duration INTEGER NOT NULL CHECK (duration >= 60),
  start_time TIMESTAMP DEFAULT NOW(),
  end_time TIMESTAMP, -- Regular column, not GENERATED
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'WON', 'LOST')),
  outcome_override TEXT CHECK (outcome_override IN ('WIN', 'LOSS', NULL)),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Step 3: Create index for better performance
CREATE INDEX idx_trade_sessions_user_id ON trade_sessions(user_id);
CREATE INDEX idx_trade_sessions_status ON trade_sessions(status);

-- Step 4: Enable Row Level Security
ALTER TABLE trade_sessions ENABLE ROW LEVEL SECURITY;

-- Step 5: Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own trade sessions" ON trade_sessions;
DROP POLICY IF EXISTS "Users can create own trade sessions" ON trade_sessions;
DROP POLICY IF EXISTS "Admins can view all trade sessions" ON trade_sessions;
DROP POLICY IF EXISTS "Admins can update all trade sessions" ON trade_sessions;

-- Step 6: Create RLS Policies

-- Users can view their own sessions
CREATE POLICY "Users can view own trade sessions"
  ON trade_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own sessions
CREATE POLICY "Users can create own trade sessions"
  ON trade_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all sessions
CREATE POLICY "Admins can view all trade sessions"
  ON trade_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update all sessions (for setting outcome)
CREATE POLICY "Admins can update all trade sessions"
  ON trade_sessions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Step 7: Verify the table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default,
  is_generated
FROM information_schema.columns
WHERE table_name = 'trade_sessions'
ORDER BY ordinal_position;

-- Step 8: Verify RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'trade_sessions';

-- Success message
SELECT 
  'Trade sessions table fixed successfully!' as message,
  COUNT(*) as existing_sessions
FROM trade_sessions;