# 🚀 DEPLOY TO VERCEL - SIMPLE GUIDE

Follow these steps in order. Copy-paste each command into your terminal.

## STEP 1: Initialize Git (Run these in your terminal)

Open your terminal and run:

```bash
cd "/Users/amitanand/Documents/Bali Rain/appv1"
git init
git add .
git commit -m "initial commit - bali rain mvp"
```

## STEP 2: Create GitHub Repository

1. Go to https://github.com/new
2. Name it: `bali-rain-app` (or whatever you want)
3. Don't initialize with README
4. Click "Create repository"

## STEP 3: Push to GitHub (Run these commands)

**Replace `YOUR_USERNAME` with your GitHub username:**

```bash
git branch -M main
git remote add origin https://github.com/0xawmit/bali-rain-app.git
git push -u origin main
```

You'll be asked for your GitHub username and password (or use a personal access token).

## STEP 4: Deploy to Vercel

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Find your `bali-rain-app` repository
4. Click "Import"

## STEP 5: Add Environment Variables in Vercel

When Vercel asks for configuration:

1. Click "Environment Variables"
2. Add these THREE variables (get values from Supabase Dashboard):

   **Variable 1:**
   - Name: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: `https://YOUR_PROJECT.supabase.co` (from Supabase → Settings → API)

   **Variable 2:**
   - Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Value: `your-anon-key-here` (from Supabase → Settings → API)

   **Variable 3:**
   - Name: `NEXT_PUBLIC_QR_SCAN_ENDPOINT`
   - Value: `https://YOUR_PROJECT.supabase.co/functions/v1/qr-scan`
   - (If Edge Function isn't deployed yet, use a placeholder and update later)

3. Make sure to add them for: Production, Preview, AND Development

## STEP 6: Click "Deploy"

That's it! Vercel will build and deploy your app.

## STEP 7: Get Your Live URL

After deployment, you'll get a URL like: `https://bali-rain-app.vercel.app`

## STEP 8: Update Supabase Auth Settings

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add your Vercel URL to:
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs: `https://your-app.vercel.app/**`

---

## ⚠️ TROUBLESHOOTING

**If git commands don't work:**
- You may need to install Git: `brew install git`
- Or download from: https://git-scm.com/download/mac

**If you get Xcode license error:**
- Run: `sudo xcodebuild -license`
- Press space to scroll, type `agree` when done

**If Vercel build fails:**
- Check the build logs in Vercel dashboard
- Make sure all environment variables are set
- Verify your Supabase credentials are correct

**Need your Supabase credentials?**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Settings → API
4. Copy the "Project URL" and "anon public" key

