# Bali Rain App - MVP Development

## Background and Motivation

### What is Bali Rain?
Bali Rain is a lifestyle and beverage brand born in Bali that blends real-world products with digital community experiences. Its mission is to build a movement around conscious living, culture, and creativity — powered by participation.

### The Bali Rain App
A simple web-based rewards platform that bridges the brand's physical and digital presence. When users engage with Bali Rain — by drinking the product, visiting partner cafés, or posting on social media — they earn points that can later be redeemed for exclusive perks, products, and community experiences.

### MVP Goals
The goal of this web MVP is to:

1. **Let users earn points** for interacting with Bali Rain in two ways:
   - Scanning a QR code printed on bottles or posters
   - Submitting a social media post (manual approval in v1)

2. **Let users view** their points balance, history, and recent activity

3. **Show a leaderboard** highlighting the most active community members

4. **Allow admins** to approve submissions directly through Supabase Studio (no separate dashboard needed)

### Product Vision
The Bali Rain rewards app connects physical actions (buying and scanning a bottle) and digital participation (sharing posts, supporting the brand) into one unified points system.

**The Core Loop:**
- Engage IRL or online → Earn points
- See recognition on leaderboard → Feel part of the movement
- Repeat → Strengthen community connection

**Future Stages:** Partner café quests, redemption via merch & events, deeper integrations (Zealy quests, tokenized points, etc.)

---

## Key Challenges and Analysis

### Technical Architecture Decisions

**Stack Considerations:**
- **Frontend:** Need a modern, responsive web framework (React/Next.js recommended for speed and SEO)
- **Backend:** Supabase provides auth, database, and real-time features out of the box
- **QR Code System:** Need unique, scannable codes that can be validated once per bottle
- **Authentication:** Simple email/social login for low friction onboarding
- **Mobile-First:** Must work seamlessly on mobile devices (primary use case)

### Core Technical Challenges

1. **QR Code Security & Uniqueness**
   - Each bottle needs a unique QR code
   - Codes should only be scannable once to prevent farming
   - Need to track which codes have been used
   - Consider QR code generation strategy and scale

2. **Social Media Submission Flow**
   - Users need to submit post URL + screenshot/proof
   - Manual approval workflow in Supabase
   - Need to prevent duplicate submissions of same post
   - Consider moderation efficiency

3. **Points System Integrity**
   - Points must be accurate and tamper-proof
   - Transaction history needs to be immutable
   - Need clear point values for different actions
   - Consider edge cases (concurrent scans, failed transactions)

4. **Leaderboard Performance**
   - Need efficient queries for top users
   - Real-time or cached updates?
   - Consider privacy settings (opt-in/opt-out)

5. **User Experience**
   - Smooth onboarding flow
   - Instant feedback on actions
   - Clear point values and rules
   - Engaging but simple UI

### Data Model Requirements

**Core Entities:**
1. Users (profiles, auth, total points)
2. QR Codes (unique codes, status, scan history)
3. Transactions (point events, types, timestamps)
4. Social Submissions (posts, status, proof, points)
5. Leaderboard (aggregated view)

---

## High-level Task Breakdown

### Phase 1: Project Foundation & Setup
- [ ] **Task 1.1:** Initialize Next.js 14+ project with App Router, TypeScript, and Tailwind CSS
  - Create project: `npx create-next-app@latest appv1 --typescript --tailwind --app`
  - Configure `tsconfig.json` with strict mode
  - Set up Tailwind with custom config
  - Success Criteria: `npm run dev` runs successfully, can view default Next.js page at localhost:3000

- [ ] **Task 1.2:** Set up Supabase project and install client libraries
  - Create new Supabase project (web console)
  - Install dependencies: `@supabase/supabase-js`, `@supabase/auth-helpers-nextjs`
  - Create `.env.local` with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
  - Create `lib/supabase/client.ts` and `lib/supabase/server.ts` utilities
  - Success Criteria: Supabase client can connect, can query `auth.users` (empty result OK)

- [ ] **Task 1.3:** Create SQL migration for `profiles` table
  - Write migration file: `supabase/migrations/001_profiles.sql`
  - Create table with fields: user_id (PK, FK to auth.users), display_name, avatar_url, country, timezone, created_at
  - Add RLS policies: user can SELECT/UPDATE only their own row
  - Add trigger to auto-create profile on auth.users INSERT
  - Success Criteria: Can run migration, table exists with correct schema, RLS policies active

- [ ] **Task 1.4:** Create SQL migration for points wallet system
  - Write migration file: `supabase/migrations/002_point_system.sql`
  - Create `point_wallets` table: user_id (PK), balance_cached, updated_at
  - Create `point_ledger` table: id, user_id, source, ref_id, delta, reason, created_at with indexes
  - Add append-only trigger to prevent UPDATE/DELETE on point_ledger
  - Add trigger to auto-update point_wallets.balance_cached when point_ledger row inserted
  - Add RLS: user can SELECT only their own rows
  - Success Criteria: Tables created, triggers working (test with manual INSERT), balances update correctly

- [ ] **Task 1.5:** Create SQL migration for QR code system
  - Write migration file: `supabase/migrations/003_qr_system.sql`
  - Create `qr_codes` table: id, code (unique), label, points_value, is_unique, starts_at, ends_at, metadata
  - Create `scan_events` table: id, user_id, qr_code_id, scanned_at, result, reject_reason with indexes
  - Add RLS: qr_codes SELECT allowed to all; scan_events SELECT only own rows
  - Success Criteria: Tables created, can INSERT test QR codes, foreign keys work

- [ ] **Task 1.6:** Create SQL migration for social submissions
  - Write migration file: `supabase/migrations/004_social_submissions.sql`
  - Create `social_submissions` table: id, user_id, platform, post_url, screenshot_url, status, awarded_points, reason, created_at, reviewed_at, reviewer_user_id
  - Add UNIQUE constraint on (user_id, post_url)
  - Add CHECK constraints for platform ('x','instagram') and status ('pending','credited','rejected')
  - Add trigger: when status → 'credited', auto-INSERT into point_ledger
  - Add RLS: user can SELECT own rows, INSERT with user_id=auth.uid(), no UPDATE policy
  - Success Criteria: Table created, triggers work, duplicate posts rejected, auto-crediting works

- [ ] **Task 1.7:** Create SQL migration for 7-day leaderboard materialized view
  - Write migration file: `supabase/migrations/005_leaderboard.sql`
  - Create materialized view `leaderboard_7d`: user_id, points_7d from point_ledger (last 7 days)
  - Create function `refresh_leaderboard_7d()` to refresh the view
  - Add RLS: public SELECT allowed
  - Success Criteria: View created, refresh function works, returns correct aggregated data

### Phase 2: Authentication & Core Layout
- [ ] **Task 2.1:** Implement Supabase Auth with email magic link and Google OAuth
  - Install and configure `@supabase/auth-helpers-nextjs`
  - Create `lib/supabase/client.ts` (browser client with anon key)
  - Create `lib/supabase/server.ts` (server client with cookies)
  - Build `/login` page with email magic link and Google sign-in buttons
  - After successful auth, redirect to `/wallet`
  - Success Criteria: Users can sign up/login with email or Google, session persists, redirect works

- [ ] **Task 2.2:** Create shared UI components
  - Create `components/Button.tsx` - reusable button with loading state
  - Create `components/Input.tsx` - text input with label and error state
  - Create `components/Card.tsx` - container with padding and shadow
  - Create `components/Toast.tsx` - success/error toast notifications
  - Create `components/Loader.tsx` - loading spinner and skeleton
  - Success Criteria: Components render correctly, accept props, styled with Tailwind

- [ ] **Task 2.3:** Build root layout with navigation
  - Create `app/layout.tsx` with header navigation
  - Add nav links: Wallet, Earn, Leaderboard, Profile
  - Show user display_name and logout button when authenticated
  - Add middleware to protect routes (redirect to /login if not authenticated)
  - Success Criteria: Navigation works, protected routes redirect to login, logout clears session

- [ ] **Task 2.4:** Build `/wallet` page (home/dashboard)
  - Create `app/wallet/page.tsx`
  - Query `point_wallets.balance_cached` for current user
  - Query last 20 entries from `point_ledger` (with source, reason, delta, created_at)
  - Display balance prominently at top
  - Show transaction history list with proper formatting (+/- points)
  - If no wallet exists, show balance as 0
  - Success Criteria: New user sees balance 0, transactions display correctly, updates after earning points

### Phase 3: QR Code Scanning & Earn Page
- [ ] **Task 3.1:** Create Supabase Edge Function for QR scan validation
  - Create Edge Function: `supabase/functions/qr-scan/index.ts`
  - Implement POST handler accepting `{ "code": "string" }`
  - Validate JWT token from Authorization header (get user_id from auth.uid())
  - Find `qr_codes` row where code matches, ensure within active window (starts_at/ends_at)
  - **Cooldown logic for generic codes** (is_unique=false): Deny if user has accepted scan for this qr_code_id in last 24h
  - **Single-use logic for unique codes** (is_unique=true): Deny if ANY accepted scan exists for this qr_code_id
  - **If valid**: INSERT scan_events (result='accepted') + INSERT point_ledger (source='scan', ref_id=scan_event.id, delta=points_value)
  - **If invalid**: INSERT scan_events (result='rejected', reject_reason) and return error
  - Return: `{ result: 'accepted', points_awarded: number, new_balance: number }` OR `{ result: 'rejected', reason: string }`
  - Use SUPABASE_SERVICE_ROLE_KEY only inside function (never expose to client)
  - Success Criteria: Function deploys, validates JWT, cooldown works (24h for generic), single-use works (unique), points credited

- [ ] **Task 3.2:** Create utility script to generate QR codes
  - Create script: `scripts/generate-qr-codes.ts`
  - Generate batch of QR codes with format: `BOTTLE-{random-alphanumeric-6}`
  - Insert into qr_codes table with points_value=25, is_unique=false (generic, reusable with cooldown)
  - Also create a few unique codes (is_unique=true) for testing
  - Export codes to CSV for printing
  - Success Criteria: Script runs, creates 100 test codes, codes in database and CSV file

- [ ] **Task 3.3:** Build `/earn` page - Part 1: QR Code Entry
  - Create `app/earn/page.tsx` with tabs/sections
  - **Section 1: "Enter Code"** with text input and "Redeem" button
  - Create helper function in `lib/api.ts` to call POST /qr/scan with session bearer token
  - On submit: Show loading state, call Edge Function
  - On success: Show toast "+{points} points", refresh wallet balance
  - On error: Map server reasons to friendly messages ("Already claimed in last 24h", "Code expired", "Invalid code", etc.)
  - Success Criteria: Valid code awards points, duplicate within 24h shows cooldown error, UI updates immediately

### Phase 4: Social Media Submission (Part of /earn page)
- [ ] **Task 4.1:** Set up Supabase Storage bucket for screenshots
  - Create storage bucket: `social-screenshots` in Supabase console (public bucket OK for v1)
  - Configure bucket policies: authenticated users can INSERT, read own files
  - Add storage helper functions in `lib/supabase/storage.ts`
  - Success Criteria: Bucket created, can upload test image via client

- [ ] **Task 4.2:** Build `/earn` page - Part 2: Social Post Submission
  - **Section 2: "Submit Social Post"** in `app/earn/page.tsx`
  - Form fields: Dropdown for platform (X/Instagram), text input for post_url, file upload for screenshot (optional)
  - On submit: Upload screenshot to Storage (if provided), get URL
  - INSERT into `social_submissions` table: user_id (from session), platform, post_url, screenshot_url, status='pending'
  - Show success message: "Submission received! We'll review it soon."
  - Success Criteria: Form submits, data saves to social_submissions, screenshot uploads to Storage

- [ ] **Task 4.3:** Build "My Submissions" list on /earn page
  - Below the form, query `social_submissions` for current user
  - Display list with: platform icon, post URL (truncated), status badge (pending/credited/rejected), awarded_points (if credited), created_at
  - Status badge colors: pending=yellow, credited=green, rejected=red
  - Real-time updates (optional: use Supabase Realtime or just refresh on page load)
  - Success Criteria: User sees all their submissions, status updates appear when admin approves

- [ ] **Task 4.4:** Test and document admin approval workflow
  - Write guide: `docs/admin-workflow.md`
  - **Admin workflow in Supabase Studio:**
    1. Navigate to `social_submissions` table
    2. Filter where `status = 'pending'`
    3. Click a row to edit
    4. Verify post URL is legitimate
    5. Update `status` to 'credited' and set `awarded_points` (default 20 if null)
    6. Save → Database trigger auto-creates point_ledger entry
  - Test complete flow: Submit post → Admin approves → Verify points awarded → Check user wallet
  - Success Criteria: Admin can approve in Studio, trigger auto-credits points, user sees updated status and balance

### Phase 5: Leaderboard & Profile Pages
- [ ] **Task 5.1:** Build `/leaderboard` page
  - Create `app/leaderboard/page.tsx`
  - Query `leaderboard_7d` materialized view (top 20 users)
  - JOIN with `profiles` table to get display_name and avatar_url
  - Display ranked list: rank number, avatar (if present), display_name, 7-day points total
  - Add "Refresh" button that calls RPC function `refresh_leaderboard_7d()` (for dev/manual refresh)
  - Show loading skeleton while fetching
  - Success Criteria: After awarding points to users, leaderboard shows them in descending order (once refreshed)

- [ ] **Task 5.2:** Build `/profile` page
  - Create `app/profile/page.tsx`
  - Display current profile: display_name, avatar_url, country, timezone, member since (created_at)
  - Edit form: Input for display_name, file upload for avatar (upload to Storage), country dropdown, timezone dropdown
  - On save: Update `profiles` table for current user
  - Show success message on save
  - Success Criteria: User can update profile fields, changes reflect across app (navigation, leaderboard)

### Phase 6: Polish & UX Refinements
- [ ] **Task 6.1:** Implement toast notification system
  - Set up Toast provider and context (or use a library like react-hot-toast)
  - Show success toasts: "+25 points earned!", "Submission received!", "Profile updated"
  - Show error toasts: Map Edge Function errors to friendly messages
  - Auto-dismiss after 3-5 seconds
  - Success Criteria: All user actions show immediate feedback via toast

- [ ] **Task 6.2:** Add loading skeletons to all pages
  - Add loading.tsx files for each route (wallet, earn, leaderboard, profile)
  - Create skeleton UI that matches page layout (shimmer effect)
  - Add button loading states (disable + spinner during submit)
  - Success Criteria: No blank pages during load, smooth visual transition

- [ ] **Task 6.3:** Implement comprehensive error handling
  - Add error.tsx files for error boundaries at route level
  - Add try-catch blocks in all server actions and API calls
  - Map Edge Function error codes to user-friendly messages:
    - "cooldown" → "You already scanned this code in the last 24 hours"
    - "already_used" → "This code has already been claimed"
    - "expired" → "This code is no longer valid"
    - "not_found" → "Invalid code. Please check and try again"
  - Success Criteria: All errors show helpful messages, no raw error objects exposed

- [ ] **Task 6.4:** Ensure mobile-first responsive design
  - Test all pages at 375px, 768px, 1024px viewports
  - Navigation: Responsive header, consider mobile menu if needed
  - Forms: Touch-friendly inputs (min 44px height), proper keyboard types
  - Tables/lists: Stack on mobile, scroll horizontally if needed
  - Typography: Readable font sizes on small screens
  - Success Criteria: App works perfectly on mobile (primary use case), no horizontal scroll, all buttons/links easily tappable

### Phase 7: Acceptance Testing & Security Audit
- [ ] **Task 7.1:** Run Acceptance Test #1 - Auth Flow
  - Sign up as new user with email or Google
  - Verify redirect to `/wallet` after successful auth
  - Verify balance shows 0 for new user
  - Verify profile is created (or prompted for profile setup)
  - Success Criteria: ✅ Sign up → redirected to /wallet → balance 0

- [ ] **Task 7.2:** Run Acceptance Test #2 - QR Code (Generic with 24h Cooldown)
  - Enter code "BOTTLE-25" (or similar generic code with is_unique=false)
  - Verify wallet balance increases by 25 points
  - Verify success toast appears
  - Try entering same code again within 24 hours
  - Verify error message: "You already scanned this code in the last 24 hours" (or similar cooldown message)
  - Success Criteria: ✅ Valid code → +25 points. Repeat within 24h → cooldown error

- [ ] **Task 7.3:** Run Acceptance Test #3 - Social Submission Auto-Credit
  - Submit a social post URL (X or Instagram) via `/earn` page
  - Verify submission appears in "My Submissions" with status='pending'
  - Open Supabase Studio, navigate to `social_submissions` table
  - Find the pending submission, edit row: set status='credited', awarded_points=20
  - Save and refresh user's `/wallet` page
  - Verify wallet balance increased by 20 points
  - Verify ledger entry created automatically (source='social', delta=+20)
  - Success Criteria: ✅ Submit URL → pending status. Admin approves in Studio → auto-credited +20 points

- [ ] **Task 7.4:** Run Acceptance Test #4 - Leaderboard Refresh
  - Award points to several test users (via QR scans or manual ledger inserts)
  - Open `/leaderboard` page
  - Click "Refresh" button to refresh materialized view
  - Verify users appear in descending order by 7-day points total
  - Verify display_name and avatar show correctly (from profiles table)
  - Success Criteria: ✅ After awarding points, leaderboard shows users in correct order

- [ ] **Task 7.5:** Run Acceptance Test #5 - RLS Security Check
  - Create two test users (User A and User B)
  - Login as User A, try to query User B's data via browser console:
    - `supabase.from('point_ledger').select('*').eq('user_id', 'user_b_id')`
    - `supabase.from('scan_events').select('*').eq('user_id', 'user_b_id')`
    - `supabase.from('social_submissions').select('*').eq('user_id', 'user_b_id')`
  - Verify all queries return empty or error (RLS denies access)
  - Try to INSERT into point_ledger directly → verify denied
  - Try to UPDATE social_submissions status → verify denied
  - Success Criteria: ✅ RLS prevents unauthorized data access, users can only see own data

- [ ] **Task 7.6:** Verify Edge Function security
  - Confirm SUPABASE_SERVICE_ROLE_KEY is only in Edge Function secrets (never in frontend)
  - Test calling /qr/scan without Authorization header → verify rejected (401 Unauthorized)
  - Test calling with invalid JWT → verify rejected
  - Check that function validates JWT properly before any database operations
  - Success Criteria: ✅ Service role key never exposed, JWT validation enforced

### Phase 8: Deployment & Documentation
- [ ] **Task 8.1:** Create comprehensive README.md
  - Write `README.md` with:
    - Project overview and features
    - Tech stack (Next.js, Supabase, Vercel)
    - Local development setup instructions:
      - Clone repo, install dependencies (`npm install` or `pnpm install`)
      - Set up Supabase project (or `supabase start` for local dev)
      - Run migrations: `supabase db push` or apply via Studio
      - Deploy Edge Function: `supabase functions deploy qr-scan`
      - Set function secrets: `supabase secrets set SUPABASE_SERVICE_ROLE_KEY=xxx`
      - Configure `.env.local` with required variables
      - Run dev server: `npm run dev`
    - Deployment instructions (Vercel + Supabase)
    - Project structure overview
  - Success Criteria: Developer can follow README and get app running locally

- [ ] **Task 8.2:** Deploy Edge Function to Supabase
  - Navigate to `supabase/functions/qr-scan`
  - Deploy function: `supabase functions deploy qr-scan`
  - Set function secrets via CLI or Supabase dashboard:
    - `SUPABASE_URL`
    - `SUPABASE_SERVICE_ROLE_KEY`
  - Test function with curl/Postman
  - Copy function URL for frontend environment variable
  - Success Criteria: Edge Function deployed, accessible, validates correctly

- [ ] **Task 8.3:** Deploy frontend to Vercel
  - Push code to GitHub repository
  - Connect repo to Vercel
  - Configure environment variables in Vercel dashboard:
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    - `NEXT_PUBLIC_QR_SCAN_ENDPOINT` (Edge Function URL)
  - Deploy and test production build
  - Verify all features work in production (auth, scan, submit, leaderboard)
  - Success Criteria: App live on Vercel URL, all features working end-to-end

- [ ] **Task 8.4:** Generate initial QR code batch for production
  - Run `scripts/generate-qr-codes.ts` connected to production Supabase
  - Create 500 codes:
    - Generic codes (is_unique=false) for reusable bottles with 24h cooldown
    - Some unique codes (is_unique=true) for one-time promotional use
  - Export to CSV with format: code, label, points_value, type
  - Send CSV to printing vendor or create printable PDF
  - Success Criteria: 500 codes in production database, CSV exported for printing

- [ ] **Task 8.5:** Create admin documentation
  - Write `docs/admin-guide.md` with:
    - **Approving Social Submissions**: Step-by-step guide in Supabase Studio
    - **Generating More QR Codes**: How to run the script and export
    - **Refreshing Leaderboard**: When and how to manually refresh
    - **Monitoring Users**: How to view user activity and points
    - **Troubleshooting**: Common issues and solutions
  - Success Criteria: Non-technical admin can follow guide and manage the platform

- [ ] **Task 8.6:** Final end-to-end production test
  - Run all 5 acceptance tests in production environment
  - Test with multiple real devices (iOS, Android, desktop)
  - Verify email auth works (magic links delivered)
  - Verify performance (page loads, query speeds)
  - Check error handling and logging
  - Success Criteria: All acceptance tests pass, app ready for launch 🚀

---

## Project Status Board

### Current Sprint: Phase 1 - Project Foundation & Setup (7 tasks)

**Goal:** Get Next.js + Supabase running with complete database schema (all 7 tables, RLS, triggers)

- [x] Task 1.1: Initialize Next.js 14+ project with App Router, TypeScript, and Tailwind CSS ✅
- [x] Task 1.2: Set up Supabase project and install client libraries ✅
- [x] Task 1.3: Create SQL migration for `profiles` table ✅
- [x] Task 1.4: Create SQL migration for points wallet system (point_wallets + point_ledger + triggers) ✅
- [x] Task 1.5: Create SQL migration for QR code system (qr_codes + scan_events) ✅
- [x] Task 1.6: Create SQL migration for social submissions (with auto-credit trigger) ✅
- [x] Task 1.7: Create SQL migration for 7-day leaderboard materialized view ✅

### Current Sprint: Phase 5 - Leaderboard & Profile Pages (2 tasks)

**Goal:** Build leaderboard rankings and user profile management

- [x] Task 5.1: Build `/leaderboard` page ✅
- [x] Task 5.2: Build `/profile` page ✅

### Blocked Items
_None currently_

### Recently Completed
- ✅ Task 1.1: Next.js 14.2.33 initialized with App Router, TypeScript, Tailwind CSS - Dev server running on localhost:3000
- ✅ Task 1.2: Supabase client libraries installed, client/server/middleware utilities created, types defined, placeholder env files ready
- ✅ Task 1.3-1.7: All 5 SQL migrations created and applied successfully to Supabase
- ✅ **PHASE 1 COMPLETE** - Database connection verified, all 7 tables created, RLS policies active
- ✅ Task 2.1: Login page with email magic link and Google OAuth created
- ✅ Task 2.2: Shared UI components (Button, Input, Card, Loader) created
- ✅ Task 2.3: Navigation with user info and route protection implemented
- ✅ Task 2.4: Wallet page with points balance and transaction history created
- ✅ **PHASE 2 COMPLETE** - Authentication system and core UI ready!
- ✅ Task 3.1: Supabase Edge Function for QR scan validation with cooldown logic created
- ✅ Task 3.2: QR code generation script (100 generic + 10 unique codes) created
- ✅ Task 3.3: `/earn` page with QR code input and validation created
- ✅ **PHASE 3 COMPLETE** - QR scanning system ready!
- ✅ Task 4.1: Supabase Storage integration for screenshot uploads implemented
- ✅ Task 4.2: Social media submission form (X/Instagram) with file upload created
- ✅ Task 4.3: "My Submissions" list with status badges and real-time updates created
- ✅ Task 4.4: Comprehensive admin guide for approval workflow documented
- ✅ **PHASE 4 COMPLETE** - Social media submission system ready!
- ✅ Task 5.1: Leaderboard page with 7-day rankings, user highlighting, and refresh functionality created (fixed React error)
- ✅ Task 5.2: Profile page with avatar upload, display name, country, and timezone settings created
- ✅ **PHASE 5 COMPLETE** - Leaderboard and profile management ready!

---

## Executor's Feedback or Assistance Requests

### ⚠️ Action Required Before Phase 2

**Phase 1 is complete, but requires user action before proceeding:**

1. **Create Supabase Project** (if not done yet)
   - Go to https://supabase.com and create a new project
   - Wait for project to provision (~2 minutes)

2. **Apply Database Migrations**
   - Navigate to SQL Editor in Supabase Dashboard
   - Apply migrations in order: 001 → 002 → 003 → 004 → 005
   - See `supabase/migrations/README.md` for detailed instructions

3. **Update Environment Variables**
   - Get your Project URL and Anon Key from Project Settings → API
   - Update `.env.local` with actual credentials:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Restart dev server after updating: `npm run dev`

4. **Verify Database Setup**
   - Check that all 7 tables exist in Database → Tables
   - Verify RLS policies are enabled
   - Test by signing up a test user (will happen in Phase 2)

**Once these steps are complete, I can proceed with Phase 2 (Authentication & Core Layout).**

### Pending Questions
_None currently_

### Technical Specifications Provided

**Tech Stack Confirmed:**
- Frontend: Next.js (App Router) + TypeScript + Tailwind CSS
- Backend: Supabase (Postgres + Auth + RLS + Edge Functions)
- Deployment: Vercel (web) + Supabase (DB/Functions)

**Feature Specifications:**
- QR Code: Text input field (no camera for v1), default 25 points
- Social Posts: Manual approval in Supabase Studio, platforms: X (Twitter) and Instagram
- Leaderboard: 7-day rolling window (materialized view)
- Wallet: Cached balance + full transaction history
- Admin: No custom UI, use Supabase Studio directly

**Database Schema Defined:**
1. `profiles` - User profile data (user_id, display_name, avatar_url, country, timezone, created_at)
2. `point_wallets` - Cached balance per user (user_id, balance_cached, updated_at)
3. `point_ledger` - Append-only transaction log (id, user_id, source, ref_id, delta, reason, created_at)
4. `qr_codes` - QR code definitions (id, code, label, points_value, is_unique, starts_at, ends_at, metadata)
5. `scan_events` - QR scan history (id, user_id, qr_code_id, scanned_at, result, reject_reason)
6. `social_submissions` - Social post submissions (id, user_id, platform, post_url, screenshot_url, status, awarded_points, reason, created_at, reviewed_at, reviewer_user_id)
7. `leaderboard_7d` - Materialized view for 7-day leaderboard (user_id, points_7d)

**Edge Function Required:**
- `qr-scan` - POST /qr/scan endpoint for validating and processing QR code scans
  - Input: `{ "code": "BOTTLE-25" }`
  - Logic: Validate JWT → Find QR code → Check cooldown (24h for generic, single-use for unique) → Award points or reject
  - Output: `{ result: 'accepted'|'rejected', points_awarded?: number, new_balance?: number, reason?: string }`

**Frontend Pages (App Router):**
1. `/login` - Supabase Auth (email magic link or Google)
2. `/wallet` - Show balance and last 20 transactions
3. `/earn` - Two sections: Enter QR code + Submit social post
4. `/leaderboard` - Top 20 users from last 7 days
5. `/profile` - Edit display_name, avatar_url

**Project Structure (to be created):**
```
/app
  /login/page.tsx
  /wallet/page.tsx
  /earn/page.tsx
  /leaderboard/page.tsx
  /profile/page.tsx
  layout.tsx
  page.tsx (redirect to /wallet)
/components
  Button.tsx
  Input.tsx
  Card.tsx
  Toast.tsx
  Loader.tsx
/lib
  /supabase
    client.ts (browser client with anon key)
    server.ts (server client with cookies)
    storage.ts (storage helpers)
  api.ts (helper to call /qr/scan)
  types.ts (TS types for tables)
/styles (Tailwind)
/supabase
  /migrations
    001_profiles.sql
    002_point_system.sql
    003_qr_system.sql
    004_social_submissions.sql
    005_leaderboard.sql
  /functions
    /qr-scan
      index.ts
/scripts
  generate-qr-codes.ts
/docs
  admin-guide.md
.env.local (gitignored)
README.md
```

**Environment Variables:**
- Frontend: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_QR_SCAN_ENDPOINT
- Edge Function: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

**Acceptance Tests (Manual):**
1. Auth: Sign up → redirected to /wallet → balance 0
2. QR (generic): Enter BOTTLE-25 → +25 points. Try again within 24h → cooldown error
3. Social: Submit URL → pending status. Admin approves in Studio → auto-credited
4. Leaderboard: Refresh MV → users appear with correct 7-day totals
5. RLS: Attempt to query another user's data → access denied

---

## Lessons

### Best Practices for This Project
_Lessons will be documented here as development progresses_

### Common Pitfalls to Avoid
_Will be updated as we encounter and solve issues_

---

**Last Updated:** October 7, 2025 - Detailed Planning Complete
**Current Role:** Planner
**Next Step:** Await user approval of refined plan, then switch to Executor mode for Phase 1 implementation

---

## Planning Summary

### What Was Planned
The Planner has created a detailed 8-phase implementation plan with **43 specific tasks**. Each task has:
- Clear action items (what files to create, what code to write)
- Specific success criteria (testable, verifiable outcomes aligned with acceptance tests)
- Logical dependencies (database first, then auth, then features)

### Phase Summary
1. **Phase 1** (7 tasks): Project setup + complete database schema (7 tables, RLS, triggers)
2. **Phase 2** (4 tasks): Auth (email magic link + Google) + navigation + `/wallet` page
3. **Phase 3** (3 tasks): Edge Function for QR validation + `/earn` page (QR section)
4. **Phase 4** (4 tasks): Storage setup + social submission (in `/earn`) + admin workflow
5. **Phase 5** (2 tasks): `/leaderboard` page + `/profile` page
6. **Phase 6** (4 tasks): Toast notifications + loading states + error handling + mobile UX
7. **Phase 7** (6 tasks): Run all 5 acceptance tests + security audit + Edge Function verification
8. **Phase 8** (6 tasks): README + deploy Edge Function + deploy to Vercel + generate QR codes + docs + final testing

### Key Architecture Decisions
1. **Database-First Approach**: All 7 tables with RLS policies, triggers, and materialized view created in Phase 1 before any UI
2. **Edge Function for Points**: QR scan validation uses serverless Edge Function with service role key (never exposed to client)
3. **Auto-Credit Trigger**: Social submissions approved in Supabase Studio trigger automatic point_ledger insertion
4. **24h Cooldown for Generic Codes**: Reusable QR codes (is_unique=false) have 24h cooldown per user
5. **Single-Use for Unique Codes**: Promotional codes (is_unique=true) can only be scanned once globally
6. **Materialized View for Leaderboard**: 7-day leaderboard uses MV for performance (manual refresh acceptable for v1)
7. **Simple Admin Flow**: No custom admin UI, use Supabase Studio with triggers for auto-crediting
8. **Mobile-First**: Text input for QR codes (no camera in v1), touch-friendly UI, responsive design

### Estimated Effort
- **Phase 1** (Foundation): 7 tasks, ~1-2 days (most critical - database correctness)
- **Phase 2** (Auth + Layout): 4 tasks, ~1 day
- **Phase 3-4** (QR + Social): 7 tasks, ~2 days
- **Phase 5-6** (Pages + Polish): 6 tasks, ~1-2 days
- **Phase 7-8** (Testing + Deploy): 12 tasks, ~2-3 days
- **Total**: ~7-10 days of focused development for complete MVP

### Risks & Mitigations
- **Risk**: Database trigger complexity → **Mitigation**: Test each trigger individually in Phase 1 with manual inserts
- **Risk**: Edge Function authentication → **Mitigation**: Verify JWT validation in Task 3.1 before building UI
- **Risk**: RLS policy gaps → **Mitigation**: Dedicated security audit in Task 7.5 with two test users
- **Risk**: Leaderboard performance → **Mitigation**: Use materialized view, test with seeded data
- **Risk**: 24h cooldown logic errors → **Mitigation**: Test thoroughly in Task 7.2 with acceptance criteria
- **Risk**: Auto-credit trigger failing → **Mitigation**: Test in Task 7.3 with real social submission flow

