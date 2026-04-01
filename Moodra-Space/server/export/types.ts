export type PageSizeKey    = "A4" | "A5" | "B5";
export type TextAlign      = "left" | "justify";
export type FitMode        = "cover" | "contain";
export type DocLang        = "ru" | "uk";
export type FooterAlign    = "left" | "center" | "right" | "mirror";

/**
 * Normalized designer page entry with full placement metadata.
 * Decoupled from the HTTP payload — always has defaults filled in.
 */
export interface DesignerPageEntry {
  id: string;
  /** Server path, e.g. /uploads/designer-pages/3/abc.jpg  */
  imageUrl: string;
  /** -1 = before all chapters; N ≥ 0 = after chapter N (0-based). */
  afterChapterIdx: number;
  fitMode: FitMode;
  pageBreakBefore: boolean;
  pageBreakAfter: boolean;
  backgroundColor: string;
  enabled: boolean;
}

export interface LayoutSettings {
  pageSize: PageSizeKey;
  pageSizeCSS: string;
  pageSizeWidthMm: number;
  pageSizeHeightMm: number;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  fontFamily: string;
  headingFontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  paragraphSpacing: number;
  firstLineIndent: number;
  textAlign: TextAlign;
  h1Size: number;
  h2Size: number;
  h3Size: number;
  chapterBreak: boolean;
  footerPageNumber: boolean;
  footerBookTitle: boolean;
  footerAlignment: FooterAlign;
  cyrillicHyphenHeadings: boolean;
  cyrillicHyphenToc: boolean;
}

export interface ChapterData {
  id: number;
  title: string;
  /** Pre-rendered HTML for all blocks inside this chapter. */
  contentHtml: string;
}

/**
 * Serializable export manifest — built once before any rendering begins.
 * Can be logged or stored for debugging failed exports.
 */
export interface ExportManifest {
  bookId: number;
  bookTitle: string;
  coverImage: string | null;
  safeTitle: string;
  docLang: DocLang;
  htmlLang: string;
  layout: LayoutSettings;
  frontMatter: Record<string, any>;
  chapters: ChapterData[];
  designerPages: DesignerPageEntry[];
  meta: {
    createdAt: string;
    hasDesignerPages: boolean;
    designerPageCount: number;
    enabledDesignerPageCount: number;
  };
}

export interface CoreExportResult {
  pdfBuffer: Buffer;
  pageCount: number;
  renderTimeMs: number;
}
