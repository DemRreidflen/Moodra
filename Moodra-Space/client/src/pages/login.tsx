import { Feather, FlaskConical, Sparkles, Network, Check, AlertCircle } from "lucide-react";
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
      style={{ background: "hsl(30, 58%, 97%)" }}
    >
      {/* ── Left branding panel ── */}
      <div
        className="hidden lg:flex flex-col w-[56%] relative overflow-hidden"
        style={{
          background: "linear-gradient(150deg, #fff9f4 0%, #ffeedd 55%, #fdd6aa 100%)",
        }}
      >
        {/* Decorative blobs */}
        <div
          className="absolute -top-48 -left-48 w-[580px] h-[580px] rounded-full opacity-20 pointer-events-none"
          style={{ background: "radial-gradient(circle, #F96D1C 0%, transparent 65%)" }}
        />
        <div
          className="absolute -bottom-32 -right-24 w-[420px] h-[420px] rounded-full opacity-12 pointer-events-none"
          style={{ background: "radial-gradient(circle, #FF9640 0%, transparent 65%)" }}
        />
        {/* Subtle grid texture */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: "repeating-linear-gradient(0deg, #8B4513 0, #8B4513 1px, transparent 0, transparent 50%), repeating-linear-gradient(90deg, #8B4513 0, #8B4513 1px, transparent 0, transparent 50%)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative z-10 flex flex-col h-full px-16 py-14">

          {/* Logo */}
          <div className="mb-12">
            <img
              src="/moodra-logo-full.png"
              alt="moodra"
              style={{ height: "40px", width: "auto", objectFit: "contain", display: "block" }}
            />
          </div>

          {/* Eyebrow */}
          <div className="mb-4 flex items-center gap-2">
            <div className="h-px w-6" style={{ background: "#F96D1C" }} />
            <span
              className="text-[10px] font-bold tracking-[0.18em] uppercase"
              style={{ color: "#F96D1C" }}
            >
              {l.eyebrow}
            </span>
          </div>

          {/* Hero copy */}
          <div className="mb-16">
            <h2
              className="font-bold leading-[1.1] mb-5"
              style={{
                color: "#1a0d06",
                fontFamily: "system-ui, -apple-system, sans-serif",
                fontSize: "2.9rem",
                letterSpacing: "-0.02em",
              }}
            >
              {l.headline1}<br />
              <span style={{ color: "#F96D1C" }}>{l.headline2}</span>
            </h2>
            <p className="text-[0.96rem] leading-relaxed max-w-[400px]" style={{ color: "#7a5a44" }}>
              {l.subheadline}
            </p>
          </div>

          {/* Feature cards 2×2 */}
          <div className="grid grid-cols-2 gap-3 mb-10">
            {featureKeys.map((key, i) => {
              const Icon = featureIcons[i];
              const feat = l.features[key];
              return (
                <div
                  key={key}
                  className="rounded-2xl p-4"
                  style={{
                    background: "rgba(255,255,255,0.6)",
                    backdropFilter: "blur(20px)",
                    border: "1px solid rgba(249,109,28,0.14)",
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center mb-3"
                    style={{ background: "rgba(249,109,28,0.12)" }}
                  >
                    <Icon className="w-4 h-4" style={{ color: "#F96D1C" }} strokeWidth={1.8} />
                  </div>
                  <div
                    className="text-sm font-semibold mb-1 leading-snug"
                    style={{ color: "#1a0d06", fontFamily: "system-ui, -apple-system, sans-serif" }}
                  >
                    {feat.title}
                  </div>
                  <div className="text-xs leading-relaxed" style={{ color: "#9a7060" }}>
                    {feat.desc}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Checkmarks */}
          <div className="flex flex-col gap-2.5 mb-auto">
            {l.highlights.map((h: string) => (
              <div key={h} className="flex items-center gap-2.5">
                <div
                  className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(249,109,28,0.16)" }}
                >
                  <Check className="w-2.5 h-2.5" style={{ color: "#F96D1C" }} strokeWidth={2.5} />
                </div>
                <span className="text-xs" style={{ color: "#7a5a44" }}>{h}</span>
              </div>
            ))}
          </div>

          {/* Footer */}
          <p className="mt-14 text-xs" style={{ color: "#c0a080" }}>
            © 2026 Moodra · {l.footer}
          </p>
        </div>
      </div>

      {/* ── Right sign-in panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-16 relative">
        <div className="absolute top-5 right-6">
          <LanguagePicker />
        </div>

        {/* Mobile logo */}
        <div className="lg:hidden mb-10">
          <img
            src="/moodra-logo-full.png"
            alt="moodra"
            style={{ height: "34px", width: "auto", objectFit: "contain" }}
          />
        </div>

        <div className="w-full max-w-[300px] flex flex-col gap-8">

          {/* Icon accent */}
          <img
            src="/moodra-icon-sketch.png"
            alt="Moodra"
            className="w-16 h-16 rounded-2xl"
            style={{ objectFit: "cover" }}
          />

          <div>
            <h1
              className="font-bold mb-2"
              style={{
                color: "#1a0d06",
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
            <p className="text-sm leading-relaxed" style={{ color: "#8a7a70" }}>
              {l.signInSub.split("\n").map((line: string, i: number) => (
                <span key={i}>{line}{i === 0 && <br />}</span>
              ))}
            </p>
          </div>

          {authError && (
            <div
              className="flex items-start gap-2.5 rounded-2xl p-3.5"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)" }}
            >
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#ef4444" }} />
              <div>
                <p className="font-semibold text-xs" style={{ color: "#dc2626" }}>Sign-in unavailable</p>
                <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "#b91c1c" }}>
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
                background: "#fff",
                color: "#1a1a1a",
                border: "1.5px solid rgba(0,0,0,0.09)",
                boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                transition: "box-shadow 0.2s ease, transform 0.15s ease",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,0.13)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.08)";
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

            <p className="text-xs text-center leading-relaxed" style={{ color: "#b0a090" }}>
              {l.terms.split("\n").map((line: string, i: number) => (
                <span key={i}>{line}{i === 0 && <br />}</span>
              ))}
            </p>
          </div>

          {/* Mobile feature list */}
          <div
            className="lg:hidden flex flex-col gap-2.5 pt-6"
            style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}
          >
            <p
              className="text-[10px] font-bold tracking-widest mb-1 uppercase"
              style={{ color: "#c0b0a0" }}
            >
              {l.whatYouGet}
            </p>
            {featureKeys.map((key, i) => {
              const Icon = featureIcons[i];
              return (
                <div key={key} className="flex items-center gap-2.5">
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(249,109,28,0.09)" }}
                  >
                    <Icon className="w-3 h-3" style={{ color: "#F96D1C" }} strokeWidth={1.8} />
                  </div>
                  <span className="text-xs" style={{ color: "#5a4a40" }}>{l.features[key].title}</span>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
}
