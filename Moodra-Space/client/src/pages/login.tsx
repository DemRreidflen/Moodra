import { Feather, FlaskConical, Sparkles, Network, Check, AlertCircle, BookOpen, Zap, Star } from "lucide-react";
import { LanguagePicker } from "@/components/language-picker";
import { useLang } from "@/contexts/language-context";

export default function LoginPage() {
  const { t } = useLang();
  const l = t.login;
  const authError = new URLSearchParams(window.location.search).get("auth_error");

  const featureIcons = [Feather, Sparkles, FlaskConical, Network];
  const featureKeys = ["editor", "ai", "research", "ideas"] as const;

  return (
    <div
      className="min-h-screen flex"
      style={{ background: "#0f0705" }}
    >
      {/* ── Left branding panel ── */}
      <div
        className="hidden lg:flex flex-col w-[56%] relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #1a0a02 0%, #2d1008 40%, #F96D1C 100%)",
        }}
      >
        {/* Vivid radial glow top-left */}
        <div
          className="absolute -top-20 -left-20 pointer-events-none"
          style={{
            width: 520,
            height: 520,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,120,30,0.45) 0%, transparent 65%)",
          }}
        />
        {/* Bottom-right deep burn */}
        <div
          className="absolute -bottom-40 right-0 pointer-events-none"
          style={{
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(249,109,28,0.28) 0%, transparent 65%)",
          }}
        />
        {/* Subtle dot grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.07]"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,180,100,1) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        {/* Floating decorative cards */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "18%",
            right: "8%",
            width: 148,
            background: "rgba(255,255,255,0.06)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 18,
            padding: "14px 16px",
            transform: "rotate(4deg)",
          }}
        >
          <div style={{ width: 28, height: 28, borderRadius: 10, background: "rgba(249,109,28,0.35)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
            <Sparkles style={{ width: 13, height: 13, color: "#FFB060" }} />
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.90)", marginBottom: 4 }}>AI Co-author</div>
          <div style={{ fontSize: 9.5, color: "rgba(255,200,140,0.65)", lineHeight: 1.5 }}>Knows your whole book, not just the last line.</div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: "24%",
            right: "12%",
            width: 136,
            background: "rgba(255,255,255,0.05)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 16,
            padding: "12px 14px",
            transform: "rotate(-3deg)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <Zap style={{ width: 11, height: 11, color: "#FFD080" }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>Focus Mode</span>
          </div>
          <div style={{ display: "flex", gap: 3 }}>
            {[1,2,3,4,5].map(i => (
              <Star key={i} style={{ width: 9, height: 9, color: i <= 4 ? "#F96D1C" : "rgba(255,255,255,0.20)", fill: i <= 4 ? "#F96D1C" : "transparent" }} />
            ))}
          </div>
          <div style={{ fontSize: 9, color: "rgba(255,200,140,0.55)", marginTop: 5, lineHeight: 1.4 }}>1,240 words today</div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            top: "52%",
            left: "6%",
            width: 124,
            background: "rgba(255,255,255,0.05)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.09)",
            borderRadius: 14,
            padding: "11px 13px",
            transform: "rotate(-2deg)",
          }}
        >
          <BookOpen style={{ width: 12, height: 12, color: "#FFB060", marginBottom: 6 }} />
          <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.80)", marginBottom: 3 }}>Chapter 7</div>
          <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.10)", marginBottom: 4, overflow: "hidden" }}>
            <div style={{ width: "62%", height: "100%", background: "linear-gradient(90deg, #F96D1C, #FF9640)", borderRadius: 2 }} />
          </div>
          <div style={{ fontSize: 9, color: "rgba(255,200,140,0.50)" }}>62% complete</div>
        </div>

        <div className="relative z-10 flex flex-col h-full px-16 py-14">

          {/* Logo */}
          <div className="mb-14">
            <img
              src="/moodra-logo-full.png"
              alt="moodra"
              style={{ height: "38px", width: "auto", objectFit: "contain", display: "block", filter: "brightness(0) invert(1)", opacity: 0.92 }}
            />
          </div>

          {/* Eyebrow */}
          <div className="mb-4 flex items-center gap-2">
            <div className="h-px w-5" style={{ background: "rgba(249,109,28,0.80)" }} />
            <span
              className="text-[10px] font-bold tracking-[0.18em] uppercase"
              style={{ color: "rgba(249,109,28,0.90)" }}
            >
              {l.eyebrow}
            </span>
          </div>

          {/* Hero copy */}
          <div className="mb-auto">
            <h2
              className="font-bold leading-[1.07] mb-6"
              style={{
                color: "#fff",
                fontFamily: "system-ui, -apple-system, sans-serif",
                fontSize: "3.1rem",
                letterSpacing: "-0.025em",
              }}
            >
              {l.headline1}<br />
              <span style={{ color: "#FFB060" }}>{l.headline2}</span>
            </h2>
            <p className="text-[0.94rem] leading-relaxed max-w-[380px]" style={{ color: "rgba(255,210,160,0.72)" }}>
              {l.subheadline}
            </p>

            {/* Checkmarks */}
            <div className="flex flex-col gap-2.5 mt-8">
              {l.highlights.map((h: string) => (
                <div key={h} className="flex items-center gap-2.5">
                  <div
                    className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(249,109,28,0.30)", border: "1px solid rgba(249,109,28,0.50)" }}
                  >
                    <Check className="w-2.5 h-2.5" style={{ color: "#FFB060" }} strokeWidth={2.5} />
                  </div>
                  <span className="text-xs" style={{ color: "rgba(255,210,160,0.70)" }}>{h}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 mb-10">
            {featureKeys.map((key, i) => {
              const Icon = featureIcons[i];
              return (
                <div
                  key={key}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}
                >
                  <Icon className="w-3 h-3" style={{ color: "#FFB060" }} strokeWidth={1.8} />
                  <span className="text-[11px] font-medium" style={{ color: "rgba(255,220,170,0.80)" }}>
                    {l.features[key].title}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <p className="text-xs" style={{ color: "rgba(255,180,100,0.35)" }}>
            © 2026 Moodra · {l.footer}
          </p>
        </div>
      </div>

      {/* ── Right sign-in panel ── */}
      <div
        className="flex-1 flex flex-col items-center justify-center px-8 py-16 relative"
        style={{ background: "linear-gradient(160deg, #140804 0%, #1e0e06 50%, #2a1208 100%)" }}
      >
        {/* Subtle ambient glow */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "10%",
            left: "50%",
            transform: "translateX(-50%)",
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(249,109,28,0.10) 0%, transparent 70%)",
          }}
        />
        <div className="absolute top-5 right-6 z-10">
          <LanguagePicker />
        </div>

        {/* Mobile logo */}
        <div className="lg:hidden mb-10">
          <img
            src="/moodra-logo-full.png"
            alt="moodra"
            style={{ height: "32px", width: "auto", objectFit: "contain", filter: "brightness(0) invert(1)", opacity: 0.85 }}
          />
        </div>

        <div className="relative z-10 w-full max-w-[300px] flex flex-col gap-8">

          {/* Icon accent */}
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, rgba(249,109,28,0.25) 0%, rgba(255,150,64,0.15) 100%)",
              border: "1px solid rgba(249,109,28,0.30)",
            }}
          >
            <Feather className="w-6 h-6" style={{ color: "#F96D1C" }} strokeWidth={1.6} />
          </div>

          <div>
            <h1
              className="font-bold mb-2"
              style={{
                color: "#fff",
                fontFamily: "system-ui, -apple-system, sans-serif",
                fontSize: "1.75rem",
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
              }}
            >
              {l.signIn.split("\n").map((line: string, i: number) => (
                <span key={i}>{line}{i === 0 && <br />}</span>
              ))}
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(255,200,150,0.55)" }}>
              {l.signInSub.split("\n").map((line: string, i: number) => (
                <span key={i}>{line}{i === 0 && <br />}</span>
              ))}
            </p>
          </div>

          {authError && (
            <div
              className="flex items-start gap-2.5 rounded-2xl p-3.5"
              style={{ background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.22)" }}
            >
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#ef4444" }} />
              <div>
                <p className="font-semibold text-xs" style={{ color: "#ef4444" }}>Sign-in unavailable</p>
                <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "rgba(239,68,68,0.80)" }}>
                  Google OAuth is not configured. Add <strong>GOOGLE_CLIENT_ID</strong> and <strong>GOOGLE_CLIENT_SECRET</strong> as environment secrets to enable login.
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button
              data-testid="button-login-google"
              onClick={() => { window.location.href = "/api/login"; }}
              className="w-full py-3.5 px-5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-3"
              style={{
                background: "rgba(255,255,255,0.95)",
                color: "#1a1a1a",
                border: "none",
                boxShadow: "0 4px 24px rgba(0,0,0,0.40), 0 0 0 1px rgba(255,255,255,0.08)",
                transition: "box-shadow 0.2s ease, transform 0.15s ease",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.50), 0 0 0 1px rgba(255,255,255,0.12)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.40), 0 0 0 1px rgba(255,255,255,0.08)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {l.continueGoogle}
            </button>

            <p className="text-xs text-center leading-relaxed" style={{ color: "rgba(255,200,140,0.35)" }}>
              {l.terms.split("\n").map((line: string, i: number) => (
                <span key={i}>{line}{i === 0 && <br />}</span>
              ))}
            </p>
          </div>

          {/* Mobile feature list */}
          <div
            className="lg:hidden flex flex-col gap-2.5 pt-6"
            style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
          >
            <p
              className="text-[10px] font-bold tracking-widest mb-1 uppercase"
              style={{ color: "rgba(255,180,100,0.40)" }}
            >
              {l.whatYouGet}
            </p>
            {featureKeys.map((key, i) => {
              const Icon = featureIcons[i];
              return (
                <div key={key} className="flex items-center gap-2.5">
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(249,109,28,0.15)", border: "1px solid rgba(249,109,28,0.20)" }}
                  >
                    <Icon className="w-3 h-3" style={{ color: "#F96D1C" }} strokeWidth={1.8} />
                  </div>
                  <span className="text-xs" style={{ color: "rgba(255,200,150,0.65)" }}>{l.features[key].title}</span>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
}
