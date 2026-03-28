import { Router, type IRouter } from "express";
import passport from "passport";

const router: IRouter = Router();

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/?error=auth_failed" }),
  (req, res) => {
    const user = req.user as any;
    if (user?.status === "pending") {
      res.redirect("/?status=pending");
    } else if (user?.status === "rejected") {
      res.redirect("/?status=rejected");
    } else {
      res.redirect("/dashboard");
    }
  }
);

router.get("/me", (req, res) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const user = req.user as any;
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
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out" });
    });
  });
});

export default router;
