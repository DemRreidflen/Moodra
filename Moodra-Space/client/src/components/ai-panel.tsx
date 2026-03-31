import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Book, Chapter } from "@shared/schema";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useAiError } from "@/contexts/ai-error-context";
import { useLang } from "@/contexts/language-context";
import { useFreeMode } from "@/hooks/use-free-mode";
import {
  Sparkles, ArrowDownToLine, Wand2, X,
  Brain, PenLine, BookPlus, Layers, Lightbulb, Feather,
  Copy, Check, RefreshCw, BookOpen, Telescope, FileSearch,
  Scan, ToggleLeft, ToggleRight, Square, ChevronDown, ChevronUp, ChevronRight,
  Users, Scale, Link2, Save, BookMarked, BarChart2, Clock, AlertTriangle,
  Loader2, UserSearch, Upload, FileText, CheckCircle2, Navigation
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const AI_MODES = [
  { value: "continue",     icon: PenLine,   ru: "Продолжить",   ua: "Продовжити",   de: "Weiter",      en: "Continue",     descRu: "Продолжает текст",   descEn: "Continues text" },
  { value: "develop",      icon: Brain,     ru: "Развить",      ua: "Розвинути",    de: "Entwickeln",  en: "Develop",      descRu: "Новые идеи",          descEn: "New ideas" },
  { value: "newChapter",   icon: BookPlus,  ru: "Глава",        ua: "Розділ",       de: "Kapitel",     en: "Chapter",      descRu: "Новая глава",         descEn: "New chapter" },
  { value: "alternatives", icon: Layers,    ru: "Варианты",     ua: "Варіанти",     de: "Varianten",   en: "Variants",     descRu: "3–5 вариантов",       descEn: "3–5 variants" },
  { value: "improve",      icon: Wand2,     ru: "Улучшить",     ua: "Покращити",    de: "Verbessern",  en: "Improve",      descRu: "Редактура",           descEn: "Polish text" },
  { value: "ideas",        icon: Lightbulb, ru: "Идеи",         ua: "Ідеї",         de: "Ideen",       en: "Ideas",        descRu: "Концепции",           descEn: "Concepts" },
];

const QUICK_PROMPTS: Record<string, Record<string, string[]>> = {
  scientific: {
    ru: ["Напиши тезис для этой главы", "Добавь научные аргументы", "Создай вводный абзац", "Напиши заключение главы", "Добавь примеры и доказательства", "Структурируй основные идеи"],
    ua: ["Напиши тезу для цього розділу", "Додай наукові аргументи", "Створи вступний абзац", "Напиши висновок розділу", "Додай приклади та докази", "Структуруй основні ідеї"],
    de: ["Schreibe eine These für dieses Kapitel", "Füge wissenschaftliche Argumente hinzu", "Erstelle einen Einleitungsabsatz", "Schreibe den Kapitelabschluss", "Füge Beispiele und Belege hinzu", "Strukturiere Hauptideen"],
    en: ["Write a thesis for this chapter", "Add scientific arguments", "Create an opening paragraph", "Write the chapter conclusion", "Add examples and evidence", "Structure the main ideas"],
  },
  fiction: {
    ru: ["Опиши окружение и атмосферу", "Напиши диалог между персонажами", "Создай поворот сюжета", "Развей внутренний конфликт героя", "Опиши эмоциональное состояние", "Напиши экшн-сцену"],
    ua: ["Опиши оточення та атмосферу", "Напиши діалог між персонажами", "Створи поворот сюжету", "Розвий внутрішній конфлікт героя", "Опиши емоційний стан", "Напиши екшн-сцену"],
    de: ["Beschreibe Umgebung und Atmosphäre", "Schreibe einen Dialog zwischen Charakteren", "Erstelle eine Wendung im Plot", "Entwickle den inneren Konflikt des Helden", "Beschreibe den emotionalen Zustand", "Schreibe eine Actionszene"],
    en: ["Describe the setting and atmosphere", "Write a dialogue between characters", "Create a plot twist", "Develop the hero's inner conflict", "Describe the emotional state", "Write an action scene"],
  },
};

const EDIT_ACTIONS = [
  { id: "expand",    icon: Telescope,  ru: "Расширить",          ua: "Розширити",           de: "Erweitern",         en: "Expand" },
  { id: "shorten",   icon: Scan,       ru: "Сократить",           ua: "Скоротити",           de: "Kürzen",            en: "Shorten" },
  { id: "rephrase",  icon: RefreshCw,  ru: "Переформулировать",   ua: "Переформулювати",     de: "Umformulieren",     en: "Rephrase" },
  { id: "strengthen",icon: Feather,    ru: "Усилить",             ua: "Підсилити",           de: "Verstärken",        en: "Strengthen" },
  { id: "fix",       icon: Check,      ru: "Исправить ошибки",    ua: "Виправити помилки",   de: "Fehler korrigieren", en: "Fix errors" },
];

const CHAPTER_GENERATORS = [
  {
    id: "chapters",
    icon: BookOpen,
    label: "Предложить главы",
    desc: "5 новых глав с описанием",
    prompt: "Предложи 5 новых глав",
    accent: "#3B82F6",
    bg: "#EFF6FF",
  },
  {
    id: "topics",
    icon: Lightbulb,
    label: "Новые темы",
    desc: "Темы для развития книги",
    prompt: "Предложи новые темы для книги",
    accent: "#F59E0B",
    bg: "#FFFBEB",
  },
  {
    id: "research",
    icon: Telescope,
    label: "Исследования",
    desc: "Новые исследовательские векторы",
    prompt: "Предложи направления исследований",
    accent: "#10B981",
    bg: "#F0FDF4",
  },
];

interface NarrativeContext {
  coreIdea?: string;
  themes?: string;
  subthemes?: string;
  structure?: string;
  tone?: string;
  toneDetails?: string;
  targetReader?: string;
  targetReaderProfile?: string;
  keyArguments?: string;
  characterArcs?: string;
  pacingNotes?: string;
  writingStyleNotes?: string;
}

const AGENTS = [
  { id: "editor",           icon: PenLine,    color: "#3B82F6", fullWidth: false,
    ru: "Редактор",        en: "Editor",        ua: "Редактор",    de: "Editor",
    descRu: "Ясность и структура",   descEn: "Clarity & structure", descUa: "Ясність і структура",   descDe: "Klarheit & Struktur" },
  { id: "critic",           icon: FileSearch, color: "#EF4444", fullWidth: false,
    ru: "Критик",          en: "Critic",        ua: "Критик",      de: "Kritiker",
    descRu: "Логика и доводы",        descEn: "Logic & arguments",   descUa: "Логіка і докази",       descDe: "Logik & Argumente" },
  { id: "philosopher",      icon: Brain,      color: "#8B5CF6", fullWidth: false,
    ru: "Философ",         en: "Philosopher",   ua: "Філософ",     de: "Philosoph",
    descRu: "Глубокий смысл",         descEn: "Deeper meaning",      descUa: "Глибокий сенс",         descDe: "Tiefere Bedeutung" },
  { id: "reader",           icon: Users,      color: "#10B981", fullWidth: false,
    ru: "Читатель",        en: "Reader",        ua: "Читач",       de: "Leser",
    descRu: "Реакция читателя",       descEn: "Reader reaction",     descUa: "Реакція читача",        descDe: "Leserperspektive" },
  { id: "story_analyst",    icon: BookOpen,   color: "#F59E0B", fullWidth: false,
    ru: "Нарратолог",      en: "Story",         ua: "Наратолог",   de: "Erzählung",
    descRu: "Темп и структура",       descEn: "Pacing & structure",  descUa: "Темп і структура",      descDe: "Tempo & Struktur" },
  { id: "argument_analyst", icon: Scale,      color: "#06B6D4", fullWidth: false,
    ru: "Аргументы",       en: "Arguments",     ua: "Аргументи",   de: "Argumente",
    descRu: "Сила доводов",           descEn: "Argument strength",   descUa: "Сила доводів",          descDe: "Argumentstärke" },
  { id: "consistency",      icon: Link2,      color: "#F97316", fullWidth: true,
    ru: "Согласованность", en: "Consistency",   ua: "Узгодженість", de: "Konsistenz",
    descRu: "Проверка противоречий, непоследовательности и ошибок",
    descEn: "Contradictions, inconsistencies & continuity errors",
    descUa: "Перевірка суперечностей, непослідовності та помилок",
    descDe: "Widersprüche, Inkonsistenzen & Kontinuitätsfehler" },
] as const;

const READER_PROFILES = [
  { value: "beginner",  ru: "Начинающий",    en: "Beginner",  ua: "Початківець", de: "Anfänger" },
  { value: "expert",    ru: "Эксперт",        en: "Expert",    ua: "Експерт",     de: "Experte" },
  { value: "skeptic",   ru: "Скептик",        en: "Skeptic",   ua: "Скептик",     de: "Skeptiker" },
  { value: "emotional", ru: "Эмоциональный",  en: "Emotional", ua: "Емоційний",   de: "Emotional" },
  { value: "editorial", ru: "Редакторский",   en: "Editorial", ua: "Редакторський", de: "Lektorisch" },
];

const NC_STRUCTURES = [
  { value: "argumentative",  ru: "Аргументативная",  en: "Argumentative",  ua: "Аргументативна",    de: "Argumentativ" },
  { value: "narrative_arc",  ru: "Нарративная дуга", en: "Narrative Arc",  ua: "Наративна дуга",   de: "Erzählbogen" },
  { value: "research",       ru: "Исследование",      en: "Research",       ua: "Дослідження",       de: "Forschung" },
  { value: "hybrid",         ru: "Гибридная",         en: "Hybrid",         ua: "Гібридна",          de: "Hybrid" },
];

const NC_TONES = [
  { value: "serious",        ru: "Серьёзный",    en: "Serious",       ua: "Серйозний",    de: "Seriös" },
  { value: "academic",       ru: "Академический", en: "Academic",     ua: "Академічний",  de: "Akademisch" },
  { value: "conversational", ru: "Разговорный",  en: "Conversational", ua: "Розмовний",  de: "Gesprächig" },
  { value: "lyrical",        ru: "Лирический",   en: "Lyrical",       ua: "Ліричний",     de: "Lyrisch" },
  { value: "playful",        ru: "Игривый",      en: "Playful",       ua: "Грайливий",    de: "Verspielt" },
];

const NC_READERS = [
  { value: "general",   ru: "Широкая аудитория", en: "General Audience", ua: "Широка аудиторія",  de: "Breites Publikum" },
  { value: "beginner",  ru: "Начинающий",        en: "Beginner",         ua: "Початківець",       de: "Anfänger" },
  { value: "expert",    ru: "Эксперт",           en: "Expert",           ua: "Експерт",           de: "Experte" },
  { value: "academic",  ru: "Академический",     en: "Academic",         ua: "Академічний",       de: "Akademisch" },
];

interface StyleAnalysis {
  vocabularyLevel: string;
  avgSentenceLength: string;
  tone: string;
  rhythm: string;
  pov?: string;
  dialogueStyle?: string;
  devices: string[];
  patterns: string;
  summary: string;
  styleInstruction?: string;
}

interface GeneratedBlock {
  id: string;
  mode: string;
  prompt: string;
  text: string;
  timestamp: Date;
}

interface Props {
  book: Book;
  chapter: Chapter | null;
  context: string;
  chapters?: Chapter[];
  onInsert: ((text: string) => void) | null;
}

const MODEL_DISPLAY: Record<string, string> = {
  "gpt-4o-mini":  "GPT-4o mini",
  "gpt-4.1-mini": "GPT-4.1 mini",
  "gpt-4o":       "GPT-4o",
  "gpt-4.1":      "GPT-4.1",
  "o4-mini":      "o4-mini",
};

const FREE_THINKING_MSGS: Record<string, string[]> = {
  en: ["Gathering notes…", "Reading your text…", "Thinking…", "Formulating answer…"],
  ru: ["Собирает заметки…", "Читает текст…", "Думает…", "Формирует ответ…"],
  ua: ["Збирає нотатки…", "Читає текст…", "Думає…", "Формує відповідь…"],
  de: ["Sammelt Notizen…", "Liest den Text…", "Denkt nach…", "Formuliert Antwort…"],
};

export function AiPanel({ book, chapter, context, chapters = [], onInsert }: Props) {
  const { toast } = useToast();
  const { handleAiError } = useAiError();
  const { lang } = useLang();
  const [, setLocation] = useLocation();
  const { data: user } = useQuery<any>({ queryKey: ["/api/auth/user"] });
  const currentModel = (user as any)?.openaiModel || "gpt-4o-mini";
  const modelLabel = MODEL_DISPLAY[currentModel] || currentModel;
  const { isFreeMode } = useFreeMode();
  const [mode, setMode] = useState("continue");
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [freeThinkingIdx, setFreeThinkingIdx] = useState(0);
  const freeThinkingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [history, setHistory] = useState<GeneratedBlock[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [styleAnalysis, setStyleAnalysis] = useState<StyleAnalysis | null>(null);
  const [analyzingStyle, setAnalyzingStyle] = useState(false);
  const [applyStyle, setApplyStyle] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editResult, setEditResult] = useState<{ mode: string; text: string } | null>(null);
  const [editLoading, setEditLoading] = useState<string | null>(null);
  const [freeGateOpen, setFreeGateOpen] = useState(false);
  const [formatPrompt, setFormatPrompt] = useState("");
  const [formatLoading, setFormatLoading] = useState(false);
  const [customEditText, setCustomEditText] = useState("");
  const [showCustomEdit, setShowCustomEdit] = useState(false);
  const [usePollinations, setUsePollinations] = useState(false);
  const [lastGenResult, setLastGenResult] = useState<{ text: string; mode: string; prompt: string } | null>(null);
  const [expandStylePrompt, setExpandStylePrompt] = useState("");
  const [showExpandStyle, setShowExpandStyle] = useState(false);
  const [expandingStyle, setExpandingStyle] = useState(false);
  const [uploadedFileText, setUploadedFileText] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const streamRef = useRef<HTMLDivElement>(null);

  // Spell/grammar errors from BlockEditor (via moodra:spell-update event)
  const [spellMatches, setSpellMatches] = useState<any[]>([]);
  useEffect(() => {
    const h = (e: Event) => setSpellMatches((e as CustomEvent).detail?.matches ?? []);
    window.addEventListener("moodra:spell-update", h);
    return () => window.removeEventListener("moodra:spell-update", h);
  }, []);

  // ── Narrative Intelligence state ──────────────────────────────────────────
  const [ncCtx, setNcCtx] = useState<NarrativeContext>({});
  const [ncOpen, setNcOpen] = useState(false);
  const [ncSaving, setNcSaving] = useState(false);
  const [ncSaved, setNcSaved] = useState(false);
  const [agentLoading, setAgentLoading] = useState<string | null>(null);
  const [agentResult, setAgentResult] = useState<string | null>(null);
  const [lastAgent, setLastAgent] = useState<string | null>(null);
  const [readerProfile, setReaderProfile] = useState("expert");
  const [agentCopied, setAgentCopied] = useState(false);
  const [agentSaved, setAgentSaved] = useState(false);
  const [agentSaving, setAgentSaving] = useState(false);
  const [authorOpen, setAuthorOpen] = useState(false);
  const [authorText, setAuthorText] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorResult, setAuthorResult] = useState<string | null>(null);
  const [authorLoading, setAuthorLoading] = useState(false);
  const [authorCopied, setAuthorCopied] = useState(false);
  const [authorSaved, setAuthorSaved] = useState(false);
  const [collabOpen, setCollabOpen] = useState(false);
  const [collabResult, setCollabResult] = useState<string | null>(null);
  const [collabLoading, setCollabLoading] = useState(false);
  const [collabCopied, setCollabCopied] = useState(false);
  const [collabSaved, setCollabSaved] = useState(false);
  const [authorFileLoading, setAuthorFileLoading] = useState(false);
  const [authorSavedAsModel, setAuthorSavedAsModel] = useState(false);
  const [authorModelSaving, setAuthorModelSaving] = useState(false);
  const authorFileRef = useRef<HTMLInputElement | null>(null);

  const thinkingMsgs = FREE_THINKING_MSGS[lang as keyof typeof FREE_THINKING_MSGS] || FREE_THINKING_MSGS.en;
  const modeLabel = (m: typeof AI_MODES[0]) => lang === "ru" ? m.ru : lang === "ua" ? m.ua : lang === "de" ? m.de : m.en;
  const modeDesc  = (m: typeof AI_MODES[0]) => lang === "ru" ? m.descRu : m.descEn;

  const currentMode = AI_MODES.find(m => m.value === mode) || AI_MODES[0];
  const quickPrompts = (QUICK_PROMPTS[book.mode || "scientific"] || QUICK_PROMPTS.scientific)[lang as "ru"|"ua"|"de"|"en"] || QUICK_PROMPTS.scientific.ru;

  useEffect(() => {
    if (streamRef.current && generating) {
      streamRef.current.scrollTop = streamRef.current.scrollHeight;
    }
  }, [streamText, generating]);

  useEffect(() => {
    fetch(`/api/books/${book.id}/narrative`)
      .then(r => r.ok ? r.json() : {})
      .then((data: NarrativeContext) => setNcCtx(data || {}))
      .catch(() => {});
  }, [book.id]);

  const saveNarrativeCtx = async () => {
    setNcSaving(true);
    setNcSaved(false);
    try {
      const resp = await fetch(`/api/books/${book.id}/narrative`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ncCtx),
      });
      if (resp.ok) {
        setNcSaved(true);
        setTimeout(() => setNcSaved(false), 2000);
        toast({ title: lang === "ru" ? "Контекст сохранён" : lang === "ua" ? "Контекст збережено" : "Context saved" });
      }
    } catch {}
    setNcSaving(false);
  };

  const plainText = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  const runAgent = async (agentId: string) => {
    if (agentLoading) return;
    const chapterRaw = chapter?.content || "";
    let chapterPlain = "";
    try {
      const parsed = typeof chapterRaw === "string" && chapterRaw.startsWith("[")
        ? JSON.parse(chapterRaw) : null;
      if (Array.isArray(parsed)) {
        chapterPlain = parsed.map((b: any) => plainText(b.content || b.text || "")).join("\n\n");
      } else {
        chapterPlain = plainText(chapterRaw);
      }
    } catch { chapterPlain = plainText(chapterRaw); }

    setAgentLoading(agentId);
    setLastAgent(agentId);
    setAgentResult(null);
    setAgentSaved(false);
    try {
      const resp = await fetch("/api/ai/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentType: agentId,
          readerProfile: agentId === "reader" ? readerProfile : undefined,
          chapterText: chapterPlain.slice(0, 3000),
          bookTitle: book.title,
          bookMode: book.mode,
          narrativeContext: ncCtx,
          lang,
          characters: [],
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        const err: any = new Error(data.error || "Agent error");
        err.code = data.code;
        throw err;
      }
      setAgentResult(data.result || "");
    } catch (e: any) {
      if (!handleAiError(e)) {
        toast({ title: lang === "ru" ? "Ошибка агента" : "Agent error", description: e?.message, variant: "destructive" });
      }
    } finally {
      setAgentLoading(null);
    }
  };

  const saveToResearch = async (
    type: "agent_review" | "author_analysis" | "agent_collab",
    title: string,
    agentLabel: string,
    result: string,
    setSaved: (v: boolean) => void,
    setSaving: (v: boolean) => void,
  ) => {
    setSaving(true);
    const now = new Date().toLocaleDateString(lang === "ru" ? "ru-RU" : lang === "ua" ? "uk-UA" : lang === "de" ? "de-DE" : "en-US");
    try {
      await fetch(`/api/books/${book.id}/sources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          author: agentLabel,
          type,
          url: "",
          quote: result.slice(0, 300) + (result.length > 300 ? "…" : ""),
          notes: result,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      toast({ title: lang === "ru" ? "Сохранено в исследования" : lang === "ua" ? "Збережено до досліджень" : lang === "de" ? "In Recherche gespeichert" : "Saved to Research" });
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
    setSaving(false);
  };

  const runAuthorAnalysis = async () => {
    if (!authorText.trim() || authorLoading) return;
    setAuthorLoading(true);
    setAuthorResult(null);
    setAuthorSaved(false);
    setAuthorSavedAsModel(false);
    try {
      const resp = await fetch("/api/ai/author-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: authorText, authorName, lang }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        const err: any = new Error(data.error || "Analysis error");
        err.code = data.code;
        throw err;
      }
      setAuthorResult(data.result || "");
    } catch (e: any) {
      if (!handleAiError(e)) {
        toast({ title: lang === "ru" ? "Ошибка анализа" : "Analysis error", description: e?.message, variant: "destructive" });
      }
    } finally {
      setAuthorLoading(false);
    }
  };

  // ── EPUB text extraction ──────────────────────────────────────────────────
  const extractEpubText = async (file: File): Promise<string> => {
    const JSZip = (await import("jszip")).default;
    const ab = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(ab);
    // Gather HTML/XHTML content files, sorted by name to preserve reading order
    const htmlFiles = Object.keys(zip.files)
      .filter(n => /\.(xhtml|html|htm)$/i.test(n) && !zip.files[n].dir)
      .sort();
    if (htmlFiles.length === 0) throw new Error("No readable content found in EPUB");
    const texts: string[] = [];
    for (const fn of htmlFiles.slice(0, 30)) {
      const raw = await zip.files[fn].async("string");
      const stripped = raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      if (stripped.length > 100) texts.push(stripped);
    }
    return texts.join("\n\n").slice(0, 12000);
  };

  const handleAuthorFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (authorFileRef.current) authorFileRef.current.value = "";
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: lang === "ru" ? "Файл слишком большой (макс. 10 МБ)" : "File too large (max 10 MB)", variant: "destructive" });
      return;
    }
    setAuthorFileLoading(true);
    try {
      let text = "";
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext === "epub") {
        text = await extractEpubText(file);
      } else {
        text = await file.text();
      }
      const name = file.name.replace(/\.[^.]+$/, "");
      if (!authorName) setAuthorName(name);
      setAuthorText(text.slice(0, 8000));
      setAuthorResult(null);
      setAuthorSavedAsModel(false);
      toast({ title: lang === "ru" ? `Загружено: ${name}` : `Loaded: ${name}` });
    } catch (err: any) {
      toast({ title: lang === "ru" ? "Ошибка чтения файла" : "File read error", description: err?.message, variant: "destructive" });
    } finally {
      setAuthorFileLoading(false);
    }
  };

  // ── Save result as Role Model ─────────────────────────────────────────────
  const saveAsRoleModel = async () => {
    if (!authorResult || authorModelSaving) return;
    setAuthorModelSaving(true);
    try {
      // Extract a concise style instruction from the analysis (last 1200 chars of the analysis tend to have the practical section)
      const styleInstruction = authorResult.slice(-1200);
      await fetch(`/api/books/${book.id}/role-models`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: authorName ? `${authorName} — Style Model` : "Author Style Model",
          authorName: authorName || "",
          analysisText: authorResult,
          styleInstruction,
          influencePercent: 0,
          avatarColor: "#8B5CF6",
        }),
      });
      setAuthorSavedAsModel(true);
      toast({ title: lang === "ru" ? "Сохранено как ролевая модель" : lang === "ua" ? "Збережено як рольова модель" : "Saved as Role Model" });
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
    setAuthorModelSaving(false);
  };

  const runCollab = async () => {
    if (collabLoading) return;
    const chapterRaw = chapter?.content || "";
    let chapterPlain = "";
    try {
      const parsed = typeof chapterRaw === "string" && chapterRaw.startsWith("[") ? JSON.parse(chapterRaw) : null;
      if (Array.isArray(parsed)) {
        chapterPlain = parsed.map((b: any) => plainText(b.content || b.text || "")).join("\n\n");
      } else {
        chapterPlain = plainText(chapterRaw);
      }
    } catch { chapterPlain = plainText(chapterRaw); }

    setCollabLoading(true);
    setCollabResult(null);
    setCollabSaved(false);
    try {
      const resp = await fetch("/api/ai/agent-collab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapterText: chapterPlain.slice(0, 3500),
          bookTitle: book.title,
          bookMode: book.mode,
          narrativeContext: ncCtx,
          lang,
          characters: [],
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        const err: any = new Error(data.error || "Collaboration error");
        err.code = data.code;
        throw err;
      }
      setCollabResult(data.result || "");
      setCollabOpen(true);
    } catch (e: any) {
      if (!handleAiError(e)) {
        toast({ title: lang === "ru" ? "Ошибка совета" : "Board error", description: e?.message, variant: "destructive" });
      }
    } finally {
      setCollabLoading(false);
    }
  };

  const generate = async (customPrompt?: string, customMode?: string) => {
    const finalPrompt = customPrompt || prompt;
    const finalMode = customMode || mode;

    if (generating && abortRef.current) {
      abortRef.current.abort();
      setGenerating(false);
      if (freeThinkingRef.current) { clearInterval(freeThinkingRef.current); freeThinkingRef.current = null; }
      return;
    }

    setGenerating(true);
    setStreamText("");
    setLastGenResult(null);
    const contextText = context
      ? context.length > 1000 ? context.slice(-1000) : context
      : "";

    if (isFreeMode || usePollinations) {
      setFreeThinkingIdx(0);
      let idx = 0;
      freeThinkingRef.current = setInterval(() => {
        idx = (idx + 1) % thinkingMsgs.length;
        setFreeThinkingIdx(idx);
      }, 1600);
      try {
        const resp = await fetch("/api/ai/free", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: finalPrompt || (finalMode === "continue" ? "Continue the story" : "Develop the idea"),
            context: contextText,
            bookTitle: book.title,
            chapterTitle: chapter?.title || "",
            lang,
            mode: finalMode,
          }),
        });
        if (freeThinkingRef.current) { clearInterval(freeThinkingRef.current); freeThinkingRef.current = null; }
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          throw new Error(err.message || "Free AI error");
        }
        const data = await resp.json();
        const content = data.content || "";
        setHistory(h => [{ id: Date.now().toString(), mode: finalMode, prompt: finalPrompt, text: content, timestamp: new Date() }, ...h]);
        setLastGenResult({ text: content, mode: finalMode, prompt: finalPrompt });
        setPrompt("");
      } catch (e: any) {
        if (freeThinkingRef.current) { clearInterval(freeThinkingRef.current); freeThinkingRef.current = null; }
        toast({ title: lang === "ru" ? "Ошибка Free AI" : lang === "ua" ? "Помилка Free AI" : "Free AI Error", description: e?.message || "Try again", variant: "destructive" });
      } finally {
        setGenerating(false);
      }
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          mode: finalMode,
          prompt: finalPrompt || (finalMode === "continue" ? "Continue writing" : "Develop idea"),
          context: contextText,
          bookTitle: book.title,
          chapterTitle: chapter?.title || "",
          bookMode: book.mode,
          styleAnalysis: applyStyle && styleAnalysis ? styleAnalysis : null,
          lang,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const err: any = new Error(errData.error || "Ошибка генерации");
        err.code = errData.code;
        throw err;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      if (!reader) throw new Error("No reader");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        for (const line of text.split("\n")) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.error) {
                toast({ title: "Ошибка генерации", description: data.error, variant: "destructive" });
              }
              if (data.content) { accumulated += data.content; setStreamText(accumulated); }
              if (data.done) {
                setHistory(h => [{
                  id: Date.now().toString(), mode: finalMode, prompt: finalPrompt,
                  text: accumulated, timestamp: new Date(),
                }, ...h]);
                setLastGenResult({ text: accumulated, mode: finalMode, prompt: finalPrompt });
                setStreamText("");
                setPrompt("");
              }
            } catch {}
          }
        }
      }
    } catch (e: any) {
      if (e.name !== "AbortError") {
        if (!handleAiError(e)) {
          toast({ title: "Ошибка генерации", description: e?.message || "Попробуйте ещё раз", variant: "destructive" });
        }
      }
    } finally {
      setGenerating(false);
    }
  };

  const effectiveContent = context.trim().length >= 50
    ? context
    : chapters.map(c => c.content || "").join("\n\n").trim();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (ext === "pdf") {
      toast({
        title: lang === "ru" ? "PDF слишком тяжёлый" : lang === "ua" ? "PDF занадто важкий" : lang === "de" ? "PDF zu schwer" : "PDF is too heavy",
        description: lang === "ru" ? "Этот формат очень сложен для этого процесса — нужен лёгкий текстовый файл (.txt, .epub, .md)" : lang === "ua" ? "Цей формат дуже складний для цього процесу — потрібен легкий текстовий файл (.txt, .epub, .md)" : lang === "de" ? "Dieses Format ist für diesen Prozess zu schwer — bitte eine leichte Textdatei (.txt, .epub, .md) verwenden" : "This format is too heavy for this process — please use a light text file (.txt, .epub, .md)",
        variant: "destructive",
        duration: 6000,
      });
      return;
    }

    if (!["txt", "md", "text", "epub"].includes(ext)) {
      toast({ title: lang === "ru" ? "Формат не поддерживается" : "Unsupported format", description: ".epub, .txt, .md", variant: "destructive" });
      return;
    }

    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const resp = await fetch("/api/ai/parse-file", { method: "POST", body: formData });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.message || data.error || "Parse error");
      setUploadedFileText(data.text);
      setUploadedFileName(file.name);
      toast({
        title: lang === "ru" ? "Файл загружен" : lang === "ua" ? "Файл завантажено" : lang === "de" ? "Datei geladen" : "File loaded",
        description: `${file.name} · ${Math.round(data.length / 1000)}K ${lang === "ru" ? "симв." : "chars"}`,
      });
    } catch (err: any) {
      toast({ title: lang === "ru" ? "Ошибка загрузки" : "Upload error", description: err?.message, variant: "destructive" });
    } finally {
      setUploadingFile(false);
    }
  };

  const analyzeStyle = async () => {
    const contentToAnalyze = uploadedFileText || effectiveContent;
    if (contentToAnalyze.length < 50) {
      toast({ title: "Нужно больше текста", variant: "destructive" });
      return;
    }
    setAnalyzingStyle(true);
    try {
      if (isFreeMode) {
        const resp = await fetch("/api/ai/free", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: `Book: "${book.title}"\n\nText to analyze:\n${contentToAnalyze.slice(0, 3000)}`,
            context: "",
            bookTitle: book.title,
            lang,
            mode: "style_analyze",
          }),
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.message || "Style analysis error");
        try {
          const jsonText = data.content?.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
          const parsed = JSON.parse(jsonText);
          setStyleAnalysis(parsed);
          setApplyStyle(true);
          toast({ title: lang === "ru" ? "Стиль проанализирован" : lang === "ua" ? "Стиль проаналізовано" : lang === "de" ? "Stil analysiert" : "Style analyzed" });
        } catch {
          setStyleAnalysis({ vocabularyLevel: "—", avgSentenceLength: "—", tone: "—", rhythm: "—", devices: [], patterns: "", summary: data.content || "" });
          setApplyStyle(true);
          toast({ title: lang === "ru" ? "Стиль проанализирован" : "Style analyzed" });
        }
      } else {
        const resp = await fetch("/api/ai/analyze-style", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: contentToAnalyze, bookTitle: book.title, bookMode: book.mode }),
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || "Ошибка анализа стиля");
        setStyleAnalysis(data);
        setApplyStyle(true);
        toast({ title: "Стиль проанализирован" });
      }
    } catch (e: any) {
      if (!handleAiError(e)) {
        toast({ title: "Не удалось проанализировать стиль", description: e?.message, variant: "destructive" });
      }
    } finally {
      setAnalyzingStyle(false);
    }
  };

  const expandStyle = async () => {
    if (!styleAnalysis) return;
    setExpandingStyle(true);
    try {
      const existingStr = JSON.stringify(styleAnalysis, null, 2);
      const userNote = expandStylePrompt.trim();
      const sampleText = effectiveContent.slice(0, 4000);
      const promptText = `Existing style analysis:\n${existingStr}\n\nAuthor sample text:\n${sampleText}${userNote ? `\n\nAuthor refinement note: ${userNote}` : ""}\n\nDeepen and expand this style analysis. Add more nuance, incorporate the author's note if provided. Return the same JSON structure with richer, more specific values — especially deeper patterns, devices, styleInstruction.`;
      if (isFreeMode) {
        setFreeThinkingIdx(0);
        let idx = 0;
        freeThinkingRef.current = setInterval(() => { idx = (idx + 1) % thinkingMsgs.length; setFreeThinkingIdx(idx); }, 1600);
        const resp = await fetch("/api/ai/free", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: promptText, context: "", bookTitle: book.title, lang, mode: "style_analyze" }) });
        if (freeThinkingRef.current) { clearInterval(freeThinkingRef.current); freeThinkingRef.current = null; }
        if (!resp.ok) throw new Error("Free AI error");
        const data = await resp.json();
        const jsonText = data.content?.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        setStyleAnalysis(JSON.parse(jsonText));
      } else {
        const resp = await fetch("/api/ai/analyze-style", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: `${sampleText}\n\n---\nPrevious analysis:\n${existingStr}${userNote ? `\n\nAuthor note: ${userNote}` : ""}`, bookTitle: book.title, bookMode: book.mode }) });
        if (!resp.ok) throw new Error("Style expand error");
        const data = await resp.json();
        setStyleAnalysis(data);
      }
      setExpandStylePrompt("");
      setShowExpandStyle(false);
      toast({ title: lang === "ru" ? "Анализ расширен" : lang === "ua" ? "Аналіз розширено" : lang === "de" ? "Analyse erweitert" : "Analysis expanded" });
    } catch (e: any) {
      if (freeThinkingRef.current) { clearInterval(freeThinkingRef.current); freeThinkingRef.current = null; }
      if (!handleAiError(e)) toast({ title: lang === "ru" ? "Ошибка расширения" : "Expand error", variant: "destructive" });
    } finally {
      setExpandingStyle(false);
    }
  };

  const copyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const insertText = (text: string) => {
    if (onInsert) {
      onInsert(text);
      toast({ title: lang === "ru" ? "Текст вставлен в редактор" : lang === "ua" ? "Текст вставлено в редактор" : lang === "de" ? "Text eingefügt" : "Text inserted" });
    } else {
      toast({ title: lang === "ru" ? "Сначала откройте главу" : lang === "ua" ? "Спочатку відкрийте розділ" : lang === "de" ? "Kapitel öffnen" : "Open a chapter first" });
    }
  };

  const callEdit = async (actionMode: string) => {
    const editSource = customEditText.trim() || context.trim();
    if (editSource.length < 10) {
      toast({ title: lang === "ru" ? "Нет текста для редактуры" : lang === "ua" ? "Немає тексту для редагування" : lang === "de" ? "Kein Text zum Bearbeiten" : "No text to edit", variant: "destructive" });
      return;
    }
    const textToEdit = editSource.slice(0, 1200);
    setEditLoading(actionMode);
    setEditResult(null);
    try {
      if (isFreeMode) {
        setFreeThinkingIdx(0);
        let idx = 0;
        freeThinkingRef.current = setInterval(() => {
          idx = (idx + 1) % thinkingMsgs.length;
          setFreeThinkingIdx(idx);
        }, 1600);
        const resp = await fetch("/api/ai/free", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: textToEdit, context: "", bookTitle: book.title, chapterTitle: chapter?.title || "", lang, mode: actionMode }),
        });
        if (freeThinkingRef.current) { clearInterval(freeThinkingRef.current); freeThinkingRef.current = null; }
        if (!resp.ok) { const e = await resp.json().catch(() => ({})); throw new Error(e.message || "Free AI error"); }
        const data = await resp.json();
        setEditResult({ mode: actionMode, text: data.content || "" });
      } else {
        const resp = await fetch("/api/ai/improve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: textToEdit, mode: actionMode, bookTitle: book.title, bookMode: book.mode, bookGenre: book.genre }),
        });
        if (!resp.ok) { const e: any = await resp.json().catch(() => ({})); const err: any = new Error(e.error || "Edit error"); err.code = e.code; throw err; }
        const data = await resp.json();
        setEditResult({ mode: actionMode, text: data.improved || "" });
      }
    } catch (e: any) {
      if (freeThinkingRef.current) { clearInterval(freeThinkingRef.current); freeThinkingRef.current = null; }
      if (!handleAiError(e)) setFreeGateOpen(true);
    } finally {
      setEditLoading(null);
    }
  };

  const formatText = async () => {
    if (!formatPrompt.trim()) return;
    const formatSource = customEditText.trim() || context.trim();
    if (formatSource.length < 10) {
      toast({ title: lang === "ru" ? "Нет текста для форматирования" : "No text to format", variant: "destructive" });
      return;
    }
    const textToFormat = formatSource.slice(0, 1200);
    setFormatLoading(true);
    setEditResult(null);
    try {
      if (isFreeMode) {
        setFreeThinkingIdx(0);
        let idx = 0;
        freeThinkingRef.current = setInterval(() => {
          idx = (idx + 1) % thinkingMsgs.length;
          setFreeThinkingIdx(idx);
        }, 1600);
        const resp = await fetch("/api/ai/free", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: `${textToFormat}\n\n${lang === "ru" ? "Инструкция по форматированию" : "Formatting instructions"}: ${formatPrompt}`, context: "", bookTitle: book.title, lang, mode: "format" }),
        });
        if (freeThinkingRef.current) { clearInterval(freeThinkingRef.current); freeThinkingRef.current = null; }
        if (!resp.ok) { const e = await resp.json().catch(() => ({})); throw new Error(e.message || "Free AI error"); }
        const data = await resp.json();
        setEditResult({ mode: "format", text: data.content || "" });
      } else {
        const resp = await fetch("/api/ai/improve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: `${textToFormat}\n\n${lang === "ru" ? "Инструкция по форматированию" : "Formatting instructions"}: ${formatPrompt}`, mode: "format", bookTitle: book.title, bookMode: book.mode, bookGenre: book.genre }),
        });
        if (!resp.ok) { const e: any = await resp.json().catch(() => ({})); const err: any = new Error(e.error || "Format error"); err.code = e.code; throw err; }
        const data = await resp.json();
        setEditResult({ mode: "format", text: data.improved || "" });
      }
    } catch (e: any) {
      if (freeThinkingRef.current) { clearInterval(freeThinkingRef.current); freeThinkingRef.current = null; }
      if (!handleAiError(e)) setFreeGateOpen(true);
    } finally {
      setFormatLoading(false);
    }
  };

  const editActionLabel = (a: typeof EDIT_ACTIONS[0]) => lang === "ru" ? a.ru : lang === "ua" ? a.ua : lang === "de" ? a.de : a.en;
  const editModeLabel = (m: string) => {
    const action = EDIT_ACTIONS.find(a => a.id === m);
    if (action) return editActionLabel(action);
    return m === "format" ? (lang === "ru" ? "Форматировано" : lang === "ua" ? "Відформатовано" : lang === "de" ? "Formatiert" : "Formatted") : m;
  };

  const HistoryBlock = () => (
    <>
      {history.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              {lang === "ru" ? "История" : lang === "ua" ? "Історія" : lang === "de" ? "Verlauf" : "History"}
            </span>
            <button className="text-[10px] text-muted-foreground hover:text-destructive transition-colors" onClick={() => setHistory([])}>
              {lang === "ru" ? "Очистить" : lang === "ua" ? "Очистити" : lang === "de" ? "Löschen" : "Clear"}
            </button>
          </div>
          {history.map(block => {
            const blockMode = AI_MODES.find(m => m.value === block.mode);
            const isExpanded = expandedId === block.id;
            const preview = block.text.length > 180 && !isExpanded
              ? block.text.slice(0, 180) + "…"
              : block.text;
            return (
              <div key={block.id} className="border border-border rounded-lg overflow-hidden bg-background">
                <div className="flex items-center gap-2 px-2.5 py-1.5 bg-muted/30 border-b border-border">
                  {blockMode && <blockMode.icon className="h-3 w-3 text-muted-foreground flex-shrink-0" />}
                  <span className="text-[10px] text-muted-foreground flex-1 truncate">{blockMode ? modeLabel(blockMode) : block.mode}</span>
                  <div className="flex items-center gap-0.5">
                    <button
                      className="h-5 w-5 flex items-center justify-center rounded hover:bg-primary/10 hover:text-primary transition-colors"
                      onClick={() => copyText(block.id, block.text)}
                    >
                      {copiedId === block.id ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                    </button>
                    <button
                      className="h-5 w-5 flex items-center justify-center rounded hover:bg-primary/10 hover:text-primary transition-colors"
                      onClick={() => insertText(block.text)}
                      title="Вставить в редактор"
                    >
                      <ArrowDownToLine className="h-3 w-3" />
                    </button>
                    {block.text.length > 180 && (
                      <button
                        className="h-5 w-5 flex items-center justify-center rounded hover:bg-accent/60 transition-colors"
                        onClick={() => setExpandedId(isExpanded ? null : block.id)}
                      >
                        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </button>
                    )}
                  </div>
                </div>
                <div className="px-2.5 py-2">
                  <p className="text-xs leading-relaxed text-foreground/85 whitespace-pre-wrap">{preview}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );

  return (
    <aside className="w-72 border-l border-border flex flex-col bg-sidebar flex-shrink-0" style={{ fontFamily: "var(--font-sans)" }}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={isFreeMode
            ? { background: "linear-gradient(135deg, #6366f122 0%, #818cf822 100%)", border: "1px solid #6366f130" }
            : { background: "linear-gradient(135deg, #F96D1C22 0%, #FF964022 100%)", border: "1px solid #F96D1C30" }}>
          <Sparkles className="h-3.5 w-3.5" style={{ color: isFreeMode ? "#818cf8" : "var(--primary)" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-none">
            {lang === "ru" ? "AI-соавтор" : lang === "ua" ? "AI-співавтор" : lang === "de" ? "KI-Autor" : "AI Co-author"}
          </p>
          {isFreeMode ? (
            <button
              onClick={() => setLocation("/models")}
              className="flex items-center gap-0.5 mt-0.5 hover:opacity-70 transition-opacity group"
            >
              <span className="text-[10px] font-medium" style={{ color: "#818cf8" }}>GPT-OSS · Free</span>
              <ChevronRight className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100 transition-opacity" style={{ color: "#818cf8" }} />
            </button>
          ) : (
            <button
              onClick={() => setLocation("/models")}
              className="flex items-center gap-0.5 mt-0.5 hover:opacity-70 transition-opacity group"
            >
              <span className="text-[10px] text-primary font-medium">{modelLabel}</span>
              <ChevronRight className="w-2.5 h-2.5 text-primary opacity-60 group-hover:opacity-100 transition-opacity" />
            </button>
          )}
        </div>
        {!isFreeMode && (
          <button
            onClick={() => setUsePollinations(v => !v)}
            title={lang === "ru" ? "Бесплатная модель Pollinations" : "Free Pollinations model"}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all flex-shrink-0"
            style={{
              background: usePollinations ? "rgba(99,102,241,0.15)" : "rgba(0,0,0,0.04)",
              color: usePollinations ? "#818cf8" : "#999",
              border: `1px solid ${usePollinations ? "rgba(99,102,241,0.35)" : "rgba(0,0,0,0.08)"}`,
            }}
          >
            Free
          </button>
        )}
        {applyStyle && styleAnalysis && (
          <div className="flex items-center gap-1 text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            {lang === "ru" ? "Стиль" : lang === "ua" ? "Стиль" : lang === "de" ? "Stil" : "Style"}
          </div>
        )}
      </div>

      <Tabs defaultValue="generate" className="flex flex-col flex-1 overflow-hidden">
        {/* Tabs */}
        <div className="px-3 pt-2.5 pb-0">
          <TabsList className="w-full h-8 rounded-lg bg-muted/60 p-0.5">
            <TabsTrigger value="generate" className="flex-1 h-7 text-[10px] rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm" data-testid="tab-generate">
              {lang === "ru" ? "Написать" : lang === "ua" ? "Написати" : lang === "de" ? "Schreiben" : "Write"}
            </TabsTrigger>
            <TabsTrigger value="structure" className="flex-1 h-7 text-[10px] rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm" data-testid="tab-structure">
              {lang === "ru" ? "Структура" : lang === "ua" ? "Структура" : lang === "de" ? "Struktur" : "Structure"}
            </TabsTrigger>
            <TabsTrigger value="correctness" className="flex-1 h-7 text-[10px] rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm relative" data-testid="tab-correctness">
              {lang === "ru" ? "Правка" : lang === "ua" ? "Правка" : lang === "de" ? "Prüfung" : "Proofreading"}
              {spellMatches.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center">
                  {spellMatches.length > 9 ? "9+" : spellMatches.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="agents" className="flex-1 h-7 text-[10px] rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm" data-testid="tab-agents">
              {lang === "ru" ? "Агенты" : lang === "ua" ? "Агенти" : lang === "de" ? "Agenten" : "Agents"}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ─── ГЕНЕРАЦИЯ ─── */}
        <TabsContent value="generate" className="flex-1 overflow-hidden m-0 mt-0">
          <ScrollArea className="h-full">
            <div className="p-3 space-y-3">

              {/* Mode chips */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">
                  {lang === "ru" ? "Режим" : lang === "ua" ? "Режим" : lang === "de" ? "Modus" : "Mode"}
                </p>
                <div className="grid grid-cols-3 gap-1">
                  {AI_MODES.map(m => {
                    const Icon = m.icon;
                    const isActive = mode === m.value;
                    return (
                      <button
                        key={m.value}
                        onClick={() => setMode(m.value)}
                        data-testid={`ai-mode-${m.value}`}
                        className={cn(
                          "flex flex-col items-start gap-0.5 px-2 py-1.5 rounded-lg border text-left transition-all",
                          isActive
                            ? "border-primary/40 bg-primary/8 text-primary"
                            : "border-border bg-background text-muted-foreground hover:border-border hover:text-foreground hover:bg-accent/40"
                        )}
                      >
                        <Icon className="h-3 w-3 flex-shrink-0" />
                        <span className="text-[10px] font-medium leading-tight">{modeLabel(m)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Prompt area */}
              <div className="space-y-2">
                <textarea
                  data-testid="ai-prompt-input"
                  placeholder={
                    lang === "ru" ? (
                      mode === "continue"     ? "Направление продолжения..." :
                      mode === "develop"      ? "Что развить или расширить?" :
                      mode === "newChapter"   ? "О чём новая глава?" :
                      mode === "alternatives" ? "Что переписать иначе?" :
                      mode === "improve"      ? "Что улучшить в тексте?" :
                      "Какие идеи сгенерировать?"
                    ) : lang === "ua" ? (
                      mode === "continue"     ? "Напрямок продовження..." :
                      mode === "develop"      ? "Що розвинути або розширити?" :
                      mode === "newChapter"   ? "Про що новий розділ?" :
                      mode === "alternatives" ? "Що переписати інакше?" :
                      mode === "improve"      ? "Що покращити в тексті?" :
                      "Які ідеї згенерувати?"
                    ) : lang === "de" ? (
                      mode === "continue"     ? "Richtung der Fortsetzung..." :
                      mode === "develop"      ? "Was entwickeln oder erweitern?" :
                      mode === "newChapter"   ? "Worum geht es im neuen Kapitel?" :
                      mode === "alternatives" ? "Was anders schreiben?" :
                      mode === "improve"      ? "Was im Text verbessern?" :
                      "Welche Ideen generieren?"
                    ) : (
                      mode === "continue"     ? "Direction to continue..." :
                      mode === "develop"      ? "What to develop or expand?" :
                      mode === "newChapter"   ? "What is the new chapter about?" :
                      mode === "alternatives" ? "What to rewrite differently?" :
                      mode === "improve"      ? "What to improve in the text?" :
                      "What ideas to generate?"
                    )
                  }
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-xs bg-background border border-border rounded-lg outline-none resize-none focus:border-primary/50 placeholder:text-muted-foreground/50 leading-relaxed"
                  onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) generate(); }}
                />

                <button
                  className="w-full h-9 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  style={generating ? { background: "#888" } : { background: "linear-gradient(135deg, #F96D1C 0%, #FF9640 100%)" }}
                  onClick={() => generate()}
                  data-testid="button-ai-generate"
                >
                  {generating ? (
                    <><Square className="h-3.5 w-3.5" /> {lang === "ru" ? "Остановить" : lang === "ua" ? "Зупинити" : lang === "de" ? "Stoppen" : "Stop"}</>
                  ) : (
                    <><Sparkles className="h-3.5 w-3.5" /> {lang === "ru" ? "Сгенерировать" : lang === "ua" ? "Згенерувати" : lang === "de" ? "Generieren" : "Generate"}</>
                  )}
                </button>
                <p className="text-[10px] text-muted-foreground/50 text-center">⌘↵ — {lang === "ru" ? "быстрый запуск" : lang === "ua" ? "швидкий запуск" : lang === "de" ? "Schnellstart" : "quick run"}</p>
              </div>

              {/* Quick prompts */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1.5">
                  {lang === "ru" ? "Быстрые запросы" : lang === "ua" ? "Швидкі запити" : lang === "de" ? "Schnellanfragen" : "Quick prompts"}
                </p>
                <div className="space-y-1">
                  {quickPrompts.map(qp => (
                    <button
                      key={qp}
                      data-testid={`quick-prompt-${qp.substring(0, 20).replace(/\s/g, "-")}`}
                      className="w-full text-left text-[11px] px-2.5 py-1.5 rounded-md bg-muted/50 hover:bg-primary/8 hover:text-primary border border-transparent hover:border-primary/20 transition-all"
                      onClick={() => { setPrompt(qp); generate(qp); }}
                    >
                      {qp}
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Editing Block */}
              <div className="border-t border-border/60 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                    {lang === "ru" ? "Редактура текста" : lang === "ua" ? "Редагування тексту" : lang === "de" ? "Textbearbeitung" : "Text Editing"}
                  </p>
                  <button
                    onClick={() => setShowCustomEdit(v => !v)}
                    className="text-[10px] px-2 py-0.5 rounded-md transition-colors"
                    style={{
                      background: showCustomEdit ? "rgba(249,109,28,0.12)" : "rgba(0,0,0,0.04)",
                      color: showCustomEdit ? "#F96D1C" : "#888",
                      border: `1px solid ${showCustomEdit ? "rgba(249,109,28,0.25)" : "rgba(0,0,0,0.08)"}`,
                    }}
                  >
                    {lang === "ru" ? "Свой текст" : lang === "ua" ? "Свій текст" : lang === "de" ? "Eigener Text" : "Own text"}
                  </button>
                </div>
                {showCustomEdit && (
                  <textarea
                    placeholder={lang === "ru" ? "Вставь текст для редактуры..." : lang === "ua" ? "Встав текст для редагування..." : lang === "de" ? "Text zum Bearbeiten einfügen..." : "Paste text to edit..."}
                    value={customEditText}
                    onChange={e => setCustomEditText(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 text-xs bg-background border border-border rounded-lg outline-none resize-none focus:border-primary/50 placeholder:text-muted-foreground/50 leading-relaxed mb-2"
                  />
                )}
                {(context.trim().length >= 20 || customEditText.trim().length >= 10) ? (
                  <div className="grid grid-cols-2 gap-1">
                    {EDIT_ACTIONS.map(action => {
                      const Icon = action.icon;
                      const isLoading = editLoading === action.id;
                      return (
                        <button
                          key={action.id}
                          onClick={() => callEdit(action.id)}
                          disabled={!!editLoading || formatLoading}
                          data-testid={`edit-action-${action.id}`}
                          className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-border bg-background hover:border-primary/30 hover:bg-primary/5 transition-all text-left text-[11px] disabled:opacity-40"
                        >
                          {isLoading
                            ? <RefreshCw className="h-3 w-3 flex-shrink-0 text-primary animate-spin" />
                            : <Icon className="h-3 w-3 flex-shrink-0 text-muted-foreground" />}
                          <span className="font-medium truncate">{editActionLabel(action)}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-[11px] text-muted-foreground/60 text-center py-3 bg-muted/30 rounded-lg px-3">
                    {lang === "ru" ? "Откройте главу или вставьте свой текст" : lang === "ua" ? "Відкрийте розділ або вставте свій текст" : lang === "de" ? "Kapitel öffnen oder Text einfügen" : "Open a chapter or paste your own text"}
                  </div>
                )}

                {/* Edit result */}
                {editResult && (
                  <div className="border border-border rounded-lg overflow-hidden bg-background mt-2">
                    <div className="flex items-center gap-2 px-2.5 py-1.5 bg-muted/30 border-b border-border">
                      <Wand2 className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      <span className="text-[10px] text-muted-foreground flex-1 truncate">{editModeLabel(editResult.mode)}</span>
                      <div className="flex items-center gap-0.5">
                        <button onClick={() => copyText("edit", editResult.text)} className="h-5 w-5 flex items-center justify-center rounded hover:bg-primary/10 hover:text-primary transition-colors">
                          {copiedId === "edit" ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                        </button>
                        <button onClick={() => insertText(editResult.text)} title={lang === "ru" ? "Вставить в редактор" : "Insert"} className="h-5 w-5 flex items-center justify-center rounded hover:bg-primary/10 hover:text-primary transition-colors">
                          <ArrowDownToLine className="h-3 w-3" />
                        </button>
                        <button onClick={() => setEditResult(null)} className="h-5 w-5 flex items-center justify-center rounded hover:bg-destructive/10 hover:text-destructive transition-colors">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <div className="px-2.5 py-2">
                      <p className="text-xs leading-relaxed text-foreground/85 whitespace-pre-wrap">{editResult.text.slice(0, 600)}{editResult.text.length > 600 ? "…" : ""}</p>
                    </div>
                  </div>
                )}

                {/* Edit thinking state */}
                {!!editLoading && isFreeMode && (
                  <div className="rounded-lg p-3 text-center mt-2" style={{ background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.18)" }}>
                    <div className="flex justify-center gap-1 mb-2">
                      {[0, 200, 400].map(d => <div key={d} className="w-2 h-2 rounded-full animate-bounce" style={{ background: "#818cf8", animationDelay: `${d}ms` }} />)}
                    </div>
                    <p className="text-xs font-medium" style={{ color: "#6366f1" }}>{thinkingMsgs[freeThinkingIdx]}</p>
                  </div>
                )}
              </div>

              {/* Smart Formatting */}
              <div className="border-t border-border/60 pt-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">
                  {lang === "ru" ? "Умное форматирование" : lang === "ua" ? "Розумне форматування" : lang === "de" ? "Intelligente Formatierung" : "Smart Formatting"}
                </p>
                <div className="space-y-1.5">
                  <textarea
                    placeholder={lang === "ru" ? "Опиши нужное форматирование..." : lang === "ua" ? "Опиши потрібне форматування..." : lang === "de" ? "Formatierungsanweisung..." : "Describe desired formatting..."}
                    value={formatPrompt}
                    onChange={e => setFormatPrompt(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 text-xs bg-background border border-border rounded-lg outline-none resize-none focus:border-primary/50 placeholder:text-muted-foreground/50 leading-relaxed"
                  />
                  <button
                    onClick={formatText}
                    disabled={formatLoading || !!editLoading || !formatPrompt.trim() || (context.trim().length < 20 && customEditText.trim().length < 10)}
                    data-testid="button-smart-format"
                    className="w-full h-8 rounded-lg text-xs font-semibold border border-border bg-background hover:bg-primary/5 hover:border-primary/30 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40"
                  >
                    {formatLoading
                      ? <><RefreshCw className="h-3 w-3 animate-spin" /> {lang === "ru" ? "Форматирую..." : lang === "ua" ? "Форматую..." : lang === "de" ? "Formatiere..." : "Formatting..."}</>
                      : <><Wand2 className="h-3 w-3" /> {lang === "ru" ? "Форматировать" : lang === "ua" ? "Форматувати" : lang === "de" ? "Formatieren" : "Format"}</>}
                  </button>
                  {formatLoading && isFreeMode && (
                    <div className="rounded-lg p-3 text-center" style={{ background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.18)" }}>
                      <div className="flex justify-center gap-1 mb-2">
                        {[0, 200, 400].map(d => <div key={d} className="w-2 h-2 rounded-full animate-bounce" style={{ background: "#818cf8", animationDelay: `${d}ms` }} />)}
                      </div>
                      <p className="text-xs font-medium" style={{ color: "#6366f1" }}>{thinkingMsgs[freeThinkingIdx]}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Free mode thinking state */}
              {generating && isFreeMode && (
                <div className="rounded-lg p-4 text-center" style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.07) 0%, rgba(129,140,248,0.05) 100%)", border: "1px solid rgba(99,102,241,0.18)" }}>
                  <div className="flex justify-center gap-1 mb-3">
                    {[0, 200, 400].map(d => (
                      <div key={d} className="w-2 h-2 rounded-full animate-bounce" style={{ background: "#818cf8", animationDelay: `${d}ms` }} />
                    ))}
                  </div>
                  <p className="text-xs font-medium mb-0.5" style={{ color: "#6366f1" }}>
                    {thinkingMsgs[freeThinkingIdx]}
                  </p>
                  <p className="text-[10px]" style={{ color: "#94a3b8" }}>GPT-OSS · Pollinations</p>
                </div>
              )}

              {/* Streaming output (paid mode) */}
              {generating && !isFreeMode && streamText && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="flex gap-0.5">
                      {[0, 150, 300].map(d => (
                        <div key={d} className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                      ))}
                    </div>
                    <span className="text-[10px] text-primary font-medium">
                      {lang === "ru" ? "Генерирую..." : lang === "ua" ? "Генерую..." : lang === "de" ? "Generiere..." : "Generating..."}
                    </span>
                  </div>
                  <div ref={streamRef} className="max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                    <p className="text-xs text-foreground/85 leading-relaxed whitespace-pre-wrap">{streamText}</p>
                  </div>
                </div>
              )}

              {/* Regenerate button after completed generation */}
              {!generating && lastGenResult && (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => generate(lastGenResult.prompt, lastGenResult.mode)}
                    disabled={generating}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-colors"
                    style={{
                      background: "rgba(249,109,28,0.07)",
                      border: "1px solid rgba(249,109,28,0.25)",
                      color: "#F96D1C",
                    }}
                  >
                    <RefreshCw className="h-3 w-3" />
                    {lang === "ru" ? "Ещё раз" : lang === "ua" ? "Ще раз" : lang === "de" ? "Nochmal" : "Regenerate"}
                  </button>
                  <button
                    onClick={() => setLastGenResult(null)}
                    className="flex items-center justify-center h-6 w-6 rounded-md hover:bg-muted transition-colors text-muted-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}

              <HistoryBlock />

              {context && (
                <div className="flex items-center gap-1.5 pt-1 border-t border-border/60">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                  <span className="text-[10px] text-muted-foreground">
                    {lang === "ru" ? "Контекст:" : lang === "ua" ? "Контекст:" : lang === "de" ? "Kontext:" : "Context:"} {context.length} {lang === "ru" || lang === "ua" ? "симв." : "ch."}
                  </span>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* ─── СТРУКТУРА + СТИЛЬ ─── */}
        <TabsContent value="structure" className="flex-1 overflow-hidden m-0 mt-0">
          <ScrollArea className="h-full">
            <div className="p-3 space-y-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {lang === "ru" ? "AI генератор структуры" : lang === "ua" ? "AI генератор структури" : lang === "de" ? "KI-Strukturgenerator" : "AI Structure Generator"}
              </p>

              <div className="space-y-1.5">
                {CHAPTER_GENERATORS.map(gen => {
                  const Icon = gen.icon;
                  return (
                    <button
                      key={gen.id}
                      data-testid={`chapter-gen-${gen.id}`}
                      onClick={() => generate(gen.prompt, gen.id)}
                      disabled={generating}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border bg-background hover:border-primary/30 transition-all text-left disabled:opacity-50"
                    >
                      <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: gen.bg }}>
                        <Icon className="h-3.5 w-3.5" style={{ color: gen.accent }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold">{gen.label}</p>
                        <p className="text-[10px] text-muted-foreground">{gen.desc}</p>
                      </div>
                      {generating
                        ? <RefreshCw className="h-3.5 w-3.5 text-primary animate-spin flex-shrink-0" />
                        : <Sparkles className="h-3 w-3 text-muted-foreground/30 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  {lang === "ru" ? "Свой запрос" : lang === "ua" ? "Власний запит" : lang === "de" ? "Eigene Anfrage" : "Custom request"}
                </p>
                <textarea
                  placeholder={lang === "ru" ? "Опиши что нужно сгенерировать..." : lang === "ua" ? "Опиши що потрібно згенерувати..." : lang === "de" ? "Beschreibe was generiert werden soll..." : "Describe what to generate..."}
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-xs bg-background border border-border rounded-lg outline-none resize-none focus:border-primary/50"
                />
                <button
                  className="w-full h-8 rounded-lg text-xs font-semibold border border-border bg-background hover:bg-accent/60 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40"
                  onClick={() => generate(prompt, "chapters")}
                  disabled={generating || !prompt.trim()}
                  data-testid="button-chapter-custom"
                >
                  <Sparkles className="h-3.5 w-3.5" /> {lang === "ru" ? "Сгенерировать" : lang === "ua" ? "Згенерувати" : lang === "de" ? "Generieren" : "Generate"}
                </button>
              </div>

              {generating && isFreeMode && (
                <div className="rounded-lg p-3 text-center" style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.07) 0%, rgba(129,140,248,0.05) 100%)", border: "1px solid rgba(99,102,241,0.18)" }}>
                  <div className="flex justify-center gap-1 mb-2">
                    {[0, 200, 400].map(d => (
                      <div key={d} className="w-2 h-2 rounded-full animate-bounce" style={{ background: "#818cf8", animationDelay: `${d}ms` }} />
                    ))}
                  </div>
                  <p className="text-xs font-medium" style={{ color: "#6366f1" }}>{thinkingMsgs[freeThinkingIdx]}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: "#94a3b8" }}>GPT-OSS · Free</p>
                </div>
              )}

              {generating && !isFreeMode && streamText && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <RefreshCw className="h-3 w-3 text-primary animate-spin" />
                    <span className="text-[10px] text-primary font-medium">
                      {lang === "ru" ? "Генерирую..." : lang === "ua" ? "Генерую..." : lang === "de" ? "Generiere..." : "Generating..."}
                    </span>
                  </div>
                  <div ref={streamRef} className="max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                    <p className="text-xs text-foreground/85 leading-relaxed whitespace-pre-wrap">{streamText}</p>
                  </div>
                </div>
              )}

              {!generating && lastGenResult && (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => generate(lastGenResult.prompt, lastGenResult.mode)}
                    disabled={generating}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-colors"
                    style={{ background: "rgba(249,109,28,0.07)", border: "1px solid rgba(249,109,28,0.25)", color: "#F96D1C" }}
                  >
                    <RefreshCw className="h-3 w-3" />
                    {lang === "ru" ? "Ещё раз" : lang === "ua" ? "Ще раз" : lang === "de" ? "Nochmal" : "Regenerate"}
                  </button>
                  <button onClick={() => setLastGenResult(null)} className="flex items-center justify-center h-6 w-6 rounded-md hover:bg-muted transition-colors text-muted-foreground">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}

              <HistoryBlock />

              {/* ─── Стиль письма (внутри Структуры) ─── */}
              <div className="border-t border-border/40 pt-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">
                  {lang === "ru" ? "Стиль письма" : lang === "ua" ? "Стиль письма" : lang === "de" ? "Schreibstil" : "Writing style"}
                </p>
              </div>
              <div className="space-y-3">
                <div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {lang === "ru" ? "AI изучает ваши тексты и применяет найденные паттерны при генерации." : lang === "ua" ? "AI вивчає ваші тексти і застосовує знайдені патерни при генерації." : lang === "de" ? "KI analysiert Ihre Texte und wendet erkannte Muster bei der Generierung an." : "AI studies your texts and applies found patterns when generating."}
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".epub,.txt,.md,.text,.pdf"
                className="hidden"
                onChange={handleFileUpload}
              />

              <button
                className="w-full h-9 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 border border-border bg-background hover:bg-accent/60 transition-colors disabled:opacity-40"
                onClick={analyzeStyle}
                disabled={analyzingStyle || (!uploadedFileText && effectiveContent.length < 50)}
                data-testid="button-analyze-style"
              >
                {analyzingStyle
                  ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> {lang === "ru" ? "Анализирую..." : lang === "ua" ? "Аналізую..." : lang === "de" ? "Analysiere..." : "Analyzing..."}</>
                  : <><Scan className="h-3.5 w-3.5" /> {lang === "ru" ? "Проанализировать стиль" : lang === "ua" ? "Проаналізувати стиль" : lang === "de" ? "Stil analysieren" : "Analyze style"}</>}
              </button>

              <button
                className="w-full h-9 rounded-lg text-xs font-medium flex items-center justify-center gap-2 border border-dashed border-border bg-muted/20 hover:bg-accent/40 transition-colors disabled:opacity-40"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingFile}
                data-testid="button-upload-file"
              >
                {uploadingFile
                  ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> {lang === "ru" ? "Читаю файл..." : lang === "ua" ? "Читаю файл..." : lang === "de" ? "Lese Datei..." : "Reading file..."}</>
                  : <><Upload className="h-3.5 w-3.5" /> {lang === "ru" ? "Загрузить EPUB / TXT для анализа" : lang === "ua" ? "Завантажити EPUB / TXT для аналізу" : lang === "de" ? "EPUB / TXT hochladen" : "Upload EPUB / TXT for analysis"}</>}
              </button>

              {uploadedFileName && (
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-primary/5 border border-primary/20">
                  <FileText className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                  <span className="text-[11px] text-primary truncate flex-1">{uploadedFileName}</span>
                  <button className="text-muted-foreground hover:text-foreground" onClick={() => { setUploadedFileText(null); setUploadedFileName(null); }}>
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}

              {!uploadedFileName && effectiveContent.length < 50 ? (
                <div className="text-[11px] text-muted-foreground/60 text-center py-3 bg-muted/30 rounded-lg px-3">
                  {lang === "ru" ? "Напишите текст или загрузите EPUB / TXT для анализа стиля" : lang === "ua" ? "Напишіть текст або завантажте EPUB / TXT для аналізу стилю" : lang === "de" ? "Text schreiben oder EPUB/TXT hochladen" : "Write text or upload EPUB/TXT to analyze style"}
                </div>
              ) : !uploadedFileName ? (
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                  <span className="text-[10px] text-muted-foreground">
                    {context.trim().length >= 50
                      ? `${lang === "ru" ? "Текущая глава" : lang === "ua" ? "Поточний розділ" : lang === "de" ? "Aktuelles Kapitel" : "Current chapter"} (${context.length} симв.)`
                      : `${lang === "ru" ? "Главы книги" : lang === "ua" ? "Розділи книги" : lang === "de" ? "Buchkapitel" : "Book chapters"} (${effectiveContent.length} симв.)`}
                  </span>
                </div>
              ) : null}

              {styleAnalysis && (
                <div className="space-y-2.5">
                  <button onClick={() => setApplyStyle(v => !v)} data-testid="button-toggle-style"
                    className="w-full flex items-center gap-2.5 p-2.5 rounded-lg border border-border bg-background hover:border-primary/30 transition-colors">
                    {applyStyle ? <ToggleRight className="h-5 w-5 text-primary flex-shrink-0" /> : <ToggleLeft className="h-5 w-5 text-muted-foreground flex-shrink-0" />}
                    <div className="text-left">
                      <p className="text-xs font-medium">
                        {applyStyle ? (lang === "ru" ? "Стиль применяется" : lang === "ua" ? "Стиль застосовується" : lang === "de" ? "Stil aktiv" : "Style applied")
                          : (lang === "ru" ? "Стиль отключён" : lang === "ua" ? "Стиль вимкнено" : lang === "de" ? "Stil deaktiviert" : "Style off")}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {lang === "ru" ? "AI учитывает стиль при генерации" : lang === "ua" ? "AI враховує стиль при генерації" : lang === "de" ? "KI berücksichtigt Stil beim Generieren" : "AI considers style when generating"}
                      </p>
                    </div>
                  </button>
                  <div className="border border-border rounded-lg overflow-hidden">
                    <div className="px-3 py-2 border-b border-border bg-muted/20 flex items-center gap-2">
                      <FileSearch className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs font-semibold">{lang === "ru" ? "Профиль автора" : lang === "ua" ? "Профіль автора" : lang === "de" ? "Autorprofil" : "Author profile"}</span>
                    </div>
                    <div className="p-3 space-y-2">
                      {[
                        { label: lang === "ru" ? "Словарь" : lang === "ua" ? "Словник" : lang === "de" ? "Wortschatz" : "Vocabulary", value: styleAnalysis.vocabularyLevel },
                        { label: lang === "ru" ? "Предложения" : lang === "ua" ? "Речення" : lang === "de" ? "Sätze" : "Sentences", value: styleAnalysis.avgSentenceLength },
                        { label: lang === "ru" ? "Тон" : lang === "ua" ? "Тон" : lang === "de" ? "Ton" : "Tone", value: styleAnalysis.tone },
                        { label: lang === "ru" ? "Ритм" : lang === "ua" ? "Ритм" : lang === "de" ? "Rhythmus" : "Rhythm", value: styleAnalysis.rhythm },
                        ...(styleAnalysis.pov ? [{ label: lang === "ru" ? "Перспектива" : lang === "ua" ? "Перспектива" : lang === "de" ? "Perspektive" : "POV", value: styleAnalysis.pov }] : []),
                        ...(styleAnalysis.dialogueStyle ? [{ label: lang === "ru" ? "Диалоги" : lang === "ua" ? "Діалоги" : lang === "de" ? "Dialoge" : "Dialogue", value: styleAnalysis.dialogueStyle }] : []),
                      ].map(row => (
                        <div key={row.label} className="flex items-center justify-between">
                          <span className="text-[11px] text-muted-foreground">{row.label}</span>
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-foreground capitalize">{row.value}</span>
                        </div>
                      ))}
                      {styleAnalysis.devices?.length > 0 && (
                        <div className="pt-1.5 border-t border-border/60">
                          <p className="text-[10px] text-muted-foreground mb-1.5">{lang === "ru" ? "Приёмы" : lang === "ua" ? "Прийоми" : lang === "de" ? "Stilmittel" : "Devices"}</p>
                          <div className="flex flex-wrap gap-1">
                            {styleAnalysis.devices.map((d: string, i: number) => (
                              <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary">{d}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {styleAnalysis.patterns && (
                        <div className="pt-1.5 border-t border-border/60">
                          <p className="text-[10px] text-muted-foreground/70 mb-1">{lang === "ru" ? "Паттерны" : lang === "ua" ? "Патерни" : lang === "de" ? "Muster" : "Patterns"}</p>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">{styleAnalysis.patterns}</p>
                        </div>
                      )}
                      {styleAnalysis.summary && (
                        <div className="pt-1.5 border-t border-border/60">
                          <p className="text-[10px] text-muted-foreground/70 mb-1">{lang === "ru" ? "Общий стиль" : lang === "ua" ? "Загальний стиль" : lang === "de" ? "Gesamtstil" : "Overview"}</p>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">{styleAnalysis.summary}</p>
                        </div>
                      )}
                      {styleAnalysis.styleInstruction && (
                        <div className="pt-1.5 border-t border-border/60">
                          <div className="flex items-center gap-1 mb-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            <p className="text-[10px] text-primary font-medium">{lang === "ru" ? "AI инструкция" : lang === "ua" ? "AI інструкція" : lang === "de" ? "KI-Anweisung" : "AI instruction"}</p>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed italic">{styleAnalysis.styleInstruction}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="rounded-lg border border-border/60 overflow-hidden">
                    <button className="w-full h-8 flex items-center justify-between px-3 text-[11px] font-medium text-muted-foreground hover:bg-accent/60 transition-colors"
                      onClick={() => setShowExpandStyle(v => !v)} data-testid="button-show-expand-style">
                      <span className="flex items-center gap-1.5"><Sparkles className="h-3 w-3 text-primary/70" />
                        {lang === "ru" ? "Углубить анализ" : lang === "ua" ? "Поглибити аналіз" : lang === "de" ? "Analyse vertiefen" : "Deepen analysis"}
                      </span>
                      <ChevronDown className={`h-3 w-3 transition-transform ${showExpandStyle ? "rotate-180" : ""}`} />
                    </button>
                    {showExpandStyle && (
                      <div className="px-3 pb-3 pt-1 space-y-2 bg-muted/20 border-t border-border/40">
                        <p className="text-[10px] text-muted-foreground">
                          {lang === "ru" ? "Добавьте заметку для AI (необязательно):" : lang === "ua" ? "Додайте нотатку для AI (необов'язково):" : lang === "de" ? "Optionale Notiz für KI:" : "Optional note for AI:"}
                        </p>
                        <textarea
                          className="w-full text-[11px] rounded-md border border-border bg-background px-2.5 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground/60"
                          rows={2}
                          placeholder={lang === "ru" ? "Например: сделай больший акцент на ритме..." : "E.g. focus more on rhythm..."}
                          value={expandStylePrompt}
                          onChange={e => setExpandStylePrompt(e.target.value)}
                          data-testid="input-expand-style-prompt"
                        />
                        <button
                          className="w-full h-7 rounded-md text-[11px] font-semibold flex items-center justify-center gap-1.5 disabled:opacity-40 transition-colors"
                          style={{ background: "linear-gradient(90deg, #F96D1C, #ff8c3a)", color: "white" }}
                          onClick={expandStyle} disabled={expandingStyle} data-testid="button-expand-style">
                          {expandingStyle
                            ? <><RefreshCw className="h-3 w-3 animate-spin" /> {lang === "ru" ? "Углубляю..." : "Deepening..."}</>
                            : <><Sparkles className="h-3 w-3" /> {lang === "ru" ? "Углубить" : "Deepen"}</>}
                        </button>
                      </div>
                    )}
                  </div>
                  <button className="w-full h-8 rounded-lg text-[11px] font-medium border border-border text-muted-foreground hover:bg-accent/60 transition-colors"
                    onClick={() => { setStyleAnalysis(null); setApplyStyle(false); setShowExpandStyle(false); }}>
                    {lang === "ru" ? "Сбросить анализ" : lang === "ua" ? "Скинути аналіз" : lang === "de" ? "Analyse zurücksetzen" : "Reset analysis"}
                  </button>
                </div>
              )}
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* ─── КОРРЕКТНОСТЬ ─── */}
        <TabsContent value="correctness" className="flex-1 overflow-hidden m-0 mt-0">
          <ScrollArea className="h-full">
            <div className="p-3 space-y-3">

              {/* Header */}
              {spellMatches.length > 0 ? (
                <>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60">
                      {lang === "ru" ? "Ошибки" : lang === "ua" ? "Помилки" : lang === "de" ? "Fehler" : "Errors"}
                    </span>
                    <span className="flex items-center justify-center rounded-full text-[10px] font-bold text-white px-1.5 py-0.5 min-w-[1.25rem]"
                      style={{ background: "#ef4444" }}>
                      {spellMatches.length}
                    </span>
                  </div>

                  {/* Error list */}
                  <div className="divide-y divide-border/30 border border-border/40 rounded-xl overflow-hidden bg-background/70">
                    {spellMatches.map((match: any, idx: number) => {
                      const errWord = match.context.text.slice(match.context.offset, match.context.offset + match.context.length);
                      return (
                        <div
                          key={idx}
                          className="px-3 py-2.5 flex items-start gap-2 group hover:bg-muted/30 transition-colors cursor-pointer"
                          onClick={() => window.dispatchEvent(new CustomEvent("moodra:spell-navigate", { detail: { blockId: "focused" } }))}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                              <span className="text-[12px] font-semibold text-red-500 line-through">{errWord}</span>
                              {match.replacements.slice(0, 3).map((r: any, ri: number) => (
                                <button
                                  key={ri}
                                  onClick={ev => { ev.stopPropagation(); window.dispatchEvent(new CustomEvent("moodra:spell-fix-one", { detail: { match, replacement: r.value } })); }}
                                  className="text-[12px] font-semibold text-primary hover:underline px-1.5 py-0.5 rounded-lg hover:bg-primary/10 transition-colors"
                                >
                                  {r.value}
                                </button>
                              ))}
                              <button
                                title={lang === "ru" ? "Перейти к ошибке" : "Go to error"}
                                onClick={ev => { ev.stopPropagation(); window.dispatchEvent(new CustomEvent("moodra:spell-navigate", { detail: { blockId: "focused" } })); }}
                                className="ml-auto text-muted-foreground/40 hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <Navigation className="h-3 w-3" />
                              </button>
                            </div>
                            <div className="text-[10px] text-muted-foreground/60 leading-snug truncate">{match.message}</div>
                          </div>
                          <button
                            title={lang === "ru" ? "Игнорировать" : "Ignore"}
                            onClick={ev => { ev.stopPropagation(); window.dispatchEvent(new CustomEvent("moodra:spell-ignore", { detail: { ruleId: match.rule.id } })); }}
                            className="text-muted-foreground/30 hover:text-muted-foreground transition-colors text-[18px] leading-none mt-0.5 flex-shrink-0"
                          >×</button>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <CheckCircle2 className="h-10 w-10 text-green-500 mb-3" />
                  <p className="text-sm font-semibold">{lang === "ru" ? "Ошибок не найдено" : lang === "ua" ? "Помилок не знайдено" : lang === "de" ? "Keine Fehler" : "No errors found"}</p>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-snug max-w-[180px]">
                    {lang === "ru" ? "Включите умный режим проверки (ABC→Smart) чтобы видеть ошибки здесь" : lang === "ua" ? "Увімкніть розумний режим перевірки" : lang === "de" ? "Aktivieren Sie den Smart-Modus" : "Enable Smart spell-check mode to see errors here"}
                  </p>
                </div>
              )}

            </div>
          </ScrollArea>
        </TabsContent>
        {/* ─── АГЕНТЫ ─── */}
        <TabsContent value="agents" className="flex-1 overflow-hidden m-0 mt-0">
          <ScrollArea className="h-full">
            <div className="p-3 space-y-3">

              {/* Narrative Context Card */}
              <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-semibold hover:bg-muted/40 transition-colors"
                  onClick={() => setNcOpen(v => !v)}
                >
                  <div className="flex items-center gap-2">
                    <BookMarked className="w-4 h-4 text-violet-500" />
                    <span>{lang === "ru" ? "Контекст книги" : lang === "ua" ? "Контекст книги" : lang === "de" ? "Buchkontext" : "Book Context"}</span>
                    {Object.values(ncCtx).some(Boolean) && (
                      <span className="w-2 h-2 rounded-full bg-violet-500 inline-block" />
                    )}
                  </div>
                  {ncOpen ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                </button>

                {ncOpen && (
                  <div className="px-3 pb-3 space-y-2">
                    <textarea
                      placeholder={lang === "ru" ? "Центральная идея книги…" : lang === "ua" ? "Центральна ідея книги…" : lang === "de" ? "Kerngedanke des Buches…" : "Core idea of the book…"}
                      value={ncCtx.coreIdea || ""}
                      onChange={e => setNcCtx(p => ({ ...p, coreIdea: e.target.value }))}
                      rows={2}
                      className="w-full text-xs rounded-lg border border-border/60 bg-background px-2.5 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-violet-400"
                    />
                    <input
                      placeholder={lang === "ru" ? "Темы (через запятую)…" : lang === "ua" ? "Теми (через кому)…" : lang === "de" ? "Themen (kommagetrennt)…" : "Themes (comma separated)…"}
                      value={ncCtx.themes || ""}
                      onChange={e => setNcCtx(p => ({ ...p, themes: e.target.value }))}
                      className="w-full text-xs rounded-lg border border-border/60 bg-background px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-violet-400"
                    />
                    <div className="grid grid-cols-2 gap-1.5">
                      <select
                        value={ncCtx.structure || ""}
                        onChange={e => setNcCtx(p => ({ ...p, structure: e.target.value }))}
                        className="text-xs rounded-lg border border-border/60 bg-background px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-violet-400"
                      >
                        <option value="">{lang === "ru" ? "— Структура —" : lang === "ua" ? "— Структура —" : lang === "de" ? "— Struktur —" : "— Structure —"}</option>
                        {NC_STRUCTURES.map(s => (
                          <option key={s.value} value={s.value}>{lang === "ru" ? s.ru : lang === "ua" ? s.ua : lang === "de" ? s.de : s.en}</option>
                        ))}
                      </select>
                      <select
                        value={ncCtx.tone || ""}
                        onChange={e => setNcCtx(p => ({ ...p, tone: e.target.value }))}
                        className="text-xs rounded-lg border border-border/60 bg-background px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-violet-400"
                      >
                        <option value="">{lang === "ru" ? "— Тон —" : lang === "ua" ? "— Тон —" : lang === "de" ? "— Ton —" : "— Tone —"}</option>
                        {NC_TONES.map(t => (
                          <option key={t.value} value={t.value}>{lang === "ru" ? t.ru : lang === "ua" ? t.ua : lang === "de" ? t.de : t.en}</option>
                        ))}
                      </select>
                    </div>
                    <select
                      value={ncCtx.targetReader || ""}
                      onChange={e => setNcCtx(p => ({ ...p, targetReader: e.target.value }))}
                      className="w-full text-xs rounded-lg border border-border/60 bg-background px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-violet-400"
                    >
                      <option value="">{lang === "ru" ? "— Целевой читатель —" : lang === "ua" ? "— Цільовий читач —" : lang === "de" ? "— Zielleser —" : "— Target Reader —"}</option>
                      {NC_READERS.map(r => (
                        <option key={r.value} value={r.value}>{lang === "ru" ? r.ru : lang === "ua" ? r.ua : lang === "de" ? r.de : r.en}</option>
                      ))}
                    </select>
                    <button
                      onClick={saveNarrativeCtx}
                      disabled={ncSaving}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium bg-violet-500 hover:bg-violet-600 text-white transition-colors disabled:opacity-60"
                    >
                      {ncSaved ? <Check className="w-3.5 h-3.5" /> : ncSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      {ncSaved
                        ? (lang === "ru" ? "Сохранено!" : lang === "ua" ? "Збережено!" : lang === "de" ? "Gespeichert!" : "Saved!")
                        : (lang === "ru" ? "Сохранить контекст" : lang === "ua" ? "Зберегти контекст" : lang === "de" ? "Kontext speichern" : "Save Context")}
                    </button>
                  </div>
                )}
              </div>

              {/* Agents Grid */}
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-0.5">
                  {lang === "ru" ? "Аналитические агенты" : lang === "ua" ? "Аналітичні агенти" : lang === "de" ? "Analytische Agenten" : "Analytical Agents"}
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {AGENTS.map(agent => {
                    const Icon = agent.icon;
                    const isRunning = agentLoading === agent.id;
                    const isLast = lastAgent === agent.id;
                    const label = lang === "ru" ? agent.ru : lang === "ua" ? agent.ua : lang === "de" ? agent.de : agent.en;
                    const desc  = lang === "ru" ? agent.descRu : lang === "ua" ? agent.descUa : lang === "de" ? agent.descDe : agent.descEn;
                    return (
                      <button
                        key={agent.id}
                        onClick={() => {
                          if (agent.id === "reader") {
                            setLastAgent("reader");
                          } else {
                            runAgent(agent.id);
                          }
                        }}
                        disabled={!!agentLoading}
                        className={cn(
                          "relative flex flex-col items-start gap-1 rounded-xl border px-3 py-2.5 text-left transition-all",
                          "hover:shadow-sm hover:border-border disabled:opacity-50 disabled:cursor-not-allowed",
                          isRunning ? "border-opacity-100 shadow-sm" : "border-border/60 bg-card hover:bg-muted/30",
                          isLast && agentResult && !agentLoading ? "border-[1.5px]" : "",
                          agent.fullWidth ? "col-span-2" : ""
                        )}
                        style={isLast && agentResult && !agentLoading ? { borderColor: agent.color + "80" } : {}}
                      >
                        <div className="flex items-center gap-1.5 w-full">
                          <div className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: agent.color + "20" }}>
                            {isRunning
                              ? <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ color: agent.color }} />
                              : <Icon className="w-3.5 h-3.5" style={{ color: agent.color }} />
                            }
                          </div>
                          <span className="text-[11px] font-semibold leading-tight">{label}</span>
                        </div>
                        <span className="text-[9px] text-muted-foreground leading-tight">{desc}</span>
                        {isRunning && (
                          <div className="absolute inset-0 rounded-xl" style={{ background: agent.color + "08" }} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reader Profile Selector (shows when "reader" is selected) */}
              {lastAgent === "reader" && (
                <div className="rounded-xl border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/30 p-3 space-y-2">
                  <p className="text-[10px] font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide">
                    {lang === "ru" ? "Профиль читателя" : lang === "ua" ? "Профіль читача" : lang === "de" ? "Leserprofil" : "Reader Profile"}
                  </p>
                  <div className="grid grid-cols-2 gap-1">
                    {READER_PROFILES.map(p => (
                      <button
                        key={p.value}
                        onClick={() => setReaderProfile(p.value)}
                        className={cn(
                          "rounded-lg px-2 py-1.5 text-[10px] font-medium transition-colors text-left",
                          readerProfile === p.value
                            ? "bg-green-500 text-white"
                            : "bg-white dark:bg-green-950/50 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/40"
                        )}
                      >
                        {lang === "ru" ? p.ru : lang === "ua" ? p.ua : lang === "de" ? p.de : p.en}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => runAgent("reader")}
                    disabled={!!agentLoading}
                    className="w-full py-1.5 rounded-lg text-xs font-medium bg-green-500 hover:bg-green-600 text-white transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
                  >
                    {agentLoading === "reader"
                      ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" />{lang === "ru" ? "Анализ…" : lang === "ua" ? "Аналіз…" : lang === "de" ? "Analyse…" : "Analysing…"}</>
                      : <><Users className="w-3.5 h-3.5" />{lang === "ru" ? "Запустить агента" : lang === "ua" ? "Запустити агента" : lang === "de" ? "Agenten starten" : "Run Agent"}</>
                    }
                  </button>
                </div>
              )}

              {/* Agent Result */}
              {agentResult && !agentLoading && (() => {
                const ag = AGENTS.find(a => a.id === lastAgent);
                const agLabel = ag ? (lang === "ru" ? ag.ru : lang === "ua" ? ag.ua : lang === "de" ? ag.de : ag.en) : "Agent";
                return (
                  <div className="rounded-xl border overflow-hidden" style={{ borderColor: (ag?.color || "#6B7280") + "40" }}>
                    <div className="flex items-center justify-between px-3 py-2" style={{ background: (ag?.color || "#6B7280") + "10" }}>
                      <div className="flex items-center gap-1.5">
                        {ag && <ag.icon className="w-3.5 h-3.5" style={{ color: ag.color }} />}
                        <span className="text-xs font-semibold" style={{ color: ag?.color }}>
                          {agLabel}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => saveToResearch(
                            "agent_review",
                            `${agLabel} — ${book.title}`,
                            agLabel,
                            agentResult,
                            setAgentSaved,
                            setAgentSaving,
                          )}
                          disabled={agentSaving || agentSaved}
                          className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-colors"
                          style={{
                            background: agentSaved ? "rgba(34,197,94,0.15)" : "rgba(99,102,241,0.12)",
                            color: agentSaved ? "#22c55e" : "#818CF8",
                            border: `1px solid ${agentSaved ? "rgba(34,197,94,0.3)" : "rgba(99,102,241,0.25)"}`,
                          }}
                          title={lang === "ru" ? "Сохранить в исследования" : lang === "ua" ? "Зберегти до досліджень" : lang === "de" ? "In Recherche speichern" : "Save to Research"}
                        >
                          {agentSaved ? <Check className="w-3 h-3" /> : agentSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <BookOpen className="w-3 h-3" />}
                          {agentSaved
                            ? (lang === "ru" ? "Сохранено" : lang === "ua" ? "Збережено" : lang === "de" ? "Gespeichert" : "Saved")
                            : (lang === "ru" ? "В исследования" : lang === "ua" ? "До досліджень" : lang === "de" ? "In Recherche" : "Save")}
                        </button>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(agentResult);
                            setAgentCopied(true);
                            setTimeout(() => setAgentCopied(false), 1500);
                          }}
                          className="p-1 rounded hover:bg-black/10 transition-colors"
                          title="Copy"
                        >
                          {agentCopied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                        </button>
                      </div>
                    </div>
                    <div className="px-3 py-2.5 text-[11px] text-foreground/90 leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
                      {agentResult}
                    </div>
                  </div>
                );
              })()}

              {!chapter && (
                <div className="rounded-xl border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground">
                  {lang === "ru" ? "Откройте главу, чтобы запустить агента"
                    : lang === "ua" ? "Відкрийте розділ, щоб запустити агента"
                    : lang === "de" ? "Kapitel öffnen, um einen Agenten zu starten"
                    : "Open a chapter to run an agent"}
                </div>
              )}

              {/* Full Editorial Board Review */}
              <div className="rounded-xl border border-border/60 overflow-hidden">
                <button
                  onClick={() => setCollabOpen(v => !v)}
                  className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "rgba(245,158,11,0.15)" }}>
                      <Users className="w-3.5 h-3.5" style={{ color: "#F59E0B" }} />
                    </div>
                    <span className="text-xs font-semibold text-foreground">
                      {lang === "ru" ? "Редакционный совет" : lang === "ua" ? "Редакційна рада" : lang === "de" ? "Redaktionsausschuss" : "Full Editorial Board Review"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {collabLoading && <Loader2 className="w-3 h-3 animate-spin text-amber-400" />}
                    <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${collabOpen ? "rotate-180" : ""}`} />
                  </div>
                </button>
                {collabOpen && (
                  <div className="px-3 pb-3 pt-0 space-y-2 border-t border-border/40">
                    <p className="text-[10px] text-muted-foreground pt-2 leading-relaxed">
                      {lang === "ru" ? "5 экспертных голосов (сюжет, стиль, структура, персонажи, темп) оценивают текущую главу совместно."
                        : lang === "ua" ? "5 експертних голосів (сюжет, стиль, структура, персонажі, темп) оцінюють поточний розділ спільно."
                        : lang === "de" ? "5 Expertenstimmen (Plot, Stil, Struktur, Charaktere, Tempo) bewerten das aktuelle Kapitel gemeinsam."
                        : "5 expert voices (plot, style, structure, characters, pacing) jointly review the current chapter."}
                    </p>
                    <button
                      onClick={runCollab}
                      disabled={collabLoading || !chapter}
                      className="w-full py-2 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        background: "linear-gradient(135deg, rgba(245,158,11,0.18) 0%, rgba(239,68,68,0.12) 100%)",
                        border: "1px solid rgba(245,158,11,0.35)",
                        color: collabLoading ? "#9CA3AF" : "#F59E0B",
                        opacity: (!chapter || collabLoading) ? 0.6 : 1,
                      }}
                    >
                      {collabLoading
                        ? (lang === "ru" ? "Совещаются…" : lang === "ua" ? "Нарадяться…" : lang === "de" ? "Beratung…" : "Deliberating…")
                        : (lang === "ru" ? "Запустить совместный анализ" : lang === "ua" ? "Запустити спільний аналіз" : lang === "de" ? "Gemeinsame Analyse starten" : "Run Joint Analysis")}
                    </button>
                    {collabResult && (
                      <div className="rounded-lg border border-amber-500/20 overflow-hidden">
                        <div className="flex items-center justify-between px-3 py-1.5" style={{ background: "rgba(245,158,11,0.08)" }}>
                          <span className="text-[10px] font-semibold text-amber-400">
                            {lang === "ru" ? "Редакционный совет" : lang === "ua" ? "Редакційна рада" : lang === "de" ? "Redaktionsrat" : "Editorial Board"}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => saveToResearch(
                                "agent_review",
                                `Editorial Board — ${book.title}`,
                                "Editorial Board",
                                collabResult,
                                setCollabSaved,
                                (v) => { if (!v) setCollabSaved(false); },
                              )}
                              disabled={collabSaved}
                              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] transition-colors"
                              style={{
                                background: collabSaved ? "rgba(34,197,94,0.15)" : "rgba(245,158,11,0.12)",
                                color: collabSaved ? "#22c55e" : "#F59E0B",
                                border: `1px solid ${collabSaved ? "rgba(34,197,94,0.3)" : "rgba(245,158,11,0.25)"}`,
                              }}
                            >
                              {collabSaved ? <Check className="w-3 h-3" /> : <BookOpen className="w-3 h-3" />}
                            </button>
                            <button
                              onClick={() => { navigator.clipboard.writeText(collabResult); setCollabCopied(true); setTimeout(() => setCollabCopied(false), 1500); }}
                              className="p-1 rounded hover:bg-black/10 transition-colors"
                            >
                              {collabCopied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                            </button>
                          </div>
                        </div>
                        <div className="px-3 py-2.5 text-[11px] text-foreground/90 leading-relaxed whitespace-pre-wrap max-h-56 overflow-y-auto">
                          {collabResult}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          </ScrollArea>
        </TabsContent>

      </Tabs>

      {/* API Key Gate — violet floating card */}
      {freeGateOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center" style={{ pointerEvents: "none" }}>
          <div className="w-full max-w-sm mx-4" style={{ pointerEvents: "auto", background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)", border: "1.5px solid rgba(99,102,241,0.55)", borderRadius: "16px", padding: "22px" }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(99,102,241,0.18)" }}>
                <Brain className="w-4 h-4" style={{ color: "#818CF8" }} />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: "#E2E8F0" }}>
                  {lang === "ru" ? "Нужен API ключ" : lang === "ua" ? "Потрібен API ключ" : lang === "de" ? "API-Schlüssel benötigt" : "API key required"}
                </p>
                <p className="text-[11px]" style={{ color: "#818CF8" }}>OpenAI</p>
              </div>
            </div>
            <p className="text-[12px] leading-relaxed mb-4" style={{ color: "#94A3B8" }}>
              {lang === "ru"
                ? "Эта функция недоступна в бесплатном режиме. Добавь API ключ OpenAI для полного доступа."
                : lang === "ua"
                  ? "Ця функція недоступна в безплатному режимі. Додай API ключ OpenAI для повного доступу."
                  : lang === "de"
                    ? "Diese Funktion ist im kostenlosen Modus nicht verfügbar. Fügen Sie einen OpenAI-API-Schlüssel hinzu."
                    : "This feature is unavailable in free mode. Add your OpenAI API key for full access."}
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setFreeGateOpen(false)}
                className="w-full py-2 rounded-xl text-sm font-semibold transition-colors"
                style={{ background: "rgba(99,102,241,0.15)", color: "#A5B4FC" }}
              >
                {lang === "ru" ? "Закрыть" : lang === "ua" ? "Закрити" : lang === "de" ? "Schließen" : "Close"}
              </button>
              <button
                onClick={() => { setFreeGateOpen(false); setLocation("/models"); }}
                className="w-full py-2 rounded-xl text-sm font-semibold transition-colors"
                style={{ background: "rgba(249,109,28,0.18)", color: "#FB923C" }}
              >
                {lang === "ru" ? "Добавить API ключ" : lang === "ua" ? "Додати API ключ" : lang === "de" ? "API-Schlüssel hinzufügen" : "Add API key"}
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
