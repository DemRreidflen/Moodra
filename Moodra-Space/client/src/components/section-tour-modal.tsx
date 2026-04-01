import { useState, useEffect } from "react";
import { X, ChevronRight, ChevronLeft, Sparkles, BookOpen, StickyNote, Lightbulb, Bot, LayoutTemplate, FileStack } from "lucide-react";

export type TourSectionId = "editor" | "notes" | "ideas" | "ai" | "drafts" | "layout";

const STORAGE_KEY = (id: TourSectionId) => `moodra_tour_done_v2_${id}`;

const TOURS: Record<TourSectionId, {
  icon: React.ComponentType<any>;
  iconColor: string;
  iconBg: string;
  steps: Record<"en" | "ru" | "ua" | "de", { title: string; body: string }[]>;
}> = {
  editor: {
    icon: BookOpen,
    iconColor: "#6366f1",
    iconBg: "rgba(99,102,241,0.12)",
    steps: {
      en: [
        { title: "Chapter Editor", body: "This is where your story lives. Select a chapter from the left sidebar to start writing. Every edit auto-saves." },
        { title: "Text Formatting", body: "Select any text to reveal the formatting toolbar — bold, italic, headings, quotes, and block types. You can also use markdown shortcuts like **bold** or # Heading." },
        { title: "AI Co-Author", body: "Open the AI panel (right side) to get continuation suggestions, paraphrasing, or a full AI draft of your scene. You control what gets used." },
        { title: "Adapt & Translate", body: "Use the Adapt button to translate or stylistically transform a chapter. The AI preserves your narrative intent while shifting language or tone." },
      ],
      ru: [
        { title: "Редактор глав", body: "Здесь живёт ваша история. Выберите главу в левой панели — и начинайте писать. Каждое изменение сохраняется автоматически." },
        { title: "Форматирование", body: "Выделите текст, чтобы увидеть панель форматирования — жирный, курсив, заголовки, цитаты. Также работают markdown-сокращения: **жирный** или # Заголовок." },
        { title: "AI-соавтор", body: "Откройте панель AI (справа), чтобы получить продолжение, перефразировку или полный черновик сцены. Вы выбираете, что использовать." },
        { title: "Адаптация и перевод", body: "Кнопка «Адаптировать» позволяет перевести или стилистически преобразовать главу. AI сохраняет нарратив, меняя язык или тон." },
      ],
      ua: [
        { title: "Редактор розділів", body: "Тут живе ваша історія. Оберіть розділ у лівій панелі — і починайте писати. Кожна зміна зберігається автоматично." },
        { title: "Форматування", body: "Виділіть текст, щоб побачити панель форматування — жирний, курсив, заголовки, цитати. Також працюють markdown-скорочення: **жирний** або # Заголовок." },
        { title: "AI-співавтор", body: "Відкрийте панель AI (праворуч), щоб отримати продовження, перефразування або повний чернетковий варіант сцени." },
        { title: "Адаптація і переклад", body: "Кнопка «Адаптувати» дозволяє перекласти або стилістично перетворити розділ. AI зберігає наратив, змінюючи мову чи тон." },
      ],
      de: [
        { title: "Kapitel-Editor", body: "Hier lebt Ihre Geschichte. Wählen Sie ein Kapitel aus der linken Seitenleiste und beginnen Sie zu schreiben. Jede Änderung wird automatisch gespeichert." },
        { title: "Textformatierung", body: "Markieren Sie Text, um die Formatierungsleiste anzuzeigen — fett, kursiv, Überschriften, Zitate. Markdown-Kürzel wie **fett** oder # Überschrift funktionieren ebenfalls." },
        { title: "KI-Koautor", body: "Öffnen Sie das KI-Panel (rechts), um Fortsetzungsvorschläge, Umformulierungen oder einen vollständigen KI-Entwurf Ihrer Szene zu erhalten." },
        { title: "Anpassen & Übersetzen", body: 'Verwenden Sie die Schaltfläche "Anpassen", um ein Kapitel zu übersetzen oder stilistisch zu transformieren. Die KI bewahrt Ihre Erzählabsicht.' },
      ],
    },
  },
  notes: {
    icon: StickyNote,
    iconColor: "#f59e0b",
    iconBg: "rgba(245,158,11,0.12)",
    steps: {
      en: [
        { title: "Notes Panel", body: "Notes are quick-capture spaces for fragments, observations, and seeds that haven't found their chapter yet. Add as many as you need." },
        { title: "Chains", body: "Link related notes into a Chain — a sequence you can navigate in order. Great for research threads, subplot outlines, or inspiration trails." },
        { title: "Collections", body: "Group notes by theme with Collections. A note can belong to multiple collections. Filter the panel by collection to focus your view." },
        { title: "Idea Board", body: "Any note can be pinned to the Idea Board as a card — giving it spatial context among your other creative fragments." },
      ],
      ru: [
        { title: "Панель заметок", body: "Заметки — это быстрый захват мыслей, фрагментов и идей, которые ещё не нашли свою главу. Добавляйте столько, сколько нужно." },
        { title: "Цепочки", body: "Свяжите связанные заметки в Цепочку — последовательность, по которой можно перемещаться. Идеально для исследовательских нитей или набросков подсюжетов." },
        { title: "Коллекции", body: "Группируйте заметки по теме с помощью Коллекций. Заметка может входить в несколько коллекций. Фильтруйте панель по коллекции для фокуса." },
        { title: "Доска идей", body: "Любую заметку можно прикрепить на Доску идей как карточку — она получает пространственный контекст среди других фрагментов." },
      ],
      ua: [
        { title: "Панель нотаток", body: "Нотатки — це швидкий захват думок і фрагментів, які ще не знайшли своєї глави. Додавайте скільки завгодно." },
        { title: "Ланцюги", body: "Зв'яжіть пов'язані нотатки в Ланцюг — послідовність, якою можна переміщатися. Ідеально для дослідницьких ниток або обрисів підсюжетів." },
        { title: "Колекції", body: "Групуйте нотатки за темою за допомогою Колекцій. Нотатка може належати до кількох колекцій." },
        { title: "Дошка ідей", body: "Будь-яку нотатку можна прикріпити на Дошку ідей як картку — вона отримує просторовий контекст серед інших фрагментів." },
      ],
      de: [
        { title: "Notizen-Panel", body: "Notizen sind schnelle Erfassungsräume für Fragmente, Beobachtungen und Ideen, die noch kein Kapitel gefunden haben." },
        { title: "Ketten", body: "Verknüpfen Sie verwandte Notizen zu einer Kette — einer Sequenz, durch die Sie navigieren können. Ideal für Forschungsfäden oder Subplot-Übersichten." },
        { title: "Sammlungen", body: "Gruppieren Sie Notizen nach Thema mit Sammlungen. Eine Notiz kann zu mehreren Sammlungen gehören." },
        { title: "Ideenboard", body: "Jede Notiz kann als Karte an das Ideenboard angeheftet werden — und erhält so einen räumlichen Kontext." },
      ],
    },
  },
  ideas: {
    icon: Lightbulb,
    iconColor: "#F96D1C",
    iconBg: "rgba(249,109,28,0.12)",
    steps: {
      en: [
        { title: "Idea Board", body: "A freeform spatial canvas for your creative fragments. Drag cards anywhere, cluster them, and see patterns emerge across your ideas." },
        { title: "Cards & Notes", body: "Create cards directly on the board, or pin existing notes here. Each card can hold text, tags, and a color mood." },
        { title: "Clusters", body: "Group related cards visually. There are no strict rules — arrange by theme, by chapter, by emotion. Let the layout reveal structure." },
        { title: "AI Spark", body: "Use the AI Spark feature to generate fresh idea fragments when you're stuck. The AI reads your existing cards for context." },
      ],
      ru: [
        { title: "Доска идей", body: "Свободный пространственный холст для ваших творческих фрагментов. Перемещайте карточки куда угодно и наблюдайте, как возникают связи." },
        { title: "Карточки и заметки", body: "Создавайте карточки прямо на доске или прикрепляйте существующие заметки. У каждой карточки есть текст, теги и цветовое настроение." },
        { title: "Кластеры", body: "Группируйте связанные карточки визуально. Нет строгих правил — организуйте по теме, по главе, по эмоции." },
        { title: "AI-искра", body: "Используйте AI-искру, чтобы генерировать свежие идеи, когда застряли. AI читает ваши существующие карточки для контекста." },
      ],
      ua: [
        { title: "Дошка ідей", body: "Вільне просторове полотно для ваших творчих фрагментів. Переміщуйте картки куди завгодно і спостерігайте, як виникають зв'язки." },
        { title: "Картки і нотатки", body: "Створюйте картки прямо на дошці або прикріплюйте існуючі нотатки. У кожної картки є текст, теги і колірний настрій." },
        { title: "Кластери", body: "Групуйте пов'язані картки візуально. Немає суворих правил — організуйте за темою, розділом або емоцією." },
        { title: "AI-іскра", body: "Використовуйте AI-іскру, щоб генерувати свіжі ідеї, коли застрягли. AI зчитує ваші існуючі картки для контексту." },
      ],
      de: [
        { title: "Ideenboard", body: "Eine freie räumliche Leinwand für Ihre kreativen Fragmente. Ziehen Sie Karten überall hin und lassen Sie Muster entstehen." },
        { title: "Karten & Notizen", body: "Erstellen Sie Karten direkt auf dem Board oder heften Sie vorhandene Notizen hier an. Jede Karte kann Text, Tags und eine Farbstimmung enthalten." },
        { title: "Cluster", body: "Gruppieren Sie verwandte Karten visuell. Es gibt keine strengen Regeln — ordnen Sie nach Thema, Kapitel oder Emotion." },
        { title: "KI-Funken", body: "Verwenden Sie die KI-Funken-Funktion, um frische Ideenfragmente zu generieren, wenn Sie feststecken." },
      ],
    },
  },
  ai: {
    icon: Bot,
    iconColor: "#8B5CF6",
    iconBg: "rgba(139,92,246,0.12)",
    steps: {
      en: [
        { title: "AI Co-Author", body: "The AI panel gives you a writing partner that knows your book — its characters, settings, and tone — from the Codex and your chapters." },
        { title: "Continuation", body: "Place your cursor at any point in a chapter and request a continuation. The AI drafts the next passage for you to accept, modify, or discard." },
        { title: "Scene Generation", body: "Describe a scene briefly and the AI writes a full draft. Use it as a starting point — never as a finished product. Your edit is the art." },
        { title: "Style Control", body: "Set a mood, POV, or style instruction before generating. The AI adapts its voice to match your direction." },
      ],
      ru: [
        { title: "AI-соавтор", body: "Панель AI даёт вам партнёра по написанию, который знает вашу книгу — персонажей, обстановку, тон — из Кодекса и ваших глав." },
        { title: "Продолжение", body: "Поставьте курсор в любое место главы и запросите продолжение. AI набросает следующий отрывок для принятия, изменения или отклонения." },
        { title: "Генерация сцен", body: "Опишите сцену кратко, и AI напишет полный черновик. Используйте как отправную точку — никогда как готовый продукт." },
        { title: "Управление стилем", body: "Задайте настроение, точку зрения или стилевое указание перед генерацией. AI адаптирует свой голос под ваше направление." },
      ],
      ua: [
        { title: "AI-співавтор", body: "Панель AI дає вам партнера по написанню, який знає вашу книгу — персонажів, обстановку, тон — з Кодексу та ваших розділів." },
        { title: "Продовження", body: "Поставте курсор у будь-яке місце розділу і запросіть продовження. AI накреслить наступний уривок для прийняття, зміни або відхилення." },
        { title: "Генерація сцен", body: "Опишіть сцену коротко, і AI напише повний чернетковий варіант. Використовуйте як відправну точку — ніколи як готовий продукт." },
        { title: "Управління стилем", body: "Задайте настрій, точку зору або стильову вказівку перед генерацією. AI адаптує свій голос під ваш напрямок." },
      ],
      de: [
        { title: "KI-Koautor", body: "Das KI-Panel gibt Ihnen einen Schreibpartner, der Ihr Buch kennt — seine Charaktere, Schauplätze und den Ton — aus dem Codex und Ihren Kapiteln." },
        { title: "Fortsetzung", body: "Platzieren Sie Ihren Cursor an einem beliebigen Punkt in einem Kapitel und fordern Sie eine Fortsetzung an." },
        { title: "Szenen-Generierung", body: "Beschreiben Sie eine Szene kurz und die KI schreibt einen vollständigen Entwurf. Verwenden Sie ihn als Ausgangspunkt — nie als fertiges Produkt." },
        { title: "Stilsteuerung", body: "Legen Sie vor der Generierung eine Stimmung, einen POV oder eine Stilanweisung fest. Die KI passt ihre Stimme an Ihre Richtung an." },
      ],
    },
  },
  drafts: {
    icon: FileStack,
    iconColor: "#10b981",
    iconBg: "rgba(16,185,129,0.12)",
    steps: {
      en: [
        { title: "Draft Stages", body: "Each chapter moves through four stages: Plan, Sketch, Edit, and Final. Drag chapters between columns to track your writing progress." },
        { title: "Plan", body: "The Plan column is for chapters that exist only as an idea or outline. Add chapter titles here before you start writing." },
        { title: "Sketch & Edit", body: "Move chapters to Sketch when you've written a first draft, and to Edit when you're actively revising. Each stage has a distinct visual state." },
        { title: "Final", body: "Mark a chapter Final when you're satisfied with it. This gives you a clear picture of how close the manuscript is to completion." },
      ],
      ru: [
        { title: "Этапы черновика", body: "Каждая глава проходит четыре этапа: Планирование, Набросок, Редактура и Финал. Перетаскивайте главы между колонками для отслеживания прогресса." },
        { title: "Планирование", body: "Колонка «Планирование» — для глав, существующих только как идея или набросок. Добавляйте названия глав здесь, прежде чем начать писать." },
        { title: "Набросок и редактура", body: "Переместите главу в «Набросок» после первого черновика, а в «Редактуру» — когда активно правите. У каждого этапа своё визуальное состояние." },
        { title: "Финал", body: "Отметьте главу «Финал», когда довольны ею. Это даёт чёткое представление о том, насколько рукопись близка к завершению." },
      ],
      ua: [
        { title: "Етапи чернетки", body: "Кожен розділ проходить чотири етапи: Планування, Нарис, Редагування і Фінал. Перетягуйте розділи між колонками для відстеження прогресу." },
        { title: "Планування", body: "Колонка «Планування» — для розділів, що існують лише як ідея або обрис. Додавайте назви розділів тут, перш ніж починати писати." },
        { title: "Нарис і редагування", body: "Перемістіть розділ у «Нарис» після першого чернетки, а в «Редагування» — коли активно правите." },
        { title: "Фінал", body: "Позначте розділ «Фінал», коли задоволені ним. Це дає чітке уявлення про те, наскільки рукопис близький до завершення." },
      ],
      de: [
        { title: "Entwurfsphasen", body: "Jedes Kapitel durchläuft vier Phasen: Planen, Skizzieren, Bearbeiten und Final. Ziehen Sie Kapitel zwischen Spalten, um Ihren Fortschritt zu verfolgen." },
        { title: "Planen", body: "Die Planen-Spalte ist für Kapitel, die nur als Idee oder Gliederung existieren. Fügen Sie hier Kapiteltitel hinzu, bevor Sie mit dem Schreiben beginnen." },
        { title: "Skizzieren & Bearbeiten", body: "Verschieben Sie Kapitel nach dem ersten Entwurf zu Skizzieren und beim aktiven Überarbeiten zu Bearbeiten." },
        { title: "Final", body: "Markieren Sie ein Kapitel als Final, wenn Sie zufrieden sind. Dies gibt Ihnen ein klares Bild davon, wie nah das Manuskript der Fertigstellung ist." },
      ],
    },
  },
  layout: {
    icon: LayoutTemplate,
    iconColor: "#F96D1C",
    iconBg: "rgba(249,109,28,0.12)",
    steps: {
      en: [
        { title: "Layout & Typesetting", body: "Preview your book as printed pages. Choose page size, fonts, line spacing, margins, and templates to see how your manuscript will look in print." },
        { title: "Page Templates", body: "Three templates are available: Classic (elegant ornamental), Modern (bold typographic), and Minimal (clean and restrained). Each changes the chapter heading style." },
        { title: "Cover & TOC", body: "The Cover page shows your book cover (upload one in Book Settings). The Table of Contents is auto-generated from your chapter titles." },
        { title: "Two Rendering Engines", body: "Latin Engine — for English and other Latin-script texts. Uses Paged.js in the browser and opens the print dialog to save as PDF.\n\nCyrillic Engine — for Russian and Ukrainian texts. Uses WeasyPrint server-side and downloads the PDF directly with correct hyphenation and typography.\n\nChoose the engine that matches your book's language for best results." },
        { title: "Export", body: "Export your book as PDF, EPUB, or DOCX. The layout settings are applied to the PDF export. EPUB includes embedded fonts and cover." },
      ],
      ru: [
        { title: "Вёрстка и типографика", body: "Просматривайте книгу как печатные страницы. Выбирайте размер страницы, шрифты, межстрочный интервал, поля и шаблоны." },
        { title: "Шаблоны страниц", body: "Доступны три шаблона: Классика (элегантный), Модерн (жирный типографский) и Минимал (чистый и сдержанный). Каждый меняет стиль заголовков глав." },
        { title: "Обложка и содержание", body: "Страница обложки показывает обложку книги (загрузите в Настройках книги). Оглавление генерируется автоматически из названий глав." },
        { title: "Два движка вёрстки", body: "Latin Engine — для английских и других латинских текстов. Использует Paged.js в браузере — откроется диалог печати для сохранения PDF.\n\nCyrillic Engine — для русских и украинских текстов. Использует WeasyPrint — PDF скачивается напрямую с правильными переносами и типографикой.\n\nВажно выбирать подходящий движок: неправильный может дать некорректные переносы и форматирование." },
        { title: "Экспорт", body: "Экспортируйте книгу в PDF, EPUB или DOCX. Настройки вёрстки применяются к экспорту PDF. EPUB включает встроенные шрифты и обложку." },
      ],
      ua: [
        { title: "Вёрстка і типографіка", body: "Переглядайте книгу як друковані сторінки. Обирайте розмір сторінки, шрифти, міжрядковий інтервал, поля та шаблони." },
        { title: "Шаблони сторінок", body: "Доступні три шаблони: Класика, Модерн і Мінімал. Кожен змінює стиль заголовків розділів." },
        { title: "Обкладинка та зміст", body: "Сторінка обкладинки показує обкладинку книги (завантажте в Налаштуваннях книги). Зміст генерується автоматично." },
        { title: "Два рушії вёрстки", body: "Latin Engine — для англійських та інших латинських текстів. Використовує Paged.js у браузері — відкриється діалог друку для збереження PDF.\n\nCyrillic Engine — для російських та українських текстів. Використовує WeasyPrint — PDF завантажується напряму з правильними переносами.\n\nВажливо обирати відповідний рушій: неправильний може дати некоректні переноси і форматування." },
        { title: "Експорт", body: "Експортуйте книгу в PDF, EPUB або DOCX. Налаштування вёрстки застосовуються до експорту PDF. EPUB включає вбудовані шрифти та обкладинку." },
      ],
      de: [
        { title: "Layout & Satz", body: "Sehen Sie sich Ihr Buch als gedruckte Seiten an. Wählen Sie Seitengröße, Schriften, Zeilenabstand, Ränder und Vorlagen." },
        { title: "Seitenvorlagen", body: "Drei Vorlagen stehen zur Verfügung: Klassisch, Modern und Minimal. Jede ändert den Stil der Kapitelüberschriften." },
        { title: "Cover & Inhaltsverzeichnis", body: "Die Cover-Seite zeigt Ihr Buchcover (laden Sie es in den Bucheinstellungen hoch). Das Inhaltsverzeichnis wird automatisch generiert." },
        { title: "Zwei Rendering-Engines", body: "Latin Engine — für englische und andere lateinschriftliche Texte. Verwendet Paged.js im Browser und öffnet den Druckdialog zum Speichern als PDF.\n\nCyrillic Engine — für russische und ukrainische Texte. Verwendet WeasyPrint serverseitig und lädt das PDF direkt herunter.\n\nWählen Sie die Engine, die zur Sprache Ihres Buches passt, für beste Ergebnisse." },
        { title: "Export", body: "Exportieren Sie Ihr Buch als PDF, EPUB oder DOCX. Die Layout-Einstellungen werden auf den PDF-Export angewendet." },
      ],
    },
  },
};

const UI = {
  en: { step: (s: number, t: number) => `${s} / ${t}`, next: "Next", prev: "Back", done: "Got it", skip: "Skip tour" },
  ru: { step: (s: number, t: number) => `${s} / ${t}`, next: "Далее", prev: "Назад", done: "Понятно", skip: "Пропустить" },
  ua: { step: (s: number, t: number) => `${s} / ${t}`, next: "Далі", prev: "Назад", done: "Зрозуміло", skip: "Пропустити" },
  de: { step: (s: number, t: number) => `${s} / ${t}`, next: "Weiter", prev: "Zurück", done: "Verstanden", skip: "Tour überspringen" },
};

interface SectionTourModalProps {
  sectionId: TourSectionId;
  lang?: "en" | "ru" | "ua" | "de";
  onDone?: () => void;
}

export function SectionTourModal({ sectionId, lang = "en", onDone }: SectionTourModalProps) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY(sectionId));
    if (!seen) setVisible(true);
  }, [sectionId]);

  if (!visible) return null;

  const tour = TOURS[sectionId];
  const ui = UI[lang] || UI.en;
  const steps = tour.steps[lang] || tour.steps.en;
  const total = steps.length;
  const current = steps[step];
  const Icon = tour.icon;

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY(sectionId), "1");
    setVisible(false);
    onDone?.();
  };

  const next = () => {
    if (step < total - 1) setStep(s => s + 1);
    else dismiss();
  };

  const prev = () => {
    if (step > 0) setStep(s => s - 1);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.35)",
        backdropFilter: "blur(2px)",
      }}
      onClick={e => { if (e.target === e.currentTarget) dismiss(); }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 20,
          boxShadow: "0 24px 80px rgba(0,0,0,0.18)",
          width: 420,
          maxWidth: "92vw",
          padding: "28px 28px 22px",
          position: "relative",
          fontFamily: "inherit",
        }}
      >
        <button
          onClick={dismiss}
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            width: 28,
            height: 28,
            borderRadius: 8,
            border: "none",
            background: "rgba(0,0,0,0.06)",
            color: "#999",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <X style={{ width: 14, height: 14 }} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
          <div style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: tour.iconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            <Icon style={{ width: 20, height: 20, color: tour.iconColor }} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a", lineHeight: 1.2 }}>
              {current.title}
            </div>
            <div style={{ fontSize: 11, color: "#bbb", marginTop: 2 }}>
              {ui.step(step + 1, total)}
            </div>
          </div>
        </div>

        <p style={{
          fontSize: 13.5,
          lineHeight: 1.65,
          color: "#444",
          margin: "0 0 22px",
          whiteSpace: "pre-line",
        }}>
          {current.body}
        </p>

        <div style={{
          display: "flex",
          gap: 6,
          marginBottom: 18,
          justifyContent: "center",
        }}>
          {steps.map((_, i) => (
            <div key={i} style={{
              width: i === step ? 20 : 6,
              height: 6,
              borderRadius: 3,
              background: i === step ? tour.iconColor : "rgba(0,0,0,0.10)",
              transition: "all 0.2s ease",
            }} />
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <button
            onClick={dismiss}
            style={{
              fontSize: 12,
              color: "#bbb",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px 0",
            }}
          >
            {ui.skip}
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            {step > 0 && (
              <button
                onClick={prev}
                style={{
                  padding: "8px 16px",
                  borderRadius: 10,
                  border: "1.5px solid rgba(0,0,0,0.10)",
                  background: "transparent",
                  color: "#555",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <ChevronLeft style={{ width: 14, height: 14 }} />
                {ui.prev}
              </button>
            )}
            <button
              onClick={next}
              style={{
                padding: "8px 20px",
                borderRadius: 10,
                border: "none",
                background: tour.iconColor,
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              {step === total - 1 ? ui.done : ui.next}
              {step < total - 1 && <ChevronRight style={{ width: 14, height: 14 }} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function resetSectionTour(sectionId: TourSectionId) {
  localStorage.removeItem(STORAGE_KEY(sectionId));
}

export function resetAllTours() {
  (Object.keys(TOURS) as TourSectionId[]).forEach(id => localStorage.removeItem(STORAGE_KEY(id)));
}
