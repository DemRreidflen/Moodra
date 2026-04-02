import { useLocation } from "wouter";
import { ArrowLeft, Feather, Brain, Eye, BookOpen, Sparkles, Shield, Heart, Zap, Compass, Clock, Star, MessageSquare, Flame, Lightbulb, Trophy } from "lucide-react";
import { useLang } from "@/contexts/language-context";
import { LanguagePicker } from "@/components/language-picker";
import { SiteFooter } from "@/components/site-footer";

const PRINCIPLE_ICONS = [Feather, Brain, Eye, BookOpen, Sparkles, Shield, Heart, Zap, Compass, Clock, Star, MessageSquare];

const CONTENT = {
  en: {
    badge: "Moodra Codex",
    heroTitle1: "You are the author.",
    heroTitle2: "AI is the instrument.",
    heroDesc: "Moodra is built on a conviction: artificial intelligence is a powerful tool, not a replacement for the human mind. This Codex is the foundation of how we think about writing, creativity, and the role of technology in the life of a serious author.",
    manifestoLabel: "Manifesto",
    manifesto: [
      "Every great book begins with a thought no machine has ever had. The story inside you — the one shaped by your life, your losses, your obsessions — cannot be generated. It can only be lived, and then written. Moodra exists to help you write it.",
      "The author is not someone who has things to say. The author is someone who cannot stop thinking about something, and who has finally decided that writing is the only honest way to work through it. That decision is yours. The words that follow are yours. The meaning they carry is yours.",
      "We did not build Moodra to automate writing. We built it to remove the friction between the thought and the page — to give the writer's mind more space to do what only the writer's mind can do.",
    ],
    principlesTitle: "The Twelve Principles",
    principles: [
      { num: "01", title: "You are the author", body: "AI steadies your quill when you tremble — but your mind, vision, and voice direct every word." },
      { num: "02", title: "Idea before generation", body: "Think first, prompt second. Intention is the difference between a book and a document." },
      { num: "03", title: "AI is a mirror, not a muse", body: "It can finish a sentence, expand a paragraph — but it cannot invent your story. Only you can." },
      { num: "04", title: "Own every word", body: "Read it, rewrite it, stand behind it. AI text only becomes yours when you engage with it fully." },
      { num: "05", title: "The platform serves the writer", body: "Editor, AI, idea board — infrastructure for your process. The platform is the stage; you are the show." },
      { num: "06", title: "Originality is the point", body: "Use AI to write faster and break through blocks — never to avoid having something real to say." },
      { num: "07", title: "Structure is not a cage", body: "Outlines and chapter titles aren't constraints — they're the scaffolding that makes creativity possible." },
      { num: "08", title: "Writing is thinking", body: "The draft is how thoughts happen, not a record of finished ones. Write to discover what you believe." },
      { num: "09", title: "The reader is your partner", body: "Every decision — opening line, structure, examples — is a message to a specific human. That change in them is your responsibility." },
      { num: "10", title: "Consistency over intensity", body: "The writer who shows up every day, even badly, will finish. The one waiting for the perfect session will not." },
      { num: "11", title: "Revision is the craft", body: "First draft is permission to exist. Second draft is where the book begins. Rewriting is not failure — it's craft." },
      { num: "12", title: "Finish the book", body: "The finished book — even flawed — meets a reader. The unfinished one is only a possibility. Finish it.",
      },
    ],
    onAiTitle: "On AI and the act of writing",
    onAi: [
      "The best use of AI in writing is not to generate text. It is to remove the obstacles between you and text. Writer's block is not a failure of imagination — it is usually a failure of activation energy. The AI panel in Moodra exists to help you start, to give you something to push against, to turn the blank page into a draft.",
      "When you ask Moodra's AI to continue a paragraph, you are not outsourcing the writing. You are creating a draft to react to. The human mind responds to existing text differently than it responds to nothing. Revision is easier than creation. Give yourself something to revise.",
      "AI is not creative. It is statistical. It produces plausible text — text that matches the patterns of what has been written before. Your job, as the author, is to exceed plausibility. To write the sentence that no statistical model would produce, because no statistical model has had your particular life. That is the work. That is also the point.",
    ],
    howTitle: "How to work with Moodra",
    howSteps: [
      { num: "1", title: "Start with structure, not text", body: "Before you write a word, build the skeleton of your book. Create chapters. Name them, even provisionally. Give the AI a context to work within. Structure before prose." },
      { num: "2", title: "Write the first sentence yourself", body: "Always. The first sentence of any chapter, any section, any paragraph that matters — write it yourself. It sets the voice, the direction, the contract with the reader. Let the AI continue; never let it begin." },
      { num: "3", title: "Use AI for momentum, not meaning", body: "When you are stuck, use AI to generate forward motion. But the meaning — the argument, the emotion, the point — that is yours to supply. AI generates continuation. You generate significance." },
      { num: "4", title: "Read everything it produces", body: "Treat AI output the way you treat a draft from a junior editor: read every word, take what is useful, rewrite what isn't, and cut what doesn't belong. The AI is not an authority on your book. You are." },
      { num: "5", title: "Revise without the AI", body: "The second draft should be yours alone. Take what the AI helped you produce and revise it as a writer, not as a prompter. This is where the book becomes yours — in the revision, the cutting, the shaping." },
    ],
    closingTitle: "A note on why this matters",
    closing: "We built Moodra because we believe that the act of writing — the real, human, imperfect, extraordinary act — is one of the most important things a person can do. AI changes the tools available to writers, but it does not change what writing is for. It is for truth. It is for connection. It is for the book only you can write.",
    ctaTitle: "Ready to write your book?",
    ctaDesc: "Everything in Moodra is designed around one idea: that your book deserves to exist.",
    ctaBtn: "Start writing",
    backLabel: "Back",
    sectionOnAiBadge: "Philosophy",
    sectionHowBadge: "Method",
  },
  ru: {
    badge: "Кодекс Moodra",
    heroTitle1: "Ты — автор.",
    heroTitle2: "ИИ — инструмент.",
    heroDesc: "Moodra основана на убеждении: искусственный интеллект — это мощный инструмент, а не замена человеческому уму. Этот Кодекс — фундамент того, как мы думаем о письме, творчестве и роли технологий в жизни серьёзного автора.",
    manifestoLabel: "Манифест",
    manifesto: [
      "Каждая великая книга начинается с мысли, которую ни одна машина никогда не имела. История внутри тебя — та, что сформирована твоей жизнью, потерями, одержимостями — не может быть сгенерирована. Её можно только прожить, а потом написать. Moodra существует, чтобы помочь тебе это сделать.",
      "Автор — это не тот, кому есть что сказать. Автор — это тот, кто не может перестать думать о чём-то, и кто наконец решил, что письмо — единственный честный способ разобраться с этим. Это решение твоё. Слова, которые следуют — твои. Смысл, который они несут — твой.",
      "Мы создали Moodra не для автоматизации письма. Мы создали её, чтобы убрать трение между мыслью и страницей — дать уму писателя больше пространства для того, что только ум писателя может делать.",
    ],
    principlesTitle: "Двенадцать принципов",
    principles: [
      { num: "01", title: "Ты — автор", body: "ИИ держит перо, когда твоя рука дрожит — но твой ум, голос и видение направляют каждое слово." },
      { num: "02", title: "Сначала мысль, потом генерация", body: "Сначала думай, потом пиши. Намерение — разница между книгой и документом." },
      { num: "03", title: "ИИ — зеркало, а не муза", body: "Он закончит предложение, расширит абзац — но придумать твою историю может только ты." },
      { num: "04", title: "Каждое слово — твоё", body: "Читай, переписывай, отвечай за каждое слово. Текст ИИ становится твоим только через работу с ним." },
      { num: "05", title: "Платформа служит писателю", body: "Редактор, ИИ, доска идей — инфраструктура твоего процесса. Платформа — сцена; автор — спектакль." },
      { num: "06", title: "Оригинальность — это суть", body: "Используй ИИ для скорости и преодоления блоков — никогда для замены настоящего, что сказать." },
      { num: "07", title: "Структура — не клетка", body: "Планы и заголовки — не ограничения, а леса, которые делают творчество возможным." },
      { num: "08", title: "Письмо — это мышление", body: "Черновик — процесс рождения мыслей, а не их запись. Пиши, чтобы открыть, во что ты веришь." },
      { num: "09", title: "Читатель — твой партнёр", body: "Каждое решение в книге — послание конкретному человеку. Изменение, которое в нём произойдёт — твоя ответственность." },
      { num: "10", title: "Постоянство важнее интенсивности", body: "Писатель, работающий каждый день, даже плохо, — закончит. Ждущий идеальной сессии — нет." },
      { num: "11", title: "Редактура — это ремесло", body: "Первый черновик — разрешение существовать. Второй — где книга начинается. Редактура — ремесло, не талант." },
      { num: "12", title: "Закончи книгу", body: "Законченная книга — даже несовершенная — встречает читателя. Незаконченная — только возможность. Закончи её." },
    ],
    onAiTitle: "О ИИ и акте письма",
    onAi: [
      "Лучшее применение ИИ в письме — не генерировать текст. А убирать препятствия между тобой и текстом. Творческий блок — не сбой воображения. Это, как правило, нехватка активационной энергии. Панель ИИ в Moodra существует, чтобы помочь тебе начать, дать что-то, против чего можно оттолкнуться, превратить чистую страницу в черновик.",
      "Когда ты просишь ИИ Moodra продолжить абзац, ты не передаёшь письмо на аутсорс. Ты создаёшь черновик, чтобы на него реагировать. Человеческий ум реагирует на готовый текст иначе, чем на пустоту. Редактировать проще, чем создавать. Дай себе что-то для редактуры.",
      "ИИ не творческий. Он статистический. Он производит правдоподобный текст — текст, соответствующий паттернам написанного ранее. Твоя задача как автора — превзойти правдоподобие. Написать предложение, которое ни одна статистическая модель не произведёт, потому что у неё нет твоей конкретной жизни. В этом и есть работа. И в этом весь смысл.",
    ],
    howTitle: "Как работать с Moodra",
    howSteps: [
      { num: "1", title: "Начни со структуры, а не с текста", body: "До того как написать слово, выстрой скелет книги. Создай главы. Назови их, пусть и предварительно. Дай ИИ контекст для работы. Структура прежде прозы." },
      { num: "2", title: "Первое предложение — всегда твоё", body: "Всегда. Первое предложение любой главы, любого раздела — пиши сам. Оно задаёт голос, направление, договор с читателем. Пусть ИИ продолжает; но начинает всегда автор." },
      { num: "3", title: "Используй ИИ для импульса, не для смысла", body: "Когда ты застрял, используй ИИ для движения вперёд. Но смысл — аргумент, эмоция, суть — это поставляешь ты. ИИ генерирует продолжение. Ты генерируешь значимость." },
      { num: "4", title: "Читай всё, что он производит", body: "Относись к выводам ИИ как к черновику от младшего редактора: читай каждое слово, бери полезное, переписывай неподходящее, убирай лишнее. ИИ — не авторитет в твоей книге. Авторитет — ты." },
      { num: "5", title: "Редактируй без ИИ", body: "Второй черновик должен быть только твоим. Возьми то, что помог создать ИИ, и отредактируй как писатель, а не как промпт-инженер. Здесь книга становится твоей — в редактуре, сокращении, формировании." },
    ],
    closingTitle: "Почему это важно",
    closing: "Мы создали Moodra, потому что верим: акт письма — настоящий, человеческий, несовершенный, экстраординарный акт — одно из самых важных вещей, которые может делать человек. ИИ меняет инструменты, доступные писателям, но не меняет то, для чего письмо существует. Оно — для правды. Для связи. Для книги, которую можешь написать только ты.",
    ctaTitle: "Готов писать свою книгу?",
    ctaDesc: "Всё в Moodra построено вокруг одной идеи: твоя книга заслуживает существовать.",
    ctaBtn: "Начать писать",
    backLabel: "Назад",
    sectionOnAiBadge: "Философия",
    sectionHowBadge: "Метод",
  },
  ua: {
    badge: "Кодекс Moodra",
    heroTitle1: "Ти — автор.",
    heroTitle2: "ШІ — інструмент.",
    heroDesc: "Moodra заснована на переконанні: штучний інтелект — це потужний інструмент, а не заміна людському розуму. Цей Кодекс — фундамент того, як ми думаємо про письмо, творчість і роль технологій у житті серйозного автора.",
    manifestoLabel: "Маніфест",
    manifesto: [
      "Кожна велика книга починається з думки, якої жодна машина ніколи не мала. Історія всередині тебе — та, що сформована твоїм життям, втратами, одержимостями — не може бути згенерована. Її можна лише прожити, а потім написати. Moodra існує, щоб допомогти тобі це зробити.",
      "Автор — це не той, кому є що сказати. Автор — це той, хто не може перестати думати про щось, і хто нарешті вирішив, що письмо — єдиний чесний спосіб розібратися з цим. Це рішення твоє. Слова, що слідують — твої. Сенс, який вони несуть — твій.",
      "Ми створили Moodra не для автоматизації письма. Ми створили її, щоб прибрати тертя між думкою і сторінкою — дати розуму письменника більше простору для того, що тільки розум письменника може робити.",
    ],
    principlesTitle: "Дванадцять принципів",
    principles: [
      { num: "01", title: "Ти — автор", body: "ШІ тримає перо, коли твоя рука тремтить — але твій розум і голос скеровують кожне слово." },
      { num: "02", title: "Спочатку думка, потім генерація", body: "Спочатку думай, потім пиши. Намір — різниця між книгою і документом." },
      { num: "03", title: "ШІ — дзеркало, а не муза", body: "Він закінчить речення, розширить абзац — але вигадати твою історію може лише ти." },
      { num: "04", title: "Кожне слово — твоє", body: "Читай, переписуй, відповідай за кожне слово. Текст ШІ стає твоїм лише через роботу з ним." },
      { num: "05", title: "Платформа служить письменнику", body: "Редактор, ШІ, дошка ідей — інфраструктура твого процесу. Платформа — сцена; автор — вистава." },
      { num: "06", title: "Оригінальність — це суть", body: "Використовуй ШІ для швидкості і подолання блоків — ніколи для заміни справжнього, що сказати." },
      { num: "07", title: "Структура — не клітка", body: "Плани і заголовки — не обмеження, а риштування, що робить творчість можливою." },
      { num: "08", title: "Письмо — це мислення", body: "Чернетка — процес народження думок, а не їх запис. Пиши, щоб відкрити, у що ти віриш." },
      { num: "09", title: "Читач — твій партнер", body: "Кожне рішення в книзі — послання конкретній людині. Зміна, що в ній відбудеться — твоя відповідальність." },
      { num: "10", title: "Сталість важливіша за інтенсивність", body: "Письменник, що працює щодня, навіть погано, — закінчить. Хто чекає ідеальної сесії — ні." },
      { num: "11", title: "Редагування — це ремесло", body: "Перша чернетка — дозвіл існувати. Друга — де книга починається. Редагування — ремесло, не талант." },
      { num: "12", title: "Закінчи книгу", body: "Закінчена книга — навіть недосконала — зустрічає читача. Незакінчена — лише можливість. Закінчи її." },
    ],
    onAiTitle: "Про ШІ та акт письма",
    onAi: [
      "Найкраще застосування ШІ в письмі — не генерувати текст. А прибирати перешкоди між тобою і текстом. Творчий блок — не збій уяви. Це, як правило, нестача активаційної енергії. Панель ШІ в Moodra існує, щоб допомогти тобі почати, дати щось, від чого можна відштовхнутися, перетворити чисту сторінку на чернетку.",
      "Коли ти просиш ШІ Moodra продовжити абзац, ти не передаєш письмо на аутсорс. Ти створюєш чернетку, щоб на неї реагувати. Людський розум реагує на готовий текст інакше, ніж на порожнечу. Редагувати простіше, ніж створювати. Дай собі щось для редагування.",
      "ШІ не творчий. Він статистичний. Він виробляє правдоподібний текст — текст, що відповідає паттернам написаного раніше. Твоє завдання як автора — перевершити правдоподібність. Написати речення, яке жодна статистична модель не вироблятиме, тому що у неї немає твого конкретного життя. В цьому і є робота. І в цьому весь сенс.",
    ],
    howTitle: "Як працювати з Moodra",
    howSteps: [
      { num: "1", title: "Починай зі структури, а не з тексту", body: "До того як написати слово, побудуй скелет книги. Створи розділи. Назви їх, хоча б попередньо. Дай ШІ контекст для роботи. Структура перед прозою." },
      { num: "2", title: "Перше речення — завжди твоє", body: "Завжди. Перше речення будь-якого розділу — пиши сам. Воно задає голос, напрямок, договір з читачем. Нехай ШІ продовжує; але починає завжди автор." },
      { num: "3", title: "Використовуй ШІ для імпульсу, не для сенсу", body: "Коли ти застряг, використовуй ШІ для руху вперед. Але сенс — аргумент, емоція, суть — це постачаєш ти. ШІ генерує продовження. Ти генеруєш значущість." },
      { num: "4", title: "Читай все, що він виробляє", body: "Стався до виводів ШІ як до чернетки від молодшого редактора: читай кожне слово, бери корисне, переписуй непридатне, прибирай зайве. ШІ — не авторитет у твоїй книзі. Авторитет — ти." },
      { num: "5", title: "Редагуй без ШІ", body: "Друга чернетка повинна бути тільки твоєю. Візьми те, що допоміг створити ШІ, і відредагуй як письменник, а не як промпт-інженер. Тут книга стає твоєю — у редагуванні, скороченні, формуванні." },
    ],
    closingTitle: "Чому це важливо",
    closing: "Ми створили Moodra, тому що віримо: акт письма — справжній, людський, недосконалий, надзвичайний акт — одна з найважливіших речей, які може робити людина. ШІ змінює інструменти, доступні письменникам, але не змінює те, для чого письмо існує. Воно — для правди. Для зв'язку. Для книги, яку можеш написати тільки ти.",
    ctaTitle: "Готовий писати свою книгу?",
    ctaDesc: "Все в Moodra побудовано навколо однієї ідеї: твоя книга заслуговує існувати.",
    ctaBtn: "Почати писати",
    backLabel: "Назад",
    sectionOnAiBadge: "Філософія",
    sectionHowBadge: "Метод",
  },
  de: {
    badge: "Moodra Kodex",
    heroTitle1: "Du bist der Autor.",
    heroTitle2: "KI ist das Werkzeug.",
    heroDesc: "Moodra basiert auf einer Überzeugung: Künstliche Intelligenz ist ein mächtiges Werkzeug, kein Ersatz für den menschlichen Geist. Dieser Kodex ist das Fundament unseres Denkens über Schreiben, Kreativität und die Rolle der Technologie im Leben eines ernsthaften Autors.",
    manifestoLabel: "Manifest",
    manifesto: [
      "Jedes großartige Buch beginnt mit einem Gedanken, den keine Maschine je hatte. Die Geschichte in dir — die durch dein Leben, deine Verluste, deine Obsessionen geformt wurde — kann nicht generiert werden. Sie kann nur gelebt und dann geschrieben werden. Moodra existiert, um dir dabei zu helfen.",
      "Der Autor ist nicht jemand, der etwas zu sagen hat. Der Autor ist jemand, der nicht aufhören kann, über etwas nachzudenken, und der schließlich entschieden hat, dass Schreiben der einzige ehrliche Weg ist, damit umzugehen. Diese Entscheidung ist deine. Die Worte, die folgen, sind deine. Die Bedeutung, die sie tragen, ist deine.",
      "Wir haben Moodra nicht gebaut, um das Schreiben zu automatisieren. Wir haben es gebaut, um die Reibung zwischen dem Gedanken und der Seite zu beseitigen — dem Geist des Schriftstellers mehr Raum zu geben für das, was nur der Geist des Schriftstellers tun kann.",
    ],
    principlesTitle: "Die zwölf Grundsätze",
    principles: [
      { num: "01", title: "Du bist der Autor", body: "KI hält die Feder, wenn deine zittert — aber dein Geist und deine Stimme lenken jedes Wort." },
      { num: "02", title: "Idee vor Generierung", body: "Denk zuerst, dann schreibe. Absicht ist der Unterschied zwischen einem Buch und einem Dokument." },
      { num: "03", title: "KI ist ein Spiegel, keine Muse", body: "Sie vervollständigt Sätze, erweitert Absätze — aber deine Geschichte erfinden kann nur du." },
      { num: "04", title: "Jedes Wort gehört dir", body: "Lies es, schreib es um, steh dazu. KI-Text wird erst deiner, wenn du dich damit auseinandersetzt." },
      { num: "05", title: "Die Plattform dient dem Schriftsteller", body: "Editor, KI, Ideen-Board — Infrastruktur für deinen Prozess. Die Plattform ist die Bühne; du bist die Show." },
      { num: "06", title: "Originalität ist der Kern", body: "Nutze KI für Geschwindigkeit und Blockaden — nie als Ersatz für etwas Echtes zu sagen." },
      { num: "07", title: "Struktur ist kein Käfig", body: "Gliederungen und Kapitelüberschriften sind kein Hindernis — das Gerüst, das Kreativität möglich macht." },
      { num: "08", title: "Schreiben ist Denken", body: "Der Entwurf ist der Prozess des Denkens, nicht eine Aufzeichnung fertiger Gedanken. Schreib, um herauszufinden, was du glaubst." },
      { num: "09", title: "Der Leser ist dein Partner", body: "Jede Entscheidung in deinem Buch ist eine Botschaft an einen bestimmten Menschen. Die Veränderung in ihm liegt in deiner Verantwortung." },
      { num: "10", title: "Beständigkeit schlägt Intensität", body: "Wer jeden Tag schreibt, auch schlecht, wird fertig. Wer auf die perfekte Session wartet, nicht." },
      { num: "11", title: "Überarbeitung ist das Handwerk", body: "Erster Entwurf ist Erlaubnis zu existieren. Zweiter ist wo das Buch beginnt. Überarbeitung ist das Handwerk." },
      { num: "12", title: "Beende das Buch", body: "Das fertige Buch — selbst fehlerhaft — trifft einen Leser. Das unfertige ist nur eine Möglichkeit. Beende es." },
    ],
    onAiTitle: "Über KI und den Akt des Schreibens",
    onAi: [
      "Der beste Einsatz von KI beim Schreiben ist nicht das Generieren von Text. Es ist das Beseitigen der Hindernisse zwischen dir und dem Text. Eine Schreibblockade ist kein Versagen der Vorstellungskraft — es ist meistens ein Mangel an Aktivierungsenergie. Das KI-Panel in Moodra existiert, um dir beim Starten zu helfen, dir etwas zu geben, wogegen du dich stemmen kannst, die leere Seite in einen Entwurf zu verwandeln.",
      "Wenn du die KI von Moodra bittest, einen Absatz fortzusetzen, lagerst du das Schreiben nicht aus. Du erstellst einen Entwurf, auf den du reagieren kannst. Der menschliche Geist reagiert auf vorhandenen Text anders als auf nichts. Überarbeiten ist einfacher als Erschaffen. Gib dir selbst etwas zum Überarbeiten.",
      "KI ist nicht kreativ. Sie ist statistisch. Sie produziert plausiblen Text — Text, der den Mustern des bisher Geschriebenen entspricht. Deine Aufgabe als Autor ist es, die Plausibilität zu übertreffen. Den Satz zu schreiben, den kein statistisches Modell produzieren würde, weil kein statistisches Modell dein besonderes Leben hatte. Das ist die Arbeit. Das ist auch der Punkt.",
    ],
    howTitle: "Wie man mit Moodra arbeitet",
    howSteps: [
      { num: "1", title: "Mit Struktur beginnen, nicht mit Text", body: "Bevor du ein Wort schreibst, baue das Skelett deines Buches. Erstelle Kapitel. Benenne sie, auch vorläufig. Gib der KI einen Kontext zum Arbeiten. Struktur vor Prosa." },
      { num: "2", title: "Den ersten Satz immer selbst schreiben", body: "Immer. Den ersten Satz jedes Kapitels schreibst du selbst. Er legt die Stimme, die Richtung, den Vertrag mit dem Leser fest. Lass die KI fortsetzen; beginnen tut immer der Autor." },
      { num: "3", title: "KI für Schwung, nicht für Bedeutung nutzen", body: "Wenn du feststeckst, nutze KI für Vorwärtsbewegung. Aber die Bedeutung — das Argument, die Emotion, der Punkt — das lieferst du. KI generiert Fortsetzung. Du generierst Bedeutung." },
      { num: "4", title: "Alles lesen, was sie produziert", body: "Behandle KI-Ausgaben wie einen Entwurf von einem Junior-Redakteur: lies jedes Wort, nimm Nützliches, schreibe Ungeeignetes um, und streiche, was nicht hineingehört. Die KI ist keine Autorität über dein Buch. Du bist es." },
      { num: "5", title: "Ohne KI überarbeiten", body: "Der zweite Entwurf sollte allein deiner sein. Nimm, was die KI dir helfen hat zu produzieren, und überarbeite es als Schriftsteller, nicht als Prompt-Ingenieur. Hier wird das Buch deins — in der Überarbeitung, dem Kürzen, dem Formen." },
    ],
    closingTitle: "Warum das wichtig ist",
    closing: "Wir haben Moodra gebaut, weil wir glauben, dass der Akt des Schreibens — der echte, menschliche, unvollkommene, außerordentliche Akt — eine der wichtigsten Dinge ist, die ein Mensch tun kann. KI verändert die Werkzeuge, die Schriftstellern zur Verfügung stehen, aber es verändert nicht, wofür das Schreiben da ist. Es ist für die Wahrheit. Für die Verbindung. Für das Buch, das nur du schreiben kannst.",
    ctaTitle: "Bereit, dein Buch zu schreiben?",
    ctaDesc: "Alles in Moodra ist um eine Idee herum aufgebaut: Dein Buch verdient es zu existieren.",
    ctaBtn: "Anfangen zu schreiben",
    backLabel: "Zurück",
    sectionOnAiBadge: "Philosophie",
    sectionHowBadge: "Methode",
  },
};

export default function CodexPage() {
  const [, navigate] = useLocation();
  const { lang } = useLang();
  const c = CONTENT[lang as keyof typeof CONTENT] ?? CONTENT.en;

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: "linear-gradient(150deg, #fff9f4 0%, #ffeedd 55%, #fdd6aa 100%)" }}>

      {/* Decorative blobs */}
      <div className="pointer-events-none select-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full" style={{ background: "radial-gradient(circle, rgba(249,109,28,0.12) 0%, transparent 70%)" }} />
        <div className="absolute top-1/3 -left-40 w-[400px] h-[400px] rounded-full" style={{ background: "radial-gradient(circle, rgba(253,214,170,0.35) 0%, transparent 70%)" }} />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full" style={{ background: "radial-gradient(circle, rgba(249,109,28,0.07) 0%, transparent 65%)" }} />
      </div>
      {/* Grid texture */}
      <div
        className="pointer-events-none select-none fixed inset-0 z-0"
        style={{
          backgroundImage: "linear-gradient(rgba(0,0,0,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.012) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 max-w-2xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-sm transition-opacity hover:opacity-70"
            style={{ color: "#8a7a70" }}
          >
            <ArrowLeft className="w-4 h-4" />
            {c.backLabel}
          </button>
          <LanguagePicker size="sm" />
        </div>

        {/* Hero */}
        <div className="mb-14">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
            style={{ background: "rgba(249,109,28,0.14)", color: "#F96D1C", border: "1px solid rgba(249,109,28,0.20)" }}
          >
            <Heart className="w-3 h-3" />
            {c.badge}
          </div>
          <h1
            className="font-bold leading-[1.08] mb-5"
            style={{ color: "#1a0d06", fontFamily: "'Georgia', serif", fontSize: "clamp(2.4rem, 5vw, 3.4rem)", letterSpacing: "-0.02em" }}
          >
            {c.heroTitle1}<br />
            <span style={{ color: "#F96D1C" }}>{c.heroTitle2}</span>
          </h1>
          <p className="text-base leading-relaxed max-w-lg" style={{ color: "#7a5a44", fontFamily: "'Georgia', serif" }}>
            {c.heroDesc}
          </p>
        </div>

        {/* Manifesto */}
        <div
          className="rounded-3xl p-7 mb-14 relative overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.7)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(249,109,28,0.18)",
            boxShadow: "0 2px 32px rgba(249,109,28,0.06)",
          }}
        >
          <div
            className="absolute top-3 left-5 text-8xl font-serif leading-none select-none pointer-events-none"
            style={{ color: "rgba(249,109,28,0.10)", fontFamily: "'Georgia', serif" }}
          >
            "
          </div>
          <div className="relative z-10">
            <div
              className="text-[10px] font-bold tracking-[0.18em] uppercase mb-5"
              style={{ color: "#F96D1C" }}
            >
              {c.manifestoLabel}
            </div>
            <div className="space-y-4">
              {c.manifesto.map((para, i) => (
                <p
                  key={i}
                  className="leading-relaxed"
                  style={{
                    color: i === 0 ? "#2d1208" : "#4a2810",
                    fontFamily: "'Georgia', serif",
                    fontStyle: i === 0 ? "italic" : "normal",
                    fontWeight: i === 0 ? 500 : 400,
                    fontSize: i === 0 ? "1rem" : "0.875rem",
                  }}
                >
                  {para}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Principles */}
        <div className="mb-14">
          <h2 className="text-xl font-bold mb-6" style={{ color: "#1a0d06", fontFamily: "'Georgia', serif" }}>
            {c.principlesTitle}
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {c.principles.map((p, idx) => {
              const Icon = PRINCIPLE_ICONS[idx] ?? Feather;
              return (
                <div
                  key={p.num}
                  className="rounded-2xl p-4"
                  style={{
                    background: "rgba(255,255,255,0.75)",
                    backdropFilter: "blur(8px)",
                    border: "1px solid rgba(249,109,28,0.10)",
                    boxShadow: "0 1px 12px rgba(0,0,0,0.04)",
                  }}
                >
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(249,109,28,0.12)" }}
                    >
                      <Icon className="w-3.5 h-3.5" style={{ color: "#F96D1C" }} strokeWidth={1.8} />
                    </div>
                    <span className="text-[10px] font-mono font-bold" style={{ color: "rgba(249,109,28,0.70)" }}>{p.num}</span>
                  </div>
                  <p className="text-xs font-semibold mb-1.5 leading-tight" style={{ color: "#1a0d06" }}>{p.title}</p>
                  <p className="text-[11px] leading-relaxed" style={{ color: "#7a5a44" }}>{p.body}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Philosophy section */}
        <div className="mb-14">
          <div className="flex items-center gap-2 mb-5">
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
              style={{ background: "rgba(99,102,241,0.12)", color: "#6366F1", border: "1px solid rgba(99,102,241,0.15)" }}
            >
              <Lightbulb className="w-3 h-3" />
              {c.sectionOnAiBadge}
            </div>
          </div>
          <h2 className="text-lg font-bold mb-5" style={{ color: "#1a0d06", fontFamily: "'Georgia', serif" }}>
            {c.onAiTitle}
          </h2>
          <div className="space-y-3">
            {c.onAi.map((para, i) => (
              <div
                key={i}
                className="rounded-2xl p-5"
                style={{
                  background: "rgba(255,255,255,0.65)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(0,0,0,0.06)",
                  borderLeft: i === 0 ? "3px solid #F96D1C" : undefined,
                }}
              >
                <p className="text-sm leading-relaxed" style={{ color: "#4a2810" }}>{para}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Method section */}
        <div className="mb-14">
          <div className="flex items-center gap-2 mb-5">
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
              style={{ background: "rgba(16,185,129,0.12)", color: "#10B981", border: "1px solid rgba(16,185,129,0.15)" }}
            >
              <Compass className="w-3 h-3" />
              {c.sectionHowBadge}
            </div>
          </div>
          <h2 className="text-lg font-bold mb-5" style={{ color: "#1a0d06", fontFamily: "'Georgia', serif" }}>
            {c.howTitle}
          </h2>
          <div className="flex flex-col gap-3">
            {c.howSteps.map((step) => (
              <div
                key={step.num}
                className="flex items-start gap-4 rounded-2xl p-5"
                style={{
                  background: "rgba(255,255,255,0.65)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(0,0,0,0.06)",
                }}
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold"
                  style={{ background: "rgba(16,185,129,0.12)", color: "#10B981" }}
                >
                  {step.num}
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1" style={{ color: "#1a0d06" }}>{step.title}</p>
                  <p className="text-xs leading-relaxed" style={{ color: "#7a5a44" }}>{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Closing note */}
        <div
          className="rounded-3xl p-6 mb-12"
          style={{
            background: "rgba(255,255,255,0.60)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(249,109,28,0.15)",
            boxShadow: "0 2px 24px rgba(249,109,28,0.05)",
          }}
        >
          <div className="flex items-start gap-4">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: "rgba(249,109,28,0.14)" }}
            >
              <Feather className="w-4 h-4" style={{ color: "#F96D1C" }} strokeWidth={1.8} />
            </div>
            <div>
              <div className="text-sm font-semibold mb-2" style={{ color: "#1a0d06" }}>
                {c.closingTitle}
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "#5a3a20", fontFamily: "'Georgia', serif" }}>
                {c.closing}
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div
          className="rounded-3xl p-8 text-center relative overflow-hidden"
          style={{
            background: "linear-gradient(145deg, #1a0d06 0%, #2d1508 100%)",
            border: "1px solid rgba(249,109,28,0.25)",
            boxShadow: "0 8px 48px rgba(0,0,0,0.18)",
          }}
        >
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(249,109,28,0.18) 0%, transparent 70%)", transform: "translate(30%, -30%)" }} />
          <div className="relative z-10">
            <h3 className="text-xl font-bold mb-3" style={{ color: "#fff3ea", fontFamily: "'Georgia', serif" }}>
              {c.ctaTitle}
            </h3>
            <p className="text-sm mb-6" style={{ color: "rgba(255,220,180,0.70)" }}>
              {c.ctaDesc}
            </p>
            <button
              onClick={() => navigate("/")}
              className="px-7 py-3.5 rounded-xl font-semibold text-sm text-white inline-flex items-center gap-2 transition-all hover:opacity-90 hover:scale-[1.02]"
              style={{ background: "linear-gradient(135deg, #F96D1C 0%, #FF9640 100%)", boxShadow: "0 4px 20px rgba(249,109,28,0.35)" }}
            >
              <Feather className="w-4 h-4" />
              {c.ctaBtn}
            </button>
          </div>
        </div>

      </div>
      <SiteFooter />
    </div>
  );
}
