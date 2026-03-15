/**
 * predictive-insights.tsx
 *
 * UI surface for the internal agent engine.
 * Renders Smart Insights surfaced by agent-engine.ts — never exposes
 * internal agent mechanics to the user.
 */

import { useMemo } from "react";
import {
  Network, Droplets, GitBranch, LayoutGrid, Zap,
  Star, Shuffle, Map, Lightbulb, ArrowRight,
} from "lucide-react";
import { runAllAgents, type Insight, type WorkspaceData } from "@/lib/agent-engine";

// ─── Icon resolver ─────────────────────────────────────────────────────────────

const ICONS: Record<string, any> = {
  network: Network,
  droplets: Droplets,
  "git-branch": GitBranch,
  "layout-grid": LayoutGrid,
  zap: Zap,
  star: Star,
  shuffle: Shuffle,
  map: Map,
};

function InsightIcon({ iconKey, color }: { iconKey: string; color: string }) {
  const Icon = ICONS[iconKey] || Lightbulb;
  return <Icon style={{ width: 14, height: 14, color }} />;
}

// ─── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  notes: any[];
  sources: any[];
  boardDataRaw: string;
  chapters?: any[];
  /** Called when the user taps an insight's action — navigate to the target tab */
  onAction?: (insight: Insight) => void;
  compact?: boolean;
}

const PRIORITY_DISPLAY: Record<string, { dot: string; text: string }> = {
  high:   { dot: "#EF4444", text: "Needs attention" },
  medium: { dot: "#F59E0B", text: "Worth exploring" },
  low:    { dot: "#10B981", text: "Nice to do" },
};

// ─── Component ─────────────────────────────────────────────────────────────────

export function PredictiveInsights({
  notes,
  sources,
  boardDataRaw,
  chapters = [],
  onAction,
  compact = false,
}: Props) {
  const data: WorkspaceData = { notes, sources, boardDataRaw, chapters };
  const insights = useMemo(() => runAllAgents(data), [notes, sources, boardDataRaw, chapters]);

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
          const pr = PRIORITY_DISPLAY[ins.priority];
          return (
            <div
              key={ins.id}
              className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl border transition-all hover:shadow-sm cursor-pointer group"
              style={{ background: ins.bg, borderColor: `${ins.color}25` }}
              onClick={() => onAction?.(ins)}
            >
              <div className="mt-0.5 flex-shrink-0">
                <InsightIcon iconKey={ins.iconKey} color={ins.color} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold leading-snug" style={{ color: ins.color }}>
                  {ins.message}
                </p>
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
        const pr = PRIORITY_DISPLAY[ins.priority];
        return (
          <div
            key={ins.id}
            className="rounded-2xl border overflow-hidden"
            style={{ borderColor: `${ins.color}25` }}
          >
            <div className="px-4 py-3" style={{ background: ins.bg }}>
              <div className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: `${ins.color}18`, border: `1.5px solid ${ins.color}30` }}
                >
                  <InsightIcon iconKey={ins.iconKey} color={ins.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold leading-snug" style={{ color: ins.color }}>
                      {ins.message}
                    </p>
                    <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full" style={{ background: pr.dot }} />
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{ins.detail}</p>
                </div>
              </div>
            </div>
            <div
              className="px-4 py-2.5 border-t flex items-center justify-between bg-white/60"
              style={{ borderColor: `${ins.color}15` }}
            >
              <span className="text-[10px] text-muted-foreground/50 capitalize">{pr.text}</span>
              <button
                onClick={() => onAction?.(ins)}
                className="flex items-center gap-1 text-[11px] font-semibold transition-colors hover:opacity-80"
                style={{ color: ins.color }}
              >
                {ins.actionLabel}
                <ArrowRight style={{ width: 10, height: 10 }} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
