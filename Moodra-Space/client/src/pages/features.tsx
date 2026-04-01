import { useState } from "react";
import { useLocation } from "wouter";
import {
  BookOpen, Brain, Sparkles, Palette, Shield, Zap,
  Feather, Globe, RefreshCw, ScrollText, ArrowLeft,
  Flame, Layers, ArrowRight, PenLine, FileText,
  Users, Scale, Link2, BookMarked, Download, Eye,
  Target, Cpu, Check, Star
} from "lucide-react";
import { useLang } from "@/contexts/language-context";
import { LanguagePicker } from "@/components/language-picker";
import { SiteFooter } from "@/components/site-footer";
import { PageHead } from "@/components/page-head";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

interface FeatureSection {
  icon: React.ElementType;
  color: string;
  badge?: string;
  title: string;
  subtitle: string;
  items: string[];
  highlight?: boolean;
}

interface LangData {
  badge: string;
  heroTitle: string;
  heroSubtitle: string;
  stats: { value: string; label: string }[];
  sections: FeatureSection[];
  ctaTitle: string;
  ctaDesc: string;
  ctaButton: string;
  back: string;
  newBadge: string;
  updBadge: string;
}

// ── Content (all 4 languages) — 6 focused value pillars ──────────────────────

const FEATURES: Record<string, LangData> = {
  en: {
    badge: "Capabilities",
    heroTitle: "Everything a book needs. Nothing that gets in the way.",
    heroSubtitle: "Moodra is a long-form AI writing platform for authors. Structured editing, intelligent AI that knows your voice, research tools, and professional export — one coherent system, built around how books actually get written.",
    newBadge: "New",
    updBadge: "Updated",
    stats: [
      { value: "7", label: "AI Agents" },
      { value: "4", label: "Languages" },
      { value: "3", label: "Export formats" },
      { value: "∞", label: "Books" },
    ],
    sections: [
      {
        icon: BookOpen,
        color: "#F96D1C",
        badge: "Updated",
        title: "The Editor — Built for Books",
        subtitle: "A block-based writing environment structured around how books actually work — not how productivity apps think books work.",
        highlight: true,
        items: [
          "Part → Chapter → Section → Scene hierarchy — manuscript structure built in from sentence one",
          "15+ block types: paragraphs, headings, quotes, arguments, research notes, lists, and dividers",
          "Three writing environments: standard editor, Reading mode (full-screen, no UI), Deep Writing mode (borderless canvas for flow)",
          "Select any text → inline AI toolbar: Improve, Rewrite, Simplify, Expand, Translate, Fix grammar — without leaving the page",
          "Floating format toolbar: bold, italic, underline, colour, highlight, alignment, super/subscript, and inline links",
          "Font scale (70–160 %), editor width (480–1200 px), and line spacing — comfortable on any screen",
          "Auto-save with change tracking — nothing is lost, even if you close the tab",
          "Live word count and per-chapter breakdown",
        ],
      },
      {
        icon: Brain,
        color: "#8B5CF6",
        badge: "New",
        title: "AI That Learns Your Voice",
        subtitle: "Seven specialised analysts and a context-aware co-author — all working with your full book, not just the last paragraph.",
        highlight: true,
        items: [
          "7 AI agents, each reading your chapter from a distinct professional lens: Editor, Critic, Philosopher, Reader, Story Analyst, Argument Analyst, Consistency",
          "Reader archetype selector: Beginner, Expert, Skeptic, Emotional, Editorial — choose whose reaction you need",
          "Book Context panel: set your core idea, themes, tone, and target reader — agents use it to personalise every analysis",
          "AI Co-Author: Continue, Expand, Summarise, Rewrite, Dialogue — or use a free-form custom prompt",
          "Style analysis across 10 dimensions: vocabulary, rhythm, tone, POV, dialogue — AI matches your voice, not a template",
          "Style Deepen: add a custom note to refine exactly how the AI interprets your style",
          "Before/After comparison modal — accept replaces only the selected text, never the whole block",
        ],
      },
      {
        icon: ScrollText,
        color: "#0EA5E9",
        badge: "Updated",
        title: "Drafts and Research in One Place",
        subtitle: "A free-writing workspace and a persistent knowledge base — connected to your book, not scattered across separate apps.",
        items: [
          "Draft stage tracker: Plan → Sketch → Edit → Final, with one-hover advancement and a progress bar across all drafts",
          "AI Draft Assistant: Sketch from plan, Expand theses, Continue text, Ideas for development",
          "Typewriter mode — cursor stays vertically centred; sprint timer (5–60 min) with a word goal",
          "Move any draft to your book as a new chapter or append to an existing one — one click",
          "Codex: a persistent knowledge base for characters, places, objects, and concepts",
          "Codex entries automatically enrich AI context — no copy-pasting between your notes and the AI",
        ],
      },
      {
        icon: Download,
        color: "#F96D1C",
        badge: "Updated",
        title: "Layout and Export",
        subtitle: "See your book as a typeset page. Export in three publishing-ready formats.",
        items: [
          "Paged.js rendering — real CSS @page layout with accurate page breaks, not a preview approximation",
          "Mirror page numbering — asymmetric left/right footers, correct for print",
          "Proper typographic hyphenation (browser-native + Hypher dictionary)",
          "Export to PDF — correct page layout and margins via browser print",
          "Export to EPUB 3 — valid XHTML, navigation document, and embedded metadata",
          "Export to DOCX — Word-compatible with chapter headings preserved",
          "Custom book metadata: title, author, language, and cover colour or image",
        ],
      },
      {
        icon: Flame,
        color: "#ef4444",
        title: "Build a Writing Practice",
        subtitle: "Momentum is a skill. Moodra tracks it so you can build it.",
        items: [
          "Daily writing streak tracker with a calendar heatmap — every session visualised",
          "Custom goals: words per day or chapters per day",
          "Session notes: add a reflection or plan your next session",
          "Focus timer: set a time limit and word target — writing becomes the only task",
        ],
      },
      {
        icon: Shield,
        color: "#10B981",
        title: "Open, Private, and Multilingual",
        subtitle: "Free AI from your first minute. Your data stays yours. Four languages, native UI.",
        items: [
          "Free built-in AI (Pollinations) — no API key, no credit card, no setup required",
          "Connect your own OpenAI key for GPT-4o mini, GPT-4o, or o4-mini (200K context)",
          "Toggle between free AI and your key at any time — no restart needed",
          "Your OpenAI key is stored encrypted and never logged or shared",
          "No ads, no trackers, no training on your content",
          "Full UI in English, Russian, Ukrainian, and German — AI responds in your chosen language",
        ],
      },
    ],
    ctaTitle: "Ready to write your book?",
    ctaDesc: "Start with free AI — no key, no card. Add your OpenAI key when you want more power.",
    ctaButton: "Open your library",
    back: "Back",
  },

  ru: {
    badge: "Возможности",
    heroTitle: "Всё, что нужно книге. Ничего лишнего.",
    heroSubtitle: "Moodra — платформа для длинных текстов: структурированный редактор, AI, который знает ваш голос, инструменты для исследований и профессиональный экспорт — единая система, созданная вокруг того, как книги пишутся на самом деле.",
    newBadge: "Новое",
    updBadge: "Обновлено",
    stats: [
      { value: "7", label: "AI-агентов" },
      { value: "4", label: "языка" },
      { value: "3", label: "формата экспорта" },
      { value: "∞", label: "книг" },
    ],
    sections: [
      {
        icon: BookOpen,
        color: "#F96D1C",
        badge: "Обновлено",
        title: "Редактор — создан для книг",
        subtitle: "Блочная среда письма, выстроенная вокруг того, как работают настоящие книги, — а не вокруг того, как приложения-органайзеры думают, что они работают.",
        highlight: true,
        items: [
          "Иерархия Часть → Глава → Раздел → Сцена — структура рукописи встроена с первой строки",
          "15+ типов блоков: абзацы, заголовки, цитаты, аргументы, исследовательские заметки, списки, разделители",
          "Три режима письма: стандартный редактор, режим чтения (полный экран, без UI), режим глубокого письма (холст без рамок для состояния потока)",
          "Выделите любой текст → встроенный AI-тулбар: Улучшить, Переписать, Упростить, Расширить, Перевести, Исправить грамматику — без выхода со страницы",
          "Плавающая панель форматирования: жирный, курсив, подчёркивание, цвет, выделение, выравнивание, ссылки",
          "Масштаб шрифта (70–160%), ширина редактора (480–1200 px) и межстрочный интервал — удобно на любом экране",
          "Автосохранение и отслеживание изменений — ничего не потеряется, даже если закрыть вкладку",
          "Счётчик слов в реальном времени и статистика по главам",
        ],
      },
      {
        icon: Brain,
        color: "#8B5CF6",
        badge: "Новое",
        title: "AI, который изучает ваш голос",
        subtitle: "Семь специализированных аналитиков и соавтор, который помнит контекст — все работают с вашей полной книгой, а не только с последним абзацем.",
        highlight: true,
        items: [
          "7 AI-агентов, каждый читает главу с отдельной профессиональной позиции: Редактор, Критик, Философ, Читатель, Нарратолог, Аналитик аргументов, Согласованность",
          "Выбор архетипа читателя: Начинающий, Эксперт, Скептик, Эмоциональный, Редакционный — чья реакция вам нужна",
          "Панель контекста книги: идея, темы, тон и целевой читатель — агенты используют их для персонализированного анализа",
          "AI-соавтор: Продолжить, Расширить, Резюмировать, Переписать, Диалог — или свободный промпт для любой задачи",
          "Анализ стиля по 10 параметрам: словарь, ритм, тон, POV, диалоги — AI отражает ваш голос, а не шаблон",
          "Углубление стиля: добавьте заметку, чтобы точнее задать интерпретацию вашего стиля AI",
          "Сравнение «До/После» — кнопка «Применить» заменяет только выделенный текст, а не весь блок",
        ],
      },
      {
        icon: ScrollText,
        color: "#0EA5E9",
        badge: "Обновлено",
        title: "Черновики и исследования — в одном месте",
        subtitle: "Пространство для свободного письма и постоянная база знаний — связаны с вашей книгой, не раскиданы по разным приложениям.",
        items: [
          "Трекер этапов черновика: План → Набросок → Редактура → Финал, с переходом одним наведением и полосой прогресса",
          "AI-помощник для черновиков: Набросок по плану, Расширить тезисы, Продолжить текст, Идеи для развития",
          "Режим пишущей машинки — курсор по центру экрана; таймер спринта (5–60 мин) с целью по словам",
          "Перенести черновик в книгу новой главой или добавить к существующей — одним кликом",
          "Кодекс: постоянная база знаний для персонажей, мест, объектов и концепций",
          "Записи кодекса автоматически обогащают контекст AI — не нужно копировать между заметками и AI",
        ],
      },
      {
        icon: Download,
        color: "#F96D1C",
        badge: "Обновлено",
        title: "Вёрстка и экспорт",
        subtitle: "Посмотрите на книгу как на типографскую страницу. Экспортируйте в три готовых к публикации формата.",
        items: [
          "Движок Paged.js — настоящая CSS @page-вёрстка с точными разрывами страниц, а не имитация превью",
          "Зеркальная нумерация — асимметричные колонтитулы слева/справа для печатной книги",
          "Профессиональные переносы слов (браузерные + словарь Hypher)",
          "Экспорт в PDF — правильная вёрстка и поля через браузерную печать",
          "Экспорт в EPUB 3 — валидный XHTML, навигационный документ и встроенные метаданные",
          "Экспорт в DOCX — совместим с Word, с сохранёнными заголовками глав",
          "Метаданные книги: название, автор, язык и цвет или изображение обложки",
        ],
      },
      {
        icon: Flame,
        color: "#ef4444",
        title: "Выстройте практику письма",
        subtitle: "Импульс — это навык. Moodra отслеживает его, чтобы вы могли его развить.",
        items: [
          "Ежедневный трекер стрика с тепловой картой — каждая сессия письма визуализирована",
          "Кастомные цели: слов в день или глав в день",
          "Заметки к сессии: рефлексия или план следующей",
          "Таймер фокуса: установите лимит времени и цель по словам — письмо становится единственной задачей",
        ],
      },
      {
        icon: Shield,
        color: "#10B981",
        title: "Открытый, приватный, многоязычный",
        subtitle: "Бесплатный AI с первой минуты. Ваши данные остаются у вас. Четыре языка, нативный UI.",
        items: [
          "Встроенный бесплатный AI (Pollinations) — без API-ключа, без карты, без настройки",
          "Подключите свой ключ OpenAI для GPT-4o mini, GPT-4o или o4-mini (200K контекст)",
          "Переключение между бесплатным AI и своим ключом в любое время — без перезапуска",
          "Ключ OpenAI хранится зашифрованным — никогда не логируется и не передаётся",
          "Без рекламы, трекеров и обучения AI на ваших текстах",
          "Полный UI на английском, русском, украинском и немецком — AI отвечает на вашем языке",
        ],
      },
    ],
    ctaTitle: "Готовы писать свою книгу?",
    ctaDesc: "Начните с бесплатным AI — ни ключа, ни карты. Добавьте ключ OpenAI, когда захотите больше возможностей.",
    ctaButton: "В библиотеку",
    back: "Назад",
  },

  ua: {
    badge: "Можливості",
    heroTitle: "Усе, що потрібно книзі. Нічого зайвого.",
    heroSubtitle: "Moodra — платформа для довгих текстів: структурований редактор, AI, який знає ваш голос, інструменти для досліджень і професійний експорт — єдина система, побудована навколо того, як книги пишуться насправді.",
    newBadge: "Нове",
    updBadge: "Оновлено",
    stats: [
      { value: "7", label: "AI-агентів" },
      { value: "4", label: "мови" },
      { value: "3", label: "формати експорту" },
      { value: "∞", label: "книг" },
    ],
    sections: [
      {
        icon: BookOpen,
        color: "#F96D1C",
        badge: "Оновлено",
        title: "Редактор — створений для книг",
        subtitle: "Блокове середовище письма, побудоване навколо того, як насправді влаштовані книги, — а не навколо того, як думають застосунки-органайзери.",
        highlight: true,
        items: [
          "Ієрархія Частина → Розділ → Секція → Сцена — структура рукопису вбудована з першого речення",
          "15+ типів блоків: абзаци, заголовки, цитати, аргументи, дослідницькі нотатки, списки, розділювачі",
          "Три режими письма: стандартний редактор, режим читання (повний екран, без UI), режим глибокого письма (полотно без рамок для стану потоку)",
          "Виділіть будь-який текст → вбудований ШІ-тулбар: Покращити, Переписати, Спростити, Розширити, Перекласти, Виправити граматику — без виходу зі сторінки",
          "Плаваюча панель форматування: жирний, курсив, підкреслення, колір, виділення, вирівнювання, посилання",
          "Масштаб шрифту (70–160%), ширина редактора (480–1200 px) та міжрядковий інтервал — зручно на будь-якому екрані",
          "Автозбереження з відстеженням змін — нічого не загубиться, навіть якщо закрити вкладку",
          "Лічильник слів у реальному часі та статистика по розділах",
        ],
      },
      {
        icon: Brain,
        color: "#8B5CF6",
        badge: "Нове",
        title: "ШІ, який вивчає ваш голос",
        subtitle: "Сім спеціалізованих аналітиків і співавтор з контекстом — усі працюють з вашою повною книгою, а не лише з останнім абзацом.",
        highlight: true,
        items: [
          "7 ШІ-агентів, кожен читає розділ з окремої професійної позиції: Редактор, Критик, Філософ, Читач, Наратолог, Аналітик аргументів, Узгодженість",
          "Вибір архетипу читача: Початківець, Експерт, Скептик, Емоційний, Редакторський — чия реакція вам потрібна",
          "Панель контексту книги: ідея, теми, тон і цільовий читач — агенти використовують для персоналізованого аналізу",
          "ШІ-співавтор: Продовжити, Розширити, Резюмувати, Переписати, Діалог — або вільний промпт для будь-якого завдання",
          "Аналіз стилю за 10 параметрами: словник, ритм, тон, POV, діалоги — ШІ відображає ваш голос, а не шаблон",
          "Поглиблення стилю: додайте нотатку, щоб точніше задати інтерпретацію вашого стилю ШІ",
          "Порівняння «До/Після» — «Застосувати» замінює лише виділений текст, а не весь блок",
        ],
      },
      {
        icon: ScrollText,
        color: "#0EA5E9",
        badge: "Оновлено",
        title: "Чернетки та дослідження — в одному місці",
        subtitle: "Простір для вільного письма і постійна база знань — пов'язані з вашою книгою, а не розкидані по різних застосунках.",
        items: [
          "Трекер етапів чернетки: План → Нарис → Редагування → Фінал, з переходом одним наведенням і смугою прогресу",
          "ШІ-помічник для чернеток: Нарис за планом, Розширити тези, Продовжити текст, Ідеї для розвитку",
          "Режим друкарської машинки — курсор по центру екрана; таймер спринту (5–60 хв) з ціллю по словах",
          "Перенести чернетку до книги новим розділом або додати до існуючого — одним кліком",
          "Кодекс: постійна база знань для персонажів, місць, об'єктів і концепцій",
          "Записи кодексу автоматично збагачують контекст ШІ — не потрібно копіювати між нотатками і ШІ",
        ],
      },
      {
        icon: Download,
        color: "#F96D1C",
        badge: "Оновлено",
        title: "Верстка та експорт",
        subtitle: "Побачте книгу як типографську сторінку. Експортуйте у три готові до публікації формати.",
        items: [
          "Рушій Paged.js — справжня CSS @page-верстка з точними розривами сторінок, а не імітація превью",
          "Дзеркальна нумерація — асиметричні колонтитули ліворуч/праворуч для друкованої книги",
          "Професійні переноси слів (браузерні + словник Hypher)",
          "Експорт у PDF — правильна верстка і поля через браузерний друк",
          "Експорт у EPUB 3 — валідний XHTML, навігаційний документ і вбудовані метадані",
          "Експорт у DOCX — сумісний з Word, зі збереженими заголовками розділів",
          "Метадані книги: назва, автор, мова та колір або зображення обкладинки",
        ],
      },
      {
        icon: Flame,
        color: "#ef4444",
        title: "Побудуйте практику письма",
        subtitle: "Імпульс — це навичка. Moodra відстежує його, щоб ви могли її розвинути.",
        items: [
          "Щоденний трекер стріку з тепловою картою — кожна сесія письма візуалізована",
          "Кастомні цілі: слів на день або розділів на день",
          "Нотатки до сесії: рефлексія або план наступної",
          "Таймер фокусу: встановіть ліміт часу і ціль по словах — письмо стає єдиним завданням",
        ],
      },
      {
        icon: Shield,
        color: "#10B981",
        title: "Відкритий, приватний, багатомовний",
        subtitle: "Безкоштовний ШІ з першої хвилини. Ваші дані залишаються у вас. Чотири мови, нативний UI.",
        items: [
          "Вбудований безкоштовний ШІ (Pollinations) — без API-ключа, без картки, без налаштування",
          "Підключіть власний ключ OpenAI для GPT-4o mini, GPT-4o або o4-mini (200K контекст)",
          "Перемикання між безкоштовним ШІ і власним ключем у будь-який момент — без перезапуску",
          "Ключ OpenAI зберігається зашифрованим — ніколи не логується і не передається",
          "Без реклами, трекерів і навчання ШІ на ваших текстах",
          "Повний UI українською, англійською, російською та німецькою — ШІ відповідає вашою мовою",
        ],
      },
    ],
    ctaTitle: "Готові писати свою книгу?",
    ctaDesc: "Почніть з безкоштовним ШІ — ні ключа, ні картки. Додайте ключ OpenAI, коли захочете більше можливостей.",
    ctaButton: "До бібліотеки",
    back: "Назад",
  },

  de: {
    badge: "Funktionen",
    heroTitle: "Alles, was ein Buch braucht. Nichts, was im Weg steht.",
    heroSubtitle: "Moodra ist eine KI-Schreibplattform für Langform-Texte. Strukturiertes Editieren, eine KI, die deine Stimme kennt, Recherche-Werkzeuge und professioneller Export — ein kohärentes System, das darum herum gebaut ist, wie Bücher wirklich geschrieben werden.",
    newBadge: "Neu",
    updBadge: "Aktualisiert",
    stats: [
      { value: "7", label: "KI-Agenten" },
      { value: "4", label: "Sprachen" },
      { value: "3", label: "Exportformate" },
      { value: "∞", label: "Bücher" },
    ],
    sections: [
      {
        icon: BookOpen,
        color: "#F96D1C",
        badge: "Aktualisiert",
        title: "Der Editor — gebaut für Bücher",
        subtitle: "Eine block-basierte Schreibumgebung, die um die Logik echter Bücher herum aufgebaut ist — nicht darum, wie Produktivitäts-Apps Bücher verstehen.",
        highlight: true,
        items: [
          "Hierarchie Teil → Kapitel → Abschnitt → Szene — Manuskriptstruktur vom ersten Satz an",
          "15+ Blocktypen: Absätze, Überschriften, Zitate, Argumente, Forschungsnotizen, Listen und Trennzeichen",
          "Drei Schreibumgebungen: Standard-Editor, Lesemodus (Vollbild, keine UI), Tiefer Schreibmodus (rahmenloses Canvas für Flow-Zustände)",
          "Text markieren → KI-Toolbar: Verbessern, Umschreiben, Vereinfachen, Erweitern, Übersetzen, Grammatik — ohne die Seite zu verlassen",
          "Schwebende Formatierungsleiste: Fett, Kursiv, Unterstrichen, Farbe, Hervorhebung, Ausrichtung, Links",
          "Schriftskalierung (70–160 %), Editorbreite (480–1200 px) und Zeilenabstand — bequem auf jedem Bildschirm",
          "Auto-Speichern mit Änderungsverfolgung — nichts geht verloren, auch wenn du den Tab schließt",
          "Live-Wortzähler und Kapitelstatistik",
        ],
      },
      {
        icon: Brain,
        color: "#8B5CF6",
        badge: "Neu",
        title: "KI, die deine Stimme lernt",
        subtitle: "Sieben spezialisierte Analysten und ein kontextbewusster Koautor — alle arbeiten mit deinem vollständigen Buch, nicht nur dem letzten Absatz.",
        highlight: true,
        items: [
          "7 KI-Agenten, jeder liest dein Kapitel aus einer anderen professionellen Perspektive: Lektor, Kritiker, Philosoph, Leser, Erzählanalytiker, Argumentanalytiker, Konsistenz",
          "Leser-Archetyp-Auswahl: Anfänger, Experte, Skeptiker, Emotional, Lektorisch — wessen Reaktion du brauchst",
          "Buchkontext-Panel: Kernidee, Themen, Ton und Zielleser — Agenten nutzen es für personalisierten Analyse",
          "KI-Koautor: Fortsetzen, Erweitern, Zusammenfassen, Umschreiben, Dialog — oder freier Prompt für jede Aufgabe",
          "Stilanalyse in 10 Dimensionen: Vokabular, Rhythmus, Ton, Perspektive, Dialog — KI spiegelt deine Stimme, keine Vorlage",
          "Stil Vertiefen: eigene Notiz hinzufügen, um die Stilinterpretation der KI zu verfeinern",
          "Vorher/Nachher-Vergleich — Annehmen ersetzt nur den markierten Text, niemals den ganzen Block",
        ],
      },
      {
        icon: ScrollText,
        color: "#0EA5E9",
        badge: "Aktualisiert",
        title: "Entwürfe und Recherche an einem Ort",
        subtitle: "Ein Freischreib-Bereich und eine dauerhafte Wissensdatenbank — mit deinem Buch verbunden, nicht auf separate Apps verteilt.",
        items: [
          "Entwurfs-Phasen-Tracker: Plan → Entwurf → Bearbeitung → Final, mit Ein-Hover-Übergang und Fortschrittsbalken",
          "KI-Assistent für Entwürfe: Entwurf aus Plan, Thesen ausbauen, Text fortsetzen, Entwicklungsideen",
          "Schreibmaschinen-Modus — Cursor vertikal zentriert; Sprint-Timer (5–60 Min.) mit Wortziel",
          "Entwurf ins Buch übertragen: als neues Kapitel oder an ein bestehendes anfügen — ein Klick",
          "Kodex: dauerhafte Wissensdatenbank für Charaktere, Orte, Objekte und Konzepte",
          "Kodex-Einträge bereichern den KI-Kontext automatisch — kein Kopieren zwischen Notizen und KI",
        ],
      },
      {
        icon: Download,
        color: "#F96D1C",
        badge: "Aktualisiert",
        title: "Layout und Export",
        subtitle: "Sieh dein Buch als gesetzter Buchseite. Exportiere in drei publikationsfertige Formate.",
        items: [
          "Paged.js-Rendering — echtes CSS @page-Layout mit genauen Seitenumbrüchen, kein Vorschau-Approximation",
          "Gespiegelte Seitennummerierung — asymmetrische Kopf-/Fußzeilen links/rechts für druckfertige Bücher",
          "Professionelle Silbentrennung (Browser-nativ + Hypher-Wörterbuch)",
          "Export als PDF — korrektes Seitenlayout und Ränder via Browserdruck",
          "Export als EPUB 3 — gültiges XHTML, Navigationsdokument und eingebettete Metadaten",
          "Export als DOCX — Word-kompatibel mit erhaltenen Kapitelüberschriften",
          "Eigene Buchmetadaten: Titel, Autor, Sprache und Cover-Farbe oder -Bild",
        ],
      },
      {
        icon: Flame,
        color: "#ef4444",
        title: "Schreibgewohnheit aufbauen",
        subtitle: "Momentum ist eine Fähigkeit. Moodra verfolgt sie, damit du sie aufbauen kannst.",
        items: [
          "Täglicher Streak-Tracker mit Kalender-Heatmap — jede Schreibsitzung visualisiert",
          "Eigene Ziele: Wörter pro Tag oder Kapitel pro Tag",
          "Sitzungsnotizen: Reflexion oder Plan für die nächste Sitzung",
          "Fokus-Timer: Zeitlimit und Wortziel setzen — Schreiben wird zur einzigen Aufgabe",
        ],
      },
      {
        icon: Shield,
        color: "#10B981",
        title: "Offen, privat und mehrsprachig",
        subtitle: "Kostenlose KI ab der ersten Minute. Deine Daten bleiben bei dir. Vier Sprachen, native UI.",
        items: [
          "Eingebaute kostenlose KI (Pollinations) — kein API-Schlüssel, keine Kreditkarte, kein Setup",
          "Eigenen OpenAI-Schlüssel verbinden für GPT-4o mini, GPT-4o oder o4-mini (200K Kontext)",
          "Jederzeit zwischen kostenloser KI und eigenem Schlüssel wechseln — kein Neustart nötig",
          "Dein OpenAI-Schlüssel wird verschlüsselt gespeichert und niemals protokolliert oder weitergegeben",
          "Keine Werbung, keine Tracker, kein Training mit deinen Inhalten",
          "Vollständige UI auf Englisch, Russisch, Ukrainisch und Deutsch — KI antwortet in deiner Sprache",
        ],
      },
    ],
    ctaTitle: "Bereit, dein Buch zu schreiben?",
    ctaDesc: "Starte mit kostenloser KI — kein Schlüssel, keine Karte. Füge deinen OpenAI-Schlüssel hinzu, wenn du mehr Leistung möchtest.",
    ctaButton: "Bibliothek öffnen",
    back: "Zurück",
  },
};

// ── Category filter ───────────────────────────────────────────────────────────

const CAT_INDICES: Record<string, number[]> = {
  all:      [],
  editor:   [0],
  ai:       [1],
  workspace:[2],
  export:   [3],
  habits:   [4],
  platform: [5],
};

const CAT_LABELS: Record<string, Record<string, string>> = {
  all:       { en: "All",       ru: "Все",         ua: "Всі",        de: "Alle" },
  editor:    { en: "Editor",    ru: "Редактор",    ua: "Редактор",   de: "Editor" },
  ai:        { en: "AI",        ru: "ИИ",          ua: "ШІ",         de: "KI" },
  workspace: { en: "Workspace", ru: "Черновики",   ua: "Чернетки",   de: "Workspace" },
  export:    { en: "Export",    ru: "Экспорт",     ua: "Експорт",    de: "Export" },
  habits:    { en: "Habits",    ru: "Привычки",    ua: "Звички",     de: "Gewohnheiten" },
  platform:  { en: "Platform",  ru: "Платформа",   ua: "Платформа",  de: "Plattform" },
};

// ── Component ────────────────────────────────────────────────────────────────

export default function FeaturesPage() {
  const [, setLocation] = useLocation();
  const { lang } = useLang();
  const c = FEATURES[lang as keyof typeof FEATURES] ?? FEATURES.en;
  const [activeCategory, setActiveCategory] = useState("all");

  const visibleSections = c.sections.map((s, i) => ({ ...s, idx: i })).filter(s => {
    if (activeCategory === "all") return true;
    return (CAT_INDICES[activeCategory] ?? []).includes(s.idx);
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Moodra",
    "applicationCategory": "ProductivityApplication",
    "operatingSystem": "Web",
    "description": "Moodra is a long-form AI writing platform for authors. It combines a block-based book editor, 7 AI analysis agents, style-matching co-author, drafting workspace, Codex knowledge base, and professional export (PDF, EPUB, DOCX) in one system.",
    "url": "https://moodra.space/features",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
    "featureList": [
      "Block-based book editor with 15+ block types and Part-Chapter-Section-Scene hierarchy",
      "7 AI agents: Editor, Critic, Philosopher, Reader, Story Analyst, Argument Analyst, Consistency",
      "AI Co-Author with style matching across 10 writing dimensions",
      "Drafts workspace with stage tracker and AI draft assistant",
      "Codex world and character knowledge base linked to AI context",
      "Professional layout with Paged.js — PDF, EPUB 3, and DOCX export",
      "Writing habit tracker with daily streak, goals, and calendar heatmap",
      "Free built-in AI via Pollinations — no API key required",
      "Full UI in English, Russian, Ukrainian, and German"
    ],
    "inLanguage": ["en", "ru", "uk", "de"],
    "isAccessibleForFree": true,
    "applicationSubCategory": "Writing Software",
  };

  return (
    <div className="min-h-screen" style={{ background: "hsl(30,58%,97%)" }}>
      <PageHead
        title="Moodra — AI Writing Platform Capabilities"
        description="Moodra is a long-form AI writing platform for authors. Block-based editor, 7 AI agents, style-matching co-author, Codex knowledge base, and PDF/EPUB/DOCX export. Free to use."
        canonical="https://moodra.space/features"
        ogTitle="Moodra — Capabilities for Serious Authors"
        ogDescription="Everything a book needs: structured editing, AI that learns your voice, research workspace, and professional export. One system built for long-form writing."
        jsonLd={jsonLd}
      />

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 border-b" style={{ borderColor: "rgba(249,109,28,0.12)", background: "rgba(253,246,238,0.94)", backdropFilter: "blur(12px)" }}>
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center">
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-70"
            style={{ color: "#8a7a70" }}
          >
            <ArrowLeft className="h-4 w-4" />
            {c.back}
          </button>
          <div className="flex-1 flex items-center justify-center">
            <img src="/moodra-logo-new.png" alt="Moodra" style={{ height: "38px", width: "auto", display: "block" }} />
          </div>
          <LanguagePicker />
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-6 pt-16 pb-8 text-center">
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-6"
          style={{ background: "rgba(249,109,28,0.10)", color: "#F96D1C" }}
        >
          <Star className="w-3 h-3" />
          {c.badge}
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-5 leading-tight" style={{ color: "#2d1b0e" }}>
          {c.heroTitle}
        </h1>
        <p className="text-base leading-relaxed max-w-2xl mx-auto" style={{ color: "#7a6a60" }}>
          {c.heroSubtitle}
        </p>
      </section>

      {/* ── Stats bar ───────────────────────────────────────────────────────── */}
      <section className="max-w-2xl mx-auto px-6 pb-12">
        <div className="grid grid-cols-4 gap-4">
          {c.stats.map((stat, i) => (
            <div key={i} className="rounded-2xl p-4 text-center" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <div className="text-3xl font-black" style={{ color: "#F96D1C" }}>{stat.value}</div>
              <div className="text-[11px] text-center leading-tight mt-1" style={{ color: "#9a8a80" }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Category filter ─────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pb-8">
        <div className="flex gap-2 flex-wrap justify-center">
          {Object.keys(CAT_LABELS).map(cat => {
            const isActive = activeCategory === cat;
            const count = cat === "all" ? c.sections.length : (CAT_INDICES[cat] ?? []).filter(i => i < c.sections.length).length;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={
                  isActive
                    ? { background: "#F96D1C", color: "#fff" }
                    : { background: "rgba(0,0,0,0.05)", color: "#7a6a60" }
                }
              >
                {CAT_LABELS[cat]?.[lang] ?? CAT_LABELS[cat]?.en}
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                  style={{ background: isActive ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.08)" }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Feature Grid ────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {visibleSections.map((section) => {
            const Icon = section.icon;
            const isHighlight = section.highlight;
            const badge = section.badge;
            const badgeLabel = badge;
            const isNew = badge === c.newBadge;

            return (
              <div
                key={section.idx}
                className={cn(
                  "rounded-2xl flex flex-col overflow-hidden transition-all",
                  isHighlight && "sm:col-span-2 lg:col-span-2"
                )}
                style={{
                  background: isHighlight ? `linear-gradient(135deg, ${section.color}08 0%, #fff 60%)` : "#fff",
                  border: isHighlight ? `1.5px solid ${section.color}30` : "1px solid rgba(0,0,0,0.07)",
                  boxShadow: isHighlight ? `0 4px 24px ${section.color}12` : "0 2px 12px rgba(0,0,0,0.05)",
                }}
              >
                {/* Card header */}
                <div
                  className="px-5 pt-5 pb-4"
                  style={{ borderBottom: `2px solid ${section.color}16` }}
                >
                  <div className="flex items-start gap-3 mb-2">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${section.color}14` }}
                    >
                      <Icon className="h-5 w-5" style={{ color: section.color }} strokeWidth={1.6} />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-bold text-sm leading-snug" style={{ color: "#2d1b0e" }}>
                          {section.title}
                        </h3>
                        {badgeLabel && (
                          <span
                            className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                            style={{
                              background: isNew ? `${section.color}18` : "rgba(0,0,0,0.06)",
                              color: isNew ? section.color : "#8a7a70",
                            }}
                          >
                            {isNew && <Zap className="w-2.5 h-2.5" />}
                            {badgeLabel}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] leading-snug" style={{ color: "#9a8a80" }}>
                        {section.subtitle}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className={cn(
                  "px-5 py-4 flex-1",
                  isHighlight && "grid sm:grid-cols-2 gap-x-6"
                )}>
                  {section.items.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 mb-2.5">
                      <div
                        className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: `${section.color}16` }}
                      >
                        <Check className="w-2.5 h-2.5" style={{ color: section.color }} strokeWidth={2.5} />
                      </div>
                      <span className="text-[12px] leading-snug" style={{ color: "#4a3a30" }}>
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-6 pb-24">
        <div
          className="rounded-3xl px-8 py-10 text-center"
          style={{
            background: "linear-gradient(135deg, #F96D1C10 0%, #8B5CF610 100%)",
            border: "1.5px solid rgba(249,109,28,0.18)",
          }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: "linear-gradient(135deg, #F96D1C, #8B5CF6)" }}
          >
            <Feather className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 tracking-tight" style={{ color: "#2d1b0e" }}>
            {c.ctaTitle}
          </h2>
          <p className="text-sm mb-7 max-w-md mx-auto leading-relaxed" style={{ color: "#7a6a60" }}>
            {c.ctaDesc}
          </p>
          <button
            onClick={() => setLocation("/library")}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-bold text-white transition-all hover:scale-105 active:scale-100"
            style={{ background: "linear-gradient(135deg, #F96D1C, #e05a10)", boxShadow: "0 6px 24px rgba(249,109,28,0.35)" }}
          >
            {c.ctaButton}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
