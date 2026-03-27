import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { sendAccessRequestEmail } from "./email.js";
import { logger } from "./logger.js";

const ADMIN_EMAILS = ["manishkeche26@gmail.com", "guru2rcp@gmail.com"];

export function setupPassport() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    logger.warn("GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set — Google OAuth disabled");
    return;
  }

  const callbackURL = process.env.GOOGLE_CALLBACK_URL || "/api/auth/google/callback";

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value || "";
          const googleId = profile.id;

          const existing = await db.select().from(usersTable).where(eq(usersTable.googleId, googleId)).limit(1);

          if (existing.length > 0) {
            return done(null, existing[0]);
          }

          const isAdmin = ADMIN_EMAILS.includes(email);
          const role = isAdmin ? "admin" : "calc_only";
          const status = isAdmin ? "approved" : "pending";

          const [newUser] = await db
            .insert(usersTable)
            .values({
              googleId,
              email,
              name: profile.displayName,
              picture: profile.photos?.[0]?.value,
              role,
              status,
              assignedCustomerIds: "[]",
            })
            .returning();

          if (!isAdmin) {
            await sendAccessRequestEmail({ name: newUser.name, email: newUser.email, id: newUser.id });
          }

          return done(null, newUser);
        } catch (err) {
          return done(err as Error);
        }
      }
    )
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
      done(null, user || null);
    } catch (err) {
      done(err);
    }
  });
}

export function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

export function requireAdmin(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

export function requireApproved(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (req.user?.status !== "approved") {
    return res.status(403).json({ error: "Account pending approval" });
  }
  next();
}
