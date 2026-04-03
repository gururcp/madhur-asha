import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import passport from "passport";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";
import { setupPassport } from "./lib/auth.js";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

const isProd = process.env.NODE_ENV === "production";

// Trust proxy - critical for Render deployment
app.set("trust proxy", 1);

// CORS configuration - must be explicit for credentials
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
// Normalize: remove trailing slash and ensure we have the base URL
const normalizedFrontendUrl = frontendUrl.replace(/\/$/, "");

logger.info({ frontendUrl: normalizedFrontendUrl }, "CORS configured for frontend URL");

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      // Normalize the incoming origin
      const normalizedOrigin = origin.replace(/\/$/, "");
      
      // Check if origin matches (exact match or starts with for subdomains)
      if (normalizedOrigin === normalizedFrontendUrl ||
          normalizedOrigin.startsWith(normalizedFrontendUrl)) {
        callback(null, true);
      } else {
        logger.warn({ origin, expected: normalizedFrontendUrl }, "CORS origin rejected");
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PgSession = connectPgSimple(session);

// Session store with error handling
const sessionStore = new PgSession({
  conString: process.env.DATABASE_URL,
  tableName: "user_sessions",
  createTableIfMissing: false,
  errorLog: (err) => {
    logger.error({ err }, "Session store error");
  },
});

app.use(
  session({
    store: sessionStore,
    name: "madhur.sid",
    secret: process.env.SESSION_SECRET || "madhur-asha-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProd,
      httpOnly: true,
      sameSite: isProd ? "none" : "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
      // DO NOT set domain for cross-origin cookies with sameSite: "none"
      // The browser will handle this correctly
    },
    proxy: isProd,
  })
);

setupPassport();
app.use(passport.initialize());
app.use(passport.session());

app.use("/api", router);

export default app;
