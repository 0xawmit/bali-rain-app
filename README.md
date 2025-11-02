# Bali Rain Rewards App

A modern rewards platform built with Next.js, Supabase, and Vercel that lets users earn points by engaging with the Bali Rain brand.

## 🌟 Overview

Bali Rain is a lifestyle and beverage brand that bridges physical products with digital community experiences. This web app enables users to:

- **Earn Points**: Scan QR codes on bottles or submit social media posts
- **View Balance**: Track points balance and transaction history
- **Compete**: See rankings on the 7-day leaderboard
- **Manage Profile**: Customize display name and avatar

## 🏗️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Deployment**: Vercel (web) + Supabase (database/functions)
- **Testing**: Jest (unit) + Playwright (E2E)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- A Supabase account and project ([sign up](https://supabase.com))
- A Vercel account ([sign up](https://vercel.com))

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd appv1
npm install
```

### 2. Set Up Supabase

1. Create a new Supabase project at [supabase.com/dashboard](https://supabase.com/dashboard)
2. Go to **SQL Editor** in your Supabase dashboard
3. Run migrations in order:
   - Copy content from `supabase/migrations/001_profiles.sql` → Run
   - Copy content from `supabase/migrations/002_point_system.sql` → Run
   - Copy content from `supabase/migrations/003_qr_system.sql` → Run
   - Copy content from `supabase/migrations/004_social_submissions.sql` → Run
   - Copy content from `supabase/migrations/005_leaderboard.sql` → Run

See [`supabase/migrations/README.md`](supabase/migrations/README.md) for detailed instructions.

### 3. Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
cp env.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_QR_SCAN_ENDPOINT=your-edge-function-url-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Get these values from:
- **Supabase Dashboard** → **Settings** → **API**
- **NEXT_PUBLIC_QR_SCAN_ENDPOINT**: Deploy Edge Function first (see below)

### 4. Deploy QR Scan Edge Function

**Via Supabase Dashboard:**

1. Go to **Edge Functions** in your Supabase dashboard
2. Click **Create a new function**
3. Name it `qr-scan`
4. Copy content from `supabase/functions/qr-scan/index.ts` into the editor
5. Click **Deploy**
6. Copy the Function URL and add it to `.env.local` as `NEXT_PUBLIC_QR_SCAN_ENDPOINT`

**Via Supabase CLI:**

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Deploy the function
supabase functions deploy qr-scan
```

### 5. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see your app!

### 6. Generate Test QR Codes (Optional)

```bash
npm run generate-qr-codes
```

This creates 100 reusable codes (25 points each, 24h cooldown) and 10 unique codes (50 points each, single-use).

---

## 📁 Project Structure

```
appv1/
├── app/                      # Next.js App Router pages
│   ├── earn/                 # Earn points page
│   ├── leaderboard/          # Leaderboard page
│   ├── profile/              # User profile page
│   ├── scan/                 # QR code scan page
│   ├── wallet/               # Points wallet page
│   └── layout.tsx            # Root layout
├── components/               # React components
│   ├── BottomNav.tsx         # Mobile navigation
│   ├── Toast.tsx             # Toast notifications
│   └── ...
├── lib/                      # Shared utilities
│   ├── api.ts                # API helpers
│   ├── supabase/             # Supabase client configs
│   └── types.ts              # TypeScript types
├── supabase/
│   ├── functions/            # Edge Functions
│   │   └── qr-scan/          # QR scan validation
│   └── migrations/           # Database migrations
├── tests/                    # Test files
│   ├── components/           # Component tests
│   ├── e2e/                  # E2E tests
│   └── utils/                # Test utilities
├── docs/                     # Documentation
│   ├── admin-guide.md        # Admin operations guide
│   └── architecture.md       # System architecture
└── scripts/                  # Utility scripts
    ├── check-env.js          # Environment checker
    └── generate-qr-codes.ts  # QR code generator
```

---

## 🧪 Testing

Run all tests:

```bash
# Unit tests (Jest)
npm run test

# E2E tests (Playwright)
npm run test:e2e

# All tests
npm run test:all

# CI checks (lint + build + tests)
npm run test:ci
```

Check environment variables:

```bash
npm run check:env
```

See [`tests/README.md`](tests/README.md) for detailed testing instructions.

---

## 📦 Deployment

### Deploy to Vercel

See [`VERCEL_DEPLOYMENT.md`](VERCEL_DEPLOYMENT.md) for complete deployment guide.

**Quick steps:**

1. Push code to Git (GitHub/GitLab/Bitbucket)
2. Import repo in Vercel Dashboard
3. Add environment variables in Vercel **Settings** → **Environment Variables**
4. Deploy!

### Environment Variables for Vercel

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key |
| `NEXT_PUBLIC_QR_SCAN_ENDPOINT` | Your Edge Function URL |

⚠️ **Important**: After adding env vars, trigger a redeploy in Vercel.

---

## 📚 Documentation

- **[Architecture Overview](docs/architecture.md)** - System design and data flow
- **[Admin Guide](docs/admin-guide.md)** - Managing submissions, QR codes, and users
- **[Migration Guide](supabase/migrations/README.md)** - Database setup instructions
- **[Testing Setup](docs/qa-testing-setup.md)** - Testing infrastructure overview
- **[Vercel Deployment](VERCEL_DEPLOYMENT.md)** - Deployment walkthrough

---

## 🎯 Key Features

### QR Code Scanning

- Generic codes: 25 points, reusable every 24 hours
- Unique codes: 50 points, single-use only
- Time windows: Optional start/end dates
- Secure validation via Edge Function

### Social Media Submissions

- Platforms: X (Twitter) and Instagram
- Manual approval workflow in Supabase Studio
- Auto-credit: Points awarded when admin approves
- Duplicate prevention

### Leaderboard

- 7-day rolling window
- Materialized view for performance
- Refresh manually: `SELECT refresh_leaderboard_7d();`

### Points System

- Append-only transaction log for audit trail
- Cached balance for performance
- Auto-updates via database triggers
- Complete transaction history

---

## 🔒 Security

- **Row-Level Security (RLS)**: Users can only access their own data
- **Edge Functions**: Sensitive operations (points, validation) on server
- **Auth**: JWT-based authentication via Supabase
- **Input Validation**: Client and server-side checks
- **Append-Only Ledger**: Immutable transaction history

See [`docs/architecture.md`](docs/architecture.md) for security details.

---

## 🤝 Contributing

This project uses a multi-agent development workflow:

1. **UI Builder** - Frontend components and pages
2. **Backend & Logic** - Edge Functions, API routes, DB logic
3. **QA & Testing** - Automated tests
4. **Infra & Deployment** - CI/CD and deployment configs
5. **Docs & Architecture** - Documentation and guides

---

## 🐛 Troubleshooting

### Build Fails

- Check environment variables are set: `npm run check:env`
- Verify TypeScript compiles: `npm run build`
- Check Supabase URL and keys are correct

### Edge Function Not Working

- Verify function is deployed: Check Supabase Dashboard → Edge Functions
- Check CORS is configured in function
- Verify JWT token is being sent in Authorization header

### Authentication Issues

- Ensure Supabase redirect URLs include your domain
- Check auth providers are enabled in Supabase Dashboard
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Database Errors

- Run migrations in order (001 → 005)
- Check RLS policies allow user access
- Verify triggers are created: `\df public.*` in psql

---

## 📞 Support

- **Documentation**: Check [`docs/`](docs/) directory
- **Issues**: Open a GitHub issue
- **Supabase**: [docs.supabase.com](https://docs.supabase.com)
- **Next.js**: [nextjs.org/docs](https://nextjs.org/docs)

---

## 📄 License

Private - All rights reserved

---

**Version**: 1.0  
**Last Updated**: October 2025
