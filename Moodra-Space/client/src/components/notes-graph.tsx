import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { NOTE_TYPES } from "@/components/notes-tab";
import type { Note, Draft, Source, NoteCollection } from "@shared/schema";
import { X, ZoomIn, ZoomOut, Maximize2, RefreshCw, GitBranch, AlertCircle } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface GNode {
  id: string;
  label: string;
  kind: "note" | "draft" | "source";
  noteType?: string;
  x: number; y: number;
  vx: number; vy: number;
  degree: number;
  isOrphan: boolean;
}

interface GEdge {
  source: string;
  target: string;
  kind: "note-note" | "note-draft" | "note-source";
}

// ─── Force simulation (no external library) ────────────────────────────────

const REPULSION = 4200;
const ATTRACTION = 0.06;
const DAMPING = 0.82;
const ITERATIONS = 220;
const IDEAL_DIST = 110;

function runSimulation(nodes: GNode[], edges: GEdge[], w: number, h: number): GNode[] {
  const ns = nodes.map(n => ({ ...n, x: n.x, y: n.y, vx: 0, vy: 0 }));
  const idxMap = new Map<string, number>();
  ns.forEach((n, i) => idxMap.set(n.id, i));

  for (let iter = 0; iter < ITERATIONS; iter++) {
    const factor = Math.max(0.1, 1 - iter / ITERATIONS);

    // Repulsion between all pairs
    for (let i = 0; i < ns.length; i++) {
      for (let j = i + 1; j < ns.length; j++) {
        const dx = ns[j].x - ns[i].x || 0.01;
        const dy = ns[j].y - ns[i].y || 0.01;
        const dist2 = dx * dx + dy * dy;
        const dist = Math.sqrt(dist2) || 0.01;
        const force = REPULSION / dist2;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        ns[i].vx -= fx; ns[i].vy -= fy;
        ns[j].vx += fx; ns[j].vy += fy;
      }
    }

    // Attraction along edges
    for (const edge of edges) {
      const si = idxMap.get(edge.source);
      const ti = idxMap.get(edge.target);
      if (si == null || ti == null) continue;
      const dx = ns[ti].x - ns[si].x;
      const dy = ns[ti].y - ns[si].y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
      const force = ATTRACTION * (dist - IDEAL_DIST);
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      ns[si].vx += fx; ns[si].vy += fy;
      ns[ti].vx -= fx; ns[ti].vy -= fy;
    }

    // Center gravity
    for (const n of ns) {
      n.vx += (w / 2 - n.x) * 0.004 * factor;
      n.vy += (h / 2 - n.y) * 0.004 * factor;
    }

    // Integrate
    for (const n of ns) {
      n.vx *= DAMPING;
      n.vy *= DAMPING;
      n.x += n.vx;
      n.y += n.vy;
      // Keep in bounds
      n.x = Math.max(30, Math.min(w - 30, n.x));
      n.y = Math.max(30, Math.min(h - 30, n.y));
    }
  }
  return ns;
}

// ─── Build graph data from notes/drafts/sources ────────────────────────────

function buildGraph(notes: Note[], drafts: Draft[], sources: Source[]): { nodes: GNode[]; edges: GEdge[] } {
  const edges: GEdge[] = [];
  const degreeMap = new Map<string, number>();

  const inc = (id: string) => degreeMap.set(id, (degreeMap.get(id) ?? 0) + 1);

  // Note → Note edges
  for (const note of notes) {
    const linkedIds = (note.linkedNoteIds || "").split(",").map(Number).filter(Boolean);
    for (const lid of linkedIds) {
      const target = `note-${lid}`;
      const source = `note-${note.id}`;
      if (!edges.find(e => (e.source === source && e.target === target) || (e.source === target && e.target === source))) {
        edges.push({ source, target, kind: "note-note" });
        inc(source); inc(target);
      }
    }
    // Note → Draft
    const draftIds = (note.linkedDraftIds || "").split(",").map(Number).filter(Boolean);
    for (const did of draftIds) {
      const source = `note-${note.id}`;
      const target = `draft-${did}`;
      edges.push({ source, target, kind: "note-draft" });
      inc(source); inc(target);
    }
    // Note → Source
    const sourceIds = (note.linkedSourceIds || "").split(",").map(Number).filter(Boolean);
    for (const sid of sourceIds) {
      const source = `note-${note.id}`;
      const target = `source-${sid}`;
      edges.push({ source, target, kind: "note-source" });
      inc(source); inc(target);
    }
  }

  // Also backlinks from drafts → notes (connectedNoteIds)
  for (const draft of drafts) {
    const noteIds = (draft.connectedNoteIds || "").split(",").map(Number).filter(Boolean);
    for (const nid of noteIds) {
      const source = `draft-${draft.id}`;
      const target = `note-${nid}`;
      if (!edges.find(e => (e.source === source && e.target === target) || (e.source === target && e.target === source))) {
        edges.push({ source, target, kind: "note-draft" });
        inc(source); inc(target);
      }
    }
  }

  const W = 900, H = 620;
  const nodes: GNode[] = [
    ...notes.map((n, i) => {
      const id = `note-${n.id}`;
      const deg = degreeMap.get(id) ?? 0;
      return {
        id, label: n.title, kind: "note" as const,
        noteType: n.type || "quick_thought",
        x: W / 2 + (Math.random() - 0.5) * W * 0.8,
        y: H / 2 + (Math.random() - 0.5) * H * 0.8,
        vx: 0, vy: 0,
        degree: deg,
        isOrphan: deg === 0,
      };
    }),
    ...drafts.map(d => {
      const id = `draft-${d.id}`;
      const deg = degreeMap.get(id) ?? 0;
      return {
        id, label: d.title, kind: "draft" as const,
        x: W / 2 + (Math.random() - 0.5) * W * 0.8,
        y: H / 2 + (Math.random() - 0.5) * H * 0.8,
        vx: 0, vy: 0,
        degree: deg,
        isOrphan: deg === 0,
      };
    }),
    ...sources.map(s => {
      const id = `source-${s.id}`;
      const deg = degreeMap.get(id) ?? 0;
      return {
        id, label: s.title, kind: "source" as const,
        x: W / 2 + (Math.random() - 0.5) * W * 0.8,
        y: H / 2 + (Math.random() - 0.5) * H * 0.8,
        vx: 0, vy: 0,
        degree: deg,
        isOrphan: deg === 0,
      };
    }),
  ];

  return { nodes, edges };
}

function nodeColor(n: GNode): string {
  if (n.kind === "draft") return "#F59E0B";
  if (n.kind === "source") return "#0D9488";
  const nt = NOTE_TYPES.find(t => t.value === n.noteType);
  return nt?.color ?? "#6B7280";
}

function nodeRadius(n: GNode): number {
  const base = n.kind === "note" ? 10 : 8;
  return base + Math.min(10, n.degree * 2.5);
}

// ─── Props ─────────────────────────────────────────────────────────────────

interface NotesGraphProps {
  notes: Note[];
  drafts: Draft[];
  sources: Source[];
  mode: "global" | "local";
  focalNoteId?: number;
  onClose?: () => void;
  onOpenNote?: (id: number) => void;
}

// ─── Component ─────────────────────────────────────────────────────────────

export function NotesGraph({ notes, drafts, sources, mode, focalNoteId, onClose, onOpenNote }: NotesGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [simNodes, setSimNodes] = useState<GNode[]>([]);
  const [edges, setEdges] = useState<GEdge[]>([]);
  const [hovered, setHovered] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, panX: 0, panY: 0 });
  const [showOrphansOnly, setShowOrphansOnly] = useState(false);

  const W = 900, H = 620;

  // Filter to local graph if mode="local"
  const filteredNotes = useMemo(() => {
    if (mode === "global") return notes;
    if (!focalNoteId) return notes;
    const focal = notes.find(n => n.id === focalNoteId);
    if (!focal) return [focal].filter(Boolean) as Note[];
    const linkedNoteIds = new Set((focal.linkedNoteIds || "").split(",").map(Number).filter(Boolean));
    // Also find notes that link back to focal
    const backlinkedIds = new Set(
      notes.filter(n => (n.linkedNoteIds || "").split(",").map(Number).includes(focalNoteId)).map(n => n.id)
    );
    const allIds = new Set([focalNoteId, ...linkedNoteIds, ...backlinkedIds]);
    return notes.filter(n => allIds.has(n.id));
  }, [notes, mode, focalNoteId]);

  const filteredDrafts = useMemo(() => {
    if (mode === "global") return drafts;
    if (!focalNoteId) return [];
    const focal = notes.find(n => n.id === focalNoteId);
    if (!focal) return [];
    const draftIds = new Set((focal.linkedDraftIds || "").split(",").map(Number).filter(Boolean));
    return drafts.filter(d => draftIds.has(d.id));
  }, [notes, drafts, mode, focalNoteId]);

  const filteredSources = useMemo(() => {
    if (mode === "global") return sources;
    if (!focalNoteId) return [];
    const focal = notes.find(n => n.id === focalNoteId);
    if (!focal) return [];
    const sourceIds = new Set((focal.linkedSourceIds || "").split(",").map(Number).filter(Boolean));
    return sources.filter(s => sourceIds.has(s.id));
  }, [notes, sources, mode, focalNoteId]);

  useEffect(() => {
    const { nodes: rawNodes, edges: rawEdges } = buildGraph(filteredNotes, filteredDrafts, filteredSources);
    const positioned = runSimulation(rawNodes, rawEdges, W, H);
    setSimNodes(positioned);
    setEdges(rawEdges);
  }, [filteredNotes, filteredDrafts, filteredSources]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.max(0.3, Math.min(3, z * (e.deltaY < 0 ? 1.1 : 0.9))));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as SVGElement).tagName === "svg" || (e.target as SVGElement).tagName === "rect") {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y });
    }
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({ x: dragStart.panX + (e.clientX - dragStart.x), y: dragStart.panY + (e.clientY - dragStart.y) });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  const displayNodes = showOrphansOnly ? simNodes.filter(n => n.isOrphan) : simNodes;
  const orphanCount = simNodes.filter(n => n.isOrphan).length;
  const centralNodes = [...simNodes].sort((a, b) => b.degree - a.degree).slice(0, 3);

  const hoveredNode = simNodes.find(n => n.id === hovered);

  return (
    <div className="flex flex-col h-full bg-background" style={{ minHeight: 0 }}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border flex-shrink-0">
        <GitBranch className="h-3.5 w-3.5 text-primary" />
        <span className="font-semibold text-sm flex-1">
          {mode === "local" ? "Local Graph" : "Knowledge Graph"}
        </span>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: "#6366F1" }} />Notes ({filteredNotes.length})
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: "#F59E0B" }} />Drafts ({filteredDrafts.length})
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: "#0D9488" }} />Sources ({filteredSources.length})
          </span>
        </div>
        {orphanCount > 0 && (
          <button
            onClick={() => setShowOrphansOnly(v => !v)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all"
            style={{
              background: showOrphansOnly ? "rgba(239,68,68,0.12)" : "hsl(var(--secondary))",
              color: showOrphansOnly ? "#EF4444" : "hsl(var(--muted-foreground))",
              border: showOrphansOnly ? "1px solid rgba(239,68,68,0.25)" : "1px solid transparent",
            }}
          >
            <AlertCircle className="h-2.5 w-2.5" />
            {orphanCount} orphan{orphanCount !== 1 ? "s" : ""}
          </button>
        )}
        <button onClick={() => setZoom(z => Math.min(3, z * 1.2))} className="w-6 h-6 flex items-center justify-center rounded hover:bg-secondary text-muted-foreground transition-colors">
          <ZoomIn className="h-3 w-3" />
        </button>
        <button onClick={() => setZoom(z => Math.max(0.3, z * 0.8))} className="w-6 h-6 flex items-center justify-center rounded hover:bg-secondary text-muted-foreground transition-colors">
          <ZoomOut className="h-3 w-3" />
        </button>
        <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="w-6 h-6 flex items-center justify-center rounded hover:bg-secondary text-muted-foreground transition-colors">
          <Maximize2 className="h-3 w-3" />
        </button>
        {onClose && (
          <button onClick={onClose} className="w-6 h-6 flex items-center justify-center rounded hover:bg-secondary text-muted-foreground transition-colors">
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Insights bar */}
      {mode === "global" && centralNodes.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-1.5 bg-muted/30 border-b border-border/40 flex-shrink-0 overflow-x-auto">
          <span className="text-[10px] text-muted-foreground/70 flex-shrink-0 font-medium">Central ideas:</span>
          {centralNodes.map(n => (
            <button key={n.id} onClick={() => n.kind === "note" && onOpenNote?.(Number(n.id.replace("note-", "")))}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 hover:opacity-80 transition-opacity"
              style={{ background: `${nodeColor(n)}18`, color: nodeColor(n), border: `1px solid ${nodeColor(n)}30` }}>
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: nodeColor(n) }} />
              {n.label.slice(0, 28)}{n.label.length > 28 ? "…" : ""}
              <span className="opacity-60">({n.degree})</span>
            </button>
          ))}
          {orphanCount > 0 && (
            <span className="flex-shrink-0 text-[10px] text-muted-foreground/60 flex items-center gap-1">
              <AlertCircle className="h-2.5 w-2.5 text-red-400" />
              {orphanCount} isolated node{orphanCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      )}

      {/* SVG Canvas */}
      <div className="flex-1 relative overflow-hidden select-none bg-[#FAFAFA] dark:bg-[#0F0F0F]">
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full"
          style={{ cursor: isDragging ? "grabbing" : "grab" }}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <defs>
            <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
              <path d="M0,0 L6,2 L0,4 Z" fill="#CBD5E1" />
            </marker>
          </defs>
          <rect width={W} height={H} fill="transparent" />

          <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}
            style={{ transformOrigin: `${W / 2}px ${H / 2}px` }}>

            {/* Dot grid background */}
            <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.8" fill="#E2E8F040" />
            </pattern>
            <rect width={W} height={H} fill="url(#dots)" />

            {/* Edges */}
            {edges.map((edge, i) => {
              const sn = simNodes.find(n => n.id === edge.source);
              const tn = simNodes.find(n => n.id === edge.target);
              if (!sn || !tn) return null;
              const isHighlighted = hovered === sn.id || hovered === tn.id;
              const isVisible = !showOrphansOnly;
              if (!isVisible) return null;
              const edgeColor = edge.kind === "note-note" ? "#A5B4FC" : edge.kind === "note-draft" ? "#FCD34D" : "#5EEAD4";
              return (
                <line key={i}
                  x1={sn.x} y1={sn.y} x2={tn.x} y2={tn.y}
                  stroke={isHighlighted ? edgeColor : `${edgeColor}55`}
                  strokeWidth={isHighlighted ? 1.8 : 1}
                  strokeDasharray={edge.kind === "note-source" ? "4,3" : undefined}
                />
              );
            })}

            {/* Nodes */}
            {displayNodes.map(node => {
              const r = nodeRadius(node);
              const color = nodeColor(node);
              const isHovered = hovered === node.id;
              const isFocal = mode === "local" && focalNoteId && node.id === `note-${focalNoteId}`;

              return (
                <g key={node.id}
                  transform={`translate(${node.x},${node.y})`}
                  style={{ cursor: node.kind === "note" ? "pointer" : "default" }}
                  onMouseEnter={() => setHovered(node.id)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => node.kind === "note" && onOpenNote?.(Number(node.id.replace("note-", "")))}
                >
                  {/* Orphan ring */}
                  {node.isOrphan && (
                    <circle r={r + 5} fill="none" stroke="#EF444440" strokeWidth={1.5} strokeDasharray="3,2" />
                  )}
                  {/* Focal ring */}
                  {isFocal && (
                    <circle r={r + 7} fill="none" stroke={color} strokeWidth={2} opacity={0.4} />
                  )}
                  {/* Hover glow */}
                  {isHovered && (
                    <circle r={r + 6} fill={`${color}20`} />
                  )}
                  {/* Main node */}
                  {node.kind === "draft" ? (
                    <rect x={-r} y={-r} width={r * 2} height={r * 2} rx={3} ry={3}
                      fill={isHovered ? color : `${color}CC`}
                      stroke={color} strokeWidth={isFocal ? 2.5 : 1.5} />
                  ) : node.kind === "source" ? (
                    <polygon
                      points={`0,${-r} ${r * 0.87},${r * 0.5} ${-r * 0.87},${r * 0.5}`}
                      fill={isHovered ? color : `${color}CC`}
                      stroke={color} strokeWidth={1.5} />
                  ) : (
                    <circle r={r}
                      fill={isHovered ? color : `${color}CC`}
                      stroke={color} strokeWidth={isFocal ? 2.5 : 1.5} />
                  )}
                  {/* Label */}
                  <text
                    y={r + 12}
                    textAnchor="middle"
                    fontSize={isHovered ? 9.5 : 8.5}
                    fontWeight={isHovered ? "600" : "400"}
                    fill={isHovered ? "#1A1A1A" : "#64748B"}
                    style={{ pointerEvents: "none" }}
                  >
                    {node.label.length > 20 ? node.label.slice(0, 19) + "…" : node.label}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Tooltip */}
        {hoveredNode && (
          <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-sm border border-border rounded-xl px-3 py-2 shadow-md max-w-[240px] pointer-events-none">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: nodeColor(hoveredNode) }} />
              <span className="font-semibold text-xs truncate">{hoveredNode.label}</span>
            </div>
            <div className="text-[10px] text-muted-foreground flex items-center gap-2">
              <span className="capitalize">{hoveredNode.kind}{hoveredNode.noteType ? ` · ${hoveredNode.noteType.replace("_", " ")}` : ""}</span>
              <span>·</span>
              <span>{hoveredNode.degree} connection{hoveredNode.degree !== 1 ? "s" : ""}</span>
              {hoveredNode.isOrphan && <span className="text-red-400 flex items-center gap-0.5"><AlertCircle className="h-2 w-2" />orphan</span>}
            </div>
            {hoveredNode.kind === "note" && <p className="text-[9px] text-muted-foreground/60 mt-0.5">Click to open note</p>}
          </div>
        )}

        {/* Empty state */}
        {simNodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <GitBranch className="h-10 w-10 text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground/50">No connections yet</p>
              <p className="text-xs text-muted-foreground/40">Link notes, drafts, and sources to build your graph</p>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2 border-t border-border/40 flex-shrink-0 bg-background">
        <span className="text-[9px] uppercase tracking-wider font-semibold text-muted-foreground/60">Legend</span>
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground/70">
          <svg width="10" height="10"><circle cx="5" cy="5" r="4" fill="#6366F160" stroke="#6366F1" strokeWidth="1.5" /></svg>
          Note
        </span>
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground/70">
          <svg width="10" height="10"><rect x="1" y="1" width="8" height="8" rx="1.5" fill="#F59E0B60" stroke="#F59E0B" strokeWidth="1.5" /></svg>
          Draft
        </span>
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground/70">
          <svg width="10" height="10"><polygon points="5,1 9,9 1,9" fill="#0D948860" stroke="#0D9488" strokeWidth="1.5" /></svg>
          Source
        </span>
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground/70">
          <svg width="20" height="6"><line x1="0" y1="3" x2="20" y2="3" stroke="#A5B4FC" strokeWidth="1.5" /></svg>
          Note link
        </span>
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground/70">
          <svg width="20" height="6"><line x1="0" y1="3" x2="20" y2="3" stroke="#FCD34D" strokeWidth="1.5" strokeDasharray="3,2" /></svg>
          Draft link
        </span>
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground/70">
          <svg width="12" height="10"><circle cx="6" cy="5" r="4" fill="none" stroke="#EF444460" strokeWidth="1.5" strokeDasharray="2,1.5" /></svg>
          Orphan
        </span>
        <span className="text-[9px] text-muted-foreground/50 ml-auto">Scroll to zoom · drag to pan · click note to open</span>
      </div>
    </div>
  );
}
