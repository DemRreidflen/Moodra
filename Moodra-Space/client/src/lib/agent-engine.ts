/**
 * agent-engine.ts
 *
 * Internal cognitive analysis engine for the Moodra platform.
 * These algorithms run automatically under the hood — they are NOT user-facing tools.
 *
 * All 8 agent roles are implemented as pure analysis functions that take the
 * current workspace data and return structured Insight objects surfaced
 * through the platform's Smart Insights system.
 *
 * Architecture:
 *  - All analysis is client-side (heuristic, zero API calls)
 *  - Each agent scans a different dimension of the knowledge graph
 *  - Results are ranked by priority and deduplicated
 *  - The `actionTarget` on each insight tells the editor which tab/filter to activate
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type InsightPriority = "high" | "medium" | "low";

export type ActionTarget =
  | { tab: "notes"; filter?: string }
  | { tab: "research" }
  | { tab: "board" }
  | { tab: "editor" }
  | { tab: "layout" };

export interface Insight {
  id: string;
  agentRole: "linker" | "distiller" | "expansion" | "structuring" | "tension" | "relevance" | "transformation" | "mapping";
  priority: InsightPriority;
  message: string;
  detail: string;
  actionLabel: string;
  actionTarget: ActionTarget;
  /** Optional: IDs of the most relevant notes/sources this insight relates to */
  relatedIds?: number[];
  color: string;
  bg: string;
  iconKey: string;
}

export interface WorkspaceData {
  notes: any[];
  sources: any[];
  boardDataRaw: string;
  chapters: any[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseBoardState(raw: string): { nodes: any[]; edges: any[] } {
  try { return JSON.parse(raw || "{}"); } catch { return { nodes: [], edges: [] }; }
}

const STOP_WORDS = new Set([
  "which", "their", "these", "those", "about", "there", "other", "should",
  "would", "could", "after", "before", "under", "while", "since", "every",
  "never", "first", "being", "doing", "going", "where", "through",
]);

function wordFrequency(texts: string[]): [string, number][] {
  const freq: Record<string, number> = {};
  texts
    .join(" ")
    .toLowerCase()
    .split(/\W+/)
    .filter(w => w.length > 5 && !STOP_WORDS.has(w))
    .forEach(w => { freq[w] = (freq[w] || 0) + 1; });
  return Object.entries(freq).sort((a, b) => b[1] - a[1]);
}

// ─── Agent 1: Linker ──────────────────────────────────────────────────────────
// Finds connections between notes, sources, board objects.

function runLinkerAgent(data: WorkspaceData): Insight[] {
  const { notes, boardDataRaw } = data;
  const insights: Insight[] = [];
  const board = parseBoardState(boardDataRaw);

  const linkedNoteIds = new Set(
    board.nodes.map((n: any) => String(n.linkedId)).filter(Boolean)
  );

  const orphans = notes.filter(n => !linkedNoteIds.has(String(n.id)));
  if (orphans.length >= 3) {
    insights.push({
      id: "linker_orphan_notes",
      agentRole: "linker",
      priority: orphans.length > 8 ? "high" : "medium",
      message: `${orphans.length} notes have no connections in the Idea Board`,
      detail: "These notes exist in isolation. Placing them on the board could reveal unexpected relationships and thematic clusters.",
      actionLabel: "View in Idea Board",
      actionTarget: { tab: "board" },
      relatedIds: orphans.slice(0, 5).map((n: any) => n.id),
      color: "#0D9488",
      bg: "#F0FDFA",
      iconKey: "network",
    });
  }

  // Detect notes that share vocabulary clusters (potential hidden connections)
  if (notes.length >= 5) {
    const notesWithWords = notes.map(n => ({
      id: n.id,
      words: new Set(
        ((n.content || "") + " " + (n.title || ""))
          .toLowerCase()
          .split(/\W+/)
          .filter(w => w.length > 5 && !STOP_WORDS.has(w))
      ),
    }));

    let maxOverlap = 0;
    let bestPair: [number, number] | null = null;
    for (let i = 0; i < Math.min(notesWithWords.length, 20); i++) {
      for (let j = i + 1; j < Math.min(notesWithWords.length, 20); j++) {
        const a = notesWithWords[i].words;
        const b = notesWithWords[j].words;
        const intersection = new Set(Array.from(a).filter(w => b.has(w)));
        if (intersection.size > maxOverlap) {
          maxOverlap = intersection.size;
          bestPair = [notesWithWords[i].id, notesWithWords[j].id];
        }
      }
    }
    if (maxOverlap >= 4 && bestPair) {
      const noteA = notes.find((n: any) => n.id === bestPair![0]);
      const noteB = notes.find((n: any) => n.id === bestPair![1]);
      if (noteA && noteB && orphans.length < 3) {
        insights.push({
          id: "linker_hidden_connections",
          agentRole: "linker",
          priority: "low",
          message: `"${noteA.title}" and "${noteB.title}" share ${maxOverlap} concepts`,
          detail: "These notes reference the same vocabulary and may be expressing related ideas from different angles.",
          actionLabel: "Explore in Notes",
          actionTarget: { tab: "notes" },
          relatedIds: bestPair,
          color: "#0D9488",
          bg: "#F0FDFA",
          iconKey: "network",
        });
      }
    }
  }

  return insights;
}

// ─── Agent 2: Distiller ───────────────────────────────────────────────────────
// Detects concepts that are scattered but underdeveloped.

function runDistillerAgent(data: WorkspaceData): Insight[] {
  const { notes } = data;
  const insights: Insight[] = [];
  if (notes.length < 5) return insights;

  const topWords = wordFrequency(notes.map(n => (n.title || "") + " " + (n.content || "")));
  if (topWords.length === 0) return insights;

  const [centralWord, count] = topWords[0];
  if (count < 3) return insights;

  const centralNote = notes.find(n =>
    (n.title || "").toLowerCase().includes(centralWord)
  );
  const isDeveloped = centralNote && (centralNote.content || "").length > 200;

  if (!isDeveloped) {
    insights.push({
      id: "distiller_underdeveloped_concept",
      agentRole: "distiller",
      priority: "medium",
      message: `"${centralWord}" is central to ${count} notes but has no core entry`,
      detail: "This concept keeps surfacing in your notes but hasn't been crystallised into a single clear, developed idea.",
      actionLabel: "Find in Notes",
      actionTarget: { tab: "notes", filter: centralWord },
      color: "#3B82F6",
      bg: "#EFF6FF",
      iconKey: "droplets",
    });
  }

  return insights;
}

// ─── Agent 3: Expansion ───────────────────────────────────────────────────────
// Detects raw material (quotes, fragments) that hasn't been expanded.

function runExpansionAgent(data: WorkspaceData): Insight[] {
  const { notes } = data;
  const insights: Insight[] = [];

  const quoteNotes = notes.filter(n =>
    n.type === "quote" || (n.title || "").toLowerCase().startsWith("quote")
  );
  const reflections = notes.filter(n =>
    ["insight", "reflection", "argument"].includes(n.type || "")
  );

  if (quoteNotes.length >= 3 && reflections.length < Math.ceil(quoteNotes.length / 2)) {
    insights.push({
      id: "expansion_quote_ratio",
      agentRole: "expansion",
      priority: "low",
      message: `${quoteNotes.length} quotes saved — few are transformed into your own thinking`,
      detail: "You have a healthy quote collection but many haven't been turned into arguments or reflections. These are seeds waiting to grow.",
      actionLabel: "View Quotes",
      actionTarget: { tab: "notes", filter: "quote" },
      relatedIds: quoteNotes.slice(0, 3).map((n: any) => n.id),
      color: "#8B5CF6",
      bg: "#F5F3FF",
      iconKey: "git-branch",
    });
  }

  const boardState = parseBoardState(data.boardDataRaw);
  const emptyBoardNodes = boardState.nodes.filter(
    (n: any) =>
      ["concept", "argument", "chapter_seed"].includes(n.type) &&
      !(n.content || n.description || "").trim()
  );
  if (emptyBoardNodes.length >= 3) {
    insights.push({
      id: "expansion_empty_board_nodes",
      agentRole: "expansion",
      priority: "low",
      message: `${emptyBoardNodes.length} board objects have no content yet`,
      detail: "These concepts, arguments, or chapter seeds exist on the board but are still empty — filling them would strengthen your knowledge map.",
      actionLabel: "Open Idea Board",
      actionTarget: { tab: "board" },
      color: "#06B6D4",
      bg: "#ECFEFF",
      iconKey: "map",
    });
  }

  return insights;
}

// ─── Agent 4: Structuring ─────────────────────────────────────────────────────
// Detects organisational opportunities: tag clusters, uncategorised notes, etc.

function runStructuringAgent(data: WorkspaceData): Insight[] {
  const { notes } = data;
  const insights: Insight[] = [];

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
      id: "structuring_tag_cluster",
      agentRole: "structuring",
      priority: "medium",
      message: `${biggestIds.length} notes share the tag "${biggestTag}"`,
      detail: "This cluster is dense enough to consider organising into a dedicated collection or chapter outline.",
      actionLabel: `Filter by "${biggestTag}"`,
      actionTarget: { tab: "notes", filter: biggestTag },
      relatedIds: biggestIds.slice(0, 5),
      color: "#6366F1",
      bg: "#EEF2FF",
      iconKey: "layout-grid",
    });
  }

  const untagged = notes.filter(n => !(n.tags || "").trim());
  if (untagged.length >= 5) {
    insights.push({
      id: "structuring_untagged",
      agentRole: "structuring",
      priority: "low",
      message: `${untagged.length} notes have no tags`,
      detail: "Untagged notes are harder to find and connect. Even a few keywords per note significantly improves retrieval.",
      actionLabel: "View Untagged Notes",
      actionTarget: { tab: "notes" },
      relatedIds: untagged.slice(0, 5).map((n: any) => n.id),
      color: "#6366F1",
      bg: "#EEF2FF",
      iconKey: "layout-grid",
    });
  }

  return insights;
}

// ─── Agent 5: Tension ─────────────────────────────────────────────────────────
// Finds arguments without counterarguments — intellectual weak points.

function runTensionAgent(data: WorkspaceData): Insight[] {
  const { notes } = data;
  const insights: Insight[] = [];

  const argumentNotes = notes.filter(n =>
    ["argument", "hypothesis", "concept"].includes(n.type || "")
  );
  const tensionNotes = notes.filter(n =>
    ["counterargument", "tension"].includes(n.type || "")
  );

  if (argumentNotes.length >= 3 && tensionNotes.length === 0) {
    insights.push({
      id: "tension_no_counterarguments",
      agentRole: "tension",
      priority: "low",
      message: `${argumentNotes.length} arguments with no counterarguments or tensions`,
      detail: "Strong intellectual work benefits from pressure-testing. Consider what might challenge or complicate your core claims.",
      actionLabel: "View Arguments",
      actionTarget: { tab: "notes", filter: "argument" },
      relatedIds: argumentNotes.slice(0, 3).map((n: any) => n.id),
      color: "#EF4444",
      bg: "#FEF2F2",
      iconKey: "zap",
    });
  }

  return insights;
}

// ─── Agent 6: Relevance ───────────────────────────────────────────────────────
// Detects what matters most vs. what is noise.

function runRelevanceAgent(data: WorkspaceData): Insight[] {
  const { notes, sources } = data;
  const insights: Insight[] = [];
  if (sources.length < 2) return insights;

  const allNoteText = notes
    .map(n => ((n.content || "") + " " + (n.title || "")).toLowerCase())
    .join(" ");

  const unlinked = sources.filter((s: any) => {
    const words = (s.title || "")
      .toLowerCase()
      .split(/\W+/)
      .filter((w: string) => w.length > 5);
    return words.length > 0 && !words.some((w: string) => allNoteText.includes(w));
  });

  if (unlinked.length >= 2) {
    insights.push({
      id: "relevance_unlinked_sources",
      agentRole: "relevance",
      priority: "medium",
      message: `${unlinked.length} sources have no connection to your notes`,
      detail: "These sources may contain important ideas that haven't yet been extracted into your note system.",
      actionLabel: "View Sources",
      actionTarget: { tab: "research" },
      relatedIds: unlinked.slice(0, 3).map((s: any) => s.id),
      color: "#F59E0B",
      bg: "#FFFBEB",
      iconKey: "star",
    });
  }

  return insights;
}

// ─── Agent 7: Transformation ──────────────────────────────────────────────────
// Identifies when material is ready to move to the next creative stage.

function runTransformationAgent(data: WorkspaceData): Insight[] {
  const { notes, chapters } = data;
  const insights: Insight[] = [];

  const writtenChapters = chapters.filter(c => (c.wordCount || 0) > 150);
  if (notes.length >= 7 && writtenChapters.length === 0) {
    insights.push({
      id: "transformation_ready_to_draft",
      agentRole: "transformation",
      priority: "high",
      message: `${notes.length} notes collected — enough material to start drafting`,
      detail: "You have a substantial knowledge base but no written chapters yet. This collection likely contains enough material to begin.",
      actionLabel: "Open Editor",
      actionTarget: { tab: "editor" },
      color: "#10B981",
      bg: "#F0FDF4",
      iconKey: "shuffle",
    });
  }

  return insights;
}

// ─── Agent 8: Mapping ─────────────────────────────────────────────────────────
// Detects structural gaps in the knowledge map.

function runMappingAgent(data: WorkspaceData): Insight[] {
  const { notes, boardDataRaw } = data;
  const insights: Insight[] = [];
  const board = parseBoardState(boardDataRaw);

  const boardNoteIds = new Set(
    board.nodes.map((n: any) => String(n.linkedId)).filter(Boolean)
  );

  const onBoard = notes.filter(n => boardNoteIds.has(String(n.id)));
  const notOnBoard = notes.filter(n => !boardNoteIds.has(String(n.id)));

  // Board exists but many notes are still outside it
  if (onBoard.length >= 2 && notOnBoard.length >= onBoard.length * 2) {
    insights.push({
      id: "mapping_incomplete_map",
      agentRole: "mapping",
      priority: "low",
      message: `Your Idea Board covers ${onBoard.length} of ${notes.length} notes`,
      detail: "A significant portion of your knowledge isn't represented on the board. A more complete map reveals better structure.",
      actionLabel: "Open Idea Board",
      actionTarget: { tab: "board" },
      color: "#0EA5E9",
      bg: "#F0F9FF",
      iconKey: "map",
    });
  }

  return insights;
}

// ─── Public API ───────────────────────────────────────────────────────────────

const PRIORITY_RANK: Record<InsightPriority, number> = { high: 0, medium: 1, low: 2 };

/**
 * Run all 8 agents against the current workspace data.
 * Returns the top insights sorted by priority, deduplicated.
 * Maximum 5 results to keep suggestions focused and non-noisy.
 */
export function runAllAgents(data: WorkspaceData, maxResults = 5): Insight[] {
  const all = [
    ...runLinkerAgent(data),
    ...runDistillerAgent(data),
    ...runExpansionAgent(data),
    ...runStructuringAgent(data),
    ...runTensionAgent(data),
    ...runRelevanceAgent(data),
    ...runTransformationAgent(data),
    ...runMappingAgent(data),
  ];

  const seen = new Set<string>();
  return all
    .filter(i => { if (seen.has(i.id)) return false; seen.add(i.id); return true; })
    .sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority])
    .slice(0, maxResults);
}
