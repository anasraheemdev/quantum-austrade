-- ============================================
-- TRADING FEATURES SETUP
-- ============================================

-- 1. Create Trade Sessions Table
CREATE TABLE IF NOT EXISTS trade_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  duration INTEGER NOT NULL CHECK (duration >= 60), -- Duration in seconds
  start_time TIMESTAMP DEFAULT NOW(),
  end_time TIMESTAMP GENERATED ALWAYS AS (start_time + (duration * interval '1 second')) STORED,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'WON', 'LOST')),
  outcome_override TEXT CHECK (outcome_override IN ('WIN', 'LOSS', NULL)),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE trade_sessions ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies

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

-- 4. Verify Creation
SELECT * FROM trade_sessions LIMIT 1;
