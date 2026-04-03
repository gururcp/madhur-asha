# Deployment Guide - Madhur Asha Enterprises

This guide covers deploying the application to **Render** (backend + PostgreSQL) and **Vercel** (frontend).

---

## 📋 Prerequisites

1. **GitHub Account** - Push your code to GitHub
2. **Render Account** - Sign up at [render.com](https://render.com)
3. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
4. **Google OAuth Credentials** - Get from [Google Cloud Console](https://console.cloud.google.com)

---

## 🔧 Local Development Setup (Windows)

### Step 1: Install Dependencies

```powershell
# From project root
pnpm install
```

### Step 2: Set Up Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` with your values:
- `DATABASE_URL` - Your local PostgreSQL connection string
- `GOOGLE_CLIENT_ID` - From Google Cloud Console
- `GOOGLE_CLIENT_SECRET` - From Google Cloud Console
- `SESSION_SECRET` - Generate a random string

### Step 3: Set Up Database

```powershell
# Push database schema
cd lib/db
pnpm run push
cd ../..
```

### Step 4: Start Development Servers

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

Access the app at `http://localhost:5173`

---

## 🚀 Deployment to Render (Backend)

### Step 1: Push Code to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/madhur-asha-ledger.git
git push -u origin main
```

### Step 2: Create Render Account

1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Authorize Render to access your repositories

### Step 3: Deploy Using Blueprint

1. Click **"New +"** → **"Blueprint"**
2. Connect your GitHub repository
3. Render will detect `render.yaml` and create:
   - PostgreSQL database (free tier)
   - Web service for API (free tier)

### Step 4: Configure Environment Variables

In Render dashboard, go to your web service and add:

**Required Variables:**
- `GOOGLE_CLIENT_ID` - Your Google OAuth Client ID
- `GOOGLE_CLIENT_SECRET` - Your Google OAuth Client Secret
- `GOOGLE_CALLBACK_URL` - `https://YOUR-APP.onrender.com/api/auth/google/callback`
- `FRONTEND_URL` - Your Vercel URL (add after deploying frontend)

**Auto-Generated (already configured):**
- `DATABASE_URL` - Automatically linked to PostgreSQL
- `SESSION_SECRET` - Auto-generated
- `PORT` - Auto-generated

### Step 5: Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/google/callback` (for local dev)
   - `https://YOUR-APP.onrender.com/api/auth/google/callback` (for production)
7. Copy Client ID and Client Secret to Render environment variables

### Step 6: Run Database Migrations

After first deployment:

1. Go to Render dashboard → Your web service
2. Click **"Shell"** tab
3. Run:
   ```bash
   cd lib/db
   pnpm run push
   ```

---

## 🌐 Deployment to Vercel (Frontend)

### Step 1: Install Vercel CLI (Optional)

```powershell
npm install -g vercel
```

### Step 2: Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Vercel will detect `vercel.json` configuration
5. Click **"Deploy"**

### Step 3: Configure Environment Variables

In Vercel dashboard → Your project → **Settings** → **Environment Variables**:

Add:
- **Key:** `VITE_API_URL`
- **Value:** `https://YOUR-APP.onrender.com` (your Render backend URL)
- **Environments:** Production, Preview, Development

### Step 4: Update Backend CORS

Go back to Render → Your web service → Environment Variables:

Update `FRONTEND_URL` to your Vercel URL:
- `https://YOUR-APP.vercel.app`

### Step 5: Redeploy

Trigger a redeploy on both platforms to apply the new environment variables.

---

## 🔐 Google OAuth Configuration

### Update Authorized Origins

In Google Cloud Console → Credentials → Your OAuth Client:

**Authorized JavaScript origins:**
- `http://localhost:5173` (local dev)
- `https://YOUR-APP.vercel.app` (production)
- `https://YOUR-APP.onrender.com` (backend)

**Authorized redirect URIs:**
- `http://localhost:3000/api/auth/google/callback` (local dev)
- `https://YOUR-APP.onrender.com/api/auth/google/callback` (production)

---

## ✅ Verify Deployment

### Backend Health Check

Visit: `https://YOUR-APP.onrender.com/api/healthz`

Should return:
```json
{"status":"ok"}
```

### Frontend

Visit: `https://YOUR-APP.vercel.app`

Should show the landing page with Google login button.

### Test Login Flow

1. Click "Sign in with Google"
2. Authorize the application
3. Should redirect to dashboard (if admin) or pending approval page

---

## 🐛 Troubleshooting

### Backend Issues

**"Application failed to respond"**
- Check Render logs for errors
- Verify DATABASE_URL is set
- Ensure database migrations ran successfully

**"OAuth error"**
- Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
- Check redirect URIs in Google Console match exactly
- Ensure GOOGLE_CALLBACK_URL is correct

**"Session not persisting"**
- Verify SESSION_SECRET is set
- Check CORS configuration allows credentials
- Ensure cookies are enabled in browser

### Frontend Issues

**"Failed to fetch"**
- Verify VITE_API_URL points to correct backend
- Check CORS is configured on backend
- Ensure backend is running

**"Redirect loop"**
- Clear browser cookies
- Check FRONTEND_URL on backend matches Vercel URL

### Database Issues

**"Connection refused"**
- Verify DATABASE_URL format
- Check database is running on Render
- Ensure IP whitelist allows connections (Render handles this)

---

## 📊 Monitoring

### Render

- View logs: Dashboard → Your service → Logs
- Monitor metrics: Dashboard → Your service → Metrics
- Database: Dashboard → Your database → Metrics

### Vercel

- View deployments: Dashboard → Your project → Deployments
- Check logs: Click on deployment → View Function Logs
- Analytics: Dashboard → Your project → Analytics

---

## 🔄 Continuous Deployment

Both Render and Vercel support automatic deployments:

1. **Push to GitHub** → Automatic deployment
2. **Pull Request** → Preview deployment (Vercel)
3. **Merge to main** → Production deployment

---

## 💰 Cost Breakdown

### Free Tier Limits

**Render (Free):**
- 750 hours/month web service
- PostgreSQL: 1GB storage, 97 connection limit
- Spins down after 15 minutes of inactivity
- Spins up on first request (cold start ~30s)

**Vercel (Free):**
- 100GB bandwidth/month
- Unlimited deployments
- Automatic HTTPS
- Global CDN

### Upgrade Recommendations

When to upgrade:
- **Render:** If you need 24/7 uptime (no cold starts) → $7/month
- **Vercel:** If you exceed bandwidth → $20/month Pro plan
- **Database:** If you need more storage → Render PostgreSQL paid plans

---

## 🔒 Security Checklist

Before going live:

- [ ] Change SESSION_SECRET to a strong random value
- [ ] Verify admin emails in `artifacts/api-server/src/lib/auth.ts`
- [ ] Enable HTTPS only (both platforms do this automatically)
- [ ] Set secure cookie flags (already configured)
- [ ] Review CORS origins
- [ ] Set up database backups (Render paid plans)
- [ ] Configure rate limiting (future enhancement)
- [ ] Set up monitoring/alerts

---

## 📝 Environment Variables Summary

### Backend (Render)

| Variable | Required | Description |
|----------|----------|-------------|
| DATABASE_URL | Yes | Auto-linked from PostgreSQL |
| PORT | Yes | Auto-generated |
| NODE_ENV | Yes | Set to "production" |
| SESSION_SECRET | Yes | Auto-generated |
| GOOGLE_CLIENT_ID | Yes | From Google Console |
| GOOGLE_CLIENT_SECRET | Yes | From Google Console |
| GOOGLE_CALLBACK_URL | Yes | Your Render URL + /api/auth/google/callback |
| FRONTEND_URL | Yes | Your Vercel URL |

### Frontend (Vercel)

| Variable | Required | Description |
|----------|----------|-------------|
| VITE_API_URL | Yes | Your Render backend URL |

---

## 🎯 Next Steps

After successful deployment:

1. Test all features thoroughly
2. Set up custom domain (optional)
3. Configure email notifications
4. Add monitoring/analytics
5. Set up automated backups
6. Create user documentation
7. Plan for scaling

---

## 📞 Support

If you encounter issues:

1. Check Render logs for backend errors
2. Check Vercel deployment logs for frontend errors
3. Review browser console for client-side errors
4. Verify all environment variables are set correctly
5. Test locally first to isolate deployment issues

---

## 🔗 Useful Links

- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Google OAuth Setup](https://developers.google.com/identity/protocols/oauth2)
- [Drizzle ORM Docs](https://orm.drizzle.team)
- [Express.js Docs](https://expressjs.com)
- [React Query Docs](https://tanstack.com/query)