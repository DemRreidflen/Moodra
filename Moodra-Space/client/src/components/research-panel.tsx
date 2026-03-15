import { useState, useRef } from "react";
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
  Brain, UserSearch, Upload, Loader2, Microscope
} from "lucide-react";
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
      <DialogContent className="max-w-md bg-card border-card-border rounded-2xl">
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
                    <SelectItem key={t.value} value={t.value}>{s.sourceTypes[t.value as keyof typeof s.sourceTypes]}</SelectItem>
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
            <Textarea
              value={quote} onChange={e => setQuote(e.target.value)}
              rows={3} className="bg-background rounded-xl resize-none"
              placeholder={s.phQuote}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">{s.labelNotes}</Label>
            <Textarea
              value={notes} onChange={e => setNotes(e.target.value)}
              rows={2} className="bg-background rounded-xl resize-none"
              placeholder={s.phNotes}
            />
          </div>
          <div className="flex gap-2.5 justify-end">
            <Button variant="outline" onClick={onClose} className="rounded-xl">{s.cancel}</Button>
            <Button
              onClick={() => mutation.mutate({ title: title.trim(), author, url, quote, notes, type })}
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

export function ResearchPanel({ bookId, book }: { bookId: number; book: Book }) {
  const { toast } = useToast();
  const { lang } = useLang();
  const rp = RESEARCH_I18N[lang];
  const [activeTab, setActiveTab] = useState<"library" | "ai" | "hypotheses">("ai");
  const [showDialog, setShowDialog] = useState(false);
  const [editSource, setEditSource] = useState<Source | undefined>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: sources = [], isLoading } = useQuery<Source[]>({
    queryKey: ["/api/books", bookId, "sources"],
    queryFn: () => apiRequest("GET", `/api/books/${bookId}/sources`),
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
      {/* Tabs Header */}
      <div className="flex p-1 bg-muted/30 mx-4 mt-4 rounded-xl border border-border/50">
        <button
          onClick={() => setActiveTab("ai")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === "ai"
              ? "bg-background text-primary shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Search className="h-3.5 w-3.5" />
          {rp.tabAiSearch}
        </button>
        <button
          onClick={() => setActiveTab("hypotheses")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === "hypotheses"
              ? "bg-background text-primary shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <FlaskConical className="h-3.5 w-3.5" />
          {rp.tabHypotheses}
        </button>
        <button
          onClick={() => setActiveTab("library")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === "library"
              ? "bg-background text-primary shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <BookOpen className="h-3.5 w-3.5" />
          {rp.tabLibrary}
        </button>
      </div>

      <div className="flex-1 overflow-hidden mt-2">
        {activeTab === "ai" && (
          <AIDiscoveryPanel bookId={bookId} book={book} sources={sources} />
        )}

        {activeTab === "hypotheses" && (
          <HypothesisTab bookId={bookId} book={book} sources={sources} />
        )}

        {activeTab === "library" && (
          <div className="h-full flex flex-col">
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,text/plain,text/markdown"
              className="hidden"
              onChange={handleFileUpload}
            />
            <div className="p-4 border-b border-border flex items-center justify-between gap-2">
              <div>
                <h3 className="font-semibold text-sm">{rp.yourSources}</h3>
                <p className="text-xs text-muted-foreground">{rp.materialsCount(sources.length)}</p>
              </div>
              <div className="flex gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-xl h-8 px-3 gap-1.5"
                  data-testid="button-upload-file"
                >
                  <Upload className="h-3.5 w-3.5" />
                  {rp.uploadFile}
                </Button>
                <Button
                  size="sm"
                  onClick={() => { setEditSource(undefined); setShowDialog(true); }}
                  className="rounded-xl h-8 px-3 gap-1.5"
                  data-testid="button-add-source-manual"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {rp.add}
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-24 bg-muted/40 rounded-xl animate-pulse" />
                  ))
                ) : sources.length > 0 ? (
                  sources.map(source => (
                    <SourceCard
                      key={source.id}
                      source={source}
                      onEdit={(s) => { setEditSource(s); setShowDialog(true); }}
                      onDelete={(id) => deleteMutation.mutate(id)}
                    />
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-3">
                      <BookOpen className="h-6 w-6 opacity-40" />
                    </div>
                    <p className="text-sm font-medium">{rp.emptyLibrary}</p>
                    <p className="text-xs max-w-[180px] mt-1">{rp.emptyLibraryDesc}</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
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
