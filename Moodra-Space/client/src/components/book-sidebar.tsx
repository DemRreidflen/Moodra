import { useState, useRef, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Chapter } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Trash2, BookOpen, Layers, AlignLeft, Eye,
  BookMarked, List, GripVertical, GripHorizontal
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useLang } from "@/contexts/language-context";

const SIDEBAR_I18N = {
  en: {
    contents: "Contents",
    addSection: "Add section",
    noChapters: "No chapters",
    addFirst: "Add first chapter",
    add: "Add",
    cancel: "Cancel",
    titlePlaceholder: "Title…",
    chapter: (n: number) => n === 1 ? "chapter" : "chapters",
    types: {
      prologue:   "Prologue",
      part:       "Part",
      chapter:    "Chapter",
      subchapter: "Subchapter",
      section:    "Section",
      scene:      "Scene",
      epilogue:   "Epilogue",
    },
    addSub: (label: string) => `+ ${label}`,
  },
  ru: {
    contents: "Содержание",
    addSection: "Добавить раздел",
    noChapters: "Нет глав",
    addFirst: "Добавить первую главу",
    add: "Добавить",
    cancel: "Отмена",
    titlePlaceholder: "Название…",
    chapter: (n: number) => n === 1 ? "глава" : n < 5 ? "главы" : "глав",
    types: {
      prologue:   "Пролог",
      part:       "Часть",
      chapter:    "Глава",
      subchapter: "Подглава",
      section:    "Раздел",
      scene:      "Сцена",
      epilogue:   "Эпилог",
    },
    addSub: (label: string) => `+ ${label}`,
  },
  ua: {
    contents: "Зміст",
    addSection: "Додати розділ",
    noChapters: "Немає розділів",
    addFirst: "Додати перший розділ",
    add: "Додати",
    cancel: "Скасувати",
    titlePlaceholder: "Назва…",
    chapter: (n: number) => n === 1 ? "розділ" : n < 5 ? "розділи" : "розділів",
    types: {
      prologue:   "Пролог",
      part:       "Частина",
      chapter:    "Розділ",
      subchapter: "Підрозділ",
      section:    "Секція",
      scene:      "Сцена",
      epilogue:   "Епілог",
    },
    addSub: (label: string) => `+ ${label}`,
  },
  de: {
    contents: "Inhalt",
    addSection: "Abschnitt hinzufügen",
    noChapters: "Keine Kapitel",
    addFirst: "Erstes Kapitel hinzufügen",
    add: "Hinzufügen",
    cancel: "Abbrechen",
    titlePlaceholder: "Titel…",
    chapter: (n: number) => n === 1 ? "Kapitel" : "Kapitel",
    types: {
      prologue:   "Prolog",
      part:       "Teil",
      chapter:    "Kapitel",
      subchapter: "Unterkapitel",
      section:    "Abschnitt",
      scene:      "Szene",
      epilogue:   "Epilog",
    },
    addSub: (label: string) => `+ ${label}`,
  },
};

const CHAPTER_TYPES_BASE = [
  { value: "prologue",    icon: BookMarked, indent: 0, color: "#a78bfa" },
  { value: "part",        icon: Layers,     indent: 0, color: "#8b5cf6" },
  { value: "chapter",     icon: BookOpen,   indent: 1, color: "#F96D1C" },
  { value: "subchapter",  icon: AlignLeft,  indent: 2, color: "#f97316" },
  { value: "section",     icon: List,       indent: 2, color: "#6b7280" },
  { value: "scene",       icon: Eye,        indent: 3, color: "#94a3b8" },
  { value: "epilogue",    icon: BookMarked, indent: 0, color: "#a78bfa" },
];

function getTypeIcon(type: string) {
  const found = CHAPTER_TYPES_BASE.find(t => t.value === type);
  return found ? found.icon : BookOpen;
}

function getTypeColor(type: string) {
  const found = CHAPTER_TYPES_BASE.find(t => t.value === type);
  return found ? found.color : "#6b7280";
}

function getTypeIndent(type: string) {
  const found = CHAPTER_TYPES_BASE.find(t => t.value === type);
  return found ? found.indent : 1;
}

function getSubType(type: string): string | null {
  const map: Record<string, string> = {
    part: "chapter",
    chapter: "subchapter",
    subchapter: "section",
    section: "scene",
  };
  return map[type] ?? null;
}

interface Props {
  bookId: number;
  bookMode: string;
  chapters: Chapter[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

const MIN_WIDTH = 160;
const MAX_WIDTH = 480;
const DEFAULT_WIDTH = 224;

export function BookSidebar({ bookId, bookMode, chapters, selectedId, onSelect }: Props) {
  const { toast } = useToast();
  const { lang } = useLang();
  const s = SIDEBAR_I18N[lang as keyof typeof SIDEBAR_I18N] ?? SIDEBAR_I18N.en;

  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("chapter");
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const dragCounter = useRef(0);

  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_WIDTH);
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(DEFAULT_WIDTH);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    startX.current = e.clientX;
    startWidth.current = sidebarWidth;

    const onMouseMove = (ev: MouseEvent) => {
      if (!isResizing.current) return;
      const delta = ev.clientX - startX.current;
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth.current + delta));
      setSidebarWidth(newWidth);
    };
    const onMouseUp = () => {
      isResizing.current = false;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, [sidebarWidth]);

  const CHAPTER_TYPES = CHAPTER_TYPES_BASE.map(t => ({
    ...t,
    label: (s.types as any)[t.value] ?? t.value,
  }));

  const addChapterMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/api/books/${bookId}/chapters`, data),
    onSuccess: (chapter: Chapter) => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "chapters"] });
      setAdding(false);
      setNewTitle("");
      onSelect(chapter.id);
    },
    onError: () => toast({ title: s.types.chapter, variant: "destructive" }),
  });

  const deleteChapterMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/chapters/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "chapters"] });
    },
  });

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    addChapterMutation.mutate({
      title: newTitle.trim(),
      type: newType,
      order: chapters.length,
      level: getTypeIndent(newType),
    });
  };

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    setDraggedIdx(idx);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (idx !== dragOverIdx) setDragOverIdx(idx);
  };

  const handleDragLeave = () => {
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setDragOverIdx(null);
    }
  };

  const handleDragEnter = () => {
    dragCounter.current += 1;
  };

  const handleDrop = async (e: React.DragEvent, toIdx: number) => {
    e.preventDefault();
    dragCounter.current = 0;
    setDragOverIdx(null);
    if (draggedIdx === null || draggedIdx === toIdx) {
      setDraggedIdx(null);
      return;
    }
    const reordered = [...chapters];
    const [moved] = reordered.splice(draggedIdx, 1);
    reordered.splice(toIdx, 0, moved);

    setDraggedIdx(null);

    await Promise.all(
      reordered.map((ch, i) =>
        apiRequest("PATCH", `/api/chapters/${ch.id}`, { order: i })
      )
    );
    queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "chapters"] });
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
    setDragOverIdx(null);
    dragCounter.current = 0;
  };

  return (
    <aside
      className="border-r border-border flex flex-col flex-shrink-0 bg-sidebar relative"
      style={{ width: sidebarWidth, minWidth: MIN_WIDTH, maxWidth: MAX_WIDTH }}
    >
      <div className="px-3 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-1.5 min-w-0">
          <BookMarked className="h-3.5 w-3.5 text-muted-foreground/70 flex-shrink-0" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
            {s.contents}
          </span>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground flex-shrink-0"
              onClick={() => setAdding(!adding)}
              data-testid="button-add-chapter"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">{s.addSection}</TooltipContent>
        </Tooltip>
      </div>

      <ScrollArea className="flex-1">
        <div className="py-1.5 px-1.5">
          {chapters.length === 0 && !adding && (
            <div className="px-2 py-8 text-center">
              <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                style={{ background: "rgba(249,109,28,0.10)", border: "1.5px solid rgba(249,109,28,0.20)" }}>
                <BookOpen className="h-5 w-5" style={{ color: "#F96D1C" }} />
              </div>
              <p className="text-xs font-medium text-muted-foreground/70">{s.noChapters}</p>
              <button
                className="text-xs mt-2 px-3 py-1 rounded-full font-semibold transition-all hover:opacity-80"
                style={{ background: "rgba(249,109,28,0.10)", color: "#F96D1C" }}
                onClick={() => setAdding(true)}
              >
                {s.addFirst}
              </button>
            </div>
          )}

          {chapters.map((ch, idx) => {
            const Icon = getTypeIcon(ch.type || "chapter");
            const iconColor = getTypeColor(ch.type || "chapter");
            const indent = getTypeIndent(ch.type || "chapter");
            const isSelected = ch.id === selectedId;
            const isPart = (ch.type || "chapter") === "part";
            const isDragging = draggedIdx === idx;
            const isDragOver = dragOverIdx === idx && draggedIdx !== idx;

            const subType = getSubType(ch.type || "chapter");
            const subTypeLabel = subType ? (s.types as any)[subType] ?? subType : null;

            return (
              <div
                key={ch.id}
                data-testid={`chapter-item-${ch.id}`}
                draggable
                onDragStart={e => handleDragStart(e, idx)}
                onDragOver={e => handleDragOver(e, idx)}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={e => handleDrop(e, idx)}
                onDragEnd={handleDragEnd}
                className={`group flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer transition-colors text-sm mb-0.5 ${
                  isSelected
                    ? "bg-primary/10 text-primary"
                    : "text-foreground/80 hover:bg-sidebar-accent hover:text-foreground"
                } ${isPart ? "mt-1" : ""}`}
                style={{
                  paddingLeft: `${8 + indent * 10}px`,
                  opacity: isDragging ? 0.4 : 1,
                  borderTop: isDragOver ? "2px solid hsl(var(--primary))" : "2px solid transparent",
                  transition: "opacity 0.15s, border-color 0.1s",
                }}
                onClick={() => onSelect(ch.id)}
              >
                <GripVertical
                  className="h-3 w-3 flex-shrink-0 opacity-0 group-hover:opacity-40 cursor-grab active:cursor-grabbing"
                  style={{ marginLeft: -2 }}
                />
                <Icon
                  className="h-3.5 w-3.5 flex-shrink-0"
                  style={{ color: isSelected ? "var(--primary)" : iconColor }}
                />
                <span className={`truncate flex-1 text-xs ${isPart ? "font-semibold" : "font-medium"}`}>
                  {ch.title}
                </span>
                {subType && subTypeLabel && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        className="opacity-0 group-hover:opacity-100 h-5 w-5 flex items-center justify-center rounded hover:bg-primary/10 hover:text-primary flex-shrink-0 transition-opacity"
                        onClick={e => {
                          e.stopPropagation();
                          setNewType(subType);
                          setAdding(true);
                        }}
                        data-testid={`add-sub-${ch.id}`}
                      >
                        <Plus className="h-2.5 w-2.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="text-xs">
                      {s.addSub(subTypeLabel)}
                    </TooltipContent>
                  </Tooltip>
                )}
                <button
                  className="opacity-0 group-hover:opacity-100 h-5 w-5 flex items-center justify-center rounded hover:bg-destructive/10 hover:text-destructive flex-shrink-0"
                  onClick={e => { e.stopPropagation(); deleteChapterMutation.mutate(ch.id); }}
                  data-testid={`delete-chapter-${ch.id}`}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            );
          })}

          {adding && (
            <div className="mt-2 px-1 space-y-2">
              <div className="flex gap-1 flex-wrap">
                {CHAPTER_TYPES.map(t => {
                  const TIcon = t.icon;
                  return (
                    <button
                      key={t.value}
                      onClick={() => setNewType(t.value)}
                      className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border transition-colors ${
                        newType === t.value
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                      }`}
                    >
                      <TIcon className="h-2.5 w-2.5" />
                      {t.label}
                    </button>
                  );
                })}
              </div>
              <Input
                data-testid="input-chapter-title"
                placeholder={s.titlePlaceholder}
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") handleAdd();
                  if (e.key === "Escape") { setAdding(false); setNewTitle(""); }
                }}
                className="h-7 text-xs bg-background"
                autoFocus
              />
              <div className="flex gap-1">
                <Button
                  size="sm"
                  className="h-6 text-xs flex-1"
                  onClick={handleAdd}
                  disabled={!newTitle.trim()}
                  data-testid="button-confirm-add-chapter"
                >
                  {s.add}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 text-xs"
                  onClick={() => { setAdding(false); setNewTitle(""); }}
                >
                  ✕
                </Button>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-2 border-t border-border">
        <div className="text-xs text-muted-foreground text-center">
          {chapters.length} {s.chapter(chapters.length)}
        </div>
      </div>

      <div
        className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-primary/20 transition-colors group z-10"
        onMouseDown={handleResizeMouseDown}
        title="Drag to resize"
      >
        <div className="absolute top-1/2 right-0 -translate-y-1/2 opacity-0 group-hover:opacity-60 transition-opacity">
          <GripHorizontal className="h-3 w-3 text-muted-foreground rotate-90" />
        </div>
      </div>
    </aside>
  );
}
