import { useState, useCallback, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Note } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useLang } from "@/contexts/language-context";
import {
  FileText, Plus, Trash2, Edit, Lightbulb, MessageSquare, Hash, BookOpen, Star,
  LayoutList, LayoutGrid, Paperclip, GripVertical, X, Check, Search, Zap,
  ChevronRight, Inbox, Pin, PinOff, FolderOpen, Tag, Filter, Eye, Archive,
  Sparkles, Brain, Target, HelpCircle, Telescope, Feather, Users, Microscope,
  ChevronDown, ChevronUp, StickyNote, Layers
} from "lucide-react";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, rectSortingStrategy, useSortable, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";
import { ru, uk, de, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";

// ─── i18n ─────────────────────────────────────────────────────────────
const NOTES_I18N = {
  en: {
    title: "Notes",
    inbox: "Inbox",
    pinned: "Pinned",
    allNotes: "All notes",
    collections: "Collections",
    noCollection: "Uncategorized",
    addCollection: "New collection…",
    count: (n: number) => `${n} note${n !== 1 ? "s" : ""}`,
    newBtn: "New",
    searchPlaceholder: "Search notes…",
    quickCapturePlaceholder: "Quick capture… Enter to save",
    quickCaptureExpand: "Expand",
    noResults: "No notes match your search",
    emptyTitle: "No notes yet",
    emptyDesc: "Capture ideas with the quick-capture bar above",
    emptyInbox: "Inbox is empty",
    emptyInboxDesc: "Quick-captured notes land here first",
    editTitle: "Edit note",
    newTitle: "New note",
    titlePlaceholder: "Note title…",
    contentPlaceholder: "Note content…",
    tagsPlaceholder: "tags, separated by commas…",
    collectionPlaceholder: "Collection name…",
    statusLabel: "Status",
    typeLabel: "Type",
    colorLabel: "Color",
    collectionLabel: "Collection",
    importanceLabel: "Importance",
    saving: "Saving…",
    save: "Save",
    cancel: "Cancel",
    updated: "Note updated",
    created: "Note created",
    deleted: "Note deleted",
    toastPinned: "Pinned",
    toastUnpinned: "Unpinned",
    types: {
      idea: "Idea", note: "Note", quote: "Quote", concept: "Concept",
      question: "Question", scene: "Scene", insight: "Insight",
      observation: "Observation", reflection: "Reflection",
      argument: "Argument", character: "Character",
    },
    statuses: {
      inbox: "Inbox", active: "Active", developed: "Developed",
      used: "Used", archived: "Archived",
    },
    importance: { normal: "Normal", high: "High", core: "Core" },
    filterType: "Type",
    filterStatus: "Status",
    all: "All",
  },
  ru: {
    title: "Заметки",
    inbox: "Входящие",
    pinned: "Закреплённые",
    allNotes: "Все заметки",
    collections: "Коллекции",
    noCollection: "Без коллекции",
    addCollection: "Новая коллекция…",
    count: (n: number) => `${n} заметок`,
    newBtn: "Новая",
    searchPlaceholder: "Поиск заметок…",
    quickCapturePlaceholder: "Быстрая мысль… Enter для сохранения",
    quickCaptureExpand: "Развернуть",
    noResults: "Заметки не найдены",
    emptyTitle: "Нет заметок",
    emptyDesc: "Фиксируй идеи в строке быстрого захвата выше",
    emptyInbox: "Входящие пусты",
    emptyInboxDesc: "Быстро захваченные заметки попадают сюда",
    editTitle: "Редактировать заметку",
    newTitle: "Новая заметка",
    titlePlaceholder: "Заголовок заметки…",
    contentPlaceholder: "Содержание заметки…",
    tagsPlaceholder: "теги через запятую…",
    collectionPlaceholder: "Название коллекции…",
    statusLabel: "Статус",
    typeLabel: "Тип",
    colorLabel: "Цвет",
    collectionLabel: "Коллекция",
    importanceLabel: "Важность",
    saving: "Сохраняю…",
    save: "Сохранить",
    cancel: "Отмена",
    updated: "Заметка обновлена",
    created: "Заметка создана",
    deleted: "Заметка удалена",
    toastPinned: "Закреплено",
    toastUnpinned: "Откреплено",
    types: {
      idea: "Идея", note: "Заметка", quote: "Цитата", concept: "Концепция",
      question: "Вопрос", scene: "Сцена", insight: "Инсайт",
      observation: "Наблюдение", reflection: "Рефлексия",
      argument: "Аргумент", character: "Персонаж",
    },
    statuses: {
      inbox: "Входящие", active: "Активная", developed: "Развита",
      used: "Использована", archived: "Архив",
    },
    importance: { normal: "Обычная", high: "Важная", core: "Ключевая" },
    filterType: "Тип",
    filterStatus: "Статус",
    all: "Все",
  },
  ua: {
    title: "Нотатки",
    inbox: "Вхідні",
    pinned: "Закріплені",
    allNotes: "Всі нотатки",
    collections: "Колекції",
    noCollection: "Без колекції",
    addCollection: "Нова колекція…",
    count: (n: number) => `${n} нотаток`,
    newBtn: "Нова",
    searchPlaceholder: "Пошук нотаток…",
    quickCapturePlaceholder: "Швидка думка… Enter для збереження",
    quickCaptureExpand: "Розгорнути",
    noResults: "Нотатки не знайдено",
    emptyTitle: "Немає нотаток",
    emptyDesc: "Фіксуй ідеї у рядку швидкого захоплення вище",
    emptyInbox: "Вхідні порожні",
    emptyInboxDesc: "Швидко захоплені нотатки потрапляють сюди",
    editTitle: "Редагувати нотатку",
    newTitle: "Нова нотатка",
    titlePlaceholder: "Назва нотатки…",
    contentPlaceholder: "Зміст нотатки…",
    tagsPlaceholder: "теги через кому…",
    collectionPlaceholder: "Назва колекції…",
    statusLabel: "Статус",
    typeLabel: "Тип",
    colorLabel: "Колір",
    collectionLabel: "Колекція",
    importanceLabel: "Важливість",
    saving: "Зберігаю…",
    save: "Зберегти",
    cancel: "Скасувати",
    updated: "Нотатку оновлено",
    created: "Нотатку створено",
    deleted: "Нотатку видалено",
    toastPinned: "Закріплено",
    toastUnpinned: "Відкріплено",
    types: {
      idea: "Ідея", note: "Нотатка", quote: "Цитата", concept: "Концепція",
      question: "Питання", scene: "Сцена", insight: "Інсайт",
      observation: "Спостереження", reflection: "Рефлексія",
      argument: "Аргумент", character: "Персонаж",
    },
    statuses: {
      inbox: "Вхідні", active: "Активна", developed: "Розвинена",
      used: "Використана", archived: "Архів",
    },
    importance: { normal: "Звичайна", high: "Важлива", core: "Ключова" },
    filterType: "Тип",
    filterStatus: "Статус",
    all: "Всі",
  },
  de: {
    title: "Notizen",
    inbox: "Eingang",
    pinned: "Angeheftet",
    allNotes: "Alle Notizen",
    collections: "Sammlungen",
    noCollection: "Ohne Sammlung",
    addCollection: "Neue Sammlung…",
    count: (n: number) => `${n} Notiz${n !== 1 ? "en" : ""}`,
    newBtn: "Neu",
    searchPlaceholder: "Notizen suchen…",
    quickCapturePlaceholder: "Schneller Gedanke… Enter zum Speichern",
    quickCaptureExpand: "Erweitern",
    noResults: "Keine Notizen gefunden",
    emptyTitle: "Noch keine Notizen",
    emptyDesc: "Erfasse Ideen mit der Schnelleingabe oben",
    emptyInbox: "Eingang ist leer",
    emptyInboxDesc: "Schnell erfasste Notizen landen hier zuerst",
    editTitle: "Notiz bearbeiten",
    newTitle: "Neue Notiz",
    titlePlaceholder: "Notiztitel…",
    contentPlaceholder: "Notizinhalt…",
    tagsPlaceholder: "Tags durch Komma getrennt…",
    collectionPlaceholder: "Sammlungsname…",
    statusLabel: "Status",
    typeLabel: "Typ",
    colorLabel: "Farbe",
    collectionLabel: "Sammlung",
    importanceLabel: "Wichtigkeit",
    saving: "Speichere…",
    save: "Speichern",
    cancel: "Abbrechen",
    updated: "Notiz aktualisiert",
    created: "Notiz erstellt",
    deleted: "Notiz gelöscht",
    toastPinned: "Angeheftet",
    toastUnpinned: "Abgeheftet",
    types: {
      idea: "Idee", note: "Notiz", quote: "Zitat", concept: "Konzept",
      question: "Frage", scene: "Szene", insight: "Einsicht",
      observation: "Beobachtung", reflection: "Reflexion",
      argument: "Argument", character: "Figur",
    },
    statuses: {
      inbox: "Eingang", active: "Aktiv", developed: "Entwickelt",
      used: "Genutzt", archived: "Archiviert",
    },
    importance: { normal: "Normal", high: "Wichtig", core: "Kernidee" },
    filterType: "Typ",
    filterStatus: "Status",
    all: "Alle",
  },
};

const DATE_LOCALES = { en: enUS, ru, ua: uk, de };

// ─── Note types ────────────────────────────────────────────────────────
const NOTE_TYPES = [
  { value: "idea",        icon: Lightbulb,    accent: "#F59E0B" },
  { value: "note",        icon: FileText,     accent: "#3B82F6" },
  { value: "quote",       icon: MessageSquare,accent: "#8B5CF6" },
  { value: "concept",     icon: Brain,        accent: "#10B981" },
  { value: "question",    icon: HelpCircle,   accent: "#F96D1C" },
  { value: "scene",       icon: BookOpen,     accent: "#EC4899" },
  { value: "insight",     icon: Sparkles,     accent: "#06B6D4" },
  { value: "observation", icon: Telescope,    accent: "#84CC16" },
  { value: "reflection",  icon: Feather,      accent: "#A78BFA" },
  { value: "argument",    icon: Target,       accent: "#EF4444" },
  { value: "character",   icon: Users,        accent: "#F97316" },
] as const;

const NOTE_STATUSES = [
  { value: "inbox",    color: "#94A3B8" },
  { value: "active",   color: "#F59E0B" },
  { value: "developed",color: "#3B82F6" },
  { value: "used",     color: "#22C55E" },
  { value: "archived", color: "#9CA3AF" },
] as const;

const NOTE_COLORS = [
  { value: "yellow", bg: "#FEFBEE", border: "#EDD98C", text: "#5C4A1E", clip: "#C4900A" },
  { value: "blue",   bg: "#F0F6FF", border: "#BCCEEA", text: "#2A3F5E", clip: "#4272A6" },
  { value: "purple", bg: "#F5F2FF", border: "#C9C0E8", text: "#3B2760", clip: "#6A52A8" },
  { value: "green",  bg: "#F2FBF5", border: "#A8DCBA", text: "#1E4A2E", clip: "#3D8054" },
  { value: "pink",   bg: "#FEF3FA", border: "#DCAECF", text: "#5C2848", clip: "#A04C86" },
  { value: "orange", bg: "#FFF7F0", border: "#E8C4A0", text: "#5C3420", clip: "#B45C28" },
  { value: "gray",   bg: "#F7F7F7", border: "#CCCCCC", text: "#3A3A3A", clip: "#707070" },
];

function getColor(value?: string | null) {
  return NOTE_COLORS.find(c => c.value === value) || NOTE_COLORS[0];
}
function getStatus(value?: string | null) {
  return NOTE_STATUSES.find(s => s.value === value) || NOTE_STATUSES[0];
}
function getType(value?: string | null) {
  return NOTE_TYPES.find(t => t.value === value) || NOTE_TYPES[0];
}

// ─── Note Card (Apple Notes style) ────────────────────────────────────
function NoteCard({ note, onEdit, onDelete, onPin }: {
  note: Note; onEdit: (n: Note) => void; onDelete: (id: number) => void; onPin: (n: Note) => void;
}) {
  const { lang } = useLang();
  const s = NOTES_I18N[lang];
  const col = getColor((note as any).color);
  const type = getType(note.type);
  const Icon = type.icon;
  const isPinned = (note as any).isPinned === "true";
  const importance = (note as any).importance;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: note.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, background: col.bg, border: `1px solid ${col.border}` }}
      onClick={() => onEdit(note)}
      className="relative rounded-2xl p-3.5 group flex flex-col gap-2 cursor-pointer transition-all hover:shadow-sm active:scale-[0.985]"
    >
      {/* Drag handle — subtle */}
      <div
        {...attributes} {...listeners}
        onClick={e => e.stopPropagation()}
        className="absolute top-2.5 left-2.5 opacity-0 group-hover:opacity-25 cursor-grab active:cursor-grabbing transition-opacity"
      >
        <GripVertical className="h-3 w-3" style={{ color: col.clip }} />
      </div>

      {/* Top row: type + date + pin */}
      <div className="flex items-center justify-between gap-1 pl-3">
        <div className="flex items-center gap-1">
          <Icon className="h-2.5 w-2.5 flex-shrink-0" style={{ color: type.accent }} />
          {importance === "core" && <span className="text-[8px] font-bold text-red-500">●</span>}
          {importance === "high" && <span className="text-[8px] font-bold text-amber-500">●</span>}
        </div>
        <div className="flex items-center gap-1.5">
          {isPinned && <Pin className="h-2.5 w-2.5" style={{ color: col.clip }} />}
          <span className="text-[9px] font-medium" style={{ color: `${col.text}70` }}>
            {format(new Date(note.updatedAt), "d MMM", { locale: DATE_LOCALES[lang] })}
          </span>
        </div>
      </div>

      {/* Title */}
      <h4 className="font-semibold text-[13px] leading-snug pl-0 pr-1" style={{ color: col.text }}>{note.title}</h4>

      {/* Content preview */}
      {note.content && (
        <p className="text-[11px] leading-relaxed line-clamp-3 flex-1" style={{ color: `${col.text}90` }}>{note.content}</p>
      )}

      {/* Tags */}
      {note.tags && (
        <div className="flex flex-wrap gap-1 mt-0.5">
          {note.tags.split(",").map(t => t.trim()).filter(Boolean).slice(0, 3).map(tag => (
            <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: `${col.clip}14`, color: `${col.clip}CC` }}>
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Action row — appears on hover */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-2.5 right-2.5" onClick={e => e.stopPropagation()}>
        <button
          onClick={e => { e.stopPropagation(); onPin(note); }}
          className="w-5 h-5 flex items-center justify-center rounded-md transition-colors hover:bg-black/8"
          style={{ color: isPinned ? col.clip : `${col.text}50` }}
          title={isPinned ? s.toastUnpinned : s.toastPinned}
        >
          {isPinned ? <PinOff className="h-2.5 w-2.5" /> : <Pin className="h-2.5 w-2.5" />}
        </button>
        <button
          onClick={e => { e.stopPropagation(); onDelete(note.id); }}
          className="w-5 h-5 flex items-center justify-center rounded-md transition-colors hover:bg-red-100"
          style={{ color: `${col.text}50` }}
        >
          <Trash2 className="h-2.5 w-2.5" />
        </button>
      </div>
    </div>
  );
}

// ─── List Row (Apple Notes style) ─────────────────────────────────────
function NoteRow({ note, onEdit, onDelete, onPin }: {
  note: Note; onEdit: (n: Note) => void; onDelete: (id: number) => void; onPin: (n: Note) => void;
}) {
  const { lang } = useLang();
  const s = NOTES_I18N[lang];
  const col = getColor((note as any).color);
  const type = getType(note.type);
  const Icon = type.icon;
  const isPinned = (note as any).isPinned === "true";
  const importance = (note as any).importance;

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: note.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onEdit(note)}
      className="group flex items-stretch gap-0 cursor-pointer transition-colors hover:bg-secondary/40 rounded-xl border border-transparent hover:border-border/30"
    >
      {/* Color strip */}
      <div className="w-[3px] flex-shrink-0 rounded-l-xl my-2" style={{ background: col.clip }} />

      {/* Drag handle */}
      <div
        {...attributes} {...listeners}
        onClick={e => e.stopPropagation()}
        className="opacity-0 group-hover:opacity-25 cursor-grab active:cursor-grabbing transition-opacity flex items-center px-1.5"
      >
        <GripVertical className="h-3 w-3 text-muted-foreground" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 py-3 pr-2">
        {/* Title row */}
        <div className="flex items-baseline gap-2 mb-0.5">
          <h4 className="font-semibold text-[13px] leading-snug truncate flex-1 text-foreground">{note.title}</h4>
          <div className="flex items-center gap-1 flex-shrink-0">
            {isPinned && <Pin className="h-2.5 w-2.5 text-muted-foreground/50" />}
            {importance === "core" && <span className="text-[8px] font-bold text-red-400">●</span>}
            {importance === "high" && <span className="text-[8px] font-bold text-amber-400">●</span>}
            <span className="text-[10px] text-muted-foreground/50 whitespace-nowrap">
              {format(new Date(note.updatedAt), "d MMM", { locale: DATE_LOCALES[lang] })}
            </span>
          </div>
        </div>

        {/* Preview row: type + content */}
        <div className="flex items-center gap-1.5">
          <Icon className="h-2.5 w-2.5 flex-shrink-0" style={{ color: type.accent }} />
          <p className="text-[11px] text-muted-foreground line-clamp-1 flex-1">
            {note.content ? note.content : <span className="italic opacity-50">—</span>}
          </p>
        </div>

        {/* Tags + collection */}
        {(note.tags || (note as any).collection) && (
          <div className="flex items-center gap-2 mt-1">
            {(note as any).collection && (
              <span className="text-[9px] text-muted-foreground/60 flex items-center gap-0.5">
                <FolderOpen className="h-2 w-2" />{(note as any).collection}
              </span>
            )}
            {note.tags && (
              <div className="flex gap-1">
                {note.tags.split(",").slice(0, 2).map(t => t.trim()).filter(Boolean).map(tag => (
                  <span key={tag} className="text-[9px] px-1.5 py-0 rounded-full font-medium" style={{ background: `${col.clip}14`, color: `${col.clip}BB` }}>#{tag}</span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions — hover only */}
      <div
        className="flex flex-col items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity pr-2 flex-shrink-0"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={() => onPin(note)} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground/60 hover:text-foreground transition-colors">
          {isPinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
        </button>
        <button onClick={() => onDelete(note.id)} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-destructive/10 text-muted-foreground/60 hover:text-destructive transition-colors">
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

// ─── Note Dialog (enhanced) ───────────────────────────────────────────
function NoteDialog({ open, onClose, bookId, note, prefillTitle, prefillStatus, collections }: {
  open: boolean; onClose: () => void; bookId: number; note?: Note;
  prefillTitle?: string; prefillStatus?: string; collections: string[];
}) {
  const { toast } = useToast();
  const { lang } = useLang();
  const s = NOTES_I18N[lang];
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState("idea");
  const [tags, setTags] = useState("");
  const [color, setColor] = useState("yellow");
  const [status, setStatus] = useState("active");
  const [collection, setCollection] = useState("");
  const [importance, setImportance] = useState("normal");
  const [isPinned, setIsPinned] = useState(false);
  const [showTypeAll, setShowTypeAll] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(note?.title || prefillTitle || "");
      setContent(note?.content || "");
      setType(note?.type || "idea");
      setTags(note?.tags || "");
      setColor((note as any)?.color || "yellow");
      setStatus((note as any)?.status || prefillStatus || "active");
      setCollection((note as any)?.collection || "");
      setImportance((note as any)?.importance || "normal");
      setIsPinned((note as any)?.isPinned === "true");
    }
  }, [open, note?.id, prefillTitle, prefillStatus]);

  const autoResize = () => {
    const el = textareaRef.current;
    if (el) { el.style.height = "auto"; el.style.height = `${el.scrollHeight}px`; }
  };

  const mutation = useMutation({
    mutationFn: (data: any) => note
      ? apiRequest("PATCH", `/api/notes/${note.id}`, data)
      : apiRequest("POST", `/api/books/${bookId}/notes`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "notes"] });
      onClose();
      toast({ title: note ? s.updated : s.created });
    },
  });

  const handleSave = () => {
    if (!title.trim()) return;
    mutation.mutate({ title: title.trim(), content, type, tags, color, status, collection, importance, isPinned: isPinned ? "true" : "false" });
  };

  const col = getColor(color);
  const visibleTypes = showTypeAll ? NOTE_TYPES : NOTE_TYPES.slice(0, 6);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }} onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border/50 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 rounded-full" style={{ background: col.clip }} />
            <span className="font-bold text-sm">{note ? s.editTitle : s.newTitle}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsPinned(!isPinned)}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors"
              style={{ color: isPinned ? col.clip : "#94A3B8" }}
              title={s.toastPinned}
            >
              <Pin className="h-3.5 w-3.5" />
            </button>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Color row */}
        <div className="px-5 pt-3 flex items-center gap-2 flex-shrink-0">
          {NOTE_COLORS.map(c => (
            <button
              key={c.value}
              onClick={() => setColor(c.value)}
              className="transition-transform hover:scale-110"
              style={{
                width: color === c.value ? 22 : 17, height: color === c.value ? 22 : 17,
                borderRadius: "50%", background: c.bg,
                border: `2px solid ${color === c.value ? c.clip : c.border}`,
                outline: color === c.value ? `2px solid ${c.clip}40` : "none", outlineOffset: 1,
              }}
            />
          ))}
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={s.titlePlaceholder}
            className="w-full rounded-xl px-3 py-2.5 outline-none text-sm font-semibold placeholder:font-normal placeholder:text-muted-foreground transition-all"
            style={{ background: col.bg, border: `1.5px solid ${col.border}`, color: col.text }}
            onFocus={e => { e.currentTarget.style.borderColor = col.clip; }}
            onBlur={e => { e.currentTarget.style.borderColor = col.border; }}
            onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSave(); }}
            autoFocus
          />

          <textarea
            ref={textareaRef}
            value={content}
            onChange={e => { setContent(e.target.value); autoResize(); }}
            onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleSave(); } }}
            rows={4}
            placeholder={s.contentPlaceholder}
            className="w-full rounded-xl px-3 py-2.5 outline-none text-sm resize-none placeholder:text-muted-foreground leading-relaxed transition-all"
            style={{ background: col.bg, border: `1.5px solid ${col.border}`, color: col.text, minHeight: "100px", maxHeight: "240px", overflow: "auto" }}
            onFocus={e => { e.currentTarget.style.borderColor = col.clip; autoResize(); }}
            onBlur={e => { e.currentTarget.style.borderColor = col.border; }}
          />

          {/* Tags */}
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <input
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder={s.tagsPlaceholder}
              className="w-full rounded-xl pl-7 pr-3 py-2.5 outline-none text-xs placeholder:text-muted-foreground bg-secondary/70 transition-all border border-transparent"
              onFocus={e => { e.currentTarget.style.borderColor = col.clip; }}
              onBlur={e => { e.currentTarget.style.borderColor = "transparent"; }}
            />
          </div>

          {/* Collection */}
          <div className="relative">
            <FolderOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <input
              value={collection}
              onChange={e => setCollection(e.target.value)}
              list="collections-datalist"
              placeholder={s.collectionPlaceholder}
              className="w-full rounded-xl pl-7 pr-3 py-2.5 outline-none text-xs placeholder:text-muted-foreground bg-secondary/70 transition-all border border-transparent"
              onFocus={e => { e.currentTarget.style.borderColor = col.clip; }}
              onBlur={e => { e.currentTarget.style.borderColor = "transparent"; }}
            />
            {collections.length > 0 && (
              <datalist id="collections-datalist">
                {collections.map(c => <option key={c} value={c} />)}
              </datalist>
            )}
          </div>

          {/* Type */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-2 text-muted-foreground">{s.typeLabel}</p>
            <div className="flex flex-wrap gap-1.5">
              {visibleTypes.map(t => (
                <button
                  key={t.value}
                  onClick={() => setType(t.value)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all"
                  style={{
                    background: type === t.value ? `${t.accent}15` : "hsl(var(--secondary))",
                    color: type === t.value ? t.accent : "hsl(var(--muted-foreground))",
                    border: `1.5px solid ${type === t.value ? `${t.accent}45` : "transparent"}`,
                  }}
                >
                  <t.icon className="h-3 w-3" />
                  {s.types[t.value as keyof typeof s.types]}
                </button>
              ))}
              <button
                onClick={() => setShowTypeAll(!showTypeAll)}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium text-muted-foreground hover:bg-secondary transition-colors"
              >
                {showTypeAll ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />}
              </button>
            </div>
          </div>

          {/* Status */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-2 text-muted-foreground">{s.statusLabel}</p>
            <div className="flex flex-wrap gap-1.5">
              {NOTE_STATUSES.map(st => (
                <button
                  key={st.value}
                  onClick={() => setStatus(st.value)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all"
                  style={{
                    background: status === st.value ? `${st.color}15` : "hsl(var(--secondary))",
                    color: status === st.value ? st.color : "hsl(var(--muted-foreground))",
                    border: `1.5px solid ${status === st.value ? `${st.color}45` : "transparent"}`,
                  }}
                >
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: status === st.value ? st.color : "hsl(var(--muted-foreground))" }} />
                  {s.statuses[st.value as keyof typeof s.statuses]}
                </button>
              ))}
            </div>
          </div>

          {/* Importance */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-2 text-muted-foreground">{s.importanceLabel}</p>
            <div className="flex gap-1.5">
              {(["normal", "high", "core"] as const).map(imp => {
                const colors = { normal: "#94A3B8", high: "#F59E0B", core: "#EF4444" };
                return (
                  <button
                    key={imp}
                    onClick={() => setImportance(imp)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all"
                    style={{
                      background: importance === imp ? `${colors[imp]}15` : "hsl(var(--secondary))",
                      color: importance === imp ? colors[imp] : "hsl(var(--muted-foreground))",
                      border: `1.5px solid ${importance === imp ? `${colors[imp]}45` : "transparent"}`,
                    }}
                  >
                    {s.importance[imp]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 pb-5 pt-3 border-t border-border/50 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-border/60 text-muted-foreground hover:bg-secondary transition-colors"
          >
            {s.cancel}
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || mutation.isPending}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 text-white"
            style={{ background: col.clip }}
          >
            {mutation.isPending ? s.saving : <><Check className="h-3.5 w-3.5" /> {s.save}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────
export function NotesPanel({ bookId }: { bookId: number }) {
  const { toast } = useToast();
  const { lang } = useLang();
  const s = NOTES_I18N[lang];

  const [showDialog, setShowDialog] = useState(false);
  const [editNote, setEditNote] = useState<Note | undefined>();
  const [dialogPrefill, setDialogPrefill] = useState("");
  const [dialogPrefillStatus, setDialogPrefillStatus] = useState("active");
  const [viewMode, setViewMode] = useState<"list" | "cards">("cards");
  const [localOrder, setLocalOrder] = useState<number[] | null>(null);
  const [search, setSearch] = useState("");
  const [quickCapture, setQuickCapture] = useState("");
  const [quickCaptureType, setQuickCaptureType] = useState(0);
  const [sidebarView, setSidebarView] = useState<string>("all"); // "all" | "inbox" | "pinned" | collection name
  const [filterType, setFilterType] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [collectionsOpen, setCollectionsOpen] = useState(true);
  const quickCaptureRef = useRef<HTMLInputElement>(null);

  const { data: notes = [], isLoading } = useQuery<Note[]>({
    queryKey: ["/api/books", bookId, "notes"],
    queryFn: () => apiRequest("GET", `/api/books/${bookId}/notes`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/notes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "notes"] });
      toast({ title: s.deleted });
    },
  });

  const pinMutation = useMutation({
    mutationFn: ({ id, isPinned }: { id: number; isPinned: string }) =>
      apiRequest("PATCH", `/api/notes/${id}`, { isPinned }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "notes"] });
      toast({ title: vars.isPinned === "true" ? s.toastPinned : s.toastUnpinned });
    },
  });

  const quickCaptureMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/api/books/${bookId}/notes`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "notes"] });
      setQuickCapture("");
      quickCaptureRef.current?.focus();
    },
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const orderedNotes = localOrder
    ? localOrder.map(id => notes.find(n => n.id === id)).filter(Boolean) as Note[]
    : notes;

  // Extract unique collections
  const collections = Array.from(new Set(
    notes.map(n => (n as any).collection).filter(Boolean)
  )) as string[];

  // Inbox count
  const inboxCount = notes.filter(n => (n as any).status === "inbox").length;
  const pinnedCount = notes.filter(n => (n as any).isPinned === "true").length;

  // Filtering
  const searchLower = search.toLowerCase();
  const filtered = orderedNotes.filter(n => {
    // Sidebar filter
    if (sidebarView === "inbox" && (n as any).status !== "inbox") return false;
    if (sidebarView === "pinned" && (n as any).isPinned !== "true") return false;
    if (sidebarView !== "all" && sidebarView !== "inbox" && sidebarView !== "pinned") {
      if ((n as any).collection !== sidebarView) return false;
    }
    // Type filter
    if (filterType !== "all" && n.type !== filterType) return false;
    // Search
    if (searchLower && !(
      n.title.toLowerCase().includes(searchLower) ||
      (n.content || "").toLowerCase().includes(searchLower) ||
      (n.tags || "").toLowerCase().includes(searchLower)
    )) return false;
    return true;
  });

  // Sort: pinned first (only in "all" view)
  const sorted = sidebarView === "all"
    ? [...filtered].sort((a, b) => {
        const pa = (a as any).isPinned === "true" ? 1 : 0;
        const pb = (b as any).isPinned === "true" ? 1 : 0;
        return pb - pa;
      })
    : filtered;

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = orderedNotes.map(n => n.id);
    setLocalOrder(arrayMove(ids, ids.indexOf(active.id as number), ids.indexOf(over.id as number)));
  }, [orderedNotes]);

  const currentQcType = NOTE_TYPES[quickCaptureType % NOTE_TYPES.length];
  const QcIcon = currentQcType.icon;

  const handleQuickCapture = () => {
    const t = quickCapture.trim();
    if (!t) return;
    quickCaptureMutation.mutate({
      title: t, content: "", type: currentQcType.value,
      tags: "", color: "yellow", status: "inbox",
      collection: sidebarView !== "all" && sidebarView !== "inbox" && sidebarView !== "pinned" ? sidebarView : "",
    });
  };

  const isEmptyView = filtered.length === 0 && notes.length === 0;
  const isEmptySearch = filtered.length === 0 && notes.length > 0;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center gap-2 flex-shrink-0">
        <StickyNote className="h-3.5 w-3.5 text-primary flex-shrink-0" />
        <h2 className="font-bold text-sm flex-1">{s.title}</h2>
        <span className="text-[11px] text-muted-foreground/50">{s.count(notes.length)}</span>
        <div className="flex items-center rounded-lg border border-border overflow-hidden">
          <button
            onClick={() => setViewMode("list")}
            className="p-1.5 transition-colors"
            style={{ background: viewMode === "list" ? "rgba(249,109,28,0.1)" : "transparent", color: viewMode === "list" ? "#F96D1C" : "#888" }}
          >
            <LayoutList className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setViewMode("cards")}
            className="p-1.5 transition-colors"
            style={{ background: viewMode === "cards" ? "rgba(249,109,28,0.1)" : "transparent", color: viewMode === "cards" ? "#F96D1C" : "#888" }}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
        </div>
        <button
          onClick={() => { setEditNote(undefined); setDialogPrefill(""); setDialogPrefillStatus("active"); setShowDialog(true); }}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0 transition-colors"
          style={{ background: "rgba(249,109,28,0.1)", color: "#F96D1C", border: "1px solid rgba(249,109,28,0.2)" }}
        >
          <Plus className="h-3 w-3" />
          {s.newBtn}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <div className="w-[160px] flex-shrink-0 border-r border-border/50 flex flex-col overflow-y-auto bg-background/50 py-2">
          {/* Nav items */}
          {[
            { id: "all", label: s.allNotes, icon: Layers, count: notes.length },
            { id: "inbox", label: s.inbox, icon: Inbox, count: inboxCount },
            { id: "pinned", label: s.pinned, icon: Pin, count: pinnedCount },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setSidebarView(item.id)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 text-left text-xs transition-colors rounded-none",
                sidebarView === item.id
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              )}
            >
              <item.icon className="h-3 w-3 flex-shrink-0" />
              <span className="flex-1 truncate">{item.label}</span>
              {item.count > 0 && (
                <span className="text-[9px] px-1 rounded-full bg-muted text-muted-foreground">{item.count}</span>
              )}
            </button>
          ))}

          {/* Collections */}
          <div className="mt-2 border-t border-border/40 pt-2">
            <button
              onClick={() => setCollectionsOpen(!collectionsOpen)}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 hover:text-muted-foreground transition-colors"
            >
              <FolderOpen className="h-2.5 w-2.5" />
              <span className="flex-1 text-left">{s.collections}</span>
              {collectionsOpen ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />}
            </button>
            {collectionsOpen && (
              <div>
                {collections.map(col => (
                  <button
                    key={col}
                    onClick={() => setSidebarView(col)}
                    className={cn(
                      "w-full flex items-center gap-2 px-4 py-1.5 text-left text-xs transition-colors",
                      sidebarView === col
                        ? "bg-primary/8 text-primary font-semibold"
                        : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                    )}
                  >
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#F96D1C" }} />
                    <span className="truncate">{col}</span>
                    <span className="ml-auto text-[9px] text-muted-foreground/50">
                      {notes.filter(n => (n as any).collection === col).length}
                    </span>
                  </button>
                ))}
                {collections.length === 0 && (
                  <p className="px-4 py-2 text-[10px] text-muted-foreground/50">{s.noCollection}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search + filter */}
          <div className="px-3 pt-2.5 pb-1.5 flex flex-col gap-1.5">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/50" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={s.searchPlaceholder}
                className="w-full rounded-lg pl-7 pr-7 py-1.5 outline-none text-xs bg-secondary/60 border border-transparent focus:border-primary/25 transition-all placeholder:text-muted-foreground/50"
              />
              {search ? (
                <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground">
                  <X className="h-3 w-3" />
                </button>
              ) : (
                <button onClick={() => setShowFilters(!showFilters)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground">
                  <Filter className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Type filter chips */}
            {showFilters && (
              <div className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-hide">
                <button
                  onClick={() => setFilterType("all")}
                  className="text-[9px] px-2 py-1 rounded-full whitespace-nowrap font-medium flex-shrink-0 transition-colors"
                  style={{ background: filterType === "all" ? "#F96D1C" : "transparent", color: filterType === "all" ? "#fff" : "#888", border: "1px solid", borderColor: filterType === "all" ? "#F96D1C" : "#e5e7eb" }}
                >
                  {s.all}
                </button>
                {NOTE_TYPES.map(t => (
                  <button
                    key={t.value}
                    onClick={() => setFilterType(t.value)}
                    className="text-[9px] px-2 py-1 rounded-full whitespace-nowrap font-medium flex-shrink-0 flex items-center gap-0.5 transition-colors"
                    style={{
                      background: filterType === t.value ? `${t.accent}15` : "transparent",
                      color: filterType === t.value ? t.accent : "#888",
                      border: "1px solid", borderColor: filterType === t.value ? `${t.accent}40` : "#e5e7eb",
                    }}
                  >
                    <t.icon className="h-2 w-2" />
                    {s.types[t.value as keyof typeof s.types]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick capture */}
          <div className="px-3 pb-2">
            <div className="flex items-center gap-2 rounded-lg border-2 px-2.5 py-1.5 transition-all" style={{ borderColor: "#F96D1C22", background: "#FFF7F0" }}>
              <button
                onClick={() => setQuickCaptureType(prev => prev + 1)}
                className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center hover:scale-110 transition-transform"
                style={{ background: `${currentQcType.accent}18`, color: currentQcType.accent }}
              >
                <QcIcon className="h-2.5 w-2.5" />
              </button>
              <input
                ref={quickCaptureRef}
                value={quickCapture}
                onChange={e => setQuickCapture(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && quickCapture.trim()) handleQuickCapture();
                  else if (e.key === "Tab" && quickCapture.trim()) {
                    e.preventDefault();
                    setDialogPrefill(quickCapture);
                    setDialogPrefillStatus("inbox");
                    setQuickCapture("");
                    setEditNote(undefined);
                    setShowDialog(true);
                  }
                  else if (e.key === "Escape") setQuickCapture("");
                }}
                placeholder={s.quickCapturePlaceholder}
                className="flex-1 bg-transparent outline-none text-xs placeholder:text-orange-300/70 text-orange-900"
              />
              {quickCapture.trim() ? (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => { setDialogPrefill(quickCapture); setDialogPrefillStatus("inbox"); setQuickCapture(""); setEditNote(undefined); setShowDialog(true); }}
                    className="w-5 h-5 flex items-center justify-center rounded text-orange-400 hover:bg-orange-100 transition-colors"
                    title={s.quickCaptureExpand}
                  >
                    <ChevronRight className="h-3 w-3" />
                  </button>
                  <button
                    onClick={handleQuickCapture}
                    disabled={quickCaptureMutation.isPending}
                    className="w-5 h-5 flex items-center justify-center rounded text-white transition-colors"
                    style={{ background: "#F96D1C" }}
                  >
                    <Zap className="h-2.5 w-2.5" />
                  </button>
                </div>
              ) : (
                <span className="text-[9px] text-orange-300/50 flex-shrink-0">↵</span>
              )}
            </div>
          </div>

          {/* Notes content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-3">
              {isLoading ? (
                <div className={viewMode === "cards" ? "grid grid-cols-2 gap-2" : "space-y-2"}>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-36 bg-muted animate-pulse rounded-xl" />
                  ))}
                </div>
              ) : isEmptyView ? (
                <div className="text-center py-10">
                  <StickyNote className="h-10 w-10 mx-auto mb-3 text-muted-foreground/20" />
                  <h3 className="font-semibold text-sm mb-1">{s.emptyTitle}</h3>
                  <p className="text-muted-foreground text-xs max-w-[180px] mx-auto">{s.emptyDesc}</p>
                </div>
              ) : sidebarView === "inbox" && sorted.length === 0 ? (
                <div className="text-center py-10">
                  <Inbox className="h-10 w-10 mx-auto mb-3 text-muted-foreground/20" />
                  <h3 className="font-semibold text-sm mb-1">{s.emptyInbox}</h3>
                  <p className="text-muted-foreground text-xs max-w-[180px] mx-auto">{s.emptyInboxDesc}</p>
                </div>
              ) : isEmptySearch ? (
                <div className="text-center py-10">
                  <Search className="h-8 w-8 mx-auto mb-3 text-muted-foreground/20" />
                  <p className="text-muted-foreground text-sm">{s.noResults}</p>
                </div>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={sorted.map(n => n.id)} strategy={rectSortingStrategy}>
                    {viewMode === "cards" ? (
                      <div className="grid grid-cols-2 gap-2">
                        {sorted.map(note => (
                          <NoteCard
                            key={note.id}
                            note={note}
                            onEdit={n => { setEditNote(n); setDialogPrefill(""); setShowDialog(true); }}
                            onDelete={id => deleteMutation.mutate(id)}
                            onPin={n => pinMutation.mutate({ id: n.id, isPinned: (n as any).isPinned === "true" ? "false" : "true" })}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {sorted.map(note => (
                          <NoteRow
                            key={note.id}
                            note={note}
                            onEdit={n => { setEditNote(n); setDialogPrefill(""); setShowDialog(true); }}
                            onDelete={id => deleteMutation.mutate(id)}
                            onPin={n => pinMutation.mutate({ id: n.id, isPinned: (n as any).isPinned === "true" ? "false" : "true" })}
                          />
                        ))}
                      </div>
                    )}
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </div>
        </div>
      </div>

      <NoteDialog
        open={showDialog}
        onClose={() => { setShowDialog(false); setEditNote(undefined); setDialogPrefill(""); }}
        bookId={bookId}
        note={editNote}
        prefillTitle={dialogPrefill}
        prefillStatus={dialogPrefillStatus}
        collections={collections}
      />
    </div>
  );
}
