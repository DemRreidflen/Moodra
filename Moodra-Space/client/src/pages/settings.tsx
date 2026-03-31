import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import type { Book } from "@shared/schema";
import { Loader2, ExternalLink, CheckCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLang } from "@/contexts/language-context";
import { LANGUAGES } from "@/lib/translations";
import type { Lang } from "@/lib/translations";
import { LanguagePicker } from "@/components/language-picker";
import {
  MArrowLeft, MLogout, MUser, MBookOpen, MKey, MGear,
  MFlash, MGlobe, MTrash, MCheck,
} from "@/components/icons";
import { SiteFooter } from "@/components/site-footer";

function formatCost(tokens: number, inputPricePerMillion: number): string {
  const cost = tokens * (inputPricePerMillion / 1_000_000);
  if (cost === 0) return "$0.00";
  if (cost < 0.001) return `< $0.001`;
  if (cost < 0.01) return `~$${cost.toFixed(4)}`;
  return `~$${cost.toFixed(3)}`;
}

function TokenBar({ used, label }: { used: number; label: string }) {
  const MAX = 1_000_000;
  const pct = Math.min((used / MAX) * 100, 100);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: "#8a7a70" }}>{label}</span>
        <span className="text-xs font-mono font-semibold" style={{ color: "#2d2520" }}>
          {used.toLocaleString()}
        </span>
      </div>
      <div className="w-full h-1.5 rounded-full" style={{ background: "rgba(249,109,28,0.12)" }}>
        <div
          className="h-1.5 rounded-full transition-all"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, #F96D1C 0%, #FF9640 100%)",
            minWidth: pct > 0 ? "4px" : "0",
          }}
        />
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { t, lang, setLang } = useLang();
  const s = t.settings;

  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);

  const { data: books = [] } = useQuery<Book[]>({ queryKey: ["/api/books"] });
  const { data: pricingData } = useQuery<{
    pricing: Record<string, { input: number; output: number; cachedInput?: number }>;
    updatedAt: string;
    source: string;
  }>({ queryKey: ["/api/models/pricing"], staleTime: 1000 * 60 * 60 });

  const tokensUsed = (user as any)?.tokensUsed || 0;
  const hasApiKey = !!(user as any)?.openaiApiKey;
  const MODEL_LABELS: Record<string, string> = {
    "gpt-4o-mini": "GPT-4o mini", "gpt-4.1-mini": "GPT-4.1 mini",
    "gpt-3.5-turbo": "GPT-3.5 Turbo",
    "gpt-4o": "GPT-4o", "gpt-4.1": "GPT-4.1", "gpt-4-turbo": "GPT-4 Turbo", "o4-mini": "o4-mini",
  };
  const currentModelId = (user as any)?.openaiModel || "gpt-4o-mini";
  const currentModelLabel = MODEL_LABELS[currentModelId] || currentModelId;
  const currentModelPrice = pricingData?.pricing?.[currentModelId] ?? { input: 0.15, output: 0.60 };
  const inputPricePerMillion = currentModelPrice.input;

  const updateMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", "/api/me", { firstName, lastName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: t.common.save });
    },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  const saveKeyMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", "/api/me/api-key", { apiKey }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: s.saveKey });
      setApiKey("");
    },
    onError: (e: any) => toast({ title: e?.message || "Error", variant: "destructive" }),
  });

  const removeKeyMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", "/api/me/api-key", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: s.removeKey });
    },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "User";
  const initials = [user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "?";
  const totalWords = books.reduce((sum, b) => sum + (b.wordCount || 0), 0);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "hsl(30, 58%, 97%)" }}>
      <header className="sticky top-0 z-10 border-b" style={{
        background: "rgba(250,242,234,0.85)",
        backdropFilter: "blur(12px)",
        borderColor: "rgba(249,109,28,0.12)",
      }}>
        <div className="max-w-2xl mx-auto px-6 h-14 flex items-center gap-3">
          <button
            data-testid="button-back"
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70"
            style={{ color: "#8a7a70" }}
          >
            <MArrowLeft size={16} />
            {t.common.back}
          </button>
          <div className="flex-1" />
          <LanguagePicker size="sm" />
        </div>
      </header>
      <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-10">

        <h1 className="text-2xl font-bold mb-8" style={{ color: "#1a1a1a" }}>
          {s.title}
        </h1>

        <div className="flex flex-col gap-5">

          {/* ── Profile ── */}
          <section className="rounded-3xl p-6" style={{ background: "hsl(30, 65%, 98.5%)", border: "1px solid rgba(0,0,0,0.06)" }}>
            <div className="flex items-center gap-2 mb-5">
              <MUser size={16} style={{ color: "#F96D1C" }} />
              <h2 className="text-sm font-semibold" style={{ color: "#2d2520" }}>{s.profile}</h2>
            </div>

            <div className="flex items-center gap-4 mb-6">
              {user?.profileImageUrl ? (
                <img
                  src={user.profileImageUrl}
                  alt={displayName}
                  data-testid="img-avatar"
                  className="w-16 h-16 rounded-2xl object-cover"
                />
              ) : (
                <div
                  data-testid="div-avatar-initials"
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #F96D1C 0%, #FF9640 100%)" }}
                >
                  {initials}
                </div>
              )}
              <div>
                <div className="font-semibold" style={{ color: "#1a1a1a" }} data-testid="text-display-name">
                  {displayName}
                </div>
                {user?.email && (
                  <div className="text-sm mt-0.5" style={{ color: "#8a7a70" }} data-testid="text-email">
                    {user.email}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs" style={{ color: "#8a7a70" }}>{s.name}</Label>
                <Input
                  data-testid="input-first-name"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder={s.name}
                  className="rounded-xl border-0 text-sm"
                  style={{ background: "rgba(249,109,28,0.06)", color: "#2d2520" }}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs" style={{ color: "#8a7a70" }}>{s.email}</Label>
                <Input
                  data-testid="input-last-name"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder={s.email}
                  className="rounded-xl border-0 text-sm"
                  style={{ background: "rgba(249,109,28,0.06)", color: "#2d2520" }}
                />
              </div>
            </div>

            <Button
              data-testid="button-save-profile"
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending}
              className="flex items-center gap-2 rounded-xl text-white text-sm font-medium"
              style={{ background: "linear-gradient(135deg, #F96D1C 0%, #FF9640 100%)", border: "none" }}
            >
              {updateMutation.isPending
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <MCheck size={14} />}
              {updateMutation.isPending ? t.common.saving : t.common.save}
            </Button>
          </section>

          {/* ── Language ── */}
          <section className="rounded-3xl p-6" style={{ background: "hsl(30, 65%, 98.5%)", border: "1px solid rgba(0,0,0,0.06)" }}>
            <div className="flex items-center gap-2 mb-1">
              <MGlobe size={16} style={{ color: "#F96D1C" }} />
              <h2 className="text-sm font-semibold" style={{ color: "#2d2520" }}>{s.language}</h2>
            </div>
            <p className="text-xs mb-4" style={{ color: "#8a7a70" }}>{s.languageDesc}</p>

            <div className="grid grid-cols-2 gap-2">
              {LANGUAGES.map(l => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code as Lang)}
                  className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: lang === l.code ? "rgba(249,109,28,0.12)" : "rgba(249,109,28,0.04)",
                    border: lang === l.code ? "1.5px solid rgba(249,109,28,0.4)" : "1.5px solid transparent",
                    color: lang === l.code ? "#F96D1C" : "#5a4a40",
                  }}
                  data-testid={`lang-option-${l.code}`}
                >
                  <span>{l.flag}</span>
                  <span>{l.label}</span>
                  {lang === l.code && <MCheck size={14} className="ml-auto" style={{ color: "#F96D1C" }} />}
                </button>
              ))}
            </div>
          </section>

          {/* ── Stats ── */}
          <section className="rounded-3xl p-6" style={{ background: "hsl(30, 65%, 98.5%)", border: "1px solid rgba(0,0,0,0.06)" }}>
            <div className="flex items-center gap-2 mb-5">
              <MBookOpen size={16} style={{ color: "#F96D1C" }} />
              <h2 className="text-sm font-semibold" style={{ color: "#2d2520" }}>{s.books}</h2>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl p-4 text-center" style={{ background: "rgba(249,109,28,0.07)" }}>
                <div className="text-3xl font-bold" data-testid="text-book-count" style={{ color: "#F96D1C" }}>
                  {books.length}
                </div>
                <div className="text-xs mt-1" style={{ color: "#8a7a70" }}>{s.books.toLowerCase()}</div>
              </div>
              <div className="rounded-2xl p-4 text-center" style={{ background: "rgba(249,109,28,0.07)" }}>
                <div className="text-3xl font-bold" style={{ color: "#F96D1C" }}>
                  {totalWords.toLocaleString()}
                </div>
                <div className="text-xs mt-1" style={{ color: "#8a7a70" }}>words</div>
              </div>
              <div className="rounded-2xl p-4 text-center" style={{ background: "rgba(249,109,28,0.07)" }}>
                <div className="text-3xl font-bold" data-testid="text-tokens-used" style={{ color: "#F96D1C" }}>
                  {tokensUsed > 1000 ? `${(tokensUsed / 1000).toFixed(1)}k` : tokensUsed}
                </div>
                <div className="text-xs mt-1" style={{ color: "#8a7a70" }}>tokens</div>
              </div>
            </div>
          </section>

          {/* ── OpenAI API ── */}
          <section className="rounded-3xl p-6" style={{ background: "hsl(30, 65%, 98.5%)", border: "1px solid rgba(0,0,0,0.06)" }}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <MKey size={16} style={{ color: "#F96D1C" }} />
                <h2 className="text-sm font-semibold" style={{ color: "#2d2520" }}>{s.aiKey}</h2>
                <a
                  href="/api-key-guide"
                  className="text-xs ml-1"
                  style={{ color: "#F96D1C", textDecoration: "underline", textUnderlineOffset: "2px" }}
                >
                  {s.getKeyLink}
                </a>
              </div>
              {hasApiKey && (
                <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "#22c55e" }}>
                  <CheckCircle className="w-3.5 h-3.5" />
                  {s.keyActive}
                </div>
              )}
            </div>

            {hasApiKey ? (
              <div className="flex flex-col gap-4">
                {/* Token usage card */}
                <div className="rounded-2xl p-4" style={{ background: "rgba(249,109,28,0.06)" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <MFlash size={14} style={{ color: "#F96D1C" }} />
                    <span className="text-xs font-semibold" style={{ color: "#2d2520" }}>
                      {s.tokensUsed}
                    </span>
                  </div>
                  <TokenBar used={tokensUsed} label={s.tokensUsed} />

                  {/* Dollar cost — prominent */}
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs" style={{ color: "#8a7a70" }}>
                      {s.estimatedCost}
                    </span>
                    <div className="flex flex-col items-end">
                      <span
                        className="text-lg font-bold font-mono leading-none"
                        data-testid="text-estimated-cost"
                        style={{ color: "#F96D1C" }}
                      >
                        {formatCost(tokensUsed, inputPricePerMillion)}
                      </span>
                      <span className="text-xs mt-0.5" style={{ color: "#c2a897" }}>
                        USD
                      </span>
                    </div>
                  </div>

                  <p className="text-xs mt-2 leading-relaxed" style={{ color: "#b0a090" }}>
                    {currentModelLabel}: ${inputPricePerMillion}/1M input tokens.{" "}
                    {pricingData?.updatedAt && (
                      <span>Prices updated {pricingData.updatedAt}. </span>
                    )}
                    <a
                      href="https://platform.openai.com/usage"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-2"
                      style={{ color: "#F96D1C" }}
                    >
                      See exact usage →
                    </a>
                  </p>
                </div>

                {/* Current model */}
                <div
                  className="flex items-center justify-between px-4 py-3 rounded-2xl"
                  style={{ background: "rgba(249,109,28,0.06)", border: "1px solid rgba(249,109,28,0.12)" }}
                >
                  <div>
                    <p className="text-xs font-semibold" style={{ color: "#2d2520" }}>AI-модель</p>
                    <p className="text-xs mt-0.5" style={{ color: "#8a7a70" }}>Используется во всех AI-функциях</p>
                  </div>
                  <button
                    onClick={() => setLocation("/models")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
                    style={{ background: "#F96D1C", color: "#fff" }}
                  >
                    {currentModelLabel}
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                {/* Replace key */}
                <div className="flex flex-col gap-2">
                  <Label className="text-xs" style={{ color: "#8a7a70" }}>{s.replaceKey}</Label>
                  <div className="flex gap-2">
                    <input
                      data-testid="input-replace-api-key"
                      type={showKey ? "text" : "password"}
                      value={apiKey}
                      onChange={e => setApiKey(e.target.value)}
                      placeholder={s.keyPlaceholder}
                      className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                      style={{
                        background: "rgba(249,109,28,0.07)",
                        border: "1.5px solid rgba(249,109,28,0.15)",
                        color: "#1a1a1a",
                        fontFamily: "monospace",
                      }}
                    />
                    <Button
                      data-testid="button-update-api-key"
                      onClick={() => saveKeyMutation.mutate()}
                      disabled={saveKeyMutation.isPending || !apiKey.trim()}
                      className="rounded-xl text-white text-sm"
                      style={{ background: "linear-gradient(135deg, #F96D1C 0%, #FF9640 100%)", border: "none" }}
                    >
                      {saveKeyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t.common.save}
                    </Button>
                  </div>
                </div>

                <button
                  data-testid="button-remove-api-key"
                  onClick={() => removeKeyMutation.mutate()}
                  disabled={removeKeyMutation.isPending}
                  className="flex items-center gap-1.5 text-xs self-start transition-opacity hover:opacity-70"
                  style={{ color: "#c0a090" }}
                >
                  <MTrash size={12} />
                  {s.removeKey}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <p className="text-sm leading-relaxed" style={{ color: "#8a7a70" }}>
                  {t.apiModal.desc}
                </p>
                <div className="flex gap-2">
                  <input
                    data-testid="input-openai-api-key"
                    type="password"
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && saveKeyMutation.mutate()}
                    placeholder={s.keyPlaceholder}
                    className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                    style={{
                      background: "rgba(249,109,28,0.07)",
                      border: "1.5px solid rgba(249,109,28,0.15)",
                      color: "#1a1a1a",
                      fontFamily: "monospace",
                    }}
                  />
                  <Button
                    data-testid="button-save-api-key"
                    onClick={() => saveKeyMutation.mutate()}
                    disabled={saveKeyMutation.isPending || !apiKey.trim()}
                    className="rounded-xl text-white text-sm"
                    style={{ background: "linear-gradient(135deg, #F96D1C 0%, #FF9640 100%)", border: "none" }}
                  >
                    {saveKeyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t.common.save}
                  </Button>
                </div>
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs"
                  style={{ color: "#F96D1C" }}
                >
                  <ExternalLink className="w-3 h-3" />
                  {t.apiModal.getKey}
                </a>
              </div>
            )}
          </section>

          {/* ── Account / Danger Zone ── */}
          <section className="rounded-3xl p-6" style={{ background: "rgba(239,68,68,0.04)", border: "1.5px solid rgba(239,68,68,0.18)" }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#DC2626" }} />
              <h2 className="text-sm font-semibold" style={{ color: "#DC2626" }}>{s.dangerZone}</h2>
            </div>
            <Button
              data-testid="button-logout"
              onClick={logout}
              variant="outline"
              className="flex items-center gap-2 rounded-xl text-sm"
              style={{ borderColor: "rgba(239,68,68,0.2)", color: "#8a7a70" }}
            >
              <MLogout size={14} />
              {t.nav.logout}
            </Button>
          </section>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
