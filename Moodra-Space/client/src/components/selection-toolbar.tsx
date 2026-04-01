import { useState, useEffect, useRef, useCallback } from "react";
import { Wand2, RefreshCw, Minimize2, ArrowUpRight, Globe, SpellCheck, Loader2, ChevronDown, Key, X, Zap, Pilcrow } from "lucide-react";
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
    paragraphs: "Paragraphs",
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
    paragraphs: "Абзацы",
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
    paragraphs: "Абзаци",
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
    paragraphs: "Absätze",
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
  bookGenre?: string;
  bookId?: number;
  positionBelow?: boolean;
  onResult: (original: string, improved: string, mode: string, savedRange: Range | null, blockIds: { startId: string; endId: string } | null) => void;
}

export function SelectionToolbar({ containerRef, bookTitle, bookMode, bookGenre, bookId, positionBelow, onResult }: Props) {
  const { lang } = useLang();
  const { isFreeMode, freeModel } = useFreeMode();
  const isQwenFree = isFreeMode && freeModel === "qwen";
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
  const savedRangeRef = useRef<Range | null>(null);
  const savedBlockIdsRef = useRef<{ startId: string; endId: string } | null>(null);
  const isMouseDownOnToolbar = useRef(false);

  const ACTIONS = [
    { mode: "improve",    label: s.improve,    icon: Wand2,       color: "#818CF8" },
    { mode: "rewrite",    label: s.rewrite,    icon: RefreshCw,   color: "#60A5FA" },
    { mode: "simplify",   label: s.simplify,   icon: Minimize2,   color: "#34D399" },
    { mode: "expand",     label: s.expand,     icon: ArrowUpRight,color: "#F59E0B" },
    { mode: "translate",  label: s.translate,  icon: Globe,       color: "#A78BFA" },
    { mode: "fix-grammar",label: s.fixGrammar, icon: SpellCheck,  color: "#6EE7B7" },
    { mode: "paragraphs", label: s.paragraphs, icon: Pilcrow,     color: "#FB923C" },
  ];

  // Compute toolbar position from the current selection range
  const computePosition = useCallback((range: Range) => {
    const container = containerRef.current;
    if (!container) return null;
    const containerRect = container.getBoundingClientRect();

    const clientRects = range.getClientRects();
    const firstRect = clientRects[0];
    const lastRect = clientRects[clientRects.length - 1];
    if (!firstRect || !firstRect.width) return null;

    // Verify the selection START is within the container (lenient horizontal check only)
    if (
      firstRect.left < containerRect.left - 20 ||
      firstRect.right > containerRect.right + 20
    ) return null;

    const toolbarWidth = 580;
    // Center toolbar horizontally over the selection
    let left = firstRect.left + firstRect.width / 2 - toolbarWidth / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - toolbarWidth - 8));

    let top: number;
    if (positionBelow) {
      // Position below the last line of the selection
      const refRect = lastRect || firstRect;
      const naturalBottom = refRect.bottom + 8;
      top = naturalBottom + 120 > window.innerHeight
        ? Math.max(8, refRect.top - 54)
        : naturalBottom;
    } else {
      // Original behavior: above the first line
      const naturalTop = firstRect.top - 54;
      top = naturalTop < 60
        ? Math.round(window.innerHeight * 0.45)
        : Math.min(naturalTop, window.innerHeight - 80);
    }
    return { top, left };
  }, [containerRef, positionBelow]);

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
    const raw = sel.toString().trim();
    if (raw.length < 5) { setVisible(false); return; }
    // Normalise block boundaries: browser puts single \n between block elements,
    // replace with \n\n so the AI sees proper paragraph breaks and preserves them.
    const text = raw.replace(/\n+/g, "\n\n");

    const range = sel.getRangeAt(0);
    const pos = computePosition(range);
    if (!pos) { setVisible(false); return; }

    selectedTextRef.current = text;
    savedRangeRef.current = range.cloneRange();
    // Capture block IDs immediately (before DOM can go stale)
    const getBlockId = (node: Node): string => {
      let cur: Node | null = node;
      while (cur) {
        if (cur instanceof HTMLElement) {
          const id = cur.getAttribute("data-block-id");
          if (id) return id;
        }
        cur = cur.parentNode;
      }
      return "";
    };
    const startId = getBlockId(range.startContainer);
    const endId   = getBlockId(range.endContainer);
    savedBlockIdsRef.current = startId ? { startId, endId: endId || startId } : null;
    setPosition(pos);
    setVisible(true);
    setShowNoApi(false);
  }, [computePosition]);

  useEffect(() => {
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, [handleSelectionChange]);

  // Re-position toolbar on scroll so it tracks the selection
  useEffect(() => {
    const handleScroll = () => {
      if (!visible) return;
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) return;
      const range = sel.getRangeAt(0);
      const pos = computePosition(range);
      if (pos) {
        setPosition(pos);
      } else {
        setVisible(false);
      }
    };
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [visible, computePosition]);

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
    if (isFreeMode && !isQwenFree) { setShowNoApi(true); return; }
    setLoading(mode);
    setShowTranslatePicker(false);
    setShowToneInput(false);
    try {
      if (isQwenFree) {
        // Qwen 3 free path — uses Pollinations
        const resp = await fetch("/api/ai/improve-free", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            mode,
            targetLang: extraParams?.targetLang || "",
            customInstruction: extraParams?.customInstruction || "",
          }),
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.message || data.error || "error");
        onResult(text, data.improved || "", mode, savedRangeRef.current, savedBlockIdsRef.current);
      } else {
        // Paid OpenAI path
        const resp = await fetch("/api/ai/improve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            mode,
            bookTitle: bookTitle || "",
            bookMode: bookMode || "fiction",
            bookGenre: bookGenre || "",
            customInstruction: extraParams?.customInstruction || "",
            targetLang: extraParams?.targetLang || "",
            bookId: bookId != null ? String(bookId) : undefined,
            useRoleModels: bookId != null,
            selectedRoleModelIds: [],
          }),
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || "error");
        onResult(text, data.improved || "", mode, savedRangeRef.current, savedBlockIdsRef.current);
      }
      setVisible(false);
    } catch {
    } finally {
      setLoading(null);
    }
  }, [loading, isFreeMode, isQwenFree, bookTitle, bookMode, bookId, onResult]);

  const handleActionClick = useCallback((mode: string) => {
    if (isFreeMode && !isQwenFree) {
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
  }, [isFreeMode, isQwenFree, runAction]);

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
            style={{ color: loading === mode ? color : (isFreeMode && !isQwenFree ? "#64748B" : "#CBD5E1") }}
            title={label}
          >
            {loading === mode
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color }} />
              : <Icon className="w-3.5 h-3.5" style={{ color: isFreeMode && !isQwenFree ? "#475569" : color }} />
            }
            <span>{label}</span>
            {(mode === "translate" || mode === "adapt-tone") && (
              <ChevronDown className="w-3 h-3 opacity-50" />
            )}
          </button>
        ))}

        {isFreeMode && !isQwenFree && (
          <div className="w-px h-5 mx-1 flex-shrink-0" style={{ background: "rgba(255,255,255,0.08)" }} />
        )}
        {isFreeMode && !isQwenFree && (
          <button
            onClick={() => setShowNoApi(v => !v)}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all hover:bg-white/10"
            style={{ color: "#F96D1C" }}
            title="API key required"
          >
            <Key className="w-3.5 h-3.5" />
          </button>
        )}
        {isQwenFree && (
          <div className="w-px h-5 mx-1 flex-shrink-0" style={{ background: "rgba(255,255,255,0.08)" }} />
        )}
        {isQwenFree && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(52,211,153,0.2)" }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#34D399" }} />
            <span className="text-[9px] font-bold" style={{ color: "#34D399" }}>Qwen 3</span>
          </div>
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
            maxWidth: 400,
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

          {/* Qwen 3 as free alternative */}
          <div className="rounded-xl p-3 flex items-center gap-2.5" style={{ background: "rgba(16,185,129,0.10)", border: "1px solid rgba(52,211,153,0.2)" }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(16,185,129,0.2)" }}>
              <Zap className="w-3.5 h-3.5" style={{ color: "#34D399" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold" style={{ color: "#34D399" }}>
                {lang === "ru" ? "Бесплатно с Qwen 3" : lang === "ua" ? "Безплатно з Qwen 3" : lang === "de" ? "Kostenlos mit Qwen 3" : "Free with Qwen 3"}
              </p>
              <p className="text-[10px]" style={{ color: "rgba(148,163,184,0.7)" }}>
                {lang === "ru" ? "Переключитесь на Qwen 3 в разделе Модели — и все эти функции станут доступны бесплатно." : lang === "ua" ? "Перейдіть на Qwen 3 у розділі Моделі — і всі ці функції стануть доступні безплатно." : lang === "de" ? "Wechsle zu Qwen 3 in Modelle — alle Funktionen werden kostenlos verfügbar." : "Switch to Qwen 3 in Models — all these functions become free."}
              </p>
            </div>
            <button
              onClick={() => { navigate("/models"); setVisible(false); setShowNoApi(false); }}
              className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg flex-shrink-0 transition-all hover:opacity-80"
              style={{ background: "rgba(16,185,129,0.25)", color: "#34D399" }}
            >
              {lang === "ru" ? "Сменить" : lang === "ua" ? "Змінити" : lang === "de" ? "Wechseln" : "Switch"}
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
