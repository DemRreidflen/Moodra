import React, { useState, useCallback, useEffect, useLayoutEffect, useRef, forwardRef, type ReactNode } from "react";
import { useSpellCheck } from "@/hooks/use-spell-check";
import { useToast } from "@/hooks/use-toast";
import { LANG_LABELS, LANG_FULL_LABELS, LANG_BROWSER_ATTR, type SpellCheckMode, type SpellCheckLang, type LTMatch } from "@/lib/spell-check-service";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { 
  GripVertical, Plus, Type, Heading1, Heading2, Heading3, 
  Quote, Lightbulb, MessageSquare, HelpCircle, Info, Search, 
  Link as LinkIcon, Minus, MoreHorizontal, Send, Copy, ExternalLink,
  CheckCircle2, XCircle, AlertCircle, Wand2, ChevronDown, Check,
  Bold, Italic, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Superscript, Subscript,
  Palette, Highlighter, Link2, Eraser, Indent, Outdent,
  Undo2, Redo2, RemoveFormatting, CheckSquare, Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useFreeMode } from "@/hooks/use-free-mode";
import { useLang } from "@/contexts/language-context";
import { useLocation } from "wouter";

const BLOCK_EDITOR_I18N: Record<string, Record<string, string>> = {
  en: {
    improve: "Improve", expand: "Expand", shorten: "Shorten", rephrase: "Rephrase", example: "+ Example", strengthen: "Strengthen",
    noStyle: "No style", academic: "Academic", literary: "Literary", minimalist: "Minimalist", philosophical: "Philosophical", journalistic: "Journalistic",
    defaultFont: "Default", monospace: "Monospace",
    text: "Text", heading1: "Heading 1", heading2: "Heading 2", heading3: "Heading 3", quote: "Quote",
    hypothesis: "Hypothesis", argument: "Argument", counterargument: "Counterargument", idea: "Idea", question: "Question",
    exampleBlock: "Example", observation: "Observation", research: "Research", sourceRef: "Source", divider: "Divider",
    bulletItem: "Bullet point", numberedItem: "Numbered item", checkItem: "Checklist item",
    bulletItemDesc: "Unordered list item", numberedItemDesc: "Numbered list item", checkItemDesc: "Checkbox item",
    textDesc: "Regular text", heading1Desc: "Large heading", heading2Desc: "Medium heading", heading3Desc: "Small heading",
    quoteDesc: "Highlighted quote", hypothesisDesc: "Assumption to verify", argumentDesc: "Argument in favor", counterargumentDesc: "Argument against",
    ideaDesc: "Sudden insight", questionDesc: "Something to find out", exampleDesc: "Illustration of thought",
    observationDesc: "Noticed fact", researchDesc: "Research data", sourceRefDesc: "Reference to source", dividerDesc: "Horizontal line",
    font: "Font", size: "Size", bold: "Bold (Ctrl+B)", italic: "Italic (Ctrl+I)", underline: "Underline (Ctrl+U)", strikethrough: "Strikethrough",
    textColor: "Text color", highlight: "Highlight", removeHL: "Remove",
    alignLeft: "Align left", alignCenter: "Center", alignRight: "Align right", justify: "Justify",
    bulletList: "Bulleted list", numberedList: "Numbered list", increaseIndent: "Increase indent", decreaseIndent: "Decrease indent",
    superscript: "Superscript", subscript: "Subscript", insertLink: "Insert link", enterUrl: "Enter URL:", clearFormat: "Clear formatting",
    lineSpacing: "Line spacing",
    blockTypes: "Block Types", placeholder: "Press '/' to select a block type...",
    layoutGroupLabel: "Structure & Formatting",
    editorOnlyGroupLabel: "Editor only · invisible in layout",
    toAi: "To AI", copy: "Copy", toCard: "To Card", delete: "Delete",
    aiImprovement: "AI Text Improvement", comparisonDesc: "Comparison of original and improved text",
    original: "Original", improved: "Improved", reject: "Reject", accept: "Accept",
    processing: "Processing...", firstLineIndent: "First line indent",
    spellOff: "Off", spellBasic: "Basic", spellSmart: "Smart",
    spellCheck: "Spell Check", spellLang: "Language", spellErrors: "Errors",
    spellNoErrors: "No errors found", spellApply: "Apply", spellIgnore: "Ignore",
    spellChecking: "Checking...", spellMode: "Check mode"
  },
  ru: {
    improve: "Улучшить", expand: "Расширить", shorten: "Сократить", rephrase: "Переформулировать", example: "+ Пример", strengthen: "Усилить",
    noStyle: "Без стиля", academic: "Академический", literary: "Литературный", minimalist: "Минималистичный", philosophical: "Философский", journalistic: "Публицистичный",
    defaultFont: "Стандартный", monospace: "Моноширинный",
    text: "Текст", heading1: "Заголовок 1", heading2: "Заголовок 2", heading3: "Заголовок 3", quote: "Цитата",
    hypothesis: "Гипотеза", argument: "Аргумент", counterargument: "Контраргумент", idea: "Идея", question: "Вопрос",
    exampleBlock: "Пример", observation: "Наблюдение", research: "Исследование", sourceRef: "Источник", divider: "Разделитель",
    bulletItem: "Маркированный пункт", numberedItem: "Нумерованный пункт", checkItem: "Пункт чеклиста",
    bulletItemDesc: "Элемент маркированного списка", numberedItemDesc: "Элемент нумерованного списка", checkItemDesc: "Пункт с флажком",
    textDesc: "Обычный текст", heading1Desc: "Большой заголовок", heading2Desc: "Средний заголовок", heading3Desc: "Малый заголовок",
    quoteDesc: "Выделенная цитата", hypothesisDesc: "Предположение для проверки", argumentDesc: "Довод в пользу", counterargumentDesc: "Довод против",
    ideaDesc: "Внезапное озарение", questionDesc: "То, что нужно выяснить", exampleDesc: "Иллюстрация мысли",
    observationDesc: "Замеченный факт", researchDesc: "Данные исследований", sourceRefDesc: "Ссылка на источник", dividerDesc: "Горизонтальная линия",
    font: "Шрифт", size: "Размер", bold: "Жирный (Ctrl+B)", italic: "Курсив (Ctrl+I)", underline: "Подчёркнутый (Ctrl+U)", strikethrough: "Зачёркнутый",
    textColor: "Цвет текста", highlight: "Выделение цветом", removeHL: "Убрать",
    alignLeft: "По левому краю", alignCenter: "По центру", alignRight: "По правому краю", justify: "По ширине",
    bulletList: "Маркированный список", numberedList: "Нумерованный список", increaseIndent: "Увеличить отступ", decreaseIndent: "Уменьшить отступ",
    superscript: "Надстрочный", subscript: "Подстрочный", insertLink: "Вставить ссылку", enterUrl: "Введите URL:", clearFormat: "Сбросить форматирование",
    lineSpacing: "Межстрочный интервал",
    blockTypes: "Типы блоков", placeholder: "Нажмите '/' для выбора типа блока...",
    layoutGroupLabel: "Структура и оформление",
    editorOnlyGroupLabel: "Только редактор · не видно в вёрстке",
    toAi: "В AI", copy: "Копировать", toCard: "В карточку", delete: "Удалить",
    aiImprovement: "AI-улучшение текста", comparisonDesc: "Сравнение оригинального и улучшенного текста",
    original: "Оригинал", improved: "Улучшено", reject: "Отклонить", accept: "Принять",
    processing: "Обрабатываю...", firstLineIndent: "Красная строка",
    spellOff: "Выкл", spellBasic: "Базовый", spellSmart: "Умный",
    spellCheck: "Правописание", spellLang: "Язык", spellErrors: "Ошибки",
    spellNoErrors: "Ошибок не найдено", spellApply: "Применить", spellIgnore: "Пропустить",
    spellChecking: "Проверяю...", spellMode: "Режим проверки"
  },
  ua: {
    improve: "Поліпшити", expand: "Розширити", shorten: "Скоротити", rephrase: "Перефразувати", example: "+ Приклад", strengthen: "Посилити",
    noStyle: "Без стилю", academic: "Академічний", literary: "Літературний", minimalist: "Мінімалістичний", philosophical: "Філософський", journalistic: "Публіцистичний",
    defaultFont: "Стандартний", monospace: "Моноширинний",
    text: "Текст", heading1: "Заголовок 1", heading2: "Заголовок 2", heading3: "Заголовок 3", quote: "Цитата",
    hypothesis: "Гіпотеза", argument: "Аргумент", counterargument: "Контраргумент", idea: "Ідея", question: "Питання",
    exampleBlock: "Приклад", observation: "Спостереження", research: "Дослідження", sourceRef: "Джерело", divider: "Роздільник",
    bulletItem: "Маркований пункт", numberedItem: "Нумерований пункт", checkItem: "Пункт чеклисту",
    bulletItemDesc: "Елемент маркованого списку", numberedItemDesc: "Елемент нумерованого списку", checkItemDesc: "Пункт з прапорцем",
    textDesc: "Звичайний текст", heading1Desc: "Великий заголовок", heading2Desc: "Середній заголовок", heading3Desc: "Малий заголовок",
    quoteDesc: "Виділена цитата", hypothesisDesc: "Припущення для перевірки", argumentDesc: "Довід на користь", counterargumentDesc: "Довід проти",
    ideaDesc: "Раптове осяяння", questionDesc: "Те, що потрібно з'ясувати", exampleDesc: "Ілюстрація думки",
    observationDesc: "Помічений факт", researchDesc: "Дані досліджень", sourceRefDesc: "Посилання на джерело", dividerDesc: "Горизонтальна лінія",
    font: "Шрифт", size: "Розмір", bold: "Жирний (Ctrl+B)", italic: "Курсив (Ctrl+I)", underline: "Підкреслений (Ctrl+U)", strikethrough: "Закреслений",
    textColor: "Колір тексту", highlight: "Виділення кольором", removeHL: "Прибрати",
    alignLeft: "По лівому краю", alignCenter: "По центру", alignRight: "По правому краю", justify: "По ширині",
    bulletList: "Маркований список", numberedList: "Нумерований список", increaseIndent: "Збільшити відступ", decreaseIndent: "Зменшити відступ",
    superscript: "Надрядковий", subscript: "Підрядковий", insertLink: "Вставити посилання", enterUrl: "Введіть URL:", clearFormat: "Скинути форматування",
    lineSpacing: "Міжрядковий інтервал",
    blockTypes: "Типи блоків", placeholder: "Натисніть '/' для вибору типу блоку...",
    layoutGroupLabel: "Структура та оформлення",
    editorOnlyGroupLabel: "Тільки редактор · невидиме у вёрстці",
    toAi: "До AI", copy: "Копіювати", toCard: "До картки", delete: "Видалити",
    aiImprovement: "AI-поліпшення тексту", comparisonDesc: "Порівняння оригінального та поліпшеного тексту",
    original: "Оригінал", improved: "Поліпшено", reject: "Відхилити", accept: "Прийняти",
    processing: "Обробляю...", firstLineIndent: "Червоний рядок",
    spellOff: "Вимкн", spellBasic: "Базовий", spellSmart: "Розумний",
    spellCheck: "Правопис", spellLang: "Мова", spellErrors: "Помилки",
    spellNoErrors: "Помилок не знайдено", spellApply: "Застосувати", spellIgnore: "Пропустити",
    spellChecking: "Перевіряю...", spellMode: "Режим перевірки"
  },
  de: {
    improve: "Verbessern", expand: "Erweitern", shorten: "Kürzen", rephrase: "Umformulieren", example: "+ Beispiel", strengthen: "Verstärken",
    noStyle: "Kein Stil", academic: "Akademisch", literary: "Literarisch", minimalist: "Minimalistisch", philosophical: "Philosophisch", journalistic: "Journalistisch",
    defaultFont: "Standard", monospace: "Monospace",
    text: "Text", heading1: "Überschrift 1", heading2: "Überschrift 2", heading3: "Überschrift 3", quote: "Zitat",
    hypothesis: "Hypothese", argument: "Argument", counterargument: "Gegenargument", idea: "Idee", question: "Frage",
    exampleBlock: "Beispiel", observation: "Beobachtung", research: "Forschung", sourceRef: "Quelle", divider: "Trennlinie",
    bulletItem: "Aufzählungspunkt", numberedItem: "Nummerierter Punkt", checkItem: "Checklisten-Element",
    bulletItemDesc: "Element einer Aufzählungsliste", numberedItemDesc: "Element einer nummerierten Liste", checkItemDesc: "Element mit Kontrollkästchen",
    textDesc: "Normaler Text", heading1Desc: "Große Überschrift", heading2Desc: "Mittlere Überschrift", heading3Desc: "Kleine Überschrift",
    quoteDesc: "Hervorgehobenes Zitat", hypothesisDesc: "Annahme zur Prüfung", argumentDesc: "Argument dafür", counterargumentDesc: "Argument dagegen",
    ideaDesc: "Plötzliche Erkenntnis", questionDesc: "Zu klärender Punkt", exampleDesc: "Gedankenillustration",
    observationDesc: "Beobachtete Tatsache", researchDesc: "Forschungsdaten", sourceRefDesc: "Quellenverweis", dividerDesc: "Horizontale Linie",
    font: "Schriftart", size: "Größe", bold: "Fett (Strg+B)", italic: "Kursiv (Strg+I)", underline: "Unterstrichen (Strg+U)", strikethrough: "Durchgestrichen",
    textColor: "Textfarbe", highlight: "Hervorheben", removeHL: "Entfernen",
    alignLeft: "Linksbündig", alignCenter: "Zentriert", alignRight: "Rechtsbündig", justify: "Blocksatz",
    bulletList: "Aufzählungsliste", numberedList: "Nummerierte Liste", increaseIndent: "Einzug vergrößern", decreaseIndent: "Einzug verkleinern",
    superscript: "Hochgestellt", subscript: "Tiefgestellt", insertLink: "Link einfügen", enterUrl: "URL eingeben:", clearFormat: "Formatierung löschen",
    lineSpacing: "Zeilenabstand",
    blockTypes: "Blocktypen", placeholder: "Drücken Sie '/' um einen Blocktyp zu wählen...",
    layoutGroupLabel: "Struktur & Formatierung",
    editorOnlyGroupLabel: "Nur Editor · im Layout unsichtbar",
    toAi: "Zur KI", copy: "Kopieren", toCard: "Zur Karte", delete: "Löschen",
    aiImprovement: "KI-Textverbesserung", comparisonDesc: "Vergleich von Original- und verbessertem Text",
    original: "Original", improved: "Verbessert", reject: "Ablehnen", accept: "Annehmen",
    processing: "Verarbeite...", firstLineIndent: "Erstzeileneinzug",
    spellOff: "Aus", spellBasic: "Basis", spellSmart: "Smart",
    spellCheck: "Rechtschreibung", spellLang: "Sprache", spellErrors: "Fehler",
    spellNoErrors: "Keine Fehler gefunden", spellApply: "Anwenden", spellIgnore: "Ignorieren",
    spellChecking: "Prüfe...", spellMode: "Prüfmodus"
  },
};

const BLOCK_TYPE_I18N_MAP: Record<string, { labelKey: string; descKey: string }> = {
  paragraph: { labelKey: "text", descKey: "textDesc" },
  h1: { labelKey: "heading1", descKey: "heading1Desc" },
  h2: { labelKey: "heading2", descKey: "heading2Desc" },
  h3: { labelKey: "heading3", descKey: "heading3Desc" },
  quote: { labelKey: "quote", descKey: "quoteDesc" },
  bullet_item: { labelKey: "bulletItem", descKey: "bulletItemDesc" },
  numbered_item: { labelKey: "numberedItem", descKey: "numberedItemDesc" },
  check_item: { labelKey: "checkItem", descKey: "checkItemDesc" },
  hypothesis: { labelKey: "hypothesis", descKey: "hypothesisDesc" },
  argument: { labelKey: "argument", descKey: "argumentDesc" },
  counterargument: { labelKey: "counterargument", descKey: "counterargumentDesc" },
  idea: { labelKey: "idea", descKey: "ideaDesc" },
  question: { labelKey: "question", descKey: "questionDesc" },
  example: { labelKey: "exampleBlock", descKey: "exampleDesc" },
  observation: { labelKey: "observation", descKey: "observationDesc" },
  research: { labelKey: "research", descKey: "researchDesc" },
  source_ref: { labelKey: "sourceRef", descKey: "sourceRefDesc" },
  divider: { labelKey: "divider", descKey: "dividerDesc" },
};

const AI_IMPROVE_MODES = [
  { id: "improve",    key: "improve" },
  { id: "expand",     key: "expand" },
  { id: "shorten",    key: "shorten" },
  { id: "rephrase",   key: "rephrase" },
  { id: "example",    key: "example" },
  { id: "strengthen", key: "strengthen" },
] as const;

const AI_STYLES = [
  { id: "",              key: "noStyle" },
  { id: "academic",      key: "academic" },
  { id: "literary",      key: "literary" },
  { id: "minimalist",    key: "minimalist" },
  { id: "philosophical", key: "philosophical" },
  { id: "journalistic",  key: "journalistic" },
] as const;

const FONT_FAMILIES = [
  { value: "",                                    label: "Crimson Pro", key: "defaultFont" },
  { value: "Crimson Pro, Georgia, serif",         label: "Crimson Pro" },
  { value: "Georgia, serif",                      label: "Georgia" },
  { value: "'Times New Roman', Times, serif",     label: "Times New Roman" },
  { value: "Garamond, serif",                     label: "Garamond" },
  { value: "Arial, sans-serif",                   label: "Arial" },
  { value: "'Helvetica Neue', Helvetica, sans-serif", label: "Helvetica" },
  { value: "'SF Mono', ui-monospace, monospace",  label: "Monospace", key: "monospace" },
];

const FONT_SIZES = [
  { value: "1", label: "10" },
  { value: "2", label: "13" },
  { value: "3", label: "16" },
  { value: "4", label: "18" },
  { value: "5", label: "24" },
  { value: "6", label: "32" },
  { value: "7", label: "48" },
];

const TEXT_COLORS = [
  "#1C1C1E","#3A3A3C","#636366","#8E8E93","#AEAEB2",
  "#FF3B30","#FF9500","#FFCC00","#34C759","#30B0C7",
  "#007AFF","#5856D6","#AF52DE","#FF2D55","#FF6B35",
];

const HIGHLIGHT_COLORS = [
  "","#FFF3CD","#D1ECF1","#D4EDDA","#F8D7DA",
  "#E8D5F5","#CCE5FF","#FFE8CC","#E2F4EC","#FDD5D7",
];

const LINE_SPACINGS = [
  { value: "1",     label: "1.0" },
  { value: "1.3",   label: "1.3" },
  { value: "1.5",   label: "1.5" },
  { value: "1.625", label: "1.6" },
  { value: "2",     label: "2.0" },
  { value: "2.5",   label: "2.5" },
];

function FormatToolbar({
  visible,
  lineSpacing,
  onLineSpacingChange,
  spellMode,
  spellLang,
  onSpellModeChange,
  onSpellLangChange,
  spellMatchCount,
  spellIsChecking,
}: {
  visible: boolean;
  lineSpacing: string;
  onLineSpacingChange: (v: string) => void;
  spellMode?: SpellCheckMode;
  spellLang?: SpellCheckLang;
  onSpellModeChange?: (m: SpellCheckMode) => void;
  onSpellLangChange?: (l: SpellCheckLang) => void;
  spellMatchCount?: number;
  spellIsChecking?: boolean;
}) {
  const { lang } = useLang();
  const s = BLOCK_EDITOR_I18N[lang] || BLOCK_EDITOR_I18N.en;
  const [formats, setFormats] = useState({
    bold: false, italic: false, underline: false, strikeThrough: false,
    justifyLeft: true, justifyCenter: false, justifyRight: false, justifyFull: false,
    insertOrderedList: false, insertUnorderedList: false,
    superscript: false, subscript: false,
  });
  const [fontFamily, setFontFamily] = useState("");
  const [showTextColors, setShowTextColors] = useState(false);
  const [showHighlightColors, setShowHighlightColors] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("https://");
  const colorRef = useRef<HTMLDivElement>(null);
  const hlRef = useRef<HTMLDivElement>(null);
  const linkRef = useRef<HTMLDivElement>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);
  const savedRange = useRef<Range | null>(null);
  const lastFocusedEl = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const handleFocus = (e: FocusEvent) => {
      const el = e.target as HTMLElement;
      if (el.contentEditable === "true") lastFocusedEl.current = el;
    };
    document.addEventListener("focusin", handleFocus);
    return () => document.removeEventListener("focusin", handleFocus);
  }, []);

  useEffect(() => {
    const handleSel = () => {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        savedRange.current = sel.getRangeAt(0).cloneRange();
      }
    };
    document.addEventListener("selectionchange", handleSel);
    return () => document.removeEventListener("selectionchange", handleSel);
  }, []);

  const restoreSelection = () => {
    if (lastFocusedEl.current) lastFocusedEl.current.focus();
    if (!savedRange.current) return;
    const sel = window.getSelection();
    if (sel) { sel.removeAllRanges(); sel.addRange(savedRange.current); }
  };

  const updateFormats = () => {
    try {
      setFormats({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        strikeThrough: document.queryCommandState("strikeThrough"),
        justifyLeft: document.queryCommandState("justifyLeft"),
        justifyCenter: document.queryCommandState("justifyCenter"),
        justifyRight: document.queryCommandState("justifyRight"),
        justifyFull: document.queryCommandState("justifyFull"),
        insertOrderedList: document.queryCommandState("insertOrderedList"),
        insertUnorderedList: document.queryCommandState("insertUnorderedList"),
        superscript: document.queryCommandState("superscript"),
        subscript: document.queryCommandState("subscript"),
      });
      const fn = document.queryCommandValue("fontName");
      if (fn) setFontFamily(fn.replace(/['"]/g, ""));
    } catch {}
  };

  const cmd = (command: string, value?: string) => {
    restoreSelection();
    document.execCommand(command, false, value);
    setTimeout(updateFormats, 0);
  };

  useEffect(() => {
    document.addEventListener("selectionchange", updateFormats);
    return () => document.removeEventListener("selectionchange", updateFormats);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (colorRef.current && !colorRef.current.contains(e.target as Node)) setShowTextColors(false);
      if (hlRef.current && !hlRef.current.contains(e.target as Node)) setShowHighlightColors(false);
      if (linkRef.current && !linkRef.current.contains(e.target as Node)) setShowLinkInput(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  useEffect(() => {
    if (showLinkInput) setTimeout(() => linkInputRef.current?.focus(), 50);
  }, [showLinkInput]);

  const fmtBtn = (active: boolean, title: string, onClick: () => void, children: ReactNode) => (
    <button
      title={title}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      className={cn(
        "h-7 w-7 flex items-center justify-center rounded-lg transition-colors text-sm font-medium",
        active
          ? "bg-primary/15 text-primary"
          : "text-muted-foreground hover:bg-accent/70 hover:text-foreground"
      )}
    >
      {children}
    </button>
  );

  const Sep = () => <div className="w-px h-4 bg-border/50 mx-0.5 flex-shrink-0" />;

  if (!visible) return null;

  return (
    <div className="sticky top-2 z-30 flex justify-center px-3 mb-3 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-0.5 flex-wrap px-2.5 py-1.5 rounded-2xl border border-border/50 bg-background/96 backdrop-blur-md shadow-lg shadow-black/[0.08] ring-1 ring-white/5">
        {fmtBtn(false, "Отменить (Ctrl+Z)", () => cmd("undo"), <Undo2 className="h-3.5 w-3.5" />)}
        {fmtBtn(false, "Повторить (Ctrl+Y)", () => cmd("redo"), <Redo2 className="h-3.5 w-3.5" />)}

        <Sep />

        <select
          value={fontFamily}
          onChange={e => { const v = e.target.value; setFontFamily(v); if (v) { restoreSelection(); cmd("fontName", v); } }}
          onMouseDown={e => e.stopPropagation()}
          className="h-7 text-xs text-foreground bg-transparent border border-border/40 rounded-lg px-1.5 pr-5 appearance-none cursor-pointer hover:border-primary/50 transition-colors min-w-[100px]"
          title={s.font}
        >
          {FONT_FAMILIES.map(f => (
            <option key={f.value} value={f.value} style={{ fontFamily: f.value || "inherit" }}>{f.key ? s[f.key as keyof typeof s] || f.label : f.label}</option>
          ))}
        </select>

        <Sep />

        {fmtBtn(formats.bold, s.bold, () => cmd("bold"), <Bold className="h-3.5 w-3.5" />)}
        {fmtBtn(formats.italic, s.italic, () => cmd("italic"), <Italic className="h-3.5 w-3.5" />)}
        {fmtBtn(formats.underline, s.underline, () => cmd("underline"), <Underline className="h-3.5 w-3.5" />)}
        {fmtBtn(formats.strikeThrough, s.strikethrough, () => cmd("strikeThrough"), <Strikethrough className="h-3.5 w-3.5" />)}

        <Sep />

        <div ref={colorRef} className="relative">
          <button
            title={s.textColor}
            onMouseDown={(e) => { e.preventDefault(); setShowTextColors(v => !v); setShowHighlightColors(false); setShowLinkInput(false); }}
            className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-accent/70 transition-colors"
          >
            <Palette className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          {showTextColors && (
            <div className="absolute top-full left-0 mt-2 p-2 bg-background border border-border rounded-2xl shadow-xl z-50 grid grid-cols-5 gap-1 w-32">
              {TEXT_COLORS.map(c => (
                <button
                  key={c}
                  onMouseDown={(e) => { e.preventDefault(); restoreSelection(); cmd("foreColor", c); setShowTextColors(false); }}
                  className="w-5 h-5 rounded-full border border-border/40 hover:scale-110 transition-transform"
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
          )}
        </div>

        <div ref={hlRef} className="relative">
          <button
            title={s.highlight}
            onMouseDown={(e) => { e.preventDefault(); setShowHighlightColors(v => !v); setShowTextColors(false); setShowLinkInput(false); }}
            className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-accent/70 transition-colors"
          >
            <Highlighter className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          {showHighlightColors && (
            <div className="absolute top-full left-0 mt-2 p-2 bg-background border border-border rounded-2xl shadow-xl z-50 grid grid-cols-5 gap-1 w-36">
              {HIGHLIGHT_COLORS.map(c => (
                <button
                  key={c}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    restoreSelection();
                    if (c) cmd("backColor", c); else cmd("removeFormat");
                    setShowHighlightColors(false);
                  }}
                  className={cn(
                    "w-5 h-5 rounded border hover:scale-110 transition-transform",
                    c ? "border-border/40" : "border-dashed border-border flex items-center justify-center"
                  )}
                  style={{ backgroundColor: c || "transparent" }}
                  title={c || s.removeHL}
                >
                  {!c && <span className="text-[8px] text-muted-foreground">✕</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <Sep />

        {fmtBtn(formats.justifyLeft, s.alignLeft, () => cmd("justifyLeft"), <AlignLeft className="h-3.5 w-3.5" />)}
        {fmtBtn(formats.justifyCenter, s.alignCenter, () => cmd("justifyCenter"), <AlignCenter className="h-3.5 w-3.5" />)}
        {fmtBtn(formats.justifyRight, s.alignRight, () => cmd("justifyRight"), <AlignRight className="h-3.5 w-3.5" />)}
        {fmtBtn(formats.justifyFull, s.justify, () => cmd("justifyFull"), <AlignJustify className="h-3.5 w-3.5" />)}

        <Sep />

        {fmtBtn(formats.superscript, s.superscript, () => cmd("superscript"), <Superscript className="h-3.5 w-3.5" />)}
        {fmtBtn(formats.subscript, s.subscript, () => cmd("subscript"), <Subscript className="h-3.5 w-3.5" />)}

        <Sep />

        <div ref={linkRef} className="relative">
          <button
            title={s.insertLink}
            onMouseDown={(e) => {
              e.preventDefault();
              setShowLinkInput(v => !v);
              setShowTextColors(false);
              setShowHighlightColors(false);
              setLinkUrl("https://");
            }}
            className={cn(
              "h-7 w-7 flex items-center justify-center rounded-lg transition-colors",
              showLinkInput ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-accent/70 hover:text-foreground"
            )}
          >
            <Link2 className="h-3.5 w-3.5" />
          </button>
          {showLinkInput && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-background border border-border/60 rounded-2xl shadow-xl p-2 flex gap-1.5 min-w-[240px]">
              <input
                ref={linkInputRef}
                type="url"
                value={linkUrl}
                onChange={e => setLinkUrl(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const url = linkUrl.trim();
                    if (url && url !== "https://") { restoreSelection(); cmd("createLink", url); }
                    setShowLinkInput(false);
                  }
                  if (e.key === "Escape") setShowLinkInput(false);
                }}
                placeholder="https://..."
                className="flex-1 text-xs border border-border/40 rounded-xl px-2.5 py-1.5 outline-none focus:border-primary/50 bg-muted/40"
              />
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  const url = linkUrl.trim();
                  if (url && url !== "https://") { restoreSelection(); cmd("createLink", url); }
                  setShowLinkInput(false);
                }}
                className="px-2.5 py-1 text-xs font-semibold rounded-xl bg-primary/15 text-primary hover:bg-primary/25 transition-colors whitespace-nowrap"
              >
                OK
              </button>
            </div>
          )}
        </div>

        {fmtBtn(false, s.clearFormat, () => cmd("removeFormat"), <RemoveFormatting className="h-3.5 w-3.5" />)}

        {onSpellModeChange && (
          <>
            <Sep />
            <SpellCheckWidget
              mode={spellMode ?? "basic"}
              lang={spellLang ?? "auto"}
              onModeChange={onSpellModeChange}
              onLangChange={onSpellLangChange!}
              matchCount={spellMatchCount ?? 0}
              isChecking={spellIsChecking ?? false}
              s={s}
            />
          </>
        )}
      </div>
    </div>
  );
}

const SPELL_LANGS: SpellCheckLang[] = ["auto", "en-US", "ru-RU", "uk-UA", "de-DE"];
const SPELL_MODES: SpellCheckMode[] = ["off", "basic", "smart"];

function SpellCheckWidget({
  mode, lang, onModeChange, onLangChange, matchCount, isChecking, s,
}: {
  mode: SpellCheckMode;
  lang: SpellCheckLang;
  onModeChange: (m: SpellCheckMode) => void;
  onLangChange: (l: SpellCheckLang) => void;
  matchCount: number;
  isChecking: boolean;
  s: Record<string, string>;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const modeLabel: Record<SpellCheckMode, string> = {
    off: s.spellOff, basic: s.spellBasic, smart: s.spellSmart,
  };

  const modeColor: Record<SpellCheckMode, string> = {
    off: "#9ca3af",
    basic: "#6366f1",
    smart: mode === "smart" && matchCount > 0 ? "#ef4444" : "#10b981",
  };

  return (
    <div ref={ref} className="relative">
      <button
        title={s.spellCheck}
        onMouseDown={(e) => { e.preventDefault(); setOpen(v => !v); }}
        className={cn(
          "flex items-center gap-1 h-7 px-2 rounded-lg text-[11px] font-semibold transition-colors",
          open ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-accent/70 hover:text-foreground"
        )}
      >
        <span style={{ fontFamily: "monospace", fontSize: "13px", lineHeight: 1 }}>ABC</span>
        <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: modeColor[mode] }}>
          {modeLabel[mode]}
        </span>
        {mode === "smart" && isChecking && (
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
        )}
        {mode === "smart" && !isChecking && matchCount > 0 && (
          <span className="flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold text-white"
            style={{ background: "#ef4444", minWidth: "1rem" }}>
            {matchCount > 9 ? "9+" : matchCount}
          </span>
        )}
        {mode === "smart" && !isChecking && matchCount === 0 && (
          <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
        )}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 z-50 bg-background border border-border/60 rounded-2xl shadow-xl p-3 min-w-[220px]"
          style={{ maxHeight: "340px", overflowY: "auto" }}>
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-2">{s.spellMode}</div>
          <div className="flex gap-1 mb-3">
            {SPELL_MODES.map(m => (
              <button key={m} onMouseDown={e => { e.preventDefault(); onModeChange(m); }}
                className={cn("flex-1 py-1 rounded-lg text-[11px] font-semibold transition-colors",
                  mode === m ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-accent/70"
                )}>
                {modeLabel[m]}
              </button>
            ))}
          </div>

          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-2">{s.spellLang}</div>
          <div className="flex gap-1 flex-wrap mb-3">
            {SPELL_LANGS.map(l => (
              <button key={l} onMouseDown={e => { e.preventDefault(); onLangChange(l); }}
                className={cn("px-2 py-0.5 rounded-lg text-[11px] font-semibold transition-colors",
                  lang === l ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-accent/70"
                )}
                title={LANG_FULL_LABELS[l]}>
                {LANG_LABELS[l]}
              </button>
            ))}
          </div>


          {mode === "smart" && (
            <div className="border-t border-border/30 pt-2 mt-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-1.5">{s.spellErrors}</div>
              {isChecking ? (
                <div className="text-[11px] text-muted-foreground/60 italic">{s.spellChecking}</div>
              ) : matchCount === 0 ? (
                <div className="text-[11px] text-green-600 flex items-center gap-1">
                  <span>✓</span> {s.spellNoErrors}
                </div>
              ) : (
                <div className="text-[11px] text-muted-foreground">
                  {matchCount} {s.spellErrors.toLowerCase()}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export type BlockType =
  | "paragraph"
  | "h1"
  | "h2"
  | "h3"
  | "quote"
  | "bullet_item"
  | "numbered_item"
  | "check_item"
  | "hypothesis"
  | "argument"
  | "counterargument"
  | "idea"
  | "question"
  | "example"
  | "observation"
  | "research"
  | "source_ref"
  | "divider";

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  metadata?: any;
}

interface BlockEditorProps {
  initialContent: string;
  onChange: (blocks: Block[]) => void;
  placeholder?: string;
  hideControls?: boolean;
  hideFormattingToolbar?: boolean;
  bookTitle?: string;
  bookMode?: string;
  firstLineIndent?: number;
  onMounted?: (api: BlockEditorAPI) => void;
}

export type BlockEditorAPI = {
  replaceTextInBlocks: (original: string, replacement: string) => boolean;
  appendBlock: (content: string, type?: string) => void;
};

const LAYOUT_BLOCK_TYPES: { type: BlockType; icon: any }[] = [
  { type: "paragraph", icon: Type },
  { type: "h1", icon: Heading1 },
  { type: "h2", icon: Heading2 },
  { type: "h3", icon: Heading3 },
  { type: "quote", icon: Quote },
  { type: "bullet_item", icon: List },
  { type: "numbered_item", icon: ListOrdered },
  { type: "check_item", icon: CheckSquare },
  { type: "hypothesis", icon: AlertCircle },
  { type: "argument", icon: CheckCircle2 },
  { type: "counterargument", icon: XCircle },
  { type: "idea", icon: Lightbulb },
  { type: "question", icon: HelpCircle },
  { type: "divider", icon: Minus },
];

const EDITOR_ONLY_BLOCK_TYPES: { type: BlockType; icon: any }[] = [
  { type: "example", icon: Info },
  { type: "observation", icon: Search },
  { type: "research", icon: MessageSquare },
  { type: "source_ref", icon: LinkIcon },
];

const BLOCK_TYPES = [...LAYOUT_BLOCK_TYPES, ...EDITOR_ONLY_BLOCK_TYPES];

function generateId() {
  return Math.random().toString(36).substring(2, 11);
}

function parseInitialContent(content: string): Block[] {
  if (!content) return [{ id: generateId(), type: "paragraph", content: "" }];
  try {
    if (content.trim().startsWith("[")) {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    // Fallback to single paragraph
  }
  return [{ id: generateId(), type: "paragraph", content }];
}

interface SelectionBar {
  x: number; y: number;
  text: string;
  blockId: string;
}
interface ImprovementResult {
  original: string;
  improved: string;
  blockId: string;
}

export function BlockEditor({ initialContent, onChange, hideControls, hideFormattingToolbar, bookTitle, bookMode, firstLineIndent, onMounted }: BlockEditorProps) {
  const [blocks, setBlocks] = useState<Block[]>(() => parseInitialContent(initialContent));
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  const [selectionBar, setSelectionBar] = useState<SelectionBar | null>(null);
  const [selectedStyle, setSelectedStyle] = useState("");
  const [isImproving, setIsImproving] = useState(false);
  const [improvementResult, setImprovementResult] = useState<ImprovementResult | null>(null);
  const [freeGateOpen, setFreeGateOpen] = useState(false);
  const [lineSpacing, setLineSpacing] = useState("1.625");
  const containerRef = useRef<HTMLDivElement>(null);
  const cursorTargetRef = useRef<{ blockId: string; offset: number } | null>(null);
  const { isFreeMode } = useFreeMode();
  const { lang } = useLang();
  const s = BLOCK_EDITOR_I18N[lang] || BLOCK_EDITOR_I18N.en;
  const [, setLocation] = useLocation();
  const spellCheck = useSpellCheck();
  const { toast } = useToast();

  // Expose imperative API to parent via onMounted callback
  const onMountedRef = useRef(onMounted);
  onMountedRef.current = onMounted;
  useEffect(() => {
    const api: BlockEditorAPI = {
      replaceTextInBlocks: (original: string, replacement: string): boolean => {
        let replaced = false;
        // First try direct DOM update for immediate visual feedback
        // Query all block content elements regardless of contenteditable state
        const allContentEls = containerRef.current?.querySelectorAll("[data-testid^='block-content-']");
        allContentEls?.forEach((el) => {
          if (replaced) return;
          const htmlEl = el as HTMLElement;
          if (htmlEl.innerText?.includes(original)) {
            htmlEl.innerText = htmlEl.innerText.replace(original, replacement);
            replaced = true;
          } else if (htmlEl.innerHTML.includes(original)) {
            htmlEl.innerHTML = htmlEl.innerHTML.replace(original, replacement);
            replaced = true;
          }
        });
        // Also update React blocks state so onChange + autosave fire
        setBlocks(prev => {
          let stateReplaced = false;
          const updated = prev.map(block => {
            if (!stateReplaced && block.content && block.content.includes(original)) {
              stateReplaced = true;
              return { ...block, content: block.content.replace(original, replacement) };
            }
            return block;
          });
          if (stateReplaced) {
            onChange(updated);
            return updated;
          }
          // fallback: append as new paragraph if not found
          if (!replaced) {
            const newBlock = { id: Math.random().toString(36).substring(2, 11), type: "paragraph" as const, content: replacement };
            const appended = [...prev, newBlock];
            onChange(appended);
            replaced = true;
            return appended;
          }
          return prev;
        });
        return replaced;
      },
      appendBlock: (content: string, type = "paragraph"): void => {
        const newBlock = { id: Math.random().toString(36).substring(2, 11), type: type as any, content };
        setBlocks(prev => {
          const appended = [...prev, newBlock];
          onChange(appended);
          return appended;
        });
      },
    };
    onMountedRef.current?.(api);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (hideControls) return;
    setTimeout(() => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.toString().trim()) {
        return;
      }
      const selectedText = sel.toString().trim();
      if (selectedText.length < 3) return;

      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return;

      let node: Node | null = range.commonAncestorContainer;
      let blockId = "";
      while (node && node !== containerRef.current) {
        if (node instanceof HTMLElement) {
          const id = node.getAttribute("data-block-id");
          if (id) { blockId = id; break; }
        }
        node = node.parentNode;
      }

      setSelectionBar({
        x: rect.left - containerRect.left + rect.width / 2,
        y: rect.top - containerRect.top - 8,
        text: selectedText,
        blockId,
      });
    }, 10);
  }, [hideControls]);

  const dismissSelection = useCallback(() => setSelectionBar(null), []);

  const callImprove = useCallback(async (mode: string) => {
    if (!selectionBar) return;
    if (isFreeMode) {
      setSelectionBar(null);
      setFreeGateOpen(true);
      return;
    }
    setIsImproving(true);
    try {
      const resp = await fetch("/api/ai/improve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: selectionBar.text,
          mode,
          style: selectedStyle,
          bookTitle: bookTitle || "",
          bookMode: bookMode || "scientific",
        }),
      });
      const data = await resp.json();
      setImprovementResult({
        original: data.original || selectionBar.text,
        improved: data.improved || "",
        blockId: selectionBar.blockId,
      });
      setSelectionBar(null);
    } catch {
      setSelectionBar(null);
    } finally {
      setIsImproving(false);
    }
  }, [selectionBar, selectedStyle, bookTitle, bookMode]);

  const acceptImprovement = useCallback(() => {
    if (!improvementResult) return;
    const { blockId, improved, original } = improvementResult;

    const blockEl = containerRef.current?.querySelector(`[data-block-id="${blockId}"]`);
    const editableEl = blockEl?.querySelector('[contenteditable="true"]') as HTMLElement | null;

    let newContent: string;
    if (editableEl) {
      const currentHtml = editableEl.innerHTML;
      if (currentHtml.includes(original)) {
        // Replace only the original selected text in HTML (works for plain text and simple inline markup)
        newContent = currentHtml.replace(original, improved);
      } else if (editableEl.innerText?.includes(original)) {
        // Fallback: replace in plain text (loses inline formatting but correct)
        newContent = editableEl.innerText.replace(original, improved);
      } else {
        // Last fallback: replace whole block
        newContent = improved;
      }
      editableEl.innerHTML = newContent;
    } else {
      newContent = improved;
    }

    setBlocks(prev => {
      const updated = prev.map(b => b.id === blockId ? { ...b, content: newContent } : b);
      onChange(updated);
      return updated;
    });
    setImprovementResult(null);
  }, [improvementResult, onChange]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const updateBlocks = useCallback((newBlocks: Block[]) => {
    setBlocks(newBlocks);
    onChange(newBlocks);
  }, [onChange]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over, delta } = event;
    if (!over) return;

    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const activeBlock = blocks[oldIndex];
    if (!activeBlock) return;

    const currentLevel = activeBlock.metadata?.indentLevel ?? 0;
    const HORIZONTAL_THRESHOLD = 60;

    // Detect horizontal drag → indent/outdent
    if (Math.abs(delta.x) > HORIZONTAL_THRESHOLD && active.id === over.id) {
      const newLevel = delta.x > 0
        ? Math.min(3, currentLevel + 1)
        : Math.max(0, currentLevel - 1);
      if (newLevel !== currentLevel) {
        const newBlocks = blocks.map(b =>
          b.id === active.id
            ? { ...b, metadata: { ...b.metadata, indentLevel: newLevel } }
            : b
        );
        updateBlocks(newBlocks);
      }
      return;
    }

    if (active.id !== over.id) {
      const newIndex = blocks.findIndex((b) => b.id === over.id);
      // Determine new indent level based on horizontal offset
      const targetBlock = blocks[newIndex];
      let newLevel = currentLevel;
      if (delta.x > HORIZONTAL_THRESHOLD) {
        const blockAbove = blocks[newIndex - 1] || blocks[newIndex];
        newLevel = Math.min(3, (blockAbove?.metadata?.indentLevel ?? 0) + 1);
      } else if (delta.x < -HORIZONTAL_THRESHOLD) {
        newLevel = Math.max(0, currentLevel - 1);
      }

      // Collect children: all consecutive blocks with strictly higher indentLevel
      const parentLevel = currentLevel;
      let groupSize = 1;
      for (let i = oldIndex + 1; i < blocks.length; i++) {
        if ((blocks[i].metadata?.indentLevel ?? 0) > parentLevel) groupSize++;
        else break;
      }

      const levelDelta = newLevel - currentLevel;
      let arr = [...blocks];
      const group = arr.splice(oldIndex, groupSize).map((b, gi) => {
        if (gi === 0) return { ...b, metadata: { ...b.metadata, indentLevel: newLevel } };
        const childLevel = b.metadata?.indentLevel ?? 0;
        return { ...b, metadata: { ...b.metadata, indentLevel: Math.max(0, Math.min(3, childLevel + levelDelta)) } };
      });
      const dest = newIndex > oldIndex ? newIndex - groupSize + 1 : newIndex;
      arr.splice(Math.max(0, dest), 0, ...group);
      updateBlocks(arr);
    }
  };

  const addBlock = (index: number, type: BlockType = "paragraph", content = "", indentLevel = 0) => {
    if (hideControls) return;
    const newBlock: Block = {
      id: generateId(), type, content,
      ...(indentLevel > 0 ? { metadata: { indentLevel } } : {}),
    };
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, newBlock);
    updateBlocks(newBlocks);
    setFocusedBlockId(newBlock.id);
  };

  const deleteBlock = (id: string) => {
    if (hideControls) return;
    if (blocks.length <= 1) {
      const newBlocks = [{ id: generateId(), type: "paragraph" as BlockType, content: "" }];
      updateBlocks(newBlocks);
      setFocusedBlockId(newBlocks[0].id);
      return;
    }
    const index = blocks.findIndex(b => b.id === id);
    const newBlocks = blocks.filter(b => b.id !== id);
    updateBlocks(newBlocks);
    if (index > 0) {
      setFocusedBlockId(newBlocks[index - 1].id);
    } else if (newBlocks.length > 0) {
      setFocusedBlockId(newBlocks[0].id);
    }
  };

  const updateBlockContent = (id: string, content: string) => {
    if (hideControls) return;
    updateBlocks(blocks.map(b => b.id === id ? { ...b, content } : b));
    // Re-run spell check as user types so autocorrect matches stay current
    if (spellCheck.mode === "smart" && id === focusedBlockId) {
      spellCheck.check(content);
    }
  };

  const splitBlock = (id: string, index: number, beforeContent: string, afterContent: string, indentLevel = 0) => {
    if (hideControls) return;
    const newBlock: Block = {
      id: generateId(), type: "paragraph", content: afterContent,
      ...(indentLevel > 0 ? { metadata: { indentLevel } } : {}),
    };
    const updated = blocks.map(b => b.id === id ? { ...b, content: beforeContent } : b);
    updated.splice(index + 1, 0, newBlock);
    updateBlocks(updated);
    setFocusedBlockId(newBlock.id);
  };

  const updateBlockType = (id: string, type: BlockType) => {
    if (hideControls) return;
    updateBlocks(blocks.map(b => b.id === id ? { ...b, type } : b));
  };

  const updateBlockMetadata = (id: string, metadata: any) => {
    if (hideControls) return;
    updateBlocks(blocks.map(b => b.id === id ? { ...b, metadata } : b));
  };

  const mergeWithPrevious = useCallback((blockId: string, currentContent: string) => {
    if (hideControls) return;
    const idx = blocks.findIndex(b => b.id === blockId);
    if (idx <= 0) return;
    const prevBlock = blocks[idx - 1];
    const prevTextLen = prevBlock.content.replace(/<[^>]*>/g, "").length;
    const mergedContent = prevBlock.content + currentContent;
    const newPrevId = generateId();
    cursorTargetRef.current = { blockId: newPrevId, offset: prevTextLen };
    const newBlocks = blocks
      .map(b => b.id === prevBlock.id ? { ...b, id: newPrevId, content: mergedContent } : b)
      .filter(b => b.id !== blockId);
    setBlocks(newBlocks);
    updateBlocks(newBlocks);
    setFocusedBlockId(newPrevId);
  }, [blocks, hideControls, updateBlocks]);

  const handlePasteBlocks = useCallback((blockId: string, paragraphs: string[]) => {
    if (hideControls || paragraphs.length === 0) return;
    const index = blocks.findIndex(b => b.id === blockId);
    if (index === -1) return;
    const newBlocks = [...blocks];
    newBlocks[index] = { ...newBlocks[index], content: paragraphs[0] };
    const extra = paragraphs.slice(1).map(p => ({ id: generateId(), type: "paragraph" as BlockType, content: p }));
    newBlocks.splice(index + 1, 0, ...extra);
    updateBlocks(newBlocks);
    if (extra.length > 0) setFocusedBlockId(extra[extra.length - 1].id);
    // Sync DOM for the first block
    setTimeout(() => {
      const el = document.querySelector(`[data-block-id="${newBlocks[index].id}"] [contenteditable]`) as HTMLElement | null;
      if (el) el.innerHTML = paragraphs[0];
    }, 0);
  }, [blocks, hideControls, updateBlocks]);

  // Broadcast spell matches to AiPanel Correctness tab via custom events
  useEffect(() => {
    if (hideControls) return;
    window.dispatchEvent(new CustomEvent("moodra:spell-update", {
      detail: { matches: spellCheck.matches }
    }));
  }, [spellCheck.matches, hideControls]);

  // Navigate to a block + flash it red when AiPanel Correctness tab requests it
  useEffect(() => {
    const handler = (e: Event) => {
      const { blockId } = (e as CustomEvent).detail as { blockId: string };
      setFocusedBlockId(blockId);
      const blockEl = containerRef.current?.querySelector(`[data-block-id="${blockId}"]`) as HTMLElement | null;
      if (!blockEl) return;
      blockEl.scrollIntoView({ behavior: "smooth", block: "center" });
      blockEl.style.transition = "background-color 0.2s ease";
      blockEl.style.backgroundColor = "rgba(239,68,68,0.18)";
      setTimeout(() => { blockEl.style.backgroundColor = ""; }, 1800);
    };
    window.addEventListener("moodra:spell-navigate", handler);
    return () => window.removeEventListener("moodra:spell-navigate", handler);
  }, []);

  // Refs to capture latest values for stable event handlers
  const latestFixAll = useRef<() => void>(() => {});
  useEffect(() => {
    latestFixAll.current = () => {
      if (!focusedBlockId) return;
      const block = blocks.find(b => b.id === focusedBlockId);
      if (!block) return;
      const toFix = spellCheck.matches.filter(m => m.replacements.length > 0);
      if (!toFix.length) return;
      let content = block.content;
      toFix.forEach(m => {
        const errText = m.context.text.slice(m.context.offset, m.context.offset + m.context.length);
        if (content.includes(errText)) content = content.replace(errText, m.replacements[0].value);
      });
      updateBlockContent(focusedBlockId, content);
      const el = containerRef.current?.querySelector(`[data-block-id="${focusedBlockId}"] [contenteditable]`) as HTMLElement | null;
      if (el) el.innerHTML = content;
      spellCheck.clearMatches();
    };
  }, [focusedBlockId, blocks, spellCheck, updateBlockContent]);

  const applySpellFix = useCallback((match: LTMatch, replacement: string) => {
    if (!focusedBlockId) return;
    const block = blocks.find(b => b.id === focusedBlockId);
    if (!block) return;
    const errorText = match.context.text.slice(match.context.offset, match.context.offset + match.context.length);
    const newContent = block.content.includes(errorText)
      ? block.content.replace(errorText, replacement)
      : block.content;
    updateBlockContent(focusedBlockId, newContent);
    const el = containerRef.current?.querySelector(`[data-block-id="${focusedBlockId}"] [contenteditable]`) as HTMLElement | null;
    if (el) el.innerHTML = newContent;
    spellCheck.clearMatches();
    setTimeout(() => {
      const b = blocks.find(x => x.id === focusedBlockId);
      if (b) spellCheck.check(newContent);
    }, 100);
  }, [focusedBlockId, blocks, spellCheck, updateBlockContent]);

  const latestFixOne = useRef(applySpellFix);
  useEffect(() => { latestFixOne.current = applySpellFix; }, [applySpellFix]);

  const latestIgnore = useRef(spellCheck.ignoreRule);
  useEffect(() => { latestIgnore.current = spellCheck.ignoreRule; }, [spellCheck.ignoreRule]);

  useEffect(() => {
    const fixAll = () => latestFixAll.current();
    const fixOne = (e: Event) => {
      const { match, replacement } = (e as CustomEvent).detail;
      latestFixOne.current(match, replacement);
    };
    const ignore = (e: Event) => {
      latestIgnore.current((e as CustomEvent).detail.ruleId);
    };
    window.addEventListener("moodra:spell-fix-all", fixAll);
    window.addEventListener("moodra:spell-fix-one", fixOne);
    window.addEventListener("moodra:spell-ignore", ignore);
    return () => {
      window.removeEventListener("moodra:spell-fix-all", fixAll);
      window.removeEventListener("moodra:spell-fix-one", fixOne);
      window.removeEventListener("moodra:spell-ignore", ignore);
    };
  }, []);

  // Auto spell-check focused block in SMART mode
  useEffect(() => {
    if (spellCheck.mode !== "smart" || !focusedBlockId) return;
    const block = blocks.find(b => b.id === focusedBlockId);
    if (block) spellCheck.check(block.content);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusedBlockId, spellCheck.mode, spellCheck.lang]);

  return (
    <div className="flex flex-col">
    <FormatToolbar
      visible={!hideControls && !hideFormattingToolbar}
      lineSpacing={lineSpacing}
      onLineSpacingChange={setLineSpacing}
      spellMode={spellCheck.mode}
      spellLang={spellCheck.lang}
      onSpellModeChange={!hideControls ? spellCheck.setMode : undefined}
      onSpellLangChange={spellCheck.setLang}
      spellMatchCount={spellCheck.matches.length}
      spellIsChecking={spellCheck.isChecking}
    />
    <div
      ref={containerRef}
      className={cn("w-full max-w-[1200px] mx-auto py-10 px-4 relative", hideControls && "py-0 px-0")}
      onMouseUp={handleMouseUp}
      onClick={(e) => {
        if (selectionBar && !(e.target as HTMLElement).closest("[data-selection-bar]")) {
          setSelectionBar(null);
        }
      }}
    >
      {/* Selection AI Toolbar */}
      {false && selectionBar && !freeGateOpen && (
        <div
          data-selection-bar="true"
          data-testid="selection-ai-toolbar"
          className="fixed z-[9999] transform -translate-x-1/2 -translate-y-full"
          style={{
            left: (selectionBar?.x ?? 0) + (containerRef.current?.getBoundingClientRect().left || 0),
            top: (selectionBar?.y ?? 0) + (containerRef.current?.getBoundingClientRect().top || 0) - 6,
          }}
        >
          <div className="bg-[#1C1C1E] dark:bg-zinc-900 rounded-xl shadow-xl flex items-center gap-0.5 p-1 border border-white/10">
            {isImproving ? (
              <div className="flex items-center gap-2 px-3 py-1">
                <div className="flex gap-1">
                  {[0, 160, 320].map(d => (
                    <div key={d} className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
                <span className="text-[11px] text-white/60 font-medium">
                  {s.processing}
                </span>
              </div>
            ) : (
              <>
                {AI_IMPROVE_MODES.map(m => (
                  <button
                    key={m.id}
                    data-testid={`selection-action-${m.id}`}
                    onClick={() => callImprove(m.id)}
                    className="px-2 py-1 rounded-lg text-[11px] font-medium text-white/85 hover:bg-white/10 hover:text-white transition-colors whitespace-nowrap"
                  >
                    {s[m.key]}
                  </button>
                ))}
                <div className="w-px h-4 bg-white/20 mx-0.5" />
                <select
                  value={selectedStyle}
                  onChange={e => setSelectedStyle(e.target.value)}
                  className="bg-transparent text-[11px] text-white/60 hover:text-white pr-1 outline-none cursor-pointer"
                >
                  {AI_STYLES.map(st => (
                    <option key={st.id} value={st.id} className="bg-zinc-900 text-white">{s[st.key]}</option>
                  ))}
                </select>
              </>
            )}
          </div>
        </div>
      )}

      {/* Free Mode Gate — no backdrop, floating card */}
      {freeGateOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center" style={{ pointerEvents: "none" }}>
          <div className="w-full max-w-md mx-4" style={{ pointerEvents: "auto", background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)", border: "1.5px solid rgba(99,102,241,0.55)", borderRadius: "16px", padding: "24px" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(99,102,241,0.18)" }}>
                <Wand2 className="w-5 h-5" style={{ color: "#818CF8" }} />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: "#E2E8F0" }}>
                  {lang === "ru" ? "Тяжёлая задача для бесплатной модели" : lang === "ua" ? "Важке завдання для безплатної моделі" : lang === "de" ? "Aufgabe zu schwer für das Gratis-Modell" : "Too complex for the free model"}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: "#818CF8" }}>GPT-OSS · Pollinations</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed mb-5" style={{ color: "#94A3B8" }}>
              {lang === "ru"
                ? "Редактура и перефразирование выделенных фрагментов — это сложная операция, с которой бесплатный GPT-OSS справляется нестабильно. Попробуй отправить запрос через боковую панель ИИ, или добавь API ключ OpenAI для полного доступа."
                : lang === "ua"
                  ? "Редагування та перефразування виділених фрагментів — складна операція, з якою безплатний GPT-OSS справляється нестабільно. Спробуй надіслати запит через бокову панель ШІ або додай API ключ."
                  : lang === "de"
                    ? "Das Bearbeiten und Umformulieren von Textauswahlen ist eine komplexe Operation, mit der das kostenlose GPT-OSS unzuverlässig umgeht. Versuche es über das KI-Seitenpanel oder füge einen API-Schlüssel hinzu."
                    : "Editing and rephrasing selected text is a complex operation that free GPT-OSS handles unreliably. Try sending the request via the AI sidebar panel, or add an OpenAI API key for full access."}
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setFreeGateOpen(false)}
                className="w-full py-2.5 rounded-xl text-sm font-semibold transition-colors"
                style={{ background: "rgba(99,102,241,0.20)", color: "#A5B4FC" }}
              >
                {lang === "ru" ? "Попробовать через боковую панель" : lang === "ua" ? "Спробувати через бокову панель" : lang === "de" ? "Über Seitenleiste versuchen" : "Try via sidebar panel"}
              </button>
              <button
                onClick={() => { setFreeGateOpen(false); setLocation("/models"); }}
                className="w-full py-2.5 rounded-xl text-sm font-semibold transition-colors"
                style={{ background: "rgba(249,109,28,0.18)", color: "#FB923C" }}
              >
                {lang === "ru" ? "Добавить API ключ" : lang === "ua" ? "Додати API ключ" : lang === "de" ? "API-Schlüssel hinzufügen" : "Add API key"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Before/After Comparison Dialog */}
      <Dialog open={!!improvementResult} onOpenChange={() => setImprovementResult(null)}>
        <DialogContent className="max-w-3xl" aria-describedby="improvement-dialog-desc">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-primary" />
              {s.aiImprovement}
            </DialogTitle>
          </DialogHeader>
          <p id="improvement-dialog-desc" className="sr-only">{s.comparisonDesc}</p>
          {improvementResult && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">{s.original}</div>
                <div className="bg-muted/40 rounded-xl p-4 text-sm leading-relaxed min-h-[120px] text-muted-foreground">
                  {improvementResult.original}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-emerald-600 mb-2 uppercase tracking-wider">{s.improved}</div>
                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 rounded-xl p-4 text-sm leading-relaxed min-h-[120px]">
                  {improvementResult.improved}
                </div>
              </div>
            </div>
          )}
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setImprovementResult(null)}>
              {s.reject}
            </Button>
            <Button size="sm" className="rounded-xl gap-1.5" onClick={acceptImprovement} data-testid="button-accept-improvement">
              <Check className="h-3.5 w-3.5" /> {s.accept}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-1" style={{ '--block-line-spacing': lineSpacing } as React.CSSProperties}>
            {blocks.map((block, index) => {
              let listIndex = 1;
              if (block.type === "numbered_item") {
                for (let i = index - 1; i >= 0; i--) {
                  if (blocks[i].type === "numbered_item") listIndex++;
                  else break;
                }
              }
              return (
                <SortableBlock
                  key={block.id}
                  block={block}
                  isFocused={focusedBlockId === block.id}
                  onFocus={() => !hideControls && setFocusedBlockId(block.id)}
                  onUpdateContent={(content) => updateBlockContent(block.id, content)}
                  onUpdateType={(type) => updateBlockType(block.id, type)}
                  onUpdateMetadata={(metadata) => updateBlockMetadata(block.id, metadata)}
                  onAddBlock={(type, content, indentLevel) => addBlock(index, type ?? "paragraph", content ?? "", indentLevel ?? 0)}
                  onSplitBlock={(before, after, indentLevel) => splitBlock(block.id, index, before, after, indentLevel ?? 0)}
                  onDelete={() => deleteBlock(block.id)}
                  onPasteBlocks={(paragraphs) => handlePasteBlocks(block.id, paragraphs)}
                  onMergeWithPrevious={index > 0 ? (content) => mergeWithPrevious(block.id, content) : undefined}
                  hideControls={hideControls}
                  firstLineIndent={firstLineIndent}
                  cursorTarget={cursorTargetRef}
                  listIndex={listIndex}
                  spellCheckMode={spellCheck.mode}
                  spellLangAttr={spellCheck.lang !== "auto" ? spellCheck.lang : undefined}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
    </div>
  );
}

interface SortableBlockProps {
  block: Block;
  isFocused: boolean;
  onFocus: () => void;
  onUpdateContent: (content: string) => void;
  onUpdateType: (type: BlockType) => void;
  onUpdateMetadata: (metadata: any) => void;
  onAddBlock: (type?: BlockType, initialContent?: string, indentLevel?: number) => void;
  onSplitBlock: (beforeContent: string, afterContent: string, indentLevel?: number) => void;
  onDelete: () => void;
  onPasteBlocks?: (paragraphs: string[]) => void;
  onMergeWithPrevious?: (content: string) => void;
  hideControls?: boolean;
  firstLineIndent?: number;
  cursorTarget?: React.MutableRefObject<{ blockId: string; offset: number } | null>;
  listIndex?: number;
  spellCheckMode?: SpellCheckMode;
  spellLangAttr?: string;
}

function placeCaretAtTextOffset(el: HTMLElement, targetOffset: number) {
  const sel = window.getSelection();
  if (!sel) return;
  let charCount = 0;
  function traverse(node: Node): boolean {
    if (node.nodeType === Node.TEXT_NODE) {
      const len = (node as Text).length;
      if (charCount + len >= targetOffset) {
        const range = document.createRange();
        range.setStart(node, targetOffset - charCount);
        range.collapse(true);
        sel!.removeAllRanges();
        sel!.addRange(range);
        return true;
      }
      charCount += len;
    } else {
      for (const child of Array.from(node.childNodes)) {
        if (traverse(child)) return true;
      }
    }
    return false;
  }
  if (!traverse(el)) {
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  }
}

function SortableBlock({
  block,
  isFocused,
  onFocus,
  onUpdateContent,
  onUpdateType,
  onUpdateMetadata,
  onAddBlock,
  onSplitBlock,
  onDelete,
  onPasteBlocks,
  onMergeWithPrevious,
  hideControls,
  firstLineIndent,
  cursorTarget,
  listIndex,
  spellCheckMode,
  spellLangAttr,
}: SortableBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id, disabled: hideControls });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  const { lang } = useLang();
  const s = BLOCK_EDITOR_I18N[lang] || BLOCK_EDITOR_I18N.en;
  const contentRef = useRef<HTMLDivElement>(null);
  const initializedElRef = useRef<HTMLElement | null>(null);
  const pendingClickRef = useRef<{ x: number; y: number } | null>(null);
  const [showSlashMenu, setShowSlashMenu] = useState(false);

  // Re-initialize innerHTML whenever the underlying DOM element changes.
  // This covers both initial mount AND block-type switches (e.g. paragraph →
  // idea/argument) where React replaces the DOM node but `block.content` still
  // holds the text.  Running without a dep-array means the check is O(1) each
  // render; it only writes to the DOM when the element actually changed.
  useLayoutEffect(() => {
    if (contentRef.current && contentRef.current !== initializedElRef.current) {
      initializedElRef.current = contentRef.current;
      if (block.content && block.content !== contentRef.current.innerHTML) {
        contentRef.current.innerHTML = block.content;
      }
    }
  });

  useEffect(() => {
    if (isFocused && contentRef.current) {
      if (document.activeElement !== contentRef.current) {
        contentRef.current.focus();
      }
      if (pendingClickRef.current) {
        // Place cursor exactly where user clicked
        const { x, y } = pendingClickRef.current;
        pendingClickRef.current = null;
        requestAnimationFrame(() => {
          if (!contentRef.current) return;
          let range: Range | null = null;
          if (document.caretRangeFromPoint) {
            range = document.caretRangeFromPoint(x, y);
          } else {
            const pos = (document as any).caretPositionFromPoint?.(x, y);
            if (pos) {
              range = document.createRange();
              range.setStart(pos.offsetNode, pos.offset);
              range.collapse(true);
            }
          }
          if (range && contentRef.current.contains(range.startContainer)) {
            const sel = window.getSelection();
            sel?.removeAllRanges();
            sel?.addRange(range);
          }
        });
      } else if (cursorTarget?.current?.blockId === block.id) {
        const offset = cursorTarget.current.offset;
        cursorTarget.current = null;
        requestAnimationFrame(() => {
          if (contentRef.current) placeCaretAtTextOffset(contentRef.current, offset);
        });
      } else {
        // Default: cursor to end
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(contentRef.current);
        range.collapse(false);
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
  }, [isFocused]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (hideControls) return;
    const isEmpty = contentRef.current?.innerText?.trim() === "";
    const isListBlock = block.type === "bullet_item" || block.type === "numbered_item" || block.type === "check_item";
    const currentIndent = block.metadata?.indentLevel ?? 0;

    // Tab / Shift+Tab — change indent level
    if (e.key === "Tab") {
      e.preventDefault();
      if (e.shiftKey) {
        if (currentIndent > 0) onUpdateMetadata({ ...block.metadata, indentLevel: currentIndent - 1 });
      } else {
        if (currentIndent < 3) onUpdateMetadata({ ...block.metadata, indentLevel: currentIndent + 1 });
      }
      return;
    }

    if (e.key === "Enter" && !e.shiftKey) {
      if (isListBlock) {
        e.preventDefault();
        if (isEmpty) {
          onUpdateType("paragraph");
        } else {
          onAddBlock(block.type, undefined, currentIndent);
        }
        return;
      }
      // If cursor is inside a list item, let browser handle Enter natively
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const node = sel.getRangeAt(0).startContainer;
        const li = node.nodeType === Node.TEXT_NODE
          ? (node.parentElement as HTMLElement)?.closest("li")
          : (node as HTMLElement)?.closest?.("li");
        if (li) return; // allow native Enter → new <li>
      }
      e.preventDefault();
      const el = contentRef.current;
      if (el) {
        const sel = window.getSelection();
        if (sel?.rangeCount) {
          const range = sel.getRangeAt(0);
          try {
            const beforeRange = document.createRange();
            beforeRange.setStart(el, 0);
            beforeRange.setEnd(range.startContainer, range.startOffset);
            const tempBefore = document.createElement("div");
            tempBefore.appendChild(beforeRange.cloneContents());

            const afterRange = document.createRange();
            afterRange.setStart(range.endContainer, range.endOffset);
            afterRange.setEnd(el, el.childNodes.length);
            const tempAfter = document.createElement("div");
            tempAfter.appendChild(afterRange.cloneContents());

            const htmlBefore = tempBefore.innerHTML;
            const htmlAfter = tempAfter.innerHTML;
            el.innerHTML = htmlBefore;
            onSplitBlock(htmlBefore, htmlAfter, currentIndent);
          } catch {
            onAddBlock(undefined, undefined, currentIndent);
          }
        } else {
          onAddBlock(undefined, undefined, currentIndent);
        }
      } else {
        onAddBlock(undefined, undefined, currentIndent);
      }
    } else if (e.key === "Backspace" && isEmpty && block.type !== "paragraph") {
      e.preventDefault();
      onUpdateType("paragraph");
    } else if (e.key === "Backspace" && isEmpty && block.type === "paragraph") {
      e.preventDefault();
      onDelete();
    } else if (e.key === "Backspace" && !isEmpty && block.type === "paragraph" && onMergeWithPrevious) {
      const sel = window.getSelection();
      if (sel?.rangeCount) {
        const range = sel.getRangeAt(0);
        if (range.collapsed) {
          try {
            const checkRange = document.createRange();
            checkRange.setStart(contentRef.current!, 0);
            checkRange.setEnd(range.startContainer, range.startOffset);
            if (checkRange.toString() === "") {
              e.preventDefault();
              onMergeWithPrevious(contentRef.current?.innerHTML || "");
            }
          } catch {}
        }
      }
    } else if (e.key === "/") {
      if (isEmpty) {
        setShowSlashMenu(true);
      }
    }
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    if (hideControls) return;
    const html = e.currentTarget.innerHTML;
    const text = e.currentTarget.innerText;
    onUpdateContent(html);
    
    if (text === "/") {
      setShowSlashMenu(true);
    } else if (showSlashMenu && !text.startsWith("/")) {
      setShowSlashMenu(false);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (hideControls) return;
    setTimeout(() => {
      setShowSlashMenu(false);
    }, 200);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    if (hideControls) return;
    const text = e.clipboardData.getData("text/plain");
    if (!text) return;
    const paragraphs = text
      .split(/\n{2,}/)
      .map((p) => p.replace(/\n/g, " ").trim())
      .filter(Boolean);
    if (paragraphs.length > 1 && onPasteBlocks) {
      e.preventDefault();
      onPasteBlocks(paragraphs);
    } else {
      e.preventDefault();
      const cleaned = text.replace(/\n+/g, " ").trim();
      document.execCommand("insertText", false, cleaned);
    }
  };

  const currentType = BLOCK_TYPES.find(t => t.type === block.type) || BLOCK_TYPES[0];
  const indentLevel = block.metadata?.indentLevel ?? 0;

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        marginLeft: hideControls ? `${indentLevel * 24}px` : `${indentLevel * 28}px`,
      }}
      data-block-id={block.id}
      className={cn(
        "group relative flex items-start gap-2 py-1 px-2 rounded-md transition-colors",
        isDragging ? "bg-accent/50 opacity-50" : (!hideControls && "hover:bg-accent/5"),
        isFocused && "bg-accent/5",
        hideControls && "py-0 px-0 hover:bg-transparent",
        indentLevel > 0 && "border-l-2 border-border/50 pl-3"
      )}
    >
      {/* Left controls */}
      {!hideControls && (
        <div className={cn(
          "flex items-center gap-1 transition-opacity absolute -left-12 top-2 h-6",
          "opacity-0 group-hover:opacity-100"
        )}>
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-accent rounded">
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="w-6 h-6 p-0 hover:bg-accent rounded">
                <currentType.icon className="w-3.5 h-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-60">
              <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/50 px-2 pt-1.5 pb-0.5">
                {s.layoutGroupLabel}
              </div>
              {LAYOUT_BLOCK_TYPES.map((t) => {
                const m = BLOCK_TYPE_I18N_MAP[t.type];
                return (
                  <DropdownMenuItem
                    key={t.type}
                    onClick={() => onUpdateType(t.type)}
                    className="flex items-center gap-2"
                  >
                    <t.icon className="w-4 h-4" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{m ? s[m.labelKey] : t.type}</span>
                      <span className="text-xs text-muted-foreground">{m ? s[m.descKey] : ""}</span>
                    </div>
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuSeparator />
              <div className="text-[9px] font-bold uppercase tracking-wider px-2 pt-1.5 pb-0.5" style={{ color: "#8B5CF6", opacity: 0.7 }}>
                {s.editorOnlyGroupLabel}
              </div>
              {EDITOR_ONLY_BLOCK_TYPES.map((t) => {
                const m = BLOCK_TYPE_I18N_MAP[t.type];
                return (
                  <DropdownMenuItem
                    key={t.type}
                    onClick={() => onUpdateType(t.type)}
                    className="flex items-center gap-2"
                  >
                    <t.icon className="w-4 h-4 text-violet-400" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{m ? s[m.labelKey] : t.type}</span>
                      <span className="text-xs text-muted-foreground">{m ? s[m.descKey] : ""}</span>
                    </div>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 min-w-0">
        {/* Alignment toolbar — shows when focused on paragraph-like blocks */}
        {isFocused && !hideControls && (block.type === "paragraph" || block.type === "h1" || block.type === "h2" || block.type === "h3" || block.type === "quote") && (
          <div className="flex items-center gap-0.5 mb-1 opacity-80">
            {([
              { align: "left",    Icon: AlignLeft,    titleKey: "alignLeft" },
              { align: "center",  Icon: AlignCenter,  titleKey: "alignCenter" },
              { align: "right",   Icon: AlignRight,   titleKey: "alignRight" },
              { align: "justify", Icon: AlignJustify, titleKey: "justify" },
            ] as const).map(({ align, Icon, titleKey }) => (
              <button
                key={align}
                title={s[titleKey]}
                onMouseDown={e => { e.preventDefault(); onUpdateMetadata({ ...block.metadata, align }); }}
                className="p-1 rounded hover:bg-accent transition-colors"
                style={{ color: block.metadata?.align === align ? "#F96D1C" : "#aaa" }}
              >
                <Icon className="w-3 h-3" />
              </button>
            ))}
            <button
              title={s.firstLineIndent}
              onMouseDown={e => { e.preventDefault(); onUpdateMetadata({ ...block.metadata, indent: block.metadata?.indent === false ? true : false }); }}
              className="p-1 rounded hover:bg-accent transition-colors ml-1"
              style={{ color: block.metadata?.indent !== false ? "#F96D1C" : "#aaa" }}
            >
              <Indent className="w-3 h-3" />
            </button>
          </div>
        )}

        <div
          className="relative"
          style={{ textAlign: block.metadata?.align || undefined }}
          onMouseDown={!isFocused && !hideControls ? (e) => {
            pendingClickRef.current = { x: e.clientX, y: e.clientY };
            onFocus();
          } : undefined}
        >
          {block.type === "divider" ? (
            <div className="py-4">
              <hr className="border-t border-border" />
            </div>
          ) : (
            <>
              {renderBlockContent(block, contentRef, isFocused, onFocus, handleKeyDown, handleInput, handleBlur, handlePaste, hideControls, s, firstLineIndent, listIndex, onUpdateMetadata, spellCheckMode, spellLangAttr)}
              {!block.content && !isFocused && !hideControls && (
                <div className="absolute top-0 left-0 text-muted-foreground/30 pointer-events-none italic">
                  {s.placeholder}
                </div>
              )}
            </>
          )}

          {/* Slash Menu Popover */}
          <Popover open={showSlashMenu && !hideControls} onOpenChange={setShowSlashMenu}>
            <PopoverTrigger asChild>
              <div className="absolute top-0 left-0 w-full h-0 pointer-events-none" />
            </PopoverTrigger>
            <PopoverContent className="w-72 p-1" align="start">
              <div className="max-h-96 overflow-y-auto">
                <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/50 px-2 pt-2 pb-1">
                  {s.layoutGroupLabel}
                </div>
                {LAYOUT_BLOCK_TYPES.map((t) => {
                  const m = BLOCK_TYPE_I18N_MAP[t.type];
                  return (
                    <button
                      key={t.type}
                      onClick={() => {
                        onUpdateType(t.type);
                        onUpdateContent("");
                        if (contentRef.current) contentRef.current.innerText = "";
                        setShowSlashMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-2 py-1.5 hover:bg-accent rounded-sm text-left transition-colors"
                    >
                      <div className="w-8 h-8 flex items-center justify-center bg-background border rounded-md">
                        <t.icon className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{m ? s[m.labelKey] : t.type}</span>
                        <span className="text-xs text-muted-foreground">{m ? s[m.descKey] : ""}</span>
                      </div>
                    </button>
                  );
                })}
                <div className="border-t border-border/20 my-1" />
                <div className="text-[9px] font-bold uppercase tracking-wider px-2 pb-1 pt-0.5" style={{ color: "#8B5CF6", opacity: 0.7 }}>
                  {s.editorOnlyGroupLabel}
                </div>
                {EDITOR_ONLY_BLOCK_TYPES.map((t) => {
                  const m = BLOCK_TYPE_I18N_MAP[t.type];
                  return (
                    <button
                      key={t.type}
                      onClick={() => {
                        onUpdateType(t.type);
                        onUpdateContent("");
                        if (contentRef.current) contentRef.current.innerText = "";
                        setShowSlashMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-2 py-1.5 hover:bg-accent rounded-sm text-left transition-colors"
                    >
                      <div className="w-8 h-8 flex items-center justify-center rounded-md" style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)" }}>
                        <t.icon className="w-4 h-4 text-violet-400" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{m ? s[m.labelKey] : t.type}</span>
                        <span className="text-xs text-muted-foreground">{m ? s[m.descKey] : ""}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Right controls */}
      {!hideControls && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="w-7 h-7">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="gap-2">
                <Send className="w-4 h-4" /> {s.toAi}
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2" onClick={() => navigator.clipboard.writeText(block.content)}>
                <Copy className="w-4 h-4" /> {s.copy}
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <ExternalLink className="w-4 h-4" /> {s.toCard}
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 text-destructive" onClick={onDelete}>
                {s.delete}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}

function renderBlockContent(
  block: Block,
  ref: React.RefObject<HTMLDivElement>,
  isFocused: boolean,
  onFocus: () => void,
  onKeyDown: (e: React.KeyboardEvent) => void,
  onInput: (e: React.FormEvent<HTMLDivElement>) => void,
  onBlur: (e: React.FocusEvent<HTMLDivElement>) => void,
  onPaste: (e: React.ClipboardEvent<HTMLDivElement>) => void,
  hideControls?: boolean,
  s?: Record<string, string>,
  firstLineIndent?: number,
  listIndex?: number,
  onUpdateMetadata?: (metadata: any) => void,
  spellCheckMode?: SpellCheckMode,
  spellLangAttr?: string,
) {
  const i = s || BLOCK_EDITOR_I18N.en;
  const editable = !hideControls && isFocused;
  const nativeSpellCheck = spellCheckMode === "basic" || spellCheckMode === "smart";
  const commonProps = {
    ref,
    contentEditable: editable as boolean,
    onFocus: editable ? onFocus : undefined,
    onKeyDown: editable ? onKeyDown : undefined,
    onInput: editable ? onInput : undefined,
    onBlur: editable ? onBlur : undefined,
    onPaste: editable ? onPaste : undefined,
    suppressContentEditableWarning: true,
    spellCheck: editable ? nativeSpellCheck : false,
    lang: editable && nativeSpellCheck && spellLangAttr && spellLangAttr !== "auto" ? spellLangAttr : undefined,
    className: cn("outline-none w-full", !editable && "cursor-text select-text"),
    "data-testid": `block-content-${block.type}-${block.id}`,
  };

  switch (block.type) {
    case "h1":
      return <h1 {...commonProps} className={cn(commonProps.className, "text-4xl font-bold font-serif mb-4 mt-8", hideControls && "mt-0")} style={block.metadata?.indent === false ? { textIndent: 0 } : block.metadata?.indent === true ? { textIndent: "2em" } : undefined} />;
    case "h2":
      return <h2 {...commonProps} className={cn(commonProps.className, "text-2xl font-bold font-serif mb-3 mt-6", hideControls && "mt-0")} style={block.metadata?.indent === false ? { textIndent: 0 } : block.metadata?.indent === true ? { textIndent: "2em" } : undefined} />;
    case "h3":
      return <h3 {...commonProps} className={cn(commonProps.className, "text-xl font-bold font-serif mb-2 mt-4", hideControls && "mt-0")} style={block.metadata?.indent === false ? { textIndent: 0 } : block.metadata?.indent === true ? { textIndent: "2em" } : undefined} />;
    case "quote":
      return (
        <blockquote className="border-l-4 border-primary/30 pl-4 py-1 italic font-serif text-lg text-muted-foreground" style={block.metadata?.indent === false ? { textIndent: 0 } : block.metadata?.indent === true ? { textIndent: "2em" } : undefined}>
          <div {...commonProps} />
        </blockquote>
      );
    case "hypothesis":
      return <BlockContainer icon={AlertCircle} label={i.hypothesis} bgColor="bg-[#EEF4FF]" hideControls={hideControls} {...commonProps} />;
    case "argument":
      return <BlockContainer icon={CheckCircle2} label={i.argument} bgColor="bg-[#EFFDF4]" hideControls={hideControls} {...commonProps} />;
    case "counterargument":
      return <BlockContainer icon={XCircle} label={i.counterargument} bgColor="bg-[#FFF0F0]" hideControls={hideControls} {...commonProps} />;
    case "idea":
      return <BlockContainer icon={Lightbulb} label={i.idea} bgColor="bg-[#FFFBEB]" hideControls={hideControls} {...commonProps} />;
    case "question":
      return <BlockContainer icon={HelpCircle} label={i.question} bgColor="bg-[#F5F3FF]" hideControls={hideControls} {...commonProps} />;
    case "example":
      if (hideControls) return <div {...commonProps} className={cn(commonProps.className, "text-lg font-serif")} />;
      return <BlockContainer icon={Info} label={i.exampleBlock} bgColor="bg-[#F0FDFA]" hideControls={hideControls} {...commonProps} />;
    case "observation":
      if (hideControls) return <div {...commonProps} className={cn(commonProps.className, "text-lg font-serif")} />;
      return <BlockContainer icon={Search} label={i.observation} bgColor="bg-[#FFF7ED]" hideControls={hideControls} {...commonProps} />;
    case "research":
      if (hideControls) return <div {...commonProps} className={cn(commonProps.className, "text-lg font-serif")} />;
      return <BlockContainer icon={MessageSquare} label={i.research} bgColor="bg-[#F9FAFB]" hideControls={hideControls} {...commonProps} />;
    case "bullet_item":
      return (
        <div className="flex items-start gap-2.5" style={{ lineHeight: "var(--block-line-spacing, 1.625)" }}>
          <span className="mt-[0.28em] text-muted-foreground flex-shrink-0 text-base leading-none select-none">•</span>
          <div {...commonProps} className={cn(commonProps.className, "text-lg font-serif flex-1")} />
        </div>
      );
    case "numbered_item":
      return (
        <div className="flex items-start gap-2.5" style={{ lineHeight: "var(--block-line-spacing, 1.625)" }}>
          <span className="mt-[0.28em] text-muted-foreground flex-shrink-0 text-base leading-none select-none font-mono min-w-[1.4em] text-right">{listIndex ?? 1}.</span>
          <div {...commonProps} className={cn(commonProps.className, "text-lg font-serif flex-1")} />
        </div>
      );
    case "check_item": {
      const checked = block.metadata?.checked === true;
      return (
        <div className="flex items-start gap-2.5" style={{ lineHeight: "var(--block-line-spacing, 1.625)" }}>
          <button
            onMouseDown={(e) => {
              if (hideControls) return;
              e.preventDefault();
              onUpdateMetadata?.({ ...block.metadata, checked: !checked });
            }}
            className="mt-[0.3em] flex-shrink-0 text-muted-foreground hover:text-primary transition-colors"
            tabIndex={-1}
          >
            {checked
              ? <CheckSquare className="w-4 h-4 text-primary" />
              : <Square className="w-4 h-4" />
            }
          </button>
          <div
            {...commonProps}
            className={cn(commonProps.className, "text-lg font-serif flex-1", checked && "line-through text-muted-foreground")}
          />
        </div>
      );
    }
    case "source_ref":
      if (hideControls) return <div {...commonProps} className={cn(commonProps.className, "text-lg font-serif")} />;
      return (
        <div className="flex items-center gap-2 text-sm text-primary underline decoration-primary/30 underline-offset-4">
          <LinkIcon className="w-3 h-3" />
          <div {...commonProps} />
        </div>
      );
    default: {
      const indentValue = firstLineIndent !== undefined ? `${firstLineIndent}em` : "2em";
      return (
        <div
          {...commonProps}
          className={cn(commonProps.className, "text-lg font-serif", hideControls && "text-inherit font-inherit leading-inherit")}
          style={{
            textIndent: hideControls ? undefined : (block.metadata?.indent === false ? "0" : indentValue),
            lineHeight: hideControls ? undefined : "var(--block-line-spacing, 1.625)",
          }}
        />
      );
    }
  }
}

const BlockContainer = forwardRef<HTMLDivElement, any>(function BlockContainer(
  { icon: Icon, label, bgColor, hideControls, ...props },
  ref
) {
  return (
    <div className={cn("p-4 rounded-lg flex flex-col gap-2", bgColor, hideControls && "p-3 opacity-90")}>
      {!hideControls && (
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground/60">
          <Icon className="w-3 h-3" />
          {label}
        </div>
      )}
      <div ref={ref} {...props} className={cn(props.className, "text-lg font-serif")} />
    </div>
  );
});

export function blocksToPlainText(blocks: Block[]): string {
  return blocks
    .filter(b => b.type !== "divider")
    .map(b => b.content)
    .join("\n\n");
}
