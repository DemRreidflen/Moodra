import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLang } from "@/contexts/language-context";
import { useToast } from "@/hooks/use-toast";
import { useAiError } from "@/contexts/ai-error-context";
import { cn } from "@/lib/utils";
import {
  Network, Droplets, GitBranch, LayoutGrid, Zap, Star, Shuffle, Map,
  Play, Copy, FileText, BookOpen, AlignLeft, Plus, ChevronRight, ChevronDown,
  Loader2, X, Check, StickyNote, Sparkles, Brain, FileEdit, ArrowRight,
  ClipboardCopy, Hash, Lightbulb, Target, Feather
} from "lucide-react";
import type { Book } from "@shared/schema";
import { PredictiveInsights } from "./predictive-insights";

// ─── Agent definitions ────────────────────────────────────────────────────────

interface AgentFn {
  id: string;
  label: string;
  description: string;
}
interface AgentDef {
  id: string;
  name: string;
  icon: any;
  color: string;
  bg: string;
  border: string;
  description: string;
  tagline: string;
  functions: AgentFn[];
}

const AGENTS: AgentDef[] = [
  {
    id: "linker",
    name: "Linker",
    icon: Network,
    color: "#0D9488",
    bg: "#F0FDFA",
    border: "#99F6E4",
    description: "Finds meaningful connections between notes, sources, drafts, and board objects.",
    tagline: "Semantic linking agent",
    functions: [
      { id: "suggest_links",      label: "Suggest links",              description: "Find 4–6 meaningful connections to other ideas and themes" },
      { id: "suggest_backlinks",  label: "Suggest backlinks",          description: "Identify what foundational ideas this text builds upon" },
      { id: "detect_related",     label: "Detect related concepts",    description: "Map the conceptual neighborhood — sibling ideas, contexts, parallels" },
      { id: "hidden_connections", label: "Find hidden connections",    description: "Surface non-obvious, latent connections beneath the surface" },
    ],
  },
  {
    id: "distiller",
    name: "Distiller",
    icon: Droplets,
    color: "#3B82F6",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    description: "Condenses complexity into essence. Finds the diamond at the center.",
    tagline: "Essence extraction agent",
    functions: [
      { id: "summarize_thesis",   label: "Summarize thesis",           description: "Distill the text into one precise thesis sentence" },
      { id: "extract_key_ideas",  label: "Extract key ideas",          description: "Identify and articulate the 4–6 most important ideas" },
      { id: "reduce_to_insight",  label: "Reduce to insight",          description: "Find the clearest, most essential insight — the core" },
      { id: "identify_center",    label: "Identify center",            description: "Find the gravitational concept that holds everything together" },
    ],
  },
  {
    id: "expansion",
    name: "Expansion",
    icon: GitBranch,
    color: "#8B5CF6",
    bg: "#F5F3FF",
    border: "#DDD6FE",
    description: "Develops ideas outward. Turns seeds into arguments, drafts, and outlines.",
    tagline: "Idea development agent",
    functions: [
      { id: "expand_argument",    label: "Expand into argument",       description: "Develop a note into a structured argument seed with premises" },
      { id: "expand_quote",       label: "Expand quote to reflection", description: "Turn a quote into a rich intellectual reflection" },
      { id: "expand_to_draft",    label: "Expand to draft starter",    description: "Transform a concept into a ready-to-write draft fragment" },
      { id: "expand_cluster",     label: "Expand cluster to outline",  description: "Turn a cluster of ideas into a thematic structural outline" },
    ],
  },
  {
    id: "structuring",
    name: "Structuring",
    icon: LayoutGrid,
    color: "#F97316",
    bg: "#FFF7ED",
    border: "#FED7AA",
    description: "Organizes the knowledge system. Tags, collections, placements, clusters.",
    tagline: "Knowledge organization agent",
    functions: [
      { id: "recommend_tags",       label: "Recommend tags",           description: "Suggest 6–10 precise conceptual tags with reasoning" },
      { id: "recommend_collection", label: "Recommend collection",     description: "Identify which collection or category this belongs to" },
      { id: "suggest_note_type",    label: "Suggest note type",        description: "Match this text to its optimal note type" },
      { id: "suggest_placement",    label: "Suggest placement",        description: "Recommend where this belongs in a book structure" },
      { id: "suggest_cluster",      label: "Suggest cluster logic",    description: "Design the ideal intellectual neighborhood for this note" },
    ],
  },
  {
    id: "tension",
    name: "Tension",
    icon: Zap,
    color: "#EF4444",
    bg: "#FEF2F2",
    border: "#FECACA",
    description: "Finds contradictions, pressure points, and unresolved tensions.",
    tagline: "Conflict & pressure agent",
    functions: [
      { id: "detect_conflicts",      label: "Detect conflicts",         description: "Find conceptual conflicts and unresolved oppositions" },
      { id: "show_opposing",         label: "Show opposing position",   description: "Construct the strongest possible counter-argument" },
      { id: "identify_contradictions", label: "Identify contradictions", description: "Map every internal contradiction with resolution paths" },
      { id: "expose_tensions",       label: "Expose hidden tensions",   description: "Surface underdeveloped pressure points the text implies" },
    ],
  },
  {
    id: "relevance",
    name: "Relevance",
    icon: Star,
    color: "#F59E0B",
    bg: "#FFFBEB",
    border: "#FDE68A",
    description: "Determines what matters most. Separates signal from noise.",
    tagline: "Signal prioritization agent",
    functions: [
      { id: "detect_core",      label: "Detect core relevance",      description: "Evaluate if this is core or peripheral to the work" },
      { id: "identify_noise",   label: "Identify noise",             description: "Find elements that dilute or distract from the signal" },
      { id: "show_unused",      label: "Show unused potential",      description: "Identify important ideas mentioned but never developed" },
      { id: "prioritize",       label: "Prioritize concepts",        description: "Rank all concepts by importance and strategic value" },
    ],
  },
  {
    id: "transformation",
    name: "Transformation",
    icon: Shuffle,
    color: "#6366F1",
    bg: "#EEF2FF",
    border: "#C7D2FE",
    description: "Moves objects between creative states. Note → Draft → Board → Structure.",
    tagline: "Creative state transformation agent",
    functions: [
      { id: "note_to_draft",   label: "Note → Draft fragment",        description: "Transform a note into polished, write-ready prose" },
      { id: "note_to_board",   label: "Note → Board card",            description: "Create an ideal board card with type, title, tags" },
      { id: "source_to_note",  label: "Source insight → Note",        description: "Extract a source's key contribution as a standalone note" },
      { id: "cluster_to_draft", label: "Cluster → Draft seed",        description: "Transform an idea cluster into a chapter draft seed" },
      { id: "map_to_structure", label: "Notes → Book structure",       description: "Transform a collection into a logical book outline" },
    ],
  },
  {
    id: "mapping",
    name: "Mapping",
    icon: Map,
    color: "#06B6D4",
    bg: "#ECFEFF",
    border: "#A5F3FC",
    description: "Builds maps of the knowledge system. MOCs, constellations, theme maps.",
    tagline: "Knowledge cartography agent",
    functions: [
      { id: "create_local_map",    label: "Create local map",          description: "Map central concept + neighbors + bridges" },
      { id: "concept_cluster",     label: "Concept cluster",           description: "Design a multi-ring concept cluster" },
      { id: "note_constellation",  label: "Note constellation",        description: "Design a note network with satellites and connections" },
      { id: "theme_map",           label: "Theme map",                 description: "Map primary, secondary, implicit themes and tensions" },
      { id: "moc_skeleton",        label: "MOC skeleton",              description: "Create a Map of Content note skeleton" },
    ],
  },
];

// ─── i18n ────────────────────────────────────────────────────────────────────

const I18N: Record<string, Record<string, string>> = {
  en: {
    title: "AI Agents", subtitle: "Cognitive knowledge tools",
    selectAgent: "Select an agent", selectFunction: "Select a function",
    contextLabel: "Input", fromNotes: "From notes", fromSources: "From sources",
    pasteText: "Paste text", placeholder: "Paste or type text here...",
    run: "Run agent", running: "Running...", result: "Result",
    copy: "Copy result", addToNotes: "Save as note", addToBoard: "Add to board",
    noNotes: "No notes yet", noSources: "No sources yet",
    selectItem: "Select an item to use as input",
    error: "Agent error", success: "Done", copied: "Copied!",
    noteSaved: "Saved as note", boardAdded: "Added to board",
    empty: "Select an agent and a function to get started.",
    funcs: "Functions",
    agentDesc: "About this agent",
  },
  ru: {
    title: "AI Агенты", subtitle: "Когнитивные инструменты",
    selectAgent: "Выберите агента", selectFunction: "Выберите функцию",
    contextLabel: "Входные данные", fromNotes: "Из заметок", fromSources: "Из источников",
    pasteText: "Вставить текст", placeholder: "Вставьте или введите текст...",
    run: "Запустить", running: "Выполняю...", result: "Результат",
    copy: "Скопировать", addToNotes: "Сохранить как заметку", addToBoard: "Добавить на доску",
    noNotes: "Нет заметок", noSources: "Нет источников",
    selectItem: "Выберите элемент для использования",
    error: "Ошибка агента", success: "Готово", copied: "Скопировано!",
    noteSaved: "Сохранено как заметка", boardAdded: "Добавлено на доску",
    empty: "Выберите агента и функцию для начала работы.",
    funcs: "Функции",
    agentDesc: "Об агенте",
  },
  ua: {
    title: "AI Агенти", subtitle: "Когнітивні інструменти",
    selectAgent: "Оберіть агента", selectFunction: "Оберіть функцію",
    contextLabel: "Вхідні дані", fromNotes: "З нотаток", fromSources: "З джерел",
    pasteText: "Вставити текст", placeholder: "Вставте або введіть текст...",
    run: "Запустити", running: "Виконую...", result: "Результат",
    copy: "Скопіювати", addToNotes: "Зберегти як нотатку", addToBoard: "Додати на дошку",
    noNotes: "Немає нотаток", noSources: "Немає джерел",
    selectItem: "Оберіть елемент для використання",
    error: "Помилка агента", success: "Готово", copied: "Скопійовано!",
    noteSaved: "Збережено як нотатку", boardAdded: "Додано на дошку",
    empty: "Оберіть агента і функцію для початку роботи.",
    funcs: "Функції",
    agentDesc: "Про агента",
  },
  de: {
    title: "KI-Agenten", subtitle: "Kognitive Wissenstools",
    selectAgent: "Agent wählen", selectFunction: "Funktion wählen",
    contextLabel: "Eingabe", fromNotes: "Aus Notizen", fromSources: "Aus Quellen",
    pasteText: "Text einfügen", placeholder: "Text eingeben oder einfügen...",
    run: "Ausführen", running: "Ausführen...", result: "Ergebnis",
    copy: "Kopieren", addToNotes: "Als Notiz speichern", addToBoard: "Zum Board hinzufügen",
    noNotes: "Keine Notizen", noSources: "Keine Quellen",
    selectItem: "Element zur Nutzung auswählen",
    error: "Agentfehler", success: "Fertig", copied: "Kopiert!",
    noteSaved: "Als Notiz gespeichert", boardAdded: "Zum Board hinzugefügt",
    empty: "Wählen Sie einen Agenten und eine Funktion aus.",
    funcs: "Funktionen",
    agentDesc: "Über diesen Agenten",
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function AiAgentsPanel({ bookId, book }: { bookId: number; book: Book }) {
  const { lang } = useLang();
  const s = I18N[lang] || I18N.en;
  const { toast } = useToast();
  const { handleAiError } = useAiError();

  const [selectedAgent, setSelectedAgent] = useState<AgentDef | null>(null);
  const [selectedFn, setSelectedFn] = useState<AgentFn | null>(null);
  const [contextTab, setContextTab] = useState<"notes" | "sources" | "paste">("paste");
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  const [selectedSourceId, setSelectedSourceId] = useState<number | null>(null);
  const [pasteText, setPasteText] = useState("");
  const [result, setResult] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expandedFns, setExpandedFns] = useState(false);
  const [showInsights, setShowInsights] = useState(false);

  const { data: notes = [] } = useQuery<any[]>({
    queryKey: ["/api/books", bookId, "notes"],
    queryFn: () => apiRequest("GET", `/api/books/${bookId}/notes`),
  });

  const { data: sources = [] } = useQuery<any[]>({
    queryKey: ["/api/books", bookId, "sources"],
    queryFn: () => apiRequest("GET", `/api/books/${bookId}/sources`),
  });

  const createNoteMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/api/books/${bookId}/notes`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "notes"] });
      toast({ title: s.noteSaved });
    },
  });

  const saveBoardMutation = useMutation({
    mutationFn: (data: string) => apiRequest("PATCH", `/api/books/${bookId}/board`, { data }),
    onSuccess: () => toast({ title: s.boardAdded }),
  });

  const { data: boardData } = useQuery<{ data: string }>({
    queryKey: ["/api/books", bookId, "board"],
    queryFn: () => apiRequest("GET", `/api/books/${bookId}/board`),
    staleTime: 60_000,
  });

  const { data: chapters = [] } = useQuery<any[]>({
    queryKey: ["/api/books", bookId, "chapters"],
    queryFn: () => apiRequest("GET", `/api/books/${bookId}/chapters`),
    staleTime: 60_000,
  });

  const getActiveContent = () => {
    if (contextTab === "paste") return pasteText.trim();
    if (contextTab === "notes") {
      const note = notes.find((n: any) => n.id === selectedNoteId) as any;
      if (!note) return "";
      return [note.title, note.content, note.tags].filter(Boolean).join("\n");
    }
    if (contextTab === "sources") {
      const src = sources.find((s: any) => s.id === selectedSourceId) as any;
      if (!src) return "";
      return [src.title, src.author, src.notes, src.quote, src.summary].filter(Boolean).join("\n");
    }
    return "";
  };

  const runAgent = useCallback(async () => {
    if (!selectedAgent || !selectedFn) return;
    const content = getActiveContent();
    if (!content) { toast({ title: s.contextLabel, description: "Please provide input text.", variant: "destructive" }); return; }

    setIsRunning(true);
    setResult("");
    try {
      const res = await apiRequest("POST", "/api/ai/cognitive-agent", {
        agentType: selectedAgent.id,
        functionType: selectedFn.id,
        content,
        bookTitle: book.title,
        lang,
      }) as any;
      setResult(res.result || "");
    } catch (e: any) {
      if (!handleAiError(e)) toast({ title: s.error, description: e?.message, variant: "destructive" });
    } finally {
      setIsRunning(false);
    }
  }, [selectedAgent, selectedFn, contextTab, pasteText, selectedNoteId, selectedSourceId, book, lang]);

  const copyResult = () => {
    navigator.clipboard.writeText(result).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const saveResultAsNote = () => {
    if (!result || !selectedAgent || !selectedFn) return;
    const title = `${selectedAgent.name}: ${selectedFn.label}`;
    createNoteMutation.mutate({
      title,
      content: result,
      type: "insight",
      color: "blue",
      tags: `ai-agent,${selectedAgent.id}`,
      status: "idea",
      collection: null,
    });
  };

  const addResultToBoard = async () => {
    if (!result) return;
    try {
      const bd = await apiRequest("GET", `/api/books/${bookId}/board`) as any;
      let boardState: { nodes: any[]; edges: any[] } = { nodes: [], edges: [] };
      if (bd?.data) { try { boardState = JSON.parse(bd.data); } catch {} }
      const newNode = {
        id: Math.random().toString(36).slice(2, 10),
        type: "note_card",
        title: `${selectedAgent?.name}: ${selectedFn?.label}`,
        content: result.slice(0, 300),
        tags: ["ai-agent", selectedAgent?.id || ""],
        x: 100 + Math.random() * 400,
        y: 100 + Math.random() * 300,
        color: "blue",
      };
      boardState.nodes = [...(boardState.nodes || []), newNode];
      saveBoardMutation.mutate(JSON.stringify(boardState));
    } catch {}
  };

  const selectedNote = notes.find((n: any) => n.id === selectedNoteId) as any;
  const selectedSource = sources.find((s: any) => s.id === selectedSourceId) as any;
  const canRun = !!selectedAgent && !!selectedFn && !!getActiveContent() && !isRunning;

  return (
    <div className="flex-1 flex overflow-hidden bg-[#FAF2EA]">

      {/* ── Agent selector sidebar ──────────────────────────────────────────── */}
      <div className="w-52 flex-shrink-0 bg-card border-r border-border/60 flex flex-col h-full">
        <div className="px-3 py-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Brain className="h-3.5 w-3.5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-bold">{s.title}</p>
              <p className="text-[9px] text-muted-foreground">{s.subtitle}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2 px-2">
          {/* Insights special entry */}
          <button
            onClick={() => { setShowInsights(true); setSelectedAgent(null); setSelectedFn(null); setResult(""); }}
            className={cn(
              "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-all mb-2 border",
              showInsights ? "shadow-sm" : "hover:bg-accent/40 border-transparent"
            )}
            style={showInsights ? { background: "#FFFBEB", border: "1px solid #FDE68A" } : {}}
          >
            <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: showInsights ? "#FFFBEB" : "#F59E0B15", border: `1px solid ${showInsights ? "#FDE68A" : "#F59E0B30"}` }}>
              <Lightbulb style={{ width: 12, height: 12, color: "#F59E0B" }} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold truncate" style={{ color: showInsights ? "#F59E0B" : undefined }}>Smart Insights</p>
              <p className="text-[9px] text-muted-foreground truncate">AI-powered suggestions</p>
            </div>
            {showInsights && <ChevronRight style={{ width: 10, height: 10, color: "#F59E0B", flexShrink: 0 }} />}
          </button>

          {/* Divider */}
          <div className="mx-2 mb-2 border-t border-border/40" />

          {AGENTS.map(agent => {
            const Icon = agent.icon;
            const isActive = !showInsights && selectedAgent?.id === agent.id;
            return (
              <button key={agent.id}
                onClick={() => { setSelectedAgent(agent); setSelectedFn(null); setResult(""); setExpandedFns(false); setShowInsights(false); }}
                className={cn(
                  "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-all mb-1",
                  isActive ? "shadow-sm" : "hover:bg-accent/40"
                )}
                style={isActive ? { background: agent.bg, border: `1px solid ${agent.border}` } : {}}
              >
                <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: isActive ? agent.bg : `${agent.color}15`, border: `1px solid ${isActive ? agent.border : agent.color + "30"}` }}>
                  <Icon style={{ width: 12, height: 12, color: agent.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold truncate" style={{ color: isActive ? agent.color : undefined }}>{agent.name}</p>
                  <p className="text-[9px] text-muted-foreground truncate">{agent.tagline}</p>
                </div>
                {isActive && <ChevronRight style={{ width: 10, height: 10, color: agent.color, flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main workspace ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Insights view */}
        {showInsights && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-shrink-0 border-b border-border/60 px-5 py-3 flex items-center gap-3"
              style={{ background: "#FFFBEB" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "#FEF9C3", border: "1.5px solid #FDE68A" }}>
                <Lightbulb style={{ width: 16, height: 16, color: "#F59E0B" }} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold" style={{ color: "#F59E0B" }}>Smart Insights</p>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: "#FDE68A40", color: "#D97706" }}>
                    predictive analysis
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Proactive suggestions based on your book's knowledge structure.
                </p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-5 max-w-3xl">
              <PredictiveInsights
                notes={notes}
                sources={sources}
                boardDataRaw={boardData?.data || ""}
                chapters={chapters}
                lang={lang}
                onRunAgent={(agentId, fnId) => {
                  const agent = AGENTS.find(a => a.id === agentId);
                  const fn = agent?.functions.find(f => f.id === fnId);
                  if (agent && fn) {
                    setShowInsights(false);
                    setSelectedAgent(agent);
                    setSelectedFn(fn);
                    setResult("");
                    setContextTab("paste");
                  }
                }}
              />
            </div>
          </div>
        )}

        {/* No selection state */}
        {!showInsights && !selectedAgent && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
              <Brain className="h-7 w-7 text-primary/40" />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground/60">{s.selectAgent}</p>
              <p className="text-xs text-muted-foreground/40 mt-1 max-w-xs">{s.empty}</p>
            </div>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {AGENTS.map(a => {
                const Icon = a.icon;
                return (
                  <button key={a.id} onClick={() => { setSelectedAgent(a); setShowInsights(false); }}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-accent/40 transition-all" style={{ border: `1px solid ${a.color}20` }}>
                    <Icon style={{ width: 18, height: 18, color: a.color }} />
                    <span className="text-[9px] font-medium" style={{ color: a.color }}>{a.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Agent workspace */}
        {!showInsights && selectedAgent && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Agent header */}
            <div className="flex-shrink-0 border-b border-border/60 px-5 py-3 flex items-start gap-3"
              style={{ background: selectedAgent.bg }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${selectedAgent.color}20`, border: `1.5px solid ${selectedAgent.border}` }}>
                {(() => { const Icon = selectedAgent.icon; return <Icon style={{ width: 16, height: 16, color: selectedAgent.color }} />; })()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold" style={{ color: selectedAgent.color }}>{selectedAgent.name} Agent</p>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: `${selectedAgent.color}15`, color: selectedAgent.color }}>
                    {selectedAgent.tagline}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{selectedAgent.description}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="p-5 space-y-5 max-w-3xl">

                {/* Function selector */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{s.funcs}</p>
                    {selectedFn && (
                      <button onClick={() => { setSelectedFn(null); setResult(""); }} className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-0.5">
                        <X className="h-2.5 w-2.5" /> Clear
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedAgent.functions.map(fn => {
                      const isActive = selectedFn?.id === fn.id;
                      return (
                        <button key={fn.id}
                          onClick={() => { setSelectedFn(fn); setResult(""); }}
                          className={cn("flex flex-col gap-0.5 px-3 py-2.5 rounded-xl text-left transition-all border", isActive ? "shadow-sm" : "hover:bg-accent/30")}
                          style={{
                            background: isActive ? selectedAgent.bg : "hsl(var(--card))",
                            borderColor: isActive ? selectedAgent.color : "hsl(var(--border))",
                            boxShadow: isActive ? `0 0 0 2px ${selectedAgent.color}20` : undefined,
                          }}
                        >
                          <p className="text-xs font-semibold" style={{ color: isActive ? selectedAgent.color : undefined }}>{fn.label}</p>
                          <p className="text-[10px] text-muted-foreground leading-snug">{fn.description}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Context input */}
                {selectedFn && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">{s.contextLabel}</p>

                    {/* Context tabs */}
                    <div className="flex gap-1 p-1 bg-muted/30 rounded-xl border border-border/40 mb-3">
                      {([
                        { id: "notes" as const, label: s.fromNotes, icon: FileText },
                        { id: "sources" as const, label: s.fromSources, icon: BookOpen },
                        { id: "paste" as const, label: s.pasteText, icon: AlignLeft },
                      ]).map(tab => (
                        <button key={tab.id} onClick={() => setContextTab(tab.id)}
                          className={cn("flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] font-medium rounded-lg transition-all", contextTab === tab.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                          <tab.icon className="h-3 w-3" /> {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Notes picker */}
                    {contextTab === "notes" && (
                      <div>
                        {notes.length === 0 ? (
                          <p className="text-xs text-muted-foreground text-center py-6">{s.noNotes}</p>
                        ) : (
                          <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                            {notes.map((note: any) => (
                              <button key={note.id}
                                onClick={() => setSelectedNoteId(note.id)}
                                className={cn("w-full flex items-start gap-2 px-3 py-2 rounded-xl text-left transition-all border", selectedNoteId === note.id ? "border-primary/50 bg-primary/5" : "border-border/50 hover:border-border hover:bg-accent/30")}>
                                <FileText className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-medium truncate">{note.title}</p>
                                  {note.content && <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{note.content}</p>}
                                </div>
                                {selectedNoteId === note.id && <Check className="h-3 w-3 text-primary flex-shrink-0" />}
                              </button>
                            ))}
                          </div>
                        )}
                        {selectedNote && (
                          <div className="mt-2 p-2.5 rounded-xl bg-primary/5 border border-primary/20 text-[10px] text-muted-foreground">
                            <span className="font-semibold text-primary">Selected: </span>{selectedNote.title}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Sources picker */}
                    {contextTab === "sources" && (
                      <div>
                        {sources.length === 0 ? (
                          <p className="text-xs text-muted-foreground text-center py-6">{s.noSources}</p>
                        ) : (
                          <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                            {sources.map((src: any) => (
                              <button key={src.id}
                                onClick={() => setSelectedSourceId(src.id)}
                                className={cn("w-full flex items-start gap-2 px-3 py-2 rounded-xl text-left transition-all border", selectedSourceId === src.id ? "border-green-500/50 bg-green-50" : "border-border/50 hover:border-border hover:bg-accent/30")}>
                                <BookOpen className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-medium truncate">{src.title}</p>
                                  {src.author && <p className="text-[10px] text-muted-foreground truncate">{src.author}</p>}
                                </div>
                                {selectedSourceId === src.id && <Check className="h-3 w-3 text-green-600 flex-shrink-0" />}
                              </button>
                            ))}
                          </div>
                        )}
                        {selectedSource && (
                          <div className="mt-2 p-2.5 rounded-xl bg-green-50 border border-green-200 text-[10px] text-muted-foreground">
                            <span className="font-semibold text-green-700">Selected: </span>{selectedSource.title}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Paste input */}
                    {contextTab === "paste" && (
                      <textarea
                        value={pasteText}
                        onChange={e => setPasteText(e.target.value)}
                        placeholder={s.placeholder}
                        rows={5}
                        className="w-full px-3 py-2.5 text-sm bg-card border border-border rounded-xl outline-none resize-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 leading-relaxed"
                      />
                    )}

                    {/* Run button */}
                    <button
                      onClick={runAgent}
                      disabled={!canRun}
                      className="mt-3 w-full h-10 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: canRun ? `linear-gradient(135deg, ${selectedAgent.color} 0%, ${selectedAgent.color}CC 100%)` : undefined }}
                    >
                      {isRunning ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> {s.running}</>
                      ) : (
                        <><Play className="h-4 w-4" /> {s.run}</>
                      )}
                    </button>
                  </div>
                )}

                {/* Result area */}
                {result && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-md flex items-center justify-center" style={{ background: `${selectedAgent.color}20` }}>
                          <Check style={{ width: 9, height: 9, color: selectedAgent.color }} />
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{s.result}</p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-1">
                        <button onClick={copyResult}
                          className="h-6 px-2 rounded-lg text-[10px] font-medium flex items-center gap-1 border border-border hover:bg-accent/60 transition-colors">
                          {copied ? <Check className="h-2.5 w-2.5 text-green-500" /> : <ClipboardCopy className="h-2.5 w-2.5" />}
                          {copied ? s.copied : s.copy}
                        </button>
                        <button onClick={saveResultAsNote}
                          className="h-6 px-2 rounded-lg text-[10px] font-medium flex items-center gap-1 border border-border hover:bg-accent/60 transition-colors">
                          <FileEdit className="h-2.5 w-2.5" /> {s.addToNotes}
                        </button>
                        <button onClick={addResultToBoard}
                          className="h-6 px-2 rounded-lg text-[10px] font-medium flex items-center gap-1 border border-border hover:bg-accent/60 transition-colors">
                          <StickyNote className="h-2.5 w-2.5" /> {s.addToBoard}
                        </button>
                      </div>
                    </div>

                    {/* Result content */}
                    <div className="rounded-2xl border border-border/60 overflow-hidden" style={{ background: selectedAgent.bg }}>
                      <div className="px-4 py-1.5 border-b text-[10px] font-semibold flex items-center gap-1.5"
                        style={{ borderColor: selectedAgent.border, color: selectedAgent.color, background: `${selectedAgent.color}08` }}>
                        {(() => { const Icon = selectedAgent.icon; return <Icon style={{ width: 10, height: 10 }} />; })()}
                        {selectedAgent.name} · {selectedFn?.label}
                      </div>
                      <div className="p-4">
                        <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                          {result.split('\n').map((line, i) => {
                            if (line.startsWith('**') && line.endsWith('**')) {
                              return <p key={i} className="font-bold mt-3 mb-1 first:mt-0" style={{ color: selectedAgent.color }}>{line.replace(/\*\*/g, '')}</p>;
                            }
                            if (line.match(/^\d+\./)) {
                              return <p key={i} className="ml-2 mt-1">{line}</p>;
                            }
                            if (line.startsWith('- ') || line.startsWith('• ')) {
                              return <p key={i} className="ml-3 mt-0.5 flex gap-1.5"><span className="text-muted-foreground mt-1">·</span><span>{line.slice(2)}</span></p>;
                            }
                            if (line === '') {
                              return <div key={i} className="h-2" />;
                            }
                            return <p key={i} className="mt-1">{line}</p>;
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
