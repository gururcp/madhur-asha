import { Router, type IRouter } from "express";
import passport from "passport";
import crypto from "crypto";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

// In-memory store for one-time auth tokens
// In production, use Redis for distributed systems
const authTokens = new Map<string, { userId: number; expiresAt: number }>();

// Cleanup expired tokens every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [token, entry] of authTokens.entries()) {
    if (entry.expiresAt < now) {
      authTokens.delete(token);
    }
  }
}, 5 * 60 * 1000);

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get(
  "/google/callback",
  (req, res, next) => {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    passport.authenticate("google", {
      failureRedirect: `${frontendUrl}/?error=auth_failed`
    })(req, res, next);
  },
  (req, res) => {
    const user = req.user as any;
    
    if (!user) {
      console.error("OAuth callback: No user found after authentication");
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      return res.redirect(`${frontendUrl}/?error=no_user`);
    }
    
    console.log("OAuth callback: User authenticated", {
      userId: user.id,
      email: user.email,
      sessionID: req.sessionID,
      hasSession: !!req.session,
    });
    
    // Get frontend URL from environment or use default for local dev
    const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
    const basePath = process.env.BASE_PATH || "/";
    const normalizedBasePath =
      basePath === "/" ? "" : basePath.endsWith("/") ? basePath.slice(0, -1) : basePath;
    
    // Generate a short-lived one-time token for auth handoff
    // This bypasses the cross-domain cookie blocking issue
    const token = crypto.randomBytes(32).toString("hex");
    authTokens.set(token, {
      userId: user.id,
      expiresAt: Date.now() + 60_000, // 1 minute expiry
    });
    
    console.log("OAuth callback: Generated auth token, redirecting to frontend");
    
    // Redirect to frontend URL with path and token
    const redirectTo = (path: string) => {
      // Ensure path starts with / and no double slashes
      const normalizedPath = path.startsWith("/") ? path : `/${path}`;
      const fullUrl = `${frontendUrl}${normalizedBasePath}${normalizedPath}`;
      
      // Add auth token to URL
      const urlWithToken = `${fullUrl}?auth_token=${token}`;
      
      console.log("OAuth callback: Redirecting to", urlWithToken);
      res.redirect(urlWithToken);
    };

    if (user?.status === "pending") {
      redirectTo("/?status=pending");
    } else if (user?.status === "rejected") {
      redirectTo("/?status=rejected");
    } else {
      redirectTo("/dashboard");
    }
  }
);

router.get("/exchange-token", async (req, res) => {
  const token = req.query.token as string;
  
  console.log("/api/auth/exchange-token called", { hasToken: !!token });
  
  if (!token) {
    return res.status(400).json({ error: "No token provided" });
  }

  const entry = authTokens.get(token);
  if (!entry || entry.expiresAt < Date.now()) {
    authTokens.delete(token);
    console.log("/api/auth/exchange-token: Invalid or expired token");
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  // One-time use token
  authTokens.delete(token);

  try {
    // Fetch user from database
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, entry.userId))
      .limit(1);

    if (!user) {
      console.log("/api/auth/exchange-token: User not found");
      return res.status(401).json({ error: "User not found" });
    }

    // Log the user in using Passport
    req.login(user, (err) => {
      if (err) {
        console.error("/api/auth/exchange-token: Login failed", err);
        return res.status(500).json({ error: "Login failed" });
      }
      
      // Save the session
      req.session.save((saveErr) => {
        if (saveErr) {
          console.error("/api/auth/exchange-token: Session save failed", saveErr);
          return res.status(500).json({ error: "Session save failed" });
        }
        
        console.log("/api/auth/exchange-token: Success", {
          userId: user.id,
          sessionID: req.sessionID
        });
        
        res.json({
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            picture: user.picture,
            role: user.role,
            status: user.status,
          }
        });
      });
    });
  } catch (error) {
    console.error("/api/auth/exchange-token: Error", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/me", (req, res) => {
  console.log("/api/auth/me called", {
    isAuthenticated: req.isAuthenticated(),
    hasUser: !!req.user,
    hasSession: !!req.session,
    sessionID: req.sessionID,
    cookies: req.headers.cookie,
  });
  
  if (!req.isAuthenticated() || !req.user) {
    console.log("/api/auth/me: User not authenticated");
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  const user = req.user as any;
  console.log("/api/auth/me: User authenticated", { userId: user.id, email: user.email });
  
  res.json({
    id: user.id,
    googleId: user.googleId,
    email: user.email,
    name: user.name,
    picture: user.picture,
    role: user.role,
    status: user.status,
    assignedCustomerIds: JSON.parse(user.assignedCustomerIds || "[]"),
    createdAt: user.createdAt,
  });
});

router.post("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy((destroyErr) => {
      if (destroyErr) return next(destroyErr);
      res.clearCookie("madhur.sid");
      res.json({ message: "Logged out" });
    });
  });
});

export default router;
