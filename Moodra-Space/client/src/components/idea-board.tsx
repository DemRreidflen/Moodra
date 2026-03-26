import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLang } from "@/contexts/language-context";
import { SectionTourModal } from "@/components/section-tour-modal";
import { useFreeMode } from "@/hooks/use-free-mode";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAiError } from "@/contexts/ai-error-context";
import { cn } from "@/lib/utils";
import {
  Plus, ZoomIn, ZoomOut, Maximize2, Trash2, Edit2, X, Check,
  Lightbulb, FlaskConical, BookOpen, Layers, FileText, Brain, Link2,
  Sparkles, MessageSquare, Quote, Users, Map, GitBranch,
  Search, Wand2, Shuffle, Eye, EyeOff, PanelLeft,
  Copy, Square, Circle, Diamond, Type, StickyNote, FolderOpen,
  Hash, ExternalLink, AlignLeft, AlignCenter, AlignRight,
  AlignStartVertical, AlignCenterVertical, AlignEndVertical,
  Library, FileEdit, Target, Feather, Telescope, Layers2, RefreshCw
} from "lucide-react";
import type { Book } from "@shared/schema";

// ─── Types ───────────────────────────────────────────────────────────────────

type CoreNodeType = "idea" | "concept" | "chapter" | "hypothesis" | "argument" |
  "counterargument" | "quote" | "source" | "character" | "plot";
type ExtNodeType = "sticky" | "note_card" | "source_card" | "draft_card" |
  "chapter_seed" | "section" | "free_text" | "shape";
type NodeType = CoreNodeType | ExtNodeType;

type EdgeType = "support" | "contradict" | "cause" | "develop" | "effect";
type ShapeKind = "rect" | "circle" | "diamond" | "triangle" | "arrow_right";

interface BoardNode {
  id: string;
  type: NodeType;
  title: string;
  content: string;
  tags: string[];
  x: number;
  y: number;
  w?: number;
  h?: number;
  color?: string;
  // extended
  linkedId?: number;
  linkedType?: "note" | "source" | "draft";
  shapeKind?: ShapeKind;
  stickyColor?: string;
  sectionColor?: string;
  rotation?: number;
}

interface BoardEdge {
  id: string;
  from: string;
  to: string;
  label: string;
  type: EdgeType;
}

interface BoardData {
  nodes: BoardNode[];
  edges: BoardEdge[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STICKY_COLORS = [
  { value: "yellow", bg: "#FFF9C4", text: "#5C4A1E", shadow: "#F9A825" },
  { value: "pink",   bg: "#FCE4EC", text: "#880E4F", shadow: "#EC407A" },
  { value: "blue",   bg: "#E3F2FD", text: "#0D47A1", shadow: "#42A5F5" },
  { value: "green",  bg: "#E8F5E9", text: "#1B5E20", shadow: "#66BB6A" },
  { value: "purple", bg: "#F3E5F5", text: "#4A148C", shadow: "#AB47BC" },
  { value: "mint",   bg: "#E0F7FA", text: "#006064", shadow: "#26C6DA" },
  { value: "orange", bg: "#FFF3E0", text: "#BF360C", shadow: "#FFA726" },
  { value: "gray",   bg: "#F5F5F5", text: "#212121", shadow: "#BDBDBD" },
];

const SECTION_COLORS = [
  { value: "amber",  bg: "rgba(251,191,36,0.07)", border: "#FBB922", title: "#78350F" },
  { value: "blue",   bg: "rgba(59,130,246,0.07)", border: "#3B82F6", title: "#1E3A5F" },
  { value: "purple", bg: "rgba(139,92,246,0.07)", border: "#8B5CF6", title: "#3B1E6A" },
  { value: "green",  bg: "rgba(34,197,94,0.07)",  border: "#22C55E", title: "#14532D" },
  { value: "red",    bg: "rgba(239,68,68,0.07)",  border: "#EF4444", title: "#7F1D1D" },
  { value: "gray",   bg: "rgba(100,116,139,0.05)", border: "#94A3B8", title: "#334155" },
];

const NODE_CONFIGS: Record<CoreNodeType, { bg: string; border: string; text: string; icon: any; accentColor: string }> = {
  idea:           { bg: "#FFFBEB", border: "#FCD34D", text: "#92400E", icon: Lightbulb,    accentColor: "#F59E0B" },
  concept:        { bg: "#F5F3FF", border: "#C4B5FD", text: "#6D28D9", icon: Layers,       accentColor: "#8B5CF6" },
  chapter:        { bg: "#FEF3EC", border: "#FDBA74", text: "#9A3412", icon: FileText,     accentColor: "#F96D1C" },
  hypothesis:     { bg: "#EEF4FF", border: "#93C5FD", text: "#1E40AF", icon: FlaskConical, accentColor: "#3B82F6" },
  argument:       { bg: "#F0FDF4", border: "#86EFAC", text: "#166534", icon: Check,        accentColor: "#22C55E" },
  counterargument:{ bg: "#FFF1F2", border: "#FDA4AF", text: "#9F1239", icon: X,            accentColor: "#F43F5E" },
  quote:          { bg: "#F0F9FF", border: "#7DD3FC", text: "#0C4A6E", icon: Quote,        accentColor: "#0EA5E9" },
  source:         { bg: "#F0FDF4", border: "#6EE7B7", text: "#064E3B", icon: BookOpen,     accentColor: "#10B981" },
  character:      { bg: "#FDF4FF", border: "#E879F9", text: "#701A75", icon: Users,        accentColor: "#D946EF" },
  plot:           { bg: "#FFF7ED", border: "#FDBA74", text: "#7C2D12", icon: Map,          accentColor: "#EA580C" },
};

const EDGE_CONFIGS: Record<EdgeType, { stroke: string; dash?: string }> = {
  support:    { stroke: "#22C55E" },
  contradict: { stroke: "#EF4444", dash: "6,4" },
  cause:      { stroke: "#3B82F6" },
  develop:    { stroke: "#F59E0B" },
  effect:     { stroke: "#8B5CF6" },
};

const NOTE_TYPE_ICONS: Record<string, any> = {
  idea: Lightbulb, note: FileText, quote: MessageSquare, concept: Brain,
  question: Target, scene: BookOpen, insight: Sparkles, observation: Telescope,
  reflection: Feather, argument: Target, character: Users,
};

const NOTE_COLOR_MAP: Record<string, { bg: string; clip: string; text: string }> = {
  yellow: { bg: "#FEFBEE", clip: "#C4900A", text: "#5C4A1E" },
  blue:   { bg: "#F0F6FF", clip: "#4272A6", text: "#2A3F5E" },
  purple: { bg: "#F5F2FF", clip: "#6A52A8", text: "#3B2760" },
  green:  { bg: "#F2FBF5", clip: "#3D8054", text: "#1E4A2E" },
  pink:   { bg: "#FEF3FA", clip: "#A04C86", text: "#5C2848" },
  orange: { bg: "#FFF7F0", clip: "#B45C28", text: "#5C3420" },
  gray:   { bg: "#F7F7F7", clip: "#707070", text: "#3A3A3A" },
};

const DEFAULT_NODE_W = 220;
const DEFAULT_NODE_H = 110;
const STICKY_W = 200;
const STICKY_H = 200;
const SECTION_W = 500;
const SECTION_H = 340;
const SHAPE_W = 120;
const SHAPE_H = 90;

function uid() { return Math.random().toString(36).slice(2, 10); }
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();
}
function getNodeSize(node: BoardNode) {
  const defaults: Record<string, { w: number; h: number }> = {
    sticky: { w: STICKY_W, h: STICKY_H },
    section: { w: SECTION_W, h: SECTION_H },
    shape: { w: SHAPE_W, h: SHAPE_H },
    free_text: { w: 180, h: 60 },
    note_card: { w: 220, h: 130 },
    source_card: { w: 220, h: 130 },
    draft_card: { w: 220, h: 110 },
    chapter_seed: { w: 200, h: 100 },
  };
  const def = defaults[node.type] || { w: DEFAULT_NODE_W, h: DEFAULT_NODE_H };
  return { w: node.w || def.w, h: node.h || def.h };
}

// ─── i18n ────────────────────────────────────────────────────────────────────

const IDEA_BOARD_I18N: Record<string, Record<string, string>> = {
  en: {
    idea: "Idea", concept: "Concept", chapter: "Chapter", hypothesis: "Hypothesis",
    argument: "Argument", counterargument: "Counter-\nargument", quote: "Quote",
    source: "Source", character: "Character", plot: "Plot",
    sticky: "Sticky", note_card: "Note", source_card: "Source", draft_card: "Draft",
    chapter_seed: "Chapter seed", section: "Section", free_text: "Text", shape: "Shape",
    support: "Supports", contradict: "Contradicts", cause: "Cause", develop: "Develops", effect: "Effect",
    search: "Search...", cardType: "Card type", all: "All",
    doubleClickToAdd: "Double click to add a card", noMatches: "No matches",
    newCard: "New card", leftPanel: "Left panel", connectionType: "Connection type",
    aiIdeas: "Идеи", aiSuggestions: "AI suggestions", basedOnSelected: "Based on selected",
    generating: "Generating...", refreshSuggestions: "Refresh", addToBoard: "Add to board",
    pressRefresh: "Press Refresh to generate ideas", ideaAdded: "Added to board",
    autoArrange: "Auto-arrange", hideLabels: "Hide labels", showLabels: "Show labels",
    zoomIn: "Zoom in", zoomOut: "Zoom out", fitAll: "Fit to screen",
    cards: "cards", connections: "connections",
    properties: "Properties", title: "Title", description: "Description", tags: "Tags",
    connectionsLabel: "Connections", edit: "Edit", deleteLabel: "Delete",
    cardTitle: "Card title...", descOptional: "Description...",
    tagsPlaceholder: "Tags: idea, plot, character",
    tagsEdit: "Tags (comma separated)", save: "Save", add: "Add", cancel: "Cancel",
    editNode: "Edit", deleteNode: "Delete", drawConnection: "Connect", resize: "Resize",
    saveError: "Save error", aiError: "AI Error", duplicate: "Duplicate",
    library: "Library", notes: "Notes", sources: "Sources", drafts: "Drafts",
    addFromLib: "Add to board", noNotes: "No notes yet", noSources: "No sources yet",
    linkedNote: "Linked note", linkedSource: "Linked source",
    openOriginal: "Open original", refreshCard: "Refresh from source",
    stickyNote: "Sticky note", newSection: "New section", newShape: "New shape",
    objectCards: "Object cards", semanticCards: "Semantic cards", freeObjects: "Free objects",
    align: "Align", alignLeft: "Align left", alignCenter: "Align center",
    alignRight: "Align right", alignTop: "Align top", alignMiddle: "Align middle",
    alignBottom: "Align bottom",
  },
  ru: {
    idea: "Идея", concept: "Концепция", chapter: "Глава", hypothesis: "Гипотеза",
    argument: "Аргумент", counterargument: "Контр-\nаргумент", quote: "Цитата",
    source: "Источник", character: "Персонаж", plot: "Сюжет",
    sticky: "Стикер", note_card: "Заметка", source_card: "Источник", draft_card: "Черновик",
    chapter_seed: "Зерно главы", section: "Секция", free_text: "Текст", shape: "Фигура",
    support: "Поддерживает", contradict: "Противоречит", cause: "Причина",
    develop: "Развивает", effect: "Следствие",
    search: "Поиск...", cardType: "Тип карточки", all: "Все",
    doubleClickToAdd: "Двойной клик для добавления", noMatches: "Нет совпадений",
    newCard: "Новая карточка", leftPanel: "Левая панель", connectionType: "Тип связи",
    aiIdeas: "Идеи", aiSuggestions: "AI-предложения", basedOnSelected: "На основе выбранных",
    generating: "Генерирую...", refreshSuggestions: "Обновить", addToBoard: "На доску",
    pressRefresh: "Нажмите «Обновить» для генерации", ideaAdded: "Добавлено на доску",
    autoArrange: "Авторасположение", hideLabels: "Скрыть подписи", showLabels: "Показать подписи",
    zoomIn: "Увеличить", zoomOut: "Уменьшить", fitAll: "По размеру экрана",
    cards: "карточек", connections: "связей",
    properties: "Свойства", title: "Название", description: "Описание", tags: "Теги",
    connectionsLabel: "Связи", edit: "Редактировать", deleteLabel: "Удалить",
    cardTitle: "Название карточки...", descOptional: "Описание...",
    tagsPlaceholder: "Теги: идея, сюжет, персонаж",
    tagsEdit: "Теги (через запятую)", save: "Сохранить", add: "Добавить", cancel: "Отмена",
    editNode: "Ред.", deleteNode: "Удалить", drawConnection: "Связь", resize: "Размер",
    saveError: "Ошибка сохранения", aiError: "Ошибка AI", duplicate: "Дублировать",
    library: "Библиотека", notes: "Заметки", sources: "Источники", drafts: "Черновики",
    addFromLib: "На доску", noNotes: "Нет заметок", noSources: "Нет источников",
    linkedNote: "Связанная заметка", linkedSource: "Связанный источник",
    openOriginal: "Открыть оригинал", refreshCard: "Обновить из источника",
    stickyNote: "Стикер", newSection: "Секция", newShape: "Фигура",
    objectCards: "Карточки объектов", semanticCards: "Семант. карточки", freeObjects: "Свободные",
    align: "Выровнять", alignLeft: "По левому", alignCenter: "По центру",
    alignRight: "По правому", alignTop: "По верхнему", alignMiddle: "По середине",
    alignBottom: "По нижнему",
  },
  ua: {
    idea: "Ідея", concept: "Концепція", chapter: "Глава", hypothesis: "Гіпотеза",
    argument: "Аргумент", counterargument: "Контр-\nаргумент", quote: "Цитата",
    source: "Джерело", character: "Персонаж", plot: "Сюжет",
    sticky: "Стікер", note_card: "Нотатка", source_card: "Джерело", draft_card: "Чернетка",
    chapter_seed: "Зерно глави", section: "Секція", free_text: "Текст", shape: "Фігура",
    support: "Підтримує", contradict: "Суперечить", cause: "Причина",
    develop: "Розвиває", effect: "Наслідок",
    search: "Пошук...", cardType: "Тип картки", all: "Всі",
    doubleClickToAdd: "Подвійний клік для додавання", noMatches: "Немає збігів",
    newCard: "Нова картка", leftPanel: "Ліва панель", connectionType: "Тип зв'язку",
    aiIdeas: "Ідеї", aiSuggestions: "AI-пропозиції", basedOnSelected: "На основі вибраних",
    generating: "Генерую...", refreshSuggestions: "Оновити", addToBoard: "На дошку",
    pressRefresh: "Натисніть «Оновити» для генерації", ideaAdded: "Додано на дошку",
    autoArrange: "Авторозміщення", hideLabels: "Сховати підписи", showLabels: "Показати підписи",
    zoomIn: "Збільшити", zoomOut: "Зменшити", fitAll: "За розміром екрана",
    cards: "карток", connections: "зв'язків",
    properties: "Властивості", title: "Назва", description: "Опис", tags: "Теги",
    connectionsLabel: "Зв'язки", edit: "Редагувати", deleteLabel: "Видалити",
    cardTitle: "Назва картки...", descOptional: "Опис...",
    tagsPlaceholder: "Теги: ідея, сюжет, персонаж",
    tagsEdit: "Теги (через кому)", save: "Зберегти", add: "Додати", cancel: "Скасувати",
    editNode: "Ред.", deleteNode: "Видалити", drawConnection: "Зв'язок", resize: "Розмір",
    saveError: "Помилка збереження", aiError: "Помилка AI", duplicate: "Дублювати",
    library: "Бібліотека", notes: "Нотатки", sources: "Джерела", drafts: "Чернетки",
    addFromLib: "На дошку", noNotes: "Немає нотаток", noSources: "Немає джерел",
    linkedNote: "Пов'язана нотатка", linkedSource: "Пов'язане джерело",
    openOriginal: "Відкрити оригінал", refreshCard: "Оновити з джерела",
    stickyNote: "Стікер", newSection: "Секція", newShape: "Фігура",
    objectCards: "Картки об'єктів", semanticCards: "Сем. картки", freeObjects: "Вільні",
    align: "Вирівняти", alignLeft: "По лівому", alignCenter: "По центру",
    alignRight: "По правому", alignTop: "По верхньому", alignMiddle: "По середині",
    alignBottom: "По нижньому",
  },
  de: {
    idea: "Idee", concept: "Konzept", chapter: "Kapitel", hypothesis: "Hypothese",
    argument: "Argument", counterargument: "Gegen-\nargument", quote: "Zitat",
    source: "Quelle", character: "Figur", plot: "Handlung",
    sticky: "Haftnotiz", note_card: "Notiz", source_card: "Quelle", draft_card: "Entwurf",
    chapter_seed: "Kapitelkeim", section: "Abschnitt", free_text: "Text", shape: "Form",
    support: "Unterstützt", contradict: "Widerspricht", cause: "Ursache",
    develop: "Entwickelt", effect: "Wirkung",
    search: "Suche...", cardType: "Kartentyp", all: "Alle",
    doubleClickToAdd: "Doppelklick zum Hinzufügen", noMatches: "Keine Treffer",
    newCard: "Neue Karte", leftPanel: "Linkes Panel", connectionType: "Verbindungstyp",
    aiIdeas: "Ideen", aiSuggestions: "KI-Vorschläge", basedOnSelected: "Basierend auf Auswahl",
    generating: "Generiere...", refreshSuggestions: "Aktualisieren", addToBoard: "Zum Board",
    pressRefresh: "Aktualisieren drücken", ideaAdded: "Zum Board hinzugefügt",
    autoArrange: "Auto-Anordnung", hideLabels: "Labels ausblenden", showLabels: "Labels anzeigen",
    zoomIn: "Vergrößern", zoomOut: "Verkleinern", fitAll: "Anpassen",
    cards: "Karten", connections: "Verbindungen",
    properties: "Eigenschaften", title: "Titel", description: "Beschreibung", tags: "Tags",
    connectionsLabel: "Verbindungen", edit: "Bearbeiten", deleteLabel: "Löschen",
    cardTitle: "Kartentitel...", descOptional: "Beschreibung...",
    tagsPlaceholder: "Tags: Idee, Handlung, Figur",
    tagsEdit: "Tags (kommagetrennt)", save: "Speichern", add: "Hinzufügen", cancel: "Abbrechen",
    editNode: "Bearbeiten", deleteNode: "Löschen", drawConnection: "Verbinden", resize: "Größe",
    saveError: "Speicherfehler", aiError: "KI-Fehler", duplicate: "Duplizieren",
    library: "Bibliothek", notes: "Notizen", sources: "Quellen", drafts: "Entwürfe",
    addFromLib: "Zum Board", noNotes: "Keine Notizen", noSources: "Keine Quellen",
    linkedNote: "Verknüpfte Notiz", linkedSource: "Verknüpfte Quelle",
    openOriginal: "Original öffnen", refreshCard: "Aus Quelle aktualisieren",
    stickyNote: "Haftnotiz", newSection: "Abschnitt", newShape: "Form",
    objectCards: "Objektkarten", semanticCards: "Sem. Karten", freeObjects: "Freie Obj.",
    align: "Ausrichten", alignLeft: "Links", alignCenter: "Mitte",
    alignRight: "Rechts", alignTop: "Oben", alignMiddle: "Mitte", alignBottom: "Unten",
  },
};

const NODE_TYPE_KEYS: Record<NodeType, string> = {
  idea: "idea", concept: "concept", chapter: "chapter", hypothesis: "hypothesis",
  argument: "argument", counterargument: "counterargument", quote: "quote",
  source: "source", character: "character", plot: "plot",
  sticky: "sticky", note_card: "note_card", source_card: "source_card",
  draft_card: "draft_card", chapter_seed: "chapter_seed",
  section: "section", free_text: "free_text", shape: "shape",
};

// ─── IdeaBoard ────────────────────────────────────────────────────────────────

export function IdeaBoard({ bookId, book }: { bookId: number; book: Book }) {
  const { toast } = useToast();
  const { handleAiError } = useAiError();
  const { lang } = useLang();
  const s = IDEA_BOARD_I18N[lang] || IDEA_BOARD_I18N.en;

  const [board, setBoard] = useState<BoardData>({ nodes: [], edges: [] });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [draggingOffset, setDraggingOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [panOrigin, setPanOrigin] = useState({ x: 0, y: 0 });
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [connectMouse, setConnectMouse] = useState({ x: 0, y: 0 });
  const [resizingNode, setResizingNode] = useState<{
    id: string; startX: number; startY: number; startW: number; startH: number;
  } | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [newEdgeType, setNewEdgeType] = useState<EdgeType>("develop");
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [filterType, setFilterType] = useState<NodeType | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState<{ x: number; y: number } | null>(null);
  const [addForm, setAddForm] = useState({ title: "", content: "", type: "idea" as NodeType, tags: "", stickyColor: "yellow", sectionColor: "amber", shapeKind: "rect" as ShapeKind });
  const [addDialogTab, setAddDialogTab] = useState<"cards" | "semantic" | "free">("cards");
  const [editForm, setEditForm] = useState({ title: "", content: "", tags: "", type: "idea" as NodeType });
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [freeGateOpen, setFreeGateOpen] = useState(false);
  const { isFreeMode } = useFreeMode();
  const [, setLocation] = useLocation();
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [leftPanelTab, setLeftPanelTab] = useState<"board" | "library">("board");
  const [libraryTab, setLibraryTab] = useState<"notes" | "sources">("notes");
  const [linkedCardPopup, setLinkedCardPopup] = useState<BoardNode | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: boardData } = useQuery<{ data: string }>({
    queryKey: ["/api/books", bookId, "board"],
    queryFn: () => apiRequest("GET", `/api/books/${bookId}/board`),
  });

  const { data: notesData = [] } = useQuery<any[]>({
    queryKey: ["/api/books", bookId, "notes"],
    queryFn: () => apiRequest("GET", `/api/books/${bookId}/notes`),
  });

  const { data: sourcesData = [] } = useQuery<any[]>({
    queryKey: ["/api/books", bookId, "sources"],
    queryFn: () => apiRequest("GET", `/api/books/${bookId}/sources`),
  });

  useEffect(() => {
    if (boardData?.data) {
      try {
        const parsed = JSON.parse(boardData.data);
        if (parsed.nodes) setBoard(parsed);
      } catch {}
    }
  }, [boardData]);

  const saveMutation = useMutation({
    mutationFn: (data: string) => apiRequest("PATCH", `/api/books/${bookId}/board`, { data }),
    onError: () => toast({ title: s.saveError, variant: "destructive" }),
  });

  const scheduleAutoSave = useCallback((nextBoard: BoardData) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveMutation.mutate(JSON.stringify(nextBoard));
    }, 1500);
  }, [saveMutation]);

  const updateBoard = useCallback((updater: (prev: BoardData) => BoardData) => {
    setBoard(prev => {
      const next = updater(prev);
      scheduleAutoSave(next);
      return next;
    });
  }, [scheduleAutoSave]);

  const toCanvas = useCallback((clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top - pan.y) / zoom,
    };
  }, [pan, zoom]);

  const handleCanvasDoubleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".board-node")) return;
    const { x, y } = toCanvas(e.clientX, e.clientY);
    setShowAddDialog({ x, y });
    setAddForm({ title: "", content: "", type: "idea", tags: "", stickyColor: "yellow", sectionColor: "amber", shapeKind: "rect" });
    setAddDialogTab("cards");
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".board-node")) return;
    if (e.button !== 0) return;
    setSelectedNodes(new Set());
    setSelectedEdge(null);
    setLinkedCardPopup(null);
    setIsPanning(true);
    setPanStart({ x: e.clientX, y: e.clientY });
    setPanOrigin({ x: pan.x, y: pan.y });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: panOrigin.x + (e.clientX - panStart.x),
        y: panOrigin.y + (e.clientY - panStart.y),
      });
    }
    if (draggingNode) {
      const { x, y } = toCanvas(e.clientX, e.clientY);
      updateBoard(prev => ({
        ...prev,
        nodes: prev.nodes.map(n =>
          n.id === draggingNode ? { ...n, x: x - draggingOffset.x, y: y - draggingOffset.y } : n
        ),
      }));
    }
    if (resizingNode) {
      const dx = (e.clientX - resizingNode.startX) / zoom;
      const dy = (e.clientY - resizingNode.startY) / zoom;
      const minW = resizingNode.id && board.nodes.find(n => n.id === resizingNode.id)?.type === "section" ? 200 : 100;
      const minH = 60;
      const newW = Math.max(minW, resizingNode.startW + dx);
      const newH = Math.max(minH, resizingNode.startH + dy);
      updateBoard(prev => ({
        ...prev,
        nodes: prev.nodes.map(n => n.id === resizingNode.id ? { ...n, w: newW, h: newH } : n),
      }));
    }
    if (connectingFrom) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) setConnectMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  };

  const handleCanvasMouseUp = () => {
    setIsPanning(false);
    setDraggingNode(null);
    setConnectingFrom(null);
    setResizingNode(null);
  };

  const handleResizeStart = (e: React.MouseEvent, node: BoardNode) => {
    e.stopPropagation();
    e.preventDefault();
    const size = getNodeSize(node);
    setResizingNode({ id: node.id, startX: e.clientX, startY: e.clientY, startW: size.w, startH: size.h });
  };

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    if (editingNode === nodeId) return;
    const { x, y } = toCanvas(e.clientX, e.clientY);
    const node = board.nodes.find(n => n.id === nodeId);
    if (!node) return;
    setDraggingOffset({ x: x - node.x, y: y - node.y });
    setDraggingNode(nodeId);
    if (e.shiftKey) {
      setSelectedNodes(prev => {
        const next = new Set(prev);
        next.has(nodeId) ? next.delete(nodeId) : next.add(nodeId);
        return next;
      });
    } else {
      setSelectedNodes(new Set([nodeId]));
    }
  };

  const handleNodeClick = (e: React.MouseEvent, nodeId: string) => {
    if (connectingFrom && connectingFrom !== nodeId) {
      const existing = board.edges.find(
        ed => (ed.from === connectingFrom && ed.to === nodeId) || (ed.from === nodeId && ed.to === connectingFrom)
      );
      if (!existing) {
        updateBoard(prev => ({
          ...prev,
          edges: [...prev.edges, { id: uid(), from: connectingFrom!, to: nodeId, label: "", type: newEdgeType }],
        }));
      }
      setConnectingFrom(null);
      return;
    }
    e.stopPropagation();
    setSelectedNodes(new Set([nodeId]));
    setShowRightPanel(true);

    const node = board.nodes.find(n => n.id === nodeId);
    if (node?.linkedType && node?.linkedId) {
      setLinkedCardPopup(node);
    }
  };

  const handleConnectStart = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    e.preventDefault();
    setConnectingFrom(nodeId);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) setConnectMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const deleteNode = (nodeId: string) => {
    updateBoard(prev => ({
      nodes: prev.nodes.filter(n => n.id !== nodeId),
      edges: prev.edges.filter(e => e.from !== nodeId && e.to !== nodeId),
    }));
    setSelectedNodes(new Set());
    setShowRightPanel(false);
    setLinkedCardPopup(null);
  };

  const duplicateNode = (nodeId: string) => {
    const node = board.nodes.find(n => n.id === nodeId);
    if (!node) return;
    const newNode: BoardNode = { ...node, id: uid(), x: node.x + 30, y: node.y + 30 };
    updateBoard(prev => ({ ...prev, nodes: [...prev.nodes, newNode] }));
    toast({ title: s.duplicate });
  };

  const startEdit = (nodeId: string) => {
    const node = board.nodes.find(n => n.id === nodeId);
    if (!node) return;
    setEditingNode(nodeId);
    setEditForm({ title: node.title, content: node.content, tags: (node.tags || []).join(", "), type: node.type });
  };

  const saveEdit = () => {
    if (!editingNode) return;
    const tags = editForm.tags.split(",").map(t => t.trim()).filter(Boolean);
    updateBoard(prev => ({
      ...prev,
      nodes: prev.nodes.map(n =>
        n.id === editingNode ? { ...n, title: editForm.title, content: editForm.content, tags, type: editForm.type } : n
      ),
    }));
    setEditingNode(null);
  };

  const addNode = () => {
    if (!showAddDialog) return;
    const isNoTitle = addForm.type === "section" || addForm.type === "shape";
    if (!isNoTitle && !addForm.title.trim()) return;
    const tags = addForm.tags.split(",").map(t => t.trim()).filter(Boolean);
    const size = getNodeSize({ ...addForm, id: "", tags: [], x: 0, y: 0 } as BoardNode);
    const newNode: BoardNode = {
      id: uid(),
      type: addForm.type,
      title: addForm.title.trim() || (addForm.type === "section" ? "Section" : "Shape"),
      content: addForm.content,
      tags,
      x: showAddDialog.x - size.w / 2,
      y: showAddDialog.y - size.h / 2,
      stickyColor: addForm.stickyColor,
      sectionColor: addForm.sectionColor,
      shapeKind: addForm.shapeKind,
    };
    updateBoard(prev => ({ ...prev, nodes: [...prev.nodes, newNode] }));
    setShowAddDialog(null);
  };

  const addNodeFromLib = (type: "note_card" | "source_card", item: any) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (rect.width / 2 - pan.x) / zoom + (Math.random() - 0.5) * 400;
    const y = (rect.height / 2 - pan.y) / zoom + (Math.random() - 0.5) * 250;
    const tags = (item.tags || "").split(",").map((t: string) => t.trim()).filter(Boolean);
    const newNode: BoardNode = {
      id: uid(), type,
      title: item.title || "Untitled",
      content: item.content || item.notes || item.quote || "",
      tags,
      x: x - 110, y: y - 65,
      linkedId: item.id,
      linkedType: type === "note_card" ? "note" : "source",
      color: item.color || undefined,
    };
    updateBoard(prev => ({ ...prev, nodes: [...prev.nodes, newNode] }));
    toast({ title: s.ideaAdded });
  };

  const addNodeFromSidebar = () => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (rect.width / 2 - pan.x) / zoom;
    const y = (rect.height / 2 - pan.y) / zoom;
    setShowAddDialog({ x, y });
    setAddForm({ title: "", content: "", type: "idea", tags: "", stickyColor: "yellow", sectionColor: "amber", shapeKind: "rect" });
    setAddDialogTab("cards");
  };

  const deleteEdge = (edgeId: string) => {
    updateBoard(prev => ({ ...prev, edges: prev.edges.filter(e => e.id !== edgeId) }));
    setSelectedEdge(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.12 : 0.88;
    const newZoom = Math.min(3, Math.max(0.2, zoom * factor));
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    setPan(prev => ({
      x: mouseX - (mouseX - prev.x) * (newZoom / zoom),
      y: mouseY - (mouseY - prev.y) * (newZoom / zoom),
    }));
    setZoom(newZoom);
  };

  const fitAll = () => {
    if (board.nodes.length === 0) { setPan({ x: 0, y: 0 }); setZoom(1); return; }
    const xs = board.nodes.map(n => n.x);
    const ys = board.nodes.map(n => n.y);
    const widths = board.nodes.map(n => getNodeSize(n).w);
    const heights = board.nodes.map(n => getNodeSize(n).h);
    const minX = Math.min(...xs), maxX = Math.max(...xs.map((x, i) => x + widths[i]));
    const minY = Math.min(...ys), maxY = Math.max(...ys.map((y, i) => y + heights[i]));
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const padding = 80;
    const scaleX = (rect.width - padding * 2) / (maxX - minX || 1);
    const scaleY = (rect.height - padding * 2) / (maxY - minY || 1);
    const newZoom = Math.min(scaleX, scaleY, 1.5);
    setZoom(newZoom);
    setPan({
      x: (rect.width - (maxX - minX) * newZoom) / 2 - minX * newZoom,
      y: (rect.height - (maxY - minY) * newZoom) / 2 - minY * newZoom,
    });
  };

  const focusNode = (nodeId: string) => {
    const node = board.nodes.find(n => n.id === nodeId);
    if (!node) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const size = getNodeSize(node);
    const targetZoom = Math.min(zoom, 1);
    setPan({
      x: rect.width / 2 - (node.x + size.w / 2) * targetZoom,
      y: rect.height / 2 - (node.y + size.h / 2) * targetZoom,
    });
    setZoom(targetZoom);
    setSelectedNodes(new Set([nodeId]));
    setShowRightPanel(true);
  };

  const getNodeCenter = (node: BoardNode) => {
    const size = getNodeSize(node);
    return {
      x: (node.x + size.w / 2) * zoom + pan.x,
      y: (node.y + size.h / 2) * zoom + pan.y,
    };
  };

  const getEdgePath = (edge: BoardEdge) => {
    const fromNode = board.nodes.find(n => n.id === edge.from);
    const toNode = board.nodes.find(n => n.id === edge.to);
    if (!fromNode || !toNode) return null;
    const from = getNodeCenter(fromNode);
    const to = getNodeCenter(toNode);
    const dx = to.x - from.x, dy = to.y - from.y;
    const cx = (from.x + to.x) / 2 + dy * 0.2;
    const cy = (from.y + to.y) / 2 - dx * 0.2;
    const mx = (from.x + cx + to.x) / 3;
    const my = (from.y + cy + to.y) / 3;
    return { from, to, mx, my, path: `M ${from.x},${from.y} Q ${cx},${cy} ${to.x},${to.y}` };
  };

  const alignNodes = (axis: "left" | "center-h" | "right" | "top" | "center-v" | "bottom") => {
    const selArr = [...selectedNodes];
    if (selArr.length < 2) return;
    const nodes = board.nodes.filter(n => selectedNodes.has(n.id));
    const sizes = nodes.map(n => getNodeSize(n));
    let refVal: number;
    if (axis === "left") refVal = Math.min(...nodes.map(n => n.x));
    else if (axis === "right") refVal = Math.max(...nodes.map((n, i) => n.x + sizes[i].w));
    else if (axis === "center-h") {
      const minX = Math.min(...nodes.map(n => n.x));
      const maxX = Math.max(...nodes.map((n, i) => n.x + sizes[i].w));
      refVal = (minX + maxX) / 2;
    } else if (axis === "top") refVal = Math.min(...nodes.map(n => n.y));
    else if (axis === "bottom") refVal = Math.max(...nodes.map((n, i) => n.y + sizes[i].h));
    else {
      const minY = Math.min(...nodes.map(n => n.y));
      const maxY = Math.max(...nodes.map((n, i) => n.y + sizes[i].h));
      refVal = (minY + maxY) / 2;
    }
    updateBoard(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => {
        if (!selectedNodes.has(n.id)) return n;
        const size = getNodeSize(n);
        if (axis === "left") return { ...n, x: refVal };
        if (axis === "right") return { ...n, x: refVal - size.w };
        if (axis === "center-h") return { ...n, x: refVal - size.w / 2 };
        if (axis === "top") return { ...n, y: refVal };
        if (axis === "bottom") return { ...n, y: refVal - size.h };
        if (axis === "center-v") return { ...n, y: refVal - size.h / 2 };
        return n;
      }),
    }));
  };

  const callAiSuggest = useCallback(async () => {
    if (isFreeMode) { setFreeGateOpen(true); return; }
    setIsAiLoading(true);
    setAiSuggestions([]);
    try {
      const selectedNodesList = board.nodes.filter(n => selectedNodes.has(n.id));
      const context = board.nodes.map(n => `${n.type}: ${n.title}${n.content ? ` — ${n.content}` : ""}`).join("\n");
      const selection = selectedNodesList.length > 0
        ? `\n${s.basedOnSelected}:\n${selectedNodesList.map(n => `${n.type}: ${n.title}`).join("\n")}`
        : "";
      const response = await apiRequest("POST", "/api/ai/generate", {
        mode: "ideas", bookTitle: book.title, bookMode: book.mode,
        chapterTitle: "Idea board", lang,
        content: context + selection,
        instruction: `Suggest 4 short ideas for the book "${book.title}". Reply with a list of 4 ideas (one per line, no numbering).`,
      });
      const text = typeof response === "string" ? response : JSON.stringify(response);
      const lines = text.split("\n").map((l: string) => l.replace(/^[-•*\d.]+\s*/, "").trim()).filter((l: string) => l.length > 5).slice(0, 4);
      setAiSuggestions(lines);
    } catch (e: any) {
      if (!handleAiError(e)) toast({ title: s.aiError, variant: "destructive" });
    } finally {
      setIsAiLoading(false);
    }
  }, [board.nodes, selectedNodes, book, toast]);

  const addSuggestionAsNode = (text: string) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (rect.width / 2 - pan.x) / zoom + (Math.random() - 0.5) * 300;
    const y = (rect.height / 2 - pan.y) / zoom + (Math.random() - 0.5) * 200;
    const newNode: BoardNode = { id: uid(), type: "idea", title: text, content: "", tags: [], x: x - 110, y: y - 55 };
    updateBoard(prev => ({ ...prev, nodes: [...prev.nodes, newNode] }));
    setAiSuggestions(prev => prev.filter(item => item !== text));
    toast({ title: s.ideaAdded });
  };

  const autoArrange = () => {
    const nonSections = board.nodes.filter(n => n.type !== "section");
    const cols = Math.ceil(Math.sqrt(nonSections.length));
    const gap = 40;
    const arranged = nonSections.map((n, i) => ({
      ...n,
      x: (i % cols) * (DEFAULT_NODE_W + gap),
      y: Math.floor(i / cols) * (DEFAULT_NODE_H + gap + 20),
    }));
    updateBoard(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => n.type === "section" ? n : arranged.find(a => a.id === n.id) || n),
    }));
    setTimeout(fitAll, 100);
  };

  const filteredNodes = useMemo(() => board.nodes.filter(n => {
    if (filterType !== "all" && n.type !== filterType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q) ||
        (n.tags || []).some(t => t.toLowerCase().includes(q));
    }
    return true;
  }), [board.nodes, filterType, searchQuery]);

  const selectedNode = board.nodes.find(n => selectedNodes.size === 1 && selectedNodes.has(n.id));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if ((e.key === "d" || e.key === "D") && selectedNodes.size === 1) {
        const [id] = selectedNodes;
        duplicateNode(id);
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        selectedNodes.forEach(id => deleteNode(id));
      }
      if (e.key === "Escape") {
        setSelectedNodes(new Set());
        setConnectingFrom(null);
        setEditingNode(null);
        setLinkedCardPopup(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedNodes, board.nodes]);

  // ─── Node renderers ──────────────────────────────────────────────────────────

  const renderStickyNode = (node: BoardNode, isSelected: boolean, isEditing: boolean, size: { w: number; h: number }) => {
    const sc = STICKY_COLORS.find(c => c.value === node.stickyColor) || STICKY_COLORS[0];
    return (
      <div
        className="relative flex flex-col overflow-hidden rounded-lg transition-all"
        style={{
          background: sc.bg,
          width: "100%", height: node.h ? "100%" : size.h * zoom,
          boxShadow: isSelected
            ? `0 0 0 2.5px ${sc.shadow}, 0 6px 24px rgba(0,0,0,0.18)`
            : `2px 4px 12px rgba(0,0,0,0.15)`,
          border: isSelected ? `2px solid ${sc.shadow}` : "none",
        }}
      >
        {/* Folded corner effect */}
        <div className="absolute bottom-0 right-0 w-6 h-6" style={{ background: `linear-gradient(135deg, ${sc.bg} 50%, rgba(0,0,0,0.12) 50%)` }} />
        {isEditing ? (
          <div className="flex-1 p-3 flex flex-col gap-2" onClick={e => e.stopPropagation()}>
            <textarea autoFocus value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
              className="flex-1 bg-transparent outline-none text-sm font-medium leading-relaxed resize-none w-full"
              style={{ color: sc.text }} rows={5} />
            <div className="flex gap-1">
              <button className="flex-1 h-6 rounded text-[10px] font-semibold text-white flex items-center justify-center gap-0.5"
                style={{ backgroundColor: sc.shadow }} onClick={saveEdit}>
                <Check className="h-2.5 w-2.5" /> {s.save}
              </button>
              <button className="h-6 w-6 rounded bg-black/10 flex items-center justify-center" onClick={() => setEditingNode(null)}>
                <X className="h-2.5 w-2.5" style={{ color: sc.text }} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 p-3.5 overflow-hidden">
            <p className="font-medium leading-relaxed break-words" style={{ color: sc.text, fontSize: Math.max(11, 13 * zoom) }}>
              {node.title}
            </p>
            {node.content && (
              <p className="mt-1.5 leading-relaxed opacity-70 break-words" style={{ color: sc.text, fontSize: Math.max(9, 11 * zoom) }}>
                {stripHtml(node.content)}
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderSectionNode = (node: BoardNode, isSelected: boolean, size: { w: number; h: number }) => {
    const sc = SECTION_COLORS.find(c => c.value === node.sectionColor) || SECTION_COLORS[0];
    return (
      <div
        className="rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: sc.bg,
          border: `${isSelected ? 2.5 : 1.5}px solid ${sc.border}`,
          width: "100%",
          height: node.h ? "100%" : size.h * zoom,
          boxShadow: isSelected ? `0 0 0 3px ${sc.border}30` : "none",
        }}
      >
        <div className="flex items-center gap-2 px-3 py-2 flex-shrink-0" style={{ background: `${sc.border}18`, borderBottom: `1px solid ${sc.border}30` }}>
          <Layers2 style={{ width: 11, height: 11, color: sc.title, flexShrink: 0 }} />
          {editingNode === node.id ? (
            <input autoFocus value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
              onBlur={saveEdit} onKeyDown={e => e.key === "Enter" && saveEdit()}
              className="flex-1 bg-transparent outline-none text-xs font-semibold" style={{ color: sc.title }}
              onClick={e => e.stopPropagation()} />
          ) : (
            <span style={{ color: sc.title, fontSize: Math.max(10, 11 * zoom), fontWeight: 600 }}>{node.title}</span>
          )}
        </div>
      </div>
    );
  };

  const renderShapeNode = (node: BoardNode, isSelected: boolean, size: { w: number; h: number }) => {
    const shapeColors = [
      "#F96D1C", "#3B82F6", "#22C55E", "#8B5CF6", "#EC4899", "#F59E0B", "#6B7280"
    ];
    const shapeColor = node.color && shapeColors.includes(node.color) ? node.color : shapeColors[0];
    const w = size.w * zoom;
    const h = size.h * zoom;
    const shapeKind = node.shapeKind || "rect";

    const shapeStyle: React.CSSProperties = {
      width: w, height: h, position: "relative",
      boxShadow: isSelected ? `0 0 0 2.5px ${shapeColor}` : undefined,
    };

    if (shapeKind === "rect") {
      return (
        <div style={{ ...shapeStyle, background: `${shapeColor}30`, border: `2px solid ${shapeColor}`, borderRadius: 10 }} className="flex items-center justify-center">
          {node.title && node.title !== "Shape" && <span style={{ color: shapeColor, fontSize: Math.max(9, 11 * zoom), fontWeight: 600 }}>{node.title}</span>}
        </div>
      );
    }
    if (shapeKind === "circle") {
      return (
        <div style={{ ...shapeStyle, background: `${shapeColor}30`, border: `2px solid ${shapeColor}`, borderRadius: "50%" }} className="flex items-center justify-center">
          {node.title && node.title !== "Shape" && <span style={{ color: shapeColor, fontSize: Math.max(9, 11 * zoom), fontWeight: 600 }}>{node.title}</span>}
        </div>
      );
    }
    if (shapeKind === "diamond") {
      return (
        <div style={{ width: w, height: h, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{
            width: w * 0.7, height: h * 0.7, background: `${shapeColor}30`,
            border: `2px solid ${shapeColor}`, transform: "rotate(45deg)",
            boxShadow: isSelected ? `0 0 0 2px ${shapeColor}` : undefined,
          }} />
          {node.title && node.title !== "Shape" && (
            <span style={{ position: "absolute", color: shapeColor, fontSize: Math.max(9, 10 * zoom), fontWeight: 600 }}>{node.title}</span>
          )}
        </div>
      );
    }
    if (shapeKind === "triangle") {
      return (
        <div style={{ width: w, height: h, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
            <polygon points={`${w / 2},0 ${w},${h} 0,${h}`}
              fill={`${shapeColor}30`} stroke={shapeColor} strokeWidth={2} />
          </svg>
          {node.title && node.title !== "Shape" && (
            <span style={{ position: "absolute", bottom: 8, color: shapeColor, fontSize: Math.max(9, 10 * zoom), fontWeight: 600 }}>{node.title}</span>
          )}
        </div>
      );
    }
    if (shapeKind === "arrow_right") {
      return (
        <div style={{ width: w, height: h, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
            <polygon
              points={`0,${h * 0.3} ${w * 0.65},${h * 0.3} ${w * 0.65},${h * 0.1} ${w},${h * 0.5} ${w * 0.65},${h * 0.9} ${w * 0.65},${h * 0.7} 0,${h * 0.7}`}
              fill={`${shapeColor}30`} stroke={shapeColor} strokeWidth={2}
            />
          </svg>
        </div>
      );
    }
    return <div style={{ ...shapeStyle, background: `${shapeColor}30`, border: `2px solid ${shapeColor}`, borderRadius: 10 }} />;
  };

  const renderFreeTextNode = (node: BoardNode, isSelected: boolean, isEditing: boolean) => (
    <div className="relative" style={{ minWidth: 100 }}>
      {isEditing ? (
        <div onClick={e => e.stopPropagation()}>
          <textarea autoFocus value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
            onBlur={saveEdit} onKeyDown={e => e.key === "Enter" && e.shiftKey === false && saveEdit()}
            className="bg-transparent outline-none text-base font-medium resize-none border-b border-dashed border-foreground/30"
            style={{ color: "hsl(var(--foreground))", fontSize: Math.max(12, 15 * zoom), width: "100%" }}
          />
        </div>
      ) : (
        <p style={{ color: "hsl(var(--foreground))", fontSize: Math.max(12, 15 * zoom), fontWeight: 500, textDecoration: isSelected ? "underline dotted 1px" : "none" }}>
          {node.title}
        </p>
      )}
    </div>
  );

  const renderLinkedNoteCard = (node: BoardNode, isSelected: boolean, isEditing: boolean, size: { w: number; h: number }) => {
    const linkedNote = notesData.find((n: any) => n.id === node.linkedId);
    const colorKey = (linkedNote as any)?.color || node.color || "yellow";
    const nc = NOTE_COLOR_MAP[colorKey] || NOTE_COLOR_MAP.yellow;
    const noteType = (linkedNote as any)?.type || "note";
    const NoteIcon = NOTE_TYPE_ICONS[noteType] || FileText;
    return (
      <div className="rounded-xl overflow-hidden flex flex-col h-full transition-all"
        style={{
          background: nc.bg,
          border: `${isSelected ? 2 : 1}px solid ${nc.clip}40`,
          boxShadow: isSelected ? `0 0 0 3px ${nc.clip}30, 0 4px 16px rgba(0,0,0,0.1)` : "0 2px 8px rgba(0,0,0,0.06)",
          height: "100%",
        }}
      >
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 flex-shrink-0" style={{ background: `${nc.clip}14`, borderBottom: `1px solid ${nc.clip}20` }}>
          <NoteIcon style={{ width: 10, height: 10, color: nc.clip, flexShrink: 0 }} />
          <span style={{ color: nc.clip, fontSize: Math.max(8, 9 * zoom), fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", flex: 1 }}>
            {s.note_card}
          </span>
          <Link2 style={{ width: 8, height: 8, color: nc.clip, opacity: 0.6, flexShrink: 0 }} />
        </div>
        <div className="flex-1 px-2.5 py-2 overflow-hidden">
          <p className="font-semibold leading-snug" style={{ color: nc.text, fontSize: Math.max(10, 12 * zoom), overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
            {(linkedNote as any)?.title || node.title}
          </p>
          {((linkedNote as any)?.content || node.content) && (
            <p className="mt-1 leading-relaxed" style={{ color: nc.text, fontSize: Math.max(9, 10 * zoom), opacity: 0.65, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
              {stripHtml((linkedNote as any)?.content || node.content)}
            </p>
          )}
        </div>
      </div>
    );
  };

  const renderLinkedSourceCard = (node: BoardNode, isSelected: boolean, isEditing: boolean, size: { w: number; h: number }) => {
    const linkedSource = sourcesData.find((s: any) => s.id === node.linkedId);
    return (
      <div className="rounded-xl overflow-hidden flex flex-col h-full"
        style={{
          background: "#F0FDF4",
          border: `${isSelected ? 2 : 1}px solid ${isSelected ? "#22C55E" : "#86EFAC"}`,
          boxShadow: isSelected ? "0 0 0 3px #22C55E30, 0 4px 16px rgba(0,0,0,0.1)" : "0 2px 8px rgba(0,0,0,0.06)",
          height: "100%",
        }}
      >
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 flex-shrink-0" style={{ background: "#22C55E14", borderBottom: "1px solid #22C55E20" }}>
          <BookOpen style={{ width: 10, height: 10, color: "#16A34A", flexShrink: 0 }} />
          <span style={{ color: "#16A34A", fontSize: Math.max(8, 9 * zoom), fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", flex: 1 }}>
            {s.source_card}
          </span>
          <Link2 style={{ width: 8, height: 8, color: "#16A34A", opacity: 0.6, flexShrink: 0 }} />
        </div>
        <div className="flex-1 px-2.5 py-2 overflow-hidden">
          <p className="font-semibold leading-snug" style={{ color: "#064E3B", fontSize: Math.max(10, 12 * zoom), overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
            {(linkedSource as any)?.title || node.title}
          </p>
          {(linkedSource as any)?.author && (
            <p className="mt-0.5 text-[10px]" style={{ color: "#065F46", opacity: 0.75 }}>{(linkedSource as any).author}</p>
          )}
          {((linkedSource as any)?.notes || node.content) && (
            <p className="mt-1 leading-relaxed" style={{ color: "#064E3B", fontSize: Math.max(9, 10 * zoom), opacity: 0.65, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
              {(linkedSource as any)?.notes || node.content}
            </p>
          )}
        </div>
      </div>
    );
  };

  const renderChapterSeedCard = (node: BoardNode, isSelected: boolean, isEditing: boolean, size: { w: number; h: number }) => (
    <div className="rounded-xl overflow-hidden flex flex-col h-full"
      style={{
        background: "#FEF3EC",
        border: `${isSelected ? 2 : 1.5}px solid ${isSelected ? "#F96D1C" : "#FDBA74"}`,
        boxShadow: isSelected ? "0 0 0 3px rgba(249,109,28,0.2), 0 4px 16px rgba(0,0,0,0.1)" : "0 2px 8px rgba(0,0,0,0.06)",
        height: "100%",
      }}
    >
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 flex-shrink-0" style={{ background: "rgba(249,109,28,0.1)", borderBottom: "1px solid rgba(249,109,28,0.2)" }}>
        <Sparkles style={{ width: 10, height: 10, color: "#F96D1C", flexShrink: 0 }} />
        <span style={{ color: "#F96D1C", fontSize: Math.max(8, 9 * zoom), fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {s.chapter_seed}
        </span>
      </div>
      <div className="flex-1 px-2.5 py-2">
        {isEditing ? (
          <div onClick={e => e.stopPropagation()}>
            <input autoFocus value={editForm.title}
              onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
              onKeyDown={e => e.key === "Enter" && saveEdit()}
              className="w-full bg-transparent outline-none font-semibold"
              style={{ color: "#9A3412", fontSize: Math.max(10, 12 * zoom) }} />
          </div>
        ) : (
          <p className="font-semibold leading-snug" style={{ color: "#9A3412", fontSize: Math.max(10, 12 * zoom) }}>{node.title}</p>
        )}
        {node.content && <p className="mt-1 text-[10px] opacity-65 leading-relaxed" style={{ color: "#9A3412" }}>{node.content}</p>}
      </div>
    </div>
  );

  const renderCoreNode = (node: BoardNode, cfg: typeof NODE_CONFIGS[CoreNodeType], isSelected: boolean, isEditing: boolean, size: { w: number; h: number }) => {
    const Icon = cfg.icon;
    return (
      <div className="rounded-xl overflow-hidden transition-all duration-100 flex flex-col h-full"
        style={{
          background: cfg.bg,
          border: `${isSelected ? 2.5 : 1.5}px solid ${isSelected ? cfg.accentColor : cfg.border}`,
          boxShadow: isSelected
            ? `0 0 0 3px ${cfg.accentColor}28, 0 4px 16px rgba(0,0,0,0.12)`
            : "0 2px 8px rgba(0,0,0,0.08)",
          height: node.h ? "100%" : undefined,
        }}
      >
        <div className="flex items-center gap-1.5 px-2.5 py-1.5" style={{ backgroundColor: `${cfg.accentColor}18`, borderBottom: `1px solid ${cfg.border}60` }}>
          <Icon style={{ width: 11, height: 11, color: cfg.accentColor, flexShrink: 0 }} />
          <span style={{ color: cfg.accentColor, fontSize: Math.max(8, 9 * zoom), fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {s[NODE_TYPE_KEYS[node.type]]?.replace("\n", " ")}
          </span>
          {(node.tags || []).length > 0 && showLabels && (
            <div className="flex gap-0.5 ml-auto">
              {(node.tags || []).slice(0, 2).map(tag => (
                <span key={tag} style={{ fontSize: Math.max(7, 8 * zoom), color: cfg.text, opacity: 0.55, background: `${cfg.accentColor}18`, padding: "0 4px", borderRadius: 4 }}>
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
        {isEditing ? (
          <div className="px-2.5 py-2 flex flex-col gap-1.5 flex-1" onClick={e => e.stopPropagation()}>
            <input autoFocus value={editForm.title}
              onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
              className="text-xs font-semibold bg-white/70 rounded-lg px-2 py-1 border border-border/40 w-full outline-none focus:border-primary/50"
              style={{ color: cfg.text }} onKeyDown={e => e.key === "Enter" && saveEdit()} />
            <textarea value={editForm.content}
              onChange={e => setEditForm(f => ({ ...f, content: e.target.value }))}
              rows={2} placeholder={s.description + "..."}
              className="text-[11px] bg-white/70 rounded-lg px-2 py-1 border border-border/40 w-full outline-none resize-none"
              style={{ color: cfg.text }} />
            <input value={editForm.tags}
              onChange={e => setEditForm(f => ({ ...f, tags: e.target.value }))}
              placeholder={s.tagsEdit}
              className="text-[10px] bg-white/70 rounded-lg px-2 py-1 border border-border/40 w-full outline-none"
              style={{ color: cfg.text }} />
            <div className="flex gap-1">
              <button className="flex-1 h-5 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-0.5 text-white"
                style={{ backgroundColor: cfg.accentColor }} onClick={saveEdit}>
                <Check className="h-2.5 w-2.5" /> {s.save}
              </button>
              <button className="h-5 w-5 rounded-lg bg-secondary flex items-center justify-center" onClick={() => setEditingNode(null)}>
                <X className="h-2.5 w-2.5 text-muted-foreground" />
              </button>
            </div>
          </div>
        ) : (
          <div className="px-2.5 py-2 flex-1 overflow-auto">
            <p className="font-semibold leading-snug" style={{ color: cfg.text, fontSize: Math.max(10, 13 * zoom), WebkitLineClamp: node.h ? undefined : 2, display: node.h ? "block" : "-webkit-box", WebkitBoxOrient: node.h ? undefined : "vertical", overflow: "hidden" }}>
              {node.title}
            </p>
            {node.content && (
              <p className="mt-0.5 leading-snug opacity-60" style={{ color: cfg.text, fontSize: Math.max(9, 11 * zoom), WebkitLineClamp: node.h ? undefined : 2, display: node.h ? "block" : "-webkit-box", WebkitBoxOrient: node.h ? undefined : "vertical", overflow: node.h ? "auto" : "hidden" }}>
                {node.content}
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  // Sort: sections at bottom (rendered first, lower z-index)
  const sortedNodes = useMemo(() => {
    const sections = board.nodes.filter(n => n.type === "section");
    const rest = board.nodes.filter(n => n.type !== "section");
    return [...sections, ...rest];
  }, [board.nodes]);

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 flex overflow-hidden bg-[#FAF2EA] relative" style={{ fontFamily: "var(--font-sans)" }}>
      <SectionTourModal sectionId="ideas" lang={lang as any} />

      {/* ── Left Panel ────────────────────────────────────────────────────────── */}
      {showLeftPanel && (
        <div className="w-60 flex-shrink-0 bg-card border-r border-border/60 flex flex-col h-full z-10">
          {/* Panel tabs */}
          <div className="flex p-1 bg-muted/20 mx-3 mt-3 mb-1 rounded-xl border border-border/40">
            <button
              onClick={() => setLeftPanelTab("board")}
              className={`flex-1 flex items-center justify-center gap-1 py-1 text-[10px] font-medium rounded-lg transition-all ${leftPanelTab === "board" ? "bg-background text-primary shadow-sm" : "text-muted-foreground"}`}
            >
              <Layers className="h-3 w-3" /> Board
            </button>
            <button
              onClick={() => setLeftPanelTab("library")}
              className={`flex-1 flex items-center justify-center gap-1 py-1 text-[10px] font-medium rounded-lg transition-all ${leftPanelTab === "library" ? "bg-background text-primary shadow-sm" : "text-muted-foreground"}`}
            >
              <StickyNote className="h-3 w-3" /> {s.notes}
            </button>
          </div>

          {leftPanelTab === "board" ? (
            <>
              <div className="px-3 py-2 border-b border-border/60">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
                  <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    placeholder={s.search}
                    className="w-full h-7 pl-8 pr-2 text-xs bg-background border border-border/50 rounded-lg outline-none focus:border-primary/50" />
                </div>
              </div>

              <div className="px-3 py-2 border-b border-border/60">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">{s.cardType}</p>
                <div className="flex flex-wrap gap-1">
                  <button onClick={() => setFilterType("all")}
                    className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium border transition-all",
                      filterType === "all" ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:border-foreground/40"
                    )}>{s.all}</button>
                  {(Object.entries(NODE_CONFIGS) as [CoreNodeType, any][]).map(([type, cfg]) => (
                    <button key={type} onClick={() => setFilterType(type === filterType ? "all" : type)}
                      className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium border transition-all",
                        filterType === type ? "text-white border-transparent" : "border-border text-muted-foreground hover:border-foreground/40"
                      )}
                      style={filterType === type ? { backgroundColor: cfg.accentColor } : {}}>
                      {s[NODE_TYPE_KEYS[type]]?.replace("\n", " ")}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {filteredNodes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 gap-2">
                    <Brain className="h-8 w-8 text-muted-foreground/20" />
                    <p className="text-xs text-muted-foreground/50 text-center px-4">
                      {board.nodes.length === 0 ? s.doubleClickToAdd : s.noMatches}
                    </p>
                  </div>
                ) : (
                  <div className="py-1">
                    {filteredNodes.map(node => {
                      const isSection = node.type === "section";
                      const isSticky = node.type === "sticky";
                      const isLinked = !!node.linkedId;
                      const cfg = NODE_CONFIGS[node.type as CoreNodeType];
                      const Icon = cfg?.icon || FileText;
                      const accentColor = isSection
                        ? (SECTION_COLORS.find(c => c.value === node.sectionColor) || SECTION_COLORS[0]).border
                        : isSticky
                        ? (STICKY_COLORS.find(c => c.value === node.stickyColor) || STICKY_COLORS[0]).shadow
                        : cfg?.accentColor || "#888";
                      const isSelected = selectedNodes.has(node.id);
                      return (
                        <button key={node.id} onClick={() => focusNode(node.id)}
                          className={cn("w-full flex items-start gap-2 px-3 py-2 text-left transition-colors hover:bg-accent/40 group", isSelected && "bg-accent/60")}>
                          <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{ backgroundColor: isSticky ? (STICKY_COLORS.find(c => c.value === node.stickyColor) || STICKY_COLORS[0]).bg : cfg?.bg || "#f5f5f5", border: `1.5px solid ${accentColor}` }}>
                            {isSection ? <Layers2 style={{ width: 10, height: 10, color: accentColor }} />
                              : isSticky ? <StickyNote style={{ width: 10, height: 10, color: accentColor }} />
                              : isLinked ? <Link2 style={{ width: 10, height: 10, color: accentColor }} />
                              : <Icon style={{ width: 10, height: 10, color: accentColor }} />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium truncate">{node.title}</p>
                            {(node.tags || []).length > 0 && (
                              <p className="text-[10px] text-muted-foreground truncate">{(node.tags || []).slice(0, 2).join(", ")}</p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="px-3 pb-3 pt-2 border-t border-border/60">
                <button onClick={addNodeFromSidebar}
                  className="w-full h-8 rounded-xl border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-all"
                  data-testid="button-add-node">
                  <Plus className="h-3.5 w-3.5" /> {s.newCard}
                </button>
              </div>
            </>
          ) : (
            /* ── Notes Library Tab ── */
            <>
              <div className="flex-1 overflow-y-auto px-2 pb-3 pt-2">
                {notesData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 gap-2">
                    <StickyNote className="h-8 w-8 text-muted-foreground/20" />
                    <p className="text-xs text-muted-foreground/50 text-center px-4">{s.noNotes}</p>
                  </div>
                ) : (
                  <div className="space-y-1.5 py-1">
                    {notesData.map((note: any) => {
                      const nc = NOTE_COLOR_MAP[note.color] || NOTE_COLOR_MAP.yellow;
                      const NoteIcon = NOTE_TYPE_ICONS[note.type] || FileText;
                      const alreadyOnBoard = board.nodes.some(n => n.linkedId === note.id && n.linkedType === "note");
                      const plainContent = note.content ? stripHtml(note.content) : "";
                      return (
                        <div key={note.id} className="group rounded-xl p-2.5 border border-border/50 hover:border-primary/30 transition-all" style={{ background: nc.bg }}>
                          <div className="flex items-start gap-2">
                            <NoteIcon style={{ width: 11, height: 11, color: nc.clip, flexShrink: 0, marginTop: 2 }} />
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-semibold truncate" style={{ color: nc.text }}>{note.title}</p>
                              {plainContent && <p className="text-[10px] opacity-60 line-clamp-1 mt-0.5" style={{ color: nc.text }}>{plainContent}</p>}
                            </div>
                          </div>
                          <button
                            onClick={() => addNodeFromLib("note_card", note)}
                            disabled={alreadyOnBoard}
                            className="mt-2 w-full h-6 rounded-lg text-[10px] font-medium flex items-center justify-center gap-1 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{ background: alreadyOnBoard ? "transparent" : `${nc.clip}15`, color: alreadyOnBoard ? `${nc.clip}60` : nc.clip, border: `1px solid ${nc.clip}30` }}
                          >
                            {alreadyOnBoard ? <Check className="h-2.5 w-2.5" /> : <Plus className="h-2.5 w-2.5" />}
                            {alreadyOnBoard ? "On board" : s.addFromLib}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
      {/* ── Central canvas ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 relative">

        {/* Floating top toolbar */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-card/95 backdrop-blur border border-border/60 rounded-2xl px-2.5 py-1.5 shadow-md">
          <button onClick={() => setShowLeftPanel(!showLeftPanel)} title={s.leftPanel}
            className={cn("h-7 w-7 rounded-xl flex items-center justify-center transition-colors", showLeftPanel ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-accent/60")}>
            <PanelLeft className="h-3.5 w-3.5" />
          </button>
          <div className="w-px h-4 bg-border/60" />

          {/* Quick add buttons */}
          <button
            onClick={() => { const rect = canvasRef.current?.getBoundingClientRect(); if (!rect) return; const x = (rect.width / 2 - pan.x) / zoom; const y = (rect.height / 2 - pan.y) / zoom; setShowAddDialog({ x, y }); setAddForm(f => ({ ...f, type: "sticky" })); setAddDialogTab("free"); }}
            className="h-7 px-2 rounded-xl flex items-center gap-1 text-xs text-muted-foreground hover:bg-accent/60 transition-colors" title={s.stickyNote}>
            <StickyNote className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => { const rect = canvasRef.current?.getBoundingClientRect(); if (!rect) return; const x = (rect.width / 2 - pan.x) / zoom; const y = (rect.height / 2 - pan.y) / zoom; setShowAddDialog({ x, y }); setAddForm(f => ({ ...f, type: "section" })); setAddDialogTab("free"); }}
            className="h-7 px-2 rounded-xl flex items-center gap-1 text-xs text-muted-foreground hover:bg-accent/60 transition-colors" title={s.newSection}>
            <Layers2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => { const rect = canvasRef.current?.getBoundingClientRect(); if (!rect) return; const x = (rect.width / 2 - pan.x) / zoom; const y = (rect.height / 2 - pan.y) / zoom; setShowAddDialog({ x, y }); setAddForm(f => ({ ...f, type: "shape" })); setAddDialogTab("free"); }}
            className="h-7 px-2 rounded-xl flex items-center gap-1 text-xs text-muted-foreground hover:bg-accent/60 transition-colors" title={s.newShape}>
            <Square className="h-3.5 w-3.5" />
          </button>

          <div className="w-px h-4 bg-border/60" />

          {/* Connection type */}
          <select value={newEdgeType} onChange={e => setNewEdgeType(e.target.value as EdgeType)}
            className="h-7 text-xs bg-transparent border-0 outline-none text-muted-foreground pr-1 cursor-pointer" title={s.connectionType}>
            {(Object.keys(EDGE_CONFIGS) as EdgeType[]).map(k => (
              <option key={k} value={k}>{s[k]}</option>
            ))}
          </select>

          <div className="w-px h-4 bg-border/60" />

          {/* Align (only when multi-select) */}
          {selectedNodes.size >= 2 && (
            <>
              <button onClick={() => alignNodes("left")} title={s.alignLeft} className="h-7 w-7 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-accent/60 transition-colors">
                <AlignLeft className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => alignNodes("center-h")} title={s.alignCenter} className="h-7 w-7 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-accent/60 transition-colors">
                <AlignCenter className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => alignNodes("right")} title={s.alignRight} className="h-7 w-7 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-accent/60 transition-colors">
                <AlignRight className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => alignNodes("top")} title={s.alignTop} className="h-7 w-7 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-accent/60 transition-colors">
                <AlignStartVertical className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => alignNodes("center-v")} title={s.alignMiddle} className="h-7 w-7 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-accent/60 transition-colors">
                <AlignCenterVertical className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => alignNodes("bottom")} title={s.alignBottom} className="h-7 w-7 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-accent/60 transition-colors">
                <AlignEndVertical className="h-3.5 w-3.5" />
              </button>
              <div className="w-px h-4 bg-border/60" />
            </>
          )}

          {/* AI suggestions */}
          <button onClick={() => { setShowAiPanel(!showAiPanel); if (!showAiPanel) callAiSuggest(); }} title={s.aiIdeas}
            className={cn("h-7 px-2.5 rounded-xl flex items-center gap-1.5 text-xs font-medium transition-colors",
              showAiPanel ? "bg-primary text-white" : "text-muted-foreground hover:bg-accent/60")}>
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{s.aiIdeas}</span>
          </button>

          <div className="w-px h-4 bg-border/60" />

          <button onClick={autoArrange} title={s.autoArrange} className="h-7 w-7 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-accent/60 transition-colors">
            <Shuffle className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => setShowLabels(!showLabels)} title={showLabels ? s.hideLabels : s.showLabels}
            className={cn("h-7 w-7 rounded-xl flex items-center justify-center transition-colors", showLabels ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-accent/60")}>
            {showLabels ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          </button>

          <div className="w-px h-4 bg-border/60" />

          <button onClick={() => setZoom(z => Math.min(3, z * 1.2))} title={s.zoomIn} className="h-7 w-7 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-accent/60 transition-colors">
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <span className="text-xs text-muted-foreground tabular-nums w-9 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.max(0.2, z * 0.8))} title={s.zoomOut} className="h-7 w-7 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-accent/60 transition-colors">
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <button onClick={fitAll} title={s.fitAll} className="h-7 w-7 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-accent/60 transition-colors">
            <Maximize2 className="h-3.5 w-3.5" />
          </button>

          {saveMutation.isPending && <span className="text-xs text-muted-foreground ml-0.5 animate-pulse">·</span>}
        </div>

        {/* AI Panel */}
        {showAiPanel && (
          <div className="absolute top-16 right-4 z-30 w-72 bg-card border border-border/70 rounded-2xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">{s.aiSuggestions}</h3>
              </div>
              <button onClick={() => setShowAiPanel(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-3 space-y-2">
              {selectedNodes.size > 0 && <p className="text-[11px] text-muted-foreground">{s.basedOnSelected} ({selectedNodes.size})</p>}
              <button onClick={callAiSuggest} disabled={isAiLoading}
                className="w-full h-8 rounded-xl bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors flex items-center justify-center gap-1.5">
                <Wand2 className="h-3.5 w-3.5" />
                {isAiLoading ? s.generating : s.refreshSuggestions}
              </button>
              {isAiLoading && <div className="flex items-center justify-center py-4"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}
              {aiSuggestions.map((sug, i) => (
                <div key={i} className="group flex items-start gap-2 p-2.5 rounded-xl bg-accent/40 hover:bg-accent/70 transition-colors">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs flex-1 leading-relaxed">{sug}</p>
                  <button onClick={() => addSuggestionAsNode(sug)}
                    className="opacity-0 group-hover:opacity-100 flex-shrink-0 h-5 w-5 rounded-md bg-primary text-white flex items-center justify-center transition-opacity" title={s.addToBoard}>
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {!isAiLoading && aiSuggestions.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">{s.pressRefresh}</p>}
            </div>
          </div>
        )}

        {/* Canvas */}
        <div ref={canvasRef} className="flex-1 overflow-hidden relative select-none"
          onDoubleClick={handleCanvasDoubleClick}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          onWheel={handleWheel}
          style={{ cursor: isPanning ? "grabbing" : connectingFrom ? "crosshair" : "default" }}
          data-testid="idea-board-canvas">

          {/* Dot grid */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.35 }}>
            <defs>
              <pattern id="dotgrid" width={28 * zoom} height={28 * zoom} patternUnits="userSpaceOnUse" x={pan.x % (28 * zoom)} y={pan.y % (28 * zoom)}>
                <circle cx={14 * zoom} cy={14 * zoom} r="0.9" fill="#9C8B7A" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dotgrid)" />
          </svg>

          {board.nodes.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-3">
              <Brain className="h-16 w-16 text-muted-foreground/10" />
              <p className="text-muted-foreground/30 text-sm font-medium">{s.doubleClickToAdd}</p>
            </div>
          )}

          {/* SVG: edges */}
          <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 5, pointerEvents: "none" }}>
            <defs>
              {(Object.entries(EDGE_CONFIGS) as [EdgeType, any][]).map(([type, style]) => (
                <marker key={type} id={`arrow-${type}`} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                  <path d="M0,0 L0,7 L7,3.5 z" fill={style.stroke} />
                </marker>
              ))}
            </defs>
            {board.edges.map(edge => {
              const geo = getEdgePath(edge);
              if (!geo) return null;
              const eCfg = EDGE_CONFIGS[edge.type];
              const isSelected = selectedEdge === edge.id;
              return (
                <g key={edge.id}>
                  <path d={geo.path} stroke="transparent" strokeWidth={16} fill="none"
                    style={{ cursor: "pointer", pointerEvents: "stroke" }}
                    onClick={() => setSelectedEdge(isSelected ? null : edge.id)} />
                  <path d={geo.path} stroke={eCfg.stroke} strokeWidth={isSelected ? 2.5 : 1.6}
                    strokeDasharray={eCfg.dash} fill="none" markerEnd={`url(#arrow-${edge.type})`}
                    opacity={isSelected ? 1 : 0.65} />
                  {showLabels && (
                    <text x={geo.mx} y={geo.my - 7} textAnchor="middle" fill={eCfg.stroke}
                      fontSize={10} fontFamily="var(--font-sans)" opacity={0.8} fontWeight="500">
                      {s[edge.type]}
                    </text>
                  )}
                  {isSelected && (
                    <g style={{ pointerEvents: "all", cursor: "pointer" }} onClick={() => deleteEdge(edge.id)}>
                      <circle cx={geo.mx} cy={geo.my} r={9} fill="white" stroke={eCfg.stroke} strokeWidth={1.5} />
                      <text x={geo.mx} y={geo.my + 4} textAnchor="middle" fill={eCfg.stroke} fontSize={12} fontWeight="bold">×</text>
                    </g>
                  )}
                </g>
              );
            })}
            {connectingFrom && (() => {
              const node = board.nodes.find(n => n.id === connectingFrom);
              if (!node) return null;
              const from = getNodeCenter(node);
              const eCfg = EDGE_CONFIGS[newEdgeType];
              return <line x1={from.x} y1={from.y} x2={connectMouse.x} y2={connectMouse.y}
                stroke={eCfg.stroke} strokeWidth={2.5} strokeDasharray="6,4" opacity={0.8} />;
            })()}
          </svg>

          {/* Nodes layer */}
          <div className="absolute inset-0" style={{ zIndex: 10 }}>
            {sortedNodes.map(node => {
              const isSection = node.type === "section";
              const isSticky = node.type === "sticky";
              const isShape = node.type === "shape";
              const isFreeText = node.type === "free_text";
              const isNoteCard = node.type === "note_card";
              const isSourceCard = node.type === "source_card";
              const isChapterSeed = node.type === "chapter_seed";
              const cfg = NODE_CONFIGS[node.type as CoreNodeType];
              const isSelected = selectedNodes.has(node.id);
              const isEditing = editingNode === node.id;
              const size = getNodeSize(node);
              const nodeZIndex = isSection ? 1 : resizingNode?.id === node.id ? 50 : draggingNode === node.id ? 50 : isSelected ? 20 : 10;

              return (
                <div
                  key={node.id}
                  className="board-node absolute group"
                  style={{
                    left: node.x * zoom + pan.x,
                    top: node.y * zoom + pan.y,
                    width: size.w * zoom,
                    height: node.h ? size.h * zoom : isSticky ? size.h * zoom : isSection ? size.h * zoom : undefined,
                    zIndex: nodeZIndex,
                    ...(isFreeText ? { pointerEvents: "all" } : {}),
                  }}
                  onMouseDown={e => handleNodeMouseDown(e, node.id)}
                  onClick={e => handleNodeClick(e, node.id)}
                  onMouseUp={() => connectingFrom && connectingFrom !== node.id && handleNodeClick({ stopPropagation: () => {} } as any, node.id)}
                  data-testid={`board-node-${node.id}`}
                >
                  {isSection ? renderSectionNode(node, isSelected, size)
                    : isSticky ? renderStickyNode(node, isSelected, isEditing, size)
                    : isShape ? renderShapeNode(node, isSelected, size)
                    : isFreeText ? renderFreeTextNode(node, isSelected, isEditing)
                    : isNoteCard ? renderLinkedNoteCard(node, isSelected, isEditing, size)
                    : isSourceCard ? renderLinkedSourceCard(node, isSelected, isEditing, size)
                    : isChapterSeed ? renderChapterSeedCard(node, isSelected, isEditing, size)
                    : cfg ? renderCoreNode(node, cfg, isSelected, isEditing, size)
                    : null}

                  {/* Connect handle */}
                  {!isEditing && !isSection && (
                    <div
                      className="absolute top-1/2 -right-3 -translate-y-1/2 w-5 h-5 rounded-full bg-white border-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-crosshair z-20 shadow-sm"
                      style={{ borderColor: isSticky ? (STICKY_COLORS.find(c => c.value === node.stickyColor) || STICKY_COLORS[0]).shadow : cfg?.accentColor || "#F96D1C" }}
                      onMouseDown={e => handleConnectStart(e, node.id)}
                      title={s.drawConnection}>
                      <GitBranch className="h-2.5 w-2.5" style={{ color: isSticky ? (STICKY_COLORS.find(c => c.value === node.stickyColor) || STICKY_COLORS[0]).shadow : cfg?.accentColor || "#F96D1C" }} />
                    </div>
                  )}

                  {/* Resize handle */}
                  {!isEditing && !isFreeText && (
                    <div className="absolute bottom-0 right-0 w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity z-20 cursor-se-resize flex items-end justify-end pr-0.5 pb-0.5"
                      onMouseDown={e => handleResizeStart(e, node)} title={s.resize}>
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M1 7L7 1M4 7L7 4M7 7L7 7" stroke={isSticky ? "#999" : cfg?.accentColor || "#F96D1C"} strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
                      </svg>
                    </div>
                  )}

                  {/* Quick actions */}
                  {!isEditing && (
                    <div className="absolute -top-2.5 right-0 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                      {!isSection && !isShape && !isFreeText && (
                        <button className="h-5 w-5 rounded-md bg-card border border-border/60 shadow-sm flex items-center justify-center hover:bg-secondary"
                          onClick={e => { e.stopPropagation(); startEdit(node.id); }} title={s.editNode}>
                          <Edit2 className="h-2.5 w-2.5 text-muted-foreground" />
                        </button>
                      )}
                      <button className="h-5 w-5 rounded-md bg-card border border-border/60 shadow-sm flex items-center justify-center hover:bg-secondary"
                        onClick={e => { e.stopPropagation(); duplicateNode(node.id); }} title={s.duplicate}>
                        <Copy className="h-2.5 w-2.5 text-muted-foreground" />
                      </button>
                      <button className="h-5 w-5 rounded-md bg-card border border-border/60 shadow-sm flex items-center justify-center hover:bg-red-50"
                        onClick={e => { e.stopPropagation(); deleteNode(node.id); }} title={s.deleteNode}>
                        <Trash2 className="h-2.5 w-2.5 text-red-400" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Stats */}
          <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 text-xs text-muted-foreground/50 pointer-events-none">
            <span>{board.nodes.length} {s.cards}</span>
            {board.edges.length > 0 && <span>· {board.edges.length} {s.connections}</span>}
          </div>
        </div>
      </div>

      {/* ── Right Panel ────────────────────────────────────────────────────────── */}
      {showRightPanel && selectedNode && (
        <div className="w-64 flex-shrink-0 bg-card border-l border-border/60 flex flex-col h-full z-10">
          <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
            <h3 className="text-sm font-semibold">{s.properties}</h3>
            <button onClick={() => setShowRightPanel(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Type badge */}
            {(() => {
              const cfg = NODE_CONFIGS[selectedNode.type as CoreNodeType];
              const isSticky = selectedNode.type === "sticky";
              const isSection = selectedNode.type === "section";
              const sc = isSticky ? (STICKY_COLORS.find(c => c.value === selectedNode.stickyColor) || STICKY_COLORS[0]) : null;
              const sec = isSection ? (SECTION_COLORS.find(c => c.value === selectedNode.sectionColor) || SECTION_COLORS[0]) : null;
              const Icon = cfg?.icon || (isSticky ? StickyNote : isSection ? Layers2 : FileText);
              const accentColor = isSticky ? sc!.shadow : isSection ? sec!.border : cfg?.accentColor || "#888";
              const bgColor = isSticky ? sc!.bg : isSection ? sec!.bg : cfg?.bg || "#f5f5f5";
              return (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ backgroundColor: bgColor, border: `1.5px solid ${accentColor}60` }}>
                  <Icon style={{ width: 14, height: 14, color: accentColor }} />
                  <span className="text-xs font-semibold" style={{ color: isSticky ? sc!.text : isSection ? sec!.title : cfg?.text || "#333" }}>
                    {s[NODE_TYPE_KEYS[selectedNode.type]]?.replace("\n", " ")}
                  </span>
                  {selectedNode.linkedId && <Link2 className="h-3 w-3 ml-auto" style={{ color: accentColor }} />}
                </div>
              );
            })()}

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{s.title}</p>
              <p className="text-sm font-semibold leading-snug">{selectedNode.title}</p>
            </div>

            {selectedNode.content && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{s.description}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{stripHtml(selectedNode.content)}</p>
              </div>
            )}

            {(selectedNode.tags || []).length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">{s.tags}</p>
                <div className="flex flex-wrap gap-1">
                  {(selectedNode.tags || []).map(tag => (
                    <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] bg-accent text-muted-foreground border border-border/60">#{tag}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Linked object info */}
            {selectedNode.linkedId && (
              <div className="p-3 rounded-xl border border-primary/20 bg-primary/5">
                <div className="flex items-center gap-1.5 mb-2">
                  <Link2 className="h-3 w-3 text-primary" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">{selectedNode.linkedType === "note" ? s.linkedNote : s.linkedSource}</span>
                </div>
                {selectedNode.linkedType === "note" && (() => {
                  const note = notesData.find((n: any) => n.id === selectedNode.linkedId) as any;
                  return note ? (
                    <div>
                      <p className="text-xs font-semibold truncate">{note.title}</p>
                      {note.content && <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">{stripHtml(note.content)}</p>}
                    </div>
                  ) : <p className="text-xs text-muted-foreground">Note not found</p>;
                })()}
                {selectedNode.linkedType === "source" && (() => {
                  const src = sourcesData.find((s: any) => s.id === selectedNode.linkedId) as any;
                  return src ? (
                    <div>
                      <p className="text-xs font-semibold truncate">{src.title}</p>
                      {src.author && <p className="text-[10px] text-muted-foreground mt-0.5">{src.author}</p>}
                    </div>
                  ) : <p className="text-xs text-muted-foreground">Source not found</p>;
                })()}
                <button
                  onClick={() => {
                    if (selectedNode.linkedType === "note") setLinkedCardPopup(selectedNode);
                  }}
                  className="mt-2 w-full h-6 rounded-lg text-[10px] font-medium flex items-center justify-center gap-1 bg-primary/10 text-primary hover:bg-primary/15 transition-colors">
                  <ExternalLink className="h-2.5 w-2.5" /> {s.openOriginal}
                </button>
              </div>
            )}

            {/* Connections */}
            {(() => {
              const edges = board.edges.filter(e => e.from === selectedNode.id || e.to === selectedNode.id);
              if (edges.length === 0) return null;
              return (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">{s.connectionsLabel} ({edges.length})</p>
                  <div className="space-y-1">
                    {edges.map(e => {
                      const otherId = e.from === selectedNode.id ? e.to : e.from;
                      const other = board.nodes.find(n => n.id === otherId);
                      const eCfg = EDGE_CONFIGS[e.type];
                      const isOutgoing = e.from === selectedNode.id;
                      return (
                        <button key={e.id} onClick={() => other && focusNode(other.id)}
                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-accent/50 transition-colors text-left">
                          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: eCfg.stroke }} />
                          <span className="text-[10px] text-muted-foreground flex-shrink-0">{isOutgoing ? "→" : "←"} {s[e.type]}</span>
                          <span className="text-xs font-medium truncate">{other?.title || "?"}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            <div className="space-y-2 pt-2 border-t border-border/60">
              {selectedNode.type !== "section" && selectedNode.type !== "shape" && selectedNode.type !== "free_text" && (
                <button onClick={() => startEdit(selectedNode.id)}
                  className="w-full h-8 rounded-xl border border-border text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-accent/60 transition-colors">
                  <Edit2 className="h-3.5 w-3.5" /> {s.edit}
                </button>
              )}
              <button onClick={() => duplicateNode(selectedNode.id)}
                className="w-full h-8 rounded-xl border border-border text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-accent/60 transition-colors">
                <Copy className="h-3.5 w-3.5" /> {s.duplicate}
              </button>
              <button onClick={() => deleteNode(selectedNode.id)}
                className="w-full h-8 rounded-xl border border-red-200 text-xs font-medium flex items-center justify-center gap-1.5 text-red-500 hover:bg-red-50 transition-colors">
                <Trash2 className="h-3.5 w-3.5" /> {s.deleteLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Node Dialog ─────────────────────────────────────────────────────── */}
      {showAddDialog && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/15 backdrop-blur-[2px]" onClick={() => setShowAddDialog(null)}>
          <div className="bg-card border border-border rounded-3xl shadow-2xl p-5 w-[420px] max-w-[95vw]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-4">
              <Brain className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-base">{s.newCard}</h3>
            </div>

            {/* Category tabs */}
            <div className="flex gap-1 p-1 bg-muted/30 rounded-xl border border-border/40 mb-4">
              {([["cards", s.objectCards], ["semantic", s.semanticCards], ["free", s.freeObjects]] as [string, string][]).map(([tab, label]) => (
                <button key={tab} onClick={() => setAddDialogTab(tab as any)}
                  className={`flex-1 py-1.5 text-[10px] font-medium rounded-lg transition-all ${addDialogTab === tab ? "bg-background text-primary shadow-sm" : "text-muted-foreground"}`}>
                  {label}
                </button>
              ))}
            </div>

            {addDialogTab === "cards" && (
              <div className="grid grid-cols-5 gap-1.5 mb-4">
                {(Object.entries(NODE_CONFIGS) as [CoreNodeType, any][]).map(([type, cfg]) => {
                  const Icon = cfg.icon;
                  const isActive = addForm.type === type;
                  return (
                    <button key={type} onClick={() => setAddForm(f => ({ ...f, type }))}
                      className="flex flex-col items-center gap-1 px-1 py-2 rounded-xl border transition-all"
                      style={{ backgroundColor: isActive ? cfg.bg : "transparent", borderColor: isActive ? cfg.accentColor : "hsl(var(--border))", boxShadow: isActive ? `0 0 0 2px ${cfg.accentColor}30` : "none" }}
                      data-testid={`node-type-${type}`}>
                      <Icon style={{ width: 14, height: 14, color: isActive ? cfg.accentColor : "hsl(var(--muted-foreground))" }} />
                      <span className="text-[9px] font-medium text-center leading-tight" style={{ color: isActive ? cfg.text : "hsl(var(--muted-foreground))", whiteSpace: "pre-line" }}>
                        {s[NODE_TYPE_KEYS[type]]}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {addDialogTab === "semantic" && (
              <div className="grid grid-cols-2 gap-2 mb-4">
                {(["note_card", "source_card", "draft_card", "chapter_seed"] as ExtNodeType[]).map(type => {
                  const icons = { note_card: FileText, source_card: BookOpen, draft_card: FileEdit, chapter_seed: Sparkles };
                  const colors = { note_card: "#F59E0B", source_card: "#22C55E", draft_card: "#8B5CF6", chapter_seed: "#F96D1C" };
                  const Icon = icons[type as keyof typeof icons];
                  const color = colors[type as keyof typeof colors];
                  const isActive = addForm.type === type;
                  return (
                    <button key={type} onClick={() => setAddForm(f => ({ ...f, type }))}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl border transition-all text-left"
                      style={{ backgroundColor: isActive ? `${color}10` : "transparent", borderColor: isActive ? color : "hsl(var(--border))", boxShadow: isActive ? `0 0 0 2px ${color}25` : "none" }}>
                      <Icon style={{ width: 14, height: 14, color: isActive ? color : "hsl(var(--muted-foreground))" }} />
                      <span className="text-xs font-medium" style={{ color: isActive ? color : "hsl(var(--muted-foreground))" }}>{s[NODE_TYPE_KEYS[type]]}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {addDialogTab === "free" && (
              <div className="space-y-3 mb-4">
                {/* Free objects */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { type: "sticky" as NodeType, icon: StickyNote, label: s.sticky, color: "#F59E0B" },
                    { type: "section" as NodeType, icon: Layers2, label: s.section, color: "#3B82F6" },
                    { type: "free_text" as NodeType, icon: Type, label: s.free_text, color: "#6B7280" },
                    { type: "shape" as NodeType, icon: Square, label: s.shape, color: "#8B5CF6" },
                  ].map(item => (
                    <button key={item.type} onClick={() => setAddForm(f => ({ ...f, type: item.type }))}
                      className="flex flex-col items-center gap-1.5 px-2 py-2.5 rounded-xl border transition-all"
                      style={{ backgroundColor: addForm.type === item.type ? `${item.color}10` : "transparent", borderColor: addForm.type === item.type ? item.color : "hsl(var(--border))" }}>
                      <item.icon style={{ width: 16, height: 16, color: addForm.type === item.type ? item.color : "hsl(var(--muted-foreground))" }} />
                      <span className="text-[9px] font-medium" style={{ color: addForm.type === item.type ? item.color : "hsl(var(--muted-foreground))" }}>{item.label}</span>
                    </button>
                  ))}
                </div>

                {/* Sticky color picker */}
                {addForm.type === "sticky" && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Color</p>
                    <div className="flex gap-2 flex-wrap">
                      {STICKY_COLORS.map(sc => (
                        <button key={sc.value} onClick={() => setAddForm(f => ({ ...f, stickyColor: sc.value }))}
                          className="transition-transform hover:scale-110"
                          style={{ width: addForm.stickyColor === sc.value ? 24 : 18, height: addForm.stickyColor === sc.value ? 24 : 18, borderRadius: "50%", background: sc.bg, border: `2px solid ${addForm.stickyColor === sc.value ? sc.shadow : sc.shadow + "60"}`, outline: addForm.stickyColor === sc.value ? `2px solid ${sc.shadow}40` : "none", outlineOffset: 1 }} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Section color picker */}
                {addForm.type === "section" && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Color</p>
                    <div className="flex gap-2">
                      {SECTION_COLORS.map(sc => (
                        <button key={sc.value} onClick={() => setAddForm(f => ({ ...f, sectionColor: sc.value }))}
                          className="transition-transform hover:scale-110"
                          style={{ width: addForm.sectionColor === sc.value ? 24 : 18, height: addForm.sectionColor === sc.value ? 24 : 18, borderRadius: "50%", background: sc.bg, border: `2px solid ${addForm.sectionColor === sc.value ? sc.border : sc.border + "60"}` }} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Shape kind picker */}
                {addForm.type === "shape" && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Shape</p>
                    <div className="grid grid-cols-5 gap-1.5">
                      {([
                        { v: "rect", icon: Square },
                        { v: "circle", icon: Circle },
                        { v: "diamond", icon: Diamond },
                        { v: "triangle", icon: Target },
                        { v: "arrow_right", icon: AlignLeft },
                      ] as { v: ShapeKind; icon: any }[]).map(item => (
                        <button key={item.v} onClick={() => setAddForm(f => ({ ...f, shapeKind: item.v }))}
                          className="flex flex-col items-center gap-1 p-2 rounded-xl border transition-all"
                          style={{ backgroundColor: addForm.shapeKind === item.v ? "rgba(139,92,246,0.1)" : "transparent", borderColor: addForm.shapeKind === item.v ? "#8B5CF6" : "hsl(var(--border))" }}>
                          <item.icon style={{ width: 14, height: 14, color: addForm.shapeKind === item.v ? "#8B5CF6" : "hsl(var(--muted-foreground))" }} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              {addForm.type !== "shape" && (
                <input autoFocus value={addForm.title}
                  onChange={e => setAddForm(f => ({ ...f, title: e.target.value }))}
                  placeholder={addForm.type === "section" ? "Section label..." : addForm.type === "sticky" ? "Write your thought..." : addForm.type === "free_text" ? "Text..." : s.cardTitle}
                  className="w-full h-10 px-3 text-sm bg-background border border-border rounded-xl outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                  onKeyDown={e => e.key === "Enter" && addNode()}
                  data-testid="input-node-title" />
              )}
              {addForm.type !== "section" && addForm.type !== "free_text" && addForm.type !== "shape" && addForm.type !== "sticky" && (
                <>
                  <textarea value={addForm.content}
                    onChange={e => setAddForm(f => ({ ...f, content: e.target.value }))}
                    placeholder={s.descOptional} rows={2}
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl outline-none resize-none focus:border-primary/50" />
                  <input value={addForm.tags}
                    onChange={e => setAddForm(f => ({ ...f, tags: e.target.value }))}
                    placeholder={s.tagsPlaceholder}
                    className="w-full h-9 px-3 text-xs bg-background border border-border rounded-xl outline-none focus:border-primary/50" />
                </>
              )}
            </div>

            <div className="flex gap-2 mt-4">
              <button onClick={addNode}
                disabled={addForm.type !== "shape" && !addForm.title.trim()}
                className="flex-1 h-10 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #F96D1C 0%, #FF9640 100%)" }}
                data-testid="button-add-node-confirm">{s.add}</button>
              <button onClick={() => setShowAddDialog(null)}
                className="flex-1 h-10 rounded-xl text-sm font-medium border border-border hover:bg-accent/60 transition-colors">{s.cancel}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Linked card popup ────────────────────────────────────────────────────── */}
      {linkedCardPopup && linkedCardPopup.linkedType === "note" && (() => {
        const note = notesData.find((n: any) => n.id === linkedCardPopup.linkedId) as any;
        if (!note) return null;
        const nc = NOTE_COLOR_MAP[note.color] || NOTE_COLOR_MAP.yellow;
        const NoteTypeIcon = NOTE_TYPE_ICONS[note.type] || FileText;
        // Load chains from localStorage and find which ones include this note
        let allChains: { id: string; name: string; color: string; noteIds: number[] }[] = [];
        try { allChains = JSON.parse(localStorage.getItem(`moodra_note_chains_${bookId}`) || "[]"); } catch {}
        const noteChains = allChains.filter(c => c.noteIds.includes(note.id));
        return (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[1px]" onClick={() => setLinkedCardPopup(null)}>
            <div className="w-[420px] max-w-[95vw] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
              style={{ background: nc.bg, border: `1.5px solid ${nc.clip}40` }} onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0" style={{ borderColor: `${nc.clip}20`, background: `${nc.clip}10` }}>
                <div className="flex items-center gap-2">
                  <NoteTypeIcon style={{ width: 14, height: 14, color: nc.clip }} />
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: nc.clip }}>{s.linkedNote}</span>
                </div>
                <button onClick={() => setLinkedCardPopup(null)} style={{ color: nc.text }}><X className="h-4 w-4" /></button>
              </div>

              <div className="overflow-y-auto">
                {/* Note content */}
                <div className="p-4 border-b" style={{ borderColor: `${nc.clip}15` }}>
                  <h3 className="font-bold text-base mb-2" style={{ color: nc.text }}>{note.title}</h3>
                  {note.content && (
                    <p className="text-sm leading-relaxed opacity-80" style={{ color: nc.text }}>
                      {stripHtml(note.content)}
                    </p>
                  )}
                  {note.tags && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {note.tags.split(",").map((t: string) => t.trim()).filter(Boolean).map((tag: string) => (
                        <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: `${nc.clip}15`, color: `${nc.clip}CC` }}>#{tag}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Chains — show chronological list for each chain this note belongs to */}
                {noteChains.map(chain => {
                  const chainNotes = chain.noteIds
                    .map((id: number) => notesData.find((n: any) => n.id === id) as any)
                    .filter(Boolean);
                  return (
                    <div key={chain.id} className="px-4 py-3 border-b last:border-0" style={{ borderColor: `${nc.clip}15` }}>
                      <div className="flex items-center gap-1.5 mb-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: chain.color }} />
                        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: chain.color }}>{chain.name}</span>
                        <span className="text-[10px] text-muted-foreground/50">· {chainNotes.length} notes</span>
                      </div>
                      <div className="space-y-1">
                        {chainNotes.map((cn: any, idx: number) => {
                          const isCurrent = cn.id === note.id;
                          const cnc = NOTE_COLOR_MAP[cn.color] || NOTE_COLOR_MAP.yellow;
                          return (
                            <div key={cn.id}
                              className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors"
                              style={{ background: isCurrent ? `${chain.color}15` : "transparent", border: isCurrent ? `1px solid ${chain.color}30` : "1px solid transparent" }}>
                              <span className="text-[9px] font-mono text-muted-foreground/50 w-4 flex-shrink-0 text-right">{idx + 1}</span>
                              <div className="w-1 flex-shrink-0 self-stretch rounded-full" style={{ background: chain.color, opacity: isCurrent ? 1 : 0.3, minHeight: 14 }} />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate" style={{ color: isCurrent ? chain.color : nc.text, fontWeight: isCurrent ? 700 : 500 }}>
                                  {cn.title}
                                </p>
                                {cn.content && !isCurrent && (
                                  <p className="text-[10px] opacity-50 truncate" style={{ color: nc.text }}>{stripHtml(cn.content)}</p>
                                )}
                              </div>
                              {isCurrent && <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: chain.color }} />}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Free Mode Gate */}
      {freeGateOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center" style={{ pointerEvents: "none" }}>
          <div className="w-full max-w-md mx-4" style={{ pointerEvents: "auto", background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)", border: "1.5px solid rgba(99,102,241,0.55)", borderRadius: "16px", padding: "24px" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(99,102,241,0.18)" }}>
                <Brain className="w-5 h-5" style={{ color: "#818CF8" }} />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: "#E2E8F0" }}>
                  {lang === "ru" ? "Нейросеть бесплатной версии устала" : lang === "ua" ? "Нейромережа безплатної версії стомилась" : lang === "de" ? "Das KI-Netz der Gratisversion ist müde" : "The free neural network is tired"}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: "#818CF8" }}>GPT-OSS · Pollinations</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed mb-5" style={{ color: "#94A3B8" }}>
              {lang === "ru" ? "Генерация идей для доски требует хорошей рабочей памяти у модели. Бесплатный GPT-OSS сейчас перегружен. Добавь API ключ OpenAI — и нейросеть снова бодрая."
                : lang === "ua" ? "Генерація ідей для дошки потребує хорошої робочої пам'яті. Безплатний GPT-OSS зараз перевантажений. Додай API ключ OpenAI."
                : lang === "de" ? "Ideengenerierung erfordert ein Modell mit guter Arbeitsgedächtnisleistung. Das kostenlose GPT-OSS ist überlastet. Füge einen OpenAI-API-Schlüssel hinzu."
                : "Generating ideas requires a model with good working memory. The free GPT-OSS is overloaded. Add an OpenAI API key and the neural network is fresh again."}
            </p>
            <div className="flex flex-col gap-2">
              <button onClick={() => setFreeGateOpen(false)} className="w-full py-2.5 rounded-xl text-sm font-semibold transition-colors" style={{ background: "rgba(99,102,241,0.15)", color: "#A5B4FC" }}>
                {lang === "ru" ? "Закрыть" : lang === "ua" ? "Закрити" : lang === "de" ? "Schließen" : "Close"}
              </button>
              <button onClick={() => { setFreeGateOpen(false); setLocation("/models"); }} className="w-full py-2.5 rounded-xl text-sm font-semibold transition-colors" style={{ background: "rgba(249,109,28,0.18)", color: "#FB923C" }}>
                {lang === "ru" ? "Добавить API ключ" : lang === "ua" ? "Додати API ключ" : lang === "de" ? "API-Schlüssel hinzufügen" : "Add API key"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
