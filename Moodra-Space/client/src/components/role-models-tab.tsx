import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useFreeMode } from "@/hooks/use-free-mode";
import { useLocation } from "wouter";
import type { AuthorRoleModel, Book } from "@shared/schema";
import {
  Plus, Trash2, ChevronLeft, Loader2, Sparkles, Upload,
  Brain, AlignLeft, Layers, Music2, Hash, Target, Heart,
  Wrench, Pencil, Check, X, RefreshCw, BookOpen, User,
  Feather, Eye, Zap, ChevronDown, ChevronUp, Key, AlertTriangle,
} from "lucide-react";

const MIN_CHARS_FOR_ANALYSIS = 500;
const WARN_CHARS_FOR_ANALYSIS = 1500;

// ─── Types ──────────────────────────────────────────────────────────────────

type View = "list" | "editor" | "detail";

const AVATAR_COLORS = [
  "#8B5CF6", "#6366F1", "#3B82F6", "#0D9488",
  "#10B981", "#F59E0B", "#EF4444", "#EC4899",
];

// ─── Analysis section definitions ───────────────────────────────────────────

const ANALYSIS_SECTIONS: Array<{
  key: keyof AuthorRoleModel;
  label: string;
  icon: any;
  color: string;
  description: string;
}> = [
  {
    key: "conceptualTendencies",
    label: "Conceptual Tendencies",
    icon: Brain,
    color: "#8B5CF6",
    description: "How the author constructs and connects ideas",
  },
  {
    key: "stylePatterns",
    label: "Style Patterns",
    icon: Feather,
    color: "#6366F1",
    description: "Sentence structure, voice, density, abstraction level",
  },
  {
    key: "structurePatterns",
    label: "Structure Patterns",
    icon: Layers,
    color: "#3B82F6",
    description: "Macro and micro organisation of arguments and sections",
  },
  {
    key: "rhythmObservations",
    label: "Rhythm Observations",
    icon: Music2,
    color: "#0D9488",
    description: "Pace, energy, transitions, pauses and acceleration",
  },
  {
    key: "vocabularyTendencies",
    label: "Vocabulary Tendencies",
    icon: Hash,
    color: "#10B981",
    description: "Characteristic vocabulary, metaphor types, linguistic register",
  },
  {
    key: "argumentBehavior",
    label: "Argument Behavior",
    icon: Target,
    color: "#F59E0B",
    description: "How the author builds a case and handles objections",
  },
  {
    key: "emotionalDynamics",
    label: "Emotional Dynamics",
    icon: Heart,
    color: "#EC4899",
    description: "Emotional temperature and affect embedded in structure",
  },
  {
    key: "reusableParameters",
    label: "Reusable Parameters",
    icon: Wrench,
    color: "#EF4444",
    description: "Concrete techniques a writer can adopt from this model",
  },
];

// ─── Main component ──────────────────────────────────────────────────────────

export function RoleModelsTab({ bookId, book }: { bookId: number; book: Book }) {
  const { toast } = useToast();
  const { isFreeMode } = useFreeMode();
  const [, navigate] = useLocation();
  const [view, setView] = useState<View>("list");
  const [editModel, setEditModel] = useState<AuthorRoleModel | null>(null);

  // form state
  const [formName, setFormName] = useState("");
  const [formAuthor, setFormAuthor] = useState("");
  const [formRef, setFormRef] = useState("");
  const [formRawText, setFormRawText] = useState("");
  const [formColor, setFormColor] = useState(AVATAR_COLORS[0]);

  const [analyzing, setAnalyzing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [sectionDraft, setSectionDraft] = useState("");
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const detailFileRef = useRef<HTMLInputElement>(null);

  const { data: models = [], isLoading } = useQuery<AuthorRoleModel[]>({
    queryKey: ["/api/books", bookId, "role-models"],
    queryFn: () => apiRequest("GET", `/api/books/${bookId}/role-models`),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/api/books/${bookId}/role-models`, data),
    onSuccess: (newModel: AuthorRoleModel) => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "role-models"] });
      setEditModel(newModel);
      setView("detail");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiRequest("PATCH", `/api/role-models/${id}`, data),
    onSuccess: (updated: AuthorRoleModel) => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "role-models"] });
      setEditModel(updated);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/role-models/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "role-models"] });
      setView("list");
      setEditModel(null);
    },
  });

  // ── Helpers ────────────────────────────────────────────────────────────────

  const openCreate = () => {
    setFormName(""); setFormAuthor(""); setFormRef("");
    setFormRawText(""); setFormColor(AVATAR_COLORS[0]);
    setEditModel(null);
    setView("editor");
  };

  const openDetail = (m: AuthorRoleModel) => {
    setEditModel(m);
    setExpandedSection(null);
    setEditingSection(null);
    setView("detail");
  };

  const goList = () => { setView("list"); setEditModel(null); };

  const handleCreate = () => {
    if (!formName.trim()) return toast({ title: "Name is required", variant: "destructive" });
    createMutation.mutate({
      name: formName.trim(),
      authorName: formAuthor.trim(),
      sourceMaterialRef: formRef.trim(),
      rawSourceText: formRawText.trim(),
      avatarColor: formColor,
      analysisStatus: "empty",
    });
  };

  // Shared file upload handler — used by both the create form and the detail view.
  // Calls the server-side /api/extract-file-text which supports EPUB, FB2, TXT, MD
  // and returns up to 80 000 characters. Falls back to FileReader for plain text if the
  // server call fails (e.g. unauthenticated or unsupported type).
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    onText?: (text: string) => void,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setUploading(true);
    setUploadedFileName(file.name);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/extract-file-text", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (res.ok) {
        const { text } = await res.json();
        const setter = onText ?? setFormRawText;
        setter(text);
        if (!formName && file.name) setFormName(file.name.replace(/\.[^.]+$/, ""));
        return;
      }
    } catch {
      // fall through to FileReader fallback
    }

    // Fallback: read as plain text in the browser (no size limit applied here)
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = (ev.target?.result as string) || "";
      const setter = onText ?? setFormRawText;
      setter(text);
      if (!formName && file.name) setFormName(file.name.replace(/\.[^.]+$/, ""));
    };
    reader.readAsText(file);
    setUploading(false);
  };

  const handleAnalyze = async () => {
    if (!editModel) return;
    const sourceText = editModel.rawSourceText || formRawText;
    if (!sourceText?.trim()) {
      return toast({ title: "No source material", description: "Paste or upload text first", variant: "destructive" });
    }
    setAnalyzing(true);
    try {
      // apiRequest already parses JSON and returns the data object directly —
      // do NOT call .json() again on the result.
      const data = await apiRequest("POST", `/api/role-models/${editModel.id}/deep-analyze`, {
        rawSourceText: sourceText,
        lang: book.language || "en",
      });
      if (data?.error) throw new Error(data.message || data.error);
      setEditModel(data.model);
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "role-models"] });
      toast({ title: "Analysis complete", description: "Creative model reconstructed" });
    } catch (e: any) {
      toast({ title: "Analysis failed", description: e.message, variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  };

  const saveSection = async (key: string) => {
    if (!editModel) return;
    await updateMutation.mutateAsync({ id: editModel.id, data: { [key]: sectionDraft } });
    setEditingSection(null);
  };

  // ── API key gate ───────────────────────────────────────────────────────────

  if (isFreeMode) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-5 px-6 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "rgba(139,92,246,0.1)", border: "1.5px solid rgba(139,92,246,0.2)" }}>
          <Key className="h-7 w-7" style={{ color: "#8B5CF6" }} />
        </div>
        <div className="space-y-2">
          <h3 className="text-base font-bold">Требуется API ключ</h3>
          <p className="text-xs text-muted-foreground/70 max-w-[260px] leading-relaxed">
            Ролевые модели авторов используют продвинутые AI модели. Подключите собственный OpenAI API ключ, чтобы использовать эту функцию без ограничений.
          </p>
        </div>
        <button
          onClick={() => navigate("/settings")}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ background: "linear-gradient(135deg, #8B5CF6, #6366F1)" }}
        >
          <Key className="h-4 w-4" />
          Подключить API →
        </button>
      </div>
    );
  }

  // ── List view ──────────────────────────────────────────────────────────────

  if (view === "list") {
    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="px-4 pt-3 pb-3 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-violet-500" />
              Role Model Library
            </h2>
            <p className="text-[10px] text-muted-foreground/60 mt-0.5">
              Deep structural analyses of author minds
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{ background: "rgba(139,92,246,0.12)", color: "#8B5CF6", border: "1px solid rgba(139,92,246,0.25)" }}
          >
            <Plus className="h-3 w-3" />
            Add
          </button>
        </div>

        {/* Models grid */}
        <div className="flex-1 overflow-y-auto px-4 space-y-2 pb-4">
          {isLoading && (
            <div className="flex items-center justify-center h-24">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
          {!isLoading && models.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <Brain className="h-8 w-8 text-muted-foreground/25 mb-3" />
              <p className="text-sm font-medium text-muted-foreground/60">No role models yet</p>
              <p className="text-xs text-muted-foreground/40 mt-1 max-w-[200px]">
                Upload author excerpts and reconstruct their creative model
              </p>
            </div>
          )}
          {models.map(m => {
            const analyzed = m.analysisStatus === "analyzed";
            return (
              <button
                key={m.id}
                onClick={() => openDetail(m)}
                className="w-full text-left rounded-xl border border-border/50 bg-background/50 hover:border-violet-300/40 hover:bg-violet-50/20 transition-all overflow-hidden group"
              >
                {/* Color stripe */}
                <div style={{ height: 3, background: m.avatarColor || "#8B5CF6", opacity: 0.7 }} />
                <div className="p-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-sm font-bold"
                      style={{ background: m.avatarColor || "#8B5CF6" }}>
                      {(m.authorName || m.name || "?")[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold truncate">{m.name}</span>
                        <span className={`flex-shrink-0 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${
                          analyzed
                            ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
                            : "bg-muted text-muted-foreground/60"
                        }`}>
                          {analyzed ? "Analyzed" : "Draft"}
                        </span>
                      </div>
                      {m.authorName && (
                        <p className="text-[11px] text-muted-foreground/70 mt-0.5 truncate">{m.authorName}</p>
                      )}
                      {m.conceptualTendencies && (
                        <p className="text-[10px] text-muted-foreground/50 mt-1 line-clamp-2 leading-relaxed">
                          {m.conceptualTendencies}
                        </p>
                      )}
                    </div>
                  </div>
                  {analyzed && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {ANALYSIS_SECTIONS.slice(0, 4).map(s => (
                        <span key={s.key} className="px-1.5 py-0.5 rounded text-[9px] font-medium"
                          style={{ background: `${s.color}12`, color: s.color }}>
                          {s.label.split(" ")[0]}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Editor view (create new) ───────────────────────────────────────────────

  if (view === "editor") {
    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border/40 flex-shrink-0">
          <button onClick={goList}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-secondary text-muted-foreground transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-[13px] font-semibold flex-1">New Role Model</span>
          <button
            onClick={handleCreate}
            disabled={createMutation.isPending || !formName.trim()}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold disabled:opacity-40 transition-all"
            style={{ background: "rgba(139,92,246,0.12)", color: "#8B5CF6", border: "1px solid rgba(139,92,246,0.25)" }}
          >
            {createMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
            Create
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6 space-y-4">
          {/* Avatar color */}
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wide mb-2 block">Color</label>
            <div className="flex gap-2">
              {AVATAR_COLORS.map(c => (
                <button key={c} onClick={() => setFormColor(c)}
                  className="w-6 h-6 rounded-lg transition-all"
                  style={{ background: c, outline: formColor === c ? `2px solid ${c}` : "none", outlineOffset: 2 }} />
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wide mb-1.5 block">Model name *</label>
            <input
              value={formName}
              onChange={e => setFormName(e.target.value)}
              placeholder="e.g. David Foster Wallace Style"
              className="w-full px-3 py-2 rounded-lg border border-border/50 bg-background text-sm outline-none focus:border-violet-400/60 placeholder:text-muted-foreground/35"
            />
          </div>

          {/* Author */}
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wide mb-1.5 block">Author name</label>
            <input
              value={formAuthor}
              onChange={e => setFormAuthor(e.target.value)}
              placeholder="Author of the source material"
              className="w-full px-3 py-2 rounded-lg border border-border/50 bg-background text-sm outline-none focus:border-violet-400/60 placeholder:text-muted-foreground/35"
            />
          </div>

          {/* Source reference */}
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wide mb-1.5 block">Source reference</label>
            <input
              value={formRef}
              onChange={e => setFormRef(e.target.value)}
              placeholder="Book title, article URL, chapter name…"
              className="w-full px-3 py-2 rounded-lg border border-border/50 bg-background text-sm outline-none focus:border-violet-400/60 placeholder:text-muted-foreground/35"
            />
          </div>

          {/* Source material */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wide">Source material</label>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-1 text-[10px] text-violet-500 hover:text-violet-700 transition-colors disabled:opacity-50"
              >
                {uploading
                  ? <Loader2 className="h-3 w-3 animate-spin" />
                  : <Upload className="h-3 w-3" />}
                {uploading ? "Extracting…" : "Upload file"}
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".txt,.md,.text,.epub,.fb2"
              className="hidden"
              onChange={handleFileUpload}
            />
            <textarea
              value={formRawText}
              onChange={e => { setFormRawText(e.target.value); setUploadedFileName(""); }}
              placeholder="Paste an excerpt, article, book chapter, or essay by the author you want to analyze…"
              rows={10}
              className="w-full px-3 py-2 rounded-lg border border-border/50 bg-background text-xs leading-relaxed outline-none focus:border-violet-400/60 placeholder:text-muted-foreground/30 resize-none"
            />
            {/* Status line */}
            {formRawText.length > 0 ? (
              <div className="mt-1 space-y-1">
                {uploadedFileName && (
                  <p className="text-[9px] text-muted-foreground/50 truncate">
                    📄 {uploadedFileName}
                  </p>
                )}
                <div className="flex items-center gap-1.5">
                  {formRawText.length < MIN_CHARS_FOR_ANALYSIS ? (
                    <AlertTriangle className="h-2.5 w-2.5 text-amber-500 flex-shrink-0" />
                  ) : null}
                  <p className={`text-[9px] ${
                    formRawText.length < MIN_CHARS_FOR_ANALYSIS
                      ? "text-amber-500"
                      : formRawText.length < WARN_CHARS_FOR_ANALYSIS
                        ? "text-muted-foreground/60"
                        : "text-emerald-600"
                  }`}>
                    {formRawText.length.toLocaleString()} chars
                    {formRawText.length < MIN_CHARS_FOR_ANALYSIS
                      ? " — too short for reliable analysis (add more text)"
                      : formRawText.length < WARN_CHARS_FOR_ANALYSIS
                        ? " — usable, more text improves accuracy"
                        : " — good length for analysis"}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-[9px] text-muted-foreground/40 mt-1">
                Paste text or upload .txt / .md / .epub / .fb2 — supports up to 80 000 chars
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Detail view ───────────────────────────────────────────────────────────

  if (view === "detail" && editModel) {
    const analyzed = editModel.analysisStatus === "analyzed";
    const hasSource = !!(editModel.rawSourceText?.trim());

    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border/40 flex-shrink-0">
          <button onClick={goList}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-secondary text-muted-foreground transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ background: editModel.avatarColor || "#8B5CF6" }}>
            {(editModel.authorName || editModel.name || "?")[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold truncate">{editModel.name}</p>
            {editModel.authorName && <p className="text-[10px] text-muted-foreground/60 leading-none">{editModel.authorName}</p>}
          </div>
          <div className="flex items-center gap-1.5">
            {/* Analyze button */}
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all disabled:opacity-50"
              style={{ background: "rgba(139,92,246,0.12)", color: "#8B5CF6", border: "1px solid rgba(139,92,246,0.25)" }}
            >
              {analyzing
                ? <><Loader2 className="h-3 w-3 animate-spin" /> Analyzing…</>
                : analyzed
                  ? <><RefreshCw className="h-3 w-3" /> Re-analyze</>
                  : <><Sparkles className="h-3 w-3" /> Analyze</>
              }
            </button>
            <button
              onClick={() => deleteMutation.mutate(editModel.id)}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-100 text-muted-foreground hover:text-red-500 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Color stripe */}
        <div style={{ height: 2, background: editModel.avatarColor || "#8B5CF6", opacity: 0.5, flexShrink: 0 }} />

        <div className="flex-1 overflow-y-auto">
          {/* Source material section */}
          <div className="px-4 pt-3 pb-2">
            <div className="rounded-lg border border-border/40 bg-muted/20 overflow-hidden">
              <button
                onClick={() => setExpandedSection(expandedSection === "__source" ? null : "__source")}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-left hover:bg-muted/30 transition-colors"
              >
                <AlignLeft className="h-3 w-3 text-muted-foreground/60 flex-shrink-0" />
                <span className="font-medium text-muted-foreground/80 flex-1">Source material</span>
                {editModel.sourceMaterialRef && (
                  <span className="text-[10px] text-muted-foreground/50 truncate max-w-[120px]">{editModel.sourceMaterialRef}</span>
                )}
                {expandedSection === "__source" ? <ChevronUp className="h-3 w-3 ml-1 flex-shrink-0" /> : <ChevronDown className="h-3 w-3 ml-1 flex-shrink-0" />}
              </button>
              {expandedSection === "__source" && (
                <div className="border-t border-border/30 px-3 py-2">
                  {editingSection === "__source_ref" ? (
                    <div className="space-y-2">
                      <input
                        className="w-full text-xs bg-transparent border-b border-border/50 outline-none pb-1"
                        value={sectionDraft}
                        onChange={e => setSectionDraft(e.target.value)}
                        placeholder="Source reference…"
                      />
                      <div className="flex gap-1.5">
                        <button onClick={() => { updateMutation.mutate({ id: editModel.id, data: { sourceMaterialRef: sectionDraft } }); setEditingSection(null); }}
                          className="text-[10px] px-2 py-0.5 rounded bg-violet-100 text-violet-600 font-semibold">Save</button>
                        <button onClick={() => setEditingSection(null)} className="text-[10px] px-2 py-0.5 rounded text-muted-foreground">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] text-muted-foreground/60 flex-1">{editModel.sourceMaterialRef || "No reference set"}</span>
                      <button onClick={() => { setSectionDraft(editModel.sourceMaterialRef || ""); setEditingSection("__source_ref"); }}
                        className="text-muted-foreground/40 hover:text-violet-500 transition-colors">
                        <Pencil className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  {hasSource ? (
                    <div className="space-y-1.5">
                      <p className="text-[10px] text-muted-foreground/50 italic line-clamp-4 leading-relaxed">
                        {editModel.rawSourceText?.slice(0, 400)}…
                      </p>
                      <p className="text-[9px] text-muted-foreground/40">
                        {editModel.rawSourceText?.length?.toLocaleString()} chars stored
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-[10px] text-muted-foreground/50 italic">No source material yet. Paste below or upload a file to enable analysis.</p>
                      <textarea
                        placeholder="Paste source text here…"
                        rows={6}
                        className="w-full text-xs bg-background border border-border/40 rounded px-2 py-1.5 outline-none resize-none placeholder:text-muted-foreground/30"
                        onChange={e => { setFormRawText(e.target.value); setUploadedFileName(""); }}
                        value={formRawText}
                      />
                      {/* Status line for detail view */}
                      {formRawText.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          {formRawText.length < MIN_CHARS_FOR_ANALYSIS && (
                            <AlertTriangle className="h-2.5 w-2.5 text-amber-500 flex-shrink-0" />
                          )}
                          <p className={`text-[9px] ${
                            formRawText.length < MIN_CHARS_FOR_ANALYSIS
                              ? "text-amber-500"
                              : formRawText.length < WARN_CHARS_FOR_ANALYSIS
                                ? "text-muted-foreground/60"
                                : "text-emerald-600"
                          }`}>
                            {uploadedFileName && `${uploadedFileName} · `}
                            {formRawText.length.toLocaleString()} chars
                            {formRawText.length < MIN_CHARS_FOR_ANALYSIS
                              ? " — too short"
                              : formRawText.length < WARN_CHARS_FOR_ANALYSIS
                                ? " — usable"
                                : " — good"}
                          </p>
                        </div>
                      )}
                      <div className="flex gap-2 items-center flex-wrap">
                        <button
                          onClick={() => detailFileRef.current?.click()}
                          disabled={uploading}
                          className="flex items-center gap-1 text-[10px] text-violet-500 hover:text-violet-700 disabled:opacity-50"
                        >
                          {uploading
                            ? <Loader2 className="h-3 w-3 animate-spin" />
                            : <Upload className="h-3 w-3" />}
                          {uploading ? "Extracting…" : "Upload file"}
                        </button>
                        <input
                          ref={detailFileRef}
                          type="file"
                          accept=".txt,.md,.text,.epub,.fb2"
                          className="hidden"
                          onChange={e => handleFileUpload(e, setFormRawText)}
                        />
                        <span className="text-[9px] text-muted-foreground/35">.txt · .md · .epub · .fb2</span>
                        {formRawText && (
                          <button
                            onClick={() => updateMutation.mutate({ id: editModel.id, data: { rawSourceText: formRawText } })}
                            className="flex items-center gap-1 text-[10px] text-emerald-600 ml-auto"
                          >
                            <Check className="h-3 w-3" /> Save text
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Analysis pending state */}
          {!analyzed && (
            <div className="mx-4 my-2 rounded-xl border border-dashed border-violet-300/40 bg-violet-50/20 dark:bg-violet-950/10 p-5 text-center">
              <Sparkles className="h-6 w-6 text-violet-400/60 mx-auto mb-2" />
              <p className="text-sm font-medium text-muted-foreground/70">No analysis yet</p>
              <p className="text-[11px] text-muted-foreground/45 mt-1 max-w-[200px] mx-auto">
                {hasSource
                  ? "Click Analyze to reconstruct this author's creative model"
                  : "Add source material first, then analyze"}
              </p>
            </div>
          )}

          {/* Analysis sections */}
          {analyzed && (
            <div className="px-4 pb-4 space-y-2">
              {ANALYSIS_SECTIONS.map(section => {
                const value = editModel[section.key] as string | null | undefined;
                if (!value && editingSection !== section.key) return null;
                const isEditing = editingSection === section.key;
                const isExpanded = expandedSection === section.key;
                const Icon = section.icon;

                return (
                  <div key={section.key} className="rounded-xl border border-border/40 overflow-hidden">
                    <button
                      onClick={() => setExpandedSection(isExpanded ? null : section.key)}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-muted/20 transition-colors text-left"
                    >
                      <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                        style={{ background: `${section.color}15` }}>
                        <Icon className="h-3 w-3" style={{ color: section.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold">{section.label}</p>
                        {!isExpanded && value && (
                          <p className="text-[10px] text-muted-foreground/55 truncate mt-0.5 leading-none">{value.slice(0, 80)}</p>
                        )}
                      </div>
                      {isExpanded ? <ChevronUp className="h-3 w-3 text-muted-foreground/40 flex-shrink-0" /> : <ChevronDown className="h-3 w-3 text-muted-foreground/40 flex-shrink-0" />}
                    </button>

                    {isExpanded && (
                      <div className="border-t border-border/30 px-3 py-3">
                        {isEditing ? (
                          <div className="space-y-2">
                            <textarea
                              value={sectionDraft}
                              onChange={e => setSectionDraft(e.target.value)}
                              rows={5}
                              className="w-full text-xs leading-relaxed bg-background/80 border border-border/50 rounded-lg px-2.5 py-2 outline-none resize-none"
                              autoFocus
                            />
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => saveSection(section.key)}
                                disabled={updateMutation.isPending}
                                className="flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-semibold"
                                style={{ background: `${section.color}15`, color: section.color }}
                              >
                                {updateMutation.isPending ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Check className="h-2.5 w-2.5" />}
                                Save
                              </button>
                              <button onClick={() => setEditingSection(null)} className="text-[10px] text-muted-foreground/60 hover:text-muted-foreground">
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="relative group">
                            <p className="text-xs leading-relaxed text-foreground/80 whitespace-pre-wrap">{value}</p>
                            <button
                              onClick={() => { setSectionDraft(value || ""); setEditingSection(section.key); }}
                              className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/40 hover:text-violet-500"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* AI Style Instruction section */}
              {editModel.styleInstruction && (
                <div className="rounded-xl border border-violet-200/40 bg-violet-50/20 dark:bg-violet-950/15 overflow-hidden">
                  <button
                    onClick={() => setExpandedSection(expandedSection === "__style" ? null : "__style")}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-violet-50/30 transition-colors text-left"
                  >
                    <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(139,92,246,0.12)" }}>
                      <Zap className="h-3 w-3 text-violet-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-violet-600">AI Style Instruction</p>
                      <p className="text-[10px] text-violet-500/60 truncate mt-0.5">System prompt for AI imitation</p>
                    </div>
                    {expandedSection === "__style" ? <ChevronUp className="h-3 w-3 text-violet-400/50 flex-shrink-0" /> : <ChevronDown className="h-3 w-3 text-violet-400/50 flex-shrink-0" />}
                  </button>
                  {expandedSection === "__style" && (
                    <div className="border-t border-violet-200/30 px-3 py-3">
                      {editingSection === "__style_instruction" ? (
                        <div className="space-y-2">
                          <textarea
                            value={sectionDraft}
                            onChange={e => setSectionDraft(e.target.value)}
                            rows={4}
                            className="w-full text-xs bg-background/80 border border-violet-300/40 rounded-lg px-2.5 py-2 outline-none resize-none"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => { updateMutation.mutate({ id: editModel.id, data: { styleInstruction: sectionDraft } }); setEditingSection(null); }}
                              className="px-2.5 py-1 rounded text-[10px] font-semibold bg-violet-100 text-violet-600"
                            >Save</button>
                            <button onClick={() => setEditingSection(null)} className="text-[10px] text-muted-foreground/60">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div className="relative group">
                          <p className="text-xs italic leading-relaxed text-violet-700/80 dark:text-violet-300/80 whitespace-pre-wrap">
                            "{editModel.styleInstruction}"
                          </p>
                          <button
                            onClick={() => { setSectionDraft(editModel.styleInstruction || ""); setEditingSection("__style_instruction"); }}
                            className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/40 hover:text-violet-500"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
