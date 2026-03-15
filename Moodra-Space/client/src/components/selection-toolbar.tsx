import { useState, useEffect, useRef, useCallback } from "react";
import { Wand2, RefreshCw, Minimize2, ArrowUpRight, Globe, SpellCheck, Loader2, ChevronDown, Key, X, Zap } from "lucide-react";
import { useLang } from "@/contexts/language-context";
import { useFreeMode } from "@/hooks/use-free-mode";
import { useLocation } from "wouter";

const ADAPT_LANGUAGES = [
  { code: "English",    label: "English" },
  { code: "Spanish",   label: "Español" },
  { code: "German",    label: "Deutsch" },
  { code: "French",    label: "Français" },
  { code: "Italian",   label: "Italiano" },
  { code: "Portuguese",label: "Português" },
  { code: "Chinese",   label: "中文" },
  { code: "Japanese",  label: "日本語" },
  { code: "Korean",    label: "한국어" },
  { code: "Ukrainian", label: "Українська" },
  { code: "Russian",   label: "Русский" },
];

const I18N = {
  en: {
    improve: "Improve",
    rewrite: "Rewrite",
    simplify: "Simplify",
    expand: "Expand",
    translate: "Translate",
    adaptTone: "Adapt tone",
    fixGrammar: "Fix grammar",
    customInstruction: "Instruction (optional)…",
    run: "Run",
    cancel: "Cancel",
    selectLang: "Select language",
    noApiTitle: "Smarter AI needed",
    noApiBody: "These functions require your own API key. Connect it once — and use everything without limits.",
    noApiBtn: "Connect API →",
  },
  ru: {
    improve: "Улучшить",
    rewrite: "Переписать",
    simplify: "Упростить",
    expand: "Расширить",
    translate: "Перевести",
    adaptTone: "Изменить тон",
    fixGrammar: "Исправить грамматику",
    customInstruction: "Инструкция (необязательно)…",
    run: "Запустить",
    cancel: "Отмена",
    selectLang: "Выберите язык",
    noApiTitle: "Упс, нужен умный ИИ",
    noApiBody: "Для этих функций нужен свой API-ключ. Подключи один раз — пользуйся всем без ограничений.",
    noApiBtn: "Подключить API →",
  },
  ua: {
    improve: "Покращити",
    rewrite: "Переписати",
    simplify: "Спростити",
    expand: "Розширити",
    translate: "Перекласти",
    adaptTone: "Змінити тон",
    fixGrammar: "Виправити граматику",
    customInstruction: "Інструкція (необов'язково)…",
    run: "Запустити",
    cancel: "Скасувати",
    selectLang: "Оберіть мову",
    noApiTitle: "Упс, потрібен розумніший ІІ",
    noApiBody: "Ці функції потребують власного API-ключа. Підключи раз — і користуйся всім без обмежень.",
    noApiBtn: "Підключити API →",
  },
  de: {
    improve: "Verbessern",
    rewrite: "Umschreiben",
    simplify: "Vereinfachen",
    expand: "Erweitern",
    translate: "Übersetzen",
    adaptTone: "Ton anpassen",
    fixGrammar: "Grammatik korrigieren",
    customInstruction: "Anweisung (optional)…",
    run: "Ausführen",
    cancel: "Abbrechen",
    selectLang: "Sprache wählen",
    noApiTitle: "Intelligentere KI erforderlich",
    noApiBody: "Diese Funktionen benötigen deinen eigenen API-Schlüssel. Einmal verbinden — alles ohne Limits nutzen.",
    noApiBtn: "API verbinden →",
  },
};

interface Props {
  containerRef: React.RefObject<HTMLElement>;
  bookTitle?: string;
  bookMode?: string;
  onResult: (original: string, improved: string, mode: string) => void;
}

export function SelectionToolbar({ containerRef, bookTitle, bookMode, onResult }: Props) {
  const { lang } = useLang();
  const { isFreeMode } = useFreeMode();
  const [, navigate] = useLocation();
  const s = I18N[lang as keyof typeof I18N] ?? I18N.en;

  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [loading, setLoading] = useState<string | null>(null);
  const [showTranslatePicker, setShowTranslatePicker] = useState(false);
  const [showToneInput, setShowToneInput] = useState(false);
  const [toneInstruction, setToneInstruction] = useState("");
  const [showNoApi, setShowNoApi] = useState(false);

  const toolbarRef = useRef<HTMLDivElement>(null);
  // Always-current copies (avoid stale closures)
  const selectedTextRef = useRef("");
  const isMouseDownOnToolbar = useRef(false);

  const ACTIONS = [
    { mode: "improve",    label: s.improve,    icon: Wand2,       color: "#818CF8" },
    { mode: "rewrite",    label: s.rewrite,    icon: RefreshCw,   color: "#60A5FA" },
    { mode: "simplify",   label: s.simplify,   icon: Minimize2,   color: "#34D399" },
    { mode: "expand",     label: s.expand,     icon: ArrowUpRight,color: "#F59E0B" },
    { mode: "translate",  label: s.translate,  icon: Globe,       color: "#A78BFA" },
    { mode: "fix-grammar",label: s.fixGrammar, icon: SpellCheck,  color: "#6EE7B7" },
  ];

  const handleSelectionChange = useCallback(() => {
    // Don't react to selection changes while we're clicking inside the toolbar
    if (isMouseDownOnToolbar.current) return;

    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) {
      setVisible(false);
      setShowTranslatePicker(false);
      setShowToneInput(false);
      setShowNoApi(false);
      return;
    }
    const text = sel.toString().trim();
    if (text.length < 5) { setVisible(false); return; }

    const container = containerRef.current;
    if (!container) return;
    const range = sel.getRangeAt(0);
    const rangeRect = range.getBoundingClientRect();
    if (!rangeRect.width) { setVisible(false); return; }

    const containerRect = container.getBoundingClientRect();
    if (
      rangeRect.top < containerRect.top ||
      rangeRect.bottom > containerRect.bottom + 80 ||
      rangeRect.left < containerRect.left - 20 ||
      rangeRect.right > containerRect.right + 20
    ) {
      setVisible(false);
      return;
    }

    selectedTextRef.current = text;
    const toolbarWidth = 500;
    let left = rangeRect.left + rangeRect.width / 2 - toolbarWidth / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - toolbarWidth - 8));
    const top = rangeRect.top - 54;
    setPosition({ top, left });
    setVisible(true);
    setShowNoApi(false);
  }, [containerRef]);

  useEffect(() => {
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, [handleSelectionChange]);

  // Close sub-panels when clicking outside toolbar
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (toolbarRef.current && toolbarRef.current.contains(e.target as Node)) {
        isMouseDownOnToolbar.current = true;
      } else {
        isMouseDownOnToolbar.current = false;
        setShowTranslatePicker(false);
        setShowToneInput(false);
      }
    };
    const onMouseUp = () => {
      isMouseDownOnToolbar.current = false;
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  const runAction = useCallback(async (mode: string, extraParams?: Record<string, string>) => {
    const text = selectedTextRef.current;
    if (!text || loading) return;
    if (isFreeMode) { setShowNoApi(true); return; }
    setLoading(mode);
    setShowTranslatePicker(false);
    setShowToneInput(false);
    try {
      const resp = await fetch("/api/ai/improve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          mode,
          bookTitle: bookTitle || "",
          bookMode: bookMode || "fiction",
          customInstruction: extraParams?.customInstruction || "",
          targetLang: extraParams?.targetLang || "",
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "error");
      onResult(text, data.improved || "", mode);
      setVisible(false);
    } catch {
    } finally {
      setLoading(null);
    }
  }, [loading, isFreeMode, bookTitle, bookMode, onResult]);

  const handleActionClick = useCallback((mode: string) => {
    if (isFreeMode) {
      setShowNoApi(true);
      setShowTranslatePicker(false);
      setShowToneInput(false);
      return;
    }
    if (mode === "translate") {
      setShowToneInput(false);
      setShowTranslatePicker(v => !v);
    } else if (mode === "adapt-tone") {
      setShowTranslatePicker(false);
      setShowToneInput(v => !v);
    } else {
      runAction(mode);
    }
  }, [isFreeMode, runAction]);

  if (!visible) return null;

  return (
    <div
      ref={toolbarRef}
      className="fixed z-[9999] flex flex-col gap-1"
      style={{ top: position.top, left: position.left }}
      onMouseDown={e => {
        // Keep text selection; allow inputs to focus normally
        if ((e.target as HTMLElement).tagName !== "INPUT") e.preventDefault();
      }}
    >
      {/* Main toolbar */}
      <div
        className="flex items-center gap-0.5 rounded-xl px-1 py-1 shadow-xl border border-white/10"
        style={{ background: "rgba(18,18,28,0.97)", backdropFilter: "blur(12px)" }}
      >
        {ACTIONS.map(({ mode, label, icon: Icon, color }) => (
          <button
            key={mode}
            disabled={!!loading}
            onClick={() => handleActionClick(mode)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all hover:bg-white/10 disabled:opacity-40"
            style={{ color: loading === mode ? color : (isFreeMode ? "#64748B" : "#CBD5E1") }}
            title={label}
          >
            {loading === mode
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color }} />
              : <Icon className="w-3.5 h-3.5" style={{ color: isFreeMode ? "#475569" : color }} />
            }
            <span>{label}</span>
            {(mode === "translate" || mode === "adapt-tone") && (
              <ChevronDown className="w-3 h-3 opacity-50" />
            )}
          </button>
        ))}

        {isFreeMode && (
          <div className="w-px h-5 mx-1 flex-shrink-0" style={{ background: "rgba(255,255,255,0.08)" }} />
        )}
        {isFreeMode && (
          <button
            onClick={() => setShowNoApi(v => !v)}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all hover:bg-white/10"
            style={{ color: "#F96D1C" }}
            title="API key required"
          >
            <Key className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* No-API popup */}
      {showNoApi && (
        <div
          className="rounded-2xl border border-white/10 shadow-2xl p-4 flex flex-col gap-3"
          style={{
            background: "rgba(18,18,28,0.97)",
            backdropFilter: "blur(16px)",
            minWidth: 320,
            maxWidth: 380,
            borderColor: "rgba(249,109,28,0.3)",
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(249,109,28,0.15)" }}
            >
              <Zap className="w-4 h-4" style={{ color: "#F96D1C" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold mb-1" style={{ color: "#F1F5F9" }}>
                {s.noApiTitle}
              </p>
              <p className="text-[11px] leading-relaxed" style={{ color: "#94A3B8" }}>
                {s.noApiBody}
              </p>
            </div>
            <button
              onClick={() => setShowNoApi(false)}
              className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 flex-shrink-0 mt-0.5"
              style={{ color: "#475569" }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => { navigate("/settings"); setVisible(false); setShowNoApi(false); }}
            className="w-full py-2 px-4 rounded-xl text-[12px] font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, #F96D1C 0%, #FF9640 100%)",
              color: "#fff",
              border: "none",
            }}
          >
            {s.noApiBtn}
          </button>
        </div>
      )}

      {/* Translate language picker */}
      {showTranslatePicker && !showNoApi && (
        <div
          className="rounded-xl border border-white/10 shadow-xl p-2 grid grid-cols-3 gap-1"
          style={{ background: "rgba(18,18,28,0.97)", backdropFilter: "blur(12px)" }}
        >
          {ADAPT_LANGUAGES.map(l => (
            <button
              key={l.code}
              onClick={() => runAction("translate", { targetLang: l.code })}
              disabled={!!loading}
              className="px-2 py-1.5 rounded-lg text-[11px] text-slate-300 hover:bg-white/10 hover:text-white transition-all text-left disabled:opacity-40"
            >
              {l.label}
            </button>
          ))}
        </div>
      )}

      {/* Tone adapt input */}
      {showToneInput && !showNoApi && (
        <div
          className="rounded-xl border border-white/10 shadow-xl p-2 flex gap-2 items-center"
          style={{ background: "rgba(18,18,28,0.97)", backdropFilter: "blur(12px)", minWidth: 340 }}
        >
          <input
            autoFocus
            type="text"
            value={toneInstruction}
            onChange={e => setToneInstruction(e.target.value)}
            onKeyDown={e => e.key === "Enter" && toneInstruction.trim() && runAction("adapt-tone", { customInstruction: toneInstruction })}
            placeholder={s.customInstruction}
            className="flex-1 bg-white/5 border border-white/15 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-200 outline-none focus:border-pink-400/50 placeholder:text-slate-500"
          />
          <button
            onClick={() => toneInstruction.trim() && runAction("adapt-tone", { customInstruction: toneInstruction })}
            disabled={!toneInstruction.trim() || !!loading}
            className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold disabled:opacity-40 transition-all"
            style={{ background: "rgba(244,114,182,0.2)", color: "#F472B6", border: "1px solid rgba(244,114,182,0.3)" }}
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : s.run}
          </button>
        </div>
      )}
    </div>
  );
}
