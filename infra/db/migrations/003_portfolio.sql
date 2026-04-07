-- ============================================================
-- Migration: Portfolio Tables
-- ============================================================

-- Portfolios table (each user can have multiple portfolios)
CREATE TABLE IF NOT EXISTS portfolios (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Individual holdings within a portfolio
CREATE TABLE IF NOT EXISTS portfolio_holdings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id  UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  symbol        TEXT NOT NULL,
  market        TEXT NOT NULL, -- 'stock', 'crypto', 'indian-stock', 'forex'
  quantity      NUMERIC(24, 8) NOT NULL DEFAULT 0,
  avg_buy_price NUMERIC(24, 8) NOT NULL DEFAULT 0,
  added_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_p_user_id ON portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_ph_portfolio_id ON portfolio_holdings(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_ph_symbol ON portfolio_holdings(symbol);
