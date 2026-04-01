import type { ExportManifest, CoreExportResult } from "./types.js";
import { escHtml } from "./utils.js";

/**
 * Phase A — Core document export.
 *
 * Builds WeasyPrint-optimised HTML for the full book (front matter + chapters)
 * WITHOUT any designer page divs. Sends it to the Python renderer's /render-pdf
 * endpoint and returns the raw PDF buffer.
 *
 * Designer pages are handled separately in Phase B (injectDesignerPages.ts).
 * This clean separation means Phase A is guaranteed to succeed even when
 * designer page images are large or unavailable to WeasyPrint via HTTP.
 */
export async function exportCoreDocument(
  manifest: ExportManifest,
  rendererUrl: string,
): Promise<CoreExportResult> {
  const { layout, chapters, frontMatter: fm, docLang, bookTitle, bookId } = manifest;
  const {
    pageSizeCSS, pageSizeWidthMm: psW, pageSizeHeightMm: psH,
    marginTop, marginBottom, marginLeft, marginRight,
    fontFamily, headingFontFamily: headingFontFam,
    fontSize, lineHeight, letterSpacing, paragraphSpacing: paraSpacing,
    firstLineIndent, textAlign,
    h1Size, h2Size, h3Size,
    chapterBreak, footerPageNumber, footerBookTitle,
    footerAlignment, cyrillicHyphenHeadings: enableHyphHeadings,
    cyrillicHyphenToc: enableHyphToc,
  } = layout;

  const htmlLang = docLang;
  const bookLangRaw = (manifest.docLang ?? docLang).toLowerCase();
  const tocLangMap: Record<string, string> = {
    ru: "Оглавление", uk: "Зміст", en: "Table of Contents", de: "Inhaltsverzeichnis",
  };
  const tocLangLabel = tocLangMap[bookLangRaw] ?? tocLangMap[docLang] ?? "Оглавление";
  const cpEditorLabels: Record<string, string> = { ru: "Редактор", uk: "Редактор", en: "Editor", de: "Lektor" };
  const cpCoverLabels:  Record<string, string> = { ru: "Обложка",  uk: "Обкладинка", en: "Cover design", de: "Coverdesign" };
  const cpEditorLabel = cpEditorLabels[bookLangRaw] ?? cpEditorLabels[docLang] ?? "Редактор";
  const cpCoverLabel  = cpCoverLabels[bookLangRaw]  ?? cpCoverLabels[docLang]  ?? "Обложка";

  // ── Front matter pages ────────────────────────────────────────────────────

  const titlePageHtml = (() => {
    const tp = fm.titlePage;
    if (!tp?.enabled) return "";
    const titleText = tp.useBookTitle ? bookTitle : (tp.customTitle || bookTitle);
    const align  = tp.alignment       ?? "center";
    const deco   = tp.decorativeStyle ?? "none";
    const tfsRaw = tp.titleFontSize   ?? 22;
    const sfs    = tp.subtitleFontSize ?? 13;
    const afs    = tp.authorFontSize  ?? 12;
    const sp     = tp.elementSpacing  ?? 1.2;
    const lh     = tp.titleLineHeight ?? 1.2;
    const titlePageTextWidthPt = (psW - marginLeft - marginRight) * (72 / 25.4);
    const maxTfsByWidth = Math.floor(titlePageTextWidthPt / (titleText.length * 0.50));
    const tfs = Math.min(tfsRaw, Math.max(12, maxTfsByWidth));
    return `
<div class="cyrl-fm-page title-page title-align-${align}">
  ${deco === "ornament" ? '<div class="title-ornament">✦</div>' : ""}
  ${deco === "lines"    ? '<div class="title-top-line"></div>'   : ""}
  <h1 class="title-main" style="font-size:${tfs}pt;line-height:${lh};margin-bottom:${sp}em;hyphens:none;overflow-wrap:normal;white-space:nowrap">${escHtml(titleText)}</h1>
  ${tp.subtitle ? `<div class="title-sub" style="font-size:${sfs}pt;margin-bottom:${sp * 0.5}em">${escHtml(tp.subtitle)}</div>` : ""}
  ${deco === "lines" ? '<div class="title-mid-line"></div>' : ""}
  ${tp.author ? `<div class="title-author" style="font-size:${afs}pt">${escHtml(tp.author)}</div>` : ""}
  <div class="title-spacer"></div>
  <div class="title-bottom-block">
    ${tp.publisherName ? `<div class="title-publisher">${escHtml(tp.publisherName)}</div>` : ""}
    ${(tp.city || tp.year) ? `<div class="title-cityYear">${[tp.city, tp.year].filter(Boolean).map((v: any) => escHtml(String(v))).join(" · ")}</div>` : ""}
  </div>
</div>`;
  })();

  const copyrightPageHtml = (() => {
    const cp = fm.copyrightPage;
    if (!cp?.enabled) return "";
    const align = cp.alignment ?? "left";
    const cpFs  = cp.fontSize   ?? 9;
    const cpLh  = cp.lineHeight ?? 1.5;
    return `
<div class="cyrl-fm-page copyright-page copyright-align-${align}" style="font-size:${cpFs}pt;line-height:${cpLh}">
  ${cp.rights ? `<div class="cp-rights">${escHtml(cp.rights)}</div>` : ""}
  <div class="cp-spacer"></div>
  <div class="cp-bottom">
    ${cp.isbn          ? `<div class="cp-isbn">ISBN ${escHtml(cp.isbn)}</div>` : ""}
    ${cp.editor        ? `<div class="cp-line">${cpEditorLabel}: ${escHtml(cp.editor)}</div>` : ""}
    ${cp.coverDesigner ? `<div class="cp-line">${cpCoverLabel}: ${escHtml(cp.coverDesigner)}</div>` : ""}
    ${(cp.copyrightYear || cp.copyrightHolder) ? `<div class="cp-line cp-copyright">© ${[cp.copyrightYear, cp.copyrightHolder].filter(Boolean).map((v: any) => escHtml(String(v))).join(", ")}</div>` : ""}
  </div>
</div>`;
  })();

  const dedicationPageHtml = (() => {
    const dp = fm.dedicationPage;
    if (!dp?.enabled) return "";
    const vpos  = dp.verticalPosition ?? "center";
    const align = dp.alignment        ?? "center";
    const dedFs = dp.fontSize         ?? 12;
    const dedLh = dp.lineHeight       ?? 1.8;
    return `
<div class="cyrl-fm-page dedication-page dedication-v-${vpos} dedication-align-${align}">
  <div class="dedication-text" style="font-size:${dedFs}pt;line-height:${dedLh}">${escHtml(dp.text ?? "")}</div>
</div>`;
  })();

  const tocPageHtml = fm.tocEnabled !== false ? `
<div class="cyrl-fm-page cyrl-toc-page">
  <h2 class="toc-heading">${tocLangLabel}</h2>
  <div class="toc-list">
${chapters.map((ch, i) => `    <div class="toc-row"><a href="#chapter-${i}"><span class="toc-num">${i + 1}</span><span class="toc-title">${escHtml(ch.title)}</span></a></div>`).join("\n")}
  </div>
</div>` : "";

  const coverHtml = (manifest.coverImage && manifest.coverImage.startsWith("data:"))
    ? `<div class="cyrl-cover-img-page"><img src="${manifest.coverImage}" alt="Cover"/></div>`
    : "";

  const frontMatterHtml = [coverHtml, titlePageHtml, copyrightPageHtml, dedicationPageHtml, tocPageHtml]
    .filter(Boolean).join("\n");

  // ── Chapter bodies — NO designer page divs ────────────────────────────────
  let bodyHtml = "";
  for (let ci = 0; ci < chapters.length; ci++) {
    const ch = chapters[ci];
    bodyHtml += `
<section id="chapter-${ci}" class="chapter${chapterBreak ? " chapter-break" : ""}">
  <h1 class="chapter-title">${escHtml(ch.title)}</h1>
  <div class="chapter-content">
${ch.contentHtml || '<p class="empty-chapter">—</p>'}
  </div>
</section>`;
  }

  // ── CSS ───────────────────────────────────────────────────────────────────
  const hyphBody = `
  html[lang="ru"] p, html[lang="uk"] p,
  html[lang="ru"] blockquote, html[lang="uk"] blockquote,
  html[lang="ru"] .callout div, html[lang="uk"] .callout div,
  html[lang="ru"] li, html[lang="uk"] li {
    hyphens: auto;
    hyphenate-character: "-";
    hyphenate-limit-chars: 6 3 3;
    hyphenate-limit-zone: 8%;
  }`;

  const hyphHeadingsCSS = enableHyphHeadings ? "" : `
  h1, h2, h3, h4, h5, h6,
  .chapter-title, .toc-heading,
  .title-main, .title-sub, .title-author { hyphens: none !important; }`;

  const hyphTocCSS = enableHyphToc ? "" : `
  .toc-list, .toc-heading, .toc-row, .toc-title, .toc-num { hyphens: none !important; }`;

  const fmH = psH - marginTop - marginBottom;

  const footerCSS = (footerPageNumber || footerBookTitle) ? `
  @page {
    ${footerAlignment === "left"   ? `@bottom-left   { content: ${footerPageNumber ? `counter(page)` : `"${escHtml(bookTitle).replace(/"/g,"'")}"`}; font-size: 9.5pt; color: #888; font-family: ${fontFamily}; }` : ""}
    ${footerAlignment === "center" ? `@bottom-center { content: ${footerPageNumber && footerBookTitle ? `"${escHtml(bookTitle).replace(/"/g,"'")} · " counter(page)` : footerPageNumber ? `counter(page)` : `"${escHtml(bookTitle).replace(/"/g,"'")}"`}; font-size: 9.5pt; color: #888; font-family: ${fontFamily}; }` : ""}
    ${footerAlignment === "right"  ? `@bottom-right  { content: ${footerPageNumber ? `counter(page)` : `"${escHtml(bookTitle).replace(/"/g,"'")}"`}; font-size: 9.5pt; color: #888; font-family: ${fontFamily}; }` : ""}
    ${footerAlignment === "mirror" ? `
    @bottom-left  { content: counter(page); font-size: 9.5pt; color: #888; font-family: ${fontFamily}; }
    @bottom-right { content: "${footerBookTitle ? escHtml(bookTitle).replace(/"/g,"'") : ""}"; font-size: 9.5pt; color: #888; font-family: ${fontFamily}; }
    ` : ""}
  }
  @page :first {
    @bottom-left { content: none; }
    @bottom-center { content: none; }
    @bottom-right { content: none; }
  }` : "";

  const cyrHtml = `<!DOCTYPE html>
<html lang="${htmlLang}" class="cyrillic-engine">
<head>
<meta charset="UTF-8">
<title>${escHtml(bookTitle)}</title>
<style>
  /* ── Cover image page (zero-margin, no footer) ── */
  @page cyrl-cover {
    size: ${pageSizeCSS};
    margin: 0;
    @bottom-left   { content: none; }
    @bottom-center { content: none; }
    @bottom-right  { content: none; }
    @top-left      { content: none; }
    @top-center    { content: none; }
    @top-right     { content: none; }
  }
  .cyrl-cover-img-page {
    page: cyrl-cover;
    page-break-after: always;
    width: ${psW}mm; height: ${psH}mm;
    margin: 0; padding: 0; overflow: hidden; display: block;
  }
  .cyrl-cover-img-page img {
    width: 100%; height: 100%; object-fit: cover; display: block;
  }

  /* ── Front matter pages: counted in numbering but no footer/header shown ── */
  @page cyrl-fm {
    size: ${pageSizeCSS};
    margin: ${marginTop}mm ${marginRight}mm ${marginBottom}mm ${marginLeft}mm;
    @bottom-left   { content: none; }
    @bottom-center { content: none; }
    @bottom-right  { content: none; }
    @top-left      { content: none; }
    @top-center    { content: none; }
    @top-right     { content: none; }
  }
  .cyrl-fm-page {
    page: cyrl-fm;
  }

  /* ── Page layout ── */
  @page {
    size: ${pageSizeCSS};
    margin: ${marginTop}mm ${marginRight}mm ${marginBottom}mm ${marginLeft}mm;
  }

  /* ── Reset ── */
  * { box-sizing: border-box; margin: 0; padding: 0; }

  /* ── Body ── */
  body {
    font-family: ${fontFamily};
    font-size: ${fontSize}pt;
    line-height: ${lineHeight};
    letter-spacing: ${letterSpacing}em;
    color: #1a1209;
    background: #fff;
    text-rendering: optimizeLegibility;
  }

  /* ── Cyrillic hyphenation (WeasyPrint + Pyphen) ── */
  ${hyphBody}

  /* ── Headings: no hyphenation by default ── */
  h1, h2, h3, h4, h5, h6,
  .chapter-title, .toc-heading,
  .title-main, .title-sub, .title-author,
  a, code, pre, .url, .email, .filepath {
    hyphens: none;
    word-break: keep-all;
  }
  ${hyphHeadingsCSS}
  ${hyphTocCSS}

  /* ── Page footer (WeasyPrint @page margin boxes) ── */
  ${footerCSS}

  /* ── Front matter page base ──
     Use an explicit height so WeasyPrint flexbox (flex:1 spacers, margin-top:auto)
     works correctly. height = page height - top margin - bottom margin. */
  .cyrl-fm-page {
    display: flex;
    flex-direction: column;
    height: ${fmH}mm;
    page-break-after: always;
    overflow: hidden;
  }

  /* Title page */
  .title-page { padding: 16mm 0 16mm; }
  .title-align-center { align-items: center; text-align: center; }
  .title-align-left   { align-items: flex-start; text-align: left; }
  .title-align-right  { align-items: flex-end; text-align: right; }
  .title-ornament { font-size: 18pt; color: #d4c5b0; margin-bottom: 1em; }
  .title-top-line { width: 40px; height: 2pt; background: #d4c5b0; margin-bottom: 1em; }
  .title-mid-line { width: 40px; height: 1pt; background: #d4c5b0; margin: 0.5em 0; }
  .title-main { font-family: ${headingFontFam}; font-size: ${h1Size}pt; font-weight: 700; line-height: 1.2; letter-spacing: -0.01em; margin-bottom: 0.4em; hyphens: none !important; word-break: keep-all; white-space: nowrap; }
  .title-sub  { font-size: ${h2Size}pt; color: #888; font-style: italic; margin-bottom: 0.3em; }
  .title-author { font-size: 12pt; color: #555; letter-spacing: 0.05em; }
  .title-spacer { flex: 1; }
  .title-bottom-block { padding-bottom: 8mm; }
  .title-publisher { font-size: ${Math.max(7, fontSize - 1)}pt; color: #888; letter-spacing: 0.06em; text-transform: uppercase; }
  .title-cityYear  { font-size: ${Math.max(7, fontSize - 1)}pt; color: #aaa; margin-top: 4pt; }

  /* Copyright page */
  .copyright-page { font-size: 9pt; color: #555; line-height: 1.7; padding: 16mm 0 16mm; }
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
  .dedication-page { padding: 16mm 0 16mm; }
  .dedication-v-top    { justify-content: flex-start; }
  .dedication-v-center { justify-content: center; }
  .dedication-v-bottom { justify-content: flex-end; padding-bottom: 16mm; }
  .dedication-align-left   { align-items: flex-start; text-align: left; }
  .dedication-align-center { align-items: center; text-align: center; }
  .dedication-align-right  { align-items: flex-end; text-align: right; }
  .dedication-text { font-size: 12pt; font-style: italic; color: #555; line-height: 1.8; max-width: 80%; }

  /* TOC page */
  .cyrl-toc-page { padding-top: 10mm; }
  .toc-heading { font-family: ${headingFontFam}; font-size: ${h2Size}pt; font-weight: 700; text-align: center; margin-bottom: 8mm; letter-spacing: 0.02em; color: #1a0d06; }
  .toc-list { display: flex; flex-direction: column; gap: 3pt; }
  .toc-row { display: block; font-size: ${fontSize}pt; line-height: 1.8; }
  .toc-row a { color: inherit; text-decoration: none; display: block; }
  .toc-num {
    display: inline-block;
    min-width: 2.2em;
    margin-right: 4pt;
    color: #bbb;
    font-size: ${Math.max(7, fontSize - 1)}pt;
    vertical-align: baseline;
  }
  .toc-title { color: #222; }
  .toc-row a::after {
    content: leader('.') target-counter(attr(href url), page);
    color: #888;
    font-size: ${Math.max(7, fontSize - 1)}pt;
  }

  /* ── Chapter ── */
  .chapter { padding-top: 8mm; }
  .chapter-break { page-break-before: always; }
  .chapter-title {
    font-family: ${headingFontFam};
    font-size: ${h1Size}pt;
    font-weight: 700;
    margin-top: 0;
    margin-bottom: ${Math.round(lineHeight * 2 * fontSize)}pt;
    line-height: 1.2;
    color: #1a0d06;
    letter-spacing: -0.01em;
    text-align: center;
    page-break-after: avoid;
  }
  .chapter-content { }

  /* ── Typography ── */
  p {
    margin-bottom: ${paraSpacing > 0 ? paraSpacing + "em" : "0"};
    text-align: ${textAlign};
    text-indent: ${firstLineIndent > 0 ? firstLineIndent + "em" : "0"};
    orphans: 3;
    widows: 3;
    word-break: normal;
    overflow-wrap: normal;
  }
  h2 + p, h3 + p, h4 + p { text-indent: 0; }

  h2.section-h1 {
    font-family: ${headingFontFam};
    font-size: ${h2Size}pt;
    font-weight: 700;
    margin: 20px 0 8px;
    color: #1a0d06;
    text-indent: 0;
    page-break-after: avoid;
  }
  h3.section-h2 {
    font-family: ${headingFontFam};
    font-size: ${h3Size}pt;
    font-weight: 700;
    font-style: italic;
    margin: 16px 0 6px;
    color: #3d2e26;
    text-indent: 0;
    page-break-after: avoid;
  }
  h4.section-h3 {
    font-family: ${headingFontFam};
    font-size: ${Math.max(7, h3Size - 1)}pt;
    font-weight: 600;
    margin: 14px 0 4px;
    color: #3d2e26;
    text-indent: 0;
    page-break-after: avoid;
  }

  blockquote {
    border-left: 2.5px solid #d4a96a;
    padding: 6px 0 6px 14px;
    margin: 14px 8px;
    font-style: italic;
    color: #5a4a3a;
    text-indent: 0;
  }

  hr.divider {
    border: none;
    border-top: 1px solid #e0d4c4;
    margin: 18px 40px;
  }

  .callout {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    padding: 8px 12px;
    margin: 12px 0;
    border-radius: 4px;
    font-size: 9.5pt;
    text-indent: 0;
  }
  .callout-icon { font-size: 8pt; padding-top: 2px; flex-shrink: 0; }
  .callout-hypothesis { background: #f5f0ea; border-left: 2px solid #d4a96a; }
  .callout-argument   { background: #f0f5ee; border-left: 2px solid #7aad6a; }
  .callout-counter    { background: #f5f0ee; border-left: 2px solid #c4756a; }
  .callout-idea       { background: #f0f2f8; border-left: 2px solid #7a8ac4; }
  .callout-question   { background: #faf5e8; border-left: 2px solid #c8af6a; }

  .list-bullet, .list-numbered, .list-check { margin-bottom: 0.3em; }
  .empty-chapter { color: #bbb; font-style: italic; text-indent: 0; }
</style>
</head>
<body class="book-export cyrillic-engine">

  <!-- Front matter (title/copyright/dedication/TOC) -->
  ${frontMatterHtml}

  <!-- Chapters — NO designer pages (injected in Phase B) -->
  ${bodyHtml}

</body>
</html>`;

  // ── Send to Python renderer with retry ───────────────────────────────────
  const MAX_RETRIES   = 4;
  const RETRY_DELAY   = 4_000;
  const fontName = fontFamily.split(",")[0].trim().replace(/['"]/g, "");

  const renderPayload = JSON.stringify({
    html:     cyrHtml,
    language: docLang,
    page: {
      format: pageSizeCSS,
      margins: {
        top:    `${marginTop}mm`,
        right:  `${marginRight}mm`,
        bottom: `${marginBottom}mm`,
        left:   `${marginLeft}mm`,
      },
    },
    fonts: [{ family: fontName }],
    meta: { bookId: String(bookId), title: bookTitle },
  });

  let pdfBuffer!: Buffer;
  let lastErr: any;
  const t0 = Date.now();

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(`${rendererUrl}/render-pdf`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    renderPayload,
        signal:  AbortSignal.timeout(120_000),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({ error: "Unknown renderer error" }));
        throw Object.assign(new Error(errBody.error || `Renderer ${response.status}`), { fatal: true, status: response.status, body: errBody });
      }

      const arrayBuf = await response.arrayBuffer();
      pdfBuffer = Buffer.from(arrayBuf);
      lastErr   = null;
      break;
    } catch (err: any) {
      if (err.fatal) throw err;
      lastErr = err;
      console.warn(`[CoreExport] attempt ${attempt}/${MAX_RETRIES} failed: ${err?.message}`);
      if (attempt < MAX_RETRIES) await new Promise(r => setTimeout(r, RETRY_DELAY));
    }
  }

  if (lastErr) throw lastErr;

  console.log(
    `[CoreExport] bookId=${bookId} size=${Math.round(pdfBuffer.length / 1024)}KB ` +
    `time=${Date.now() - t0}ms`,
  );

  return {
    pdfBuffer,
    pageCount: -1,   // filled in by injection phase if needed
    renderTimeMs: Date.now() - t0,
  };
}
