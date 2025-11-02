-- Migration 002: Create point wallet and ledger system
-- This includes point_wallets (cached balance) and point_ledger (append-only transaction log)

-- Create point_wallets table (cached balance for quick queries)
CREATE TABLE IF NOT EXISTS public.point_wallets (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance_cached INTEGER DEFAULT 0 NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create point_ledger table (append-only transaction log)
CREATE TABLE IF NOT EXISTS public.point_ledger (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('scan', 'social', 'admin', 'refund', 'redeem')),
  ref_id UUID,
  delta INTEGER NOT NULL CHECK (delta <> 0),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for efficient queries
CREATE INDEX idx_point_ledger_user_created ON public.point_ledger(user_id, created_at DESC);
CREATE INDEX idx_point_ledger_created ON public.point_ledger(created_at DESC);
CREATE INDEX idx_point_ledger_source ON public.point_ledger(source);

-- Enable Row Level Security
ALTER TABLE public.point_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_ledger ENABLE ROW LEVEL SECURITY;

-- RLS Policies for point_wallets
-- Users can only view their own wallet
CREATE POLICY "Users can view their own wallet"
  ON public.point_wallets
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policies for point_ledger
-- Users can only view their own ledger entries
CREATE POLICY "Users can view their own ledger entries"
  ON public.point_ledger
  FOR SELECT
  USING (auth.uid() = user_id);

-- No INSERT policy - only triggers and service role can insert
-- No UPDATE/DELETE policy - ledger is append-only

-- Trigger 1: Prevent updates and deletes on point_ledger (append-only enforcement)
CREATE OR REPLACE FUNCTION public.prevent_ledger_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'point_ledger is append-only. Updates and deletes are not allowed.';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_point_ledger_update
  BEFORE UPDATE ON public.point_ledger
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_ledger_modification();

CREATE TRIGGER prevent_point_ledger_delete
  BEFORE DELETE ON public.point_ledger
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_ledger_modification();

-- Trigger 2: Auto-update point_wallets when a ledger entry is inserted
CREATE OR REPLACE FUNCTION public.update_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update the wallet balance
  INSERT INTO public.point_wallets (user_id, balance_cached, updated_at)
  VALUES (NEW.user_id, NEW.delta, NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET
    balance_cached = public.point_wallets.balance_cached + NEW.delta,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_ledger_insert_update_wallet
  AFTER INSERT ON public.point_ledger
  FOR EACH ROW
  EXECUTE FUNCTION public.update_wallet_balance();

-- Grant permissions
GRANT SELECT ON public.point_wallets TO authenticated;
GRANT SELECT ON public.point_ledger TO authenticated;

-- Note: INSERT permissions for point_ledger are handled by service role only
-- via Edge Functions and database triggers

