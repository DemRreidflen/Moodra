import { useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft, Feather, Brain, Eye, BookOpen, Sparkles, Shield, Heart,
  Zap, Compass, Clock, Star, MessageSquare, Flame, Lightbulb, Trophy,
  Quote, ListOrdered, GitMerge,
} from "lucide-react";
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
    stats: [
      { value: "12", label: "Principles" },
      { value: "3",  label: "Pillars" },
      { value: "5",  label: "Method steps" },
      { value: "∞",  label: "Books to write" },
    ],
    tabs: [
      { id: "manifesto",  label: "Manifesto",  icon: Quote },
      { id: "principles", label: "Principles", icon: ListOrdered },
      { id: "method",     label: "Method",     icon: GitMerge },
    ],
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
      { num: "12", title: "Finish the book", body: "The finished book — even flawed — meets a reader. The unfinished one is only a possibility. Finish it." },
    ],
    onAiBadge: "Philosophy",
    onAiTitle: "On AI and the act of writing",
    onAi: [
      "The best use of AI in writing is not to generate text. It is to remove the obstacles between you and text. Writer's block is not a failure of imagination — it is usually a failure of activation energy. The AI panel in Moodra exists to help you start, to give you something to push against, to turn the blank page into a draft.",
      "When you ask Moodra's AI to continue a paragraph, you are not outsourcing the writing. You are creating a draft to react to. The human mind responds to existing text differently than it responds to nothing. Revision is easier than creation. Give yourself something to revise.",
      "AI is not creative. It is statistical. It produces plausible text — text that matches the patterns of what has been written before. Your job, as the author, is to exceed plausibility. To write the sentence that no statistical model would produce, because no statistical model has had your particular life. That is the work. That is also the point.",
    ],
    howBadge: "Method",
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
  },
  ru: {
    badge: "Кодекс Moodra",
    heroTitle1: "Ты — автор.",
    heroTitle2: "ИИ — инструмент.",
    heroDesc: "Moodra основана на убеждении: искусственный интеллект — это мощный инструмент, а не замена человеческому уму. Этот Кодекс — фундамент того, как мы думаем о письме, творчестве и роли технологий в жизни серьёзного автора.",
    stats: [
      { value: "12", label: "Принципов" },
      { value: "3",  label: "Опоры" },
      { value: "5",  label: "Шагов метода" },
      { value: "∞",  label: "Книг написать" },
    ],
    tabs: [
      { id: "manifesto",  label: "Манифест",  icon: Quote },
      { id: "principles", label: "Принципы",  icon: ListOrdered },
      { id: "method",     label: "Метод",     icon: GitMerge },
    ],
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
    onAiBadge: "Философия",
    onAiTitle: "О ИИ и акте письма",
    onAi: [
      "Лучшее применение ИИ в письме — не генерировать текст. А убирать препятствия между тобой и текстом. Творческий блок — не сбой воображения. Это, как правило, нехватка активационной энергии. Панель ИИ в Moodra существует, чтобы помочь тебе начать, дать что-то, против чего можно оттолкнуться, превратить чистую страницу в черновик.",
      "Когда ты просишь ИИ Moodra продолжить абзац, ты не передаёшь письмо на аутсорс. Ты создаёшь черновик, чтобы на него реагировать. Человеческий ум реагирует на готовый текст иначе, чем на пустоту. Редактировать проще, чем создавать. Дай себе что-то для редактуры.",
      "ИИ не творческий. Он статистический. Он производит правдоподобный текст — текст, соответствующий паттернам написанного ранее. Твоя задача как автора — превзойти правдоподобие. Написать предложение, которое ни одна статистическая модель не произведёт, потому что у неё нет твоей конкретной жизни. В этом и есть работа. И в этом весь смысл.",
    ],
    howBadge: "Метод",
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
  },
  ua: {
    badge: "Кодекс Moodra",
    heroTitle1: "Ти — автор.",
    heroTitle2: "ШІ — інструмент.",
    heroDesc: "Moodra заснована на переконанні: штучний інтелект — це потужний інструмент, а не заміна людському розуму. Цей Кодекс — фундамент того, як ми думаємо про письмо, творчість і роль технологій у житті серйозного автора.",
    stats: [
      { value: "12", label: "Принципів" },
      { value: "3",  label: "Опори" },
      { value: "5",  label: "Кроків методу" },
      { value: "∞",  label: "Книг написати" },
    ],
    tabs: [
      { id: "manifesto",  label: "Маніфест",  icon: Quote },
      { id: "principles", label: "Принципи",  icon: ListOrdered },
      { id: "method",     label: "Метод",     icon: GitMerge },
    ],
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
    onAiBadge: "Філософія",
    onAiTitle: "Про ШІ та акт письма",
    onAi: [
      "Найкраще застосування ШІ в письмі — не генерувати текст. А прибирати перешкоди між тобою і текстом. Творчий блок — не збій уяви. Це, як правило, нестача активаційної енергії. Панель ШІ в Moodra існує, щоб допомогти тобі почати, дати щось, від чого можна відштовхнутися, перетворити чисту сторінку на чернетку.",
      "Коли ти просиш ШІ Moodra продовжити абзац, ти не передаєш письмо на аутсорс. Ти створюєш чернетку, щоб на неї реагувати. Людський розум реагує на готовий текст інакше, ніж на порожнечу. Редагувати простіше, ніж створювати. Дай собі щось для редагування.",
      "ШІ не творчий. Він статистичний. Він виробляє правдоподібний текст — текст, що відповідає паттернам написаного раніше. Твоє завдання як автора — перевершити правдоподібність. Написати речення, яке жодна статистична модель не вироблятиме, тому що у неї немає твого конкретного життя. В цьому і є робота. І в цьому весь сенс.",
    ],
    howBadge: "Метод",
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
  },
  de: {
    badge: "Moodra Kodex",
    heroTitle1: "Du bist der Autor.",
    heroTitle2: "KI ist das Werkzeug.",
    heroDesc: "Moodra basiert auf einer Überzeugung: Künstliche Intelligenz ist ein mächtiges Werkzeug, kein Ersatz für den menschlichen Geist. Dieser Kodex ist das Fundament unseres Denkens über Schreiben, Kreativität und die Rolle der Technologie im Leben eines ernsthaften Autors.",
    stats: [
      { value: "12", label: "Prinzipien" },
      { value: "3",  label: "Säulen" },
      { value: "5",  label: "Methodenschritte" },
      { value: "∞",  label: "Bücher zu schreiben" },
    ],
    tabs: [
      { id: "manifesto",  label: "Manifest",  icon: Quote },
      { id: "principles", label: "Prinzipien", icon: ListOrdered },
      { id: "method",     label: "Methode",   icon: GitMerge },
    ],
    manifestoLabel: "Manifest",
    manifesto: [
      "Jedes große Buch beginnt mit einem Gedanken, den keine Maschine je hatte. Die Geschichte in dir — die durch dein Leben, deine Verluste, deine Obsessionen geformt wurde — kann nicht generiert werden. Sie kann nur gelebt und dann geschrieben werden. Moodra existiert, um dir dabei zu helfen.",
      "Der Autor ist nicht jemand, der etwas zu sagen hat. Der Autor ist jemand, der nicht aufhören kann, über etwas nachzudenken, und der schließlich entschieden hat, dass Schreiben der einzige ehrliche Weg ist, damit umzugehen. Diese Entscheidung ist deine. Die Worte, die folgen, sind deine. Die Bedeutung, die sie tragen, ist deine.",
      "Wir haben Moodra nicht gebaut, um das Schreiben zu automatisieren. Wir haben es gebaut, um die Reibung zwischen dem Gedanken und der Seite zu beseitigen — um dem Geist des Schriftstellers mehr Raum zu geben für das, was nur der Geist des Schriftstellers tun kann.",
    ],
    principlesTitle: "Die zwölf Prinzipien",
    principles: [
      { num: "01", title: "Du bist der Autor", body: "KI hält deinen Griffel, wenn deine Hand zittert — aber dein Geist, deine Vision und deine Stimme lenken jedes Wort." },
      { num: "02", title: "Idee vor Generierung", body: "Erst denken, dann prompten. Intention ist der Unterschied zwischen einem Buch und einem Dokument." },
      { num: "03", title: "KI ist ein Spiegel, keine Muse", body: "Sie kann einen Satz beenden, einen Absatz erweitern — aber sie kann deine Geschichte nicht erfinden. Nur du kannst das." },
      { num: "04", title: "Jedes Wort gehört dir", body: "Lies es, schreib es um, steh dafür ein. KI-Text wird erst deiner, wenn du dich vollständig damit auseinandersetzt." },
      { num: "05", title: "Die Plattform dient dem Schreiber", body: "Editor, KI, Ideen-Board — Infrastruktur für deinen Prozess. Die Plattform ist die Bühne; du bist die Show." },
      { num: "06", title: "Originalität ist der Punkt", body: "Nutze KI, um schneller zu schreiben und Blockaden zu überwinden — nie, um echtes Haben zu vermeiden." },
      { num: "07", title: "Struktur ist kein Käfig", body: "Gliederungen und Kapiteltitel sind keine Einschränkungen — sie sind das Gerüst, das Kreativität ermöglicht." },
      { num: "08", title: "Schreiben ist Denken", body: "Der Entwurf ist, wie Gedanken entstehen, kein Protokoll fertiger. Schreibe, um zu entdecken, was du glaubst." },
      { num: "09", title: "Der Leser ist dein Partner", body: "Jede Entscheidung — Eröffnungszeile, Struktur, Beispiele — ist eine Botschaft an einen bestimmten Menschen." },
      { num: "10", title: "Beständigkeit vor Intensität", body: "Der Schriftsteller, der jeden Tag auftaucht, selbst schlecht, wird fertig. Der, der auf die perfekte Sitzung wartet, nicht." },
      { num: "11", title: "Überarbeitung ist das Handwerk", body: "Der erste Entwurf ist die Erlaubnis zu existieren. Der zweite ist, wo das Buch beginnt. Überarbeiten ist kein Versagen." },
      { num: "12", title: "Beende das Buch", body: "Das fertige Buch — auch fehlerhaft — trifft einen Leser. Das unfertige ist nur eine Möglichkeit. Beende es." },
    ],
    onAiBadge: "Philosophie",
    onAiTitle: "Über KI und den Akt des Schreibens",
    onAi: [
      "Der beste Einsatz von KI beim Schreiben ist nicht das Generieren von Text. Es ist das Entfernen der Hindernisse zwischen dir und dem Text. Schreibblockade ist kein Versagen der Vorstellungskraft — es ist meistens ein Versagen der Aktivierungsenergie. Das KI-Panel in Moodra existiert, um dir zu helfen anzufangen.",
      "Wenn du die KI von Moodra bittest, einen Absatz fortzusetzen, lagerst du das Schreiben nicht aus. Du erstellst einen Entwurf, auf den du reagieren kannst. Der menschliche Geist reagiert auf vorhandenen Text anders als auf nichts. Überarbeiten ist leichter als Erschaffen.",
      "KI ist nicht kreativ. Sie ist statistisch. Sie produziert plausiblen Text — Text, der den Mustern des bisher Geschriebenen entspricht. Deine Aufgabe als Autor ist es, die Plausibilität zu übertreffen. Den Satz zu schreiben, den kein statistisches Modell produzieren würde, weil kein statistisches Modell dein besonderes Leben hatte.",
    ],
    howBadge: "Methode",
    howTitle: "Wie man mit Moodra arbeitet",
    howSteps: [
      { num: "1", title: "Mit Struktur beginnen, nicht mit Text", body: "Bevor du ein Wort schreibst, baue das Skelett deines Buches. Erstelle Kapitel. Benenne sie, auch vorläufig. Gib der KI einen Kontext. Struktur vor Prosa." },
      { num: "2", title: "Den ersten Satz selbst schreiben", body: "Immer. Den ersten Satz eines jeden Kapitels — schreibe ihn selbst. Er setzt die Stimme, die Richtung, den Vertrag mit dem Leser. Lass die KI fortsetzen; nie beginnen lassen." },
      { num: "3", title: "KI für Schwung, nicht für Bedeutung nutzen", body: "Wenn du feststeckst, nutze KI für Vorwärtsbewegung. Aber die Bedeutung — das Argument, die Emotion, der Punkt — das lieferst du. KI generiert Fortsetzung. Du generierst Bedeutung." },
      { num: "4", title: "Alles lesen, was sie produziert", body: "Behandle KI-Output wie einen Entwurf von einem Junior-Editor: lies jedes Wort, nimm was nützlich ist, schreibe um was es nicht ist, und streiche was nicht passt." },
      { num: "5", title: "Ohne KI überarbeiten", body: "Der zweite Entwurf sollte allein deiner sein. Nimm was die KI dir half zu produzieren und überarbeite es als Schreiber. Hier wird das Buch deins — in der Überarbeitung, dem Kürzen, dem Formen." },
    ],
    closingTitle: "Warum das wichtig ist",
    closing: "Wir haben Moodra gebaut, weil wir glauben, dass der Akt des Schreibens — der echte, menschliche, unvollkommene, außerordentliche Akt — eine der wichtigsten Dinge ist, die ein Mensch tun kann. KI verändert die Werkzeuge, die Schreibern zur Verfügung stehen, aber es verändert nicht, wofür Schreiben da ist. Es ist für die Wahrheit. Für die Verbindung. Für das Buch, das nur du schreiben kannst.",
    ctaTitle: "Bereit, dein Buch zu schreiben?",
    ctaDesc: "Alles in Moodra ist um eine Idee herum entworfen: Dein Buch verdient es zu existieren.",
    ctaBtn: "Jetzt schreiben",
    backLabel: "Zurück",
  },
};

// ── Palette ────────────────────────────────────────────────────────────────
const ACCENT = "#F96D1C";
const BG     = "hsl(30,58%,97%)";

// ── Principle card colors (cycling) ───────────────────────────────────────
const CARD_COLORS = [
  "#F96D1C", "#0EA5E9", "#8B5CF6", "#10B981",
  "#6366f1", "#F59E0B", "#EC4899", "#14B8A6",
  "#F96D1C", "#0EA5E9", "#8B5CF6", "#10B981",
];

export default function CodexPage() {
  const [, setLocation] = useLocation();
  const { lang } = useLang();
  const c = CONTENT[lang as keyof typeof CONTENT] ?? CONTENT.en;
  const [activeTab, setActiveTab] = useState<"manifesto" | "principles" | "method">("manifesto");

  return (
    <div className="min-h-screen" style={{ background: BG }}>

      {/* ── Sticky header ────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-10 border-b"
        style={{ borderColor: "rgba(249,109,28,0.12)", background: "rgba(253,246,238,0.94)", backdropFilter: "blur(12px)" }}
      >
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center">
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-70"
            style={{ color: "#8a7a70" }}
          >
            <ArrowLeft className="h-4 w-4" />
            {c.backLabel}
          </button>
          <div className="flex-1 flex items-center justify-center">
            <img src="/moodra-logo-new.png" alt="Moodra" style={{ height: 38, width: "auto", display: "block" }} />
          </div>
          <LanguagePicker />
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-6 pt-16 pb-10 text-center">
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-6"
          style={{ background: "rgba(249,109,28,0.10)", color: ACCENT }}
        >
          <Feather className="w-3 h-3" />
          {c.badge}
        </div>
        <h1 className="font-bold tracking-tight mb-3 leading-tight" style={{ fontSize: "clamp(32px, 5vw, 52px)", color: "#2d1b0e" }}>
          {c.heroTitle1}
        </h1>
        <h2 className="font-bold tracking-tight mb-6 leading-tight" style={{ fontSize: "clamp(28px, 4.2vw, 44px)", color: ACCENT }}>
          {c.heroTitle2}
        </h2>
        <p className="text-base leading-relaxed max-w-2xl mx-auto" style={{ color: "#7a6a60" }}>
          {c.heroDesc}
        </p>
      </section>

      {/* ── Stats bar ────────────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-6 pb-10">
        <div
          className="grid grid-cols-4 rounded-2xl overflow-hidden"
          style={{ border: "1px solid rgba(249,109,28,0.14)", background: "rgba(255,255,255,0.70)" }}
        >
          {c.stats.map((s, i) => (
            <div
              key={i}
              className="flex flex-col items-center justify-center py-5"
              style={{ borderRight: i < 3 ? "1px solid rgba(249,109,28,0.10)" : "none" }}
            >
              <span className="font-bold text-2xl" style={{ color: ACCENT }}>{s.value}</span>
              <span className="text-xs mt-0.5" style={{ color: "#8a7a70" }}>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Tab bar ──────────────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-6 pb-8">
        <div className="flex gap-2 p-1 rounded-2xl" style={{ background: "rgba(249,109,28,0.07)", width: "fit-content", margin: "0 auto" }}>
          {c.tabs.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: isActive ? "#ffffff" : "transparent",
                  color: isActive ? "#2d1b0e" : "#8a7a70",
                  boxShadow: isActive ? "0 1px 6px rgba(180,90,20,0.10)" : "none",
                }}
              >
                <TabIcon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Tab content ──────────────────────────────────────────────────── */}
      <main className="max-w-3xl mx-auto px-6 pb-16">

        {/* MANIFESTO */}
        {activeTab === "manifesto" && (
          <div>
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-7"
              style={{ background: "rgba(249,109,28,0.10)", color: ACCENT }}
            >
              <Quote className="w-3 h-3" />
              {c.manifestoLabel}
            </div>
            <div className="flex flex-col gap-5">
              {c.manifesto.map((para, i) => (
                <div
                  key={i}
                  className="rounded-2xl px-8 py-7 relative"
                  style={{
                    background: "#ffffff",
                    border: "1px solid rgba(249,109,28,0.12)",
                    boxShadow: "0 2px 16px rgba(180,90,20,0.06)",
                  }}
                >
                  {/* Large quote mark accent */}
                  <div
                    className="absolute top-4 left-6 font-serif"
                    style={{ fontSize: 56, lineHeight: 1, color: "rgba(249,109,28,0.10)", userSelect: "none", pointerEvents: "none" }}
                  >
                    "
                  </div>
                  <p
                    className="relative leading-relaxed"
                    style={{ color: "#3d2a1e", fontSize: 15, lineHeight: 1.75 }}
                  >
                    {para}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PRINCIPLES */}
        {activeTab === "principles" && (
          <div>
            <div className="flex items-center justify-between mb-7">
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest"
                style={{ background: "rgba(249,109,28,0.10)", color: ACCENT }}
              >
                <ListOrdered className="w-3 h-3" />
                {c.principlesTitle}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {c.principles.map((p, i) => {
                const Icon = PRINCIPLE_ICONS[i];
                const color = CARD_COLORS[i];
                return (
                  <div
                    key={i}
                    className="rounded-2xl p-5"
                    style={{
                      background: "#ffffff",
                      border: "1px solid rgba(180,90,20,0.09)",
                      boxShadow: "0 2px 12px rgba(180,90,20,0.05)",
                    }}
                  >
                    <div className="flex items-start gap-3.5 mb-3">
                      {/* Colored icon badge */}
                      <div
                        className="flex-shrink-0 rounded-xl flex items-center justify-center"
                        style={{ width: 36, height: 36, background: color + "18" }}
                      >
                        <Icon style={{ width: 16, height: 16, color }} strokeWidth={1.7} />
                      </div>
                      {/* Number + title */}
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-mono font-bold mb-0.5" style={{ color: color + "99" }}>{p.num}</div>
                        <div className="font-bold text-sm leading-snug" style={{ color: "#2d1b0e" }}>{p.title}</div>
                      </div>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: "#7a6a60", lineHeight: 1.65 }}>{p.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* METHOD */}
        {activeTab === "method" && (
          <div>
            {/* Philosophy section */}
            <div className="mb-10">
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-6"
                style={{ background: "rgba(99,102,241,0.10)", color: "#6366f1" }}
              >
                <Lightbulb className="w-3 h-3" />
                {c.onAiBadge}
              </div>
              <h3 className="text-lg font-bold mb-5" style={{ color: "#2d1b0e" }}>{c.onAiTitle}</h3>
              <div className="flex flex-col gap-4">
                {c.onAi.map((para, i) => (
                  <div
                    key={i}
                    className="rounded-2xl px-6 py-5"
                    style={{
                      background: i === 0 ? "#ffffff" : "rgba(255,255,255,0.65)",
                      border: "1px solid rgba(99,102,241,0.10)",
                      boxShadow: "0 2px 10px rgba(99,102,241,0.04)",
                      borderLeft: `3px solid ${"#6366f1" + (i === 0 ? "cc" : "55")}`,
                    }}
                  >
                    <p className="text-sm leading-relaxed" style={{ color: "#3d2a1e", lineHeight: 1.75 }}>{para}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Method steps */}
            <div>
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-6"
                style={{ background: "rgba(249,109,28,0.10)", color: ACCENT }}
              >
                <GitMerge className="w-3 h-3" />
                {c.howBadge}
              </div>
              <h3 className="text-lg font-bold mb-5" style={{ color: "#2d1b0e" }}>{c.howTitle}</h3>
              <div className="flex flex-col gap-4">
                {c.howSteps.map((step, i) => (
                  <div
                    key={i}
                    className="flex gap-5 rounded-2xl px-6 py-5"
                    style={{
                      background: "#ffffff",
                      border: "1px solid rgba(249,109,28,0.11)",
                      boxShadow: "0 2px 10px rgba(180,90,20,0.05)",
                    }}
                  >
                    {/* Step number badge */}
                    <div
                      className="flex-shrink-0 flex items-center justify-center rounded-full font-bold text-sm"
                      style={{ width: 36, height: 36, background: "rgba(249,109,28,0.10)", color: ACCENT, minWidth: 36 }}
                    >
                      {step.num}
                    </div>
                    <div>
                      <div className="font-bold text-sm mb-1.5" style={{ color: "#2d1b0e" }}>{step.title}</div>
                      <p className="text-xs leading-relaxed" style={{ color: "#7a6a60", lineHeight: 1.65 }}>{step.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Closing quote + CTA ──────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-6 pb-16">
        {/* Closing quote card */}
        <div
          className="rounded-2xl px-8 py-8 mb-8 text-center"
          style={{
            background: "linear-gradient(135deg, rgba(249,109,28,0.07) 0%, rgba(249,109,28,0.03) 100%)",
            border: "1px solid rgba(249,109,28,0.14)",
          }}
        >
          <Flame className="w-6 h-6 mx-auto mb-4" style={{ color: ACCENT, opacity: 0.7 }} />
          <p
            className="text-base leading-relaxed font-medium italic"
            style={{ color: "#3d2a1e", maxWidth: 540, margin: "0 auto", lineHeight: 1.8 }}
          >
            "{c.closing}"
          </p>
          <p className="text-xs mt-4" style={{ color: "#b0907a" }}>— {c.closingTitle}</p>
        </div>

        {/* CTA card */}
        <div
          className="rounded-2xl px-8 py-8 text-center"
          style={{
            background: "#ffffff",
            border: "1px solid rgba(249,109,28,0.13)",
            boxShadow: "0 4px 24px rgba(180,90,20,0.08)",
          }}
        >
          <Trophy className="w-8 h-8 mx-auto mb-4" style={{ color: ACCENT }} />
          <h3 className="text-xl font-bold mb-2" style={{ color: "#2d1b0e" }}>{c.ctaTitle}</h3>
          <p className="text-sm mb-6" style={{ color: "#8a7a70" }}>{c.ctaDesc}</p>
          <button
            onClick={() => setLocation("/")}
            className="inline-flex items-center gap-2 px-7 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: ACCENT, color: "#ffffff", boxShadow: "0 4px 16px rgba(249,109,28,0.30)" }}
          >
            <Feather className="w-4 h-4" />
            {c.ctaBtn}
          </button>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
