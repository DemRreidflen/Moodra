# Moodra Space — AI Writing Platform

## Overview
Moodra is a next-gen AI writing environment for serious authors. The platform covers the full lifecycle of a book — from research and hypothesis-testing to character development and final writing. Clean cream/editorial design, block-based editor, interactive idea boards, and deep AI integration.

## Role Model Library (Research Panel → Models tab)
A specialist system for deep structural analysis of author minds.

### Schema: `authorRoleModels` extended columns
`rawSourceText`, `sourceMaterialRef`, `analysisStatus` ("empty" | "analyzed"), `conceptualTendencies`, `stylePatterns`, `structurePatterns`, `rhythmObservations`, `vocabularyTendencies`, `argumentBehavior`, `emotionalDynamics`, `reusableParameters` (+ existing `styleInstruction` reused as AI instruction).

### Deep Analysis Route
`POST /api/role-models/:id/deep-analyze` — accepts `{ rawSourceText, lang }`. Uses a specialist system prompt that instructs the AI NOT to summarize content but to analyze the mechanics of the author's mind. Returns structured JSON with all 9 analysis fields. Tries OpenAI with `response_format: json_object`, falls back to Pollinations. Updates the role model record.

### UI: `role-models-tab.tsx`
- **List view**: cards with color stripe, avatar initial, analysis status badge (Analyzed / Draft), conceptual tendencies preview, section pills
- **Editor view**: create form with color picker, name/author/source ref inputs, raw text textarea + .txt file upload
- **Detail view**: author profile header + Re-analyze button; collapsible Source Material section; 8 color-coded analysis sections (Conceptual Tendencies, Style Patterns, Structure Patterns, Rhythm Observations, Vocabulary Tendencies, Argument Behavior, Emotional Dynamics, Reusable Parameters); violet AI Style Instruction card; inline edit on every section via hover → pencil → textarea
- Wired into Research Panel as 6th tab "Models" (Brain icon)

## Meta-Prompt Architecture (Prompt Ecosystem)
The AI system uses a layered meta-prompt architecture (`server/promptEngine.ts`) — not flat prompts.

### Context Assembly (`assembleNoteContext`)
For every note-level AI action, the engine assembles a `NoteContext` from the database:
- **Object layer**: note content, type, status, importance, tags, semantic tags
- **Project layer**: book title, mode, genre, core idea, themes, tone
- **Connection layer**: linked notes (with snippets), linked sources (with summaries/quotes), linked drafts, collections, backlinked notes, recent notes in project

### Prompt Structure (`buildStructuredPrompt`)
Each assembled prompt contains 9 explicit components: agent role, system goal, object context, project context, connected context, task, desired output structure, tone of response, and transformation rules. Context selectors per intent control which layers are included.

### Specialist Agents (6 intents)
| Intent | Agent | Context layers |
|---|---|---|
| `connect` | Linker Agent | object + project + linked_notes + linked_sources + collections + recent_notes |
| `expand` | Expansion Agent | object + project + linked_notes + linked_sources + recent_notes |
| `distill` | Distillation Agent | object + project + linked_notes |
| `suggest_tags` | Tagging Agent | object + project + recent_notes |
| `to_draft` | Draft Agent | object + project + linked_notes + linked_sources + linked_drafts |
| `suggest_collection` | Classification Agent | object + project + collections + recent_notes |

### API Endpoint
`POST /api/ai/notes/:noteId/smart-action` — authenticated, accepts `{ bookId, intent, lang }`, returns `{ result, intent, contextSummary }`.

### UI
Notes editor has a compact AI action strip (Connect · Expand · Distill · Tags · To Draft) that renders results in an inline agent panel showing which context layers were used (linked notes count, sources count, etc.).

## Key Features
- **Notes System 2.0 + Obsidian-like features** (full atomic notes module in Research panel):
  - **Quick Capture bar**: single-line input → captures to Inbox instantly (Enter key), creates `isQuick: "true"` notes
  - **Inbox view**: all captured notes with 6 one-click actions (Keep active, Develop, → Draft, → Board, Archive, Delete)
  - **All Notes view**: searchable, filterable by type (12 types) and status; Orphan filter chip (notes with zero connections shown in red)
  - **Collections view**: flexible thematic containers (not folders); multi-color, multi-collection membership
  - **Graph view** (4th sub-tab): SVG force-directed knowledge graph (notes + drafts + sources); pan + zoom; shows central ideas bar, orphan highlight, node hover tooltip; click note to open
  - **Note editor Obsidian panels** (all collapsible):
    - **Backlinks**: shows which notes/drafts reference the current note (auto-computed, bidirectional); sections "Linked from" / "Used in drafts"
    - **Related Notes**: shared tags + explicit links + backlinks surfaced together with connection type badges
    - **Embedded Notes**: linked notes rendered as inline preview cards (title + content snippet + tags)
    - **Map of Content view**: special layout for `map_of_content` type notes — organized sections for core theme, concepts (tags), related notes, related drafts, related sources; open question notes flagged
    - **Local Graph**: per-note SVG sub-graph showing focal note + all its direct connections; embedded in editor panel
  - **Orphan detection**: computed from all linked note/draft/source/collection IDs; surfaced in All Notes filter + Global Graph
  - **12 note types**: quick_thought, concept, question, insight, quote, observation, scene_seed, argument_seed, character_note, research_note, reflection, **map_of_content** (sky blue)
  - **DB tables**: `notes` (extended with `collectionIds`, `isQuick`, `linkedSourceIds`, `linkedDraftIds`, `semanticTags`), `note_collections`
  - **API routes**: GET/POST `/api/books/:id/collections`, PATCH/DELETE `/api/collections/:id`
  - **Components**: `client/src/components/notes-tab.tsx`, `client/src/components/notes-graph.tsx` (SVG graph engine)
- **Sources Module** (Research panel — Library tab, fully replaced):
  - **9 source types**: article, website, pdf, document, book_excerpt, book, quote, research_snippet, custom — each with distinct icon + color theme
  - **List view**: search bar, type filter chips with live counts, source cards showing type icon, author, summary snippet, concept pills, tags, URL link, linked-notes count
  - **Editor view**: type selector chips, title, author, URL, importance (low/normal/high), raw content textarea (with file upload), summary, key concepts (rendered as colored pills), key quotes, tags, linked notes multi-select, linked drafts multi-select
  - **AI Actions**: Analyze (structured JSON → key ideas, themes, argument map, writing style, conceptual summary, project relevance) + Extract Quotes + Extract Concepts
  - **Source Actions**: → Note (creates a `research_note` from summary/concepts/quotes), → Board (injects a board node)
  - **AI Analysis panel** (collapsible): displays full structured results with conceptual summary, key idea list, theme chips, argument structure, writing style, and project relevance block
  - **File upload**: reads .txt/.doc/.docx up to 2 MB, auto-detects type, prefills editor
  - **DB schema extended**: `rawContent`, `linkedNoteIds`, `linkedDraftIds`, `importance`, `status`, `aiAnalysis` columns added to `sources` table
  - **Components**: `client/src/components/sources-tab.tsx`; wired into `research-panel.tsx` replacing old Library tab body
- **Two book modes**: Scientific (non-fiction, philosophy) and Fiction (novels, sci-fi)
- **Spell Check + T9 Autocorrect System** (LanguageTool-powered, fully integrated in block-editor):
  - **3 modes**: Off / Basic (native browser underlines only) / Smart (LanguageTool API via `/api/text-check` proxy)
  - **5 languages**: Auto, EN-US, RU-RU, UK-UA, DE-DE; stored in `localStorage` under `moodra_spell_check_settings`
  - **ABC button** in FormatToolbar: opens panel with mode switcher, language picker, live error count badge, Autocorrect toggle
  - **Smart mode**: auto-checks focused block (debounced 600ms), shows error panel below editor with suggested fixes (one-click apply) and per-rule ignore
  - **T9 Autocorrect**: intercepts Space/punctuation keydown, extracts last word, matches against LT errors, auto-replaces via `document.execCommand("insertText")` for native undo; dispatches `moodra:autocorrect-toast` event; only active when Smart mode + Autocorrect toggle ON
  - **Autocorrect setting**: `autocorrect: boolean` in localStorage; greyed-out in Off/Basic modes
  - **Files**: `client/src/lib/spell-check-service.ts`, `client/src/hooks/use-spell-check.ts`, `/api/text-check` proxy in `server/routes.ts`
- **Notion-like block editor**: 18+ block types with drag-and-drop reordering (@dnd-kit); solid FormatToolbar (no blur); selection-only AI improve; cursor-at-merge junction
- **List block types**: `bullet_item`, `numbered_item`, `check_item` — first-class blocks; Enter continues list, Backspace on empty exits to paragraph; numbered items auto-count consecutive runs; check_item toggles checked state via metadata.checked; all render in PDF/layout with proper indentation
- **Block nesting / indentLevel**: `metadata.indentLevel` (0–8) persists through layout preview (`layout-panel.tsx`) and PDF/HTML export (`server/routes.ts blockToHtml`). All block types apply `margin-left: indentLevel * 1.8em`. List items additionally offset by +1 level. Drop-cap and first-line-indent only apply at indentLevel 0. Indented paragraphs switch to left-align (not justify).
- **Floating format toolbar**: pill-shaped, backdrop-blur, no longer sticky top bar; list/indent buttons removed (lists are now block types); inline link popover (no dialog)
- **Deep Writing Mode**: True fullscreen overlay (`fixed inset-0 z-[200]`) — text always visible and scrollable
- **Focus Timer**: Compact inline toolbar widget — arc progress, pulse dot, pause/stop micro-buttons, never expands
- **Writing Sprint**: Toolbar timer button — set word goal + duration (5–60 min), countdown with +words written display, progress bar in deep writing mode bottom bar
- **Typewriter Mode**: Cursor auto-scrolls to vertical center of screen on each keypress (keyboard icon in toolbar)
- **Stats bar**: Click word count to toggle between words + reading time (÷225 wpm) / character count
- **AI Co-author**: Streaming SSE generation — continue, develop, improve, ideas; free Pollinations toggle; regenerate button; paste-own-text editing; deeper style analysis (pov, rhythm, dialogueStyle, styleInstruction); scrollable output area; **Deepen Analysis** — collapsible panel with optional custom prompt that re-runs style analysis with added nuance
- **Hypothesis system**: Track claims with statuses (hypothesis, testing, confirmed, refuted) + AI generation
- **AI Research**: 6 categorized source suggestions per query
- **Idea Board** (FigJam-inspired cognitive layer):
  - **13 node types**: idea, concept, chapter, hypothesis, argument, counterargument, quote, source, character, plot (core cards) + sticky, note_card, source_card, draft_card, chapter_seed, section, free_text, shape (extended)
  - **Sticky notes**: FigJam-style colored squares (8 colors), folded corner, no header, freeform text
  - **Sections/frames**: Transparent containers with colored title bar, renders behind cards (z-index 1)
  - **Shapes**: rect, circle, diamond, triangle, arrow — rendered as styled divs/SVG
  - **Semantic linked cards**: note_card / source_card link to real DB objects (linkedId + linkedType); clicking opens full original content popup; library tab shows live Notes/Sources from DB
  - **Library tab** in left panel: two sub-tabs (Notes/Sources), one-click "Add to board" creates a linked card; shows "on board" state
  - **Connections**: SVG curved edges (support/contradict/cause/develop/effect), live draw mode, labeled, deletable
  - **Align toolbar**: 6-axis alignment (left/center/right/top/middle/bottom) appears when ≥2 nodes selected
  - **Duplicate**: D key shortcut + button on each node
  - **Keyboard shortcuts**: D = duplicate, Delete = remove selected, Escape = deselect
  - **Quick-add toolbar**: sticky / section / shape buttons in top toolbar
  - **3-tab Add dialog**: Object cards / Semantic cards / Free objects — with color pickers and shape picker
  - **Board data**: stored as JSON blob in books.boardData, no DB migrations needed
- **Internal Cognitive Agent Engine** (`client/src/lib/agent-engine.ts`) — platform intelligence layer, not user-facing:
  - **8 internal agent roles**: Linker, Distiller, Expansion, Structuring, Tension, Relevance, Transformation, Mapping
  - Each agent is a pure analysis function that reads workspace data (notes, sources, board, chapters) and returns typed `Insight` objects
  - All analysis is client-side heuristic — zero API calls for insights computation
  - `runAllAgents(data, maxResults)` runs all 8 agents, deduplicates, ranks by priority, returns top N
  - Each `Insight` has an `actionTarget` (which editor tab to navigate to) — not agent function calls
  - **Smart Insights drawer** (lightbulb button in top bar): surfaced via `PredictiveInsights` component, shows up to 5 ranked suggestions; clicking an insight navigates to the relevant tab (notes/research/board/editor/layout)
  - The `/api/ai/cognitive-agent` server endpoint remains available for future AI-powered deeper analysis
- **Character database**: For fiction — biographies, traits, goals, conflicts
- **Notes & ideas**: Sticker-style colored cards (7 colors), drag-drop reorder (@dnd-kit), status chips (idea/draft/wip/done), list/card toggle; **quick-capture bar** (Enter to save instantly, Tab to expand to full dialog, click type icon to cycle type); **search filter** across title/content/tags; auto-resize textarea; Ctrl+Enter to save in dialog
- **Export**: EPUB and PDF (A5 book template with cover, TOC, chapter headers, page numbers, callout blocks)
- **Language system**: EN (default), RU, UA, DE — full UI + AI responses in chosen language
- **Layout Mode**: Full book preview with pagination, 4 layout presets (Classic/Vibe/Mono/Modern), paragraph splitting across pages, footer alignment (left/center/right), headings use book font, CSS zoom
- **Editor Modes**: Sheet mode (one chapter per view) + Canvas mode (all chapters in one scrollable view with inline editing)

## Design (Cream/Milky Editorial)
- **Background**: hsl(30, 58%, 97%) — warm cream
- **Accent**: #F96D1C (orange)
- **Cards**: hsl(30, 65%, 98.5%)
- **Text**: #1a1a1a / #2d2520
- **Muted**: #8a7a70

## Tech Stack
- **Frontend**: React + TypeScript, Wouter (routing), TanStack Query, shadcn/ui, Tailwind CSS, Framer Motion
- **Backend**: Express.js (TypeScript), tsx
- **AI**: OpenAI GPT-4o-mini via user's personal API key (no platform markup)
- **Database**: PostgreSQL via Drizzle ORM
- **Auth**: Google OAuth (passport-google-oauth20)
- **File storage**: multer (stored in /uploads/)

## Project Structure
```
Moodra-Space/
  client/src/
    pages/
      home.tsx              - Library of books
      book-editor.tsx       - Book editor (tabs: editor, characters?, notes, research, board, settings)
      settings.tsx          - User settings (profile, API key, language, token cost)
      faq.tsx               - FAQ page (fully translated, 8 Q&As)
      inspiration.tsx       - Inspiration articles (4 articles, fully translated)
      api-key-guide.tsx     - API key guide page
      login.tsx             - Login page with Google OAuth
    components/
      icons.tsx             - UNIQUE custom SVG icon pack (40+ icons, M-prefix)
      book-loader.tsx       - Minimalist flipping book loading animation
      block-editor.tsx      - Notion-like block editor
      chapter-editor.tsx    - Chapter editor + Deep Writing Mode (accepts bookId for typography sync)
      layout-mode.tsx       - Visual book layout preview + PDF/DOCX export (uses useBookSettings)
      idea-board.tsx        - Interactive idea board (canvas, SVG connections)
      research-panel.tsx    - Research (AI search, Hypotheses, Library)
      ai-panel.tsx          - AI co-author (SSE streaming)
      book-sidebar.tsx      - Chapter structure sidebar
      characters-panel.tsx  - Character database (fiction mode)
      notes-panel.tsx       - Notes and ideas
      book-settings.tsx     - Book settings (title, description, mode, cover)
      api-key-modal.tsx     - API key onboarding modal
      site-footer.tsx       - Footer with FAQ, API guide, Inspiration links
    contexts/
      language-context.tsx  - Language context (EN/RU/UA/DE, persisted to localStorage)
      ai-error-context.tsx  - AI error handling context
    hooks/
      use-book-settings.ts  - Shared layout/typography settings hook (localStorage key: moodra_layout_settings_${bookId})
                              BookTypographySettings interface used by both editor and layout mode
                              Fields: pageSize, margins, fontFamily, fontSize, lineHeight,
                                      paragraphSpacing, firstLineIndent, textAlign, headings,
                                      header/footer options
    lib/
      translations.ts       - Full translations for EN, RU, UA, DE
                              Includes: common, nav, editor, login, home, settings,
                                        apiModal, aiError, faq, inspiration, apiGuide,
                                        export, footer keys
  server/
    index.ts                - Express server entry
    routes.ts               - All API routes including export (EPUB, PDF)
    storage.ts              - DatabaseStorage class (Drizzle ORM)
    replit_integrations/auth/
      replitAuth.ts         - Google OAuth (conditional: skips if credentials missing)
```

## Environment Variables Required
- `DATABASE_URL` — PostgreSQL connection string
- `SESSION_SECRET` — Session encryption secret
- `GOOGLE_CLIENT_ID` — Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` — Google OAuth client secret
- `GOOGLE_CALLBACK_URL` — OAuth callback URL (optional, auto-detected)

## Icon Pack (icons.tsx)
All custom SVG icons with M-prefix naming:
- MBookOpen, MBookClosed, MBookFlip — book icons
- MQuill, MFeather, MInk — writing icons
- MAi, MSparkles, MBrain — AI/intelligence
- MFlask, MCompass — science/research
- MBulb, MNetwork — ideas
- MGear, MGlobe, MKey, MFlash, MHome — interface
- MPlus, MExport, MUser, MUsers, MLogout — actions
- MCheck, MArrowLeft, MArrowRight, MTrash, MSearch — navigation
- MQuote, MSave, MFileText, MX, MImagePlus — content
- MPdf, MEpub, MExternalLink, MMenu — documents
- MChevronDown, MChevronRight, MLoader, MCheckCircle — state
- MAlertCircle, MInfo, MStar, MTag, MGrid, MList — indicators
- MLink, MDrag, MCopy, MPalette — utility

## Language System
- Default: English
- Options: Ukrainian (ua), German (de), Харківський/ru (displayed last, no flag)
- Stored in localStorage as `moodra_lang`
- AI responses directed in chosen language via system prompt instruction
- All translations include: common, nav, editor, login, home, settings, apiModal, aiError, faq, inspiration, apiGuide, export, footer, notFound, models

## Pages
- `/` — Login (Google OAuth)
- `/home` — Book library
- `/book/:id` — Book editor (editor/characters/notes/research/board/settings tabs)
- `/settings` — User settings (API key, language, token usage)
- `/faq` — FAQ (8 Q&As, all 4 languages)
- `/inspiration` — Inspiration articles (4 articles, all 4 languages)
- `/api-key-guide` — API key guide (all 4 languages)
- `/codex` — Codex Moodra (6 authorship principles, manifesto, all 4 languages)
- `/models` — AI model selection (7 models, full translated descriptions, pricing dots)
- `*` — 404 page (fully translated, random phrase picker)

## Running the Project
```bash
cd Moodra-Space && npm run dev
```
Server runs on port 5000. Database schema: `npx drizzle-kit push`
