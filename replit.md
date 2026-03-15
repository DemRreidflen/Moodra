# Moodra Space

AI-powered desktop-only writing platform for authors. Built with React + TypeScript + Express.

## Recent Changes (March 2026)

- **layout-mode.tsx** — Full rework to page-based layout: individual `div.book-page` blocks (white pages + shadow on grey canvas). Single Page / Book Spread toggle. Prev/Next navigation + page counter. Export modal (PDF + DOCX) with format info. Keyboard ←/→ navigation. New translation keys in all 4 languages.

- **Logo** — Updated to 34px height on habits.tsx, features.tsx, mission.tsx, faq.tsx (was 28px)
- **features.tsx** — Removed "Moodra Space" violet badge from hero. Accordion replaced with responsive 3-column card grid (all items always visible, no clicks needed). Container widened to max-w-5xl. Unused `openCard`, `PREVIEW_ITEMS`, `ChevronDown` removed.
- **book-sidebar.tsx** — Added `prologue`, `subchapter`, `epilogue` to CHAPTER_TYPES. Updated getSubType map: part→chapter, chapter→subchapter, subchapter→section, section→scene.
- **notes-panel.tsx** — StickerCard redesigned as monochromatic cream notepad page (`#FAF7F2` base). CSS clip-path dog-ear fold at bottom-right corner. Only paperclip + tags use colorful type accent. All background color variance removed.
- **habits.tsx** — Writing session timer widget added (Play/Pause/Reset, persists in localStorage). Word count input to log words written per session (cumulative, also persists). Both reset together.
- **layout-panel.tsx** — AI Style Note textarea added in settings panel (above export buttons). Persists in localStorage as `moodra_layout_ai_prompt`. "✓ Saved" confirmation on blur.
- **ai-error-modal.tsx** — Full EN/RU/UA/DE i18n rewrite. Error types: `no_key`, `invalid_key`, `quota`. Accepts `featureCtx` prop for contextual messaging per feature (ai_panel, style, improve, codex, habits, general).
- **ai-error-context.tsx** — Now passes `lang` from LanguageContext and optional `featureCtx` to modal. `showAiError(type, featureCtx?)` and `handleAiError(err, featureCtx?)` signatures.
- **onboarding-modal.tsx** — New 4-step first-login modal (beta welcome → API key → Codex → Habits). Progress bar, step dots, all 4 languages. localStorage key `moodra_onboarding_v1_${userId}`.
- **App.tsx** — OnboardingModal replaces ApiKeyModal auto-show. Shown once per user on first login.
- **inspiration.tsx** — Emoji article icons replaced with Lucide icon components (PenLine, Bot, Brain, Microscope, User, Scissors, Flame, MessageCircle). Both main card and sidebar list updated.
- **features.tsx** — Accordion expandable feature cards with category filter tabs (All/Editor/AI/World/Habits/Platform). Clicking shows all items + navigation link to relevant page.
- **mission.tsx** — Timeline section removed entirely. Manifesto redesigned as elegant numbered paragraphs with Georgia serif font and large faded numbers.
- **models.tsx** — Gradient bridge div removed. Replaced with SVG torn-paper/notebook-edge divider. Dark section fully monochromatic violet (all amber/red/green/gray bar colors → violet shades). SiteFooter moved inside dark section with dark prop.
- **site-footer.tsx** — Now accepts `dark` prop. When dark=true, renders with violet text/border on transparent background for use inside dark sections.
- **settings.tsx** — Danger zone section redesigned with red-tinted background, red border, red dot indicator and red heading.
- **habits.tsx / features.tsx / mission.tsx** — Brand logo (icon + "moodra" italic + BETA) added to center of sticky header/nav in each page. faq.tsx already had it.
- **book-sidebar.tsx** — Per-chapter inline "+" subchapter button added (appears on hover). Clicking pre-selects the correct child type (part→chapter, chapter→section, section→scene) and opens the add form. Wrapped in Tooltip showing child type label.
- **layout-panel.tsx** — Canvas zoom system: replaced fixed 72% scale with dynamic `canvasZoom` state (35%–150%). Zoom slider, ZoomIn/ZoomOut buttons, % display, Fit button in toolbar. Ctrl+wheel zoom. Keyboard shortcuts Ctrl+= / Ctrl+- / Ctrl+0. Dot-grid canvas background.

## Architecture

- **Frontend**: React + Vite + TypeScript (in `Moodra-Space/client/`)
- **Backend**: Express + TypeScript (in `Moodra-Space/server/`)
- **DB**: PostgreSQL via Drizzle ORM (in `Moodra-Space/shared/`)
- **Auth**: Replit OAuth
- **AI**: OpenAI API (user's key) OR free Pollinations AI (auto-detected when no key set)

## Stack

- **UI**: Tailwind CSS + shadcn/ui components
- **State**: React Query for server state
- **Routing**: Wouter
- **Localization**: Custom `translations.ts` with 4 languages: EN / UA / DE / Харківський (RU)
- **Design**: Cream palette — `#F96D1C` accent, `hsl(30, 58%, 97%)` background

## Key Files

- `Moodra-Space/client/src/lib/translations.ts` — all UI strings (EN/RU/UA/DE)
- `Moodra-Space/client/src/App.tsx` — routes
- `Moodra-Space/client/src/pages/home.tsx` — main dashboard
- `Moodra-Space/client/src/pages/habits.tsx` — writing habits + calendar page
- `Moodra-Space/client/src/pages/codex.tsx` — Moodra Codex (12 principles + philosophy + method)
- `Moodra-Space/client/src/pages/models.tsx` — AI model selection + free AI status display
- `Moodra-Space/client/src/pages/mission.tsx` — Mission/About page (rewritten, more personal/raw)
- `Moodra-Space/client/src/hooks/use-free-mode.ts` — Auto-detects free mode from API key absence
- `Moodra-Space/client/src/pages/inspiration.tsx` — Platform Tips articles
- `Moodra-Space/client/src/hooks/use-streak.ts` — streak + writing log + goal management
- `Moodra-Space/server/routes.ts` — all API endpoints incl. AI routes

## Pages / Routes

| Path | Component | Description |
|---|---|---|
| `/` | Home | Book list, nav, streak badge |
| `/book/:id` | BookEditor | Full editor with AI panel |
| `/habits` | HabitsPage | Calendar, goals, writing log |
| `/codex` | CodexPage | 12 principles + philosophy manifesto |
| `/models` | ModelsPage | Model selection + free Mistral section |
| `/inspiration` | InspirationPage | Platform Tips articles |
| `/faq` | FaqPage | Frequently asked questions |
| `/settings` | SettingsPage | User settings |

## localStorage Keys

| Key | Description |
|---|---|
| `moodra_lang` | Selected language |
| `moodra_streak_v2` | Streak data (JSON) |
| `moodra_streak_goal` | Daily writing goal `{type, amount}` |
| `moodra_writing_log_v2` | Writing log entries array |
| `moodra_read_articles` | Read inspiration article IDs |
| `moodra_last_book` | Last opened book ID |

## AI Features

- **Paid AI**: OpenAI API (user's key stored encrypted) — GPT-4o, GPT-4o mini, etc.
- **Free AI**: `/api/ai/free` endpoint → HuggingFace Mistral 7B Instruct (no key required, rate-limited)
  - HF token: `HF_TOKEN` or `HUGGINGFACE_TOKEN` env var (optional, improves reliability)

## Language Picker Order

EN → UA → DE → Харківський(ru)

- Russian shown as "Харківський" without a flag emoji

## Deployment

- Type: `autoscale`
- Build: `npm --prefix Moodra-Space run build`
- Run: `npm --prefix Moodra-Space run start`
- Port: 5000

## Mobile

Desktop-only. Mobile blocker shown at `window.innerWidth < 1024`. Translated into all 4 languages.
