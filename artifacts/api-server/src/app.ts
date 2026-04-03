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

// Trust proxy - critical for Render deployment behind Vercel proxy
app.set("trust proxy", 1);

// CORS configuration
// In production: Vercel proxies requests, so they appear to come from Vercel's origin
// In development: Allow localhost
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
const normalizedFrontendUrl = frontendUrl.replace(/\/$/, "");

logger.info({ frontendUrl: normalizedFrontendUrl, isProd }, "CORS configured");

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (same-origin requests from Vercel proxy, Postman, etc.)
      if (!origin) return callback(null, true);
      
      // Normalize the incoming origin
      const normalizedOrigin = origin.replace(/\/$/, "");
      
      // Check if origin matches
      if (normalizedOrigin === normalizedFrontendUrl ||
          normalizedOrigin.startsWith(normalizedFrontendUrl) ||
          normalizedOrigin.startsWith("http://localhost")) {
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
      // CRITICAL: sameSite must be "none" for cross-origin cookies
      // Even with Vercel proxy, the OAuth callback comes from Render domain
      sameSite: isProd ? "none" : "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: "/",
    },
    proxy: isProd,
  })
);

// Debug middleware to log cookie setting
app.use((req, res, next) => {
  const originalSetHeader = res.setHeader.bind(res);
  res.setHeader = function(name: string, value: any) {
    if (name.toLowerCase() === 'set-cookie') {
      logger.info({ setCookie: value }, 'Setting cookie header');
    }
    return originalSetHeader(name, value);
  };
  next();
});

setupPassport();
app.use(passport.initialize());
app.use(passport.session());

app.use("/api", router);

export default app;
