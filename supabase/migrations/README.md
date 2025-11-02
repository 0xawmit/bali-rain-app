# Database Migrations

This directory contains SQL migration files to set up the complete Bali Rain database schema.

## Migration Files

1. **001_profiles.sql** - User profiles table with auto-creation trigger
2. **002_point_system.sql** - Point wallets & ledger with auto-update triggers
3. **003_qr_system.sql** - QR codes & scan events tables
4. **004_social_submissions.sql** - Social submissions with auto-credit trigger
5. **005_leaderboard.sql** - 7-day leaderboard materialized view

## How to Apply Migrations

### Option 1: Via Supabase Dashboard (Recommended for v1)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste each migration file content in order (001 → 002 → 003 → 004 → 005)
4. Run each migration by clicking "Run"
5. Verify tables and policies in **Database** → **Tables**

### Option 2: Via Supabase CLI (For local development)

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Initialize Supabase (if not already done)
supabase init

# Link to your project
supabase link --project-ref your-project-ref

# Apply all migrations
supabase db push

# Or apply migrations individually
psql -h your-db-host -U postgres -d postgres -f 001_profiles.sql
# ... repeat for each migration
```

### Option 3: Using psql directly

```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres" \
  -f 001_profiles.sql \
  -f 002_point_system.sql \
  -f 003_qr_system.sql \
  -f 004_social_submissions.sql \
  -f 005_leaderboard.sql
```

## Database Schema Overview

### Tables Created

- **profiles** - User profile data (display_name, avatar, country, timezone)
- **point_wallets** - Cached point balance per user
- **point_ledger** - Append-only transaction log (all point movements)
- **qr_codes** - QR code definitions (code, points_value, is_unique, time windows)
- **scan_events** - History of all QR code scan attempts
- **social_submissions** - Social media post submissions for manual approval
- **leaderboard_7d** - Materialized view of top users (last 7 days)

### Key Features

- **Row Level Security (RLS)** - All tables protected, users only see their own data
- **Append-Only Ledger** - point_ledger cannot be updated/deleted (audit trail)
- **Auto-Profile Creation** - Profile created automatically when user signs up
- **Auto-Wallet Updates** - Wallet balance updated automatically when ledger entry added
- **Auto-Credit Trigger** - Points credited automatically when social submission approved
- **Materialized View** - Fast leaderboard queries with manual refresh function

### Functions Created

- `handle_new_user()` - Auto-create profile on signup
- `update_wallet_balance()` - Auto-update wallet when points earned
- `auto_credit_social_submission()` - Auto-credit points when admin approves
- `prevent_ledger_modification()` - Enforce append-only on ledger
- `refresh_leaderboard_7d()` - Manually refresh leaderboard view

## Verification

After applying migrations, verify with:

```sql
-- Check all tables exist
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;

-- Test profile creation (will happen automatically on first user signup)
-- Test wallet balance update (insert a ledger entry manually)
INSERT INTO point_ledger (user_id, source, delta, reason)
VALUES (auth.uid(), 'admin', 100, 'Test credit');

-- Check wallet was updated
SELECT * FROM point_wallets WHERE user_id = auth.uid();
```

## Troubleshooting

**Issue:** "permission denied for table"
- **Solution:** Ensure you're running as postgres user or service role

**Issue:** "relation already exists"
- **Solution:** Safe to ignore, or drop tables and re-run migrations

**Issue:** Triggers not firing
- **Solution:** Check function exists: `\df public.*` in psql
- **Solution:** Verify trigger: `\dy public.*` in psql

**Issue:** RLS blocking all queries
- **Solution:** Ensure you're authenticated: Check `auth.uid()` returns your user ID
- **Solution:** Review policies: Query `pg_policies` table

