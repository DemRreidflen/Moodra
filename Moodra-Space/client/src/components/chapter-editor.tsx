import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Chapter, Book } from "@shared/schema";
import { useLang } from "@/contexts/language-context";
import { useFreeMode } from "@/hooks/use-free-mode";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAiError } from "@/contexts/ai-error-context";
import { 
  Save, 
  BookOpen, 
  Type, 
  AlignLeft, 
  Maximize2, 
  Minimize2, 
  X,
  Globe,
  Loader2,
  RefreshCw,
  PlusSquare,
  ChevronDown,
  Check,
  DollarSign,
  Wand2,
  ArrowDownIcon,
  Plus,
  Minus,
  Sparkles,
  RotateCcw,
  Timer,
  Keyboard,
  Clock,
  Zap,
  ChevronUp,
  ChevronsLeftRight,
} from "lucide-react";
import { BlockEditor, Block, blocksToPlainText, BlockEditorAPI } from "./block-editor";
import { cn } from "@/lib/utils";
import { useBookSettings } from "@/hooks/use-book-settings";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SelectionToolbar } from "./selection-toolbar";

interface Props {
  chapter: Chapter | null;
  bookTitle: string;
  bookMode: string;
  bookId?: number;
  onContextChange: (context: string) => void;
  onInsertReady: (cb: (text: string) => void) => void;
  isDeepWritingMode?: boolean;
  onToggleDeepWritingMode?: () => void;
  onWrite?: () => void;
}

const ACTION_BUTTONS_I18N = {
  en: [
    { mode: "improve",   label: "Improve",   emoji: "✦" },
    { mode: "expand",    label: "Expand",    emoji: "↗" },
    { mode: "shorten",   label: "Shorten",   emoji: "↙" },
    { mode: "rephrase",  label: "Rephrase",  emoji: "↺" },
    { mode: "example",   label: "+ Example", emoji: "◎" },
    { mode: "strengthen",label: "Strengthen",emoji: "⚡" },
  ],
  ru: [
    { mode: "improve",   label: "Улучшить",  emoji: "✦" },
    { mode: "expand",    label: "Расширить", emoji: "↗" },
    { mode: "shorten",   label: "Сократить", emoji: "↙" },
    { mode: "rephrase",  label: "Перефразировать", emoji: "↺" },
    { mode: "example",   label: "+ Пример",  emoji: "◎" },
    { mode: "strengthen",label: "Усилить",   emoji: "⚡" },
  ],
  ua: [
    { mode: "improve",   label: "Покращити", emoji: "✦" },
    { mode: "expand",    label: "Розширити", emoji: "↗" },
    { mode: "shorten",   label: "Скоротити", emoji: "↙" },
    { mode: "rephrase",  label: "Перефразувати", emoji: "↺" },
    { mode: "example",   label: "+ Приклад", emoji: "◎" },
    { mode: "strengthen",label: "Підсилити", emoji: "⚡" },
  ],
  de: [
    { mode: "improve",   label: "Verbessern",    emoji: "✦" },
    { mode: "expand",    label: "Erweitern",     emoji: "↗" },
    { mode: "shorten",   label: "Kürzen",        emoji: "↙" },
    { mode: "rephrase",  label: "Umformulieren", emoji: "↺" },
    { mode: "example",   label: "+ Beispiel",    emoji: "◎" },
    { mode: "strengthen",label: "Verstärken",    emoji: "⚡" },
  ],
};

const ADAPT_LANGUAGES = [
  { code: "English",     label: "English" },
  { code: "Spanish",    label: "Español" },
  { code: "German",     label: "Deutsch" },
  { code: "French",     label: "Français" },
  { code: "Italian",    label: "Italiano" },
  { code: "Portuguese", label: "Português" },
  { code: "Chinese",    label: "中文" },
  { code: "Japanese",   label: "日本語" },
  { code: "Korean",     label: "한국어" },
  { code: "Ukrainian",  label: "Українська" },
  { code: "Russian",    label: "Русский" },
];

const ADAPT_MODEL_PRICES: Record<string, { input: number; output: number; name: string }> = {
  "gpt-4o-mini":  { input: 0.150,  output: 0.600,  name: "GPT-4o mini" },
  "gpt-4.1-mini": { input: 0.40,   output: 1.60,   name: "GPT-4.1 mini" },
  "gpt-3.5-turbo":{ input: 0.50,   output: 1.50,   name: "GPT-3.5 Turbo" },
  "gpt-4o":       { input: 2.50,   output: 10.00,  name: "GPT-4o" },
  "gpt-4.1":      { input: 2.00,   output: 8.00,   name: "GPT-4.1" },
  "gpt-4-turbo":  { input: 10.00,  output: 30.00,  name: "GPT-4 Turbo" },
  "o4-mini":      { input: 1.10,   output: 4.40,   name: "o4-mini" },
};

const ADAPT_MODEL_ID = "o4-mini";

function estimateAdaptCost(text: string, _modelId?: string) {
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const estInputTokens = Math.ceil(wordCount * 1.3);
  const estOutputTokens = estInputTokens;
  const prices = ADAPT_MODEL_PRICES[ADAPT_MODEL_ID];
  const costInput = (estInputTokens / 1_000_000) * prices.input;
  const costOutput = (estOutputTokens / 1_000_000) * prices.output;
  const totalCost = costInput + costOutput;
  return { wordCount, estInputTokens, estOutputTokens, modelName: prices.name, totalCost, priceInput: prices.input, priceOutput: prices.output };
}

const EDITOR_I18N = {
  en: {
    selectChapter: "Select a chapter to edit",
    selectChapterHint: "or create a new chapter",
    selectChapterHint2: "in the sidebar",
    improveChapter: "Improve chapter",
    customStyle: "Custom style…",
    applying: "Applying…",
    apply: "Apply",
    beforeAfter: "Before & After",
    original: "Original",
    improved: "Improved",
    reject: "Discard",
    accept: "Replace selection",
    insertParagraph: "Insert below",
    regenerate: "Retry",
    customInstruction: "Additional instruction (optional)…",
    words: "words",
    modified: "Modified",
    saving: "Saving…",
    save: "Save",
    chapterPlaceholder: "Chapter title…",
    customStylePlaceholder: "Your style…",
    thinkingFree: "Model is thinking…",
    adaptLang: "Adapt to language",
    adaptModalTitle: "Language Adaptation",
    adaptDesc: "The AI will adapt this chapter into the selected language, preserving meaning and narrative style. A new book version will be created.",
    adaptSelectLang: "Select language",
    adaptRun: "Start adaptation",
    adaptRunning: "Adapting…",
    adaptNewBook: "Create new book in this language",
    adaptSuccess: "Chapter adapted and saved to new book!",
    adaptNote: "A new book \"{{title}}\" has been created with the adapted chapter.",
    adaptOrExisting: "Or add to existing book",
    adaptChooseBook: "Choose book",
    adaptExistingTitle: "Add to existing book",
    adaptExistingDesc: "Select a book to insert the adapted chapter into.",
    adaptWorkflowNew: "Create new book",
    adaptWorkflowExisting: "Add to existing book",
    adaptBackToLang: "← Change language",
    adaptNoBooks: "No other books found.",
    adaptIndicatorTitle: "Language adaptations available",
    adaptGoTo: "Open",
    readingMode: "Reading mode",
    costPreviewTitle: "Cost Estimate",
    costWords: "Words in chapter",
    costInputTokens: "Est. input tokens",
    costOutputTokens: "Est. output tokens",
    costModel: "Adaptation model",
    costModelNote: "Optimized for translation (200K context, 100K output)",
    costInputRate: "Input rate",
    costOutputRate: "Output rate",
    costTotal: "Estimated cost",
    costNote: "Actual cost may vary slightly depending on text complexity.",
    costConfirm: "Confirm & Adapt",
    costBack: "← Back",
    minRead: "min read",
    chars: "chars",
    sprintLabel: "Sprint",
    sprintGoalPlaceholder: "Word goal…",
    sprintStart: "Start",
    sprintStop: "Stop",
    sprintDone: "Sprint done!",
    sprintWordsWritten: "words written",
    typewriterMode: "Typewriter mode: current line stays centered on screen",
    editorFontSmaller: "Decrease editor font size",
    editorFontLarger: "Increase editor font size",
    editorNarrow: "Narrow editor",
    editorWider: "Widen editor",
    fontSizeLabel: "Font",
    widthLabel: "Width",
  },
  ru: {
    selectChapter: "Выберите главу для редактирования",
    selectChapterHint: "или создайте новую главу",
    selectChapterHint2: "в боковой панели",
    improveChapter: "Улучшить главу",
    customStyle: "Свой стиль…",
    applying: "Улучшаю…",
    apply: "Применить",
    beforeAfter: "До и После",
    original: "Оригинал",
    improved: "Улучшенный",
    reject: "Отклонить",
    accept: "Заменить фрагмент",
    insertParagraph: "Вставить ниже",
    regenerate: "Повторить",
    customInstruction: "Дополнительная инструкция (необязательно)…",
    words: "слов",
    modified: "Изменён",
    saving: "Сохраняю…",
    save: "Сохранить",
    chapterPlaceholder: "Название главы…",
    customStylePlaceholder: "Свой стиль…",
    thinkingFree: "Модель думает…",
    adaptLang: "Адаптировать на язык",
    adaptModalTitle: "Языковая адаптация",
    adaptDesc: "ИИ адаптирует эту главу на выбранный язык, сохраняя смысл и нарративный стиль. Будет создана новая версия книги.",
    adaptSelectLang: "Выберите язык",
    adaptRun: "Начать адаптацию",
    adaptRunning: "Адаптирую…",
    adaptNewBook: "Создать новую книгу на этом языке",
    adaptSuccess: "Глава адаптирована и сохранена в новой книге!",
    adaptNote: "Создана новая книга «{{title}}» с адаптированной главой.",
    adaptOrExisting: "Или добавить в существующую книгу",
    adaptChooseBook: "Выбрать книгу",
    adaptExistingTitle: "Добавить в существующую книгу",
    adaptExistingDesc: "Выберите книгу для вставки адаптированной главы.",
    adaptWorkflowNew: "Создать новую книгу",
    adaptWorkflowExisting: "Добавить в существующую книгу",
    adaptBackToLang: "← Изменить язык",
    adaptNoBooks: "Другие книги не найдены.",
    adaptIndicatorTitle: "Доступные языковые адаптации",
    adaptGoTo: "Открыть",
    readingMode: "Режим чтения",
    costPreviewTitle: "Оценка стоимости",
    costWords: "Слов в главе",
    costInputTokens: "≈ входных токенов",
    costOutputTokens: "≈ выходных токенов",
    costModel: "Модель адаптации",
    costModelNote: "Оптимизирована для перевода (200K контекст, 100K выход)",
    costInputRate: "Ставка (вход)",
    costOutputRate: "Ставка (выход)",
    costTotal: "Ориентировочная стоимость",
    costNote: "Реальная стоимость может незначительно отличаться в зависимости от сложности текста.",
    costConfirm: "Подтвердить и адаптировать",
    costBack: "← Назад",
    minRead: "мин. чтения",
    chars: "симв.",
    sprintLabel: "Спринт",
    sprintGoalPlaceholder: "Цель (слов)…",
    sprintStart: "Старт",
    sprintStop: "Стоп",
    sprintDone: "Спринт завершён!",
    sprintWordsWritten: "слов написано",
    typewriterMode: "Режим пишущей машинки: текущая строка всегда по центру экрана",
    editorFontSmaller: "Уменьшить шрифт редактора",
    editorFontLarger: "Увеличить шрифт редактора",
    editorNarrow: "Уже",
    editorWider: "Шире",
    fontSizeLabel: "Шрифт",
    widthLabel: "Ширина",
  },
  ua: {
    selectChapter: "Оберіть розділ для редагування",
    selectChapterHint: "або створіть новий розділ",
    selectChapterHint2: "у бічній панелі",
    improveChapter: "Покращити розділ",
    customStyle: "Власний стиль…",
    applying: "Покращую…",
    apply: "Застосувати",
    beforeAfter: "До і Після",
    original: "Оригінал",
    improved: "Покращений",
    reject: "Відхилити",
    accept: "Замінити фрагмент",
    insertParagraph: "Вставити нижче",
    regenerate: "Повторити",
    customInstruction: "Додаткова інструкція (необов'язково)…",
    words: "слів",
    modified: "Змінено",
    saving: "Зберігаю…",
    save: "Зберегти",
    chapterPlaceholder: "Назва розділу…",
    customStylePlaceholder: "Власний стиль…",
    thinkingFree: "Модель думає…",
    adaptLang: "Адаптувати на мову",
    adaptModalTitle: "Мовна адаптація",
    adaptDesc: "ІІ адаптує цей розділ на обрану мову, зберігаючи сенс і наративний стиль. Буде створена нова версія книги.",
    adaptSelectLang: "Оберіть мову",
    adaptRun: "Почати адаптацію",
    adaptRunning: "Адаптую…",
    adaptNewBook: "Створити нову книгу цією мовою",
    adaptSuccess: "Розділ адаптовано і збережено в нову книгу!",
    adaptNote: "Створено нову книгу «{{title}}» з адаптованим розділом.",
    adaptOrExisting: "Або додати до існуючої книги",
    adaptChooseBook: "Обрати книгу",
    adaptExistingTitle: "Додати до існуючої книги",
    adaptExistingDesc: "Оберіть книгу для вставки адаптованого розділу.",
    adaptWorkflowNew: "Створити нову книгу",
    adaptWorkflowExisting: "Додати до існуючої книги",
    adaptBackToLang: "← Змінити мову",
    adaptNoBooks: "Інші книги не знайдено.",
    adaptIndicatorTitle: "Доступні мовні адаптації",
    adaptGoTo: "Відкрити",
    readingMode: "Режим читання",
    costPreviewTitle: "Оцінка вартості",
    costWords: "Слів у розділі",
    costInputTokens: "≈ вхідних токенів",
    costOutputTokens: "≈ вихідних токенів",
    costModel: "Модель адаптації",
    costModelNote: "Оптимізована для перекладу (200K контекст, 100K вихід)",
    costInputRate: "Тариф (вхід)",
    costOutputRate: "Тариф (вихід)",
    costTotal: "Орієнтовна вартість",
    costNote: "Фактична вартість може незначно відрізнятися залежно від складності тексту.",
    costConfirm: "Підтвердити й адаптувати",
    costBack: "← Назад",
    minRead: "хв. читання",
    chars: "симв.",
    sprintLabel: "Спринт",
    sprintGoalPlaceholder: "Ціль (слів)…",
    sprintStart: "Старт",
    sprintStop: "Стоп",
    sprintDone: "Спринт завершено!",
    sprintWordsWritten: "слів написано",
    typewriterMode: "Режим машинки: поточний рядок завжди по центру екрана",
    editorFontSmaller: "Зменшити шрифт редактора",
    editorFontLarger: "Збільшити шрифт редактора",
    editorNarrow: "Вужче",
    editorWider: "Ширше",
    fontSizeLabel: "Шрифт",
    widthLabel: "Ширина",
  },
  de: {
    selectChapter: "Wähle ein Kapitel zur Bearbeitung",
    selectChapterHint: "oder erstelle ein neues Kapitel",
    selectChapterHint2: "in der Seitenleiste",
    improveChapter: "Kapitel verbessern",
    customStyle: "Eigener Stil…",
    applying: "Verbessere…",
    apply: "Anwenden",
    beforeAfter: "Vorher & Nachher",
    original: "Original",
    improved: "Verbessert",
    reject: "Ablehnen",
    accept: "Auswahl ersetzen",
    insertParagraph: "Darunter einfügen",
    regenerate: "Wiederholen",
    customInstruction: "Zusätzliche Anweisung (optional)…",
    words: "Wörter",
    modified: "Geändert",
    saving: "Speichere…",
    save: "Speichern",
    chapterPlaceholder: "Kapiteltitel…",
    customStylePlaceholder: "Eigener Stil…",
    thinkingFree: "Modell denkt nach…",
    adaptLang: "In Sprache adaptieren",
    adaptModalTitle: "Sprachadaption",
    adaptDesc: "Die KI adaptiert dieses Kapitel in die gewählte Sprache und bewahrt Bedeutung und Erzählstil. Eine neue Buchversion wird erstellt.",
    adaptSelectLang: "Sprache wählen",
    adaptRun: "Adaption starten",
    adaptRunning: "Adaptiere…",
    adaptNewBook: "Neues Buch in dieser Sprache erstellen",
    adaptSuccess: "Kapitel adaptiert und im neuen Buch gespeichert!",
    adaptNote: "Ein neues Buch «{{title}}» mit dem adaptierten Kapitel wurde erstellt.",
    adaptOrExisting: "Oder zu vorhandenem Buch hinzufügen",
    adaptChooseBook: "Buch auswählen",
    adaptExistingTitle: "Zu vorhandenem Buch hinzufügen",
    adaptExistingDesc: "Wähle ein Buch, in das das adaptierte Kapitel eingefügt werden soll.",
    adaptWorkflowNew: "Neues Buch erstellen",
    adaptWorkflowExisting: "Zu vorhandenem Buch hinzufügen",
    adaptBackToLang: "← Sprache ändern",
    adaptNoBooks: "Keine anderen Bücher gefunden.",
    adaptIndicatorTitle: "Verfügbare Sprachadaptionen",
    adaptGoTo: "Öffnen",
    readingMode: "Lesemodus",
    costPreviewTitle: "Kostenschätzung",
    costWords: "Wörter im Kapitel",
    costInputTokens: "≈ Eingabe-Tokens",
    costOutputTokens: "≈ Ausgabe-Tokens",
    costModel: "Adaptionsmodell",
    costModelNote: "Optimiert für Übersetzung (200K Kontext, 100K Ausgabe)",
    costInputRate: "Tarif (Eingabe)",
    costOutputRate: "Tarif (Ausgabe)",
    costTotal: "Geschätzte Kosten",
    costNote: "Die tatsächlichen Kosten können je nach Textkomplexität leicht abweichen.",
    costConfirm: "Bestätigen & Adaptieren",
    costBack: "← Zurück",
    minRead: "Min. Lesezeit",
    chars: "Zeichen",
    sprintLabel: "Sprint",
    sprintGoalPlaceholder: "Wortziel…",
    sprintStart: "Start",
    sprintStop: "Stop",
    sprintDone: "Sprint fertig!",
    sprintWordsWritten: "Wörter geschrieben",
    typewriterMode: "Schreibmaschineneffekt: aktuelle Zeile bleibt zentriert",
    editorFontSmaller: "Schriftgröße verringern",
    editorFontLarger: "Schriftgröße erhöhen",
    editorNarrow: "Schmaler",
    editorWider: "Breiter",
    fontSizeLabel: "Schrift",
    widthLabel: "Breite",
  },
};

const MODE_LABELS: Record<string, Record<string, string>> = {
  en: { improve: "Improve", rewrite: "Rewrite", simplify: "Simplify", expand: "Expand", translate: "Translate", "adapt-tone": "Adapt tone", "fix-grammar": "Fix grammar" },
  ru: { improve: "Улучшить", rewrite: "Переписать", simplify: "Упростить", expand: "Расширить", translate: "Перевести", "adapt-tone": "Изменить тон", "fix-grammar": "Исправить грамматику" },
  ua: { improve: "Покращити", rewrite: "Переписати", simplify: "Спростити", expand: "Розширити", translate: "Перекласти", "adapt-tone": "Змінити тон", "fix-grammar": "Виправити граматику" },
  de: { improve: "Verbessern", rewrite: "Umschreiben", simplify: "Vereinfachen", expand: "Erweitern", translate: "Übersetzen", "adapt-tone": "Ton anpassen", "fix-grammar": "Grammatik korrigieren" },
};

const FREE_THINKING_MSGS_EDITOR: Record<string, string[]> = {
  en: ["Reading your text…", "Analysing style…", "Thinking…", "Formulating improvements…"],
  ru: ["Читает текст…", "Анализирует стиль…", "Думает…", "Формирует улучшения…"],
  ua: ["Читає текст…", "Аналізує стиль…", "Думає…", "Формує покращення…"],
  de: ["Liest den Text…", "Analysiert Stil…", "Denkt nach…", "Formuliert Verbesserungen…"],
};

const ADAPT_LOADING_MSGS: Record<string, string[]> = {
  en: ["Analyzing chapter structure…", "Adapting text to target language…", "Preserving narrative style…", "Translating paragraphs…", "Almost there…"],
  ru: ["Анализирую структуру главы…", "Адаптирую текст…", "Сохраняю нарративный стиль…", "Перевожу абзацы…", "Почти готово…"],
  ua: ["Аналізую структуру розділу…", "Адаптую текст…", "Зберігаю наративний стиль…", "Перекладаю абзаци…", "Майже готово…"],
  de: ["Kapitelstruktur wird analysiert…", "Text wird adaptiert…", "Erzählstil wird beibehalten…", "Absätze werden übersetzt…", "Fast fertig…"],
};

function estimateChunkCount(text: string): number {
  const CHUNK_WORD_LIMIT = 6000;
  const paragraphs = text.split(/\n\n+/);
  let chunks = 0;
  let currentWordCount = 0;
  for (const para of paragraphs) {
    const words = para.split(/\s+/).filter(Boolean).length;
    if (words > CHUNK_WORD_LIMIT) {
      if (currentWordCount > 0) { chunks++; currentWordCount = 0; }
      chunks += Math.ceil(words / CHUNK_WORD_LIMIT);
    } else if (currentWordCount + words > CHUNK_WORD_LIMIT && currentWordCount > 0) {
      chunks++;
      currentWordCount = words;
    } else {
      currentWordCount += words;
    }
  }
  if (currentWordCount > 0) chunks++;
  return Math.max(1, chunks);
}

export function ChapterEditor({ 
  chapter, 
  bookTitle, 
  bookMode,
  bookId,
  onContextChange, 
  onInsertReady,
  isDeepWritingMode,
  onToggleDeepWritingMode,
  onWrite,
}: Props) {
  const { toast } = useToast();
  const { handleAiError } = useAiError();
  const { lang } = useLang();
  const { isFreeMode } = useFreeMode();
  const { data: currentUser } = useQuery<any>({ queryKey: ["/api/auth/user"] });
  const currentModelId = currentUser?.openaiModel || "gpt-4o-mini";
  const { settings: bookSettings } = useBookSettings(bookId || 0);
  const s = EDITOR_I18N[lang as keyof typeof EDITOR_I18N] ?? EDITOR_I18N.en;
  const thinkingMsgs = FREE_THINKING_MSGS_EDITOR[lang as keyof typeof FREE_THINKING_MSGS_EDITOR] ?? FREE_THINKING_MSGS_EDITOR.en;

  const [title, setTitle] = useState("");
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();
  
  const [activeActionMode, setActiveActionMode] = useState<string | null>(null);
  const [improvementModal, setImprovementModal] = useState<{
    original: string;
    improved: string;
    mode?: string;
    savedRange?: Range | null;
    startBlockId?: string;
    endBlockId?: string;
  } | null>(null);
  const [lastMode, setLastMode] = useState<string>("improve");
  const [customInstruction, setCustomInstruction] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);

  const [showAdaptModal, setShowAdaptModal] = useState(false);
  const [adaptLang, setAdaptLang] = useState("");
  const [adaptLoading, setAdaptLoading] = useState(false);
  const [adaptMsgIdx, setAdaptMsgIdx] = useState(0);
  const adaptMsgRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [adaptDone, setAdaptDone] = useState<{ message: string; bookId?: number; bookTitle?: string } | null>(null);
  const [adaptShowLangPicker, setAdaptShowLangPicker] = useState(false);
  const [adaptStep, setAdaptStep] = useState<"select-lang" | "select-workflow" | "select-book" | "cost-preview">("select-lang");
  const [pendingWorkflow, setPendingWorkflow] = useState<"new" | "existing">("new");
  const [adaptWorkflow, setAdaptWorkflow] = useState<"new" | "existing">("new");
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [selectedExistingBookId, setSelectedExistingBookId] = useState<number | null>(null);
  const [adaptations, setAdaptations] = useState<Array<{ lang: string; bookId: number; bookTitle: string }>>([]);
  const [, navigate] = useLocation();

  const [isReadingMode, setIsReadingMode] = useState(false);
  const [freeThinkingIdx, setFreeThinkingIdx] = useState(0);
  const freeThinkingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inlineTitleRef = useRef<HTMLDivElement>(null);
  const editorAreaRef = useRef<HTMLDivElement>(null);
  const blockEditorApiRef = useRef<BlockEditorAPI | null>(null);

  const [charCount, setCharCount] = useState(0);
  const [showCharCount, setShowCharCount] = useState(false);
  const [isTypewriterMode, setIsTypewriterMode] = useState(false);
  const [sprintGoalInput, setSprintGoalInput] = useState("500");
  const [sprintMinInput, setSprintMinInput] = useState("25");
  const [sprintActive, setSprintActive] = useState(false);
  const [sprintSecondsLeft, setSprintSecondsLeft] = useState(0);
  const [sprintWordsAtStart, setSprintWordsAtStart] = useState(0);
  const [sprintExpanded, setSprintExpanded] = useState(false);
  const sprintTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Editor-local view controls (don't affect PDF layout) — persisted in localStorage
  const [editorFontScale, setEditorFontScaleRaw] = useState<number>(() => {
    try { const v = Number(localStorage.getItem("moodra_editorFontScale")); return v >= 70 && v <= 160 ? v : 100; } catch { return 100; }
  });
  const [editorMaxWidth, setEditorMaxWidthRaw] = useState<number>(() => {
    try { const v = Number(localStorage.getItem("moodra_editorMaxWidth")); return v >= 480 && v <= 1010 ? v : 1010; } catch { return 1010; }
  });
  const setEditorFontScale = (updater: number | ((v: number) => number)) => {
    setEditorFontScaleRaw(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      try { localStorage.setItem("moodra_editorFontScale", String(next)); } catch {}
      return next;
    });
  };
  const setEditorMaxWidth = (updater: number | ((v: number) => number)) => {
    setEditorMaxWidthRaw(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      try { localStorage.setItem("moodra_editorMaxWidth", String(next)); } catch {}
      return next;
    });
  };

  useEffect(() => {
    if (chapter) {
      setTitle(chapter.title);
      setIsDirty(false);
      // Pre-populate blocks from chapter.content so AI actions work before user makes changes
      try {
        const c = chapter.content || "";
        if (c.trim().startsWith("[")) {
          const parsed = JSON.parse(c);
          if (Array.isArray(parsed)) { setBlocks(parsed); } else { setBlocks([]); }
        } else if (c) {
          setBlocks([{ id: "init-0", type: "paragraph" as const, content: c }]);
        } else {
          setBlocks([]);
        }
      } catch { setBlocks([]); }
      clearTimeout(saveTimerRef.current);
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: "auto" });
      const stored = localStorage.getItem(`moodra_adaptations_${chapter.id}`);
      if (stored) {
        try { setAdaptations(JSON.parse(stored)); } catch { setAdaptations([]); }
      } else {
        setAdaptations([]);
      }
    }
  }, [chapter?.id]);

  useEffect(() => {
    if (adaptLoading) {
      setAdaptMsgIdx(0);
      adaptMsgRef.current = setInterval(() => {
        setAdaptMsgIdx(prev => prev + 1);
      }, 3500);
    } else {
      if (adaptMsgRef.current) clearInterval(adaptMsgRef.current);
      adaptMsgRef.current = null;
    }
    return () => { if (adaptMsgRef.current) clearInterval(adaptMsgRef.current); };
  }, [adaptLoading]);

  useEffect(() => {
    if (showAdaptModal) {
      fetch("/api/books").then(r => r.json()).then(books => {
        setAllBooks(Array.isArray(books) ? books : []);
      }).catch(() => setAllBooks([]));
    }
  }, [showAdaptModal]);

  // Sync the inline title element when chapter changes (without disrupting typing)
  useLayoutEffect(() => {
    if (inlineTitleRef.current && chapter) {
      inlineTitleRef.current.textContent = chapter.title;
    }
  }, [chapter?.id]);

  // Keep inline title in sync when title is changed from the toolbar input
  // (only update if the inline title div is NOT currently focused)
  useEffect(() => {
    const el = inlineTitleRef.current;
    if (el && document.activeElement !== el) {
      el.textContent = title;
    }
  }, [title]);

  useEffect(() => {
    const plainText = blocksToPlainText(blocks);
    const words = plainText.trim().split(/\s+/).filter(w => w.length > 0).length;
    setWordCount(words);
    setCharCount(plainText.replace(/\s/g, "").length);
    onContextChange(plainText);
  }, [blocks, onContextChange]);

  useEffect(() => {
    return () => { if (sprintTimerRef.current) clearInterval(sprintTimerRef.current); };
  }, []);

  const startSprint = useCallback(() => {
    const mins = parseInt(sprintMinInput, 10) || 25;
    setSprintSecondsLeft(mins * 60);
    setSprintWordsAtStart(wordCount);
    setSprintActive(true);
    setSprintExpanded(false);
    if (sprintTimerRef.current) clearInterval(sprintTimerRef.current);
    sprintTimerRef.current = setInterval(() => {
      setSprintSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(sprintTimerRef.current!);
          sprintTimerRef.current = null;
          setSprintActive(false);
          toast({ title: s.sprintDone });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [sprintMinInput, wordCount, s.sprintDone, toast]);

  const stopSprint = useCallback(() => {
    if (sprintTimerRef.current) { clearInterval(sprintTimerRef.current); sprintTimerRef.current = null; }
    setSprintActive(false);
  }, []);

  useEffect(() => {
    if (!sprintExpanded) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-sprint-popover]")) setSprintExpanded(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [sprintExpanded]);

  useEffect(() => {
    if (!isTypewriterMode) return;
    const handleInput = () => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (!rect || rect.top === 0) return;
      const container = scrollContainerRef.current;
      if (!container) return;
      const containerRect = container.getBoundingClientRect();
      const targetY = containerRect.top + containerRect.height / 2;
      const delta = rect.top - targetY;
      container.scrollBy({ top: delta, behavior: "smooth" });
    };
    const area = editorAreaRef.current;
    area?.addEventListener("keyup", handleInput);
    return () => area?.removeEventListener("keyup", handleInput);
  }, [isTypewriterMode]);

  const saveMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", `/api/chapters/${chapter!.id}`, data),
    onSuccess: (updated: Chapter) => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", updated.bookId, "chapters"] });
      setIsDirty(false);
      onWrite?.();
    },
    onError: () => toast({ title: s.saving + " error", variant: "destructive" }),
  });

  const improveMutation = useMutation({
    mutationFn: async (actionMode: string) => {
      const text = blocksToPlainText(blocks);
      setActiveActionMode(actionMode);

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
          body: JSON.stringify({
            prompt: text,
            context: "",
            bookTitle,
            lang,
            mode: actionMode,
          }),
        });

        if (freeThinkingRef.current) { clearInterval(freeThinkingRef.current); freeThinkingRef.current = null; }

        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          throw new Error(err.message || "Free AI error");
        }
        const data = await resp.json();
        return { original: text, improved: data.content || "" };
      }

      const res = await apiRequest("POST", "/api/ai/improve", {
        text,
        mode: actionMode,
        bookTitle,
        bookMode,
        lang,
      });
      return res.json();
    },
    onSuccess: (data, variables) => {
      if (freeThinkingRef.current) { clearInterval(freeThinkingRef.current); freeThinkingRef.current = null; }
      setActiveActionMode(null);
      setLastMode(variables as string);
      setCustomInstruction("");
      setImprovementModal({
        original: data.original,
        improved: data.improved
      });
    },
    onError: (e: any) => {
      if (freeThinkingRef.current) { clearInterval(freeThinkingRef.current); freeThinkingRef.current = null; }
      setActiveActionMode(null);
      if (!handleAiError(e)) toast({ title: s.improveChapter + " error", variant: "destructive" });
    },
  });

  const save = useCallback(() => {
    if (!chapter || !isDirty) return;
    saveMutation.mutate({ 
      title, 
      content: JSON.stringify(blocks), 
      wordCount 
    });
  }, [chapter, isDirty, title, blocks, wordCount]);

  useEffect(() => {
    if (isDirty) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(save, 2000);
    }
    return () => clearTimeout(saveTimerRef.current);
  }, [isDirty, save]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        save();
      }
      if (e.key === "Escape") {
        if (isReadingMode) {
          setIsReadingMode(false);
        } else if (isDeepWritingMode && onToggleDeepWritingMode) {
          onToggleDeepWritingMode();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [save, isDeepWritingMode, onToggleDeepWritingMode, isReadingMode]);

  const insertText = useCallback((text: string) => {
    const newBlock: Block = {
      id: Math.random().toString(36).substring(2, 11),
      type: "paragraph",
      content: text
    };
    setBlocks(prev => [...prev, newBlock]);
    setIsDirty(true);
  }, []);

  useEffect(() => {
    onInsertReady(insertText);
  }, [insertText, onInsertReady]);

  const handleApplyImprovement = () => {
    if (!improvementModal) return;
    const { original, improved, mode, savedRange, startBlockId, endBlockId } = improvementModal;

    // Shared helpers
    const genId = () => Math.random().toString(36).substring(2, 11);
    const stripHtml = (html: string) => (html || "").replace(/<[^>]*>/g, "");

    // Split AI response into paragraphs (prefer \n\n, fall back to \n)
    let improvedParagraphs = improved.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
    if (improvedParagraphs.length === 1 && improved.includes("\n")) {
      improvedParagraphs = improved.split(/\n+/).map(p => p.trim()).filter(Boolean);
    }
    if (!improvedParagraphs.length) improvedParagraphs.push(improved.trim() || " ");

    // Helper: build a minimal Block object from a DOM block element (avoids relying on chapter-editor's stale blocks state)
    const blockInfoFromEl = (blockEl: HTMLElement) => {
      const blockId = blockEl.getAttribute("data-block-id") ?? "";
      const contentEl = blockEl.querySelector("[data-testid^='block-content-']") as HTMLElement | null;
      const testId = contentEl?.getAttribute("data-testid") ?? "";
      // data-testid = "block-content-{type}-{id}" — strip prefix and suffix to get type
      const typeMatch = testId.match(/^block-content-(.+)-[^-]+$/);
      const blockType = typeMatch?.[1] ?? "paragraph";
      const content = contentEl?.innerText ?? "";
      return { id: blockId, type: blockType as any, content };
    };

    // Helper: get prefix/suffix text around a Range within a block's content element
    const getPrefixSuffix = (range: Range, blockEl: HTMLElement) => {
      const contentEl = blockEl.querySelector("[data-testid^='block-content-']") as HTMLElement | null;
      let prefix = "", suffix = "";
      try {
        if (contentEl) {
          const pr = document.createRange();
          pr.setStart(contentEl, 0);
          pr.setEnd(range.startContainer, range.startOffset);
          prefix = pr.toString();
          const sr = document.createRange();
          sr.setStart(range.endContainer, range.endOffset);
          sr.setEndAfter(contentEl.lastChild ?? contentEl);
          suffix = sr.toString();
        }
      } catch { /* DOM may have changed */ }
      return { prefix, suffix };
    };

    // Helper: build N new blocks from paragraph chunks + prefix/suffix
    const buildNewBlocks = (
      paras: string[],
      anchorBlock: { id: string; type: string; content: string; metadata?: any },
      prefix: string,
      suffix: string
    ) => paras.map((para, i) => {
      let content = para;
      if (i === 0 && prefix) content = prefix.trimEnd() + " " + content.trimStart();
      if (i === paras.length - 1 && suffix) content = content.trimEnd() + " " + suffix.trimStart();
      content = content.trim();
      return i === 0
        ? { ...anchorBlock, content }
        : { id: genId(), type: anchorBlock.type, content } as typeof anchorBlock;
    });

    // ── CROSS-BLOCK selection ──────────────────────────────────────────────
    // Use block IDs saved at selection time (reliable, never stale)
    if (startBlockId && endBlockId && startBlockId !== endBlockId) {
      const startBlockEl = document.querySelector(`[data-block-id="${startBlockId}"]`) as HTMLElement | null;
      const endBlockEl   = document.querySelector(`[data-block-id="${endBlockId}"]`) as HTMLElement | null;

      const startContentEl = startBlockEl?.querySelector("[data-testid^='block-content-']") as HTMLElement | null;
      const endContentEl   = endBlockEl?.querySelector("[data-testid^='block-content-']") as HTMLElement | null;
      let prefixText = "", suffixText = "";
      if (savedRange) {
        try {
          if (startContentEl) {
            const pr = document.createRange();
            pr.setStart(startContentEl, 0);
            pr.setEnd(savedRange.startContainer, savedRange.startOffset);
            prefixText = pr.toString();
          }
          if (endContentEl) {
            const sr = document.createRange();
            sr.setStart(savedRange.endContainer, savedRange.endOffset);
            sr.setEndAfter(endContentEl.lastChild ?? endContentEl);
            suffixText = sr.toString();
          }
        } catch {}
      }

      // "paragraphs" mode: create one block per paragraph
      if (mode === "paragraphs" && improvedParagraphs.length > 1) {
        const anchorBlock = startBlockEl ? blockInfoFromEl(startBlockEl) : { id: startBlockId, type: "paragraph" as any, content: "" };
        const newBlocksArr = buildNewBlocks(improvedParagraphs, anchorBlock, prefixText, suffixText);
        blockEditorApiRef.current?.spliceBlocks(startBlockId, endBlockId, newBlocksArr);
        setImprovementModal(null);
        setCustomInstruction("");
        return;
      }

      // Other modes: distribute text to preserve original block count
      const distributeTextProportionally = (text: string, lengths: number[]): string[] => {
        const words = text.trim().split(/\s+/).filter(Boolean);
        if (!words.length) return lengths.map(() => "");
        const totalLen = lengths.reduce((s, l) => s + l, 0) || 1;
        const chunks: string[] = [];
        let wi = 0;
        for (let i = 0; i < lengths.length; i++) {
          if (i === lengths.length - 1) {
            chunks.push(words.slice(wi).join(" "));
          } else {
            const count = Math.max(1, Math.round((lengths[i] / totalLen) * words.length));
            const safe = Math.min(wi + count, words.length - (lengths.length - i - 1));
            chunks.push(words.slice(wi, safe).join(" "));
            wi = safe;
          }
        }
        return chunks;
      };

      const selectedBlocksFromState = blocks.filter((b, i) => {
        const startIdx = blocks.findIndex(bl => bl.id === startBlockId);
        const endIdx   = blocks.findIndex(bl => bl.id === endBlockId);
        return i >= startIdx && i <= endIdx;
      });
      const numBlocks = Math.max(1, selectedBlocksFromState.length);

      let chunks: string[];
      if (improvedParagraphs.length >= numBlocks) {
        chunks = [
          ...improvedParagraphs.slice(0, numBlocks - 1),
          improvedParagraphs.slice(numBlocks - 1).join(" "),
        ];
      } else if (improvedParagraphs.length > 1) {
        chunks = distributeTextProportionally(
          improvedParagraphs.join(" "),
          selectedBlocksFromState.map(b => stripHtml(b.content || "").length || 1)
        );
      } else {
        const selectedLengths = selectedBlocksFromState.map((b, i) => {
          const plain = stripHtml(b.content || "");
          if (i === 0) return Math.max(1, plain.length - prefixText.length);
          if (i === numBlocks - 1) return Math.max(1, plain.length - suffixText.length);
          return Math.max(1, plain.length);
        });
        chunks = distributeTextProportionally(improvedParagraphs[0], selectedLengths);
      }

      if (selectedBlocksFromState.length > 0) {
        const newBlocksArr = selectedBlocksFromState.map((b, i) => {
          let content = chunks[i] || "";
          if (i === 0 && prefixText) content = prefixText.trimEnd() + " " + content.trimStart();
          if (i === numBlocks - 1 && suffixText) content = content.trimEnd() + " " + suffixText.trimStart();
          return { ...b, content: content.trim() };
        });
        blockEditorApiRef.current?.spliceBlocks(startBlockId, endBlockId, newBlocksArr);
        setImprovementModal(null);
        setCustomInstruction("");
        return;
      }
    }

    // ── SAME-BLOCK "paragraphs": split single block into multiple ─────────
    if (mode === "paragraphs" && improvedParagraphs.length > 1 && startBlockId) {
      const blockEl = document.querySelector(`[data-block-id="${startBlockId}"]`) as HTMLElement | null;
      if (blockEl) {
        const { prefix, suffix } = savedRange ? getPrefixSuffix(savedRange, blockEl) : { prefix: "", suffix: "" };
        const block = blockInfoFromEl(blockEl);
        const newBlocksArr = buildNewBlocks(improvedParagraphs, block, prefix, suffix);
        blockEditorApiRef.current?.spliceBlocks(startBlockId, startBlockId, newBlocksArr);
        setImprovementModal(null);
        setCustomInstruction("");
        return;
      }
    }

    // ── SINGLE-BLOCK or no savedRange fallback ─────────────────────────────
    // "paragraphs" mode with no savedRange: fall back to text search to find the block
    if (mode === "paragraphs" && improvedParagraphs.length > 1) {
      // Search by content in the actual DOM (reliable even when chapter-editor blocks state has stale IDs)
      const strippedOriginal = stripHtml(original);
      let foundBlockEl: HTMLElement | null = null;
      for (const el of Array.from(document.querySelectorAll("[data-block-id]"))) {
        const htmlEl = el as HTMLElement;
        const contentEl = htmlEl.querySelector("[data-testid^='block-content-']") as HTMLElement | null;
        if (contentEl && contentEl.innerText.includes(strippedOriginal)) {
          foundBlockEl = htmlEl;
          break;
        }
      }
      if (foundBlockEl) {
        const blockId = foundBlockEl.getAttribute("data-block-id")!;
        const block = blockInfoFromEl(foundBlockEl);
        const newBlocksArr = improvedParagraphs.map((para, i) =>
          i === 0
            ? { ...block, content: para }
            : { id: genId(), type: block.type, content: para } as typeof block
        );
        blockEditorApiRef.current?.spliceBlocks(blockId, blockId, newBlocksArr);
        setImprovementModal(null);
        setCustomInstruction("");
        return;
      }
    }

    if (blockEditorApiRef.current) {
      blockEditorApiRef.current.replaceTextInBlocks(original, improved);
    } else {
      let replaced = false;
      setBlocks(prev => prev.map(block => {
        if (!replaced && block.content && block.content.includes(original)) {
          replaced = true;
          return { ...block, content: block.content.replace(original, improved) };
        }
        return block;
      }));
      if (!replaced) {
        setBlocks(prev => [...prev, {
          id: Math.random().toString(36).substring(2, 11),
          type: "paragraph" as any,
          content: improved,
        }]);
      }
    }
    setIsDirty(true);
    setImprovementModal(null);
    setCustomInstruction("");
  };

  const handleInsertAsParagraph = () => {
    if (!improvementModal) return;
    if (blockEditorApiRef.current) {
      blockEditorApiRef.current.appendBlock(improvementModal.improved, "paragraph");
    } else {
      const newBlock: Block = {
        id: Math.random().toString(36).substring(2, 11),
        type: "paragraph",
        content: improvementModal.improved,
      };
      setBlocks(prev => [...prev, newBlock]);
    }
    setIsDirty(true);
    setImprovementModal(null);
    setCustomInstruction("");
  };

  const handleRegenerate = async () => {
    if (!improvementModal || isRegenerating) return;
    setIsRegenerating(true);
    try {
      const text = improvementModal.original;
      if (isFreeMode) {
        const resp = await fetch("/api/ai/free", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: text, context: customInstruction, bookTitle, lang, mode: lastMode }),
        });
        if (!resp.ok) throw new Error("free ai error");
        const data = await resp.json();
        setImprovementModal(prev => prev ? { ...prev, improved: data.content || "" } : null);
      } else {
        const res = await fetch("/api/ai/improve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, mode: lastMode, bookTitle, bookMode, lang, customInstruction }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "error");
        setImprovementModal(prev => prev ? { ...prev, improved: data.improved || "" } : null);
      }
    } catch {
      toast({ title: s.improveChapter + " error", variant: "destructive" });
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSelectionResult = useCallback((original: string, improved: string, mode: string, savedRange: Range | null, blockIds: { startId: string; endId: string } | null) => {
    setLastMode(mode);
    setImprovementModal({ original, improved, mode, savedRange, startBlockId: blockIds?.startId, endBlockId: blockIds?.endId });
  }, []);

  const handleAdaptLanguage = async (workflowOverride?: "new" | "existing") => {
    const workflow = workflowOverride ?? adaptWorkflow;
    if (!adaptLang || adaptLoading || !chapter) return;
    if (workflow === "existing" && !selectedExistingBookId) return;
    setAdaptWorkflow(workflow);
    setAdaptLoading(true);
    setAdaptDone(null);
    try {
      const text = blocksToPlainText(blocks);
      const adaptResp = await fetch("/api/ai/adapt-language", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, targetLanguage: adaptLang, bookTitle, bookMode }),
      });
      const adaptData = await adaptResp.json();
      if (!adaptResp.ok) throw new Error(adaptData.error || "Adaptation error");
      const adapted = adaptData.adapted || "";
      const adaptedParagraphs = adapted.split(/\n\n+/).filter((p: string) => p.trim());
      const originalNonDividers = blocks.filter(b => b.type !== "divider");
      const adaptedBlocks = adaptedParagraphs.map((p: string, i: number) => ({
        id: Math.random().toString(36).substring(2, 11),
        type: (i < originalNonDividers.length ? originalNonDividers[i].type : "paragraph") as string,
        content: p.trim(),
      }));

      let targetBookId: number;
      let targetBookTitle: string;

      if (workflow === "new") {
        const newTitle = `${bookTitle} (${adaptLang} Adaptation)`;
        const bookResp = await fetch("/api/books", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: newTitle, mode: bookMode || "fiction" }),
        });
        const newBook = await bookResp.json();
        if (!bookResp.ok) throw new Error("Failed to create book");
        targetBookId = newBook.id;
        targetBookTitle = newTitle;
      } else {
        targetBookId = selectedExistingBookId!;
        targetBookTitle = allBooks.find(b => b.id === selectedExistingBookId)?.title || "Book";
      }

      await fetch(`/api/books/${targetBookId}/chapters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: chapter.title,
          content: JSON.stringify(adaptedBlocks),
          order: workflow === "new" ? 1 : 9999,
        }),
      });

      const newAdaptation = { lang: adaptLang, bookId: targetBookId, bookTitle: targetBookTitle };
      const updatedAdaptations = [...adaptations.filter(a => a.lang !== adaptLang), newAdaptation];
      setAdaptations(updatedAdaptations);
      localStorage.setItem(`moodra_adaptations_${chapter.id}`, JSON.stringify(updatedAdaptations));

      setAdaptDone({ message: s.adaptNote.replace("{{title}}", targetBookTitle), bookId: targetBookId, bookTitle: targetBookTitle });
      toast({ title: s.adaptSuccess });
    } catch (e: any) {
      toast({ title: "Adaptation error", description: e?.message, variant: "destructive" });
    } finally {
      setAdaptLoading(false);
    }
  };

  if (!chapter) {
    return (
      <div className="flex-1 flex items-center justify-center text-center p-8">
        <div className="flex flex-col items-center gap-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, rgba(249,109,28,0.12), rgba(251,146,60,0.08))" }}>
              <BookOpen className="h-10 w-10" style={{ color: "#F96D1C" }} />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-3 w-3 text-primary" />
            </div>
          </div>
          <div className="space-y-1.5 max-w-[220px]">
            <p className="text-sm font-semibold">{s.selectChapter}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {s.selectChapterHint}<br />{s.selectChapterHint2}
            </p>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className={cn(
      "flex flex-col overflow-hidden transition-all duration-500",
      (isDeepWritingMode || isReadingMode)
        ? "fixed inset-0 z-[200] bg-[#FAF2EA]"
        : "flex-1 bg-card"
    )}>
      {/* Editor toolbar */}
      <div className={cn(
        "px-5 py-3 border-b border-border flex items-center gap-3 flex-shrink-0 transition-opacity duration-500",
        (isDeepWritingMode || isReadingMode) && "opacity-0 pointer-events-none h-0 p-0 border-0"
      )}>
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <Type className="h-4 w-4 text-muted-foreground/60 flex-shrink-0" />
          <Input
            data-testid="input-chapter-title-editor"
            value={title}
            onChange={e => { setTitle(e.target.value); setIsDirty(true); }}
            className="border-0 bg-transparent p-0 h-8 text-[15px] font-semibold focus-visible:ring-0 min-w-0 tracking-tight"
            placeholder={s.chapterPlaceholder}
          />
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Stats: words + reading time */}
          <button
            onClick={() => setShowCharCount(v => !v)}
            className="flex items-center gap-1 text-xs text-muted-foreground/70 hover:text-muted-foreground transition-colors pr-2 mr-0.5"
            title={showCharCount ? "Show word count" : "Show character count"}
          >
            <AlignLeft className="h-3.5 w-3.5 flex-shrink-0" />
            <span data-testid="word-count">
              {showCharCount
                ? `${charCount.toLocaleString()} ${s.chars}`
                : `${wordCount} ${s.words}`}
            </span>
            {!showCharCount && wordCount > 0 && (
              <span className="text-[10px] text-muted-foreground/40 hidden sm:inline">
                · {Math.max(1, Math.ceil(wordCount / 225))} {s.minRead}
              </span>
            )}
          </button>

          <div className="w-px h-4 bg-border/60 mx-0.5" />

          {/* Editor font size control */}
          <div className="flex items-center gap-0.5" title={s.editorFontSmaller}>
            <button
              onClick={() => setEditorFontScale(v => Math.max(70, v - 5))}
              className="h-6 w-6 flex items-center justify-center rounded hover:bg-accent/60 text-muted-foreground hover:text-foreground transition-colors text-xs font-bold"
              title={s.editorFontSmaller}
            >A<sup className="text-[7px]">–</sup></button>
            <button
              onClick={() => setEditorFontScale(100)}
              className="text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors w-8 text-center tabular-nums"
              title="Сбросить размер шрифта"
            >{editorFontScale}%</button>
            <button
              onClick={() => setEditorFontScale(v => Math.min(160, v + 5))}
              className="h-6 w-6 flex items-center justify-center rounded hover:bg-accent/60 text-muted-foreground hover:text-foreground transition-colors text-xs font-bold"
              title={s.editorFontLarger}
            >A<sup className="text-[7px]">+</sup></button>
          </div>

          <div className="w-px h-4 bg-border/60 mx-0.5" />

          {/* Editor width control */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setEditorMaxWidth(v => Math.max(480, v - 60))}
              className="h-6 w-6 flex items-center justify-center rounded hover:bg-accent/60 text-muted-foreground hover:text-foreground transition-colors"
              title={s.editorNarrow}
            ><Minus className="h-3 w-3" /></button>
            <button
              onClick={() => setEditorMaxWidth(1010)}
              className="flex items-center gap-0.5 text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
              title="Сбросить ширину редактора"
            >
              <ChevronsLeftRight className="h-3 w-3" />
              <span className="tabular-nums w-8 text-center">{editorMaxWidth}</span>
            </button>
            <button
              onClick={() => setEditorMaxWidth(v => Math.min(1010, v + 60))}
              className="h-6 w-6 flex items-center justify-center rounded hover:bg-accent/60 text-muted-foreground hover:text-foreground transition-colors"
              title={s.editorWider}
            ><Plus className="h-3 w-3" /></button>
          </div>

          <div className="w-px h-4 bg-border/60 mx-0.5" />

          {/* Typewriter mode */}
          <Button
            size="sm"
            variant="ghost"
            className={cn("h-8 w-8 p-0 transition-colors", isTypewriterMode ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground")}
            onClick={() => setIsTypewriterMode(v => !v)}
            title={s.typewriterMode}
          >
            <Keyboard className="h-3.5 w-3.5" />
          </Button>

          {/* Sprint */}
          <div className="relative">
            <Button
              size="sm"
              variant="ghost"
              className={cn("h-8 px-2 gap-1 text-xs transition-colors", sprintActive ? "text-orange-500" : "text-muted-foreground hover:text-foreground")}
              onClick={() => { if (sprintActive) return; setSprintExpanded(v => !v); }}
              title={s.sprintLabel}
            >
              {sprintActive ? (
                <>
                  <Clock className="h-3.5 w-3.5 animate-pulse" />
                  <span className="font-mono text-[11px]">
                    {String(Math.floor(sprintSecondsLeft / 60)).padStart(2, "0")}:{String(sprintSecondsLeft % 60).padStart(2, "0")}
                  </span>
                  <span className="text-[10px] hidden sm:inline">+{wordCount - sprintWordsAtStart}</span>
                </>
              ) : (
                <Timer className="h-3.5 w-3.5" />
              )}
            </Button>
            {sprintActive && (
              <button
                onClick={stopSprint}
                className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-destructive/80 flex items-center justify-center text-white hover:bg-destructive transition-colors"
                title={s.sprintStop}
              >
                <X className="h-2 w-2" />
              </button>
            )}
            {sprintExpanded && !sprintActive && (
              <div
                data-sprint-popover
                className="absolute right-0 top-full mt-1 z-50 w-52 rounded-xl border border-border bg-background shadow-xl p-3 space-y-2"
              >
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{s.sprintLabel}</p>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <p className="text-[10px] text-muted-foreground mb-1">{s.sprintGoalPlaceholder}</p>
                    <input
                      type="number"
                      min={50}
                      max={10000}
                      step={50}
                      value={sprintGoalInput}
                      onChange={e => setSprintGoalInput(e.target.value)}
                      className="w-full rounded-lg border border-border bg-secondary/50 px-2 py-1 text-xs outline-none focus:border-primary/40"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] text-muted-foreground mb-1">Min</p>
                    <select
                      value={sprintMinInput}
                      onChange={e => setSprintMinInput(e.target.value)}
                      className="w-full rounded-lg border border-border bg-secondary/50 px-2 py-1 text-xs outline-none focus:border-primary/40"
                    >
                      {[5,10,15,20,25,30,45,60].map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
                <button
                  onClick={startSprint}
                  className="w-full py-1.5 rounded-lg text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-colors"
                  style={{ background: "#F96D1C" }}
                >
                  <Zap className="h-3 w-3" />
                  {s.sprintStart}
                </button>
              </div>
            )}
          </div>

          <div className="w-px h-4 bg-border/60 mx-0.5" />

          {isDirty && (
            <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal hidden sm:flex">
              {s.modified}
            </Badge>
          )}
          <Button
            size="sm"
            variant={isDirty ? "default" : "outline"}
            className="h-8 gap-1.5 text-xs px-3"
            onClick={save}
            disabled={!isDirty || saveMutation.isPending}
            data-testid="button-save-chapter"
          >
            <Save className="h-3.5 w-3.5" />
            {saveMutation.isPending ? s.saving : s.save}
          </Button>
          <div className="flex items-center gap-0.5">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => { setShowAdaptModal(true); setAdaptDone(null); setAdaptStep("select-lang"); setAdaptLang(""); setSelectedExistingBookId(null); }}
              title={s.adaptLang}
            >
              <Globe className="h-3.5 w-3.5" />
            </Button>
            {adaptations.length > 0 && (
              <div className="flex items-center gap-0.5">
                {adaptations.map(a => (
                  <button
                    key={a.lang}
                    onClick={() => navigate(`/book/${a.bookId}`)}
                    title={`${s.adaptGoTo}: ${a.bookTitle}`}
                    className="flex items-center gap-0.5 px-1.5 h-5 rounded-md text-[9px] font-semibold transition-colors hover:opacity-80"
                    style={{ background: "rgba(99,102,241,0.15)", color: "#818CF8", border: "1px solid rgba(99,102,241,0.25)" }}
                  >
                    {a.lang.slice(0, 2).toUpperCase()}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            onClick={onToggleDeepWritingMode}
            data-testid="button-deep-writing-mode"
            title="Focus mode"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Selection Toolbar */}
      {!isReadingMode && (
        <SelectionToolbar
          containerRef={editorAreaRef as React.RefObject<HTMLElement>}
          bookTitle={bookTitle}
          bookMode={bookMode}
          bookId={bookId}
          onResult={handleSelectionResult}
        />
      )}

      {/* Text editor */}
      <div
        ref={scrollContainerRef}
        className={cn(
          "flex-1 overflow-y-auto transition-all duration-500 relative",
          (isDeepWritingMode || isReadingMode) ? "pt-16 pb-24" : ""
        )}>
        {(isDeepWritingMode || isReadingMode) && (
          <Button
            size="sm"
            variant="ghost"
            className={cn(
              "fixed h-8 w-8 p-0 rounded-full bg-background/20 hover:bg-background/40 z-[100]",
              isReadingMode ? "bottom-8 left-1/2 -translate-x-1/2" : "top-6 right-6"
            )}
            onClick={isReadingMode ? () => setIsReadingMode(false) : onToggleDeepWritingMode}
          >
            {isReadingMode ? <X className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </Button>
        )}

        <div
          ref={editorAreaRef}
          className={cn(
          "mx-auto transition-all duration-500",
          (isDeepWritingMode || isReadingMode) ? "px-4" : "px-8 py-8"
        )}
          style={{
            maxWidth: isReadingMode ? 640 : editorMaxWidth,
            zoom: editorFontScale / 100,
          }}
        >
          {/* Chapter title — always visible, editable in write/focus modes */}
          <div
            ref={inlineTitleRef}
            contentEditable={!isReadingMode}
            suppressContentEditableWarning
            data-placeholder={s.chapterPlaceholder}
            onInput={e => {
              const text = e.currentTarget.textContent || "";
              setTitle(text);
              setIsDirty(true);
            }}
            className={cn(
              "font-bold font-serif outline-none w-full break-words",
              "empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/30 empty:before:pointer-events-none",
              isReadingMode
                ? "text-4xl text-center mb-12 text-foreground cursor-default"
                : isDeepWritingMode
                  ? "text-3xl text-center mb-12 opacity-30"
                  : "text-2xl mb-6 pb-5 border-b border-border/50 text-foreground/90"
            )}
          />
          <div
            className={cn(isReadingMode && "reading-mode-content")}
            style={{
              fontFamily: bookId ? bookSettings.fontFamily : undefined,
              lineHeight: bookId ? bookSettings.lineHeight : undefined,
              textAlign: bookId ? (bookSettings.textAlign as any) : undefined,
            }}
          >
            <BlockEditor
              key={chapter.id}
              initialContent={chapter.content || ""}
              onMounted={(api) => { blockEditorApiRef.current = api; }}
              onChange={(newBlocks) => {
                setBlocks(newBlocks);
                setIsDirty(true);
              }}
              hideControls={isReadingMode}
              bookTitle={bookTitle}
              bookMode={bookMode}
              firstLineIndent={bookSettings.firstLineIndent ?? 1.2}
            />
          </div>
        </div>

        {(isDeepWritingMode || isReadingMode) && !isReadingMode && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-background/20 backdrop-blur-md border border-white/10 text-xs text-muted-foreground flex items-center gap-3">
            <span>{wordCount} {s.words}</span>
            {sprintActive && (
              <>
                <span className="opacity-30">|</span>
                <span className="flex items-center gap-1.5 text-orange-400">
                  <Clock className="h-3 w-3 animate-pulse" />
                  <span className="font-mono">
                    {String(Math.floor(sprintSecondsLeft / 60)).padStart(2, "0")}:{String(sprintSecondsLeft % 60).padStart(2, "0")}
                  </span>
                  {parseInt(sprintGoalInput, 10) > 0 && (
                    <span className="text-[10px]">
                      +{wordCount - sprintWordsAtStart}/{sprintGoalInput}
                    </span>
                  )}
                </span>
                <div
                  className="h-1 rounded-full overflow-hidden"
                  style={{ width: 48, background: "rgba(255,255,255,0.1)" }}
                >
                  <div
                    className="h-full rounded-full bg-orange-400 transition-all"
                    style={{ width: `${Math.min(100, ((wordCount - sprintWordsAtStart) / (parseInt(sprintGoalInput, 10) || 500)) * 100)}%` }}
                  />
                </div>
              </>
            )}
            {isTypewriterMode && <span className="opacity-30">⌨</span>}
          </div>
        )}
      </div>

      <Dialog open={!!improvementModal} onOpenChange={() => { setImprovementModal(null); setCustomInstruction(""); }}>
        <DialogContent hideCloseButton className="max-w-lg p-0 overflow-hidden gap-0" style={{ borderRadius: "18px", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 24px 60px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.06)" }}>

          {/* Header — light platform style */}
          <div className="flex items-center justify-between px-4 py-3" style={{ background: "#fff", borderBottom: "1px solid #f0ece8" }}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(99,102,241,0.1)" }}>
                <Sparkles className="w-3.5 h-3.5" style={{ color: "#6366f1" }} />
              </div>
              <span className="text-sm font-semibold" style={{ color: "#2d1b0e" }}>
                {(MODE_LABELS[lang] ?? MODE_LABELS.en)[lastMode] ?? lastMode}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(99,102,241,0.08)", color: "#6366f1" }}>AI</span>
            </div>
            <button
              onClick={() => { setImprovementModal(null); setCustomInstruction(""); }}
              className="w-6 h-6 rounded-full flex items-center justify-center transition-colors hover:bg-black/05"
            >
              <X className="w-3.5 h-3.5" style={{ color: "#9a8a80" }} />
            </button>
          </div>

          {/* Scrollable body */}
          <div className="flex flex-col" style={{ background: "#FAF8F6", maxHeight: "65vh", overflowY: "auto" }}>

            {/* Original */}
            <div className="px-4 pt-4 pb-2">
              <div className="text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "#c0b8b0" }}>{s.original}</div>
              <div className="text-[13px] leading-relaxed px-3 py-2.5 rounded-xl line-through" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)", color: "#b0a9a0", textDecorationColor: "#d0c8c0" }}>
                {improvementModal?.original}
              </div>
            </div>

            {/* Arrow badge */}
            <div className="flex items-center justify-center py-2">
              <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: "rgba(99,102,241,0.08)", color: "#6366f1" }}>
                <ArrowDownIcon className="w-3 h-3" />
                <span>{(MODE_LABELS[lang] ?? MODE_LABELS.en)[lastMode] ?? lastMode}</span>
              </div>
            </div>

            {/* Improved result */}
            <div className="px-4 pb-4">
              <div className="text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "#22c55e" }}>{s.improved}</div>
              <div className="rounded-xl px-3 py-3 text-[13px] leading-relaxed" style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0", color: "#15803d", minHeight: "3rem" }}>
                {isRegenerating
                  ? <div className="flex items-center gap-2" style={{ color: "#15803d" }}><Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />{s.applying}</div>
                  : improvementModal?.improved}
              </div>
            </div>

            {/* Instruction row */}
            <div className="px-4 pb-4 flex gap-2 items-center" style={{ borderTop: "1px solid #ede8e2", paddingTop: "12px" }}>
              <input
                type="text"
                value={customInstruction}
                onChange={e => setCustomInstruction(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleRegenerate()}
                placeholder={s.customInstruction}
                className="flex-1 h-8 rounded-lg border px-3 text-xs outline-none focus:border-indigo-300"
                style={{ background: "white", borderColor: "#e4ddd8", color: "#4a4540" }}
              />
              <button
                onClick={handleRegenerate}
                disabled={isRegenerating}
                className="h-8 px-3 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-40 flex-shrink-0"
                style={{ background: "rgba(99,102,241,0.08)", color: "#6366f1", border: "1px solid rgba(99,102,241,0.15)" }}
              >
                {isRegenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                {s.regenerate}
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3" style={{ background: "#fff", borderTop: "1px solid #f0ece8" }}>
            <button
              onClick={() => { setImprovementModal(null); setCustomInstruction(""); }}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-sm font-medium transition-colors hover:bg-black/04"
              style={{ color: "#a09890" }}
            >
              <X className="w-3.5 h-3.5" />
              {s.reject}
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={handleInsertAsParagraph}
                disabled={isRegenerating}
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
                style={{ background: "#f5f0eb", color: "#6b5a50", border: "1px solid #e8e0d8" }}
              >
                <Plus className="w-3.5 h-3.5" />
                {s.insertParagraph}
              </button>
              <button
                onClick={handleApplyImprovement}
                disabled={isRegenerating}
                className="flex items-center gap-1.5 h-8 px-4 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-40 hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #6366f1, #818CF8)", boxShadow: "0 2px 10px rgba(99,102,241,0.3)" }}
              >
                <Check className="w-3.5 h-3.5" />
                {s.accept}
              </button>
            </div>
          </div>

        </DialogContent>
      </Dialog>

      {/* Language Adaptation Modal — multi-step */}
      <Dialog open={showAdaptModal} onOpenChange={v => {
        setShowAdaptModal(v);
        if (!v) { setAdaptDone(null); setAdaptLang(""); setAdaptStep("select-lang"); setSelectedExistingBookId(null); }
      }}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              {s.adaptModalTitle}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-1 min-h-[160px]">
            {/* SUCCESS */}
            {adaptDone ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-semibold">
                    <Check className="h-4 w-4" />
                    {s.adaptSuccess}
                  </div>
                  <p className="text-xs text-muted-foreground">{adaptDone.message}</p>
                </div>
                {adaptDone.bookId && (
                  <Button className="w-full gap-1.5" variant="outline" onClick={() => { setShowAdaptModal(false); navigate(`/book/${adaptDone!.bookId}`); }}>
                    <Globe className="h-3.5 w-3.5" />
                    {s.adaptGoTo}: {adaptDone.bookTitle}
                  </Button>
                )}
              </div>
            ) : adaptStep === "select-lang" ? (
              /* STEP 1 — Language selection */
              <>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.adaptDesc}</p>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{s.adaptSelectLang}</p>
                  <div className="relative">
                    <button
                      onClick={() => setAdaptShowLangPicker(v => !v)}
                      className="w-full flex items-center justify-between h-10 px-3 rounded-xl border border-border/60 bg-secondary text-sm"
                    >
                      <span className={adaptLang ? "text-foreground" : "text-muted-foreground"}>
                        {adaptLang ? ADAPT_LANGUAGES.find(l => l.code === adaptLang)?.label || adaptLang : s.adaptSelectLang}
                      </span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </button>
                    {adaptShowLangPicker && (
                      <div className="absolute top-full mt-1 left-0 right-0 z-50 rounded-xl border border-border/60 bg-background shadow-lg overflow-hidden">
                        <div className="p-1 grid grid-cols-2 gap-0.5 max-h-52 overflow-y-auto">
                          {ADAPT_LANGUAGES.map(l => (
                            <button
                              key={l.code}
                              onClick={() => { setAdaptLang(l.code); setAdaptShowLangPicker(false); }}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors hover:bg-muted ${adaptLang === l.code ? "bg-primary/10 text-primary font-medium" : "text-foreground"}`}
                            >
                              {adaptLang === l.code && <Check className="h-3 w-3 flex-shrink-0" />}
                              {l.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : adaptStep === "select-workflow" ? (
              /* STEP 2 — Choose workflow */
              <div className="space-y-3">
                <p className="text-sm font-medium">{ADAPT_LANGUAGES.find(l => l.code === adaptLang)?.label || adaptLang}</p>
                <button
                  onClick={() => { setPendingWorkflow("new"); setAdaptStep("cost-preview"); }}
                  disabled={adaptLoading}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-border/60 hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <PlusSquare className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{s.adaptWorkflowNew}</p>
                    <p className="text-xs text-muted-foreground">«{bookTitle} ({adaptLang} Adaptation)»</p>
                  </div>
                </button>
                <button
                  onClick={() => setAdaptStep("select-book")}
                  disabled={adaptLoading}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-border/60 hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="h-4 w-4 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{s.adaptWorkflowExisting}</p>
                    <p className="text-xs text-muted-foreground">{s.adaptExistingDesc}</p>
                  </div>
                </button>
              </div>
            ) : adaptStep === "select-book" ? (
              /* STEP 3 — Select existing book */
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">{s.adaptExistingDesc}</p>
                {allBooks.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">{s.adaptNoBooks}</p>
                ) : (
                  <div className="space-y-1 max-h-52 overflow-y-auto">
                    {allBooks.map(b => (
                      <button
                        key={b.id}
                        onClick={() => setSelectedExistingBookId(b.id === selectedExistingBookId ? null : b.id)}
                        className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm text-left transition-colors ${selectedExistingBookId === b.id ? "border-primary/50 bg-primary/5 text-foreground font-medium" : "border-border/40 hover:bg-muted/50 text-foreground"}`}
                      >
                        {selectedExistingBookId === b.id && <Check className="h-3 w-3 text-primary flex-shrink-0" />}
                        <span className="truncate">{b.title}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : adaptStep === "cost-preview" ? (
              /* STEP 4 — Cost preview */
              (() => {
                const text = blocksToPlainText(blocks);
                const est = estimateAdaptCost(text);
                const adaptMsgs = ADAPT_LOADING_MSGS[lang] ?? ADAPT_LOADING_MSGS.en;
                const totalChunks = estimateChunkCount(text);
                const estimatedPart = Math.min(adaptMsgIdx + 1, totalChunks);
                return (
                  <div className="space-y-3 relative">
                    {adaptLoading && (
                      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-xl gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        {totalChunks > 1 && (
                          <p className="text-xs font-semibold text-primary">{lang === "ru" ? `Часть ${estimatedPart} / ${totalChunks}` : lang === "ua" ? `Частина ${estimatedPart} / ${totalChunks}` : lang === "de" ? `Teil ${estimatedPart} / ${totalChunks}` : `Part ${estimatedPart} / ${totalChunks}`}</p>
                        )}
                        <p className="text-sm font-medium text-foreground animate-pulse">{adaptMsgs[adaptMsgIdx % adaptMsgs.length]}</p>
                      </div>
                    )}
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-2.5">
                      <p className="text-sm font-semibold flex items-center gap-2 text-amber-700 dark:text-amber-400">
                        <DollarSign className="h-4 w-4" />
                        {s.costPreviewTitle}
                      </p>
                      <div className="grid grid-cols-2 gap-y-1.5 text-xs">
                        <span className="text-muted-foreground">{s.costWords}</span>
                        <span className="text-right font-medium">{est.wordCount.toLocaleString()}</span>
                        <span className="text-muted-foreground">{s.costInputTokens}</span>
                        <span className="text-right font-medium">{est.estInputTokens.toLocaleString()}</span>
                        <span className="text-muted-foreground">{s.costOutputTokens}</span>
                        <span className="text-right font-medium">{est.estOutputTokens.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-2">
                      <div className="grid grid-cols-2 gap-y-1.5 text-xs">
                        <span className="text-muted-foreground">{s.costModel}</span>
                        <span className="text-right font-semibold">{est.modelName}</span>
                        <span className="col-span-2 text-[10px] text-muted-foreground/70">{s.costModelNote}</span>
                        <span className="text-muted-foreground">{s.costInputRate}</span>
                        <span className="text-right">${est.priceInput.toFixed(2)} / 1M</span>
                        <span className="text-muted-foreground">{s.costOutputRate}</span>
                        <span className="text-right">${est.priceOutput.toFixed(2)} / 1M</span>
                      </div>
                      <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                        <span className="text-sm font-medium">{s.costTotal}</span>
                        <span className="text-lg font-bold text-primary">~${est.totalCost < 0.01 ? est.totalCost.toFixed(4) : est.totalCost.toFixed(2)}</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground/70 leading-snug">{s.costNote}</p>
                  </div>
                );
              })()
            ) : null}
          </div>

          <DialogFooter className="gap-2">
            {adaptDone ? (
              <Button variant="outline" onClick={() => { setShowAdaptModal(false); setAdaptDone(null); setAdaptLang(""); setAdaptStep("select-lang"); }}>
                OK
              </Button>
            ) : adaptStep === "select-lang" ? (
              <>
                <Button variant="outline" onClick={() => setShowAdaptModal(false)}>{s.reject}</Button>
                <Button disabled={!adaptLang} onClick={() => setAdaptStep("select-workflow")} className="gap-1.5">
                  {s.adaptRun}
                </Button>
              </>
            ) : adaptStep === "select-workflow" ? (
              <>
                <Button variant="outline" onClick={() => setAdaptStep("select-lang")}>{s.adaptBackToLang}</Button>
              </>
            ) : adaptStep === "select-book" ? (
              <>
                <Button variant="outline" onClick={() => setAdaptStep("select-workflow")}>{s.costBack}</Button>
                <Button
                  onClick={() => { setPendingWorkflow("existing"); setAdaptStep("cost-preview"); }}
                  disabled={!selectedExistingBookId}
                  className="gap-1.5"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  {s.adaptChooseBook}
                </Button>
              </>
            ) : adaptStep === "cost-preview" ? (
              <>
                <Button variant="outline" onClick={() => setAdaptStep(pendingWorkflow === "existing" ? "select-book" : "select-workflow")}>{s.costBack}</Button>
                <Button
                  onClick={() => handleAdaptLanguage(pendingWorkflow)}
                  disabled={adaptLoading}
                  className="gap-1.5"
                >
                  {adaptLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <DollarSign className="h-3.5 w-3.5" />}
                  {adaptLoading ? (ADAPT_LOADING_MSGS[lang] ?? ADAPT_LOADING_MSGS.en)[adaptMsgIdx % (ADAPT_LOADING_MSGS[lang] ?? ADAPT_LOADING_MSGS.en).length] : s.costConfirm}
                </Button>
              </>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style>{`
        .reading-mode-content {
          font-size: 18px;
          line-height: 1.9;
          font-family: var(--font-writing);
        }
      `}</style>
    </div>
  );
}
