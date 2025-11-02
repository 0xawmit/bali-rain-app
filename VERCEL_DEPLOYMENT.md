# Vercel Deployment Guide

This guide will help you deploy your Bali Rain app to Vercel for hosting and testing.

## Quick Start

**Required Environment Variables:**
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key  
- `NEXT_PUBLIC_QR_SCAN_ENDPOINT` - Your deployed Edge Function URL

**Deployment Steps:**
1. Push code to Git (GitHub/GitLab/Bitbucket)
2. Import repository in Vercel Dashboard
3. Add environment variables
4. Deploy!

## Prerequisites

1. A Vercel account ([sign up here](https://vercel.com/signup) if needed)
2. Your Supabase project credentials
3. Your Supabase Edge Function deployed and URL available

## Step 1: Deploy Supabase Edge Function (if not done already)

Before deploying to Vercel, ensure your QR scan Edge Function is deployed:

```bash
# Navigate to your project root
cd /Users/amitanand/Documents/Bali\ Rain/appv1

# If you have Supabase CLI installed
supabase functions deploy qr-scan

# Or deploy via Supabase Dashboard
# Go to: https://supabase.com/dashboard > Your Project > Edge Functions > Deploy
```

After deployment, note the Edge Function URL. It will look like:
```
https://[your-project-ref].supabase.co/functions/v1/qr-scan
```

## Step 2: Push Your Code to Git

Vercel works best with Git repositories. Make sure your code is pushed to GitHub, GitLab, or Bitbucket.

```bash
# If you haven't initialized git yet
git init
git add .
git commit -m "Initial commit"

# Create a repository on GitHub/GitLab and push
git remote add origin <your-repo-url>
git push -u origin main
```

## Step 3: Deploy to Vercel

### Option A: Via Vercel Dashboard (Recommended for first time)

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New Project"**
3. Import your Git repository
4. Vercel will auto-detect it's a Next.js project
5. Configure the following:

   **Environment Variables:**
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
   - `NEXT_PUBLIC_QR_SCAN_ENDPOINT` - Your Edge Function URL

   **Build Settings:**
   - Framework Preset: Next.js (auto-detected)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
   - Install Command: `npm install` (default)

6. Click **"Deploy"**

### Option B: Via Vercel CLI

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel
```

Follow the prompts. When asked about environment variables, add them one by one, or set them later via the dashboard.

## Step 4: Configure Environment Variables

After deployment, configure your environment variables:

1. Go to your project on Vercel Dashboard
2. Navigate to **Settings** > **Environment Variables**
3. Add the following variables:

   | Variable Name | Value |
   |--------------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key |
   | `NEXT_PUBLIC_QR_SCAN_ENDPOINT` | Your Edge Function URL (e.g., `https://[project].supabase.co/functions/v1/qr-scan`) |

4. Make sure to add them for all environments (Production, Preview, Development)
5. Click **"Redeploy"** after adding environment variables

## Step 5: Verify Deployment

1. Once deployed, Vercel will provide you with a URL like: `https://your-project.vercel.app`
2. Visit the URL and test the application
3. Check that:
   - Login works
   - QR scanning works
   - Points are being awarded
   - Navigation works correctly

## Step 6: Custom Domain (Optional)

If you want to use a custom domain:

1. Go to **Settings** > **Domains**
2. Add your domain
3. Follow the DNS configuration instructions
4. Wait for DNS propagation (can take up to 48 hours)

## Troubleshooting

### Build Fails

- Check the build logs in Vercel dashboard
- Ensure all environment variables are set
- Verify your `package.json` has correct build scripts
- Make sure TypeScript compiles without errors locally

### Environment Variables Not Working

- Remember: `NEXT_PUBLIC_*` variables are exposed to the browser
- After adding/changing env vars, you need to redeploy
- Check that variables are added for the correct environment (Production/Preview)

### Edge Function Not Working

- Verify the Edge Function URL is correct
- Check that CORS is properly configured in the Edge Function
- Ensure the Edge Function is deployed and accessible
- Check Supabase Edge Function logs for errors

### Authentication Issues

- Verify Supabase URLs and keys are correct
- Check that your Supabase project has the correct redirect URLs configured
- Add your Vercel domain to Supabase Auth settings:
  - Go to Supabase Dashboard > Authentication > URL Configuration
  - Add: `https://your-project.vercel.app` to Site URL and Redirect URLs

## Continuous Deployment

Once connected to Git, Vercel will automatically:
- Deploy every push to `main` branch (production)
- Create preview deployments for pull requests
- Run builds automatically on each push

## Need Help?

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

