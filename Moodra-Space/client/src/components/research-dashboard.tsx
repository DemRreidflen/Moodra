import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAiError } from "@/contexts/ai-error-context";
import { useLang } from "@/contexts/language-context";
import { useFreeMode } from "@/hooks/use-free-mode";
import type { Book, Draft, Chapter } from "@shared/schema";
import {
  Sparkles, FileEdit, Plus,
  Loader2, CheckCircle2, FileText, ChevronDown, ChevronUp, X, Zap,
  Save, ArrowLeft, Clock, Lightbulb,
  Check, Trash2, Link2, SendToBack, GitBranch, Wand2,
  Minus, ChevronsLeftRight, Timer, Keyboard, ArrowDown,
  ListChecks, PenLine, Pencil, BookCheck, Flag, ChevronRight,
  Layers3, TextCursorInput, Repeat2, Lightbulb as IdeaIcon,
} from "lucide-react";
import { BlockEditor, Block, blocksToPlainText, BlockEditorAPI } from "@/components/block-editor";
import { SelectionToolbar } from "@/components/selection-toolbar";
import { AiPanel } from "@/components/ai-panel";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";


// ─── Draft stages config ──────────────────────────────────────────────────────
const DRAFT_STAGES = [
  { id: "plan",   labelRu: "План",       labelEn: "Plan",       labelUa: "План",       labelDe: "Plan",       icon: ListChecks,    color: "#6366F1", desc: { ru: "Структура, ключевые идеи, порядок разделов",                  en: "Structure, key ideas, section order",           ua: "Структура, ключові ідеї, порядок розділів",               de: "Struktur, Kernideen, Reihenfolge" } },
  { id: "sketch", labelRu: "Набросок",   labelEn: "Sketch",     labelUa: "Нарис",      labelDe: "Entwurf",    icon: PenLine,       color: "#F59E0B", desc: { ru: "Первый черновой текст без правок",                          en: "First rough text without editing",              ua: "Перший чорновий текст без правок",                         de: "Erster Roh-Text ohne Korrekturen" } },
  { id: "edit",   labelRu: "Редактура",  labelEn: "Editing",    labelUa: "Редагування", labelDe: "Bearbeitung", icon: Pencil,       color: "#10B981", desc: { ru: "Смысловая и стилистическая правка",                         en: "Content and style revision",                    ua: "Смислове та стилістичне редагування",                      de: "Inhaltliche und stilistische Überarbeitung" } },
  { id: "final",  labelRu: "Финал",      labelEn: "Final",      labelUa: "Фінал",      labelDe: "Final",      icon: BookCheck,     color: "#EC4899", desc: { ru: "Готов к переносу в книгу",                                  en: "Ready to move to book",                         ua: "Готовий до перенесення в книгу",                           de: "Bereit für das Buch" } },
] as const;
type DraftStageId = typeof DRAFT_STAGES[number]["id"];

// ─── i18n ─────────────────────────────────────────────────────────────────────
const RESEARCH_I18N = {
  ru: {
    cancelBtn: "Отмена", aiError: "Ошибка AI",
    draftsTitle: "Черновики", draftsDesc: "Пишите свободно — без вёрстки. Готовый текст переносится в книгу одной кнопкой",
    newDraft: "Новый", createDraft: "Создать черновик", noDrafts: "Создайте первый черновик",
    draftDeleted: "Черновик удалён",
    draftsBack: "Черновики", titlePlaceholder: "Название черновика…",
    words: (n: number) => `${n} сл.`, wordsTotal: (n: number) => `${n} слов`,
    lessThanMin: "< 1 мин", minLabel: "мин", reading: "чтения",
    newDraftTitle: "Новый черновик",
    noChapter: "Без главы", saveBtn: "Сохранить", toBookBtn: "В книгу",
    aiTipBtn: "Совет ИИ", aiPanelBtn: "ИИ",
    moveToBook: "Перенести в книгу", moveDesc: "Текст черновика станет частью основного редактора",
    newChapterOpt: "Создать новую главу", newChapterDesc: "Черновик станет новой главой в редакторе",
    appendOpt: "Добавить в существующую главу", appendDesc: "Текст добавляется в конец выбранной главы",
    selectChapter: "Выберите главу…", moveBtn: "Перенести", movingBtn: "Переносим…",
    moveSuccessNew: "Создана новая глава в редакторе", moveSuccessAppend: "Текст добавлен в главу", moveError: "Ошибка переноса",
    linkChapter: "Привязать главу",
    moreDrafts: (n: number) => `Ещё ${n} черновиков…`,
    stagesTitle: "Этапы черновика", stagesDesc: "Отслеживайте прогресс по каждому черновику",
    stageNone: "Без этапа", stageSet: "Этап сохранён",
    aiAssist: "AI-помощник",
    aiSketch: "Набросок по плану", aiSketchDesc: "Напишите план — AI развернёт его в черновой текст",
    aiExpand: "Расширить тезисы", aiExpandDesc: "Вставьте тезисы — AI превратит их в абзацы",
    aiContinue: "Продолжить текст", aiContinueDesc: "AI допишет следующие абзацы",
    aiIdeas: "Идеи для развития", aiIdeasDesc: "AI предложит 5 направлений для продолжения",
    aiInput: "Введите план, тезисы или фрагмент текста…",
    aiGenerate: "Генерировать", aiGenerating: "Генерирую…",
    aiResult: "Результат",
    aiInsert: "Вставить в черновик", aiClose: "Закрыть",
    noApiTitle: "Нужен API-ключ", noApiBody: "AI-помощник требует подключённый ключ OpenAI.",
    noApiBtn: "Подключить →",
    typewriterMode: "Режим печатной машинки",
    sprintLabel: "Спринт", sprintGoalPlaceholder: "Слов", sprintStart: "Старт",
  },
  en: {
    cancelBtn: "Cancel", aiError: "AI error",
    draftsTitle: "Drafts", draftsDesc: "Write freely — without layout. Move finished text to the book in one click",
    newDraft: "New", createDraft: "Create draft", noDrafts: "Create your first draft",
    draftDeleted: "Draft deleted",
    draftsBack: "Drafts", titlePlaceholder: "Draft title…",
    words: (n: number) => `${n} w.`, wordsTotal: (n: number) => `${n} words`,
    lessThanMin: "< 1 min", minLabel: "min", reading: "read",
    newDraftTitle: "New draft",
    noChapter: "No chapter", saveBtn: "Save", toBookBtn: "To book",
    aiTipBtn: "AI tip", aiPanelBtn: "AI",
    moveToBook: "Move to book", moveDesc: "The draft text will become part of the main editor",
    newChapterOpt: "Create new chapter", newChapterDesc: "Draft will become a new chapter in the editor",
    appendOpt: "Append to existing chapter", appendDesc: "Text is added to the end of the selected chapter",
    selectChapter: "Select chapter…", moveBtn: "Move", movingBtn: "Moving…",
    moveSuccessNew: "New chapter created in editor", moveSuccessAppend: "Text added to chapter", moveError: "Move error",
    linkChapter: "Link chapter",
    moreDrafts: (n: number) => `${n} more drafts…`,
    stagesTitle: "Draft Stages", stagesDesc: "Track progress for each draft",
    stageNone: "No stage", stageSet: "Stage saved",
    aiAssist: "AI Assistant",
    aiSketch: "Sketch from plan", aiSketchDesc: "Write a plan — AI turns it into a draft",
    aiExpand: "Expand theses", aiExpandDesc: "Paste bullet points — AI writes full paragraphs",
    aiContinue: "Continue text", aiContinueDesc: "AI writes the next paragraphs",
    aiIdeas: "Development ideas", aiIdeasDesc: "AI suggests 5 directions to continue",
    aiInput: "Enter your plan, theses or text fragment…",
    aiGenerate: "Generate", aiGenerating: "Generating…",
    aiResult: "Result",
    aiInsert: "Insert into draft", aiClose: "Close",
    noApiTitle: "API key needed", noApiBody: "The AI assistant requires a connected OpenAI key.",
    noApiBtn: "Connect →",
    typewriterMode: "Typewriter mode",
    sprintLabel: "Sprint", sprintGoalPlaceholder: "Words", sprintStart: "Start",
  },
  ua: {
    cancelBtn: "Скасувати", aiError: "Помилка ШІ",
    draftsTitle: "Чернетки", draftsDesc: "Пишіть вільно — без верстки. Готовий текст переноситься в книгу одним натисканням",
    newDraft: "Нова", createDraft: "Створити чернетку", noDrafts: "Створіть першу чернетку",
    draftDeleted: "Чернетку видалено",
    draftsBack: "Чернетки", titlePlaceholder: "Назва чернетки…",
    words: (n: number) => `${n} сл.`, wordsTotal: (n: number) => `${n} слів`,
    lessThanMin: "< 1 хв", minLabel: "хв", reading: "читання",
    newDraftTitle: "Нова чернетка",
    noChapter: "Без розділу", saveBtn: "Зберегти", toBookBtn: "До книги",
    aiTipBtn: "Порада ШІ", aiPanelBtn: "ШІ",
    moveToBook: "Перенести в книгу", moveDesc: "Текст чернетки стане частиною основного редактора",
    newChapterOpt: "Створити новий розділ", newChapterDesc: "Чернетка стане новим розділом у редакторі",
    appendOpt: "Додати до існуючого розділу", appendDesc: "Текст додається в кінець обраного розділу",
    selectChapter: "Оберіть розділ…", moveBtn: "Перенести", movingBtn: "Переносимо…",
    moveSuccessNew: "Новий розділ створено в редакторі", moveSuccessAppend: "Текст додано до розділу", moveError: "Помилка переносу",
    linkChapter: "Прив'язати розділ",
    moreDrafts: (n: number) => `Ще ${n} чернеток…`,
    stagesTitle: "Етапи чернетки", stagesDesc: "Відстежуйте прогрес по кожній чернетці",
    stageNone: "Без етапу", stageSet: "Етап збережено",
    aiAssist: "ШІ-помічник",
    aiSketch: "Нарис за планом", aiSketchDesc: "Напишіть план — ШІ розгорне його у чернетку",
    aiExpand: "Розширити тези", aiExpandDesc: "Вставте тези — ШІ напише повні абзаци",
    aiContinue: "Продовжити текст", aiContinueDesc: "ШІ допише наступні абзаци",
    aiIdeas: "Ідеї для розвитку", aiIdeasDesc: "ШІ запропонує 5 напрямків продовження",
    aiInput: "Введіть план, тези або фрагмент тексту…",
    aiGenerate: "Генерувати", aiGenerating: "Генерую…",
    aiResult: "Результат",
    aiInsert: "Вставити в чернетку", aiClose: "Закрити",
    noApiTitle: "Потрібен API-ключ", noApiBody: "ШІ-помічник потребує підключеного ключа OpenAI.",
    noApiBtn: "Підключити →",
    typewriterMode: "Режим друкарської машинки",
    sprintLabel: "Спринт", sprintGoalPlaceholder: "Слів", sprintStart: "Старт",
  },
  de: {
    cancelBtn: "Abbrechen", aiError: "KI-Fehler",
    draftsTitle: "Entwürfe", draftsDesc: "Schreiben Sie frei — ohne Layout. Per Klick in das Buch übertragen",
    newDraft: "Neu", createDraft: "Entwurf erstellen", noDrafts: "Ersten Entwurf erstellen",
    draftDeleted: "Entwurf gelöscht",
    draftsBack: "Entwürfe", titlePlaceholder: "Entwurfstitel…",
    words: (n: number) => `${n} W.`, wordsTotal: (n: number) => `${n} Wörter`,
    lessThanMin: "< 1 Min", minLabel: "Min", reading: "Lesen",
    newDraftTitle: "Neuer Entwurf",
    noChapter: "Kein Kapitel", saveBtn: "Speichern", toBookBtn: "Ins Buch",
    aiTipBtn: "KI-Tipp", aiPanelBtn: "KI",
    moveToBook: "In Buch übertragen", moveDesc: "Der Entwurfstext wird Teil des Haupteditors",
    newChapterOpt: "Neues Kapitel erstellen", newChapterDesc: "Entwurf wird ein neues Kapitel im Editor",
    appendOpt: "An bestehendes Kapitel anhängen", appendDesc: "Text am Ende des Kapitels eingefügt",
    selectChapter: "Kapitel auswählen…", moveBtn: "Übertragen", movingBtn: "Übertrage…",
    moveSuccessNew: "Neues Kapitel im Editor erstellt", moveSuccessAppend: "Text zum Kapitel hinzugefügt", moveError: "Übertragungsfehler",
    linkChapter: "Kapitel verknüpfen",
    moreDrafts: (n: number) => `${n} weitere Entwürfe…`,
    stagesTitle: "Entwurfsphasen", stagesDesc: "Verfolgen Sie den Fortschritt jedes Entwurfs",
    stageNone: "Keine Phase", stageSet: "Phase gespeichert",
    aiAssist: "KI-Assistent",
    aiSketch: "Entwurf aus Plan", aiSketchDesc: "Plan schreiben — KI erstellt einen Entwurf",
    aiExpand: "Thesen ausbauen", aiExpandDesc: "Thesen einfügen — KI schreibt vollständige Absätze",
    aiContinue: "Text fortsetzen", aiContinueDesc: "KI schreibt die nächsten Absätze",
    aiIdeas: "Entwicklungsideen", aiIdeasDesc: "KI schlägt 5 Richtungen vor",
    aiInput: "Plan, Thesen oder Textfragment eingeben…",
    aiGenerate: "Generieren", aiGenerating: "Generiere…",
    aiResult: "Ergebnis",
    aiInsert: "In Entwurf einfügen", aiClose: "Schließen",
    noApiTitle: "API-Schlüssel benötigt", noApiBody: "Der KI-Assistent benötigt einen OpenAI-Schlüssel.",
    noApiBtn: "Verbinden →",
    typewriterMode: "Schreibmaschinen-Modus",
    sprintLabel: "Sprint", sprintGoalPlaceholder: "Wörter", sprintStart: "Start",
  },
} as const;
type ResearchT = typeof RESEARCH_I18N.ru;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

// ─── Section header ──────────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon, color, title, description, action, actionLabel, actionIcon: ActionIcon,
}: {
  icon: any; color: string; title: string; description: string;
  action?: () => void; actionLabel?: string; actionIcon?: any;
}) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}15` }}>
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        <div>
          <h3 className="text-base font-bold tracking-tight">{title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
      {action && (
        <button onClick={action}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
          style={{ background: `${color}12`, color }}>
          {ActionIcon && <ActionIcon className="h-3.5 w-3.5" />}
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// ─── Draft Stages Section ────────────────────────────────────────────────────

function DraftStagesSection({ bookId, book, drafts }: { bookId: number; book: Book; drafts: Draft[] }) {
  const { lang } = useLang();
  const { toast } = useToast();
  const t = (RESEARCH_I18N[lang as keyof typeof RESEARCH_I18N] ?? RESEARCH_I18N.ru) as ResearchT;

  const [stages, setStages] = useState<Record<number, DraftStageId>>(() => {
    try { return JSON.parse(localStorage.getItem(`moodra_draft_stages_${bookId}`) || "{}"); } catch { return {}; }
  });

  const setStage = (draftId: number, stageId: DraftStageId) => {
    const next = { ...stages, [draftId]: stageId };
    setStages(next);
    try { localStorage.setItem(`moodra_draft_stages_${bookId}`, JSON.stringify(next)); } catch {}
    toast({ title: t.stageSet, duration: 1500 });
  };

  const activeDrafts = drafts.filter(d => d.status !== "archived");

  const getStageLabel = (s: typeof DRAFT_STAGES[number]) => {
    if (lang === "en") return s.labelEn;
    if (lang === "ua") return s.labelUa;
    if (lang === "de") return s.labelDe;
    return s.labelRu;
  };

  const getStageDesc = (s: typeof DRAFT_STAGES[number]) => {
    const d = s.desc as any;
    return d[lang] || d.ru;
  };

  const counts = DRAFT_STAGES.reduce((acc, s) => {
    acc[s.id] = activeDrafts.filter(d => (stages[d.id] || "plan") === s.id).length;
    return acc;
  }, {} as Record<string, number>);

  const finalCount = counts["final"] || 0;
  const progress = activeDrafts.length > 0 ? Math.round((finalCount / activeDrafts.length) * 100) : 0;

  return (
    <div className="rounded-2xl border border-border/50 bg-background/80 p-6 shadow-sm">
      <SectionHeader
        icon={ListChecks} color="#6366F1"
        title={t.stagesTitle}
        description={t.stagesDesc}
      />
      {activeDrafts.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground">{activeDrafts.length} {lang === "ru" ? "черновиков" : lang === "ua" ? "чернеток" : lang === "de" ? "Entwürfe" : "drafts"}</span>
            <span className="text-xs font-semibold" style={{ color: "#EC4899" }}>{finalCount} {lang === "ru" ? "готовы" : lang === "ua" ? "готові" : lang === "de" ? "fertig" : "final"}</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: "linear-gradient(90deg, #6366F1, #EC4899)" }} />
          </div>
        </div>
      )}
      {activeDrafts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground/50">
          <ListChecks className="h-8 w-8" />
          <p className="text-sm">{t.noDrafts}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {DRAFT_STAGES.map(stage => {
            const SIcon = stage.icon;
            const draftsInStage = activeDrafts.filter(d => (stages[d.id] || "plan") === stage.id);
            const nextStageIdx = DRAFT_STAGES.findIndex(s => s.id === stage.id) + 1;
            const nextStage = DRAFT_STAGES[nextStageIdx];
            return (
              <div key={stage.id} className="rounded-xl border border-border/40 overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3" style={{ background: `${stage.color}08` }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${stage.color}18` }}>
                    <SIcon className="h-3.5 w-3.5" style={{ color: stage.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{getStageLabel(stage)}</p>
                    <p className="text-[11px] text-muted-foreground">{getStageDesc(stage)}</p>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${stage.color}18`, color: stage.color }}>{draftsInStage.length}</span>
                </div>
                {draftsInStage.length > 0 && (
                  <div className="px-4 py-2 space-y-1.5 border-t border-border/30">
                    {draftsInStage.map(d => (
                      <div key={d.id} className="flex items-center gap-2 group">
                        <p className="text-sm flex-1 truncate text-foreground/80">{d.title}</p>
                        {stage.id !== "final" && nextStage && (
                          <button
                            onClick={() => setStage(d.id, nextStage.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: `${nextStage.color}18`, color: nextStage.color }}
                          >
                            <ChevronRight className="h-2.5 w-2.5" />
                            {getStageLabel(nextStage)}
                          </button>
                        )}
                        {stage.id === "final" && <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Draft AI Assistant ───────────────────────────────────────────────────────

const ASSIST_MODES = [
  { id: "sketch",   IconComp: Layers3,         getLabel: (t: ResearchT) => t.aiSketch,   getDesc: (t: ResearchT) => t.aiSketchDesc },
  { id: "expand",   IconComp: TextCursorInput, getLabel: (t: ResearchT) => t.aiExpand,   getDesc: (t: ResearchT) => t.aiExpandDesc },
  { id: "continue", IconComp: Repeat2,         getLabel: (t: ResearchT) => t.aiContinue, getDesc: (t: ResearchT) => t.aiContinueDesc },
  { id: "ideas",    IconComp: IdeaIcon,         getLabel: (t: ResearchT) => t.aiIdeas,    getDesc: (t: ResearchT) => t.aiIdeasDesc },
] as const;

function DraftAiAssistant({ book, onInsert }: {
  book: Book;
  onInsert?: (text: string) => void;
}) {
  const { lang } = useLang();
  const { isFreeMode } = useFreeMode();
  const { handleAiError } = useAiError();
  const { toast } = useToast();
  const t = (RESEARCH_I18N[lang as keyof typeof RESEARCH_I18N] ?? RESEARCH_I18N.ru) as ResearchT;

  const [activeMode, setActiveMode] = useState<string>("sketch");
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNoApi, setShowNoApi] = useState(false);

  const handleGenerate = async () => {
    if (!input.trim() || loading) return;
    if (isFreeMode) { setShowNoApi(true); return; }
    setLoading(true); setResult("");
    try {
      const data = await apiRequest("POST", "/api/ai/draft-assist", {
        mode: activeMode,
        input: input.trim(),
        bookTitle: book.title,
        bookMode: book.mode,
      });
      setResult(data.result || "");
    } catch (e: any) {
      if (!handleAiError(e)) toast({ title: t.aiError, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const color = "#F96D1C";

  return (
    <div className="rounded-2xl border border-border/50 bg-background/80 p-6 shadow-sm space-y-4">
      <SectionHeader
        icon={Sparkles} color={color}
        title={t.aiAssist}
        description={t.aiSketchDesc}
      />
      {showNoApi && (
        <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/30 space-y-2">
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">{t.noApiTitle}</p>
          <p className="text-xs text-amber-600/80 dark:text-amber-400/60">{t.noApiBody}</p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        {ASSIST_MODES.map(m => {
          const MIcon = m.IconComp;
          const isActive = activeMode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => { setActiveMode(m.id); setResult(""); }}
              className={cn("flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all", isActive ? "border-primary/40 bg-primary/5" : "border-border/50 hover:border-border")}
            >
              <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: isActive ? `${color}18` : "rgba(0,0,0,0.04)" }}>
                <MIcon className="h-3.5 w-3.5" style={{ color: isActive ? color : undefined }} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold leading-tight">{m.getLabel(t)}</p>
                <p className="text-[10px] text-muted-foreground leading-tight mt-0.5 line-clamp-2">{m.getDesc(t)}</p>
              </div>
            </button>
          );
        })}
      </div>
      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        rows={5}
        placeholder={t.aiInput}
        className="w-full rounded-xl border border-border/60 bg-background/60 px-3.5 py-3 text-sm resize-none outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all"
      />
      <button
        onClick={handleGenerate}
        disabled={!input.trim() || loading}
        className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        style={{ background: "linear-gradient(135deg, #F96D1C, #FB923C)" }}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {loading ? t.aiGenerating : t.aiGenerate}
      </button>
      {result && (
        <div className="rounded-xl border border-green-200/40 bg-green-50/30 dark:bg-green-950/15 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-green-200/30 flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
            <span className="text-xs font-semibold text-green-700 dark:text-green-400">{t.aiResult}</span>
          </div>
          <div className="px-4 py-3 max-h-64 overflow-y-auto">
            <p className="text-sm leading-relaxed text-foreground/85 whitespace-pre-wrap">{result}</p>
          </div>
          <div className="px-4 py-2.5 border-t border-green-200/30 flex items-center gap-2">
            {onInsert && (
              <button
                onClick={() => onInsert(result)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                style={{ background: "linear-gradient(135deg, #10B981, #059669)" }}
              >
                <Check className="h-3.5 w-3.5" />
                {t.aiInsert}
              </button>
            )}
            <button
              onClick={() => setResult("")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-secondary transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              {t.aiClose}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


// ─── Draft Card ──────────────────────────────────────────────────────────────

function DraftCard({ draft, chapters, onClick, onDelete }: {
  draft: Draft; chapters: Chapter[];
  onClick: () => void; onDelete: () => void;
}) {
  const linkedChapter = chapters.find(c => c.id === draft.linkedChapterId);
  const preview = draft.content
    ? (() => {
        try {
          const parsed = JSON.parse(draft.content);
          if (Array.isArray(parsed)) return parsed.map((b: any) => b.content).filter(Boolean).join(" ").slice(0, 120);
        } catch {}
        return draft.content.slice(0, 120);
      })()
    : "";

  return (
    <div
      className="group p-4 rounded-xl border border-border/50 bg-background hover:border-violet-300/40 hover:shadow-sm transition-all cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <FileEdit className="h-4 w-4 text-muted-foreground/60 flex-shrink-0" />
          <p className="font-semibold text-sm truncate">{draft.title}</p>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/40 hover:text-red-400 flex-shrink-0"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      {preview && (
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-2">{preview}</p>
      )}
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground/60">
        {linkedChapter && (
          <div className="flex items-center gap-1">
            <Link2 className="h-3 w-3" />
            <span className="truncate max-w-[100px]">{linkedChapter.title}</span>
          </div>
        )}
        {(draft.wordCount || 0) > 0 && (
          <div className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            <span>{draft.wordCount} сл.</span>
          </div>
        )}
        <span className="ml-auto">{draft.updatedAt ? format(new Date(draft.updatedAt), "d MMM") : ""}</span>
      </div>
    </div>
  );
}

// ─── Drafts Section ──────────────────────────────────────────────────────────

function DraftsSection({ bookId, book, onOpenDraft }: {
  bookId: number; book: Book;
  onOpenDraft: (draft: Draft | null) => void;
}) {
  const { toast } = useToast();
  const { lang } = useLang();
  const t = (RESEARCH_I18N[lang as keyof typeof RESEARCH_I18N] ?? RESEARCH_I18N.ru) as ResearchT;

  const { data: drafts = [] } = useQuery<Draft[]>({
    queryKey: ["/api/books", bookId, "drafts"],
    queryFn: () => apiRequest("GET", `/api/books/${bookId}/drafts`),
  });

  const { data: chapters = [] } = useQuery<Chapter[]>({
    queryKey: ["/api/books", bookId, "chapters"],
    queryFn: () => apiRequest("GET", `/api/books/${bookId}/chapters`),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/api/books/${bookId}/drafts`, data),
    onSuccess: (d: Draft) => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "drafts"] });
      onOpenDraft(d);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/drafts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "drafts"] });
      toast({ title: t.draftDeleted });
    },
  });

  const activeDrafts = drafts.filter(d => d.status !== "archived");

  return (
    <div className="rounded-2xl border border-border/50 bg-background/80 shadow-sm flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="px-6 pt-6 pb-3 flex-shrink-0">
        <SectionHeader
          icon={FileEdit} color="#F96D1C"
          title={t.draftsTitle}
          description={t.draftsDesc}
          action={() => createMutation.mutate({ title: t.newDraftTitle, content: "" })}
          actionLabel={t.newDraft}
          actionIcon={Plus}
        />
      </div>

      {activeDrafts.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-5 flex-1 py-10 text-center px-6 pb-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(249,109,28,0.12), rgba(251,146,60,0.08))" }}>
              <FileEdit className="h-10 w-10" style={{ color: "#F96D1C" }} />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-3 w-3 text-primary" />
            </div>
          </div>
          <div className="space-y-1.5 max-w-[220px]">
            <p className="text-sm font-semibold">{t.noDrafts}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{t.draftsDesc}</p>
          </div>
          <button
            onClick={() => createMutation.mutate({ title: t.newDraftTitle, content: "" })}
            disabled={createMutation.isPending}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
            style={{ background: "linear-gradient(135deg, #F96D1C, #FB923C)" }}>
            {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {t.createDraft}
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-2 min-h-0">
          {activeDrafts.map(d => (
            <DraftCard
              key={d.id}
              draft={d}
              chapters={chapters}
              onClick={() => onOpenDraft(d)}
              onDelete={() => deleteMutation.mutate(d.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Draft Editor ────────────────────────────────────────────────────────────

function DraftEditor({ draft, bookId, book, chapters, onBack }: {
  draft: Draft; bookId: number; book: Book; chapters: Chapter[]; onBack: () => void;
}) {
  const { toast } = useToast();
  const { handleAiError } = useAiError();
  const { lang } = useLang();
  const t = (RESEARCH_I18N[lang as keyof typeof RESEARCH_I18N] ?? RESEARCH_I18N.ru) as ResearchT;
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [title, setTitle] = useState(draft.title);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [linkedChapterId, setLinkedChapterId] = useState<number | null>(draft.linkedChapterId ?? null);
  const [wordCount, setWordCount] = useState(draft.wordCount || 0);
  const [isDirty, setIsDirty] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moveMode, setMoveMode] = useState<"append" | "new">("new");
  const [moveTargetChapterId, setMoveTargetChapterId] = useState<number | null>(null);
  const [moving, setMoving] = useState(false);
  const [aiTip, setAiTip] = useState("");
  const [tipLoading, setTipLoading] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const editorAreaRef = useRef<HTMLDivElement>(null);
  const blockEditorApiRef = useRef<BlockEditorAPI | null>(null);
  const [improvementModal, setImprovementModal] = useState<{ original: string; improved: string; mode: string } | null>(null);
  const [isTypewriterMode, setIsTypewriterMode] = useState(false);
  const [sprintExpanded, setSprintExpanded] = useState(false);
  const [sprintGoal, setSprintGoal] = useState("500");
  const [sprintMin, setSprintMin] = useState("25");
  const [sprintActive, setSprintActive] = useState(false);
  const [sprintSecondsLeft, setSprintSecondsLeft] = useState(0);
  const sprintTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [fontScale, setFontScaleRaw] = useState<number>(() => {
    try { const v = Number(localStorage.getItem("moodra_editorFontScale")); return v >= 70 && v <= 160 ? v : 100; } catch { return 100; }
  });
  const [maxWidth, setMaxWidthRaw] = useState<number>(() => {
    try { const v = Number(localStorage.getItem("moodra_editorMaxWidth")); return v >= 480 && v <= 1010 ? v : 1010; } catch { return 1010; }
  });
  const setFontScale = (u: number | ((v: number) => number)) => setFontScaleRaw(prev => { const n = typeof u === "function" ? u(prev) : u; try { localStorage.setItem("moodra_editorFontScale", String(n)); } catch {} return n; });
  const setMaxWidth = (u: number | ((v: number) => number)) => setMaxWidthRaw(prev => { const n = typeof u === "function" ? u(prev) : u; try { localStorage.setItem("moodra_editorMaxWidth", String(n)); } catch {} return n; });

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", `/api/drafts/${draft.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "drafts"] });
      setIsDirty(false);
    },
  });

  const save = useCallback(() => {
    const plainText = blocksToPlainText(blocks);
    const wc = plainText.trim().split(/\s+/).filter(Boolean).length;
    setWordCount(wc);
    updateMutation.mutate({
      title,
      content: JSON.stringify(blocks),
      wordCount: wc,
      linkedChapterId: linkedChapterId ?? null,
    });
  }, [blocks, title, linkedChapterId]);

  useEffect(() => {
    if (isDirty) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(save, 2000);
    }
    return () => clearTimeout(saveTimerRef.current);
  }, [isDirty, save]);

  const startSprint = () => {
    const mins = parseInt(sprintMin) || 25;
    setSprintSecondsLeft(mins * 60);
    setSprintActive(true);
    setSprintExpanded(false);
    sprintTimerRef.current = setInterval(() => {
      setSprintSecondsLeft(v => {
        if (v <= 1) { clearInterval(sprintTimerRef.current!); sprintTimerRef.current = null; setSprintActive(false); return 0; }
        return v - 1;
      });
    }, 1000);
  };

  const stopSprint = () => {
    if (sprintTimerRef.current) { clearInterval(sprintTimerRef.current); sprintTimerRef.current = null; }
    setSprintActive(false);
    setSprintSecondsLeft(0);
  };

  useEffect(() => { return () => { if (sprintTimerRef.current) clearInterval(sprintTimerRef.current); }; }, []);

  useEffect(() => {
    if (!isTypewriterMode) return;
    const handleKey = () => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (!rect || rect.top === 0) return;
      const container = scrollContainerRef.current;
      if (!container) return;
      const containerRect = container.getBoundingClientRect();
      const delta = rect.top - (containerRect.top + containerRect.height / 2);
      container.scrollBy({ top: delta, behavior: "smooth" });
    };
    document.addEventListener("keyup", handleKey);
    return () => document.removeEventListener("keyup", handleKey);
  }, [isTypewriterMode]);

  const getReadingTime = () => {
    const mins = Math.ceil(wordCount / 200);
    return mins < 1 ? t.lessThanMin : `${mins} ${t.minLabel}`;
  };

  const handleGetAiTip = async () => {
    const text = blocksToPlainText(blocks);
    if (!text.trim()) return;
    setTipLoading(true);
    try {
      const data = await apiRequest("POST", "/api/ai/improve", {
        text: text.slice(0, 1000),
        mode: "advice",
        bookTitle: book.title,
        bookMode: book.mode,
        lang,
        customInstruction: "Give one short, concrete writing tip for this draft. Max 2 sentences.",
      });
      setAiTip(data.improved || data.text || "");
    } catch (e: any) {
      if (!handleAiError(e)) toast({ title: t.aiError, variant: "destructive" });
    } finally {
      setTipLoading(false);
    }
  };

  const handleMoveToChapter = async () => {
    if (!moveMode) return;
    setMoving(true);
    try {
      const draftContent = JSON.stringify(blocks);
      if (moveMode === "new") {
        await apiRequest("POST", `/api/books/${bookId}/chapters`, {
          title,
          content: draftContent,
          bookId,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "chapters"] });
        toast({ title: t.moveSuccessNew });
      } else if (moveMode === "append" && moveTargetChapterId) {
        const ch = chapters.find(c => c.id === moveTargetChapterId);
        if (ch) {
          let existingBlocks: Block[] = [];
          try {
            const parsed = JSON.parse(ch.content || "[]");
            if (Array.isArray(parsed)) existingBlocks = parsed;
          } catch {}
          const merged = [...existingBlocks, ...blocks];
          await apiRequest("PATCH", `/api/chapters/${moveTargetChapterId}`, {
            content: JSON.stringify(merged),
          });
          queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "chapters"] });
          toast({ title: t.moveSuccessAppend });
        }
      }
      setShowMoveModal(false);
    } catch (e: any) {
      toast({ title: t.moveError, variant: "destructive" });
    } finally {
      setMoving(false);
    }
  };

  const readingTime = getReadingTime();

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Draft editor header */}
      <div className="flex-shrink-0 border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => { if (isDirty) save(); onBack(); }}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            {t.draftsBack}
          </button>
          <span className="text-muted-foreground/30">·</span>

          {/* Title inline edit */}
          <input
            value={title}
            onChange={e => { setTitle(e.target.value); setIsDirty(true); }}
            className="flex-1 text-sm font-semibold bg-transparent outline-none focus:ring-0 border-0 placeholder:text-muted-foreground/40 min-w-0"
            placeholder={t.titlePlaceholder}
          />

          {/* Stats */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground/60 flex-shrink-0">
            <span>{t.words(wordCount)}</span>
            {isDirty && <span className="text-amber-500">●</span>}
            {updateMutation.isPending && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
          </div>

          <div className="w-px h-4 bg-border/60" />

          {/* Font scale */}
          <div className="flex items-center gap-0.5">
            <button onClick={() => setFontScale(v => Math.max(70, v - 5))} className="h-6 w-6 flex items-center justify-center rounded hover:bg-accent/60 text-muted-foreground hover:text-foreground transition-colors text-xs font-bold">A<sup className="text-[7px]">–</sup></button>
            <button onClick={() => setFontScale(100)} className="text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors w-7 text-center tabular-nums">{fontScale}%</button>
            <button onClick={() => setFontScale(v => Math.min(160, v + 5))} className="h-6 w-6 flex items-center justify-center rounded hover:bg-accent/60 text-muted-foreground hover:text-foreground transition-colors text-xs font-bold">A<sup className="text-[7px]">+</sup></button>
          </div>

          {/* Max width */}
          <div className="flex items-center gap-0.5">
            <button onClick={() => setMaxWidth(v => Math.max(480, v - 60))} className="h-6 w-6 flex items-center justify-center rounded hover:bg-accent/60 text-muted-foreground hover:text-foreground transition-colors"><Minus className="h-3 w-3" /></button>
            <button onClick={() => setMaxWidth(1010)} className="flex items-center gap-0.5 text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"><ChevronsLeftRight className="h-3 w-3" /><span className="tabular-nums w-7 text-center">{maxWidth}</span></button>
            <button onClick={() => setMaxWidth(v => Math.min(1010, v + 60))} className="h-6 w-6 flex items-center justify-center rounded hover:bg-accent/60 text-muted-foreground hover:text-foreground transition-colors"><Plus className="h-3 w-3" /></button>
          </div>

          {/* Typewriter */}
          <button onClick={() => setIsTypewriterMode(v => !v)} className={`h-6 w-6 flex items-center justify-center rounded transition-colors ${isTypewriterMode ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent/60"}`} title={t.typewriterMode ?? "Typewriter"}>
            <Keyboard className="h-3 w-3" />
          </button>

          {/* Sprint */}
          <div className="relative">
            <button onClick={() => { if (sprintActive) return; setSprintExpanded(v => !v); }} className={`h-6 flex items-center gap-1 px-1.5 rounded transition-colors text-xs ${sprintActive ? "text-orange-500 bg-orange-50 dark:bg-orange-950/30" : "text-muted-foreground hover:text-foreground hover:bg-accent/60"}`} title={t.sprintLabel ?? "Sprint"}>
              {sprintActive ? (<><Clock className="h-3 w-3 animate-pulse" /><span className="font-mono text-[10px]">{String(Math.floor(sprintSecondsLeft / 60)).padStart(2,"0")}:{String(sprintSecondsLeft % 60).padStart(2,"0")}</span></>) : (<Timer className="h-3 w-3" />)}
            </button>
            {sprintActive && (<button onClick={stopSprint} className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-destructive/80 flex items-center justify-center text-white hover:bg-destructive transition-colors"><X className="h-2 w-2" /></button>)}
            {sprintExpanded && !sprintActive && (
              <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-xl border border-border bg-background shadow-xl p-3 space-y-2">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{t.sprintLabel ?? "Sprint"}</p>
                <div className="flex gap-2">
                  <div className="flex-1"><p className="text-[10px] text-muted-foreground mb-1">{t.sprintGoalPlaceholder ?? "Words"}</p><input type="number" min={50} max={10000} step={50} value={sprintGoal} onChange={e => setSprintGoal(e.target.value)} className="w-full rounded-lg border border-border bg-secondary/50 px-2 py-1 text-xs outline-none" /></div>
                  <div className="flex-1"><p className="text-[10px] text-muted-foreground mb-1">Min</p><select value={sprintMin} onChange={e => setSprintMin(e.target.value)} className="w-full rounded-lg border border-border bg-secondary/50 px-2 py-1 text-xs outline-none">{[5,10,15,20,25,30,45,60].map(m => <option key={m} value={m}>{m}</option>)}</select></div>
                </div>
                <button onClick={startSprint} className="w-full py-1.5 rounded-lg text-xs font-semibold text-white flex items-center justify-center gap-1.5" style={{ background: "#F96D1C" }}><Zap className="h-3 w-3" /> {t.sprintStart ?? "Start"}</button>
              </div>
            )}
          </div>

          <div className="w-px h-4 bg-border/60" />

          {/* Chapter link */}
          <Select
            value={linkedChapterId ? String(linkedChapterId) : "none"}
            onValueChange={v => { setLinkedChapterId(v === "none" ? null : Number(v)); setIsDirty(true); }}
          >
            <SelectTrigger className="w-36 h-7 text-xs rounded-lg border-border/50 bg-secondary/50 [&>span]:truncate">
              <Link2 className="h-3 w-3 mr-1 flex-shrink-0 text-muted-foreground/60" />
              <SelectValue placeholder={t.linkChapter} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t.noChapter}</SelectItem>
              {chapters.map(c => (
                <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowMoveModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #F96D1C, #FB923C)" }}>
              <SendToBack className="h-3.5 w-3.5" />
              {t.toBookBtn}
            </button>
            <button
              onClick={save}
              disabled={!isDirty || updateMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border border-border/50 hover:bg-secondary disabled:opacity-40">
              <Save className="h-3.5 w-3.5" />
              {t.saveBtn}
            </button>
          </div>
        </div>
      </div>

      {/* AI tip bar */}
      {aiTip && (
        <div className="flex-shrink-0 flex items-start gap-2.5 px-5 py-2.5 bg-amber-50/60 dark:bg-amber-950/20 border-b border-amber-200/30">
          <Lightbulb className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700/80 dark:text-amber-300/70 leading-relaxed flex-1">{aiTip}</p>
          <button onClick={() => setAiTip("")} className="text-muted-foreground/40 hover:text-muted-foreground"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}

      {/* Selection Toolbar */}
      <SelectionToolbar
        containerRef={editorAreaRef as React.RefObject<HTMLElement>}
        bookTitle={book.title}
        onResult={(original, improved, mode) => setImprovementModal({ original, improved, mode })}
      />

      {/* Block editor + optional AI panel */}
      <div className="flex-1 flex overflow-hidden">
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto" style={{ zoom: fontScale / 100 }}>
          <div ref={editorAreaRef} style={{ maxWidth, margin: "0 auto" }}>
            <BlockEditor
              key={draft.id}
              initialContent={draft.content || ""}
              onChange={newBlocks => { setBlocks(newBlocks); setIsDirty(true); }}
              onMounted={api => { blockEditorApiRef.current = api; }}
            />
          </div>
        </div>
        {showAiPanel && (
          <AiPanel
            book={book}
            chapter={null}
            context={blocksToPlainText(blocks)}
            chapters={chapters}
            onInsert={null}
          />
        )}
      </div>

      {/* Bottom bar */}
      <div className="flex-shrink-0 border-t border-border/30 px-5 py-2 flex items-center gap-4 bg-background/50">
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground/50">
          <span>{t.wordsTotal(wordCount)}</span>
          <span>·</span>
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{readingTime} {t.reading}</span>
        </div>
        <button
          onClick={handleGetAiTip}
          disabled={tipLoading || wordCount === 0}
          className="ml-auto flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground/60 hover:text-amber-500 transition-colors disabled:opacity-40">
          {tipLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
          {t.aiTipBtn}
        </button>
      </div>

      {/* Move to chapter modal */}
      {showMoveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowMoveModal(false)}>
          <div className="bg-background rounded-2xl border border-border shadow-2xl w-full max-w-md p-6 mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(249,109,28,0.1)" }}>
                <SendToBack className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-base">{t.moveToBook}</h3>
                <p className="text-xs text-muted-foreground">{t.moveDesc}</p>
              </div>
              <button onClick={() => setShowMoveModal(false)} className="ml-auto text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>

            <div className="space-y-3 mb-5">
              {/* New chapter option */}
              <button
                className={cn("w-full p-4 rounded-xl border-2 text-left transition-all", moveMode === "new" ? "border-primary bg-primary/5" : "border-border/50 hover:border-border")}
                onClick={() => setMoveMode("new")}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10">
                    <Plus className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.newChapterOpt}</p>
                    <p className="text-xs text-muted-foreground">{t.newChapterDesc}</p>
                  </div>
                  {moveMode === "new" && <CheckCircle2 className="h-4 w-4 text-primary ml-auto flex-shrink-0" />}
                </div>
              </button>

              {/* Append to chapter option */}
              <button
                className={cn("w-full p-4 rounded-xl border-2 text-left transition-all", moveMode === "append" ? "border-primary bg-primary/5" : "border-border/50 hover:border-border")}
                onClick={() => setMoveMode("append")}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10">
                    <GitBranch className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{t.appendOpt}</p>
                    <p className="text-xs text-muted-foreground">{t.appendDesc}</p>
                  </div>
                  {moveMode === "append" && <CheckCircle2 className="h-4 w-4 text-primary ml-auto flex-shrink-0" />}
                </div>
              </button>

              {moveMode === "append" && (
                <Select value={moveTargetChapterId ? String(moveTargetChapterId) : ""} onValueChange={v => setMoveTargetChapterId(Number(v))}>
                  <SelectTrigger className="w-full rounded-xl h-10 text-sm">
                    <SelectValue placeholder={t.selectChapter} />
                  </SelectTrigger>
                  <SelectContent>
                    {chapters.map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="flex gap-2">
              <button onClick={() => setShowMoveModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-colors">
                {t.cancelBtn}
              </button>
              <button
                onClick={handleMoveToChapter}
                disabled={moving || (moveMode === "append" && !moveTargetChapterId)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #F96D1C, #FB923C)" }}>
                {moving ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendToBack className="h-4 w-4" />}
                {moving ? t.movingBtn : t.moveBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Improvement Modal */}
      {improvementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setImprovementModal(null)}>
          <div className="bg-background rounded-2xl border border-border shadow-2xl w-full max-w-lg mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(99,102,241,0.1)" }}>
                  <Sparkles className="w-3.5 h-3.5" style={{ color: "#6366f1" }} />
                </div>
                <span className="text-sm font-semibold">{improvementModal.mode}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(99,102,241,0.08)", color: "#6366f1" }}>AI</span>
              </div>
              <button onClick={() => setImprovementModal(null)} className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-secondary transition-colors">
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
            <div className="flex flex-col max-h-[60vh] overflow-y-auto p-4 gap-3">
              <div>
                <div className="text-[9px] font-bold uppercase tracking-widest mb-1.5 text-muted-foreground/50">Оригинал</div>
                <div className="text-[13px] leading-relaxed px-3 py-2.5 rounded-xl line-through text-muted-foreground/60" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)" }}>
                  {improvementModal.original}
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: "rgba(99,102,241,0.08)", color: "#6366f1" }}>
                  <ArrowDown className="w-3 h-3" />
                  <span>{improvementModal.mode}</span>
                </div>
              </div>
              <div>
                <div className="text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "#22c55e" }}>Улучшено</div>
                <div className="rounded-xl px-3 py-3 text-[13px] leading-relaxed" style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0", color: "#15803d" }}>
                  {improvementModal.improved}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-t border-border/50">
              <button onClick={() => setImprovementModal(null)} className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors">
                <X className="w-3.5 h-3.5" />
                Отмена
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (blockEditorApiRef.current) blockEditorApiRef.current.appendBlock(improvementModal.improved, "paragraph");
                    setImprovementModal(null);
                  }}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-sm font-medium transition-colors"
                  style={{ background: "#f5f0eb", color: "#6b5a50", border: "1px solid #e8e0d8" }}>
                  <Plus className="w-3.5 h-3.5" />
                  Добавить абзац
                </button>
                <button
                  onClick={() => {
                    if (blockEditorApiRef.current) blockEditorApiRef.current.replaceTextInBlocks(improvementModal.original, improvementModal.improved);
                    setImprovementModal(null);
                  }}
                  className="flex items-center gap-1.5 h-8 px-4 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #6366f1, #818cf8)" }}>
                  <Check className="w-3.5 h-3.5" />
                  Применить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Workspace ───────────────────────────────────────────────────────────

export function ResearchWorkspace({ bookId, book }: { bookId: number; book: Book }) {
  const [view, setView] = useState<"workspace" | "draft-editor">("workspace");
  const [activeDraft, setActiveDraft] = useState<Draft | null>(null);

  const { data: chapters = [] } = useQuery<Chapter[]>({
    queryKey: ["/api/books", bookId, "chapters"],
    queryFn: () => apiRequest("GET", `/api/books/${bookId}/chapters`),
  });

  const { data: drafts = [] } = useQuery<Draft[]>({
    queryKey: ["/api/books", bookId, "drafts"],
    queryFn: () => apiRequest("GET", `/api/books/${bookId}/drafts`),
  });

  const handleOpenDraft = (draft: Draft | null) => {
    setActiveDraft(draft);
    setView("draft-editor");
  };

  if (view === "draft-editor" && activeDraft) {
    return (
      <DraftEditor
        key={activeDraft.id}
        draft={activeDraft}
        bookId={bookId}
        book={book}
        chapters={chapters}
        onBack={() => { setActiveDraft(null); setView("workspace"); }}
      />
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* 50 / 50 split — each panel independently scrollable */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Stage tracker + AI assistant */}
        <div className="flex-1 overflow-y-auto border-r border-border/30 p-4 space-y-4">
          <DraftStagesSection bookId={bookId} book={book} drafts={drafts} />
          <DraftAiAssistant book={book} />
        </div>

        {/* Right: Drafts list */}
        <div className="flex-1 overflow-hidden flex flex-col p-4">
          <DraftsSection bookId={bookId} book={book} onOpenDraft={handleOpenDraft} />
        </div>
      </div>
    </div>
  );
}

// Keep old ResearchDashboard name for backward compat during transition
export { ResearchWorkspace as ResearchDashboard };
