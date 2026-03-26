import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { BookOpen, List, Settings2, FileDown, ChevronLeft, ChevronRight, Columns2, Square, Printer, ZoomIn, ZoomOut, Maximize2, ImageIcon, X } from "lucide-react";
import { useLang } from "@/contexts/language-context";
import { SectionTourModal } from "@/components/section-tour-modal";
import type { Book, Chapter } from "@shared/schema";

interface LayoutPanelProps {
  book: Book;
  chapters: Chapter[];
  bookId: number;
}

type PageSize = "a4" | "a5" | "letter";
type FontFamily = "serif" | "sans" | "mono";
type MarginSize = "narrow" | "normal" | "wide";
type LineSpacing = "compact" | "relaxed" | "spacious";
type ViewMode = "spread" | "single";
type Template = "classic" | "modern" | "minimal";
type ParaSpacing = "none" | "small" | "medium" | "large";
type PageNumbers = "center" | "outer" | "none";

const PARA_SPACING_PX: Record<ParaSpacing, number> = {
  none: 0, small: 6, medium: 12, large: 20,
};

const TEMPLATE_ACCENTS: Record<Template, string> = {
  classic:  "#8B5E3C",
  modern:   "#F96D1C",
  minimal:  "#2d1a0e",
};

const PAGE_SIZES: Record<PageSize, { w: number; h: number; label: string }> = {
  a4:     { w: 794, h: 1123, label: "A4 (210 × 297mm)" },
  a5:     { w: 559, h: 794,  label: "A5 (148 × 210mm)" },
  letter: { w: 816, h: 1056, label: "Letter (8.5 × 11in)" },
};

const MARGIN_PX: Record<MarginSize, number> = {
  narrow: 48,
  normal: 80,
  wide: 112,
};

const LINE_SPACING_MAP: Record<LineSpacing, number> = {
  compact: 1.5,
  relaxed: 1.75,
  spacious: 2.1,
};

const FONT_FAMILIES: Record<FontFamily, string> = {
  serif: "'Georgia', 'Times New Roman', serif",
  sans: "'Inter', 'Helvetica Neue', sans-serif",
  mono: "'Courier New', monospace",
};

const BOOK_LANG_TOC: Record<string, { toc: string; chapterLabel: string; tocHeading: string }> = {
  ru: { toc: "Оглавление", chapterLabel: "Глава", tocHeading: "Оглавление" },
  en: { toc: "Table of Contents", chapterLabel: "Chapter", tocHeading: "Table of Contents" },
  uk: { toc: "Зміст", chapterLabel: "Розділ", tocHeading: "Зміст" },
  de: { toc: "Inhaltsverzeichnis", chapterLabel: "Kapitel", tocHeading: "Inhaltsverzeichnis" },
  fr: { toc: "Table des matières", chapterLabel: "Chapitre", tocHeading: "Table des matières" },
  es: { toc: "Índice", chapterLabel: "Capítulo", tocHeading: "Índice" },
  it: { toc: "Indice", chapterLabel: "Capitolo", tocHeading: "Indice" },
  zh: { toc: "目录", chapterLabel: "章", tocHeading: "目录" },
  ja: { toc: "目次", chapterLabel: "章", tocHeading: "目次" },
};

interface LayoutBlock {
  type: string;
  text: string;
  indentLevel: number;
  checked?: boolean;
}

function parseBlocks(raw: any): LayoutBlock[] {
  let blocks: any[] = [];
  try {
    blocks = typeof raw === "string" ? JSON.parse(raw) : (Array.isArray(raw) ? raw : []);
  } catch {
    blocks = [];
  }
  return blocks.map((b: any) => ({
    type: b.type || "paragraph",
    text: String(b.content || b.text || "").trim(),
    indentLevel: Math.max(0, Math.min(8, Number(b.metadata?.indentLevel ?? 0))),
    checked: b.metadata?.checked ?? false,
  })).filter(b => b.text || b.type === "divider");
}

function buildPages(
  chapters: Chapter[],
  fontSizePx: number,
  pageH: number,
  marginPx: number,
  lineSpacing: number,
  paraSpacingPx: number = 0,
): { chapterIdx: number; chapterTitle: string; blocks: LayoutBlock[] }[] {
  const lineH = fontSizePx * lineSpacing;
  const contentH = pageH - marginPx * 2 - 48;
  const h1H = fontSizePx * 2.2;
  const h2H = fontSizePx * 1.6;
  const paraH = lineH * 1.8 + paraSpacingPx;

  const result: { chapterIdx: number; chapterTitle: string; blocks: LayoutBlock[] }[] = [];

  for (let ci = 0; ci < chapters.length; ci++) {
    const ch = chapters[ci];
    const blocks = parseBlocks(ch.content);

    let usedH = h1H + 24;
    let currentPage: LayoutBlock[] = [];
    let firstPage = true;

    const flush = () => {
      result.push({ chapterIdx: ci, chapterTitle: firstPage ? ch.title : "", blocks: [...currentPage] });
      currentPage = [];
      usedH = firstPage ? 0 : 0;
      firstPage = false;
    };

    for (const block of blocks) {
      const bH = block.type === "heading" ? h2H : paraH;
      if (usedH + bH > contentH && currentPage.length > 0) {
        flush();
      }
      currentPage.push(block);
      usedH += bH + 8;
    }

    if (currentPage.length > 0 || firstPage) {
      result.push({ chapterIdx: ci, chapterTitle: firstPage ? ch.title : "", blocks: currentPage });
    }
  }

  return result;
}

function CoverPage({
  book,
  pageW,
  pageH,
  fontFamily,
  headingFontFamily,
  accent,
}: {
  book: Book;
  pageW: number;
  pageH: number;
  fontFamily: string;
  headingFontFamily?: string;
  accent: string;
}) {
  const hasCover = !!(book as any).coverImage;
  return (
    <div
      style={{
        width: pageW,
        height: pageH,
        background: hasCover ? "#000" : `linear-gradient(160deg, ${accent}22 0%, #fff 60%)`,
        position: "relative",
        boxShadow: "0 2px 20px rgba(0,0,0,0.15)",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      {hasCover ? (
        <img
          src={(book as any).coverImage}
          alt="cover"
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      ) : (
        <div style={{
          width: "100%", height: "100%",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "10% 12%", gap: pageH * 0.03,
        }}>
          <div style={{ width: pageW * 0.18, height: 3, background: accent, borderRadius: 2, marginBottom: pageH * 0.04 }} />
          <div style={{
            fontFamily: headingFontFamily || fontFamily,
            fontSize: pageW * 0.065,
            fontWeight: 700,
            color: "#1a1a1a",
            textAlign: "center",
            lineHeight: 1.2,
            letterSpacing: "-0.01em",
          }}>
            {book.title}
          </div>
          {book.author && (
            <div style={{
              fontFamily,
              fontSize: pageW * 0.028,
              color: "#666",
              textAlign: "center",
              marginTop: pageH * 0.02,
              letterSpacing: "0.06em",
            }}>
              {book.author}
            </div>
          )}
          <div style={{ width: pageW * 0.10, height: 2, background: `${accent}60`, borderRadius: 2, marginTop: pageH * 0.04 }} />
        </div>
      )}
    </div>
  );
}

interface DesignerPageDef {
  id: string;
  position: number; // 1-indexed slot in the combined (content+designer) sequence, after special pages
  image: string;    // base64 data URL
}

function DesignerPageView({ image, pageW, pageH }: { image: string; pageW: number; pageH: number }) {
  return (
    <div style={{
      width: pageW,
      height: pageH,
      background: "#000",
      position: "relative",
      boxShadow: "0 2px 20px rgba(0,0,0,0.15)",
      overflow: "hidden",
      flexShrink: 0,
    }}>
      <img
        src={image}
        alt="designer page"
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
    </div>
  );
}

function TocPage({
  book,
  chapters,
  pageW,
  pageH,
  fontFamily,
  accent,
  chapterPageMap,
  L,
}: {
  book: Book;
  chapters: Chapter[];
  pageW: number;
  pageH: number;
  fontFamily: string;
  accent: string;
  chapterPageMap: Record<number, number>;
  L: any;
}) {
  const maxChapters = Math.floor((pageH * 0.45) / (pageW * 0.028));
  const visible = chapters.slice(0, Math.min(maxChapters, 22));
  return (
    <div
      style={{
        width: pageW,
        height: pageH,
        background: "#fff",
        position: "relative",
        boxShadow: "0 2px 20px rgba(0,0,0,0.10)",
        overflow: "hidden",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        padding: "10% 12%",
      }}
    >
      {/* Top accent bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
        <div style={{ height: 2, flex: 1, background: `linear-gradient(90deg, ${accent}, ${accent}00)` }} />
        <span style={{
          fontFamily,
          fontSize: pageW * 0.016,
          color: accent,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          fontWeight: 700,
          flexShrink: 0,
        }}>
          {L.toc || "Table of Contents"}
        </span>
        <div style={{ height: 2, flex: 1, background: `linear-gradient(270deg, ${accent}, ${accent}00)` }} />
      </div>

      {/* Book title centered */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <h1 style={{
          fontFamily,
          fontSize: pageW * 0.048,
          fontWeight: 700,
          color: "#111",
          lineHeight: 1.2,
          marginBottom: 10,
          letterSpacing: "-0.02em",
        }}>
          {book.title}
        </h1>
        <span style={{
          fontFamily,
          fontSize: pageW * 0.022,
          color: "#999",
          letterSpacing: "0.10em",
          textTransform: "uppercase",
          fontWeight: 400,
        }}>
          {book.mode === "fiction" ? (L.fiction || "Fiction") : (L.nonFiction || "Non-Fiction")}
        </span>
      </div>

      {/* Divider */}
      <div style={{ width: "100%", height: 1, background: `${accent}25`, marginBottom: 20 }} />

      {/* ToC listing with dot leaders */}
      <div style={{ flex: 1 }}>
        {visible.map((ch, i) => {
          const pageNum = (chapterPageMap[i] ?? 0) + 1;
          return (
            <div key={ch.id} style={{
              display: "flex",
              alignItems: "baseline",
              gap: 0,
              marginBottom: pageW * 0.012,
            }}>
              <span style={{
                fontFamily,
                fontSize: pageW * 0.019,
                color: "#bbb",
                minWidth: pageW * 0.038,
                flexShrink: 0,
                paddingRight: 4,
              }}>
                {String(i + 1).padStart(2, "\u2007")}
              </span>
              <span style={{
                fontFamily,
                fontSize: pageW * 0.022,
                color: i === 0 ? "#111" : "#333",
                fontWeight: i === 0 ? 600 : 400,
                flexShrink: 1,
                whiteSpace: "nowrap",
                overflow: "hidden",
                maxWidth: "70%",
              }}>
                {ch.title}
              </span>
              <span style={{
                flex: 1,
                borderBottom: `1px dotted ${accent}60`,
                margin: "0 6px",
                marginBottom: 3,
                minWidth: 16,
              }} />
              <span style={{
                fontFamily,
                fontSize: pageW * 0.021,
                color: accent,
                fontWeight: 600,
                flexShrink: 0,
                minWidth: pageW * 0.04,
                textAlign: "right",
              }}>
                {pageNum}
              </span>
            </div>
          );
        })}
        {chapters.length > visible.length && (
          <p style={{ fontFamily, fontSize: pageW * 0.017, color: "#bbb", marginTop: 8, textAlign: "center" }}>
            +{chapters.length - visible.length} {L.more || "more"}
          </p>
        )}
      </div>

      {/* Bottom accent */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: 20 }}>
        <div style={{ width: 32, height: 2, background: accent, borderRadius: 2, opacity: 0.4 }} />
      </div>
    </div>
  );
}

function Page({
  book,
  chapterTitle,
  blocks,
  pageNumber,
  fontFamily,
  headingFontFamily,
  fontSizePx,
  marginPx,
  lineSpacing,
  scale,
  pageW,
  pageH,
  L,
  isLeft,
  accent,
  template = "classic",
  paraSpacingPx = 0,
  firstLineIndent = true,
  dropCap = false,
  pageNumbers = "center",
  runningHeader = true,
}: {
  book: Book;
  chapterTitle: string;
  blocks: { type: string; text: string }[];
  pageNumber: number;
  fontFamily: string;
  headingFontFamily?: string;
  fontSizePx: number;
  marginPx: number;
  lineSpacing: number;
  scale: number;
  pageW: number;
  pageH: number;
  L: any;
  isLeft: boolean;
  accent: string;
  template?: Template;
  paraSpacingPx?: number;
  firstLineIndent?: boolean;
  dropCap?: boolean;
  pageNumbers?: PageNumbers;
  runningHeader?: boolean;
}) {
  const footerJustify =
    pageNumbers === "center" ? "center"
    : pageNumbers === "outer" ? (isLeft ? "flex-start" : "flex-end")
    : "center";

  return (
    <div
      style={{
        width: pageW,
        height: pageH,
        background: "#fff",
        position: "relative",
        boxShadow: "0 2px 20px rgba(0,0,0,0.10)",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      {/* Running Header */}
      {runningHeader && (
        <div
          style={{
            position: "absolute",
            top: marginPx * 0.55,
            left: marginPx,
            right: marginPx,
            display: "flex",
            justifyContent: isLeft ? "flex-start" : "flex-end",
            alignItems: "center",
            borderBottom: "0.5px solid rgba(0,0,0,0.10)",
            paddingBottom: "4px",
          }}
        >
          <span style={{
            fontFamily,
            fontSize: fontSizePx * 0.72,
            color: "#aaa",
            letterSpacing: "0.04em",
            fontStyle: "italic",
          }}>
            {isLeft ? (chapterTitle || book.title) : book.title}
          </span>
        </div>
      )}

      {/* Content */}
      <div
        className="layout-block-content"
        style={{
          position: "absolute",
          top: marginPx,
          left: marginPx,
          right: marginPx,
          bottom: marginPx,
          fontFamily,
          fontSize: fontSizePx,
          lineHeight: lineSpacing,
          color: "#1a1a1a",
          overflow: "hidden",
        }}
      >
        {chapterTitle && template === "classic" && (
          <div style={{ marginBottom: fontSizePx * 0.9, marginTop: fontSizePx * 0.3 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: fontSizePx * 0.4 }}>
              <div style={{ height: 1, flex: 1, background: `${accent}40` }} />
              <span style={{ fontFamily: headingFontFamily || fontFamily, fontSize: fontSizePx * 0.7, color: accent, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 600 }}>
                {L.chapterLabel || "Chapter"}
              </span>
              <div style={{ height: 1, flex: 1, background: `${accent}40` }} />
            </div>
            <h2 style={{
              fontFamily: headingFontFamily || fontFamily,
              fontSize: fontSizePx * 1.75,
              fontWeight: 700,
              lineHeight: 1.2,
              color: "#1a1a1a",
              letterSpacing: "-0.01em",
              textAlign: "center",
              margin: 0,
            }}>
              {chapterTitle}
            </h2>
            <div style={{ marginTop: fontSizePx * 0.35, display: "flex", justifyContent: "center", gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: accent }} />
              <div style={{ width: 28, height: 1.5, background: accent, alignSelf: "center" }} />
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: accent }} />
            </div>
          </div>
        )}
        {chapterTitle && template === "modern" && (
          <div style={{ marginBottom: fontSizePx * 0.9, marginTop: fontSizePx * 0.3 }}>
            <div style={{ background: accent, height: 4, borderRadius: 2, marginBottom: fontSizePx * 0.5, width: "100%" }} />
            <div style={{ display: "flex", alignItems: "flex-start", gap: fontSizePx * 0.5 }}>
              <div style={{ width: 3, background: accent, borderRadius: 2, alignSelf: "stretch", minHeight: fontSizePx * 1.75, flexShrink: 0 }} />
              <h2 style={{
                fontFamily: headingFontFamily || fontFamily,
                fontSize: fontSizePx * 1.9,
                fontWeight: 800,
                lineHeight: 1.1,
                color: "#0d0d0d",
                letterSpacing: "-0.02em",
                margin: 0,
              }}>
                {chapterTitle}
              </h2>
            </div>
          </div>
        )}
        {chapterTitle && template === "minimal" && (
          <div style={{ marginBottom: fontSizePx * 1.2, marginTop: fontSizePx * 0.8, borderBottom: `0.5px solid rgba(0,0,0,0.12)`, paddingBottom: fontSizePx * 0.6 }}>
            <span style={{
              fontFamily: headingFontFamily || fontFamily,
              fontSize: fontSizePx * 0.65,
              color: "#999",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              fontWeight: 500,
              display: "block",
              marginBottom: fontSizePx * 0.2,
            }}>
              —
            </span>
            <h2 style={{
              fontFamily: headingFontFamily || fontFamily,
              fontSize: fontSizePx * 1.55,
              fontWeight: 400,
              fontStyle: "italic",
              lineHeight: 1.3,
              color: "#1a1a1a",
              letterSpacing: "0.01em",
              margin: 0,
            }}>
              {chapterTitle}
            </h2>
          </div>
        )}
        {blocks.map((b, i) => {
          const indentPx = b.indentLevel * fontSizePx * 1.8;
          const nestBorderLeft = b.indentLevel > 0 ? `2px solid ${accent}25` : undefined;
          const nestPaddingLeft = b.indentLevel > 0 ? fontSizePx * 0.5 : 0;

          if (b.type === "h1" || b.type === "h2" || b.type === "heading") {
            return (
              <h3 key={i} style={{
                fontFamily: headingFontFamily || fontFamily,
                fontSize: fontSizePx * 1.2,
                fontWeight: 700,
                marginTop: fontSizePx * 1.0 + paraSpacingPx,
                marginBottom: fontSizePx * 0.3,
                marginLeft: indentPx,
                paddingLeft: nestPaddingLeft,
                borderLeft: nestBorderLeft,
                lineHeight: 1.3,
                color: accent,
                borderBottom: nestBorderLeft ? undefined : `1px solid ${accent}22`,
                paddingBottom: fontSizePx * 0.2,
              }} dangerouslySetInnerHTML={{ __html: b.text }} />
            );
          }
          if (b.type === "h3") {
            return (
              <h4 key={i} style={{
                fontFamily: headingFontFamily || fontFamily,
                fontSize: fontSizePx * 1.05,
                fontWeight: 600,
                marginTop: fontSizePx * 0.7 + paraSpacingPx,
                marginBottom: fontSizePx * 0.2,
                marginLeft: indentPx,
                paddingLeft: nestPaddingLeft,
                borderLeft: nestBorderLeft,
                lineHeight: 1.3,
                color: "#333",
              }} dangerouslySetInnerHTML={{ __html: b.text }} />
            );
          }
          if (b.type === "quote") {
            return (
              <blockquote key={i} style={{
                fontFamily,
                fontSize: fontSizePx,
                lineHeight: lineSpacing,
                fontStyle: "italic",
                color: "#555",
                borderLeft: `3px solid ${accent}`,
                paddingLeft: fontSizePx * 0.9,
                marginLeft: indentPx,
                marginRight: 0,
                marginTop: fontSizePx * 0.4 + paraSpacingPx,
                marginBottom: fontSizePx * 0.4 + paraSpacingPx,
                background: `${accent}06`,
                padding: `${fontSizePx * 0.4}px ${fontSizePx * 0.9}px`,
                borderRadius: "0 4px 4px 0",
              }} dangerouslySetInnerHTML={{ __html: b.text }} />
            );
          }
          // Special semantic block types — render with subtle label + tinted box
          const SEMANTIC_TYPES: Record<string, { label: string; border: string; bg: string }> = {
            idea:            { label: "Idea",            border: "#F59E0B", bg: "rgba(245,158,11,0.06)" },
            argument:        { label: "Argument",        border: "#10B981", bg: "rgba(16,185,129,0.06)" },
            counterargument: { label: "Counterargument", border: "#EF4444", bg: "rgba(239,68,68,0.06)" },
            hypothesis:      { label: "Hypothesis",      border: "#6366F1", bg: "rgba(99,102,241,0.06)" },
            question:        { label: "Question",        border: "#8B5CF6", bg: "rgba(139,92,246,0.06)" },
            example:         { label: "Example",         border: "#0D9488", bg: "rgba(13,148,136,0.06)" },
            observation:     { label: "Observation",     border: "#F97316", bg: "rgba(249,115,22,0.06)" },
            research:        { label: "Research",        border: "#64748B", bg: "rgba(100,116,139,0.06)" },
          };
          if (SEMANTIC_TYPES[b.type]) {
            const cfg = SEMANTIC_TYPES[b.type];
            return (
              <div key={i} style={{
                borderLeft: `2.5px solid ${cfg.border}`,
                background: cfg.bg,
                borderRadius: "0 4px 4px 0",
                padding: `${fontSizePx * 0.35}px ${fontSizePx * 0.85}px`,
                marginLeft: indentPx,
                marginTop: fontSizePx * 0.35 + paraSpacingPx,
                marginBottom: fontSizePx * 0.35 + paraSpacingPx,
              }}>
                <div style={{
                  fontFamily,
                  fontSize: fontSizePx * 0.65,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase" as const,
                  color: cfg.border,
                  marginBottom: fontSizePx * 0.2,
                  opacity: 0.85,
                }}>{cfg.label}</div>
                <p style={{
                  fontFamily,
                  fontSize: fontSizePx,
                  lineHeight: lineSpacing,
                  color: "#1a1a1a",
                  margin: 0,
                }} dangerouslySetInnerHTML={{ __html: b.text }} />
              </div>
            );
          }
          if (b.type === "bullet_item") {
            const bulletIndent = (b.indentLevel + 1) * fontSizePx * 1.8;
            return (
              <p key={i} style={{
                fontFamily,
                fontSize: fontSizePx,
                lineHeight: lineSpacing,
                color: "#1a1a1a",
                marginLeft: bulletIndent,
                paddingLeft: nestPaddingLeft,
                borderLeft: nestBorderLeft,
                textIndent: `-${fontSizePx * 1.2}px`,
                marginBottom: fontSizePx * 0.1 + paraSpacingPx,
                marginTop: 0,
              }}>
                <span style={{ marginRight: fontSizePx * 0.4 }}>•</span>
                <span dangerouslySetInnerHTML={{ __html: b.text }} />
              </p>
            );
          }
          if (b.type === "numbered_item") {
            const numIndent = (b.indentLevel + 1) * fontSizePx * 1.8;
            return (
              <p key={i} style={{
                fontFamily,
                fontSize: fontSizePx,
                lineHeight: lineSpacing,
                color: "#1a1a1a",
                marginLeft: numIndent,
                paddingLeft: nestPaddingLeft,
                borderLeft: nestBorderLeft,
                textIndent: 0,
                marginBottom: fontSizePx * 0.1 + paraSpacingPx,
                marginTop: 0,
              }} dangerouslySetInnerHTML={{ __html: b.text }} />
            );
          }
          if (b.type === "check_item") {
            const checkIndent = (b.indentLevel + 1) * fontSizePx * 1.8;
            return (
              <p key={i} style={{
                fontFamily,
                fontSize: fontSizePx,
                lineHeight: lineSpacing,
                color: "#1a1a1a",
                marginLeft: checkIndent,
                paddingLeft: nestPaddingLeft,
                borderLeft: nestBorderLeft,
                textIndent: `-${fontSizePx * 1.2}px`,
                marginBottom: fontSizePx * 0.1 + paraSpacingPx,
                marginTop: 0,
              }}>
                <span style={{ marginRight: fontSizePx * 0.3, opacity: 0.7 }}>{b.checked ? "☑" : "☐"}</span>
                <span dangerouslySetInnerHTML={{ __html: b.text }} />
              </p>
            );
          }
          if (b.type === "divider") {
            return <hr key={i} style={{ borderTop: `1px solid ${accent}30`, margin: `${fontSizePx * 0.8}px 0` }} />;
          }
          const isFirstParagraph = i === 0 || (i === 1 && !!chapterTitle);
          const useDropCap = dropCap && isFirstParagraph && b.text.length > 0 && b.indentLevel === 0;
          const useIndent = firstLineIndent && !isFirstParagraph && b.indentLevel === 0;
          if (useDropCap) {
            const firstChar = b.text[0];
            const rest = b.text.slice(1);
            return (
              <p key={i} style={{
                fontFamily,
                fontSize: fontSizePx,
                lineHeight: lineSpacing,
                textAlign: "justify",
                color: "#1a1a1a",
                marginLeft: indentPx,
                marginBottom: fontSizePx * 0.3 + paraSpacingPx,
                marginTop: 0,
              }}>
                <span style={{
                  float: "left",
                  fontSize: fontSizePx * 3.6,
                  lineHeight: 0.8,
                  fontWeight: 700,
                  color: accent,
                  fontFamily,
                  marginRight: fontSizePx * 0.12,
                  marginTop: fontSizePx * 0.1,
                  paddingBottom: "0.1em",
                }}>{firstChar}</span>
                {rest}
              </p>
            );
          }
          return (
            <p key={i} style={{
              fontFamily,
              fontSize: fontSizePx,
              lineHeight: lineSpacing,
              textAlign: b.indentLevel > 0 ? "left" : "justify",
              textIndent: useIndent ? fontSizePx * 1.5 : 0,
              marginLeft: indentPx,
              paddingLeft: nestPaddingLeft,
              borderLeft: nestBorderLeft,
              color: "#1a1a1a",
              marginBottom: fontSizePx * 0.15 + paraSpacingPx,
              marginTop: 0,
            }} dangerouslySetInnerHTML={{ __html: b.text }} />
          );
        })}
      </div>

      {/* Footer — page number */}
      {pageNumbers !== "none" && (
        <div
          style={{
            position: "absolute",
            bottom: marginPx * 0.5,
            left: marginPx,
            right: marginPx,
            display: "flex",
            justifyContent: footerJustify,
            alignItems: "center",
            borderTop: "0.5px solid rgba(0,0,0,0.08)",
            paddingTop: "4px",
          }}
        >
          <span style={{
            fontFamily,
            fontSize: fontSizePx * 0.72,
            color: "#bbb",
            letterSpacing: "0.06em",
          }}>
            {pageNumber}
          </span>
        </div>
      )}
    </div>
  );
}

export function LayoutPanel({ book, chapters, bookId }: LayoutPanelProps) {
  const { t, lang } = useLang();
  const L = (t as any).layoutPanel || {};
  const containerRef = useRef<HTMLDivElement>(null);

  const bookLang = BOOK_LANG_TOC[book.language || "ru"] || BOOK_LANG_TOC.en;
  const Leff = { ...L, toc: bookLang.toc, tocHeading: bookLang.tocHeading, chapterLabel: bookLang.chapterLabel };

  const [pageSize, setPageSize] = useState<PageSize>("a4");
  const [fontFamily, setFontFamily] = useState<FontFamily>("serif");
  const bookHeadingFont = (book as any).headingFont as FontFamily | "" | undefined;
  const [layoutHeadingFont, setLayoutHeadingFont] = useState<FontFamily | "">(bookHeadingFont || "");
  const headingFontFamilyStr = layoutHeadingFont && FONT_FAMILIES[layoutHeadingFont as FontFamily]
    ? FONT_FAMILIES[layoutHeadingFont as FontFamily]
    : undefined;
  const [fontSizePt, setFontSizePt] = useState(11);
  const [marginSize, setMarginSize] = useState<MarginSize>("normal");
  const [lineSpacing, setLineSpacing] = useState<LineSpacing>("relaxed");
  const [viewMode, setViewMode] = useState<ViewMode>("spread");
  const [spreadIndex, setSpreadIndex] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showToc, setShowToc] = useState(true);
  const [selectedChapterIdx, setSelectedChapterIdx] = useState<number | null>(null);
  const [template, setTemplate] = useState<Template>("classic");
  const [showTocPage, setShowTocPage] = useState(true);
  const [showCoverPage, setShowCoverPage] = useState(true);
  const [designerPages, setDesignerPages] = useState<DesignerPageDef[]>(() => {
    try { return JSON.parse(localStorage.getItem(`moodra_designer_pages_${bookId}`) || "[]"); }
    catch { return []; }
  });
  const [addingDesignerPage, setAddingDesignerPage] = useState(false);
  const [dpPosition, setDpPosition] = useState("2");
  const [paraSpacing, setParaSpacing] = useState<ParaSpacing>("small");
  const [firstLineIndent, setFirstLineIndent] = useState(true);
  const [dropCap, setDropCap] = useState(false);
  const [pageNumbers, setPageNumbers] = useState<PageNumbers>("center");
  const [runningHeader, setRunningHeader] = useState(true);
  const [canvasZoom, setCanvasZoom] = useState(0.72);
  const [aiStylePrompt, setAiStylePrompt] = useState<string>(() =>
    localStorage.getItem("moodra_layout_ai_prompt") || ""
  );
  const [aiPromptSaved, setAiPromptSaved] = useState(false);

  const saveDesignerPages = (pages: DesignerPageDef[]) => {
    setDesignerPages(pages);
    localStorage.setItem(`moodra_designer_pages_${bookId}`, JSON.stringify(pages));
  };

  const addDesignerPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const pos = Math.max(1, parseInt(dpPosition, 10) || 1);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const image = ev.target?.result as string;
      if (!image) return;
      const newPage: DesignerPageDef = { id: crypto.randomUUID(), position: pos, image };
      const updated = [...designerPages, newPage].sort((a, b) => a.position - b.position);
      saveDesignerPages(updated);
      setAddingDesignerPage(false);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const removeDesignerPage = (id: string) => {
    saveDesignerPages(designerPages.filter(p => p.id !== id));
  };

  const saveAiPrompt = (val: string) => {
    setAiStylePrompt(val);
    localStorage.setItem("moodra_layout_ai_prompt", val);
    setAiPromptSaved(true);
    setTimeout(() => setAiPromptSaved(false), 1800);
  };

  const paraSpacingPx = PARA_SPACING_PX[paraSpacing];

  const accent = TEMPLATE_ACCENTS[template];

  const { w: pageW, h: pageH } = PAGE_SIZES[pageSize];
  const marginPx = MARGIN_PX[marginSize];
  const fontSizePx = Math.round(fontSizePt * 1.333);
  const lineSpacingVal = LINE_SPACING_MAP[lineSpacing];
  const fontFamilyStr = FONT_FAMILIES[fontFamily];

  const pages = useMemo(() => {
    if (!chapters.length) return [];
    return buildPages(chapters, fontSizePx, pageH, marginPx, lineSpacingVal, paraSpacingPx);
  }, [chapters, fontSizePx, pageH, marginPx, lineSpacingVal, paraSpacingPx]);

  const totalPages = pages.length;

  const scaleForPage = useCallback((availW: number) => {
    return Math.min((availW - 32) / pageW, 1);
  }, [pageW]);

  const scaleForSpread = useCallback((availW: number) => {
    return Math.min((availW - 64) / (pageW * 2 + 32), 1);
  }, [pageW]);

  const scaledPageH = (scale: number) => Math.round(pageH * scale);
  const scaledPageW = (scale: number) => Math.round(pageW * scale);

  const chapterPageMap = useMemo(() => {
    const map: Record<number, number> = {};
    pages.forEach((p, i) => {
      if (p.chapterTitle && !(p.chapterIdx in map)) {
        map[p.chapterIdx] = i;
      }
    });
    return map;
  }, [pages]);

  const jumpToChapter = (ci: number) => {
    const pageIdx = chapterPageMap[ci];
    if (pageIdx === undefined) return;
    if (viewMode === "spread") {
      setSpreadIndex(Math.floor(pageIdx / 2) * 2);
    } else {
      setSpreadIndex(pageIdx);
    }
    setSelectedChapterIdx(ci);
  };

  const prevSpread = () => {
    if (viewMode === "spread") {
      const next = Math.max(0, spreadIndex - 2);
      if (next !== spreadIndex) setSpreadIndex(next);
    } else {
      const next = Math.max(0, spreadIndex - 1);
      if (next !== spreadIndex) setSpreadIndex(next);
    }
  };

  const nextSpread = () => {
    if (viewMode === "spread") {
      const next = Math.min(totalPages - 1, spreadIndex + 2);
      if (next !== spreadIndex) setSpreadIndex(next);
    } else {
      const next = Math.min(totalPages - 1, spreadIndex + 1);
      if (next !== spreadIndex) setSpreadIndex(next);
    }
  };

  const exportEpub = () => {
    window.open(`/api/books/${bookId}/export/epub`, "_blank");
  };

  const exportPdf = () => {
    const marginMm: Record<MarginSize, { t: number; b: number; l: number; r: number }> = {
      narrow: { t: 12, b: 14, l: 12, r: 10 },
      normal: { t: 20, b: 22, l: 20, r: 16 },
      wide:   { t: 30, b: 32, l: 30, r: 24 },
    };
    const m = marginMm[marginSize];
    const params = new URLSearchParams({
      pageSize: pageSize === "a4" ? "A4" : pageSize === "a5" ? "A5" : "LETTER",
      marginTop: String(m.t),
      marginBottom: String(m.b),
      marginLeft: String(m.l),
      marginRight: String(m.r),
      fontFamily: fontFamilyStr,
      fontSize: String(fontSizePt),
      lineHeight: String(lineSpacingVal),
      paragraphSpacing: paraSpacingPx > 0 ? (paraSpacingPx / fontSizePx).toFixed(2) : "0",
      chapterBreak: "true",
      chapterLabel: bookLang.chapterLabel,
      tocHeading: bookLang.tocHeading,
    });
    window.open(`/api/books/${bookId}/export/pdf-html?${params}`, "_blank");
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); nextSpread(); }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); prevSpread(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === "=" || e.key === "+")) {
        e.preventDefault();
        setCanvasZoom(z => Math.min(1.5, +(z + 0.1).toFixed(2)));
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "-") {
        e.preventDefault();
        setCanvasZoom(z => Math.max(0.35, +(z - 0.1).toFixed(2)));
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "0") {
        e.preventDefault();
        setCanvasZoom(0.72);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [spreadIndex, viewMode, totalPages]);

  const SCALE = canvasZoom;

  const numSpecialPages = (showCoverPage ? 1 : 0) + (showTocPage ? 1 : 0);
  const isCoverPage = showCoverPage && spreadIndex === 0;
  const isTocPage = showTocPage && spreadIndex === (showCoverPage ? 1 : 0) && !isCoverPage;
  const contentSpreadIndex = Math.max(0, spreadIndex - numSpecialPages);

  // Build merged slots: content pages + designer pages interleaved by position
  type Slot = { kind: "content"; page: typeof pages[0] } | { kind: "designer"; def: DesignerPageDef };
  const designerPageMap = new Map<number, DesignerPageDef>();
  for (const dp of designerPages) {
    designerPageMap.set(dp.position - 1, dp); // position is 1-indexed
  }
  const totalSlots = pages.length + designerPages.length;
  const slots: Slot[] = [];
  let pIdx = 0;
  for (let i = 0; i < totalSlots; i++) {
    const dp = designerPageMap.get(i);
    if (dp) { slots.push({ kind: "designer", def: dp }); }
    else if (pIdx < pages.length) { slots.push({ kind: "content", page: pages[pIdx++] }); }
  }

  const leftSlot = slots[contentSpreadIndex] ?? null;
  const rightSlot = slots[contentSpreadIndex + 1] ?? null;
  const leftPage = leftSlot?.kind === "content" ? leftSlot.page : undefined;
  const rightPage = rightSlot?.kind === "content" ? rightSlot.page : undefined;

  const displayPages = viewMode === "spread"
    ? [leftPage, rightPage].filter(Boolean)
    : [leftPage].filter(Boolean);

  const adjustedTotal = slots.length + numSpecialPages;

  if (!chapters.length) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ color: "#aaa", fontSize: 14 }}>
        <BookOpen style={{ width: 32, height: 32, marginRight: 12, opacity: 0.3 }} />
        {L.noContent || "No chapters yet"}
      </div>
    );
  }

  return (
    <div className="flex flex-1 overflow-hidden" style={{ background: "hsl(30, 58%, 97%)" }}>
      <SectionTourModal sectionId="layout" lang={lang as any} />
      {/* Left sidebar — ToC + Settings */}
      <div
        style={{
          width: 220,
          flexShrink: 0,
          borderRight: "1px solid rgba(249,109,28,0.10)",
          background: "rgba(255,250,245,0.98)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Sidebar header */}
        <div style={{
          padding: "12px 14px 8px",
          borderBottom: "1px solid rgba(249,109,28,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <span style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "#c2a897",
          }}>
            {L.title || "Book Layout"}
          </span>
          <div style={{ display: "flex", gap: 4 }}>
            <button
              onClick={() => { setShowToc(!showToc); setShowSettings(false); }}
              title={L.toc}
              style={{
                width: 26, height: 26, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
                background: showToc && !showSettings ? "rgba(249,109,28,0.12)" : "transparent",
                color: showToc && !showSettings ? "#F96D1C" : "#aaa",
                border: "none", cursor: "pointer",
              }}
            >
              <List style={{ width: 13, height: 13 }} />
            </button>
            <button
              onClick={() => { setShowSettings(!showSettings); setShowToc(false); }}
              title={L.pageSize}
              style={{
                width: 26, height: 26, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
                background: showSettings ? "rgba(249,109,28,0.12)" : "transparent",
                color: showSettings ? "#F96D1C" : "#aaa",
                border: "none", cursor: "pointer",
              }}
            >
              <Settings2 style={{ width: 13, height: 13 }} />
            </button>
          </div>
        </div>

        {/* ToC */}
        {!showSettings && (
          <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
            <div style={{ padding: "4px 14px 8px", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "#c2a897", fontWeight: 600 }}>
              {L.toc || "Table of Contents"}
            </div>
            {chapters.map((ch, i) => (
              <button
                key={ch.id}
                onClick={() => jumpToChapter(i)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "6px 14px",
                  fontSize: 12,
                  background: selectedChapterIdx === i ? "rgba(249,109,28,0.08)" : "transparent",
                  color: selectedChapterIdx === i ? "#F96D1C" : "#6b5b52",
                  border: "none",
                  cursor: "pointer",
                  borderLeft: `2px solid ${selectedChapterIdx === i ? "#F96D1C" : "transparent"}`,
                  transition: "all 0.15s",
                  lineHeight: 1.35,
                }}
              >
                <div style={{ fontSize: 9, color: "#c2a897", marginBottom: 1 }}>
                  {i + 1}. {L.page} {(chapterPageMap[i] ?? 0) + 1}
                </div>
                <div style={{ fontWeight: selectedChapterIdx === i ? 600 : 400 }}>{ch.title}</div>
              </button>
            ))}
          </div>
        )}

        {/* Settings panel */}
        {showSettings && (
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px" }}>
            <SettingRow label={L.pageSize || "Page Size"}>
              <select
                value={pageSize}
                onChange={e => setPageSize(e.target.value as PageSize)}
                style={selectStyle}
              >
                {(Object.keys(PAGE_SIZES) as PageSize[]).map(k => (
                  <option key={k} value={k}>{PAGE_SIZES[k].label}</option>
                ))}
              </select>
            </SettingRow>

            <SettingRow label={L.font || "Typeface"}>
              <select value={fontFamily} onChange={e => setFontFamily(e.target.value as FontFamily)} style={selectStyle}>
                <option value="serif">{L.serif || "Serif (Georgia)"}</option>
                <option value="sans">{L.sansSerif || "Sans-serif"}</option>
                <option value="mono">{L.mono || "Monospace"}</option>
              </select>
            </SettingRow>

            <SettingRow label={L.fontSize || "Font Size"}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="range" min={9} max={14} value={fontSizePt}
                  onChange={e => setFontSizePt(Number(e.target.value))}
                  style={{ flex: 1, accentColor: "#F96D1C" }}
                />
                <span style={{ fontSize: 11, color: "#8a7a70", minWidth: 28 }}>{fontSizePt}pt</span>
              </div>
            </SettingRow>

            <SettingRow label={L.margins || "Margins"}>
              <div style={{ display: "flex", gap: 4 }}>
                {(["narrow", "normal", "wide"] as MarginSize[]).map(m => (
                  <button key={m} onClick={() => setMarginSize(m)} style={chipStyle(marginSize === m)}>
                    {L[m] || m}
                  </button>
                ))}
              </div>
            </SettingRow>

            <SettingRow label={L.lineHeight || "Line Spacing"}>
              <div style={{ display: "flex", gap: 4 }}>
                {(["compact", "relaxed", "spacious"] as LineSpacing[]).map(l => (
                  <button key={l} onClick={() => setLineSpacing(l)} style={chipStyle(lineSpacing === l)}>
                    {L[l] || l}
                  </button>
                ))}
              </div>
            </SettingRow>

            <SettingRow label={L.paraSpacing || "Para Spacing"}>
              <div style={{ display: "flex", gap: 4 }}>
                {(["none", "small", "medium", "large"] as ParaSpacing[]).map(p => (
                  <button key={p} onClick={() => setParaSpacing(p)} style={chipStyle(paraSpacing === p)}>
                    {p === "none" ? "0" : p === "small" ? "S" : p === "medium" ? "M" : "L"}
                  </button>
                ))}
              </div>
            </SettingRow>

            <SettingRow label={L.pageNumbers || "Page Numbers"}>
              <div style={{ display: "flex", gap: 4 }}>
                {(["center", "outer", "none"] as PageNumbers[]).map(p => (
                  <button key={p} onClick={() => setPageNumbers(p)} style={chipStyle(pageNumbers === p)}>
                    {p === "center" ? "⊙" : p === "outer" ? "⇄" : "—"}
                  </button>
                ))}
              </div>
            </SettingRow>

            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {[
                { label: L.firstLineIndent || "Indent", val: firstLineIndent, set: setFirstLineIndent },
                { label: L.dropCap || "Drop Cap", val: dropCap, set: setDropCap },
                { label: L.runningHeader || "Headers", val: runningHeader, set: setRunningHeader },
              ].map(({ label, val, set }) => (
                <button key={label} onClick={() => set(v => !v)} style={{
                  padding: "3px 8px", borderRadius: 5, fontSize: 10, fontWeight: 500, cursor: "pointer",
                  border: `1px solid ${val ? "rgba(249,109,28,0.25)" : "rgba(0,0,0,0.10)"}`,
                  background: val ? "rgba(249,109,28,0.10)" : "rgba(0,0,0,0.03)",
                  color: val ? "#F96D1C" : "#aaa",
                }}>
                  {label} {val ? "On" : "Off"}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Heading font selector */}
        {showSettings && (
          <div style={{ padding: "6px 12px 10px", borderTop: "1px solid rgba(249,109,28,0.08)" }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#c2a897", marginBottom: 6 }}>
              {L.headingFont || "Heading Font"}
            </div>
            <select
              value={layoutHeadingFont}
              onChange={e => setLayoutHeadingFont(e.target.value as FontFamily | "")}
              style={selectStyle}
            >
              <option value="">{L.sameAsBody || "Same as body"}</option>
              <option value="serif">{L.serif || "Serif (Georgia)"}</option>
              <option value="sans">{L.sansSerif || "Sans-serif"}</option>
              <option value="mono">{L.mono || "Monospace"}</option>
            </select>
          </div>
        )}

        {/* Cover page toggle */}
        {showSettings && (
          <div style={{ padding: "6px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#c2a897" }}>
              {L.cover || "Cover"}
            </span>
            <button onClick={() => setShowCoverPage(v => !v)} style={{
              padding: "3px 8px", borderRadius: 5, border: `1px solid ${showCoverPage ? "rgba(249,109,28,0.25)" : "rgba(0,0,0,0.10)"}`,
              background: showCoverPage ? "rgba(249,109,28,0.10)" : "rgba(0,0,0,0.03)",
              color: showCoverPage ? "#F96D1C" : "#aaa", fontSize: 10, fontWeight: 500, cursor: "pointer",
            }}>
              {showCoverPage ? "On" : "Off"}
            </button>
          </div>
        )}

        {/* ToC page toggle */}
        {showSettings && (
          <div style={{ padding: "6px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#c2a897" }}>
              {L.toc || "ToC Page"}
            </span>
            <button onClick={() => setShowTocPage(v => !v)} style={{
              padding: "3px 8px", borderRadius: 5, border: `1px solid ${showTocPage ? "rgba(249,109,28,0.25)" : "rgba(0,0,0,0.10)"}`,
              background: showTocPage ? "rgba(249,109,28,0.10)" : "rgba(0,0,0,0.03)",
              color: showTocPage ? "#F96D1C" : "#aaa", fontSize: 10, fontWeight: 500, cursor: "pointer",
            }}>
              {showTocPage ? "On" : "Off"}
            </button>
          </div>
        )}

        {/* Designer Pages */}
        {showSettings && (
          <div style={{ padding: "8px 12px 10px", borderTop: "1px solid rgba(249,109,28,0.08)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#c2a897" }}>
                {L.designerPages || "Designer Pages"}
              </div>
              <button
                onClick={() => setAddingDesignerPage(v => !v)}
                style={{
                  padding: "3px 8px", borderRadius: 5, cursor: "pointer", fontSize: 10, fontWeight: 600,
                  border: "1px solid rgba(249,109,28,0.25)", background: "rgba(249,109,28,0.10)", color: "#F96D1C",
                }}
              >
                + {L.addPage || "Add"}
              </button>
            </div>

            {addingDesignerPage && (
              <div style={{ marginBottom: 8, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#888" }}>
                  <span>{L.atPosition || "at slot"} #</span>
                  <input
                    type="number"
                    min={1}
                    value={dpPosition}
                    onChange={e => setDpPosition(e.target.value)}
                    style={{
                      width: 40, padding: "2px 4px", borderRadius: 4, border: "1px solid rgba(0,0,0,0.15)",
                      fontSize: 10, background: "rgba(0,0,0,0.03)", outline: "none",
                    }}
                  />
                </div>
                <label style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "3px 10px", borderRadius: 5, cursor: "pointer", fontSize: 10, fontWeight: 600,
                  border: "1px solid rgba(0,0,0,0.18)", background: "rgba(0,0,0,0.04)", color: "#555",
                }}>
                  <ImageIcon style={{ width: 11, height: 11 }} />
                  {L.chooseImage || "Choose image"}
                  <input type="file" accept="image/*" onChange={addDesignerPage} style={{ display: "none" }} />
                </label>
              </div>
            )}

            {designerPages.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {designerPages.map(dp => (
                  <div key={dp.id} style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "4px 6px", borderRadius: 6, background: "rgba(0,0,0,0.03)",
                    border: "1px solid rgba(0,0,0,0.06)",
                  }}>
                    <img
                      src={dp.image}
                      alt=""
                      style={{ width: 24, height: 32, objectFit: "cover", borderRadius: 3, flexShrink: 0 }}
                    />
                    <span style={{ fontSize: 10, color: "#888", flex: 1 }}>
                      {L.atPosition || "slot"} #{dp.position}
                    </span>
                    <button
                      onClick={() => removeDesignerPage(dp.id)}
                      style={{
                        background: "none", border: "none", cursor: "pointer", color: "#bbb",
                        display: "flex", alignItems: "center", padding: 2,
                      }}
                    >
                      <X style={{ width: 11, height: 11 }} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {designerPages.length === 0 && !addingDesignerPage && (
              <p style={{ fontSize: 10, color: "#bbb", marginTop: 2 }}>
                {L.designerPagesHint || "Full-page images inserted between pages. No page number shown."}
              </p>
            )}
          </div>
        )}

        {/* AI Style Prompt */}
        {showSettings && (
          <div style={{ padding: "8px 12px 10px", borderTop: "1px solid rgba(249,109,28,0.08)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#c2a897" }}>
                {L.aiStylePrompt || "AI Style Note"}
              </div>
              {aiPromptSaved && (
                <span style={{ fontSize: 9, color: "#22c55e", fontWeight: 600 }}>✓ {L.saved || "Saved"}</span>
              )}
            </div>
            <textarea
              value={aiStylePrompt}
              onChange={e => setAiStylePrompt(e.target.value)}
              onBlur={e => saveAiPrompt(e.target.value)}
              placeholder={L.aiStylePlaceholder || "e.g. Dark gothic tone, 19th-century British English, poetic chapter openings…"}
              rows={3}
              style={{
                width: "100%",
                padding: "6px 8px",
                fontSize: 10,
                lineHeight: 1.5,
                borderRadius: 6,
                border: "1px solid rgba(249,109,28,0.18)",
                background: "rgba(249,109,28,0.03)",
                color: "#5a4a40",
                resize: "none",
                outline: "none",
                boxSizing: "border-box",
                fontFamily: "inherit",
              }}
            />
            <div style={{ fontSize: 9, color: "#c2a897", marginTop: 4, lineHeight: 1.4 }}>
              {L.aiStyleHint || "Stored locally — referenced when using AI features in this book."}
            </div>
          </div>
        )}

        {/* Export buttons */}
        <div style={{ padding: "10px 12px", borderTop: "1px solid rgba(249,109,28,0.08)", display: "flex", gap: 6 }}>
          <button
            onClick={exportPdf}
            style={{
              flex: 1,
              padding: "7px 0",
              borderRadius: 8,
              background: "rgba(249,109,28,0.12)",
              border: "1px solid rgba(249,109,28,0.18)",
              color: "#F96D1C",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
              transition: "all 0.2s",
            }}
          >
            <Printer style={{ width: 12, height: 12 }} />
            PDF
          </button>
          <button
            onClick={exportEpub}
            style={{
              flex: 1,
              padding: "7px 0",
              borderRadius: 8,
              background: "rgba(45,26,14,0.06)",
              border: "1px solid rgba(45,26,14,0.12)",
              color: "#6b5a50",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
              transition: "all 0.2s",
            }}
          >
            <FileDown style={{ width: 12, height: 12 }} />
            EPUB
          </button>
        </div>
      </div>

      {/* Main area — page preview */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Preview toolbar */}
        <div style={{
          height: 44,
          borderBottom: "1px solid rgba(249,109,28,0.10)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          background: "rgba(255,250,245,0.95)",
          flexShrink: 0,
        }}>
          {/* View mode toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(0,0,0,0.04)", borderRadius: 8, padding: "2px" }}>
            <button
              onClick={() => setViewMode("spread")}
              title={L.spread || "Spread"}
              style={{
                padding: "4px 8px", borderRadius: 6, border: "none", cursor: "pointer",
                background: viewMode === "spread" ? "#fff" : "transparent",
                color: viewMode === "spread" ? "#F96D1C" : "#aaa",
                fontSize: 11, fontWeight: 500,
                display: "flex", alignItems: "center", gap: 4,
                boxShadow: viewMode === "spread" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
            >
              <Columns2 style={{ width: 12, height: 12 }} />
              {L.spread || "Spread"}
            </button>
            <button
              onClick={() => setViewMode("single")}
              title={L.single || "Single"}
              style={{
                padding: "4px 8px", borderRadius: 6, border: "none", cursor: "pointer",
                background: viewMode === "single" ? "#fff" : "transparent",
                color: viewMode === "single" ? "#F96D1C" : "#aaa",
                fontSize: 11, fontWeight: 500,
                display: "flex", alignItems: "center", gap: 4,
                boxShadow: viewMode === "single" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
            >
              <Square style={{ width: 12, height: 12 }} />
              {L.single || "Single"}
            </button>
          </div>

          {/* Zoom controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button
              onClick={() => setCanvasZoom(z => Math.max(0.35, +(z - 0.1).toFixed(2)))}
              title="Zoom out (−)"
              style={{
                width: 26, height: 26, borderRadius: 6, border: "none", cursor: "pointer",
                background: "rgba(0,0,0,0.04)", color: "#8a7a70",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <ZoomOut style={{ width: 12, height: 12 }} />
            </button>
            <input
              type="range"
              min={35} max={150} step={5}
              value={Math.round(canvasZoom * 100)}
              onChange={e => setCanvasZoom(+e.target.value / 100)}
              title={`Zoom: ${Math.round(canvasZoom * 100)}%`}
              style={{ width: 72, accentColor: "#F96D1C", cursor: "pointer" }}
            />
            <button
              onClick={() => setCanvasZoom(z => Math.min(1.5, +(z + 0.1).toFixed(2)))}
              title="Zoom in (+)"
              style={{
                width: 26, height: 26, borderRadius: 6, border: "none", cursor: "pointer",
                background: "rgba(0,0,0,0.04)", color: "#8a7a70",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <ZoomIn style={{ width: 12, height: 12 }} />
            </button>
            <button
              onClick={() => setCanvasZoom(0.72)}
              title="Reset zoom"
              style={{
                padding: "3px 7px", borderRadius: 5, border: "none", cursor: "pointer",
                background: "rgba(0,0,0,0.04)", color: "#8a7a70", fontSize: 10, fontWeight: 600,
              }}
            >
              {Math.round(canvasZoom * 100)}%
            </button>
            <button
              onClick={() => setCanvasZoom(canvasZoom >= 0.98 ? 0.72 : 1.0)}
              title="Fit / 100%"
              style={{
                width: 26, height: 26, borderRadius: 6, border: "none", cursor: "pointer",
                background: "rgba(0,0,0,0.04)", color: "#8a7a70",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <Maximize2 style={{ width: 11, height: 11 }} />
            </button>
          </div>

          {/* Page navigation */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={prevSpread}
              disabled={spreadIndex === 0}
              style={{
                width: 28, height: 28, borderRadius: 7, border: "none", cursor: spreadIndex === 0 ? "not-allowed" : "pointer",
                background: "rgba(0,0,0,0.04)", color: spreadIndex === 0 ? "#ccc" : "#8a7a70",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <ChevronLeft style={{ width: 14, height: 14 }} />
            </button>
            <span style={{ fontSize: 11, color: "#8a7a70", minWidth: 80, textAlign: "center" }}>
              {L.page || "Page"} {spreadIndex + 1}–{Math.min(spreadIndex + (viewMode === "spread" ? 2 : 1), adjustedTotal)} / {adjustedTotal}
            </span>
            <button
              onClick={nextSpread}
              disabled={spreadIndex >= totalPages - 1}
              style={{
                width: 28, height: 28, borderRadius: 7, border: "none",
                cursor: spreadIndex >= totalPages - 1 ? "not-allowed" : "pointer",
                background: "rgba(0,0,0,0.04)", color: spreadIndex >= totalPages - 1 ? "#ccc" : "#8a7a70",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <ChevronRight style={{ width: 14, height: 14 }} />
            </button>
          </div>
        </div>

        {/* Page view */}
        <div
          ref={containerRef}
          onWheel={e => {
            if (e.ctrlKey || e.metaKey) {
              e.preventDefault();
              const delta = e.deltaY > 0 ? -0.05 : 0.05;
              setCanvasZoom(z => Math.min(1.5, Math.max(0.35, +(z + delta).toFixed(2))));
            }
          }}
          style={{
            flex: 1,
            overflow: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "hsl(30, 28%, 90%)",
            backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.07) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
            padding: "40px",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: viewMode === "spread" ? 4 : 0,
              alignItems: "flex-start",
              transformOrigin: "top center",
              transform: `scale(${SCALE})`,
              transition: "transform 0.2s ease",
            }}
          >
            {isCoverPage ? (
              <CoverPage
                book={book}
                pageW={pageW}
                pageH={pageH}
                fontFamily={fontFamilyStr}
                headingFontFamily={headingFontFamilyStr}
                accent={accent}
              />
            ) : isTocPage ? (
              <TocPage
                book={book}
                chapters={chapters}
                pageW={pageW}
                pageH={pageH}
                fontFamily={fontFamilyStr}
                accent={accent}
                chapterPageMap={chapterPageMap}
                L={Leff}
              />
            ) : (
              [leftSlot, viewMode === "spread" ? rightSlot : null].filter(Boolean).map((slot, pi) => {
                if (!slot) return null;
                if (slot.kind === "designer") {
                  return (
                    <DesignerPageView
                      key={`dp-${slot.def.id}-${pi}`}
                      image={slot.def.image}
                      pageW={pageW}
                      pageH={pageH}
                    />
                  );
                }
                const page = slot.page;
                return (
                  <Page
                    key={`${spreadIndex + pi}`}
                    book={book}
                    chapterTitle={page.chapterTitle}
                    blocks={page.blocks}
                    pageNumber={contentSpreadIndex + pi + 1}
                    fontFamily={fontFamilyStr}
                    headingFontFamily={headingFontFamilyStr}
                    fontSizePx={fontSizePx}
                    marginPx={marginPx}
                    lineSpacing={lineSpacingVal}
                    scale={SCALE}
                    pageW={pageW}
                    pageH={pageH}
                    L={Leff}
                    isLeft={pi === 0}
                    accent={accent}
                    template={template}
                    paraSpacingPx={paraSpacingPx}
                    firstLineIndent={firstLineIndent}
                    dropCap={dropCap}
                    pageNumbers={pageNumbers}
                    runningHeader={runningHeader}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#c2a897", marginBottom: 5 }}>
        {label}
      </div>
      {children}
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "5px 8px",
  borderRadius: 6,
  border: "1px solid rgba(249,109,28,0.15)",
  background: "rgba(255,250,245,0.9)",
  fontSize: 11,
  color: "#6b5b52",
  cursor: "pointer",
  outline: "none",
};

const chipStyle = (active: boolean): React.CSSProperties => ({
  flex: 1,
  padding: "4px 0",
  borderRadius: 5,
  border: `1px solid ${active ? "rgba(249,109,28,0.25)" : "rgba(0,0,0,0.08)"}`,
  background: active ? "rgba(249,109,28,0.10)" : "rgba(0,0,0,0.03)",
  color: active ? "#F96D1C" : "#8a7a70",
  fontSize: 10,
  fontWeight: active ? 600 : 400,
  cursor: "pointer",
  transition: "all 0.15s",
});
