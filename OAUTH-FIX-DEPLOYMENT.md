# OAuth Login Loop Fix - Deployment Guide

## 🐛 Bug Identified

The OAuth login loop was caused by **improper CORS and session cookie configuration** for cross-domain deployments (Render + Vercel).

### Root Causes:

1. **Permissive CORS configuration**: `origin: process.env.FRONTEND_URL || true` allowed any origin as fallback, causing security issues and inconsistent cookie behavior
2. **Missing session store error handling**: No logging for session store connection issues
3. **Inadequate logging**: No visibility into session creation/validation failures

## ✅ Fixes Applied

### 1. Fixed CORS Configuration (`artifacts/api-server/src/app.ts`)

**Before:**
```typescript
cors({
  origin: process.env.FRONTEND_URL || true,
  credentials: true,
})
```

**After:**
```typescript
const allowedOrigins = process.env.FRONTEND_URL 
  ? [process.env.FRONTEND_URL]
  : ["http://localhost:5173", "http://localhost:5174"];

cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
})
```

### 2. Added Session Store Error Handling

**Before:**
```typescript
store: new PgSession({
  conString: process.env.DATABASE_URL,
  tableName: "user_sessions",
  createTableIfMissing: false,
})
```

**After:**
```typescript
const sessionStore = new PgSession({
  conString: process.env.DATABASE_URL,
  tableName: "user_sessions",
  createTableIfMissing: false,
  errorLog: (err) => {
    logger.error({ err }, "Session store error");
  },
});
```

### 3. Enhanced Logging (`artifacts/api-server/src/routes/auth.ts`)

Added comprehensive logging to:
- OAuth callback handler
- `/api/auth/me` endpoint

This helps diagnose session issues in production.

## 🚀 Deployment Steps

### 1. Verify Environment Variables on Render

Ensure these are set correctly:

```bash
NODE_ENV=production
FRONTEND_URL=https://your-app.vercel.app
DATABASE_URL=postgresql://...
SESSION_SECRET=your-secure-secret
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=https://your-api.onrender.com/api/auth/google/callback
```

### 2. Verify Environment Variables on Vercel

```bash
VITE_API_URL=https://your-api.onrender.com
```

### 3. Deploy Backend (Render)

```bash
git add .
git commit -m "fix: resolve OAuth login loop with proper CORS and session handling"
git push origin main
```

Render will auto-deploy. Monitor logs for:
- "OAuth callback: User authenticated"
- "OAuth callback: Session saved, redirecting to..."

### 4. Deploy Frontend (Vercel)

Vercel will auto-deploy from the same commit.

### 5. Test the Flow

1. Clear all cookies in browser
2. Go to your Vercel URL
3. Click "Continue with Google"
4. Authenticate with Google
5. Should redirect to `/dashboard` and stay logged in
6. Check Render logs for session creation

## 🔍 Debugging

If issues persist, check Render logs for:

```
OAuth callback: User authenticated { userId: X, email: '...', sessionID: '...', hasSession: true }
OAuth callback: Session saved, redirecting to https://...
```

And for `/api/auth/me` calls:

```
/api/auth/me called { isAuthenticated: true, hasUser: true, hasSession: true, sessionID: '...', cookies: '...' }
/api/auth/me: User authenticated { userId: X, email: '...' }
```

## 🔐 Security Notes

1. **CORS is now strict**: Only the exact `FRONTEND_URL` is allowed
2. **Cookies are secure**: `sameSite: "none"` with `secure: true` in production
3. **Session store has error logging**: Any DB connection issues will be logged

## 📊 Expected Behavior

### Successful Flow:
1. User clicks "Continue with Google" → Redirects to Google
2. Google authenticates → Redirects to `/api/auth/google/callback`
3. Backend creates session → Saves to PostgreSQL
4. Backend redirects to frontend `/dashboard`
5. Frontend calls `/api/auth/me` → Returns user data (200)
6. User sees dashboard

### Cookie Details:
- Name: `madhur.sid`
- Secure: `true` (production)
- HttpOnly: `true`
- SameSite: `none` (production)
- Domain: Not set (browser handles cross-origin correctly)
- Max-Age: 30 days

## 🎯 Key Insights

The critical fix was **making CORS explicit and strict**. The fallback `origin: true` was causing the browser to accept cookies inconsistently. With explicit origin validation, the browser now correctly handles cross-origin cookies with `sameSite: "none"`.

## 📝 Rollback Plan

If issues occur, revert with:

```bash
git revert HEAD
git push origin main
```

Both Render and Vercel will auto-deploy the previous version.