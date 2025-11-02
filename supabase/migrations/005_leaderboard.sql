-- Migration 005: Create 7-day leaderboard materialized view
-- This aggregates points earned in the last 7 days for leaderboard display

-- Create materialized view for 7-day leaderboard
CREATE MATERIALIZED VIEW IF NOT EXISTS public.leaderboard_7d AS
SELECT 
  user_id,
  SUM(delta) AS points_7d
FROM public.point_ledger
WHERE 
  created_at >= NOW() - INTERVAL '7 days'
  AND delta > 0  -- Only count positive deltas (earned points, not spent)
GROUP BY user_id
HAVING SUM(delta) > 0
ORDER BY points_7d DESC;

-- Create index on the materialized view for fast lookups
CREATE INDEX idx_leaderboard_7d_user ON public.leaderboard_7d(user_id);
CREATE INDEX idx_leaderboard_7d_points ON public.leaderboard_7d(points_7d DESC);

-- Enable Row Level Security (allow public read access)
ALTER MATERIALIZED VIEW public.leaderboard_7d OWNER TO postgres;

-- Create function to refresh the leaderboard
CREATE OR REPLACE FUNCTION public.refresh_leaderboard_7d()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.leaderboard_7d;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
-- Note: Materialized views require GRANT on the underlying table owner
GRANT SELECT ON public.leaderboard_7d TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_leaderboard_7d() TO authenticated;

-- Optional: Create a scheduled job to refresh the leaderboard periodically
-- This requires pg_cron extension (optional, can be done via Supabase dashboard)
-- 
-- Example (uncomment if you have pg_cron enabled):
-- SELECT cron.schedule(
--   'refresh-leaderboard-7d',
--   '*/15 * * * *',  -- Every 15 minutes
--   $$SELECT public.refresh_leaderboard_7d()$$
-- );

-- For v1, manual refresh is acceptable via the UI or periodic cron job

