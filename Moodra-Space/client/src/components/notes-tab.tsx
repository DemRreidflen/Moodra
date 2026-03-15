import { useState, useRef, useCallback, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Note, NoteCollection, Book, Draft, Source } from "@shared/schema";
import {
  Zap, Lightbulb, HelpCircle, Sparkles, Quote, Eye, Film,
  Target, User, Microscope, Heart, BookMarked, Archive,
  CheckCircle2, Star, Inbox, Flame, Minus, ArrowDown,
  Plus, Trash2, Save, X, ChevronLeft, ChevronDown, ChevronUp,
  Link2, Layers, Check, Loader2, Tag, Search, Filter, Edit3,
  ArrowRight, Folder, FolderPlus, MoreHorizontal, PinIcon,
  SendHorizontal, StickyNote, ArrowDownToLine, RefreshCw, Pencil,
  GitBranch, AlertCircle, Map, Network, ExternalLink, BookOpen,
  FileText, Database, Hash
} from "lucide-react";
import { NotesGraph } from "@/components/notes-graph";

// ─── Constants ─────────────────────────────────────────────────────────────────

export const NOTE_TYPES: { value: string; label: string; icon: any; color: string; bg: string }[] = [
  { value: "quick_thought",  label: "Quick Thought",   icon: Zap,          color: "#F59E0B", bg: "#FFFBEB" },
  { value: "concept",        label: "Concept",         icon: Lightbulb,    color: "#6366F1", bg: "#EEF2FF" },
  { value: "question",       label: "Question",        icon: HelpCircle,   color: "#8B5CF6", bg: "#F5F3FF" },
  { value: "insight",        label: "Insight",         icon: Sparkles,     color: "#EC4899", bg: "#FDF2F8" },
  { value: "quote",          label: "Quote",           icon: Quote,        color: "#0D9488", bg: "#F0FDFA" },
  { value: "observation",    label: "Observation",     icon: Eye,          color: "#10B981", bg: "#F0FDF4" },
  { value: "scene_seed",     label: "Scene Seed",      icon: Film,         color: "#3B82F6", bg: "#EFF6FF" },
  { value: "argument_seed",  label: "Argument Seed",   icon: Target,       color: "#EF4444", bg: "#FEF2F2" },
  { value: "character_note", label: "Character Note",  icon: User,         color: "#F96D1C", bg: "#FFF7ED" },
  { value: "research_note",  label: "Research Note",   icon: Microscope,   color: "#14B8A6", bg: "#F0FDFA" },
  { value: "reflection",     label: "Reflection",      icon: Heart,        color: "#A855F7", bg: "#FAF5FF" },
  { value: "map_of_content", label: "Map of Content",  icon: Map,          color: "#0EA5E9", bg: "#F0F9FF" },
];

const NOTE_STATUSES: { value: string; label: string; icon: any; color: string }[] = [
  { value: "inbox",     label: "Inbox",     icon: Inbox,        color: "#6B7280" },
  { value: "active",    label: "Active",    icon: CheckCircle2, color: "#10B981" },
  { value: "developed", label: "Developed", icon: Star,         color: "#F59E0B" },
  { value: "used",      label: "Used",      icon: BookMarked,   color: "#3B82F6" },
  { value: "archived",  label: "Archived",  icon: Archive,      color: "#9CA3AF" },
];

const IMPORTANCE_LEVELS: { value: string; label: string; icon: any; color: string }[] = [
  { value: "low",    label: "Low",    icon: ArrowDown, color: "#9CA3AF" },
  { value: "normal", label: "Normal", icon: Minus,     color: "#6B7280" },
  { value: "high",   label: "High",   icon: Flame,     color: "#EF4444" },
];

const COLLECTION_COLORS = [
  "#F59E0B", "#6366F1", "#8B5CF6", "#EC4899", "#0D9488",
  "#10B981", "#3B82F6", "#EF4444", "#F96D1C", "#A855F7",
];

type NoteView = "inbox" | "all" | "collections" | "editor" | "graph";

function getNoteType(type: string) {
  return NOTE_TYPES.find(t => t.value === type) || NOTE_TYPES[0];
}
function getNoteStatus(status: string) {
  return NOTE_STATUSES.find(s => s.value === status) || NOTE_STATUSES[0];
}
function getImportance(imp: string) {
  return IMPORTANCE_LEVELS.find(i => i.value === imp) || IMPORTANCE_LEVELS[1];
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function NotesTab({ bookId, book }: { bookId: number; book: Book }) {
  const { toast } = useToast();

  // ── View ─────────────────────────────────────────────────────────────────────
  const [view, setView] = useState<NoteView>("inbox");
  const [prevView, setPrevView] = useState<NoteView>("inbox");

  // ── Filters ──────────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [collectionFilter, setCollectionFilter] = useState<number | null>(null);

  // ── Editor state ─────────────────────────────────────────────────────────────
  const [editNote, setEditNote] = useState<Note | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editType, setEditType] = useState("concept");
  const [editStatus, setEditStatus] = useState("active");
  const [editImportance, setEditImportance] = useState("normal");
  const [editTags, setEditTags] = useState("");
  const [editCollectionIds, setEditCollectionIds] = useState<number[]>([]);
  const [editLinkedNoteIds, setEditLinkedNoteIds] = useState<number[]>([]);
  const [editLinkedSourceIds, setEditLinkedSourceIds] = useState<number[]>([]);
  const [editLinkedDraftIds, setEditLinkedDraftIds] = useState<number[]>([]);
  const [showLinkNotes, setShowLinkNotes] = useState(false);
  const [showLinkSources, setShowLinkSources] = useState(false);
  const [showLinkDrafts, setShowLinkDrafts] = useState(false);
  const [showCollectionPicker, setShowCollectionPicker] = useState(false);
  const isDirty = useRef(false);

  // ── Obsidian features state ───────────────────────────────────────────────────
  const [showBacklinks, setShowBacklinks] = useState(false);
  const [showRelated, setShowRelated] = useState(false);
  const [showLocalGraph, setShowLocalGraph] = useState(false);
  const [showEmbedded, setShowEmbedded] = useState(false);
  const [orphansOnly, setOrphansOnly] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // ── Quick capture ─────────────────────────────────────────────────────────────
  const [quickText, setQuickText] = useState("");
  const quickRef = useRef<HTMLInputElement>(null);

  // ── Collections UI ────────────────────────────────────────────────────────────
  const [newColName, setNewColName] = useState("");
  const [newColColor, setNewColColor] = useState(COLLECTION_COLORS[0]);
  const [showNewCol, setShowNewCol] = useState(false);

  // ── Queries ──────────────────────────────────────────────────────────────────
  const { data: notes = [], isLoading } = useQuery<Note[]>({
    queryKey: ["/api/books", bookId, "notes"],
    queryFn: () => apiRequest("GET", `/api/books/${bookId}/notes`),
  });

  const { data: collections = [] } = useQuery<NoteCollection[]>({
    queryKey: ["/api/books", bookId, "collections"],
    queryFn: () => apiRequest("GET", `/api/books/${bookId}/collections`),
  });

  const { data: sources = [] } = useQuery<Source[]>({
    queryKey: ["/api/books", bookId, "sources"],
    queryFn: () => apiRequest("GET", `/api/books/${bookId}/sources`),
  });

  const { data: drafts = [] } = useQuery<Draft[]>({
    queryKey: ["/api/books", bookId, "drafts"],
    queryFn: () => apiRequest("GET", `/api/books/${bookId}/drafts`),
  });

  // ── Mutations ────────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/api/books/${bookId}/notes`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "notes"] }); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/notes/${id}`, data),
    onSuccess: (updated: Note) => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "notes"] });
      setEditNote(updated);
      isDirty.current = false;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/notes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "notes"] });
      if (view === "editor") goBack();
      toast({ title: "Note deleted" });
    },
  });

  const createColMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/api/books/${bookId}/collections`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "collections"] });
      setNewColName(""); setShowNewCol(false);
      toast({ title: "Collection created" });
    },
  });

  const deleteColMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/collections/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "collections"] }),
  });

  // ── Quick capture ─────────────────────────────────────────────────────────────
  const handleQuickCapture = () => {
    const text = quickText.trim();
    if (!text) return;
    createMutation.mutate({
      title: text.length > 60 ? text.slice(0, 60) + "…" : text,
      content: text.length > 60 ? text : "",
      type: "quick_thought",
      status: "inbox",
      isQuick: "true",
      importance: "normal",
      tags: "",
      collectionIds: "",
      linkedNoteIds: "",
      linkedSourceIds: "",
      linkedDraftIds: "",
      semanticTags: "",
    });
    setQuickText("");
    toast({ title: "Captured to Inbox" });
  };

  // ── Open editor ──────────────────────────────────────────────────────────────
  const openEditor = (n: Note | null, fromView: NoteView = view) => {
    setPrevView(fromView);
    if (n) {
      setEditNote(n);
      setEditTitle(n.title);
      setEditContent(n.content || "");
      setEditType(n.type || "concept");
      setEditStatus(n.status || "active");
      setEditImportance(n.importance || "normal");
      setEditTags(n.tags || "");
      setEditCollectionIds((n.collectionIds || "").split(",").map(Number).filter(Boolean));
      setEditLinkedNoteIds((n.linkedNoteIds || "").split(",").map(Number).filter(Boolean));
      setEditLinkedSourceIds((n.linkedSourceIds || "").split(",").map(Number).filter(Boolean));
      setEditLinkedDraftIds((n.linkedDraftIds || "").split(",").map(Number).filter(Boolean));
    } else {
      setEditNote(null);
      setEditTitle(""); setEditContent(""); setEditType("concept");
      setEditStatus("active"); setEditImportance("normal"); setEditTags("");
      setEditCollectionIds([]); setEditLinkedNoteIds([]);
      setEditLinkedSourceIds([]); setEditLinkedDraftIds([]);
    }
    setShowLinkNotes(false); setShowLinkSources(false);
    setShowLinkDrafts(false); setShowCollectionPicker(false);
    isDirty.current = false;
    setView("editor");
  };

  const goBack = () => { setView(prevView); setEditNote(null); };

  const handleSave = () => {
    if (!editTitle.trim()) { toast({ title: "Title required", variant: "destructive" }); return; }
    const data = {
      title: editTitle.trim(),
      content: editContent,
      type: editType,
      status: editStatus,
      importance: editImportance,
      tags: editTags,
      isQuick: "false",
      collectionIds: editCollectionIds.join(","),
      linkedNoteIds: editLinkedNoteIds.join(","),
      linkedSourceIds: editLinkedSourceIds.join(","),
      linkedDraftIds: editLinkedDraftIds.join(","),
    };
    if (editNote) {
      updateMutation.mutate({ id: editNote.id, data });
    } else {
      createMutation.mutate(data, {
        onSuccess: () => { toast({ title: "Note saved" }); goBack(); }
      });
    }
  };

  // ── Inbox actions ─────────────────────────────────────────────────────────────
  const quickAction = (note: Note, action: string) => {
    switch (action) {
      case "activate":
        updateMutation.mutate({ id: note.id, data: { status: "active" } }, { onSuccess: () => toast({ title: "Moved to Active" }) });
        break;
      case "archive":
        updateMutation.mutate({ id: note.id, data: { status: "archived" } }, { onSuccess: () => toast({ title: "Archived" }) });
        break;
      case "edit":
        openEditor(note, view);
        break;
      case "delete":
        deleteMutation.mutate(note.id);
        break;
      case "send_to_draft":
        createMutation.mutate({
          title: note.title, content: note.content || "",
          type: "paragraph", status: "active",
          connectedNoteIds: String(note.id), connectedSourceIds: "",
        }, {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "drafts"] });
            toast({ title: "Sent to Drafts" });
          }
        });
        break;
    }
  };

  // ── Filtered lists ────────────────────────────────────────────────────────────
  const inboxNotes = notes.filter(n => n.status === "inbox");

  // ── Obsidian computed data ────────────────────────────────────────────────────
  // Backlinks: notes that have editNote.id in their linkedNoteIds
  const backlinkedNotes = useMemo(() => {
    if (!editNote) return [] as Note[];
    return notes.filter(n => n.id !== editNote.id && (n.linkedNoteIds || "").split(",").map(Number).includes(editNote.id));
  }, [notes, editNote]);

  // Drafts that reference the current note
  const backlinkedDrafts = useMemo(() => {
    if (!editNote) return [] as Draft[];
    return (drafts as Draft[]).filter((d: Draft) => (d.connectedNoteIds || "").split(",").map(Number).includes(editNote.id));
  }, [drafts, editNote]);

  // Related notes: explicit links + shared tags
  const relatedNotes = useMemo(() => {
    if (!editNote) return [] as Note[];
    const currentTags = (editNote.tags || "").split(",").map(t => t.trim().toLowerCase()).filter(Boolean);
    const linkedIds = new Set(editLinkedNoteIds);
    const backlinkIds = new Set(backlinkedNotes.map(n => n.id));
    return notes.filter(n => {
      if (n.id === editNote.id) return false;
      if (linkedIds.has(n.id) || backlinkIds.has(n.id)) return true;
      if (currentTags.length > 0) {
        const nTags = (n.tags || "").split(",").map(t => t.trim().toLowerCase()).filter(Boolean);
        return nTags.some(t => currentTags.includes(t));
      }
      return false;
    });
  }, [notes, editNote, editLinkedNoteIds, backlinkedNotes]);

  // Orphan notes: no linked notes, no backlinks, no collection, no linked drafts/sources
  const orphanNoteIds = useMemo(() => {
    const referencedIds = new Set<number>();
    for (const n of notes) {
      (n.linkedNoteIds || "").split(",").map(Number).filter(Boolean).forEach(id => referencedIds.add(id));
    }
    for (const d of (drafts as Draft[])) {
      (d.connectedNoteIds || "").split(",").map(Number).filter(Boolean).forEach(id => referencedIds.add(id));
    }
    return new Set(notes.filter(n =>
      !(n.linkedNoteIds || "").split(",").filter(s => s && s !== "0").length &&
      !(n.linkedSourceIds || "").split(",").filter(s => s && s !== "0").length &&
      !(n.linkedDraftIds || "").split(",").filter(s => s && s !== "0").length &&
      !(n.collectionIds || "").split(",").filter(s => s && s !== "0").length &&
      !referencedIds.has(n.id)
    ).map(n => n.id));
  }, [notes, drafts]);

  const allActiveNotes = notes.filter(n => {
    if (n.status === "archived") return false;
    if (orphansOnly && !orphanNoteIds.has(n.id)) return false;
    if (typeFilter !== "all" && n.type !== typeFilter) return false;
    if (statusFilter !== "all" && n.status !== statusFilter) return false;
    if (collectionFilter !== null && !((n.collectionIds || "").split(",").map(Number).includes(collectionFilter))) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return n.title.toLowerCase().includes(q) || (n.content || "").toLowerCase().includes(q) || (n.tags || "").toLowerCase().includes(q);
    }
    return true;
  });

  // ── Send quick note to draft ──────────────────────────────────────────────────
  const sendToDraft = async (note: Note) => {
    try {
      await apiRequest("POST", `/api/books/${bookId}/drafts`, {
        title: note.title,
        content: note.content || "",
        type: "paragraph",
        status: "active",
        connectedNoteIds: String(note.id),
        connectedSourceIds: "",
        wordCount: (note.content || "").trim().split(/\s+/).filter(Boolean).length,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "drafts"] });
      toast({ title: "Sent to Drafts" });
    } catch { toast({ title: "Failed", variant: "destructive" }); }
  };

  const sendToBoard = async (note: Note) => {
    try {
      const boardRes = await apiRequest("GET", `/api/books/${bookId}/board`);
      let boardState: { nodes: any[]; edges: any[] } = { nodes: [], edges: [] };
      if (boardRes?.data) { try { boardState = JSON.parse(boardRes.data); } catch {} }
      boardState.nodes.push({
        id: `note-${note.id}-${Date.now()}`,
        type: "insight",
        content: note.title,
        description: (note.content || "").slice(0, 180),
        x: 120 + Math.random() * 200, y: 120 + Math.random() * 200,
        width: 180, height: 70,
      });
      await apiRequest("PATCH", `/api/books/${bookId}/board`, { data: JSON.stringify(boardState) });
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "board"] });
      toast({ title: "Sent to Idea Board" });
    } catch { toast({ title: "Failed", variant: "destructive" }); }
  };

  // ── Note card ─────────────────────────────────────────────────────────────────
  const NoteCard = ({ note, showActions = false }: { note: Note; showActions?: boolean }) => {
    const nt = getNoteType(note.type || "quick_thought");
    const NtIcon = nt.icon;
    const imp = getImportance(note.importance || "normal");
    const ImpIcon = imp.icon;
    const colCount = (note.collectionIds || "").split(",").filter(Boolean).length;
    const linkCount = [(note.linkedNoteIds || ""), (note.linkedSourceIds || ""), (note.linkedDraftIds || "")]
      .flatMap(s => s.split(",").filter(Boolean)).length;
    return (
      <div
        className="group rounded-xl border cursor-pointer transition-all hover:shadow-sm overflow-hidden"
        style={{ borderColor: `${nt.color}22`, background: "hsl(var(--card))" }}
        onClick={() => openEditor(note)}
      >
        {/* Coloured top stripe */}
        <div style={{ height: 3, background: nt.color, opacity: 0.75 }} />
        <div className="p-3.5">
          <div className="flex items-start gap-2.5 mb-1">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm leading-snug truncate">{note.title}</h4>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-[10px] text-muted-foreground/50">{nt.label}</span>
                {note.importance === "high" && <span className="text-[10px] flex items-center gap-0.5" style={{ color: imp.color }}><ImpIcon className="h-2 w-2" />High</span>}
                {colCount > 0 && <span className="text-[10px] text-muted-foreground/50 flex items-center gap-0.5"><Folder className="h-2 w-2" />{colCount}</span>}
                {linkCount > 0 && <span className="text-[10px] text-muted-foreground/50 flex items-center gap-0.5"><Link2 className="h-2 w-2" />{linkCount}</span>}
                {note.tags && <span className="text-[10px] text-muted-foreground/40 truncate max-w-[100px]">#{note.tags.split(",")[0]?.trim()}</span>}
              </div>
            </div>
            {showActions && (
              <div className="flex-shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                <button title="Send to Draft" onClick={() => sendToDraft(note)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-muted/80 text-muted-foreground transition-colors">
                  <SendHorizontal className="h-2.5 w-2.5" />
                </button>
                <button title="Delete" onClick={() => deleteMutation.mutate(note.id)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-100 text-muted-foreground hover:text-red-500 transition-colors">
                  <Trash2 className="h-2.5 w-2.5" />
                </button>
              </div>
            )}
          </div>
          {note.content && (
            <p className="text-xs text-muted-foreground/55 line-clamp-2 leading-relaxed">{note.content}</p>
          )}
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // ── EDITOR VIEW ──────────────────────────────────────────────────────────────
  if (view === "editor") {
    const currentNT = getNoteType(editType);
    const isArchived = editStatus === "archived";

    return (
      <div className="h-full flex flex-col" style={{ background: "hsl(var(--background))" }}>
        {/* ── Apple Notes–style header ─────────────────────────────────────── */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border/40 flex-shrink-0">
          <button onClick={goBack}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-secondary text-muted-foreground transition-colors flex-shrink-0">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex-1 min-w-0 flex flex-col">
            <input
              value={editTitle}
              onChange={e => { setEditTitle(e.target.value); isDirty.current = true; }}
              placeholder="Title"
              className="bg-transparent outline-none text-[15px] font-semibold leading-tight placeholder:text-muted-foreground/35 min-w-0 w-full"
              autoFocus
            />
            {editNote?.createdAt && (
              <span className="text-[10px] text-muted-foreground/40 leading-none mt-0.5">
                {new Date(editNote.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
              </span>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={updateMutation.isPending || createMutation.isPending}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 flex-shrink-0"
            style={{ background: "rgba(249,109,28,0.12)", color: "#F96D1C", border: "1px solid rgba(249,109,28,0.25)" }}
          >
            {(updateMutation.isPending || createMutation.isPending) ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
            Save
          </button>
        </div>

        {/* Coloured stripe matching the selected type */}
        <div style={{ height: 2, background: currentNT.color, opacity: 0.6, flexShrink: 0 }} />

        {/* ── Writing area ─────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 pt-4 pb-2">
            <textarea
              value={editContent}
              onChange={e => { setEditContent(e.target.value); isDirty.current = true; }}
              placeholder="Start writing…"
              className="w-full min-h-[220px] bg-transparent outline-none text-sm leading-[1.85] placeholder:text-muted-foreground/30 resize-none"
              style={{ fontFamily: "inherit" }}
            />
          </div>

          {/* ── Compact metadata bar ─────────────────────────────────────── */}
          <div className="border-t border-border/25 mx-4" />
          <div className="px-4 py-2.5 flex items-center gap-3 flex-wrap">
            {/* Type / colour dots */}
            <div className="flex items-center gap-1.5">
              {NOTE_TYPES.map(nt => (
                <button
                  key={nt.value}
                  onClick={() => { setEditType(nt.value); isDirty.current = true; }}
                  title={nt.label}
                  className="transition-all"
                  style={{
                    width: editType === nt.value ? 14 : 10,
                    height: editType === nt.value ? 14 : 10,
                    borderRadius: "50%",
                    background: nt.color,
                    opacity: editType === nt.value ? 1 : 0.35,
                    outline: editType === nt.value ? `2px solid ${nt.color}55` : "none",
                    outlineOffset: 2,
                    flexShrink: 0,
                  }}
                />
              ))}
            </div>

            <div className="h-3.5 w-px bg-border/40 flex-shrink-0" />

            {/* Status compact selector */}
            <div className="flex items-center gap-1">
              {NOTE_STATUSES.filter(s => s.value !== "inbox").map(st => {
                const StI = st.icon;
                const active = editStatus === st.value;
                return (
                  <button key={st.value}
                    onClick={() => { setEditStatus(st.value); isDirty.current = true; }}
                    title={st.label}
                    className="w-6 h-6 flex items-center justify-center rounded-md transition-all"
                    style={{
                      background: active ? `${st.color}18` : "transparent",
                      color: active ? st.color : "hsl(var(--muted-foreground))",
                      opacity: active ? 1 : 0.45,
                    }}
                  >
                    <StI className="h-3 w-3" />
                  </button>
                );
              })}
            </div>

            <div className="h-3.5 w-px bg-border/40 flex-shrink-0" />

            {/* Importance compact */}
            <div className="flex items-center gap-1">
              {IMPORTANCE_LEVELS.map(im => {
                const ImI = im.icon;
                const active = editImportance === im.value;
                return (
                  <button key={im.value}
                    onClick={() => { setEditImportance(im.value); isDirty.current = true; }}
                    title={im.label}
                    className="w-6 h-6 flex items-center justify-center rounded-md transition-all"
                    style={{
                      background: active ? `${im.color}15` : "transparent",
                      color: active ? im.color : "hsl(var(--muted-foreground))",
                      opacity: active ? 1 : 0.45,
                    }}
                  >
                    <ImI className="h-3 w-3" />
                  </button>
                );
              })}
            </div>

            <div className="ml-auto">
              <button
                onClick={() => setShowDetails(v => !v)}
                className="flex items-center gap-1 text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
              >
                <Tag className="h-3 w-3" />
                Details
                {showDetails ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />}
              </button>
            </div>
          </div>

          {/* ── Expandable details ───────────────────────────────────────── */}
          {showDetails && (
            <div className="px-4 pb-3 space-y-2 border-t border-border/20 pt-3">
              {/* Tags */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border/40 bg-secondary/20">
                <Tag className="h-3 w-3 text-muted-foreground/50 flex-shrink-0" />
                <input
                  value={editTags}
                  onChange={e => { setEditTags(e.target.value); isDirty.current = true; }}
                  placeholder="Tags, comma-separated…"
                  className="flex-1 bg-transparent outline-none text-xs placeholder:text-muted-foreground/35"
                />
              </div>

              {/* Collections */}
              <div className="rounded-lg border border-border/50 overflow-hidden">
                <button onClick={() => setShowCollectionPicker(v => !v)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-muted-foreground hover:bg-secondary/50 transition-colors">
                  <Folder className="h-3 w-3" />
                  Collections
                  {editCollectionIds.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: "rgba(249,109,28,0.12)", color: "#F96D1C" }}>
                      {editCollectionIds.length}
                    </span>
                  )}
                  {showCollectionPicker ? <ChevronUp className="h-3 w-3 ml-auto" /> : <ChevronDown className="h-3 w-3 ml-auto" />}
                </button>
                {showCollectionPicker && (
                  <div className="border-t border-border/50 max-h-40 overflow-y-auto">
                    {collections.length === 0 ? (
                      <p className="px-3 py-3 text-xs text-muted-foreground/60 italic">No collections yet</p>
                    ) : collections.map(col => (
                      <label key={col.id} className="flex items-center gap-2.5 px-3 py-2 hover:bg-secondary/40 cursor-pointer">
                        <div className="w-3.5 h-3.5 rounded flex items-center justify-center flex-shrink-0 border transition-colors"
                          style={{ background: editCollectionIds.includes(col.id) ? (col.color ?? undefined) : undefined, borderColor: editCollectionIds.includes(col.id) ? (col.color ?? "hsl(var(--border))") : "hsl(var(--border))" }}>
                          {editCollectionIds.includes(col.id) && <Check className="h-2 w-2 text-white" />}
                        </div>
                        <input type="checkbox" className="sr-only" checked={editCollectionIds.includes(col.id)}
                          onChange={e => { setEditCollectionIds(prev => e.target.checked ? [...prev, col.id] : prev.filter(id => id !== col.id)); isDirty.current = true; }} />
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: col.color ?? undefined }} />
                        <span className="text-xs truncate">{col.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Linked Notes */}
              <div className="rounded-lg border border-border/50 overflow-hidden">
                <button onClick={() => setShowLinkNotes(v => !v)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-muted-foreground hover:bg-secondary/50 transition-colors">
                  <Link2 className="h-3 w-3" />
                  Linked Notes
                  {editLinkedNoteIds.length > 0 && <span className="ml-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(99,102,241,0.12)", color: "#6366F1" }}>{editLinkedNoteIds.length}</span>}
                  {showLinkNotes ? <ChevronUp className="h-3 w-3 ml-auto" /> : <ChevronDown className="h-3 w-3 ml-auto" />}
                </button>
                {showLinkNotes && (
                  <div className="border-t border-border/50 max-h-40 overflow-y-auto">
                    {notes.filter(n => n.id !== editNote?.id).length === 0 ? (
                      <p className="px-3 py-3 text-xs text-muted-foreground/60 italic">No other notes yet</p>
                    ) : notes.filter(n => n.id !== editNote?.id).map(n => (
                      <label key={n.id} className="flex items-center gap-2.5 px-3 py-2 hover:bg-secondary/40 cursor-pointer">
                        <div className="w-3.5 h-3.5 rounded flex items-center justify-center flex-shrink-0 border transition-colors"
                          style={{ background: editLinkedNoteIds.includes(n.id) ? "#6366F1" : undefined, borderColor: editLinkedNoteIds.includes(n.id) ? "#6366F1" : "hsl(var(--border))" }}>
                          {editLinkedNoteIds.includes(n.id) && <Check className="h-2 w-2 text-white" />}
                        </div>
                        <input type="checkbox" className="sr-only" checked={editLinkedNoteIds.includes(n.id)}
                          onChange={e => { setEditLinkedNoteIds(p => e.target.checked ? [...p, n.id] : p.filter(i => i !== n.id)); isDirty.current = true; }} />
                        <span className="text-xs truncate">{n.title}</span>
                        <span className="ml-auto text-[10px] text-muted-foreground/50 flex-shrink-0 capitalize">{getNoteType(n.type || "").label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Linked Sources */}
              <div className="rounded-lg border border-border/50 overflow-hidden">
                <button onClick={() => setShowLinkSources(v => !v)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-muted-foreground hover:bg-secondary/50 transition-colors">
                  <Layers className="h-3 w-3" />
                  Linked Sources
                  {editLinkedSourceIds.length > 0 && <span className="ml-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(13,148,136,0.12)", color: "#0D9488" }}>{editLinkedSourceIds.length}</span>}
                  {showLinkSources ? <ChevronUp className="h-3 w-3 ml-auto" /> : <ChevronDown className="h-3 w-3 ml-auto" />}
                </button>
                {showLinkSources && (
                  <div className="border-t border-border/50 max-h-40 overflow-y-auto">
                    {sources.length === 0 ? (
                      <p className="px-3 py-3 text-xs text-muted-foreground/60 italic">No sources yet</p>
                    ) : sources.map((s: any) => (
                      <label key={s.id} className="flex items-center gap-2.5 px-3 py-2 hover:bg-secondary/40 cursor-pointer">
                        <div className="w-3.5 h-3.5 rounded flex items-center justify-center flex-shrink-0 border transition-colors"
                          style={{ background: editLinkedSourceIds.includes(s.id) ? "#0D9488" : undefined, borderColor: editLinkedSourceIds.includes(s.id) ? "#0D9488" : "hsl(var(--border))" }}>
                          {editLinkedSourceIds.includes(s.id) && <Check className="h-2 w-2 text-white" />}
                        </div>
                        <input type="checkbox" className="sr-only" checked={editLinkedSourceIds.includes(s.id)}
                          onChange={e => { setEditLinkedSourceIds(p => e.target.checked ? [...p, s.id] : p.filter(i => i !== s.id)); isDirty.current = true; }} />
                        <span className="text-xs truncate">{s.title}</span>
                        {s.author && <span className="ml-auto text-[10px] text-muted-foreground/50 flex-shrink-0 truncate max-w-[80px]">{s.author}</span>}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Linked Drafts */}
              <div className="rounded-lg border border-border/50 overflow-hidden">
                <button onClick={() => setShowLinkDrafts(v => !v)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-muted-foreground hover:bg-secondary/50 transition-colors">
                  <Edit3 className="h-3 w-3" />
                  Linked Drafts
                  {editLinkedDraftIds.length > 0 && <span className="ml-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(249,109,28,0.12)", color: "#F96D1C" }}>{editLinkedDraftIds.length}</span>}
                  {showLinkDrafts ? <ChevronUp className="h-3 w-3 ml-auto" /> : <ChevronDown className="h-3 w-3 ml-auto" />}
                </button>
                {showLinkDrafts && (
                  <div className="border-t border-border/50 max-h-40 overflow-y-auto">
                    {drafts.length === 0 ? (
                      <p className="px-3 py-3 text-xs text-muted-foreground/60 italic">No drafts yet</p>
                    ) : drafts.map((d: any) => (
                      <label key={d.id} className="flex items-center gap-2.5 px-3 py-2 hover:bg-secondary/40 cursor-pointer">
                        <div className="w-3.5 h-3.5 rounded flex items-center justify-center flex-shrink-0 border transition-colors"
                          style={{ background: editLinkedDraftIds.includes(d.id) ? "#F96D1C" : undefined, borderColor: editLinkedDraftIds.includes(d.id) ? "#F96D1C" : "hsl(var(--border))" }}>
                          {editLinkedDraftIds.includes(d.id) && <Check className="h-2 w-2 text-white" />}
                        </div>
                        <input type="checkbox" className="sr-only" checked={editLinkedDraftIds.includes(d.id)}
                          onChange={e => { setEditLinkedDraftIds(p => e.target.checked ? [...p, d.id] : p.filter(i => i !== d.id)); isDirty.current = true; }} />
                        <span className="text-xs truncate">{d.title}</span>
                        {d.type && <span className="ml-auto text-[10px] text-muted-foreground/50 flex-shrink-0 capitalize">{d.type}</span>}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── Obsidian: Backlinks ──────────────────────────────────────────── */}
          {editNote && (
            <div className="mx-4 mb-2 rounded-xl border border-border/60 overflow-hidden">
              <button onClick={() => setShowBacklinks(v => !v)}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-muted-foreground hover:bg-secondary/50 transition-colors">
                <GitBranch className="h-3 w-3 text-indigo-400" />
                Backlinks
                {(backlinkedNotes.length + backlinkedDrafts.length) > 0 && (
                  <span className="ml-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                    style={{ background: "rgba(99,102,241,0.12)", color: "#6366F1" }}>
                    {backlinkedNotes.length + backlinkedDrafts.length}
                  </span>
                )}
                {showBacklinks ? <ChevronUp className="h-3 w-3 ml-auto" /> : <ChevronDown className="h-3 w-3 ml-auto" />}
              </button>
              {showBacklinks && (
                <div className="border-t border-border/50">
                  {backlinkedNotes.length === 0 && backlinkedDrafts.length === 0 ? (
                    <p className="px-3 py-3 text-xs text-muted-foreground/50 italic">No notes or drafts reference this note yet</p>
                  ) : (
                    <>
                      {backlinkedNotes.length > 0 && (
                        <div className="px-3 pt-2 pb-1">
                          <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/50 mb-1">Linked from</p>
                          <div className="space-y-1">
                            {backlinkedNotes.map(n => {
                              const nt = getNoteType(n.type || "");
                              const NtI = nt.icon;
                              return (
                                <button key={n.id} onClick={() => openEditor(n)} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-secondary/50 transition-colors text-left">
                                  <NtI className="h-3 w-3 flex-shrink-0" style={{ color: nt.color }} />
                                  <span className="text-xs flex-1 truncate">{n.title}</span>
                                  <ExternalLink className="h-2.5 w-2.5 text-muted-foreground/40 flex-shrink-0" />
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {backlinkedDrafts.length > 0 && (
                        <div className="px-3 pt-1 pb-2">
                          <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/50 mb-1">Used in drafts</p>
                          <div className="space-y-1">
                            {backlinkedDrafts.map((d: any) => (
                              <div key={d.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-secondary/30">
                                <FileText className="h-3 w-3 flex-shrink-0 text-amber-400" />
                                <span className="text-xs flex-1 truncate">{d.title}</span>
                                <span className="text-[10px] text-muted-foreground/40 capitalize flex-shrink-0">{d.type}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ─── Obsidian: Related Notes ──────────────────────────────────────── */}
          {editNote && (
            <div className="mx-4 mb-2 rounded-xl border border-border/60 overflow-hidden">
              <button onClick={() => setShowRelated(v => !v)}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-muted-foreground hover:bg-secondary/50 transition-colors">
                <Network className="h-3 w-3 text-emerald-400" />
                Related Notes
                {relatedNotes.length > 0 && (
                  <span className="ml-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                    style={{ background: "rgba(16,185,129,0.12)", color: "#10B981" }}>
                    {relatedNotes.length}
                  </span>
                )}
                {showRelated ? <ChevronUp className="h-3 w-3 ml-auto" /> : <ChevronDown className="h-3 w-3 ml-auto" />}
              </button>
              {showRelated && (
                <div className="border-t border-border/50">
                  {relatedNotes.length === 0 ? (
                    <p className="px-3 py-3 text-xs text-muted-foreground/50 italic">
                      No related notes found. Link notes or add shared tags to build connections.
                    </p>
                  ) : (
                    <div className="p-2 space-y-1">
                      {relatedNotes.map(n => {
                        const nt = getNoteType(n.type || "");
                        const NtI = nt.icon;
                        const isLinked = editLinkedNoteIds.includes(n.id);
                        const isBacklink = backlinkedNotes.some(b => b.id === n.id);
                        const sharedTags = (n.tags || "").split(",").filter(t => {
                          const tr = t.trim().toLowerCase();
                          return tr && (editNote.tags || "").split(",").some(et => et.trim().toLowerCase() === tr);
                        });
                        return (
                          <div key={n.id} className="flex items-start gap-2 px-2 py-1.5 rounded-lg hover:bg-secondary/30 transition-colors">
                            <NtI className="h-3 w-3 flex-shrink-0 mt-0.5" style={{ color: nt.color }} />
                            <div className="flex-1 min-w-0">
                              <button onClick={() => openEditor(n)} className="text-xs font-medium text-left hover:underline truncate block w-full">
                                {n.title}
                              </button>
                              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                {isLinked && <span className="text-[9px] px-1 rounded" style={{ background: "rgba(99,102,241,0.1)", color: "#6366F1" }}>linked</span>}
                                {isBacklink && <span className="text-[9px] px-1 rounded" style={{ background: "rgba(99,102,241,0.1)", color: "#6366F1" }}>backlink</span>}
                                {sharedTags.slice(0, 3).map(t => (
                                  <span key={t} className="text-[9px] px-1 rounded bg-secondary text-muted-foreground/60">#{t.trim()}</span>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ─── Obsidian: Embedded Note Previews ────────────────────────────── */}
          {editNote && editLinkedNoteIds.length > 0 && (
            <div className="mx-4 mb-2 rounded-xl border border-border/60 overflow-hidden">
              <button onClick={() => setShowEmbedded(v => !v)}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-muted-foreground hover:bg-secondary/50 transition-colors">
                <BookOpen className="h-3 w-3 text-sky-400" />
                Embedded Notes
                <span className="ml-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                  style={{ background: "rgba(14,165,233,0.12)", color: "#0EA5E9" }}>
                  {editLinkedNoteIds.length}
                </span>
                {showEmbedded ? <ChevronUp className="h-3 w-3 ml-auto" /> : <ChevronDown className="h-3 w-3 ml-auto" />}
              </button>
              {showEmbedded && (
                <div className="border-t border-border/50 p-2 space-y-2">
                  {editLinkedNoteIds.map(nid => {
                    const linked = notes.find(n => n.id === nid);
                    if (!linked) return null;
                    const nt = getNoteType(linked.type || "");
                    const NtI = nt.icon;
                    return (
                      <div key={nid} className="rounded-lg border overflow-hidden" style={{ borderColor: `${nt.color}25`, background: `${nt.bg}` }}>
                        <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: `${nt.color}15` }}>
                          <NtI className="h-3 w-3 flex-shrink-0" style={{ color: nt.color }} />
                          <span className="text-xs font-semibold flex-1 truncate">{linked.title}</span>
                          <button onClick={() => openEditor(linked)} className="flex-shrink-0 text-muted-foreground/40 hover:text-foreground transition-colors">
                            <ExternalLink className="h-2.5 w-2.5" />
                          </button>
                        </div>
                        {linked.content && (
                          <p className="px-3 py-2 text-[11px] text-muted-foreground/70 line-clamp-3 leading-relaxed">
                            {linked.content}
                          </p>
                        )}
                        {linked.tags && (
                          <div className="px-3 pb-2 flex gap-1 flex-wrap">
                            {linked.tags.split(",").filter(Boolean).slice(0, 4).map(t => (
                              <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-white/60 text-muted-foreground/60">#{t.trim()}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ─── Obsidian: MOC View ───────────────────────────────────────────── */}
          {editNote && editType === "map_of_content" && (
            <div className="mx-4 mb-2 rounded-xl border overflow-hidden" style={{ borderColor: "#0EA5E920", background: "#F0F9FF" }}>
              <div className="px-3 py-2.5 border-b flex items-center gap-2" style={{ borderColor: "#0EA5E920" }}>
                <Map className="h-3 w-3 text-sky-500" />
                <span className="text-xs font-semibold text-sky-600">Map of Content</span>
                <span className="text-[10px] text-sky-500/60 ml-1">— thematic overview</span>
              </div>
              <div className="p-3 space-y-3">
                {/* Core theme */}
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-sky-600/60 mb-1.5">Core Theme</p>
                  <p className="text-xs text-foreground/80 leading-relaxed">{editContent || "Add your core theme description in the content area above."}</p>
                </div>
                {/* Linked concepts (from tags) */}
                {editTags && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-sky-600/60 mb-1.5 flex items-center gap-1">
                      <Hash className="h-2.5 w-2.5" />Concepts
                    </p>
                    <div className="flex gap-1 flex-wrap">
                      {editTags.split(",").filter(Boolean).map(t => (
                        <span key={t} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "#0EA5E915", color: "#0EA5E9", border: "1px solid #0EA5E925" }}>
                          {t.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {/* Related notes in MOC */}
                {editLinkedNoteIds.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-sky-600/60 mb-1.5">Related Notes</p>
                    <div className="space-y-1">
                      {editLinkedNoteIds.map(nid => {
                        const n = notes.find(x => x.id === nid);
                        if (!n) return null;
                        const nt = getNoteType(n.type || "");
                        const NtI = nt.icon;
                        const isQuestion = n.type === "question";
                        return (
                          <div key={nid} className="flex items-center gap-2 px-2 py-1 rounded-lg bg-white/70">
                            <NtI className="h-2.5 w-2.5 flex-shrink-0" style={{ color: nt.color }} />
                            <button onClick={() => openEditor(n)} className="text-[11px] flex-1 text-left hover:underline truncate">{n.title}</button>
                            {isQuestion && <span className="text-[9px] text-purple-400 flex-shrink-0">open Q</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {/* Related drafts */}
                {editLinkedDraftIds.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-sky-600/60 mb-1.5">Related Drafts</p>
                    <div className="space-y-1">
                      {editLinkedDraftIds.map(did => {
                        const d = (drafts as any[]).find((x: any) => x.id === did);
                        if (!d) return null;
                        return (
                          <div key={did} className="flex items-center gap-2 px-2 py-1 rounded-lg bg-white/70">
                            <FileText className="h-2.5 w-2.5 flex-shrink-0 text-amber-400" />
                            <span className="text-[11px] flex-1 truncate">{d.title}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {/* Sources */}
                {editLinkedSourceIds.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-sky-600/60 mb-1.5">Related Sources</p>
                    <div className="space-y-1">
                      {editLinkedSourceIds.map(sid => {
                        const s = (sources as any[]).find((x: any) => x.id === sid);
                        if (!s) return null;
                        return (
                          <div key={sid} className="flex items-center gap-2 px-2 py-1 rounded-lg bg-white/70">
                            <Database className="h-2.5 w-2.5 flex-shrink-0 text-teal-400" />
                            <span className="text-[11px] flex-1 truncate">{s.title}</span>
                            {s.author && <span className="text-[9px] text-muted-foreground/50 flex-shrink-0">{s.author}</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── Obsidian: Local Graph ────────────────────────────────────────── */}
          {editNote && (
            <div className="mx-4 mb-2 rounded-xl border border-border/60 overflow-hidden">
              <button onClick={() => setShowLocalGraph(v => !v)}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-muted-foreground hover:bg-secondary/50 transition-colors">
                <GitBranch className="h-3 w-3 text-violet-400" />
                Local Graph
                {showLocalGraph ? <ChevronUp className="h-3 w-3 ml-auto" /> : <ChevronDown className="h-3 w-3 ml-auto" />}
              </button>
              {showLocalGraph && (
                <div className="border-t border-border/50" style={{ height: 320 }}>
                  <NotesGraph
                    notes={notes}
                    drafts={drafts as Draft[]}
                    sources={sources as Source[]}
                    mode="local"
                    focalNoteId={editNote.id}
                    onOpenNote={id => { const n = notes.find(x => x.id === id); if (n) openEditor(n); }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Action bar */}
          <div className="flex flex-wrap items-center gap-2 px-4 pb-4">
            <button onClick={() => sendToBoard(editNote!)} disabled={!editNote}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-medium border transition-all hover:opacity-80 disabled:opacity-40"
              style={{ borderColor: "rgba(99,102,241,0.25)", color: "#6366F1", background: "rgba(99,102,241,0.05)" }}>
              <StickyNote className="h-3 w-3" />Send to Board
            </button>
            <button onClick={() => editNote && sendToDraft(editNote)} disabled={!editNote}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-medium border transition-all hover:opacity-80 disabled:opacity-40"
              style={{ borderColor: "rgba(249,109,28,0.25)", color: "#F96D1C", background: "rgba(249,109,28,0.05)" }}>
              <ArrowDownToLine className="h-3 w-3" />→ Draft
            </button>
            {editNote && (
              <button onClick={() => deleteMutation.mutate(editNote.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-medium border transition-all hover:opacity-80 ml-auto"
                style={{ borderColor: "rgba(239,68,68,0.20)", color: "#EF4444" }}>
                <Trash2 className="h-3 w-3" />Delete
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ── LIST VIEWS ───────────────────────────────────────────────────────────────

  return (
    <div className="h-full flex flex-col">
      {/* Quick Capture */}
      <div className="px-4 pt-4 pb-3 border-b border-border/50 flex-shrink-0">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-primary/20 bg-primary/5 focus-within:border-primary/40 transition-colors">
          <Zap className="h-3.5 w-3.5 text-primary flex-shrink-0" />
          <input
            ref={quickRef}
            value={quickText}
            onChange={e => setQuickText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleQuickCapture(); }}
            placeholder="Quick thought… press Enter to capture"
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground/40"
          />
          {quickText && (
            <button onClick={handleQuickCapture}
              className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-lg transition-colors"
              style={{ background: "#F96D1C" }}>
              <ArrowRight className="h-3 w-3 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Sub-nav */}
      <div className="flex px-4 py-2 gap-1 flex-shrink-0">
        {(["inbox", "all", "collections", "graph"] as NoteView[]).map(tab => {
          const labels: Record<string, string> = {
            inbox: `Inbox${inboxNotes.length > 0 ? ` (${inboxNotes.length})` : ""}`,
            all: "All Notes",
            collections: "Collections",
            graph: "Graph",
          };
          const icons: Record<string, any> = { inbox: Inbox, all: Layers, collections: Folder, graph: GitBranch };
          const TabIcon = icons[tab];
          return (
            <button key={tab} onClick={() => setView(tab as NoteView)}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl text-[11px] font-medium transition-all"
              style={{
                background: view === tab ? "hsl(var(--background))" : "transparent",
                color: view === tab
                  ? tab === "graph" ? "#8B5CF6" : "hsl(var(--foreground))"
                  : "hsl(var(--muted-foreground))",
                boxShadow: view === tab ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                border: view === tab ? `1px solid ${tab === "graph" ? "rgba(139,92,246,0.25)" : "hsl(var(--border))"}` : "1px solid transparent",
              }}
            >
              <TabIcon className="h-3 w-3" />
              {labels[tab]}
            </button>
          );
        })}
      </div>

      {/* ── Inbox View ─────────────────────────────────────────────────────────── */}
      {view === "inbox" && (
        <ScrollArea className="flex-1">
          <div className="px-4 pb-4 space-y-2 pt-1">
            {inboxNotes.length === 0 ? (
              <div className="py-14 text-center">
                <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
                  <Inbox className="h-5 w-5 text-muted-foreground/30" />
                </div>
                <h4 className="font-medium text-sm mb-1 text-muted-foreground">Inbox is clear</h4>
                <p className="text-xs text-muted-foreground/60 max-w-[200px] mx-auto leading-relaxed">
                  Quick thoughts captured above will land here. Process them when you're ready.
                </p>
              </div>
            ) : (
              inboxNotes.map(note => {
                const nt = getNoteType(note.type || "quick_thought");
                const NtI = nt.icon;
                return (
                  <div key={note.id} className="group p-3.5 rounded-xl border bg-card transition-all hover:shadow-sm"
                    style={{ borderColor: `${nt.color}20` }}>
                    <div className="flex items-start gap-2.5 mb-2">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: nt.bg, border: `1px solid ${nt.color}25` }}>
                        <NtI className="h-3 w-3" style={{ color: nt.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm leading-snug">{note.title}</h4>
                        {note.content && (
                          <p className="text-xs text-muted-foreground/60 mt-0.5 line-clamp-2 leading-relaxed">{note.content}</p>
                        )}
                      </div>
                    </div>
                    {/* Inbox action buttons */}
                    <div className="flex gap-1.5 flex-wrap pl-8">
                      <button onClick={() => quickAction(note, "activate")}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors"
                        style={{ background: "rgba(16,185,129,0.10)", color: "#10B981" }}>
                        <CheckCircle2 className="h-2.5 w-2.5" />Keep active
                      </button>
                      <button onClick={() => quickAction(note, "edit")}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors bg-secondary text-muted-foreground hover:text-foreground">
                        <Pencil className="h-2.5 w-2.5" />Develop
                      </button>
                      <button onClick={() => sendToDraft(note)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors"
                        style={{ background: "rgba(139,92,246,0.10)", color: "#8B5CF6" }}>
                        <SendHorizontal className="h-2.5 w-2.5" />→ Draft
                      </button>
                      <button onClick={() => sendToBoard(note)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors"
                        style={{ background: "rgba(99,102,241,0.10)", color: "#6366F1" }}>
                        <StickyNote className="h-2.5 w-2.5" />→ Board
                      </button>
                      <button onClick={() => quickAction(note, "archive")}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors bg-secondary text-muted-foreground hover:text-amber-500">
                        <Archive className="h-2.5 w-2.5" />Archive
                      </button>
                      <button onClick={() => deleteMutation.mutate(note.id)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors bg-secondary text-muted-foreground hover:text-red-500">
                        <Trash2 className="h-2.5 w-2.5" />Delete
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      )}

      {/* ── All Notes View ──────────────────────────────────────────────────────── */}
      {view === "all" && (
        <>
          {/* Filters */}
          <div className="px-4 pb-2 flex-shrink-0 space-y-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border/50 bg-secondary/30">
              <Search className="h-3 w-3 text-muted-foreground/60 flex-shrink-0" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search notes…"
                className="flex-1 bg-transparent outline-none text-xs placeholder:text-muted-foreground/40" />
              {searchQuery && <button onClick={() => setSearchQuery("")}><X className="h-3 w-3 text-muted-foreground" /></button>}
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              <button onClick={() => setTypeFilter("all")}
                className="flex-shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors"
                style={{ background: typeFilter === "all" ? "hsl(var(--secondary))" : "transparent", color: typeFilter === "all" ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}>
                All types
              </button>
              {NOTE_TYPES.map(nt => {
                const NtI = nt.icon;
                const count = notes.filter(n => n.type === nt.value && n.status !== "archived").length;
                if (count === 0) return null;
                return (
                  <button key={nt.value} onClick={() => setTypeFilter(nt.value)}
                    className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all"
                    style={{
                      background: typeFilter === nt.value ? nt.bg : "transparent",
                      color: typeFilter === nt.value ? nt.color : "hsl(var(--muted-foreground))",
                      border: typeFilter === nt.value ? `1px solid ${nt.color}30` : "1px solid transparent",
                    }}>
                    <NtI className="h-2.5 w-2.5" />{nt.label}<span className="opacity-60">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="px-4 pb-2 flex gap-1.5 overflow-x-auto flex-shrink-0">
            {orphanNoteIds.size > 0 && (
              <button
                onClick={() => setOrphansOnly(v => !v)}
                className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all"
                style={{
                  background: orphansOnly ? "rgba(239,68,68,0.10)" : "transparent",
                  color: orphansOnly ? "#EF4444" : "hsl(var(--muted-foreground))",
                  border: orphansOnly ? "1px solid rgba(239,68,68,0.25)" : "1px solid transparent",
                }}>
                <AlertCircle className="h-2.5 w-2.5" />
                Orphans ({orphanNoteIds.size})
              </button>
            )}
            <button onClick={() => openEditor(null, "all")}
              className="ml-auto flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors"
              style={{ background: "rgba(249,109,28,0.10)", color: "#F96D1C", border: "1px solid rgba(249,109,28,0.20)" }}>
              <Plus className="h-3 w-3" />New Note
            </button>
          </div>
          <ScrollArea className="flex-1">
            <div className="px-4 pb-4 space-y-2">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 bg-muted/40 rounded-xl animate-pulse" />)
              ) : allActiveNotes.length === 0 ? (
                <div className="py-14 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
                    <Layers className="h-5 w-5 text-muted-foreground/30" />
                  </div>
                  <h4 className="font-medium text-sm mb-1 text-muted-foreground">
                    {notes.filter(n => n.status !== "archived").length === 0 ? "No notes yet" : "Nothing matches"}
                  </h4>
                  <p className="text-xs text-muted-foreground/60 max-w-[200px] mx-auto">
                    {notes.filter(n => n.status !== "archived").length === 0 ? "Start capturing ideas with quick capture above." : "Try a different filter."}
                  </p>
                </div>
              ) : allActiveNotes.map(note => (
                <NoteCard key={note.id} note={note} showActions />
              ))}
            </div>
          </ScrollArea>
        </>
      )}

      {/* ── Collections View ────────────────────────────────────────────────────── */}
      {view === "collections" && (
        <ScrollArea className="flex-1">
          <div className="px-4 pt-2 pb-4 space-y-3">
            {/* Create new collection */}
            {showNewCol ? (
              <div className="p-3.5 rounded-xl border border-border bg-card space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">New Collection</p>
                <input value={newColName} onChange={e => setNewColName(e.target.value)}
                  placeholder="Collection name…"
                  className="w-full text-sm bg-secondary/50 rounded-xl px-3 py-2 outline-none border border-border"
                  autoFocus
                />
                <div className="flex gap-1.5 flex-wrap">
                  {COLLECTION_COLORS.map(col => (
                    <button key={col} onClick={() => setNewColColor(col)}
                      className="w-6 h-6 rounded-full transition-all"
                      style={{ background: col, outline: newColColor === col ? `2px solid ${col}` : "none", outlineOffset: 2 }} />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowNewCol(false)} className="flex-1 py-2 rounded-xl text-xs font-medium border border-border hover:bg-secondary transition-colors">Cancel</button>
                  <button
                    onClick={() => newColName.trim() && createColMutation.mutate({ name: newColName.trim(), color: newColColor })}
                    disabled={!newColName.trim() || createColMutation.isPending}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold text-white transition-all disabled:opacity-40 flex items-center justify-center gap-1"
                    style={{ background: newColColor }}>
                    {createColMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                    Create
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowNewCol(true)}
                className="w-full flex items-center gap-2 px-3.5 py-3 rounded-xl border border-dashed border-border hover:border-primary/40 hover:bg-primary/5 transition-all text-muted-foreground hover:text-primary">
                <FolderPlus className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">New Collection</span>
              </button>
            )}

            {/* Collection list */}
            {collections.length === 0 && !showNewCol ? (
              <div className="py-10 text-center">
                <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
                  <Folder className="h-5 w-5 text-muted-foreground/30" />
                </div>
                <h4 className="font-medium text-sm mb-1 text-muted-foreground">No collections yet</h4>
                <p className="text-xs text-muted-foreground/60 max-w-[200px] mx-auto leading-relaxed">
                  Collections group related notes — Core Philosophy, Characters, Metaphors, Research Ideas…
                </p>
              </div>
            ) : (
              collections.map(col => {
                const colNotes = notes.filter(n =>
                  (n.collectionIds || "").split(",").map(Number).includes(col.id) && n.status !== "archived"
                );
                return (
                  <div key={col.id} className="group rounded-xl border border-border bg-card overflow-hidden">
                    <div
                      className="flex items-center gap-2.5 px-3.5 py-3 cursor-pointer hover:bg-secondary/30 transition-colors"
                      onClick={() => { setCollectionFilter(col.id); setTypeFilter("all"); setSearchQuery(""); setView("all"); }}
                    >
                      <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${col.color ?? "#F59E0B"}18` }}>
                        <Folder className="h-3.5 w-3.5" style={{ color: col.color ?? "#F59E0B" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm truncate">{col.name}</span>
                          <span className="text-[10px] text-muted-foreground/60 flex-shrink-0">{colNotes.length} notes</span>
                        </div>
                        {colNotes.length > 0 && (
                          <p className="text-[10px] text-muted-foreground/50 mt-0.5 truncate">
                            {colNotes.slice(0, 3).map(n => n.title).join(" · ")}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); deleteColMutation.mutate(col.id); }}
                        className="w-6 h-6 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 hover:bg-red-100 text-muted-foreground hover:text-red-500 transition-all flex-shrink-0">
                        <Trash2 className="h-2.5 w-2.5" />
                      </button>
                    </div>
                    {colNotes.length > 0 && (
                      <div className="border-t border-border/40 px-3.5 py-2 flex gap-1.5 overflow-x-auto">
                        {colNotes.slice(0, 5).map(n => {
                          const nt = getNoteType(n.type || "");
                          return (
                            <span key={n.id}
                              className="flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium cursor-pointer hover:opacity-80 transition-opacity"
                              style={{ background: nt.bg, color: nt.color }}
                              onClick={() => openEditor(n, "collections")}>
                              {n.title.slice(0, 22)}{n.title.length > 22 ? "…" : ""}
                            </span>
                          );
                        })}
                        {colNotes.length > 5 && (
                          <span className="flex-shrink-0 flex items-center px-2 py-0.5 rounded-full text-[10px] text-muted-foreground/60 bg-secondary">
                            +{colNotes.length - 5} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      )}

      {/* ── Graph View ──────────────────────────────────────────────────────────── */}
      {view === "graph" && (
        <div className="flex-1 min-h-0">
          <NotesGraph
            notes={notes}
            drafts={drafts as Draft[]}
            sources={sources as Source[]}
            mode="global"
            onOpenNote={id => {
              const n = notes.find(x => x.id === id);
              if (n) { setPrevView("graph"); openEditor(n, "graph"); }
            }}
          />
        </div>
      )}
    </div>
  );
}
