import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useFreeMode } from "@/hooks/use-free-mode";
import { useLocation } from "wouter";
import { useLang } from "@/contexts/language-context";
import type { Source, Book, Hypothesis, InsertHypothesis } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAiError } from "@/contexts/ai-error-context";
import {
  FlaskConical, Plus, Trash2, Edit, BookOpen, Globe, FileText,
  GraduationCap, ExternalLink, Sparkles, Search, ArrowDownToLine,
  Lightbulb, RefreshCw, ChevronDown, ChevronUp, CheckCircle2, Info,
  Brain, UserSearch, Upload, Loader2, Microscope, Hash, Tag, FileEdit,
  Quote, Layers, Feather, Save, X, Target, Pencil,
  Scissors, Mic, Columns2, GitBranch, Archive, Copy, ChevronLeft,
  Clock, StickyNote, Filter, Compass, AlignLeft, ChevronRight,
  BookMarked, Link2, Unlink2, Wand2, Check
} from "lucide-react";
import type { Draft } from "@shared/schema";
import { NotesTab } from "@/components/notes-tab";
import { SourcesTab } from "@/components/sources-tab";
import { RoleModelsTab } from "@/components/role-models-tab";
import { ResearchWorkspace } from "@/components/research-dashboard";
import { format } from "date-fns";
import { ru, uk, de as deDe, enUS } from "date-fns/locale";

const DATE_LOCALES: Record<string, Locale> = { en: enUS, ru, ua: uk, de: deDe };

const RESEARCH_I18N = {
  en: {
    sourceTypes: { book: "Book", article: "Article", website: "Website", research: "Research", agent_review: "Agent Review", author_analysis: "Author Analysis" },
    openLink: "Open",
    collapse: "Collapse",
    expand: "More",
    dialogTitleNew: "New source",
    dialogTitleEdit: "Edit source",
    labelTitle: "Title",
    labelType: "Type",
    labelAuthor: "Author",
    labelUrl: "URL",
    labelQuote: "Quote",
    labelNotes: "Notes",
    phTitle: "Source title",
    phAuthor: "Author",
    phQuote: "Key quote from source…",
    phNotes: "Your notes about the source…",
    cancel: "Cancel",
    saving: "Saving…",
    save: "Save",
    sourceAdded: "Source added",
    sourceUpdated: "Source updated",
    sourceDeleted: "Source deleted",
    sourceSavedToLib: "Source added to library",
    errorAdd: "Add error",
    errorAi: "AI request error",
    errorGenerate: "Generation error",
    phSearch: "Topic or query for research…",
    searching: "Searching…",
    find: "Find",
    strategyTitle: "Research strategy",
    recommendedSources: "Recommended sources",
    sourcesFromAi: (n: number) => `${n} sources from AI`,
    addAll: "Add all",
    regenerate: "Get new options",
    aiSearchTitle: "AI source search",
    aiSearchDesc: "Enter a topic — AI will find relevant books, articles and studies, and give strategic advice",
    quickFiction: ["Character psychology & motivation", "Historical context of the era", "Plot construction techniques", "Atmosphere & setting", "Dialogue & speech patterns"],
    quickNonFiction: ["Current research on topic", "Classic works & primary sources", "Statistics & empirical data", "Critical theories & debates", "Research methodology"],
    addHypothesis: "Add hypothesis",
    hypothesesTitle: "Hypotheses",
    hypothesesCount: (n: number) => `${n} hypotheses in progress`,
    generate: "Generate",
    add: "Add",
    aiSuggestions: "AI suggestions",
    noHypotheses: "No hypotheses",
    noHypothesesDesc: "Generate new hypotheses from your sources or add manually",
    statusHypothesis: "Hypothesis",
    statusTesting: "Testing",
    statusConfirmed: "Confirmed",
    statusRefuted: "Refuted",
    arguments: "Arguments",
    counterarguments: "Counterarguments",
    argCount: (n: number) => `${n} arguments`,
    counterCount: (n: number) => `${n} counterarguments`,
    hypDialogNew: "New hypothesis",
    hypDialogEdit: "Edit hypothesis",
    labelHypTitle: "Title",
    labelStatus: "Status",
    labelDescription: "Description",
    labelArguments: "Arguments (separated by ;)",
    labelCounterargs: "Counterarguments (separated by ;)",
    phHypTitle: "Core of hypothesis",
    statusSelect: { hypothesis: "Hypothesis", testing: "In testing", confirmed: "Confirmed", refuted: "Refuted" },
    phDescription: "Detailed description…",
    phArguments: "Argument 1; Argument 2…",
    phCounterargs: "Counterargument 1; Counterargument 2…",
    hypAdded: "Hypothesis added",
    hypUpdated: "Hypothesis updated",
    hypDeleted: "Hypothesis deleted",
    tabAiSearch: "AI search",
    tabHypotheses: "Hypotheses",
    tabLibrary: "Library",
    yourSources: "Your sources",
    materialsCount: (n: number) => `${n} materials`,
    emptyLibrary: "Library is empty",
    emptyLibraryDesc: "Add sources manually or use AI search",
    freeGateTitle: "AI search requires a paid model",
    freeGateDesc: "Searching for sources and scientific data is a complex multi-step request that requires a powerful language model. Add an OpenAI API key to unlock this feature.",
    close: "Close",
    addApiKey: "Add API key",
    refreshSuggestions: "Refresh suggestions",
    uploadFile: "Upload file",
    uploadFileTypes: "TXT or MD, up to 1 MB",
    analyzeWithAi: "Analyze with AI",
    analyzing: "Analyzing…",
    aiAnalysis: "AI Analysis",
    closeAnalysis: "Hide",
    testHypothesis: "Test hypothesis",
    testingHypothesis: "Testing…",
    hypothesisAnalysis: "Evidence assessment",
  },
  ru: {
    sourceTypes: { book: "Книга", article: "Статья", website: "Веб-сайт", research: "Исследование", agent_review: "Отзыв агента", author_analysis: "Анализ автора" },
    openLink: "Открыть",
    collapse: "Свернуть",
    expand: "Подробнее",
    dialogTitleNew: "Новый источник",
    dialogTitleEdit: "Редактировать источник",
    labelTitle: "Название",
    labelType: "Тип",
    labelAuthor: "Автор",
    labelUrl: "URL",
    labelQuote: "Цитата",
    labelNotes: "Заметки",
    phTitle: "Название источника",
    phAuthor: "Автор",
    phQuote: "Важная цитата из источника...",
    phNotes: "Ваши заметки об источнике...",
    cancel: "Отмена",
    saving: "Сохраняю...",
    save: "Сохранить",
    sourceAdded: "Источник добавлен",
    sourceUpdated: "Источник обновлён",
    sourceDeleted: "Источник удалён",
    sourceSavedToLib: "Источник добавлен в базу",
    errorAdd: "Ошибка добавления",
    errorAi: "Ошибка запроса к AI",
    errorGenerate: "Ошибка генерации",
    phSearch: "Тема или запрос для исследования...",
    searching: "Ищу...",
    find: "Найти",
    strategyTitle: "Стратегия исследования",
    recommendedSources: "Рекомендуемые источники",
    sourcesFromAi: (n: number) => `${n} источников от AI`,
    addAll: "Добавить все",
    regenerate: "Получить новые варианты",
    aiSearchTitle: "AI-поиск источников",
    aiSearchDesc: "Введите тему — AI подберёт релевантные книги, статьи и исследования, и даст стратегические советы",
    quickFiction: ["Психология персонажей и мотивация", "Исторический контекст эпохи", "Техники построения сюжета", "Создание атмосферы и сеттинга", "Диалог и речевые характеристики"],
    quickNonFiction: ["Современные исследования по теме", "Классические труды и первоисточники", "Статистика и эмпирические данные", "Критические теории и дискуссии", "Методология исследования"],
    addHypothesis: "Добавить гипотезу",
    hypothesesTitle: "Гипотезы",
    hypothesesCount: (n: number) => `${n} гипотез в работе`,
    generate: "Сгенерировать",
    add: "Добавить",
    aiSuggestions: "Предложения AI",
    noHypotheses: "Нет гипотез",
    noHypothesesDesc: "Сгенерируйте новые гипотезы из ваших источников или добавьте вручную",
    statusHypothesis: "Гипотеза",
    statusTesting: "Проверка",
    statusConfirmed: "Подтверждено",
    statusRefuted: "Опровергнуто",
    arguments: "Аргументы",
    counterarguments: "Контраргументы",
    argCount: (n: number) => `${n} аргументов`,
    counterCount: (n: number) => `${n} контраргументов`,
    hypDialogNew: "Новая гипотеза",
    hypDialogEdit: "Редактировать гипотезу",
    labelHypTitle: "Название",
    labelStatus: "Статус",
    labelDescription: "Описание",
    labelArguments: "Аргументы (через ;)",
    labelCounterargs: "Контраргументы (через ;)",
    phHypTitle: "Суть гипотезы",
    statusSelect: { hypothesis: "Гипотеза", testing: "В проверке", confirmed: "Подтверждена", refuted: "Опровергнута" },
    phDescription: "Развёрнутое описание...",
    phArguments: "Аргумент 1; Аргумент 2...",
    phCounterargs: "Контраргумент 1; Контраргумент 2...",
    hypAdded: "Гипотеза добавлена",
    hypUpdated: "Гипотеза обновлена",
    hypDeleted: "Гипотеза удалена",
    tabAiSearch: "AI-поиск",
    tabHypotheses: "Гипотезы",
    tabLibrary: "Библиотека",
    yourSources: "Ваши источники",
    materialsCount: (n: number) => `${n} материалов`,
    emptyLibrary: "Библиотека пуста",
    emptyLibraryDesc: "Добавьте источники вручную или используйте AI-поиск",
    freeGateTitle: "AI-поиск требует платную модель",
    freeGateDesc: "Поиск источников и научных данных — это сложный многошаговый запрос, для которого нужна мощная языковая модель. Бесплатный GPT-OSS справляется с такими задачами нестабильно. Добавьте API ключ OpenAI, чтобы разблокировать эту функцию.",
    close: "Закрыть",
    addApiKey: "Добавить API ключ",
    refreshSuggestions: "Обновить предложения",
    uploadFile: "Загрузить файл",
    uploadFileTypes: "TXT или MD, до 1 МБ",
    analyzeWithAi: "Анализировать с AI",
    analyzing: "Анализирую…",
    aiAnalysis: "AI-анализ",
    closeAnalysis: "Скрыть",
    testHypothesis: "Проверить гипотезу",
    testingHypothesis: "Проверяю…",
    hypothesisAnalysis: "Оценка доказательств",
  },
  ua: {
    sourceTypes: { book: "Книга", article: "Стаття", website: "Веб-сайт", research: "Дослідження", agent_review: "Відгук агента", author_analysis: "Аналіз автора" },
    openLink: "Відкрити",
    collapse: "Згорнути",
    expand: "Детальніше",
    dialogTitleNew: "Нове джерело",
    dialogTitleEdit: "Редагувати джерело",
    labelTitle: "Назва",
    labelType: "Тип",
    labelAuthor: "Автор",
    labelUrl: "URL",
    labelQuote: "Цитата",
    labelNotes: "Нотатки",
    phTitle: "Назва джерела",
    phAuthor: "Автор",
    phQuote: "Важлива цитата з джерела...",
    phNotes: "Ваші нотатки про джерело...",
    cancel: "Скасувати",
    saving: "Зберігаю...",
    save: "Зберегти",
    sourceAdded: "Джерело додано",
    sourceUpdated: "Джерело оновлено",
    sourceDeleted: "Джерело видалено",
    sourceSavedToLib: "Джерело додано до бази",
    errorAdd: "Помилка додавання",
    errorAi: "Помилка запиту до AI",
    errorGenerate: "Помилка генерації",
    phSearch: "Тема або запит для дослідження...",
    searching: "Шукаю...",
    find: "Знайти",
    strategyTitle: "Стратегія дослідження",
    recommendedSources: "Рекомендовані джерела",
    sourcesFromAi: (n: number) => `${n} джерел від AI`,
    addAll: "Додати всі",
    regenerate: "Отримати нові варіанти",
    aiSearchTitle: "AI-пошук джерел",
    aiSearchDesc: "Введіть тему — AI підбере релевантні книги, статті та дослідження, і надасть стратегічні поради",
    quickFiction: ["Психологія персонажів і мотивація", "Історичний контекст епохи", "Техніки побудови сюжету", "Створення атмосфери та сетингу", "Діалог і мовні характеристики"],
    quickNonFiction: ["Сучасні дослідження по темі", "Класичні праці та першоджерела", "Статистика і емпіричні дані", "Критичні теорії та дискусії", "Методологія дослідження"],
    addHypothesis: "Додати гіпотезу",
    hypothesesTitle: "Гіпотези",
    hypothesesCount: (n: number) => `${n} гіпотез у роботі`,
    generate: "Згенерувати",
    add: "Додати",
    aiSuggestions: "Пропозиції AI",
    noHypotheses: "Немає гіпотез",
    noHypothesesDesc: "Згенеруйте нові гіпотези з ваших джерел або додайте вручну",
    statusHypothesis: "Гіпотеза",
    statusTesting: "Перевірка",
    statusConfirmed: "Підтверджено",
    statusRefuted: "Спростовано",
    arguments: "Аргументи",
    counterarguments: "Контраргументи",
    argCount: (n: number) => `${n} аргументів`,
    counterCount: (n: number) => `${n} контраргументів`,
    hypDialogNew: "Нова гіпотеза",
    hypDialogEdit: "Редагувати гіпотезу",
    labelHypTitle: "Назва",
    labelStatus: "Статус",
    labelDescription: "Опис",
    labelArguments: "Аргументи (через ;)",
    labelCounterargs: "Контраргументи (через ;)",
    phHypTitle: "Суть гіпотези",
    statusSelect: { hypothesis: "Гіпотеза", testing: "На перевірці", confirmed: "Підтверджена", refuted: "Спростована" },
    phDescription: "Розгорнутий опис...",
    phArguments: "Аргумент 1; Аргумент 2...",
    phCounterargs: "Контраргумент 1; Контраргумент 2...",
    hypAdded: "Гіпотезу додано",
    hypUpdated: "Гіпотезу оновлено",
    hypDeleted: "Гіпотезу видалено",
    tabAiSearch: "AI-пошук",
    tabHypotheses: "Гіпотези",
    tabLibrary: "Бібліотека",
    yourSources: "Ваші джерела",
    materialsCount: (n: number) => `${n} матеріалів`,
    emptyLibrary: "Бібліотека порожня",
    emptyLibraryDesc: "Додайте джерела вручну або використайте AI-пошук",
    freeGateTitle: "AI-пошук потребує платну модель",
    freeGateDesc: "Пошук джерел і наукових даних — це складний багатокроковий запит, для якого потрібна потужна мовна модель. Додайте API ключ OpenAI, щоб розблокувати цю функцію.",
    close: "Закрити",
    addApiKey: "Додати API ключ",
    refreshSuggestions: "Оновити пропозиції",
    uploadFile: "Завантажити файл",
    uploadFileTypes: "TXT або MD, до 1 МБ",
    analyzeWithAi: "Аналізувати з AI",
    analyzing: "Аналізую…",
    aiAnalysis: "AI-аналіз",
    closeAnalysis: "Сховати",
    testHypothesis: "Перевірити гіпотезу",
    testingHypothesis: "Перевіряю…",
    hypothesisAnalysis: "Оцінка доказів",
  },
  de: {
    sourceTypes: { book: "Buch", article: "Artikel", website: "Website", research: "Forschung", agent_review: "Agentenbericht", author_analysis: "Autorenanalyse" },
    openLink: "Öffnen",
    collapse: "Einklappen",
    expand: "Mehr",
    dialogTitleNew: "Neue Quelle",
    dialogTitleEdit: "Quelle bearbeiten",
    labelTitle: "Titel",
    labelType: "Typ",
    labelAuthor: "Autor",
    labelUrl: "URL",
    labelQuote: "Zitat",
    labelNotes: "Notizen",
    phTitle: "Quelltitel",
    phAuthor: "Autor",
    phQuote: "Wichtiges Zitat aus der Quelle...",
    phNotes: "Ihre Notizen zur Quelle...",
    cancel: "Abbrechen",
    saving: "Speichere...",
    save: "Speichern",
    sourceAdded: "Quelle hinzugefügt",
    sourceUpdated: "Quelle aktualisiert",
    sourceDeleted: "Quelle gelöscht",
    sourceSavedToLib: "Quelle zur Bibliothek hinzugefügt",
    errorAdd: "Fehler beim Hinzufügen",
    errorAi: "KI-Anfragefehler",
    errorGenerate: "Generierungsfehler",
    phSearch: "Thema oder Suchanfrage...",
    searching: "Suche...",
    find: "Suchen",
    strategyTitle: "Forschungsstrategie",
    recommendedSources: "Empfohlene Quellen",
    sourcesFromAi: (n: number) => `${n} Quellen von KI`,
    addAll: "Alle hinzufügen",
    regenerate: "Neue Optionen abrufen",
    aiSearchTitle: "KI-Quellensuche",
    aiSearchDesc: "Gib ein Thema ein — KI findet relevante Bücher, Artikel und Studien und gibt strategische Ratschläge",
    quickFiction: ["Psychologie der Charaktere", "Historischer Kontext der Epoche", "Plotaufbau-Techniken", "Atmosphäre & Setting", "Dialog & Sprachmerkmale"],
    quickNonFiction: ["Aktuelle Forschung zum Thema", "Klassische Werke & Primärquellen", "Statistiken & empirische Daten", "Kritische Theorien & Debatten", "Forschungsmethodik"],
    addHypothesis: "Hypothese hinzufügen",
    hypothesesTitle: "Hypothesen",
    hypothesesCount: (n: number) => `${n} Hypothesen in Arbeit`,
    generate: "Generieren",
    add: "Hinzufügen",
    aiSuggestions: "KI-Vorschläge",
    noHypotheses: "Keine Hypothesen",
    noHypothesesDesc: "Generiere neue Hypothesen aus deinen Quellen oder füge sie manuell hinzu",
    statusHypothesis: "Hypothese",
    statusTesting: "Prüfung",
    statusConfirmed: "Bestätigt",
    statusRefuted: "Widerlegt",
    arguments: "Argumente",
    counterarguments: "Gegenargumente",
    argCount: (n: number) => `${n} Argumente`,
    counterCount: (n: number) => `${n} Gegenargumente`,
    hypDialogNew: "Neue Hypothese",
    hypDialogEdit: "Hypothese bearbeiten",
    labelHypTitle: "Titel",
    labelStatus: "Status",
    labelDescription: "Beschreibung",
    labelArguments: "Argumente (getrennt durch ;)",
    labelCounterargs: "Gegenargumente (getrennt durch ;)",
    phHypTitle: "Kern der Hypothese",
    statusSelect: { hypothesis: "Hypothese", testing: "In Prüfung", confirmed: "Bestätigt", refuted: "Widerlegt" },
    phDescription: "Ausführliche Beschreibung...",
    phArguments: "Argument 1; Argument 2...",
    phCounterargs: "Gegenargument 1; Gegenargument 2...",
    hypAdded: "Hypothese hinzugefügt",
    hypUpdated: "Hypothese aktualisiert",
    hypDeleted: "Hypothese gelöscht",
    tabAiSearch: "KI-Suche",
    tabHypotheses: "Hypothesen",
    tabLibrary: "Bibliothek",
    yourSources: "Ihre Quellen",
    materialsCount: (n: number) => `${n} Materialien`,
    emptyLibrary: "Bibliothek leer",
    emptyLibraryDesc: "Quellen manuell hinzufügen oder KI-Suche verwenden",
    freeGateTitle: "KI-Suche benötigt ein kostenpflichtiges Modell",
    freeGateDesc: "Die Suche nach Quellen und wissenschaftlichen Daten ist eine komplexe mehrstufige Anfrage, für die ein leistungsfähiges Sprachmodell benötigt wird. Füge einen OpenAI-API-Schlüssel hinzu, um diese Funktion freizuschalten.",
    close: "Schließen",
    addApiKey: "API-Schlüssel hinzufügen",
    refreshSuggestions: "Vorschläge aktualisieren",
    uploadFile: "Datei hochladen",
    uploadFileTypes: "TXT oder MD, bis 1 MB",
    analyzeWithAi: "Mit KI analysieren",
    analyzing: "Analysiere…",
    aiAnalysis: "KI-Analyse",
    closeAnalysis: "Ausblenden",
    testHypothesis: "Hypothese testen",
    testingHypothesis: "Teste…",
    hypothesisAnalysis: "Beweisbewertung",
  },
};

const SOURCE_TYPE_ICONS = [
  { value: "book",            icon: BookOpen,     color: "text-blue-500 bg-blue-500/10" },
  { value: "article",         icon: FileText,     color: "text-green-500 bg-green-500/10" },
  { value: "website",         icon: Globe,        color: "text-orange-500 bg-orange-500/10" },
  { value: "research",        icon: GraduationCap, color: "text-purple-500 bg-purple-500/10" },
  { value: "agent_review",    icon: Brain,        color: "text-violet-500 bg-violet-500/10" },
  { value: "author_analysis", icon: UserSearch,   color: "text-rose-500 bg-rose-500/10" },
  { value: "pdf",             icon: Layers,       color: "text-red-500 bg-red-500/10" },
  { value: "quote",           icon: Quote,        color: "text-amber-500 bg-amber-500/10" },
  { value: "custom",          icon: Feather,      color: "text-teal-500 bg-teal-500/10" },
];

function getSourceTypeConfig(typeValue: string, labels: Record<string, string>) {
  const found = SOURCE_TYPE_ICONS.find(t => t.value === typeValue) || SOURCE_TYPE_ICONS[0];
  return { ...found, label: labels[found.value] || found.value };
}

const SOURCE_TYPES = [
  { value: "book",            label: "Book",             icon: BookOpen,     color: "text-blue-500 bg-blue-500/10" },
  { value: "article",         label: "Article",          icon: FileText,     color: "text-green-500 bg-green-500/10" },
  { value: "website",         label: "Website",          icon: Globe,        color: "text-orange-500 bg-orange-500/10" },
  { value: "research",        label: "Research",         icon: GraduationCap, color: "text-purple-500 bg-purple-500/10" },
  { value: "pdf",             label: "PDF / Document",   icon: Layers,       color: "text-red-500 bg-red-500/10" },
  { value: "quote",           label: "Quote",            icon: Quote,        color: "text-amber-500 bg-amber-500/10" },
  { value: "custom",          label: "Custom",           icon: Feather,      color: "text-teal-500 bg-teal-500/10" },
  { value: "agent_review",    label: "Agent Review",     icon: Brain,        color: "text-violet-500 bg-violet-500/10" },
  { value: "author_analysis", label: "Author Analysis",  icon: UserSearch,   color: "text-rose-500 bg-rose-500/10" },
];

interface AISuggestedSource {
  title: string;
  author: string;
  type: string;
  url: string;
  notes: string;
  quote: string;
}

interface AIResearchResult {
  advice: string;
  sources: AISuggestedSource[];
}

function SourceTypeIcon({ type, size = "md" }: { type: string; size?: "sm" | "md" }) {
  const found = SOURCE_TYPES.find(t => t.value === type) || SOURCE_TYPES[0];
  const Icon = found.icon;
  const cls = size === "sm" ? "w-7 h-7" : "w-9 h-9";
  return (
    <div className={`${cls} rounded-lg flex items-center justify-center flex-shrink-0 ${found.color}`}>
      <Icon className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
    </div>
  );
}

function SourceCard({ source, onEdit, onDelete }: {
  source: Source; onEdit: (s: Source) => void; onDelete: (id: number) => void;
}) {
  const { lang } = useLang();
  const s = RESEARCH_I18N[lang];
  const { showError } = useAiError();
  const typeLabel = s.sourceTypes[source.type as keyof typeof s.sourceTypes] || source.type;
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    const content = [source.title, source.author, source.quote, source.notes].filter(Boolean).join("\n");
    if (!content.trim()) return;
    setIsAnalyzing(true);
    try {
      const res = await apiRequest("POST", "/api/ai/improve", {
        text: content,
        mode: "improve",
        customInstruction: "Do not rewrite this text. Instead, deeply analyze it as a research source: identify the main ideas, assess relevance for academic or creative work, extract key insights, note potential biases or limitations, and suggest how this source could be used in writing. Format your response in clear sections.",
      });
      setAnalysis(res.improved || "");
    } catch (e: any) {
      showError(e?.message || s.errorAi);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div
      data-testid={`source-card-${source.id}`}
      className="group bg-card border border-card-border rounded-xl p-4 hover:border-primary/30 transition-all"
    >
      <div className="flex items-start gap-3">
        <SourceTypeIcon type={source.type || "book"} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 mb-1">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm truncate">{source.title}</h4>
              {source.author && <p className="text-xs text-muted-foreground">{source.author}</p>}
            </div>
            <Badge variant="secondary" className="text-xs h-4 px-1.5 flex-shrink-0 rounded-full">{typeLabel}</Badge>
          </div>
          {source.quote && (
            <blockquote className="text-xs text-muted-foreground italic border-l-2 border-primary/30 pl-2 mt-2 line-clamp-2">
              "{source.quote}"
            </blockquote>
          )}
          {source.notes && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{source.notes}</p>
          )}
          {(source as any).summary && (
            <p className="text-xs text-muted-foreground mt-1.5 italic line-clamp-2 border-l-2 border-primary/20 pl-2">{(source as any).summary}</p>
          )}
          {(source as any).tags && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {String((source as any).tags).split(",").map((t: string) => t.trim()).filter(Boolean).map(tag => (
                <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/8 text-primary/70 font-medium">#{tag}</span>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {source.url && (
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1"
                onClick={e => e.stopPropagation()}
              >
                <ExternalLink className="h-3 w-3" />
                {s.openLink}
              </a>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[11px] gap-1 text-muted-foreground hover:text-primary rounded-lg ml-auto"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Microscope className="h-3 w-3" />}
              {isAnalyzing ? s.analyzing : s.analyzeWithAi}
            </Button>
            <span className="text-xs text-muted-foreground/60">
              {format(new Date(source.createdAt), "d MMM", { locale: DATE_LOCALES[lang] })}
            </span>
          </div>

          {analysis && (
            <div className="mt-3 pt-3 border-t border-border animate-in fade-in slide-in-from-top-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  {s.aiAnalysis}
                </span>
                <button
                  onClick={() => setAnalysis(null)}
                  className="text-[10px] text-muted-foreground hover:text-foreground"
                >
                  {s.closeAnalysis}
                </button>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{analysis}</p>
            </div>
          )}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => onEdit(source)}>
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:text-destructive"
            onClick={() => onDelete(source.id)}
            data-testid={`delete-source-${source.id}`}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function SourceDialog({ open, onClose, bookId, source }: {
  open: boolean; onClose: () => void; bookId: number; source?: Source;
}) {
  const { toast } = useToast();
  const { lang } = useLang();
  const s = RESEARCH_I18N[lang];
  const [title, setTitle] = useState(source?.title || "");
  const [author, setAuthor] = useState(source?.author || "");
  const [url, setUrl] = useState(source?.url || "");
  const [quote, setQuote] = useState(source?.quote || "");
  const [notes, setNotes] = useState(source?.notes || "");
  const [type, setType] = useState(source?.type || "book");
  const [tags, setTags] = useState((source as any)?.tags || "");
  const [summary, setSummary] = useState((source as any)?.summary || "");

  useEffect(() => {
    if (open) {
      setTitle(source?.title || "");
      setAuthor(source?.author || "");
      setUrl(source?.url || "");
      setQuote(source?.quote || "");
      setNotes(source?.notes || "");
      setType(source?.type || "book");
      setTags((source as any)?.tags || "");
      setSummary((source as any)?.summary || "");
    }
  }, [open, source?.id]);

  const mutation = useMutation({
    mutationFn: (data: any) => source
      ? apiRequest("PATCH", `/api/sources/${source.id}`, data)
      : apiRequest("POST", `/api/books/${bookId}/sources`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "sources"] });
      onClose();
      toast({ title: source ? s.sourceUpdated : s.sourceAdded });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-card border-card-border rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="tracking-tight">{source ? s.dialogTitleEdit : s.dialogTitleNew}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{s.labelTitle}</Label>
              <Input
                data-testid="input-source-title"
                value={title} onChange={e => setTitle(e.target.value)}
                placeholder={s.phTitle}
                className="bg-background rounded-xl h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{s.labelType}</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="bg-background rounded-xl h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{s.sourceTypes[t.value as keyof typeof s.sourceTypes] || t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{s.labelAuthor}</Label>
              <Input value={author} onChange={e => setAuthor(e.target.value)} placeholder={s.phAuthor} className="bg-background rounded-xl h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{s.labelUrl}</Label>
              <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." className="bg-background rounded-xl h-10" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">{s.labelQuote}</Label>
            <Textarea value={quote} onChange={e => setQuote(e.target.value)} rows={2} className="bg-background rounded-xl resize-none" placeholder={s.phQuote} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">{s.labelNotes}</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="bg-background rounded-xl resize-none" placeholder={s.phNotes} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium flex items-center gap-1"><Pencil className="h-3 w-3" /> Summary / Key ideas</Label>
            <Textarea value={summary} onChange={e => setSummary(e.target.value)} rows={2} className="bg-background rounded-xl resize-none" placeholder="Core ideas and insights from this source…" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium flex items-center gap-1"><Hash className="h-3 w-3" /> Tags</Label>
            <Input value={tags} onChange={e => setTags(e.target.value)} placeholder="tag1, tag2, tag3…" className="bg-background rounded-xl h-10" />
          </div>
          <div className="flex gap-2.5 justify-end">
            <Button variant="outline" onClick={onClose} className="rounded-xl">{s.cancel}</Button>
            <Button
              onClick={() => mutation.mutate({ title: title.trim(), author, url, quote, notes, type, tags, summary })}
              disabled={!title.trim() || mutation.isPending}
              className="rounded-xl"
              data-testid="button-save-source"
            >
              {mutation.isPending ? s.saving : s.save}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AISuggestedSourceCard({
  source,
  onAdd,
  adding,
  added,
}: {
  source: AISuggestedSource;
  onAdd: (s: AISuggestedSource) => void;
  adding: boolean;
  added: boolean;
}) {
  const { lang } = useLang();
  const si = RESEARCH_I18N[lang];
  const [expanded, setExpanded] = useState(false);
  const typeLabel = si.sourceTypes[source.type as keyof typeof si.sourceTypes] || source.type;

  return (
    <div className={`rounded-xl border transition-all overflow-hidden ${
      added
        ? "border-green-500/30 bg-green-500/5"
        : "border-border bg-background hover:border-primary/30"
    }`}>
      <div className="flex items-start gap-3 p-3">
        <SourceTypeIcon type={source.type} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <h5 className="font-semibold text-sm leading-tight">{source.title}</h5>
              {source.author && <p className="text-xs text-muted-foreground mt-0.5">{source.author}</p>}
            </div>
            <Badge variant="secondary" className="text-[10px] h-4 px-1.5 flex-shrink-0 rounded-full">
              {typeLabel}
            </Badge>
          </div>
          {source.notes && (
            <p className={`text-xs text-muted-foreground mt-1.5 leading-relaxed ${expanded ? "" : "line-clamp-2"}`}>
              {source.notes}
            </p>
          )}
          {source.notes && source.notes.length > 100 && (
            <button
              className="text-[11px] text-primary mt-0.5 flex items-center gap-0.5"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <><ChevronUp className="h-3 w-3" />{si.collapse}</> : <><ChevronDown className="h-3 w-3" />{si.expand}</>}
            </button>
          )}
          {source.url && (
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
              onClick={e => e.stopPropagation()}
            >
              <ExternalLink className="h-3 w-3" />
              {source.url.replace(/^https?:\/\/(www\.)?/, "").slice(0, 35)}
            </a>
          )}
        </div>
        <button
          onClick={() => !added && !adding && onAdd(source)}
          disabled={adding || added}
          data-testid={`button-add-suggested-${source.title.slice(0, 20).replace(/\s/g, "-")}`}
          className={`flex-shrink-0 h-7 w-7 rounded-lg flex items-center justify-center transition-all mt-0.5 ${
            added
              ? "bg-green-500/10 text-green-500"
              : adding
              ? "opacity-50 bg-muted"
              : "bg-primary/10 text-primary hover:bg-primary hover:text-white"
          }`}
        >
          {added
            ? <CheckCircle2 className="h-3.5 w-3.5" />
            : adding
            ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            : <ArrowDownToLine className="h-3.5 w-3.5" />
          }
        </button>
      </div>
    </div>
  );
}

function AIDiscoveryPanel({ bookId, book, sources }: { bookId: number; book: Book; sources: Source[] }) {
  const { toast } = useToast();
  const { handleAiError } = useAiError();
  const { lang } = useLang();
  const { isFreeMode } = useFreeMode();
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<AIResearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedTitles, setAddedTitles] = useState<Set<string>>(new Set());
  const [showAdvice, setShowAdvice] = useState(true);
  const [freeGateOpen, setFreeGateOpen] = useState(false);

  const s = RESEARCH_I18N[lang];
  const QUICK_QUERIES = book.mode === "fiction" ? s.quickFiction : s.quickNonFiction;

  const handleSearch = async (q?: string) => {
    const finalQuery = q || query;
    if (!finalQuery.trim()) return;
    if (isFreeMode) {
      setFreeGateOpen(true);
      return;
    }
    setLoading(true);
    setResult(null);
    setAddedTitles(new Set());

    try {
      const data = await apiRequest("POST", "/api/ai/research", {
        query: finalQuery.trim(),
        bookTitle: book.title,
        bookMode: book.mode,
        existingSources: sources,
        lang,
      });
      setResult(data);
      setShowAdvice(true);
    } catch (e: any) {
      if (!handleAiError(e)) toast({ title: s.errorAi, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const addSourceMutation = useMutation({
    mutationFn: (s: AISuggestedSource) =>
      apiRequest("POST", `/api/books/${bookId}/sources`, {
        title: s.title,
        author: s.author,
        url: s.url || "",
        quote: s.quote || "",
        notes: s.notes,
        type: s.type,
      }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "sources"] });
      setAddedTitles(prev => {
        const next = new Set(Array.from(prev));
        next.add(vars.title);
        return next;
      });
      setAddingId(null);
      toast({ title: s.sourceSavedToLib });
    },
    onError: () => {
      setAddingId(null);
      toast({ title: s.errorAdd, variant: "destructive" });
    },
  });

  const handleAdd = (src: AISuggestedSource) => {
    setAddingId(src.title);
    addSourceMutation.mutate(src);
  };

  const addAll = () => {
    if (!result) return;
    const toAdd = result.sources.filter(s => !addedTitles.has(s.title));
    toAdd.forEach(s => {
      apiRequest("POST", `/api/books/${bookId}/sources`, {
        title: s.title, author: s.author, url: s.url || "",
        quote: s.quote || "", notes: s.notes, type: s.type,
      }).then(() => {
        setAddedTitles(prev => {
          const next = new Set(Array.from(prev));
          next.add(s.title);
          return next;
        });
        queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "sources"] });
      });
    });
    toast({ title: s.sourcesFromAi(toAdd.length) });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Search bar */}
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              data-testid="input-ai-research-query"
              placeholder={s.phSearch}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              className="pl-9 rounded-xl bg-background border-border h-10"
            />
          </div>
          <Button
            onClick={() => handleSearch()}
            disabled={loading || !query.trim()}
            className="rounded-xl gap-2 h-10 px-4 flex-shrink-0"
            data-testid="button-ai-research-search"
          >
            {loading
              ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              : <Sparkles className="h-3.5 w-3.5" />
            }
            {loading ? s.searching : s.find}
          </Button>
        </div>

        {/* Quick queries */}
        <div className="flex gap-1.5 flex-wrap">
          {QUICK_QUERIES.map(q => (
            <button
              key={q}
              data-testid={`quick-research-${q.slice(0, 15).replace(/\s/g, "-")}`}
              onClick={() => { setQuery(q); handleSearch(q); }}
              disabled={loading}
              className="text-xs px-2.5 py-1 rounded-full bg-muted/70 hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/20 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Loading skeleton */}
          {loading && (
            <div className="space-y-3">
              <div className="h-28 bg-muted/60 rounded-2xl animate-pulse" />
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-20 bg-muted/40 rounded-xl animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
              ))}
            </div>
          )}

          {/* Results */}
          {!loading && result && (
            <>
              {/* Strategy advice */}
              {result.advice && (
                <div className="bg-primary/5 border border-primary/20 rounded-2xl overflow-hidden">
                  <button
                    className="w-full flex items-center gap-2 px-4 py-3 text-left"
                    onClick={() => setShowAdvice(!showAdvice)}
                  >
                    <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
                      <Lightbulb className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-sm font-semibold text-primary flex-1 tracking-tight">{s.strategyTitle}</span>
                    {showAdvice
                      ? <ChevronUp className="h-3.5 w-3.5 text-primary/60" />
                      : <ChevronDown className="h-3.5 w-3.5 text-primary/60" />
                    }
                  </button>
                  {showAdvice && (
                    <div className="px-4 pb-4">
                      <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">{result.advice}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Sources header */}
              {result.sources?.length > 0 && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold tracking-tight">{s.recommendedSources}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.sourcesFromAi(result.sources.length)}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addAll}
                    className="rounded-xl text-xs h-7 px-3 gap-1.5"
                    data-testid="button-add-all-sources"
                  >
                    <ArrowDownToLine className="h-3 w-3" />
                    {s.addAll}
                  </Button>
                </div>
              )}

              {/* Source cards */}
              <div className="space-y-2.5">
                {result.sources?.map((s, i) => (
                  <AISuggestedSourceCard
                    key={`${s.title}-${i}`}
                    source={s}
                    onAdd={handleAdd}
                    adding={addingId === s.title}
                    added={addedTitles.has(s.title)}
                  />
                ))}
              </div>

              {/* Re-search prompt */}
              <div className="pt-2">
                <button
                  onClick={() => handleSearch()}
                  className="w-full flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors py-2 border border-dashed border-border hover:border-primary/40 rounded-xl"
                  data-testid="button-regenerate-research"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  {s.regenerate}
                </button>
              </div>
            </>
          )}

          {/* Empty state */}
          {!loading && !result && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-base mb-2 tracking-tight">{s.aiSearchTitle}</h3>
              <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                {s.aiSearchDesc}
              </p>
              <div className="mt-5 flex flex-col gap-2 w-full max-w-xs">
                {QUICK_QUERIES.slice(0, 3).map(q => (
                  <button
                    key={q}
                    onClick={() => { setQuery(q); handleSearch(q); }}
                    className="text-sm px-3 py-2 rounded-xl bg-muted/60 hover:bg-primary/10 hover:text-primary transition-colors text-left flex items-center gap-2"
                  >
                    <Search className="h-3.5 w-3.5 opacity-60 flex-shrink-0" />
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Free Mode Gate — no backdrop, floating card */}
      {freeGateOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center" style={{ pointerEvents: "none" }}>
          <div className="w-full max-w-md mx-4" style={{ pointerEvents: "auto", background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)", border: "1.5px solid rgba(99,102,241,0.55)", borderRadius: "16px", padding: "24px" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(99,102,241,0.18)" }}>
                <Search className="w-5 h-5" style={{ color: "#818CF8" }} />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: "#E2E8F0" }}>
                  {s.freeGateTitle}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: "#818CF8" }}>GPT-OSS · Pollinations</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed mb-5" style={{ color: "#94A3B8" }}>
              {s.freeGateDesc}
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setFreeGateOpen(false)}
                className="w-full py-2.5 rounded-xl text-sm font-semibold transition-colors"
                style={{ background: "rgba(99,102,241,0.15)", color: "#A5B4FC" }}
              >
                {s.close}
              </button>
              <button
                onClick={() => { setFreeGateOpen(false); setLocation("/models"); }}
                className="w-full py-2.5 rounded-xl text-sm font-semibold transition-colors"
                style={{ background: "rgba(249,109,28,0.18)", color: "#FB923C" }}
              >
                {s.addApiKey}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface AIHypothesisSuggestion {
  title: string;
  description: string;
  arguments: string;
  counterarguments: string;
}

function HypothesisTab({ bookId, book, sources }: { bookId: number; book: Book; sources: Source[] }) {
  const { toast } = useToast();
  const { handleAiError } = useAiError();
  const { lang } = useLang();
  const sh = RESEARCH_I18N[lang];
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<AIHypothesisSuggestion[] | null>(null);
  const [editingHyp, setEditingHyp] = useState<Hypothesis | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: hypotheses = [], isLoading } = useQuery<Hypothesis[]>({
    queryKey: ["/api/books", bookId, "hypotheses"],
    queryFn: () => apiRequest("GET", `/api/books/${bookId}/hypotheses`),
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/ai/hypotheses", {
        bookTitle: book.title,
        bookMode: book.mode,
        sources,
        existingHypotheses: hypotheses,
        lang,
      });
      return res.hypotheses as AIHypothesisSuggestion[];
    },
    onSuccess: (data) => {
      setSuggestions(data);
      setIsGenerating(false);
    },
    onError: (e: any) => {
      setIsGenerating(false);
      if (!handleAiError(e)) toast({ title: sh.errorGenerate, variant: "destructive" });
    }
  });

  const addMutation = useMutation({
    mutationFn: (hyp: Partial<InsertHypothesis>) =>
      apiRequest("POST", `/api/books/${bookId}/hypotheses`, hyp),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "hypotheses"] });
      toast({ title: sh.hypAdded });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: Partial<InsertHypothesis> }) =>
      apiRequest("PATCH", `/api/hypotheses/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "hypotheses"] });
      toast({ title: sh.hypUpdated });
      setIsModalOpen(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/hypotheses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "hypotheses"] });
      toast({ title: sh.hypDeleted });
    }
  });

  const handleGenerate = () => {
    setIsGenerating(true);
    generateMutation.mutate();
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">{sh.hypothesesTitle}</h3>
          <p className="text-xs text-muted-foreground">{sh.hypothesesCount(hypotheses.length)}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="rounded-xl h-8 px-3 gap-1.5"
            data-testid="button-ai-generate-hypotheses"
          >
            {isGenerating ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {sh.generate}
          </Button>
          <Button
            size="sm"
            onClick={() => { setEditingHyp(null); setIsModalOpen(true); }}
            className="rounded-xl h-8 px-3 gap-1.5"
            data-testid="button-add-hypothesis"
          >
            <Plus className="h-3.5 w-3.5" />
            {sh.add}
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* AI Suggestions */}
          {suggestions && (
            <div className="space-y-3 bg-primary/5 p-4 rounded-2xl border border-primary/10">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider">{sh.aiSuggestions}</h4>
                <Button variant="ghost" size="sm" onClick={() => setSuggestions(null)} className="h-6 w-6 p-0 rounded-full">
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </div>
              <div className="grid gap-3">
                {suggestions.map((s, i) => (
                  <div key={i} className="bg-background border border-border p-3 rounded-xl space-y-2">
                    <h5 className="font-semibold text-sm leading-tight">{s.title}</h5>
                    <p className="text-xs text-muted-foreground line-clamp-2">{s.description}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-7 rounded-lg text-xs"
                      onClick={() => {
                        addMutation.mutate(s);
                        setSuggestions(prev => prev ? prev.filter((_, idx) => idx !== i) : null);
                      }}
                    >
                      {sh.addHypothesis}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Existing Hypotheses */}
          <div className="grid gap-3">
            {hypotheses.map((hyp) => (
              <HypothesisCard
                key={hyp.id}
                hypothesis={hyp}
                onEdit={(h) => { setEditingHyp(h); setIsModalOpen(true); }}
                onDelete={(id) => deleteMutation.mutate(id)}
                bookId={bookId}
              />
            ))}

            {hypotheses.length === 0 && !suggestions && (
              <div className="py-12 text-center">
                <div className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <FlaskConical className="h-6 w-6 text-muted-foreground" />
                </div>
                <h4 className="font-medium text-sm mb-1">{sh.noHypotheses}</h4>
                <p className="text-xs text-muted-foreground max-w-[200px] mx-auto">
                  {sh.noHypothesesDesc}
                </p>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      <HypothesisDialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        hypothesis={editingHyp || undefined}
        onSave={(data) => editingHyp ? updateMutation.mutate({ id: editingHyp.id, data }) : addMutation.mutate(data)}
      />
    </div>
  );
}

function HypothesisCard({ hypothesis, onEdit, onDelete, bookId }: {
  hypothesis: Hypothesis;
  onEdit: (h: Hypothesis) => void;
  onDelete: (id: number) => void;
  bookId: number;
}) {
  const { lang } = useLang();
  const hc = RESEARCH_I18N[lang];
  const { showError } = useAiError();
  const [expanded, setExpanded] = useState(false);
  const [assessment, setAssessment] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const handleTest = async () => {
    setIsTesting(true);
    try {
      const content = [
        `Hypothesis: ${hypothesis.title}`,
        hypothesis.description ? `Description: ${hypothesis.description}` : "",
        hypothesis.arguments ? `Arguments: ${hypothesis.arguments}` : "",
        hypothesis.counterarguments ? `Counterarguments: ${hypothesis.counterarguments}` : "",
      ].filter(Boolean).join("\n");
      const res = await apiRequest("POST", "/api/ai/improve", {
        text: content,
        mode: "improve",
        customInstruction: "Do not rewrite this text. Act as a critical research methodologist. Evaluate this hypothesis: assess logical soundness, identify gaps in argumentation, suggest missing evidence types, rate the existing arguments vs counterarguments, point out potential research methods to test it, and give a verdicts on its current status. Be rigorous and specific.",
      });
      setAssessment(res.improved || "");
    } catch (e: any) {
      showError(e?.message || hc.errorAi);
    } finally {
      setIsTesting(false);
    }
  };

  const statusColors: Record<string, string> = {
    hypothesis: "bg-blue-500/10 text-blue-600 border-blue-200",
    testing: "bg-amber-500/10 text-amber-600 border-amber-200",
    confirmed: "bg-green-500/10 text-green-600 border-green-200",
    refuted: "bg-red-500/10 text-red-600 border-red-200",
  };

  const statusLabels: Record<string, string> = {
    hypothesis: hc.statusHypothesis,
    testing: hc.statusTesting,
    confirmed: hc.statusConfirmed,
    refuted: hc.statusRefuted,
  };

  const argCount = hypothesis.arguments?.split(';').filter(Boolean).length || 0;
  const counterCount = hypothesis.counterarguments?.split(';').filter(Boolean).length || 0;

  return (
    <div
      data-testid={`hypothesis-card-${hypothesis.id}`}
      className="bg-card border border-card-border rounded-xl p-4 hover-elevate transition-all"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <Badge className={`${statusColors[hypothesis.status || 'hypothesis']} text-[10px] px-1.5 py-0 h-4 uppercase font-bold border rounded-full`}>
              {statusLabels[hypothesis.status || 'hypothesis']}
            </Badge>
          </div>
          <h4 className="font-semibold text-sm leading-snug">{hypothesis.title}</h4>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => onEdit(hypothesis)}>
            <Edit className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:text-destructive" onClick={() => onDelete(hypothesis.id)}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <p className={`text-xs text-muted-foreground leading-relaxed ${expanded ? "" : "line-clamp-2"}`}>
        {hypothesis.description}
      </p>

      <div className="flex items-center gap-3 mt-3 flex-wrap">
        <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
          <CheckCircle2 className="h-3 w-3 text-green-500" />
          {hc.argCount(argCount)}
        </div>
        <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
          <Info className="h-3 w-3 text-red-500" />
          {hc.counterCount(counterCount)}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-[11px] gap-1 text-muted-foreground hover:text-primary rounded-lg"
          onClick={handleTest}
          disabled={isTesting}
        >
          {isTesting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Microscope className="h-3 w-3" />}
          {isTesting ? hc.testingHypothesis : hc.testHypothesis}
        </Button>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[11px] text-primary ml-auto font-medium"
        >
          {expanded ? hc.collapse : hc.expand}
        </button>
      </div>

      {assessment && (
        <div className="mt-3 pt-3 border-t border-border animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              {hc.hypothesisAnalysis}
            </span>
            <button
              onClick={() => setAssessment(null)}
              className="text-[10px] text-muted-foreground hover:text-foreground"
            >
              {hc.closeAnalysis}
            </button>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{assessment}</p>
        </div>
      )}

      {expanded && (
        <div className="mt-4 pt-4 border-t border-border space-y-4 animate-in fade-in slide-in-from-top-1">
          {hypothesis.arguments && (
            <div className="space-y-2">
              <h5 className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">{hc.arguments}</h5>
              <ul className="space-y-1.5">
                {hypothesis.arguments.split(';').filter(Boolean).map((arg, i) => (
                  <li key={i} className="text-xs flex gap-2">
                    <span className="w-1 h-1 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                    {arg.trim()}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {hypothesis.counterarguments && (
            <div className="space-y-2">
              <h5 className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">{hc.counterarguments}</h5>
              <ul className="space-y-1.5">
                {hypothesis.counterarguments.split(';').filter(Boolean).map((arg, i) => (
                  <li key={i} className="text-xs flex gap-2">
                    <span className="w-1 h-1 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                    {arg.trim()}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function HypothesisDialog({ open, onClose, hypothesis, onSave }: {
  open: boolean;
  onClose: () => void;
  hypothesis?: Hypothesis;
  onSave: (data: any) => void;
}) {
  const { lang } = useLang();
  const hd = RESEARCH_I18N[lang];
  const [title, setTitle] = useState(hypothesis?.title || "");
  const [description, setDescription] = useState(hypothesis?.description || "");
  const [status, setStatus] = useState(hypothesis?.status || "hypothesis");
  const [args, setArgs] = useState(hypothesis?.arguments || "");
  const [counters, setCounters] = useState(hypothesis?.counterarguments || "");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-card border-card-border rounded-2xl">
        <DialogHeader>
          <DialogTitle>{hypothesis ? hd.hypDialogEdit : hd.hypDialogNew}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs">{hd.labelHypTitle}</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder={hd.phHypTitle} className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{hd.labelStatus}</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hypothesis">{hd.statusHypothesis}</SelectItem>
                <SelectItem value="testing">{hd.statusTesting}</SelectItem>
                <SelectItem value="confirmed">{hd.statusConfirmed}</SelectItem>
                <SelectItem value="refuted">{hd.statusRefuted}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{hd.labelDescription}</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder={hd.phDescription} className="rounded-xl resize-none" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{hd.labelArguments}</Label>
            <Textarea value={args} onChange={e => setArgs(e.target.value)} rows={2} placeholder={hd.phArguments} className="rounded-xl resize-none" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{hd.labelCounterargs}</Label>
            <Textarea value={counters} onChange={e => setCounters(e.target.value)} rows={2} placeholder={hd.phCounterargs} className="rounded-xl resize-none" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="rounded-xl">{hd.cancel}</Button>
            <Button onClick={() => {
              onSave({ title, description, status, arguments: args, counterarguments: counters });
              onClose();
            }} disabled={!title} className="rounded-xl">{hd.save}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Drafts Module ────────────────────────────────────────────────────────────

const DRAFT_TYPES: { value: string; label: string; icon: any; color: string; bg: string }[] = [
  { value: "paragraph",        label: "Paragraph",         icon: AlignLeft,     color: "#3B82F6", bg: "#EFF6FF" },
  { value: "scene",            label: "Scene",             icon: BookOpen,      color: "#8B5CF6", bg: "#F5F3FF" },
  { value: "argument",         label: "Argument",          icon: Target,        color: "#F59E0B", bg: "#FFFBEB" },
  { value: "opening",          label: "Opening",           icon: Feather,       color: "#10B981", bg: "#F0FDF4" },
  { value: "exploratory",      label: "Exploratory",       icon: Compass,       color: "#0D9488", bg: "#F0FDFA" },
  { value: "alternate_version",label: "Alt Version",       icon: GitBranch,     color: "#6366F1", bg: "#EEF2FF" },
  { value: "deleted_fragment", label: "Deleted Fragment",  icon: Scissors,      color: "#EF4444", bg: "#FEF2F2" },
  { value: "unused_fragment",  label: "Unused Fragment",   icon: Archive,       color: "#6B7280", bg: "#F9FAFB" },
  { value: "voice_test",       label: "Voice Test",        icon: Mic,           color: "#EC4899", bg: "#FDF2F8" },
  { value: "experiment",       label: "Experiment",        icon: FlaskConical,  color: "#F96D1C", bg: "#FFF7ED" },
];

function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

type DraftView = "list" | "editor" | "compare";

function DraftsTab({ bookId, book }: { bookId: number; book: Book }) {
  const { toast } = useToast();

  // ── View state ───────────────────────────────────────────────────────────────
  const [view, setView] = useState<DraftView>("list");
  const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // ── Editor state ─────────────────────────────────────────────────────────────
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editType, setEditType] = useState("paragraph");
  const [editStatus, setEditStatus] = useState("active");
  const [editNoteIds, setEditNoteIds] = useState<number[]>([]);
  const [editSourceIds, setEditSourceIds] = useState<number[]>([]);
  const [showConnectNotes, setShowConnectNotes] = useState(false);
  const [showConnectSources, setShowConnectSources] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isDirty = useRef(false);

  // ── Compare state ────────────────────────────────────────────────────────────
  const [compareA, setCompareA] = useState<number | null>(null);
  const [compareB, setCompareB] = useState<number | null>(null);

  // ── Generate modal state ─────────────────────────────────────────────────────
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [genNoteIds, setGenNoteIds] = useState<number[]>([]);
  const [genType, setGenType] = useState("paragraph");
  const [genInstruction, setGenInstruction] = useState("");
  const [genLoading, setGenLoading] = useState(false);

  // ── Queries ──────────────────────────────────────────────────────────────────
  const { data: drafts = [], isLoading: draftsLoading } = useQuery<Draft[]>({
    queryKey: ["/api/books", bookId, "drafts"],
    queryFn: () => apiRequest("GET", `/api/books/${bookId}/drafts`),
  });

  const { data: notes = [] } = useQuery<any[]>({
    queryKey: ["/api/books", bookId, "notes"],
    queryFn: () => apiRequest("GET", `/api/books/${bookId}/notes`),
  });

  const { data: sources = [] } = useQuery<any[]>({
    queryKey: ["/api/books", bookId, "sources"],
    queryFn: () => apiRequest("GET", `/api/books/${bookId}/sources`),
  });

  const { data: chapters = [] } = useQuery<any[]>({
    queryKey: ["/api/books", bookId, "chapters"],
    queryFn: () => apiRequest("GET", `/api/books/${bookId}/chapters`),
  });

  // ── Mutations ────────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/api/books/${bookId}/drafts`, data),
    onSuccess: (d: Draft) => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "drafts"] });
      setSelectedDraft(d);
      toast({ title: "Draft created" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/drafts/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "drafts"] });
      isDirty.current = false;
      toast({ title: "Saved" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/drafts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "drafts"] });
      if (view === "editor") { setView("list"); setSelectedDraft(null); }
      toast({ title: "Draft deleted" });
    },
  });

  const createChapterMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/api/books/${bookId}/chapters`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "chapters"] });
      toast({ title: "Chapter seed created in Editor" });
    },
  });

  // ── Open editor ──────────────────────────────────────────────────────────────
  const openEditor = (d: Draft | null) => {
    if (d) {
      setSelectedDraft(d);
      setEditTitle(d.title);
      setEditContent(d.content || "");
      setEditType(d.type || "paragraph");
      setEditStatus(d.status || "active");
      const nIds = (d.connectedNoteIds || "").split(",").map(Number).filter(Boolean);
      const sIds = (d.connectedSourceIds || "").split(",").map(Number).filter(Boolean);
      setEditNoteIds(nIds);
      setEditSourceIds(sIds);
    } else {
      setSelectedDraft(null);
      setEditTitle("");
      setEditContent("");
      setEditType("paragraph");
      setEditStatus("active");
      setEditNoteIds([]);
      setEditSourceIds([]);
    }
    setShowConnectNotes(false);
    setShowConnectSources(false);
    isDirty.current = false;
    setView("editor");
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const handleSave = (andReturn = false) => {
    if (!editTitle.trim()) { toast({ title: "Title required", variant: "destructive" }); return; }
    const data = {
      title: editTitle.trim(),
      content: editContent,
      type: editType,
      status: editStatus,
      connectedNoteIds: editNoteIds.join(","),
      connectedSourceIds: editSourceIds.join(","),
      wordCount: countWords(editContent),
    };
    if (selectedDraft) {
      updateMutation.mutate({ id: selectedDraft.id, data });
    } else {
      createMutation.mutate(data);
    }
    if (andReturn) setView("list");
  };

  const handleArchiveToggle = () => {
    if (!selectedDraft) return;
    const newStatus = editStatus === "archived" ? "active" : "archived";
    setEditStatus(newStatus);
    updateMutation.mutate({ id: selectedDraft.id, data: { status: newStatus } });
    toast({ title: newStatus === "archived" ? "Archived" : "Restored" });
  };

  const handleSendToBoard = async () => {
    if (!selectedDraft && !editTitle.trim()) return;
    const title = editTitle || selectedDraft?.title || "Draft";
    const content = editContent || selectedDraft?.content || "";
    try {
      const boardRes = await apiRequest("GET", `/api/books/${bookId}/board`);
      let boardState: { nodes: any[]; edges: any[] } = { nodes: [], edges: [] };
      if (boardRes?.data) { try { boardState = JSON.parse(boardRes.data); } catch {} }
      const newNode = {
        id: `draft-${Date.now()}`,
        type: "chapter_seed",
        content: title,
        description: content.slice(0, 200),
        x: 100 + Math.random() * 200,
        y: 100 + Math.random() * 200,
        width: 200,
        height: 80,
      };
      boardState.nodes.push(newNode);
      await apiRequest("PATCH", `/api/books/${bookId}/board`, { data: JSON.stringify(boardState) });
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "board"] });
      toast({ title: "Sent to Idea Board" });
    } catch { toast({ title: "Could not reach board", variant: "destructive" }); }
  };

  const handleConvertToChapter = () => {
    if (!editTitle.trim()) { toast({ title: "Title required", variant: "destructive" }); return; }
    createChapterMutation.mutate({
      title: editTitle.trim(),
      content: editContent,
      type: "chapter",
      order: (chapters.length || 0) + 1,
    });
  };

  const handleGenerateDraft = async () => {
    if (genNoteIds.length === 0) { toast({ title: "Select at least one note", variant: "destructive" }); return; }
    const selectedNotes = notes.filter((n: any) => genNoteIds.includes(n.id));
    setGenLoading(true);
    try {
      const prompt = [
        `You are a creative writing assistant. Generate a raw, experimental ${genType} draft based on these notes from a book called "${book.title}".`,
        genInstruction ? `Additional instruction: ${genInstruction}` : "",
        "",
        "Notes:",
        ...selectedNotes.map((n: any, i: number) => `${i + 1}. [${n.title}] ${n.content || ""}`),
        "",
        `Generate a ${genType} draft that synthesizes these notes into flowing, raw prose. Keep it experimental and unfinished — this is a draft, not a finished piece. Do not use headers or lists.`,
      ].filter(Boolean).join("\n");

      const resp = await fetch("https://text.pollinations.ai/openai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "openai",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.85,
          max_tokens: 600,
        }),
      });
      const data = await resp.json();
      const generated = data?.choices?.[0]?.message?.content?.trim() || "";
      if (!generated) throw new Error("Empty response");

      const title = `Draft from ${selectedNotes.length} notes`;
      createMutation.mutate({
        title,
        content: generated,
        type: genType,
        status: "active",
        connectedNoteIds: genNoteIds.join(","),
        connectedSourceIds: "",
        wordCount: countWords(generated),
      });
      setShowGenerateModal(false);
      setGenNoteIds([]);
      setGenInstruction("");
      setTimeout(() => {
        const created = (drafts as any[]).find((d: any) => d.title === title);
        if (created) openEditor(created);
      }, 700);
    } catch {
      toast({ title: "Generation failed — try again", variant: "destructive" });
    } finally {
      setGenLoading(false);
    }
  };

  // ── Filtered list ────────────────────────────────────────────────────────────
  const filteredDrafts = drafts.filter((d: Draft) => {
    if (!showArchived && d.status === "archived") return false;
    if (typeFilter !== "all" && d.type !== typeFilter) return false;
    return true;
  });

  const activeDrafts = drafts.filter((d: Draft) => d.status !== "archived");
  const archivedDrafts = drafts.filter((d: Draft) => d.status === "archived");

  // ── Compare view ─────────────────────────────────────────────────────────────
  if (view === "compare") {
    const draftA = drafts.find((d: Draft) => d.id === compareA);
    const draftB = drafts.find((d: Draft) => d.id === compareB);
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border flex-shrink-0">
          <button onClick={() => setView("list")} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-secondary text-muted-foreground transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <Columns2 className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold text-sm">Compare Drafts</span>
        </div>
        <div className="grid grid-cols-2 gap-0 flex-1 overflow-hidden divide-x divide-border">
          {[{ id: compareA, setId: setCompareA, draft: draftA }, { id: compareB, setId: setCompareB, draft: draftB }].map((col, i) => (
            <div key={i} className="flex flex-col h-full overflow-hidden">
              <div className="px-3 py-2 border-b border-border flex-shrink-0">
                <select
                  value={col.id ?? ""}
                  onChange={e => col.setId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full text-xs bg-secondary rounded-lg px-2 py-1.5 outline-none border border-border"
                >
                  <option value="">Select draft…</option>
                  {drafts.map((d: Draft) => <option key={d.id} value={d.id}>{d.title}</option>)}
                </select>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-4">
                  {col.draft ? (
                    <>
                      <div className="flex items-center gap-2 mb-3">
                        {(() => { const dt = DRAFT_TYPES.find(t => t.value === col.draft!.type) || DRAFT_TYPES[0]; const DtIcon = dt.icon; return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: dt.bg, color: dt.color }}><DtIcon className="h-2.5 w-2.5" />{dt.label}</span>; })()}
                        <span className="text-[10px] text-muted-foreground">{countWords(col.draft.content || "")} words</span>
                      </div>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/80 font-mono">{col.draft.content || <span className="text-muted-foreground/40 italic">Empty</span>}</p>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground/50 italic pt-4">Select a draft above</p>
                  )}
                </div>
              </ScrollArea>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Editor view ──────────────────────────────────────────────────────────────
  if (view === "editor") {
    const currentDT = DRAFT_TYPES.find(t => t.value === editType) || DRAFT_TYPES[0];
    const wordCount = countWords(editContent);
    const isArchived = editStatus === "archived";

    return (
      <div className="h-full flex flex-col" style={{ background: isArchived ? "#FAFAFA" : undefined }}>
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border flex-shrink-0">
          <button
            onClick={() => { if (isDirty.current) handleSave(); setView("list"); }}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-secondary text-muted-foreground transition-colors flex-shrink-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <input
            value={editTitle}
            onChange={e => { setEditTitle(e.target.value); isDirty.current = true; }}
            placeholder="Draft title…"
            className="flex-1 bg-transparent outline-none text-sm font-semibold placeholder:font-normal placeholder:text-muted-foreground/50 min-w-0"
          />
          <button
            onClick={() => handleSave(false)}
            disabled={updateMutation.isPending || createMutation.isPending}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-50 flex-shrink-0"
            style={{ background: "#F96D1C" }}
          >
            {(updateMutation.isPending || createMutation.isPending) ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            Save
          </button>
        </div>

        {/* Type selector */}
        <div className="px-3 py-2 flex gap-1.5 flex-wrap border-b border-border/40 flex-shrink-0 overflow-x-auto">
          {DRAFT_TYPES.map(dt => {
            const DtIcon = dt.icon;
            return (
              <button
                key={dt.value}
                onClick={() => { setEditType(dt.value); isDirty.current = true; }}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all flex-shrink-0"
                style={{
                  background: editType === dt.value ? dt.bg : "hsl(var(--secondary))",
                  color: editType === dt.value ? dt.color : "hsl(var(--muted-foreground))",
                  border: editType === dt.value ? `1.5px solid ${dt.color}40` : "1.5px solid transparent",
                }}
              >
                <DtIcon className="h-2.5 w-2.5" />
                {dt.label}
              </button>
            );
          })}
        </div>

        {/* Main writing area */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 min-h-full">
            <textarea
              ref={textareaRef}
              value={editContent}
              onChange={e => { setEditContent(e.target.value); isDirty.current = true; }}
              placeholder={`Start writing your ${currentDT.label.toLowerCase()}… This is a free space. No structure required. Think out loud.`}
              className="w-full min-h-[280px] bg-transparent outline-none text-sm leading-[1.85] placeholder:text-muted-foreground/35 resize-none font-mono"
              style={{ color: isArchived ? "hsl(var(--muted-foreground))" : undefined }}
            />
          </div>

          {/* Status bar */}
          <div className="px-4 pb-2 flex items-center gap-3 text-[10px] text-muted-foreground/60 border-t border-border/30 pt-2 flex-shrink-0">
            <span className="flex items-center gap-1"><AlignLeft className="h-2.5 w-2.5" />{wordCount} words</span>
            <span className="flex items-center gap-1" style={{ color: currentDT.color }}>
              {(() => { const DtIcon = currentDT.icon; return <DtIcon className="h-2.5 w-2.5" />; })()}
              {currentDT.label}
            </span>
            {isArchived && <span className="flex items-center gap-1 text-amber-500"><Archive className="h-2.5 w-2.5" />Archived</span>}
          </div>

          {/* Connect Notes */}
          <div className="mx-4 mb-2 rounded-xl border border-border/60 overflow-hidden">
            <button
              onClick={() => setShowConnectNotes(v => !v)}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-muted-foreground hover:bg-secondary/50 transition-colors"
            >
              <Link2 className="h-3 w-3" />
              Connected Notes
              {editNoteIds.length > 0 && <span className="ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: "rgba(59,130,246,0.12)", color: "#3B82F6" }}>{editNoteIds.length}</span>}
              {showConnectNotes ? <ChevronUp className="h-3 w-3 ml-auto" /> : <ChevronDown className="h-3 w-3 ml-auto" />}
            </button>
            {showConnectNotes && (
              <div className="border-t border-border/50 max-h-40 overflow-y-auto">
                {notes.length === 0 ? (
                  <p className="px-3 py-3 text-xs text-muted-foreground/60 italic">No notes yet</p>
                ) : (
                  notes.map((n: any) => (
                    <label key={n.id} className="flex items-center gap-2.5 px-3 py-2 hover:bg-secondary/40 cursor-pointer group">
                      <div className={`w-3.5 h-3.5 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${editNoteIds.includes(n.id) ? "border-blue-500 bg-blue-500" : "border-border"}`}>
                        {editNoteIds.includes(n.id) && <Check className="h-2 w-2 text-white" />}
                      </div>
                      <input type="checkbox" className="sr-only" checked={editNoteIds.includes(n.id)}
                        onChange={e => {
                          setEditNoteIds(prev => e.target.checked ? [...prev, n.id] : prev.filter(id => id !== n.id));
                          isDirty.current = true;
                        }}
                      />
                      <span className="text-xs truncate">{n.title}</span>
                      {n.type && <span className="ml-auto text-[10px] text-muted-foreground/50 capitalize flex-shrink-0">{n.type}</span>}
                    </label>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Connect Sources */}
          <div className="mx-4 mb-3 rounded-xl border border-border/60 overflow-hidden">
            <button
              onClick={() => setShowConnectSources(v => !v)}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-muted-foreground hover:bg-secondary/50 transition-colors"
            >
              <BookMarked className="h-3 w-3" />
              Connected Sources
              {editSourceIds.length > 0 && <span className="ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: "rgba(139,92,246,0.12)", color: "#8B5CF6" }}>{editSourceIds.length}</span>}
              {showConnectSources ? <ChevronUp className="h-3 w-3 ml-auto" /> : <ChevronDown className="h-3 w-3 ml-auto" />}
            </button>
            {showConnectSources && (
              <div className="border-t border-border/50 max-h-40 overflow-y-auto">
                {sources.length === 0 ? (
                  <p className="px-3 py-3 text-xs text-muted-foreground/60 italic">No sources yet</p>
                ) : (
                  sources.map((s: any) => (
                    <label key={s.id} className="flex items-center gap-2.5 px-3 py-2 hover:bg-secondary/40 cursor-pointer">
                      <div className={`w-3.5 h-3.5 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${editSourceIds.includes(s.id) ? "border-violet-500 bg-violet-500" : "border-border"}`}>
                        {editSourceIds.includes(s.id) && <Check className="h-2 w-2 text-white" />}
                      </div>
                      <input type="checkbox" className="sr-only" checked={editSourceIds.includes(s.id)}
                        onChange={e => {
                          setEditSourceIds(prev => e.target.checked ? [...prev, s.id] : prev.filter(id => id !== s.id));
                          isDirty.current = true;
                        }}
                      />
                      <span className="text-xs truncate">{s.title}</span>
                      {s.author && <span className="ml-auto text-[10px] text-muted-foreground/50 flex-shrink-0 truncate max-w-[80px]">{s.author}</span>}
                    </label>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Action bar */}
          <div className="flex items-center gap-2 px-4 pb-4 flex-wrap">
            <button
              onClick={handleArchiveToggle}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-medium border transition-all hover:opacity-80"
              style={{ borderColor: "rgba(0,0,0,0.08)", color: isArchived ? "#10B981" : "#6B7280" }}
            >
              <Archive className="h-3 w-3" />
              {isArchived ? "Restore" : "Archive"}
            </button>
            <button
              onClick={handleSendToBoard}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-medium border transition-all hover:opacity-80"
              style={{ borderColor: "rgba(99,102,241,0.25)", color: "#6366F1", background: "rgba(99,102,241,0.05)" }}
            >
              <StickyNote className="h-3 w-3" />
              Send to Board
            </button>
            <button
              onClick={handleConvertToChapter}
              disabled={createChapterMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-medium border transition-all hover:opacity-80 disabled:opacity-50"
              style={{ borderColor: "rgba(249,109,28,0.25)", color: "#F96D1C", background: "rgba(249,109,28,0.05)" }}
            >
              <ArrowDownToLine className="h-3 w-3" />
              → Chapter seed
            </button>
            {selectedDraft && (
              <button
                onClick={() => deleteMutation.mutate(selectedDraft.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-medium border transition-all hover:opacity-80 ml-auto"
                style={{ borderColor: "rgba(239,68,68,0.20)", color: "#EF4444" }}
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── List view ────────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex-shrink-0">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <h3 className="font-semibold text-sm flex items-center gap-1.5">
              <FileEdit className="h-3.5 w-3.5" style={{ color: "#F96D1C" }} />
              Drafts
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {activeDrafts.length} active{archivedDrafts.length > 0 ? ` · ${archivedDrafts.length} archived` : ""}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {drafts.length >= 2 && (
              <button
                onClick={() => setView("compare")}
                title="Compare two drafts"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors border border-border hover:bg-secondary"
                style={{ color: "hsl(var(--muted-foreground))" }}
              >
                <Columns2 className="h-3 w-3" />
                Compare
              </button>
            )}
            <button
              onClick={() => setShowGenerateModal(true)}
              title="Generate draft from notes"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors"
              style={{ background: "rgba(139,92,246,0.10)", color: "#8B5CF6", border: "1px solid rgba(139,92,246,0.20)" }}
            >
              <Wand2 className="h-3 w-3" />
              Generate
            </button>
            <button
              onClick={() => openEditor(null)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors"
              style={{ background: "rgba(249,109,28,0.10)", color: "#F96D1C", border: "1px solid rgba(249,109,28,0.20)" }}
            >
              <Plus className="h-3 w-3" />
              New
            </button>
          </div>
        </div>

        {/* Filter row */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setTypeFilter("all")}
            className="flex-shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors"
            style={{
              background: typeFilter === "all" ? "hsl(var(--secondary))" : "transparent",
              color: typeFilter === "all" ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
            }}
          >
            All
          </button>
          {DRAFT_TYPES.map(dt => {
            const DtIcon = dt.icon;
            const count = drafts.filter((d: Draft) => d.type === dt.value).length;
            if (count === 0) return null;
            return (
              <button
                key={dt.value}
                onClick={() => setTypeFilter(dt.value)}
                className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all"
                style={{
                  background: typeFilter === dt.value ? dt.bg : "transparent",
                  color: typeFilter === dt.value ? dt.color : "hsl(var(--muted-foreground))",
                  border: typeFilter === dt.value ? `1px solid ${dt.color}30` : "1px solid transparent",
                }}
              >
                <DtIcon className="h-2.5 w-2.5" />
                {dt.label}
                <span className="opacity-60">{count}</span>
              </button>
            );
          })}
        </div>

        {archivedDrafts.length > 0 && (
          <button
            onClick={() => setShowArchived(v => !v)}
            className="mt-1.5 text-[10px] font-medium text-muted-foreground/70 hover:text-muted-foreground transition-colors flex items-center gap-1"
          >
            <Archive className="h-2.5 w-2.5" />
            {showArchived ? "Hide archived" : `Show ${archivedDrafts.length} archived`}
          </button>
        )}
      </div>

      {/* Draft list */}
      <ScrollArea className="flex-1">
        <div className="px-4 pb-4 space-y-2">
          {draftsLoading ? (
            Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 bg-muted/40 rounded-xl animate-pulse" />)
          ) : filteredDrafts.length === 0 ? (
            <div className="py-14 text-center">
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
                <FileEdit className="h-6 w-6 text-muted-foreground/30" />
              </div>
              <h4 className="font-medium text-sm mb-1 text-muted-foreground">
                {drafts.length === 0 ? "No drafts yet" : "No drafts match this filter"}
              </h4>
              <p className="text-xs text-muted-foreground/60 max-w-[200px] mx-auto leading-relaxed">
                {drafts.length === 0
                  ? "Raw fragments, alternate versions, experimental writing — this is the pre-chapter space."
                  : "Try a different filter or create a new draft."}
              </p>
            </div>
          ) : (
            filteredDrafts.map((draft: Draft) => {
              const dt = DRAFT_TYPES.find(t => t.value === draft.type) || DRAFT_TYPES[0];
              const DtIcon = dt.icon;
              const noteCount = (draft.connectedNoteIds || "").split(",").filter(Boolean).length;
              const sourceCount = (draft.connectedSourceIds || "").split(",").filter(Boolean).length;
              const isArchived = draft.status === "archived";
              return (
                <div
                  key={draft.id}
                  className="group p-3.5 rounded-xl border cursor-pointer transition-all hover:shadow-sm"
                  style={{
                    background: isArchived ? "#FAFAFA" : "hsl(var(--card))",
                    borderColor: isArchived ? "rgba(0,0,0,0.06)" : `${dt.color}20`,
                    opacity: isArchived ? 0.7 : 1,
                  }}
                  onClick={() => openEditor(draft)}
                >
                  <div className="flex items-start gap-2.5 mb-2">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: dt.bg, border: `1px solid ${dt.color}25` }}>
                      <DtIcon className="h-3 w-3" style={{ color: dt.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm leading-snug truncate">{draft.title}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-medium" style={{ color: dt.color }}>{dt.label}</span>
                        {(draft.wordCount || 0) > 0 && <span className="text-[10px] text-muted-foreground/60">{draft.wordCount} w</span>}
                        {noteCount > 0 && <span className="text-[10px] text-muted-foreground/60 flex items-center gap-0.5"><Link2 className="h-2 w-2" />{noteCount}</span>}
                        {sourceCount > 0 && <span className="text-[10px] text-muted-foreground/60 flex items-center gap-0.5"><BookMarked className="h-2 w-2" />{sourceCount}</span>}
                        {isArchived && <span className="text-[10px] text-amber-500 flex items-center gap-0.5"><Archive className="h-2 w-2" />archived</span>}
                      </div>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); deleteMutation.mutate(draft.id); }}
                      className="w-6 h-6 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all flex-shrink-0"
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                    </button>
                  </div>
                  {draft.content && (
                    <p className="text-xs text-muted-foreground/60 line-clamp-2 pl-8 leading-relaxed">{draft.content}</p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Generate from notes modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl border border-border shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: "rgba(139,92,246,0.12)" }}>
                  <Wand2 className="h-3.5 w-3.5" style={{ color: "#8B5CF6" }} />
                </div>
                <span className="font-semibold text-sm">Generate Draft from Notes</span>
              </div>
              <button onClick={() => setShowGenerateModal(false)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-secondary text-muted-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Note picker */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Select Notes (1–5)</p>
                {notes.length === 0 ? (
                  <p className="text-sm text-muted-foreground/60 italic">No notes in this book yet.</p>
                ) : (
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {notes.slice(0, 20).map((n: any) => (
                      <label key={n.id} className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-secondary/50 cursor-pointer">
                        <div className={`w-4 h-4 rounded-md flex items-center justify-center border transition-colors flex-shrink-0 ${genNoteIds.includes(n.id) ? "bg-violet-500 border-violet-500" : "border-border"}`}>
                          {genNoteIds.includes(n.id) && <Check className="h-2.5 w-2.5 text-white" />}
                        </div>
                        <input type="checkbox" className="sr-only" checked={genNoteIds.includes(n.id)}
                          onChange={e => setGenNoteIds(prev => e.target.checked && prev.length < 5 ? [...prev, n.id] : prev.filter(id => id !== n.id))}
                        />
                        <span className="text-sm truncate">{n.title}</span>
                        {n.type && <span className="ml-auto text-[10px] text-muted-foreground/50 capitalize flex-shrink-0">{n.type}</span>}
                      </label>
                    ))}
                  </div>
                )}
              </div>
              {/* Draft type */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Draft Type</p>
                <div className="flex flex-wrap gap-1.5">
                  {DRAFT_TYPES.slice(0, 6).map(dt => {
                    const DtIcon = dt.icon;
                    return (
                      <button key={dt.value} onClick={() => setGenType(dt.value)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all"
                        style={{ background: genType === dt.value ? dt.bg : "hsl(var(--secondary))", color: genType === dt.value ? dt.color : "hsl(var(--muted-foreground))", border: genType === dt.value ? `1.5px solid ${dt.color}30` : "1.5px solid transparent" }}
                      >
                        <DtIcon className="h-2.5 w-2.5" />{dt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Optional instruction */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Instruction (optional)</p>
                <textarea
                  value={genInstruction}
                  onChange={e => setGenInstruction(e.target.value)}
                  placeholder="e.g. 'Focus on the emotional tension between concepts'"
                  rows={2}
                  className="w-full text-sm bg-secondary/50 rounded-xl px-3 py-2 outline-none border border-border resize-none placeholder:text-muted-foreground/40"
                />
              </div>
            </div>
            <div className="flex gap-2 px-5 pb-5">
              <button onClick={() => setShowGenerateModal(false)} className="flex-1 py-2 rounded-xl text-sm font-medium border border-border hover:bg-secondary transition-colors">Cancel</button>
              <button
                onClick={handleGenerateDraft}
                disabled={genNoteIds.length === 0 || genLoading}
                className="flex-1 py-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #8B5CF6, #6366F1)" }}
              >
                {genLoading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Generating…</> : <><Wand2 className="h-3.5 w-3.5" />Generate</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ResearchPanel({ bookId, book }: { bookId: number; book: Book }) {
  return (
    <div className="h-full overflow-hidden">
      <ResearchWorkspace bookId={bookId} book={book} />
    </div>
  );
}

function _unused_ResearchPanel({ bookId, book }: { bookId: number; book: Book }) {
  const { toast } = useToast();
  const { lang } = useLang();
  const rp = RESEARCH_I18N[lang];
  const [activeTab, setActiveTab] = useState<"notes" | "library" | "dashboard" | "hypotheses" | "drafts" | "models">("dashboard");
  const [showDialog, setShowDialog] = useState(false);
  const [editSource, setEditSource] = useState<Source | undefined>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: sources = [], isLoading } = useQuery<Source[]>({
    queryKey: ["/api/books", bookId, "sources"],
    queryFn: () => apiRequest("GET", `/api/books/${bookId}/sources`),
  });

  const { data: notesData = [] } = useQuery<any[]>({
    queryKey: ["/api/books", bookId, "notes"],
    queryFn: () => apiRequest("GET", `/api/books/${bookId}/notes`),
  });

  const { data: draftsData = [] } = useQuery<any[]>({
    queryKey: ["/api/books", bookId, "drafts"],
    queryFn: () => apiRequest("GET", `/api/books/${bookId}/drafts`),
  });

  const { data: hypothesesData = [] } = useQuery<any[]>({
    queryKey: ["/api/books", bookId, "hypotheses"],
    queryFn: () => apiRequest("GET", `/api/books/${bookId}/hypotheses`),
  });

  const { data: modelsData = [] } = useQuery<any[]>({
    queryKey: ["/api/books", bookId, "role-models"],
    queryFn: () => apiRequest("GET", `/api/books/${bookId}/role-models`),
  });

  const addSourceMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/api/books/${bookId}/sources`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "sources"] });
      toast({ title: rp.sourceSavedToLib });
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      toast({ title: rp.uploadFileTypes, variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const name = file.name.replace(/\.[^.]+$/, "");
      addSourceMutation.mutate({
        title: name,
        type: "research",
        notes: text.slice(0, 4000),
      });
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/sources/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "sources"] });
      toast({ title: rp.sourceDeleted });
    },
  });

  return (
    <div className="h-full flex flex-col bg-sidebar border-l border-border">
      {/* Tab bar */}
      <div className="px-4 mt-4 flex-shrink-0">
        <div className="flex p-1 bg-muted/30 rounded-xl border border-border/50 gap-0.5">
          {([
            { id: "dashboard", icon: Compass, label: "Home" },
            { id: "notes",     icon: Lightbulb, label: "Notes" },
            { id: "library",   icon: BookOpen, label: "Library" },
            { id: "hypotheses",icon: FlaskConical, label: "Ideas" },
            { id: "drafts",    icon: FileEdit, label: "Drafts" },
            { id: "models",    icon: Brain, label: "Models" },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-0.5 py-1.5 text-[9.5px] font-medium rounded-lg transition-all min-w-0 ${activeTab === tab.id ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              <tab.icon className="h-2.5 w-2.5 flex-shrink-0" />
              <span className="truncate">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden mt-2">
        {activeTab === "dashboard" && (
          <ResearchDashboard
            bookId={bookId}
            book={book}
            sources={sources}
            notesCount={notesData.length}
            draftsCount={draftsData.length}
            hypothesesCount={hypothesesData.length}
            modelsCount={modelsData.length}
            modelsAnalyzedCount={modelsData.filter((m: any) => m.analysisStatus === "analyzed").length}
            onNavigate={tab => setActiveTab(tab)}
          />
        )}

        {activeTab === "notes" && (
          <NotesTab bookId={bookId} book={book} />
        )}

        {activeTab === "hypotheses" && (
          <HypothesisTab bookId={bookId} book={book} sources={sources} />
        )}

        {activeTab === "drafts" && (
          <DraftsTab bookId={bookId} book={book} />
        )}

        {activeTab === "library" && (
          <SourcesTab bookId={bookId} book={book} />
        )}

        {activeTab === "models" && (
          <RoleModelsTab bookId={bookId} book={book} />
        )}
      </div>

      <SourceDialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        bookId={bookId}
        source={editSource}
      />
    </div>
  );
}
