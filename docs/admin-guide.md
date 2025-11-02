# Bali Rain Admin Guide

This guide explains how to manage the Bali Rain rewards platform using Supabase Studio.

## 📋 Table of Contents

1. [Approving Social Submissions](#approving-social-submissions)
2. [Generating QR Codes](#generating-qr-codes)
3. [Refreshing Leaderboard](#refreshing-leaderboard)
4. [Monitoring Users](#monitoring-users)
5. [Troubleshooting](#troubleshooting)

---

## 🎯 Approving Social Submissions

### Step-by-Step Process

1. **Navigate to Supabase Studio**
   - Go to your Supabase project dashboard
   - Click **🗄️ Database** → **Tables**
   - Find and click on **`social_submissions`**

2. **Find Pending Submissions**
   - Click the **Filter** button (funnel icon)
   - Add filter: `status` equals `pending`
   - Click **Apply Filter**
   - You'll see all submissions waiting for review

3. **Review a Submission**
   - Click on any row to open the details
   - Check the **`post_url`** - click to verify it's a legitimate post
   - Look at **`screenshot_url`** if provided (click to view image)
   - Note the **`platform`** (X or Instagram)

4. **Approve or Reject**
   - **To Approve:**
     - Change `status` from `pending` to `credited`
     - Set `awarded_points` to `20` (or desired amount)
     - Set `reviewed_at` to current timestamp
     - Set `reviewer_user_id` to your user ID (optional)
     - Click **Save**
     - ✅ **Points will be automatically credited to the user!**

   - **To Reject:**
     - Change `status` from `pending` to `rejected`
     - Add a `reason` explaining why (e.g., "Post doesn't mention Bali Rain")
     - Set `reviewed_at` to current timestamp
     - Click **Save**

### ⚠️ Important Notes

- **Auto-Credit**: When you set status to `credited`, the database trigger automatically:
  - Creates a `point_ledger` entry with +20 points
  - Updates the user's `point_wallets.balance_cached`
  - Links the ledger entry to the submission via `ref_id`

- **Duplicate Prevention**: Users cannot submit the same URL twice (unique constraint)

- **Default Points**: If you don't set `awarded_points`, it defaults to 20

---

## 🔢 Generating QR Codes

### Using the Generation Script

1. **Run the Script**
   ```bash
   cd /path/to/bali-rain-app
   npm run generate-qr-codes
   ```

2. **What It Creates**
   - **100 generic codes** (format: `BOTTLE-XXXXXX`)
     - 25 points each
     - Reusable with 24h cooldown per user
   - **10 unique codes** (format: `SPECIAL-XXXXXXXX`)
     - 50 points each
     - Single-use only

3. **Export Files**
   - `qr-codes-export.csv` - For printing vendor
   - Codes are automatically inserted into `qr_codes` table

### Manual QR Code Creation

If you need to create individual codes:

1. Go to **🗄️ Database** → **Tables** → **`qr_codes`**
2. Click **Insert** → **Insert row**
3. Fill in:
   - `code`: Unique identifier (e.g., `BOTTLE-ABC123`)
   - `label`: Human-readable name (e.g., `Bottle Code ABC123`)
   - `points_value`: Points to award (e.g., `25`)
   - `is_unique`: `false` for reusable, `true` for single-use
   - `starts_at`: When code becomes active (optional)
   - `ends_at`: When code expires (optional)
   - `metadata`: JSON with additional info (optional)

---

## 🏆 Refreshing Leaderboard

### Manual Refresh

1. Go to **🗄️ Database** → **SQL Editor**
2. Run this query:
   ```sql
   SELECT refresh_leaderboard_7d();
   ```
3. Click **Run**

### What It Does

- Recalculates 7-day point totals for all users
- Updates the `leaderboard_7d` materialized view
- Shows top users by points earned in last 7 days

### When to Refresh

- After approving social submissions
- Daily (recommended)
- Before important events or announcements

---

## 👥 Monitoring Users

### View User Activity

1. **User Profiles**
   - Go to **🗄️ Database** → **Tables** → **`profiles`**
   - See display names, countries, join dates

2. **Point Balances**
   - Go to **🗄️ Database** → **Tables** → **`point_wallets`**
   - See current cached balances for all users

3. **Transaction History**
   - Go to **🗄️ Database** → **Tables** → **`point_ledger`**
   - See all point-earning activities
   - Filter by user, source, date range

4. **QR Scan History**
   - Go to **🗄️ Database** → **Tables** → **`scan_events`**
   - See all QR code scan attempts
   - Filter by user, result (accepted/rejected)

### Useful Queries

**Top Users (All Time):**
```sql
SELECT 
  p.display_name,
  pw.balance_cached as total_points
FROM point_wallets pw
JOIN profiles p ON pw.user_id = p.user_id
ORDER BY pw.balance_cached DESC
LIMIT 10;
```

**Recent Activity:**
```sql
SELECT 
  p.display_name,
  pl.source,
  pl.delta,
  pl.reason,
  pl.created_at
FROM point_ledger pl
JOIN profiles p ON pl.user_id = p.user_id
ORDER BY pl.created_at DESC
LIMIT 20;
```

---

## 🔧 Troubleshooting

### Common Issues

**Issue: User says they didn't receive points**
- Check `point_ledger` for their user_id
- Verify the transaction was created
- Check `point_wallets` for updated balance

**Issue: QR code not working**
- Check `qr_codes` table - does the code exist?
- Check `scan_events` - was it rejected? Why?
- Verify time windows (starts_at/ends_at)
- Check cooldown (24h for generic codes)

**Issue: Social submission not approved**
- Check `social_submissions` table
- Verify status is `credited` not `pending`
- Check if `awarded_points` is set
- Verify trigger created `point_ledger` entry

**Issue: Leaderboard not updating**
- Run `refresh_leaderboard_7d()` function
- Check if users have points in last 7 days
- Verify `point_ledger` entries have positive deltas

### Database Triggers

The system uses several triggers that work automatically:

1. **Profile Creation**: Auto-creates profile when user signs up
2. **Wallet Updates**: Auto-updates balance when ledger entry added
3. **Social Auto-Credit**: Auto-credits points when submission approved
4. **Append-Only Ledger**: Prevents modification of transaction history

### Emergency Procedures

**Reset User Points:**
```sql
-- Insert negative ledger entry
INSERT INTO point_ledger (user_id, source, delta, reason)
VALUES ('user-uuid', 'admin', -100, 'Manual adjustment');
```

**Disable QR Code:**
```sql
-- Set expiration date to past
UPDATE qr_codes 
SET ends_at = NOW() - INTERVAL '1 day'
WHERE code = 'BOTTLE-ABC123';
```

---

## 📞 Support

For technical issues or questions:
- Check the database logs in Supabase Dashboard
- Review the migration files in `supabase/migrations/`
- Contact the development team

---

**Last Updated:** October 7, 2025
**Version:** 1.0




