import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAiError } from "@/contexts/ai-error-context";
import { useLang } from "@/contexts/language-context";
import type { Book, Draft, Chapter } from "@shared/schema";
import type { AuthorRoleModel } from "@shared/schema";
import {
  Search, Sparkles, BookOpen, FileEdit, Brain, Plus, ArrowRight,
  Loader2, ArrowDownToLine, CheckCircle2, Globe, FileText, BookMarked,
  Quote, Microscope, ExternalLink, ChevronDown, ChevronUp, X, Zap,
  Feather, Layers, Music2, Hash, Target, Heart, Wrench, AlignLeft, Eye,
  Save, ArrowLeft, Clock, AlignCenter, BarChart3, Lightbulb, RefreshCw,
  Check, Trash2, Link2, BookCopy, SendToBack, GitBranch, Wand2,
  Minus, ChevronsLeftRight,
} from "lucide-react";
import { BlockEditor, Block, blocksToPlainText } from "@/components/block-editor";
import { RoleModelsTab } from "@/components/role-models-tab";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";


const ROLE_MODEL_ANALYSIS_SECTIONS = [
  { key: "conceptualTendencies",  label: "Conceptual Tendencies",  icon: Brain,       color: "#8B5CF6" },
  { key: "stylePatterns",         label: "Style Patterns",         icon: Feather,     color: "#6366F1" },
  { key: "structurePatterns",     label: "Structure Patterns",     icon: Layers,      color: "#3B82F6" },
  { key: "rhythmObservations",    label: "Rhythm & Pacing",        icon: Music2,      color: "#0D9488" },
  { key: "vocabularyTendencies",  label: "Vocabulary Tendencies",  icon: Hash,        color: "#10B981" },
  { key: "argumentBehavior",      label: "Argument Behavior",      icon: Target,      color: "#F59E0B" },
  { key: "emotionalDynamics",     label: "Emotional Dynamics",     icon: Heart,       color: "#EC4899" },
  { key: "technicalDevices",      label: "Technical Devices",      icon: Wrench,      color: "#64748B" },
  { key: "pacing",                label: "Pacing",                 icon: AlignCenter, color: "#F96D1C" },
  { key: "perspectiveVoice",      label: "Perspective & Voice",    icon: Eye,         color: "#0EA5E9" },
  { key: "thematicPatterns",      label: "Thematic Patterns",      icon: AlignLeft,   color: "#84CC16" },
] as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

// ─── Section header ──────────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon, color, title, description, action, actionLabel, actionIcon: ActionIcon,
}: {
  icon: any; color: string; title: string; description: string;
  action?: () => void; actionLabel?: string; actionIcon?: any;
}) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}15` }}>
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        <div>
          <h3 className="text-base font-bold tracking-tight">{title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
      {action && (
        <button onClick={action}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
          style={{ background: `${color}12`, color }}>
          {ActionIcon && <ActionIcon className="h-3.5 w-3.5" />}
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// ─── Role Model Creation Dialog ───────────────────────────────────────────────

const AVATAR_COLORS = ["#8B5CF6","#6366F1","#0EA5E9","#10B981","#F59E0B","#EC4899","#F96D1C","#64748B"];

function CreateRoleModelDialog({ open, onClose, bookId, book }: {
  open: boolean; onClose: () => void; bookId: number; book: Book;
}) {
  const { toast } = useToast();
  const { handleAiError } = useAiError();
  const { lang } = useLang();

  const [step, setStep] = useState<"form"|"analyzing"|"done">("form");
  const [authorName, setAuthorName] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [customInstruction, setCustomInstruction] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) { setStep("form"); setAuthorName(""); setSourceName(""); setCustomInstruction(""); setFile(null); setFileError(""); setAnalysis(null); }
  }, [open]);

  const handleFile = (f: File) => {
    const ext = f.name.split(".").pop()?.toLowerCase() || "";
    if (!["epub","fb2","txt","md"].includes(ext)) { setFileError("Поддерживаются: EPUB, FB2, TXT"); return; }
    setFile(f); setFileError("");
  };

  const extractText = async (f: File): Promise<string> => {
    const ext = f.name.split(".").pop()?.toLowerCase() || "";
    if (ext === "txt" || ext === "md") return f.text();
    if (ext === "fb2") {
      const raw = await f.text();
      return raw.replace(/<binary[^>]*>[\s\S]*?<\/binary>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s{2,}/g," ").trim();
    }
    // For EPUB, use server extraction
    const fd = new FormData(); fd.append("file", f);
    const resp = await fetch("/api/extract-file-text", { method: "POST", body: fd });
    if (!resp.ok) throw new Error("Не удалось извлечь текст из файла");
    const data = await resp.json();
    return data.text || "";
  };

  const handleSubmit = async () => {
    if (!authorName.trim()) return;
    setStep("analyzing"); setFileError("");
    try {
      let rawSourceText = "";
      if (file) {
        setExtracting(true);
        try { rawSourceText = await extractText(file); } catch (e: any) { setFileError(e.message); setStep("form"); setExtracting(false); return; }
        setExtracting(false);
      }

      // Create role model record
      const avatarColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
      const model: any = await apiRequest("POST", `/api/books/${bookId}/role-models`, {
        name: authorName.trim(),
        authorName: authorName.trim(),
        sourceTitle: sourceName.trim() || undefined,
        avatarColor,
      });

      // Deep analyze
      const result: any = await apiRequest("POST", `/api/role-models/${model.id}/deep-analyze`, {
        rawSourceText: rawSourceText || `Стиль автора: ${authorName}`,
        lang,
        bookTitle: book.title,
        bookMode: book.mode,
        customInstruction: customInstruction.trim() || undefined,
      });

      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "role-models"] });
      setAnalysis(result);
      setStep("done");
    } catch (e: any) {
      setStep("form");
      if (!handleAiError(e)) toast({ title: "Ошибка анализа", variant: "destructive" });
    }
  };

  if (!open) return null;
  const color = "#8B5CF6";

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.55)" }} onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] bg-background"
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border/50 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
              <Brain className="h-4 w-4" style={{ color }} />
            </div>
            <span className="font-bold text-sm">
              {step === "done" ? "Анализ завершён" : "Новая ролевая модель"}
            </span>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {step === "form" && (
            <>
              {/* Author name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Имя автора *</label>
                <input
                  value={authorName} onChange={e => setAuthorName(e.target.value)} autoFocus
                  placeholder="Например: Умберто Эко, Стивен Пинкер…"
                  className="w-full rounded-xl border border-border bg-background/50 px-3.5 py-2.5 text-sm outline-none focus:border-violet-400/50 focus:ring-2 focus:ring-violet-400/10 transition-all"
                />
              </div>

              {/* Source title */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Источник (книга / статья)</label>
                <input
                  value={sourceName} onChange={e => setSourceName(e.target.value)}
                  placeholder="Название произведения для анализа…"
                  className="w-full rounded-xl border border-border bg-background/50 px-3.5 py-2.5 text-sm outline-none focus:border-violet-400/50 focus:ring-2 focus:ring-violet-400/10 transition-all"
                />
              </div>

              {/* File upload */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Файл для анализа (EPUB / FB2 / TXT)</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                  onDragOver={e => e.preventDefault()}
                  className="w-full rounded-xl border-2 border-dashed border-border/50 hover:border-violet-400/50 transition-colors p-5 flex flex-col items-center gap-2 cursor-pointer text-center"
                >
                  {file ? (
                    <>
                      <FileText className="h-8 w-8" style={{ color }} />
                      <p className="text-sm font-semibold">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
                      <button onClick={e => { e.stopPropagation(); setFile(null); }} className="text-xs text-destructive hover:underline">Убрать</button>
                    </>
                  ) : (
                    <>
                      <FileText className="h-8 w-8 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">Перетащите файл или нажмите для выбора</p>
                      <p className="text-[11px] text-muted-foreground/50">EPUB, FB2, TXT — до 30 MB</p>
                    </>
                  )}
                </div>
                <input ref={fileRef} type="file" accept=".epub,.fb2,.txt,.md" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                {fileError && <p className="text-xs text-destructive">{fileError}</p>}
              </div>

              {/* Custom instruction */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Особые указания для анализа</label>
                <textarea
                  value={customInstruction} onChange={e => setCustomInstruction(e.target.value)}
                  rows={3}
                  placeholder="Например: сосредоточься на структуре аргументации, игнорируй стилистику…"
                  className="w-full rounded-xl border border-border bg-background/50 px-3.5 py-2.5 text-sm resize-none outline-none focus:border-violet-400/50 focus:ring-2 focus:ring-violet-400/10 transition-all"
                />
              </div>
            </>
          )}

          {step === "analyzing" && (
            <div className="flex flex-col items-center gap-4 py-10">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: `${color}12` }}>
                <Brain className="h-8 w-8 animate-pulse" style={{ color }} />
              </div>
              <div className="text-center">
                <p className="font-semibold text-sm">{extracting ? "Извлекаю текст из файла…" : "Глубокий анализ стиля…"}</p>
                <p className="text-xs text-muted-foreground mt-1">ИИ изучает {authorName} по 11 измерениям</p>
              </div>
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full animate-bounce" style={{ background: color, animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}

          {step === "done" && analysis && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50/60 dark:bg-green-950/20 border border-green-200/40">
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm text-green-700 dark:text-green-400">Ролевая модель создана</p>
                  <p className="text-xs text-green-600/70 dark:text-green-400/60 mt-0.5">Анализ {authorName} доступен в разделе Ролевые модели</p>
                </div>
              </div>
              {analysis.stylePatterns && (
                <div className="p-4 rounded-xl border border-border/50 bg-secondary/30 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Стиль</p>
                  <p className="text-sm leading-relaxed">{analysis.stylePatterns}</p>
                </div>
              )}
              {analysis.conceptualTendencies && (
                <div className="p-4 rounded-xl border border-border/50 bg-secondary/30 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Концептуальные тенденции</p>
                  <p className="text-sm leading-relaxed">{analysis.conceptualTendencies}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {step !== "analyzing" && (
          <div className="flex gap-2 px-5 pb-5 pt-3 border-t border-border/50 flex-shrink-0">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-border/60 text-muted-foreground hover:bg-secondary transition-colors">
              {step === "done" ? "Закрыть" : "Отмена"}
            </button>
            {step === "form" && (
              <button
                onClick={handleSubmit}
                disabled={!authorName.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: `linear-gradient(135deg, ${color}, #6366F1)` }}>
                <Wand2 className="h-4 w-4" /> Анализировать
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Role Models Section ─────────────────────────────────────────────────────

function RoleModelsSection({ bookId, book }: { bookId: number; book: Book }) {
  const { toast } = useToast();
  const { handleAiError } = useAiError();
  const [selectedModel, setSelectedModel] = useState<AuthorRoleModel | null>(null);
  const [analyzing, setAnalyzing] = useState<number | null>(null);
  const [openSection, setOpenSection] = useState<string | null>("stylePatterns");
  const [showCreate, setShowCreate] = useState(false);

  const { data: models = [] } = useQuery<AuthorRoleModel[]>({
    queryKey: ["/api/books", bookId, "role-models"],
    queryFn: () => apiRequest("GET", `/api/books/${bookId}/role-models`),
  });

  const deepAnalyzeMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/role-models/${id}/deep-analyze`, {
      lang: "ru", bookTitle: book.title, bookMode: book.mode,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "role-models"] });
      setAnalyzing(null);
      toast({ title: "Анализ завершён" });
    },
    onError: (e: any) => {
      setAnalyzing(null);
      if (!handleAiError(e)) toast({ title: "Ошибка анализа", variant: "destructive" });
    },
  });

  const analyzed = models.filter(m => m.analysisStatus === "analyzed");
  const notAnalyzed = models.filter(m => m.analysisStatus !== "analyzed");

  return (
    <>
      <CreateRoleModelDialog open={showCreate} onClose={() => setShowCreate(false)} bookId={bookId} book={book} />
      <div className="rounded-2xl border border-border/50 bg-background/80 p-6 shadow-sm">
        <SectionHeader
          icon={Brain} color="#8B5CF6"
          title="Ролевые Модели"
          description="Изучите стиль авторов-ориентиров — нажмите на карточку для полного анализа"
          action={() => setShowCreate(true)}
          actionLabel="Добавить"
          actionIcon={Plus}
        />

        {models.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(139,92,246,0.1)" }}>
              <Brain className="h-6 w-6" style={{ color: "#8B5CF6" }} />
            </div>
            <p className="text-sm text-muted-foreground">Добавьте автора-ориентира для анализа стиля</p>
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #8B5CF6, #6366F1)" }}>
              <Plus className="h-4 w-4" /> Добавить ролевую модель
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {models.map(model => {
              const isAnalyzed = model.analysisStatus === "analyzed";
              const color = model.avatarColor || "#8B5CF6";
              return (
                <button
                  key={model.id}
                  onClick={() => setSelectedModel(model)}
                  className="text-left p-4 rounded-xl border border-border/50 hover:border-violet-300/50 hover:shadow-md transition-all group"
                  style={{ background: `${color}06` }}
                >
                  {/* Avatar + name */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                      style={{ background: `linear-gradient(135deg, ${color}, ${color}99)` }}>
                      {getInitials(model.name || model.authorName || "?")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate leading-tight">{model.name}</p>
                      {model.authorName && <p className="text-xs text-muted-foreground truncate">{model.authorName}</p>}
                    </div>
                  </div>
                  {/* Status */}
                  {isAnalyzed ? (
                    <div className="space-y-2">
                      {model.stylePatterns && (
                        <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                          {model.stylePatterns.slice(0, 100)}…
                        </p>
                      )}
                      <div className="flex items-center gap-1.5">
                        <div className="h-1 flex-1 rounded-full overflow-hidden bg-muted/40">
                          <div className="h-full rounded-full transition-all" style={{ width: `${model.influencePercent || 0}%`, background: color }} />
                        </div>
                        <span className="text-[10px] font-semibold" style={{ color }}>{model.influencePercent || 0}%</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        <span className="text-[10px] text-green-600 font-medium">Проанализирован</span>
                        <span className="ml-auto text-[10px] text-violet-500 group-hover:underline">Открыть →</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground">Не проанализирован</span>
                      <button
                        onClick={e => { e.stopPropagation(); setAnalyzing(model.id); deepAnalyzeMutation.mutate(model.id); }}
                        disabled={analyzing === model.id || deepAnalyzeMutation.isPending}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all"
                        style={{ background: `${color}15`, color }}>
                        {analyzing === model.id
                          ? <Loader2 className="h-3 w-3 animate-spin" />
                          : <Wand2 className="h-3 w-3" />}
                        Анализ
                      </button>
                    </div>
                  )}
                </button>
              );
            })}
            {/* Add more tile */}
            <button
              onClick={() => setShowCreate(true)}
              className="p-4 rounded-xl border-2 border-dashed border-border/40 hover:border-violet-300/50 hover:bg-violet-50/20 dark:hover:bg-violet-950/10 transition-all flex flex-col items-center justify-center gap-2 text-muted-foreground/40 hover:text-violet-400"
            >
              <Plus className="h-5 w-5" />
              <span className="text-[11px] font-medium">Добавить</span>
            </button>
          </div>
        )}
      </div>

      {/* Role Model Popup */}
      <Dialog open={!!selectedModel} onOpenChange={open => !open && setSelectedModel(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0">
          {selectedModel && (
            <>
              {/* Modal header */}
              <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50 px-6 py-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${selectedModel.avatarColor || "#8B5CF6"}, ${selectedModel.avatarColor || "#8B5CF6"}99)` }}>
                  {getInitials(selectedModel.name || selectedModel.authorName || "?")}
                </div>
                <div>
                  <h2 className="font-bold text-lg leading-tight">{selectedModel.name}</h2>
                  {selectedModel.authorName && (
                    <p className="text-sm text-muted-foreground">{selectedModel.authorName}</p>
                  )}
                </div>
                <div className="ml-auto flex items-center gap-2">
                  {selectedModel.analysisStatus === "analyzed" && (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-50 dark:bg-green-950/30 text-green-600 border border-green-200/40">
                      <CheckCircle2 className="h-3 w-3" />Проанализирован
                    </div>
                  )}
                  <button onClick={() => setSelectedModel(null)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {/* If not analyzed */}
                {selectedModel.analysisStatus !== "analyzed" && (
                  <div className="p-4 rounded-xl bg-muted/30 border border-dashed border-border text-center">
                    <p className="text-sm text-muted-foreground mb-3">Анализ ещё не проведён. Запустите глубокий анализ чтобы получить полный стилистический профиль.</p>
                    <button
                      onClick={() => { setAnalyzing(selectedModel.id); deepAnalyzeMutation.mutate(selectedModel.id); }}
                      disabled={analyzing === selectedModel.id}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white mx-auto"
                      style={{ background: "linear-gradient(135deg, #8B5CF6, #6366F1)" }}>
                      {analyzing === selectedModel.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      Запустить анализ
                    </button>
                  </div>
                )}

                {/* Style instruction */}
                {selectedModel.styleInstruction && (
                  <div className="p-4 rounded-xl border border-violet-200/40 bg-violet-50/30 dark:bg-violet-950/15">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-4 w-4 text-violet-500" />
                      <p className="text-xs font-bold uppercase tracking-wider text-violet-600">ИИ-промпт стиля</p>
                    </div>
                    <p className="text-sm italic text-violet-700/80 dark:text-violet-300/70 leading-relaxed whitespace-pre-wrap">
                      "{selectedModel.styleInstruction}"
                    </p>
                  </div>
                )}

                {/* Analysis sections */}
                {ROLE_MODEL_ANALYSIS_SECTIONS.map(sec => {
                  const value = (selectedModel as any)[sec.key] as string | undefined;
                  if (!value) return null;
                  const SIcon = sec.icon;
                  const isOpen = openSection === sec.key;
                  return (
                    <div key={sec.key} className="rounded-xl border border-border/50 overflow-hidden">
                      <button
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors text-left"
                        onClick={() => setOpenSection(isOpen ? null : sec.key)}
                      >
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${sec.color}12` }}>
                          <SIcon className="h-3.5 w-3.5" style={{ color: sec.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold">{sec.label}</p>
                          {!isOpen && <p className="text-[11px] text-muted-foreground truncate mt-0.5">{value.slice(0, 80)}</p>}
                        </div>
                        {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />}
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 border-t border-border/30">
                          <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap mt-3">{value}</p>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Raw source */}
                {selectedModel.rawSourceText && (
                  <div className="rounded-xl border border-border/50 overflow-hidden">
                    <button
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors text-left"
                      onClick={() => setOpenSection(openSection === "__raw" ? null : "__raw")}
                    >
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-muted/40">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-semibold flex-1">Исходный текст</p>
                      {openSection === "__raw" ? <ChevronUp className="h-4 w-4 text-muted-foreground/50" /> : <ChevronDown className="h-4 w-4 text-muted-foreground/50" />}
                    </button>
                    {openSection === "__raw" && (
                      <div className="px-4 pb-4 border-t border-border/30">
                        <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap mt-3 font-mono">{selectedModel.rawSourceText.slice(0, 2000)}{selectedModel.rawSourceText.length > 2000 ? "…" : ""}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Draft Card ──────────────────────────────────────────────────────────────

function DraftCard({ draft, chapters, onClick, onDelete }: {
  draft: Draft; chapters: Chapter[];
  onClick: () => void; onDelete: () => void;
}) {
  const linkedChapter = chapters.find(c => c.id === draft.linkedChapterId);
  const preview = draft.content
    ? (() => {
        try {
          const parsed = JSON.parse(draft.content);
          if (Array.isArray(parsed)) return parsed.map((b: any) => b.content).filter(Boolean).join(" ").slice(0, 120);
        } catch {}
        return draft.content.slice(0, 120);
      })()
    : "";

  return (
    <div
      className="group p-4 rounded-xl border border-border/50 bg-background hover:border-violet-300/40 hover:shadow-sm transition-all cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <FileEdit className="h-4 w-4 text-muted-foreground/60 flex-shrink-0" />
          <p className="font-semibold text-sm truncate">{draft.title}</p>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/40 hover:text-red-400 flex-shrink-0"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      {preview && (
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-2">{preview}</p>
      )}
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground/60">
        {linkedChapter && (
          <div className="flex items-center gap-1">
            <Link2 className="h-3 w-3" />
            <span className="truncate max-w-[100px]">{linkedChapter.title}</span>
          </div>
        )}
        {(draft.wordCount || 0) > 0 && (
          <div className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            <span>{draft.wordCount} сл.</span>
          </div>
        )}
        <span className="ml-auto">{draft.updatedAt ? format(new Date(draft.updatedAt), "d MMM") : ""}</span>
      </div>
    </div>
  );
}

// ─── Drafts Section ──────────────────────────────────────────────────────────

function DraftsSection({ bookId, book, onOpenDraft }: {
  bookId: number; book: Book;
  onOpenDraft: (draft: Draft | null) => void;
}) {
  const { toast } = useToast();

  const { data: drafts = [] } = useQuery<Draft[]>({
    queryKey: ["/api/books", bookId, "drafts"],
    queryFn: () => apiRequest("GET", `/api/books/${bookId}/drafts`),
  });

  const { data: chapters = [] } = useQuery<Chapter[]>({
    queryKey: ["/api/books", bookId, "chapters"],
    queryFn: () => apiRequest("GET", `/api/books/${bookId}/chapters`),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/api/books/${bookId}/drafts`, data),
    onSuccess: (d: Draft) => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "drafts"] });
      onOpenDraft(d);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/drafts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "drafts"] });
      toast({ title: "Черновик удалён" });
    },
  });

  const activeDrafts = drafts.filter(d => d.status !== "archived");

  return (
    <div className="rounded-2xl border border-border/50 bg-background/80 p-6 shadow-sm">
      <SectionHeader
        icon={FileEdit} color="#F96D1C"
        title="Черновики"
        description="Пишите черновики свободно — без вёрстки. Готовый текст переносится в книгу одной кнопкой"
        action={() => createMutation.mutate({ title: "Новый черновик", content: "" })}
        actionLabel="Новый"
        actionIcon={Plus}
      />

      {activeDrafts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(249,109,28,0.1)" }}>
            <FileEdit className="h-6 w-6" style={{ color: "#F96D1C" }} />
          </div>
          <p className="text-sm text-muted-foreground">Создайте первый черновик для свободного письма</p>
          <button
            onClick={() => createMutation.mutate({ title: "Новый черновик", content: "" })}
            disabled={createMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg, #F96D1C, #FB923C)" }}>
            <Plus className="h-4 w-4" /> Создать черновик
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {activeDrafts.slice(0, 5).map(d => (
            <DraftCard
              key={d.id}
              draft={d}
              chapters={chapters}
              onClick={() => onOpenDraft(d)}
              onDelete={() => deleteMutation.mutate(d.id)}
            />
          ))}
          {activeDrafts.length > 5 && (
            <button className="w-full py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground border border-dashed border-border/40 hover:border-border transition-colors">
              Ещё {activeDrafts.length - 5} черновиков…
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Draft Editor ────────────────────────────────────────────────────────────

function DraftEditor({ draft, bookId, book, chapters, onBack }: {
  draft: Draft; bookId: number; book: Book; chapters: Chapter[]; onBack: () => void;
}) {
  const { toast } = useToast();
  const { handleAiError } = useAiError();
  const { lang } = useLang();
  const [title, setTitle] = useState(draft.title);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [linkedChapterId, setLinkedChapterId] = useState<number | null>(draft.linkedChapterId ?? null);
  const [wordCount, setWordCount] = useState(draft.wordCount || 0);
  const [isDirty, setIsDirty] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moveMode, setMoveMode] = useState<"append" | "new">("new");
  const [moveTargetChapterId, setMoveTargetChapterId] = useState<number | null>(null);
  const [moving, setMoving] = useState(false);
  const [aiTip, setAiTip] = useState("");
  const [tipLoading, setTipLoading] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const [fontScale, setFontScaleRaw] = useState<number>(() => {
    try { const v = Number(localStorage.getItem("moodra_editorFontScale")); return v >= 70 && v <= 160 ? v : 100; } catch { return 100; }
  });
  const [maxWidth, setMaxWidthRaw] = useState<number>(() => {
    try { const v = Number(localStorage.getItem("moodra_editorMaxWidth")); return v >= 480 && v <= 1010 ? v : 768; } catch { return 768; }
  });
  const setFontScale = (u: number | ((v: number) => number)) => setFontScaleRaw(prev => { const n = typeof u === "function" ? u(prev) : u; try { localStorage.setItem("moodra_editorFontScale", String(n)); } catch {} return n; });
  const setMaxWidth = (u: number | ((v: number) => number)) => setMaxWidthRaw(prev => { const n = typeof u === "function" ? u(prev) : u; try { localStorage.setItem("moodra_editorMaxWidth", String(n)); } catch {} return n; });

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", `/api/drafts/${draft.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "drafts"] });
      setIsDirty(false);
    },
  });

  const save = useCallback(() => {
    const plainText = blocksToPlainText(blocks);
    const wc = plainText.trim().split(/\s+/).filter(Boolean).length;
    setWordCount(wc);
    updateMutation.mutate({
      title,
      content: JSON.stringify(blocks),
      wordCount: wc,
      linkedChapterId: linkedChapterId ?? null,
    });
  }, [blocks, title, linkedChapterId]);

  useEffect(() => {
    if (isDirty) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(save, 2000);
    }
    return () => clearTimeout(saveTimerRef.current);
  }, [isDirty, save]);

  const getReadingTime = () => {
    const mins = Math.ceil(wordCount / 200);
    return mins < 1 ? "< 1 мин" : `${mins} мин`;
  };

  const handleGetAiTip = async () => {
    const text = blocksToPlainText(blocks);
    if (!text.trim()) return;
    setTipLoading(true);
    try {
      const data = await apiRequest("POST", "/api/ai/improve", {
        text: text.slice(0, 1000),
        mode: "advice",
        bookTitle: book.title,
        bookMode: book.mode,
        lang,
        customInstruction: "Give one short, concrete writing tip for this draft. Max 2 sentences.",
      });
      setAiTip(data.improved || data.text || "");
    } catch (e: any) {
      if (!handleAiError(e)) toast({ title: "Ошибка AI", variant: "destructive" });
    } finally {
      setTipLoading(false);
    }
  };

  const handleMoveToChapter = async () => {
    if (!moveMode) return;
    setMoving(true);
    try {
      const draftContent = JSON.stringify(blocks);
      if (moveMode === "new") {
        await apiRequest("POST", `/api/books/${bookId}/chapters`, {
          title,
          content: draftContent,
          bookId,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "chapters"] });
        toast({ title: "Создана новая глава в редакторе" });
      } else if (moveMode === "append" && moveTargetChapterId) {
        const ch = chapters.find(c => c.id === moveTargetChapterId);
        if (ch) {
          let existingBlocks: Block[] = [];
          try {
            const parsed = JSON.parse(ch.content || "[]");
            if (Array.isArray(parsed)) existingBlocks = parsed;
          } catch {}
          const merged = [...existingBlocks, ...blocks];
          await apiRequest("PATCH", `/api/chapters/${moveTargetChapterId}`, {
            content: JSON.stringify(merged),
          });
          queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "chapters"] });
          toast({ title: "Текст добавлен в главу" });
        }
      }
      setShowMoveModal(false);
    } catch (e: any) {
      toast({ title: "Ошибка переноса", variant: "destructive" });
    } finally {
      setMoving(false);
    }
  };

  const readingTime = getReadingTime();

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Draft editor header */}
      <div className="flex-shrink-0 border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => { if (isDirty) save(); onBack(); }}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Черновики
          </button>
          <span className="text-muted-foreground/30">·</span>

          {/* Title inline edit */}
          <input
            value={title}
            onChange={e => { setTitle(e.target.value); setIsDirty(true); }}
            className="flex-1 text-sm font-semibold bg-transparent outline-none focus:ring-0 border-0 placeholder:text-muted-foreground/40 min-w-0"
            placeholder="Название черновика…"
          />

          {/* Stats */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground/60 flex-shrink-0">
            <span>{wordCount} сл.</span>
            <span>·</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{readingTime}</span>
            {isDirty && <span className="text-amber-500">●</span>}
            {updateMutation.isPending && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
          </div>

          {/* Chapter link */}
          <Select
            value={linkedChapterId ? String(linkedChapterId) : "none"}
            onValueChange={v => { setLinkedChapterId(v === "none" ? null : Number(v)); setIsDirty(true); }}
          >
            <SelectTrigger className="w-40 h-7 text-xs rounded-lg border-border/50 bg-secondary/50 [&>span]:truncate">
              <Link2 className="h-3 w-3 mr-1 flex-shrink-0 text-muted-foreground/60" />
              <SelectValue placeholder="Привязать главу" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Без главы</SelectItem>
              {chapters.map(c => (
                <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowMoveModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #F96D1C, #FB923C)" }}>
              <SendToBack className="h-3.5 w-3.5" />
              В книгу
            </button>
            <button
              onClick={save}
              disabled={!isDirty || updateMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border border-border/50 hover:bg-secondary disabled:opacity-40">
              <Save className="h-3.5 w-3.5" />
              Сохранить
            </button>
          </div>
        </div>
      </div>

      {/* Toolbar row — font scale + max width */}
      <div className="flex-shrink-0 border-b border-border/30 px-4 py-2 flex items-center gap-3 bg-background/60">
        <div className="flex items-center gap-0.5">
          <button onClick={() => setFontScale(v => Math.max(70, v - 5))} className="h-6 w-6 flex items-center justify-center rounded hover:bg-accent/60 text-muted-foreground hover:text-foreground transition-colors text-xs font-bold">A<sup className="text-[7px]">–</sup></button>
          <button onClick={() => setFontScale(100)} className="text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors w-8 text-center tabular-nums">{fontScale}%</button>
          <button onClick={() => setFontScale(v => Math.min(160, v + 5))} className="h-6 w-6 flex items-center justify-center rounded hover:bg-accent/60 text-muted-foreground hover:text-foreground transition-colors text-xs font-bold">A<sup className="text-[7px]">+</sup></button>
        </div>
        <div className="w-px h-4 bg-border/60" />
        <div className="flex items-center gap-0.5">
          <button onClick={() => setMaxWidth(v => Math.max(480, v - 60))} className="h-6 w-6 flex items-center justify-center rounded hover:bg-accent/60 text-muted-foreground hover:text-foreground transition-colors"><Minus className="h-3 w-3" /></button>
          <button onClick={() => setMaxWidth(768)} className="flex items-center gap-0.5 text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"><ChevronsLeftRight className="h-3 w-3" /><span className="tabular-nums w-8 text-center">{maxWidth}</span></button>
          <button onClick={() => setMaxWidth(v => Math.min(1010, v + 60))} className="h-6 w-6 flex items-center justify-center rounded hover:bg-accent/60 text-muted-foreground hover:text-foreground transition-colors"><Plus className="h-3 w-3" /></button>
        </div>
      </div>

      {/* AI tip bar */}
      {aiTip && (
        <div className="flex-shrink-0 flex items-start gap-2.5 px-5 py-2.5 bg-amber-50/60 dark:bg-amber-950/20 border-b border-amber-200/30">
          <Lightbulb className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700/80 dark:text-amber-300/70 leading-relaxed flex-1">{aiTip}</p>
          <button onClick={() => setAiTip("")} className="text-muted-foreground/40 hover:text-muted-foreground"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}

      {/* Block editor */}
      <div className="flex-1 overflow-hidden" style={{ zoom: fontScale / 100 }}>
        <div style={{ maxWidth, margin: "0 auto" }}>
          <BlockEditor
            key={draft.id}
            initialContent={draft.content || ""}
            onChange={newBlocks => { setBlocks(newBlocks); setIsDirty(true); }}
          />
        </div>
      </div>

      {/* Bottom bar */}
      <div className="flex-shrink-0 border-t border-border/30 px-5 py-2 flex items-center gap-4 bg-background/50">
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground/50">
          <span>{wordCount} слов</span>
          <span>·</span>
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{readingTime} чтения</span>
        </div>
        <button
          onClick={handleGetAiTip}
          disabled={tipLoading || wordCount === 0}
          className="ml-auto flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground/60 hover:text-amber-500 transition-colors disabled:opacity-40">
          {tipLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
          Совет ИИ
        </button>
      </div>

      {/* Move to chapter modal */}
      {showMoveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowMoveModal(false)}>
          <div className="bg-background rounded-2xl border border-border shadow-2xl w-full max-w-md p-6 mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(249,109,28,0.1)" }}>
                <SendToBack className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-base">Перенести в книгу</h3>
                <p className="text-xs text-muted-foreground">Текст черновика станет частью основного редактора</p>
              </div>
              <button onClick={() => setShowMoveModal(false)} className="ml-auto text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>

            <div className="space-y-3 mb-5">
              {/* New chapter option */}
              <button
                className={cn("w-full p-4 rounded-xl border-2 text-left transition-all", moveMode === "new" ? "border-primary bg-primary/5" : "border-border/50 hover:border-border")}
                onClick={() => setMoveMode("new")}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10">
                    <Plus className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Создать новую главу</p>
                    <p className="text-xs text-muted-foreground">Черновик станет новой главой в редакторе</p>
                  </div>
                  {moveMode === "new" && <CheckCircle2 className="h-4 w-4 text-primary ml-auto flex-shrink-0" />}
                </div>
              </button>

              {/* Append to chapter option */}
              <button
                className={cn("w-full p-4 rounded-xl border-2 text-left transition-all", moveMode === "append" ? "border-primary bg-primary/5" : "border-border/50 hover:border-border")}
                onClick={() => setMoveMode("append")}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10">
                    <GitBranch className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">Добавить в существующую главу</p>
                    <p className="text-xs text-muted-foreground">Текст добавляется в конец выбранной главы</p>
                  </div>
                  {moveMode === "append" && <CheckCircle2 className="h-4 w-4 text-primary ml-auto flex-shrink-0" />}
                </div>
              </button>

              {moveMode === "append" && (
                <Select value={moveTargetChapterId ? String(moveTargetChapterId) : ""} onValueChange={v => setMoveTargetChapterId(Number(v))}>
                  <SelectTrigger className="w-full rounded-xl h-10 text-sm">
                    <SelectValue placeholder="Выберите главу…" />
                  </SelectTrigger>
                  <SelectContent>
                    {chapters.map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="flex gap-2">
              <button onClick={() => setShowMoveModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-colors">
                Отмена
              </button>
              <button
                onClick={handleMoveToChapter}
                disabled={moving || (moveMode === "append" && !moveTargetChapterId)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #F96D1C, #FB923C)" }}>
                {moving ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendToBack className="h-4 w-4" />}
                Перенести
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Role Models Editor redirect ─────────────────────────────────────────────
// (Kept for the "Add model" button — opens the full role-models-tab)

// ─── Main Workspace ───────────────────────────────────────────────────────────

export function ResearchWorkspace({ bookId, book }: { bookId: number; book: Book }) {
  const [view, setView] = useState<"workspace" | "draft-editor">("workspace");
  const [activeDraft, setActiveDraft] = useState<Draft | null>(null);

  const { data: chapters = [] } = useQuery<Chapter[]>({
    queryKey: ["/api/books", bookId, "chapters"],
    queryFn: () => apiRequest("GET", `/api/books/${bookId}/chapters`),
  });

  const handleOpenDraft = (draft: Draft | null) => {
    setActiveDraft(draft);
    setView("draft-editor");
  };

  if (view === "draft-editor" && activeDraft) {
    return (
      <DraftEditor
        key={activeDraft.id}
        draft={activeDraft}
        bookId={bookId}
        book={book}
        chapters={chapters}
        onBack={() => { setActiveDraft(null); setView("workspace"); }}
      />
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Workspace header */}
      <div className="px-5 pt-4 pb-3 border-b border-border/30 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.18), rgba(99,102,241,0.1))" }}>
              <Brain className="h-3.5 w-3.5" style={{ color: "#8B5CF6" }} />
            </div>
            <span className="text-sm font-bold tracking-tight">Черновики и ролевые модели</span>
          </div>
          <div className="h-4 w-px bg-border/40" />
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <BookOpen className="h-3 w-3" />
            <span className="truncate max-w-[160px]">{book.title}</span>
          </div>
        </div>
      </div>

      {/* 50 / 50 split — each panel independently scrollable */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Role Models */}
        <div className="flex-1 overflow-y-auto border-r border-border/30 p-4">
          <RoleModelsSection bookId={bookId} book={book} />
        </div>

        {/* Right: Drafts */}
        <div className="flex-1 overflow-y-auto p-4">
          <DraftsSection bookId={bookId} book={book} onOpenDraft={handleOpenDraft} />
        </div>
      </div>
    </div>
  );
}

// Keep old ResearchDashboard name for backward compat during transition
export { ResearchWorkspace as ResearchDashboard };
