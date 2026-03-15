import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Source, Note, Draft, Book } from "@shared/schema";
import {
  Globe, FileText, File, BookOpen, Quote, Edit3, Microscope,
  BookMarked, Plus, Trash2, Save, X, ChevronLeft, ChevronDown, ChevronUp,
  Link2, Check, Loader2, Tag, Search, ExternalLink, Sparkles, Zap,
  StickyNote, ArrowDownToLine, Brain, Layers, Hash, Flame, Minus,
  ArrowDown, Star, Archive, AlertTriangle, RefreshCw, Copy, FileUp,
  Network, MapPin, Newspaper, Database
} from "lucide-react";

// ─── Source types ────────────────────────────────────────────────────────────

export const SOURCE_TYPES: { value: string; label: string; icon: any; color: string; bg: string }[] = [
  { value: "article",          label: "Article",          icon: Newspaper,   color: "#6366F1", bg: "#EEF2FF" },
  { value: "website",          label: "Website",          icon: Globe,       color: "#3B82F6", bg: "#EFF6FF" },
  { value: "pdf",              label: "PDF",              icon: FileText,    color: "#EF4444", bg: "#FEF2F2" },
  { value: "document",         label: "Document",         icon: File,        color: "#8B5CF6", bg: "#F5F3FF" },
  { value: "book_excerpt",     label: "Book Excerpt",     icon: BookOpen,    color: "#0D9488", bg: "#F0FDFA" },
  { value: "book",             label: "Book",             icon: BookMarked,  color: "#0EA5E9", bg: "#F0F9FF" },
  { value: "quote",            label: "Quote",            icon: Quote,       color: "#F59E0B", bg: "#FFFBEB" },
  { value: "research_snippet", label: "Research Snippet", icon: Microscope,  color: "#10B981", bg: "#F0FDF4" },
  { value: "custom",           label: "Custom",           icon: Edit3,       color: "#EC4899", bg: "#FDF2F8" },
];

const IMPORTANCE = [
  { value: "low",    label: "Low",    icon: ArrowDown, color: "#9CA3AF" },
  { value: "normal", label: "Normal", icon: Minus,     color: "#6B7280" },
  { value: "high",   label: "High",   icon: Flame,     color: "#EF4444" },
];

function getSourceType(t: string) {
  return SOURCE_TYPES.find(s => s.value === t) || SOURCE_TYPES[0];
}

interface AiAnalysis {
  keyIdeas?: string[];
  themes?: string[];
  argumentMap?: string;
  writingStyle?: string;
  conceptualSummary?: string;
  projectRelevance?: string;
  analyzedAt?: string;
}

function parseAnalysis(raw: string): AiAnalysis | null {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function SourcesTab({ bookId, book }: { bookId: number; book: Book }) {
  const { toast } = useToast();

  // ── Views ────────────────────────────────────────────────────────────────────
  const [view, setView] = useState<"list" | "editor">("list");

  // ── Filters ──────────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  // ── Editor state ─────────────────────────────────────────────────────────────
  const [editSrc, setEditSrc] = useState<Source | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editType, setEditType] = useState("article");
  const [editAuthor, setEditAuthor] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editRawContent, setEditRawContent] = useState("");
  const [editSummary, setEditSummary] = useState("");
  const [editKeyConcepts, setEditKeyConcepts] = useState("");
  const [editKeyQuotes, setEditKeyQuotes] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editImportance, setEditImportance] = useState("normal");
  const [editLinkedNoteIds, setEditLinkedNoteIds] = useState<number[]>([]);
  const [editLinkedDraftIds, setEditLinkedDraftIds] = useState<number[]>([]);

  // ── Panels ───────────────────────────────────────────────────────────────────
  const [showLinkNotes, setShowLinkNotes] = useState(false);
  const [showLinkDrafts, setShowLinkDrafts] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [aiAnalysisData, setAiAnalysisData] = useState<AiAnalysis | null>(null);

  // ── AI loading states ─────────────────────────────────────────────────────────
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExtractingQuotes, setIsExtractingQuotes] = useState(false);
  const [isExtractingConcepts, setIsExtractingConcepts] = useState(false);

  // ── File upload ───────────────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDirty = useRef(false);

  // ── Queries ──────────────────────────────────────────────────────────────────
  const { data: sources = [], isLoading } = useQuery<Source[]>({
    queryKey: ["/api/books", bookId, "sources"],
    queryFn: () => apiRequest("GET", `/api/books/${bookId}/sources`),
  });
  const { data: notes = [] } = useQuery<Note[]>({
    queryKey: ["/api/books", bookId, "notes"],
    queryFn: () => apiRequest("GET", `/api/books/${bookId}/notes`),
  });
  const { data: drafts = [] } = useQuery<Draft[]>({
    queryKey: ["/api/books", bookId, "drafts"],
    queryFn: () => apiRequest("GET", `/api/books/${bookId}/drafts`),
  });

  // ── Mutations ─────────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/api/books/${bookId}/sources`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "sources"] }),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/sources/${id}`, data),
    onSuccess: (updated: Source) => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "sources"] });
      setEditSrc(updated); isDirty.current = false;
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/sources/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "sources"] });
      setView("list");
    },
  });

  // ── Open editor ───────────────────────────────────────────────────────────────
  const openEditor = useCallback((src: Source | null) => {
    if (src) {
      setEditSrc(src);
      setEditTitle(src.title);
      setEditType(src.type || "article");
      setEditAuthor(src.author || "");
      setEditUrl(src.url || "");
      setEditRawContent((src as any).rawContent || "");
      setEditSummary(src.summary || "");
      setEditKeyConcepts(src.keyConcepts || "");
      setEditKeyQuotes(src.keyQuotes || "");
      setEditTags(src.tags || "");
      setEditImportance((src as any).importance || "normal");
      setEditLinkedNoteIds(((src as any).linkedNoteIds || "").split(",").map(Number).filter(Boolean));
      setEditLinkedDraftIds(((src as any).linkedDraftIds || "").split(",").map(Number).filter(Boolean));
      const analysis = parseAnalysis((src as any).aiAnalysis || "");
      setAiAnalysisData(analysis);
    } else {
      setEditSrc(null);
      setEditTitle(""); setEditType("article"); setEditAuthor(""); setEditUrl("");
      setEditRawContent(""); setEditSummary(""); setEditKeyConcepts(""); setEditKeyQuotes("");
      setEditTags(""); setEditImportance("normal");
      setEditLinkedNoteIds([]); setEditLinkedDraftIds([]);
      setAiAnalysisData(null);
    }
    setShowLinkNotes(false); setShowLinkDrafts(false);
    setShowAnalysis(false); isDirty.current = false;
    setView("editor");
  }, []);

  // ── Save ─────────────────────────────────────────────────────────────────────
  const handleSave = useCallback(() => {
    if (!editTitle.trim()) { toast({ title: "Title required", variant: "destructive" }); return; }
    const data: any = {
      title: editTitle.trim(), type: editType, author: editAuthor, url: editUrl,
      rawContent: editRawContent, summary: editSummary,
      keyConcepts: editKeyConcepts, keyQuotes: editKeyQuotes, tags: editTags,
      importance: editImportance,
      linkedNoteIds: editLinkedNoteIds.join(","),
      linkedDraftIds: editLinkedDraftIds.join(","),
      aiAnalysis: aiAnalysisData ? JSON.stringify(aiAnalysisData) : "",
    };
    if (editSrc) {
      updateMutation.mutate({ id: editSrc.id, data }, { onSuccess: () => toast({ title: "Source saved" }) });
    } else {
      createMutation.mutate(data, { onSuccess: () => { toast({ title: "Source added" }); setView("list"); } });
    }
  }, [editTitle, editType, editAuthor, editUrl, editRawContent, editSummary,
    editKeyConcepts, editKeyQuotes, editTags, editImportance,
    editLinkedNoteIds, editLinkedDraftIds, aiAnalysisData, editSrc]);

  // ── AI: Full Analysis ─────────────────────────────────────────────────────────
  const handleAnalyze = useCallback(async () => {
    const content = [editTitle, editAuthor, editRawContent, editSummary, editKeyQuotes].filter(Boolean).join("\n\n");
    if (!content.trim()) { toast({ title: "Add some content first", variant: "destructive" }); return; }
    setIsAnalyzing(true);
    try {
      const res = await apiRequest("POST", "/api/ai/improve", {
        text: content,
        mode: "improve",
        customInstruction: `Analyze this research source deeply and respond ONLY with a valid JSON object (no markdown, no extra text) matching this exact structure:
{
  "keyIdeas": ["<idea 1>", "<idea 2>", "<idea 3>"],
  "themes": ["<theme 1>", "<theme 2>"],
  "argumentMap": "<paragraph describing the main argument or reasoning structure>",
  "writingStyle": "<paragraph on style, tone, approach, academic level>",
  "conceptualSummary": "<2-3 sentence synthesis of what this source fundamentally says>",
  "projectRelevance": "<how this source could be useful for the book: ${book.title}>",
  "analyzedAt": "${new Date().toISOString().slice(0, 10)}"
}
Return only the JSON. No explanation before or after.`,
      });
      const raw = (res.improved || "").trim();
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as AiAnalysis;
        parsed.analyzedAt = new Date().toISOString().slice(0, 10);
        setAiAnalysisData(parsed);
        setShowAnalysis(true);
        // Auto-fill summary if empty
        if (!editSummary && parsed.conceptualSummary) setEditSummary(parsed.conceptualSummary);
        toast({ title: "Analysis complete" });
      }
    } catch (e: any) {
      toast({ title: "Analysis failed", description: e?.message, variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  }, [editTitle, editAuthor, editRawContent, editSummary, editKeyQuotes, book.title, editSummary]);

  // ── AI: Extract Quotes ────────────────────────────────────────────────────────
  const handleExtractQuotes = useCallback(async () => {
    const content = editRawContent || editKeyQuotes;
    if (!content.trim()) { toast({ title: "Add raw content first", variant: "destructive" }); return; }
    setIsExtractingQuotes(true);
    try {
      const res = await apiRequest("POST", "/api/ai/improve", {
        text: content,
        mode: "improve",
        customInstruction: "Extract the 3-5 most significant, quotable passages from this text. Format: one quote per line, starting with a dash. No extra explanation.",
      });
      const extracted = (res.improved || "").trim();
      setEditKeyQuotes(prev => prev ? `${prev}\n${extracted}` : extracted);
      isDirty.current = true;
      toast({ title: "Quotes extracted" });
    } catch (e: any) {
      toast({ title: "Extraction failed", variant: "destructive" });
    } finally {
      setIsExtractingQuotes(false);
    }
  }, [editRawContent, editKeyQuotes]);

  // ── AI: Extract Concepts ──────────────────────────────────────────────────────
  const handleExtractConcepts = useCallback(async () => {
    const content = editRawContent || editSummary || editTitle;
    if (!content.trim()) { toast({ title: "Add some content first", variant: "destructive" }); return; }
    setIsExtractingConcepts(true);
    try {
      const res = await apiRequest("POST", "/api/ai/improve", {
        text: content,
        mode: "improve",
        customInstruction: "Extract 5-8 key concepts from this text. Return them as a comma-separated list only. No explanations, no numbering, just: concept1, concept2, concept3.",
      });
      const extracted = (res.improved || "").trim();
      setEditKeyConcepts(prev => prev ? `${prev}, ${extracted}` : extracted);
      isDirty.current = true;
      toast({ title: "Concepts extracted" });
    } catch (e: any) {
      toast({ title: "Extraction failed", variant: "destructive" });
    } finally {
      setIsExtractingConcepts(false);
    }
  }, [editRawContent, editSummary, editTitle]);

  // ── → Note ───────────────────────────────────────────────────────────────────
  const sendToNote = useCallback(async () => {
    const noteContent = [
      editSummary && `**Summary:** ${editSummary}`,
      editKeyConcepts && `**Key concepts:** ${editKeyConcepts}`,
      editKeyQuotes && `**Key quotes:**\n${editKeyQuotes}`,
    ].filter(Boolean).join("\n\n");
    try {
      await apiRequest("POST", `/api/books/${bookId}/notes`, {
        title: editTitle || "Source Insight",
        content: noteContent,
        type: "research_note",
        status: "active",
        importance: editImportance,
        tags: editTags,
        isQuick: "false",
        linkedSourceIds: editSrc ? String(editSrc.id) : "",
        linkedNoteIds: "", linkedDraftIds: "", collectionIds: "", semanticTags: "",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "notes"] });
      toast({ title: "Sent to Notes as research note" });
    } catch { toast({ title: "Failed", variant: "destructive" }); }
  }, [editTitle, editSummary, editKeyConcepts, editKeyQuotes, editTags, editImportance, editSrc, bookId]);

  // ── → Board ──────────────────────────────────────────────────────────────────
  const sendToBoard = useCallback(async () => {
    try {
      const boardRes = await apiRequest("GET", `/api/books/${bookId}/board`);
      let boardState: { nodes: any[]; edges: any[] } = { nodes: [], edges: [] };
      if (boardRes?.data) { try { boardState = JSON.parse(boardRes.data); } catch {} }
      boardState.nodes.push({
        id: `source-${editSrc?.id || Date.now()}`,
        type: "source",
        content: editTitle,
        description: editSummary || editKeyConcepts || "",
        x: 140 + Math.random() * 200, y: 140 + Math.random() * 200,
        width: 200, height: 80,
      });
      await apiRequest("PATCH", `/api/books/${bookId}/board`, { data: JSON.stringify(boardState) });
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "board"] });
      toast({ title: "Added to Idea Board" });
    } catch { toast({ title: "Failed", variant: "destructive" }); }
  }, [editTitle, editSummary, editKeyConcepts, editSrc, bookId]);

  // ── File upload ───────────────────────────────────────────────────────────────
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast({ title: "File too large (max 2 MB)", variant: "destructive" }); return; }
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      const name = file.name.replace(/\.[^.]+$/, "");
      const ext = (file.name.split(".").pop() || "").toLowerCase();
      const typeMap: Record<string, string> = { pdf: "pdf", doc: "document", docx: "document", txt: "document" };
      openEditor(null);
      setEditTitle(name);
      setEditType(typeMap[ext] || "document");
      setEditRawContent(text.slice(0, 8000));
      isDirty.current = true;
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [openEditor]);

  // ── Filtered list ─────────────────────────────────────────────────────────────
  const filtered = sources.filter(s => {
    if ((s as any).status === "archived") return false;
    if (typeFilter !== "all" && s.type !== typeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return s.title.toLowerCase().includes(q) ||
        (s.author || "").toLowerCase().includes(q) ||
        (s.tags || "").toLowerCase().includes(q) ||
        (s.summary || "").toLowerCase().includes(q);
    }
    return true;
  });

  // ─── EDITOR VIEW ──────────────────────────────────────────────────────────────

  if (view === "editor") {
    const st = getSourceType(editType);
    const StIcon = st.icon;
    const analysis = aiAnalysisData;

    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 flex-shrink-0">
          <button onClick={() => setView("list")} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors">
            <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <StIcon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: st.color }} />
          <span className="font-semibold text-sm flex-1 truncate">{editSrc ? editSrc.title : "New Source"}</span>
          <button onClick={handleSave} disabled={updateMutation.isPending || createMutation.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all"
            style={{ background: "#F96D1C", color: "white" }}>
            {(updateMutation.isPending || createMutation.isPending) ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            Save
          </button>
        </div>

        <ScrollArea className="flex-1">
          <div className="px-4 py-3 space-y-3">

            {/* Type chips */}
            <div className="flex gap-1.5 flex-wrap">
              {SOURCE_TYPES.map(t => {
                const TI = t.icon;
                return (
                  <button key={t.value} onClick={() => { setEditType(t.value); isDirty.current = true; }}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all"
                    style={{
                      background: editType === t.value ? t.bg : "transparent",
                      color: editType === t.value ? t.color : "hsl(var(--muted-foreground))",
                      border: editType === t.value ? `1px solid ${t.color}30` : "1px solid transparent",
                    }}>
                    <TI className="h-2.5 w-2.5" />{t.label}
                  </button>
                );
              })}
            </div>

            {/* Title */}
            <input value={editTitle} onChange={e => { setEditTitle(e.target.value); isDirty.current = true; }}
              placeholder="Source title…"
              className="w-full text-sm font-semibold bg-secondary/40 rounded-xl px-3 py-2.5 outline-none border border-border/50 focus:border-primary/30 transition-colors"
            />

            {/* Author + URL row */}
            <div className="grid grid-cols-2 gap-2">
              <input value={editAuthor} onChange={e => { setEditAuthor(e.target.value); isDirty.current = true; }}
                placeholder="Author / origin…"
                className="text-xs bg-secondary/40 rounded-xl px-3 py-2 outline-none border border-border/50 focus:border-primary/30 transition-colors"
              />
              <input value={editUrl} onChange={e => { setEditUrl(e.target.value); isDirty.current = true; }}
                placeholder="URL (optional)…"
                className="text-xs bg-secondary/40 rounded-xl px-3 py-2 outline-none border border-border/50 focus:border-primary/30 transition-colors"
              />
            </div>

            {/* Importance */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider font-semibold">Importance:</span>
              {IMPORTANCE.map(imp => {
                const II = imp.icon;
                return (
                  <button key={imp.value} onClick={() => { setEditImportance(imp.value); isDirty.current = true; }}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium transition-all"
                    style={{
                      background: editImportance === imp.value ? `${imp.color}15` : "transparent",
                      color: editImportance === imp.value ? imp.color : "hsl(var(--muted-foreground))",
                      border: editImportance === imp.value ? `1px solid ${imp.color}30` : "1px solid transparent",
                    }}>
                    <II className="h-2.5 w-2.5" />{imp.label}
                  </button>
                );
              })}
            </div>

            {/* Raw Content */}
            <div className="rounded-xl border border-border/60 overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 bg-secondary/30 border-b border-border/40">
                <FileText className="h-3 w-3 text-muted-foreground/60" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Raw Content</span>
                <button onClick={() => fileInputRef.current?.click()}
                  className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium transition-colors bg-secondary hover:bg-secondary/80 text-muted-foreground">
                  <FileUp className="h-2.5 w-2.5" />Upload file
                </button>
                <input ref={fileInputRef} type="file" accept=".txt,.pdf,.doc,.docx" className="sr-only" onChange={handleFileUpload} />
              </div>
              <textarea value={editRawContent} onChange={e => { setEditRawContent(e.target.value); isDirty.current = true; }}
                placeholder="Paste or type the source content here — article text, excerpts, notes…"
                rows={6}
                className="w-full text-xs bg-background px-3 py-2.5 outline-none resize-none leading-relaxed"
              />
              {editRawContent && (
                <div className="px-3 py-1 border-t border-border/30 text-[9px] text-muted-foreground/40 text-right">
                  {editRawContent.length.toLocaleString()} chars
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="rounded-xl border border-border/60 overflow-hidden">
              <div className="px-3 py-2 bg-secondary/30 border-b border-border/40 flex items-center gap-2">
                <Brain className="h-3 w-3 text-muted-foreground/60" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Summary</span>
              </div>
              <textarea value={editSummary} onChange={e => { setEditSummary(e.target.value); isDirty.current = true; }}
                placeholder="Your synthesis of this source…"
                rows={3}
                className="w-full text-xs bg-background px-3 py-2.5 outline-none resize-none leading-relaxed"
              />
            </div>

            {/* Key Concepts */}
            <div className="rounded-xl border border-border/60 overflow-hidden">
              <div className="px-3 py-2 bg-secondary/30 border-b border-border/40 flex items-center gap-2">
                <Hash className="h-3 w-3 text-muted-foreground/60" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Key Concepts</span>
                <span className="text-[9px] text-muted-foreground/40 ml-auto">comma-separated</span>
              </div>
              <textarea value={editKeyConcepts} onChange={e => { setEditKeyConcepts(e.target.value); isDirty.current = true; }}
                placeholder="epistemology, emergence, complexity theory…"
                rows={2}
                className="w-full text-xs bg-background px-3 py-2.5 outline-none resize-none"
              />
              {editKeyConcepts && (
                <div className="px-3 pb-2 flex gap-1 flex-wrap border-t border-border/20">
                  {editKeyConcepts.split(",").map(c => c.trim()).filter(Boolean).map((c, i) => (
                    <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-full"
                      style={{ background: "#6366F110", color: "#6366F1", border: "1px solid #6366F120" }}>{c}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Key Quotes */}
            <div className="rounded-xl border border-border/60 overflow-hidden">
              <div className="px-3 py-2 bg-secondary/30 border-b border-border/40 flex items-center gap-2">
                <Quote className="h-3 w-3 text-muted-foreground/60" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Key Quotes</span>
              </div>
              <textarea value={editKeyQuotes} onChange={e => { setEditKeyQuotes(e.target.value); isDirty.current = true; }}
                placeholder="— Notable quote from the source&#10;— Another key passage"
                rows={3}
                className="w-full text-xs bg-background px-3 py-2.5 outline-none resize-none leading-relaxed font-italic"
              />
            </div>

            {/* Tags */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border/50 bg-secondary/30">
              <Tag className="h-3 w-3 text-muted-foreground/60 flex-shrink-0" />
              <input value={editTags} onChange={e => { setEditTags(e.target.value); isDirty.current = true; }}
                placeholder="Tags (comma-separated)…"
                className="flex-1 bg-transparent outline-none text-xs placeholder:text-muted-foreground/40"
              />
            </div>

            {/* Linked Notes */}
            <div className="rounded-xl border border-border/60 overflow-hidden">
              <button onClick={() => setShowLinkNotes(v => !v)}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-muted-foreground hover:bg-secondary/50 transition-colors">
                <Link2 className="h-3 w-3 text-indigo-400" />
                Linked Notes
                {editLinkedNoteIds.length > 0 && (
                  <span className="ml-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                    style={{ background: "rgba(99,102,241,0.12)", color: "#6366F1" }}>{editLinkedNoteIds.length}</span>
                )}
                {showLinkNotes ? <ChevronUp className="h-3 w-3 ml-auto" /> : <ChevronDown className="h-3 w-3 ml-auto" />}
              </button>
              {showLinkNotes && (
                <div className="border-t border-border/50 max-h-40 overflow-y-auto">
                  {notes.length === 0 ? (
                    <p className="px-3 py-3 text-xs text-muted-foreground/50 italic">No notes yet</p>
                  ) : notes.filter(n => n.status !== "archived").map(n => (
                    <label key={n.id} className="flex items-center gap-2.5 px-3 py-2 hover:bg-secondary/40 cursor-pointer">
                      <div className="w-3.5 h-3.5 rounded flex items-center justify-center flex-shrink-0 border transition-colors"
                        style={{ background: editLinkedNoteIds.includes(n.id) ? "#6366F1" : undefined, borderColor: editLinkedNoteIds.includes(n.id) ? "#6366F1" : "hsl(var(--border))" }}>
                        {editLinkedNoteIds.includes(n.id) && <Check className="h-2 w-2 text-white" />}
                      </div>
                      <input type="checkbox" className="sr-only" checked={editLinkedNoteIds.includes(n.id)}
                        onChange={e => setEditLinkedNoteIds(p => e.target.checked ? [...p, n.id] : p.filter(i => i !== n.id))} />
                      <span className="text-xs truncate">{n.title}</span>
                      <span className="ml-auto text-[10px] text-muted-foreground/40 flex-shrink-0 capitalize">{n.type?.replace("_", " ")}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Linked Drafts */}
            <div className="rounded-xl border border-border/60 overflow-hidden">
              <button onClick={() => setShowLinkDrafts(v => !v)}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-muted-foreground hover:bg-secondary/50 transition-colors">
                <Edit3 className="h-3 w-3 text-amber-400" />
                Linked Drafts
                {editLinkedDraftIds.length > 0 && (
                  <span className="ml-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                    style={{ background: "rgba(249,109,28,0.12)", color: "#F96D1C" }}>{editLinkedDraftIds.length}</span>
                )}
                {showLinkDrafts ? <ChevronUp className="h-3 w-3 ml-auto" /> : <ChevronDown className="h-3 w-3 ml-auto" />}
              </button>
              {showLinkDrafts && (
                <div className="border-t border-border/50 max-h-40 overflow-y-auto">
                  {drafts.length === 0 ? (
                    <p className="px-3 py-3 text-xs text-muted-foreground/50 italic">No drafts yet</p>
                  ) : drafts.filter(d => (d as any).status !== "archived").map(d => (
                    <label key={d.id} className="flex items-center gap-2.5 px-3 py-2 hover:bg-secondary/40 cursor-pointer">
                      <div className="w-3.5 h-3.5 rounded flex items-center justify-center flex-shrink-0 border transition-colors"
                        style={{ background: editLinkedDraftIds.includes(d.id) ? "#F96D1C" : undefined, borderColor: editLinkedDraftIds.includes(d.id) ? "#F96D1C" : "hsl(var(--border))" }}>
                        {editLinkedDraftIds.includes(d.id) && <Check className="h-2 w-2 text-white" />}
                      </div>
                      <input type="checkbox" className="sr-only" checked={editLinkedDraftIds.includes(d.id)}
                        onChange={e => setEditLinkedDraftIds(p => e.target.checked ? [...p, d.id] : p.filter(i => i !== d.id))} />
                      <span className="text-xs truncate">{d.title}</span>
                      <span className="ml-auto text-[10px] text-muted-foreground/40 flex-shrink-0 capitalize">{d.type}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* AI Analysis Panel */}
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#8B5CF620" }}>
              <button onClick={() => setShowAnalysis(v => !v)}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium hover:opacity-80 transition-opacity"
                style={{ background: "#8B5CF608" }}>
                <Brain className="h-3 w-3 text-violet-500" />
                <span className="text-violet-600 font-semibold">AI Analysis</span>
                {analysis?.analyzedAt && (
                  <span className="text-[9px] text-muted-foreground/50 ml-1">— {analysis.analyzedAt}</span>
                )}
                {showAnalysis ? <ChevronUp className="h-3 w-3 ml-auto text-muted-foreground" /> : <ChevronDown className="h-3 w-3 ml-auto text-muted-foreground" />}
              </button>
              {showAnalysis && (
                <div className="border-t border-border/30 p-3 space-y-3" style={{ background: "#8B5CF604" }}>
                  {!analysis ? (
                    <p className="text-xs text-muted-foreground/50 italic text-center py-2">
                      No analysis yet. Click "Analyze" below to run AI analysis on this source.
                    </p>
                  ) : (
                    <>
                      {analysis.conceptualSummary && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider font-semibold text-violet-600/60 mb-1">Conceptual Summary</p>
                          <p className="text-xs leading-relaxed text-foreground/80">{analysis.conceptualSummary}</p>
                        </div>
                      )}
                      {analysis.keyIdeas && analysis.keyIdeas.length > 0 && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider font-semibold text-violet-600/60 mb-1.5">Key Ideas</p>
                          <div className="space-y-1">
                            {analysis.keyIdeas.map((idea, i) => (
                              <div key={i} className="flex items-start gap-2 text-xs">
                                <span className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-bold mt-0.5"
                                  style={{ background: "#8B5CF615", color: "#8B5CF6" }}>{i + 1}</span>
                                <span className="text-foreground/75 leading-snug">{idea}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {analysis.themes && analysis.themes.length > 0 && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider font-semibold text-violet-600/60 mb-1.5">Themes</p>
                          <div className="flex flex-wrap gap-1">
                            {analysis.themes.map((t, i) => (
                              <span key={i} className="text-[10px] px-2 py-0.5 rounded-full"
                                style={{ background: "#8B5CF612", color: "#8B5CF6", border: "1px solid #8B5CF620" }}>{t}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {analysis.argumentMap && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider font-semibold text-violet-600/60 mb-1">Argument Structure</p>
                          <p className="text-xs leading-relaxed text-foreground/70 italic">{analysis.argumentMap}</p>
                        </div>
                      )}
                      {analysis.writingStyle && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider font-semibold text-violet-600/60 mb-1">Writing Style</p>
                          <p className="text-xs leading-relaxed text-foreground/70">{analysis.writingStyle}</p>
                        </div>
                      )}
                      {analysis.projectRelevance && (
                        <div className="p-2.5 rounded-lg" style={{ background: "#0D948808", border: "1px solid #0D948818" }}>
                          <p className="text-[10px] uppercase tracking-wider font-semibold text-teal-600/60 mb-1 flex items-center gap-1">
                            <MapPin className="h-2.5 w-2.5" />Relevance to "{book.title}"
                          </p>
                          <p className="text-xs leading-relaxed text-foreground/75">{analysis.projectRelevance}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Action bar */}
            <div className="flex flex-wrap gap-2 pb-2">
              <button onClick={handleAnalyze} disabled={isAnalyzing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-medium border transition-all hover:opacity-80 disabled:opacity-50"
                style={{ borderColor: "rgba(139,92,246,0.25)", color: "#8B5CF6", background: "rgba(139,92,246,0.06)" }}>
                {isAnalyzing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Brain className="h-3 w-3" />}
                {isAnalyzing ? "Analyzing…" : "Analyze"}
              </button>
              <button onClick={handleExtractQuotes} disabled={isExtractingQuotes}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-medium border transition-all hover:opacity-80 disabled:opacity-50"
                style={{ borderColor: "rgba(245,158,11,0.25)", color: "#F59E0B", background: "rgba(245,158,11,0.06)" }}>
                {isExtractingQuotes ? <Loader2 className="h-3 w-3 animate-spin" /> : <Quote className="h-3 w-3" />}
                Extract Quotes
              </button>
              <button onClick={handleExtractConcepts} disabled={isExtractingConcepts}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-medium border transition-all hover:opacity-80 disabled:opacity-50"
                style={{ borderColor: "rgba(99,102,241,0.25)", color: "#6366F1", background: "rgba(99,102,241,0.06)" }}>
                {isExtractingConcepts ? <Loader2 className="h-3 w-3 animate-spin" /> : <Hash className="h-3 w-3" />}
                Extract Concepts
              </button>
              <button onClick={sendToNote}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-medium border transition-all hover:opacity-80"
                style={{ borderColor: "rgba(16,185,129,0.25)", color: "#10B981", background: "rgba(16,185,129,0.06)" }}>
                <Zap className="h-3 w-3" />→ Note
              </button>
              <button onClick={sendToBoard}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-medium border transition-all hover:opacity-80"
                style={{ borderColor: "rgba(99,102,241,0.25)", color: "#6366F1", background: "rgba(99,102,241,0.06)" }}>
                <StickyNote className="h-3 w-3" />→ Board
              </button>
              {editSrc && (
                <button onClick={() => deleteMutation.mutate(editSrc.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-medium border transition-all hover:opacity-80 ml-auto"
                  style={{ borderColor: "rgba(239,68,68,0.20)", color: "#EF4444" }}>
                  <Trash2 className="h-3 w-3" />Delete
                </button>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>
    );
  }

  // ─── LIST VIEW ────────────────────────────────────────────────────────────────

  return (
    <div className="h-full flex flex-col">
      {/* Search */}
      <div className="px-4 pt-3 pb-2 flex-shrink-0 space-y-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border/50 bg-secondary/30">
          <Search className="h-3 w-3 text-muted-foreground/60 flex-shrink-0" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search sources…"
            className="flex-1 bg-transparent outline-none text-xs placeholder:text-muted-foreground/40" />
          {searchQuery && <button onClick={() => setSearchQuery("")}><X className="h-3 w-3 text-muted-foreground" /></button>}
        </div>
        {/* Type filter chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          <button onClick={() => setTypeFilter("all")}
            className="flex-shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors"
            style={{ background: typeFilter === "all" ? "hsl(var(--secondary))" : "transparent", color: typeFilter === "all" ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}>
            All
          </button>
          {SOURCE_TYPES.map(st => {
            const STI = st.icon;
            const count = sources.filter(s => s.type === st.value && (s as any).status !== "archived").length;
            if (count === 0) return null;
            return (
              <button key={st.value} onClick={() => setTypeFilter(st.value)}
                className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all"
                style={{
                  background: typeFilter === st.value ? st.bg : "transparent",
                  color: typeFilter === st.value ? st.color : "hsl(var(--muted-foreground))",
                  border: typeFilter === st.value ? `1px solid ${st.color}30` : "1px solid transparent",
                }}>
                <STI className="h-2.5 w-2.5" />{st.label} <span className="opacity-60">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-4 pb-2 flex items-center gap-2 flex-shrink-0">
        <span className="text-[10px] text-muted-foreground/50">{filtered.length} source{filtered.length !== 1 ? "s" : ""}</span>
        <button onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-medium border transition-colors hover:opacity-80"
          style={{ borderColor: "rgba(99,102,241,0.25)", color: "#6366F1", background: "rgba(99,102,241,0.05)" }}>
          <FileUp className="h-3 w-3" />Upload
        </button>
        <input ref={fileInputRef} type="file" accept=".txt,.pdf,.doc,.docx" className="sr-only" onChange={handleFileUpload} />
        <button onClick={() => openEditor(null)}
          className="ml-auto flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-colors"
          style={{ background: "rgba(249,109,28,0.10)", color: "#F96D1C", border: "1px solid rgba(249,109,28,0.20)" }}>
          <Plus className="h-3 w-3" />New Source
        </button>
      </div>

      {/* Source list */}
      <ScrollArea className="flex-1">
        <div className="px-4 pb-4 space-y-2">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 bg-muted/40 rounded-xl animate-pulse" />)
          ) : filtered.length === 0 ? (
            <div className="py-14 text-center">
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
                <Database className="h-5 w-5 text-muted-foreground/30" />
              </div>
              <h4 className="font-medium text-sm mb-1 text-muted-foreground">
                {sources.length === 0 ? "No sources yet" : "Nothing matches"}
              </h4>
              <p className="text-xs text-muted-foreground/60 max-w-[200px] mx-auto">
                {sources.length === 0 ? "Add articles, books, websites, or upload files." : "Try a different filter."}
              </p>
            </div>
          ) : filtered.map(src => {
            const st = getSourceType(src.type || "article");
            const StI = st.icon;
            const analysis = parseAnalysis((src as any).aiAnalysis || "");
            const hasAnalysis = !!analysis?.conceptualSummary;
            const importanceConf = IMPORTANCE.find(i => i.value === ((src as any).importance || "normal")) || IMPORTANCE[1];
            const ImpI = importanceConf.icon;

            return (
              <div key={src.id}
                className="group p-3.5 rounded-xl border bg-card cursor-pointer transition-all hover:shadow-sm hover:border-primary/20"
                style={{ borderColor: `${st.color}15` }}
                onClick={() => openEditor(src)}>
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: st.bg, border: `1px solid ${st.color}20` }}>
                    <StI className="h-3.5 w-3.5" style={{ color: st.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-0.5">
                      <h4 className="font-semibold text-sm leading-snug flex-1 truncate">{src.title}</h4>
                      {(src as any).importance === "high" && (
                        <ImpI className="h-3 w-3 flex-shrink-0 mt-0.5" style={{ color: importanceConf.color }} />
                      )}
                      {hasAnalysis && (
                        <span className="flex-shrink-0 w-3 h-3 rounded-full flex items-center justify-center"
                          style={{ background: "#8B5CF620" }}>
                          <Brain className="h-2 w-2 text-violet-500" />
                        </span>
                      )}
                    </div>
                    {src.author && <p className="text-[10px] text-muted-foreground/60">{src.author}</p>}
                    {src.summary && (
                      <p className="text-xs text-muted-foreground/60 mt-1 line-clamp-2 leading-relaxed">{src.summary}</p>
                    )}
                    {src.quote && !src.summary && (
                      <blockquote className="text-xs text-muted-foreground/60 mt-1 line-clamp-2 italic border-l-2 pl-2" style={{ borderColor: `${st.color}40` }}>
                        "{src.quote}"
                      </blockquote>
                    )}
                    {/* Concept pills */}
                    {src.keyConcepts && (
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        {src.keyConcepts.split(",").filter(Boolean).slice(0, 4).map((c, i) => (
                          <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-full"
                            style={{ background: `${st.color}10`, color: st.color }}>{c.trim()}</span>
                        ))}
                        {src.keyConcepts.split(",").filter(Boolean).length > 4 && (
                          <span className="text-[9px] text-muted-foreground/40">+{src.keyConcepts.split(",").filter(Boolean).length - 4}</span>
                        )}
                      </div>
                    )}
                    {/* Tags */}
                    {src.tags && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {src.tags.split(",").filter(Boolean).slice(0, 3).map(t => (
                          <span key={t} className="text-[9px] px-1 rounded bg-secondary text-muted-foreground/50">#{t.trim()}</span>
                        ))}
                      </div>
                    )}
                    {/* URL + connections */}
                    <div className="flex items-center gap-2.5 mt-1.5">
                      {src.url && (
                        <a href={src.url} target="_blank" rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="flex items-center gap-0.5 text-[10px] text-primary/60 hover:text-primary transition-colors">
                          <ExternalLink className="h-2.5 w-2.5" />Link
                        </a>
                      )}
                      {((src as any).linkedNoteIds || "").split(",").filter((s: string) => s && s !== "0").length > 0 && (
                        <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground/50">
                          <Link2 className="h-2.5 w-2.5" />
                          {(src as any).linkedNoteIds.split(",").filter((s: string) => s && s !== "0").length} note{(src as any).linkedNoteIds.split(",").filter((s: string) => s && s !== "0").length !== 1 ? "s" : ""}
                        </span>
                      )}
                      <span className="text-[9px] text-muted-foreground/30 ml-auto">
                        {new Date(src.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
