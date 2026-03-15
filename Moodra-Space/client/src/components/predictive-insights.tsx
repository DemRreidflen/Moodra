import { useMemo } from "react";
import { Network, Droplets, GitBranch, LayoutGrid, Zap, Star, Shuffle, Map, Lightbulb, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Insight {
  id: string;
  type: string;
  message: string;
  detail: string;
  actionLabel: string;
  agentId: string;
  fnId: string;
  priority: "high" | "medium" | "low";
  icon: any;
  color: string;
  bg: string;
}

interface Props {
  notes: any[];
  sources: any[];
  boardDataRaw: string;
  chapters?: any[];
  lang?: string;
  onRunAgent?: (agentId: string, fnId: string, prefillContent?: string) => void;
  compact?: boolean;
}

// ─── Heuristic engine ─────────────────────────────────────────────────────────

function computeInsights(notes: any[], sources: any[], boardDataRaw: string, chapters: any[]): Insight[] {
  const insights: Insight[] = [];

  let boardState: { nodes: any[]; edges: any[] } = { nodes: [], edges: [] };
  if (boardDataRaw) { try { boardState = JSON.parse(boardDataRaw); } catch {} }

  const boardLinkedIds = new Set(
    boardState.nodes.map((n: any) => String(n.linkedId)).filter(Boolean)
  );

  // ── 1. Orphan notes (not linked to board) ──────────────────────────────────
  const orphans = notes.filter(n => !boardLinkedIds.has(String(n.id)));
  if (orphans.length >= 3) {
    insights.push({
      id: "orphan_notes",
      type: "orphan_notes",
      message: `${orphans.length} notes aren't connected to your Idea Board yet`,
      detail: "These notes exist in isolation — connecting them spatially could reveal unexpected relationships and clusters.",
      actionLabel: "Suggest links",
      agentId: "linker",
      fnId: "suggest_links",
      priority: orphans.length > 8 ? "high" : "medium",
      icon: Network,
      color: "#0D9488",
      bg: "#F0FDFA",
    });
  }

  // ── 2. Tag clusters ────────────────────────────────────────────────────────
  const tagMap: Record<string, number[]> = {};
  notes.forEach(n => {
    const tags = (n.tags || "").split(",").map((t: string) => t.trim()).filter(Boolean);
    tags.forEach((tag: string) => {
      if (!tagMap[tag]) tagMap[tag] = [];
      tagMap[tag].push(n.id);
    });
  });
  const clusters = Object.entries(tagMap).filter(([, ids]) => ids.length >= 3);
  if (clusters.length > 0) {
    const [biggestTag, biggestIds] = clusters.sort((a, b) => b[1].length - a[1].length)[0];
    insights.push({
      id: "tag_cluster",
      type: "tag_cluster",
      message: `${biggestIds.length} notes share the tag "${biggestTag}"`,
      detail: "This cluster of notes may be dense enough to become a structured draft or chapter outline.",
      actionLabel: "Cluster → Draft seed",
      agentId: "transformation",
      fnId: "cluster_to_draft",
      priority: "medium",
      icon: Shuffle,
      color: "#6366F1",
      bg: "#EEF2FF",
    });
  }

  // ── 3. Quote-to-insight imbalance ──────────────────────────────────────────
  const quoteNotes = notes.filter(n => n.type === "quote" || (n.title || "").toLowerCase().startsWith("quote"));
  const reflections = notes.filter(n => ["insight", "reflection", "argument"].includes(n.type || ""));
  if (quoteNotes.length >= 3 && reflections.length < Math.ceil(quoteNotes.length / 2)) {
    insights.push({
      id: "quote_ratio",
      type: "quote_ratio",
      message: `You have ${quoteNotes.length} quotes saved but few reflections`,
      detail: "Many quotes saved but few are transformed into your own thinking. Try expanding some into arguments or reflections.",
      actionLabel: "Expand quote",
      agentId: "expansion",
      fnId: "expand_quote",
      priority: "low",
      icon: GitBranch,
      color: "#8B5CF6",
      bg: "#F5F3FF",
    });
  }

  // ── 4. Unlinked sources ────────────────────────────────────────────────────
  if (sources.length >= 2) {
    const allNoteText = notes.map(n => ((n.content || "") + " " + (n.title || "")).toLowerCase()).join(" ");
    const unlinked = sources.filter((s: any) => {
      const words = (s.title || "").toLowerCase().split(/\W+/).filter((w: string) => w.length > 5);
      return words.length > 0 && !words.some((w: string) => allNoteText.includes(w));
    });
    if (unlinked.length >= 2) {
      insights.push({
        id: "unlinked_sources",
        type: "unlinked_sources",
        message: `${unlinked.length} sources have no linked notes yet`,
        detail: "These sources may contain important ideas that haven't been extracted into your note system.",
        actionLabel: "Source → Note",
        agentId: "transformation",
        fnId: "source_to_note",
        priority: "medium",
        icon: Shuffle,
        color: "#6366F1",
        bg: "#EEF2FF",
      });
    }
  }

  // ── 5. Notes ready for draft (many notes, no written chapters) ─────────────
  const writtenChapters = chapters.filter(c => (c.wordCount || 0) > 150);
  if (notes.length >= 7 && writtenChapters.length === 0) {
    insights.push({
      id: "draft_opportunity",
      type: "draft_opportunity",
      message: `${notes.length} notes collected — ready to start drafting`,
      detail: "You have a substantial note collection but no written chapters yet. These notes likely have enough material to begin.",
      actionLabel: "Notes → Book structure",
      agentId: "transformation",
      fnId: "map_to_structure",
      priority: "high",
      icon: GitBranch,
      color: "#8B5CF6",
      bg: "#F5F3FF",
    });
  }

  // ── 6. Central underdeveloped concept ──────────────────────────────────────
  if (notes.length >= 5) {
    const allTitleWords = notes
      .map(n => (n.title || "").toLowerCase())
      .join(" ")
      .split(/\W+/)
      .filter(w => w.length > 5);

    const freq: Record<string, number> = {};
    allTitleWords.forEach(w => { freq[w] = (freq[w] || 0) + 1; });

    const STOP = new Set(["which", "their", "these", "those", "about", "there", "other", "should", "would", "could"]);
    const topWords = Object.entries(freq)
      .filter(([w]) => !STOP.has(w))
      .sort((a, b) => b[1] - a[1]);

    if (topWords.length > 0 && topWords[0][1] >= 3) {
      const [centralWord, count] = topWords[0];
      const centralNote = notes.find(n => (n.title || "").toLowerCase().includes(centralWord));
      const isDeveloped = centralNote && (centralNote.content || "").length > 150;
      if (!isDeveloped) {
        insights.push({
          id: "underdeveloped_concept",
          type: "underdeveloped_concept",
          message: `"${centralWord}" appears in ${count} notes but seems underdeveloped`,
          detail: "This concept appears central to your work but may not have a dedicated, well-developed note of its own.",
          actionLabel: "Identify center",
          agentId: "distiller",
          fnId: "identify_center",
          priority: "medium",
          icon: Droplets,
          color: "#3B82F6",
          bg: "#EFF6FF",
        });
      }
    }
  }

  // ── 7. Board clusters without descriptions ─────────────────────────────────
  const emptyBoardNodes = boardState.nodes.filter(
    (n: any) => ["concept", "argument", "chapter_seed"].includes(n.type) && !(n.content || n.description || "").trim()
  );
  if (emptyBoardNodes.length >= 3) {
    insights.push({
      id: "empty_board_nodes",
      type: "empty_board_nodes",
      message: `${emptyBoardNodes.length} board objects have no content yet`,
      detail: "Several board nodes (concepts, arguments, chapter seeds) are empty. Filling them would strengthen your knowledge map.",
      actionLabel: "Expand concept",
      agentId: "expansion",
      fnId: "expand_argument",
      priority: "low",
      icon: Map,
      color: "#06B6D4",
      bg: "#ECFEFF",
    });
  }

  // ── 8. Undiscovered tensions ──────────────────────────────────────────────
  const argumentNotes = notes.filter(n => ["argument", "hypothesis", "concept"].includes(n.type || ""));
  if (argumentNotes.length >= 3) {
    const tensionNotes = notes.filter(n => ["counterargument", "tension"].includes(n.type || ""));
    if (tensionNotes.length === 0) {
      insights.push({
        id: "no_tensions",
        type: "no_tensions",
        message: "You have arguments but no counterarguments or tensions yet",
        detail: "Every strong argument benefits from pressure-testing. Consider exploring what might push back against your core claims.",
        actionLabel: "Detect conflicts",
        agentId: "tension",
        fnId: "detect_conflicts",
        priority: "low",
        icon: Zap,
        color: "#EF4444",
        bg: "#FEF2F2",
      });
    }
  }

  // Sort by priority and return top 5
  const order = { high: 0, medium: 1, low: 2 };
  return insights.sort((a, b) => order[a.priority] - order[b.priority]).slice(0, 5);
}

// ─── Component ────────────────────────────────────────────────────────────────

const PRIORITY_COLORS: Record<string, { dot: string; label: string; text: string }> = {
  high:   { dot: "#EF4444", label: "High priority", text: "Needs attention" },
  medium: { dot: "#F59E0B", label: "Medium",        text: "Worth exploring" },
  low:    { dot: "#10B981", label: "Low",            text: "Nice to do" },
};

export function PredictiveInsights({ notes, sources, boardDataRaw, chapters = [], lang, onRunAgent, compact = false }: Props) {
  const insights = useMemo(
    () => computeInsights(notes, sources, boardDataRaw, chapters),
    [notes, sources, boardDataRaw, chapters]
  );

  if (insights.length === 0) {
    if (compact) return null;
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="w-10 h-10 rounded-2xl bg-green-50 flex items-center justify-center mb-3">
          <Star className="h-5 w-5 text-green-500" />
        </div>
        <p className="text-sm font-semibold text-muted-foreground/60">All clear!</p>
        <p className="text-[11px] text-muted-foreground/40 mt-0.5 max-w-xs">
          Your knowledge system looks well-structured. Keep writing!
        </p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-1.5">
        {insights.slice(0, 3).map(ins => {
          const Icon = ins.icon;
          const pr = PRIORITY_COLORS[ins.priority];
          return (
            <div key={ins.id} className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl border transition-all hover:shadow-sm cursor-pointer group"
              style={{ background: ins.bg, borderColor: `${ins.color}25` }}
              onClick={() => onRunAgent?.(ins.agentId, ins.fnId)}>
              <Icon style={{ width: 13, height: 13, color: ins.color, marginTop: 2, flexShrink: 0 }} />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold leading-snug" style={{ color: ins.color }}>{ins.message}</p>
              </div>
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ background: pr.dot }} />
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-5 h-5 rounded-lg bg-primary/10 flex items-center justify-center">
          <Lightbulb className="h-3 w-3 text-primary" />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Smart Insights · {insights.length} found
        </p>
      </div>

      {insights.map(ins => {
        const Icon = ins.icon;
        const pr = PRIORITY_COLORS[ins.priority];
        return (
          <div key={ins.id} className="rounded-2xl border overflow-hidden" style={{ borderColor: `${ins.color}25` }}>
            <div className="px-4 py-3" style={{ background: ins.bg }}>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: `${ins.color}18`, border: `1.5px solid ${ins.color}30` }}>
                  <Icon style={{ width: 14, height: 14, color: ins.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold leading-snug" style={{ color: ins.color }}>{ins.message}</p>
                    <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full" style={{ background: pr.dot }} />
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{ins.detail}</p>
                </div>
              </div>
            </div>
            {onRunAgent && (
              <div className="px-4 py-2.5 border-t flex items-center justify-between bg-white/60"
                style={{ borderColor: `${ins.color}15` }}>
                <span className="text-[10px] text-muted-foreground/50 capitalize">{pr.text}</span>
                <button
                  onClick={() => onRunAgent(ins.agentId, ins.fnId)}
                  className="flex items-center gap-1 text-[11px] font-semibold transition-colors hover:opacity-80"
                  style={{ color: ins.color }}
                >
                  {ins.actionLabel}
                  <ArrowRight style={{ width: 10, height: 10 }} />
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
