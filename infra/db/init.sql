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
  asset_symbol TEXT,
  market TEXT NOT NULL,
  timeframe TEXT,
  direction TEXT NOT NULL,
  entry_price NUMERIC(18,8) NOT NULL,
  stop_loss NUMERIC(18,8) NOT NULL,
  take_profit NUMERIC(18,8) NOT NULL,
  risk_reward NUMERIC(10,4) NOT NULL,
  confidence NUMERIC(5,2) NOT NULL,
  conviction_factors JSONB,
  summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trade_journal (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  asset_symbol TEXT NOT NULL,
  market TEXT NOT NULL,
  direction TEXT NOT NULL,
  pnl NUMERIC(18,8),
  outcome TEXT,
  notes TEXT,
  tags TEXT[],
  trade_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_journal_user ON trade_journal(user_id);
CREATE INDEX IF NOT EXISTS idx_signals_symbol ON signals(asset_symbol);

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

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount NUMERIC(18,2) NOT NULL,
  category TEXT,
  date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_user ON expenses(user_id);

CREATE TABLE IF NOT EXISTS ohlcv_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  symbol TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  open NUMERIC(18,8) NOT NULL,
  high NUMERIC(18,8) NOT NULL,
  low NUMERIC(18,8) NOT NULL,
  close NUMERIC(18,8) NOT NULL,
  volume NUMERIC(18,8),
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(symbol, timeframe, timestamp)
);

CREATE TABLE IF NOT EXISTS ml_models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,Version TEXT NOT NULL,
  type TEXT NOT NULL, -- 'xgboost', 'random_forest', 'lstm'
  metrics JSONB, -- accuracy, precision, recall, sharpe
  parameters JSONB,
  is_active BOOLEAN DEFAULT FALSE,
  file_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS backtest_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_id UUID REFERENCES ml_models(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  total_trades INTEGER,
  win_rate NUMERIC(5,2),
  pnl NUMERIC(18,8),
  max_drawdown NUMERIC(5,2),
  sharpe_ratio NUMERIC(5,2),
  trade_log JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ohlcv_symbol_time ON ohlcv_data(symbol, timeframe, timestamp);
