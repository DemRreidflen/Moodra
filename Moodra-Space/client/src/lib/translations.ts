export type Lang = "en" | "ru" | "ua" | "de";

export const LANGUAGES: { code: Lang; label: string; flag: string }[] = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "ua", label: "Українська", flag: "🇺🇦" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
];

const t = {
  en: {
    common: {
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      close: "Close",
      back: "Back",
      loading: "Loading…",
      saving: "Saving…",
      or: "or",
      new: "New",
      edit: "Edit",
      add: "Add",
      remove: "Remove",
      yes: "Yes",
      no: "No",
      confirm: "Confirm",
      settings: "Settings",
      language: "Language",
    },
    nav: {
      home: "My Books",
      settings: "Settings",
      logout: "Sign out",
      faq: "FAQ",
      apiGuide: "What is an API?",
      inspiration: "Platform Tips",
      codex: "Codex",
      habits: "Writing Habits",
      models: "AI Models",
    },
    editor: {
      editor: "Editor",
      characters: "Characters",
      notes: "Notes",
      research: "Research",
      board: "Idea Board",
      settings: "Book Settings",
      layout: "Layout",
    },
    login: {
      headline1: "The book inside you",
      headline2: "deserves to exist.",
      subheadline: "You don't have to be wise to feel it. Be yourself, follow your passion — and everything else, from the first paragraph to the finished manuscript, Moodra will help you create.",
      eyebrow: "AI Writing Studio",
      signIn: "Welcome back",
      signInSub: "One account. Every tool you need.\nYour projects are waiting.",
      continueGoogle: "Continue with Google",
      terms: "By signing in you agree to our Terms of Service.\nWe never share your data with third parties.",
      footer: "For those who write from the heart",
      whatYouGet: "What you get",
      features: {
        editor: { title: "Write the way you think", desc: "Fluid blocks that stay out of your way. Headings, quotes, callouts, tables — all keyboard-driven." },
        ai: { title: "An AI that reads your draft", desc: "Continues your prose, develops arguments, reworks any paragraph. Context-aware, not template-driven." },
        research: { title: "Evidence becomes structure", desc: "Link sources to chapters, track hypotheses, manage bibliographies. Built for non-fiction that matters." },
        ideas: { title: "Map your book's architecture", desc: "Drag, connect, arrange. See how every idea relates to every other before you write a single line." },
      },
      highlights: [
        "Your API key, your model — zero markup on AI costs",
        "Self-hosted: your drafts never leave your server",
        "Privacy by design, not by policy",
        "Open source and built to last",
      ],
    },
    home: {
      newBook: "New book",
      myBooks: "My books",
      fiction: "Fiction",
      scientific: "Non-fiction",
      emptyTitle: "Your first book starts here",
      emptyDesc: "Every great book begins with a single line. Create a project — let AI help you move forward.",
      emptyBtn: "Create my first book",
      emptyTagline: "Editor · AI assistant · Idea board — all ready for you",
      createTitle: "New book",
      createName: "Title",
      createNamePlaceholder: "My next book",
      createDesc: "Short description",
      createDescPlaceholder: "What is it about?",
      createMode: "Genre",
      createCover: "Cover colour",
      createCoverImage: "Upload cover image",
      modeScientific: "Non-fiction",
      modeFiction: "Fiction",
      modeScientificSub: "Non-fiction · Research · Philosophy",
      modeFictionSub: "Novel · Sci-fi · Fantasy",
      deleteConfirm: "Delete book?",
      deleteWarning: "This will permanently delete the book and all its chapters.",
      lastEdited: "Last edited",
    },
    settings: {
      title: "Settings",
      profile: "Profile",
      name: "Name",
      email: "Email",
      aiKey: "OpenAI API",
      keyActive: "Key active",
      keyMissing: "No key set",
      getKeyLink: "How to get a key?",
      replaceKey: "Replace key",
      keyPlaceholder: "sk-…",
      saveKey: "Save key",
      removeKey: "Remove key",
      tokensUsed: "Tokens used (gpt-4o-mini)",
      estimatedCost: "Estimated cost",
      language: "Interface language",
      languageDesc: "AI responses will also be in the chosen language.",
      dangerZone: "Danger zone",
      deleteAccount: "Delete account",
      books: "My books",
    },
    apiModal: {
      title: "Hey, looks like you're out of juice.",
      desc: "Moodra has no subscription and is completely free — but all AI features run on each user's own OpenAI API key, with zero hidden fees. Your key, your costs, total transparency. Looks like your account balance has run dry.",
      placeholder: "sk-…",
      save: "Save and continue",
      skip: "Skip for now",
      getKey: "Get a key at platform.openai.com",
      guide: "Step-by-step guide to getting a key",
      safeNote: "Your key is encrypted and never shared. Change it anytime in Settings.",
    },
    aiError: {
      noKey: "No API key set",
      noKeyDesc: "Add your OpenAI key in Settings to enable AI features.",
      quota: "Oops, AI needs fuel.",
      quotaDesc: "Moodra is free — but AI runs on your personal OpenAI key. It looks like your balance ran out. Top up at platform.openai.com.",
      invalidKey: "Invalid API key",
      invalidKeyDesc: "Your key seems incorrect. Check it in Settings.",
      goToSettings: "Open Settings",
      getKey: "Get a key",
    },
    faq: {
      title: "Frequently asked questions",
      subtitle: "Everything you need to know about Moodra.",
      items: [
        { q: "Is Moodra free?", a: "Yes, the platform itself is completely free. AI features use your personal OpenAI API key — you pay OpenAI directly at their standard rates, with zero markup from us." },
        { q: "What is an OpenAI API key?", a: "It's a personal access token that lets you use OpenAI's language models (like GPT-4o-mini). You create it at platform.openai.com. There's no subscription — you pay per use, and it's very affordable." },
        { q: "How much does AI cost?", a: "GPT-4o-mini costs approximately $0.30 per 1 million tokens. A typical writing session (a few hundred words) costs fractions of a cent. Moodra tracks your usage so you always know." },
        { q: "Is my writing private?", a: "Your text is stored in your own database and sent only to OpenAI when you explicitly use an AI feature. We do not read, analyze, or share your content." },
        { q: "Can I use Moodra without AI?", a: "Absolutely. The block editor, idea board, and all organizational features work without any API key. AI is an enhancement, not a requirement." },
        { q: "What languages does Moodra support?", a: "The interface is available in English, Russian, Ukrainian, and German. When you choose a language, AI responses will also be in that language." },
        { q: "Can I export my book?", a: "Yes — you can export to PDF and EPUB from the book editor. Both formats preserve your chapter structure and formatting." },
        { q: "Is Moodra open source?", a: "Yes. The codebase is open and self-hostable — you can run it on your own server with your own database." },
      ],
    },
    inspiration: {
      title: "Platform Tips",
      subtitle: "How to write better, think deeper, and make the most of Moodra.",
      readMin: "min read",
      articles: [
        {
          tag: "Getting started",
          title: "Your first week with Moodra",
          desc: "A practical guide to setting up your workspace, creating your first book, and making AI work for you from day one.",
          content: `**Start with a clear structure, not a blank page.** The blank page is terrifying because it asks too much. It says: start anywhere, everything is possible, nothing is decided. Structure removes that pressure. Create your book, add 3–5 chapter titles even if they're rough guesses. "Part 1: The Problem", "Chapter 3: What Everyone Gets Wrong" — these don't have to be final. They just have to exist. Structure kills procrastination because it transforms the question from "where do I begin?" to "what goes here?" The difference between a writer who starts and a writer who doesn't is almost never about talent or inspiration. It's about having a container to put words into. Build the container first.\n\n**Day one: Create your book and define its mode.** When you create a new book in Moodra, you choose between Scientific and Fiction modes. This isn't cosmetic — it changes the AI's behavior, the block types available, and the organizational logic. If you're writing a non-fiction argument, choose Scientific. If you're writing narrative — fiction, memoir, personal essay — choose Fiction. You can add a cover image or just pick a color. Add a short description of what the book is about. Even one sentence is enough. Writing a description forces you to articulate what you're actually building.\n\n**Use the AI to continue, not to write for you.** The best results come when you write a paragraph yourself and then ask the AI to continue. This is not laziness — this is leverage. When you write the seed, the AI extends it in your voice. When you ask the AI to "write me a chapter about X", you get something technically competent and thoroughly generic. The difference is ownership. The paragraph you wrote, however rough, carries your perspective. The AI can grow it. It cannot create it. This principle is worth returning to every time you feel tempted to hand over control entirely.\n\n**Day two: Set up your chapters before you fill them.** On your second day, resist the urge to start writing body text immediately. Instead, create all the chapters your book might need. Name them, even badly. "The Core Argument", "Why This Matters", "The Part Where Everything Falls Apart" — these are working titles, not commitments. Create at least five. Then write one sentence in each: what does this chapter need to accomplish? This single-sentence purpose statement is the most valuable thing you can write before the real writing begins.\n\n**The Idea Board is your scratchpad before the page.** Before writing any chapter, spend 10 minutes on the Idea Board. Add cards for scenes you're imagining, arguments you want to make, questions you haven't answered, characters who need to appear. Connect them with lines. You don't need a plan — you need a map of the territory. Writing into a map is 3× easier than writing into nothing. The board externalizes your thinking so your writing can focus on expression rather than discovery. Many writers find that the board sessions are where their best ideas actually emerge.\n\n**Day three: Your first real writing session.** Enable the Focus Timer in the editor header. Set it to 25 minutes. Open your first chapter. Write without stopping — even if what you write is bad. Bad writing is raw material. Silence is not. After the timer goes off, read what you wrote. Don't edit it yet. Notice which sentences surprised you. Those surprises are usually where your real thinking is. Save the chapter and leave. You've done the most important thing: you've begun.\n\n**Set a modest word count goal, then protect it.** The editor shows a live word count. Don't set a goal of 2,000 words and then feel crushed when you write 300. Set a goal of 300 and feel like you're ahead when you write 500. The psychological difference is enormous. Consistency beats ambition in the first month. A writer who writes 300 words every day for a year has 109,000 words — that's a book. A writer who writes 2,000 words on inspiration and nothing when uninspired has a folder of fragments and a growing sense of failure. Protect the modest goal ruthlessly.\n\n**Don't confuse organizing with writing.** One of the most seductive traps is spending your writing time reorganizing chapters, renaming things, and moving blocks around. It feels productive. It isn't. The only thing that moves a book forward is words on the page. Use the first 5 minutes of every session to write — even if you immediately reorganize after. Words first, structure second. If you find yourself reorganizing for more than 10 minutes, it usually means you're avoiding writing something you find difficult. Write the difficult thing first.\n\n**By the end of week one, you should have:** At least 5 named chapters. At least 2 chapters with actual content. One Idea Board with at least 8 cards. A daily writing time you've protected at least 4 times. This isn't a template — it's a baseline. If you have more, great. If you have less, start again tomorrow with one of these. The only rule is to have started.`,
        },
        {
          tag: "AI workflow",
          title: "How to use AI without losing your voice",
          desc: "AI is a co-author, not a ghostwriter. Here's how to stay in control of your book while letting AI do the heavy lifting.",
          content: `**Rule #1: You write the seed, AI grows it.** The most important thing to understand about AI in writing is that it reflects. It doesn't originate. Type the first sentence of a paragraph — even just a rough idea, even a fragment. Then use "Continue writing." The result will extend your direction, not replace it. When you give the AI a sentence, you give it constraints: your vocabulary, your angle, your level of abstraction. It responds within those constraints. This is collaboration. When you give it a topic and nothing else, you get the average of everything ever written on that topic. Average is not what you're after. This asymmetry — AI extends, you originate — is what makes AI a powerful tool rather than a replacement.

**The three levels of AI assistance.** Think of AI help on a spectrum. Level one: continue — you write a sentence and ask the AI to finish the paragraph. Safest. Level two: expand — you write a complete thought and ask the AI to develop it with examples and depth. Most productive. Level three: generate — you give the AI a subject from scratch. Most dangerous for voice. Use levels one and two as your default. Use level three only for rough drafts you'll fully rewrite.

**Use "Develop idea" when you have a thesis but don't know how to expand it.** This is especially powerful for non-fiction. You've written: "The reason most people fail at X is not lack of information but lack of feedback loops." You believe it. You don't know yet how to support it. "Develop idea" will add structure: subclaims, examples, distinctions, possible objections. It's not writing the argument for you — it's showing you what the argument could contain. Then you decide which parts are yours, which parts are almost right, which parts to discard entirely. This workflow saves not just time but the cognitive energy of having to manufacture structure from nothing.

**Analyze your style before generating anything substantial.** The AI panel can read your existing chapters and calibrate to your voice before it writes another word. This is not cosmetic. Voice is the difference between a book and a document. If you've written three chapters and you want the AI to help with the fourth, let it read the first three. Your sentence length, your use of questions, your level of formality, your habits of punctuation and rhythm — these patterns become the template for what comes next. The analysis doesn't make the AI write exactly like you. But it constrains the output to feel like it belongs in your project.

**The red flags that tell you AI has taken over.** Pay attention to certain signs that the AI is no longer extending your voice but replacing it. The output uses passive voice more than you do. The sentences are all similar length. There are no questions. Everything is stated rather than argued. The paragraph sounds like a confident but slightly bored magazine feature about any topic. When you see these signs, stop. Go back to your last personally written sentence and start again from there.

**Never accept the first generation.** Every AI output should be treated as a first draft — better than nothing, never good enough as-is. Read it. Mark the sentences that are genuinely strong. Delete the sentences that are generic, that sound like they could be in anyone's book. Rewrite the rest in your own words. What you end up with is a paragraph that has your structure and your voice, but was assembled faster than you could have built it alone. That's the real value of AI in writing: not automation, but acceleration with your hands still on the wheel.

**Use the AI for research and counterarguments, not just prose.** The AI research panel is particularly powerful for non-fiction. Ask it to generate counterarguments to your hypothesis. Ask it to summarize what experts believe about a topic. Ask it to explain a concept in simpler terms so you can then restate it in your own words. This isn't cheating — it's how any researcher uses sources. The difference is that you synthesize, argue, and conclude. The AI supplies raw material you then work.

**The test of authentic AI-assisted writing.** When you finish a chapter that involved AI assistance, read it out loud. Every sentence that makes you wince, that doesn't sound like how you talk or think — that's a sentence the AI wrote that you didn't fully assimilate. Either cut it or rewrite it until it sounds like you. The goal is not to hide the AI's involvement. The goal is to produce writing that is genuinely yours, even if the path to it was faster.`,
        },
        {
          tag: "Deep work",
          title: "Finding flow in the age of distraction",
          desc: "The writing environment and rituals that help you achieve deep focus — and finish what you start.",
          content: `**Deep work is not a luxury — it's the only work that produces books.** Shallow work is email, browsing, responding, organizing. It feels busy. It produces nothing that lasts. A book requires you to hold an entire world in your head: the argument you're building, the characters you're tracking, the structure you're maintaining. This kind of cognitive holding requires extended, uninterrupted time. You cannot write a book in 10-minute sprints. You can draft an email in 10-minute sprints. Know which mode you need to be in and ruthlessly protect the transition between them.

**The neuroscience of creative immersion.** When you enter deep focus, your brain shifts from its default mode network (the part that wanders, plans, worries) to a task-positive network. This transition takes time — typically 15–20 minutes of sustained attention before real depth is reached. Every interruption resets the clock. This is why a two-hour block with one interruption is not the same as two one-hour blocks. The interruption costs you not just the minutes lost, but the depth you had reached. Protect your deep work blocks as if depth were a non-renewable resource. In some ways, it is.

**Use Deep Writing Mode when you need to disappear into the work.** Moodra's isolation mode hides everything except your text and a faint chapter title. No sidebars, no word counts flashing, no navigation. Press Escape to return. Many writers report that the simple act of entering this mode — the visual change, the disappearance of clutter — is enough to shift mental gears. Your environment shapes your behavior. A clean environment signals: this is work time. A cluttered environment signals: this is administration time. Use the signal deliberately.

**Design your environment before your session, not during it.** Environmental design is upstream of motivation. Closing your email client takes 10 seconds before you start. Doing it while writing takes 10 seconds plus the cognitive cost of the interruption plus the cost of re-entering the state you were in. Before every session: close all tabs except Moodra, silence your phone, get your drink ready, put on the music or silence you work best in. These aren't rituals for their own sake. They're removing decision-making and friction from the session before the session begins.

**Write before you research.** This is counterintuitive but critical. You probably believe you need to research before you can write. This is almost always wrong. What you actually need is to write until you discover what you don't know, then research that specific thing. Writers who research before writing often produce exhaustive notes that never become prose. Writers who write first produce drafts with holes — holes they then research to fill. The second approach produces finished writing faster. Write into what you know. Research to fill what you find you don't.

**The 25-minute rule is about permission, not duration.** A timer is a promise to yourself: for 25 minutes, writing is the only thing. No checks, no switching, no planning. The power of the timer is not the interval — it's the commitment. When you know you only have to write for 25 minutes, the starting becomes easy. The timer removes the open-ended dread of "I have to write today" and replaces it with "I have to write for 25 minutes." The first is infinite. The second is survivable. Use Moodra's built-in Focus Timer to set this. When the banner appears at the top of the screen, you're in.

**Protect your recovery time.** Deep work depletes specific cognitive resources. After 90 minutes of genuine deep work, most writers are approaching the limit of productive output — not because they're lazy, but because the neurological resources required for this kind of thinking have been temporarily exhausted. Trying to push through this depletion doesn't produce more work. It produces more words that will be cut in revision. Schedule your deep work in 90-minute maximum blocks, then do something genuinely restorative — a walk, a meal, physical movement. You're maintaining a long-term asset. Treat it accordingly.

**Track your deep work hours, not your word count.** Word count is a tempting metric because it's visible and objective. But it measures output, not effort. A day when you wrote 200 words of something genuinely difficult and important may have produced more lasting value than a day when you wrote 1,200 words of filler. What you actually want to build is the capacity for deep work — the ability to sit with hard problems without flinching, to stay with a difficult chapter until it yields. Track the hours. The words will follow.`,
        },
        {
          tag: "Non-fiction",
          title: "Using the Hypothesis system",
          desc: "How researchers and non-fiction authors can use Moodra's evidence-tracking tools to build rigorous, compelling arguments.",
          content: `**Hypotheses are the architecture of non-fiction.** A hypothesis is not a guess — it's a claim you're committing to prove. For every chapter, before you write a word of prose, write the central hypothesis: "This chapter argues that X because Y." Add sub-hypotheses for each major section. This forces clarity. You will often discover, in the act of writing the hypothesis, that you don't actually know what you believe yet. That discovery — painful as it is — is the most valuable thing that can happen before you start writing. It's far better to discover an unclear argument in the planning stage than three chapters in.

**The anatomy of a strong hypothesis.** A strong hypothesis has three components: a claim, a mechanism, and a scope. The claim is what you're asserting. The mechanism is why or how it's true. The scope is the boundaries of where it applies. "People fail at habits" is not a hypothesis — it's a vague observation. "People fail at habits primarily because they design habits around motivation rather than environment, which makes the habit dependent on a variable that is inherently unstable" is a hypothesis. It makes a specific claim, explains the mechanism, and implies scope. Write your hypotheses at this level of specificity.

**Arguments and counterarguments belong together.** For every hypothesis, add at least one strong counterargument. Not a weak straw man you can easily dismiss — the strongest version of the opposing view. Then respond to it. This is not a rhetorical exercise. It's how you discover whether your argument is actually sound. A hypothesis that cannot survive its best counterargument needs to be revised, not hidden. Readers will find the counterargument even if you don't include it. Better to address it on your terms than to let it undermine your credibility in the reader's mind.

**Link every source to the chapters it supports.** Moodra's research panel lets you attach sources to specific chapters. This solves a real problem: you've read fifty papers, but when you're in Chapter 6, you can't remember which one contained the key statistic. Source-chapter linking creates a live bibliography that shows you, at the moment of writing, what evidence you have available for the claim you're making. It also prevents the common failure mode of using a source to support a claim it doesn't actually make.

**Use AI to generate counterarguments you might be avoiding.** We all have arguments we believe in so strongly that we instinctively dismiss opposition. Ask the AI research panel to generate counterarguments to your hypothesis. Read them carefully. If any of them are better than you expected — that's information you need. A good counterargument you hadn't considered is not a problem. It's a gift. It makes your final argument stronger. The non-fiction writer who has genuinely engaged with the opposition is far more credible than one who hasn't.

**The difference between a claim and an observation.** Most non-fiction first drafts are full of observations masquerading as arguments. "Many writers struggle with procrastination" is an observation. "Writers procrastinate primarily because they have set impossibly high standards for their output, creating an environment where starting feels like risking failure" is a claim. Observations don't need to be proved. Claims do. The more of your book is built from claims rather than observations, the more argumentative energy it will have. Go through your hypothesis blocks and ask of each: is this a claim I need to prove, or an observation I'm making without defending?

**The research-to-writing ratio should be 1:3.** A common failure in academic and serious non-fiction is a research-to-writing ratio that's inverted: too much time collecting evidence, not enough writing. Aim for one hour of research for every three hours of writing. Research at the frontier of what you need; write as far as your current knowledge takes you. The writing will reveal what you still need to research. This rhythm produces more finished prose than a research-first approach ever does.

**Build your argument map before writing the conclusion.** Non-fiction writers often leave the conclusion for last and then discover, on arriving there, that their chapters don't actually support a single coherent point. The conclusion reveals whether the argument actually holds. Use the Notes panel to write a draft conclusion before you've finished writing the book. Then check whether each chapter actually contributes to it. If a chapter doesn't support the conclusion, either the chapter needs to change or the conclusion does. Better to discover this at chapter three than at chapter fifteen.`,
        },
        {
          tag: "Fiction",
          title: "Characters that feel alive",
          desc: "How to build characters with real psychology, contradiction, and desire — so readers believe in them completely.",
          content: `**A character is a system of desire and obstacle.** Strip away every description, every backstory, every trait — and what you have left is this: what does this person want, and what stands between them and getting it? This is the engine. Everything else is characterization layered over the engine. When a scene feels flat, it's usually because the character's desire has disappeared from the scene. Bring it back and the scene comes alive. The scene only matters because a character with a specific want is moving through it. Remove the want and you remove the stakes.

**The three layers of character desire.** Desire operates on three levels simultaneously. Surface desire: what the character says they want and consciously pursues. Story desire: what the character actually needs, which the story will eventually address. Hidden desire: what the character secretly wants but can't admit, even to themselves. The most compelling characters hold all three — and they're often in conflict. A character who knows exactly what they want and gets it without complication is not interesting. A character who wants one thing, needs another, and secretly fears a third is a person.

**Give every character a private logic — even if it's wrong.** Your character needs to make sense from the inside. They don't need to be right. They don't need to be likeable. But they need to behave according to a consistent internal logic that makes sense given what they believe, what they want, and what they're afraid of. When a character does something that feels convenient to your plot but inconsistent with their psychology, readers feel it as a betrayal. The character must do what they would do, not what you need them to do. If what they would do doesn't serve your plot, you need to revise your plot.

**Contradiction is what makes a character believable.** Real people are warm and cruel, principled and compromising, brave and cowardly — often in the same afternoon. A character who is purely one thing is not a person. They're a symbol of a thing. The most compelling characters hold contradictions without resolution: the idealist who is personally ruthless, the cynic who is secretly tender, the brave person who is terrified. Don't resolve these contradictions in your planning. Let the story create pressure on them and see which way they break. The break is usually your most important scene.

**Voice is character.** The way a person speaks — the rhythms, the vocabulary, the specific words they avoid, the things they say instead of what they mean — reveals more about them than any description ever could. Before writing any character with significant dialogue, spend twenty minutes writing in their voice without any story: a rant, a confession, a letter to someone they're afraid of. Don't use any of it in the book. Use it to calibrate the voice. When you return to the story, the character's voice will feel lived-in rather than constructed.

**The character database is your memory so you can focus on the scene.** When you're in the middle of writing a confrontation scene, you should not be scrolling back through earlier chapters to remember the color of someone's eyes, the name of their dead sibling, or the specific thing they said in Chapter 2 that makes this moment resonant. Put it in the character database. Before you write any important scene with a character, re-read their database entry. Then close the database and write from memory — the way you'd interact with someone you know rather than someone you've researched.

**Secondary characters need their own desires.** One of the most common failures in fiction is secondary characters who exist only in relation to the protagonist — they're helpful, or they're obstacles, or they're loving presences — but they have no independent inner life. The reader can feel this. It creates a sense that the world only exists insofar as it touches the main character. Give every character who appears in more than two scenes a want that has nothing to do with the protagonist. They can pursue it offscreen. They don't need many scenes. Just the sense that the world keeps going when the camera turns away.

**Write the scene you're afraid of.** Every story has a scene the writer is avoiding. The confrontation. The declaration. The death. The moment the character has to say the thing they can't say. These avoided scenes are usually the most important ones — which is why they're being avoided. They're being avoided because they're hard to write and carry real emotional risk. Write them anyway. Write them badly the first time if necessary. The draft doesn't need to be good. It needs to exist. The revision of a bad version of the right scene is far easier than the revision of a good version of the wrong scene.`,
        },
        {
          tag: "Process",
          title: "From first draft to finished book",
          desc: "The editing process most authors skip — and why the real writing happens in revision.",
          content: `**The first draft is not supposed to be good.** This is the most important thing to understand about writing, and the hardest thing to believe. The first draft is a thinking process, not a writing process. You are discovering what you believe, what the story needs, what the argument actually is. You cannot know these things in advance — you can only find them by writing. So the first draft's job is not to be readable. Its job is to exist so you have something to work with. Write it fast, write it without looking back, write it past the scenes and sections you hate. The blank page cannot be revised. The bad draft can.

**The permission you need to give yourself.** Most writers fail to finish first drafts not because they're blocked, but because they're editing while writing. They write a paragraph, read it back, hate it, delete it, try again, hate the new version, and stall. This is writing and editing at the same time, and it destroys the momentum that drafts need. The solution is permission: permission to write badly. You are the only person who will ever see this draft. Your future reader is not reading over your shoulder. Write things you'd be embarrassed to show anyone. The draft doesn't need to be good. It needs to be honest — to capture your actual thinking, even when your thinking is confused.

**Distance before revision is not optional.** You will never see your draft clearly immediately after writing it. You see what you meant to write, not what you wrote. The gap between intention and execution is invisible to you when you're still inside the work. Leave a week between finishing a draft and beginning revision. Longer is better. When you come back, you'll read sentences that you're certain you didn't write — because the person who comes back after a week and the person who wrote them are subtly different people. You need that distance to read your own work as a reader, not as its author.

**Edit in passes — structure first, then prose, then words.** Most editing fails because it tries to do too many things simultaneously. Pass one: read for structure only. Does the argument hold? Does the story move forward? Are there redundant chapters, missing transitions, sections that belong somewhere else? Fix structure before touching prose — a beautiful sentence in the wrong place is still in the wrong place. Pass two: prose. Is every paragraph earning its space? Is the rhythm varied or monotonous? Are there transitions that actually move the reader, or just connective tissue that fills space? Pass three: words. Is this the right word, or just a serviceable one? Is this sentence doing what it needs to do, or is it doing something slightly adjacent to what it needs to do? One pass at a time.

**The structural edit is the most important and most skipped.** Writers who've just finished a draft are exhausted and relieved. The instinct is to clean it up at the sentence level — fix the prose, sharpen the words — and call it done. This is almost always a mistake. Structural problems cannot be fixed by beautiful prose. A chapter that shouldn't exist becomes more beautiful but still shouldn't exist. A missing transition becomes more polished but still leaves the reader confused. Do the structural edit first, even if it means deleting 10,000 words of good prose because they belong to a shape the book no longer has.

**Cut more than you think you need to.** The average first draft is 20–30% too long. This is not because writers are verbose by nature — it's because writing is thinking, and thinking is often repetitive. You make the same point twice. You approach the same idea from three angles and include all three even when two are sufficient. You include scenes that were necessary for you to discover the story but that the reader doesn't need. When in doubt, cut it. A book that leaves the reader wanting more is almost always more powerful than one that gives them everything you found out along the way.

**Get feedback before the final polish.** Most writers share their work too late — after extensive revision, when they've polished the prose to the point where they're attached to every sentence. Share earlier: after the structural draft. Ask specific questions: Does the argument make sense? Does the story move? Are there sections that lost you? Feedback on structure is actionable. Feedback on polished prose is often heartbreaking, because it sometimes requires cutting things you've spent weeks perfecting. Get structural feedback while structural change is still relatively painless.

**The last 10% takes 50% of the time.** This is not a failure of efficiency — it's the nature of the work. The last pass through a manuscript is the one where you're trying to make every sentence true. Not just correct, not just clear, but genuinely true to what you mean. This precision is slow and difficult and necessary. Budget for it. Don't rush the final pass. The reader will never know how long any individual sentence took to write. But they will feel the difference between a sentence that arrived and a sentence that was settled for.`,
        },
        {
          tag: "Habit",
          title: "The writing habit that actually works",
          desc: "Forget inspiration. Here's the system that gets books written — session by session, word by word.",
          content: `**Inspiration is a side effect of showing up, not a prerequisite.** Writers who wait for inspiration to write don't write books. Writers who write whether they feel inspired or not do. This is not because they are more disciplined or more talented. It's because they understand the nature of creative work: the good ideas come during the writing, not before it. The act of writing is what produces the ideas worth having. Show up. Write badly for ten minutes. Something will catch. It always does. Inspiration follows action; it almost never precedes it.

**The neurological case for writing habits.** Habits work by creating neural pathways that become increasingly automatic with repetition. When you write at the same time, in the same place, using the same opening ritual, your brain starts to enter the writing state before you've written a word — because the environmental cues have become a reliable predictor of what's coming. This is the cue-routine-reward loop that governs all habit formation. You're not building willpower. You're building a conditioned response. Willpower depletes. Conditioned responses don't. The goal is to make starting feel like what happens at 8 AM on weekdays, not like a decision that requires motivation.

**Write at the same time, in the same place, every day.** Your brain responds to context cues. When you sit in the same chair, with the same drink, at the same time of day, and open the same application, your brain starts to prepare for writing before you've typed a word. The cue-routine-reward loop, repeated enough times, makes starting feel automatic instead of effortful. You are building a writing reflex. It takes weeks. It lasts for years. Don't underestimate this. Many writers report that after a few months of consistent practice, the urge to write at their writing time becomes stronger than the urge to do anything else.

**Lower the bar to start. Raise the bar for stopping.** Tell yourself: I only have to write one sentence. One paragraph. One terrible block of text. The bar to start should be so low that refusing to write feels absurd. Almost always, you'll write far more than you committed to. Once you're writing, momentum builds. The hard part is not writing — the hard part is opening the document. Once it's open and you've typed one sentence, the cost of stopping is higher than the cost of continuing. This is not a trick. It's an accurate description of how creative inertia works.

**Protect the streak more than the word count.** Missing one day of writing is a small thing. Missing two days is the beginning of a habit change. Missing a week is the end of the habit. The streak — the unbroken chain of writing days — is more valuable than any single high-output session. A day when you write 50 mediocre words is better than a day when you write nothing. Not because 50 words is impressive, but because you showed up, and showing up tomorrow will be slightly easier than it would have been otherwise. The streak is not a vanity metric. It is the mechanism by which the habit becomes stable. Moodra tracks it for you. Watch it grow.

**Finish the session before you're empty.** Stop writing when you still know what comes next. This technique, attributed to Hemingway, is one of the most reliable ways to make starting the next day easy. When you write until you're completely drained — until you've said everything you had to say for that session — you face a blank state the next time you sit down. When you stop in the middle of something, the next session begins with momentum already built. Leave a sentence unfinished. Leave a paragraph half-written. Tomorrow you'll pick it up without the cold-start problem.

**The minimum viable writing day.** Define your minimum viable writing day — the smallest amount of writing that counts as "having written today." For most people this is between 100 and 300 words: about 3–5 minutes of actual output. This is the floor, not the goal. The goal is more. But having a floor means that on difficult days — days when you're sick, distracted, or exhausted — you can still show up, write your minimum, and preserve the streak. The minimum viable writing day is not a compromise. It is the foundation of a durable practice. The writers who finish books are almost never the ones who write 5,000 words on good days and nothing on bad days. They're the ones who write something every day.

**Track your sessions, not just your word count.** Word count is a useful metric but a bad master. Some days 200 words of real progress are worth more than 1,000 words of filler you'll have to cut in revision. Track whether you showed up. Track whether you stayed for the full session. Track whether you were present and working. The habit you're building is the habit of showing up. The words are a byproduct of that habit. As the habit becomes more stable, the quality and quantity of the words improve automatically — because a brain that writes every day gets better at writing, the same way a muscle that is exercised daily gets stronger.`,
        },
        {
          tag: "Philosophy",
          title: "Write to think, think to write",
          desc: "Why writing is not the output of thinking — it is the thinking itself. And what this means for how you work.",
          content: `**Writing is not the transcription of thought. It is thought.** This is the most important and least understood thing about the writing process. You do not first think clearly and then write clearly. You think by writing. The act of forming sentences forces a kind of precision that internal monologue never requires. When you think without writing, your ideas feel complete. When you write them down, you discover they weren't. The resistance you feel when you try to put a complex idea into words is not writer's block. It's the sensation of actually thinking. Welcome it. The resistance is the work.

**Why the blank page is a better thinking tool than any other.** There are many thinking tools: outlines, mind maps, conversations, research, walks. All of them are useful. None of them are as precise as the blank page. The reason is specificity. An outline can contain an idea without resolving it. A mind map can connect two concepts without explaining the connection. Only writing forces you to produce the actual sequence of words that constitutes a thought. The moment you try to write "The reason X is true is because..." you discover whether you actually know what follows "because." All other thinking tools allow comfortable vagueness. The page does not.

**The first draft of an idea is rarely the real idea.** Every writer knows the experience: you write your way into a subject, and somewhere in the third or fourth paragraph you write a sentence that surprises you. That sentence, the surprising one, is usually what you actually think. Everything before it was the approach, the clearing of the throat, the warm-up. This is why outlines are useful but not sufficient — they capture what you think you think. The draft reveals what you actually think. Write to find out. If you already knew what you were going to say before you wrote it, you probably had something less interesting to say.

**Writing reveals your real beliefs.** You can hold vague, internally contradictory opinions for years without noticing the contradictions, because vague thinking doesn't require resolution. The moment you try to write a clear argument, the contradictions surface. Writing forces the question: which do I actually believe? This is uncomfortable and necessary. Every serious writer discovers in the process of writing that their views on their subject are more complicated, more uncertain, and more interesting than they initially thought. The writing doesn't just express the thinking. It completes it.

**Use hypothesis and question blocks as thinking tools.** Before writing any major section, drop your unformed thoughts into hypothesis and question blocks. Don't try to be organized or coherent. Write: "I think this matters because..." and finish the sentence without knowing the answer. Write: "The thing I don't understand about this is..." and see what surfaces. These blocks are not for the reader — they are for you. They externalize your inchoate thinking so you can see it and work with it. The prose you write after this process will be cleaner and more direct because you've already done the thinking-in-circles phase in a space designed for it.

**The relationship between reading and writing.** Writers who read widely write better — not because they imitate what they read, but because reading builds a model of what's possible. Every time you read something that works, you expand your understanding of what writing can do: how it can move, how it can compress, how it can slow down, how it can be precise or oblique. This model operates largely below the level of conscious technique. It shapes your sense of when something is working and when it isn't. Read the writers who are doing what you want to do. Not to copy them, but to calibrate your own ear.

**Clarity in writing is the product of ruthless editing, not natural talent.** When you read a writer whose prose is crystalline and precise, you are seeing the result of multiple revisions. Clear writing is the result of caring enough to ask, for every sentence: is this the clearest possible way to say this? Most first drafts are not clear. They don't need to be. First drafts need to be honest — to capture the actual thought even if it's messy. Revision makes them clear. Do not confuse draft-quality prose with your ability to think or write. The draft is evidence that you showed up. The revision is evidence that you cared.

**What you write changes how you think.** This is the loop that serious writers discover: writing changes your mind. Not because writing is magical, but because the discipline of having to defend claims on the page, to find evidence, to anticipate objections, to organize arguments — these processes reshape the underlying thinking. People who write seriously about a subject understand it more deeply than people who merely study it. The writing is not reporting on the understanding. The writing produces it. This is why writing matters even when no one else will read it — especially then, because there is no external purpose to satisfy and the only thing happening is the thinking itself.`,
        },
      ],
    },
    apiGuide: {
      title: "What is an API key and how does it work?",
      subtitle: "A plain-English guide for non-technical users.",
      badge: "API key — what it is",
      heroTitle1: "Your personal pass",
      heroTitle2: "to the power of ChatGPT",
      heroDesc: "An API key is a password that lets apps use ChatGPT on your behalf. Moodra doesn't pay for AI — you control your own balance. That gives you full control and transparency.",
      analogyLabel: "Analogy:",
      analogy: "Think of Moodra as a coffee machine and OpenAI API as coffee. We give you the machine — you bring your own coffee. How much to brew is entirely your call. No markups, no subscription.",
      stepsTitle: "How to set up in 5 minutes",
      steps: [
        { title: "Create an OpenAI account", body: "Go to platform.openai.com and sign up. All you need is an email — a Google account works too.", linkLabel: "Open platform.openai.com →" },
        { title: "Add credit balance", body: "Under Billing → Add to credit balance, top up $5–10. That's enough for thousands of AI requests. You're only charged for what you use.", linkLabel: "Go to billing →" },
        { title: "Create an API key", body: "Under API Keys, click 'Create new secret key'. Give it any name, e.g. 'Moodra'. The key starts with sk- and looks like a long string.", linkLabel: "Create key →" },
        { title: "Add the key to Moodra", body: "Copy the key and paste it in your profile settings. Save it once — everything works automatically after that.", linkLabel: "Open settings →" },
      ],
      keyFormatTitle: "What a valid key looks like",
      keyFormatHint: "The key always starts with sk-. If you see something else — that's not it.",
      costsTitle: "How much does it cost",
      facts: [
        { title: "One request ≈ $0.0003", body: "gpt-4o-mini is OpenAI's most economical model. $5 lasts ~16 000 requests." },
        { title: "Key stays with you", body: "The key is stored encrypted and only used for your AI requests in Moodra." },
        { title: "Pay only for usage", body: "No subscriptions. Money is charged only when you click the AI button." },
      ],
      ctaTitle: "Ready to add your key?",
      ctaDesc: "Takes less than a minute. After that all AI features in Moodra become available.",
      ctaBtn: "Add key in settings",
      backToSettings: "Back to settings",
    },
    export: {
      title: "Export book",
      pdf: "Export as PDF",
      epub: "Export as EPUB",
      docx: "Export as Word (.docx)",
      generating: "Generating…",
      success: "Done! Download starting.",
    },
    layoutPanel: {
      title: "Book Layout",
      toc: "Table of Contents",
      pageSize: "Page Size",
      font: "Typeface",
      fontSize: "Font Size",
      lineHeight: "Line Spacing",
      margins: "Margins",
      narrow: "Narrow",
      normal: "Normal",
      wide: "Wide",
      spread: "Spread",
      single: "Single",
      exportWord: "Export to Word",
      headerLeft: "Chapter",
      noContent: "No chapters yet",
      page: "Page",
      serif: "Serif (Georgia)",
      sansSerif: "Sans-serif (Inter)",
      mono: "Monospace",
      compact: "Compact",
      relaxed: "Relaxed",
      spacious: "Spacious",
      structure: "Structure",
      titlePage: "Title Page",
      pageSettings: "Page",
      typography: "Typography",
      headingsSection: "Headings",
      headerFooter: "Header & Footer",
      format: "Format",
      marginTop: "Top",
      marginBottom: "Bottom",
      marginLeft: "Left",
      marginRight: "Right",
      paragraphIndent: "Paragraph indent",
      textDensity: "Page fill",
      firstLineIndent: "First-line indent",
      letterSpacing: "Letter spacing",
      alignment: "Alignment",
      chapterBreak: "Chapter page break",
      chapter_h1: "Chapter (H1)",
      section_h2: "Section (H2)",
      subsection_h3: "Subsection (H3)",
      pageHeader: "Page header",
      leftSide: "Left",
      rightSide: "Right",
      pageNumber: "Page number",
      bookTitleInFooter: "Book title",
      exportPdf: "Export PDF",
      exportDocx: "Export DOCX",
      exportBook: "Export Book",
      exportFormat: "Format",
      pdfNote: "PDF opens in a new tab. Use browser's Save as PDF.",
      exporting: "Preparing…",
      singlePage: "Single",
      bookSpread: "Spread",
      exportHint: "Opens print preview. Use Ctrl+P / Cmd+P to save as PDF.",
      layoutSettings: "Layout Settings",
      noChapters: "No chapters to display",
      chapters: "chapters",
      chapterLabel: "Chapter",
      tocHeading: "Table of Contents",
      leftPlaceholder: "Book title",
      rightPlaceholder: "Author",
      previewLabel: "Preview",
      fiction: "Fiction",
      nonFiction: "Non-Fiction",
      saved: "Saved",
      pageNumberAlign: "Number position",
      footerAlignLeft: "Left",
      footerAlignCenter: "Center",
      footerAlignRight: "Right",
      layoutPresets: "Layout Styles",
      presetClassic: "Classic",
      presetVibe: "Vibe",
      presetMono: "Mono",
      presetModern: "Modern",
      canvasMode: "Canvas",
      sheetMode: "Sheets",
      frontMatterSection: "Front Matter",
      tocLabel: "Table of Contents",
      fmTitlePage: "Title Page",
      fmUseBookTitle: "Use book title",
      fmCustomTitle: "Custom title",
      fmSubtitle: "Subtitle",
      fmSubtitlePlaceholder: "Optional subtitle",
      fmAuthor: "Author",
      fmPublisher: "Publisher",
      fmCity: "City",
      fmYear: "Year",
      fmDecoration: "Decoration",
      fmDecoNone: "None",
      fmDecoLines: "Lines",
      fmDecoOrnament: "Ornament ✦",
      fmCopyrightPage: "Copyright Page",
      fmCopyYear: "© Year",
      fmCopyHolder: "© Holder",
      fmCopyPublisher: "Publisher name",
      fmCopyAddress: "Address",
      fmCopyRights: "Rights notice",
      fmCopyEditor: "Editor",
      fmCoverDesigner: "Cover design",
      fmWebsite: "Website",
      fmDedicationPage: "Dedication Page",
      fmDedicationText: "Dedication text",
      fmDedicationPlaceholder: "For my parents…",
      fmVertPos: "Vertical position",
      fmVPosTop: "Top",
      fmVPosCenter: "Center",
      fmVPosBottom: "Bottom",
      fmBookAnnotation: "Book annotation (shared)",
      fmAnnotationPlaceholder: "Brief description shown on title/copyright pages…",
      fmShowAnnotation: "Show annotation",
      fmUseBookAuthor: "Use book author",
      fmTitlePresets: "Typography preset",
      fmPreset_classic: "Classic",
      fmPreset_minimal: "Minimal",
      fmPreset_modern: "Modern",
      fmPreset_bold: "Bold",
      fmTypography: "Typography",
      fmTitleFs: "Title pt",
      fmSubtitleFs: "Subtitle pt",
      fmAuthorFs: "Author pt",
      fmAnnotationFs: "Annot. pt",
      fmSpacing: "Spacing",
      fmLineHeight: "Line-h",
      fmAnnotationSource: "Pulled from book annotation field above",
      fmGenerateAnnotation: "Generate with AI",
      fmAnnotationPromptPlaceholder: "Describe your book briefly: genre, plot, atmosphere…",
      fmGenerateBtn: "✦ Generate annotation",
      fmGenerating: "Generating…",
      cpEditor: "Editor",
      cpCoverDesigner: "Cover design",
    },
    footer: {
      faq: "FAQ",
      apiGuide: "What is an API?",
      inspiration: "Platform Tips",
      codex: "Codex",
      habits: "Writing Habits",
      features: "Features",
      github: "GitHub",
      tagline: "For those who write from the heart.",
    },
    habits: {
      title: "Writing Habits",
      subtitle: "Your creative calendar. Every day you write is recorded here.",
      streakLabel: "day streak",
      goalLabel: "Goal",
      goalNone: "No goal set",
      goalWords: "words/day",
      goalChapters: "chapters/day",
      setGoal: "Set Goal",
      saveGoal: "Save",
      cancelGoal: "Cancel",
      goalType: "Goal type",
      goalAmount: "Daily target",
      words: "Words",
      chapters: "Chapters",
      noActivity: "No activity recorded this day.",
      addNote: "Add a note",
      planSession: "Plan a session",
      notePlaceholder: "What do you plan to write? Reflection on today's session...",
      save: "Save",
      totalDays: "Total writing days",
      longestStreak: "Best streak",
      monthActivity: "Activity this month",
      today: "Today",
      planned: "Planned",
      wrote: "Wrote",
      edited: "Edited",
      created: "Started new",
      noEntries: "No writing sessions recorded yet.",
      noEntriesHint: "Open any book and start writing — your activity will appear here.",
    },
    freeMode: {
      title: "Free AI Mode",
      badge: "Free",
      description: "Powered by open-source models. No API key required.",
      notAvailable: "Free AI is not available right now",
      retry: "Retry",
      switchToPaid: "Use my API key instead",
      rateLimit: "Free mode is rate-limited. Add your OpenAI key for unlimited access.",
      model: "Mistral 7B (open-source)",
      tip: "Free mode uses open-source AI. Results may vary from paid models.",
    },
    notFound: {
      phrases: [
        "This page wandered off mid-chapter.",
        "Looks like this page took a wrong turn.",
        "The page you're looking for has gone off to write its own story.",
        "404: Chapter not found.",
        "Even the best authors hit dead ends.",
      ],
      body: "The URL you followed doesn't exist, or the page was moved. Let's get you back somewhere useful.",
      backToBooks: "Back to my books",
      goBack: "Go back",
      footer: "© 2026 Moodra · For writers who mean it",
    },
    models: {
      back: "Back",
      title: "Choose your AI model",
      subtitle: "The model applies to all AI features in Moodra. Prices per",
      subtitleSuffix: ". Deducted directly from your balance.",
      cost: "Pricing",
      inputTokens: "Input tokens",
      outputTokens: "Output tokens",
      specs: "Characteristics",
      speed: "Speed",
      quality: "Quality",
      economy: "Economy",
      active: "Active",
      select: "Select",
      selected: "Selected",
      saving: "Saving...",
      modelChanged: "Model changed to",
      modelChangedDesc: "Applied to all AI functions",
      errorTitle: "Error",
      errorDesc: "Failed to save model",
      footnote: "Prices current at time of development. Check latest rates at",
    },
  },

  ru: {
    common: {
      save: "Сохранить",
      cancel: "Отмена",
      delete: "Удалить",
      close: "Закрыть",
      back: "Назад",
      loading: "Загрузка…",
      saving: "Сохранение…",
      or: "или",
      new: "Новый",
      edit: "Редактировать",
      add: "Добавить",
      remove: "Удалить",
      yes: "Да",
      no: "Нет",
      confirm: "Подтвердить",
      settings: "Настройки",
      language: "Язык",
    },
    nav: {
      home: "Мои книги",
      settings: "Настройки",
      logout: "Выйти",
      faq: "Вопросы и ответы",
      apiGuide: "Что такое API?",
      inspiration: "Советы",
      codex: "Кодекс",
      habits: "Привычки письма",
      models: "AI Модели",
    },
    editor: {
      editor: "Редактор",
      characters: "Персонажи",
      notes: "Заметки",
      research: "Исследования",
      board: "Доска идей",
      settings: "Настройки книги",
      layout: "Вёрстка",
    },
    login: {
      headline1: "Мысль, которая живёт",
      headline2: "заслуживает стать книгой.",
      subheadline: "Не нужно быть мудрым, чтобы чувствовать. Будь собой и следуй страсти — а всё остальное, от первого абзаца до готовой рукописи, поможет создать Moodra.",
      eyebrow: "ИИ-студия для писателей",
      signIn: "С возвращением",
      signInSub: "Один аккаунт. Все инструменты.\nВаши проекты ждут.",
      continueGoogle: "Войти через Google",
      terms: "Входя, вы принимаете условия использования.\nМы никогда не передаём ваши данные третьим сторонам.",
      footer: "Для тех, кто пишет сердцем",
      whatYouGet: "Что внутри",
      features: {
        editor: { title: "Пишите так, как думаете", desc: "Блоки, которые не мешают: заголовки, цитаты, выноски, таблицы — всё с клавиатуры." },
        ai: { title: "ИИ, который читает черновик", desc: "Продолжает прозу, развивает аргументы, переписывает абзацы. Контекст — не шаблон." },
        research: { title: "Источники становятся структурой", desc: "Привязывайте источники к главам, ведите гипотезы, управляйте библиографией." },
        ideas: { title: "Карта архитектуры книги", desc: "Перетаскивайте, соединяйте, расставляйте. Видьте связи между идеями до первой строки." },
      },
      highlights: [
        "Ваш ключ API, ваша модель — без наценки на ИИ",
        "Самохостинг: черновики не покидают ваш сервер",
        "Приватность по умолчанию, не декларативно",
        "Открытый код и долгосрочная поддержка",
      ],
    },
    home: {
      newBook: "Новая книга",
      myBooks: "Мои книги",
      fiction: "Художественная",
      scientific: "Нон-фикшн",
      emptyTitle: "Здесь будет ваша первая книга",
      emptyDesc: "Каждая великая книга начинается с одной строки. Создайте проект — и пусть ИИ помогает вам двигаться дальше.",
      emptyBtn: "Создать первую книгу",
      emptyTagline: "Редактор · ИИ-ассистент · Доска идей — всё готово",
      createTitle: "Новая книга",
      createName: "Название",
      createNamePlaceholder: "Моя следующая книга",
      createDesc: "Краткое описание",
      createDescPlaceholder: "О чём эта книга?",
      createMode: "Жанр",
      createCover: "Цвет обложки",
      createCoverImage: "Загрузить обложку",
      modeScientific: "Нон-фикшн",
      modeFiction: "Художественная",
      modeScientificSub: "Нон-фикшн · Исследования · Философия",
      modeFictionSub: "Роман · Фантастика · Фэнтези",
      deleteConfirm: "Удалить книгу?",
      deleteWarning: "Книга и все её главы будут удалены навсегда.",
      lastEdited: "Изменено",
    },
    settings: {
      title: "Настройки",
      profile: "Профиль",
      name: "Имя",
      email: "Email",
      aiKey: "OpenAI API",
      keyActive: "Ключ активен",
      keyMissing: "Ключ не задан",
      getKeyLink: "Как получить ключ?",
      replaceKey: "Заменить ключ",
      keyPlaceholder: "sk-…",
      saveKey: "Сохранить ключ",
      removeKey: "Удалить ключ",
      tokensUsed: "Расход токенов (gpt-4o-mini)",
      estimatedCost: "Примерная стоимость",
      language: "Язык интерфейса",
      languageDesc: "Ответы ИИ тоже будут на выбранном языке.",
      dangerZone: "Опасная зона",
      deleteAccount: "Удалить аккаунт",
      books: "Мои книги",
    },
    apiModal: {
      title: "Опа, похоже, кончилось топливо.",
      desc: "Moodra без подписки и совершенно бесплатен — но все нейросетевые функции работают через личный ключ OpenAI каждого пользователя отдельно, без скрытых комиссий. Твой ключ, твои расходы, полная прозрачность. Вероятно, на аккаунте закончились средства.",
      placeholder: "sk-…",
      save: "Сохранить и продолжить",
      skip: "Пропустить",
      getKey: "Получить ключ на platform.openai.com",
      guide: "Пошаговая инструкция по получению ключа",
      safeNote: "Ключ хранится зашифрованно и никуда не передаётся. Изменить в настройках в любой момент.",
    },
    aiError: {
      noKey: "API-ключ не задан",
      noKeyDesc: "Добавьте ключ OpenAI в Настройках, чтобы использовать ИИ-функции.",
      quota: "Упс, ИИ без топлива.",
      quotaDesc: "Moodra бесплатен — но ИИ работает на вашем личном ключе OpenAI. Похоже, баланс закончился. Пополните на platform.openai.com.",
      invalidKey: "Недействительный ключ",
      invalidKeyDesc: "Ключ, кажется, неверный. Проверьте его в Настройках.",
      goToSettings: "Открыть настройки",
      getKey: "Получить ключ",
    },
    faq: {
      title: "Вопросы и ответы",
      subtitle: "Всё, что нужно знать о Moodra.",
      items: [
        { q: "Moodra бесплатный?", a: "Да, платформа полностью бесплатна. ИИ-функции используют ваш личный API-ключ OpenAI — вы платите OpenAI напрямую по стандартным тарифам, без наценки с нашей стороны." },
        { q: "Что такое API-ключ OpenAI?", a: "Это персональный токен доступа, который позволяет использовать языковые модели OpenAI (например, GPT-4o-mini). Создаётся на platform.openai.com. Подписки нет — оплата за использование, и это очень дёшево." },
        { q: "Сколько стоит ИИ?", a: "GPT-4o-mini стоит примерно $0.30 за миллион токенов. Типичная сессия письма (несколько сотен слов) обходится в доли цента. Moodra отслеживает ваш расход, чтобы вы всегда знали сумму." },
        { q: "Мои тексты приватны?", a: "Да. Ваш текст хранится в вашей базе данных и передаётся OpenAI только когда вы явно используете ИИ-функцию. Мы не читаем, не анализируем и не передаём ваш контент." },
        { q: "Можно пользоваться Moodra без ИИ?", a: "Конечно. Блочный редактор, доска идей и все организационные инструменты работают без ключа API. ИИ — дополнение, а не обязательное условие." },
        { q: "Какие языки поддерживает Moodra?", a: "Интерфейс доступен на английском, русском, украинском и немецком. При выборе языка ИИ тоже будет отвечать на нём." },
        { q: "Можно экспортировать книгу?", a: "Да — из редактора книги доступен экспорт в PDF и EPUB. Оба формата сохраняют структуру глав и форматирование." },
        { q: "Moodra с открытым кодом?", a: "Да. Код открыт и поддерживает самохостинг — вы можете запустить его на своём сервере с собственной базой данных." },
      ],
    },
    inspiration: {
      title: "Советы платформы",
      subtitle: "Как писать лучше, думать глубже и использовать Moodra по максимуму.",
      readMin: "мин. чтения",
      articles: [
        {
          tag: "Начало работы",
          title: "Первая неделя с Moodra",
          desc: "Практическое руководство: настроить рабочее пространство, создать первую книгу и запустить ИИ в работу с первого дня.",
          content: `**Начните со структуры, а не с пустой страницы.** Пустая страница пугает, потому что требует слишком многого. Она говорит: начинайте где угодно, всё возможно, ничего не решено. Структура снимает это давление. Создайте книгу, добавьте 3–5 названий глав, даже если они приблизительные: «Часть 1: Проблема», «Глава 3: Что все понимают неправильно». Эти названия не должны быть финальными. Они просто должны существовать. Структура убивает прокрастинацию, потому что превращает вопрос «с чего начать?» в «что здесь написать?».

**Первый день: создайте книгу и выберите режим.** При создании новой книги в Moodra вы выбираете между режимами Нон-фикшн и Художественная. Это не косметика — это меняет поведение ИИ, доступные типы блоков и логику организации. Для нон-фикшн аргументации выбирайте Нон-фикшн. Для нарратива — художественное, мемуары, эссе. Добавьте хотя бы одно описательное предложение: что это за книга. Написание описания заставляет вас сформулировать, что вы на самом деле строите.

**Используйте ИИ для продолжения, а не для написания.** Лучший результат — когда вы пишете абзац сами, а потом просите ИИ продолжить. Это не лень — это рычаг. Когда вы пишете зерно, ИИ расширяет его в вашем голосе. Когда вы просите ИИ «написать главу о X», вы получаете нечто технически компетентное и совершенно безликое. Разница — в авторстве. Написанный вами абзац несёт вашу точку зрения. ИИ может вырастить её. Создать — нет.

**Второй день: настройте главы до того, как заполнять их.** Создайте все главы, которые может понадобиться книге. Назовите их, даже плохо. «Ключевой аргумент», «Почему это важно», «Часть, где всё рассыпается» — это рабочие названия, не обязательства. Создайте хотя бы пять. Затем напишите одно предложение в каждой: чего эта глава должна добиться? Это и есть самое ценное, что можно написать до начала настоящей работы.

**Доска идей — черновой лист перед страницей.** Перед написанием любой главы проведите 10 минут на Доске идей. Добавьте карточки для сцен, аргументов, вопросов, персонажей. Соедините их линиями. Вам не нужен план — нужна карта территории. Писать в карту в 3 раза легче, чем в ничто. Доска выносит мышление наружу, чтобы письмо могло сосредоточиться на выражении, а не на открытии.

**Третий день: первая настоящая сессия письма.** Включите Таймер фокуса в заголовке редактора. Установите 25 минут. Откройте первую главу. Пишите без остановки — даже если то, что вы пишете, плохо. Плохое письмо — сырьё. Молчание — нет. После сигнала прочитайте написанное. Не редактируйте пока. Заметьте, какие предложения вас удивили. Эти сюрпризы — обычно то, где ваше настоящее мышление.

**Ставьте скромную цель и защищайте её.** Редактор показывает счётчик слов в реальном времени. Не ставьте цель 2000 слов и не чувствуйте себя раздавленным, написав 300. Поставьте цель 300 — и чувствуйте себя впереди, написав 500. Психологическая разница огромна. Автор, который пишет 300 слов каждый день год, имеет 109 000 слов. Это книга. Автор, который пишет 2000 слов на вдохновении и ничего без него, имеет папку фрагментов.

**Не путайте организацию с письмом.** Одна из самых соблазнительных ловушек — тратить время письма на реорганизацию глав, переименование и перемещение блоков. Это ощущается как продуктивность. Это не она. Только слова на странице продвигают книгу вперёд. Используйте первые 5 минут каждой сессии для письма. Слова первыми, структура второй.`,
        },
        {
          tag: "ИИ-workflow",
          title: "Как использовать ИИ, не теряя свой голос",
          desc: "ИИ — соавтор, а не спичрайтер. Как оставаться хозяином книги, давая ИИ делать тяжёлую работу.",
          content: `**Правило №1: вы пишете зерно, ИИ выращивает его.** Самое важное в ИИ-письме: он отражает, а не создаёт. Напечатайте первое предложение абзаца — даже грубую идею, даже фрагмент. Затем нажмите «Продолжить». Результат продолжит ваше направление, а не заменит его. Когда вы даёте ИИ предложение, вы даёте ему ограничения: ваш словарь, ваш угол, ваш уровень абстракции. Он отвечает в этих ограничениях. Когда вы даёте ему тему и ничего больше — вы получаете среднее из всего, что когда-либо было написано на эту тему. Среднее — не то, что вам нужно.

**Три уровня ИИ-помощи в письме.** ИИ-помощь существует в спектре. Уровень один: продолжение — вы пишете предложение и просите ИИ закончить абзац. Самый безопасный. Уровень два: расширение — вы пишете законченную мысль и просите ИИ развить её примерами и глубиной. Самый продуктивный. Уровень три: генерация — вы даёте ИИ тему с нуля. Самый опасный для сохранения голоса. Используйте первые два как стандарт. Третий — только для черновиков, которые вы намерены полностью переписать.

**«Развить мысль» — для тезисов, которые не знаете как расширить.** Это особенно мощно для нон-фикшн. Вы написали: «Большинство людей не достигают X не из-за нехватки информации, а из-за отсутствия обратной связи». Вы в это верите. Вы не знаете, как это поддержать. «Развить мысль» добавит структуру: под-утверждения, примеры, различия, возможные возражения. Это не письмо аргумента вместо вас — это показ того, что аргумент мог бы содержать. Потом вы решаете, что ваше, что почти правильное, что выбросить.

**Проанализируйте стиль перед генерацией чего-либо существенного.** Панель ИИ может прочитать ваши главы и откалибровать свой голос перед тем, как написать ещё слово. Это не косметика. Голос — это разница между книгой и документом. Если вы написали три главы и хотите помощи ИИ в четвёртой, дайте ему прочитать первые три. Длина ваших предложений, ваш уровень формальности — эти паттерны становятся шаблоном для следующего.

**Красные флаги того, что ИИ перехватил управление.** Обращайте внимание: в выводе слишком много пассивного залога. Все предложения одинаковой длины. Нет вопросов. Всё утверждается, а не аргументируется. Абзац звучит как уверенная, немного скучная журнальная статья на любую тему. Когда вы видите эти признаки — остановитесь. Вернитесь к последнему лично написанному предложению и начните заново оттуда.

**Никогда не принимайте первую генерацию.** Относитесь к любому выводу ИИ как к первому черновику — лучше, чем ничто, никогда не достаточно хорошо. Прочитайте. Отметьте действительно сильные предложения. Удалите те, что звучат обобщённо. Перепишите остальное своими словами. В итоге у вас абзац с вашей структурой и голосом, но собранный быстрее, чем вы могли построить его в одиночку.

**Используйте ИИ для исследований и контраргументов, а не только для прозы.** Панель исследований ИИ особенно сильна для нон-фикшн. Попросите сгенерировать контраргументы к вашей гипотезе. Попросите объяснить концепцию простыми словами, чтобы потом изложить её своими. Это не жульничество — так работает любой исследователь с источниками. Разница в том, что синтезируете, аргументируете и заключаете вы.

**Тест аутентичного письма с ИИ.** Когда закончите главу с ИИ-помощью, прочитайте вслух. Каждое предложение, которое заставляет вас морщиться, которое не звучит как вы — это предложение, написанное ИИ, которое вы не ассимилировали. Либо вырежьте, либо перепишите, пока не зазвучит как вы. Цель не в том, чтобы скрыть участие ИИ. Цель — создать текст, который действительно ваш.`,
        },
        {
          tag: "Глубокая работа",
          title: "Поток в эпоху отвлечений",
          desc: "Среда и ритуалы, которые помогают достичь глубокой концентрации — и дописать то, что начали.",
          content: `**Глубокая работа — не роскошь, а единственная работа, создающая книги.** Поверхностная работа — это письма, браузинг, ответы, организация. Она ощущается как занятость. Она не создаёт ничего долговечного. Книга требует держать в голове целый мир: аргумент, который вы строите, персонажей, за которыми следите, структуру, которую поддерживаете. Такое когнитивное удержание требует продолжительного, непрерывного времени. Вы не можете написать книгу 10-минутными спринтами. Электронное письмо — да. Знайте, в каком режиме вам нужно быть.

**Нейронаука творческого погружения.** Когда вы входите в глубокую концентрацию, мозг переключается с режима по умолчанию (блуждание, планирование, тревога) на целеориентированную сеть. Этот переход занимает время — обычно 15–20 минут устойчивого внимания, прежде чем достигается настоящая глубина. Каждое прерывание сбрасывает счётчик. Вот почему двухчасовой блок с одним перерывом — не то же самое, что два часовых блока. Прерывание стоит вам не только потерянных минут, но и глубины, которой вы достигли. Защищайте блоки глубокой работы как невозобновляемый ресурс.

**Используйте режим глубокого письма, когда нужно исчезнуть в работе.** Режим изоляции Moodra скрывает всё, кроме текста и названия главы. Никаких боковых панелей, никаких мигающих счётчиков слов. Нажмите Escape для выхода. Многие авторы говорят, что сам акт входа в этот режим — визуальное изменение, исчезновение беспорядка — достаточен для переключения ментальных режимов. Ваша среда формирует поведение. Чистая среда сигнализирует: это время работы.

**Проектируйте среду до сессии, не во время.** Экологический дизайн находится выше мотивации. Закрыть почту занимает 10 секунд до начала. Сделать это во время письма стоит 10 секунд плюс когнитивная цена прерывания. Перед каждой сессией: закройте все вкладки кроме Moodra, заглушите телефон, подготовьте напиток, включите нужную музыку или тишину. Это не ритуалы ради ритуалов. Это устранение решений и трений до начала сессии.

**Пишите до того, как исследуете.** Это контринтуитивно, но критически важно. Вы, вероятно, считаете, что нужно исследовать перед написанием. Это почти всегда неверно. Вам нужно писать, пока не обнаружите, чего не знаете, затем исследовать это конкретное. Авторы, исследующие перед письмом, часто создают исчерпывающие записи, которые никогда не становятся прозой. Авторы, пишущие первыми, создают черновики с пробелами — пробелами, которые потом заполняют.

**Правило 25 минут — о разрешении, а не о продолжительности.** Таймер — это обещание себе: 25 минут только письмо. Никаких проверок, никаких переключений. Сила таймера не в интервале — в обязательстве. Когда вы знаете, что писать нужно всего 25 минут, начинать легко. Таймер заменяет открытый ужас «я должен писать сегодня» на «я должен писать 25 минут». Первое бесконечно. Второе переживаемо. Используйте встроенный Таймер фокуса Moodra.

**Защищайте время восстановления.** Глубокая работа истощает специфические когнитивные ресурсы. После 90 минут настоящей глубокой работы большинство авторов приближается к пределу продуктивного вывода. Попытка продавить это истощение не даёт больше работы. Она даёт слова, которые будут вырезаны при редактировании. Запланируйте блоки по максимум 90 минут, затем нечто по-настоящему восстанавливающее: прогулка, еда, движение.

**Отслеживайте часы глубокой работы, а не только счётчик слов.** Счётчик слов — соблазнительный показатель, потому что он видим. Но он измеряет вывод, а не усилие. День, когда вы написали 200 слов чего-то действительно трудного и важного, мог создать больше ценности, чем день с 1200 словами заполнителя. Отслеживайте часы. Слова последуют.`,
        },
        {
          tag: "Нон-фикшн",
          title: "Система гипотез в исследовательской работе",
          desc: "Как исследователи и авторы нон-фикшн используют инструменты отслеживания доказательств для построения строгих аргументов.",
          content: `**Гипотезы — это архитектура нон-фикшн.** Гипотеза — не догадка. Это утверждение, которое вы обязуетесь доказать. Для каждой главы, до первого слова прозы, запишите центральную гипотезу: «Эта глава утверждает, что X потому что Y». Добавьте под-гипотезы для каждого крупного раздела. Это принуждает к ясности. Часто в акте написания гипотезы вы обнаружите, что ещё не знаете, во что верите. Это открытие — болезненное — самая ценная вещь, которая может случиться до начала письма.

**Анатомия сильной гипотезы.** Сильная гипотеза имеет три компонента: утверждение, механизм и область применения. Утверждение — что вы заявляете. Механизм — почему это правда. Область — границы применимости. «Люди не достигают привычек» — не гипотеза, а расплывчатое наблюдение. «Люди не достигают привычек прежде всего потому, что проектируют их вокруг мотивации, а не среды» — гипотеза: конкретное утверждение с механизмом. Пишите гипотезы на этом уровне конкретности.

**Аргументы и контраргументы принадлежат вместе.** Для каждой гипотезы добавьте хотя бы один сильный контраргумент. Не слабое чучело — самую сильную версию противоположной точки зрения. Затем ответьте на него. Это не риторическое упражнение. Именно так вы обнаруживаете, действительно ли аргумент звучит. Гипотеза, не выдерживающая лучшего контраргумента, нуждается в пересмотре, а не скрытии. Читатели найдут контраргумент, даже если вы его не включите.

**Привязывайте каждый источник к поддерживаемым главам.** Панель исследований Moodra позволяет прикреплять источники к конкретным главам. Это решает реальную проблему: вы прочитали пятьдесят статей, но в Главе 6 не помните, в какой была ключевая статистика. Связь источник-глава создаёт живую библиографию, которая показывает вам в момент письма, какие доказательства доступны для утверждения.

**Используйте ИИ для генерации контраргументов, которых вы избегаете.** У всех нас есть аргументы, в которые мы верим настолько, что инстинктивно отвергаем оппозицию. Попросите ИИ сгенерировать контраргументы к вашей гипотезе. Читайте внимательно. Если какие-то лучше, чем вы ожидали — это информация, которая вам нужна. Хороший контраргумент, который вы не рассматривали, — не проблема. Это подарок. Он делает финальный аргумент сильнее.

**Разница между утверждением и наблюдением.** Большинство нон-фикшн черновиков полны наблюдений, маскирующихся под аргументы. «Многие авторы борются с прокрастинацией» — наблюдение. «Авторы прокрастинируют прежде всего потому, что установили невозможно высокие стандарты для своего вывода» — утверждение. Наблюдения не нужно доказывать. Утверждения нужно. Чем больше книга строится на утверждениях, а не наблюдениях, тем больше аргументативной энергии в ней будет.

**Соотношение исследования и письма должно быть 1:3.** Распространённая ошибка — слишком много времени на сбор доказательств, слишком мало на письмо. Стремитесь к одному часу исследования на три часа письма. Исследуйте на границе того, что вам нужно; пишите столько, сколько позволяют знания. Письмо обнаружит, что ещё нужно исследовать. Этот ритм производит больше законченной прозы.

**Постройте карту аргументов до написания заключения.** Авторы нон-фикшн часто оставляют заключение напоследок и обнаруживают, что главы не поддерживают единую мысль. Напишите черновик заключения до окончания книги. Затем проверьте, действительно ли каждая глава вносит вклад. Если глава не поддерживает заключение — либо глава нуждается в изменении, либо заключение.`,
        },
        {
          tag: "Художественное",
          title: "Персонажи, которые живут",
          desc: "Как создать героев с настоящей психологией, внутренними противоречиями и желаниями — чтобы читатель им верил.",
          content: `**Персонаж — это система желания и препятствия.** Снимите все описания, предысторию, черты — и останется: чего хочет этот человек и что стоит между ним и этим? Это двигатель. Всё остальное — характеристика, наложенная поверх двигателя. Когда сцена ощущается плоской, обычно это потому, что желание персонажа исчезло из неё. Верните его — и сцена оживёт. Сцена важна только потому, что персонаж с конкретным желанием движется сквозь неё.

**Три уровня желания персонажа.** Желание действует на трёх уровнях одновременно. Поверхностное желание: что персонаж говорит, что хочет. Желание истории: что персонажу действительно нужно. Скрытое желание: чего персонаж тайно хочет, но не может признать. Самые захватывающие персонажи держат все три — и они часто в конфликте. Персонаж, знающий точно, что хочет, и получающий это без осложнений, — неинтересен. Персонаж, желающий одного, нуждающийся в другом и тайно боящийся третьего — это личность.

**Дайте каждому персонажу личную логику — даже если она неверна.** Персонаж должен иметь смысл изнутри. Ему не нужно быть правым или симпатичным. Но ему нужно вести себя согласно последовательной внутренней логике, основанной на убеждениях, желаниях и страхах. Когда персонаж делает что-то удобное для сюжета, но несовместимое с психологией, читатели чувствуют это как предательство. Персонаж должен делать то, что он сделал бы, а не то, что вам нужно от него.

**Противоречие делает персонажа правдоподобным.** Реальные люди теплы и жестоки, принципиальны и компромиссны, смелы и трусливы — часто в одно послеполудни. Персонаж, который полностью один, — не человек. Это символ. Самые захватывающие персонажи держат противоречия без разрешения: идеалист, лично беспощадный; циник, тайно нежный. Не разрешайте эти противоречия в планировании. Пусть история создаёт на них давление и посмотрите, куда они сломаются.

**Голос — это персонаж.** То, как человек говорит — ритмы, словарь, конкретные слова, которых он избегает — раскрывает о нём больше, чем любое описание. Прежде чем писать важный персонаж с диалогом, потратьте 20 минут на письмо от его лица без истории: тирада, исповедь, письмо кому-то, кого он боится. Не используйте это в книге. Используйте для калибровки голоса.

**База данных персонажей — ваша память, чтобы сфокусироваться на сцене.** Когда вы пишете сцену конфронтации, вы не должны прокручивать ранние главы, чтобы вспомнить цвет глаз кого-то, имя мёртвого брата или конкретную фразу из Главы 2. Занесите это в базу. Перед любой важной сценой с персонажем перечитайте его запись. Затем закройте базу и пишите по памяти — как общаетесь с кем-то, кого знаете.

**Второстепенные персонажи нуждаются в своих желаниях.** Одна из распространённых ошибок — второстепенные персонажи, существующие только в отношении к главному. У них нет независимой внутренней жизни. Читатель это чувствует. Дайте каждому персонажу, появляющемуся в более чем двух сценах, желание, не связанное с протагонистом. Они могут преследовать его за кадром. Просто чувство, что мир продолжает жить, когда камера отворачивается.

**Напишите сцену, которой боитесь.** У каждой истории есть сцена, которую автор избегает. Конфронтация. Объяснение. Смерть. Момент, когда персонаж должен сказать то, что не может. Эти избегаемые сцены обычно самые важные — вот почему их избегают. Пишите их всё равно. Черновику не нужно быть хорошим. Ему нужно существовать. Плохая версия правильной сцены редактируется гораздо легче, чем хорошая версия неправильной.`,
        },
        {
          tag: "Процесс",
          title: "От черновика до готовой книги",
          desc: "Редактирование, которое большинство авторов пропускают — и почему настоящее письмо начинается после первого черновика.",
          content: `**Первый черновик не должен быть хорошим.** Это самое важное в письме и самое трудное для понимания. Первый черновик — процесс мышления, а не письма. Вы открываете для себя, во что верите, что нужно истории, каков аргумент на самом деле. Это невозможно знать заранее — только найти через письмо. Поэтому работа первого черновика — не быть читабельным. Его работа — существовать, чтобы было с чем работать. Пишите быстро, не оглядываясь назад, мимо сцен и разделов, которые ненавидите. Пустую страницу нельзя отредактировать. Плохой черновик — можно.

**Разрешение, которое нужно дать себе.** Большинство авторов не заканчивают черновики не потому что заблокированы, а потому что редактируют во время письма. Это письмо и редактирование одновременно, и это разрушает импульс, который нужен черновикам. Решение — разрешение: разрешение писать плохо. Вы единственный, кто увидит этот черновик. Ваш будущий читатель не смотрит через плечо. Черновику не нужно быть хорошим. Ему нужно быть честным — захватить реальное мышление, даже спутанное.

**Дистанция перед правкой — не опция.** Вы никогда не увидите черновик ясно сразу после написания. Вы видите то, что намеревались написать, а не то, что написали. Оставьте хотя бы неделю между окончанием черновика и началом правки. Лучше больше. Когда вернётесь, будете читать предложения, в которые не верите, что написали их — потому что человек, вернувшийся через неделю, и человек, их написавший, — немного разные люди. Вам нужна эта дистанция, чтобы читать свою работу как читатель, не как автор.

**Редактируйте проходами — структура, затем проза, затем слова.** Большинство редактирований терпят неудачу, потому что пытаются делать слишком много одновременно. Проход первый: читайте только для структуры. Аргумент держится? История движется вперёд? Есть ли избыточные главы, пропущенные переходы? Исправьте структуру до прозы — красивое предложение не на своём месте всё равно не на своём месте. Проход второй: проза. Каждый ли абзац зарабатывает своё место? Проход третий: слова. Это правильное слово или просто приемлемое? Один проход за раз.

**Структурное редактирование — самое важное и самое пропускаемое.** Авторы, только что закончившие черновик, истощены и довольны. Инстинкт — очистить его на уровне предложений. Это почти всегда ошибка. Структурные проблемы нельзя исправить красивой прозой. Глава, которой не должно быть, становится красивее, но всё равно не должна быть. Сначала делайте структурное редактирование, даже если это означает удаление 10 000 слов хорошей прозы, которая принадлежит форме, которой книга больше не имеет.

**Режьте больше, чем думаете нужным.** Средний черновик на 20–30% длиннее, чем нужно. Это не потому, что авторы многословны — это потому что письмо является мышлением, а мышление часто повторяется. Вы делаете одно и то же замечание дважды. Вы подходите к идее с трёх сторон и включаете все три, хотя достаточно двух. При сомнении — режьте. Книга, оставляющая читателя желать большего, почти всегда мощнее той, что даёт всё.

**Получите обратную связь до финальной полировки.** Большинство авторов делятся работой слишком поздно — после обширного редактирования, когда привязаны к каждому предложению. Делитесь раньше: после структурного черновика. Задавайте конкретные вопросы: аргумент понятен? История движется? Где вы потеряли интерес? Обратная связь о структуре — это действенно. Обратная связь об отполированной прозе часто требует вырезать вещи, которые вы неделями совершенствовали.

**Последние 10% занимают 50% времени.** Это не провал эффективности — это природа работы. Последний проход через рукопись — когда вы пытаетесь сделать каждое предложение правдивым. Не просто правильным, не просто ясным, а правдивым тому, что вы имеете в виду. Эта точность медленная и трудная, и необходимая. Закладывайте на неё бюджет. Читатель никогда не узнает, сколько времени заняло отдельное предложение. Но почувствует разницу между пришедшим предложением и тем, на которое согласились.`,
        },
        {
          tag: "Привычка",
          title: "Привычка писать, которая работает",
          desc: "Забудьте про вдохновение. Вот система, которая позволяет дописывать книги — сессия за сессией, слово за словом.",
          content: `**Вдохновение — побочный эффект явки, а не предпосылка.** Авторы, ждущие вдохновения, не пишут книги. Авторы, пишущие независимо от вдохновения, — пишут. Это не потому что они дисциплинированнее или талантливее. Это потому что они понимают природу творческой работы: хорошие идеи приходят во время письма, а не до него. Акт письма производит идеи, стоящие внимания. Явитесь. Пишите плохо десять минут. Что-то зацепит. Всегда.

**Нейронаука письменных привычек.** Привычки работают, создавая нейронные пути, которые становятся всё более автоматическими с повторением. Когда вы пишете в одно время, в одном месте, с одним вступительным ритуалом, мозг начинает входить в состояние письма до написания — потому что экологические сигналы стали надёжным предсказателем. Это петля сигнал-рутина-награда, управляющая формированием привычки. Вы не строите силу воли. Вы строите условный рефлекс. Сила воли истощается. Условные рефлексы — нет.

**Пишите в одно время, в одном месте, каждый день.** Ваш мозг реагирует на контекстные сигналы. Когда вы сидите в одном кресле, с тем же напитком, в то же время дня и открываете то же приложение, мозг начинает готовиться к письму до слова. Петля сигнал-рутина-награда, повторённая достаточно раз, делает начало автоматическим, а не требующим усилий. Вы строите рефлекс письма. Это занимает недели. Это длится годами.

**Снизьте планку для начала. Поднимите её для остановки.** Скажите себе: мне нужно написать только одно предложение. Один абзац. Один ужасный блок текста. Планка для начала должна быть настолько низкой, что отказ писать кажется абсурдным. Почти всегда вы напишете намного больше. Трудная часть — не письмо. Трудная часть — открыть документ. Когда он открыт и вы набрали одно предложение, инерция берёт верх.

**Защищайте серию важнее счётчика слов.** Пропустить один день письма — небольшая вещь. Пропустить два дня — начало изменения привычки. Пропустить неделю — конец привычки. Серия — непрерывная цепь дней письма — ценнее, чем любая одна высокопродуктивная сессия. День, когда вы пишете 50 посредственных слов, лучше, чем день, когда вы не пишете ничего. Не потому что 50 слов впечатляет, а потому что вы явились — и явиться завтра будет чуть легче. Moodra отслеживает это за вас.

**Заканчивайте сессию до того, как опустеете.** Остановитесь, когда ещё знаете, что будет дальше. Эта техника, приписываемая Хемингуэю, — один из самых надёжных способов сделать следующий день лёгким. Когда пишете, пока полностью не иссякнете, вы встречаете пустоту в следующий раз. Когда останавливаетесь на середине — следующая сессия начинается с уже встроенным импульсом. Оставьте предложение незаконченным. Оставьте абзац наполовину написанным.

**Минимально жизнеспособный день письма.** Определите свой минимальный жизнеспособный день письма — наименьшее количество, считающееся «я написал сегодня». Для большинства — 100–300 слов: около 3–5 минут реального вывода. Это пол, а не цель. Наличие пола означает, что в трудные дни — когда вы больны, отвлечены или истощены — вы всё равно можете явиться, написать минимум и сохранить серию. Авторы, заканчивающие книги, почти никогда не те, кто пишет 5000 слов в хорошие дни и ничего — в плохие. Это те, кто пишет что-то каждый день.

**Отслеживайте сессии, а не только слова.** Счётчик слов — полезный показатель, но плохой хозяин. Некоторые дни 200 слов реального прогресса ценнее 1000 заполнителя, который вырежете при редактировании. Отслеживайте, явились ли вы. Привычка, которую строите, — привычка являться. Слова — побочный продукт. По мере стабилизации привычки качество и количество слов улучшаются автоматически.`,
        },
        {
          tag: "Философия",
          title: "Писать, чтобы думать",
          desc: "Почему письмо — это не результат мышления, а само мышление. И что это значит для вашей работы.",
          content: `**Письмо — не транскрипция мысли. Письмо — это и есть мысль.** Это самое важное и наименее понимаемое в процессе письма. Вы не думаете сначала ясно, затем пишете ясно. Вы думаете — через письмо. Акт формирования предложений принуждает к точности, которой внутренний монолог никогда не требует. Когда вы думаете без письма, ваши идеи ощущаются завершёнными. Когда вы записываете их, обнаруживаете, что они не были таковыми. Сопротивление при попытке вложить сложную идею в слова — не писательский блок. Это ощущение самого мышления. Приветствуйте его.

**Почему пустая страница лучший инструмент мышления.** Есть много инструментов мышления: схемы, карты мыслей, разговоры, исследования, прогулки. Все они полезны. Ни один не так точен, как пустая страница. Причина — специфика. Схема может содержать идею, не разрешая её. Карта мыслей может соединять концепции, не объясняя связь. Только письмо принуждает создавать реальную последовательность слов, составляющих мысль. Как только вы пишете «Причина, по которой X верно, потому что...» — вы обнаруживаете, знаете ли вы, что следует за «потому что». Другие инструменты мышления позволяют удобную расплывчатость. Страница — нет.

**Первый черновик идеи редко является настоящей идеей.** Каждый автор знает этот опыт: вы пишете к теме, и где-то в третьем-четвёртом абзаце пишете предложение, которое вас удивляет. Это удивившее предложение — обычно то, что вы на самом деле думаете. Всё до него было подходом, прочисткой горла, разминкой. Вот почему схемы полезны, но недостаточны — они захватывают то, что вы думаете, что думаете. Черновик раскрывает то, что вы думаете на самом деле. Пишите, чтобы узнать.

**Письмо обнажает настоящие убеждения.** Вы можете держать расплывчатые, внутренне противоречивые мнения годами, не замечая противоречий, потому что расплывчатое мышление не требует разрешения. Как только вы пытаетесь написать ясный аргумент, противоречия всплывают. Письмо ставит вопрос: во что я на самом деле верю? Это некомфортно и необходимо. Каждый серьёзный автор обнаруживает в процессе, что его взгляды сложнее, неопределённее и интереснее, чем он первоначально думал.

**Используйте блоки гипотез и вопросов как инструменты мышления.** Перед написанием любого крупного раздела выгрузите несформированные мысли в блоки гипотез и вопросов. Не пытайтесь быть организованным. Пишите: «Я думаю, это важно, потому что...» и заканчивайте предложение, не зная ответа. Пишите: «То, что я не понимаю в этом, — это...» и смотрите, что всплывёт. Эти блоки не для читателя. Они для вас. Они выносят смутное мышление наружу, чтобы вы могли работать с ним.

**Связь между чтением и письмом.** Авторы, читающие широко, пишут лучше — не потому что подражают прочитанному, а потому что чтение строит модель возможного. Каждый раз, читая что-то работающее, вы расширяете понимание, что письмо может делать: как оно может двигаться, сжимать, замедляться, быть точным. Эта модель работает ниже уровня сознательной техники. Она формирует чувство, когда что-то работает, а когда нет. Читайте авторов, делающих то, что хотите делать вы.

**Ясность в письме — продукт беспощадного редактирования, не природного таланта.** Когда вы читаете автора с кристальной прозой, вы видите результат многочисленных правок. Ясное письмо — результат заботы спрашивать о каждом предложении: это самый ясный возможный способ сказать это? Первые черновики не ясны. Им не нужно быть. Первые черновики должны быть честными. Правка делает их ясными. Не путайте прозу черновика со способностью думать или писать.

**То, что вы пишете, меняет то, как вы думаете.** Это петля, которую серьёзные авторы открывают: письмо меняет ваш разум. Не потому что письмо магично, а потому что дисциплина защиты утверждений на странице, поиска доказательств, предвидения возражений — эти процессы перестраивают мышление. Люди, серьёзно пишущие на тему, понимают её глубже людей, просто изучающих её. Письмо производит понимание. Вот почему письмо важно, даже когда — особенно когда — никто другой его не прочитает.`,
        },
      ],
    },
    apiGuide: {
      title: "Что такое API-ключ и как он работает?",
      subtitle: "Простое объяснение для тех, кто не разбирается в технологиях.",
      badge: "API-ключ — что это такое",
      heroTitle1: "Ваш личный пропуск",
      heroTitle2: "к мощи ChatGPT",
      heroDesc: "API-ключ — это пароль, который позволяет приложениям использовать ChatGPT от вашего имени. Moodra не платит за AI — вы сами управляете своим балансом. Это даёт полный контроль и прозрачность.",
      analogyLabel: "Аналогия:",
      analogy: "Представьте Moodra как кофемашину, а OpenAI API как кофе. Мы даём вам машину — вы приносите свой кофе. Сколько заварить — решаете только вы. Никаких наценок, никакой подписки.",
      stepsTitle: "Как настроить за 5 минут",
      steps: [
        { title: "Создайте аккаунт на OpenAI", body: "Перейдите на platform.openai.com и зарегистрируйтесь. Нужен только email — Google аккаунт тоже подойдёт.", linkLabel: "Открыть platform.openai.com →" },
        { title: "Пополните баланс", body: "В разделе Billing → Add to credit balance добавьте $5–10. Этого хватит на тысячи AI-запросов. Списание происходит только по факту использования.", linkLabel: "Перейти к пополнению →" },
        { title: "Создайте API-ключ", body: "В разделе API Keys нажмите «Create new secret key». Дайте ему любое название, например «Moodra». Ключ начинается с sk- и выглядит как длинная строка.", linkLabel: "Создать ключ →" },
        { title: "Добавьте ключ в Moodra", body: "Скопируйте ключ и вставьте его в настройках вашего профиля. Ключ сохраняется один раз — дальше всё работает автоматически.", linkLabel: "Открыть настройки →" },
      ],
      keyFormatTitle: "Как выглядит правильный ключ",
      keyFormatHint: "Ключ всегда начинается с sk-. Если видите что-то другое — это не то.",
      costsTitle: "Сколько это стоит",
      facts: [
        { title: "Один запрос ≈ $0.0003", body: "gpt-4o-mini — самая экономичная модель OpenAI. $5 хватает на ~16 000 запросов." },
        { title: "Ключ только у вас", body: "Ключ хранится зашифрованно и используется только для ваших AI-запросов в Moodra." },
        { title: "Платите только за использование", body: "Никаких подписок. Деньги списываются только когда вы нажимаете кнопку AI." },
      ],
      ctaTitle: "Готовы добавить ключ?",
      ctaDesc: "Займёт меньше минуты. После этого все AI-функции Moodra станут доступны.",
      ctaBtn: "Добавить ключ в настройках",
      backToSettings: "Назад в настройки",
    },
    export: {
      title: "Экспорт книги",
      pdf: "Экспорт в PDF",
      epub: "Экспорт в EPUB",
      docx: "Экспорт в Word (.docx)",
      generating: "Генерация…",
      success: "Готово! Начинается загрузка.",
    },
    layoutPanel: {
      title: "Вёрстка книги",
      toc: "Содержание",
      pageSize: "Формат страницы",
      font: "Шрифт",
      fontSize: "Размер шрифта",
      lineHeight: "Межстрочный интервал",
      margins: "Поля",
      narrow: "Узкие",
      normal: "Обычные",
      wide: "Широкие",
      spread: "Разворот",
      single: "Одна страница",
      exportWord: "Экспорт в Word",
      headerLeft: "Глава",
      noContent: "Нет глав",
      page: "Стр.",
      serif: "Сериф (Georgia)",
      sansSerif: "Без сериф (Inter)",
      mono: "Моноширинный",
      compact: "Компактный",
      relaxed: "Нормальный",
      spacious: "Просторный",
      structure: "Структура",
      titlePage: "Титульная страница",
      pageSettings: "Страница",
      typography: "Типографика",
      headingsSection: "Заголовки",
      headerFooter: "Колонтитулы",
      format: "Формат",
      marginTop: "Верх",
      marginBottom: "Низ",
      marginLeft: "Лево",
      marginRight: "Право",
      paragraphIndent: "Отступ абзаца",
      textDensity: "Заполнение страницы",
      firstLineIndent: "Отступ первой строки",
      letterSpacing: "Межбуквенный интервал",
      alignment: "Выравнивание",
      chapterBreak: "Разрыв главы",
      chapter_h1: "Глава (H1)",
      section_h2: "Раздел (H2)",
      subsection_h3: "Подраздел (H3)",
      pageHeader: "Верхний колонтитул",
      leftSide: "Слева",
      rightSide: "Справа",
      pageNumber: "Номер страницы",
      bookTitleInFooter: "Название книги",
      exportPdf: "Экспортировать PDF",
      exportDocx: "Экспорт DOCX",
      exportBook: "Экспорт книги",
      exportFormat: "Формат",
      pdfNote: "PDF откроется в новой вкладке. Используйте «Сохранить как PDF» в браузере.",
      exporting: "Подготовка…",
      singlePage: "Страница",
      bookSpread: "Разворот",
      exportHint: "Откроется версия для печати. Используйте Ctrl+P / Cmd+P для сохранения в PDF.",
      layoutSettings: "Настройки верстки",
      noChapters: "Нет глав для отображения",
      chapters: "глав",
      chapterLabel: "Глава",
      tocHeading: "Оглавление",
      leftPlaceholder: "Название книги",
      rightPlaceholder: "Автор",
      previewLabel: "Предпросмотр",
      fiction: "Художественная",
      nonFiction: "Нон-фикшн",
      saved: "Сохранено",
      pageNumberAlign: "Позиция номера",
      footerAlignLeft: "Слева",
      footerAlignCenter: "По центру",
      footerAlignRight: "Справа",
      layoutPresets: "Стили верстки",
      presetClassic: "Классика",
      presetVibe: "Вайб",
      presetMono: "Моно",
      presetModern: "Модерн",
      canvasMode: "Полотно",
      sheetMode: "Листы",
      frontMatterSection: "Технические страницы",
      tocLabel: "Оглавление",
      fmTitlePage: "Титульная страница",
      fmUseBookTitle: "Использовать название книги",
      fmCustomTitle: "Своё название",
      fmSubtitle: "Подзаголовок",
      fmSubtitlePlaceholder: "Необязательный подзаголовок",
      fmAuthor: "Автор",
      fmPublisher: "Издательство",
      fmCity: "Город",
      fmYear: "Год",
      fmDecoration: "Оформление",
      fmDecoNone: "Без оформления",
      fmDecoLines: "Линии",
      fmDecoOrnament: "Орнамент ✦",
      fmCopyrightPage: "Страница копирайта",
      fmCopyYear: "© Год",
      fmCopyHolder: "© Правообладатель",
      fmCopyPublisher: "Название издательства",
      fmCopyAddress: "Адрес",
      fmCopyRights: "Текст прав",
      fmCopyEditor: "Редактор",
      fmCoverDesigner: "Дизайн обложки",
      fmWebsite: "Сайт",
      fmDedicationPage: "Страница посвящения",
      fmDedicationText: "Текст посвящения",
      fmDedicationPlaceholder: "Моим родителям…",
      fmVertPos: "Вертикальное положение",
      fmVPosTop: "Сверху",
      fmVPosCenter: "По центру",
      fmVPosBottom: "Снизу",
      fmBookAnnotation: "Аннотация книги (общая)",
      fmAnnotationPlaceholder: "Краткое описание для обложки/копирайта…",
      fmShowAnnotation: "Показать аннотацию",
      fmUseBookAuthor: "Использовать автора книги",
      fmTitlePresets: "Пресет оформления",
      fmPreset_classic: "Классика",
      fmPreset_minimal: "Минимум",
      fmPreset_modern: "Модерн",
      fmPreset_bold: "Жирный",
      fmTypography: "Типографика",
      fmTitleFs: "Загл. пт",
      fmSubtitleFs: "Подзагл. пт",
      fmAuthorFs: "Автор пт",
      fmAnnotationFs: "Аннот. пт",
      fmSpacing: "Отступ",
      fmLineHeight: "Интерл.",
      fmAnnotationSource: "Берётся из поля аннотации книги выше",
      fmGenerateAnnotation: "Сгенерировать с AI",
      fmAnnotationPromptPlaceholder: "Опишите книгу кратко: жанр, сюжет, атмосфера…",
      fmGenerateBtn: "✦ Сгенерировать аннотацию",
      fmGenerating: "Генерация…",
      cpEditor: "Редактор",
      cpCoverDesigner: "Дизайн обложки",
    },
    footer: {
      faq: "Вопросы и ответы",
      apiGuide: "Что такое API?",
      inspiration: "Советы",
      codex: "Кодекс",
      habits: "Привычки",
      features: "Возможности",
      github: "GitHub",
      tagline: "Для тех, кто пишет сердцем.",
    },
    habits: {
      title: "Привычки письма",
      subtitle: "Ваш творческий календарь. Каждый день письма фиксируется здесь.",
      streakLabel: "д. подряд",
      goalLabel: "Цель",
      goalNone: "Цель не задана",
      goalWords: "слов/день",
      goalChapters: "глав/день",
      setGoal: "Задать цель",
      saveGoal: "Сохранить",
      cancelGoal: "Отмена",
      goalType: "Тип цели",
      goalAmount: "Ежедневная норма",
      words: "Слова",
      chapters: "Главы",
      noActivity: "Активность за этот день не записана.",
      addNote: "Добавить заметку",
      planSession: "Запланировать сессию",
      notePlaceholder: "Что планируете написать? Рефлексия о сегодняшней сессии...",
      save: "Сохранить",
      totalDays: "Всего дней письма",
      longestStreak: "Лучшая серия",
      monthActivity: "Активность за месяц",
      today: "Сегодня",
      planned: "Запланировано",
      wrote: "Написано",
      edited: "Отредактировано",
      created: "Начато новое",
      noEntries: "Сессии письма ещё не записаны.",
      noEntriesHint: "Откройте любую книгу и начните писать — ваша активность появится здесь.",
    },
    freeMode: {
      title: "Бесплатный режим ИИ",
      badge: "Бесплатно",
      description: "Работает на открытых моделях. API-ключ не нужен.",
      notAvailable: "Бесплатный ИИ сейчас недоступен",
      retry: "Попробовать снова",
      switchToPaid: "Использовать мой API-ключ",
      rateLimit: "Бесплатный режим ограничен. Добавьте ключ OpenAI для безлимитного доступа.",
      model: "Mistral 7B (открытая модель)",
      tip: "Бесплатный режим использует открытый ИИ. Результаты могут отличаться от платных моделей.",
    },
    notFound: {
      phrases: [
        "Эта страница ушла писать собственную историю.",
        "Кажется, страница свернула не туда.",
        "404: Глава не найдена.",
        "Даже лучшие авторы заходят в тупик.",
        "Страница исчезла в середине главы.",
      ],
      body: "Страница не существует или была перемещена. Вернёмся туда, где всё работает.",
      backToBooks: "К моим книгам",
      goBack: "Назад",
      footer: "© 2026 Moodra · Для тех, кто пишет сердцем",
    },
    models: {
      back: "Назад",
      title: "Выберите AI-модель",
      subtitle: "Модель применяется ко всем AI-функциям в Moodra. Цены по тарифам",
      subtitleSuffix: ". Вычитаются напрямую из вашего баланса.",
      cost: "Стоимость",
      inputTokens: "Входящие токены",
      outputTokens: "Исходящие токены",
      specs: "Характеристики",
      speed: "Скорость",
      quality: "Качество",
      economy: "Экономия",
      active: "Активна",
      select: "Выбрать",
      selected: "Выбрана",
      saving: "Сохраняем...",
      modelChanged: "Модель изменена на",
      modelChangedDesc: "Применяется ко всем AI-функциям",
      errorTitle: "Ошибка",
      errorDesc: "Не удалось сохранить модель",
      footnote: "Цены актуальны на момент разработки. Проверяйте актуальные тарифы на",
    },
  },

  ua: {
    common: {
      save: "Зберегти",
      cancel: "Скасувати",
      delete: "Видалити",
      close: "Закрити",
      back: "Назад",
      loading: "Завантаження…",
      saving: "Збереження…",
      or: "або",
      new: "Новий",
      edit: "Редагувати",
      add: "Додати",
      remove: "Видалити",
      yes: "Так",
      no: "Ні",
      confirm: "Підтвердити",
      settings: "Налаштування",
      language: "Мова",
    },
    nav: {
      home: "Мої книги",
      settings: "Налаштування",
      logout: "Вийти",
      faq: "Питання і відповіді",
      apiGuide: "Що таке API?",
      inspiration: "Поради",
      codex: "Кодекс",
      habits: "Звички письма",
      models: "AI Моделі",
    },
    editor: {
      editor: "Редактор",
      characters: "Персонажі",
      notes: "Нотатки",
      research: "Дослідження",
      board: "Дошка ідей",
      settings: "Налаштування книги",
      layout: "Верстка",
    },
    login: {
      headline1: "Думка, що живе в тобі,",
      headline2: "заслуговує стати книгою.",
      subheadline: "Не обов'язково бути мудрим, щоб відчувати. Будь собою та йди за пристрастю, а все інше — від першого абзацу до готового рукопису — допоможе створити Moodra.",
      eyebrow: "ШІ-студія для письменників",
      signIn: "З поверненням",
      signInSub: "Один акаунт. Усі інструменти.\nВаші проекти чекають.",
      continueGoogle: "Увійти через Google",
      terms: "Входячи, ви приймаєте умови використання.\nМи ніколи не передаємо ваші дані третім сторонам.",
      footer: "Для тих, хто пише серцем",
      whatYouGet: "Що всередині",
      features: {
        editor: { title: "Пишіть так, як думаєте", desc: "Блоки, що не заважають: заголовки, цитати, виноски, таблиці — все з клавіатури." },
        ai: { title: "ШІ, що читає чернетку", desc: "Продовжує прозу, розвиває аргументи, переписує абзаци. Контекст — не шаблон." },
        research: { title: "Джерела стають структурою", desc: "Прив'язуйте джерела до розділів, ведіть гіпотези, керуйте бібліографією." },
        ideas: { title: "Карта архітектури книги", desc: "Перетягуйте, з'єднуйте, розставляйте. Бачте зв'язки між ідеями до першого рядка." },
      },
      highlights: [
        "Ваш API-ключ, ваша модель — без націнки на ШІ",
        "Самохостинг: чернетки не залишають ваш сервер",
        "Приватність за замовчуванням, не декларативно",
        "Відкритий код і довгострокова підтримка",
      ],
    },
    home: {
      newBook: "Нова книга",
      myBooks: "Мої книги",
      fiction: "Художня",
      scientific: "Нон-фікшн",
      emptyTitle: "Тут буде ваша перша книга",
      emptyDesc: "Кожна велика книга починається з одного рядка. Створіть проект — і нехай ШІ допомагає вам рухатися далі.",
      emptyBtn: "Створити першу книгу",
      emptyTagline: "Редактор · ШІ-асистент · Дошка ідей — все готово",
      createTitle: "Нова книга",
      createName: "Назва",
      createNamePlaceholder: "Моя наступна книга",
      createDesc: "Короткий опис",
      createDescPlaceholder: "Про що ця книга?",
      createMode: "Жанр",
      createCover: "Колір обкладинки",
      createCoverImage: "Завантажити обкладинку",
      modeScientific: "Нон-фікшн",
      modeFiction: "Художня",
      modeScientificSub: "Нон-фікшн · Дослідження · Філософія",
      modeFictionSub: "Роман · Фантастика · Фентезі",
      deleteConfirm: "Видалити книгу?",
      deleteWarning: "Книга та всі її розділи будуть видалені назавжди.",
      lastEdited: "Змінено",
    },
    settings: {
      title: "Налаштування",
      profile: "Профіль",
      name: "Ім'я",
      email: "Email",
      aiKey: "OpenAI API",
      keyActive: "Ключ активний",
      keyMissing: "Ключ не вказано",
      getKeyLink: "Як отримати ключ?",
      replaceKey: "Замінити ключ",
      keyPlaceholder: "sk-…",
      saveKey: "Зберегти ключ",
      removeKey: "Видалити ключ",
      tokensUsed: "Витрата токенів (gpt-4o-mini)",
      estimatedCost: "Приблизна вартість",
      language: "Мова інтерфейсу",
      languageDesc: "Відповіді ШІ також будуть на обраній мові.",
      dangerZone: "Небезпечна зона",
      deleteAccount: "Видалити акаунт",
      books: "Мої книги",
    },
    apiModal: {
      title: "Опа, схоже, скінчилось паливо.",
      desc: "Moodra без підписки і повністю безкоштовний — але всі нейромережеві функції працюють через особистий ключ OpenAI кожного користувача окремо, без прихованих комісій. Твій ключ, твої витрати, повна прозорість. Мабуть, на акаунті закінчились кошти.",
      placeholder: "sk-…",
      save: "Зберегти і продовжити",
      skip: "Пропустити",
      getKey: "Отримати ключ на platform.openai.com",
      guide: "Покрокова інструкція з отримання ключа",
      safeNote: "Ключ зберігається зашифровано і нікуди не передається. Змінити в налаштуваннях будь-коли.",
    },
    aiError: {
      noKey: "API-ключ не вказано",
      noKeyDesc: "Додайте ключ OpenAI в Налаштуваннях, щоб використовувати ШІ-функції.",
      quota: "Упс, ШІ без пального.",
      quotaDesc: "Moodra безкоштовний — але ШІ працює на вашому особистому ключі OpenAI. Схоже, баланс закінчився. Поповніть на platform.openai.com.",
      invalidKey: "Недійсний ключ",
      invalidKeyDesc: "Ключ, схоже, неправильний. Перевірте його в Налаштуваннях.",
      goToSettings: "Відкрити налаштування",
      getKey: "Отримати ключ",
    },
    faq: {
      title: "Питання і відповіді",
      subtitle: "Все, що потрібно знати про Moodra.",
      items: [
        { q: "Moodra безкоштовний?", a: "Так, платформа повністю безкоштовна. ШІ-функції використовують ваш особистий API-ключ OpenAI — ви платите OpenAI напряму за стандартними тарифами, без націнки з нашого боку." },
        { q: "Що таке API-ключ OpenAI?", a: "Це персональний токен доступу, який дозволяє використовувати мовні моделі OpenAI (наприклад, GPT-4o-mini). Створюється на platform.openai.com. Підписки немає — оплата за використання, і це дуже дешево." },
        { q: "Скільки коштує ШІ?", a: "GPT-4o-mini коштує приблизно $0.30 за мільйон токенів. Типова сесія письма (кілька сотень слів) обходиться в частки цента. Moodra відстежує ваші витрати." },
        { q: "Мої тексти приватні?", a: "Так. Ваш текст зберігається у вашій базі даних і передається OpenAI лише коли ви явно використовуєте ШІ-функцію. Ми не читаємо і не передаємо ваш контент." },
        { q: "Можна користуватись Moodra без ШІ?", a: "Звісно. Блочний редактор, дошка ідей та всі організаційні інструменти працюють без ключа API. ШІ — доповнення, а не обов'язкова умова." },
        { q: "Які мови підтримує Moodra?", a: "Інтерфейс доступний англійською, російською, українською та німецькою. При виборі мови ШІ також відповідатиме нею." },
        { q: "Можна експортувати книгу?", a: "Так — з редактора книги доступний експорт у PDF та EPUB. Обидва формати зберігають структуру розділів і форматування." },
        { q: "Moodra з відкритим кодом?", a: "Так. Код відкритий і підтримує самохостинг — ви можете запустити його на власному сервері з власною базою даних." },
      ],
    },
    inspiration: {
      title: "Поради платформи",
      subtitle: "Як писати краще, думати глибше і використовувати Moodra максимально.",
      readMin: "хв. читання",
      articles: [
        {
          tag: "Початок роботи",
          title: "Перший тиждень з Moodra",
          desc: "Практичний посібник: налаштувати робочий простір, створити першу книгу і запустити ШІ в роботу з першого дня.",
          content: `**Починайте зі структури, а не з порожньої сторінки.** Порожня сторінка лякає, бо вимагає надто багато. Вона каже: починайте де завгодно, все можливо, нічого не вирішено. Структура знімає цей тиск. Створіть книгу, додайте 3–5 назв розділів, навіть якщо вони приблизні: «Частина 1: Проблема», «Розділ 3: Що всі розуміють неправильно». Ці назви не мають бути фінальними. Вони просто мають існувати. Структура вбиває прокрастинацію, перетворюючи питання «з чого почати?» на «що тут написати?».

**Перший день: створіть книгу і оберіть режим.** При створенні нової книги в Moodra ви обираєте між режимами Нон-фікшн і Художня. Це не косметика — це змінює поведінку ШІ, доступні типи блоків і логіку організації. Для нон-фікшн аргументації обирайте Нон-фікшн. Для нарративу — художня, мемуари, есе. Додайте хоча б одне описове речення: що це за книга. Написання опису змушує вас сформулювати, що ви насправді будуєте.

**Використовуйте ШІ для продовження, а не для написання.** Найкращий результат — коли ви пишете абзац самі, а потім просите ШІ продовжити. Це не лінь — це важіль. Коли ви пишете зерно, ШІ розширює його у вашому голосі. Коли ви просите ШІ «написати розділ про X», ви отримуєте щось технічно компетентне і абсолютно безликe. Різниця — в авторстві. Написаний вами абзац несе вашу точку зору. ШІ може його виростити. Створити — ні.

**Другий день: налаштуйте розділи до того, як заповнювати їх.** Створіть всі розділи, які може знадобитися книзі. Назвіть їх, навіть погано. «Ключовий аргумент», «Чому це важливо», «Частина, де все розсипається» — це робочі назви, не зобов'язання. Створіть хоча б п'ять. Потім напишіть одне речення в кожному: чого цей розділ має досягти? Це і є найцінніше, що можна написати до початку справжньої роботи.

**Дошка ідей — чернетковий аркуш перед сторінкою.** Перед написанням будь-якого розділу проведіть 10 хвилин на Дошці ідей. Додайте картки для сцен, аргументів, запитань, персонажів. З'єднайте їх лініями. Вам не потрібен план — потрібна карта території. Писати в карту в 3 рази легше, ніж у нічого. Дошка виносить мислення назовні, щоб письмо могло зосередитися на вираженні, а не на відкритті.

**Третій день: перша справжня сесія письма.** Увімкніть Таймер фокусу в заголовку редактора. Встановіть 25 хвилин. Відкрийте перший розділ. Пишіть без зупинки — навіть якщо те, що ви пишете, погано. Погане письмо — сировина. Тиша — ні. Після сигналу прочитайте написане. Не редагуйте поки. Помітьте, які речення вас здивували. Ці сюрпризи — зазвичай те, де ваше справжнє мислення.

**Ставте скромну мету і захищайте її.** Редактор показує лічильник слів у реальному часі. Не ставте мету 2000 слів і не почувайтеся розчавленим, написавши 300. Поставте мету 300 — і почувайтеся попереду, написавши 500. Психологічна різниця величезна. Автор, який пише 300 слів щодня рік, має 109 000 слів. Це книга. Автор, який пише 2000 слів на натхненні і нічого без нього, має папку фрагментів.

**Не плутайте організацію з письмом.** Одна з найбільш спокусливих пасток — витрачати час письма на реорганізацію розділів, перейменування і переміщення блоків. Це відчувається як продуктивність. Це не вона. Тільки слова на сторінці просувають книгу вперед. Використовуйте перші 5 хвилин кожної сесії для письма. Слова першими, структура другою.`,
        },
        {
          tag: "ШІ-workflow",
          title: "Як використовувати ШІ, не втрачаючи свій голос",
          desc: "ШІ — співавтор, а не спічрайтер. Як залишатися господарем книги, даючи ШІ робити важку роботу.",
          content: `**Правило №1: ви пишете зерно, ШІ вирощує його.** Найважливіше в ШІ-письмі: він відображає, а не створює. Надрукуйте перше речення абзацу — навіть грубу ідею, навіть фрагмент. Потім натисніть «Продовжити». Результат продовжить ваш напрямок, а не замінить його. Коли ви даєте ШІ речення, ви даєте йому обмеження: ваш словник, ваш кут, ваш рівень абстракції. Він відповідає в цих обмеженнях. Коли ви даєте йому тему і нічого більше — ви отримуєте середнє з усього, що будь-коли писалося на цю тему.

**Три рівні ШІ-допомоги в письмі.** ШІ-допомога існує в спектрі. Рівень один: продовження — ви пишете речення і просите ШІ закінчити абзац. Найбезпечніший. Рівень два: розширення — ви пишете закінчену думку і просите ШІ розвинути її прикладами і глибиною. Найпродуктивніший. Рівень три: генерація — ви даєте ШІ тему з нуля. Найнебезпечніший для збереження голосу. Використовуйте перші два як стандарт.

**«Розвинути думку» — для тез, які не знаєте як розширити.** Це особливо потужно для нон-фікшн. Ви написали: «Більшість людей не досягають X не через нестачу інформації, а через відсутність зворотного зв'язку». Ви в це вірите. Ви не знаєте, як це підтримати. «Розвинути думку» додасть структуру: під-твердження, приклади, відмінності, можливі заперечення. Це не письмо аргументу замість вас — це показ того, що аргумент міг би містити.

**Проаналізуйте стиль перед генерацією чогось суттєвого.** Панель ШІ може прочитати ваші розділи і відкалібрувати свій голос. Голос — це різниця між книгою і документом. Якщо ви написали три розділи і хочете допомоги ШІ в четвертому, дайте йому прочитати перші три. Довжина ваших речень, ваш рівень формальності — ці паттерни стають шаблоном для наступного.

**Червоні прапорці того, що ШІ перехопив управління.** Зверніть увагу: у виводі забагато пасивного стану. Всі речення однакової довжини. Немає запитань. Все стверджується, а не аргументується. Абзац звучить як впевнена, трохи нудна журнальна стаття на будь-яку тему. Коли ви бачите ці ознаки — зупиніться. Поверніться до останнього особисто написаного речення і починайте знову звідти.

**Ніколи не приймайте першу генерацію.** Ставтеся до будь-якого виводу ШІ як до першого чернетки — краще, ніж нічого, ніколи не достатньо добре. Прочитайте. Відзначте дійсно сильні речення. Видаліть ті, що звучать узагальнено. Перепишіть решту своїми словами. В підсумку у вас абзац з вашою структурою і голосом, але зібраний швидше.

**Використовуйте ШІ для досліджень і контраргументів, а не тільки для прози.** Панель досліджень ШІ особливо сильна для нон-фікшн. Попросіть згенерувати контраргументи до вашої гіпотези. Попросіть пояснити концепцію простими словами, щоб потім викласти її своїми. Синтезуєте, аргументуєте і робите висновки — ви.

**Тест автентичного письма з ШІ.** Коли закінчите розділ з ШІ-допомогою, прочитайте вголос. Кожне речення, яке змушує вас морщитися, яке не звучить як ви — це речення, написане ШІ, яке ви не засвоїли. Або виріжте, або перепишіть, поки не зазвучить як ви. Мета не приховати участь ШІ. Мета — створити текст, який справді ваш.`,
        },
        {
          tag: "Глибока робота",
          title: "Потік в епоху відволікань",
          desc: "Середовище і ритуали, що допомагають досягти глибокої концентрації — і дописати те, що почали.",
          content: `**Глибока робота — не розкіш, а єдина робота, що створює книги.** Поверхнева робота — це листи, браузинг, відповіді, організація. Вона відчувається як зайнятість. Вона не створює нічого довговічного. Книга вимагає тримати в голові цілий світ: аргумент, який ви будуєте, персонажів, за якими стежите, структуру, яку підтримуєте. Таке когнітивне утримання вимагає тривалого, безперервного часу. Ви не можете написати книгу 10-хвилинними спринтами.

**Нейронаука творчого занурення.** Коли ви входите в глибоку концентрацію, мозок перемикається з режиму за замовчуванням (блукання, планування, тривога) на цілеорієнтовану мережу. Цей перехід займає час — зазвичай 15–20 хвилин стійкої уваги до досягнення справжньої глибини. Кожне переривання скидає лічильник. Захищайте блоки глибокої роботи як невідновлюваний ресурс.

**Використовуйте режим глибокого письма, коли потрібно зникнути в роботі.** Режим ізоляції Moodra приховує все, крім тексту та назви розділу. Жодних бічних панелей, жодних мигаючих лічильників слів. Натисніть Escape для виходу. Ваше середовище формує поведінку. Чисте середовище сигналізує: це час роботи.

**Проектуйте середовище до сесії, не під час неї.** Екологічний дизайн знаходиться вище мотивації. Закрити пошту займає 10 секунд до початку. Зробити це під час письма коштує 10 секунд плюс когнітивна ціна переривання. Перед кожною сесією: закрийте всі вкладки крім Moodra, заглушіть телефон, підготуйте напій, увімкніть потрібну музику або тишу.

**Пишіть до того, як досліджуєте.** Це контрінтуїтивно, але критично важливо. Вам, мабуть, здається, що потрібно досліджувати перед написанням. Це майже завжди неправильно. Вам потрібно писати, поки не виявите, чого не знаєте, потім досліджувати це конкретне. Автори, що досліджують перед письмом, часто створюють вичерпні нотатки, які ніколи не стають прозою.

**Правило 25 хвилин — про дозвіл, а не тривалість.** Таймер — це обіцянка собі: 25 хвилин тільки письмо. Жодних перевірок, жодних переключень. Сила таймера не в інтервалі — в зобов'язанні. Коли ви знаєте, що писати потрібно всього 25 хвилин, починати легко. Використовуйте вбудований Таймер фокусу Moodra.

**Захищайте час відновлення.** Глибока робота виснажує специфічні когнітивні ресурси. Після 90 хвилин справжньої глибокої роботи більшість авторів наближається до межі продуктивного виводу. Заплануйте блоки по максимум 90 хвилин, потім щось по-справжньому відновлювальне: прогулянка, їжа, рух.

**Відстежуйте години глибокої роботи, а не тільки лічильник слів.** Лічильник слів — спокусливий показник, бо він видимий. Але він вимірює вивід, а не зусилля. День, коли ви написали 200 слів чогось справді важкого і важливого, міг створити більше цінності, ніж день з 1200 словами заповнювача. Відстежуйте години. Слова прийдуть.`,
        },
        {
          tag: "Нон-фікшн",
          title: "Система гіпотез у дослідницькій роботі",
          desc: "Як дослідники та автори нон-фікшн використовують інструменти відстеження доказів для побудови суворих аргументів.",
          content: `**Гіпотези — це архітектура нон-фікшн.** Гіпотеза — не здогад. Це твердження, яке ви зобов'язуєтесь довести. Для кожного розділу, до першого слова прози, запишіть центральну гіпотезу: «Цей розділ стверджує, що X тому що Y». Додайте під-гіпотези для кожного великого розділу. Це примушує до ясності. Часто в акті написання гіпотези ви виявите, що ще не знаєте, у що вірите. Це відкриття — болюче — найцінніша річ, яка може статися до початку письма.

**Анатомія сильної гіпотези.** Сильна гіпотеза має три компоненти: твердження, механізм і область застосування. Твердження — що ви заявляєте. Механізм — чому це правда. Область — межі застосовності. «Люди не досягають звичок» — не гіпотеза, а розпливчасте спостереження. «Люди не досягають звичок перш за все тому, що проектують їх навколо мотивації, а не середовища» — гіпотеза з конкретним твердженням і механізмом. Пишіть гіпотези на цьому рівні конкретності.

**Аргументи і контраргументи належать разом.** Для кожної гіпотези додайте хоча б один сильний контраргумент. Не слабке опудало — найсильнішу версію протилежної точки зору. Потім відповідайте на неї. Гіпотеза, яка не витримує кращого контраргументу, потребує перегляду, а не приховування. Читачі знайдуть контраргумент, навіть якщо ви його не включите.

**Прив'язуйте кожне джерело до підтримуваних розділів.** Панель досліджень Moodra дозволяє прикріплювати джерела до конкретних розділів. Це вирішує реальну проблему: ви прочитали п'ятдесят статей, але в Розділі 6 не пам'ятаєте, в якій була ключова статистика. Зв'язок джерело-розділ створює живу бібліографію, яка показує вам в момент письма, які докази доступні для твердження.

**Використовуйте ШІ для генерації контраргументів, яких ви уникаєте.** У всіх нас є аргументи, в які ми так віримо, що інстинктивно відкидаємо опозицію. Попросіть ШІ згенерувати контраргументи до вашої гіпотези. Читайте уважно. Якщо якісь кращі, ніж ви очікували — це інформація, яка вам потрібна. Хороший контраргумент, який ви не розглядали, — не проблема. Це подарунок.

**Різниця між твердженням і спостереженням.** Більшість нон-фікшн чернеток повні спостережень, що маскуються під аргументи. «Багато авторів борються з прокрастинацією» — спостереження. «Автори прокрастинують перш за все тому, що встановили неможливо високі стандарти для свого виводу» — твердження. Спостереження не потрібно доводити. Твердження потрібно. Чим більше книга будується на твердженнях, а не спостереженнях, тим більше аргументативної енергії в ній буде.

**Співвідношення дослідження і письма має бути 1:3.** Поширена помилка — надто багато часу на збір доказів, надто мало на письмо. Прагніть до однієї години дослідження на три години письма. Досліджуйте на межі того, що вам потрібно; пишіть стільки, скільки дозволяють знання.

**Побудуйте карту аргументів до написання висновку.** Автори нон-фікшн часто залишають висновок наостанок і виявляють, що розділи не підтримують єдину думку. Напишіть чернетку висновку до закінчення книги. Потім перевірте, чи дійсно кожен розділ вносить внесок. Якщо розділ не підтримує висновок — або розділ потребує змін, або висновок.`,
        },
        {
          tag: "Художня",
          title: "Персонажі, які живуть",
          desc: "Як створити героїв із справжньою психологією, внутрішніми суперечностями та бажаннями — щоб читач їм вірив.",
          content: `**Персонаж — це система бажання і перешкоди.** Зніміть всі описи, передісторію, риси — і залишиться: чого хоче ця людина і що стоїть між нею і цим? Це двигун. Все інше — характеристика, накладена поверх двигуна. Коли сцена відчувається плоскою, зазвичай це тому, що бажання персонажа зникло з неї. Поверніть його — і сцена оживе.

**Три рівні бажання персонажа.** Бажання діє на трьох рівнях одночасно. Поверхневе бажання: що персонаж говорить, що хоче. Бажання історії: що персонажу справді потрібно. Приховане бажання: чого персонаж таємно хоче, але не може визнати. Найзахопливіші персонажі тримають всі три — і вони часто в конфлікті.

**Дайте кожному персонажу особисту логіку — навіть якщо вона неправильна.** Персонаж має мати сенс зсередини. Йому не потрібно бути правим або симпатичним. Але йому потрібно поводитися згідно з послідовною внутрішньою логікою, заснованою на переконаннях, бажаннях і страхах. Коли персонаж робить щось зручне для сюжету, але несумісне з психологією, читачі відчувають це як зраду.

**Суперечність робить персонажа правдоподібним.** Реальні люди теплі і жорстокі, принципові і компромісні, сміливі і боягузливі — часто в один день. Персонаж, який повністю один, — не людина. Це символ. Найзахопливіші персонажі тримають суперечності без розрішення: ідеаліст, особисто безжальний; цинік, таємно ніжний.

**Голос — це персонаж.** Те, як людина говорить — ритми, словник, конкретні слова, яких вона уникає — розкриває про неї більше, ніж будь-який опис. Перш ніж писати важливого персонажа з діалогом, витратьте 20 хвилин на письмо від його імені без сюжету: тирада, сповідь, лист комусь, кого він боїться. Не використовуйте це в книзі. Використовуйте для калібрування голосу.

**База даних персонажів — ваша пам'ять, щоб зосередитися на сцені.** Коли ви пишете сцену конфронтації, ви не маєте гортати ранні розділи, щоб пригадати колір очей когось або конкретну фразу з Розділу 2. Занесіть це в базу. Перед будь-якою важливою сценою з персонажем перечитайте його запис. Потім закрийте базу і пишіть по пам'яті.

**Другорядні персонажі потребують своїх бажань.** Одна з поширених помилок — другорядні персонажі, які існують тільки відносно до головного. У них немає незалежного внутрішнього життя. Читач це відчуває. Дайте кожному персонажу, що з'являється більш ніж у двох сценах, бажання, не пов'язане з протагоністом.

**Напишіть сцену, якої боїтеся.** У кожної історії є сцена, яку автор уникає. Конфронтація. Визнання. Смерть. Момент, коли персонаж має сказати те, що не може. Ці уникувані сцени зазвичай найважливіші — ось чому їх уникають. Пишіть їх все одно. Чернетці не потрібно бути гарною. Їй потрібно існувати.`,
        },
        {
          tag: "Процес",
          title: "Від чернетки до готової книги",
          desc: "Редагування, яке більшість авторів пропускають — і чому справжнє письмо починається після першої чернетки.",
          content: `**Перша чернетка не має бути гарною.** Це найважливіше в письмі і найважче для розуміння. Перша чернетка — процес мислення, а не письма. Ви відкриваєте для себе, у що вірите, що потрібно історії, яким є аргумент насправді. Це неможливо знати заздалегідь — тільки знайти через письмо. Тому робота першої чернетки — не бути читабельною. Її робота — існувати, щоб було з чим працювати. Порожню сторінку не можна відредагувати. Погану чернетку — можна.

**Дозвіл, який потрібно дати собі.** Більшість авторів не закінчують чернетки не тому що заблоковані, а тому що редагують під час письма. Це письмо і редагування одночасно, і це руйнує імпульс, який потрібен чернеткам. Рішення — дозвіл: дозвіл писати погано. Ви єдиний, хто побачить цю чернетку. Чернетці не потрібно бути гарною. Їй потрібно бути чесною — захопити реальне мислення, навіть заплутане.

**Дистанція перед правкою — не опція.** Ви ніколи не побачите чернетку ясно одразу після написання. Ви бачите те, що мали намір написати, а не те, що написали. Залиште хоча б тиждень між закінченням чернетки і початком правки. Краще більше. Коли повернетеся, будете читати речення, у які не вірите, що написали їх.

**Редагуйте проходами — структура, потім проза, потім слова.** Більшість редагувань зазнають невдачі, бо намагаються робити надто багато одночасно. Прохід перший: читайте тільки для структури. Аргумент тримається? Історія рухається вперед? Виправте структуру до прози — красиве речення не на своєму місці все одно не на своєму місці. Прохід другий: проза. Прохід третій: слова. Один прохід за раз.

**Структурне редагування — найважливіше і найбільш пропускане.** Автори, що щойно закінчили чернетку, виснажені і задоволені. Інстинкт — очистити її на рівні речень. Це майже завжди помилка. Структурні проблеми не можна виправити красивою прозою. Розділ, якого не має бути, стає красивішим, але все одно не має бути. Спочатку робіть структурне редагування.

**Ріжте більше, ніж думаєте потрібним.** Середня чернетка на 20–30% довша, ніж потрібно. Ви робите одне і те саме зауваження двічі. Ви підходите до ідеї з трьох сторін і включаєте всі три, хоча достатньо двох. При сумніві — ріжте. Книга, яка залишає читача бажати більшого, майже завжди потужніша за ту, що дає все.

**Отримайте зворотний зв'язок до фінального полірування.** Більшість авторів діляться роботою надто пізно. Діліться раніше: після структурної чернетки. Задавайте конкретні запитання: аргумент зрозумілий? Де ви втратили інтерес? Зворотний зв'язок про структуру — дієвий. Зворотний зв'язок про відполіровану прозу часто вимагає вирізати речі, які ви тижнями вдосконалювали.

**Останні 10% займають 50% часу.** Це не провал ефективності — це природа роботи. Останній прохід через рукопис — коли ви намагаєтеся зробити кожне речення правдивим. Не просто правильним, не просто ясним, а правдивим тому, що ви маєте на увазі. Ця точність повільна і важка, і необхідна. Закладайте на неї бюджет.`,
        },
        {
          tag: "Звичка",
          title: "Звичка писати, яка працює",
          desc: "Забудьте про натхнення. Ось система, яка дозволяє дописувати книги — сесія за сесією, слово за словом.",
          content: `**Натхнення — побічний ефект з'явлення, а не передумова.** Автори, що чекають натхнення, не пишуть книги. Автори, які пишуть незалежно від натхнення, — пишуть. Це не тому що вони дисциплінованіші або талановитіші. Це тому що вони розуміють природу творчої роботи: хороші ідеї приходять під час письма, а не до нього. З'явіться. Пишіть погано десять хвилин. Щось зачепить. Завжди.

**Нейронаука письменних звичок.** Звички працюють, створюючи нейронні шляхи, що стають все більш автоматичними з повторенням. Коли ви пишете в той самий час, в тому самому місці, з тим самим вступним ритуалом, мозок починає входити в стан письма до написання. Це петля сигнал-рутина-нагорода, що керує формуванням звички. Ви не будуєте силу волі. Ви будуєте умовний рефлекс. Сила волі виснажується. Умовні рефлекси — ні.

**Пишіть в один час, в одному місці, кожен день.** Ваш мозок реагує на контекстні сигнали. Коли ви сидите в тому самому кріслі, з тим самим напоєм, в той самий час дня і відкриваєте той самий додаток, мозок починає готуватися до письма до слова. Петля сигнал-рутина-нагорода, повторена достатньо разів, робить початок автоматичним, а не таким, що вимагає зусиль.

**Знизьте планку для початку. Підніміть її для зупинки.** Скажіть собі: мені потрібно написати тільки одне речення. Один абзац. Один жахливий блок тексту. Планка для початку має бути настільки низькою, що відмова писати здається безглуздою. Майже завжди ви напишете набагато більше. Важка частина — не письмо. Важка частина — відкрити документ.

**Захищайте серію важливіше лічильника слів.** Пропустити один день письма — невелика річ. Пропустити два дні — початок зміни звички. Пропустити тиждень — кінець звички. Серія — безперервний ланцюг днів письма — цінніша за будь-яку одну високопродуктивну сесію. День, коли ви пишете 50 посередніх слів, кращий за день, коли ви не пишете нічого. Moodra відстежує це для вас.

**Закінчуйте сесію до того, як спорожніли.** Зупиніться, коли ще знаєте, що буде далі. Ця техніка, що приписується Хемінгуею, — один з найнадійніших способів зробити наступний день легким. Коли ви пишете, поки повністю не вичерпаєтеся, ви зустрічаєте порожнечу наступного разу. Коли зупиняєтеся посередині — наступна сесія починається з вже вбудованим імпульсом.

**Мінімально життєздатний день письма.** Визначте свій мінімальний день письма — найменшу кількість, що вважається «я писав сьогодні». Для більшості — 100–300 слів. Це підлога, а не мета. Наявність підлоги означає, що в важкі дні — коли ви хворі, відволікаєтеся або виснажені — ви все одно можете з'явитися, написати мінімум і зберегти серію.

**Відстежуйте сесії, а не тільки слова.** Лічильник слів — корисний показник, але поганий хазяїн. Деякі дні 200 слів реального прогресу цінніші за 1000 заповнювача, який виріжете при редагуванні. Відстежуйте, чи з'явилися ви. Звичка, яку будуєте, — звичка з'являтися. Слова — побічний продукт. По мірі стабілізації звички якість і кількість слів покращуються автоматично.`,
        },
        {
          tag: "Філософія",
          title: "Писати, щоб думати",
          desc: "Чому письмо — це не результат мислення, а саме мислення. І що це означає для вашої роботи.",
          content: `**Письмо — не транскрипція думки. Письмо — це і є думка.** Це найважливіше і найменш зрозуміле в процесі письма. Ви не думаєте спочатку ясно, потім пишете ясно. Ви думаєте — через письмо. Акт формування речень примушує до точності, якої внутрішній монолог ніколи не вимагає. Коли ви думаєте без письма, ваші ідеї відчуваються завершеними. Коли ви записуєте їх, виявляєте, що вони такими не були. Опір при спробі вкласти складну ідею в слова — не письменницький блок. Це відчуття самого мислення.

**Чому порожня сторінка найкращий інструмент мислення.** Є багато інструментів мислення: схеми, карти думок, розмови, дослідження, прогулянки. Всі вони корисні. Жоден не такий точний, як порожня сторінка. Причина — специфіка. Схема може містити ідею, не розвирішуючи її. Тільки письмо примушує створювати реальну послідовність слів, що складають думку. Як тільки ви пишете «Причина, через яку X правда, бо...» — ви виявляєте, чи знаєте те, що йде після «бо».

**Перша чернетка ідеї рідко є справжньою ідеєю.** Кожен автор знає цей досвід: ви пишете до теми, і десь у третьому-четвертому абзаці пишете речення, яке вас дивує. Це речення, що здивувало, — зазвичай те, що ви насправді думаєте. Все до нього було підходом, прочищенням горла, розминкою. Ось чому схеми корисні, але недостатні — вони захоплюють те, що ви думаєте, що думаєте. Чернетка розкриває те, що ви думаєте насправді.

**Письмо оголює справжні переконання.** Ви можете тримати розпливчасті, внутрішньо суперечливі думки роками, не помічаючи суперечностей, бо розпливчасте мислення не вимагає розв'язання. Як тільки ви намагаєтеся написати ясний аргумент, суперечності спливають. Письмо ставить запитання: у що я насправді вірю? Це некомфортно і необхідно.

**Використовуйте блоки гіпотез і запитань як інструменти мислення.** Перед написанням будь-якого великого розділу вивантажте несформовані думки в блоки гіпотез і запитань. Не намагайтеся бути організованим. Пишіть: «Я думаю, це важливо, тому що...» і закінчуйте речення, не знаючи відповіді. Ці блоки не для читача. Вони для вас. Вони виносять смутне мислення назовні, щоб ви могли з ним працювати.

**Зв'язок між читанням і письмом.** Автори, які читають широко, пишуть краще — не тому що наслідують прочитане, а тому що читання будує модель можливого. Кожного разу, читаючи щось, що працює, ви розширюєте розуміння, що письмо може робити: як воно може рухатися, стискати, сповільнюватися, бути точним. Ця модель працює нижче рівня свідомої техніки.

**Ясність у письмі — продукт нещадного редагування, а не природного таланту.** Коли ви читаєте автора з кристальною прозою, ви бачите результат численних правок. Ясне письмо — результат турботи запитувати про кожне речення: це найясніший можливий спосіб сказати це? Перші чернетки не ясні. Їм не потрібно бути. Перші чернетки мають бути чесними. Правка робить їх ясними.

**Те, що ви пишете, змінює те, як ви думаєте.** Це петля, яку серйозні автори відкривають: письмо змінює ваш розум. Не тому що письмо магічне, а тому що дисципліна захисту тверджень на сторінці, пошуку доказів, передбачення заперечень — ці процеси перебудовують мислення. Люди, що серйозно пишуть на тему, розуміють її глибше за людей, які лише вивчають її. Письмо виробляє розуміння. Ось чому письмо важливе, навіть коли — особливо коли — ніхто інший його не прочитає.`,
        },
      ],
    },
    apiGuide: {
      title: "Що таке API-ключ і як він працює?",
      subtitle: "Просте пояснення для тих, хто не розбирається в технологіях.",
      badge: "API-ключ — що це таке",
      heroTitle1: "Ваш особистий пропуск",
      heroTitle2: "до потужності ChatGPT",
      heroDesc: "API-ключ — це пароль, який дозволяє застосункам використовувати ChatGPT від вашого імені. Moodra не платить за AI — ви самі керуєте своїм балансом. Це дає повний контроль і прозорість.",
      analogyLabel: "Аналогія:",
      analogy: "Уявіть Moodra як кавомашину, а OpenAI API як каву. Ми даємо вам машину — ви приносите свою каву. Скільки заварити — вирішуєте лише ви. Жодних націнок, жодної підписки.",
      stepsTitle: "Як налаштувати за 5 хвилин",
      steps: [
        { title: "Створіть акаунт на OpenAI", body: "Перейдіть на platform.openai.com і зареєструйтесь. Потрібен лише email — акаунт Google теж підійде.", linkLabel: "Відкрити platform.openai.com →" },
        { title: "Поповніть баланс", body: "У розділі Billing → Add to credit balance додайте $5–10. Цього вистачить на тисячі AI-запитів. Списання відбувається лише за фактом використання.", linkLabel: "Перейти до поповнення →" },
        { title: "Створіть API-ключ", body: "У розділі API Keys натисніть «Create new secret key». Дайте йому будь-яку назву, наприклад «Moodra». Ключ починається з sk- і виглядає як довгий рядок.", linkLabel: "Створити ключ →" },
        { title: "Додайте ключ у Moodra", body: "Скопіюйте ключ і вставте його в налаштуваннях вашого профілю. Ключ зберігається один раз — далі все працює автоматично.", linkLabel: "Відкрити налаштування →" },
      ],
      keyFormatTitle: "Як виглядає правильний ключ",
      keyFormatHint: "Ключ завжди починається з sk-. Якщо бачите щось інше — це не те.",
      costsTitle: "Скільки це коштує",
      facts: [
        { title: "Один запит ≈ $0.0003", body: "gpt-4o-mini — найекономніша модель OpenAI. $5 вистачає на ~16 000 запитів." },
        { title: "Ключ лише у вас", body: "Ключ зберігається зашифровано і використовується лише для ваших AI-запитів у Moodra." },
        { title: "Платіть лише за використання", body: "Жодних підписок. Гроші списуються лише коли ви натискаєте кнопку AI." },
      ],
      ctaTitle: "Готові додати ключ?",
      ctaDesc: "Займе менше хвилини. Після цього всі AI-функції Moodra стануть доступні.",
      ctaBtn: "Додати ключ у налаштуваннях",
      backToSettings: "Назад до налаштувань",
    },
    export: {
      title: "Експорт книги",
      pdf: "Експорт у PDF",
      epub: "Експорт у EPUB",
      docx: "Експорт у Word (.docx)",
      generating: "Генерація…",
      success: "Готово! Починається завантаження.",
    },
    layoutPanel: {
      title: "Верстка книги",
      toc: "Зміст",
      pageSize: "Формат сторінки",
      font: "Шрифт",
      fontSize: "Розмір шрифту",
      lineHeight: "Міжрядковий інтервал",
      margins: "Поля",
      narrow: "Вузькі",
      normal: "Звичайні",
      wide: "Широкі",
      spread: "Розворот",
      single: "Одна сторінка",
      exportWord: "Експорт у Word",
      headerLeft: "Розділ",
      noContent: "Немає розділів",
      page: "Стор.",
      serif: "Serif (Georgia)",
      sansSerif: "Sans-serif (Inter)",
      mono: "Моноширинний",
      compact: "Компактний",
      relaxed: "Звичайний",
      spacious: "Просторний",
      structure: "Структура",
      titlePage: "Титульна сторінка",
      pageSettings: "Сторінка",
      typography: "Типографіка",
      headingsSection: "Заголовки",
      headerFooter: "Колонтитули",
      format: "Формат",
      marginTop: "Верх",
      marginBottom: "Низ",
      marginLeft: "Ліво",
      marginRight: "Право",
      paragraphIndent: "Відступ абзацу",
      textDensity: "Заповнення сторінки",
      firstLineIndent: "Відступ першого рядка",
      letterSpacing: "Міжлітерний інтервал",
      alignment: "Вирівнювання",
      chapterBreak: "Розрив розділу",
      chapter_h1: "Розділ (H1)",
      section_h2: "Секція (H2)",
      subsection_h3: "Підрозділ (H3)",
      pageHeader: "Верхній колонтитул",
      leftSide: "Зліва",
      rightSide: "Справа",
      pageNumber: "Номер сторінки",
      bookTitleInFooter: "Назва книги",
      exportPdf: "Експортувати PDF",
      exportDocx: "Експорт DOCX",
      exportBook: "Експорт книги",
      exportFormat: "Формат",
      pdfNote: "PDF відкриється в новій вкладці. Використайте «Зберегти як PDF» у браузері.",
      exporting: "Підготовка…",
      singlePage: "Сторінка",
      bookSpread: "Розворот",
      exportHint: "Відкриється версія для друку. Використайте Ctrl+P / Cmd+P для збереження у PDF.",
      layoutSettings: "Налаштування верстки",
      noChapters: "Немає розділів для відображення",
      chapters: "розділів",
      chapterLabel: "Розділ",
      tocHeading: "Зміст",
      leftPlaceholder: "Назва книги",
      rightPlaceholder: "Автор",
      previewLabel: "Попередній перегляд",
      fiction: "Художня",
      nonFiction: "Нон-фікшн",
      saved: "Збережено",
      pageNumberAlign: "Позиція номера",
      footerAlignLeft: "Зліва",
      footerAlignCenter: "По центру",
      footerAlignRight: "Справа",
      layoutPresets: "Стилі верстки",
      presetClassic: "Класика",
      presetVibe: "Вайб",
      presetMono: "Моно",
      presetModern: "Модерн",
      canvasMode: "Полотно",
      sheetMode: "Аркуші",
      frontMatterSection: "Технічні сторінки",
      tocLabel: "Зміст",
      fmTitlePage: "Титульна сторінка",
      fmUseBookTitle: "Використати назву книги",
      fmCustomTitle: "Власна назва",
      fmSubtitle: "Підзаголовок",
      fmSubtitlePlaceholder: "Необов'язковий підзаголовок",
      fmAuthor: "Автор",
      fmPublisher: "Видавництво",
      fmCity: "Місто",
      fmYear: "Рік",
      fmDecoration: "Оформлення",
      fmDecoNone: "Без оформлення",
      fmDecoLines: "Лінії",
      fmDecoOrnament: "Орнамент ✦",
      fmCopyrightPage: "Сторінка копірайту",
      fmCopyYear: "© Рік",
      fmCopyHolder: "© Правовласник",
      fmCopyPublisher: "Назва видавництва",
      fmCopyAddress: "Адреса",
      fmCopyRights: "Текст прав",
      fmCopyEditor: "Редактор",
      fmCoverDesigner: "Дизайн обкладинки",
      fmWebsite: "Сайт",
      fmDedicationPage: "Сторінка присвяти",
      fmDedicationText: "Текст присвяти",
      fmDedicationPlaceholder: "Моїм батькам…",
      fmVertPos: "Вертикальне положення",
      fmVPosTop: "Зверху",
      fmVPosCenter: "По центру",
      fmVPosBottom: "Знизу",
      fmBookAnnotation: "Анотація книги (спільна)",
      fmAnnotationPlaceholder: "Короткий опис для титульної/копірайтної сторінки…",
      fmShowAnnotation: "Показати анотацію",
      fmUseBookAuthor: "Використати автора книги",
      fmTitlePresets: "Пресет оформлення",
      fmPreset_classic: "Класика",
      fmPreset_minimal: "Мінімум",
      fmPreset_modern: "Модерн",
      fmPreset_bold: "Жирний",
      fmTypography: "Типографіка",
      fmTitleFs: "Загол. пт",
      fmSubtitleFs: "Підзагол. пт",
      fmAuthorFs: "Автор пт",
      fmAnnotationFs: "Анот. пт",
      fmSpacing: "Відступ",
      fmLineHeight: "Інтерл.",
      fmAnnotationSource: "Береться з поля анотації книги вище",
      fmGenerateAnnotation: "Згенерувати з AI",
      fmAnnotationPromptPlaceholder: "Опишіть книгу коротко: жанр, сюжет, атмосфера…",
      fmGenerateBtn: "✦ Згенерувати анотацію",
      fmGenerating: "Генерація…",
      cpEditor: "Редактор",
      cpCoverDesigner: "Дизайн обкладинки",
    },
    footer: {
      faq: "Питання і відповіді",
      apiGuide: "Що таке API?",
      inspiration: "Поради",
      codex: "Кодекс",
      habits: "Звички",
      features: "Можливості",
      github: "GitHub",
      tagline: "Для тих, хто пише серцем.",
    },
    habits: {
      title: "Звички письма",
      subtitle: "Ваш творчий календар. Кожен день письма фіксується тут.",
      streakLabel: "дн. поспіль",
      goalLabel: "Ціль",
      goalNone: "Ціль не задана",
      goalWords: "слів/день",
      goalChapters: "розділів/день",
      setGoal: "Задати ціль",
      saveGoal: "Зберегти",
      cancelGoal: "Скасувати",
      goalType: "Тип цілі",
      goalAmount: "Щоденна норма",
      words: "Слова",
      chapters: "Розділи",
      noActivity: "Активність за цей день не записана.",
      addNote: "Додати нотатку",
      planSession: "Запланувати сесію",
      notePlaceholder: "Що плануєте написати? Рефлексія щодо сьогоднішньої сесії...",
      save: "Зберегти",
      totalDays: "Всього днів письма",
      longestStreak: "Найкраща серія",
      monthActivity: "Активність за місяць",
      today: "Сьогодні",
      planned: "Заплановано",
      wrote: "Написано",
      edited: "Відредаговано",
      created: "Розпочато нове",
      noEntries: "Сесії письма ще не записані.",
      noEntriesHint: "Відкрийте будь-яку книгу і почніть писати — ваша активність з'явиться тут.",
    },
    freeMode: {
      title: "Безкоштовний режим ШІ",
      badge: "Безкоштовно",
      description: "Працює на відкритих моделях. API-ключ не потрібен.",
      notAvailable: "Безкоштовний ШІ зараз недоступний",
      retry: "Спробувати ще раз",
      switchToPaid: "Використати мій API-ключ",
      rateLimit: "Безкоштовний режим обмежений. Додайте ключ OpenAI для безлімітного доступу.",
      model: "Mistral 7B (відкрита модель)",
      tip: "Безкоштовний режим використовує відкритий ШІ. Результати можуть відрізнятися від платних моделей.",
    },
    notFound: {
      phrases: [
        "Ця сторінка пішла писати власну історію.",
        "Схоже, сторінка звернула не туди.",
        "404: Розділ не знайдено.",
        "Навіть найкращі автори заходять у глухий кут.",
        "Сторінка зникла посередині розділу.",
      ],
      body: "Сторінка не існує або була переміщена. Повернімося туди, де все працює.",
      backToBooks: "До моїх книг",
      goBack: "Назад",
      footer: "© 2026 Moodra · Для тих, хто пише серцем",
    },
    models: {
      back: "Назад",
      title: "Оберіть AI-модель",
      subtitle: "Модель застосовується до всіх AI-функцій у Moodra. Ціни за тарифами",
      subtitleSuffix: ". Вираховуються безпосередньо з вашого балансу.",
      cost: "Вартість",
      inputTokens: "Вхідні токени",
      outputTokens: "Вихідні токени",
      specs: "Характеристики",
      speed: "Швидкість",
      quality: "Якість",
      economy: "Економія",
      active: "Активна",
      select: "Обрати",
      selected: "Обрано",
      saving: "Зберігаємо...",
      modelChanged: "Модель змінено на",
      modelChangedDesc: "Застосовується до всіх AI-функцій",
      errorTitle: "Помилка",
      errorDesc: "Не вдалося зберегти модель",
      footnote: "Ціни актуальні на момент розробки. Перевіряйте актуальні тарифи на",
    },
  },

  de: {
    common: {
      save: "Speichern",
      cancel: "Abbrechen",
      delete: "Löschen",
      close: "Schließen",
      back: "Zurück",
      loading: "Laden…",
      saving: "Speichern…",
      or: "oder",
      new: "Neu",
      edit: "Bearbeiten",
      add: "Hinzufügen",
      remove: "Entfernen",
      yes: "Ja",
      no: "Nein",
      confirm: "Bestätigen",
      settings: "Einstellungen",
      language: "Sprache",
    },
    nav: {
      home: "Meine Bücher",
      settings: "Einstellungen",
      logout: "Abmelden",
      faq: "Häufige Fragen",
      apiGuide: "Was ist eine API?",
      inspiration: "Tipps",
      codex: "Kodex",
      habits: "Gewohnheiten",
      models: "AI Modelle",
    },
    editor: {
      editor: "Editor",
      characters: "Charaktere",
      notes: "Notizen",
      research: "Recherche",
      board: "Ideenbrett",
      settings: "Bucheinstellungen",
      layout: "Layout",
    },
    login: {
      headline1: "Das Buch in dir",
      headline2: "verdient es, zu existieren.",
      subheadline: "Du musst nicht weise sein, um es zu spüren. Sei du selbst und folge deiner Leidenschaft — alles andere, vom ersten Absatz bis zum fertigen Manuskript, hilft dir Moodra erschaffen.",
      eyebrow: "KI-Schreibstudio",
      signIn: "Willkommen zurück",
      signInSub: "Ein Konto. Alle Werkzeuge.\nDeine Projekte warten.",
      continueGoogle: "Mit Google anmelden",
      terms: "Mit der Anmeldung stimmst du unseren Nutzungsbedingungen zu.\nWir teilen deine Daten niemals mit Dritten.",
      footer: "Für die, die von Herzen schreiben",
      whatYouGet: "Was dich erwartet",
      features: {
        editor: { title: "Schreib, wie du denkst", desc: "Blöcke, die nicht stören: Überschriften, Zitate, Callouts, Tabellen — alles tastaturgesteuert." },
        ai: { title: "Eine KI, die deinen Entwurf liest", desc: "Fortsetzt Prosa, entwickelt Argumente, überarbeitet Absätze. Kontextbewusst, nicht vorlagenbasiert." },
        research: { title: "Quellen werden Struktur", desc: "Verknüpfe Quellen mit Kapiteln, verfolge Hypothesen, verwalte Bibliografien." },
        ideas: { title: "Karte der Bucharchitektur", desc: "Ziehen, verbinden, anordnen. Sieh Verbindungen zwischen Ideen, bevor du eine Zeile schreibst." },
      },
      highlights: [
        "Dein API-Schlüssel, dein Modell — kein KI-Aufschlag",
        "Self-Hosting: Entwürfe verlassen nie deinen Server",
        "Datenschutz by Design, nicht by Deklaration",
        "Open Source und langfristig wartbar",
      ],
    },
    home: {
      newBook: "Neues Buch",
      myBooks: "Meine Bücher",
      fiction: "Belletristik",
      scientific: "Sachbuch",
      emptyTitle: "Dein erstes Buch beginnt hier",
      emptyDesc: "Jedes große Buch beginnt mit einer einzigen Zeile. Erstelle ein Projekt — lass die KI dir helfen voranzukommen.",
      emptyBtn: "Erstes Buch erstellen",
      emptyTagline: "Editor · KI-Assistent · Ideenboard — alles bereit",
      createTitle: "Neues Buch",
      createName: "Titel",
      createNamePlaceholder: "Mein nächstes Buch",
      createDesc: "Kurzbeschreibung",
      createDescPlaceholder: "Worum geht es?",
      createMode: "Genre",
      createCover: "Deckfarbe",
      createCoverImage: "Coverbild hochladen",
      modeScientific: "Sachbuch",
      modeFiction: "Belletristik",
      modeScientificSub: "Sachbuch · Forschung · Philosophie",
      modeFictionSub: "Roman · Science-Fiction · Fantasy",
      deleteConfirm: "Buch löschen?",
      deleteWarning: "Das Buch und alle Kapitel werden dauerhaft gelöscht.",
      lastEdited: "Geändert",
    },
    settings: {
      title: "Einstellungen",
      profile: "Profil",
      name: "Name",
      email: "E-Mail",
      aiKey: "OpenAI API",
      keyActive: "Schlüssel aktiv",
      keyMissing: "Kein Schlüssel gesetzt",
      getKeyLink: "Wie bekomme ich einen Schlüssel?",
      replaceKey: "Schlüssel ersetzen",
      keyPlaceholder: "sk-…",
      saveKey: "Schlüssel speichern",
      removeKey: "Schlüssel entfernen",
      tokensUsed: "Token-Verbrauch (gpt-4o-mini)",
      estimatedCost: "Geschätzte Kosten",
      language: "Oberflächensprache",
      languageDesc: "KI-Antworten werden ebenfalls in der gewählten Sprache sein.",
      dangerZone: "Gefahrenzone",
      deleteAccount: "Konto löschen",
      books: "Meine Bücher",
    },
    apiModal: {
      title: "Ups, der Treibstoff ist alle.",
      desc: "Moodra hat kein Abo und ist komplett kostenlos — aber alle KI-Funktionen laufen über den eigenen OpenAI-Schlüssel jedes Nutzers, ohne versteckte Provision. Dein Schlüssel, deine Kosten, volle Transparenz. Sieht aus, als wäre dein Guthaben aufgebraucht.",
      placeholder: "sk-…",
      save: "Speichern und fortfahren",
      skip: "Überspringen",
      getKey: "Schlüssel auf platform.openai.com holen",
      guide: "Schritt-für-Schritt-Anleitung zum Schlüssel erhalten",
      safeNote: "Dein Schlüssel wird verschlüsselt gespeichert und niemals weitergegeben. Du kannst ihn jederzeit in den Einstellungen ändern.",
    },
    aiError: {
      noKey: "Kein API-Schlüssel gesetzt",
      noKeyDesc: "Füge deinen OpenAI-Schlüssel in den Einstellungen hinzu, um KI-Funktionen zu nutzen.",
      quota: "Ups, KI braucht Treibstoff.",
      quotaDesc: "Moodra ist kostenlos — aber KI läuft auf deinem persönlichen OpenAI-Schlüssel. Offenbar ist das Guthaben aufgebraucht. Aufladen auf platform.openai.com.",
      invalidKey: "Ungültiger API-Schlüssel",
      invalidKeyDesc: "Dein Schlüssel scheint falsch zu sein. Überprüfe ihn in den Einstellungen.",
      goToSettings: "Einstellungen öffnen",
      getKey: "Schlüssel holen",
    },
    faq: {
      title: "Häufige Fragen",
      subtitle: "Alles, was du über Moodra wissen musst.",
      items: [
        { q: "Ist Moodra kostenlos?", a: "Ja, die Plattform ist vollständig kostenlos. KI-Funktionen nutzen deinen persönlichen OpenAI-API-Schlüssel — du zahlst OpenAI direkt zu Standardtarifen, ohne Aufschlag von uns." },
        { q: "Was ist ein OpenAI-API-Schlüssel?", a: "Ein persönliches Zugriffstoken, das die Nutzung von OpenAIs Sprachmodellen (z.B. GPT-4o-mini) ermöglicht. Erstellt auf platform.openai.com. Kein Abonnement — Bezahlung nach Nutzung, sehr günstig." },
        { q: "Was kostet die KI?", a: "GPT-4o-mini kostet ca. $0.30 pro Million Token. Eine typische Schreibsitzung kostet Bruchteile eines Cents. Moodra verfolgt deinen Verbrauch." },
        { q: "Sind meine Texte privat?", a: "Ja. Dein Text wird in deiner eigenen Datenbank gespeichert und nur an OpenAI übertragen, wenn du explizit eine KI-Funktion nutzt. Wir lesen oder teilen deine Inhalte nicht." },
        { q: "Kann ich Moodra ohne KI nutzen?", a: "Natürlich. Der Block-Editor, das Ideenboard und alle Organisationswerkzeuge funktionieren ohne API-Schlüssel. KI ist eine Ergänzung, keine Voraussetzung." },
        { q: "Welche Sprachen unterstützt Moodra?", a: "Die Oberfläche ist auf Englisch, Russisch, Ukrainisch und Deutsch verfügbar. Bei Sprachwahl antworten KI-Funktionen ebenfalls in dieser Sprache." },
        { q: "Kann ich mein Buch exportieren?", a: "Ja — aus dem Buch-Editor heraus ist Export als PDF und EPUB möglich. Beide Formate bewahren Kapitelstruktur und Formatierung." },
        { q: "Ist Moodra Open Source?", a: "Ja. Der Code ist offen und self-hostbar — du kannst es auf deinem eigenen Server mit eigener Datenbank betreiben." },
      ],
    },
    inspiration: {
      title: "Platform-Tipps",
      subtitle: "Besser schreiben, tiefer denken und Moodra optimal nutzen.",
      readMin: "Min. Lesezeit",
      articles: [
        {
          tag: "Einstieg",
          title: "Deine erste Woche mit Moodra",
          desc: "Ein praktischer Leitfaden zum Einrichten deines Arbeitsbereichs, Erstellen deines ersten Buches und KI-Einsatz vom ersten Tag an.",
          content: `**Starte mit einer klaren Struktur, nicht mit einer leeren Seite.** Die leere Seite ist einschüchternd, weil sie zu viel verlangt. Sie sagt: fang irgendwo an, alles ist möglich, nichts ist entschieden. Struktur hebt diesen Druck auf. Erstelle dein Buch, füge 3–5 Kapiteltitel hinzu, auch wenn sie grobe Schätzungen sind: "Teil 1: Das Problem", "Kapitel 3: Was alle falsch verstehen". Diese müssen nicht endgültig sein. Sie müssen nur existieren. Struktur besiegt Prokrastination, weil sie die Frage von "Wo fange ich an?" in "Was gehört hierher?" verwandelt.

**Tag eins: Erstelle dein Buch und wähle den Modus.** Beim Erstellen eines neuen Buches in Moodra wählst du zwischen Sachbuch und Belletristik. Das ist nicht kosmetisch — es ändert das Verhalten der KI, die verfügbaren Blocktypen und die Organisationslogik. Für Sachbuch-Argumentation wähle Sachbuch. Für Narrative wähle Belletristik. Füge mindestens einen beschreibenden Satz hinzu: Worum geht es in diesem Buch? Das Schreiben einer Beschreibung zwingt dich, zu formulieren, was du eigentlich baust.

**Nutze KI zum Fortführen, nicht zum Schreiben.** Die besten Ergebnisse entstehen, wenn du selbst einen Absatz schreibst und dann die KI bittest, weiterzuschreiben. Das ist keine Faulheit — das ist Hebelwirkung. Wenn du den Samen schreibst, erweitert die KI ihn in deiner Stimme. Wenn du die KI bittest, ein Kapitel über X zu schreiben, bekommst du etwas technisch Kompetentes und vollständig Generisches. Der Unterschied liegt im Eigentum. Der von dir geschriebene Absatz, egal wie grob, trägt deine Perspektive.

**Tag zwei: Richte Kapitel ein, bevor du sie füllst.** Erstelle alle Kapitel, die dein Buch möglicherweise braucht. Benenne sie, auch schlecht. "Das Kernargument", "Warum das wichtig ist", "Der Teil, wo alles auseinanderfällt" — das sind Arbeitstitel, keine Verpflichtungen. Erstelle mindestens fünf. Dann schreibe in jeden einen Satz: Was muss dieses Kapitel erreichen? Dieser Einzeilige Zwecksatz ist das Wertvollste, was du vor dem eigentlichen Schreiben schreiben kannst.

**Das Ideenboard ist dein Skizzenpapier vor der Seite.** Bevor du ein Kapitel schreibst, verbringe 10 Minuten auf dem Ideenboard. Füge Karten für Szenen, Argumente, Fragen und Charaktere hinzu. Verbinde sie mit Linien. Du brauchst keinen Plan — du brauchst eine Karte des Geländes. In eine Karte zu schreiben ist 3× einfacher als in nichts. Das Board externalisiert dein Denken, damit sich das Schreiben auf Ausdruck statt auf Entdeckung konzentrieren kann.

**Tag drei: Deine erste echte Schreibsitzung.** Aktiviere den Fokus-Timer in der Editor-Kopfzeile. Stelle ihn auf 25 Minuten. Öffne dein erstes Kapitel. Schreibe ohne Unterbrechung — auch wenn das, was du schreibst, schlecht ist. Schlechtes Schreiben ist Rohmaterial. Stille ist es nicht. Nach dem Timer lies, was du geschrieben hast. Bearbeite es noch nicht. Beachte, welche Sätze dich überraschten. Diese Überraschungen sind normalerweise dort, wo dein echtes Denken liegt.

**Setze ein bescheidenes Wortzählziel und schütze es.** Der Editor zeigt eine Live-Wortzählung. Setze kein Ziel von 2.000 Wörtern und fühle dich nicht zerschmettert, wenn du 300 schreibst. Setze ein Ziel von 300 und fühle dich voraus, wenn du 500 schreibst. Der psychologische Unterschied ist enorm. Kontinuität schlägt Ehrgeiz im ersten Monat. Ein Schriftsteller, der täglich 300 Wörter schreibt, hat nach einem Jahr 109.000 Wörter. Das ist ein Buch.

**Verwechsle Organisieren nicht mit Schreiben.** Eine der verlockendsten Fallen ist es, die Schreibzeit damit zu verbringen, Kapitel neu zu ordnen, Dinge umzubenennen und Blöcke zu verschieben. Das fühlt sich produktiv an. Es ist es nicht. Nur Wörter auf der Seite treiben ein Buch voran. Nutze die ersten 5 Minuten jeder Sitzung zum Schreiben. Wörter zuerst, Struktur danach.`,
        },
        {
          tag: "KI-Workflow",
          title: "KI nutzen ohne die eigene Stimme zu verlieren",
          desc: "KI ist ein Mitautor, kein Ghostwriter. Wie du Herr deines Buches bleibst, während die KI die schwere Arbeit übernimmt.",
          content: `**Regel #1: Du schreibst den Samen, KI lässt ihn wachsen.** Das Wichtigste an KI beim Schreiben: Sie reflektiert, erschafft nicht. Tippe den ersten Satz eines Absatzes — auch nur eine grobe Idee, auch nur ein Fragment. Dann nutze "Weiterführen". Das Ergebnis wird deine Richtung verlängern, nicht ersetzen. Wenn du der KI einen Satz gibst, gibst du ihr Einschränkungen: deinen Wortschatz, deinen Blickwinkel, dein Abstraktionsniveau. Sie antwortet innerhalb dieser Einschränkungen. Wenn du ihr ein Thema und nichts sonst gibst, bekommst du den Durchschnitt von allem, was jemals über dieses Thema geschrieben wurde.

**Die drei Ebenen der KI-Unterstützung.** KI-Hilfe existiert auf einem Spektrum. Ebene eins: Fortführen — du schreibst einen Satz und bittest die KI, den Absatz zu beenden. Am sichersten. Ebene zwei: Erweitern — du schreibst einen vollständigen Gedanken und bittest die KI, ihn mit Beispielen und Tiefe auszubauen. Am produktivsten. Ebene drei: Generieren — du gibst der KI ein Thema von Grund auf. Am gefährlichsten für die Stimmerhaltung. Nutze die ersten beiden als Standard.

**"Idee entwickeln" für Thesen, die du nicht weißt wie zu erweitern.** Das ist besonders mächtig für Sachbücher. Du hast geschrieben: "Der Grund, warum die meisten Menschen bei X scheitern, ist nicht mangelnde Information, sondern fehlende Feedbackschleifen." Du glaubst daran. Du weißt noch nicht, wie du es unterstützen sollst. "Idee entwickeln" fügt Struktur hinzu: Teilbehauptungen, Beispiele, Unterscheidungen, mögliche Einwände.

**Analysiere deinen Stil, bevor du etwas Wesentliches generierst.** Das KI-Panel kann deine vorhandenen Kapitel lesen und seine Stimme kalibrieren. Stimme ist der Unterschied zwischen einem Buch und einem Dokument. Wenn du drei Kapitel geschrieben hast und möchtest, dass die KI beim vierten hilft, lass sie die ersten drei lesen. Deine Satzlänge, dein Formalitätsniveau — diese Muster werden zur Vorlage für das Nächste.

**Die Warnsignale, dass die KI die Kontrolle übernommen hat.** Achte auf bestimmte Zeichen: Der Output nutzt mehr Passiv als du. Alle Sätze haben ähnliche Länge. Es gibt keine Fragen. Alles wird behauptet statt argumentiert. Wenn du diese Zeichen siehst — stopp. Gehe zurück zu deinem letzten persönlich geschriebenen Satz und beginne von dort.

**Akzeptiere nie die erste Generierung.** Behandle jeden KI-Output als ersten Entwurf — besser als nichts, nie gut genug wie er ist. Lies es. Markiere wirklich starke Sätze. Lösche die generischen. Schreibe den Rest in deinen eigenen Worten um. Was du bekommst, ist ein Absatz mit deiner Struktur und Stimme, aber schneller zusammengestellt.

**Nutze KI für Recherche und Gegenargumente, nicht nur für Prosa.** Das KI-Recherche-Panel ist besonders mächtig für Sachbücher. Bitte es, Gegenargumente zu deiner Hypothese zu generieren. Bitte es, ein Konzept in einfacheren Worten zu erklären, damit du es dann in deinen eigenen formulieren kannst.

**Der Test für authentisches KI-unterstütztes Schreiben.** Wenn du ein Kapitel mit KI-Hilfe abgeschlossen hast, lies es laut vor. Jeder Satz, der dich zum Zucken bringt, der nicht klingt wie du — das ist ein Satz, den die KI schrieb und den du nicht vollständig assimiliert hast. Entweder kürze ihn oder schreibe ihn um, bis er klingt wie du.`,
        },
        {
          tag: "Tiefes Arbeiten",
          title: "Flow im Zeitalter der Ablenkungen",
          desc: "Die Schreibumgebung und Rituale, die dir helfen, tiefe Konzentration zu erreichen — und fertigzustellen, was du angefangen hast.",
          content: `**Tiefes Arbeiten ist kein Luxus — es ist die einzige Arbeit, die Bücher produziert.** Oberflächliche Arbeit ist E-Mail, Surfen, Antworten, Organisieren. Sie fühlt sich beschäftigt an. Sie produziert nichts Bleibendes. Ein Buch erfordert, eine ganze Welt im Kopf zu halten: das Argument, das du aufbaust, die Charaktere, die du verfolgst, die Struktur, die du aufrechterhältst. Diese kognitive Haltearbeit erfordert ausgedehnte, ununterbrochene Zeit. Du kannst kein Buch in 10-Minuten-Sprints schreiben.

**Die Neurowissenschaft kreativer Versenkung.** Wenn du in tiefe Konzentration eintrittst, wechselt dein Gehirn vom Standardmodus-Netzwerk (Wandern, Planen, Sorgen) zu einem aufgabenorientierten Netzwerk. Dieser Übergang dauert Zeit — normalerweise 15–20 Minuten anhaltender Aufmerksamkeit, bevor echte Tiefe erreicht wird. Jede Unterbrechung setzt die Uhr zurück. Deshalb ist ein 2-Stunden-Block mit einer Unterbrechung nicht dasselbe wie zwei 1-Stunden-Blöcke. Schütze deine Tiefarbeitsblöcke als hätte Tiefe eine begrenzte Ressource.

**Nutze den Tiefschreib-Modus, wenn du in der Arbeit verschwinden musst.** Moodras Isolationsmodus blendet alles außer deinem Text und einem blassen Kapiteltitel aus. Keine Seitenleisten, keine blinkenden Wortzähler. Drücke Escape, um zurückzukehren. Viele Autoren berichten, dass allein der Eintritt in diesen Modus — die visuelle Veränderung, das Verschwinden von Unordnung — ausreicht, um mental umzuschalten.

**Gestalte deine Umgebung vor der Sitzung, nicht während.** Umgebungsgestaltung liegt oberhalb der Motivation. Das Schließen deines E-Mail-Clients dauert 10 Sekunden vor dem Beginn. Vor jeder Sitzung: Schließe alle Tabs außer Moodra, stummschalte dein Telefon, bereite dein Getränk vor, lege die Musik oder Stille auf, in der du am besten arbeitest.

**Schreibe bevor du recherchierst.** Das ist kontraintuitiv aber entscheidend. Du glaubst wahrscheinlich, dass du recherchieren musst, bevor du schreiben kannst. Das ist fast immer falsch. Was du tatsächlich brauchst, ist zu schreiben, bis du entdeckst, was du nicht weißt, dann das spezifisch recherchieren. Autoren, die vor dem Schreiben recherchieren, produzieren oft erschöpfende Notizen, die nie zu Prosa werden.

**Die 25-Minuten-Regel geht um Erlaubnis, nicht um Dauer.** Ein Timer ist ein Versprechen an dich selbst: 25 Minuten lang ist Schreiben das Einzige. Keine Überprüfungen, kein Umschalten. Wenn du weißt, dass du nur 25 Minuten schreiben musst, wird das Beginnen leicht. Nutze Moodras eingebauten Fokus-Timer. Wenn das Banner oben am Bildschirm erscheint, bist du drin.

**Schütze deine Erholungszeit.** Tiefes Arbeiten erschöpft spezifische kognitive Ressourcen. Nach 90 Minuten echter Tiefarbeit nähern sich die meisten Autoren der Grenze produktiver Leistung. Plane Tiefarbeitsblöcke von maximal 90 Minuten, dann etwas wirklich Erholsames: einen Spaziergang, eine Mahlzeit, körperliche Bewegung.

**Verfolge deine Tiefarbeitsstunden, nicht nur die Wortzählung.** Wortzählung ist eine verlockende Kennzahl, weil sie sichtbar ist. Aber sie misst Output, nicht Aufwand. Ein Tag, an dem du 200 Wörter von etwas wirklich Schwierigem geschrieben hast, hat möglicherweise mehr bleibenden Wert produziert als ein Tag mit 1.200 Wörtern Füllmaterial. Verfolge die Stunden. Die Wörter werden folgen.`,
        },
        {
          tag: "Sachbuch",
          title: "Das Hypothesen-System in der Forschungsarbeit",
          desc: "Wie Forscher und Sachbuch-Autoren Moodras Beweisverfolgungs-Tools nutzen, um rigide Argumente zu bauen.",
          content: `**Hypothesen sind die Architektur des Sachbuchs.** Eine Hypothese ist keine Vermutung — sie ist eine Behauptung, die du dir verpflichtest zu beweisen. Für jedes Kapitel, bevor du ein Wort Prosa schreibst, schreibe die zentrale Hypothese: "Dieses Kapitel argumentiert, dass X, weil Y." Füge Teil-Hypothesen für jeden Hauptabschnitt hinzu. Das erzwingt Klarheit. Oft wirst du beim Schreiben der Hypothese entdecken, dass du noch nicht weißt, was du glaubst.

**Die Anatomie einer starken Hypothese.** Eine starke Hypothese hat drei Komponenten: eine Behauptung, einen Mechanismus und einen Geltungsbereich. Die Behauptung ist, was du behauptest. Der Mechanismus ist, warum oder wie es wahr ist. Der Geltungsbereich sind die Grenzen der Anwendbarkeit. "Menschen scheitern bei Gewohnheiten" ist keine Hypothese — es ist eine vage Beobachtung. "Menschen scheitern bei Gewohnheiten vor allem, weil sie Gewohnheiten um Motivation statt um Umgebung herum gestalten" ist eine Hypothese.

**Argumente und Gegenargumente gehören zusammen.** Für jede Hypothese füge mindestens ein starkes Gegenargument hinzu. Nicht ein schwaches Strohmann-Argument, das du leicht abtun kannst — die stärkste Version der Gegenmeinung. Dann antworte darauf. Eine Hypothese, die ihr bestes Gegenargument nicht überleben kann, muss überarbeitet werden, nicht versteckt.

**Verknüpfe jede Quelle mit den von ihr unterstützten Kapiteln.** Moodras Recherche-Panel ermöglicht es, Quellen mit bestimmten Kapiteln zu verknüpfen. Das löst ein echtes Problem: Du hast fünfzig Artikel gelesen, aber in Kapitel 6 erinnerst du dich nicht, welcher die wichtige Statistik enthielt.

**Nutze KI, um Gegenargumente zu generieren, die du vermeidest.** Wir alle haben Argumente, an die wir so stark glauben, dass wir instinktiv die Opposition ablehnen. Bitte das KI-Recherche-Panel, Gegenargumente zu deiner Hypothese zu generieren. Lies sie sorgfältig. Wenn einige besser sind als erwartet — das ist Information, die du brauchst.

**Der Unterschied zwischen einer Behauptung und einer Beobachtung.** Die meisten Sachbuch-Erstentwürfe sind voll von Beobachtungen, die sich als Argumente verkleiden. "Viele Schriftsteller kämpfen mit Prokrastination" ist eine Beobachtung. "Schriftsteller prokrastinieren vor allem, weil sie unmöglich hohe Standards für ihren Output gesetzt haben" ist eine Behauptung. Beobachtungen müssen nicht bewiesen werden. Behauptungen schon. Je mehr dein Buch auf Behauptungen statt Beobachtungen aufgebaut ist, desto mehr argumentative Energie wird es haben.

**Das Recherche-zu-Schreib-Verhältnis sollte 1:3 sein.** Ein häufiger Fehler ist zu viel Zeit mit dem Sammeln von Beweisen und zu wenig Schreiben. Strebe nach einer Stunde Recherche für drei Stunden Schreiben. Das Schreiben wird aufzeigen, was du noch recherchieren musst.

**Baue deine Argumentenkarte, bevor du die Schlussfolgerung schreibst.** Sachbuch-Autoren lassen die Schlussfolgerung oft für zuletzt und stellen dann fest, dass ihre Kapitel nicht tatsächlich einen kohärenten Punkt unterstützen. Schreibe einen Schlussfolgerungsentwurf, bevor du das Buch beendet hast. Überprüfe dann, ob jedes Kapitel dazu beiträgt.`,
        },
        {
          tag: "Belletristik",
          title: "Charaktere, die lebendig wirken",
          desc: "Wie du Figuren mit echter Psychologie, inneren Widersprüchen und Wünschen erschaffst — damit der Leser ihnen glaubt.",
          content: `**Ein Charakter ist ein System aus Wunsch und Hindernis.** Streife jede Beschreibung, jede Vorgeschichte, jeden Charakterzug weg — und was bleibt, ist dies: Was will diese Person, und was steht zwischen ihr und dem Erreichen davon? Das ist der Motor. Alles andere ist Charakterisierung, die über den Motor gelegt wird. Wenn eine Szene flach wirkt, liegt das normalerweise daran, dass der Wunsch des Charakters aus der Szene verschwunden ist. Bring ihn zurück und die Szene erwacht.

**Die drei Ebenen des Charakterwunsches.** Wunsch wirkt gleichzeitig auf drei Ebenen. Oberflächenwunsch: was der Charakter sagt zu wollen. Geschichtswunsch: was der Charakter wirklich braucht. Verborgener Wunsch: was der Charakter heimlich will, aber nicht zugeben kann. Die überzeugendsten Charaktere halten alle drei — und sie stehen oft im Konflikt.

**Gib jedem Charakter eine innere Logik — auch wenn sie falsch ist.** Dein Charakter muss von innen her Sinn ergeben. Er muss nicht recht haben. Er muss nicht sympathisch sein. Aber er muss sich gemäß einer konsistenten inneren Logik verhalten, die aufgrund seiner Überzeugungen, Wünsche und Ängste Sinn ergibt. Wenn ein Charakter etwas tut, das für deinen Plot praktisch, aber mit seiner Psychologie unvereinbar ist, spüren Leser das als Verrat.

**Widerspruch macht einen Charakter glaubwürdig.** Echte Menschen sind warm und grausam, prinzipientreu und kompromissbereit, mutig und feige — oft am selben Nachmittag. Ein Charakter, der nur eine Sache ist, ist kein Mensch. Baue Widersprüche ein und lass die Geschichte Druck darauf ausüben. Der Bruch ist normalerweise deine wichtigste Szene.

**Stimme ist Charakter.** Wie jemand spricht — die Rhythmen, der Wortschatz, die spezifischen Wörter, die er vermeidet — verrät mehr über ihn als jede Beschreibung es je könnte. Bevor du einen wichtigen Charakter mit Dialog schreibst, verbringe 20 Minuten damit, in seiner Stimme zu schreiben ohne jede Geschichte: ein Wutausbruch, ein Geständnis, ein Brief an jemanden, den er fürchtet.

**Die Charakterdatenbank ist dein Gedächtnis, damit du dich auf die Szene konzentrieren kannst.** Wenn du mitten in einer Konfrontationsszene schreibst, solltest du nicht durch frühere Kapitel scrollen, um die Augenfarbe von jemandem zu erinnern. Gib es in die Datenbank ein. Vor jeder wichtigen Szene mit einem Charakter lies seinen Datenbankbeitrag erneut.

**Nebenfiguren brauchen eigene Wünsche.** Ein häufiger Fehler in der Belletristik sind Nebenfiguren, die nur in Relation zum Protagonisten existieren. Sie haben kein unabhängiges Innenleben. Der Leser kann das spüren. Gib jedem Charakter, der in mehr als zwei Szenen auftaucht, einen Wunsch, der nichts mit dem Protagonisten zu tun hat.

**Schreibe die Szene, vor der du Angst hast.** Jede Geschichte hat eine Szene, die der Autor vermeidet. Die Konfrontation. Das Geständnis. Den Tod. Schreibe sie trotzdem. Der Entwurf muss nicht gut sein. Er muss existieren. Die Überarbeitung einer schlechten Version der richtigen Szene ist weit einfacher als die einer guten Version der falschen.`,
        },
        {
          tag: "Prozess",
          title: "Vom Entwurf zum fertigen Buch",
          desc: "Das Lektorat, das die meisten Autoren überspringen — und warum das eigentliche Schreiben nach dem ersten Entwurf beginnt.",
          content: `**Der erste Entwurf ist nicht dazu gedacht, gut zu sein.** Das ist das Wichtigste beim Schreiben und das Schwierigste zu glauben. Der erste Entwurf ist ein Denkprozess, kein Schreibprozess. Du entdeckst, was du glaubst, was die Geschichte braucht, wie das Argument eigentlich lautet. Das kannst du nicht im Voraus wissen — du kannst es nur durch Schreiben finden. Schreibe es schnell, schreibe es ohne zurückzublicken. Die leere Seite kann nicht überarbeitet werden. Der schlechte Entwurf schon.

**Die Erlaubnis, die du dir selbst geben musst.** Die meisten Autoren scheitern nicht, weil sie blockiert sind, sondern weil sie beim Schreiben bearbeiten. Das ist Schreiben und Bearbeiten gleichzeitig, und es zerstört den Schwung, den Entwürfe brauchen. Die Lösung ist Erlaubnis: die Erlaubnis, schlecht zu schreiben. Der Entwurf muss nicht gut sein. Er muss ehrlich sein — den echten Gedanken einfangen, auch wenn er unordentlich ist.

**Abstand vor der Überarbeitung ist keine Option.** Du wirst deinen Entwurf unmittelbar nach dem Schreiben nie klar sehen. Du siehst, was du schreiben wolltest, nicht was du geschrieben hast. Lass mindestens eine Woche zwischen dem Abschluss eines Entwurfs und dem Beginn der Überarbeitung. Länger ist besser. Wenn du zurückkommst, wirst du Sätze lesen, die du sicher nicht geschrieben hast — weil die Person, die nach einer Woche zurückkommt, und die Person, die sie schrieb, leicht unterschiedliche Menschen sind.

**Überarbeite in Durchgängen — Struktur zuerst, dann Prosa, dann Wörter.** Die meisten Überarbeitungen scheitern, weil sie zu viele Dinge gleichzeitig versuchen. Erster Durchgang: nur Struktur. Hält das Argument? Bewegt sich die Geschichte vorwärts? Gibt es redundante Kapitel, fehlende Übergänge? Repariere Struktur vor der Prosa — ein schöner Satz am falschen Ort ist immer noch am falschen Ort. Zweiter Durchgang: Prosa. Dritter: Wörter. Ein Durchgang auf einmal.

**Strukturelle Bearbeitung ist die wichtigste und am meisten übersprungene.** Schriftsteller, die gerade einen Entwurf abgeschlossen haben, sind erschöpft und erleichtert. Der Instinkt ist, ihn auf Satzebene aufzupolieren. Das ist fast immer ein Fehler. Strukturelle Probleme können nicht durch schöne Prosa behoben werden. Mache die strukturelle Bearbeitung zuerst, auch wenn es bedeutet, 10.000 Wörter guter Prosa zu löschen, weil sie zu einer Form gehören, die das Buch nicht mehr hat.

**Kürze mehr als du denkst, nötig zu sein.** Der durchschnittliche erste Entwurf ist 20–30% zu lang. Du machst dasselbe Argument zweimal. Du nährest dich einer Idee von drei Seiten und schließt alle drei ein, obwohl zwei ausreichen. Im Zweifelsfall kürze. Ein Buch, das den Leser nach mehr verlangen lässt, ist fast immer stärker als eines, das ihm alles gibt.

**Hole Feedback, bevor du den letzten Schliff gibst.** Die meisten Autoren teilen ihre Arbeit zu spät. Teile früher: nach dem strukturellen Entwurf. Stelle spezifische Fragen: Macht das Argument Sinn? Bewegt sich die Geschichte? Strukturelles Feedback ist umsetzbar. Feedback zu polierter Prosa erfordert oft das Herausschneiden von Dingen, die du wochenlang perfektioniert hast.

**Die letzten 10% brauchen 50% der Zeit.** Das ist kein Effizienzversagen — das ist die Natur der Arbeit. Der letzte Durchgang durch ein Manuskript ist der, bei dem du versuchst, jeden Satz wahr zu machen. Nicht nur korrekt, nicht nur klar, sondern wirklich wahr zu dem, was du meinst. Diese Präzision ist langsam und schwierig und notwendig. Plane dafür ein Budget.`,
        },
        {
          tag: "Gewohnheit",
          title: "Die Schreibgewohnheit, die funktioniert",
          desc: "Vergiss Inspiration. Hier ist das System, das Bücher fertigstellt — Sitzung für Sitzung, Wort für Wort.",
          content: `**Inspiration ist ein Nebeneffekt des Erscheinens, keine Voraussetzung.** Schriftsteller, die auf Inspiration warten, schreiben keine Bücher. Schriftsteller, die unabhängig von Inspiration schreiben, tun es. Das liegt nicht daran, dass sie disziplinierter oder talentierter sind. Es liegt daran, dass sie die Natur kreativer Arbeit verstehen: Die guten Ideen kommen beim Schreiben, nicht davor. Erscheine. Schreibe zehn Minuten lang schlecht. Etwas wird anspringen. Es geschieht immer.

**Die Neurowissenschaft von Schreibgewohnheiten.** Gewohnheiten funktionieren, indem sie neuronale Bahnen schaffen, die mit Wiederholung zunehmend automatisch werden. Wenn du zur gleichen Zeit, am gleichen Ort, mit demselben Eröffnungsritual schreibst, beginnt dein Gehirn in den Schreibzustand einzutreten, bevor du ein Wort getippt hast. Das ist die Cue-Routine-Belohnungs-Schleife, die alle Gewohnheitsbildung regiert. Du baust keine Willenskraft auf. Du baust einen konditionierten Reflex. Willenskraft erschöpft sich. Konditionierte Reflexe nicht.

**Schreibe zur gleichen Zeit, am gleichen Ort, jeden Tag.** Dein Gehirn reagiert auf Kontexthinweise. Wenn du im gleichen Stuhl sitzt, mit dem gleichen Getränk, zur gleichen Tageszeit und dieselbe Anwendung öffnest, beginnt dein Gehirn sich auf das Schreiben vorzubereiten, bevor du ein Wort getippt hast. Die Cue-Routine-Belohnungs-Schleife macht das Beginnen automatisch statt aufwändig. Du baust einen Schreibreflex auf. Das dauert Wochen. Es hält Jahre an.

**Senke die Hürde zum Beginnen. Erhöhe die Hürde zum Aufhören.** Sag dir selbst: Ich muss nur einen Satz schreiben. Einen Absatz. Einen schrecklichen Textblock. Die Hürde zum Beginnen sollte so niedrig sein, dass die Weigerung zu schreiben absurd erscheint. Fast immer wirst du weit mehr schreiben als du dir vorgenommen hast. Der schwierige Teil ist nicht das Schreiben — der schwierige Teil ist das Öffnen des Dokuments. Sobald es offen ist und du einen Satz getippt hast, übernimmt die Physik.

**Schütze die Serie mehr als die Wortzählung.** Einen Tag Schreiben zu verpassen ist eine kleine Sache. Zwei Tage zu verpassen ist der Beginn einer Gewohnheitsveränderung. Eine Woche zu verpassen ist das Ende der Gewohnheit. Die Serie — die ununterbrochene Kette von Schreibtagen — ist wertvoller als jede einzelne hochproduktive Sitzung. Ein Tag, an dem du 50 mittelmäßige Wörter schreibst, ist besser als ein Tag, an dem du nichts schreibst. Moodra verfolgt das für dich.

**Beende die Sitzung, bevor du leer bist.** Höre auf, wenn du noch weißt, was als nächstes kommt. Diese Technik, die Hemingway zugeschrieben wird, ist eine der zuverlässigsten Methoden, den nächsten Tag leicht zu machen. Wenn du schreibst, bis du vollständig erschöpft bist, begegnest du beim nächsten Mal einer leeren Seite. Wenn du mittendrin aufhörst, beginnt die nächste Sitzung mit bereits aufgebautem Schwung.

**Der minimale lebensfähige Schreibtag.** Definiere deinen minimalen Schreibtag — die kleinste Menge, die als "heute geschrieben" gilt. Für die meisten sind das 100–300 Wörter: etwa 3–5 Minuten tatsächlicher Ausgabe. Das ist der Boden, nicht das Ziel. Das Haben eines Bodens bedeutet, dass du an schwierigen Tagen trotzdem erscheinen, dein Minimum schreiben und die Serie erhalten kannst.

**Verfolge deine Sitzungen, nicht nur deine Wortzählung.** Wortzählung ist eine nützliche Kennzahl, aber ein schlechter Meister. Manche Tage sind 200 Wörter echten Fortschritts mehr wert als 1.000 Wörter Füllmaterial, das du in der Überarbeitung herausschneiden wirst. Verfolge, ob du erschienen bist. Die Gewohnheit, die du aufbaust, ist die Gewohnheit zu erscheinen. Die Wörter sind ein Nebenprodukt davon.`,
        },
        {
          tag: "Philosophie",
          title: "Schreiben, um zu denken",
          desc: "Warum Schreiben nicht das Ergebnis des Denkens ist — sondern das Denken selbst. Und was das für deine Arbeit bedeutet.",
          content: `**Schreiben ist nicht die Transkription von Gedanken. Es ist Denken.** Das ist das Wichtigste und am wenigsten Verstandene am Schreibprozess. Du denkst nicht erst klar und schreibst dann klar. Du denkst durch Schreiben. Der Akt des Formulierens von Sätzen erzwingt eine Art Präzision, die der innere Monolog nie verlangt. Wenn du ohne Schreiben denkst, fühlen sich deine Ideen vollständig an. Wenn du sie aufschreibst, entdeckst du, dass sie es nicht waren. Der Widerstand, den du spürst, wenn du versuchst, eine komplexe Idee in Worte zu fassen, ist kein Schreibblock. Es ist die Empfindung des Denkens selbst.

**Warum die leere Seite das beste Denkwerkzeug ist.** Es gibt viele Denkwerkzeuge: Gliederungen, Mind Maps, Gespräche, Recherche, Spaziergänge. Alle sind nützlich. Keines ist so präzise wie die leere Seite. Der Grund ist Spezifität. Eine Gliederung kann eine Idee enthalten, ohne sie aufzulösen. Eine Mind Map kann zwei Konzepte verbinden, ohne die Verbindung zu erklären. Nur das Schreiben zwingt dich, die eigentliche Abfolge von Wörtern zu produzieren, die einen Gedanken ausmacht.

**Der erste Entwurf einer Idee ist selten die echte Idee.** Jeder Autor kennt die Erfahrung: Du schreibst in ein Thema hinein, und irgendwo im dritten oder vierten Absatz schreibst du einen Satz, der dich überrascht. Dieser überraschende Satz ist normalerweise das, was du wirklich denkst. Alles davor war der Ansatz, das Räuspern, das Aufwärmen. Deshalb sind Gliederungen nützlich, aber nicht ausreichend — sie erfassen, was du denkst, dass du denkst. Der Entwurf enthüllt, was du tatsächlich denkst. Schreibe, um herauszufinden.

**Schreiben enthüllt deine echten Überzeugungen.** Du kannst vage, intern widersprüchliche Meinungen jahrelang halten, ohne die Widersprüche zu bemerken, weil vages Denken keine Auflösung erfordert. In dem Moment, in dem du versuchst, ein klares Argument zu schreiben, tauchen die Widersprüche auf. Schreiben stellt die Frage: Was glaube ich eigentlich? Das ist unbequem und notwendig.

**Nutze Hypothesen- und Frageblöcke als Denkwerkzeuge.** Bevor du einen größeren Abschnitt schreibst, entlade deine ungeformten Gedanken in Hypothesen- und Frageblöcken. Versuche nicht, organisiert oder kohärent zu sein. Schreibe: "Ich denke, das ist wichtig, weil..." und beende den Satz, ohne die Antwort zu kennen. Diese Blöcke sind nicht für den Leser — sie sind für dich.

**Der Zusammenhang zwischen Lesen und Schreiben.** Schriftsteller, die viel lesen, schreiben besser — nicht weil sie das Gelesene imitieren, sondern weil Lesen ein Modell des Möglichen aufbaut. Jedes Mal, wenn du etwas liest, das funktioniert, erweiterst du dein Verständnis davon, was Schreiben tun kann: wie es sich bewegen, komprimieren, verlangsamen, präzise oder mehrdeutig sein kann.

**Klarheit im Schreiben ist das Produkt von rücksichtslosem Lektorat, nicht von natürlichem Talent.** Wenn du einen Schriftsteller mit kristalliner Prosa liest, siehst du das Ergebnis mehrerer Überarbeitungen. Klares Schreiben ist das Ergebnis davon, sich genug zu kümmern, um für jeden Satz zu fragen: Ist das die klarste mögliche Art, das zu sagen? Erste Entwürfe sind nicht klar. Sie müssen es nicht sein. Erste Entwürfe müssen ehrlich sein. Überarbeitung macht sie klar.

**Was du schreibst, verändert, wie du denkst.** Das ist die Schleife, die ernsthafte Schriftsteller entdecken: Schreiben verändert deinen Verstand. Nicht weil Schreiben magisch ist, sondern weil die Disziplin, Behauptungen auf der Seite zu verteidigen, Beweise zu finden, Einwände zu antizipieren — diese Prozesse das zugrundeliegende Denken umgestalten. Menschen, die ernsthaft über ein Thema schreiben, verstehen es tiefer als Menschen, die es nur studieren. Das Schreiben ist nicht der Bericht über das Verständnis. Das Schreiben produziert es.`,
        },
      ],
    },
    apiGuide: {
      title: "Was ist ein API-Schlüssel und wie funktioniert er?",
      subtitle: "Eine einfache Erklärung für Nicht-Techniker.",
      badge: "API-Schlüssel — was das ist",
      heroTitle1: "Dein persönlicher Zugang",
      heroTitle2: "zur Kraft von ChatGPT",
      heroDesc: "Ein API-Schlüssel ist ein Passwort, das Apps erlaubt, ChatGPT in deinem Namen zu nutzen. Moodra zahlt nicht für AI — du verwaltest dein eigenes Guthaben. Das gibt dir volle Kontrolle und Transparenz.",
      analogyLabel: "Analogie:",
      analogy: "Stell dir Moodra als Kaffeemaschine vor und die OpenAI API als Kaffee. Wir geben dir die Maschine — du bringst deinen eigenen Kaffee. Wie viel du brühst, entscheidest nur du. Keine Aufschläge, kein Abo.",
      stepsTitle: "In 5 Minuten einrichten",
      steps: [
        { title: "OpenAI-Konto erstellen", body: "Gehe zu platform.openai.com und registriere dich. Du brauchst nur eine E-Mail — ein Google-Konto funktioniert auch.", linkLabel: "platform.openai.com öffnen →" },
        { title: "Guthaben aufladen", body: "Unter Billing → Add to credit balance lade $5–10 auf. Das reicht für Tausende KI-Anfragen. Du zahlst nur für das, was du verwendest.", linkLabel: "Zur Aufladung →" },
        { title: "API-Schlüssel erstellen", body: "Klicke unter API Keys auf 'Create new secret key'. Gib ihm einen beliebigen Namen, z.B. 'Moodra'. Der Schlüssel beginnt mit sk- und sieht wie eine lange Zeichenkette aus.", linkLabel: "Schlüssel erstellen →" },
        { title: "Schlüssel zu Moodra hinzufügen", body: "Kopiere den Schlüssel und füge ihn in deinen Profileinstellungen ein. Einmal gespeichert — danach läuft alles automatisch.", linkLabel: "Einstellungen öffnen →" },
      ],
      keyFormatTitle: "Wie ein gültiger Schlüssel aussieht",
      keyFormatHint: "Der Schlüssel beginnt immer mit sk-. Siehst du etwas anderes — ist es nicht der richtige.",
      costsTitle: "Was kostet das",
      facts: [
        { title: "Eine Anfrage ≈ $0.0003", body: "gpt-4o-mini ist OpenAIs sparsamtes Modell. $5 reichen für ~16 000 Anfragen." },
        { title: "Schlüssel bleibt bei dir", body: "Der Schlüssel wird verschlüsselt gespeichert und nur für deine KI-Anfragen in Moodra verwendet." },
        { title: "Zahle nur für Nutzung", body: "Kein Abo. Geld wird nur abgebucht, wenn du den KI-Button klickst." },
      ],
      ctaTitle: "Bereit, deinen Schlüssel hinzuzufügen?",
      ctaDesc: "Dauert weniger als eine Minute. Danach werden alle KI-Funktionen von Moodra verfügbar.",
      ctaBtn: "Schlüssel in Einstellungen hinzufügen",
      backToSettings: "Zurück zu den Einstellungen",
    },
    export: {
      title: "Buch exportieren",
      pdf: "Als PDF exportieren",
      epub: "Als EPUB exportieren",
      docx: "Als Word exportieren (.docx)",
      generating: "Wird generiert…",
      success: "Fertig! Download beginnt.",
    },
    layoutPanel: {
      title: "Buchlayout",
      toc: "Inhaltsverzeichnis",
      pageSize: "Seitenformat",
      font: "Schriftart",
      fontSize: "Schriftgröße",
      lineHeight: "Zeilenabstand",
      margins: "Ränder",
      narrow: "Schmal",
      normal: "Normal",
      wide: "Breit",
      spread: "Doppelseite",
      single: "Einzelseite",
      exportWord: "Als Word exportieren",
      headerLeft: "Kapitel",
      noContent: "Keine Kapitel",
      page: "S.",
      serif: "Serif (Georgia)",
      sansSerif: "Sans-serif (Inter)",
      mono: "Monospace",
      compact: "Kompakt",
      relaxed: "Normal",
      spacious: "Großzügig",
      structure: "Struktur",
      titlePage: "Titelseite",
      pageSettings: "Seite",
      typography: "Typografie",
      headingsSection: "Überschriften",
      headerFooter: "Kopf- und Fußzeile",
      format: "Format",
      marginTop: "Oben",
      marginBottom: "Unten",
      marginLeft: "Links",
      marginRight: "Rechts",
      paragraphIndent: "Absatzeinzug",
      textDensity: "Seitenfüllung",
      firstLineIndent: "Erstzeileneinzug",
      letterSpacing: "Buchstabenabstand",
      alignment: "Ausrichtung",
      chapterBreak: "Kapitelumbruch",
      chapter_h1: "Kapitel (H1)",
      section_h2: "Abschnitt (H2)",
      subsection_h3: "Unterabschnitt (H3)",
      pageHeader: "Kopfzeile",
      leftSide: "Links",
      rightSide: "Rechts",
      pageNumber: "Seitennummer",
      bookTitleInFooter: "Buchtitel",
      exportPdf: "PDF exportieren",
      exportDocx: "DOCX exportieren",
      exportBook: "Buch exportieren",
      exportFormat: "Format",
      pdfNote: "PDF öffnet sich in neuem Tab. Nutzen Sie «Speichern als PDF» im Browser.",
      exporting: "Vorbereitung…",
      singlePage: "Seite",
      bookSpread: "Doppelseite",
      exportHint: "Druckversion öffnet sich. Verwenden Sie Strg+P / Cmd+P zum Speichern als PDF.",
      layoutSettings: "Layout-Einstellungen",
      noChapters: "Keine Kapitel vorhanden",
      chapters: "Kapitel",
      chapterLabel: "Kapitel",
      tocHeading: "Inhaltsverzeichnis",
      leftPlaceholder: "Buchtitel",
      rightPlaceholder: "Autor",
      previewLabel: "Vorschau",
      fiction: "Belletristik",
      nonFiction: "Sachbuch",
      saved: "Gespeichert",
      pageNumberAlign: "Nummer Position",
      footerAlignLeft: "Links",
      footerAlignCenter: "Mitte",
      footerAlignRight: "Rechts",
      layoutPresets: "Layout-Stile",
      presetClassic: "Klassisch",
      presetVibe: "Vibe",
      presetMono: "Mono",
      presetModern: "Modern",
      canvasMode: "Leinwand",
      sheetMode: "Blätter",
      frontMatterSection: "Vor dem Inhalt",
      tocLabel: "Inhaltsverzeichnis",
      fmTitlePage: "Titelseite",
      fmUseBookTitle: "Buchtitel verwenden",
      fmCustomTitle: "Eigener Titel",
      fmSubtitle: "Untertitel",
      fmSubtitlePlaceholder: "Optionaler Untertitel",
      fmAuthor: "Autor",
      fmPublisher: "Verlag",
      fmCity: "Stadt",
      fmYear: "Jahr",
      fmDecoration: "Dekoration",
      fmDecoNone: "Keine",
      fmDecoLines: "Linien",
      fmDecoOrnament: "Ornament ✦",
      fmCopyrightPage: "Impressum",
      fmCopyYear: "© Jahr",
      fmCopyHolder: "© Inhaber",
      fmCopyPublisher: "Verlagsname",
      fmCopyAddress: "Adresse",
      fmCopyRights: "Rechtshinweis",
      fmCopyEditor: "Lektor",
      fmCoverDesigner: "Coverdesign",
      fmWebsite: "Website",
      fmDedicationPage: "Widmungsseite",
      fmDedicationText: "Widmungstext",
      fmDedicationPlaceholder: "Für meine Eltern…",
      fmVertPos: "Vertikale Position",
      fmVPosTop: "Oben",
      fmVPosCenter: "Mitte",
      fmVPosBottom: "Unten",
      fmBookAnnotation: "Buchannotation (geteilt)",
      fmAnnotationPlaceholder: "Kurzbeschreibung für Titel-/Impressumsseite…",
      fmShowAnnotation: "Annotation anzeigen",
      fmUseBookAuthor: "Buchautor verwenden",
      fmTitlePresets: "Typografie-Preset",
      fmPreset_classic: "Klassisch",
      fmPreset_minimal: "Minimal",
      fmPreset_modern: "Modern",
      fmPreset_bold: "Fett",
      fmTypography: "Typografie",
      fmTitleFs: "Titel pt",
      fmSubtitleFs: "Untertitel pt",
      fmAuthorFs: "Autor pt",
      fmAnnotationFs: "Annot. pt",
      fmSpacing: "Abstand",
      fmLineHeight: "Zeilen-h.",
      fmAnnotationSource: "Wird aus dem Annotationsfeld oben übernommen",
      fmGenerateAnnotation: "Mit AI generieren",
      fmAnnotationPromptPlaceholder: "Beschreiben Sie Ihr Buch kurz: Genre, Handlung, Atmosphäre…",
      fmGenerateBtn: "✦ Annotation generieren",
      fmGenerating: "Wird generiert…",
      cpEditor: "Lektor",
      cpCoverDesigner: "Coverdesign",
    },
    footer: {
      faq: "Häufige Fragen",
      apiGuide: "Was ist eine API?",
      inspiration: "Tipps",
      codex: "Kodex",
      habits: "Schreibgewohnheiten",
      features: "Funktionen",
      models: "AI Modelle",
      github: "GitHub",
      tagline: "Für die, die von Herzen schreiben.",
    },
    habits: {
      title: "Schreibgewohnheiten",
      subtitle: "Dein kreativer Kalender. Jeder Schreibtag wird hier festgehalten.",
      streakLabel: "Tage",
      goalLabel: "Ziel",
      goalNone: "Kein Ziel gesetzt",
      goalWords: "Wörter/Tag",
      goalChapters: "Kapitel/Tag",
      setGoal: "Ziel setzen",
      saveGoal: "Speichern",
      cancelGoal: "Abbrechen",
      goalType: "Zieltyp",
      goalAmount: "Tagesziel",
      words: "Wörter",
      chapters: "Kapitel",
      noActivity: "Keine Aktivität für diesen Tag aufgezeichnet.",
      addNote: "Notiz hinzufügen",
      planSession: "Session planen",
      notePlaceholder: "Was planst du zu schreiben? Reflexion über die heutige Session...",
      save: "Speichern",
      totalDays: "Schreibtage gesamt",
      longestStreak: "Beste Serie",
      monthActivity: "Aktivität diesen Monat",
      today: "Heute",
      planned: "Geplant",
      wrote: "Geschrieben",
      edited: "Bearbeitet",
      created: "Neu begonnen",
      noEntries: "Noch keine Schreibsessions aufgezeichnet.",
      noEntriesHint: "Öffne ein Buch und fange an zu schreiben — deine Aktivität erscheint hier.",
    },
    freeMode: {
      title: "Kostenloser KI-Modus",
      badge: "Kostenlos",
      description: "Betrieben von Open-Source-Modellen. Kein API-Schlüssel erforderlich.",
      notAvailable: "Kostenlose KI ist gerade nicht verfügbar",
      retry: "Erneut versuchen",
      switchToPaid: "Meinen API-Schlüssel verwenden",
      rateLimit: "Der kostenlose Modus ist begrenzt. Füge deinen OpenAI-Schlüssel für unbegrenzten Zugang hinzu.",
      model: "Mistral 7B (Open-Source)",
      tip: "Der kostenlose Modus verwendet Open-Source-KI. Ergebnisse können von kostenpflichtigen Modellen abweichen.",
    },
    notFound: {
      phrases: [
        "Diese Seite ist mitten im Kapitel verschwunden.",
        "Diese Seite hat die falsche Abzweigung genommen.",
        "404: Kapitel nicht gefunden.",
        "Selbst die besten Autoren kommen in Sackgassen.",
        "Die Seite ist verschwunden, um ihre eigene Geschichte zu schreiben.",
      ],
      body: "Die URL existiert nicht oder die Seite wurde verschoben. Lass uns dich zurückbringen.",
      backToBooks: "Zu meinen Büchern",
      goBack: "Zurück",
      footer: "© 2026 Moodra · Für die, die von Herzen schreiben",
    },
    models: {
      back: "Zurück",
      title: "KI-Modell auswählen",
      subtitle: "Das Modell gilt für alle KI-Funktionen in Moodra. Preise laut",
      subtitleSuffix: ". Direkt von deinem Guthaben abgezogen.",
      cost: "Preise",
      inputTokens: "Eingabe-Token",
      outputTokens: "Ausgabe-Token",
      specs: "Eigenschaften",
      speed: "Geschwindigkeit",
      quality: "Qualität",
      economy: "Wirtschaft",
      active: "Aktiv",
      select: "Auswählen",
      selected: "Ausgewählt",
      saving: "Speichern...",
      modelChanged: "Modell geändert zu",
      modelChangedDesc: "Gilt für alle KI-Funktionen",
      errorTitle: "Fehler",
      errorDesc: "Modell konnte nicht gespeichert werden",
      footnote: "Preise zum Zeitpunkt der Entwicklung. Aktuelle Tarife prüfen auf",
    },
  },
};

export default t;
