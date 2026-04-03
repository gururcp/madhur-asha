# 🚀 Complete Setup Guide - Neon + Render + Vercel

**Forever Free Setup for 2 Users**

This guide sets up:
- **Neon** - PostgreSQL database (forever free)
- **Render** - Backend API hosting (forever free)
- **Vercel** - Frontend hosting (forever free)

---

## 📋 What You'll Get

✅ Forever free (no expiration)
✅ Works for local development
✅ Works for production
✅ No code changes needed
✅ Perfect for 2 users

---

## Part 1: Set Up Neon Database (5 minutes)

### Step 1.1: Create Neon Account

1. Go to [neon.tech](https://neon.tech)
2. Click **"Sign Up"**
3. Sign up with GitHub (recommended)
4. Verify your email

### Step 1.2: Create Database

1. After login, click **"Create a project"**
2. Project name: `madhur-asha-db`
3. Region: **Asia Pacific (Singapore)** (closest to India)
4. PostgreSQL version: **16** (latest)
5. Click **"Create project"**

### Step 1.3: Get Connection String

1. In your project dashboard, you'll see **"Connection string"**
2. Click **"Copy"** next to the connection string
3. It looks like:
   ```
   postgresql://username:password@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```
4. **Save this** - you'll need it for both local and production!

### Step 1.4: Create Development Database (Optional)

If you want separate dev and prod databases:

1. In Neon dashboard, click **"Create a project"** again
2. Project name: `madhur-asha-dev`
3. Same region and version
4. Copy this connection string for local development

---

## Part 2: Set Up Local Development (10 minutes)

### Step 2.1: Create .env File

```powershell
# From project root
cp .env.example .env
```

### Step 2.2: Edit .env File

Open `.env` and add your Neon connection string:

```bash
# Database - Use your Neon connection string
DATABASE_URL=postgresql://username:password@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require

# Server
PORT=3000
NODE_ENV=development

# Session - Generate a random string
SESSION_SECRET=your-random-secret-key-change-this

# Google OAuth - Get from Google Cloud Console
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### Step 2.3: Set Up Google OAuth (First Time Only)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project: `Madhur Asha Enterprises`
3. Enable **Google+ API**
4. Create **OAuth 2.0 Client ID**:
   - Application type: **Web application**
   - Name: `Madhur Asha Local Dev`
   - Authorized JavaScript origins:
     ```
     http://localhost:5173
     http://localhost:3000
     ```
   - Authorized redirect URIs:
     ```
     http://localhost:3000/api/auth/google/callback
     ```
5. Copy Client ID and Client Secret to your `.env` file

### Step 2.4: Install Dependencies

```powershell
# From project root
pnpm install
```

### Step 2.5: Push Database Schema to Neon

```powershell
cd lib/db
pnpm run push
cd ../..
```

You should see: ✓ Changes applied successfully

### Step 2.6: Start Development Servers

**Terminal 1 - Backend:**
```powershell
cd artifacts/api-server
pnpm run dev
```

**Terminal 2 - Frontend:**
```powershell
cd artifacts/madhur-asha
pnpm run dev
```

### Step 2.7: Test Locally

1. Open `http://localhost:5173`
2. Click "Sign in with Google"
3. Login with your admin email
4. Test the calculator!

---

## Part 3: Deploy to Production (20 minutes)

### Step 3.1: Push to GitHub

```powershell
git init
git add .
git commit -m "Initial commit with Neon database"
git remote add origin https://github.com/YOUR_USERNAME/madhur-asha-ledger.git
git push -u origin main
```

### Step 3.2: Update Google OAuth for Production

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Go to your OAuth Client ID
3. Add production URLs (we'll update these after deployment):
   - Authorized JavaScript origins:
     ```
     https://YOUR-APP.onrender.com
     https://your-app.vercel.app
     ```
   - Authorized redirect URIs:
     ```
     https://YOUR-APP.onrender.com/api/auth/google/callback
     ```

### Step 3.3: Deploy Backend to Render

1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click **"New +"** → **"Web Service"**
4. Connect your repository
5. Configure:
   - **Name**: `madhur-asha-api`
   - **Region**: Singapore
   - **Branch**: main
   - **Root Directory**: `./`
   - **Runtime**: Node
   - **Build Command**: `pnpm install && pnpm run build`
   - **Start Command**: `cd artifacts/api-server && pnpm run start`
   - **Plan**: Free

6. Click **"Advanced"** and add environment variables:

   | Key | Value |
   |-----|-------|
   | NODE_VERSION | 24 |
   | NODE_ENV | production |
   | DATABASE_URL | Your Neon connection string (production) |
   | SESSION_SECRET | Generate random string |
   | GOOGLE_CLIENT_ID | From Google Console |
   | GOOGLE_CLIENT_SECRET | From Google Console |
   | GOOGLE_CALLBACK_URL | https://YOUR-APP.onrender.com/api/auth/google/callback |
   | FRONTEND_URL | https://your-app.vercel.app (update after Vercel deploy) |

7. Click **"Create Web Service"**
8. Wait for deployment (~5-10 minutes)
9. Note your URL: `https://YOUR-APP.onrender.com`

### Step 3.4: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click **"Add New..."** → **"Project"**
4. Import your repository
5. Configure:
   - Framework: Vite (auto-detected)
   - Root Directory: `./`
   - Build Command: Auto-detected from vercel.json
   - Output Directory: Auto-detected

6. Add environment variable:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://YOUR-APP.onrender.com` (your Render URL)
   - **Environments**: All

7. Click **"Deploy"**
8. Wait for deployment (~2-3 minutes)
9. Note your URL: `https://your-app.vercel.app`

### Step 3.5: Update Backend with Frontend URL

1. Go to Render dashboard
2. Your web service → **Environment** tab
3. Update **FRONTEND_URL** to your Vercel URL
4. Click **"Save Changes"**

### Step 3.6: Update Google OAuth URLs

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Update OAuth Client with actual URLs:
   - Authorized JavaScript origins:
     ```
     https://madhur-asha-api.onrender.com
     https://madhur-asha.vercel.app
     ```
   - Authorized redirect URIs:
     ```
     https://madhur-asha-api.onrender.com/api/auth/google/callback
     ```
3. Click **"Save"**

### Step 3.7: Test Production

1. Visit your Vercel URL
2. Sign in with Google
3. Test the calculator
4. Save a calculation
5. Check it appears in history

---

## Part 4: Database Management

### View Your Data (Neon Console)

1. Go to [console.neon.tech](https://console.neon.tech)
2. Select your project
3. Click **"SQL Editor"**
4. Run queries:
   ```sql
   -- View all users
   SELECT * FROM users;
   
   -- View all customers
   SELECT * FROM customers;
   
   -- View all calculations
   SELECT * FROM calculations;
   ```

### Backup Your Data

Neon automatically backs up your data, but you can also:

```powershell
# Export database (from local)
pg_dump "your-neon-connection-string" > backup.sql

# Import database
psql "your-neon-connection-string" < backup.sql
```

---

## 🔄 Development Workflow

### Making Changes

1. **Edit code locally**
2. **Test locally** (both servers running)
3. **Commit and push**:
   ```powershell
   git add .
   git commit -m "Your changes"
   git push
   ```
4. **Auto-deploy** - Render and Vercel deploy automatically!

### Database Changes

1. **Edit schema** in `lib/db/src/schema/`
2. **Push to Neon**:
   ```powershell
   cd lib/db
   pnpm run push
   ```
3. **Commit and push** code
4. **Production auto-updates** on next deploy

---

## 💰 Cost Breakdown (Forever Free!)

### Neon (Free Forever)
- ✅ 0.5GB storage
- ✅ Unlimited projects
- ✅ Automatic backups
- ✅ No time limit
- ✅ No credit card required

### Render (Free Forever)
- ✅ 750 hours/month
- ✅ Automatic HTTPS
- ⚠️ Spins down after 15 min (cold start ~30s)

### Vercel (Free Forever)
- ✅ 100GB bandwidth/month
- ✅ Global CDN
- ✅ Automatic HTTPS
- ✅ Instant deployments

**Total Cost: $0/month forever!**

---

## 🐛 Troubleshooting

### "Connection refused" (Database)

**Check:**
1. Neon connection string is correct
2. Connection string includes `?sslmode=require`
3. No firewall blocking port 5432

### "Application failed to respond" (Render)

**Check Render logs:**
1. Dashboard → Your service → Logs
2. Look for database connection errors
3. Verify DATABASE_URL is set correctly

### "Failed to fetch" (Frontend)

**Check:**
1. VITE_API_URL points to Render URL
2. Backend is running (visit /api/healthz)
3. CORS configured (FRONTEND_URL on backend)

### "OAuth Error"

**Check:**
1. All URLs in Google Console match exactly
2. No trailing slashes in URLs
3. HTTPS is used in production

---

## 📊 Monitoring

### Neon Dashboard
- View database size
- Monitor queries
- Check connection count

### Render Dashboard
- View logs
- Monitor CPU/memory
- Check deployment status

### Vercel Dashboard
- View deployments
- Check bandwidth usage
- Monitor errors

---

## 🔒 Security Checklist

- [x] HTTPS everywhere (automatic)
- [x] Secure session cookies
- [x] Google OAuth configured
- [x] Database SSL enabled (Neon default)
- [x] CORS restricted to frontend
- [ ] Review admin emails in code
- [ ] Set up monitoring alerts

---

## 🎯 Advantages of This Setup

✅ **Forever Free** - No expiration dates
✅ **No Local PostgreSQL** - Use Neon for everything
✅ **Easy Testing** - Same database for dev and prod
✅ **Auto Backups** - Neon handles it
✅ **Fast Deploys** - Push to GitHub = auto-deploy
✅ **Scalable** - Can upgrade any component later

---

## 📈 When to Upgrade

### Neon ($19/month)
- Need more than 0.5GB storage
- Need better performance
- Need point-in-time recovery

### Render ($7/month)
- Need 24/7 uptime (no cold starts)
- Need more CPU/memory

### Vercel ($20/month)
- Exceed 100GB bandwidth
- Need team features

---

## 🎉 You're All Set!

Your application is now:
- ✅ Running locally with Neon database
- ✅ Deployed to production (Render + Vercel)
- ✅ Using forever-free services
- ✅ Ready for 2 users to track bills

**No expiration. No credit card. No surprises!**