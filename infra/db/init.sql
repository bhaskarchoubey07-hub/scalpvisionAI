CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  provider TEXT DEFAULT 'email',
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS uploaded_charts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  market TEXT NOT NULL,
  asset_symbol TEXT,
  timeframe TEXT,
  image_url TEXT NOT NULL,
  chart_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS signals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chart_id UUID REFERENCES uploaded_charts(id) ON DELETE CASCADE,
  market TEXT NOT NULL,
  direction TEXT NOT NULL,
  entry_price NUMERIC(18,8) NOT NULL,
  stop_loss NUMERIC(18,8) NOT NULL,
  take_profit NUMERIC(18,8) NOT NULL,
  risk_reward NUMERIC(10,4) NOT NULL,
  confidence NUMERIC(5,2) NOT NULL,
  summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS watchlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  market TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  signal_id UUID REFERENCES signals(id) ON DELETE CASCADE,
  outcome TEXT,
  pnl NUMERIC(18,8),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  score NUMERIC(12,2) DEFAULT 0,
  win_rate NUMERIC(5,2) DEFAULT 0,
  total_trades INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
