import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAiError } from "@/contexts/ai-error-context";
import { useLang } from "@/contexts/language-context";
import type { Book, Source } from "@shared/schema";
import {
  Search, Sparkles, BookOpen, StickyNote, FlaskConical,
  FileEdit, Brain, Network, Plus, ArrowRight, Loader2,
  ArrowDownToLine, CheckCircle2, Lightbulb, ChevronDown,
  ChevronUp, Globe, FileText, BookMarked, Quote, Microscope,
  X, Layers, Zap, TrendingUp, Database
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────

interface AISuggestedSource {
  title: string; author: string; url?: string;
  type: string; quote?: string; notes: string;
}
interface AIResearchResult { advice?: string; sources: AISuggestedSource[]; }
type DashTab = "notes" | "library" | "dashboard" | "hypotheses" | "drafts" | "models";

const CATEGORY_CHIPS = {
  nonfiction: ["Current research", "Classic works", "Statistics & data", "Methodology", "Debates & theory"],
  fiction: ["Character psychology", "Historical context", "Plot techniques", "Atmosphere & setting", "Dialogue"],
};

// ─── Source type config ──────────────────────────────────────────────────────

const SOURCE_TYPES: Record<string, { icon: any; color: string; label: string }> = {
  book:             { icon: BookOpen,   color: "#6366F1", label: "Book" },
  article:          { icon: FileText,   color: "#3B82F6", label: "Article" },
  website:          { icon: Globe,      color: "#10B981", label: "Web" },
  pdf:              { icon: FileText,   color: "#EF4444", label: "PDF" },
  quote:            { icon: Quote,      color: "#F59E0B", label: "Quote" },
  research_snippet: { icon: Microscope, color: "#8B5CF6", label: "Research" },
  book_excerpt:     { icon: BookMarked, color: "#0D9488", label: "Excerpt" },
};

function TypeBadge({ type }: { type: string }) {
  const c = SOURCE_TYPES[type] || { icon: FileText, color: "#6B7280", label: type };
  const Icon = c.icon;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-semibold"
      style={{ background: `${c.color}15`, color: c.color }}>
      <Icon className="h-2.5 w-2.5" />{c.label}
    </span>
  );
}

// ─── Source card (hero library style) ───────────────────────────────────────

function SourceCard({ source }: { source: Source }) {
  const cfg = SOURCE_TYPES[source.type || "book"] || SOURCE_TYPES.book;
  const Icon = cfg.icon;
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-xl border border-border/30 bg-background/70 hover:bg-background hover:border-border/60 hover:shadow-sm transition-all cursor-default group">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `${cfg.color}12` }}>
        <Icon className="h-4 w-4" style={{ color: cfg.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11.5px] font-semibold truncate leading-tight">{source.title}</p>
        {source.author && (
          <p className="text-[10px] text-muted-foreground/55 truncate mt-0.5">{source.author}</p>
        )}
      </div>
      <TypeBadge type={source.type || "book"} />
    </div>
  );
}

// ─── Workspace tile ──────────────────────────────────────────────────────────

function WorkspaceTile({
  icon: Icon, title, description, count, countLabel, color, gradient,
  onClick, cta = "Open",
}: {
  icon: any; title: string; description: string;
  count: number; countLabel: string; color: string; gradient: string;
  onClick: () => void; cta?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="group text-left w-full rounded-2xl border border-border/40 bg-background/80 overflow-hidden hover:border-border hover:shadow-md transition-all duration-200"
    >
      <div className="p-4">
        {/* Icon + arrow */}
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: gradient }}>
            <Icon className="h-5 w-5" style={{ color }} />
          </div>
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-muted-foreground/60 group-hover:translate-x-0.5 transition-all mt-1" />
        </div>
        {/* Title + description */}
        <p className="text-[13px] font-semibold leading-snug mb-1">{title}</p>
        <p className="text-[10.5px] text-muted-foreground/55 leading-relaxed">{description}</p>
        {/* Count + CTA */}
        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border/20">
          <span className="text-[11px] font-semibold" style={{ color }}>
            {count} <span className="text-muted-foreground/40 font-normal">{countLabel}</span>
          </span>
          <span className="text-[10px] font-medium text-muted-foreground/40 group-hover:text-muted-foreground/60 transition-colors">
            {cta} →
          </span>
        </div>
      </div>
      {/* Bottom accent bar */}
      <div className="h-0.5 w-full" style={{ background: gradient, opacity: 0.7 }} />
    </button>
  );
}

// ─── AI search result card ────────────────────────────────────────────────────

function AISourceCard({
  source, added, adding, onAdd,
}: {
  source: AISuggestedSource; added: boolean; adding: boolean;
  onAdd: () => void;
}) {
  return (
    <div className="rounded-xl border border-border/40 bg-background/90 p-3 hover:border-border/70 transition-all">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <TypeBadge type={source.type} />
            <span className="text-[12px] font-semibold leading-tight">{source.title}</span>
          </div>
          {source.author && <p className="text-[10.5px] text-muted-foreground/55 mb-1.5">{source.author}</p>}
          <p className="text-[10.5px] text-muted-foreground/65 line-clamp-2 leading-relaxed">{source.notes}</p>
        </div>
        <button
          onClick={onAdd}
          disabled={added || adding}
          className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-xl transition-all disabled:opacity-50"
          style={{ background: added ? "rgba(16,185,129,0.12)" : "rgba(249,109,28,0.10)" }}
        >
          {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin text-orange-500" />
            : added ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              : <Plus className="h-3.5 w-3.5 text-orange-500" />}
        </button>
      </div>
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────

export function ResearchDashboard({
  bookId, book, sources,
  notesCount, draftsCount, hypothesesCount,
  modelsCount, modelsAnalyzedCount, onNavigate,
}: {
  bookId: number; book: Book; sources: Source[];
  notesCount: number; draftsCount: number; hypothesesCount: number;
  modelsCount: number; modelsAnalyzedCount: number;
  onNavigate: (tab: DashTab) => void;
}) {
  const { toast } = useToast();
  const { handleAiError } = useAiError();
  const { lang } = useLang();

  const [query, setQuery] = useState("");
  const [searchResult, setSearchResult] = useState<AIResearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedTitles, setAddedTitles] = useState<Set<string>>(new Set());
  const [showAdvice, setShowAdvice] = useState(true);
  const [searchFocused, setSearchFocused] = useState(false);

  const chips = book.mode === "fiction" ? CATEGORY_CHIPS.fiction : CATEGORY_CHIPS.nonfiction;
  const recentSources = sources.slice(0, 5);
  const totalNodes = notesCount + sources.length + hypothesesCount;

  const handleSearch = async (q?: string) => {
    const finalQuery = q !== undefined ? q : query;
    if (!finalQuery.trim()) return;
    setSearching(true);
    setSearchResult(null);
    setAddedTitles(new Set());
    try {
      const data = await apiRequest("POST", "/api/ai/research", {
        query: finalQuery.trim(),
        bookTitle: book.title,
        bookMode: book.mode,
        existingSources: sources,
        lang,
      });
      setSearchResult(data);
      setShowAdvice(true);
    } catch (e: any) {
      if (!handleAiError(e)) toast({ title: "Search failed", variant: "destructive" });
    } finally {
      setSearching(false);
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
      setAddedTitles(prev => { const n = new Set(Array.from(prev)); n.add(vars.title); return n; });
      setAddingId(null);
    },
    onError: () => setAddingId(null),
  });

  const addAll = () => {
    if (!searchResult) return;
    const toAdd = searchResult.sources.filter(s => !addedTitles.has(s.title));
    toAdd.forEach(s => {
      apiRequest("POST", `/api/books/${bookId}/sources`, {
        title: s.title, author: s.author, url: s.url || "",
        quote: s.quote || "", notes: s.notes, type: s.type,
      }).then(() => {
        setAddedTitles(prev => { const n = new Set(Array.from(prev)); n.add(s.title); return n; });
        queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "sources"] });
      });
    });
    toast({ title: `${toAdd.length} sources saved to library` });
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* ╔══ HERO HEADER ══════════════════════════════════════════════════╗ */}
      <div className="flex-shrink-0 px-4 pt-4 pb-3"
        style={{
          background: "linear-gradient(160deg, rgba(249,109,28,0.04) 0%, rgba(99,102,241,0.03) 100%)",
          borderBottom: "1px solid rgba(0,0,0,0.04)",
        }}>
        {/* Brand bar */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #F96D1C 0%, #f59e0b 100%)" }}>
            <Database className="h-3 w-3 text-white" />
          </div>
          <div>
            <p className="text-[11px] font-bold tracking-tight leading-none">Research Studio</p>
            <p className="text-[9px] text-muted-foreground/45 mt-0.5 truncate max-w-[180px]">{book.title}</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold"
              style={{ background: "rgba(99,102,241,0.1)", color: "#6366F1" }}>
              {sources.length} sources
            </span>
            <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold"
              style={{ background: "rgba(245,158,11,0.1)", color: "#D97706" }}>
              {notesCount} notes
            </span>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative"
          style={{
            filter: searchFocused ? "drop-shadow(0 0 8px rgba(249,109,28,0.18))" : undefined,
            transition: "filter 0.2s",
          }}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none"
            style={{ color: searchFocused ? "#F96D1C" : "rgba(0,0,0,0.25)" }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Search for sources, topics, references…"
            className="w-full pl-9 pr-16 py-2.5 rounded-xl text-[12px] outline-none transition-all"
            style={{
              background: "rgba(255,255,255,0.85)",
              border: `1.5px solid ${searchFocused ? "rgba(249,109,28,0.4)" : "rgba(0,0,0,0.08)"}`,
              color: "#1a1a1a",
            }}
          />
          <button
            onClick={() => handleSearch()}
            disabled={searching || !query.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, #F96D1C, #f59e0b)", color: "white" }}
          >
            {searching ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            {searching ? "…" : "Find"}
          </button>
        </div>

        {/* Category chips */}
        <div className="flex gap-1.5 mt-2.5 flex-wrap">
          {chips.map(chip => (
            <button key={chip} onClick={() => { setQuery(chip); handleSearch(chip); }}
              disabled={searching}
              className="text-[10px] px-2.5 py-1 rounded-full font-medium transition-all disabled:opacity-40 hover:scale-105"
              style={{
                background: "rgba(255,255,255,0.7)",
                border: "1px solid rgba(0,0,0,0.08)",
                color: "#555",
              }}>
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* ╔══ SCROLLABLE BODY ══════════════════════════════════════════════╗ */}
      <div className="flex-1 overflow-y-auto">

        {/* ── AI Search results ─────────────────────────────────────────── */}
        {(searching || searchResult) && (
          <div className="px-4 py-4 space-y-3">
            {/* Results header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-lg flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #F96D1C, #f59e0b)" }}>
                  <Sparkles className="h-3 w-3 text-white" />
                </div>
                <span className="text-[12px] font-semibold">
                  {searching ? "AI is searching…" : `${searchResult?.sources?.length || 0} sources found`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {searchResult && searchResult.sources.length > 0 && (
                  <button onClick={addAll}
                    className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-lg"
                    style={{ background: "rgba(99,102,241,0.1)", color: "#6366F1" }}>
                    <ArrowDownToLine className="h-3 w-3" /> Add all
                  </button>
                )}
                <button onClick={() => { setSearchResult(null); setQuery(""); }}
                  className="w-6 h-6 flex items-center justify-center rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground/60">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Loading */}
            {searching && (
              <div className="space-y-2.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-16 bg-muted/30 rounded-xl animate-pulse"
                    style={{ animationDelay: `${i * 70}ms` }} />
                ))}
              </div>
            )}

            {/* Strategy advice */}
            {!searching && searchResult?.advice && (
              <div className="rounded-2xl overflow-hidden border"
                style={{ background: "rgba(249,109,28,0.04)", borderColor: "rgba(249,109,28,0.15)" }}>
                <button className="w-full flex items-center gap-2.5 px-4 py-3 text-left"
                  onClick={() => setShowAdvice(!showAdvice)}>
                  <div className="w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(249,109,28,0.12)" }}>
                    <Lightbulb className="h-3 w-3" style={{ color: "#F96D1C" }} />
                  </div>
                  <span className="text-[11.5px] font-semibold flex-1" style={{ color: "#F96D1C" }}>Research strategy</span>
                  {showAdvice
                    ? <ChevronUp className="h-3.5 w-3.5 opacity-50" style={{ color: "#F96D1C" }} />
                    : <ChevronDown className="h-3.5 w-3.5 opacity-50" style={{ color: "#F96D1C" }} />}
                </button>
                {showAdvice && (
                  <div className="px-4 pb-4">
                    <p className="text-[11px] leading-relaxed text-foreground/70 whitespace-pre-line">{searchResult.advice}</p>
                  </div>
                )}
              </div>
            )}

            {/* Source cards */}
            {!searching && searchResult && (
              <div className="space-y-2">
                {searchResult.sources.map((s, i) => (
                  <AISourceCard key={`${s.title}-${i}`} source={s}
                    added={addedTitles.has(s.title)}
                    adding={addingId === s.title}
                    onAdd={() => { setAddingId(s.title); addSourceMutation.mutate(s); }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Main dashboard content ─────────────────────────────────────── */}
        {!searching && !searchResult && (
          <div className="px-4 pt-4 pb-6 space-y-5">

            {/* ── SOURCE LIBRARY ── the hero element ───────────────────── */}
            <section>
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-lg flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)" }}>
                    <Database className="h-3 w-3 text-white" />
                  </div>
                  <p className="text-[12px] font-bold tracking-tight">Source Library</p>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                    style={{ background: "rgba(99,102,241,0.1)", color: "#6366F1" }}>
                    {sources.length}
                  </span>
                </div>
                <button onClick={() => onNavigate("library")}
                  className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-all hover:scale-105"
                  style={{ background: "rgba(99,102,241,0.08)", color: "#6366F1" }}>
                  Open <ArrowRight className="h-3 w-3" />
                </button>
              </div>

              {sources.length > 0 ? (
                <div className="rounded-2xl border overflow-hidden"
                  style={{ borderColor: "rgba(99,102,241,0.15)", background: "rgba(99,102,241,0.02)" }}>
                  {/* Type breakdown bar */}
                  {(() => {
                    const typeCounts: Record<string, number> = {};
                    sources.forEach(s => { typeCounts[s.type || "book"] = (typeCounts[s.type || "book"] || 0) + 1; });
                    const total = sources.length;
                    const entries = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);
                    return (
                      <div className="px-4 pt-3 pb-2 border-b" style={{ borderColor: "rgba(99,102,241,0.08)" }}>
                        <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden mb-2">
                          {entries.map(([type, count]) => {
                            const cfg = SOURCE_TYPES[type] || SOURCE_TYPES.book;
                            return (
                              <div key={type} style={{
                                width: `${(count / total) * 100}%`,
                                background: cfg.color,
                                opacity: 0.65,
                              }} />
                            );
                          })}
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-1">
                          {entries.map(([type, count]) => (
                            <span key={type} className="flex items-center gap-1">
                              <TypeBadge type={type} />
                              <span className="text-[10px] font-semibold text-muted-foreground/50">{count}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                  {/* Source list */}
                  <div className="p-3 space-y-1.5">
                    {recentSources.map(s => <SourceCard key={s.id} source={s} />)}
                    {sources.length > 5 && (
                      <button onClick={() => onNavigate("library")}
                        className="w-full text-center text-[10px] font-medium text-muted-foreground/50 hover:text-muted-foreground py-1.5 transition-colors">
                        +{sources.length - 5} more · View all →
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border-2 border-dashed flex flex-col items-center py-8 text-center"
                  style={{ borderColor: "rgba(99,102,241,0.2)", background: "rgba(99,102,241,0.02)" }}>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                    style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))" }}>
                    <BookOpen className="h-6 w-6 text-indigo-400" />
                  </div>
                  <p className="text-[12px] font-semibold text-foreground/70 mb-1">No sources yet</p>
                  <p className="text-[10.5px] text-muted-foreground/45">Search with AI above or open the Library to add manually</p>
                </div>
              )}
            </section>

            {/* ── AI PANEL ─────────────────────────────────────────────── */}
            <section>
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-5 h-5 rounded-lg flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #F96D1C 0%, #f59e0b 100%)" }}>
                  <Zap className="h-3 w-3 text-white" />
                </div>
                <p className="text-[12px] font-bold tracking-tight">AI Agents</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: Sparkles, label: "Source finder", hint: "Discover relevant references", action: "Current research" },
                  { icon: TrendingUp, label: "Argument map", hint: "Map logical structure", action: "Theories & arguments" },
                  { icon: Layers, label: "Idea extractor", hint: "Pull key insights", action: "Key concepts & ideas" },
                ].map(agent => (
                  <button key={agent.label}
                    onClick={() => { setQuery(agent.action); handleSearch(agent.action); }}
                    className="flex flex-col items-center text-center p-3 rounded-xl border border-border/40 bg-background/80 hover:border-border hover:shadow-sm hover:bg-background transition-all group">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2"
                      style={{ background: "linear-gradient(135deg, rgba(249,109,28,0.10), rgba(245,158,11,0.06))" }}>
                      <agent.icon className="h-4 w-4 text-orange-500" />
                    </div>
                    <p className="text-[10px] font-semibold leading-tight mb-0.5">{agent.label}</p>
                    <p className="text-[9px] text-muted-foreground/40 leading-tight">{agent.hint}</p>
                  </button>
                ))}
              </div>
            </section>

            {/* ── WORKSPACES ────────────────────────────────────────────── */}
            <section>
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-5 h-5 rounded-lg flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #1a1a1a 0%, #3a3a3a 100%)" }}>
                  <Layers className="h-3 w-3 text-white" />
                </div>
                <p className="text-[12px] font-bold tracking-tight">Workspaces</p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <WorkspaceTile
                  icon={StickyNote}
                  title="Notes"
                  description="Capture ideas, quotes, and observations while you research"
                  count={notesCount}
                  countLabel="captured"
                  color="#D97706"
                  gradient="linear-gradient(135deg, rgba(245,158,11,0.14), rgba(234,179,8,0.06))"
                  onClick={() => onNavigate("notes")}
                />
                <WorkspaceTile
                  icon={FlaskConical}
                  title="Hypotheses"
                  description="Form and test your ideas, concepts, and research claims"
                  count={hypothesesCount}
                  countLabel="active"
                  color="#7C3AED"
                  gradient="linear-gradient(135deg, rgba(139,92,246,0.14), rgba(99,102,241,0.06))"
                  onClick={() => onNavigate("hypotheses")}
                />
                <WorkspaceTile
                  icon={FileEdit}
                  title="Drafts"
                  description="Rough fragments and text drafts from your research process"
                  count={draftsCount}
                  countLabel="fragments"
                  color="#2563EB"
                  gradient="linear-gradient(135deg, rgba(59,130,246,0.14), rgba(37,99,235,0.06))"
                  onClick={() => onNavigate("drafts")}
                />
                <WorkspaceTile
                  icon={Brain}
                  title="Role Models"
                  description="Deep structural analysis of author minds and styles"
                  count={modelsCount}
                  countLabel={`${modelsAnalyzedCount} analyzed`}
                  color="#BE185D"
                  gradient="linear-gradient(135deg, rgba(236,72,153,0.14), rgba(190,24,93,0.06))"
                  onClick={() => onNavigate("models")}
                />
              </div>
            </section>

            {/* ── KNOWLEDGE GRAPH ───────────────────────────────────────── */}
            <section>
              <button onClick={() => onNavigate("notes")}
                className="w-full group rounded-2xl overflow-hidden border hover:border-border hover:shadow-sm transition-all"
                style={{
                  borderColor: "rgba(16,185,129,0.2)",
                  background: "linear-gradient(135deg, rgba(16,185,129,0.04) 0%, rgba(5,150,105,0.02) 100%)",
                }}>
                <div className="p-4 flex items-center gap-4">
                  {/* Mini graph illustration */}
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 relative"
                    style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.14), rgba(5,150,105,0.08))" }}>
                    <Network className="h-6 w-6 text-emerald-500" />
                    {totalNodes > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[8px] font-bold flex items-center justify-center"
                        style={{ background: "#10B981", color: "white" }}>
                        {Math.min(totalNodes, 99)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-[13px] font-semibold leading-tight">Knowledge Graph</p>
                    <p className="text-[10.5px] text-muted-foreground/50 mt-0.5">
                      {totalNodes} nodes — notes, sources, ideas, hypotheses
                    </p>
                    <p className="text-[9.5px] mt-1 font-medium" style={{ color: "#10B981" }}>
                      Open Notes → switch to Graph view
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground/60 group-hover:translate-x-1 transition-all flex-shrink-0" />
                </div>
                <div className="h-0.5"
                  style={{ background: "linear-gradient(90deg, #10B981, #34D399, transparent)", opacity: 0.6 }} />
              </button>
            </section>

          </div>
        )}
      </div>
    </div>
  );
}
