import { Router, type IRouter } from "express";
import passport from "passport";

const router: IRouter = Router();

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
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const basePath = process.env.BASE_PATH || "/";
    const normalizedBasePath =
      basePath === "/" ? "" : basePath.endsWith("/") ? basePath.slice(0, -1) : basePath;
    
    // Redirect to frontend URL with path
    const redirectTo = (path: string) => {
      const fullUrl = `${frontendUrl}${normalizedBasePath}${path}`;
      
      // Explicitly save session before redirecting (critical for cross-domain)
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.redirect(`${frontendUrl}/?error=session_failed`);
        }
        
        console.log("OAuth callback: Session saved, redirecting to", fullUrl);
        res.redirect(fullUrl);
      });
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
