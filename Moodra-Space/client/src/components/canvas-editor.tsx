import { useRef, useEffect, useCallback, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Chapter } from "@shared/schema";
import { useLang } from "@/contexts/language-context";
import { BlockEditor } from "@/components/block-editor";
import type { Block } from "@/components/block-editor";
import { useBookSettings } from "@/hooks/use-book-settings";

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
}: ChapterSectionProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(chapter.title);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();
  const titleRef = useRef<HTMLDivElement>(null);

  // Sync title if chapter prop changes (e.g. after refetch)
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
      className="relative"
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

      {/* BlockEditor for chapter content — full editing with format toolbar */}
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

  const chapterLabel = (t.layoutPanel as any)?.chapterLabel || "Chapter";

  // Scroll to selected chapter when it changes
  useEffect(() => {
    if (!selectedChapterId) return;
    const el = document.getElementById(`canvas-chapter-${selectedChapterId}`);
    if (el && scrollRef.current) {
      const container = scrollRef.current;
      const top = el.offsetTop - 32;
      container.scrollTo({ top, behavior: "smooth" });
    }
  }, [selectedChapterId]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto" style={{ background: "#FFFDF9" }}>
      <div className="max-w-[1200px] mx-auto py-12 px-8">
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
            />

            {idx < chapters.length - 1 && (
              <div className="my-14 flex items-center gap-3">
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
  );
}
