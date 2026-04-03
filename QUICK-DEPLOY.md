# 🚀 Quick Deploy Guide - Render + Vercel

Skip local setup and deploy directly to production!

---

## 📋 Prerequisites

1. **GitHub Account** - [Sign up](https://github.com/join)
2. **Render Account** - [Sign up](https://render.com/register)
3. **Vercel Account** - [Sign up](https://vercel.com/signup)
4. **Google Cloud Account** - [Sign up](https://console.cloud.google.com)

---

## Step 1: Push Code to GitHub

### 1.1 Initialize Git Repository

```powershell
# From project root
git init
git add .
git commit -m "Initial commit - Madhur Asha Enterprises"
```

### 1.2 Create GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Repository name: `madhur-asha-ledger`
3. Description: `Business Management Portal with GST Calculator`
4. Visibility: **Private** (recommended) or Public
5. Click **"Create repository"**

### 1.3 Push to GitHub

```powershell
# Replace YOUR_USERNAME with your GitHub username
git remote add origin https://github.com/YOUR_USERNAME/madhur-asha-ledger.git
git branch -M main
git push -u origin main
```

---

## Step 2: Set Up Google OAuth

### 2.1 Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click **"Select a project"** → **"New Project"**
3. Project name: `Madhur Asha Enterprises`
4. Click **"Create"**

### 2.2 Enable Google+ API

1. In the project, go to **"APIs & Services"** → **"Library"**
2. Search for **"Google+ API"**
3. Click on it and click **"Enable"**

### 2.3 Create OAuth Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"OAuth 2.0 Client ID"**
3. If prompted, configure consent screen:
   - User Type: **External**
   - App name: `Madhur Asha Enterprises`
   - User support email: Your email
   - Developer contact: Your email
   - Click **"Save and Continue"** through all steps

4. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: `Madhur Asha Production`
   
5. **Authorized JavaScript origins** (add these):
   ```
   https://YOUR-APP-NAME.onrender.com
   ```
   (We'll update this after creating Render service)

6. **Authorized redirect URIs** (add these):
   ```
   https://YOUR-APP-NAME.onrender.com/api/auth/google/callback
   ```
   (We'll update this after creating Render service)

7. Click **"Create"**
8. **IMPORTANT**: Copy and save:
   - Client ID (looks like: `xxxxx.apps.googleusercontent.com`)
   - Client Secret (looks like: `GOCSPX-xxxxx`)

---

## Step 3: Deploy Backend to Render

### 3.1 Create Render Account

1. Go to [render.com](https://render.com)
2. Click **"Get Started"**
3. Sign up with GitHub (recommended)
4. Authorize Render to access your repositories

### 3.2 Deploy Using Blueprint

1. In Render Dashboard, click **"New +"** → **"Blueprint"**
2. Connect your GitHub repository: `madhur-asha-ledger`
3. Render will detect `render.yaml` automatically
4. Click **"Apply"**

Render will create:
- ✅ PostgreSQL database (free tier)
- ✅ Web service for API (free tier)

Wait for deployment to complete (~5-10 minutes for first deploy)

### 3.3 Configure Environment Variables

1. Go to your web service in Render Dashboard
2. Click **"Environment"** tab
3. Add these variables:

**GOOGLE_CLIENT_ID**
- Value: Paste your Google Client ID from Step 2.3
- Click **"Save Changes"**

**GOOGLE_CLIENT_SECRET**
- Value: Paste your Google Client Secret from Step 2.3
- Click **"Save Changes"**

**GOOGLE_CALLBACK_URL**
- Value: `https://YOUR-APP-NAME.onrender.com/api/auth/google/callback`
- Replace `YOUR-APP-NAME` with your actual Render service name
- Click **"Save Changes"**

**FRONTEND_URL**
- Value: `https://madhur-asha.vercel.app` (we'll update this after Vercel deploy)
- Click **"Save Changes"**

### 3.4 Note Your Backend URL

Your backend URL will be: `https://YOUR-APP-NAME.onrender.com`

**IMPORTANT**: Copy this URL - you'll need it for Vercel!

### 3.5 Run Database Migrations

1. In Render Dashboard → Your web service
2. Click **"Shell"** tab (top right)
3. Wait for shell to connect
4. Run these commands:
   ```bash
   cd lib/db
   pnpm run push
   ```
5. You should see: "✓ Changes applied successfully"

---

## Step 4: Update Google OAuth URLs

Now that you have your Render URL, update Google OAuth:

1. Go back to [Google Cloud Console](https://console.cloud.google.com)
2. Go to **"APIs & Services"** → **"Credentials"**
3. Click on your OAuth 2.0 Client ID
4. Update **Authorized JavaScript origins**:
   ```
   https://YOUR-APP-NAME.onrender.com
   ```
5. Update **Authorized redirect URIs**:
   ```
   https://YOUR-APP-NAME.onrender.com/api/auth/google/callback
   ```
6. Click **"Save"**

---

## Step 5: Deploy Frontend to Vercel

### 5.1 Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"**
3. Sign up with GitHub (recommended)
4. Authorize Vercel to access your repositories

### 5.2 Import Project

1. In Vercel Dashboard, click **"Add New..."** → **"Project"**
2. Find and select your repository: `madhur-asha-ledger`
3. Click **"Import"**

### 5.3 Configure Build Settings

Vercel will auto-detect `vercel.json`, but verify:

- **Framework Preset**: Vite
- **Root Directory**: `./` (leave as is)
- **Build Command**: Auto-detected from vercel.json
- **Output Directory**: Auto-detected from vercel.json

### 5.4 Add Environment Variable

Click **"Environment Variables"**:

**Variable Name**: `VITE_API_URL`
**Value**: `https://YOUR-APP-NAME.onrender.com` (your Render backend URL)
**Environments**: Check all (Production, Preview, Development)

Click **"Add"**

### 5.5 Deploy

1. Click **"Deploy"**
2. Wait for deployment (~2-3 minutes)
3. You'll get a URL like: `https://madhur-asha-xxx.vercel.app`

### 5.6 Set Custom Domain (Optional)

1. In Vercel Dashboard → Your project → **"Settings"** → **"Domains"**
2. Add your custom domain
3. Follow Vercel's DNS configuration instructions

---

## Step 6: Update Backend with Frontend URL

1. Go back to Render Dashboard
2. Go to your web service → **"Environment"** tab
3. Update **FRONTEND_URL**:
   - Value: `https://your-app.vercel.app` (your actual Vercel URL)
4. Click **"Save Changes"**
5. Service will auto-redeploy

---

## Step 7: Update Google OAuth with Vercel URL

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Go to **"APIs & Services"** → **"Credentials"**
3. Click on your OAuth 2.0 Client ID
4. Add to **Authorized JavaScript origins**:
   ```
   https://your-app.vercel.app
   ```
5. Click **"Save"**

---

## Step 8: Test Your Deployment! 🎉

### 8.1 Test Backend Health

Visit: `https://YOUR-APP-NAME.onrender.com/api/healthz`

Should return:
```json
{"status":"ok"}
```

### 8.2 Test Frontend

1. Visit: `https://your-app.vercel.app`
2. You should see the landing page
3. Click **"Sign in with Google"**
4. Authorize the application
5. You should be redirected to the dashboard!

### 8.3 Test Calculator

1. Click **"Calculator"** in the sidebar
2. Enter some values:
   - Purchase Amount: `10000`
   - Sale Amount: `15000`
3. See the profit calculation
4. Click **"Save Calculation"**
5. Should see success message!

---

## 🎯 You're Live!

Your application is now deployed and accessible worldwide:

- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://YOUR-APP-NAME.onrender.com`
- **Database**: Managed by Render (PostgreSQL)

---

## 🔄 Continuous Deployment

Both platforms now auto-deploy on git push:

```powershell
# Make changes to your code
git add .
git commit -m "Your changes"
git push

# Render and Vercel will automatically deploy!
```

---

## 📊 Free Tier Limits

### Render (Free)
- ✅ 750 hours/month web service
- ✅ PostgreSQL: 1GB storage
- ⚠️ Spins down after 15 min inactivity
- ⚠️ Cold start: ~30 seconds

### Vercel (Free)
- ✅ 100GB bandwidth/month
- ✅ Unlimited deployments
- ✅ Automatic HTTPS
- ✅ Global CDN

---

## 🐛 Troubleshooting

### "Application failed to respond" (Render)

**Check Render Logs:**
1. Render Dashboard → Your service → **"Logs"** tab
2. Look for errors

**Common Issues:**
- Database not connected → Check DATABASE_URL is set
- Build failed → Check build logs
- Port issue → Render auto-sets PORT

### "Failed to fetch" (Frontend)

**Check:**
1. VITE_API_URL is set correctly in Vercel
2. Backend is running (visit /api/healthz)
3. CORS is configured (FRONTEND_URL on backend)

### "OAuth Error"

**Check:**
1. Google OAuth credentials are correct
2. Redirect URIs match exactly (no trailing slashes)
3. JavaScript origins are set correctly

### "Session not persisting"

**Check:**
1. Cookies are enabled in browser
2. HTTPS is being used (both platforms)
3. SESSION_SECRET is set on Render

---

## 🔒 Security Checklist

Before sharing with users:

- [x] HTTPS enabled (automatic on both platforms)
- [x] SESSION_SECRET is random (auto-generated by Render)
- [x] Google OAuth configured correctly
- [x] CORS restricted to your frontend URL
- [ ] Review admin emails in code (currently hardcoded)
- [ ] Set up monitoring/alerts
- [ ] Configure database backups (Render paid plans)

---

## 📈 Next Steps

1. **Test thoroughly** - Try all features
2. **Invite users** - Share your Vercel URL
3. **Monitor usage** - Check Render/Vercel dashboards
4. **Plan upgrades** - When you hit free tier limits
5. **Add features** - See roadmap in README.md

---

## 💰 When to Upgrade

### Render ($7/month)
- Need 24/7 uptime (no cold starts)
- Need more database storage
- Need database backups

### Vercel ($20/month)
- Exceed 100GB bandwidth
- Need team collaboration
- Need advanced analytics

---

## 🎉 Congratulations!

You've successfully deployed a full-stack application with:
- ✅ React frontend on Vercel
- ✅ Express backend on Render
- ✅ PostgreSQL database
- ✅ Google OAuth authentication
- ✅ Automatic deployments
- ✅ HTTPS everywhere

**Your business management portal is now live!** 🚀