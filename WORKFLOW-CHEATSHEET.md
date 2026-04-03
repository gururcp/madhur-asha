# 🚀 Daily Workflow Cheatsheet

Quick reference for your development and deployment workflow.

---

## 📝 Daily Development Workflow

```powershell
# 1. Start local development
cd artifacts/madhur-asha
npm run dev

# 2. Make your changes
# Edit files in VSCode

# 3. Test locally
# Verify everything works at http://localhost:5173

# 4. Commit changes
git add .
git commit -m "Brief description of changes"

# 5. Push to GitHub (triggers automatic deployment)
git push

# 6. Wait for deployment
# Render: ~3-5 minutes
# Vercel: ~2-3 minutes

# 7. Verify on production
# Visit: https://your-app.vercel.app
```

---

## 🗄️ Database Changes Workflow

```powershell
# 1. Update schema
# Edit files in lib/db/src/schema/

# 2. Test locally first
cd lib/db
pnpm run push

# 3. Test the app locally
cd ../..
cd artifacts/madhur-asha
npm run dev

# 4. If everything works, commit and push
git add .
git commit -m "Database: Description of schema changes"
git push

# 5. After Render deploys, run migration in production
# Go to Render Dashboard → Your service → Shell tab
cd lib/db
pnpm run push
exit
```

---

## 🔍 Quick Checks

### Is Backend Running?
```
https://madhur-asha-api.onrender.com/api/healthz
```
Should return: `{"status":"ok"}`

### Is Frontend Live?
```
https://your-app.vercel.app
```
Should show landing page

### Check Deployment Status

**Render**: https://dashboard.render.com
- Go to your service → Events tab

**Vercel**: https://vercel.com/dashboard
- Go to your project → Deployments tab

---

## 🐛 Quick Troubleshooting

### Changes not showing up?
```powershell
# Hard refresh browser
Ctrl + Shift + R (Windows)
Cmd + Shift + R (Mac)
```

### Deployment failed?
1. Check logs in Render/Vercel dashboard
2. Verify build works locally: `pnpm run build`
3. Check environment variables are set

### "Failed to fetch" error?
1. Check VITE_API_URL in Vercel settings
2. Check FRONTEND_URL in Render settings
3. Verify backend is running (healthz endpoint)

---

## 📊 Your Production URLs

- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://madhur-asha-api.onrender.com`
- **Database**: Neon Console - https://console.neon.tech
- **GitHub**: `https://github.com/YOUR_USERNAME/madhur-asha-ledger`

---

## 🔑 Important Environment Variables

### Render (Backend)
- `DATABASE_URL` - Neon connection string
- `GOOGLE_CLIENT_ID` - From Google Console
- `GOOGLE_CLIENT_SECRET` - From Google Console
- `GOOGLE_CALLBACK_URL` - Your Render URL + /api/auth/google/callback
- `FRONTEND_URL` - Your Vercel URL
- `SESSION_SECRET` - Auto-generated or custom

### Vercel (Frontend)
- `VITE_API_URL` - Your Render backend URL

---

## 🎯 Common Commands

```powershell
# Check git status
git status

# See what changed
git diff

# View commit history
git log --oneline -10

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Discard local changes
git checkout -- .

# Pull latest from GitHub
git pull

# Create new branch
git checkout -b feature-name

# Switch branches
git checkout main
git checkout dev

# Merge branch
git checkout main
git merge dev
```

---

## 📈 Monitoring

### Daily Checks
- [ ] Check Render logs for errors
- [ ] Check Vercel deployment status
- [ ] Monitor Neon database usage

### Weekly Checks
- [ ] Review Render metrics (CPU, memory)
- [ ] Check Vercel analytics
- [ ] Review Neon storage usage

---

## 🚨 Emergency Rollback

If deployment breaks production:

```powershell
# 1. Find last working commit
git log --oneline

# 2. Revert to that commit
git revert <commit-hash>

# 3. Push (triggers new deployment)
git push

# Or force rollback to specific commit
git reset --hard <commit-hash>
git push --force
```

**Note**: Force push will trigger redeployment on both platforms.

---

## 💡 Pro Tips

1. **Test locally first** - Always verify changes work before pushing
2. **Use meaningful commit messages** - Makes debugging easier
3. **Check logs immediately** - After deployment, check logs for errors
4. **Monitor free tier limits** - Keep an eye on usage
5. **Hard refresh after deployment** - Browser cache can show old version
6. **Use dev branch** - Keep main branch stable for production

---

## 📞 Quick Links

- **Render Dashboard**: https://dashboard.render.com
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Neon Console**: https://console.neon.tech
- **Google Cloud Console**: https://console.cloud.google.com
- **GitHub Repo**: https://github.com/YOUR_USERNAME/madhur-asha-ledger

---

**Keep this file handy for quick reference!** 📌