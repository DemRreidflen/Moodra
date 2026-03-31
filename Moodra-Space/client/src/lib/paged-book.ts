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
  book:        { title: string; language?: string | null; coverImage?: string | null };
  chapters:    { title: string; content: unknown }[];
  settings:    BookTypographySettings;
  frontMatter: FrontMatterSettings;
  lp:          Record<string, string>;
  printMode?:  boolean;
  zoom?:       number;
  designerPages?: { afterChapterIndex: number; imageUrl: string }[];
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
    return `${box} { content: ${footerContent}; font-family: ${s.fontFamily}; font-size: 9.5pt; color: #999; }`;
  })();

  const mirrorFooterRules = hasFooter && footerAlign === "mirror" ? `
@page :left  { @bottom-left  { content: ${footerContent}; font-family: ${s.fontFamily}; font-size: 9.5pt; color: #999; } }
@page :right { @bottom-right { content: ${footerContent}; font-family: ${s.fontFamily}; font-size: 9.5pt; color: #999; } }` : "";

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
${s.headingFontFamily ? `.bh1, .bh2, .bh3 { font-family: ${s.headingFontFamily}; }` : ""}
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
  font-family: ${s.headingFontFamily || s.fontFamily};
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

/* ── Cover page ─────────────────────────────────────────────── */
@page cover-page {
  margin: 0;
  @top-left   { content: none; }
  @top-center { content: none; }
  @top-right  { content: none; }
  @bottom-left   { content: none; }
  @bottom-center { content: none; }
  @bottom-right  { content: none; }
}
.cover-page {
  page: cover-page;
  break-before: page;
  page-break-before: always;
  width: ${ps.width}mm;
  height: ${ps.height}mm;
  margin: 0;
  padding: 0;
  display: flex;
  align-items: stretch;
}
.cover-page img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* ── Designer page ──────────────────────────────────────────── */
@page designer-page {
  margin: 0;
  @top-left   { content: none; }
  @top-center { content: none; }
  @top-right  { content: none; }
  @bottom-left   { content: none; }
  @bottom-center { content: none; }
  @bottom-right  { content: none; }
}
.designer-page {
  page: designer-page;
  break-before: page;
  page-break-before: always;
  width: ${ps.width}mm;
  height: ${ps.height}mm;
  margin: 0;
  padding: 0;
  display: flex;
  align-items: stretch;
}
.designer-page img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

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
.title-main { font-family: ${s.headingFontFamily || s.fontFamily}; font-size: var(--t-fs, 28pt); font-weight: 700; line-height: 1.2; letter-spacing: -0.01em; margin-bottom: 0.4em; hyphens: none; }
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
  font-family: ${s.headingFontFamily || s.fontFamily};
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

const TOC_LABELS: Record<string, string> = {
  ru: "Оглавление", uk: "Зміст", en: "Table of Contents", de: "Inhaltsverzeichnis",
};
const CP_EDITOR_LABELS: Record<string, string> = {
  ru: "Редактор", uk: "Редактор", en: "Editor", de: "Lektor",
};
const CP_COVER_LABELS: Record<string, string> = {
  ru: "Обложка", uk: "Обкладинка", en: "Cover design", de: "Coverdesign",
};

function buildFrontMatter(
  book: { title: string; language?: string | null; coverImage?: string | null },
  fm: FrontMatterSettings,
  chapters: { title: string }[],
  lp: Record<string, string>,
  s: BookTypographySettings,
): string {
  const parts: string[] = [];
  const lang = book.language ?? "ru";

  // Cover image page (always first if available)
  if (book.coverImage && book.coverImage.startsWith("data:")) {
    parts.push(`<div class="cover-page"><img src="${book.coverImage}" alt="Cover"/></div>`);
  }

  // Title page
  if (fm.titlePage?.enabled) {
    const tp  = fm.titlePage;
    const titleText = tp.useBookTitle ? book.title : (tp.customTitle || book.title);
    const align = tp.alignment ?? "center";
    const deco  = tp.decorativeStyle ?? "none";
    const tfs   = tp.titleFontSize   ?? 22;
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
    ${cp.editor     ? `<div class="cp-line">${CP_EDITOR_LABELS[lang] ?? "Editor"}: ${esc(cp.editor)}</div>` : ""}
    ${cp.coverDesigner ? `<div class="cp-line">${CP_COVER_LABELS[lang] ?? "Cover design"}: ${esc(cp.coverDesigner)}</div>` : ""}
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
  <h2 class="toc-heading">${TOC_LABELS[lang] ?? lp.tocHeading ?? "Table of Contents"}</h2>
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
  const parts: string[] = [];

  chapters.forEach((ch, ci) => {
    const blocks = parseBlocks(ch.content).filter(
      (b) => b.content.trim() || b.type === "divider" || b.type === "pagebreak",
    );
    const rawHtmlParts = blocks.map((b) => blockToHtml(b, lang, s));
    const blocksHtml = wrapListItems(rawHtmlParts, blocks);

    parts.push(`
<section class="chapter" id="chapter-${ci}">
  <div class="ch-header">
    <h1 class="ch-title">${softHyphenateText(esc(ch.title), lang)}</h1>
  </div>
  <div class="ch-body">
    ${blocksHtml || '<p>—</p>'}
  </div>
</section>`);
  });

  return parts.join("\n");
}

// ── postMessage bridge script (runs inside the iframe) ────────────────

function makeBridgeScript(zoom: number, designerPages?: { afterPage: number; imageUrl: string }[]): string {
  const dpJson = JSON.stringify(designerPages ?? []);
  return `
<script>
(function() {
  window.PagedConfig = { auto: false };
  var DESIGNER_PAGES = ${dpJson};

  function replaceInTextNodes(node, oldStr, newStr) {
    if (node.nodeType === 3) {
      var re = new RegExp('(^|\\D)' + oldStr + '(\\D|$)', 'g');
      var next = node.textContent.replace(re, function(_, pre, suf) { return pre + newStr + suf; });
      if (next !== node.textContent) node.textContent = next;
    } else {
      for (var i = 0; i < node.childNodes.length; i++) replaceInTextNodes(node.childNodes[i], oldStr, newStr);
    }
  }

  function shiftPageNum(pageEl, oldNum, newNum) {
    pageEl.setAttribute('data-page-number', String(newNum));
    pageEl.querySelectorAll('.pagedjs_margin-content').forEach(function(el) {
      replaceInTextNodes(el, String(oldNum), String(newNum));
    });
  }

  function injectDesignerPages(allPageEls) {
    if (!DESIGNER_PAGES.length) return 0;
    var sorted = DESIGNER_PAGES.slice().sort(function(a, b) { return a.afterPage - b.afterPage; });

    // Step 1: Renumber existing pages to account for designer page slots
    // Process from LAST to FIRST so earlier rewrites don't corrupt later lookups
    for (var i = allPageEls.length - 1; i >= 0; i--) {
      var pageEl = allPageEls[i];
      var pageNum = i + 1;
      var offset = 0;
      for (var j = 0; j < sorted.length; j++) { if (sorted[j].afterPage < pageNum) offset++; }
      if (offset > 0) shiftPageNum(pageEl, pageNum, pageNum + offset);
    }

    // Step 2: Add CSS for injected pages
    var dpStyle = document.createElement('style');
    dpStyle.textContent = '.injected-dp{display:block;overflow:hidden;box-sizing:border-box;margin:0 auto;}.injected-dp img{width:100%;height:100%;object-fit:cover;display:block;}@media print{.injected-dp{break-before:page;break-after:page;page-break-before:always;page-break-after:always;}}';
    document.head.appendChild(dpStyle);

    // Step 3: Inject divs in reverse order so earlier insertions don't shift indices
    sorted.slice().reverse().forEach(function(dp) {
      var pageEl = allPageEls[dp.afterPage - 1];
      if (!pageEl) return;
      var w = pageEl.offsetWidth; var h = pageEl.offsetHeight;
      var div = document.createElement('div');
      div.className = 'injected-dp';
      div.style.width = w + 'px'; div.style.height = h + 'px';
      var img = document.createElement('img'); img.src = dp.imageUrl; img.alt = '';
      div.appendChild(img);
      pageEl.insertAdjacentElement('afterend', div);
    });

    return sorted.length;
  }

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

      var allPages = Array.from(document.querySelectorAll('.pagedjs_page'));
      var dpCount = injectDesignerPages(allPages);
      var dpSorted = DESIGNER_PAGES.slice().sort(function(a, b) { return a.afterPage - b.afterPage; });

      var chapterPages = {};
      document.querySelectorAll('[id^="chapter-"]').forEach(function(el) {
        var ci = parseInt(el.id.replace('chapter-', ''), 10);
        var pg = el.closest('.pagedjs_page');
        if (pg) {
          var idx = allPages.indexOf(pg);
          if (idx >= 0) {
            var origPage = idx + 1;
            var offset = 0;
            for (var i = 0; i < dpSorted.length; i++) { if (dpSorted[i].afterPage < origPage) offset++; }
            chapterPages[ci] = origPage + offset;
          }
        }
      });
      window.parent.postMessage({ type: 'paged-ready', total: flow.total + dpCount, chapterPages: chapterPages }, '*');
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

function makePrintBridgeScript(designerPages?: { afterPage: number; imageUrl: string }[]): string {
  const dpJson = JSON.stringify(designerPages ?? []);
  return `
<script>
(function() {
  window.PagedConfig = { auto: false };
  var DESIGNER_PAGES = ${dpJson};
  function replaceInTextNodes(node, oldStr, newStr) {
    if (node.nodeType === 3) {
      var re = new RegExp('(^|\\D)' + oldStr + '(\\D|$)', 'g');
      var next = node.textContent.replace(re, function(_, pre, suf) { return pre + newStr + suf; });
      if (next !== node.textContent) node.textContent = next;
    } else {
      for (var k = 0; k < node.childNodes.length; k++) replaceInTextNodes(node.childNodes[k], oldStr, newStr);
    }
  }
  function shiftPageNum(pageEl, oldNum, newNum) {
    pageEl.setAttribute('data-page-number', String(newNum));
    pageEl.querySelectorAll('.pagedjs_margin-content').forEach(function(el) {
      replaceInTextNodes(el, String(oldNum), String(newNum));
    });
  }
  function injectDesignerPages(allPageEls) {
    if (!DESIGNER_PAGES.length) return;
    var sorted = DESIGNER_PAGES.slice().sort(function(a, b) { return a.afterPage - b.afterPage; });
    for (var i = allPageEls.length - 1; i >= 0; i--) {
      var pageEl = allPageEls[i]; var pageNum = i + 1; var offset = 0;
      for (var j = 0; j < sorted.length; j++) { if (sorted[j].afterPage < pageNum) offset++; }
      if (offset > 0) shiftPageNum(pageEl, pageNum, pageNum + offset);
    }
    var dpStyle = document.createElement('style');
    dpStyle.textContent = '.injected-dp{display:block;overflow:hidden;box-sizing:border-box;margin:0 auto;break-before:page;break-after:page;page-break-before:always;page-break-after:always;}.injected-dp img{width:100%;height:100%;object-fit:cover;display:block;}';
    document.head.appendChild(dpStyle);
    sorted.slice().reverse().forEach(function(dp) {
      var pageEl = allPageEls[dp.afterPage - 1];
      if (!pageEl) return;
      var w = pageEl.offsetWidth; var h = pageEl.offsetHeight;
      var div = document.createElement('div');
      div.className = 'injected-dp';
      div.style.width = w + 'px'; div.style.height = h + 'px';
      var img = document.createElement('img'); img.src = dp.imageUrl; img.alt = '';
      div.appendChild(img);
      pageEl.insertAdjacentElement('afterend', div);
    });
  }
  window.addEventListener('load', function() {
    var paged = new Paged.Previewer();
    paged.preview().then(function() {
      injectDesignerPages(Array.from(document.querySelectorAll('.pagedjs_page')));
      // Short delay so Paged.js finishes painting before print dialog opens
      setTimeout(function() { window.print(); }, 600);
    });
  });
  // Close the tab automatically after the user dismisses the print dialog
  window.addEventListener('afterprint', function() {
    setTimeout(function() { window.close(); }, 600);
  });
})();
</script>`;
}

// ── Public API ────────────────────────────────────────────────────────

export interface PagedBookOptions {
  book:        { title: string; language?: string | null; coverImage?: string | null };
  chapters:    { title: string; content: unknown }[];
  settings:    BookTypographySettings;
  frontMatter: FrontMatterSettings;
  lp:          Record<string, string>;
  zoom?:       number;
  printMode?:  boolean;
  designerPages?: { afterPage: number; imageUrl: string }[];
  /** Absolute URL to paged.polyfill.js (must be absolute — blob:// iframes can't use relative paths).
   *  Optional when using Cyrillic engine preview (no Paged.js loaded in that mode). */
  pagedJsUrl?: string;
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
  const { book, chapters, settings: s, frontMatter: fm, lp, zoom = 1, printMode = false, pagedJsUrl, designerPages } = opts;
  const lang    = book.language ?? "ru";   // internal code — used for Hypher dict lookup
  const htmlLang = toBcp47(lang);           // BCP 47 — used for HTML lang="" and CSS hyphens:auto
  const css  = settingsToCss(opts as any);

  const frontMatterHtml = buildFrontMatter(book, fm, chapters, lp, s);
  const chaptersHtml    = buildChapters(chapters, s, lang, lp);

  // Print mode: hide shadows + background, use PRINT bridge (auto-triggers window.print())
  const printOverrideCss = printMode ? `
@media screen {
  body { background: #fff !important; }
  .pagedjs_page, .pagedjs_sheet, .pagedjs_pages { box-shadow: none !important; }
}` : "";

  const bridge = printMode ? makePrintBridgeScript(designerPages) : makeBridgeScript(zoom, designerPages);

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

/**
 * Generate a Cyrillic Engine preview HTML document.
 *
 * Uses the EXACT SAME HTML structure and CSS classes as the server-side
 * Cyrillic export route (routes.ts cyrHtml builder), so the preview
 * faithfully matches what WeasyPrint will produce in the final PDF:
 *   - Same cover page (text-based, no image, same classes)
 *   - Same TOC structure (table layout)
 *   - Same chapter markup (.chapter-header-line, .chapter-num, .chapter-title)
 *   - Same block-to-HTML mapping for paragraphs, headings, callouts, lists
 *   - Same typography CSS (font, size, line-height, paragraph spacing)
 *   - Same hyphenation rules
 *
 * Pagination is handled by a client-side JS block-packer that:
 *   - Measures element heights in a hidden ghost container
 *   - Distributes blocks into separate page cards (white cards on grey canvas)
 *   - Keeps cover-page and toc-page each on their own full page card
 *   - Each chapter starts on a fresh page
 *   - Sends the same postMessage protocol as Paged.js (paged-ready, goto-page, etc.)
 */
export function generateCyrillicPreviewHtml(opts: PagedBookOptions): string {
  const { book, chapters, settings: s, frontMatter: fm, lp, zoom = 1 } = opts;

  // ── Settings (mirror server-side route defaults exactly) ──────────────
  const docLang    = ((s as any).documentLanguage ?? book.language ?? "ru") as "ru" | "uk";
  const htmlLang   = toBcp47(docLang);
  const cyrTocLabel      = TOC_LABELS[docLang]    ?? TOC_LABELS[book.language ?? "ru"] ?? "Оглавление";
  const cyrEditorLabel   = CP_EDITOR_LABELS[docLang] ?? "Редактор";
  const cyrCoverLabel    = CP_COVER_LABELS[docLang]  ?? "Обложка";

  const PAGE_SIZES: Record<string, { width: number; height: number }> = {
    A4: { width: 210, height: 297 },
    A5: { width: 148, height: 210 },
    B5: { width: 176, height: 250 },
  };
  const ps = PAGE_SIZES[s.pageSize] ?? PAGE_SIZES["A5"];

  const mt = s.marginTop    ?? 20;
  const mb = s.marginBottom ?? 22;
  const ml = s.marginLeft   ?? 20;
  const mr = s.marginRight  ?? 16;

  const fontSize    = s.fontSize    ?? 11;
  const lineHeight  = s.lineHeight  ?? 1.6;
  const letterSpacing = s.letterSpacing ?? 0;
  const paraSpacing = s.paragraphSpacing ?? 0.5;
  const firstLineIndent = s.firstLineIndent ?? 1.2;
  const textAlign   = s.textAlign === "left" ? "left" : "justify";
  const h1Size      = s.h1Size ?? 22;
  const h2Size      = s.h2Size ?? 16;
  const h3Size      = s.h3Size ?? 13;
  const chapterBreak = (s as any).chapterBreak !== false;
  const headingFont = (s as any).headingFontFamily
                        ? String((s as any).headingFontFamily)
                        : s.fontFamily;
  const showFooterNum   = (s as any).footerPageNumber !== false;
  const showFooterTitle = (s as any).footerBookTitle  === true;
  const footerAlign     = (["left","center","right","mirror"] as const)
                            .includes((s as any).footerAlignment)
                          ? (s as any).footerAlignment as "left"|"center"|"right"|"mirror"
                          : "center";

  const enableHyphBody     = (s as any).cyrillicHyphenation    !== false;
  const enableHyphHeadings = (s as any).cyrillicHyphenHeadings !== false;
  const enableHyphToc      = (s as any).cyrillicHyphenToc      !== false;

  // ── Block-to-HTML (mirrors server-side cyrBlockToHtml exactly) ────────
  const sanitize = (html: string) => (html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/on\w+="[^"]*"/gi, "");

  const cyrBlockToHtml = (b: any): string => {
    const raw = b.content || b.text || "";
    if (!raw && b.type !== "divider") return "";
    const content = sanitize(raw);
    const indentLevel = Math.max(0, Math.min(8, Number(b.metadata?.indentLevel ?? 0)));
    const indentEm = indentLevel * 1.8;
    const nestBorder = indentLevel > 0 ? ";border-left:2px solid rgba(0,0,0,0.10);padding-left:0.5em" : "";
    const indentAttr = indentLevel > 0
      ? ` style="margin-left:${indentEm}em;text-indent:0${nestBorder}"`
      : "";

    switch (b.type) {
      case "h1": return `<h2 class="section-h1">${content}</h2>`;
      case "h2": return `<h3 class="section-h2">${content}</h3>`;
      case "h3": return `<h4 class="section-h3">${content}</h4>`;
      case "heading": return `<h2 class="section-h1">${content}</h2>`;
      case "quote": return `<blockquote style="margin-left:${indentEm}em${nestBorder}">${content}</blockquote>`;
      case "bullet_item": {
        const bml = (indentLevel + 1) * 1.8;
        return `<p class="list-bullet" style="margin-left:${bml}em;text-indent:-1.4em;padding-left:0${nestBorder}">&#8226;&nbsp;${content}</p>`;
      }
      case "numbered_item": {
        const nml = (indentLevel + 1) * 1.8;
        return `<p class="list-numbered" style="margin-left:${nml}em;text-indent:0${nestBorder}">${content}</p>`;
      }
      case "check_item": {
        const cml = (indentLevel + 1) * 1.8;
        const checked = b.metadata?.checked ? "&#9745;" : "&#9744;";
        return `<p class="list-check" style="margin-left:${cml}em;text-indent:-1.4em;padding-left:0${nestBorder}">${checked}&nbsp;${content}</p>`;
      }
      case "hypothesis":    return `<div class="callout callout-hypothesis" style="margin-left:${indentEm}em"><span class="callout-icon">&#9670;</span><div>${content}</div></div>`;
      case "argument":      return `<div class="callout callout-argument"   style="margin-left:${indentEm}em"><span class="callout-icon">&#10003;</span><div>${content}</div></div>`;
      case "counterargument": return `<div class="callout callout-counter"  style="margin-left:${indentEm}em"><span class="callout-icon">&#10007;</span><div>${content}</div></div>`;
      case "idea":          return `<div class="callout callout-idea"       style="margin-left:${indentEm}em"><span class="callout-icon">&#9861;</span><div>${content}</div></div>`;
      case "question":      return `<div class="callout callout-question"   style="margin-left:${indentEm}em"><span class="callout-icon">?</span><div>${content}</div></div>`;
      case "observation":   return `<div class="callout callout-idea"       style="margin-left:${indentEm}em"><span class="callout-icon">&#128065;</span><div>${content}</div></div>`;
      case "divider": return `<hr class="divider"/>`;
      default: return `<p${indentAttr}>${content}</p>`;
    }
  };

  // ── Front matter pages (mirrors Latin engine buildFrontMatter) ───────
  const hasCover = !!(book as any).coverImage && ((book as any).coverImage as string).startsWith("data:");

  // Title page HTML
  const titlePageHtml = (() => {
    const tp = fm.titlePage;
    if (!tp?.enabled) return "";
    const titleText = tp.useBookTitle ? book.title : (tp.customTitle || book.title);
    const align   = tp.alignment       ?? "center";
    const deco    = tp.decorativeStyle ?? "none";
    const tfs     = tp.titleFontSize   ?? 22;
    const sfs     = tp.subtitleFontSize ?? 13;
    const afs     = tp.authorFontSize  ?? 12;
    const sp      = tp.elementSpacing  ?? 1.2;
    const lh      = tp.titleLineHeight ?? 1.2;
    return `
<div class="cyrl-fm-page title-page title-align-${align}" style="--t-fs:${tfs}pt;--s-fs:${sfs}pt;--a-fs:${afs}pt;--sp:${sp}em;--lh:${lh}">
  ${deco === "ornament" ? '<div class="title-ornament">✦</div>' : ""}
  ${deco === "lines"    ? '<div class="title-top-line"></div>'   : ""}
  <h1 class="title-main">${esc(titleText)}</h1>
  ${tp.subtitle ? `<div class="title-sub">${esc(tp.subtitle)}</div>` : ""}
  ${deco === "lines" ? '<div class="title-mid-line"></div>' : ""}
  ${tp.author ? `<div class="title-author">${esc(tp.author)}</div>` : ""}
  <div class="title-bottom-block">
    ${tp.publisherName ? `<div class="title-publisher">${esc(tp.publisherName)}</div>` : ""}
    ${(tp.city || tp.year) ? `<div class="title-cityYear">${[tp.city, tp.year].filter(Boolean).map(v => esc(String(v))).join(" · ")}</div>` : ""}
  </div>
</div>`;
  })();

  // Copyright page HTML
  const copyrightPageHtml = (() => {
    const cp = fm.copyrightPage;
    if (!cp?.enabled) return "";
    const align = cp.alignment ?? "left";
    const cpFs  = cp.fontSize   ?? 9;
    const cpLh  = cp.lineHeight ?? 1.5;
    return `
<div class="cyrl-fm-page copyright-page copyright-align-${align}" style="--cp-fs:${cpFs}pt;--cp-lh:${cpLh}">
  ${cp.rights ? `<div class="cp-rights">${esc(cp.rights)}</div>` : ""}
  <div class="cp-spacer"></div>
  <div class="cp-bottom">
    ${cp.isbn            ? `<div class="cp-isbn">ISBN ${esc(cp.isbn)}</div>` : ""}
    ${cp.editor          ? `<div class="cp-line">${cyrEditorLabel}: ${esc(cp.editor)}</div>` : ""}
    ${cp.coverDesigner   ? `<div class="cp-line">${cyrCoverLabel}: ${esc(cp.coverDesigner)}</div>` : ""}
    ${(cp.copyrightYear || cp.copyrightHolder) ? `<div class="cp-line cp-copyright">© ${[cp.copyrightYear, cp.copyrightHolder].filter(Boolean).map(v => esc(String(v))).join(", ")}</div>` : ""}
  </div>
</div>`;
  })();

  // Dedication page HTML
  const dedicationPageHtml = (() => {
    const dp = fm.dedicationPage;
    if (!dp?.enabled) return "";
    const vpos  = dp.verticalPosition ?? "center";
    const align = dp.alignment        ?? "center";
    const dedFs = dp.fontSize         ?? 12;
    const dedLh = dp.lineHeight       ?? 1.8;
    return `
<div class="cyrl-fm-page dedication-page dedication-v-${vpos} dedication-align-${align}" style="--ded-fs:${dedFs}pt;--ded-lh:${dedLh}">
  <div class="dedication-text">${esc(dp.text ?? "")}</div>
</div>`;
  })();

  // TOC rows with data-ci for JS to fill in page numbers
  const tocRowsHtml = chapters.map((ch, i) => `
    <div class="toc-row" data-ci="${i}">
      <span class="toc-num">${i + 1}</span>
      <span class="toc-title">${esc(ch.title)}</span>
      <span class="toc-dots"></span>
      <span class="toc-page-ref">—</span>
    </div>`).join("");

  const tocPageHtml = fm.tocEnabled !== false ? `
<div class="cyrl-fm-page cyrl-toc-page">
  <h2 class="toc-heading">${cyrTocLabel}</h2>
  <div class="toc-list">${tocRowsHtml}</div>
</div>` : "";

  // Build front matter block (all pages together for the ghost)
  const frontMatterHtml = [
    hasCover ? `<div class="cyrl-fm-page cyrl-cover-page"><img src="${(book as any).coverImage}" alt="Cover"/></div>` : "",
    titlePageHtml,
    copyrightPageHtml,
    dedicationPageHtml,
    tocPageHtml,
  ].filter(Boolean).join("\n");

  // ── Chapter bodies (no "Глава X", title centered) ─────────────────────
  let bodyHtml = "";
  for (let ci = 0; ci < chapters.length; ci++) {
    const ch = chapters[ci] as any;
    let blocks: any[] = [];
    try { blocks = typeof ch.content === "string" ? JSON.parse(ch.content) : (ch.content || []); } catch {}
    const contentHtml = blocks.map(cyrBlockToHtml).filter(Boolean).join("\n");
    bodyHtml += `
<section class="cyrl-chapter${chapterBreak ? " chapter-break" : ""}" data-ci="${ci}">
  <h1 class="chapter-title">${esc(ch.title)}</h1>
  <div class="chapter-content">
${contentHtml || '<p class="empty-chapter">—</p>'}
  </div>
</section>`;
  }

  // ── CSS (mirrors server-side cyrHtml <style> exactly, adapted for preview) ─
  const hyphBodyCss = enableHyphBody ? `
  html[lang="ru"] p, html[lang="uk"] p,
  html[lang="ru"] blockquote, html[lang="uk"] blockquote,
  html[lang="ru"] .callout div, html[lang="uk"] .callout div,
  html[lang="ru"] li, html[lang="uk"] li {
    hyphens: auto; -webkit-hyphens: auto;
    hyphenate-character: "-";
    hyphenate-limit-chars: 6 3 3;
    hyphenate-limit-zone: 8%;
  }` : "";

  const hyphHeadingsCss = enableHyphHeadings ? "" : `
  h1, h2, h3, h4, h5, h6,
  .chapter-title, .toc-heading,
  .title-main, .title-sub, .title-author { hyphens: none !important; }`;

  const hyphTocCss = enableHyphToc ? "" : `
  .toc-list, .toc-heading, .toc-row, .toc-title, .toc-num { hyphens: none !important; }`;

  const css = `
*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: #cdc7bf; }

/* ── Ghost measurement container (off-screen, invisible) ─────── */
#cyrl-src {
  position: absolute; left: -9999px; top: 0;
  width: auto; height: auto; overflow: visible;
  visibility: hidden; pointer-events: none;
}
/* Inner wrapper matches page content width exactly */
#cyrl-src-inner {
  width: ${ps.width - ml - mr}mm;
  font-family: ${s.fontFamily};
  font-size: ${fontSize}pt;
  line-height: ${lineHeight};
  letter-spacing: ${letterSpacing}em;
  color: #1a1209;
}

/* ── Page canvas ──────────────────────────────────────────── */
#cyrl-canvas {
  padding: 32px 0;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}
html[data-view="spread"] #cyrl-canvas {
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
  align-items: flex-start;
  gap: 8px;
  padding: 32px 16px;
}

/* ── Page card ────────────────────────────────────────────── */
.cyrl-page {
  width: ${ps.width}mm;
  height: ${ps.height}mm;
  background: #fff;
  border-radius: 2px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.12), 0 8px 32px rgba(0,0,0,0.16), 0 1px 3px rgba(0,0,0,0.08);
  padding: ${mt}mm ${mr}mm ${mb}mm ${ml}mm;
  overflow: hidden;
  flex-shrink: 0;
  position: relative;
  font-family: ${s.fontFamily};
  font-size: ${fontSize}pt;
  line-height: ${lineHeight};
  letter-spacing: ${letterSpacing}em;
  color: #1a1209;
}
/* ── Page footer ──────────────────────────────────────────── */
.cyrl-footer {
  position: absolute;
  bottom: ${Math.round(mb * 0.5)}mm;
  left: ${ml}mm;
  right: ${mr}mm;
  font-size: 9.5pt;
  color: #888;
  line-height: 1;
  letter-spacing: 0;
  font-family: ${s.fontFamily};
}
.cyrl-footer.align-left   { text-align: left; }
.cyrl-footer.align-center { text-align: center; }
.cyrl-footer.align-right  { text-align: right; }
.cyrl-footer.align-mirror-left  { text-align: left; }
.cyrl-footer.align-mirror-right { text-align: right; }
html[data-view="spread"] .cyrl-page { zoom: ${Math.min(1, zoom * 0.72)}; }
html[data-view="single"]  .cyrl-page { zoom: ${zoom}; }

/* ── Badge ────────────────────────────────────────────────── */
#cyrl-badge {
  position: fixed; bottom: 12px; right: 12px;
  background: rgba(30,30,40,0.72); color: #fff;
  font: 10px/1 system-ui,sans-serif;
  padding: 4px 8px; border-radius: 6px;
  letter-spacing: .03em; pointer-events: none; z-index: 9999;
}

/* ── Typography (exact mirror of server-side CSS) ─────────── */
* { text-rendering: optimizeLegibility; }

h1, h2, h3, h4, h5, h6,
.chapter-title, .toc-heading,
.title-main, .title-sub, .title-author,
a, code, pre {
  hyphens: none; word-break: keep-all;
}
${hyphBodyCss}
${hyphHeadingsCss}
${hyphTocCss}

/* ── Front matter page base ───────────────────────────────── */
.cyrl-fm-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Cover image: the JS paginator creates a special no-padding card for this */
.cyrl-page--cover {
  padding: 0 !important;
  overflow: hidden;
}
.cyrl-page--cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* Title page */
.title-page { padding: 16mm 0 16mm; }
.title-align-center { align-items: center; text-align: center; }
.title-align-left   { align-items: flex-start; text-align: left; }
.title-align-right  { align-items: flex-end; text-align: right; }
.title-ornament { font-size: 18pt; color: #d4c5b0; margin-bottom: 1em; }
.title-top-line { width: 40px; height: 2px; background: #d4c5b0; margin-bottom: 1em; }
.title-mid-line { width: 40px; height: 1px; background: #d4c5b0; margin: 0.5em 0; }
.title-main {
  font-family: ${headingFont};
  font-size: var(--t-fs, ${h1Size}pt);
  font-weight: 700; line-height: 1.2;
  letter-spacing: -0.01em; margin-bottom: 0.4em;
  hyphens: none !important; word-break: keep-all;
}
.title-sub  { font-size: var(--s-fs, ${h2Size}pt); color: #888; font-style: italic; margin-bottom: 0.3em; }
.title-author { font-size: var(--a-fs, 12pt); color: #555; letter-spacing: 0.05em; }
.title-bottom-block { margin-top: auto; padding-bottom: 8mm; }
.title-publisher { font-size: ${Math.max(7, fontSize - 1)}pt; color: #888; letter-spacing: 0.06em; text-transform: uppercase; }
.title-cityYear  { font-size: ${Math.max(7, fontSize - 1)}pt; color: #aaa; margin-top: 4pt; }

/* Copyright page — same padding as title page for consistent visual alignment */
.copyright-page {
  font-size: var(--cp-fs, ${Math.max(7, fontSize - 1)}pt);
  color: #555; line-height: var(--cp-lh, 1.7); padding: 16mm 0 16mm;
}
.copyright-align-left   { align-items: flex-start; text-align: left; }
.copyright-align-center { align-items: center; text-align: center; }
.copyright-align-right  { align-items: flex-end; text-align: right; }
.cp-rights { max-width: 92%; line-height: 1.65; margin-bottom: 1.6em; }
.cp-spacer { flex: 1; }
.cp-bottom { padding-bottom: 8mm; }
.cp-isbn { margin-bottom: 1em; }
.cp-line { margin-bottom: 2pt; line-height: 1.65; }
.cp-copyright { color: #333; font-weight: 500; margin-top: 0.3em; }

/* Dedication page */
.dedication-page { padding: 4% 0; }
.dedication-v-top    { justify-content: flex-start; padding-top: 20%; }
.dedication-v-center { justify-content: center; }
.dedication-v-bottom { justify-content: flex-end; padding-bottom: 20%; }
.dedication-align-left   { align-items: flex-start; text-align: left; }
.dedication-align-center { align-items: center; text-align: center; }
.dedication-align-right  { align-items: flex-end; text-align: right; }
.dedication-text {
  font-size: var(--ded-fs, ${Math.min(fontSize + 0.5, 14)}pt);
  font-style: italic; color: #555;
  line-height: var(--ded-lh, 1.8); max-width: 80%;
}

/* TOC page */
.cyrl-toc-page { padding-top: 6mm; }
.toc-heading {
  font-family: ${headingFont}; font-size: ${h2Size}pt;
  font-weight: 600; text-align: center;
  margin-bottom: 16pt; letter-spacing: 0.05em; color: #333;
}
.toc-list { display: flex; flex-direction: column; gap: 5pt; }
.toc-row {
  display: flex; align-items: baseline; gap: 4pt;
  font-size: ${fontSize}pt; cursor: pointer;
}
.toc-row:hover .toc-title { text-decoration: underline; }
.toc-num   { color: #bbb; font-size: ${Math.max(7, fontSize - 1)}pt; min-width: 1.8em; }
.toc-title { color: #333; }
.toc-dots  { flex: 1; border-bottom: 1pt dotted #d8d3cc; margin-bottom: 2pt; }
.toc-page-ref { color: #888; font-size: ${Math.max(7, fontSize - 0.5)}pt; min-width: 2em; text-align: right; }

/* ── Chapter ──────────────────────────────────────────────── */
.chapter-title {
  font-family: ${headingFont}; font-size: ${h1Size}pt; font-weight: 700;
  margin-top: 0; margin-bottom: ${Math.round(lineHeight * 2 * fontSize)}pt;
  line-height: 1.2; color: #1a0d06;
  letter-spacing: -0.01em; text-align: center;
}
.chapter-content { }

/* ── Paragraphs ───────────────────────────────────────────── */
p {
  margin: 0 0 ${paraSpacing > 0 ? paraSpacing + "em" : "0"};
  text-align: ${textAlign};
  text-indent: ${firstLineIndent > 0 ? firstLineIndent + "em" : "0"};
  orphans: 3; widows: 3;
  word-break: normal; overflow-wrap: normal;
}
/* Only remove indent after in-body subheadings, NOT after chapter title */
h2 + p, h3 + p, h4 + p { text-indent: 0; }

/* ── Headings in body ─────────────────────────────────────── */
h2.section-h1 {
  font-family: ${headingFont}; font-size: ${h2Size}pt; font-weight: 700; margin: 20px 0 8px;
  color: #1a0d06; text-indent: 0;
}
h3.section-h2 {
  font-family: ${headingFont}; font-size: ${h3Size}pt; font-weight: 700; font-style: italic;
  margin: 16px 0 6px; color: #3d2e26; text-indent: 0;
}
h4.section-h3 {
  font-family: ${headingFont}; font-size: ${Math.max(7, h3Size - 1)}pt; font-weight: 600;
  margin: 14px 0 4px; color: #3d2e26; text-indent: 0;
}

/* ── Blockquote ───────────────────────────────────────────── */
blockquote {
  border-left: 2.5px solid #d4a96a;
  padding: 6px 0 6px 14px;
  margin: 14px 8px;
  font-style: italic; color: #5a4a3a; text-indent: 0;
}

/* ── Divider ──────────────────────────────────────────────── */
hr.divider { border: none; border-top: 1px solid #e0d4c4; margin: 18px 40px; }

/* ── Callouts ─────────────────────────────────────────────── */
.callout {
  display: flex; gap: 8px; align-items: flex-start;
  padding: 8px 12px; margin: 12px 0;
  border-radius: 4px; font-size: 9.5pt; text-indent: 0;
}
.callout-icon { font-size: 8pt; padding-top: 2px; flex-shrink: 0; }
.callout-hypothesis { background: #f5f0ea; border-left: 2px solid #d4a96a; }
.callout-argument   { background: #f0f5ee; border-left: 2px solid #7aad6a; }
.callout-counter    { background: #f5f0ee; border-left: 2px solid #c4756a; }
.callout-idea       { background: #f0f2f8; border-left: 2px solid #7a8ac4; }
.callout-question   { background: #faf5e8; border-left: 2px solid #c8af6a; }

/* ── Lists ────────────────────────────────────────────────── */
.list-bullet, .list-numbered, .list-check { margin-bottom: 0.3em; }
.empty-chapter { color: #bbb; font-style: italic; text-indent: 0; }
`;

  // ── JS paginator ──────────────────────────────────────────────────────
  // Uses JSON.stringify for safe embedding of strings (avoids quote injection bugs)
  const fontFamilyJs  = JSON.stringify(s.fontFamily);
  const bookTitleJs   = JSON.stringify(book.title);
  const script = `
(function() {
  var SHOW_NUM   = ${showFooterNum};
  var SHOW_TITLE = ${showFooterTitle};
  var FOOT_ALIGN = ${JSON.stringify(footerAlign)};
  var BOOK_TITLE = ${bookTitleJs};
  var pageEls = [];
  var chapterPageMap = {};

  // ── Measurement probe (safe font embedding via JS variable) ──
  var FONT_FAMILY = ${fontFamilyJs};
  var probe = document.createElement('div');
  probe.style.position = 'absolute';
  probe.style.left = '-9999px';
  probe.style.top = '0';
  probe.style.visibility = 'hidden';
  probe.style.pointerEvents = 'none';
  probe.style.fontFamily = FONT_FAMILY;
  probe.style.fontSize = '${fontSize}pt';
  probe.style.lineHeight = '${lineHeight}';
  probe.style.letterSpacing = '${letterSpacing}em';
  document.body.appendChild(probe);

  // CONTENT_W / CONTENT_H are calibrated from a real page card after boot
  // so they perfectly match whatever CSS mm resolution the browser uses.
  var CONTENT_W = 0;
  var CONTENT_H = 0;

  function calibrate() {
    var cal = document.createElement('div');
    cal.className = 'cyrl-page';
    cal.style.position = 'absolute';
    cal.style.left = '-9999px';
    cal.style.visibility = 'hidden';
    cal.style.zoom = '1';  // measure at natural (unzoomed) layout size
    document.body.appendChild(cal);
    var cs = window.getComputedStyle(cal);
    CONTENT_H = cal.clientHeight
      - parseFloat(cs.paddingTop)
      - parseFloat(cs.paddingBottom);
    CONTENT_W = cal.clientWidth
      - parseFloat(cs.paddingLeft)
      - parseFloat(cs.paddingRight);
    document.body.removeChild(cal);
    // Add ~1 line-height of buffer so trailing paragraph bottom-margins
    // don't cause the paginator to start new pages prematurely
    CONTENT_H = CONTENT_H + ${Math.round(lineHeight * fontSize * 96 / 72)};
    probe.style.width = CONTENT_W + 'px';
  }

  function measureH(el) {
    var clone = el.cloneNode(true);
    probe.appendChild(clone);
    var cs = window.getComputedStyle(clone);
    var h = clone.offsetHeight
            + (parseFloat(cs.marginTop) || 0)
            + (parseFloat(cs.marginBottom) || 0);
    probe.removeChild(clone);
    return h;
  }

  // ── Footer builder ─────────────────────────────────────────
  function makeFooter(pageNum) {
    if (!SHOW_NUM && !SHOW_TITLE) return null;
    var div = document.createElement('div');
    var cls = 'cyrl-footer ';
    if (FOOT_ALIGN === 'mirror') {
      cls += (pageNum % 2 === 0) ? 'align-mirror-left' : 'align-mirror-right';
    } else {
      cls += 'align-' + FOOT_ALIGN;
    }
    div.className = cls;
    var parts = [];
    if (FOOT_ALIGN === 'mirror') {
      if (pageNum % 2 === 0) { parts.push(String(pageNum)); if (SHOW_TITLE) parts.push(BOOK_TITLE); }
      else { if (SHOW_TITLE) parts.push(BOOK_TITLE); parts.push(String(pageNum)); }
    } else {
      if (SHOW_TITLE) parts.push(BOOK_TITLE);
      if (SHOW_NUM)   parts.push(String(pageNum));
    }
    div.textContent = parts.join(' · ');
    return div;
  }

  // ── Page factory ───────────────────────────────────────────
  function newPage() {
    var p = document.createElement('div');
    p.className = 'cyrl-page';
    return p;
  }

  function pushPage(page, skipFooter) {
    if (page.children.length > 0) {
      var pgNum = pageEls.length + 1;
      if (!skipFooter) { var f = makeFooter(pgNum); if (f) page.appendChild(f); }
      pageEls.push(page);
      document.getElementById('cyrl-canvas').appendChild(page);
    }
    return newPage();
  }

  // ── Build all pages ────────────────────────────────────────
  function buildPages() {
    var canvas = document.getElementById('cyrl-canvas');
    if (!canvas) return;
    var src = document.getElementById('cyrl-src');

    // Front matter pages (.cyrl-fm-page) → each gets its own full page card
    // Chapter sections (.cyrl-chapter) → block-packed into pages
    var sections = Array.from(src.querySelectorAll('.cyrl-fm-page, .cyrl-chapter'));

    var page = newPage();
    var usedH = 0;

    sections.forEach(function(section) {
      var isCover   = section.classList.contains('cyrl-cover-page');
      var isFm      = section.classList.contains('cyrl-fm-page');
      var isChapter = section.classList.contains('cyrl-chapter');

      // Cover image page: special no-padding card, extract img directly
      if (isCover) {
        if (page.children.length > 0) { page = pushPage(page); usedH = 0; }
        var coverCard = document.createElement('div');
        coverCard.className = 'cyrl-page cyrl-page--cover';
        var imgEl = section.querySelector('img');
        if (imgEl) {
          var imgClone = imgEl.cloneNode(true);
          coverCard.appendChild(imgClone);
        }
        pageEls.push(coverCard);
        canvas.appendChild(coverCard);
        page = newPage(); usedH = 0;
        return;
      }

      // Other front matter pages (title/copyright/dedication/TOC): full page, no footer
      if (isFm) {
        if (page.children.length > 0) { page = pushPage(page); usedH = 0; }
        var fp = newPage();
        fp.appendChild(section.cloneNode(true));
        pushPage(fp, true);
        page = newPage(); usedH = 0;
        return;
      }

      // Chapter: always starts on a new page; blocks packed with wrapping
      if (isChapter) {
        if (usedH > 0) { page = pushPage(page); usedH = 0; }

        var ci = section.getAttribute('data-ci');
        if (ci !== null) chapterPageMap[parseInt(ci, 10)] = pageEls.length;

        // Chapter title goes first on the new page
        var titleEl = section.querySelector('.chapter-title');
        if (titleEl) {
          page.appendChild(titleEl.cloneNode(true));
          usedH += measureH(titleEl);
        }

        // Content blocks: wrap each page's blocks in a .chapter-content div
        // so that p:first-child and other CSS rules cascade correctly.
        var contentEl = section.querySelector('.chapter-content');
        if (contentEl) {
          var blocks = Array.from(contentEl.children);
          var wrapper = document.createElement('div');
          wrapper.className = 'chapter-content';
          var isFirstOnPage = true;

          blocks.forEach(function(block) {
            var h = measureH(block);

            if (usedH > 0 && usedH + h > CONTENT_H) {
              // Flush current wrapper + page, start fresh
              if (wrapper.children.length > 0) page.appendChild(wrapper);
              page = pushPage(page); usedH = 0;
              wrapper = document.createElement('div');
              wrapper.className = 'chapter-content';
              isFirstOnPage = true;
            }

            wrapper.appendChild(block.cloneNode(true));
            usedH += h;
            isFirstOnPage = false;

            if (usedH > CONTENT_H) {
              if (wrapper.children.length > 0) page.appendChild(wrapper);
              page = pushPage(page); usedH = 0;
              wrapper = document.createElement('div');
              wrapper.className = 'chapter-content';
              isFirstOnPage = true;
            }
          });

          // Flush remaining wrapper to current page
          if (wrapper.children.length > 0) page.appendChild(wrapper);
        }
        return;
      }
    });

    if (page.children.length > 0) pushPage(page);

    // 1-based chapter page map
    var chapterPages = {};
    Object.keys(chapterPageMap).forEach(function(ci) {
      chapterPages[parseInt(ci, 10)] = chapterPageMap[ci] + 1;
    });

    // ── Update TOC page numbers & add click handlers ────────
    document.querySelectorAll('.toc-row[data-ci]').forEach(function(row) {
      var ci2 = parseInt(row.getAttribute('data-ci'), 10);
      var pg = chapterPages[ci2];
      var ref = row.querySelector('.toc-page-ref');
      if (ref && pg) ref.textContent = String(pg);
      row.addEventListener('click', function() {
        var pgIdx = chapterPageMap[ci2];
        if (pgIdx !== undefined && pageEls[pgIdx]) {
          pageEls[pgIdx].scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });

    window.parent.postMessage(
      { type: 'paged-ready', total: pageEls.length, chapterPages: chapterPages },
      '*'
    );
  }

  // ── Boot: wait for fonts + one rAF before measuring ───────
  // We need an extra rAF after fonts.ready so the browser has committed
  // the font metrics before we calibrate and measure element heights.
  function boot() {
    function run() { requestAnimationFrame(function() { calibrate(); buildPages(); }); }
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(run);
    } else {
      requestAnimationFrame(function() { requestAnimationFrame(run); });
    }
  }

  if (document.readyState === 'loading') { window.addEventListener('load', boot); }
  else { boot(); }

  window.addEventListener('message', function(e) {
    if (!e.data || !e.data.type) return;
    if (e.data.type === 'goto-page') {
      var idx = Math.max(0, (e.data.page || 1) - 1);
      if (pageEls[idx]) pageEls[idx].scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (e.data.type === 'goto-chapter') {
      var ci3 = e.data.chapterIdx || 0;
      if (chapterPageMap[ci3] !== undefined && pageEls[chapterPageMap[ci3]])
        pageEls[chapterPageMap[ci3]].scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (e.data.type === 'set-view-mode') {
      document.documentElement.setAttribute('data-view', e.data.mode || 'single');
    }
  });
})();
`;

  return `<!DOCTYPE html>
<html lang="${htmlLang}" data-view="single">
<head>
<meta charset="UTF-8">
<title>${esc(book.title)}</title>
<style>${css}</style>
</head>
<body lang="${htmlLang}">

<!-- Ghost measurement container (off-screen, invisible) -->
<div id="cyrl-src">
  <div id="cyrl-src-inner">
    ${frontMatterHtml}
    ${bodyHtml}
  </div>
</div>

<!-- Page cards rendered here by JS paginator -->
<div id="cyrl-canvas"></div>

<div id="cyrl-badge">Cyrillic Engine</div>
<script>${script}</script>
</body>
</html>`;
}
