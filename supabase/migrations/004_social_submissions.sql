-- Migration 004: Create social submissions system
-- This includes social_submissions table with auto-credit trigger

-- Create social_submissions table
CREATE TABLE IF NOT EXISTS public.social_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('x', 'instagram')),
  post_url TEXT NOT NULL,
  screenshot_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'credited', 'rejected')),
  awarded_points INTEGER,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  reviewed_at TIMESTAMPTZ,
  reviewer_user_id UUID REFERENCES auth.users(id)
);

-- Create unique constraint to prevent duplicate submissions of same post
CREATE UNIQUE INDEX idx_social_submissions_user_post ON public.social_submissions(user_id, post_url);

-- Create indexes for efficient queries
CREATE INDEX idx_social_submissions_user_created ON public.social_submissions(user_id, created_at DESC);
CREATE INDEX idx_social_submissions_status ON public.social_submissions(status);
CREATE INDEX idx_social_submissions_reviewed ON public.social_submissions(reviewed_at DESC) WHERE reviewed_at IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE public.social_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for social_submissions
-- Users can view their own submissions
CREATE POLICY "Users can view their own submissions"
  ON public.social_submissions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own submissions (status must be 'pending')
CREATE POLICY "Users can insert their own submissions"
  ON public.social_submissions
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    AND status = 'pending'
  );

-- No UPDATE policy for regular users - admins update via Supabase Studio with elevated privileges
-- No DELETE policy - submissions should remain for audit trail

-- Trigger: Auto-credit points when status changes to 'credited'
CREATE OR REPLACE FUNCTION public.auto_credit_social_submission()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if status changed from something else to 'credited'
  IF NEW.status = 'credited' AND (OLD.status IS NULL OR OLD.status != 'credited') THEN
    
    -- Set default awarded_points if not provided (default to 20)
    IF NEW.awarded_points IS NULL THEN
      NEW.awarded_points := 20;
    END IF;
    
    -- Set reviewed_at timestamp
    NEW.reviewed_at := NOW();
    
    -- Insert into point_ledger
    INSERT INTO public.point_ledger (user_id, source, ref_id, delta, reason)
    VALUES (
      NEW.user_id,
      'social',
      NEW.id,
      NEW.awarded_points,
      'Social media post approved: ' || NEW.platform
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_social_submission_credited
  BEFORE UPDATE ON public.social_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_credit_social_submission();

-- Grant permissions
GRANT SELECT, INSERT ON public.social_submissions TO authenticated;

-- Note: UPDATE permissions are restricted to service role (admins via Supabase Studio)
-- to ensure only authorized personnel can approve submissions

