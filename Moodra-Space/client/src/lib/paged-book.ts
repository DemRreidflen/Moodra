/**
 * paged-book.ts
 *
 * New book layout engine based on:
 *   - Paged.js  — CSS @page paged media engine (replaces custom pagination)
 *   - Hypher    — dictionary-based soft hyphenation (replaces greedy estimator)
 *   - CSS widows/orphans — browser-native widow & orphan control
 *   - CSS hyphens: auto + hyphenate-limit-chars: 5 3 3 — Hypher soft hyphens are
 *     preferred break points; browser algo catches missed words; strict char limits
 *     prevent single-letter splits
 *
 * Pipeline:
 *   Book content → softHyphenate → contentToHtml → settingsToCss
 *               → generatePagedJsHtml → Blob URL in iframe
 *
 * postMessage protocol (iframe ↔ React):
 *   Iframe → parent:  { type: "paged-ready", total: N, chapterPages: {ci: pageN} }
 *   Parent → iframe:  { type: "goto-page", page: N }          (1-based)
 *   Parent → iframe:  { type: "goto-chapter", chapterIdx: N }
 */

import Hypher from "hypher";
import enUS  from "hyphenation.en-us";
import ruRU  from "hyphenation.ru";
import deDE  from "hyphenation.de";
import ukUA  from "hyphenation.uk";

import type { BookTypographySettings } from "@/hooks/use-book-settings";
import type { FrontMatterSettings } from "@/hooks/use-front-matter";

// ── Hypher instances (created once, reused) ───────────────────────────
const hypherEn = new Hypher(enUS);
const hypherRu = new Hypher(ruRU);
const hypherDe = new Hypher(deDE);
const hypherUk = new Hypher(ukUA);

/** Pick the correct Hypher instance for a language code. */
function getHypher(lang: string): Hypher {
  if (lang === "ru") return hypherRu;
  if (lang === "de") return hypherDe;
  if (lang === "uk" || lang === "ua") return hypherUk;
  return hypherEn;
}

/**
 * Convert internal app language codes to valid BCP 47 lang tags for HTML.
 * This is required for CSS `hyphens: auto` — the browser's built-in hyphenation
 * dictionary lookup uses the `lang` attribute and requires proper language codes.
 * "ua" is the app's internal code for Ukrainian, but HTML/CSS needs "uk".
 */
function toBcp47(lang: string): string {
  const map: Record<string, string> = {
    ua: "uk",  // Ukrainian: app code → BCP 47
    ru: "ru",
    de: "de",
    en: "en",
  };
  return map[lang] ?? lang;
}

/**
 * Add soft hyphens to every word in a PLAIN TEXT segment.
 * Enforces minPrefix=2, minSuffix=2 (typographic minimum).
 */
function softHyphenateText(text: string, lang: string): string {
  const h = getHypher(lang);
  // Match Cyrillic + Latin word chars; skip too-short words (< 5 chars → nothing to split with 2+2 minimum)
  return text.replace(/[\w\u0430-\u044f\u0451\u0410-\u042f\u0401\u0400-\u04ff]+/gi, (word) => {
    if (word.length < 5) return word; // too short to split safely with min 2+2
    const parts = h.hyphenate(word);
    // Enforce minPrefix=2 and minSuffix=2: drop any split that would produce a
    // fragment shorter than 2 chars at the start or end of the word.
    const result: string[] = [];
    let accumulated = "";
    for (let i = 0; i < parts.length; i++) {
      accumulated += parts[i];
      const remaining = parts.slice(i + 1).join("");
      if (accumulated.length >= 2 && remaining.length >= 2) {
        result.push(accumulated + "\u00AD"); // soft hyphen after safe prefix
        accumulated = "";
      }
    }
    result.push(accumulated);
    return result.join("");
  });
}

/**
 * HTML-aware soft hyphenation: hyphenates only TEXT NODES, not tag names,
 * attribute names/values, or HTML entities. This prevents HTML corruption
 * which was the root cause of missing text fragments in the preview.
 *
 * Strategy: split the string into three token types:
 *   1. HTML entities  (&amp; &nbsp; &#160; etc.) — pass through untouched
 *   2. HTML tags      (<div class="..."> etc.)    — pass through untouched
 *   3. Text content   (everything else)            — hyphenate
 */
function softHyphenateHtml(html: string, lang: string): string {
  return html.replace(
    /(&(?:#\d+|#x[\da-f]+|[a-z]{2,8});)|(<[^>]*>)|([^<&]+)/gi,
    (match, entity, tag, text) => {
      if (entity || tag) return match; // never touch tags or entities
      return softHyphenateText(text, lang);
    },
  );
}

// ── Sanitisation helpers ──────────────────────────────────────────────
function sanitize(html: string): string {
  return (html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/\bon\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/\bon\w+\s*=\s*'[^']*'/gi, "")
    .replace(/javascript:/gi, "");
}
function esc(s: string): string {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ── Block types ───────────────────────────────────────────────────────
interface Block { type: string; content: string; metadata?: any; }

function parseBlocks(raw: unknown): Block[] {
  let arr: unknown[] = [];
  try { arr = typeof raw === "string" ? JSON.parse(raw) : (Array.isArray(raw) ? raw : []); } catch {}
  return (arr as Block[]).map((b) => ({ type: b.type || "paragraph", content: String(b.content || ""), metadata: (b as any).metadata }));
}

function blockToHtml(b: Block, lang: string, s: BookTypographySettings): string {
  const rawContent = sanitize(b.content);
  if (!rawContent && b.type !== "divider" && b.type !== "pagebreak") return "";

  // Use HTML-aware hyphenation so that tag names / attribute values are never mutated.
  // This was the root cause of missing text in preview (corrupted HTML tags).
  const hyph = (html: string) => softHyphenateHtml(html, lang);

  switch (b.type) {
    case "h1":
    case "heading":        return `<h2 class="bh1">${hyph(rawContent)}</h2>`;
    case "h2":             return `<h3 class="bh2">${hyph(rawContent)}</h3>`;
    case "h3":             return `<h4 class="bh3">${hyph(rawContent)}</h4>`;
    case "quote":          return `<blockquote class="bquote">${hyph(rawContent)}</blockquote>`;
    case "hypothesis":     return `<div class="callout ch"><span class="ci">◆</span><div>${hyph(rawContent)}</div></div>`;
    case "argument":       return `<div class="callout ca"><span class="ci">✓</span><div>${hyph(rawContent)}</div></div>`;
    case "counterargument":return `<div class="callout cc"><span class="ci">✗</span><div>${hyph(rawContent)}</div></div>`;
    case "idea":           return `<div class="callout ci_"><span class="ci">◉</span><div>${hyph(rawContent)}</div></div>`;
    case "question":       return `<div class="callout cq"><span class="ci">?</span><div>${hyph(rawContent)}</div></div>`;
    case "bullet_item":    return `<li class="blist-item">${hyph(rawContent)}</li>`;
    case "numbered_item":  return `<li class="blist-item">${hyph(rawContent)}</li>`;
    case "check_item":     return `<li class="blist-item bcheck">${hyph(rawContent)}</li>`;
    case "divider":        return `<hr class="bdiv"/>`;
    case "pagebreak":      return `<div class="explicit-pagebreak"></div>`;
    default:               return rawContent ? `<p>${hyph(rawContent)}</p>` : "";
  }
}

// ── CSS generator ─────────────────────────────────────────────────────

interface PagedBookInput {
  book:        { title: string; language?: string | null };
  chapters:    { title: string; content: unknown }[];
  settings:    BookTypographySettings;
  frontMatter: FrontMatterSettings;
  lp:          Record<string, string>;
  printMode?:  boolean;
  zoom?:       number;
}

function settingsToCss(input: PagedBookInput): string {
  const { settings: s, book, frontMatter: fm, lp } = input;

  const PAGE_SIZES: Record<string, { width: number; height: number }> = {
    A4: { width: 210, height: 297 },
    A5: { width: 148, height: 210 },
    B5: { width: 176, height: 250 },
  };
  const ps = PAGE_SIZES[s.pageSize] ?? PAGE_SIZES["A5"];

  const hasHeader = s.headerEnabled;
  const hasFooter = s.footerPageNumber || s.footerBookTitle;
  const footerAlign = s.footerAlignment ?? "center";

  const footerContent = (() => {
    const parts: string[] = [];
    if (s.footerBookTitle) parts.push(`"${book.title.replace(/"/g, "'")}"`);
    if (s.footerPageNumber) parts.push("counter(page)");
    if (parts.length === 0) return '""';
    return parts.join(' " · " ');
  })();

  const headerLeftContent  = s.headerLeft  ? `"${s.headerLeft.replace(/"/g, "'")}"` : '""';
  const headerRightContent = s.headerRight ? `"${s.headerRight.replace(/"/g, "'")}"` : '""';

  // Margin positions for @page margin boxes
  const footerMarginBox = (() => {
    if (!hasFooter) return "";
    if (footerAlign === "mirror") return "";
    const box = footerAlign === "left" ? "@bottom-left" :
                footerAlign === "right" ? "@bottom-right" : "@bottom-center";
    return `${box} { content: ${footerContent}; font-family: ${s.fontFamily}; font-size: 8pt; color: #999; }`;
  })();

  const mirrorFooterRules = hasFooter && footerAlign === "mirror" ? `
@page :left  { @bottom-left  { content: ${footerContent}; font-family: ${s.fontFamily}; font-size: 8pt; color: #999; } }
@page :right { @bottom-right { content: ${footerContent}; font-family: ${s.fontFamily}; font-size: 8pt; color: #999; } }` : "";

  const headerMarginBoxes = !hasHeader ? "" : `
    @top-left  { content: ${headerLeftContent};  font-family: ${s.fontFamily}; font-size: 7pt; color: #bbb; }
    @top-right { content: ${headerRightContent}; font-family: ${s.fontFamily}; font-size: 7pt; color: #bbb; }`;

  return `
/* ── @page rules (Paged.js) ─────────────────────────────────── */
@page {
  size: ${ps.width}mm ${ps.height}mm;
  margin-top:    ${s.marginTop}mm;
  margin-bottom: ${s.marginBottom}mm;
  margin-left:   ${s.marginLeft}mm;
  margin-right:  ${s.marginRight}mm;
  ${headerMarginBoxes}
  ${footerMarginBox}
}

/* Front-matter pages: no header/footer */
@page front-matter {
  @top-left   { content: none; }
  @top-center { content: none; }
  @top-right  { content: none; }
  @bottom-left   { content: none; }
  @bottom-center { content: none; }
  @bottom-right  { content: none; }
}

/* Chapter start pages: no header */
@page chapter-start {
  @top-left   { content: none; }
  @top-center { content: none; }
  @top-right  { content: none; }
  ${footerMarginBox}
}

${mirrorFooterRules}

/* ── Base typography ────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html, body {
  font-family: ${s.fontFamily};
  font-size: ${s.fontSize}pt;
  line-height: ${s.lineHeight};
  letter-spacing: ${(s.letterSpacing ?? 0)}em;
  color: #1a1007;
  background: #cdc7bf;
  font-kerning: normal;
  font-feature-settings: "kern" 1, "liga" 1, "calt" 1;
  text-rendering: optimizeLegibility;
  /* CSS-native widow & orphan control */
  widows: 2;
  orphans: 2;
  /* Allow browser hyphenation so Paged.js can show the hyphen dash at page-end
     word splits. Soft hyphens from Hypher serve as preferred break points.
     hyphenate-limit-chars prevents illegal short-fragment splits (min 5 chars
     total, at least 3 before and 3 after the hyphen). */
  hyphens: auto;
  -webkit-hyphens: auto;
  hyphenate-limit-chars: 5 3 3;
  hyphenate-limit-lines: 3;
  hyphenate-limit-last: always;
}

/* ── Paragraphs ─────────────────────────────────────────────── */
p {
  text-indent: ${s.firstLineIndent}em;
  margin: 0;
  text-align: ${s.textAlign};
  word-break: normal;
  overflow-wrap: normal;
  hyphens: auto;
  -webkit-hyphens: auto;
}
p + p { margin-top: ${s.paragraphSpacing * s.fontSize}pt; }
blockquote + p,
h2 + p, h3 + p, h4 + p { text-indent: 0; }

/* ── Headings ───────────────────────────────────────────────── */
.bh1 {
  font-size: ${s.h1Size}pt;
  font-weight: 700;
  line-height: 1.25;
  margin-top: ${s.lineHeight * 1.8}em;
  margin-bottom: ${s.lineHeight * 0.5}em;
  break-after: avoid;
  page-break-after: avoid;
  widows: 3; orphans: 3;
  hyphens: none;
}
.bh2 {
  font-size: ${s.h2Size}pt;
  font-weight: 600;
  line-height: 1.3;
  margin-top: ${s.lineHeight * 1.4}em;
  margin-bottom: ${s.lineHeight * 0.4}em;
  break-after: avoid;
  page-break-after: avoid;
  widows: 3; orphans: 3;
  hyphens: none;
}
.bh3 {
  font-size: ${s.h3Size}pt;
  font-weight: 600;
  line-height: 1.3;
  margin-top: ${s.lineHeight * 1.2}em;
  margin-bottom: ${s.lineHeight * 0.3}em;
  break-after: avoid;
  page-break-after: avoid;
  hyphens: none;
}

/* ── Callouts / Quotes ──────────────────────────────────────── */
blockquote.bquote {
  margin: ${s.lineHeight}em ${s.firstLineIndent * 1.5}em;
  font-style: italic;
  color: #555;
  border-left: 2px solid #d4c5b0;
  padding-left: ${s.firstLineIndent}em;
  break-inside: avoid;
  page-break-inside: avoid;
}
.callout {
  display: flex; gap: 0.5em;
  margin: ${s.lineHeight * 0.6}em 0;
  padding: ${s.lineHeight * 0.4}em ${s.firstLineIndent}em;
  border-radius: 4px;
  break-inside: avoid;
  page-break-inside: avoid;
  font-size: ${s.fontSize - 0.5}pt;
}
.callout .ci { flex-shrink: 0; font-size: 0.8em; margin-top: 0.15em; }
.ch { background: #faf7f2; border-left: 3px solid #c4a882; }
.ca { background: #f4fbf4; border-left: 3px solid #8dbe8d; }
.cc { background: #fdf4f4; border-left: 3px solid #be8d8d; }
.ci_ { background: #f4f7fd; border-left: 3px solid #8da3be; }
.cq { background: #fdfaf0; border-left: 3px solid #bebe8d; }

/* ── Divider ────────────────────────────────────────────────── */
hr.bdiv {
  border: none;
  border-top: 1pt solid #e0ddd8;
  margin: ${s.lineHeight * 1.2}em ${s.firstLineIndent * 2}em;
  break-after: avoid;
}

/* ── Explicit page break ────────────────────────────────────── */
.explicit-pagebreak {
  break-before: page;
  page-break-before: always;
  height: 0;
}

/* ── Chapter structure ──────────────────────────────────────── */
.chapter {
  break-before: page;
  page-break-before: always;
  page: chapter-start;
}
.ch-header {
  text-align: center;
  padding-bottom: ${s.lineHeight * 2}em;
}
.ch-title {
  font-family: ${s.fontFamily};
  font-size: ${s.h1Size}pt;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.01em;
  hyphens: none;
  color: #1a1007;
  margin-bottom: 0.3em;
}


/* After headings: no indent on immediately following paragraph */
.ch-body > h2 + p, .ch-body > h3 + p, .ch-body > h4 + p { text-indent: 0; }

/* ── Front-matter pages ─────────────────────────────────────── */
.front-matter-page {
  page: front-matter;
  break-before: page;
  page-break-before: always;
  height: calc(${ps.height}mm - ${s.marginTop + s.marginBottom}mm);
  display: flex;
  flex-direction: column;
}

/* Title page */
.title-page {
  justify-content: space-between;
  padding: 8% 0 6%;
}
.title-align-center { align-items: center; text-align: center; }
.title-align-left   { align-items: flex-start; text-align: left; }
.title-align-right  { align-items: flex-end; text-align: right; }
.title-ornament { font-size: 18pt; color: #d4c5b0; margin-bottom: 1em; }
.title-top-line { width: 40px; height: 2px; background: #d4c5b0; margin-bottom: 1em; }
.title-mid-line { width: 40px; height: 1px; background: #d4c5b0; margin: 0.5em 0; }
.title-main { font-size: var(--t-fs, 28pt); font-weight: 700; line-height: 1.2; letter-spacing: -0.01em; margin-bottom: 0.4em; hyphens: none; }
.title-sub  { font-size: var(--s-fs, 13pt); color: #888; font-style: italic; margin-bottom: 0.3em; }
.title-author { font-size: var(--a-fs, 12pt); color: #555; letter-spacing: 0.05em; }
.title-bottom-block { margin-top: auto; padding-top: 1em; }
.title-publisher { font-size: ${s.fontSize - 1}pt; color: #888; letter-spacing: 0.06em; text-transform: uppercase; }
.title-cityYear  { font-size: ${s.fontSize - 1}pt; color: #aaa; margin-top: 4pt; }

/* Copyright page */
.copyright-page {
  font-size: var(--cp-fs, ${s.fontSize - 1}pt);
  color: #555;
  line-height: var(--cp-lh, 1.7);
  padding: 4% 0;
}
.copyright-align-left { align-items: flex-start; text-align: left; }
.copyright-align-center { align-items: center; text-align: center; }
.copyright-align-right { align-items: flex-end; text-align: right; }
.cp-rights { max-width: 92%; line-height: 1.65; margin-bottom: 1.6em; }
.cp-spacer { flex: 1; }
.cp-bottom { padding-bottom: 20pt; }
.cp-isbn { margin-bottom: 1em; }
.cp-line { margin-bottom: 2pt; line-height: 1.65; }
.cp-copyright { color: #333; font-weight: 500; margin-top: 0.3em; }

/* Dedication page */
.dedication-page {
  padding: 4% 0;
}
.dedication-v-top    { justify-content: flex-start; padding-top: 20%; }
.dedication-v-center { justify-content: center; }
.dedication-v-bottom { justify-content: flex-end; padding-bottom: 20%; }
.dedication-align-left   { align-items: flex-start; text-align: left; }
.dedication-align-center { align-items: center; text-align: center; }
.dedication-align-right  { align-items: flex-end; text-align: right; }
.dedication-text {
  font-size: var(--ded-fs, ${s.fontSize + 0.5}pt);
  font-style: italic;
  color: #555;
  line-height: var(--ded-lh, 1.8);
  max-width: 80%;
}

/* TOC */
.toc-page { padding: 8pt 0; }
.toc-heading {
  font-size: ${s.h2Size}pt;
  text-align: center;
  margin-bottom: 20pt;
  font-weight: 600;
  letter-spacing: 0.05em;
  color: #333;
  hyphens: none;
}
.toc-list { display: flex; flex-direction: column; gap: 6pt; }
.toc-row {
  display: flex; align-items: baseline;
  gap: 4pt;
  font-size: ${s.fontSize}pt;
  break-inside: avoid;
}
.toc-num   { color: #bbb; font-size: ${s.fontSize - 1}pt; min-width: 1.8em; }
.toc-title { color: #333; }
.toc-dots  { flex: 1; border-bottom: 1pt dotted #d8d3cc; margin-bottom: 2pt; }
.toc-page-ref {
  color: #888;
  font-size: ${s.fontSize - 0.5}pt;
  min-width: 2em;
  text-align: right;
}
/* Paged.js target-counter for automatic TOC page numbers */
.toc-page-ref::after {
  content: target-counter(attr(href), page);
}

/* ── Lists ──────────────────────────────────────────────────── */
.blist-ul,
.blist-ol,
.blist-checklist {
  margin: ${s.lineHeight * 0.5}em 0;
  padding-left: ${s.firstLineIndent * 2}em;
  break-inside: avoid-column;
}
.blist-ul   { list-style-type: disc; }
.blist-ol   { list-style-type: decimal; }
.blist-checklist { list-style-type: none; padding-left: ${s.firstLineIndent}em; }
.blist-item {
  margin: ${s.lineHeight * 0.15}em 0;
  font-size: ${s.fontSize}pt;
  line-height: ${s.lineHeight};
}
.blist-checklist .blist-item::before {
  content: "☐ ";
  font-size: 0.9em;
}
.blist-checklist .bchecked::before {
  content: "☑ ";
  color: #5a9e5a;
  text-decoration: none;
}
.blist-checklist .bchecked {
  color: #999;
  text-decoration: line-through;
}

/* ── Print overrides ────────────────────────────────────────── */
@media print {
  html, body { color: #000; background: #fff !important; }
  /* Remove box-shadow from page wrappers — the shadow bleeds into the PDF
     page area and creates a gray stripe at the bottom of each page.      */
  .pagedjs_page,
  .pagedjs_sheet,
  .pagedjs_pages {
    box-shadow: none !important;
    filter: none !important;
  }
}

/* ── Pagedjs canvas + page cards ────────────────────────────── */
/* Force canvas background everywhere Paged.js might reset it */
html, body,
.pagedjs_pages,
.pagedjs_pages_wrapper {
  background: #cdc7bf !important;
}

.pagedjs_page {
  background: #ffffff !important;
  border-radius: 2px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.12), 0 8px 32px rgba(0,0,0,0.16), 0 1px 3px rgba(0,0,0,0.08);
}

/* ── View mode layouts ──────────────────────────────────────── */
/* Single page: vertical column, centered */
body[data-view="single"] .pagedjs_pages {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
  padding: 32px 24px;
  min-height: 100vh;
}
/* Spread: two pages side by side */
body[data-view="spread"] .pagedjs_pages {
  display: grid;
  grid-template-columns: auto auto;
  gap: 4mm 6mm;
  justify-content: center;
  align-content: start;
  padding: 32px 24px;
  min-height: 100vh;
}
body[data-view="spread"] .pagedjs_page:nth-child(2n+1) {
  box-shadow: -2px 0 0 rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.14), 0 1px 3px rgba(0,0,0,0.08);
}
body[data-view="spread"] .pagedjs_page:nth-child(2n) {
  box-shadow: 2px 0 0 rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.14), 0 1px 3px rgba(0,0,0,0.08);
}

/* ── Hyphenation inside Paged.js page content ───────────────── */
.pagedjs_page_content p,
.pagedjs_area p {
  hyphens: auto;
  -webkit-hyphens: auto;
}
.pagedjs_page_content {
  overflow-x: visible;
}

/* ── Pagedjs margin boxes — remove any accidental backgrounds ── */
.pagedjs_margin,
.pagedjs_margin-top,
.pagedjs_margin-top-left,
.pagedjs_margin-top-center,
.pagedjs_margin-top-right,
.pagedjs_margin-bottom,
.pagedjs_margin-bottom-left,
.pagedjs_margin-bottom-center,
.pagedjs_margin-bottom-right,
.pagedjs_margin-left,
.pagedjs_margin-left-top,
.pagedjs_margin-left-middle,
.pagedjs_margin-left-bottom,
.pagedjs_margin-right,
.pagedjs_margin-right-top,
.pagedjs_margin-right-middle,
.pagedjs_margin-right-bottom,
.pagedjs_margin-top-left-corner,
.pagedjs_margin-top-right-corner,
.pagedjs_margin-bottom-left-corner,
.pagedjs_margin-bottom-right-corner {
  background: transparent !important;
  background-color: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

/* Ensure the sheet (printable area wrapper) has no extra bottom area */
.pagedjs_sheet {
  background: transparent !important;
}
.pagedjs_bleed,
.pagedjs_bleed-top,
.pagedjs_bleed-bottom,
.pagedjs_bleed-left,
.pagedjs_bleed-right {
  background: transparent !important;
  display: none !important;
}
`;
}

// ── HTML content builder ──────────────────────────────────────────────

function buildFrontMatter(
  book: { title: string; language?: string | null },
  fm: FrontMatterSettings,
  chapters: { title: string }[],
  lp: Record<string, string>,
  s: BookTypographySettings,
): string {
  const parts: string[] = [];
  const lang = book.language ?? "ru";

  // Title page
  if (fm.titlePage?.enabled) {
    const tp  = fm.titlePage;
    const titleText = tp.useBookTitle ? book.title : (tp.customTitle || book.title);
    const align = tp.alignment ?? "center";
    const deco  = tp.decorativeStyle ?? "none";
    const tfs   = tp.titleFontSize   ?? 28;
    const sfs   = tp.subtitleFontSize ?? 13;
    const afs   = tp.authorFontSize  ?? 12;
    const sp    = tp.elementSpacing  ?? 1.2;
    const lh    = tp.titleLineHeight ?? 1.2;
    parts.push(`
<div class="front-matter-page title-page title-align-${align}" style="--t-fs:${tfs}pt;--s-fs:${sfs}pt;--a-fs:${afs}pt;--sp:${sp}em;--lh:${lh}">
  ${deco === "ornament" ? '<div class="title-ornament">✦</div>' : ""}
  ${deco === "lines"    ? '<div class="title-top-line"></div>'   : ""}
  <h1 class="title-main">${esc(titleText)}</h1>
  ${tp.subtitle ? `<div class="title-sub">${esc(tp.subtitle)}</div>` : ""}
  ${deco === "lines" ? '<div class="title-mid-line"></div>' : ""}
  ${tp.author ? `<div class="title-author">${esc(tp.author)}</div>` : ""}
  <div class="title-bottom-block">
    ${tp.publisherName ? `<div class="title-publisher">${esc(tp.publisherName)}</div>` : ""}
    ${(tp.city || tp.year) ? `<div class="title-cityYear">${[tp.city, tp.year].filter(Boolean).map(esc).join(" · ")}</div>` : ""}
  </div>
</div>`);
  }

  // Copyright page
  if (fm.copyrightPage?.enabled) {
    const cp = fm.copyrightPage;
    const align = cp.alignment ?? "left";
    const cpFs = cp.fontSize ?? 9;
    const cpLh = cp.lineHeight ?? 1.5;
    parts.push(`
<div class="front-matter-page copyright-page copyright-align-${align}" style="--cp-fs:${cpFs}pt;--cp-lh:${cpLh}">
  ${cp.rights ? `<div class="cp-rights">${esc(cp.rights)}</div>` : ""}
  <div class="cp-spacer"></div>
  <div class="cp-bottom">
    ${cp.isbn       ? `<div class="cp-isbn">ISBN ${esc(cp.isbn)}</div>` : ""}
    ${cp.editor     ? `<div class="cp-line">${lp.cpEditor || "Editor"}: ${esc(cp.editor)}</div>` : ""}
    ${cp.coverDesigner ? `<div class="cp-line">${lp.cpCoverDesigner || "Cover design"}: ${esc(cp.coverDesigner)}</div>` : ""}
    ${(cp.copyrightYear || cp.copyrightHolder) ? `<div class="cp-line cp-copyright">© ${[cp.copyrightYear, cp.copyrightHolder].filter(Boolean).map(esc).join(", ")}</div>` : ""}
  </div>
</div>`);
  }

  // Dedication page
  if (fm.dedicationPage?.enabled) {
    const dp   = fm.dedicationPage;
    const vpos = dp.verticalPosition ?? "center";
    const align = dp.alignment ?? "center";
    const dedFs = dp.fontSize   ?? 12;
    const dedLh = dp.lineHeight ?? 1.8;
    parts.push(`
<div class="front-matter-page dedication-page dedication-v-${vpos} dedication-align-${align}" style="--ded-fs:${dedFs}pt;--ded-lh:${dedLh}">
  <div class="dedication-text">${esc(dp.text ?? "")}</div>
</div>`);
  }

  // TOC
  if (fm.tocEnabled) {
    const tocRows = chapters.map((ch, i) => `
      <div class="toc-row">
        <span class="toc-num">${i + 1}</span>
        <span class="toc-title">${esc(ch.title)}</span>
        <span class="toc-dots"></span>
        <a class="toc-page-ref" href="#chapter-${i}"></a>
      </div>`).join("\n");

    parts.push(`
<div class="front-matter-page toc-page">
  <h2 class="toc-heading">${lp.tocHeading || "Table of Contents"}</h2>
  <div class="toc-list">${tocRows}</div>
</div>`);
  }

  return parts.join("\n");
}

function wrapListItems(rawHtmlParts: string[], blocks: Block[]): string {
  const result: string[] = [];
  let i = 0;
  while (i < rawHtmlParts.length) {
    const b = blocks[i];
    if (b.type === "bullet_item") {
      const items: string[] = [];
      while (i < blocks.length && blocks[i].type === "bullet_item") {
        if (rawHtmlParts[i]) items.push(rawHtmlParts[i]);
        i++;
      }
      if (items.length) result.push(`<ul class="blist-ul">${items.join("")}</ul>`);
    } else if (b.type === "numbered_item") {
      const items: string[] = [];
      while (i < blocks.length && blocks[i].type === "numbered_item") {
        if (rawHtmlParts[i]) items.push(rawHtmlParts[i]);
        i++;
      }
      if (items.length) result.push(`<ol class="blist-ol">${items.join("")}</ol>`);
    } else if (b.type === "check_item") {
      const items: string[] = [];
      while (i < blocks.length && blocks[i].type === "check_item") {
        const checked = blocks[i].metadata?.checked === true;
        const raw = rawHtmlParts[i];
        if (raw) items.push(raw.replace('<li class="blist-item bcheck">', `<li class="blist-item bcheck${checked ? " bchecked" : ""}">`));
        i++;
      }
      if (items.length) result.push(`<ul class="blist-checklist">${items.join("")}</ul>`);
    } else {
      if (rawHtmlParts[i]) result.push(rawHtmlParts[i]);
      i++;
    }
  }
  return result.join("\n");
}

function buildChapters(
  chapters: { title: string; content: unknown }[],
  s: BookTypographySettings,
  lang: string,
  lp: Record<string, string>,
): string {
  return chapters.map((ch, ci) => {
    const blocks = parseBlocks(ch.content).filter(
      (b) => b.content.trim() || b.type === "divider" || b.type === "pagebreak",
    );
    const rawHtmlParts = blocks.map((b) => blockToHtml(b, lang, s));
    const blocksHtml = wrapListItems(rawHtmlParts, blocks);

    return `
<section class="chapter" id="chapter-${ci}">
  <div class="ch-header">
    <h1 class="ch-title">${softHyphenateText(esc(ch.title), lang)}</h1>
  </div>
  <div class="ch-body">
    ${blocksHtml || '<p>—</p>'}
  </div>
</section>`;
  }).join("\n");
}

// ── postMessage bridge script (runs inside the iframe) ────────────────

function makeBridgeScript(zoom: number): string {
  return `
<script>
(function() {
  window.PagedConfig = { auto: false };

  function applyViewMode(mode) {
    document.body.setAttribute('data-view', mode || 'single');
  }

  window.addEventListener('load', function() {
    var paged = new Paged.Previewer();
    paged.preview().then(function(flow) {
      applyViewMode('single');

      // Apply zoom AFTER Paged.js has finished layout so page-break
      // calculations happen at 100% scale. Use CSS zoom property (not
      // transform:scale) so layout dimensions actually shrink, removing
      // white-gap artifacts.
      var z = ${zoom};
      if (z !== 1) {
        document.documentElement.style.zoom = String(z);
      }
      // Inject background override after Paged.js renders
      // in case Paged.js stylesheet overrides our initial CSS.
      var bgStyle = document.createElement('style');
      bgStyle.textContent = 'html,body,.pagedjs_pages,.pagedjs_pages_wrapper{background:#cdc7bf!important}';
      document.head.appendChild(bgStyle);

      var chapterPages = {};
      var allPages = document.querySelectorAll('.pagedjs_page');
      document.querySelectorAll('[id^="chapter-"]').forEach(function(el) {
        var ci = parseInt(el.id.replace('chapter-', ''), 10);
        var pg = el.closest('.pagedjs_page');
        if (pg) {
          var idx = Array.from(allPages).indexOf(pg);
          if (idx >= 0) chapterPages[ci] = idx + 1;
        }
      });
      window.parent.postMessage({ type: 'paged-ready', total: flow.total, chapterPages: chapterPages }, '*');
    });
  });

  window.addEventListener('message', function(e) {
    if (!e.data || typeof e.data !== 'object') return;

    if (e.data.type === 'set-view-mode') {
      applyViewMode(e.data.mode);
    }

    if (e.data.type === 'goto-page') {
      var n = parseInt(e.data.page, 10);
      var pages = document.querySelectorAll('.pagedjs_page');
      var target = pages[n - 1];
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    if (e.data.type === 'goto-chapter') {
      var ci = parseInt(e.data.chapterIdx, 10);
      var el = document.getElementById('chapter-' + ci);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
})();
</script>`;
}

// ── Print bridge script (runs in the print window — auto-triggers print dialog) ──

const PRINT_BRIDGE_SCRIPT = `
<script>
(function() {
  window.PagedConfig = { auto: false };
  window.addEventListener('load', function() {
    var paged = new Paged.Previewer();
    paged.preview().then(function() {
      // Short delay so Paged.js finishes painting before print dialog opens
      setTimeout(function() { window.print(); }, 400);
    });
  });
  // Close the tab automatically after the user dismisses the print dialog
  window.addEventListener('afterprint', function() {
    setTimeout(function() { window.close(); }, 600);
  });
})();
</script>`;

// ── Public API ────────────────────────────────────────────────────────

export interface PagedBookOptions {
  book:        { title: string; language?: string | null };
  chapters:    { title: string; content: unknown }[];
  settings:    BookTypographySettings;
  frontMatter: FrontMatterSettings;
  lp:          Record<string, string>;
  zoom?:       number;
  printMode?:  boolean;
  /** Absolute URL to paged.polyfill.js (must be absolute — blob:// iframes can't use relative paths). */
  pagedJsUrl:  string;
}

/**
 * Generate a complete HTML document for the Paged.js iframe renderer.
 *
 * The document:
 *   - Embeds hypher-pre-processed content (soft hyphens)
 *   - Uses @page CSS for page size, margins, header, footer
 *   - Relies on CSS `widows`/`orphans` and `hyphens: auto` + `hyphenate-limit-chars`
 *   - Includes the Paged.js polyfill (bundled — no CDN required)
 *   - Includes the postMessage bridge for React ↔ iframe communication
 */
export function generatePagedJsHtml(opts: PagedBookOptions): string {
  const { book, chapters, settings: s, frontMatter: fm, lp, zoom = 1, printMode = false, pagedJsUrl } = opts;
  const lang    = book.language ?? "ru";   // internal code — used for Hypher dict lookup
  const htmlLang = toBcp47(lang);           // BCP 47 — used for HTML lang="" and CSS hyphens:auto
  const css  = settingsToCss(opts);

  const frontMatterHtml = buildFrontMatter(book, fm, chapters, lp, s);
  const chaptersHtml    = buildChapters(chapters, s, lang, lp);

  // Print mode: hide shadows + background, use PRINT bridge (auto-triggers window.print())
  const printOverrideCss = printMode ? `
@media screen {
  body { background: #fff !important; }
  .pagedjs_page, .pagedjs_sheet, .pagedjs_pages { box-shadow: none !important; }
}` : "";

  const bridge = printMode ? PRINT_BRIDGE_SCRIPT : makeBridgeScript(zoom);

  return `<!DOCTYPE html>
<html lang="${htmlLang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(book.title)}</title>
<style>
${css}
${printOverrideCss}
</style>
${bridge}
<script src="${pagedJsUrl}"></script>
</head>
<body lang="${htmlLang}">
<div id="book-content">
${frontMatterHtml}
${chaptersHtml}
</div>
</body>
</html>`;
}

/**
 * Generate a print-optimised HTML document that auto-triggers the browser's
 * print dialog after Paged.js renders. The resulting PDF will look identical
 * to the in-app preview. Used by the Export PDF button.
 */
export function generatePrintHtml(opts: PagedBookOptions): string {
  return generatePagedJsHtml({ ...opts, zoom: 1, printMode: true });
}
