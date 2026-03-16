import { useState, useCallback, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Note } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useLang } from "@/contexts/language-context";
import {
  FileText, Plus, Trash2, Edit, Lightbulb, MessageSquare, Hash, BookOpen, Star,
  LayoutList, LayoutGrid, GripVertical, X, Check, Search, Zap,
  ChevronRight, Inbox, Pin, PinOff, FolderOpen, Tag, Filter, Eye, Archive,
  Sparkles, Brain, Target, HelpCircle, Telescope, Feather, Users, Microscope,
  ChevronDown, ChevronUp, StickyNote, Layers, RotateCcw, AlertTriangle,
  Bold, Italic, Underline, Strikethrough, List, ListOrdered, ListChecks,
  Heading1, Heading2, Heading3, Quote, Indent, Outdent, Table, Link2,
  Highlighter, Type
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
    trash: "Trash",
    trashDesc: "Deleted notes (30 days)",
    trashed: "Moved to Trash",
    restore: "Restore",
    restored: "Restored",
    deleteForever: "Delete forever",
    deletedForever: "Permanently deleted",
    attachments: "Attachments",
    addFile: "Add file",
    fileTooLarge: "File is too large (max 5 MB)",
    optional: "Optional fields",
    collectionDropdown: "No collection",
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
    trash: "Корзина",
    trashDesc: "Удалённые заметки (30 дней)",
    trashed: "Перемещено в корзину",
    restore: "Восстановить",
    restored: "Восстановлено",
    deleteForever: "Удалить навсегда",
    deletedForever: "Удалено навсегда",
    attachments: "Вложения",
    addFile: "Добавить файл",
    fileTooLarge: "Файл слишком большой (макс 5 МБ)",
    optional: "Дополнительные поля",
    collectionDropdown: "Без коллекции",
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
    trash: "Кошик",
    trashDesc: "Видалені нотатки (30 днів)",
    trashed: "Переміщено до кошика",
    restore: "Відновити",
    restored: "Відновлено",
    deleteForever: "Видалити назавжди",
    deletedForever: "Видалено назавжди",
    attachments: "Вкладення",
    addFile: "Додати файл",
    fileTooLarge: "Файл завеликий (макс 5 МБ)",
    optional: "Додаткові поля",
    collectionDropdown: "Без колекції",
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
    trash: "Papierkorb",
    trashDesc: "Gelöschte Notizen (30 Tage)",
    trashed: "In Papierkorb verschoben",
    restore: "Wiederherstellen",
    restored: "Wiederhergestellt",
    deleteForever: "Endgültig löschen",
    deletedForever: "Endgültig gelöscht",
    attachments: "Anhänge",
    addFile: "Datei hinzufügen",
    fileTooLarge: "Datei zu groß (max 5 MB)",
    optional: "Optionale Felder",
    collectionDropdown: "Keine Sammlung",
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
  { value: "none",   bg: "hsl(var(--card))",       border: "hsl(var(--border))",    text: "hsl(var(--foreground))", clip: "hsl(var(--muted-foreground))" },
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
  return NOTE_STATUSES.find(s => s.value === value) || null;
}
function getType(value?: string | null) {
  if (!value) return null;
  return NOTE_TYPES.find(t => t.value === value) || null;
}
function getStatusOrDefault(value?: string | null) {
  return NOTE_STATUSES.find(s => s.value === value) || NOTE_STATUSES[0];
}
function getTypeOrDefault(value?: string | null) {
  return NOTE_TYPES.find(t => t.value === value) || NOTE_TYPES[0];
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();
}

// ─── Note Card (square sticky, aspect-ratio 1/1) ────────────────────
function NoteCard({ note, onEdit, onTrash, onPin }: {
  note: Note; onEdit: (n: Note) => void; onTrash: (id: number) => void; onPin: (n: Note) => void;
}) {
  const { lang } = useLang();
  const s = NOTES_I18N[lang];
  const col = getColor((note as any).color);
  const type = getType(note.type);
  const isPinned = (note as any).isPinned === "true";
  const importance = (note as any).importance;
  const noteStatus = getStatus((note as any).status);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: note.id });
  const dragStyle = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

  return (
    <div
      ref={setNodeRef}
      style={{ ...dragStyle, background: col.bg, border: `1px solid ${col.border}`, aspectRatio: "1/1" }}
      onClick={() => onEdit(note)}
      className="relative rounded-2xl p-3 group flex flex-col overflow-hidden cursor-pointer transition-all hover:shadow-md active:scale-[0.985]"
    >
      {/* Drag handle */}
      <div
        {...attributes} {...listeners}
        onClick={e => e.stopPropagation()}
        className="absolute top-2 left-2 opacity-0 group-hover:opacity-30 cursor-grab active:cursor-grabbing transition-opacity z-10"
      >
        <GripVertical className="h-3 w-3" style={{ color: col.clip }} />
      </div>

      {/* Top row: type icon (if set) + date + pin */}
      <div className="flex items-center justify-between mb-1.5 flex-shrink-0">
        <div className="flex items-center gap-1">
          {type && (
            <span className="flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded-full"
              style={{ background: `${type.accent}18`, color: type.accent }}>
              <type.icon className="h-2 w-2" />
              {s.types[type.value as keyof typeof s.types]}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {isPinned && <Pin className="h-2.5 w-2.5" style={{ color: col.clip }} />}
          <span className="text-[9px] font-medium" style={{ color: `${col.text}60` }}>
            {format(new Date(note.updatedAt), "d MMM", { locale: DATE_LOCALES[lang] })}
          </span>
        </div>
      </div>

      {/* Title */}
      <h4 className="font-semibold text-[12px] leading-snug line-clamp-2 flex-shrink-0" style={{ color: col.text }}>{note.title}</h4>

      {/* Content preview */}
      {note.content && (
        <p className="text-[11px] leading-[1.65] line-clamp-4 flex-1 mt-1.5 min-h-0" style={{ color: `${col.text}85` }}>{stripHtml(note.content)}</p>
      )}

      {/* Bottom pills: status + importance + tag (only when set) */}
      <div className="flex flex-wrap gap-0.5 mt-auto pt-1.5 flex-shrink-0">
        {noteStatus && (note as any).status && (
          <span className="text-[8px] px-1 py-0.5 rounded-full font-medium"
            style={{ background: `${noteStatus.color}18`, color: noteStatus.color }}>
            {s.statuses[(note as any).status as keyof typeof s.statuses]}
          </span>
        )}
        {importance && importance !== "" && (
          <span className="text-[8px] px-1 py-0.5 rounded-full font-medium"
            style={{ background: importance === "core" ? "#EF444418" : importance === "high" ? "#F59E0B18" : "#94A3B818", color: importance === "core" ? "#EF4444" : importance === "high" ? "#F59E0B" : "#94A3B8" }}>
            {s.importance[importance as keyof typeof s.importance]}
          </span>
        )}
        {note.tags && note.tags.split(",").slice(0, 1).map(t => t.trim()).filter(Boolean).map(tag => (
          <span key={tag} className="text-[8px] px-1 py-0.5 rounded-full font-medium" style={{ background: `${col.clip}14`, color: `${col.clip}CC` }}>
            #{tag}
          </span>
        ))}
      </div>

      {/* Hover actions */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-2 right-2" onClick={e => e.stopPropagation()}>
        <button
          onClick={e => { e.stopPropagation(); onPin(note); }}
          className="w-5 h-5 flex items-center justify-center rounded-md transition-colors hover:bg-black/10"
          style={{ color: isPinned ? col.clip : `${col.text}50` }}
          title={isPinned ? s.toastUnpinned : s.toastPinned}
        >
          {isPinned ? <PinOff className="h-2.5 w-2.5" /> : <Pin className="h-2.5 w-2.5" />}
        </button>
        <button
          onClick={e => { e.stopPropagation(); onTrash(note.id); }}
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
function NoteRow({ note, onEdit, onTrash, onPin }: {
  note: Note; onEdit: (n: Note) => void; onTrash: (id: number) => void; onPin: (n: Note) => void;
}) {
  const { lang } = useLang();
  const s = NOTES_I18N[lang];
  const col = getColor((note as any).color);
  const type = getTypeOrDefault(note.type);
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
          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-[1.55] flex-1">
            {note.content ? stripHtml(note.content) : <span className="italic opacity-50">—</span>}
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
        <button onClick={() => onTrash(note.id)} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-destructive/10 text-muted-foreground/60 hover:text-destructive transition-colors">
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

// ─── Note Dialog — WYSIWYG mini workspace ─────────────────────────────────────
const HIGHLIGHT_COLORS = [
  { label: "Yellow", color: "#FEF08A" },
  { label: "Orange", color: "#FED7AA" },
  { label: "Blue",   color: "#BFDBFE" },
  { label: "Green",  color: "#BBF7D0" },
  { label: "Pink",   color: "#FBCFE8" },
];

function TBtn({ onAction, title, children, active }: { onAction: () => void; title: string; children: React.ReactNode; active?: boolean }) {
  return (
    <button
      title={title}
      onMouseDown={e => { e.preventDefault(); onAction(); }}
      className="w-7 h-7 flex items-center justify-center rounded-md transition-colors text-muted-foreground hover:text-foreground hover:bg-secondary/70 flex-shrink-0"
      style={active ? { background: "rgba(249,109,28,0.1)", color: "#F96D1C" } : {}}
    >
      {children}
    </button>
  );
}

function NoteDialog({ open, onClose, bookId, note, prefillTitle, prefillStatus, collections }: {
  open: boolean; onClose: () => void; bookId: number; note?: Note;
  prefillTitle?: string; prefillStatus?: string; collections: string[];
}) {
  const { toast } = useToast();
  const { lang } = useLang();
  const s = NOTES_I18N[lang];
  const editorRef = useRef<HTMLDivElement>(null);

  const [autoTitle, setAutoTitle] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [showMeta, setShowMeta] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [showHL, setShowHL] = useState(false);

  const updateTitle = useCallback(() => {
    const div = editorRef.current;
    if (!div) return;
    const firstEl = div.firstElementChild;
    const txt = (firstEl?.textContent || div.textContent || "").split("\n")[0].trim().slice(0, 80);
    setAutoTitle(txt);
  }, []);

  useEffect(() => {
    if (!open) return;
    setType(note?.type || "");
    setTagInput(note?.tags || "");
    setStatus((note as any)?.status || "");
    setShowMeta(!!(note?.type || (note as any)?.status || note?.tags));
    setShowHL(false);
    setTimeout(() => {
      const div = editorRef.current;
      if (!div) return;
      if (note) {
        const raw = note.content || "";
        const title = note.title || "";
        if (raw.trim().startsWith("<")) {
          div.innerHTML = raw;
        } else {
          const combined = raw.startsWith(title) ? raw : [title, raw].filter(Boolean).join("\n");
          div.innerHTML = combined.split("\n").map(l => `<p>${l || "<br>"}</p>`).join("");
        }
      } else {
        div.innerHTML = prefillTitle ? `<p>${prefillTitle}</p><p><br></p>` : "<p><br></p>";
      }
      div.focus();
      const range = document.createRange();
      range.selectNodeContents(div);
      range.collapse(false);
      window.getSelection()?.removeAllRanges();
      window.getSelection()?.addRange(range);
      updateTitle();
    }, 40);
  }, [open, note?.id]);

  const exec = useCallback((cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
    updateTitle();
  }, [updateTitle]);

  const fmtBlock = useCallback((tag: string) => {
    document.execCommand("formatBlock", false, tag);
    editorRef.current?.focus();
    updateTitle();
  }, [updateTitle]);

  const insertHTML = useCallback((html: string) => {
    document.execCommand("insertHTML", false, html);
    editorRef.current?.focus();
  }, []);

  const insertTable = () => insertHTML(
    `<table style="border-collapse:collapse;width:100%;margin:10px 0;font-size:13px">` +
    `<tr><td style="border:1px solid #d1d5db;padding:5px 10px;min-width:80px"><br></td><td style="border:1px solid #d1d5db;padding:5px 10px;min-width:80px"><br></td><td style="border:1px solid #d1d5db;padding:5px 10px;min-width:80px"><br></td></tr>` +
    `<tr><td style="border:1px solid #d1d5db;padding:5px 10px"><br></td><td style="border:1px solid #d1d5db;padding:5px 10px"><br></td><td style="border:1px solid #d1d5db;padding:5px 10px"><br></td></tr>` +
    `<tr><td style="border:1px solid #d1d5db;padding:5px 10px"><br></td><td style="border:1px solid #d1d5db;padding:5px 10px"><br></td><td style="border:1px solid #d1d5db;padding:5px 10px"><br></td></tr>` +
    `</table><p><br></p>`
  );

  const insertChecklist = () => insertHTML(
    `<div style="display:flex;gap:8px;align-items:flex-start;padding:2px 0;margin:2px 0">` +
    `<input type="checkbox" style="margin-top:4px;flex-shrink:0;accent-color:#F96D1C;cursor:pointer">` +
    `<span style="flex:1;outline:none" contenteditable="true">Task</span></div><p><br></p>`
  );

  const insertLink = () => {
    const url = prompt("URL:");
    if (url) exec("createLink", url);
  };

  const applyHighlight = (color: string) => {
    document.execCommand("hiliteColor", false, color);
    editorRef.current?.focus();
    setShowHL(false);
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
    const div = editorRef.current;
    if (!div) return;
    const html = div.innerHTML;
    const firstEl = div.firstElementChild;
    const title = (firstEl?.textContent || div.textContent || "").split("\n")[0].trim().slice(0, 80);
    if (!title) {
      toast({ title: lang === "ru" ? "Напишите хотя бы одну строку" : "Write at least one line", variant: "destructive" });
      return;
    }
    mutation.mutate({ title, content: html, type, tags: tagInput.trim(), status, color: "none", collection: "", importance: "", isPinned: "false" });
  };

  const activeType = type ? NOTE_TYPES.find(t => t.value === type) : null;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.42)", backdropFilter: "blur(3px)" }}
      onClick={() => { setShowHL(false); onClose(); }}
    >
      <div
        className="w-full max-w-[600px] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ maxHeight: "88vh", background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Top bar ── */}
        <div className="flex items-center gap-3 px-4 pt-3.5 pb-3 border-b border-border/40 flex-shrink-0">
          <div className="flex-1 min-w-0">
            {autoTitle
              ? <span className="text-[13px] font-semibold text-foreground truncate block leading-snug">{autoTitle}</span>
              : <span className="text-[13px] text-muted-foreground/35 italic">{lang === "ru" ? "Новая заметка" : lang === "ua" ? "Нова нотатка" : lang === "de" ? "Neue Notiz" : "New note"}</span>
            }
          </div>
          <button
            onClick={handleSave}
            disabled={!autoTitle || mutation.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all disabled:opacity-40 flex-shrink-0 text-white"
            style={{ background: "linear-gradient(135deg,#F96D1C,#FB923C)" }}
          >
            {mutation.isPending
              ? <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
              : <Check className="h-3 w-3" />}
            {s.save}
          </button>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors text-muted-foreground flex-shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Type accent stripe ── */}
        {activeType && <div style={{ height: 2, background: activeType.accent, opacity: 0.7, flexShrink: 0 }} />}

        {/* ── WYSIWYG Toolbar ── */}
        <div className="flex items-center gap-0.5 px-3 py-1.5 border-b border-border/25 flex-shrink-0 overflow-x-auto">
          {/* Text formatting */}
          <TBtn onAction={() => exec("bold")} title="Bold"><Bold className="h-3.5 w-3.5" /></TBtn>
          <TBtn onAction={() => exec("italic")} title="Italic"><Italic className="h-3.5 w-3.5" /></TBtn>
          <TBtn onAction={() => exec("underline")} title="Underline"><Underline className="h-3.5 w-3.5" /></TBtn>
          <TBtn onAction={() => exec("strikeThrough")} title="Strikethrough"><Strikethrough className="h-3.5 w-3.5" /></TBtn>

          {/* Highlight picker */}
          <div className="relative flex-shrink-0">
            <TBtn onAction={() => { setShowHL(v => !v); }} title="Highlight"><Highlighter className="h-3.5 w-3.5" /></TBtn>
            {showHL && (
              <div className="absolute top-full left-0 mt-1 z-50 flex gap-1 p-1.5 rounded-xl shadow-lg border border-border bg-card">
                {HIGHLIGHT_COLORS.map(hc => (
                  <button
                    key={hc.color}
                    title={hc.label}
                    onMouseDown={e => { e.preventDefault(); applyHighlight(hc.color); }}
                    className="w-5 h-5 rounded-full border-2 border-white/60 hover:scale-110 transition-transform shadow-sm"
                    style={{ background: hc.color }}
                  />
                ))}
                <button
                  title="Remove highlight"
                  onMouseDown={e => { e.preventDefault(); applyHighlight("transparent"); }}
                  className="w-5 h-5 rounded-full border-2 border-border text-[8px] flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors"
                >✕</button>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="w-px h-4 bg-border/50 mx-1 flex-shrink-0" />

          {/* Lists */}
          <TBtn onAction={() => exec("insertUnorderedList")} title="Bullet list"><List className="h-3.5 w-3.5" /></TBtn>
          <TBtn onAction={() => exec("insertOrderedList")} title="Numbered list"><ListOrdered className="h-3.5 w-3.5" /></TBtn>
          <TBtn onAction={insertChecklist} title="Checklist"><ListChecks className="h-3.5 w-3.5" /></TBtn>

          {/* Divider */}
          <div className="w-px h-4 bg-border/50 mx-1 flex-shrink-0" />

          {/* Structure */}
          <TBtn onAction={() => fmtBlock("h1")} title="Title"><Type className="h-3.5 w-3.5" /></TBtn>
          <TBtn onAction={() => fmtBlock("h2")} title="Heading 1"><Heading1 className="h-3.5 w-3.5" /></TBtn>
          <TBtn onAction={() => fmtBlock("h3")} title="Heading 2"><Heading2 className="h-3.5 w-3.5" /></TBtn>
          <TBtn onAction={() => fmtBlock("h4")} title="Heading 3"><Heading3 className="h-3.5 w-3.5" /></TBtn>
          <TBtn onAction={() => fmtBlock("blockquote")} title="Quote"><Quote className="h-3.5 w-3.5" /></TBtn>
          <TBtn onAction={() => exec("indent")} title="Indent"><Indent className="h-3.5 w-3.5" /></TBtn>
          <TBtn onAction={() => exec("outdent")} title="Outdent"><Outdent className="h-3.5 w-3.5" /></TBtn>

          {/* Divider */}
          <div className="w-px h-4 bg-border/50 mx-1 flex-shrink-0" />

          {/* Insert */}
          <TBtn onAction={insertTable} title="Insert table"><Table className="h-3.5 w-3.5" /></TBtn>
          <TBtn onAction={insertLink} title="Insert link"><Link2 className="h-3.5 w-3.5" /></TBtn>
        </div>

        {/* ── Editor styles ── */}
        <style>{`
          .nte-editor { min-height:280px; outline:none; }
          .nte-editor p { margin:0; min-height:1.6em; }
          .nte-editor h1 { font-size:1.5rem; font-weight:700; margin:12px 0 4px; line-height:1.25; }
          .nte-editor h2 { font-size:1.2rem; font-weight:600; margin:10px 0 4px; line-height:1.3; }
          .nte-editor h3 { font-size:1.05rem; font-weight:600; margin:8px 0 4px; }
          .nte-editor h4 { font-size:0.95rem; font-weight:600; margin:6px 0 4px; color:#6b7280; }
          .nte-editor blockquote { border-left:3px solid #F96D1C; background:rgba(249,109,28,0.05); margin:8px 0; padding:8px 14px; border-radius:0 8px 8px 0; color:#6b7280; font-style:italic; }
          .nte-editor ul { list-style:disc; padding-left:1.5rem; margin:4px 0; }
          .nte-editor ol { list-style:decimal; padding-left:1.5rem; margin:4px 0; }
          .nte-editor li { margin:2px 0; }
          .nte-editor a { color:#F96D1C; text-decoration:underline; }
          .nte-editor table td, .nte-editor table th { border:1px solid #e5e7eb; padding:5px 10px; min-width:80px; }
          .nte-editor:empty:before { content:attr(data-placeholder); color:rgba(100,116,139,0.4); pointer-events:none; font-style:italic; }
        `}</style>

        {/* ── WYSIWYG editor area ── */}
        <div className="flex-1 overflow-y-auto">
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            className="nte-editor w-full px-5 pt-4 pb-5 text-sm leading-[1.85]"
            data-placeholder={lang === "ru" ? "Начни писать мысль…" : lang === "ua" ? "Почни писати думку…" : lang === "de" ? "Schreib deine Gedanken…" : "Start writing your thought…"}
            onInput={updateTitle}
            onKeyDown={e => {
              if (e.key === "Escape") onClose();
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleSave(); }
            }}
          />
        </div>

        {/* ── Bottom metadata panel ── */}
        <div className="border-t border-border/30 flex-shrink-0">
          <button
            onClick={() => setShowMeta(v => !v)}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
          >
            <Tag className="h-3 w-3 flex-shrink-0" />
            <span className="flex-1 text-left">
              {(type || status || tagInput) ? (
                <span className="flex items-center gap-2 flex-wrap">
                  {type && activeType && (
                    <span className="flex items-center gap-1 font-medium" style={{ color: activeType.accent }}>
                      <activeType.icon className="h-2.5 w-2.5" />
                      {s.types[type as keyof typeof s.types]}
                    </span>
                  )}
                  {status && (
                    <span style={{ color: NOTE_STATUSES.find(st => st.value === status)?.color || "#94A3B8" }}>
                      ● {s.statuses[status as keyof typeof s.statuses]}
                    </span>
                  )}
                  {tagInput && <span className="text-muted-foreground/60">#{tagInput.split(",")[0]?.trim()}{tagInput.split(",").length > 1 ? " …" : ""}</span>}
                </span>
              ) : (
                lang === "ru" ? "Добавить тип, статус, теги…" :
                lang === "ua" ? "Додати тип, статус, теги…" :
                lang === "de" ? "Typ, Status, Tags hinzufügen…" :
                "Add type, status, tags…"
              )}
            </span>
            {showMeta ? <ChevronUp className="h-3 w-3 flex-shrink-0" /> : <ChevronDown className="h-3 w-3 flex-shrink-0" />}
          </button>

          {showMeta && (
            <div className="px-4 pb-4 space-y-3 border-t border-border/20 pt-3">
              {/* Type */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-2 text-muted-foreground/50">{s.typeLabel}</p>
                <div className="flex flex-wrap gap-1.5">
                  <button onClick={() => setType("")} className="px-2.5 py-1 rounded-full text-[10px] font-medium transition-all"
                    style={{ background: !type ? "rgba(249,109,28,0.1)" : "hsl(var(--secondary))", color: !type ? "#F96D1C" : "hsl(var(--muted-foreground))", border: `1px solid ${!type ? "rgba(249,109,28,0.3)" : "transparent"}` }}>—</button>
                  {NOTE_TYPES.map(t => (
                    <button key={t.value} onClick={() => setType(type === t.value ? "" : t.value)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium transition-all"
                      style={{ background: type === t.value ? `${t.accent}15` : "hsl(var(--secondary))", color: type === t.value ? t.accent : "hsl(var(--muted-foreground))", border: `1px solid ${type === t.value ? `${t.accent}40` : "transparent"}` }}>
                      <t.icon className="h-2.5 w-2.5" />
                      {s.types[t.value as keyof typeof s.types]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-2 text-muted-foreground/50">{s.statusLabel}</p>
                <div className="flex flex-wrap gap-1.5">
                  <button onClick={() => setStatus("")} className="px-2.5 py-1 rounded-full text-[10px] font-medium transition-all"
                    style={{ background: !status ? "rgba(249,109,28,0.1)" : "hsl(var(--secondary))", color: !status ? "#F96D1C" : "hsl(var(--muted-foreground))", border: `1px solid ${!status ? "rgba(249,109,28,0.3)" : "transparent"}` }}>—</button>
                  {NOTE_STATUSES.map(st => (
                    <button key={st.value} onClick={() => setStatus(status === st.value ? "" : st.value)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium transition-all"
                      style={{ background: status === st.value ? `${st.color}15` : "hsl(var(--secondary))", color: status === st.value ? st.color : "hsl(var(--muted-foreground))", border: `1px solid ${status === st.value ? `${st.color}40` : "transparent"}` }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: status === st.value ? st.color : "hsl(var(--muted-foreground))" }} />
                      {s.statuses[st.value as keyof typeof s.statuses]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hashtags */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-2 text-muted-foreground/50">
                  {lang === "ru" ? "Хэштеги" : lang === "ua" ? "Хештеги" : lang === "de" ? "Hashtags" : "Hashtags"}
                </p>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/40 border border-border/40">
                  <Hash className="h-3 w-3 text-muted-foreground/50 flex-shrink-0" />
                  <input value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder={s.tagsPlaceholder}
                    className="flex-1 bg-transparent outline-none text-xs placeholder:text-muted-foreground/35"
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleSave(); } }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────
export function NotesPanel({ bookId, aiPanelOpen }: { bookId: number; aiPanelOpen?: boolean }) {
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
  const [sidebarView, setSidebarView] = useState<string>("all");
  const [filterType, setFilterType] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [collectionsOpen, setCollectionsOpen] = useState(true);
  const [showNewColInput, setShowNewColInput] = useState(false);
  const [newColName, setNewColName] = useState("");
  const [customCollections, setCustomCollections] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(`moodra_custom_cols_${bookId}`) || "[]"); } catch { return []; }
  });
  const [sidebarWidth, setSidebarWidth] = useState(160);
  const sidebarContainerRef = useRef<HTMLDivElement>(null);
  const isDraggingSidebar = useRef(false);
  const quickCaptureRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDraggingSidebar.current || !sidebarContainerRef.current) return;
      const parentLeft = sidebarContainerRef.current.getBoundingClientRect().left;
      const w = Math.max(120, Math.min(300, e.clientX - parentLeft));
      setSidebarWidth(w);
    };
    const onUp = () => { isDraggingSidebar.current = false; };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
  }, []);

  const { data: notes = [], isLoading } = useQuery<Note[]>({
    queryKey: ["/api/books", bookId, "notes"],
    queryFn: () => apiRequest("GET", `/api/books/${bookId}/notes`),
  });

  const { data: trashedNotes = [], isLoading: isLoadingTrash } = useQuery<Note[]>({
    queryKey: ["/api/books", bookId, "notes", "trash"],
    queryFn: () => apiRequest("GET", `/api/books/${bookId}/notes/trash`),
    enabled: sidebarView === "trash",
  });

  const trashMutation = useMutation({
    mutationFn: (id: number) => apiRequest("PATCH", `/api/notes/${id}/trash`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "notes"] });
      toast({ title: s.trashed });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (id: number) => apiRequest("PATCH", `/api/notes/${id}/restore`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "notes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "notes", "trash"] });
      toast({ title: s.restored });
    },
  });

  const hardDeleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/notes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "notes", "trash"] });
      toast({ title: s.deletedForever });
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

  const noteCollections = Array.from(new Set(
    notes.map(n => (n as any).collection).filter(Boolean)
  )) as string[];
  const collections = Array.from(new Set([...customCollections, ...noteCollections]));

  const addCustomCollection = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || collections.includes(trimmed)) return;
    const updated = [...customCollections, trimmed];
    setCustomCollections(updated);
    try { localStorage.setItem(`moodra_custom_cols_${bookId}`, JSON.stringify(updated)); } catch {}
    setSidebarView(trimmed);
    setCollectionsOpen(true);
  };

  const deleteCollection = async (col: string) => {
    const updated = customCollections.filter(c => c !== col);
    setCustomCollections(updated);
    try { localStorage.setItem(`moodra_custom_cols_${bookId}`, JSON.stringify(updated)); } catch {}
    try {
      await apiRequest("POST", `/api/books/${bookId}/notes/trash-collection`, { collection: col });
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "notes"] });
    } catch {}
    if (sidebarView === col) setSidebarView("all");
  };

  const inboxCount = notes.filter(n => (n as any).status === "inbox").length;
  const pinnedCount = notes.filter(n => (n as any).isPinned === "true").length;

  const searchLower = search.toLowerCase();
  const filtered = orderedNotes.filter(n => {
    if (sidebarView === "inbox" && (n as any).status !== "inbox") return false;
    if (sidebarView === "pinned" && (n as any).isPinned !== "true") return false;
    if (sidebarView !== "all" && sidebarView !== "inbox" && sidebarView !== "pinned" && sidebarView !== "trash") {
      if ((n as any).collection !== sidebarView) return false;
    }
    if (filterType !== "all" && n.type !== filterType) return false;
    if (searchLower && !(
      n.title.toLowerCase().includes(searchLower) ||
      (n.content || "").toLowerCase().includes(searchLower) ||
      (n.tags || "").toLowerCase().includes(searchLower)
    )) return false;
    return true;
  });

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
      title: t, content: "", type: "",
      tags: "", color: "yellow", status: "inbox",
      collection: sidebarView !== "all" && sidebarView !== "inbox" && sidebarView !== "pinned" && sidebarView !== "trash" ? sidebarView : "",
    });
  };

  const isTrashView = sidebarView === "trash";
  const isEmptyView = filtered.length === 0 && notes.length === 0;
  const isEmptySearch = filtered.length === 0 && notes.length > 0;
  const gridCols = aiPanelOpen ? "grid-cols-3" : "grid-cols-4";

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center gap-2 flex-shrink-0">
        <StickyNote className="h-3.5 w-3.5 text-primary flex-shrink-0" />
        <h2 className="font-bold text-sm flex-1">{s.title}</h2>
        <span className="text-[11px] text-muted-foreground/50">{s.count(notes.length)}</span>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => setViewMode(viewMode === "cards" ? "list" : "cards")}
            className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-secondary transition-colors text-muted-foreground"
          >
            {viewMode === "cards" ? <LayoutList className="h-3 w-3" /> : <LayoutGrid className="h-3 w-3" />}
          </button>
          {!isTrashView && (
            <button
              onClick={() => { setEditNote(undefined); setDialogPrefill(""); setDialogPrefillStatus("active"); setShowDialog(true); }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              style={{ background: "rgba(249,109,28,0.1)", color: "#F96D1C", border: "1px solid rgba(249,109,28,0.2)" }}
            >
              <Plus className="h-3 w-3" />
              {s.newBtn}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden" ref={sidebarContainerRef}>
        {/* Left sidebar — resizable */}
        <div className="flex-shrink-0 border-r border-border/50 flex flex-col overflow-y-auto bg-background/50 py-2 relative" style={{ width: sidebarWidth }}>
          {[
            { id: "all", label: s.allNotes, icon: Layers, count: notes.length },
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
          <div className="mt-1 border-t border-border/40 pt-1">
            <div className="w-full flex items-center gap-1 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              <button
                onClick={() => setCollectionsOpen(!collectionsOpen)}
                className="flex items-center gap-1.5 flex-1 hover:text-muted-foreground transition-colors"
              >
                <FolderOpen className="h-2.5 w-2.5" />
                <span className="flex-1 text-left">{s.collections}</span>
                {collectionsOpen ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />}
              </button>
              <button
                onClick={() => { setShowNewColInput(true); setCollectionsOpen(true); setNewColName(""); }}
                className="w-4 h-4 flex items-center justify-center rounded hover:bg-accent/60 text-muted-foreground/50 hover:text-foreground transition-colors flex-shrink-0"
              >
                <Plus className="h-2.5 w-2.5" />
              </button>
            </div>
            {collectionsOpen && (
              <div>
                {showNewColInput && (
                  <div className="flex items-center gap-1 px-3 py-1">
                    <input
                      autoFocus
                      value={newColName}
                      onChange={e => setNewColName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter") { addCustomCollection(newColName); setShowNewColInput(false); setNewColName(""); }
                        if (e.key === "Escape") { setShowNewColInput(false); setNewColName(""); }
                      }}
                      placeholder="Collection name…"
                      className="flex-1 text-[11px] bg-secondary/60 border border-primary/40 rounded-md px-2 py-0.5 outline-none"
                    />
                    <button
                      onClick={() => { addCustomCollection(newColName); setShowNewColInput(false); setNewColName(""); }}
                      className="w-5 h-5 flex items-center justify-center rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex-shrink-0"
                    >
                      <Check className="h-3 w-3" />
                    </button>
                  </div>
                )}
                {collections.map(col => (
                  <div
                    key={col}
                    className={cn(
                      "group w-full flex items-center gap-1 px-3 py-1.5 text-left text-xs transition-colors",
                      sidebarView === col
                        ? "bg-primary/8 text-primary font-semibold"
                        : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                    )}
                  >
                    <button className="flex items-center gap-1.5 flex-1 min-w-0 text-left" onClick={() => setSidebarView(col)}>
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#F96D1C" }} />
                      <span className="truncate flex-1">{col}</span>
                      <span className="text-[9px] text-muted-foreground/50">
                        {notes.filter(n => (n as any).collection === col).length}
                      </span>
                    </button>
                    <button
                      onClick={() => deleteCollection(col)}
                      className="w-3.5 h-3.5 flex items-center justify-center rounded opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:text-destructive transition-all flex-shrink-0"
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                    </button>
                  </div>
                ))}
                {collections.length === 0 && !showNewColInput && (
                  <p className="px-4 py-2 text-[10px] text-muted-foreground/50">{s.noCollection}</p>
                )}
              </div>
            )}
          </div>

          {/* Trash */}
          <div className="mt-auto border-t border-border/40 pt-1">
            <button
              onClick={() => setSidebarView("trash")}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 text-left text-xs transition-colors",
                sidebarView === "trash"
                  ? "bg-destructive/10 text-destructive font-semibold"
                  : "text-muted-foreground/50 hover:bg-secondary/60 hover:text-muted-foreground"
              )}
            >
              <Trash2 className="h-3 w-3 flex-shrink-0" />
              <span className="flex-1 truncate">{s.trash}</span>
            </button>
          </div>

          {/* Drag handle */}
          <div
            onMouseDown={e => { isDraggingSidebar.current = true; e.preventDefault(); }}
            className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors group"
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-8 rounded-full bg-border/60 group-hover:bg-primary/40 transition-colors" />
          </div>
        </div>

        {/* Right content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Trash view */}
          {isTrashView ? (
            <div className="flex-1 overflow-y-auto">
              <div className="p-3">
                <div className="flex items-center gap-1.5 mb-3 text-xs text-muted-foreground">
                  <AlertTriangle className="h-3 w-3" />
                  <span>{s.trashDesc}</span>
                </div>
                {isLoadingTrash ? (
                  <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-14 bg-muted animate-pulse rounded-xl" />)}</div>
                ) : trashedNotes.length === 0 ? (
                  <div className="text-center py-10">
                    <Trash2 className="h-8 w-8 mx-auto mb-3 text-muted-foreground/20" />
                    <p className="text-muted-foreground text-sm">{s.emptyInbox}</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {trashedNotes.map(note => (
                      <div key={note.id} className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border/50 bg-card hover:bg-secondary/30 transition-colors">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-[12px] truncate text-foreground">{note.title}</h4>
                          {(note as any).deletedAt && (
                            <p className="text-[10px] text-muted-foreground/60">
                              {format(new Date((note as any).deletedAt), "d MMM yyyy", { locale: DATE_LOCALES[lang] })}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => restoreMutation.mutate(note.id)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium text-primary hover:bg-primary/10 transition-colors flex-shrink-0"
                        >
                          <RotateCcw className="h-2.5 w-2.5" />
                          {s.restore}
                        </button>
                        <button
                          onClick={() => hardDeleteMutation.mutate(note.id)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0"
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                          {s.deleteForever}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
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

              {/* Notes list/grid */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-3">
                  {isLoading ? (
                    <div className={viewMode === "cards" ? `grid ${gridCols} gap-2` : "space-y-2"}>
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className={viewMode === "cards" ? "bg-muted animate-pulse rounded-xl aspect-square" : "h-14 bg-muted animate-pulse rounded-xl"} />
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
                          <div className={`grid ${gridCols} gap-2`}>
                            {sorted.map(note => (
                              <NoteCard
                                key={note.id}
                                note={note}
                                onEdit={n => { setEditNote(n); setDialogPrefill(""); setShowDialog(true); }}
                                onTrash={id => trashMutation.mutate(id)}
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
                                onTrash={id => trashMutation.mutate(id)}
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
            </>
          )}
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
