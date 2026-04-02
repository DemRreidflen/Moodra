import { FlaskConical, Sparkles, Network, Check, AlertCircle, Zap, Star, PenLine } from "lucide-react";
import { LanguagePicker } from "@/components/language-picker";
import { useLang } from "@/contexts/language-context";

export default function LoginPage() {
  const { t } = useLang();
  const l = t.login;
  const authError = new URLSearchParams(window.location.search).get("auth_error");

  const featureIcons = [PenLine, Sparkles, FlaskConical, Network];
  const featureKeys = ["editor", "ai", "research", "ideas"] as const;

  return (
    <div
      className="min-h-screen flex"
      style={{ background: "hsl(30,58%,97%)" }}
    >
      {/* ── Left branding panel ── */}
      <div
        className="hidden lg:flex flex-col w-[58%] relative overflow-hidden"
        style={{
          background: "linear-gradient(145deg, #fff9f4 0%, #ffeedd 52%, #fcd9a8 100%)",
        }}
      >
        {/* Ambient blob top-left */}
        <div
          className="absolute -top-16 -left-16 pointer-events-none"
          style={{
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(249,109,28,0.12) 0%, transparent 65%)",
          }}
        />
        {/* Ambient blob bottom-right */}
        <div
          className="absolute -bottom-24 right-0 pointer-events-none"
          style={{
            width: 480,
            height: 480,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(249,109,28,0.09) 0%, transparent 65%)",
          }}
        />
        {/* Subtle dot grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.045]"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(180,90,20,1) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* ── Main content ── */}
        <div className="relative z-10 flex flex-col h-full px-12 py-10">

          {/* Logo + lang row */}
          <div className="flex items-center justify-between mb-auto">
            <img src="/moodra-logo-new.png" alt="Moodra" style={{ height: 36, width: "auto" }} />
            <LanguagePicker />
          </div>

          {/* Hero text — left side, cards float on the right */}
          <div className="mt-auto mb-0" style={{ maxWidth: "62%" }}>
            <p
              className="text-xs font-bold uppercase tracking-widest mb-5"
              style={{ color: "#F96D1C", letterSpacing: "0.18em" }}
            >
              {l.tagline}
            </p>
            <h1
              className="font-bold leading-tight mb-4"
              style={{ fontSize: "clamp(28px, 3.2vw, 42px)", color: "#2d1a0e", lineHeight: 1.15 }}
            >
              {l.headline}
            </h1>
            <p className="text-sm leading-relaxed mb-8" style={{ color: "#8a7a70" }}>
              {l.subheadline}
            </p>

            {/* Highlights — clean checklist */}
            <div className="flex flex-col gap-2.5 mb-10">
              {l.highlights.map((h: string, i: number) => (
                <div key={i} className="flex items-start gap-2.5">
                  <Check
                    className="mt-0.5 flex-shrink-0"
                    style={{ width: 13, height: 13, color: "#F96D1C" }}
                    strokeWidth={2.5}
                  />
                  <span className="text-xs leading-relaxed" style={{ color: "#5a4a3e" }}>{h}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Feature pills — 2×2 structured grid */}
          <div
            className="grid gap-2.5 mt-auto pb-10"
            style={{ gridTemplateColumns: "1fr 1fr" }}
          >
            {featureKeys.map((key, i) => {
              const Icon = featureIcons[i];
              return (
                <div
                  key={key}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl"
                  style={{
                    background: "rgba(249,109,28,0.07)",
                    border: "1px solid rgba(249,109,28,0.13)",
                  }}
                >
                  <div
                    className="flex-shrink-0 rounded-lg flex items-center justify-center"
                    style={{ width: 26, height: 26, background: "rgba(249,109,28,0.11)" }}
                  >
                    <Icon style={{ width: 12, height: 12, color: "#F96D1C" }} strokeWidth={1.9} />
                  </div>
                  <span className="text-xs font-medium leading-tight" style={{ color: "#4a3428" }}>
                    {l.features[key].title}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <p className="text-[10px]" style={{ color: "rgba(180,130,90,0.50)", paddingBottom: 2 }}>
            © 2026 Moodra · {l.footerTagline}
          </p>
        </div>

        {/* ── Floating decorative cards — right column only, no text overlap ── */}

        {/* Card 1: AI Co-author — upper-right */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "13%",
            right: "3%",
            width: 156,
            background: "rgba(255,255,255,0.78)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(249,109,28,0.16)",
            borderRadius: 18,
            padding: "14px 16px",
            transform: "rotate(3.5deg)",
            boxShadow: "0 8px 32px rgba(180,90,20,0.10)",
          }}
        >
          <div
            style={{ width: 32, height: 32, borderRadius: 11, background: "#F96D1C", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}
          >
            <Sparkles style={{ width: 15, height: 15, color: "#fff" }} />
          </div>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: "#2d1a0e", marginBottom: 4 }}>AI Co-author</div>
          <div style={{ fontSize: 9.5, color: "#8a7a70", lineHeight: 1.55 }}>Knows your whole book, not just the last line.</div>
        </div>

        {/* Card 2: Focus Mode — mid-right */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "45%",
            right: "5%",
            width: 144,
            background: "rgba(255,255,255,0.74)",
            backdropFilter: "blur(14px)",
            border: "1px solid rgba(249,109,28,0.14)",
            borderRadius: 16,
            padding: "12px 14px",
            transform: "rotate(-2deg)",
            boxShadow: "0 6px 26px rgba(180,90,20,0.09)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <div style={{ width: 22, height: 22, borderRadius: 8, background: "rgba(249,109,28,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap style={{ width: 11, height: 11, color: "#F96D1C" }} />
            </div>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: "#2d1a0e" }}>Focus Mode</span>
          </div>
          <div style={{ display: "flex", gap: 3, marginBottom: 8 }}>
            {[1,2,3,4,5].map(i => (
              <Star key={i} style={{ width: 9, height: 9, color: i <= 4 ? "#F96D1C" : "rgba(180,130,90,0.25)", fill: i <= 4 ? "#F96D1C" : "transparent" }} />
            ))}
          </div>
          <div style={{ fontSize: 9, color: "#8a7a70" }}>1,240 words today</div>
        </div>

        {/* Card 3: Chapter progress — lower-right */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "71%",
            right: "4%",
            width: 152,
            background: "rgba(255,255,255,0.70)",
            backdropFilter: "blur(14px)",
            border: "1px solid rgba(249,109,28,0.13)",
            borderRadius: 16,
            padding: "12px 14px",
            transform: "rotate(1.5deg)",
            boxShadow: "0 6px 22px rgba(180,90,20,0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: "#2d1a0e" }}>Chapter 7</span>
            <span style={{ fontSize: 9.5, fontWeight: 600, color: "#F96D1C" }}>82%</span>
          </div>
          <div style={{ width: "100%", height: 4, borderRadius: 3, background: "rgba(249,109,28,0.12)", overflow: "hidden" }}>
            <div style={{ width: "82%", height: "100%", borderRadius: 3, background: "linear-gradient(90deg, #F96D1C, #ffaa60)" }} />
          </div>
          <div style={{ fontSize: 9, color: "#8a7a70", marginTop: 7 }}>3,180 / 3,900 words</div>
        </div>
      </div>

      {/* ── Right sign-in panel ── */}
      <div
        className="flex-1 flex items-center justify-center px-8 py-10"
        style={{ background: "hsl(30,58%,97%)" }}
      >
        <div className="w-full max-w-sm">

          {/* Moodra sketch icon — light style */}
          <div className="flex justify-center mb-7">
            <img
              src="/moodra-icon-sketch.png"
              alt="Moodra"
              style={{ width: 58, height: 58, objectFit: "contain" }}
            />
          </div>

          {/* Heading */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-1.5" style={{ color: "#2d1a0e" }}>
              {l.welcomeBack}
            </h2>
            <p className="text-sm" style={{ color: "#8a7a70" }}>{l.subtext}</p>
          </div>

          {/* Auth error */}
          {authError && (
            <div
              className="flex items-center gap-2.5 text-sm rounded-xl px-4 py-3 mb-5"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.20)", color: "#b91c1c" }}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{authError === "oauth_failed" ? "Sign-in failed. Please try again." : authError}</span>
            </div>
          )}

          {/* Google sign-in button */}
          <a
            href="/api/auth/google"
            className="flex items-center justify-center gap-3 w-full rounded-xl font-medium text-sm transition-all hover:shadow-md active:scale-[0.98]"
            style={{
              padding: "13px 20px",
              background: "#ffffff",
              border: "1.5px solid rgba(180,130,90,0.22)",
              color: "#2d1a0e",
              boxShadow: "0 2px 12px rgba(180,90,20,0.08)",
              textDecoration: "none",
            }}
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {l.continueGoogle}
          </a>

          <p className="text-xs text-center leading-relaxed mt-5" style={{ color: "rgba(140,110,90,0.55)" }}>
            {l.terms.split("\n").map((line: string, i: number) => (
              <span key={i}>{line}{i === 0 && <br />}</span>
            ))}
          </p>

          {/* Mobile feature list */}
          <div
            className="lg:hidden flex flex-col gap-2.5 pt-6 mt-6"
            style={{ borderTop: "1px solid rgba(180,130,90,0.15)" }}
          >
            <p className="text-[10px] font-bold tracking-widest mb-1 uppercase" style={{ color: "rgba(180,110,60,0.50)" }}>
              {l.whatYouGet}
            </p>
            {featureKeys.map((key, i) => {
              const Icon = featureIcons[i];
              return (
                <div key={key} className="flex items-center gap-2.5">
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(249,109,28,0.09)", border: "1px solid rgba(249,109,28,0.16)" }}
                  >
                    <Icon className="w-3 h-3" style={{ color: "#F96D1C" }} strokeWidth={1.8} />
                  </div>
                  <span className="text-xs" style={{ color: "#6a5040" }}>{l.features[key].title}</span>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
}
