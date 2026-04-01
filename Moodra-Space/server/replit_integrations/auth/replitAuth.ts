import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { authStorage } from "./storage";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: sessionTtl,
    },
  });
}

function buildCallbackURL(req: any): string {
  if (process.env.GOOGLE_CALLBACK_URL) return process.env.GOOGLE_CALLBACK_URL;
  const proto = (req.headers["x-forwarded-proto"] as string) || req.protocol || "https";
  const host = (req.headers["x-forwarded-host"] as string) || (req.headers.host as string);
  return `${proto}://${host}/api/auth/google/callback`;
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user: any, cb) => cb(null, user.id));
  passport.deserializeUser(async (id: string, cb) => {
    try {
      const user = await authStorage.getUser(id);
      cb(null, user || false);
    } catch (err) {
      console.error("[auth] deserializeUser error:", err);
      cb(err);
    }
  });

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn("[auth] GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set — Google OAuth disabled");
  } else {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          callbackURL: "/api/auth/google/callback",
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value;
            const user = await authStorage.upsertUser({
              id: profile.id,
              email: email || null,
              firstName: profile.name?.givenName || null,
              lastName: profile.name?.familyName || null,
              profileImageUrl: profile.photos?.[0]?.value || null,
            });
            return done(null, user);
          } catch (err) {
            console.error("[auth] upsertUser error:", err);
            return done(err as Error);
          }
        }
      )
    );
  }

  const googleEnabled = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

  app.get("/api/login", (req, res, next) => {
    if (!googleEnabled) {
      return res.redirect("/?auth_error=1");
    }
    const callbackURL = buildCallbackURL(req);
    console.log(`[auth] Google OAuth → callbackURL=${callbackURL}`);
    passport.authenticate("google", {
      scope: ["profile", "email"],
      callbackURL,
    } as any)(req, res, next);
  });

  app.get("/api/auth/google/callback", (req, res, next) => {
    if (!googleEnabled) {
      return res.redirect("/?auth_error=1");
    }
    const callbackURL = buildCallbackURL(req);
    (passport.authenticate("google", {
      callbackURL,
      successRedirect: "/home",
      failureRedirect: "/?auth_error=1",
    } as any) as any)(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect("/");
    });
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  return res.status(401).json({ message: "Unauthorized" });
};
