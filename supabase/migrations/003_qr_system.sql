-- Migration 003: Create QR code system
-- This includes qr_codes (code definitions) and scan_events (scan history)

-- Create qr_codes table
CREATE TABLE IF NOT EXISTS public.qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  label TEXT,
  points_value INTEGER NOT NULL DEFAULT 25,
  is_unique BOOLEAN NOT NULL DEFAULT false,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for efficient queries
CREATE INDEX idx_qr_codes_code ON public.qr_codes(code);
CREATE INDEX idx_qr_codes_active_window ON public.qr_codes(starts_at, ends_at);
CREATE INDEX idx_qr_codes_is_unique ON public.qr_codes(is_unique);

-- Create scan_events table (history of all scan attempts)
CREATE TABLE IF NOT EXISTS public.scan_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  qr_code_id UUID NOT NULL REFERENCES public.qr_codes(id) ON DELETE CASCADE,
  scanned_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  client_nonce TEXT,
  server_nonce TEXT,
  result TEXT NOT NULL CHECK (result IN ('accepted', 'rejected')),
  reject_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for efficient queries
CREATE INDEX idx_scan_events_user_qr ON public.scan_events(user_id, qr_code_id, scanned_at DESC);
CREATE INDEX idx_scan_events_qr_result ON public.scan_events(qr_code_id, result);
CREATE INDEX idx_scan_events_user_created ON public.scan_events(user_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for qr_codes
-- Everyone can view QR codes (needed to validate codes client-side if desired)
CREATE POLICY "QR codes are viewable by everyone"
  ON public.qr_codes
  FOR SELECT
  USING (true);

-- RLS Policies for scan_events
-- Users can only view their own scan events
CREATE POLICY "Users can view their own scan events"
  ON public.scan_events
  FOR SELECT
  USING (auth.uid() = user_id);

-- No INSERT policy - only Edge Function with service role can insert
-- This ensures scan validation happens server-side only

-- Grant permissions
GRANT SELECT ON public.qr_codes TO anon, authenticated;
GRANT SELECT ON public.scan_events TO authenticated;

-- Note: INSERT permissions for scan_events are handled by service role only
-- via the Edge Function to ensure proper validation and cooldown checks

