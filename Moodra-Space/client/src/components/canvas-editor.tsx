import { useRef, useEffect, useCallback, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Chapter } from "@shared/schema";
import { useLang } from "@/contexts/language-context";
import { BlockEditor } from "@/components/block-editor";
import type { Block } from "@/components/block-editor";
import { useBookSettings } from "@/hooks/use-book-settings";
import {
  AlignLeft, Plus, Minus, ChevronsLeftRight, Keyboard, Timer, Clock, Zap, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ChapterSectionProps {
  chapter: Chapter;
  chapterIndex: number;
  isSelected: boolean;
  bookId: number;
  bookTitle: string;
  bookMode: string;
  fontFamily: string;
  lineHeight: number;
  textAlign: string;
  firstLineIndent: number;
  onSelect: (id: number) => void;
  chapterLabel: string;
  fontScale: number;
  maxWidth: number;
}

function ChapterSection({
  chapter,
  chapterIndex,
  isSelected,
  bookId,
  bookTitle,
  bookMode,
  fontFamily,
  lineHeight,
  textAlign,
  firstLineIndent,
  onSelect,
  chapterLabel,
  fontScale,
  maxWidth,
}: ChapterSectionProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(chapter.title);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();
  const titleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (document.activeElement !== titleRef.current) {
      setTitle(chapter.title);
      if (titleRef.current) titleRef.current.textContent = chapter.title;
    }
  }, [chapter.title]);

  const saveMutation = useMutation({
    mutationFn: (data: { title?: string; content?: string }) =>
      apiRequest("PATCH", `/api/chapters/${chapter.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "chapters"] });
    },
  });

  const scheduleContentSave = useCallback((blocks: Block[]) => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveMutation.mutate({ content: JSON.stringify(blocks) });
    }, 1500);
  }, [saveMutation]);

  const scheduleTitleSave = useCallback((newTitle: string) => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveMutation.mutate({ title: newTitle });
    }, 1000);
  }, [saveMutation]);

  return (
    <div
      id={`canvas-chapter-${chapter.id}`}
      onClick={() => onSelect(chapter.id)}
      className="relative mx-auto transition-all duration-300"
      style={{ maxWidth, zoom: fontScale / 100 }}
    >
      {/* Chapter label */}
      <div className="flex items-center gap-2 mb-2">
        <span
          className="text-[9px] font-bold uppercase tracking-[0.18em]"
          style={{ color: isSelected ? "#F96D1C" : "#bbb" }}
        >
          {chapterLabel} {chapterIndex + 1}
        </span>
        {isSelected && (
          <span className="w-1.5 h-1.5 rounded-full bg-[#F96D1C] inline-block" />
        )}
      </div>

      {/* Editable chapter title */}
      <div
        ref={titleRef}
        contentEditable
        suppressContentEditableWarning
        onInput={e => {
          const newTitle = (e.currentTarget as HTMLDivElement).textContent || "";
          setTitle(newTitle);
          scheduleTitleSave(newTitle);
        }}
        onFocus={() => onSelect(chapter.id)}
        style={{
          fontFamily,
          fontSize: "1.45em",
          fontWeight: 700,
          lineHeight: 1.25,
          color: isSelected ? "#1a1007" : "#666",
          outline: "none",
          marginBottom: "1.2em",
          cursor: "text",
          borderBottom: isSelected ? "1px solid rgba(249,109,28,0.25)" : "1px solid transparent",
          paddingBottom: "0.4em",
          transition: "color 0.15s, border-color 0.15s",
        }}
      >
        {chapter.title}
      </div>

      {/* BlockEditor for chapter content */}
      <div
        style={{
          fontFamily,
          lineHeight,
          textAlign: textAlign as any,
        }}
      >
        <BlockEditor
          key={chapter.id}
          initialContent={chapter.content || ""}
          onChange={scheduleContentSave}
          bookTitle={bookTitle}
          bookMode={bookMode}
          firstLineIndent={firstLineIndent}
        />
      </div>
    </div>
  );
}

interface Props {
  chapters: Chapter[];
  bookId: number;
  bookTitle: string;
  bookMode: string;
  selectedChapterId: number | null;
  onSelectChapter: (id: number) => void;
}

export function CanvasEditor({
  chapters,
  bookId,
  bookTitle,
  bookMode,
  selectedChapterId,
  onSelectChapter,
}: Props) {
  const { t } = useLang();
  const { settings } = useBookSettings(bookId);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Editor view controls — shared with chapter editor via localStorage
  const [fontScale, setFontScaleRaw] = useState<number>(() => {
    try { const v = Number(localStorage.getItem("moodra_editorFontScale")); return v >= 70 && v <= 160 ? v : 100; } catch { return 100; }
  });
  const [maxWidth, setMaxWidthRaw] = useState<number>(() => {
    try { const v = Number(localStorage.getItem("moodra_editorMaxWidth")); return v >= 480 && v <= 1010 ? v : 768; } catch { return 768; }
  });

  const setFontScale = (updater: number | ((v: number) => number)) => {
    setFontScaleRaw(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      try { localStorage.setItem("moodra_editorFontScale", String(next)); } catch {}
      return next;
    });
  };
  const setMaxWidth = (updater: number | ((v: number) => number)) => {
    setMaxWidthRaw(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      try { localStorage.setItem("moodra_editorMaxWidth", String(next)); } catch {}
      return next;
    });
  };

  // Typewriter mode + sprint (canvas-level)
  const [isTypewriterMode, setIsTypewriterMode] = useState(false);
  const [sprintExpanded, setSprintExpanded] = useState(false);
  const [sprintGoal, setSprintGoal] = useState("500");
  const [sprintMin, setSprintMin] = useState("25");
  const [sprintActive, setSprintActive] = useState(false);
  const [sprintSecondsLeft, setSprintSecondsLeft] = useState(0);
  const sprintRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startSprint = () => {
    const mins = parseInt(sprintMin) || 25;
    setSprintSecondsLeft(mins * 60);
    setSprintActive(true);
    setSprintExpanded(false);
    sprintRef.current = setInterval(() => {
      setSprintSecondsLeft(v => {
        if (v <= 1) { clearInterval(sprintRef.current!); setSprintActive(false); return 0; }
        return v - 1;
      });
    }, 1000);
  };

  const stopSprint = () => {
    clearInterval(sprintRef.current!);
    setSprintActive(false);
    setSprintSecondsLeft(0);
  };

  // Word count across all chapters
  const totalWords = chapters.reduce((acc, ch) => {
    try {
      const parsed = JSON.parse(ch.content || "[]");
      const text = Array.isArray(parsed) ? parsed.map((b: any) => b.content || "").join(" ") : (ch.content || "");
      return acc + text.trim().split(/\s+/).filter(Boolean).length;
    } catch { return acc; }
  }, 0);

  const chapterLabel = (t.layoutPanel as any)?.chapterLabel || "Chapter";

  useEffect(() => {
    if (!selectedChapterId) return;
    const el = document.getElementById(`canvas-chapter-${selectedChapterId}`);
    if (el && scrollRef.current) {
      const container = scrollRef.current;
      const top = el.offsetTop - 80;
      container.scrollTo({ top, behavior: "smooth" });
    }
  }, [selectedChapterId]);

  // Typewriter scroll effect
  useEffect(() => {
    if (!isTypewriterMode) return;
    const handleKey = () => {
      const active = document.activeElement;
      if (active && scrollRef.current) {
        const rect = active.getBoundingClientRect();
        const containerRect = scrollRef.current.getBoundingClientRect();
        const offset = rect.top - containerRect.top - containerRect.height / 2;
        scrollRef.current.scrollBy({ top: offset, behavior: "smooth" });
      }
    };
    document.addEventListener("keyup", handleKey);
    return () => document.removeEventListener("keyup", handleKey);
  }, [isTypewriterMode]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "#FFFDF9" }}>
      {/* Toolbar — same style as chapter editor */}
      <div className="px-5 py-3 border-b border-border flex items-center gap-3 flex-shrink-0 bg-card">
        {/* Word count */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground/70 pr-2">
          <AlignLeft className="h-3.5 w-3.5 flex-shrink-0" />
          <span>{totalWords} сл. · {chapters.length} гл.</span>
        </div>

        <div className="w-px h-4 bg-border/60" />

        {/* Font scale */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setFontScale(v => Math.max(70, v - 5))}
            className="h-6 w-6 flex items-center justify-center rounded hover:bg-accent/60 text-muted-foreground hover:text-foreground transition-colors text-xs font-bold"
          >A<sup className="text-[7px]">–</sup></button>
          <button
            onClick={() => setFontScale(100)}
            className="text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors w-8 text-center tabular-nums"
          >{fontScale}%</button>
          <button
            onClick={() => setFontScale(v => Math.min(160, v + 5))}
            className="h-6 w-6 flex items-center justify-center rounded hover:bg-accent/60 text-muted-foreground hover:text-foreground transition-colors text-xs font-bold"
          >A<sup className="text-[7px]">+</sup></button>
        </div>

        <div className="w-px h-4 bg-border/60" />

        {/* Max width */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setMaxWidth(v => Math.max(480, v - 60))}
            className="h-6 w-6 flex items-center justify-center rounded hover:bg-accent/60 text-muted-foreground hover:text-foreground transition-colors"
          ><Minus className="h-3 w-3" /></button>
          <button
            onClick={() => setMaxWidth(768)}
            className="flex items-center gap-0.5 text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
          >
            <ChevronsLeftRight className="h-3 w-3" />
            <span className="tabular-nums w-8 text-center">{maxWidth}</span>
          </button>
          <button
            onClick={() => setMaxWidth(v => Math.min(1010, v + 60))}
            className="h-6 w-6 flex items-center justify-center rounded hover:bg-accent/60 text-muted-foreground hover:text-foreground transition-colors"
          ><Plus className="h-3 w-3" /></button>
        </div>

        <div className="w-px h-4 bg-border/60" />

        {/* Typewriter mode */}
        <Button
          size="sm"
          variant="ghost"
          className={cn("h-8 w-8 p-0 transition-colors", isTypewriterMode ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground")}
          onClick={() => setIsTypewriterMode(v => !v)}
          title="Режим пишущей машинки"
        >
          <Keyboard className="h-3.5 w-3.5" />
        </Button>

        {/* Sprint */}
        <div className="relative">
          <Button
            size="sm"
            variant="ghost"
            className={cn("h-8 px-2 gap-1 text-xs transition-colors", sprintActive ? "text-orange-500" : "text-muted-foreground hover:text-foreground")}
            onClick={() => { if (sprintActive) return; setSprintExpanded(v => !v); }}
          >
            {sprintActive ? (
              <>
                <Clock className="h-3.5 w-3.5 animate-pulse" />
                <span className="font-mono text-[11px]">
                  {String(Math.floor(sprintSecondsLeft / 60)).padStart(2, "0")}:{String(sprintSecondsLeft % 60).padStart(2, "0")}
                </span>
              </>
            ) : (
              <Timer className="h-3.5 w-3.5" />
            )}
          </Button>
          {sprintActive && (
            <button
              onClick={stopSprint}
              className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-destructive/80 flex items-center justify-center text-white hover:bg-destructive transition-colors"
            >
              <X className="h-2 w-2" />
            </button>
          )}
          {sprintExpanded && !sprintActive && (
            <div className="absolute left-0 top-full mt-1 z-50 w-52 rounded-xl border border-border bg-background shadow-xl p-3 space-y-2">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Спринт</p>
              <div className="flex gap-2">
                <div className="flex-1">
                  <p className="text-[10px] text-muted-foreground mb-1">Слов</p>
                  <input
                    type="number" min={50} max={10000} step={50} value={sprintGoal}
                    onChange={e => setSprintGoal(e.target.value)}
                    className="w-full rounded-lg border border-border bg-secondary/50 px-2 py-1 text-xs outline-none"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-muted-foreground mb-1">Мин</p>
                  <select value={sprintMin} onChange={e => setSprintMin(e.target.value)}
                    className="w-full rounded-lg border border-border bg-secondary/50 px-2 py-1 text-xs outline-none">
                    {[5,10,15,20,25,30,45,60].map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <button
                onClick={startSprint}
                className="w-full py-1.5 rounded-lg text-xs font-semibold text-white flex items-center justify-center gap-1.5"
                style={{ background: "#F96D1C" }}
              >
                <Zap className="h-3 w-3" /> Старт
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Canvas scroll area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="py-12 px-8">
          {chapters.map((ch, idx) => (
            <div key={ch.id}>
              <ChapterSection
                chapter={ch}
                chapterIndex={idx}
                isSelected={ch.id === selectedChapterId}
                bookId={bookId}
                bookTitle={bookTitle}
                bookMode={bookMode}
                fontFamily={settings.fontFamily}
                lineHeight={settings.lineHeight}
                textAlign={settings.textAlign}
                firstLineIndent={settings.firstLineIndent ?? 1.2}
                onSelect={onSelectChapter}
                chapterLabel={chapterLabel}
                fontScale={fontScale}
                maxWidth={maxWidth}
              />

              {idx < chapters.length - 1 && (
                <div className="my-14 flex items-center gap-3" style={{ maxWidth, margin: "3.5rem auto" }}>
                  <div className="flex-1 h-px bg-border/30" />
                  <span className="text-border/50 text-xs select-none">✦</span>
                  <div className="flex-1 h-px bg-border/30" />
                </div>
              )}
            </div>
          ))}

          {chapters.length === 0 && (
            <div className="text-center text-muted-foreground text-sm py-20">
              No chapters yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
