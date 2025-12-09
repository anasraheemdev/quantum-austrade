-- 1. Create market_state table
CREATE TABLE IF NOT EXISTS market_state (
    symbol TEXT PRIMARY KEY,
    price NUMERIC NOT NULL,
    trend TEXT DEFAULT 'RANDOM', -- 'UP', 'DOWN', 'RANDOM', 'STABLE'
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Insert initial data for common assets
INSERT INTO market_state (symbol, price) VALUES
('BTC', 64250.00),
('ETH', 3450.00),
('SOL', 145.00),
('XRP', 0.62),
('ADA', 0.45)
ON CONFLICT (symbol) DO NOTHING;

-- 3. Enable Realtime (This usually requires publication setup in Supabase Dashboard, but we can try via SQL)
-- Note: 'supabase_realtime' publication usually exists by default on newer projects.
-- We add the table to the publication.
alter publication supabase_realtime add table market_state;

-- 4. Enable RLS (Public Read, Admin Write)
ALTER TABLE market_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view market state"
ON market_state FOR SELECT
USING (true);

CREATE POLICY "Admins can update market state"
ON market_state FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can insert market state"
ON market_state FOR INSERT
with check (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);
