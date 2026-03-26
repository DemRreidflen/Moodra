import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Book, Chapter } from "@shared/schema";
import {
  Download, ZoomIn, ZoomOut, BookOpen, ChevronRight,
  FileText, Settings2, AlignLeft, AlignJustify, AlignCenter, AlignRight,
  ChevronDown, ChevronUp, Columns2, Square,
  ChevronLeft, X, FileDown, Printer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/contexts/language-context";
import { MPdf } from "@/components/icons";
import { useBookSettings, BookTypographySettings, LAYOUT_PRESETS, LayoutPreset } from "@/hooks/use-book-settings";
import { useFrontMatter, FrontMatterSettings, TITLE_PAGE_PRESETS, TitlePagePreset } from "@/hooks/use-front-matter";
import { generatePagedJsHtml, generatePrintHtml } from "@/lib/paged-book";

// ─── Page sizes ─────────────────────────────────────────────────────
const PAGE_SIZES = {
  A4: { width: 210, height: 297, label: "A4 (210×297 мм)" },
  A5: { width: 148, height: 210, label: "A5 (148×210 мм)" },
  B5: { width: 176, height: 250, label: "B5 (176×250 мм)" },
} as const;

type PageSizeKey = keyof typeof PAGE_SIZES;

// ─── Fixed layout constants (not user-configurable) ──────────────────
// Footer is always 8 mm from the page bottom edge; 3 mm gap between content and footer separator.
const FOOTER_FROM_BOTTOM_MM = 8;
const FOOTER_GAP_MM = 3;

const FONT_OPTIONS = [
  { value: "Georgia, 'Times New Roman', serif", label: "Georgia" },
  { value: "'Palatino Linotype', Palatino, serif", label: "Palatino" },
  { value: "'Times New Roman', Times, serif", label: "Times New Roman" },
  { value: "'Book Antiqua', Palatino, serif", label: "Book Antiqua" },
  { value: "Arial, Helvetica, sans-serif", label: "Arial" },
  { value: "Inter, 'Helvetica Neue', Arial, sans-serif", label: "Inter" },
  { value: "'Source Sans Pro', Arial, sans-serif", label: "Source Sans Pro" },
  { value: "'Courier New', Courier, monospace", label: "Courier New" },
];

type LayoutSettings = BookTypographySettings;

type ViewMode = "single" | "spread";

// Pagination is now handled by Paged.js — see paged-book.ts
interface Block { type: string; content: string; }



// ─── Anchor download helper (avoids popup-blocker issues) ────────────
function anchorDownload(href: string, filename: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ─── Export Modal ────────────────────────────────────────────────────
function ExportModal({
  bookId,
  book,
  chapters,
  settings,
  frontMatter,
  onClose,
  lp,
}: {
  bookId: number;
  book: Book;
  chapters: Chapter[];
  settings: LayoutSettings;
  frontMatter: FrontMatterSettings;
  onClose: () => void;
  lp: Record<string, string>;
}) {
  const [exportFormat, setExportFormat] = useState<"pdf" | "docx" | "epub">("pdf");
  const [epubAuthor, setEpubAuthor] = useState("");
  const [exporting, setExporting] = useState(false);

  const safeTitle = book.title.replace(/[^\w\s-]/g, "").trim() || "book";

  const doExport = async () => {
    setExporting(true);
    try {
      if (exportFormat === "pdf") {
        // PDF: open in new tab — Paged.js auto-triggers the print dialog
        const pagedJsUrl = `${window.location.origin}/paged.polyfill.js`;
        const html = generatePrintHtml({ book, chapters, settings, frontMatter, lp, pagedJsUrl });
        const blob = new Blob([html], { type: "text/html; charset=utf-8" });
        const blobUrl = URL.createObjectURL(blob);
        const w = window.open(blobUrl, "_blank");
        if (w) {
          w.addEventListener("load", () => setTimeout(() => URL.revokeObjectURL(blobUrl), 5000));
        } else {
          setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
        }
      } else if (exportFormat === "docx") {
        // DOCX: anchor download (reliable, no popup-blocker risk)
        anchorDownload(`/api/books/${bookId}/export/docx`, `${safeTitle}.docx`);
      } else if (exportFormat === "epub") {
        // EPUB: anchor download with metadata as query params
        const params = new URLSearchParams();
        params.set("title", book.title);
        if (epubAuthor) params.set("author", epubAuthor);
        if (book.language) params.set("language", book.language);
        anchorDownload(
          `/api/books/${bookId}/export/epub?${params.toString()}`,
          `${safeTitle}.epub`,
        );
      }
      setTimeout(onClose, 600);
    } finally {
      setTimeout(() => setExporting(false), 1500);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-background rounded-2xl shadow-2xl w-[360px] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
          <div className="flex items-center gap-2">
            <FileDown className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">{lp.exportBook || "Export Book"}</span>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          {/* Format picker */}
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-medium">{lp.exportFormat || "Format"}</p>
            <div className="flex gap-2">
              {(["pdf", "docx", "epub"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setExportFormat(f)}
                  className={cn(
                    "flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all",
                    exportFormat === f
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary border-border/50 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Page info (PDF/DOCX) */}
          {exportFormat !== "epub" && (
            <div className="bg-secondary/60 rounded-xl p-3 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{lp.format || "Page size"}</span>
                <span className="font-medium">{PAGE_SIZES[settings.pageSize].label}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{lp.font || "Font"}</span>
                <span className="font-medium">{settings.fontFamily.split(",")[0].replace(/'/g, "")}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{lp.fontSize || "Font size"}</span>
                <span className="font-medium">{settings.fontSize}pt</span>
              </div>
            </div>
          )}

          {/* EPUB metadata */}
          {exportFormat === "epub" && (
            <div className="space-y-2">
              <div className="bg-secondary/60 rounded-xl p-3 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{lp.epubTitle || "Title"}</span>
                  <span className="font-medium truncate ml-2">{book.title}</span>
                </div>
                {book.language && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{lp.language || "Language"}</span>
                    <span className="font-medium">{book.language.toUpperCase()}</span>
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">{lp.epubAuthor || "Author (optional)"}</p>
                <input
                  className="w-full h-9 rounded-xl border border-border/60 bg-secondary text-sm px-3 outline-none focus:border-primary/50"
                  value={epubAuthor}
                  onChange={e => setEpubAuthor(e.target.value)}
                  placeholder={lp.epubAuthorPlaceholder || "Author name…"}
                />
              </div>
            </div>
          )}

          {/* PDF note */}
          {exportFormat === "pdf" && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/30 rounded-xl p-3">
              <Printer className="h-3.5 w-3.5 text-blue-500 shrink-0" />
              <span>{lp.pdfNote || "The print dialog will open automatically. Choose 'Save as PDF' to download."}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5">
          <button
            onClick={doExport}
            disabled={exporting}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: "#F96D1C" }}
          >
            <Download className="h-4 w-4" />
            {exporting
              ? (lp.exporting || "Preparing…")
              : exportFormat === "pdf"
                ? (lp.exportPdf || "Export PDF")
                : exportFormat === "epub"
                  ? (lp.exportEpub || "Download EPUB")
                  : (lp.exportDocx || "Export DOCX")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── UI helpers ──────────────────────────────────────────────────────
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1.5">
      <span className="text-[11px] text-muted-foreground shrink-0 leading-tight">{label}</span>
      <div className="flex items-center gap-1">{children}</div>
    </div>
  );
}

function NumInput({ value, onChange, min = 1, max = 100, step = 1, unit = "" }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; unit?: string;
}) {
  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        value={value}
        min={min} max={max} step={step}
        onChange={e => onChange(Number(e.target.value))}
        className="w-14 h-7 text-center rounded-lg border border-border/60 bg-secondary text-xs font-medium outline-none focus:border-primary/50"
      />
      {unit && <span className="text-[10px] text-muted-foreground">{unit}</span>}
    </div>
  );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={cn("w-9 h-5 rounded-full transition-colors relative shrink-0", on ? "bg-primary" : "bg-secondary border border-border")}
    >
      <div className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform", on ? "translate-x-4" : "translate-x-0.5")} />
    </button>
  );
}

function SecHead({ label, open, toggle }: { label: string; open: boolean; toggle: () => void }) {
  return (
    <button
      onClick={toggle}
      className="w-full flex items-center justify-between py-2 px-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
    >
      {label}
      {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
    </button>
  );
}

// ─── Main component ──────────────────────────────────────────────────
export function LayoutMode({ bookId, book }: { bookId: number; book: Book }) {
  const { t } = useLang();
  const lp = t.layoutPanel as Record<string, string>;

  const { settings, update } = useBookSettings(bookId);
  const { frontMatter, updateTitlePage, updateCopyrightPage, updateDedicationPage, update: updateFm } = useFrontMatter(bookId);

  const updateBookMutation = useMutation({
    mutationFn: (data: { description?: string }) =>
      apiRequest("PATCH", `/api/books/${bookId}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/books", bookId] }),
  });

  const [zoom, setZoom] = useState(0.85);
  const [viewMode, setViewMode] = useState<ViewMode>("single");
  const [currentSpread, setCurrentSpread] = useState(0);
  const [totalSpreads, setTotalSpreads] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [chapterPages, setChapterPages] = useState<Record<number, number>>({});
  const [activeChapter, setActiveChapter] = useState(0);
  const [open, setOpen] = useState({ presets: true, page: true, typography: true, headings: false, hf: false, frontmatter: false });
  const [showExport, setShowExport] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const { data: chapters = [] } = useQuery<Chapter[]>({
    queryKey: ["/api/books", bookId, "chapters"],
    queryFn: () => apiRequest("GET", `/api/books/${bookId}/chapters`),
    enabled: !!bookId,
  });

  const updateBlockMutation = useMutation({
    mutationFn: ({ chapterId, blocks }: { chapterId: number; blocks: Block[] }) =>
      apiRequest("PATCH", `/api/books/${bookId}/chapters/${chapterId}`, { content: JSON.stringify(blocks) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "chapters"] }),
  });

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (!e.data) return;

      if (e.data.type === "block-edit") {
        const { chapterIdx, blockIdx, content } = e.data;
        const chapter = chapters[chapterIdx];
        if (!chapter) return;
        let blocks: Block[] = [];
        try { blocks = typeof chapter.content === "string" ? JSON.parse(chapter.content) : (chapter.content || []); } catch {}
        if (!blocks[blockIdx]) return;
        const updated = blocks.map((b, i) => i === blockIdx ? { ...b, content } : b);
        updateBlockMutation.mutate({ chapterId: chapter.id, blocks: updated });
      }

      if (e.data.type === "insert-pagebreak") {
        const { chapterIdx, blockIdx } = e.data;
        const chapter = chapters[chapterIdx];
        if (!chapter) return;
        let blocks: Block[] = [];
        try { blocks = typeof chapter.content === "string" ? JSON.parse(chapter.content) : (chapter.content || []); } catch {}
        const updated = [
          ...blocks.slice(0, blockIdx),
          { type: "pagebreak", content: "" },
          ...blocks.slice(blockIdx),
        ];
        updateBlockMutation.mutate({ chapterId: chapter.id, blocks: updated });
      }

      // Paged.js reports total page count + chapter→page map after rendering
      if (e.data.type === "paged-ready") {
        const total: number = e.data.total ?? 0;
        setTotalPages(total);
        setTotalSpreads(viewMode === "spread" ? 1 + Math.ceil(Math.max(0, total - 1) / 2) : total);
        setChapterPages(e.data.chapterPages ?? {});
        // Re-apply the current view mode in case the iframe re-rendered
        (e.source as WindowProxy)?.postMessage({ type: "set-view-mode", mode: viewMode }, "*");
      }

    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [chapters, bookId, viewMode]);

  const calcTotalSpreads = useCallback((tp: number) => {
    if (viewMode === "spread") return 1 + Math.ceil(Math.max(0, tp - 1) / 2);
    return tp;
  }, [viewMode]);

  // Regenerate Paged.js HTML whenever settings, chapters, or zoom changes.
  // Paged.js runs inside the iframe and will send back "paged-ready" with the page count.
  useEffect(() => {
    if (!book || chapters.length === 0) return;
    const pagedJsUrl = `${window.location.origin}/paged.polyfill.js`;
    const html = generatePagedJsHtml({ book, chapters, settings, frontMatter, lp, zoom, pagedJsUrl });
    const blob = new Blob([html], { type: "text/html; charset=utf-8" });
    const url = URL.createObjectURL(blob);
    setTotalPages(0); // reset while iframe re-renders
    setCurrentSpread(0);
    if (iframeRef.current) iframeRef.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [book, chapters, settings, zoom, lp, frontMatter]);

  // When viewMode changes, tell the iframe to switch display layout.
  // This is a pure visual change — Paged.js does NOT re-paginate.
  useEffect(() => {
    iframeRef.current?.contentWindow?.postMessage({ type: "set-view-mode", mode: viewMode }, "*");
  }, [viewMode]);

  const prevPage = () => {
    const next = Math.max(0, currentSpread - 1);
    setCurrentSpread(next);
    iframeRef.current?.contentWindow?.postMessage({ type: "goto-page", page: next + 1 }, "*");
  };
  const nextPage = () => {
    const next = Math.min(totalSpreads - 1, currentSpread + 1);
    setCurrentSpread(next);
    iframeRef.current?.contentWindow?.postMessage({ type: "goto-page", page: next + 1 }, "*");
  };

  const scrollToChapter = (idx: number) => {
    setActiveChapter(idx);
    // Navigate the iframe to the chapter anchor — Paged.js will scroll to it
    iframeRef.current?.contentWindow?.postMessage({ type: "goto-chapter", chapterIdx: idx }, "*");
    // Update currentSpread to match the chapter's known page (if available)
    const pageNum = chapterPages[idx];
    if (pageNum) setCurrentSpread(pageNum - 1);
  };

  const tog = (k: keyof typeof open) => setOpen(prev => ({ ...prev, [k]: !prev[k] }));

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); nextPage(); }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); prevPage(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [totalSpreads, currentSpread]);

  // Page label: use currentSpread as 1-based page counter.
  // Total is shown once Paged.js reports back via "paged-ready".
  const currentPageLabel = String(currentSpread + 1);

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      {showExport && (
        <ExportModal
          bookId={bookId}
          book={book}
          chapters={chapters}
          settings={settings}
          frontMatter={frontMatter}
          onClose={() => setShowExport(false)}
          lp={lp}
        />
      )}

      {/* ── Left: Structure ──────────────────────────────────────── */}
      <aside className="w-52 flex-shrink-0 border-r border-border/50 bg-background/60 flex flex-col overflow-hidden">
        <div className="px-3 py-3 border-b border-border/40">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {lp.structure}
          </p>
        </div>
        <div className="flex-1 overflow-y-auto py-2 space-y-0.5">

          {/* Title page */}
          <button
            onClick={() => { setCurrentSpread(0); setActiveChapter(-1); }}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-secondary/60 transition-colors rounded-lg mx-1 group",
              activeChapter === -2 && "bg-secondary/80"
            )}
            style={{ width: "calc(100% - 8px)" }}
          >
            <BookOpen className="h-3 w-3 text-muted-foreground/50 shrink-0" />
            <span className="text-[11px] text-muted-foreground truncate">{lp.titlePage}</span>
          </button>

          {/* TOC */}
          <button
            className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-secondary/60 transition-colors rounded-lg mx-1 group"
            style={{ width: "calc(100% - 8px)" }}
            onClick={() => { setCurrentSpread(viewMode === "spread" ? 1 : 1); }}
          >
            <FileText className="h-3 w-3 text-muted-foreground/50 shrink-0" />
            <span className="text-[11px] text-muted-foreground truncate">{lp.toc}</span>
          </button>

          <div className="mx-3 my-1.5 border-t border-border/30" />

          {/* Chapter list */}
          {chapters.map((ch, idx) => {
            let blocks: any[] = [];
            try { blocks = typeof ch.content === "string" ? JSON.parse(ch.content) : (ch.content || []); } catch {}
            const h2s = blocks.filter(b => b.type === "h2").slice(0, 3);

            return (
              <div key={ch.id}>
                <button
                  onClick={() => scrollToChapter(idx)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-secondary/60 transition-colors rounded-lg mx-1 group",
                    activeChapter === idx && "bg-secondary/80"
                  )}
                  style={{ width: "calc(100% - 8px)" }}
                >
                  <span className="text-[9px] font-bold text-muted-foreground/40 w-4 shrink-0 tabular-nums">{idx + 1}</span>
                  <span className={cn("text-[11px] truncate flex-1", activeChapter === idx ? "font-medium text-foreground" : "text-muted-foreground")}>
                    {ch.title}
                  </span>
                  <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-40 shrink-0" />
                </button>
                {h2s.map((b, bi) => (
                  <div key={bi} className="pl-8 pr-3">
                    <span className="block text-[10px] text-muted-foreground/45 truncate py-0.5 leading-tight">
                      {(b.content || "").replace(/<[^>]+>/g, "").slice(0, 36)}
                    </span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </aside>

      {/* ── Center: Preview ──────────────────────────────────────── */}
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden bg-[#e8e4de]">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 bg-background/90 border-b border-border/40 shrink-0 backdrop-blur-sm gap-3">

          {/* Left: view mode + page nav */}
          <div className="flex items-center gap-1.5">
            {/* Single / Spread toggle */}
            <div className="flex items-center gap-0.5 bg-secondary rounded-lg p-0.5">
              <button
                onClick={() => setViewMode("single")}
                className={cn("flex items-center gap-1 px-2 h-6 rounded-md text-[11px] font-medium transition-all",
                  viewMode === "single" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
              >
                <Square className="h-3 w-3" />
                {lp.singlePage || "Single"}
              </button>
              <button
                onClick={() => setViewMode("spread")}
                className={cn("flex items-center gap-1 px-2 h-6 rounded-md text-[11px] font-medium transition-all",
                  viewMode === "spread" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
              >
                <Columns2 className="h-3 w-3" />
                {lp.bookSpread || "Spread"}
              </button>
            </div>

            <div className="w-px h-4 bg-border/50" />

            {/* Page navigation */}
            <button
              onClick={prevPage}
              disabled={currentSpread === 0}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors disabled:opacity-30"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="text-xs font-mono text-muted-foreground min-w-[72px] text-center">
              {lp.page || "p."} {currentPageLabel} / {totalPages}
            </span>
            <button
              onClick={nextPage}
              disabled={currentSpread >= totalSpreads - 1}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors disabled:opacity-30"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Right: zoom + export */}
          <div className="flex items-center gap-1.5">
            <button onClick={() => setZoom(z => Math.max(z - 0.1, 0.4))}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors">
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="text-xs font-mono w-11 text-center text-muted-foreground">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(z + 0.1, 1.5))}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors">
              <ZoomIn className="h-3.5 w-3.5" />
            </button>

            <div className="w-px h-4 bg-border/50 mx-1" />

            <button
              onClick={() => setShowExport(true)}
              className="flex items-center gap-1.5 px-3 h-7 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90"
              style={{ background: "#F96D1C" }}
            >
              <Download className="h-3 w-3" />
              {lp.exportPdf}
            </button>
          </div>
        </div>

        {/* iframe */}
        <div className="flex-1 overflow-auto">
          {chapters.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              {lp.noChapters}
            </div>
          ) : (
            <iframe
              ref={iframeRef}
              className="w-full h-full border-none"
              sandbox="allow-same-origin allow-scripts"
              title={lp.previewLabel}
            />
          )}
        </div>
      </main>

      {/* ── Right: Settings ─────────────────────────────────────── */}
      <aside className="w-64 flex-shrink-0 border-l border-border/50 bg-background/60 flex flex-col overflow-hidden">
        <div className="px-3 py-3 border-b border-border/40 flex items-center gap-2">
          <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{lp.layoutSettings}</p>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4">

          {/* Page */}
          <SecHead label={lp.pageSettings} open={open.page} toggle={() => tog("page")} />
          {open.page && (
            <div className="space-y-0.5 pb-3 border-b border-border/30">
              <Row label={lp.format}>
                <select
                  value={settings.pageSize}
                  onChange={e => update({ pageSize: e.target.value as PageSizeKey })}
                  className="h-7 rounded-lg border border-border/60 bg-secondary text-xs px-2 outline-none"
                >
                  {Object.entries(PAGE_SIZES).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </Row>
              <div className="grid grid-cols-2 gap-x-2">
                <Row label={lp.marginTop}><NumInput value={settings.marginTop} onChange={v => update({ marginTop: v })} min={5} max={50} unit="мм" /></Row>
                <Row label={lp.marginBottom}><NumInput value={settings.marginBottom} onChange={v => update({ marginBottom: v })} min={5} max={50} unit="мм" /></Row>
                <Row label={lp.marginLeft}><NumInput value={settings.marginLeft} onChange={v => update({ marginLeft: v })} min={5} max={50} unit="мм" /></Row>
                <Row label={lp.marginRight}><NumInput value={settings.marginRight} onChange={v => update({ marginRight: v })} min={5} max={50} unit="мм" /></Row>
              </div>
            </div>
          )}

          {/* Typography */}
          <SecHead label={lp.typography} open={open.typography} toggle={() => tog("typography")} />
          {open.typography && (
            <div className="space-y-0.5 pb-3 border-b border-border/30">
              <Row label={lp.font}>
                <select
                  value={settings.fontFamily}
                  onChange={e => update({ fontFamily: e.target.value })}
                  className="h-7 rounded-lg border border-border/60 bg-secondary text-xs px-2 outline-none max-w-[138px]"
                >
                  {FONT_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </Row>
              <Row label={lp.fontSize}>
                <NumInput value={settings.fontSize} onChange={v => update({ fontSize: v })} min={8} max={18} step={0.5} unit="pt" />
              </Row>
              <Row label={lp.lineHeight}>
                <NumInput value={settings.lineHeight} onChange={v => update({ lineHeight: v })} min={1} max={3} step={0.05} />
              </Row>
              <Row label={lp.paragraphIndent}>
                <NumInput value={settings.paragraphSpacing} onChange={v => update({ paragraphSpacing: v })} min={0} max={3} step={0.1} unit="em" />
              </Row>
              <Row label={lp.firstLineIndent || "First indent"}>
                <NumInput value={settings.firstLineIndent ?? 1.2} onChange={v => update({ firstLineIndent: v })} min={0} max={5} step={0.1} unit="em" />
              </Row>
              <Row label={lp.letterSpacing || "Letter spacing"}>
                <NumInput value={settings.letterSpacing ?? 0} onChange={v => update({ letterSpacing: v })} min={-0.1} max={0.5} step={0.01} unit="em" />
              </Row>
              <Row label={lp.alignment}>
                <div className="flex gap-1">
                  <button onClick={() => update({ textAlign: "justify" })}
                    className={cn("w-7 h-7 rounded-lg flex items-center justify-center transition-colors", settings.textAlign === "justify" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}>
                    <AlignJustify className="h-3 w-3" />
                  </button>
                  <button onClick={() => update({ textAlign: "left" })}
                    className={cn("w-7 h-7 rounded-lg flex items-center justify-center transition-colors", settings.textAlign === "left" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}>
                    <AlignLeft className="h-3 w-3" />
                  </button>
                </div>
              </Row>
              <Row label={lp.chapterBreak}>
                <Toggle on={settings.chapterBreak} onToggle={() => update({ chapterBreak: !settings.chapterBreak })} />
              </Row>
            </div>
          )}

          {/* Headings */}
          <SecHead label={lp.headingsSection} open={open.headings} toggle={() => tog("headings")} />
          {open.headings && (
            <div className="space-y-0.5 pb-3 border-b border-border/30">
              <Row label={lp.chapter_h1}><NumInput value={settings.h1Size} onChange={v => update({ h1Size: v })} min={10} max={36} unit="pt" /></Row>
              <Row label={lp.section_h2}><NumInput value={settings.h2Size} onChange={v => update({ h2Size: v })} min={10} max={30} unit="pt" /></Row>
              <Row label={lp.subsection_h3}><NumInput value={settings.h3Size} onChange={v => update({ h3Size: v })} min={8} max={24} unit="pt" /></Row>
            </div>
          )}

          {/* Header & Footer */}
          <SecHead label={lp.headerFooter} open={open.hf} toggle={() => tog("hf")} />
          {open.hf && (
            <div className="space-y-2 pb-3 border-b border-border/30">
              <Row label={lp.pageNumber}>
                <Toggle on={settings.footerPageNumber} onToggle={() => update({ footerPageNumber: !settings.footerPageNumber })} />
              </Row>
              <Row label={lp.bookTitleInFooter}>
                <Toggle on={settings.footerBookTitle} onToggle={() => update({ footerBookTitle: !settings.footerBookTitle })} />
              </Row>
              {(settings.footerPageNumber || settings.footerBookTitle) && (
                <>
                  <Row label={lp.pageNumberAlign || "Position"}>
                    <div className="flex gap-1">
                      {(["left", "center", "right", "mirror"] as const).map((align) => {
                        const Icon = align === "left" ? AlignLeft : align === "center" ? AlignCenter : align === "right" ? AlignRight : null;
                        return (
                          <button
                            key={align}
                            onClick={() => update({ footerAlignment: align })}
                            className={cn(
                              "h-7 rounded-lg flex items-center justify-center transition-colors",
                              align === "mirror" ? "px-1.5 text-[9px] font-bold" : "w-7",
                              settings.footerAlignment === align
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary text-muted-foreground"
                            )}
                          >
                            {Icon ? <Icon className="h-3 w-3" /> : <Columns2 className="h-3 w-3" />}
                          </button>
                        );
                      })}
                    </div>
                  </Row>
                </>
              )}
            </div>
          )}

          {/* Front Matter Builder */}
          <SecHead label={lp.frontMatterSection || "Front Matter"} open={open.frontmatter} toggle={() => tog("frontmatter")} />
          {open.frontmatter && (
            <div className="pb-3 border-b border-border/30 space-y-2">

              {/* Table of Contents toggle */}
              <Row label={lp.tocLabel || "Table of Contents"}>
                <Toggle on={frontMatter.tocEnabled} onToggle={() => updateFm({ tocEnabled: !frontMatter.tocEnabled })} />
              </Row>

              {/* Title Page */}
              <div className="pt-1 border-t border-border/20">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-foreground">{lp.fmTitlePage || "Title Page"}</span>
                  <Toggle on={frontMatter.titlePage.enabled} onToggle={() => updateTitlePage({ enabled: !frontMatter.titlePage.enabled })} />
                </div>
                {frontMatter.titlePage.enabled && (
                  <div className="space-y-1 pl-1">
                    <Row label={lp.fmUseBookTitle || "Use book title"}>
                      <Toggle on={frontMatter.titlePage.useBookTitle} onToggle={() => updateTitlePage({ useBookTitle: !frontMatter.titlePage.useBookTitle })} />
                    </Row>
                    {!frontMatter.titlePage.useBookTitle && (
                      <div>
                        <p className="text-[10px] text-muted-foreground mb-0.5">{lp.fmCustomTitle || "Title"}</p>
                        <input value={frontMatter.titlePage.customTitle} onChange={e => updateTitlePage({ customTitle: e.target.value })}
                          className="w-full h-7 rounded-lg border border-border/60 bg-secondary text-xs px-2 outline-none" />
                      </div>
                    )}
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-0.5">{lp.fmSubtitle || "Subtitle"}</p>
                      <input value={frontMatter.titlePage.subtitle} onChange={e => updateTitlePage({ subtitle: e.target.value })}
                        placeholder={lp.fmSubtitlePlaceholder || "Optional subtitle"}
                        className="w-full h-7 rounded-lg border border-border/60 bg-secondary text-xs px-2 outline-none" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-0.5">{lp.fmAuthor || "Author"}</p>
                      <input value={frontMatter.titlePage.author} onChange={e => updateTitlePage({ author: e.target.value })}
                        className="w-full h-7 rounded-lg border border-border/60 bg-secondary text-xs px-2 outline-none" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-0.5">{lp.fmPublisher || "Publisher"}</p>
                      <input value={frontMatter.titlePage.publisherName} onChange={e => updateTitlePage({ publisherName: e.target.value })}
                        className="w-full h-7 rounded-lg border border-border/60 bg-secondary text-xs px-2 outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      <div>
                        <p className="text-[10px] text-muted-foreground mb-0.5">{lp.fmCity || "City"}</p>
                        <input value={frontMatter.titlePage.city} onChange={e => updateTitlePage({ city: e.target.value })}
                          className="w-full h-7 rounded-lg border border-border/60 bg-secondary text-xs px-2 outline-none" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground mb-0.5">{lp.fmYear || "Year"}</p>
                        <input value={frontMatter.titlePage.year} onChange={e => updateTitlePage({ year: e.target.value })}
                          className="w-full h-7 rounded-lg border border-border/60 bg-secondary text-xs px-2 outline-none" />
                      </div>
                    </div>
                    <Row label={lp.alignment || "Alignment"}>
                      <div className="flex gap-1">
                        {(["left","center","right"] as const).map(a => {
                          const Icon = a === "left" ? AlignLeft : a === "center" ? AlignCenter : AlignRight;
                          return <button key={a} onClick={() => updateTitlePage({ alignment: a })}
                            className={cn("w-7 h-7 rounded-lg flex items-center justify-center transition-colors",
                              frontMatter.titlePage.alignment === a ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}>
                            <Icon className="h-3 w-3" />
                          </button>;
                        })}
                      </div>
                    </Row>
                    <Row label={lp.fmDecoration || "Decoration"}>
                      <select value={frontMatter.titlePage.decorativeStyle} onChange={e => updateTitlePage({ decorativeStyle: e.target.value as any })}
                        className="h-7 rounded-lg border border-border/60 bg-secondary text-xs px-2 outline-none">
                        <option value="none">{lp.fmDecoNone || "None"}</option>
                        <option value="lines">{lp.fmDecoLines || "Lines"}</option>
                        <option value="ornament">{lp.fmDecoOrnament || "Ornament ✦"}</option>
                      </select>
                    </Row>

                    {/* Typography Presets */}
                    <div className="pt-1">
                      <p className="text-[10px] text-muted-foreground mb-1">{lp.fmTitlePresets || "Typography preset"}</p>
                      <div className="grid grid-cols-2 gap-1">
                        {(["classic","minimal","modern","bold"] as TitlePagePreset[]).map(preset => (
                          <button key={preset} onClick={() => updateTitlePage({ titlePreset: preset, ...TITLE_PAGE_PRESETS[preset] })}
                            className={cn("h-7 rounded-lg text-[10px] font-medium transition-colors capitalize",
                              frontMatter.titlePage.titlePreset === preset
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary text-muted-foreground hover:text-foreground")}>
                            {lp[`fmPreset_${preset}`] || preset}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Typography fine-tuning */}
                    <div className="pt-1 space-y-1">
                      <p className="text-[10px] text-muted-foreground">{lp.fmTypography || "Typography"}</p>
                      <div className="grid grid-cols-2 gap-1">
                        <div>
                          <p className="text-[10px] text-muted-foreground mb-0.5">{lp.fmTitleFs || "Title pt"}</p>
                          <input type="number" min={14} max={60} value={frontMatter.titlePage.titleFontSize}
                            onChange={e => updateTitlePage({ titleFontSize: Number(e.target.value) })}
                            className="w-full h-7 rounded-lg border border-border/60 bg-secondary text-xs px-2 outline-none" />
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground mb-0.5">{lp.fmSubtitleFs || "Subtitle pt"}</p>
                          <input type="number" min={8} max={30} value={frontMatter.titlePage.subtitleFontSize}
                            onChange={e => updateTitlePage({ subtitleFontSize: Number(e.target.value) })}
                            className="w-full h-7 rounded-lg border border-border/60 bg-secondary text-xs px-2 outline-none" />
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground mb-0.5">{lp.fmAuthorFs || "Author pt"}</p>
                          <input type="number" min={8} max={24} value={frontMatter.titlePage.authorFontSize}
                            onChange={e => updateTitlePage({ authorFontSize: Number(e.target.value) })}
                            className="w-full h-7 rounded-lg border border-border/60 bg-secondary text-xs px-2 outline-none" />
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground mb-0.5">{lp.fmSpacing || "Spacing"}</p>
                          <input type="number" step={0.1} min={0.3} max={3} value={frontMatter.titlePage.elementSpacing}
                            onChange={e => updateTitlePage({ elementSpacing: Number(e.target.value) })}
                            className="w-full h-7 rounded-lg border border-border/60 bg-secondary text-xs px-2 outline-none" />
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground mb-0.5">{lp.fmLineHeight || "Line-h"}</p>
                          <input type="number" step={0.05} min={0.9} max={2} value={frontMatter.titlePage.titleLineHeight}
                            onChange={e => updateTitlePage({ titleLineHeight: Number(e.target.value) })}
                            className="w-full h-7 rounded-lg border border-border/60 bg-secondary text-xs px-2 outline-none" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Copyright Page */}
              <div className="pt-1 border-t border-border/20">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-foreground">{lp.fmCopyrightPage || "Copyright Page"}</span>
                  <Toggle on={frontMatter.copyrightPage.enabled} onToggle={() => updateCopyrightPage({ enabled: !frontMatter.copyrightPage.enabled })} />
                </div>
                {frontMatter.copyrightPage.enabled && (
                  <div className="space-y-1 pl-1">

                    {/* Rights notice */}
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-0.5">{lp.fmCopyRights || "Rights notice"}</p>
                      <textarea value={frontMatter.copyrightPage.rights} onChange={e => updateCopyrightPage({ rights: e.target.value })}
                        rows={2}
                        className="w-full rounded-lg border border-border/60 bg-secondary text-xs px-2 py-1.5 outline-none resize-none" />
                    </div>

                    {/* Credits block */}
                    <div className="pt-1 border-t border-border/10">
                      <div className="grid grid-cols-2 gap-1">
                        <div>
                          <p className="text-[10px] text-muted-foreground mb-0.5">{lp.fmCopyEditor || "Editor"}</p>
                          <input value={frontMatter.copyrightPage.editor} onChange={e => updateCopyrightPage({ editor: e.target.value })}
                            className="w-full h-7 rounded-lg border border-border/60 bg-secondary text-xs px-2 outline-none" />
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground mb-0.5">{lp.fmCoverDesigner || "Cover"}</p>
                          <input value={frontMatter.copyrightPage.coverDesigner} onChange={e => updateCopyrightPage({ coverDesigner: e.target.value })}
                            className="w-full h-7 rounded-lg border border-border/60 bg-secondary text-xs px-2 outline-none" />
                        </div>
                      </div>
                    </div>

                    {/* ISBN + Copyright year + holder */}
                    <div className="pt-1 border-t border-border/10">
                      <div className="mb-1">
                        <p className="text-[10px] text-muted-foreground mb-0.5">ISBN</p>
                        <input value={frontMatter.copyrightPage.isbn} onChange={e => updateCopyrightPage({ isbn: e.target.value })}
                          placeholder="xxx-x-xxxxxx-xx-x"
                          className="w-full h-7 rounded-lg border border-border/60 bg-secondary text-xs px-2 outline-none" />
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        <div>
                          <p className="text-[10px] text-muted-foreground mb-0.5">{lp.fmCopyYear || "© Year"}</p>
                          <input value={frontMatter.copyrightPage.copyrightYear} onChange={e => updateCopyrightPage({ copyrightYear: e.target.value })}
                            className="w-full h-7 rounded-lg border border-border/60 bg-secondary text-xs px-2 outline-none" />
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground mb-0.5">{lp.fmCopyHolder || "© Holder"}</p>
                          <input value={frontMatter.copyrightPage.copyrightHolder}
                            disabled={frontMatter.copyrightPage.useBookAuthor}
                            onChange={e => updateCopyrightPage({ copyrightHolder: e.target.value })}
                            placeholder=""
                            className="w-full h-7 rounded-lg border border-border/60 bg-secondary text-xs px-2 outline-none disabled:opacity-50" />
                        </div>
                      </div>
                      <Row label={lp.fmUseBookAuthor || "Use book author"}>
                        <Toggle on={frontMatter.copyrightPage.useBookAuthor} onToggle={() => updateCopyrightPage({ useBookAuthor: !frontMatter.copyrightPage.useBookAuthor })} />
                      </Row>
                    </div>

                    <Row label={lp.alignment || "Alignment"}>
                      <div className="flex gap-1">
                        {(["left","center","right"] as const).map(a => {
                          const Icon = a === "left" ? AlignLeft : a === "center" ? AlignCenter : AlignRight;
                          return <button key={a} onClick={() => updateCopyrightPage({ alignment: a })}
                            className={cn("w-7 h-7 rounded-lg flex items-center justify-center transition-colors",
                              frontMatter.copyrightPage.alignment === a ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}>
                            <Icon className="h-3 w-3" />
                          </button>;
                        })}
                      </div>
                    </Row>
                    <Row label={lp.fontSize || "Font size"}><NumInput value={frontMatter.copyrightPage.fontSize ?? 9} onChange={v => updateCopyrightPage({ fontSize: v })} min={7} max={14} step={0.5} unit="pt" /></Row>
                    <Row label={lp.lineHeight || "Line height"}><NumInput value={frontMatter.copyrightPage.lineHeight ?? 1.5} onChange={v => updateCopyrightPage({ lineHeight: v })} min={1} max={3} step={0.1} /></Row>
                  </div>
                )}
              </div>

              {/* Dedication Page */}
              <div className="pt-1 border-t border-border/20">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-foreground">{lp.fmDedicationPage || "Dedication Page"}</span>
                  <Toggle on={frontMatter.dedicationPage.enabled} onToggle={() => updateDedicationPage({ enabled: !frontMatter.dedicationPage.enabled })} />
                </div>
                {frontMatter.dedicationPage.enabled && (
                  <div className="space-y-1 pl-1">
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-0.5">{lp.fmDedicationText || "Dedication text"}</p>
                      <textarea value={frontMatter.dedicationPage.text} onChange={e => updateDedicationPage({ text: e.target.value })}
                        rows={3}
                        placeholder={lp.fmDedicationPlaceholder || "For my parents…"}
                        className="w-full rounded-lg border border-border/60 bg-secondary text-xs px-2 py-1.5 outline-none resize-none" />
                    </div>
                    <Row label={lp.alignment || "Alignment"}>
                      <div className="flex gap-1">
                        {(["left","center","right"] as const).map(a => {
                          const Icon = a === "left" ? AlignLeft : a === "center" ? AlignCenter : AlignRight;
                          return <button key={a} onClick={() => updateDedicationPage({ alignment: a })}
                            className={cn("w-7 h-7 rounded-lg flex items-center justify-center transition-colors",
                              frontMatter.dedicationPage.alignment === a ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}>
                            <Icon className="h-3 w-3" />
                          </button>;
                        })}
                      </div>
                    </Row>
                    <Row label={lp.fmVertPos || "Vertical position"}>
                      <select value={frontMatter.dedicationPage.verticalPosition} onChange={e => updateDedicationPage({ verticalPosition: e.target.value as any })}
                        className="h-7 rounded-lg border border-border/60 bg-secondary text-xs px-2 outline-none">
                        <option value="top">{lp.fmVPosTop || "Top"}</option>
                        <option value="center">{lp.fmVPosCenter || "Center"}</option>
                        <option value="bottom">{lp.fmVPosBottom || "Bottom"}</option>
                      </select>
                    </Row>
                    <div className="grid grid-cols-2 gap-1 pt-1">
                      <div>
                        <p className="text-[10px] text-muted-foreground mb-0.5">{lp.fmDedFontSize || "Размер шрифта (pt)"}</p>
                        <input type="number" min={8} max={28} value={frontMatter.dedicationPage.fontSize ?? 12}
                          onChange={e => updateDedicationPage({ fontSize: Number(e.target.value) })}
                          className="w-full h-7 rounded-lg border border-border/60 bg-secondary text-xs px-2 outline-none" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground mb-0.5">{lp.fmDedLineHeight || "Межстрочный"}</p>
                        <input type="number" step={0.1} min={1} max={3} value={frontMatter.dedicationPage.lineHeight ?? 1.8}
                          onChange={e => updateDedicationPage({ lineHeight: Number(e.target.value) })}
                          className="w-full h-7 rounded-lg border border-border/60 bg-secondary text-xs px-2 outline-none" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* Export */}
          <div className="pt-4 space-y-2">
            <button
              onClick={() => setShowExport(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: "#F96D1C" }}
            >
              <MPdf size={14} />
              {lp.exportPdf}
            </button>
            <button
              onClick={() => window.open(`/api/books/${bookId}/export/docx`, "_blank")}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border border-border/60 bg-secondary hover:bg-secondary/80 transition-all"
            >
              <FileDown className="h-4 w-4" />
              {lp.exportDocx || "Export DOCX"}
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
