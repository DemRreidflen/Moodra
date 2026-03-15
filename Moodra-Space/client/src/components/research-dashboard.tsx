import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAiError } from "@/contexts/ai-error-context";
import { useLang } from "@/contexts/language-context";
import { useFreeMode } from "@/hooks/use-free-mode";
import type { Book, Source, Draft, Chapter } from "@shared/schema";
import type { AuthorRoleModel } from "@shared/schema";
import {
  Search, Sparkles, BookOpen, FileEdit, Brain, Plus, ArrowRight,
  Loader2, ArrowDownToLine, CheckCircle2, Globe, FileText, BookMarked,
  Quote, Microscope, ExternalLink, ChevronDown, ChevronUp, X, Zap,
  Feather, Layers, Music2, Hash, Target, Heart, Wrench, AlignLeft, Eye,
  Save, ArrowLeft, Clock, AlignCenter, BarChart3, Lightbulb, RefreshCw,
  Check, Trash2, Link2, BookCopy, SendToBack, GitBranch, Wand2
} from "lucide-react";
import { BlockEditor, Block, blocksToPlainText } from "@/components/block-editor";
import { RoleModelsTab } from "@/components/role-models-tab";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AISuggestedSource {
  title: string; author: string; url?: string;
  type: string; quote?: string; notes: string; relevance?: string;
}
interface AIResearchResult { advice?: string; sources: AISuggestedSource[]; }

// ─── Source type config ──────────────────────────────────────────────────────

const SOURCE_CFG: Record<string, { icon: any; color: string; label: string }> = {
  book:             { icon: BookOpen,   color: "#6366F1", label: "Book" },
  article:          { icon: FileText,   color: "#3B82F6", label: "Article" },
  website:          { icon: Globe,      color: "#10B981", label: "Web" },
  research:         { icon: Microscope, color: "#8B5CF6", label: "Research" },
  quote:            { icon: Quote,      color: "#F59E0B", label: "Quote" },
  book_excerpt:     { icon: BookMarked, color: "#0D9488", label: "Excerpt" },
};

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

// ─── AI Source Finder ────────────────────────────────────────────────────────

function AiSourceFinder({ bookId, book, sources }: { bookId: number; book: Book; sources: Source[] }) {
  const { toast } = useToast();
  const { lang } = useLang();
  const { handleAiError } = useAiError();
  const { isFreeMode } = useFreeMode();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIResearchResult | null>(null);
  const [addedTitles, setAddedTitles] = useState<Set<string>>(new Set());
  const [addingId, setAddingId] = useState<string | null>(null);
  const [showAdvice, setShowAdvice] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

  const QUICK_CHIPS = book.mode === "fiction"
    ? ["Психология персонажей", "Атмосфера и сеттинг", "Техники диалога", "Историческая достоверность"]
    : ["Актуальные исследования", "Классические труды", "Статистика и данные", "Методология"];

  const handleSearch = async (q?: string) => {
    const finalQuery = q || query;
    if (!finalQuery.trim()) return;
    setLoading(true);
    setResult(null);
    setShowAdvice(false);
    setAddedTitles(new Set());
    try {
      const data = await apiRequest("POST", "/api/ai/research", {
        query: finalQuery.trim(),
        bookTitle: book.title,
        bookMode: book.mode,
        existingSources: sources,
        lang,
      });
      setResult(data);
      setShowAdvice(true);
    } catch (e: any) {
      if (!handleAiError(e)) toast({ title: "Ошибка AI запроса", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const addSourceMutation = useMutation({
    mutationFn: (s: AISuggestedSource) =>
      apiRequest("POST", `/api/books/${bookId}/sources`, {
        title: s.title, author: s.author, url: s.url || "",
        quote: s.quote || "", notes: s.notes, type: s.type,
      }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "sources"] });
      setAddedTitles(prev => new Set([...prev, vars.title]));
      setAddingId(null);
      toast({ title: "Источник сохранён в библиотеку" });
    },
    onError: () => { setAddingId(null); toast({ title: "Ошибка сохранения", variant: "destructive" }); },
  });

  const sourceCfg = (type: string) => SOURCE_CFG[type] || { icon: FileText, color: "#6B7280", label: type };

  return (
    <div className="rounded-2xl border border-border/50 bg-background/80 p-6 shadow-sm">
      <SectionHeader
        icon={Search} color="#3B82F6"
        title="ИИ Поиск Ресурсов"
        description="Контекстный поиск — ИИ знает о вашей книге и подбирает релевантные материалы"
      />

      {/* Context chip */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-200/40">
          <BookOpen className="h-3 w-3" />
          {book.title}
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-muted/60 text-muted-foreground border border-border/40">
          <Sparkles className="h-3 w-3" />
          {book.mode === "fiction" ? "Художественная" : "Научная"} литература
        </div>
      </div>

      {/* Quick chips */}
      <div className="flex flex-wrap gap-2 mb-3">
        {QUICK_CHIPS.map(chip => (
          <button key={chip} onClick={() => { setQuery(chip); handleSearch(chip); }}
            className="px-3 py-1 rounded-full text-xs font-medium bg-secondary hover:bg-primary/10 hover:text-primary border border-border/50 hover:border-primary/30 transition-all">
            {chip}
          </button>
        ))}
      </div>

      {/* Search input */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 pointer-events-none" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder="Опишите тему, идею или вопрос для исследования…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/10 transition-all"
          />
        </div>
        <button onClick={() => handleSearch()}
          disabled={!query.trim() || loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #3B82F6, #6366F1)" }}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          {loading ? "Ищу…" : "Найти"}
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="mt-6 flex flex-col items-center gap-3 py-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(59,130,246,0.1)" }}>
            <Sparkles className="h-6 w-6 text-blue-500 animate-pulse" />
          </div>
          <p className="text-sm text-muted-foreground text-center">ИИ анализирует контекст вашей книги и ищет ресурсы…</p>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="mt-5 space-y-3">
          {/* Strategy advice */}
          {result.advice && showAdvice && (
            <div className="p-4 rounded-xl border border-blue-200/30 bg-blue-50/50 dark:bg-blue-950/20">
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(59,130,246,0.12)" }}>
                  <Lightbulb className="h-3.5 w-3.5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-blue-600 mb-1">Стратегия исследования</p>
                  <p className="text-xs text-blue-700/80 dark:text-blue-300/70 leading-relaxed">{result.advice}</p>
                </div>
                <button onClick={() => setShowAdvice(false)} className="ml-auto text-muted-foreground/40 hover:text-muted-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Divider + count */}
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {result.sources.length} источников найдено
            </p>
            {result.sources.some(s => !addedTitles.has(s.title)) && (
              <button
                onClick={() => result.sources.forEach(s => { if (!addedTitles.has(s.title)) addSourceMutation.mutate(s); })}
                className="text-xs font-medium text-blue-500 hover:text-blue-600 flex items-center gap-1">
                <ArrowDownToLine className="h-3 w-3" /> Добавить все
              </button>
            )}
          </div>

          {/* Source cards */}
          <div className="space-y-2">
            {result.sources.map((src, i) => {
              const cfg = sourceCfg(src.type);
              const Icon = cfg.icon;
              const isAdded = addedTitles.has(src.title);
              const isExpanded = expandedCards.has(i);
              return (
                <div key={i} className={cn(
                  "rounded-xl border transition-all overflow-hidden",
                  isAdded ? "border-green-400/30 bg-green-50/40 dark:bg-green-950/20" : "border-border/50 bg-background hover:border-blue-300/40 hover:shadow-sm"
                )}>
                  <div className="flex items-start gap-3 p-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${cfg.color}12` }}>
                      <Icon className="h-4 w-4" style={{ color: cfg.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold leading-tight">{src.title}</p>
                          {src.author && <p className="text-xs text-muted-foreground mt-0.5">{src.author}</p>}
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0"
                          style={{ background: `${cfg.color}15`, color: cfg.color }}>
                          {cfg.label}
                        </span>
                      </div>
                      {src.notes && (
                        <p className={cn("text-xs text-muted-foreground mt-1.5 leading-relaxed", !isExpanded && "line-clamp-2")}>
                          {src.notes}
                        </p>
                      )}
                      {src.notes && src.notes.length > 120 && (
                        <button onClick={() => setExpandedCards(prev => { const s = new Set(prev); s.has(i) ? s.delete(i) : s.add(i); return s; })}
                          className="text-[10px] text-blue-500 mt-0.5 flex items-center gap-0.5">
                          {isExpanded ? <><ChevronUp className="h-3 w-3" />Свернуть</> : <><ChevronDown className="h-3 w-3" />Подробнее</>}
                        </button>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        {src.url && (
                          <a href={src.url} target="_blank" rel="noopener noreferrer"
                            className="text-[11px] text-blue-500 flex items-center gap-0.5 hover:underline">
                            <ExternalLink className="h-3 w-3" />Открыть
                          </a>
                        )}
                        {src.relevance && (
                          <span className="text-[11px] text-muted-foreground">· {src.relevance}</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => { setAddingId(src.title); addSourceMutation.mutate(src); }}
                      disabled={isAdded || addingId === src.title}
                      className={cn(
                        "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all flex-shrink-0",
                        isAdded
                          ? "bg-green-100 dark:bg-green-950/40 text-green-600"
                          : "bg-blue-50 dark:bg-blue-950/30 text-blue-600 hover:bg-blue-100"
                      )}>
                      {addingId === src.title ? <Loader2 className="h-3 w-3 animate-spin" /> :
                       isAdded ? <Check className="h-3 w-3" /> : <ArrowDownToLine className="h-3 w-3" />}
                      {isAdded ? "Сохранено" : "Сохранить"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Role Models Section ─────────────────────────────────────────────────────

function RoleModelsSection({
  bookId, book, onOpenEditor,
}: { bookId: number; book: Book; onOpenEditor: () => void }) {
  const { toast } = useToast();
  const { handleAiError } = useAiError();
  const [selectedModel, setSelectedModel] = useState<AuthorRoleModel | null>(null);
  const [analyzing, setAnalyzing] = useState<number | null>(null);
  const [openSection, setOpenSection] = useState<string | null>("stylePatterns");

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
      <div className="rounded-2xl border border-border/50 bg-background/80 p-6 shadow-sm">
        <SectionHeader
          icon={Brain} color="#8B5CF6"
          title="Ролевые Модели"
          description="Изучите стиль авторов-ориентиров — нажмите на карточку для полного анализа"
          action={onOpenEditor}
          actionLabel="Добавить"
          actionIcon={Plus}
        />

        {models.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(139,92,246,0.1)" }}>
              <Brain className="h-6 w-6" style={{ color: "#8B5CF6" }} />
            </div>
            <p className="text-sm text-muted-foreground">Добавьте автора-ориентира для анализа стиля</p>
            <button onClick={onOpenEditor}
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
              onClick={onOpenEditor}
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

      {/* AI tip bar */}
      {aiTip && (
        <div className="flex-shrink-0 flex items-start gap-2.5 px-5 py-2.5 bg-amber-50/60 dark:bg-amber-950/20 border-b border-amber-200/30">
          <Lightbulb className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700/80 dark:text-amber-300/70 leading-relaxed flex-1">{aiTip}</p>
          <button onClick={() => setAiTip("")} className="text-muted-foreground/40 hover:text-muted-foreground"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}

      {/* Block editor */}
      <div className="flex-1 overflow-hidden">
        <BlockEditor
          key={draft.id}
          initialContent={draft.content || ""}
          onChange={newBlocks => { setBlocks(newBlocks); setIsDirty(true); }}
        />
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
  const [view, setView] = useState<"workspace" | "draft-editor" | "models-editor">("workspace");
  const [activeDraft, setActiveDraft] = useState<Draft | null>(null);

  const { data: sources = [] } = useQuery<Source[]>({
    queryKey: ["/api/books", bookId, "sources"],
    queryFn: () => apiRequest("GET", `/api/books/${bookId}/sources`),
  });

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

  if (view === "models-editor") {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-shrink-0 border-b border-border/30 px-4 py-3">
          <button onClick={() => setView("workspace")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Research Studio
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <RoleModelsTab bookId={bookId} book={book} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* Workspace header */}
      <div className="px-6 pt-6 pb-4 border-b border-border/30 flex-shrink-0">
        <div className="flex items-center gap-3 mb-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, rgba(249,109,28,0.2), rgba(249,109,28,0.1))" }}>
              <Sparkles className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-lg font-bold tracking-tight">Research Studio</span>
          </div>
          <div className="h-5 w-px bg-border/40" />
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <BookOpen className="h-3 w-3" />
            <span className="truncate max-w-[200px]">{book.title}</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground/70">Исследовательская платформа — поиск ресурсов, черновики, анализ стиля</p>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* AI Source Finder — full width */}
        <AiSourceFinder bookId={bookId} book={book} sources={sources} />

        {/* Role Models + Drafts — side by side */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <RoleModelsSection
            bookId={bookId}
            book={book}
            onOpenEditor={() => setView("models-editor")}
          />
          <DraftsSection
            bookId={bookId}
            book={book}
            onOpenDraft={handleOpenDraft}
          />
        </div>
      </div>
    </div>
  );
}

// Keep old ResearchDashboard name for backward compat during transition
export { ResearchWorkspace as ResearchDashboard };
