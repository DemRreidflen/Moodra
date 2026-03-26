import { useState, useEffect, useRef, useCallback } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Book, Chapter } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { BookSidebar } from "@/components/book-sidebar";
import { ChapterEditor } from "@/components/chapter-editor";
import { AiPanel } from "@/components/ai-panel";
import { CharactersPanel } from "@/components/characters-panel";
import { NotesPanel } from "@/components/notes-panel";
import { ResearchPanel } from "@/components/research-panel";
import { BookSettings } from "@/components/book-settings";
import { IdeaBoard } from "@/components/idea-board";
import { LayoutMode } from "@/components/layout-mode";
import { FocusTimer } from "@/components/focus-timer";
import { LanguagePicker } from "@/components/language-picker";
import {
  ArrowLeft, Sparkles, Users, BookOpen, FileText,
  Settings, Brain, Columns2, X, PenLine,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type EditorTab = "editor" | "characters" | "notes" | "research" | "board" | "layout" | "settings";

function CoverDot({ book }: { book: Book }) {
  if (book.coverImage) {
    return (
      <div className="w-5 h-6 rounded-sm overflow-hidden flex-shrink-0 shadow-sm">
        <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover" />
      </div>
    );
  }
  return (
    <div className="w-5 h-6 rounded-sm flex items-center justify-center flex-shrink-0"
      style={{ background: "linear-gradient(135deg, #F96D1C22, #F96D1C44)" }}>
      <BookOpen className="h-3 w-3 text-primary/60" />
    </div>
  );
}

export default function BookEditor() {
  const [, params] = useRoute("/book/:id");
  const [, navigate] = useLocation();
  const bookId = Number(params?.id);
  const [activeTab, setActiveTab] = useState<EditorTab>("editor");
  const [selectedChapterId, setSelectedChapterId] = useState<number | null>(null);
  const [showAI, setShowAI] = useState(true);
  const [isDeepWritingMode, setIsDeepWritingMode] = useState(false);
  const [aiContext, setAiContext] = useState("");
  const [aiInsertCallback, setAiInsertCallback] = useState<((text: string) => void) | null>(null);

  const { data: book, isLoading: bookLoading } = useQuery<Book>({
    queryKey: ["/api/books", bookId],
    queryFn: () => apiRequest("GET", `/api/books/${bookId}`),
  });

  const { data: chapters = [] } = useQuery<Chapter[]>({
    queryKey: ["/api/books", bookId, "chapters"],
    queryFn: () => apiRequest("GET", `/api/books/${bookId}/chapters`),
    enabled: !!bookId,
  });

  // ── Data for agent engine ────────────────────────────────────────────────────
  const { data: notes = [] } = useQuery<any[]>({
    queryKey: ["/api/books", bookId, "notes"],
    queryFn: () => apiRequest("GET", `/api/books/${bookId}/notes`),
    enabled: !!bookId,
    staleTime: 60_000,
  });

  const { data: sources = [] } = useQuery<any[]>({
    queryKey: ["/api/books", bookId, "sources"],
    queryFn: () => apiRequest("GET", `/api/books/${bookId}/sources`),
    enabled: !!bookId,
    staleTime: 60_000,
  });

  const { data: boardData } = useQuery<{ data: string }>({
    queryKey: ["/api/books", bookId, "board"],
    queryFn: () => apiRequest("GET", `/api/books/${bookId}/board`),
    enabled: !!bookId,
    staleTime: 60_000,
  });

  const boardDataRaw = boardData?.data ?? "";
  // ────────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (chapters.length > 0 && !selectedChapterId) {
      setSelectedChapterId(chapters[0].id);
    }
  }, [chapters, selectedChapterId]);

  const selectedChapter = chapters.find(c => c.id === selectedChapterId);


  if (bookLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Книга не найдена</p>
          <Button onClick={() => navigate("/")} variant="outline" className="rounded-xl">← Назад</Button>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: "editor" as EditorTab, icon: BookOpen, label: "Редактор" },
    ...(book.mode === "fiction" ? [{ id: "characters" as EditorTab, icon: Users, label: "Персонажи" }] : []),
    { id: "notes" as EditorTab, icon: FileText, label: "Заметки" },
    { id: "research" as EditorTab, icon: PenLine, label: "Черновики" },
    { id: "board" as EditorTab, icon: Brain, label: "Доска идей" },
    { id: "layout" as EditorTab, icon: Columns2, label: "Верстка" },
    { id: "settings" as EditorTab, icon: Settings, label: "Настройки" },
  ];

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Top bar */}
      {!isDeepWritingMode && (
        <header className="h-12 border-b border-border/60 flex items-center px-3 gap-2 flex-shrink-0 glass z-50">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-xl flex-shrink-0 text-muted-foreground hover:text-foreground hover:bg-secondary"
            onClick={() => navigate("/")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="h-4 w-px bg-border/60 flex-shrink-0" />

          <div className="flex items-center gap-2 min-w-0 flex-1">
            <CoverDot book={book} />
            <span className="font-semibold text-sm truncate tracking-tight" data-testid="book-editor-title">
              {book.title}
            </span>
            {selectedChapter && activeTab === "editor" && (
              <>
                <span className="text-muted-foreground/50 text-sm flex-shrink-0">/</span>
                <span className="text-muted-foreground text-sm truncate">{selectedChapter.title}</span>
              </>
            )}
          </div>

          {/* Tab nav */}
          <div className="flex items-center bg-secondary/60 rounded-xl p-0.5 mr-1 flex-shrink-0">
            {navItems.map(({ id, icon: Icon, label }) => (
              <Tooltip key={id}>
                <TooltipTrigger asChild>
                  <button
                    data-testid={`tab-${id}`}
                    onClick={() => setActiveTab(id)}
                    className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all ${
                      activeTab === id
                        ? "bg-background shadow-apple-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">{label}</TooltipContent>
              </Tooltip>
            ))}
          </div>

          <div className="h-4 w-px bg-border/60 flex-shrink-0" />

          {/* Focus timer */}
          <div className="flex-shrink-0">
            <FocusTimer />
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className={`h-8 w-8 rounded-xl flex items-center justify-center transition-colors flex-shrink-0 ${
                  showAI
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
                onClick={() => setShowAI(!showAI)}
                data-testid="button-toggle-ai"
              >
                <Sparkles className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">AI-соавтор</TooltipContent>
          </Tooltip>

          {/* Language picker */}
          <div className="flex-shrink-0">
            <LanguagePicker size="sm" />
          </div>
        </header>
      )}

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden relative">
        {activeTab === "editor" && !isDeepWritingMode && (
          <BookSidebar
            bookId={bookId}
            bookMode={book.mode || "scientific"}
            chapters={chapters}
            selectedId={selectedChapterId}
            onSelect={id => setSelectedChapterId(id)}
          />
        )}

        <main className={cn(
          "flex-1 overflow-hidden flex flex-col min-w-0 bg-card",
          isDeepWritingMode && "bg-[#FAF2EA]"
        )}>
          {activeTab === "editor" && (
            <ChapterEditor
              chapter={selectedChapter || null}
              bookTitle={book.title}
              bookMode={book.mode || "scientific"}
              onContextChange={setAiContext}
              onInsertReady={cb => setAiInsertCallback(() => cb)}
              isDeepWritingMode={isDeepWritingMode}
              onToggleDeepWritingMode={() => setIsDeepWritingMode(!isDeepWritingMode)}
            />
          )}



          {activeTab === "characters" && <CharactersPanel bookId={bookId} />}
          {activeTab === "notes" && <NotesPanel bookId={bookId} aiPanelOpen={showAI} />}
          {activeTab === "research" && <ResearchPanel bookId={bookId} book={book} />}
          {activeTab === "board" && <IdeaBoard bookId={bookId} book={book} />}
          {activeTab === "layout" && <LayoutMode bookId={bookId} book={book} />}
          {activeTab === "settings" && <BookSettings book={book} />}
        </main>

        {showAI && !isDeepWritingMode && activeTab === "editor" && (
          <AiPanel
            book={book}
            chapter={selectedChapter || null}
            context={aiContext}
            chapters={chapters}
            onInsert={aiInsertCallback}
          />
        )}
        {showAI && !isDeepWritingMode && (activeTab === "notes" || activeTab === "board" || activeTab === "research") && (
          <AiPanel
            book={book}
            chapter={null}
            context={""}
            chapters={chapters}
            onInsert={null}
          />
        )}
      </div>
    </div>
  );
}
