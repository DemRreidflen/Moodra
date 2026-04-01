import type {
  ExportManifest, DesignerPageEntry, LayoutSettings, ChapterData,
} from "./types.js";
import { cyrBlockToHtml } from "./utils.js";

/**
 * Build a fully-normalized, serializable ExportManifest from raw HTTP request data.
 * This is Phase 0 of the export pipeline — all data normalisation and defaults
 * are resolved here so every downstream function operates on clean typed data.
 */
export function buildExportManifest(
  bookId: number,
  book: { title: string; language?: string; coverImage?: string | null },
  chapters: { id: number; title: string; content: any }[],
  body: Record<string, any>,
): ExportManifest {
  const docLang: "ru" | "uk" = body.documentLanguage === "uk" ? "uk" : "ru";

  const psRaw = ((body.pageSize as string) || "A5").toUpperCase();
  const pageSize = (["A4", "A5", "B5"].includes(psRaw) ? psRaw : "A5") as "A4" | "A5" | "B5";
  const pageSizeCSS = pageSize === "A4" ? "A4" : pageSize === "B5" ? "176mm 250mm" : "A5";
  const psW = pageSize === "A4" ? 210 : pageSize === "B5" ? 176 : 148;
  const psH = pageSize === "A4" ? 297 : pageSize === "B5" ? 250 : 210;

  const ff = body.fontFamily ?? "Georgia, \"Times New Roman\", serif";
  const hff = (body.headingFontFamily && String(body.headingFontFamily).trim())
    ? String(body.headingFontFamily) : ff;

  const layout: LayoutSettings = {
    pageSize,
    pageSizeCSS,
    pageSizeWidthMm:  psW,
    pageSizeHeightMm: psH,
    marginTop:        Math.max(5,    Math.min(50,  Number(body.marginTop        ?? 20))),
    marginBottom:     Math.max(5,    Math.min(50,  Number(body.marginBottom     ?? 22))),
    marginLeft:       Math.max(5,    Math.min(50,  Number(body.marginLeft       ?? 20))),
    marginRight:      Math.max(5,    Math.min(50,  Number(body.marginRight      ?? 16))),
    fontFamily:       ff,
    headingFontFamily: hff,
    fontSize:         Math.max(7,    Math.min(18,  Number(body.fontSize         ?? 11))),
    lineHeight:       Math.max(0.5,  Math.min(3,   Number(body.lineHeight       ?? 1.6))),
    letterSpacing:    Math.max(-0.1, Math.min(0.5, Number(body.letterSpacing    ?? 0))),
    paragraphSpacing: Math.max(0,    Math.min(3,   Number(body.paragraphSpacing ?? 0.5))),
    firstLineIndent:  Math.max(0,    Math.min(5,   Number(body.firstLineIndent  ?? 1.2))),
    textAlign:        body.textAlign === "left" ? "left" : "justify",
    h1Size:           Math.max(10,   Math.min(36,  Number(body.h1Size           ?? 22))),
    h2Size:           Math.max(8,    Math.min(30,  Number(body.h2Size           ?? 16))),
    h3Size:           Math.max(7,    Math.min(24,  Number(body.h3Size           ?? 13))),
    chapterBreak:         body.chapterBreak !== false,
    footerPageNumber:     body.footerPageNumber !== false,
    footerBookTitle:      body.footerBookTitle === true,
    footerAlignment:      (["left","center","right","mirror"].includes(body.footerAlignment)
      ? body.footerAlignment : "center") as "left" | "center" | "right" | "mirror",
    cyrillicHyphenHeadings: body.cyrillicHyphenHeadings !== false,
    cyrillicHyphenToc:      body.cyrillicHyphenToc !== false,
  };

  // ── Designer pages: normalize to full DesignerPageEntry objects ──────────
  const dpRaw: { afterChapterIdx?: number; imageUrl?: string; id?: string; fitMode?: string }[] =
    Array.isArray(body.designerPages) ? body.designerPages : [];

  const designerPages: DesignerPageEntry[] = dpRaw
    .filter(dp => dp.imageUrl)
    .map((dp, i) => ({
      id:             dp.id ?? `dp-${i}`,
      imageUrl:       dp.imageUrl as string,
      afterChapterIdx: Math.max(-1, Math.min(chapters.length - 1, Number(dp.afterChapterIdx ?? -1))),
      fitMode:        dp.fitMode === "contain" ? "contain" : "cover",
      pageBreakBefore: true,
      pageBreakAfter:  true,
      backgroundColor: "#ffffff",
      enabled:         true,
    }));

  // ── Chapters: pre-render block JSON → HTML strings ────────────────────────
  const chapterData: ChapterData[] = chapters.map(ch => {
    let blocks: any[] = [];
    try {
      blocks = typeof ch.content === "string"
        ? JSON.parse(ch.content) : (ch.content ?? []);
    } catch {}
    const contentHtml = blocks.map(cyrBlockToHtml).filter(Boolean).join("\n");
    return { id: ch.id, title: ch.title, contentHtml };
  });

  return {
    bookId,
    bookTitle: book.title,
    coverImage: book.coverImage ?? null,
    safeTitle:  book.title.replace(/[^\w\s-]/g, "").trim() || "book",
    docLang,
    htmlLang:   docLang,
    layout,
    frontMatter: body.frontMatter ?? {},
    chapters: chapterData,
    designerPages,
    meta: {
      createdAt:                new Date().toISOString(),
      hasDesignerPages:         designerPages.length > 0,
      designerPageCount:        designerPages.length,
      enabledDesignerPageCount: designerPages.filter(dp => dp.enabled).length,
    },
  };
}
