# Bali Rain App Architecture

## Overview

The Bali Rain Rewards App is a full-stack web application built on modern serverless architecture. Users earn points by scanning QR codes or submitting social media posts, and compete on a 7-day leaderboard.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Devices                             │
│              (Mobile & Desktop Browsers)                         │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       │ HTTPS
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Vercel (Frontend)                           │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Next.js 14 App                                           │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │  │
│  │  │  Pages      │  │ Components  │  │ Middleware  │      │  │
│  │  │             │  │             │  │             │      │  │
│  │  │ - /earn     │  │ - BottomNav │  │ Auth Check  │      │  │
│  │  │ - /wallet   │  │ - Toast     │  │ Redirect    │      │  │
│  │  │ - /profile  │  │ - Card      │  │             │      │  │
│  │  │ - /scan     │  │             │  │             │      │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘      │  │
│  │                                                           │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  API Layer (lib/)                                  │  │  │
│  │  │  - Supabase Client (Browser)                       │  │  │
│  │  │  - API Helpers (lib/api.ts)                        │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ HTTPS (REST API)
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase Platform                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Edge Functions (Deno Runtime)                            │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  qr-scan                                            │  │  │
│  │  │  - Validate JWT token                               │  │  │
│  │  │  - Check QR code existence                          │  │  │
│  │  │  - Verify cooldown/time windows                     │  │  │
│  │  │  - Award points via point_ledger                    │  │  │
│  │  │  - Return result                                    │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  PostgreSQL Database                                       │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  Core Tables                                        │  │  │
│  │  │  - profiles (user data)                             │  │  │
│  │  │  - point_wallets (cached balance)                   │  │  │
│  │  │  - point_ledger (transaction log)                   │  │  │
│  │  │  - qr_codes (code definitions)                      │  │  │
│  │  │  - scan_events (scan history)                       │  │  │
│  │  │  - social_submissions (post submissions)            │  │  │
│  │  │  - leaderboard_7d (materialized view)               │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │                                                           │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  Database Features                                  │  │  │
│  │  │  - Row-Level Security (RLS)                         │  │  │
│  │  │  - Triggers (auto-profile, auto-wallet)             │  │  │
│  │  │  - Functions (refresh_leaderboard_7d)               │  │  │
│  │  │  - Materialized Views                               │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Authentication                                           │  │
│  │  - Email magic link                                       │  │
│  │  - Google OAuth                                           │  │
│  │  - JWT tokens                                             │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Storage (Optional, for screenshot uploads)               │  │
│  │  - public/social-screenshots bucket                       │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### 1. QR Code Scanning Flow

```
User Enter QR Code
       │
       ▼
┌─────────────────────┐
│  Frontend (Scan)    │  Validate format
│  - Input validation │  ─────────────────────────► "Invalid format"
│  - Loading state    │
└──────────┬──────────┘
           │
           │ POST /functions/v1/qr-scan
           │ { code: "BOTTLE-123" }
           │ Authorization: Bearer <JWT>
           ▼
┌─────────────────────────────────────────┐
│  Edge Function: qr-scan                 │
│  ┌───────────────────────────────────┐ │
│  │  1. Verify JWT (auth.getUser)     │ │
│  │  2. Look up QR code in database   │ │
│  │  3. Check time windows             │ │
│  │  4. Check cooldown/single-use      │ │
│  │  5. Insert scan_event              │ │
│  │  6. Insert point_ledger entry      │ │
│  │  7. Trigger updates wallet         │ │
│  │  8. Return {result, points, bal}   │ │
│  └───────────────────────────────────┘ │
└──────────┬──────────────────────────────┘
           │
           │ { result: "accepted", points: 25, new_balance: 175 }
           ▼
┌─────────────────────┐
│  Frontend           │
│  - Show success     │
│  - Display points   │
│  - Update balance   │
└─────────────────────┘
```

### 2. Social Media Submission Flow

```
User Submit Post
       │
       ▼
┌─────────────────────┐
│  Frontend (Earn)    │
│  - Form validation  │
│  - Upload screenshot│
└──────────┬──────────┘
           │
           │ INSERT INTO social_submissions
           │ (via Supabase client)
           ▼
┌─────────────────────────────────────────┐
│  Database: social_submissions           │
│  - status: "pending"                    │
│  - post_url, platform, screenshot       │
│  - user_id, created_at                  │
└──────────┬──────────────────────────────┘
           │
           │ (Admin Review in Supabase Studio)
           ▼
┌─────────────────────────────────────────┐
│  Admin Action                           │
│  - Update status to "credited"          │
│  - Set awarded_points: 20               │
└──────────┬──────────────────────────────┘
           │
           │ (Database Trigger Fires)
           ▼
┌─────────────────────────────────────────┐
│  Trigger: auto_credit_social_submission │
│  - INSERT INTO point_ledger             │
│  - Trigger updates point_wallets        │
└──────────┬──────────────────────────────┘
           │
           │ (User checks wallet)
           ▼
┌─────────────────────┐
│  User Sees Points   │
└─────────────────────┘
```

### 3. Leaderboard Query Flow

```
User Visit Leaderboard
       │
       ▼
┌─────────────────────────────────────────┐
│  Frontend (/leaderboard)                │
│  - Loading state                        │
└──────────┬──────────────────────────────┘
           │
           │ SELECT * FROM leaderboard_7d
           │ ORDER BY points_7d DESC LIMIT 20
           ▼
┌─────────────────────────────────────────┐
│  Database: leaderboard_7d (MV)          │
│  - Materialized view                    │
│  - Pre-calculated 7-day totals          │
│  - Fast read (no aggregation)           │
└──────────┬──────────────────────────────┘
           │
           │ Array of {user_id, points_7d}
           ▼
┌─────────────────────────────────────────┐
│  Frontend                               │
│  - JOIN with profiles for display_name  │
│  - Render top 20                        │
│  - Show ranks, avatars                  │
└─────────────────────────────────────────┘
```

---

## Database Schema

### Core Tables

**profiles**
```
user_id (PK, UUID) → auth.users
display_name (TEXT)
avatar_url (TEXT)
country (TEXT)
timezone (TEXT)
created_at (TIMESTAMP)
```

**point_wallets**
```
user_id (PK, UUID) → profiles.user_id
balance_cached (INTEGER)
updated_at (TIMESTAMP)
```

**point_ledger** (Append-only)
```
id (PK, UUID)
user_id (UUID) → profiles.user_id
source (TEXT: 'scan', 'social', 'admin')
ref_id (UUID) → scan_events.id | social_submissions.id
delta (INTEGER: + or -)
reason (TEXT)
created_at (TIMESTAMP)
```

**qr_codes**
```
id (PK, UUID)
code (UNIQUE, TEXT) → 'BOTTLE-XXXXXX'
label (TEXT)
points_value (INTEGER)
is_unique (BOOLEAN)
starts_at (TIMESTAMP)
ends_at (TIMESTAMP)
metadata (JSONB)
```

**scan_events**
```
id (PK, UUID)
user_id (UUID) → profiles.user_id
qr_code_id (UUID) → qr_codes.id
scanned_at (TIMESTAMP)
result (TEXT: 'accepted' | 'rejected')
reject_reason (TEXT)
```

**social_submissions**
```
id (PK, UUID)
user_id (UUID) → profiles.user_id
platform (TEXT: 'x' | 'instagram')
post_url (TEXT, UNIQUE)
screenshot_url (TEXT)
status (TEXT: 'pending' | 'credited' | 'rejected')
awarded_points (INTEGER)
reason (TEXT)
created_at (TIMESTAMP)
reviewed_at (TIMESTAMP)
reviewer_user_id (UUID)
```

**leaderboard_7d** (Materialized View)
```
user_id (UUID)
points_7d (INTEGER) → SUM(delta) FROM last 7 days
last_updated_at (TIMESTAMP)
```

### Database Features

**Triggers:**
- `handle_new_user()` - Auto-create profile on signup
- `update_wallet_balance()` - Auto-update wallet when ledger entry added
- `auto_credit_social_submission()` - Award points when submission approved
- `prevent_ledger_modification()` - Enforce append-only on ledger

**Functions:**
- `refresh_leaderboard_7d()` - Manually refresh materialized view

**Security:**
- Row-Level Security (RLS) on all tables
- Users can only SELECT their own data
- Admin operations via Supabase Studio (service role)

---

## Security Architecture

### Authentication

```
┌─────────────────┐
│  User Login     │
└────────┬────────┘
         │
         ▼
┌────────────────────────────────────┐
│  Supabase Auth                     │
│  - Email magic link                │
│  - Google OAuth                    │
│  - Returns JWT access token        │
└────────┬───────────────────────────┘
         │
         │ JWT stored in httpOnly cookie
         ▼
┌────────────────────────────────────┐
│  Middleware                        │
│  - Validates session on each req   │
│  - Protects /wallet, /earn, etc.   │
└────────────────────────────────────┘
```

### Authorization

**Client-Side (Browser):**
- Supabase client uses `anon` key (safe to expose)
- JWT token sent with every request
- RLS enforces data isolation

**Server-Side (Edge Function):**
- Uses `service_role` key (never exposed)
- Validates JWT from Authorization header
- Can perform admin operations

### Data Protection

**Row-Level Security Policies:**
```sql
-- Users can only see their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only see their own transactions
CREATE POLICY "Users can view own ledger"
  ON point_ledger FOR SELECT
  USING (auth.uid() = user_id);

-- Similar policies for all tables
```

**Edge Function Security:**
- JWT validation before any operation
- No admin operations exposed to client
- CORS headers configured
- Input validation and sanitization

**Audit Trail:**
- Append-only ledger (cannot be modified/deleted)
- Complete scan history (accepted and rejected)
- Submission timestamps
- Reviewer tracking

---

## Deployment Architecture

### Environments

**Development:**
```
Local Machine
└── npm run dev → localhost:3000
    ├── .env.local (local vars)
    └── Supabase Cloud (shared dev project)
```

**Production:**
```
GitHub Repo
    │
    ├── Push to main
    │   └── Vercel auto-deploy → Production
    │
    └── Pull Request
        └── Vercel preview → Preview URL
```

### Environment Variables

**Client-Side (NEXT_PUBLIC_*):**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_QR_SCAN_ENDPOINT`

**Server-Side:**
- Edge Functions automatically get `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- Vercel builds with production env vars

### CI/CD

```
Git Push
    │
    ├── GitHub Actions (optional)
    │   └── Run tests (lint, build, jest, playwright)
    │
    └── Vercel Build
        ├── Install dependencies
        ├── Run build (next build)
        ├── Deploy to CDN
        └── Invalidate cache
```

---

## Performance Considerations

### Database

- **Materialized View**: Leaderboard pre-calculated, manual refresh
- **Cached Balance**: Avoids SUM() on every wallet query
- **Indexes**: On user_id, created_at for common queries
- **RLS**: Efficient policy checks at database level

### Frontend

- **Next.js App Router**: Server components for data fetching
- **Client Components**: Only where interactivity needed
- **Image Optimization**: Next.js Image component
- **Code Splitting**: Automatic route-based splitting

### Edge Functions

- **Deno Runtime**: Fast cold starts
- **Single Responsibility**: Each function does one thing
- **Efficient Queries**: Single targeted queries vs complex joins
- **CORS**: Preflight requests cached by browsers

---

## Scalability

### Current Capacity

- **Users**: Can handle thousands of concurrent users
- **QR Codes**: Unlimited (PostgreSQL handles millions of rows)
- **Leaderboard**: Materialized view refreshes in seconds
- **Edge Functions**: Auto-scales with Supabase

### Future Enhancements

- **Real-time Updates**: Supabase Realtime for live leaderboard
- **Redis Cache**: Cache frequently accessed data
- **CDN**: Vercel Edge Network for static assets
- **Database Replication**: Read replicas for heavy traffic

---

## Monitoring & Observability

**Supabase Dashboard:**
- Database logs and slow queries
- Edge Function logs
- API usage metrics
- Storage usage

**Vercel Analytics:**
- Page views and performance
- Error tracking
- User behavior

**Manual Checks:**
- Database health: `SELECT * FROM pg_stat_activity`
- Function health: Supabase Edge Functions dashboard
- Build logs: Vercel Deployment logs

---

## Related Documentation

- **[Admin Guide](admin-guide.md)** - Database operations
- **[Migration Guide](../supabase/migrations/README.md)** - Schema setup
- **[Testing Setup](qa-testing-setup.md)** - Testing architecture
- **[Deployment Guide](../VERCEL_DEPLOYMENT.md)** - Production deployment

---

**Last Updated**: October 2025  
**Version**: 1.0
