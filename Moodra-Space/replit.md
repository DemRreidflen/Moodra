# Moodra Space — AI Writing Platform

## Overview
Moodra is a next-gen AI writing environment for serious authors. The platform covers the full lifecycle of a book — from research and hypothesis-testing to character development and final writing. Clean cream/editorial design, block-based editor, interactive idea boards, and deep AI integration.

## Key Features
- **Two book modes**: Scientific (non-fiction, philosophy) and Fiction (novels, sci-fi)
- **Notion-like block editor**: 18+ block types with drag-and-drop reordering (@dnd-kit); solid FormatToolbar (no blur); selection-only AI improve; cursor-at-merge junction
- **List block types**: `bullet_item`, `numbered_item`, `check_item` — first-class blocks; Enter continues list, Backspace on empty exits to paragraph; numbered items auto-count consecutive runs; check_item toggles checked state via metadata.checked; all render properly in PDF (wrapped in `<ul>/<ol>`)
- **Floating format toolbar**: pill-shaped, backdrop-blur, no longer sticky top bar; list/indent buttons removed (lists are now block types); inline link popover (no dialog)
- **Deep Writing Mode**: True fullscreen overlay (`fixed inset-0 z-[200]`) — text always visible and scrollable
- **Focus Timer**: Compact inline toolbar widget — arc progress, pulse dot, pause/stop micro-buttons, never expands
- **Writing Sprint**: Toolbar timer button — set word goal + duration (5–60 min), countdown with +words written display, progress bar in deep writing mode bottom bar
- **Typewriter Mode**: Cursor auto-scrolls to vertical center of screen on each keypress (keyboard icon in toolbar)
- **Stats bar**: Click word count to toggle between words + reading time (÷225 wpm) / character count
- **AI Co-author**: Streaming SSE generation — continue, develop, improve, ideas; free Pollinations toggle; regenerate button; paste-own-text editing; deeper style analysis (pov, rhythm, dialogueStyle, styleInstruction); scrollable output area; **Deepen Analysis** — collapsible panel with optional custom prompt that re-runs style analysis with added nuance
- **Hypothesis system**: Track claims with statuses (hypothesis, testing, confirmed, refuted) + AI generation
- **AI Research**: 6 categorized source suggestions per query
- **Idea Board**: Canvas with draggable cards, SVG connections (support, contradict, cause, develop)
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
