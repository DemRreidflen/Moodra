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

// ── Content (all 4 languages) ────────────────────────────────────────────────

const FEATURES: Record<string, LangData> = {
  en: {
    badge: "Features",
    heroTitle: "Built for writers who are serious about finishing.",
    heroSubtitle: "Moodra is a complete writing studio: intelligent editor, multi-agent AI analysis, professional export. Every tool exists for one reason — to help you write a better book.",
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
        title: "Block-Based Book Editor",
        subtitle: "A structured, distraction-free environment designed around how books actually work.",
        items: [
          "Part → Chapter → Section → Scene hierarchy keeps your structure clear",
          "15+ block types: paragraphs, headings, quotes, hypotheses, arguments, research, dividers — and now native lists",
          "Bullet points, numbered lists, and checklists as first-class block types (Enter continues the list, Backspace exits)",
          "Floating format toolbar: bold, italic, underline, text colour, highlight, alignment, superscript, subscript, links",
          "Inline URL editor — insert links without any dialog, right in the text",
          "Font scale (70–160%) and editor max-width (480–1200px) controls for comfortable writing on any screen",
          "Line spacing control in the toolbar — 1.0 to 2.5",
          "Select any text → instant AI toolbar: Improve, Rewrite, Simplify, Expand, Translate, Fix grammar",
          "Auto-save and dirty-state tracking — nothing is ever lost",
          "Reading mode: full-screen immersive writing with zero distractions",
          "Deep writing mode: borderless focus canvas for flow states",
          "Live word count and per-chapter word breakdown",
          "Before/After comparison modal — accept replaces only the selected fragment in-place",
        ],
      },
      {
        icon: ScrollText,
        color: "#0EA5E9",
        badge: "Updated",
        title: "Drafts",
        subtitle: "Free-writing workspace with a stage tracker and AI assistant — write without formatting pressure, move to book when ready.",
        items: [
          "Draft Stage Tracker — 4 stages: Plan → Sketch → Edit → Final; advance any draft with one hover-click",
          "Progress bar shows how many drafts have reached Final — motivation at a glance",
          "AI Draft Assistant — 4 modes: Sketch from plan, Expand theses, Continue text, Ideas for development",
          "Drafts panel — full block editor with font scale, max-width, word count, and autosave",
          "Select any text in a draft → floating AI toolbar: Improve, Rewrite, Simplify, Expand, Translate, Fix grammar",
          "Typewriter mode — cursor stays vertically centred, keeping focus at eye level",
          "Sprint timer — set a word goal and time limit (5–60 min), start countdown, stop any time",
          "Move any draft to your book as a new chapter or append to an existing one — one click",
        ],
      },
      {
        icon: Brain,
        color: "#8B5CF6",
        badge: "New",
        title: "Narrative Intelligence — Multi-Agent AI",
        subtitle: "A team of 7 specialised AI analysts that each read your chapter from a different professional perspective.",
        items: [
          "Editor — clarity, structure, paragraph flow and readability",
          "Critic — logical integrity, weak arguments, unsupported claims",
          "Philosopher — deeper conceptual and philosophical dimensions",
          "Reader — authentic reaction from your chosen reader archetype (Beginner / Expert / Skeptic / Emotional / Editorial)",
          "Story Analyst — narrative structure, pacing rhythm, tension arc",
          "Argument Analyst — thesis strength, evidence quality, logical chains",
          "Consistency — contradictions, character inconsistencies, continuity errors",
          "Book Context: set core idea, themes, structure, tone, target reader — agents use it to personalise every analysis",
        ],
      },
      {
        icon: Sparkles,
        color: "#6366f1",
        badge: "Updated",
        title: "AI Co-Author Panel",
        subtitle: "Context-aware generation that reads your chapter and writes in your voice.",
        items: [
          "5 generation modes: Continue, Expand, Summarise, Rewrite, Dialogue",
          "Custom prompt mode — any instruction, any task",
          "Style matching: AI analyses your writing across 10 dimensions and mirrors your voice",
          "Style Deepen: add a custom note to guide the AI's interpretation of your style",
          "Regenerate the last output with one click",
          "Paste your own text to seed the AI with any reference material",
          "Full generation history preserved within the session",
          "Insert, copy, or discard any AI output",
        ],
      },
      {
        icon: Sparkles,
        color: "#10B981",
        title: "Free AI — No Key Required",
        subtitle: "Write with AI from your very first minute — no setup, no credit card.",
        items: [
          "Powered by Pollinations — completely free, no API key needed",
          "Toggle between free AI and your own OpenAI key at any time",
          "Full support for generate, continue, and style analysis",
          "Rate limits are shown transparently — you always know what you're using",
        ],
      },
      {
        icon: Download,
        color: "#F96D1C",
        badge: "Updated",
        title: "Layout Mode & Professional Export",
        subtitle: "Preview your book as a real typeset page, then export in three formats.",
        items: [
          "Paged.js rendering — real CSS @page layout with correct page breaks",
          "Mirror page numbering — asymmetric left/right footer positioning for print-ready books",
          "Copyright page with per-page font size and line-height controls",
          "Proper typographic hyphenation (browser-native + Hypher dictionary)",
          "Zoom-in preview for pixel-perfect proofing",
          "Export to PDF — direct browser print-to-PDF with proper page layout",
          "Export to EPUB — valid EPUB 3 with proper XHTML, navigation, and metadata",
          "Export to DOCX — Word-compatible with chapter headings and paragraphs",
          "Custom book metadata: title, author, language, cover colour",
        ],
      },
      {
        icon: Layers,
        color: "#F96D1C",
        title: "Codex — World & Character Builder",
        subtitle: "A persistent knowledge base linked to your book and shared with the AI.",
        items: [
          "Build entries for characters, places, objects, and concepts",
          "Rich text editor with notes and long-form descriptions",
          "Codex entries automatically enrich AI context — no copy-paste needed",
          "Instant search across all entries",
        ],
      },
      {
        icon: Flame,
        color: "#ef4444",
        title: "Writing Habits & Streaks",
        subtitle: "Build a sustainable writing practice with daily tracking and momentum.",
        items: [
          "Daily writing streak tracker — see your momentum at a glance",
          "Custom goals: words per day or chapters per day",
          "Calendar heatmap — every writing session visually recorded",
          "Session notes: add a reflection or plan your next session",
        ],
      },
      {
        icon: Palette,
        color: "#6366f1",
        title: "Style Analysis",
        subtitle: "A 10-dimension fingerprint of your writing, used to guide every AI generation.",
        items: [
          "Analyses vocabulary level, sentence length, tone, rhythm, POV, and dialogue style",
          "Generates a style instruction applied to all AI generations automatically",
          "Deepen with a custom prompt to refine the AI's interpretation",
          "Reset and re-analyse any time as your writing evolves",
        ],
      },
      {
        icon: Cpu,
        color: "#6366f1",
        title: "Multiple AI Models",
        subtitle: "Pick the right model for the right task — from fast drafts to complex scenes.",
        items: [
          "GPT-4o mini (fast, economical), GPT-4o (powerful), o4-mini (reasoning, 200K context)",
          "o4-mini is the dedicated book adaptation model — 100K output cap, zero truncation",
          "Model selection in Settings — change any time",
          "Model displayed in the AI panel header so you always know what's running",
          "All agents and generation modes use your selected model; adaptation always uses o4-mini",
        ],
      },
      {
        icon: Globe,
        color: "#F96D1C",
        title: "Full Multilingual Support",
        subtitle: "Native UI and AI responses in four languages.",
        items: [
          "English, Russian, Ukrainian, and German — complete UI localisation",
          "AI detects your language and generates in it automatically",
          "Language switcher on every page — switch any time",
          "All toasts, errors, and system messages are localised",
        ],
      },
      {
        icon: Shield,
        color: "#6366f1",
        title: "Privacy & Your Keys",
        subtitle: "Your writing and your credentials belong to you, always.",
        items: [
          "Your OpenAI API key is stored encrypted and never shared or logged",
          "All book content stays in your account — no third-party AI training",
          "No ads, no trackers, no dark patterns",
          "Use Pollinations for zero-key, zero-setup AI access",
        ],
      },
    ],
    ctaTitle: "Ready to write your book?",
    ctaDesc: "Start with free AI. Add your OpenAI key whenever you're ready for more power.",
    ctaButton: "Go to your library",
    back: "Back",
  },

  ru: {
    badge: "Возможности",
    heroTitle: "Создано для тех, кто серьёзно настроен дописать книгу.",
    heroSubtitle: "Moodra — полноценная студия писателя: умный редактор, мультиагентный AI-анализ, профессиональный экспорт. Каждый инструмент существует ради одного — помочь вам написать лучшую книгу.",
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
        title: "Блочный редактор книги",
        subtitle: "Структурированная среда без отвлечений, созданная вокруг того, как работают книги.",
        items: [
          "Иерархия: Часть → Глава → Раздел → Сцена",
          "15+ типов блоков: абзацы, заголовки, цитаты, гипотезы, аргументы, исследования, разделители — и теперь нативные списки",
          "Маркированные списки, нумерованные списки и чеклисты как полноценные типы блоков (Enter — следующий пункт, Backspace — выход из списка)",
          "Плавающая панель форматирования: жирный, курсив, подчёркивание, цвет текста, выделение, выравнивание, ссылки",
          "Встроенный редактор URL — вставляйте ссылки прямо в текст без всплывающих окон",
          "Масштаб шрифта (70–160%) и максимальная ширина редактора (480–1200px) для комфортного письма",
          "Управление межстрочным интервалом в тулбаре — от 1.0 до 2.5",
          "Выделите любой текст → мгновенный AI-тулбар: Улучшить, Переписать, Упростить, Расширить, Перевести, Исправить грамматику",
          "Автосохранение и отслеживание изменений — ничего не потеряется",
          "Режим чтения: полноэкранный, без отвлечений",
          "Режим глубокого письма: фокус-холст без рамок для состояния потока",
          "Счётчик слов в реальном времени и статистика по главам",
          "Модал «До/После» — кнопка «Применить» заменяет только выделенный фрагмент прямо в тексте",
        ],
      },
      {
        icon: ScrollText,
        color: "#0EA5E9",
        badge: "Обновлено",
        title: "Черновики",
        subtitle: "Пространство для свободного письма с трекером этапов и AI-помощником — пишите без давления вёрстки, переносите в книгу когда готово.",
        items: [
          "Трекер этапов черновика — 4 стадии: План → Набросок → Редактура → Финал; одним наведением переводите черновик на следующий этап",
          "Полоса прогресса показывает сколько черновиков дошли до «Финала» — мотивация с первого взгляда",
          "AI-помощник — 4 режима: Набросок по плану, Расширить тезисы, Продолжить текст, Идеи для развития",
          "Панель черновиков — полноценный блочный редактор со шкалой шрифта, шириной, счётчиком слов и автосохранением",
          "Выделите любой текст → плавающая AI-панель: Улучшить, Переписать, Упростить, Расширить, Перевести, Исправить грамматику",
          "Режим пишущей машинки — курсор всегда по центру экрана, фокус на уровне глаз",
          "Таймер спринта — цель по словам и лимит времени (5–60 мин), запуск, остановка в любой момент",
          "Перенос черновика в книгу: новой главой или добавлением к существующей — одним кликом",
        ],
      },
      {
        icon: Brain,
        color: "#8B5CF6",
        badge: "Новое",
        title: "Нарративный интеллект — мультиагентный AI",
        subtitle: "Команда из 7 специализированных AI-аналитиков, каждый из которых читает вашу главу с особой профессиональной точки зрения.",
        items: [
          "Редактор — ясность, структура, поток абзацев, читабельность",
          "Критик — логическая целостность, слабые аргументы, необоснованные утверждения",
          "Философ — глубокие концептуальные и философские измерения",
          "Читатель — реакция от выбранного архетипа читателя (Начинающий / Эксперт / Скептик / Эмоциональный / Редакторский)",
          "Нарратолог — нарративная структура, ритм темпа, дуга напряжения",
          "Аналитик аргументов — сила тезиса, качество доказательств, логические цепочки",
          "Согласованность — противоречия, непоследовательность персонажей, ошибки непрерывности",
          "Контекст книги: задайте идею, темы, структуру, тон, читателя — агенты используют это для персонализации каждого анализа",
        ],
      },
      {
        icon: Sparkles,
        color: "#6366f1",
        badge: "Обновлено",
        title: "AI-соавтор",
        subtitle: "Контекстно-зависимая генерация, которая читает вашу главу и пишет вашим голосом.",
        items: [
          "5 режимов генерации: Продолжить, Расширить, Резюмировать, Переписать, Диалог",
          "Свободный промпт — любая инструкция, любая задача",
          "Подбор стиля: AI анализирует ваш текст по 10 параметрам и отражает ваш голос",
          "Углубление стиля: добавьте заметку для точной настройки интерпретации AI",
          "Повторная генерация последнего результата одним кликом",
          "Вставка своего текста как референс для AI",
          "Полная история генераций в сессии",
          "Вставка, копирование или отклонение любого результата AI",
        ],
      },
      {
        icon: Sparkles,
        color: "#10B981",
        title: "Бесплатный AI — без ключа",
        subtitle: "Пишите с AI с первой минуты — без настройки, без карты.",
        items: [
          "Работает на Pollinations — полностью бесплатно, API-ключ не нужен",
          "Переключение между бесплатным AI и вашим ключом OpenAI в любое время",
          "Полная поддержка генерации, продолжения и анализа стиля",
          "Лимиты показаны прозрачно — вы всегда знаете, что используете",
        ],
      },
      {
        icon: Download,
        color: "#F96D1C",
        badge: "Обновлено",
        title: "Режим вёрстки и профессиональный экспорт",
        subtitle: "Предпросмотр книги как настоящей типографской страницы, затем экспорт в трёх форматах.",
        items: [
          "Движок Paged.js — настоящий CSS @page с корректными разрывами страниц",
          "Зеркальная нумерация страниц — асимметричные колонтитулы слева/справа для печати",
          "Страница копирайта с отдельным управлением шрифтом и межстрочным интервалом",
          "Профессиональные переносы: браузерные + словарь Hypher",
          "Масштабирование превью для точной корректуры",
          "Экспорт в PDF — через браузерную печать с правильной вёрсткой",
          "Экспорт в EPUB — валидный EPUB 3 с XHTML, навигацией и метаданными",
          "Экспорт в DOCX — совместим с Word, с главами и абзацами",
          "Настройка метаданных: название, автор, язык, цвет обложки",
        ],
      },
      {
        icon: Layers,
        color: "#F96D1C",
        title: "Кодекс — мир и персонажи",
        subtitle: "Постоянная база знаний, связанная с вашей книгой и доступная AI.",
        items: [
          "Записи для персонажей, мест, предметов и концепций",
          "Редактор с заметками и расширенными описаниями",
          "Кодекс автоматически обогащает контекст AI — не нужно ничего копировать",
          "Мгновенный поиск по всем записям",
        ],
      },
      {
        icon: Flame,
        color: "#ef4444",
        title: "Привычки письма и стрик",
        subtitle: "Выстройте устойчивую практику письма с ежедневным трекингом.",
        items: [
          "Ежедневный трекер стрика — видите свой импульс с первого взгляда",
          "Кастомные цели: слов/день или глав/день",
          "Тепловая карта — каждая сессия письма записана визуально",
          "Заметки к сессии: рефлексия или план следующей",
        ],
      },
      {
        icon: Palette,
        color: "#6366f1",
        title: "Анализ стиля",
        subtitle: "10-мерный отпечаток вашего письма, применяемый при каждой генерации.",
        items: [
          "Анализирует словарный уровень, длину предложений, тон, ритм, POV, диалоги",
          "Генерирует стилевую инструкцию для всех AI-генераций автоматически",
          "Углубление через кастомный промпт для уточнения интерпретации",
          "Сброс и повторный анализ в любое время",
        ],
      },
      {
        icon: Cpu,
        color: "#6366f1",
        title: "Несколько AI-моделей",
        subtitle: "Выбирайте подходящую модель для каждой задачи.",
        items: [
          "GPT-4o mini (быстро, экономно), GPT-4o (мощно), o4-mini (рассуждение, 200K контекст)",
          "o4-mini — выделенная модель для языковой адаптации книг: 100K выход, без усечений",
          "Выбор модели в Настройках — смените в любое время",
          "Модель отображается в шапке AI-панели — всегда видите, что работает",
          "Все агенты и режимы генерации — ваша модель; адаптация всегда использует o4-mini",
        ],
      },
      {
        icon: Globe,
        color: "#F96D1C",
        title: "Полная мультиязычность",
        subtitle: "Нативный интерфейс и ответы AI на четырёх языках.",
        items: [
          "Английский, русский, украинский и немецкий — полная локализация UI",
          "AI определяет язык и генерирует на нём автоматически",
          "Переключатель языка на каждой странице",
          "Все уведомления, ошибки и системные сообщения локализованы",
        ],
      },
      {
        icon: Shield,
        color: "#6366f1",
        title: "Приватность и ваши ключи",
        subtitle: "Ваши тексты и учётные данные принадлежат только вам.",
        items: [
          "Ключ OpenAI хранится в зашифрованном виде — никогда не передаётся и не логируется",
          "Весь контент книг остаётся в вашем аккаунте — никакого обучения AI на ваших данных",
          "Без рекламы, трекеров и тёмных паттернов",
          "Pollinations — доступ к AI без ключей и без настройки",
        ],
      },
    ],
    ctaTitle: "Готовы писать свою книгу?",
    ctaDesc: "Начните с бесплатным AI. Добавьте ключ OpenAI, когда захотите больше возможностей.",
    ctaButton: "В библиотеку",
    back: "Назад",
  },

  ua: {
    badge: "Можливості",
    heroTitle: "Створено для тих, хто серйозно налаштований дописати книгу.",
    heroSubtitle: "Moodra — повноцінна студія письменника: розумний редактор, мультиагентний AI-аналіз, професійний експорт. Кожен інструмент існує заради одного — допомогти вам написати кращу книгу.",
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
        title: "Блоковий редактор книги",
        subtitle: "Структуроване середовище без відволікань, створене навколо того, як насправді влаштовані книги.",
        items: [
          "Ієрархія: Частина → Розділ → Секція → Сцена",
          "15+ типів блоків: абзаци, заголовки, цитати, гіпотези, аргументи, дослідження, розділювачі — і тепер нативні списки",
          "Марковані списки, нумеровані списки та чеклисти як повноцінні типи блоків (Enter — новий пункт, Backspace — вихід)",
          "Плаваюча панель форматування: жирний, курсив, підкреслення, колір тексту, виділення, вирівнювання, посилання",
          "Вбудований редактор URL — вставляйте посилання прямо в текст без спливаючих вікон",
          "Масштаб шрифту (70–160%) та максимальна ширина редактора (480–1200px) для зручного письма",
          "Керування міжрядковим інтервалом у тулбарі — від 1.0 до 2.5",
          "Виділіть будь-який текст → миттєвий AI-тулбар: Поліпшити, Переписати, Спростити, Розширити, Перекласти, Виправити граматику",
          "Автозбереження та відстеження змін — нічого не загубиться",
          "Режим читання: повноекранний, без відволікань",
          "Режим глибокого письма: холст-фокус без рамок для стану потоку",
          "Лічильник слів у реальному часі та статистика по розділах",
          "Порівняння оригіналу та покращеної версії поряд",
        ],
      },
      {
        icon: ScrollText,
        color: "#0EA5E9",
        badge: "Оновлено",
        title: "Чернетки",
        subtitle: "Простір для вільного письма з трекером етапів і ШІ-помічником — пишіть без тиску верстки, переносьте до книги коли готово.",
        items: [
          "Трекер етапів чернетки — 4 стадії: План → Нарис → Редагування → Фінал; одним наведенням переводьте чернетку на наступний етап",
          "Смуга прогресу показує скільки чернеток досягли «Фіналу» — мотивація з першого погляду",
          "ШІ-помічник — 4 режими: Нарис за планом, Розширити тези, Продовжити текст, Ідеї для розвитку",
          "Панель чернеток — повноцінний блоковий редактор зі шкалою шрифту, шириною, лічильником слів і автозбереженням",
          "Виділіть будь-який текст → плаваюча ШІ-панель: Покращити, Переписати, Спростити, Розширити, Перекласти, Виправити граматику",
          "Режим друкарської машинки — курсор завжди по центру екрана, фокус на рівні очей",
          "Таймер спринту — ціль по словах і ліміт часу (5–60 хв), запуск, зупинка будь-коли",
          "Перенос чернетки до книги: новим розділом або додаванням до існуючого — одним кліком",
        ],
      },
      {
        icon: Brain,
        color: "#8B5CF6",
        badge: "Нове",
        title: "Наративний інтелект — мультиагентний AI",
        subtitle: "Команда з 7 спеціалізованих AI-аналітиків, кожен із яких читає ваш розділ з особливої професійної точки зору.",
        items: [
          "Редактор — ясність, структура, потік абзаців, читабельність",
          "Критик — логічна цілісність, слабкі аргументи, необґрунтовані твердження",
          "Філософ — глибокі концептуальні та філософські виміри",
          "Читач — реакція від обраного архетипу читача (Початківець / Експерт / Скептик / Емоційний / Редакторський)",
          "Наратолог — наративна структура, ритм темпу, дуга напруги",
          "Аналітик аргументів — сила тезису, якість доказів, логічні ланцюги",
          "Узгодженість — суперечності, непослідовність персонажів, помилки неперервності",
          "Контекст книги: задайте ідею, теми, структуру, тон, читача — агенти використовують це для персоналізованого аналізу",
        ],
      },
      {
        icon: Sparkles,
        color: "#6366f1",
        badge: "Оновлено",
        title: "AI-співавтор",
        subtitle: "Контекстно-залежна генерація, яка читає ваш розділ і пише вашим голосом.",
        items: [
          "5 режимів генерації: Продовжити, Розширити, Резюмувати, Переписати, Діалог",
          "Вільний промпт — будь-яка інструкція, будь-яке завдання",
          "Підбір стилю: AI аналізує текст за 10 параметрами і відображає ваш голос",
          "Поглиблення стилю: додайте нотатку для точного налаштування",
          "Повторна генерація останнього результату одним кліком",
          "Вставка власного тексту як референс для AI",
          "Повна історія генерацій у сесії",
          "Вставка, копіювання або відхилення будь-якого результату AI",
        ],
      },
      {
        icon: Sparkles,
        color: "#10B981",
        title: "Безкоштовний AI — без ключа",
        subtitle: "Пишіть з AI з першої хвилини — без налаштування, без картки.",
        items: [
          "Працює на Pollinations — повністю безкоштовно, API-ключ не потрібен",
          "Перемикання між безкоштовним AI і вашим ключем OpenAI в будь-який момент",
          "Повна підтримка генерації, продовження та аналізу стилю",
          "Ліміти показані прозоро — ви завжди знаєте, що використовуєте",
        ],
      },
      {
        icon: Download,
        color: "#F96D1C",
        badge: "Оновлено",
        title: "Режим верстки та професійний експорт",
        subtitle: "Перегляд книги як справжньої типографської сторінки та експорт у трьох форматах.",
        items: [
          "Движок Paged.js — справжній CSS @page з коректними розривами сторінок",
          "Дзеркальна нумерація сторінок — асиметричні колонтитули ліворуч/праворуч для друку",
          "Сторінка копірайту з окремим керуванням шрифтом та міжрядковим інтервалом",
          "Професійні переноси: браузерні + словник Hypher",
          "Масштабування превью для точного коректурування",
          "Експорт у PDF — через браузерний друк з правильною версткою",
          "Експорт у EPUB — валідний EPUB 3 з XHTML, навігацією та метаданими",
          "Експорт у DOCX — сумісний з Word, з розділами та абзацами",
          "Налаштування метаданих: назва, автор, мова, колір обкладинки",
        ],
      },
      {
        icon: Layers,
        color: "#F96D1C",
        title: "Кодекс — світ і персонажі",
        subtitle: "Постійна база знань, пов'язана з вашою книгою та доступна AI.",
        items: [
          "Записи для персонажів, місць, предметів і концепцій",
          "Редактор з нотатками та розширеними описами",
          "Кодекс автоматично збагачує контекст AI — нічого не потрібно копіювати",
          "Миттєвий пошук по всіх записах",
        ],
      },
      {
        icon: Flame,
        color: "#ef4444",
        title: "Звички письма та стрік",
        subtitle: "Побудуйте сталу практику письма з щоденним трекінгом.",
        items: [
          "Щоденний трекер стріку — бачте свій імпульс з першого погляду",
          "Кастомні цілі: слів/день або розділів/день",
          "Теплова карта — кожна сесія письма записана візуально",
          "Нотатки до сесії: рефлексія або план наступної",
        ],
      },
      {
        icon: Palette,
        color: "#6366f1",
        title: "Аналіз стилю",
        subtitle: "10-вимірний відбиток вашого письма, що застосовується при кожній генерації.",
        items: [
          "Аналізує словниковий рівень, довжину речень, тон, ритм, POV, діалоги",
          "Генерує стильову інструкцію для всіх AI-генерацій автоматично",
          "Поглиблення через кастомний промпт для уточнення інтерпретації",
          "Скидання та повторний аналіз в будь-який час",
        ],
      },
      {
        icon: Cpu,
        color: "#6366f1",
        title: "Кілька AI-моделей",
        subtitle: "Обирайте відповідну модель для кожного завдання.",
        items: [
          "GPT-4o mini (швидко, економно), GPT-4o (потужно), o1-mini (міркування)",
          "Вибір моделі в Налаштуваннях — змінюйте в будь-який час",
          "Модель відображається в заголовку AI-панелі — завжди видно, що працює",
          "Всі агенти та режими генерації використовують вашу обрану модель",
        ],
      },
      {
        icon: Globe,
        color: "#F96D1C",
        title: "Повна багатомовність",
        subtitle: "Нативний інтерфейс та відповіді AI чотирма мовами.",
        items: [
          "Англійська, російська, українська та німецька — повна локалізація UI",
          "AI визначає мову і генерує нею автоматично",
          "Перемикач мови на кожній сторінці",
          "Всі сповіщення, помилки та системні повідомлення локалізовані",
        ],
      },
      {
        icon: Shield,
        color: "#6366f1",
        title: "Приватність і ваші ключі",
        subtitle: "Ваші тексти та облікові дані належать тільки вам.",
        items: [
          "Ключ OpenAI зберігається зашифрованим — ніколи не передається і не логується",
          "Весь контент книг залишається у вашому акаунті — без навчання AI на ваших даних",
          "Без реклами, трекерів і темних паттернів",
          "Pollinations — доступ до AI без ключів і без налаштування",
        ],
      },
    ],
    ctaTitle: "Готові писати свою книгу?",
    ctaDesc: "Почніть з безкоштовним AI. Додайте ключ OpenAI, коли захочете більше можливостей.",
    ctaButton: "До бібліотеки",
    back: "Назад",
  },

  de: {
    badge: "Funktionen",
    heroTitle: "Gebaut für Autoren, die ihr Buch wirklich fertigschreiben wollen.",
    heroSubtitle: "Moodra ist ein vollständiges Schreibstudio: intelligenter Editor, KI-Analyse mit mehreren Agenten, professioneller Export. Jedes Tool dient einem Ziel — dir zu helfen, ein besseres Buch zu schreiben.",
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
        title: "Block-basierter Bucheditor",
        subtitle: "Eine strukturierte, ablenkungsfreie Umgebung, die um die Logik echter Bücher herum gebaut ist.",
        items: [
          "Hierarchie: Teil → Kapitel → Abschnitt → Szene",
          "15+ Blocktypen: Absätze, Überschriften, Zitate, Hypothesen, Argumente, Forschung, Trennzeichen — jetzt mit nativen Listen",
          "Aufzählungslisten, nummerierte Listen und Checklisten als vollwertige Blocktypen (Enter = neues Element, Backspace = Listenausstieg)",
          "Schwebende Formatierungsleiste: Fett, Kursiv, Unterstrichen, Textfarbe, Hervorhebung, Ausrichtung, Links",
          "Integrierter URL-Editor — Links direkt im Text einfügen, ohne Dialog",
          "Schriftskalierung (70–160 %) und maximale Editorbreite (480–1200 px) für komfortables Schreiben",
          "Zeilenabstandssteuerung in der Toolbar — von 1.0 bis 2.5",
          "Text markieren → sofortige KI-Toolbar: Verbessern, Umschreiben, Vereinfachen, Erweitern, Übersetzen, Grammatik korrigieren",
          "Auto-Speichern und Änderungsverfolgung — nichts geht verloren",
          "Lesemodus: Vollbild ohne Ablenkungen",
          "Tiefer Schreibmodus: rahmenloses Fokus-Canvas für Flow-Zustände",
          "Live-Wortzähler und Kapitelstatistik",
          "Vorher/Nachher-Vergleich — Annehmen ersetzt nur den markierten Textausschnitt",
        ],
      },
      {
        icon: ScrollText,
        color: "#0EA5E9",
        badge: "Aktualisiert",
        title: "Entwürfe",
        subtitle: "Freies Schreiben mit Phasen-Tracker und KI-Assistent — schreibe ohne Layout-Druck, übertrage ins Buch wenn bereit.",
        items: [
          "Entwurfs-Phasen-Tracker — 4 Stufen: Plan → Entwurf → Bearbeitung → Final; mit einem Hover-Klick zur nächsten Phase",
          "Fortschrittsbalken zeigt wie viele Entwürfe 'Final' erreicht haben — Motivation auf einen Blick",
          "KI-Assistent — 4 Modi: Entwurf aus Plan, Thesen ausbauen, Text fortsetzen, Entwicklungsideen",
          "Entwurfs-Panel — vollwertiger Block-Editor mit Schriftskalierung, Breite, Wortzähler und Autospeichern",
          "Text markieren → schwebende KI-Toolbar: Verbessern, Umschreiben, Vereinfachen, Erweitern, Übersetzen, Grammatik",
          "Schreibmaschinen-Modus — Cursor bleibt immer vertikal zentriert, Fokus auf Augenhöhe",
          "Sprint-Timer — Wortziel und Zeitlimit (5–60 Min.) festlegen, jederzeit stoppen",
          "Entwurf ins Buch verschieben: als neues Kapitel oder an ein bestehendes anfügen — ein Klick",
        ],
      },
      {
        icon: Brain,
        color: "#8B5CF6",
        badge: "Neu",
        title: "Narrative Intelligenz — Multi-Agenten-KI",
        subtitle: "Ein Team aus 7 spezialisierten KI-Analysten, die dein Kapitel jeweils aus einer anderen professionellen Perspektive lesen.",
        items: [
          "Editor — Klarheit, Struktur, Absatzfluss, Lesbarkeit",
          "Kritiker — logische Integrität, schwache Argumente, unbegründete Aussagen",
          "Philosoph — tiefere konzeptuelle und philosophische Dimensionen",
          "Leser — authentische Reaktion des gewählten Leser-Archetyps (Anfänger / Experte / Skeptiker / Emotional / Lektorisch)",
          "Erzählanalytiker — Erzählstruktur, Erzähltempo, Spannungsbogen",
          "Argumentanalytiker — Thesenstärke, Beweisqualität, logische Ketten",
          "Konsistenz — Widersprüche, Charakterinkonsistenzen, Kontinuitätsfehler",
          "Buchkontext: lege Kernidee, Themen, Struktur, Ton und Zielleser fest — Agenten nutzen dies für jede Analyse",
        ],
      },
      {
        icon: Sparkles,
        color: "#6366f1",
        badge: "Aktualisiert",
        title: "KI-Koautor",
        subtitle: "Kontextbewusste Generierung, die dein Kapitel liest und in deiner Stimme schreibt.",
        items: [
          "5 Generierungsmodi: Fortsetzen, Erweitern, Zusammenfassen, Umschreiben, Dialog",
          "Freier Prompt — jede Anweisung, jede Aufgabe",
          "Stilanpassung: KI analysiert deinen Text in 10 Dimensionen und spiegelt deine Stimme",
          "Stil vertiefen: eigene Notiz zur Verfeinerung der KI-Interpretation",
          "Letztes Ergebnis mit einem Klick neu generieren",
          "Eigenen Text als Referenzmaterial einfügen",
          "Vollständige Generierungshistorie in der Sitzung",
          "KI-Ausgabe einfügen, kopieren oder verwerfen",
        ],
      },
      {
        icon: Sparkles,
        color: "#10B981",
        title: "Kostenlose KI — kein Schlüssel nötig",
        subtitle: "Schreibe ab der ersten Minute mit KI — keine Einrichtung, keine Kreditkarte.",
        items: [
          "Betrieben von Pollinations — komplett kostenlos, kein API-Schlüssel nötig",
          "Jederzeit zwischen kostenloser KI und eigenem OpenAI-Schlüssel wechseln",
          "Volle Unterstützung für Generierung, Fortsetzen und Stilanalyse",
          "Ratenlimits werden transparent angezeigt — du weißt immer, was du nutzt",
        ],
      },
      {
        icon: Download,
        color: "#F96D1C",
        badge: "Aktualisiert",
        title: "Layout-Modus & professioneller Export",
        subtitle: "Vorschau deines Buches als echte Buchseite, dann Export in drei Formaten.",
        items: [
          "Paged.js-Rendering — echtes CSS @page-Layout mit korrekten Seitenumbrüchen",
          "Gespiegelte Seitennummerierung — asymmetrische Kopf-/Fußzeilen links/rechts für druckfertige Bücher",
          "Copyright-Seite mit eigener Schriftgröße und Zeilenabstand",
          "Professionelle Silbentrennung (Browser-nativ + Hypher-Wörterbuch)",
          "Zoom-Vorschau für pixelgenaues Korrekturlesen",
          "Export als PDF — Browserdruckfunktion mit korrektem Seitenlayout",
          "Export als EPUB — gültiges EPUB 3 mit XHTML, Navigation und Metadaten",
          "Export als DOCX — Word-kompatibel mit Kapiteln und Absätzen",
          "Eigene Metadaten: Titel, Autor, Sprache, Cover-Farbe",
        ],
      },
      {
        icon: Layers,
        color: "#F96D1C",
        title: "Kodex — Welt & Charaktere",
        subtitle: "Eine dauerhafte Wissensdatenbank, die mit deinem Buch verknüpft und der KI zugänglich ist.",
        items: [
          "Einträge für Charaktere, Orte, Objekte und Konzepte",
          "Erweiterter Editor mit Notizen und ausführlichen Beschreibungen",
          "Kodex bereichert den KI-Kontext automatisch — kein Kopieren nötig",
          "Sofortsuche über alle Einträge",
        ],
      },
      {
        icon: Flame,
        color: "#ef4444",
        title: "Schreibgewohnheiten & Streaks",
        subtitle: "Baue eine nachhaltige Schreibpraxis mit täglichem Tracking auf.",
        items: [
          "Täglicher Streak-Tracker — dein Momentum auf einen Blick",
          "Eigene Ziele: Wörter/Tag oder Kapitel/Tag",
          "Kalender-Heatmap — jede Schreibsession visuell festgehalten",
          "Sitzungsnotizen: Reflexion oder Plan für die nächste Session",
        ],
      },
      {
        icon: Palette,
        color: "#6366f1",
        title: "Stilanalyse",
        subtitle: "Ein 10-dimensionaler Fingerabdruck deines Schreibens, der bei jeder Generierung angewendet wird.",
        items: [
          "Analysiert Vokabelniveau, Satzlänge, Ton, Rhythmus, POV, Dialogstil",
          "Generiert automatisch eine Stilanweisung für alle KI-Generierungen",
          "Vertiefung per eigenem Prompt zur Verfeinerung der Interpretation",
          "Jederzeit zurücksetzen und neu analysieren",
        ],
      },
      {
        icon: Cpu,
        color: "#6366f1",
        title: "Mehrere KI-Modelle",
        subtitle: "Wähle das richtige Modell für die richtige Aufgabe.",
        items: [
          "GPT-4o mini (schnell, günstig), GPT-4o (leistungsstark), o1-mini (Reasoning)",
          "Modellauswahl in den Einstellungen — jederzeit änderbar",
          "Modell wird im KI-Panel-Header angezeigt — du weißt immer, was läuft",
          "Alle Agenten und Generierungsmodi nutzen dein gewähltes Modell",
        ],
      },
      {
        icon: Globe,
        color: "#F96D1C",
        title: "Vollständige Mehrsprachigkeit",
        subtitle: "Native Benutzeroberfläche und KI-Antworten in vier Sprachen.",
        items: [
          "Englisch, Russisch, Ukrainisch und Deutsch — vollständige UI-Lokalisierung",
          "KI erkennt deine Sprache und generiert automatisch darin",
          "Sprachumschalter auf jeder Seite",
          "Alle Benachrichtigungen, Fehler und Systemnachrichten sind lokalisiert",
        ],
      },
      {
        icon: Shield,
        color: "#6366f1",
        title: "Datenschutz & deine Schlüssel",
        subtitle: "Deine Texte und Zugangsdaten gehören nur dir.",
        items: [
          "OpenAI-Schlüssel wird verschlüsselt gespeichert — nie weitergegeben oder geloggt",
          "Alle Buchinhalte bleiben in deinem Konto — kein KI-Training mit deinen Daten",
          "Keine Werbung, keine Tracker, keine Dark Patterns",
          "Pollinations — KI-Zugang ohne Schlüssel und ohne Einrichtung",
        ],
      },
    ],
    ctaTitle: "Bereit, dein Buch zu schreiben?",
    ctaDesc: "Starte mit kostenloser KI. Füge deinen OpenAI-Schlüssel hinzu, wenn du mehr Leistung möchtest.",
    ctaButton: "Zur Bibliothek",
    back: "Zurück",
  },
};

// ── Category system ───────────────────────────────────────────────────────────

const CAT_INDICES: Record<string, number[]> = {
  all:      [],
  editor:   [0, 2, 3],
  ai:       [1, 2, 3, 7],
  export:   [4],
  world:    [5],
  habits:   [6],
  platform: [8, 9, 10],
};

const CAT_LABELS: Record<string, Record<string, string>> = {
  all:      { en: "All",      ru: "Все",        ua: "Всі",       de: "Alle" },
  editor:   { en: "Editor",   ru: "Редактор",   ua: "Редактор",  de: "Editor" },
  ai:       { en: "AI",       ru: "ИИ",         ua: "ШІ",        de: "KI" },
  export:   { en: "Export",   ru: "Экспорт",    ua: "Експорт",   de: "Export" },
  world:    { en: "Codex",    ru: "Кодекс",     ua: "Кодекс",    de: "Kodex" },
  habits:   { en: "Habits",   ru: "Привычки",   ua: "Звички",    de: "Gewohnheiten" },
  platform: { en: "Platform", ru: "Платформа",  ua: "Платформа", de: "Plattform" },
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

  return (
    <div className="min-h-screen" style={{ background: "hsl(30,58%,97%)" }}>

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
