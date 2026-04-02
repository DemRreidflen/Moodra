import { useLocation } from "wouter";
import { ArrowLeft, Feather, Brain, BookOpen, Heart, Flame, Globe, Shield, Zap, Users, Target, ChevronDown, Mail } from "lucide-react";
import { useState } from "react";
import { useLang } from "@/contexts/language-context";
import { LanguagePicker } from "@/components/language-picker";
import { SiteFooter } from "@/components/site-footer";

const ACCENT = "#F96D1C";

const TIMELINE = {
  en: [
    { year: "2022", label: "The search", body: "Years of trying every tool that existed — and finding none of them fit the way a writer actually thinks." },
    { year: "Late '22", label: "First lines of code", body: "Jastiffel and a small team in England began building an internal tool. Not to sell. Just to use." },
    { year: "2023", label: "A year of silence", body: "A small circle of writers used it daily. The tool got better. Word spread quietly." },
    { year: "2024", label: "Going public", body: "Authors across Europe started using it for novels, memoirs, journalism, and scientific writing." },
    { year: "Now", label: "Still independent", body: "No VC. No growth hacking. No dark patterns. Just a tool that tries to be genuinely useful." },
  ],
  ru: [
    { year: "2022", label: "Поиск", body: "Годы попыток найти инструмент, который подходит реальному писательскому процессу — и ни один не подошёл." },
    { year: "Конец '22", label: "Первые строчки кода", body: "Jastiffel и небольшая команда из Англии начали строить внутренний инструмент. Не для продажи. Просто для себя." },
    { year: "2023", label: "Год в тишине", body: "Небольшой круг авторов пользовался ежедневно. Инструмент становился лучше. Слух распространялся тихо." },
    { year: "2024", label: "Выход в открытый доступ", body: "Авторы по всей Европе начали использовать его для романов, мемуаров, журналистики и научных текстов." },
    { year: "Сейчас", label: "По-прежнему независимый", body: "Никаких венчурных инвестиций. Никакого гроу-хакинга. Никаких тёмных паттернов. Просто инструмент." },
  ],
  ua: [
    { year: "2022", label: "Пошук", body: "Роки спроб знайти інструмент, що відповідає реальному письменницькому процесу — і жоден не підійшов." },
    { year: "Кін. '22", label: "Перші рядки коду", body: "Jastiffel і невелика команда з Англії почали будувати внутрішній інструмент. Не для продажу. Просто для себе." },
    { year: "2023", label: "Рік у тиші", body: "Невелике коло авторів користувалося щодня. Інструмент ставав кращим. Слух поширювався тихо." },
    { year: "2024", label: "Вихід у відкритий доступ", body: "Автори по всій Європі почали використовувати його для романів, мемуарів, журналістики та наукових текстів." },
    { year: "Зараз", label: "Досі незалежний", body: "Жодних венчурних інвестицій. Жодного гроу-хакінгу. Жодних темних патернів. Просто інструмент." },
  ],
  de: [
    { year: "2022", label: "Die Suche", body: "Jahre des Ausprobierens aller verfügbaren Tools — keines passte zur Art, wie ein Schriftsteller wirklich denkt." },
    { year: "Ende '22", label: "Erste Codezeilen", body: "Jastiffel und ein kleines Team in England begannen, ein internes Werkzeug zu bauen. Nicht zum Verkauf. Nur zum Benutzen." },
    { year: "2023", label: "Ein Jahr der Stille", body: "Ein kleiner Kreis von Autoren nutzte es täglich. Das Werkzeug wurde besser. Das Wort verbreitete sich leise." },
    { year: "2024", label: "Der öffentliche Start", body: "Autoren in ganz Europa begannen es für Romane, Memoiren, Journalismus und wissenschaftliche Texte zu nutzen." },
    { year: "Jetzt", label: "Weiterhin unabhängig", body: "Kein Risikokapital. Kein Growth Hacking. Keine dunklen Muster. Nur ein wirklich nützliches Werkzeug." },
  ],
};

const PRINCIPLES = {
  en: [
    { icon: Feather, title: "Writing is thinking", body: "The act of writing isn't just recording ideas — it's generating them. Moodra is built around this truth.", color: "#F96D1C" },
    { icon: Brain, title: "Context is everything", body: "A good co-author remembers the whole book, not just the last paragraph. So does our AI.", color: "#8B5CF6" },
    { icon: Shield, title: "No dark patterns", body: "No artificial limits designed to upsell you. No data sold to anyone. No growth tricks at your expense.", color: "#10B981" },
    { icon: Heart, title: "Built with care", body: "Every feature exists because a real writer needed it. Not because a metric demanded it.", color: "#EF4444" },
    { icon: Target, title: "Opinionated, not rigid", body: "We have strong ideas about what good writing tools should do — but we listen when writers disagree.", color: "#F59E0B" },
    { icon: Globe, title: "Made for Europe, open to all", body: "Born in England and Ukraine, used across the continent. Language and culture matter in how we build.", color: "#3B82F6" },
  ],
  ru: [
    { icon: Feather, title: "Письмо — это мышление", body: "Писать — не значит записывать готовые мысли. Это значит их порождать. Moodra создана вокруг этой истины.", color: "#F96D1C" },
    { icon: Brain, title: "Контекст — это всё", body: "Хороший соавтор помнит всю книгу, а не только последний абзац. Наш AI работает именно так.", color: "#8B5CF6" },
    { icon: Shield, title: "Никаких тёмных паттернов", body: "Никаких искусственных ограничений ради апсейла. Никакой продажи данных. Никаких трюков за ваш счёт.", color: "#10B981" },
    { icon: Heart, title: "Сделано с заботой", body: "Каждая функция существует потому, что реальному писателю она была нужна. Не потому что этого требовала метрика.", color: "#EF4444" },
    { icon: Target, title: "С позицией, но не жёсткий", body: "У нас есть чёткие идеи о том, каким должен быть хороший инструмент для письма — но мы слушаем, когда авторы не согласны.", color: "#F59E0B" },
    { icon: Globe, title: "Создан в Европе, открыт для всех", body: "Рождён в Англии и Украине, используется по всему континенту. Язык и культура важны в том, как мы строим.", color: "#3B82F6" },
  ],
  ua: [
    { icon: Feather, title: "Письмо — це мислення", body: "Писати — не означає записувати готові думки. Це означає їх породжувати. Moodra створена навколо цієї істини.", color: "#F96D1C" },
    { icon: Brain, title: "Контекст — це все", body: "Хороший співавтор пам'ятає всю книгу, а не лише останній абзац. Наш AI працює саме так.", color: "#8B5CF6" },
    { icon: Shield, title: "Жодних темних патернів", body: "Жодних штучних обмежень заради апсейлу. Жодного продажу даних. Жодних трюків за ваш рахунок.", color: "#10B981" },
    { icon: Heart, title: "Зроблено з турботою", body: "Кожна функція існує тому, що реальному письменнику вона була потрібна. Не тому, що цього вимагала метрика.", color: "#EF4444" },
    { icon: Target, title: "З позицією, але не жорсткий", body: "У нас є чіткі ідеї щодо того, яким має бути хороший інструмент для письма — але ми слухаємо, коли автори не погоджуються.", color: "#F59E0B" },
    { icon: Globe, title: "Створений в Європі, відкритий для всіх", body: "Народжений в Англії та Україні, використовується по всьому континенту. Мова та культура важливі в тому, як ми будуємо.", color: "#3B82F6" },
  ],
  de: [
    { icon: Feather, title: "Schreiben ist Denken", body: "Der Akt des Schreibens zeichnet nicht nur Ideen auf — er erzeugt sie. Moodra ist um diese Wahrheit herum gebaut.", color: "#F96D1C" },
    { icon: Brain, title: "Kontext ist alles", body: "Ein guter Mitautor erinnert sich an das ganze Buch, nicht nur an den letzten Absatz. So auch unsere KI.", color: "#8B5CF6" },
    { icon: Shield, title: "Keine dunklen Muster", body: "Keine künstlichen Grenzen zum Upselling. Keine Datenweitergabe. Keine Wachstumstricks auf Ihre Kosten.", color: "#10B981" },
    { icon: Heart, title: "Mit Sorgfalt gebaut", body: "Jede Funktion existiert, weil ein echter Schriftsteller sie brauchte. Nicht weil eine Metrik es verlangte.", color: "#EF4444" },
    { icon: Target, title: "Meinungsstark, nicht starr", body: "Wir haben starke Ideen darüber, was gute Schreibwerkzeuge leisten sollen — aber wir hören zu, wenn Autoren anderer Meinung sind.", color: "#F59E0B" },
    { icon: Globe, title: "In Europa gebaut, für alle offen", body: "In England und der Ukraine entstanden, auf dem ganzen Kontinent genutzt. Sprache und Kultur prägen unsere Arbeit.", color: "#3B82F6" },
  ],
};

const NOT_LIST = {
  en: ["a subscription trap", "a VC-backed startup", "built for growth metrics", "selling your data", "following trends", "for passive readers"],
  ru: ["ловушка подписки", "стартап с венчурными инвестициями", "построен ради метрик роста", "продаёт ваши данные", "следует трендам", "для пассивных читателей"],
  ua: ["пастка підписки", "стартап з венчурними інвестиціями", "побудований заради метрик зростання", "продає ваші дані", "слідує трендам", "для пасивних читачів"],
  de: ["eine Abonnementfalle", "ein VC-finanziertes Startup", "auf Wachstumsmetriken ausgerichtet", "verkauft Ihre Daten", "Trends folgend", "für passive Leser"],
};

const IS_LIST = {
  en: ["a tool built by writers", "permanently independent", "built around your workflow", "open about how it works", "opinionated about quality", "for people who care about what they write"],
  ru: ["инструмент, созданный писателями", "постоянно независимый", "построен вокруг вашего рабочего процесса", "открыт о том, как работает", "имеет позицию насчёт качества", "для людей, которым важно, что они пишут"],
  ua: ["інструмент, створений письменниками", "постійно незалежний", "побудований навколо вашого робочого процесу", "відкритий щодо того, як працює", "має позицію щодо якості", "для людей, яким важливо, що вони пишуть"],
  de: ["ein von Autoren entwickeltes Tool", "dauerhaft unabhängig", "um Ihren Arbeitsablauf herum gebaut", "transparent über seine Funktionsweise", "qualitätsbewusst", "für Menschen, denen ihr Schreiben wichtig ist"],
};

const STATS = {
  en: [
    { value: "2022", label: "Founded" },
    { value: "4+", label: "Languages" },
    { value: "EU", label: "Based in Europe" },
    { value: "∞", label: "Words written" },
  ],
  ru: [
    { value: "2022", label: "Основан" },
    { value: "4+", label: "Языков" },
    { value: "EU", label: "Европа" },
    { value: "∞", label: "Написанных слов" },
  ],
  ua: [
    { value: "2022", label: "Засновано" },
    { value: "4+", label: "Мов" },
    { value: "EU", label: "Європа" },
    { value: "∞", label: "Написаних слів" },
  ],
  de: [
    { value: "2022", label: "Gegründet" },
    { value: "4+", label: "Sprachen" },
    { value: "EU", label: "Europa" },
    { value: "∞", label: "Geschriebene Wörter" },
  ],
};

const FAQS = {
  en: [
    { q: "Why not just use Notion, Word, or Scrivener?", a: "Those tools weren't built around how serious writing actually happens — specifically, how AI fits into that process. Moodra isn't a general-purpose tool. It's opinionated: block-based editing, book-aware AI, built-in habit tracking, and no filler features. If you've tried the others and they feel wrong, that's why we exist." },
    { q: "Who is Jastiffel?", a: "A designer and writer between England and Ukraine. He built Moodra because he was frustrated with every tool that existed. He uses it every day — which means every bug he ignores is one he lives with too." },
    { q: "What about AI — doesn't it just write for you?", a: "Only if you let it. Moodra's AI knows your book, not just the last paragraph. You can ask it to continue, improve, expand, or rephrase — but nothing gets inserted without your review. The author is always you. The AI is the instrument." },
    { q: "Will Moodra ever be sold or shut down?", a: "We have no intention of either. No investors means no one can force an exit. We built this to use it ourselves. That's the most durable reason to keep something alive." },
    { q: "What does it actually cost?", a: "Moodra is free. If you want AI features, you can use our built-in free AI (no API key required) or connect your own OpenAI key for more powerful models. We don't take a cut. We don't upsell. We might add a premium tier someday — but only if it's worth it." },
  ],
  ru: [
    { q: "Почему не использовать Notion, Word или Scrivener?", a: "Эти инструменты не созданы вокруг того, как на самом деле происходит серьёзное письмо — особенно с учётом того, как AI вписывается в этот процесс. Moodra — не универсальный инструмент. У неё есть позиция: блочное редактирование, AI с осведомлённостью о книге, встроенный трекинг привычек и никаких лишних функций. Если вы пробовали другие и они ощущаются не так — именно для этого мы существуем." },
    { q: "Кто такой Jastiffel?", a: "Дизайнер и писатель между Англией и Украиной. Он построил Moodra, потому что был разочарован всеми существующими инструментами. Он пользуется ею каждый день — это значит, что каждая ошибка, которую он игнорирует, — это ошибка, с которой он сам живёт." },
    { q: "А AI — разве он не просто пишет вместо тебя?", a: "Только если ты позволяешь. AI в Moodra знает твою книгу, а не только последний абзац. Ты можешь попросить его продолжить, улучшить, расширить или перефразировать — но ничто не вставляется без твоей проверки. Автор — всегда ты. AI — инструмент." },
    { q: "Будет ли Moodra когда-нибудь продана или закрыта?", a: "Ни того, ни другого мы не намерены. Нет инвесторов — значит, никто не может заставить сделать выход. Мы создали это для собственного использования. Это самая прочная причина держать что-то живым." },
    { q: "Сколько это реально стоит?", a: "Moodra бесплатна. Если хочешь AI-функции, можно использовать встроенный бесплатный AI (без ключа API) или подключить собственный ключ OpenAI для более мощных моделей. Мы не берём процент. Не делаем апсейл. Возможно, когда-нибудь появится премиум — но только если это будет того стоить." },
  ],
  ua: [
    { q: "Чому не використовувати Notion, Word або Scrivener?", a: "Ці інструменти не були побудовані навколо того, як насправді відбувається серйозне письмо — зокрема, як AI вписується в цей процес. Moodra — не універсальний інструмент. У неї є позиція: блочне редагування, AI з обізнаністю про книгу, вбудований трекінг звичок і жодних зайвих функцій. Якщо ви пробували інші й вони відчуваються не так — саме для цього ми існуємо." },
    { q: "Хто такий Jastiffel?", a: "Дизайнер і письменник між Англією та Україною. Він побудував Moodra, бо був розчарований усіма існуючими інструментами. Він користується нею щодня — це означає, що кожна помилка, яку він ігнорує, — це помилка, з якою він сам живе." },
    { q: "А AI — хіба він просто не пише замість тебе?", a: "Лише якщо ти дозволяєш. AI у Moodra знає твою книгу, а не лише останній абзац. Ти можеш попросити його продовжити, покращити, розширити або перефразувати — але нічого не вставляється без твоєї перевірки. Автор — завжди ти. AI — інструмент." },
    { q: "Чи буде Moodra колись продано або закрито?", a: "Ні того, ні іншого ми не плануємо. Немає інвесторів — значить, ніхто не може змусити зробити вихід. Ми створили це для власного використання. Це найміцніша причина тримати щось живим." },
    { q: "Скільки це реально коштує?", a: "Moodra безплатна. Якщо хочеш AI-функції, можна використовувати вбудований безплатний AI (без ключа API) або підключити власний ключ OpenAI для потужніших моделей. Ми не беремо відсоток. Не робимо апсейл. Можливо, колись з'явиться преміум — але лише якщо це буде того варте." },
  ],
  de: [
    { q: "Warum nicht Notion, Word oder Scrivener verwenden?", a: "Diese Tools wurden nicht darum herum gebaut, wie ernsthaftes Schreiben wirklich passiert — insbesondere, wie KI in diesen Prozess passt. Moodra ist kein Allzweckwerkzeug. Es hat eine klare Haltung: Block-basiertes Editieren, buchbewusste KI, eingebautes Gewohnheits-Tracking, keine Füll-Features. Wenn du die anderen ausprobiert hast und sie sich falsch anfühlen — deshalb existieren wir." },
    { q: "Wer ist Jastiffel?", a: "Ein Designer und Schriftsteller zwischen England und der Ukraine. Er baute Moodra, weil er von jedem existierenden Tool frustriert war. Er nutzt es täglich — was bedeutet, dass jeder Fehler, den er ignoriert, ein Fehler ist, mit dem er selbst lebt." },
    { q: "Schreibt KI nicht einfach für einen?", a: "Nur wenn man es zulässt. Die KI in Moodra kennt dein Buch, nicht nur den letzten Absatz. Du kannst sie bitten, fortzusetzen, zu verbessern, zu erweitern oder umzuformulieren — aber nichts wird ohne deine Überprüfung eingefügt. Der Autor bist immer du. KI ist das Werkzeug." },
    { q: "Wird Moodra jemals verkauft oder abgeschaltet?", a: "Beides planen wir nicht. Keine Investoren bedeutet, dass niemand einen Exit erzwingen kann. Wir haben das für den eigenen Gebrauch gebaut. Das ist der dauerhafteste Grund, etwas am Leben zu erhalten." },
    { q: "Was kostet es wirklich?", a: "Moodra ist kostenlos. Für KI-Funktionen kannst du unsere eingebaute freie KI nutzen (kein API-Schlüssel nötig) oder einen eigenen OpenAI-Schlüssel für leistungsstärkere Modelle verbinden. Wir nehmen keine Provision. Kein Upselling. Vielleicht gibt es irgendwann eine Premium-Stufe — aber nur wenn sie es wert ist." },
  ],
};

const CONTENT = {
  en: {
    back: "Back",
    badge: "Our story",
    heroTitle: "Built because\nnothing else worked.",
    heroLead: "Every writing tool we tried assumed the wrong things about how thinking actually happens. So we stopped using them and started building.",
    timelineTitle: "How we got here",
    principlesTitle: "What we believe",
    notIsTitle: "What Moodra is — and isn't",
    notLabel: "We are NOT",
    isLabel: "We ARE",
    statsLabel: "In numbers",
    faqTitle: "Honest answers",
    contactTitle: "Say hello",
    contactDesc: "Ideas, feedback, or just a hello — Jastiffel reads everything.",
    quote: '"The book inside you deserves a real tool."',
    manifestoTitle: "What we believe",
    manifesto: [
      "Writing is not a clean, linear act. It is chaotic, recursive, and deeply personal. Any tool that pretends otherwise — with templates, wizards, and AI-generated outlines — is solving the wrong problem.",
      "The real problem is activation energy. Most writers know what they want to say. They don't lack ideas. They lack the environment that makes it feel possible to start — and keep going. That's what Moodra is for.",
      "AI belongs in the writing process. Not as a ghostwriter, not as a replacement, but as a genuinely useful co-author who knows your book, your tone, and your intent. One that gets out of the way when you're in flow and steps in when you're stuck.",
      "Independence is not a feature. It's a condition. The moment we take venture money or chase growth metrics, the product stops being for you and starts being for someone else. We don't want that. We have never wanted that.",
      "The book you're writing matters — even if you're not sure it will. Especially then.",
    ],
  },
  ru: {
    back: "Назад",
    badge: "Наша история",
    heroTitle: "Построен потому, что\nничто другое не работало.",
    heroLead: "Каждый инструмент для письма, который мы пробовали, делал неверные предположения о том, как в действительности происходит мышление. Поэтому мы перестали ими пользоваться и начали строить.",
    timelineTitle: "Как мы сюда пришли",
    principlesTitle: "Во что мы верим",
    notIsTitle: "Что Moodra есть — и чем не является",
    notLabel: "Мы НЕ",
    isLabel: "Мы —",
    statsLabel: "В цифрах",
    faqTitle: "Честные ответы",
    contactTitle: "Написать нам",
    contactDesc: "Идеи, отзывы или просто привет — Jastiffel читает всё.",
    quote: '"Книга внутри тебя заслуживает настоящего инструмента."',
    manifestoTitle: "Во что мы верим",
    manifesto: [
      "Письмо — это не чистый, линейный процесс. Это хаотично, рекурсивно и глубоко личностно. Любой инструмент, который делает вид, что это не так — с шаблонами, мастерами настройки и AI-сгенерированными планами — решает не ту проблему.",
      "Настоящая проблема — это активационная энергия. Большинство авторов знают, что хотят сказать. Им не хватает не идей. Им не хватает среды, которая делает возможным начать — и продолжить. Для этого и существует Moodra.",
      "AI принадлежит к процессу письма. Не как призрачный автор, не как замена, а как по-настоящему полезный соавтор, который знает твою книгу, твой тон и твои намерения. Тот, кто уступает дорогу, когда ты в потоке, и вступает, когда ты застрял.",
      "Независимость — это не функция. Это условие. В момент, когда мы берём венчурные деньги или гонимся за метриками роста, продукт перестаёт быть для тебя и начинает быть для кого-то другого. Мы этого не хотим. Мы никогда этого не хотели.",
      "Книга, которую ты пишешь, важна — даже если ты не уверен в этом. Особенно тогда.",
    ],
  },
  ua: {
    back: "Назад",
    badge: "Наша історія",
    heroTitle: "Побудований тому, що\nніщо інше не працювало.",
    heroLead: "Кожен інструмент для письма, який ми пробували, робив хибні припущення про те, як насправді відбувається мислення. Тому ми перестали ними користуватися і почали будувати.",
    timelineTitle: "Як ми сюди прийшли",
    principlesTitle: "У що ми віримо",
    notIsTitle: "Що Moodra є — і чим не є",
    notLabel: "Ми НЕ",
    isLabel: "Ми —",
    statsLabel: "У цифрах",
    faqTitle: "Чесні відповіді",
    contactTitle: "Написати нам",
    contactDesc: "Ідеї, відгуки або просто привіт — Jastiffel читає все.",
    quote: '"Книга всередині тебе заслуговує справжнього інструменту."',
    manifestoTitle: "У що ми віримо",
    manifesto: [
      "Письмо — це не чистий, лінійний процес. Це хаотично, рекурсивно і глибоко особисто. Будь-який інструмент, що вдає, ніби це не так — з шаблонами, майстрами налаштування і AI-згенерованими планами — вирішує не ту проблему.",
      "Справжня проблема — це активаційна енергія. Більшість авторів знають, що хочуть сказати. Їм бракує не ідей. Їм бракує середовища, яке робить можливим почати — і продовжити. Для цього й існує Moodra.",
      "AI належить до процесу письма. Не як примарний автор, не як замінник, а як справді корисний співавтор, який знає твою книгу, твій тон і твої наміри. Той, хто поступається дорогою, коли ти у потоці, і вступає, коли ти застряг.",
      "Незалежність — це не функція. Це умова. У момент, коли ми беремо венчурні гроші або женемося за метриками зростання, продукт перестає бути для тебе і починає бути для когось іншого. Ми цього не хочемо. Ми ніколи цього не хотіли.",
      "Книга, яку ти пишеш, важлива — навіть якщо ти не впевнений у цьому. Особливо тоді.",
    ],
  },
  de: {
    back: "Zurück",
    badge: "Unsere Geschichte",
    heroTitle: "Gebaut, weil nichts\nanderes funktionierte.",
    heroLead: "Jedes Schreibwerkzeug, das wir ausprobierten, traf die falschen Annahmen darüber, wie Denken wirklich passiert. Also hörten wir auf, sie zu benutzen, und fingen an, selbst zu bauen.",
    timelineTitle: "Wie wir hierher gekommen sind",
    principlesTitle: "Was wir glauben",
    notIsTitle: "Was Moodra ist — und was nicht",
    notLabel: "Wir sind NICHT",
    isLabel: "Wir SIND",
    statsLabel: "In Zahlen",
    faqTitle: "Ehrliche Antworten",
    contactTitle: "Schreib uns",
    contactDesc: "Ideen, Feedback oder einfach Hallo — Jastiffel liest alles.",
    quote: '"Das Buch in dir verdient ein echtes Werkzeug."',
    manifestoTitle: "Was wir glauben",
    manifesto: [
      "Schreiben ist kein sauberer, linearer Prozess. Es ist chaotisch, rekursiv und zutiefst persönlich. Jedes Werkzeug, das so tut, als wäre es anders — mit Vorlagen, Assistenten und KI-generierten Gliederungen — löst das falsche Problem.",
      "Das eigentliche Problem ist die Aktivierungsenergie. Die meisten Autoren wissen, was sie sagen wollen. Es fehlen ihnen keine Ideen. Es fehlt ihnen die Umgebung, in der es sich möglich anfühlt, anzufangen — und weiterzumachen. Dafür ist Moodra da.",
      "KI gehört in den Schreibprozess. Nicht als Ghostwriter, nicht als Ersatz, sondern als wirklich nützlicher Mitautor, der dein Buch, deinen Ton und deine Absichten kennt. Einer, der Platz macht, wenn du im Fluss bist, und einspringt, wenn du feststeckst.",
      "Unabhängigkeit ist kein Merkmal. Es ist eine Bedingung. In dem Moment, in dem wir Risikokapital nehmen oder Wachstumsmetriken nachjagen, hört das Produkt auf, für dich zu sein, und fängt an, für jemand anderen zu sein. Das wollen wir nicht. Das haben wir nie gewollt.",
      "Das Buch, das du schreibst, zählt — auch wenn du dir nicht sicher bist. Besonders dann.",
    ],
  },
};

function AccordionItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="rounded-2xl overflow-hidden transition-all"
      style={{
        border: open ? `1.5px solid rgba(249,109,28,0.30)` : "1.5px solid rgba(0,0,0,0.07)",
        background: open ? "rgba(249,109,28,0.025)" : "#fff",
      }}
    >
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left"
        onClick={() => setOpen(!open)}
      >
        <span className="text-sm font-semibold pr-4" style={{ color: "#2d1a0e" }}>{q}</span>
        <ChevronDown
          className="w-4 h-4 flex-shrink-0 transition-transform"
          style={{ color: ACCENT, transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>
      {open && (
        <div className="px-5 pb-5">
          <p className="text-sm leading-relaxed" style={{ color: "#6b5a50" }}>{a}</p>
        </div>
      )}
    </div>
  );
}

export default function MissionPage() {
  const [, setLocation] = useLocation();
  const { lang } = useLang();
  const c = CONTENT[lang as keyof typeof CONTENT] ?? CONTENT.en;
  const principles = PRINCIPLES[lang as keyof typeof PRINCIPLES] ?? PRINCIPLES.en;
  const notItems = NOT_LIST[lang as keyof typeof NOT_LIST] ?? NOT_LIST.en;
  const isItems = IS_LIST[lang as keyof typeof IS_LIST] ?? IS_LIST.en;
  const stats = STATS[lang as keyof typeof STATS] ?? STATS.en;
  const faqs = FAQS[lang as keyof typeof FAQS] ?? FAQS.en;

  return (
    <div className="min-h-screen" style={{ background: "hsl(30, 58%, 97%)", fontFamily: "var(--font-sans)" }}>
      <div className="max-w-2xl mx-auto px-6 py-10">

        {/* Nav */}
        <div className="flex items-center mb-12">
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-2 text-sm font-medium transition-opacity hover:opacity-70"
            style={{ color: "#8a7a70" }}
          >
            <ArrowLeft className="w-4 h-4" />
            {c.back}
          </button>
          <div className="flex-1" />
          <LanguagePicker />
        </div>

        {/* Hero */}
        <div className="mb-12">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-6 uppercase tracking-widest"
            style={{ background: "rgba(249,109,28,0.10)", color: ACCENT, letterSpacing: "0.14em" }}
          >
            <Flame className="w-3 h-3" />
            {c.badge}
          </div>
          <h1
            className="font-bold leading-tight mb-5 whitespace-pre-line"
            style={{ color: "#2d1a0e", fontFamily: "'Georgia', serif", fontSize: "2.6rem", lineHeight: 1.15, letterSpacing: "-0.01em" }}
          >
            {c.heroTitle}
          </h1>
          <p
            className="text-lg leading-relaxed max-w-lg"
            style={{ color: "#6b5a50", fontFamily: "'Georgia', serif", fontStyle: "italic" }}
          >
            {c.heroLead}
          </p>
        </div>

        {/* Stats strip */}
        <div
          className="grid grid-cols-4 gap-0 rounded-2xl overflow-hidden mb-12"
          style={{ border: "1.5px solid rgba(249,109,28,0.14)" }}
        >
          {stats.map((s, i) => (
            <div
              key={i}
              className="flex flex-col items-center justify-center py-5 px-3"
              style={{
                borderRight: i < stats.length - 1 ? "1px solid rgba(249,109,28,0.12)" : "none",
                background: i % 2 === 0 ? "rgba(249,109,28,0.03)" : "#fff",
              }}
            >
              <span
                className="font-bold text-xl mb-1"
                style={{ color: ACCENT, fontFamily: "'Georgia', serif" }}
              >
                {s.value}
              </span>
              <span className="text-[11px] text-center" style={{ color: "#9a8a80" }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Manifesto */}
        <div className="mb-14">
          <p
            className="text-xs font-bold uppercase tracking-widest mb-8"
            style={{ color: ACCENT, letterSpacing: "0.16em" }}
          >
            {c.manifestoTitle}
          </p>
          <div className="space-y-0">
            {c.manifesto.map((line, i) => (
              <div
                key={i}
                className="flex gap-5 py-6"
                style={{
                  borderBottom: i < c.manifesto.length - 1 ? "1px solid rgba(0,0,0,0.06)" : "none",
                }}
              >
                <span
                  className="text-2xl font-bold flex-shrink-0 leading-none"
                  style={{ color: "rgba(249,109,28,0.18)", fontFamily: "'Georgia', serif", marginTop: 2 }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p
                  className="text-base leading-relaxed"
                  style={{ color: "#3d2a1e", lineHeight: 1.85, fontFamily: "'Georgia', serif" }}
                >
                  {line}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Principles grid */}
        <div className="mb-14">
          <p
            className="text-xs font-bold uppercase tracking-widest mb-6"
            style={{ color: ACCENT, letterSpacing: "0.16em" }}
          >
            {c.principlesTitle}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {principles.map((p, i) => {
              const Icon = p.icon;
              return (
                <div
                  key={i}
                  className="rounded-2xl p-5 transition-all hover:shadow-sm"
                  style={{
                    background: "#fff",
                    border: "1px solid rgba(0,0,0,0.06)",
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                    style={{ background: `${p.color}14` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: p.color }} strokeWidth={1.8} />
                  </div>
                  <div className="text-sm font-bold mb-1.5" style={{ color: "#2d1a0e" }}>{p.title}</div>
                  <div className="text-xs leading-relaxed" style={{ color: "#8a7a70", lineHeight: 1.65 }}>{p.body}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Not / Is comparison */}
        <div className="mb-14">
          <p
            className="text-xs font-bold uppercase tracking-widest mb-6"
            style={{ color: ACCENT, letterSpacing: "0.16em" }}
          >
            {c.notIsTitle}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {/* NOT */}
            <div
              className="rounded-2xl p-5"
              style={{ background: "rgba(239,68,68,0.03)", border: "1.5px solid rgba(239,68,68,0.12)" }}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "rgba(239,68,68,0.10)" }}>
                  <span style={{ color: "#ef4444", fontSize: "11px", fontWeight: 700 }}>✕</span>
                </div>
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#ef4444" }}>{c.notLabel}</span>
              </div>
              <div className="space-y-2">
                {notItems.map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-xs mt-0.5" style={{ color: "rgba(239,68,68,0.40)" }}>—</span>
                    <span
                      className="text-xs leading-relaxed"
                      style={{
                        color: "#a07070",
                        textDecoration: "line-through",
                        textDecorationColor: "rgba(239,68,68,0.35)",
                      }}
                    >
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* IS */}
            <div
              className="rounded-2xl p-5"
              style={{ background: "rgba(16,185,129,0.03)", border: "1.5px solid rgba(16,185,129,0.14)" }}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "rgba(16,185,129,0.10)" }}>
                  <span style={{ color: "#10b981", fontSize: "11px", fontWeight: 700 }}>✓</span>
                </div>
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#10b981" }}>{c.isLabel}</span>
              </div>
              <div className="space-y-2">
                {isItems.map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-xs mt-0.5 flex-shrink-0" style={{ color: "#10b981" }}>✓</span>
                    <span className="text-xs leading-relaxed" style={{ color: "#4a7a6a" }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* FAQ accordion */}
        <div className="mb-14">
          <p
            className="text-xs font-bold uppercase tracking-widest mb-6"
            style={{ color: ACCENT, letterSpacing: "0.16em" }}
          >
            {c.faqTitle}
          </p>
          <div className="space-y-2.5">
            {faqs.map((item, i) => (
              <AccordionItem key={i} q={item.q} a={item.a} />
            ))}
          </div>
        </div>

        {/* Quote block */}
        <div
          className="mb-14 rounded-2xl p-8 text-center"
          style={{
            background: "linear-gradient(150deg, #fff9f4 0%, #ffeedd 60%, #fdd6aa 100%)",
            border: "1.5px solid rgba(249,109,28,0.15)",
          }}
        >
          <BookOpen className="w-7 h-7 mx-auto mb-4" style={{ color: "rgba(249,109,28,0.40)" }} strokeWidth={1.4} />
          <p
            className="text-xl leading-relaxed"
            style={{
              fontFamily: "'Georgia', serif",
              fontStyle: "italic",
              color: "#5a3a20",
              letterSpacing: "0.01em",
              lineHeight: 1.6,
            }}
          >
            {c.quote}
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="h-px w-8" style={{ background: "rgba(249,109,28,0.30)" }} />
            <span className="text-xs" style={{ color: "#c0a080", fontStyle: "italic" }}>Jastiffel</span>
            <div className="h-px w-8" style={{ background: "rgba(249,109,28,0.30)" }} />
          </div>
        </div>

        {/* Contact */}
        <div
          className="rounded-2xl p-7"
          style={{
            background: "linear-gradient(135deg, #fff8f3 0%, #fff3ec 100%)",
            border: "1.5px solid rgba(249,109,28,0.15)",
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(249,109,28,0.10)" }}
            >
              <Users className="w-5 h-5" style={{ color: ACCENT }} strokeWidth={1.7} />
            </div>
            <div>
              <p className="text-base font-bold" style={{ color: "#2d1a0e" }}>{c.contactTitle}</p>
              <p className="text-xs" style={{ color: "#9a8a80" }}>{c.contactDesc}</p>
            </div>
          </div>

          <a
            href="mailto:prod.pantagonica@gmail.com"
            className="inline-flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-85"
            style={{
              background: "linear-gradient(135deg, #F96D1C 0%, #FF9640 100%)",
              color: "#fff",
            }}
          >
            <Mail className="w-4 h-4" />
            prod.pantagonica@gmail.com
          </a>
        </div>

      </div>
      <SiteFooter />
    </div>
  );
}
