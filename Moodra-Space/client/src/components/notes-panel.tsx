import { useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Note } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useLang } from "@/contexts/language-context";
import {
  FileText, Plus, Trash2, Lightbulb, MessageSquare, Hash, BookOpen,
  GripVertical, X, Check, Search, ChevronLeft, ChevronRight,
  Inbox, Pin, PinOff, FolderOpen, Tag, Filter,
  Sparkles, Brain, Target, HelpCircle, Telescope, Feather, Users,
  ChevronDown, ChevronUp, StickyNote, Layers, RotateCcw, AlertTriangle,
  Bold, Italic, Underline, Strikethrough, List, ListOrdered,
  Heading1, Heading2, Heading3, Quote, Indent, Outdent, Table, Link2,
  Highlighter, Type, ImagePlus, Paperclip, Download, Link, Palette,
  Link as LinkIcon, ArrowRight, ArrowLeft, Rows, Columns, Minus, Loader2,
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
import { SelectionToolbar } from "./selection-toolbar";

// ─── Note chain types ─────────────────────────────────────────────────
interface NoteChain {
  id: string;
  name: string;
  noteIds: number[];
  color: string;
}
const CHAIN_COLORS = ["#F96D1C", "#3B82F6", "#8B5CF6", "#10B981", "#EC4899", "#F59E0B"];

function getChains(bookId: number): NoteChain[] {
  try { return JSON.parse(localStorage.getItem(`moodra_chains_${bookId}`) || "[]"); } catch { return []; }
}
function saveChains(bookId: number, chains: NoteChain[]) {
  try { localStorage.setItem(`moodra_chains_${bookId}`, JSON.stringify(chains)); } catch {}
}

// ─── i18n ─────────────────────────────────────────────────────────────
const NOTES_I18N = {
  en: {
    title: "Notes", inbox: "Inbox", pinned: "Pinned", allNotes: "All notes",
    collections: "Collections", noCollection: "Uncategorized", addCollection: "New collection…",
    count: (n: number) => `${n} note${n !== 1 ? "s" : ""}`,
    newBtn: "New", searchPlaceholder: "Search notes…", quickCapture: "Quick note — press Enter to save…",
    noResults: "No notes match your search", emptyTitle: "No notes yet",
    emptyDesc: "Capture ideas with the quick-capture bar above",
    emptyInbox: "Inbox is empty", emptyInboxDesc: "Quick-captured notes land here first",
    titlePlaceholder: "Note title…", contentPlaceholder: "Note content…",
    tagsPlaceholder: "tags, separated by commas…", statusLabel: "Status",
    typeLabel: "Type", colorLabel: "Color", importanceLabel: "Importance",
    save: "Save", cancel: "Cancel", updated: "Note updated", created: "Note created",
    toastPinned: "Pinned", toastUnpinned: "Unpinned",
    types: { idea: "Idea", note: "Note", quote: "Quote", concept: "Concept",
      question: "Question", scene: "Scene", insight: "Insight",
      observation: "Observation", reflection: "Reflection", argument: "Argument", character: "Character" },
    statuses: { inbox: "Inbox", active: "Active", developed: "Developed", used: "Used", archived: "Archived" },
    importance: { normal: "Normal", high: "High", core: "Core" },
    all: "All", trash: "Trash", trashDesc: "Deleted notes (30 days)",
    trashed: "Moved to Trash", restore: "Restore", restored: "Restored",
    deleteForever: "Delete forever", deletedForever: "Permanently deleted",
    attachments: "Attachments", fileTooLarge: "File is too large (max 10 MB)",
    oneImageTitle: "One image per note",
    oneImageDesc: "A note is a small world for one idea. More than one image clutters it — that's why only one can be added.",
    linkNotes: "Linked notes", searchNotes: "Search notes to link…",
    linkUrl: "URL", linkText: "Link text (optional)", insertLink: "Insert link",
    colorNone: "No color", chains: "Chains", newChain: "New chain",
    chainName: "Chain name…", noChains: "No chains yet",
    chainNav: "Chain", prevNote: "Previous", nextNote: "Next",
    addToChain: "Add to chain", removeFromChain: "Remove from chain",
  },
  ru: {
    title: "Заметки", inbox: "Входящие", pinned: "Закреплённые", allNotes: "Все заметки",
    collections: "Коллекции", noCollection: "Без коллекции", addCollection: "Новая коллекция…",
    count: (n: number) => `${n} заметок`,
    newBtn: "Новая", searchPlaceholder: "Поиск заметок…", quickCapture: "Быстрая заметка — Enter для сохранения…",
    noResults: "Заметки не найдены", emptyTitle: "Нет заметок",
    emptyDesc: "Фиксируй идеи в строке быстрого захвата выше",
    emptyInbox: "Входящие пусты", emptyInboxDesc: "Быстро захваченные заметки попадают сюда",
    titlePlaceholder: "Заголовок заметки…", contentPlaceholder: "Содержание заметки…",
    tagsPlaceholder: "теги через запятую…", statusLabel: "Статус",
    typeLabel: "Тип", colorLabel: "Цвет", importanceLabel: "Важность",
    save: "Сохранить", cancel: "Отмена", updated: "Заметка обновлена", created: "Заметка создана",
    toastPinned: "Закреплено", toastUnpinned: "Откреплено",
    types: { idea: "Идея", note: "Заметка", quote: "Цитата", concept: "Концепция",
      question: "Вопрос", scene: "Сцена", insight: "Инсайт",
      observation: "Наблюдение", reflection: "Рефлексия", argument: "Аргумент", character: "Персонаж" },
    statuses: { inbox: "Входящие", active: "Активная", developed: "Развита", used: "Использована", archived: "Архив" },
    importance: { normal: "Обычная", high: "Важная", core: "Ключевая" },
    all: "Все", trash: "Корзина", trashDesc: "Удалённые заметки (30 дней)",
    trashed: "Перемещено в корзину", restore: "Восстановить", restored: "Восстановлено",
    deleteForever: "Удалить навсегда", deletedForever: "Удалено навсегда",
    attachments: "Вложения", fileTooLarge: "Файл слишком большой (макс 10 МБ)",
    oneImageTitle: "Одно изображение на заметку",
    oneImageDesc: "Заметка — это маленький мир для одной идеи. Больше одного изображения будет сбивать. Поэтому можно добавить только одно.",
    linkNotes: "Связанные заметки", searchNotes: "Поиск заметок для связи…",
    linkUrl: "Ссылка (URL)", linkText: "Текст ссылки (необязательно)", insertLink: "Вставить ссылку",
    colorNone: "Без цвета", chains: "Цепочки", newChain: "Новая цепочка",
    chainName: "Название цепочки…", noChains: "Цепочек пока нет",
    chainNav: "Цепочка", prevNote: "Предыдущая", nextNote: "Следующая",
    addToChain: "Добавить в цепочку", removeFromChain: "Убрать из цепочки",
  },
  ua: {
    title: "Нотатки", inbox: "Вхідні", pinned: "Закріплені", allNotes: "Всі нотатки",
    collections: "Колекції", noCollection: "Без колекції", addCollection: "Нова колекція…",
    count: (n: number) => `${n} нотаток`,
    newBtn: "Нова", searchPlaceholder: "Пошук нотаток…", quickCapture: "Швидка нотатка — Enter для збереження…",
    noResults: "Нотатки не знайдено", emptyTitle: "Немає нотаток",
    emptyDesc: "Фіксуй ідеї у рядку швидкого захоплення вище",
    emptyInbox: "Вхідні порожні", emptyInboxDesc: "Швидко захоплені нотатки потрапляють сюди",
    titlePlaceholder: "Назва нотатки…", contentPlaceholder: "Зміст нотатки…",
    tagsPlaceholder: "теги через кому…", statusLabel: "Статус",
    typeLabel: "Тип", colorLabel: "Колір", importanceLabel: "Важливість",
    save: "Зберегти", cancel: "Скасувати", updated: "Нотатку оновлено", created: "Нотатку створено",
    toastPinned: "Закріплено", toastUnpinned: "Відкріплено",
    types: { idea: "Ідея", note: "Нотатка", quote: "Цитата", concept: "Концепція",
      question: "Питання", scene: "Сцена", insight: "Інсайт",
      observation: "Спостереження", reflection: "Рефлексія", argument: "Аргумент", character: "Персонаж" },
    statuses: { inbox: "Вхідні", active: "Активна", developed: "Розвинена", used: "Використана", archived: "Архів" },
    importance: { normal: "Звичайна", high: "Важлива", core: "Ключова" },
    all: "Всі", trash: "Кошик", trashDesc: "Видалені нотатки (30 днів)",
    trashed: "Переміщено до кошика", restore: "Відновити", restored: "Відновлено",
    deleteForever: "Видалити назавжди", deletedForever: "Видалено назавжди",
    attachments: "Вкладення", fileTooLarge: "Файл завеликий (макс 10 МБ)",
    oneImageTitle: "Одне зображення на нотатку",
    oneImageDesc: "Нотатка — це маленький світ для однієї ідеї. Більше одного зображення буде збивати. Тому можна додати лише одне.",
    linkNotes: "Пов'язані нотатки", searchNotes: "Пошук нотаток для зв'язку…",
    linkUrl: "Посилання (URL)", linkText: "Текст посилання (необов'язково)", insertLink: "Вставити посилання",
    colorNone: "Без кольору", chains: "Ланцюжки", newChain: "Новий ланцюжок",
    chainName: "Назва ланцюжка…", noChains: "Ланцюжків поки немає",
    chainNav: "Ланцюжок", prevNote: "Попередня", nextNote: "Наступна",
    addToChain: "Додати до ланцюжка", removeFromChain: "Видалити з ланцюжка",
  },
  de: {
    title: "Notizen", inbox: "Eingang", pinned: "Angeheftet", allNotes: "Alle Notizen",
    collections: "Sammlungen", noCollection: "Ohne Sammlung", addCollection: "Neue Sammlung…",
    count: (n: number) => `${n} Notiz${n !== 1 ? "en" : ""}`,
    newBtn: "Neu", searchPlaceholder: "Notizen suchen…", quickCapture: "Schnellnotiz — Enter zum Speichern…",
    noResults: "Keine Notizen gefunden", emptyTitle: "Noch keine Notizen",
    emptyDesc: "Erfasse Ideen mit der Schnelleingabe oben",
    emptyInbox: "Eingang ist leer", emptyInboxDesc: "Schnell erfasste Notizen landen hier zuerst",
    titlePlaceholder: "Notiztitel…", contentPlaceholder: "Notizinhalt…",
    tagsPlaceholder: "Tags durch Komma getrennt…", statusLabel: "Status",
    typeLabel: "Typ", colorLabel: "Farbe", importanceLabel: "Wichtigkeit",
    save: "Speichern", cancel: "Abbrechen", updated: "Notiz aktualisiert", created: "Notiz erstellt",
    toastPinned: "Angeheftet", toastUnpinned: "Abgeheftet",
    types: { idea: "Idee", note: "Notiz", quote: "Zitat", concept: "Konzept",
      question: "Frage", scene: "Szene", insight: "Einsicht",
      observation: "Beobachtung", reflection: "Reflexion", argument: "Argument", character: "Figur" },
    statuses: { inbox: "Eingang", active: "Aktiv", developed: "Entwickelt", used: "Genutzt", archived: "Archiviert" },
    importance: { normal: "Normal", high: "Wichtig", core: "Kernidee" },
    all: "Alle", trash: "Papierkorb", trashDesc: "Gelöschte Notizen (30 Tage)",
    trashed: "In Papierkorb verschoben", restore: "Wiederherstellen", restored: "Wiederhergestellt",
    deleteForever: "Endgültig löschen", deletedForever: "Endgültig gelöscht",
    attachments: "Anhänge", fileTooLarge: "Datei zu groß (max 10 MB)",
    oneImageTitle: "Ein Bild pro Notiz",
    oneImageDesc: "Eine Notiz ist eine kleine Welt für eine Idee. Mehr als ein Bild lenkt ab — deshalb kann nur eines hinzugefügt werden.",
    linkNotes: "Verknüpfte Notizen", searchNotes: "Notizen zum Verknüpfen suchen…",
    linkUrl: "URL", linkText: "Linktext (optional)", insertLink: "Link einfügen",
    colorNone: "Keine Farbe", chains: "Ketten", newChain: "Neue Kette",
    chainName: "Kettenname…", noChains: "Noch keine Ketten",
    chainNav: "Kette", prevNote: "Vorherige", nextNote: "Nächste",
    addToChain: "Zur Kette hinzufügen", removeFromChain: "Aus Kette entfernen",
  },
};

const DATE_LOCALES = { en: enUS, ru, ua: uk, de };

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
  { value: "inbox",     color: "#94A3B8" },
  { value: "active",    color: "#F59E0B" },
  { value: "developed", color: "#3B82F6" },
  { value: "used",      color: "#22C55E" },
  { value: "archived",  color: "#9CA3AF" },
] as const;

const NOTE_COLORS = [
  { value: "none",   bg: "hsl(var(--card))",   border: "hsl(var(--border))",  text: "hsl(var(--foreground))", clip: "hsl(var(--muted-foreground))" },
  { value: "yellow", bg: "#FEFBEE", border: "#EDD98C", text: "#5C4A1E", clip: "#C4900A" },
  { value: "blue",   bg: "#F0F6FF", border: "#BCCEEA", text: "#2A3F5E", clip: "#4272A6" },
  { value: "purple", bg: "#F5F2FF", border: "#C9C0E8", text: "#3B2760", clip: "#6A52A8" },
  { value: "green",  bg: "#F2FBF5", border: "#A8DCBA", text: "#1E4A2E", clip: "#3D8054" },
  { value: "pink",   bg: "#FEF3FA", border: "#DCAECF", text: "#5C2848", clip: "#A04C86" },
  { value: "orange", bg: "#FFF7F0", border: "#E8C4A0", text: "#5C3420", clip: "#B45C28" },
  { value: "gray",   bg: "#F7F7F7", border: "#CCCCCC", text: "#3A3A3A", clip: "#707070" },
];

const HIGHLIGHT_COLORS = [
  { label: "Yellow", color: "#FEF08A" },
  { label: "Orange", color: "#FED7AA" },
  { label: "Blue",   color: "#BFDBFE" },
  { label: "Green",  color: "#BBF7D0" },
  { label: "Pink",   color: "#FBCFE8" },
  { label: "Violet", color: "#DDD6FE" },
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
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
}

// Compress image to reduce size
async function compressImage(file: File, maxSizePx = 1200, quality = 0.75): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxSizePx || height > maxSizePx) {
        const ratio = Math.min(maxSizePx / width, maxSizePx / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(""); };
    img.src = url;
  });
}

// ─── Note Card ──────────────────────────────────────────────────────────
function NoteCard({ note, onEdit, onTrash, onPin, chains, collections, onCollectionChange }: {
  note: Note; onEdit: (n: Note) => void; onTrash: (id: number) => void;
  onPin: (n: Note) => void; chains: NoteChain[];
  collections: string[]; onCollectionChange: (note: Note, collection: string) => void;
}) {
  const { lang } = useLang();
  const s = NOTES_I18N[lang];
  const col = getColor((note as any).color);
  const type = getType(note.type);
  const isPinned = (note as any).isPinned === "true";
  const importance = (note as any).importance;
  const noteStatus = getStatus((note as any).status);
  const noteChains = chains.filter(c => c.noteIds.includes(note.id));
  const currentCollection = (note as any).collection as string | undefined;
  const [showColPicker, setShowColPicker] = useState(false);
  const colBtnRef = useRef<HTMLButtonElement>(null);
  const [pickerPos, setPickerPos] = useState({ top: 0, left: 0 });

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: note.id });
  const dragStyle = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

  const openColPicker = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!colBtnRef.current) return;
    const rect = colBtnRef.current.getBoundingClientRect();
    setPickerPos({ top: rect.bottom + 4, left: rect.left });
    setShowColPicker(true);
  };

  return (
    <div
      ref={setNodeRef}
      style={{ ...dragStyle, background: col.bg, border: `1px solid ${col.border}`, aspectRatio: "1/1" }}
      onClick={() => onEdit(note)}
      className="relative rounded-2xl p-3 group flex flex-col overflow-hidden cursor-pointer transition-all hover:shadow-md active:scale-[0.985]"
    >
      <div {...attributes} {...listeners} onClick={e => e.stopPropagation()}
        className="absolute top-2 left-2 opacity-0 group-hover:opacity-30 cursor-grab active:cursor-grabbing transition-opacity z-10">
        <GripVertical className="h-3 w-3" style={{ color: col.clip }} />
      </div>

      {/* Top row */}
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

      {/* Chain badges */}
      {noteChains.length > 0 && (
        <div className="flex flex-wrap gap-0.5 mb-1 flex-shrink-0">
          {noteChains.map(ch => {
            const idx = ch.noteIds.indexOf(note.id);
            return (
              <span key={ch.id} className="flex items-center gap-0.5 text-[8px] font-semibold px-1.5 py-0.5 rounded-full"
                style={{ background: `${ch.color}18`, color: ch.color, border: `1px solid ${ch.color}30` }}>
                <LinkIcon className="h-2 w-2" />
                {ch.name} · {idx + 1}/{ch.noteIds.length}
              </span>
            );
          })}
        </div>
      )}

      {/* Title */}
      <h4 className="font-semibold text-[12px] leading-snug line-clamp-2 flex-shrink-0" style={{ color: col.text }}>{note.title}</h4>

      {/* Content preview */}
      {note.content && (
        <div className="relative flex-1 mt-1.5 min-h-0 overflow-hidden">
          <div className="nte-preview" style={{ color: `${col.text}85` }}
            dangerouslySetInnerHTML={{ __html: note.content }} />
          <div className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none"
            style={{ background: `linear-gradient(to bottom, transparent, ${col.bg})` }} />
        </div>
      )}

      {/* Bottom pills */}
      <div className="flex flex-wrap gap-0.5 mt-auto pt-1 flex-shrink-0">
        {noteStatus && (note as any).status && (
          <span className="text-[8px] px-1 py-0.5 rounded-full font-medium"
            style={{ background: `${noteStatus.color}18`, color: noteStatus.color }}>
            {s.statuses[(note as any).status as keyof typeof s.statuses]}
          </span>
        )}
        {importance && importance !== "" && (
          <span className="text-[8px] px-1 py-0.5 rounded-full font-medium"
            style={{ background: importance === "core" ? "#EF444418" : importance === "high" ? "#F59E0B18" : "#94A3B818",
              color: importance === "core" ? "#EF4444" : importance === "high" ? "#F59E0B" : "#94A3B8" }}>
            {s.importance[importance as keyof typeof s.importance]}
          </span>
        )}
        {note.tags && note.tags.split(",").slice(0, 1).map(t => t.trim()).filter(Boolean).map(tag => (
          <span key={tag} className="text-[8px] px-1 py-0.5 rounded-full font-medium"
            style={{ background: `${col.clip}14`, color: `${col.clip}CC` }}>
            #{tag}
          </span>
        ))}
      </div>

      {/* Current collection badge */}
      {currentCollection && (
        <div className="flex items-center gap-0.5 mt-1 flex-shrink-0">
          <span className="flex items-center gap-0.5 text-[8px] font-medium px-1.5 py-0.5 rounded-full truncate max-w-full"
            style={{ background: `${col.clip}12`, color: col.clip }}>
            <FolderOpen className="h-2 w-2 flex-shrink-0" />
            <span className="truncate">{currentCollection}</span>
          </span>
        </div>
      )}

      {/* Hover actions */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-2 right-2"
        onClick={e => e.stopPropagation()}>
        <button ref={colBtnRef} onClick={openColPicker}
          className="w-5 h-5 flex items-center justify-center rounded-md transition-colors hover:bg-black/10"
          style={{ color: currentCollection ? col.clip : `${col.text}50` }}
          title={currentCollection || "Add to collection"}>
          <FolderOpen className="h-2.5 w-2.5" />
        </button>
        <button onClick={e => { e.stopPropagation(); onPin(note); }}
          className="w-5 h-5 flex items-center justify-center rounded-md transition-colors hover:bg-black/10"
          style={{ color: isPinned ? col.clip : `${col.text}50` }}>
          {isPinned ? <PinOff className="h-2.5 w-2.5" /> : <Pin className="h-2.5 w-2.5" />}
        </button>
        <button onClick={e => { e.stopPropagation(); onTrash(note.id); }}
          className="w-5 h-5 flex items-center justify-center rounded-md transition-colors hover:bg-red-100"
          style={{ color: `${col.text}50` }}>
          <Trash2 className="h-2.5 w-2.5" />
        </button>
      </div>

      {/* Collection picker dropdown (portal) */}
      {showColPicker && createPortal(
        <>
          <div className="fixed inset-0 z-[9999]" onClick={() => setShowColPicker(false)} />
          <div className="fixed z-[10000] bg-card border border-border rounded-xl shadow-xl py-1 min-w-[160px] max-w-[220px]"
            style={{ top: pickerPos.top, left: pickerPos.left }}
            onClick={e => e.stopPropagation()}>
            {collections.length === 0 && (
              <p className="px-3 py-2 text-xs text-muted-foreground">{s.noCollection}</p>
            )}
            {collections.map(c => (
              <button key={c} onClick={() => { onCollectionChange(note, currentCollection === c ? "" : c); setShowColPicker(false); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-accent transition-colors text-left">
                <div className="w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0"
                  style={{ borderColor: currentCollection === c ? "hsl(var(--primary))" : "hsl(var(--border))", background: currentCollection === c ? "hsl(var(--primary))" : "transparent" }}>
                  {currentCollection === c && <Check className="h-2 w-2 text-white" />}
                </div>
                <span className="truncate font-medium">{c}</span>
              </button>
            ))}
            {currentCollection && (
              <>
                <div className="border-t border-border/60 my-1" />
                <button onClick={() => { onCollectionChange(note, ""); setShowColPicker(false); }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-red-50 text-red-500 transition-colors text-left">
                  <X className="h-3 w-3 flex-shrink-0" />
                  {s.noCollection}
                </button>
              </>
            )}
          </div>
        </>,
        document.body
      )}
    </div>
  );
}

// ─── Chain Manager Dialog ─────────────────────────────────────────────
function ChainManagerDialog({ open, onClose, chains, setChains, bookId, allNotes, lang }: {
  open: boolean; onClose: () => void; chains: NoteChain[];
  setChains: (c: NoteChain[]) => void; bookId: number; allNotes: Note[]; lang: keyof typeof NOTES_I18N;
}) {
  const s = NOTES_I18N[lang];
  const [newName, setNewName] = useState("");
  const [selectedColor, setSelectedColor] = useState(CHAIN_COLORS[0]);
  const [editingChain, setEditingChain] = useState<string | null>(null);
  const [noteSearch, setNoteSearch] = useState("");

  if (!open) return null;

  const handleCreate = () => {
    if (!newName.trim()) return;
    const chain: NoteChain = { id: Math.random().toString(36).slice(2), name: newName.trim(), noteIds: [], color: selectedColor };
    const updated = [...chains, chain];
    setChains(updated);
    saveChains(bookId, updated);
    setNewName("");
    setEditingChain(chain.id);
  };

  const handleDelete = (id: string) => {
    const updated = chains.filter(c => c.id !== id);
    setChains(updated);
    saveChains(bookId, updated);
    if (editingChain === id) setEditingChain(null);
  };

  const toggleNote = (chainId: string, noteId: number) => {
    const updated = chains.map(c => {
      if (c.id !== chainId) return c;
      const has = c.noteIds.includes(noteId);
      return { ...c, noteIds: has ? c.noteIds.filter(id => id !== noteId) : [...c.noteIds, noteId] };
    });
    setChains(updated);
    saveChains(bookId, updated);
  };

  const moveNote = (chainId: string, noteId: number, dir: -1 | 1) => {
    const updated = chains.map(c => {
      if (c.id !== chainId) return c;
      const ids = [...c.noteIds];
      const idx = ids.indexOf(noteId);
      if (idx < 0) return c;
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= ids.length) return c;
      [ids[idx], ids[newIdx]] = [ids[newIdx], ids[idx]];
      return { ...c, noteIds: ids };
    });
    setChains(updated);
    saveChains(bookId, updated);
  };

  const currentChain = editingChain ? chains.find(c => c.id === editingChain) : null;
  const filteredNotes = allNotes.filter(n => !noteSearch || n.title.toLowerCase().includes(noteSearch.toLowerCase()));

  return createPortal(
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={onClose}>
      <div className="w-full max-w-[580px] rounded-2xl shadow-2xl flex flex-col overflow-hidden bg-card border border-border"
        style={{ maxHeight: "85vh" }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border/40">
          <LinkIcon className="h-4 w-4 text-primary" />
          <h2 className="font-bold text-sm flex-1">{s.chains}</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left: chain list */}
          <div className="w-[200px] flex-shrink-0 border-r border-border/40 flex flex-col">
            {/* Create chain */}
            <div className="p-3 border-b border-border/30">
              <input value={newName} onChange={e => setNewName(e.target.value)}
                placeholder={s.chainName}
                className="w-full text-[11px] px-2.5 py-1.5 rounded-lg bg-secondary/50 border border-border/40 outline-none focus:border-primary/30 mb-2"
                onKeyDown={e => e.key === "Enter" && handleCreate()} />
              <div className="flex items-center gap-1.5 mb-2">
                {CHAIN_COLORS.map(c => (
                  <button key={c} onClick={() => setSelectedColor(c)}
                    className="w-5 h-5 rounded-full border-2 transition-all hover:scale-110"
                    style={{ background: c, borderColor: selectedColor === c ? c : "transparent",
                      boxShadow: selectedColor === c ? `0 0 0 2px ${c}40` : "none" }} />
                ))}
              </div>
              <button onClick={handleCreate} disabled={!newName.trim()}
                className="w-full py-1.5 rounded-lg text-[11px] font-semibold text-white disabled:opacity-40 transition-all"
                style={{ background: "linear-gradient(135deg,#F96D1C,#FB923C)" }}>
                + {s.newChain}
              </button>
            </div>

            {/* Chain list */}
            <div className="flex-1 overflow-y-auto py-1">
              {chains.length === 0 && (
                <p className="px-3 py-4 text-[10px] text-muted-foreground/50 italic text-center">{s.noChains}</p>
              )}
              {chains.map(ch => (
                <div key={ch.id}
                  className={cn("group flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors",
                    editingChain === ch.id ? "bg-primary/8" : "hover:bg-secondary/50")}
                  onClick={() => setEditingChain(editingChain === ch.id ? null : ch.id)}>
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: ch.color }} />
                  <span className={cn("flex-1 text-[11px] truncate", editingChain === ch.id ? "font-semibold text-foreground" : "text-muted-foreground")}>
                    {ch.name}
                  </span>
                  <span className="text-[9px] text-muted-foreground/50">{ch.noteIds.length}</span>
                  <button onClick={e => { e.stopPropagation(); handleDelete(ch.id); }}
                    className="opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:text-destructive transition-all w-4 h-4 flex items-center justify-center flex-shrink-0">
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Right: chain editor */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {!currentChain ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <LinkIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground/20" />
                  <p className="text-xs text-muted-foreground/50">
                    {chains.length === 0 ? s.noChains : "Select a chain to edit"}
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Chain header */}
                <div className="px-4 py-2.5 border-b border-border/30 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: currentChain.color }} />
                  <span className="text-[12px] font-semibold">{currentChain.name}</span>
                  <span className="text-[10px] text-muted-foreground/50 ml-auto">{currentChain.noteIds.length} notes</span>
                </div>

                {/* Chain note order */}
                {currentChain.noteIds.length > 0 && (
                  <div className="border-b border-border/20 px-3 py-2">
                    <p className="text-[9px] uppercase tracking-wider font-semibold text-muted-foreground/50 mb-1.5">Chain order</p>
                    <div className="space-y-1">
                      {currentChain.noteIds.map((nid, idx) => {
                        const n = allNotes.find(x => x.id === nid);
                        if (!n) return null;
                        const t = getType(n.type);
                        return (
                          <div key={nid} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-secondary/30">
                            <span className="text-[9px] font-bold text-muted-foreground/40 w-4">{idx + 1}</span>
                            {t && <t.icon className="h-2.5 w-2.5 flex-shrink-0" style={{ color: t.accent }} />}
                            <span className="flex-1 text-[11px] truncate">{n.title}</span>
                            <button onClick={() => moveNote(currentChain.id, nid, -1)} disabled={idx === 0}
                              className="w-4 h-4 flex items-center justify-center text-muted-foreground/40 hover:text-foreground disabled:opacity-20 transition-colors">
                              <ArrowLeft className="h-2.5 w-2.5" />
                            </button>
                            <button onClick={() => moveNote(currentChain.id, nid, 1)} disabled={idx === currentChain.noteIds.length - 1}
                              className="w-4 h-4 flex items-center justify-center text-muted-foreground/40 hover:text-foreground disabled:opacity-20 transition-colors">
                              <ArrowRight className="h-2.5 w-2.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Add notes */}
                <div className="flex-1 overflow-hidden flex flex-col px-3 py-2">
                  <p className="text-[9px] uppercase tracking-wider font-semibold text-muted-foreground/50 mb-1.5">Add notes</p>
                  <div className="relative mb-1.5">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-2.5 w-2.5 text-muted-foreground/40" />
                    <input value={noteSearch} onChange={e => setNoteSearch(e.target.value)}
                      placeholder="Search…"
                      className="w-full pl-6 pr-2 py-1 rounded-lg text-[11px] bg-secondary/40 border border-border/30 outline-none" />
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-0.5">
                    {filteredNotes.map(n => {
                      const inChain = currentChain.noteIds.includes(n.id);
                      const t = getType(n.type);
                      return (
                        <button key={n.id} onClick={() => toggleNote(currentChain.id, n.id)}
                          className={cn("w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors",
                            inChain ? "bg-primary/8 text-primary" : "hover:bg-secondary/50 text-foreground")}>
                          {t && <t.icon className="h-2.5 w-2.5 flex-shrink-0" style={{ color: t.accent }} />}
                          <span className="flex-1 truncate text-[11px]">{n.title}</span>
                          {inChain && <Check className="h-2.5 w-2.5 flex-shrink-0 text-primary" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Toolbar button ────────────────────────────────────────────────────
function TBtn({ onAction, title, children, active }: { onAction: () => void; title: string; children: React.ReactNode; active?: boolean }) {
  return (
    <button title={title} onMouseDown={e => { e.preventDefault(); onAction(); }}
      className="w-7 h-7 flex items-center justify-center rounded-md transition-colors text-muted-foreground hover:text-foreground hover:bg-secondary/70 flex-shrink-0"
      style={active ? { background: "rgba(249,109,28,0.1)", color: "#F96D1C" } : {}}>
      {children}
    </button>
  );
}

// ─── Note Dialog ──────────────────────────────────────────────────────
function NoteDialog({ open, onClose, bookId, note, prefillTitle, collections, allNotes, chains, bookTitle }: {
  open: boolean; onClose: () => void; bookId: number; note?: Note;
  prefillTitle?: string; collections: string[]; allNotes: Note[];
  chains: NoteChain[]; bookTitle?: string;
}) {
  const { toast } = useToast();
  const { lang } = useLang();
  const s = NOTES_I18N[lang];
  const editorRef = useRef<HTMLDivElement>(null);
  const editorScrollRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hlBtnRef = useRef<HTMLButtonElement>(null);
  const savedSelectionRef = useRef<Range | null>(null);
  const noteSelectionRef = useRef<Range | null>(null);

  const [titleInput, setTitleInput] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [noteColor, setNoteColor] = useState("none");
  const [showMeta, setShowMeta] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [showHL, setShowHL] = useState(false);
  const [hlPickerPos, setHlPickerPos] = useState<{ top: number; left: number } | null>(null);
  const [attachUploading, setAttachUploading] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [linkedNoteIds, setLinkedNoteIds] = useState<number[]>([]);
  const [noteSearch, setNoteSearch] = useState("");
  const [showNoteSearch, setShowNoteSearch] = useState(false);
  const [tableToolbarPos, setTableToolbarPos] = useState<{ top: number; left: number; cell: HTMLTableCellElement } | null>(null);

  // Chain navigation
  const noteChains = chains.filter(c => note?.id && c.noteIds.includes(note.id));
  const primaryChain = noteChains[0] || null;
  const chainIdx = primaryChain && note?.id ? primaryChain.noteIds.indexOf(note.id) : -1;
  const prevNoteId = primaryChain && chainIdx > 0 ? primaryChain.noteIds[chainIdx - 1] : null;
  const nextNoteId = primaryChain && chainIdx >= 0 && chainIdx < primaryChain.noteIds.length - 1 ? primaryChain.noteIds[chainIdx + 1] : null;
  const prevNote = prevNoteId ? allNotes.find(n => n.id === prevNoteId) : null;
  const nextNote = nextNoteId ? allNotes.find(n => n.id === nextNoteId) : null;

  // Track note selection for AI toolbar
  useEffect(() => {
    if (!open) return;
    const saveSelection = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !editorRef.current) return;
      if (sel.rangeCount > 0 && editorRef.current.contains(sel.getRangeAt(0).commonAncestorContainer)) {
        noteSelectionRef.current = sel.getRangeAt(0).cloneRange();
      }
    };
    document.addEventListener("selectionchange", saveSelection);
    return () => document.removeEventListener("selectionchange", saveSelection);
  }, [open]);

  // Table toolbar: detect when cursor is in a table cell
  useEffect(() => {
    if (!open) return;
    const checkTableCursor = () => {
      const sel = window.getSelection();
      if (!sel || !editorRef.current) { setTableToolbarPos(null); return; }
      let node: Node | null = sel.anchorNode;
      while (node && node !== editorRef.current) {
        if ((node as HTMLElement).tagName === "TD" || (node as HTMLElement).tagName === "TH") {
          const cell = node as HTMLTableCellElement;
          const rect = cell.getBoundingClientRect();
          setTableToolbarPos({ top: rect.top - 36, left: rect.left, cell });
          return;
        }
        node = node.parentNode;
      }
      setTableToolbarPos(null);
    };
    document.addEventListener("selectionchange", checkTableCursor);
    return () => document.removeEventListener("selectionchange", checkTableCursor);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setType(note?.type || "");
    setTagInput(note?.tags || "");
    setStatus((note as any)?.status || "");
    setNoteColor((note as any)?.color || "none");
    setShowMeta(!!(note?.type || (note as any)?.status || note?.tags));
    setShowHL(false); setShowLinkDialog(false); setNoteSearch(""); setShowNoteSearch(false);
    setTitleInput(note?.title || prefillTitle || "");
    const rawLinked = (note as any)?.linkedNoteIds || "";
    setLinkedNoteIds(rawLinked ? rawLinked.split(",").map((id: string) => parseInt(id.trim())).filter(Boolean) : []);
    setTimeout(() => {
      const div = editorRef.current;
      if (!div) return;
      if (note) {
        const raw = note.content || "";
        div.innerHTML = raw.trim().startsWith("<") ? raw : (raw || "<br>").split("\n").map(l => `<p>${l || "<br>"}</p>`).join("");
      } else {
        div.innerHTML = "<p><br></p>";
      }
      div.focus();
      const range = document.createRange();
      range.selectNodeContents(div); range.collapse(false);
      window.getSelection()?.removeAllRanges();
      window.getSelection()?.addRange(range);
    }, 40);
  }, [open, note?.id]);

  const exec = useCallback((cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
  }, []);

  const fmtBlock = useCallback((tag: string) => {
    document.execCommand("formatBlock", false, tag);
    editorRef.current?.focus();
  }, []);

  const insertHTML = useCallback((html: string) => {
    document.execCommand("insertHTML", false, html);
    editorRef.current?.focus();
  }, []);

  const insertTable = () => insertHTML(
    `<table style="border-collapse:collapse;width:100%;margin:10px 0;font-size:13px">` +
    `<tr><td style="border:1px solid #d1d5db;padding:6px 10px;min-width:80px"><br></td><td style="border:1px solid #d1d5db;padding:6px 10px;min-width:80px"><br></td><td style="border:1px solid #d1d5db;padding:6px 10px;min-width:80px"><br></td></tr>` +
    `<tr><td style="border:1px solid #d1d5db;padding:6px 10px"><br></td><td style="border:1px solid #d1d5db;padding:6px 10px"><br></td><td style="border:1px solid #d1d5db;padding:6px 10px"><br></td></tr>` +
    `<tr><td style="border:1px solid #d1d5db;padding:6px 10px"><br></td><td style="border:1px solid #d1d5db;padding:6px 10px"><br></td><td style="border:1px solid #d1d5db;padding:6px 10px"><br></td></tr>` +
    `</table><p><br></p>`
  );

  // Table manipulation helpers
  const tableAction = (action: "addRow" | "removeRow" | "addCol" | "removeCol") => {
    if (!tableToolbarPos?.cell) return;
    const cell = tableToolbarPos.cell;
    const row = cell.parentElement as HTMLTableRowElement;
    const table = row?.closest("table");
    if (!table || !row) return;

    if (action === "addRow") {
      const colCount = row.cells.length;
      const newRow = row.insertAdjacentElement("afterend", document.createElement("tr")) as HTMLTableRowElement;
      for (let i = 0; i < colCount; i++) {
        const td = document.createElement("td");
        td.style.cssText = "border:1px solid #d1d5db;padding:6px 10px;min-width:80px";
        td.innerHTML = "<br>";
        newRow.appendChild(td);
      }
    } else if (action === "removeRow") {
      const rows = table.querySelectorAll("tr");
      if (rows.length > 1) row.remove();
    } else if (action === "addCol") {
      const cellIndex = cell.cellIndex;
      table.querySelectorAll("tr").forEach(r => {
        const td = document.createElement("td");
        td.style.cssText = "border:1px solid #d1d5db;padding:6px 10px;min-width:80px";
        td.innerHTML = "<br>";
        const ref = r.cells[cellIndex + 1];
        if (ref) r.insertBefore(td, ref); else r.appendChild(td);
      });
    } else if (action === "removeCol") {
      const cellIndex = cell.cellIndex;
      const rowCount = table.querySelectorAll("tr").length;
      if (table.querySelectorAll("tr")[0]?.cells.length > 1) {
        table.querySelectorAll("tr").forEach(r => { if (r.cells[cellIndex]) r.cells[cellIndex].remove(); });
      }
    }
    editorRef.current?.focus();
  };

  const openLinkDialog = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedSelectionRef.current = sel.getRangeAt(0).cloneRange();
      setLinkText(sel.toString());
    } else { savedSelectionRef.current = null; setLinkText(""); }
    setLinkUrl(""); setShowLinkDialog(true);
  };

  const confirmLink = () => {
    if (!linkUrl.trim()) return;
    const url = linkUrl.trim().startsWith("http") ? linkUrl.trim() : `https://${linkUrl.trim()}`;
    editorRef.current?.focus();
    if (savedSelectionRef.current) {
      const sel = window.getSelection();
      sel?.removeAllRanges(); sel?.addRange(savedSelectionRef.current);
    }
    document.execCommand("insertHTML", false,
      `<a href="${url}" target="_blank" rel="noopener noreferrer">${linkText.trim() || url}</a>`);
    setShowLinkDialog(false); savedSelectionRef.current = null;
  };

  const openHighlight = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) savedSelectionRef.current = sel.getRangeAt(0).cloneRange();
    if (hlBtnRef.current) {
      const r = hlBtnRef.current.getBoundingClientRect();
      setHlPickerPos({ top: r.bottom + 6, left: r.left });
    }
    setShowHL(v => !v);
  };

  const applyHighlight = (color: string) => {
    editorRef.current?.focus();
    if (savedSelectionRef.current) {
      const sel = window.getSelection();
      sel?.removeAllRanges(); sel?.addRange(savedSelectionRef.current);
    }
    if (!document.execCommand("backColor", false, color)) {
      document.execCommand("hiliteColor", false, color);
    }
    setShowHL(false); setHlPickerPos(null); savedSelectionRef.current = null;
  };

  // Selection toolbar result handler
  const handleNoteSelectionResult = useCallback((original: string, improved: string, _mode: string) => {
    if (!improved || !editorRef.current) return;
    editorRef.current.focus();
    if (noteSelectionRef.current) {
      const sel = window.getSelection();
      sel?.removeAllRanges(); sel?.addRange(noteSelectionRef.current);
    }
    document.execCommand("insertText", false, improved);
    noteSelectionRef.current = null;
  }, []);

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    if (!text) return;
    const escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    document.execCommand("insertHTML", false, escaped.split("\n").map(l => `<p>${l || "<br>"}</p>`).join(""));
  }, []);

  const handleImageInsert = async (file: File) => {
    if (editorRef.current && editorRef.current.querySelectorAll("img").length > 0) {
      toast({ title: s.oneImageTitle, description: s.oneImageDesc, variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) { toast({ title: s.fileTooLarge, variant: "destructive" }); return; }
    const dataUrl = await compressImage(file);
    if (!dataUrl) return;
    editorRef.current?.focus();
    document.execCommand("insertHTML", false,
      `<img src="${dataUrl}" style="max-width:100%;border-radius:8px;margin:6px 0;display:block" /><p><br></p>`);
  };

  const handleFileAttach = async (file: File) => {
    if (!note?.id) return;
    if (file.size > 10 * 1024 * 1024) { toast({ title: s.fileTooLarge, variant: "destructive" }); return; }
    setAttachUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = (ev.target?.result as string).split(",")[1];
        await apiRequest("POST", `/api/notes/${note.id}/attachments`, {
          fileName: file.name, fileType: file.type, fileSize: file.size, fileContent: base64,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/notes", note.id, "attachments"] });
        setAttachUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      toast({ title: lang === "ru" ? "Ошибка загрузки" : "Upload failed", variant: "destructive" });
      setAttachUploading(false);
    }
  };

  const { data: attachments = [] } = useQuery<any[]>({
    queryKey: ["/api/notes", note?.id, "attachments"],
    queryFn: () => apiRequest("GET", `/api/notes/${note!.id}/attachments`),
    enabled: !!note?.id && open,
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/attachments/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/notes", note?.id, "attachments"] }),
  });

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
    const title = titleInput.trim();
    if (!title) {
      toast({ title: lang === "ru" ? "Введите заголовок" : lang === "ua" ? "Введіть назву" : "Enter a title", variant: "destructive" });
      return;
    }
    mutation.mutate({ title, content: div.innerHTML, type, tags: tagInput.trim(), status, color: noteColor,
      collection: "", importance: "", isPinned: (note as any)?.isPinned || "false",
      linkedNoteIds: linkedNoteIds.join(",") });
  };

  const toggleLinkedNote = (id: number) => {
    setLinkedNoteIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const filteredLinkableNotes = allNotes.filter(n =>
    n.id !== note?.id && (!noteSearch || n.title.toLowerCase().includes(noteSearch.toLowerCase()))
  );
  const linkedNotes = allNotes.filter(n => linkedNoteIds.includes(n.id));
  const activeType = type ? NOTE_TYPES.find(t => t.value === type) : null;

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.42)", backdropFilter: "blur(3px)" }}
      onClick={() => { setShowHL(false); setShowLinkDialog(false); onClose(); }}>
      <div className="w-full max-w-[640px] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ maxHeight: "92vh", background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
        onClick={e => e.stopPropagation()}>

        {/* Chain navigation bar */}
        {primaryChain && (
          <div className="flex items-center gap-2 px-4 py-2 border-b flex-shrink-0"
            style={{ background: `${primaryChain.color}08`, borderColor: `${primaryChain.color}25` }}>
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <LinkIcon className="h-3 w-3 flex-shrink-0" style={{ color: primaryChain.color }} />
              <span className="text-[10px] font-semibold truncate" style={{ color: primaryChain.color }}>
                {s.chainNav}: {primaryChain.name}
              </span>
              <span className="text-[10px] text-muted-foreground/50">
                · {chainIdx + 1}/{primaryChain.noteIds.length}
              </span>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button disabled={!prevNote} onClick={() => { if (prevNote) { onClose(); setTimeout(() => { /* will be reopened externally */ }, 50); } }}
                title={prevNote?.title}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-colors disabled:opacity-30"
                style={{ color: primaryChain.color, background: `${primaryChain.color}12` }}
                onClick={() => prevNote && window.dispatchEvent(new CustomEvent("moodra:open-note", { detail: prevNote }))}>
                <ArrowLeft className="h-3 w-3" />
                {s.prevNote}
              </button>
              <button disabled={!nextNote}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-colors disabled:opacity-30"
                style={{ color: primaryChain.color, background: `${primaryChain.color}12` }}
                title={nextNote?.title}
                onClick={() => nextNote && window.dispatchEvent(new CustomEvent("moodra:open-note", { detail: nextNote }))}>
                {s.nextNote}
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}

        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 pt-3.5 pb-3 border-b border-border/40 flex-shrink-0">
          <div className="flex-1 min-w-0">
            <input value={titleInput} onChange={e => setTitleInput(e.target.value)}
              placeholder={s.titlePlaceholder}
              className="w-full text-[14px] font-semibold bg-transparent outline-none placeholder:text-muted-foreground/35 placeholder:font-normal text-foreground"
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); editorRef.current?.focus(); } }} />
          </div>
          <button onClick={handleSave} disabled={!titleInput.trim() || mutation.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all disabled:opacity-40 flex-shrink-0 text-white"
            style={{ background: "linear-gradient(135deg,#F96D1C,#FB923C)" }}>
            {mutation.isPending
              ? <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
              : <Check className="h-3 w-3" />}
            {s.save}
          </button>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors text-muted-foreground flex-shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>

        {activeType && <div style={{ height: 2, background: activeType.accent, opacity: 0.7, flexShrink: 0 }} />}

        {/* WYSIWYG Toolbar */}
        <div className="flex items-center gap-0.5 px-3 py-1.5 border-b border-border/25 flex-shrink-0 overflow-x-auto">
          <TBtn onAction={() => exec("bold")} title="Bold"><Bold className="h-3.5 w-3.5" /></TBtn>
          <TBtn onAction={() => exec("italic")} title="Italic"><Italic className="h-3.5 w-3.5" /></TBtn>
          <TBtn onAction={() => exec("underline")} title="Underline"><Underline className="h-3.5 w-3.5" /></TBtn>
          <TBtn onAction={() => exec("strikeThrough")} title="Strikethrough"><Strikethrough className="h-3.5 w-3.5" /></TBtn>

          {/* Highlight with fixed-position picker */}
          <div className="relative flex-shrink-0">
            <button ref={hlBtnRef} title="Highlight"
              onMouseDown={e => { e.preventDefault(); openHighlight(); }}
              className="w-7 h-7 flex items-center justify-center rounded-md transition-colors text-muted-foreground hover:text-foreground hover:bg-secondary/70"
              style={showHL ? { background: "rgba(249,109,28,0.1)", color: "#F96D1C" } : {}}>
              <Highlighter className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="w-px h-4 bg-border/50 mx-1 flex-shrink-0" />
          <TBtn onAction={() => exec("insertUnorderedList")} title="Bullet list"><List className="h-3.5 w-3.5" /></TBtn>
          <TBtn onAction={() => exec("insertOrderedList")} title="Numbered list"><ListOrdered className="h-3.5 w-3.5" /></TBtn>
          <div className="w-px h-4 bg-border/50 mx-1 flex-shrink-0" />
          <TBtn onAction={() => fmtBlock("h1")} title="Title"><Type className="h-3.5 w-3.5" /></TBtn>
          <TBtn onAction={() => fmtBlock("h2")} title="Heading 1"><Heading1 className="h-3.5 w-3.5" /></TBtn>
          <TBtn onAction={() => fmtBlock("h3")} title="Heading 2"><Heading2 className="h-3.5 w-3.5" /></TBtn>
          <TBtn onAction={() => fmtBlock("h4")} title="Heading 3"><Heading3 className="h-3.5 w-3.5" /></TBtn>
          <TBtn onAction={() => fmtBlock("blockquote")} title="Quote"><Quote className="h-3.5 w-3.5" /></TBtn>
          <TBtn onAction={() => exec("indent")} title="Indent"><Indent className="h-3.5 w-3.5" /></TBtn>
          <TBtn onAction={() => exec("outdent")} title="Outdent"><Outdent className="h-3.5 w-3.5" /></TBtn>
          <div className="w-px h-4 bg-border/50 mx-1 flex-shrink-0" />
          <TBtn onAction={insertTable} title="Insert table"><Table className="h-3.5 w-3.5" /></TBtn>
          <TBtn onAction={openLinkDialog} title="Insert link"><Link2 className="h-3.5 w-3.5" /></TBtn>
          <TBtn onAction={() => imageInputRef.current?.click()} title="Insert image"><ImagePlus className="h-3.5 w-3.5" /></TBtn>
        </div>

        {/* Highlight portal picker */}
        {showHL && hlPickerPos && createPortal(
          <div style={{ position: "fixed", top: hlPickerPos.top, left: hlPickerPos.left, zIndex: 9999 }}
            className="flex items-center gap-1 p-1.5 rounded-xl shadow-xl border border-border bg-card"
            onMouseDown={e => e.preventDefault()}>
            {HIGHLIGHT_COLORS.map(hc => (
              <button key={hc.color} title={hc.label}
                onMouseDown={e => { e.preventDefault(); applyHighlight(hc.color); }}
                className="w-5 h-5 rounded-full border-2 border-white/60 hover:scale-110 transition-transform shadow-sm"
                style={{ background: hc.color }} />
            ))}
            <button title="Remove" onMouseDown={e => { e.preventDefault(); applyHighlight("transparent"); }}
              className="w-5 h-5 rounded-full border-2 border-border text-[8px] flex items-center justify-center text-muted-foreground hover:bg-secondary">✕</button>
          </div>,
          document.body
        )}

        {/* Table toolbar portal */}
        {tableToolbarPos && createPortal(
          <div style={{ position: "fixed", top: tableToolbarPos.top, left: tableToolbarPos.left, zIndex: 9998 }}
            className="flex items-center gap-0.5 p-1 rounded-lg shadow-lg border border-border/60 bg-card"
            onMouseDown={e => e.preventDefault()}>
            <button title="Add row below" onMouseDown={e => { e.preventDefault(); tableAction("addRow"); }}
              className="flex items-center gap-1 px-1.5 py-1 rounded text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              <Rows className="h-3 w-3" /> + Row
            </button>
            <button title="Remove row" onMouseDown={e => { e.preventDefault(); tableAction("removeRow"); }}
              className="flex items-center gap-1 px-1.5 py-1 rounded text-[10px] font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
              <Minus className="h-3 w-3" /> Row
            </button>
            <div className="w-px h-4 bg-border/40" />
            <button title="Add column right" onMouseDown={e => { e.preventDefault(); tableAction("addCol"); }}
              className="flex items-center gap-1 px-1.5 py-1 rounded text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              <Columns className="h-3 w-3" /> + Col
            </button>
            <button title="Remove column" onMouseDown={e => { e.preventDefault(); tableAction("removeCol"); }}
              className="flex items-center gap-1 px-1.5 py-1 rounded text-[10px] font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
              <Minus className="h-3 w-3" /> Col
            </button>
          </div>,
          document.body
        )}

        {/* Link dialog */}
        {showLinkDialog && (
          <div className="border-b border-border/40 px-4 py-3 flex-shrink-0 bg-secondary/30">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Link2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                <span className="text-[11px] font-semibold">{s.insertLink}</span>
              </div>
              <input autoFocus value={linkUrl} onChange={e => setLinkUrl(e.target.value)}
                placeholder={s.linkUrl}
                className="w-full px-3 py-1.5 rounded-lg text-[12px] bg-card border border-border/60 outline-none focus:border-primary/40 transition-colors"
                onKeyDown={e => { if (e.key === "Enter") confirmLink(); if (e.key === "Escape") setShowLinkDialog(false); }} />
              <input value={linkText} onChange={e => setLinkText(e.target.value)}
                placeholder={s.linkText}
                className="w-full px-3 py-1.5 rounded-lg text-[12px] bg-card border border-border/60 outline-none focus:border-primary/40 transition-colors"
                onKeyDown={e => { if (e.key === "Enter") confirmLink(); if (e.key === "Escape") setShowLinkDialog(false); }} />
              <div className="flex gap-2">
                <button onClick={confirmLink} disabled={!linkUrl.trim()}
                  className="flex-1 py-1.5 rounded-lg text-[11px] font-semibold text-white disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg,#F96D1C,#FB923C)" }}>{s.insertLink}</button>
                <button onClick={() => setShowLinkDialog(false)}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-muted-foreground hover:bg-secondary transition-colors">{s.cancel}</button>
              </div>
            </div>
          </div>
        )}

        <input ref={imageInputRef} type="file" accept="image/*" className="hidden"
          onChange={async e => {
            const f = e.target.files?.[0];
            if (f) await handleImageInsert(f);
            e.target.value = "";
          }} />
        <input ref={fileInputRef} type="file" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFileAttach(f); e.target.value = ""; }} />

        <style>{`
          .nte-editor { min-height:260px; outline:none; font-size:13.5px; }
          .nte-editor p { margin:0; min-height:1.6em; }
          .nte-editor h1 { font-size:1.5rem; font-weight:700; margin:12px 0 4px; }
          .nte-editor h2 { font-size:1.2rem; font-weight:600; margin:10px 0 4px; }
          .nte-editor h3 { font-size:1.05rem; font-weight:600; margin:8px 0 4px; }
          .nte-editor h4 { font-size:0.95rem; font-weight:600; margin:6px 0 4px; color:#6b7280; }
          .nte-editor blockquote { border-left:3px solid #F96D1C; background:rgba(249,109,28,0.05); margin:8px 0; padding:8px 14px; border-radius:0 8px 8px 0; color:#6b7280; font-style:italic; }
          .nte-editor ul { list-style:disc; padding-left:1.5rem; margin:4px 0; }
          .nte-editor ol { list-style:decimal; padding-left:1.5rem; margin:4px 0; }
          .nte-editor li { margin:2px 0; }
          .nte-editor a { color:#F96D1C; text-decoration:underline; cursor:pointer; }
          .nte-editor table { border-collapse:collapse; width:100%; margin:10px 0; }
          .nte-editor table td,.nte-editor table th { border:1px solid #d1d5db; padding:6px 10px; min-width:80px; }
          .nte-editor table td:focus,.nte-editor table th:focus { outline:2px solid rgba(249,109,28,0.4); outline-offset:-1px; }
          .nte-editor:empty:before { content:attr(data-placeholder); color:rgba(100,116,139,0.4); pointer-events:none; font-style:italic; }
          .nte-preview { font-size:11px; line-height:1.55; font-family:inherit; }
          .nte-preview p { margin:0 0 2px; }
          .nte-preview h1,.nte-preview h2,.nte-preview h3,.nte-preview h4 { font-size:11px; font-weight:700; margin:0 0 2px; }
          .nte-preview ul,.nte-preview ol { padding-left:1rem; margin:0 0 2px; }
          .nte-preview li { margin:0; }
          .nte-preview blockquote { border-left:2px solid #F96D1C; padding-left:6px; margin:0 0 2px; font-style:italic; }
          .nte-preview table { font-size:10px; border-collapse:collapse; }
          .nte-preview table td { border:1px solid #e5e7eb; padding:2px 4px; }
          .nte-preview a { color:#F96D1C; }
        `}</style>

        {/* Editor area */}
        <div ref={editorScrollRef} className="flex-1 overflow-y-auto">
          {/* SelectionToolbar scoped to note editor */}
          <SelectionToolbar
            containerRef={editorScrollRef as React.RefObject<HTMLElement>}
            bookTitle={bookTitle}
            onResult={handleNoteSelectionResult}
          />
          <div ref={editorRef} contentEditable suppressContentEditableWarning
            className="nte-editor w-full px-5 pt-4 pb-5 leading-[1.85]"
            data-placeholder={lang === "ru" ? "Начни писать мысль…" : lang === "ua" ? "Почни писати думку…" : lang === "de" ? "Schreib deine Gedanken…" : "Start writing your thought…"}
            onPaste={handlePaste}
            onKeyDown={e => {
              if (e.key === "Escape") onClose();
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleSave(); }
            }} />
        </div>

        {/* Attachments */}
        {(note?.id || attachments.length > 0) && (
          <div className="border-t border-border/25 flex-shrink-0 px-4 py-2.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 flex items-center gap-1.5">
                <Paperclip className="h-2.5 w-2.5" />{s.attachments}
                {attachments.length > 0 && <span className="text-muted-foreground/40">({attachments.length})</span>}
              </span>
              {note?.id && (
                <button onClick={() => fileInputRef.current?.click()} disabled={attachUploading}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-colors hover:bg-secondary text-muted-foreground hover:text-foreground">
                  {attachUploading
                    ? <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                    : <Paperclip className="h-3 w-3" />}
                  {lang === "ru" ? "Прикрепить" : lang === "ua" ? "Прикріпити" : lang === "de" ? "Anhängen" : "Attach"}
                </button>
              )}
            </div>
            {attachments.length > 0 && (
              <div className="flex flex-col gap-1">
                {attachments.map((att: any) => {
                  const isImg = att.fileType?.startsWith("image/");
                  const sizeMb = att.fileSize ? (att.fileSize / (1024 * 1024)).toFixed(1) : null;
                  return (
                    <div key={att.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-secondary/40 group hover:bg-secondary/70 transition-colors">
                      <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 bg-secondary text-muted-foreground">
                        {isImg ? <ImagePlus className="h-3 w-3" /> : <Paperclip className="h-3 w-3" />}
                      </div>
                      <span className="flex-1 text-[11px] truncate text-foreground">{att.fileName}</span>
                      {sizeMb && <span className="text-[9px] text-muted-foreground/50 flex-shrink-0">{sizeMb} MB</span>}
                      <a href={`/api/attachments/${att.id}/download`} download={att.fileName}
                        className="w-5 h-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
                        onClick={e => e.stopPropagation()}>
                        <Download className="h-3 w-3" />
                      </a>
                      <button onClick={() => deleteAttachmentMutation.mutate(att.id)}
                        className="w-5 h-5 flex items-center justify-center rounded text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            {!note?.id && (
              <p className="text-[10px] text-muted-foreground/40 italic">
                {lang === "ru" ? "Сохраните заметку, чтобы прикрепить файлы" : "Save the note first to attach files"}
              </p>
            )}
          </div>
        )}

        {/* Metadata panel */}
        <div className="border-t border-border/30 flex-shrink-0">
          <button onClick={() => setShowMeta(v => !v)}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition-colors">
            <Tag className="h-3 w-3 flex-shrink-0" />
            <span className="flex-1 text-left">
              {(type || status || tagInput || noteColor !== "none") ? (
                <span className="flex items-center gap-2 flex-wrap">
                  {type && activeType && <span className="flex items-center gap-1 font-medium" style={{ color: activeType.accent }}>
                    <activeType.icon className="h-2.5 w-2.5" />{s.types[type as keyof typeof s.types]}</span>}
                  {status && <span style={{ color: NOTE_STATUSES.find(st => st.value === status)?.color }}>
                    ● {s.statuses[status as keyof typeof s.statuses]}</span>}
                  {noteColor !== "none" && <span className="w-3 h-3 rounded-full inline-block border border-white/30"
                    style={{ background: NOTE_COLORS.find(c => c.value === noteColor)?.clip }} />}
                  {tagInput && <span className="text-muted-foreground/60">#{tagInput.split(",")[0]?.trim()}</span>}
                </span>
              ) : (
                lang === "ru" ? "Добавить тип, статус, цвет, теги…" :
                lang === "ua" ? "Додати тип, статус, колір, теги…" :
                "Add type, status, color, tags…"
              )}
            </span>
            {showMeta ? <ChevronUp className="h-3 w-3 flex-shrink-0" /> : <ChevronDown className="h-3 w-3 flex-shrink-0" />}
          </button>

          {showMeta && (
            <div className="px-4 pb-4 space-y-3 border-t border-border/20 pt-3 max-h-72 overflow-y-auto">
              {/* Color */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-2 text-muted-foreground/50 flex items-center gap-1.5">
                  <Palette className="h-2.5 w-2.5" />{s.colorLabel}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  {NOTE_COLORS.map(c => (
                    <button key={c.value} title={c.value === "none" ? s.colorNone : c.value}
                      onClick={() => setNoteColor(c.value)} className="transition-all hover:scale-110">
                      {c.value === "none" ? (
                        <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center",
                          noteColor === "none" ? "border-primary" : "border-border")}>
                          <X className="h-3 w-3 text-muted-foreground/50" />
                        </div>
                      ) : (
                        <div className={cn("w-6 h-6 rounded-full border-2 shadow-sm")}
                          style={{ background: c.clip, borderColor: noteColor === c.value ? c.clip : `${c.clip}50`,
                            boxShadow: noteColor === c.value ? `0 0 0 2px ${c.clip}40` : undefined,
                            transform: noteColor === c.value ? "scale(1.15)" : undefined }} />
                      )}
                    </button>
                  ))}
                </div>
              </div>

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
                      <t.icon className="h-2.5 w-2.5" />{s.types[t.value as keyof typeof s.types]}
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

              {/* Tags */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-2 text-muted-foreground/50">
                  {lang === "ru" ? "Хэштеги" : lang === "ua" ? "Хештеги" : "Hashtags"}
                </p>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/40 border border-border/40">
                  <Hash className="h-3 w-3 text-muted-foreground/50 flex-shrink-0" />
                  <input value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder={s.tagsPlaceholder}
                    className="flex-1 bg-transparent outline-none text-xs placeholder:text-muted-foreground/35"
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleSave(); } }} />
                </div>
              </div>

              {/* Note linking */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 flex items-center gap-1.5">
                    <Link className="h-2.5 w-2.5" />{s.linkNotes}
                    {linkedNoteIds.length > 0 && <span className="text-muted-foreground/40">({linkedNoteIds.length})</span>}
                  </p>
                  <button onClick={() => setShowNoteSearch(v => !v)}
                    className="text-[9px] px-1.5 py-0.5 rounded-md text-muted-foreground/60 hover:bg-secondary hover:text-foreground transition-colors">
                    {showNoteSearch ? "↑" : "+ Link"}
                  </button>
                </div>
                {linkedNotes.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {linkedNotes.map(n => {
                      const t = getType(n.type);
                      return (
                        <div key={n.id} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium border border-border/50 bg-secondary/30">
                          {t && <t.icon className="h-2.5 w-2.5" style={{ color: t.accent }} />}
                          <span className="truncate max-w-[100px] text-foreground">{n.title}</span>
                          <button onClick={() => toggleLinkedNote(n.id)} className="text-muted-foreground/40 hover:text-destructive ml-0.5">
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                {showNoteSearch && (
                  <div className="rounded-xl border border-border/50 overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border/30 bg-secondary/30">
                      <Search className="h-3 w-3 text-muted-foreground/50 flex-shrink-0" />
                      <input autoFocus value={noteSearch} onChange={e => setNoteSearch(e.target.value)}
                        placeholder={s.searchNotes}
                        className="flex-1 bg-transparent outline-none text-[11px] placeholder:text-muted-foreground/35" />
                    </div>
                    <div className="max-h-32 overflow-y-auto">
                      {filteredLinkableNotes.slice(0, 12).map(n => {
                        const t = getType(n.type);
                        const isLinked = linkedNoteIds.includes(n.id);
                        return (
                          <button key={n.id} onClick={() => toggleLinkedNote(n.id)}
                            className={cn("w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors",
                              isLinked ? "bg-primary/8 text-primary" : "hover:bg-secondary/50 text-foreground")}>
                            {t && <t.icon className="h-2.5 w-2.5" style={{ color: t.accent }} />}
                            <span className="flex-1 truncate text-[11px]">{n.title}</span>
                            {isLinked && <Check className="h-2.5 w-2.5 text-primary" />}
                          </button>
                        );
                      })}
                      {filteredLinkableNotes.length === 0 && (
                        <p className="px-3 py-2 text-[10px] text-muted-foreground/50 italic">{s.noResults}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────
export function NotesPanel({ bookId, aiPanelOpen, bookTitle }: { bookId: number; aiPanelOpen?: boolean; bookTitle?: string }) {
  const { toast } = useToast();
  const { lang } = useLang();
  const s = NOTES_I18N[lang];

  const [showDialog, setShowDialog] = useState(false);
  const [editNote, setEditNote] = useState<Note | undefined>();
  const [dialogPrefill, setDialogPrefill] = useState("");
  const [localOrder, setLocalOrder] = useState<number[] | null>(null);
  const [search, setSearch] = useState("");
  const [sidebarView, setSidebarView] = useState<string>("all");
  const [filterType, setFilterType] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [collectionsOpen, setCollectionsOpen] = useState(true);
  const [chainsOpen, setChainsOpen] = useState(true);
  const [showNewColInput, setShowNewColInput] = useState(false);
  const [newColName, setNewColName] = useState("");
  const [customCollections, setCustomCollections] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(`moodra_custom_cols_${bookId}`) || "[]"); } catch { return []; }
  });
  const [chains, setChains] = useState<NoteChain[]>(() => getChains(bookId));
  const [showChainManager, setShowChainManager] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(168);
  const sidebarContainerRef = useRef<HTMLDivElement>(null);
  const isDraggingSidebar = useRef(false);

  // Chain navigation via custom event
  useEffect(() => {
    const handler = (e: Event) => {
      const note = (e as CustomEvent).detail as Note;
      if (note) { setEditNote(note); setShowDialog(true); }
    };
    window.addEventListener("moodra:open-note", handler);
    return () => window.removeEventListener("moodra:open-note", handler);
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDraggingSidebar.current || !sidebarContainerRef.current) return;
      const parentLeft = sidebarContainerRef.current.getBoundingClientRect().left;
      setSidebarWidth(Math.max(130, Math.min(280, e.clientX - parentLeft)));
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
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "notes"] }); toast({ title: s.trashed }); },
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
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "notes", "trash"] }); toast({ title: s.deletedForever }); },
  });

  const pinMutation = useMutation({
    mutationFn: ({ id, isPinned }: { id: number; isPinned: string }) => apiRequest("PATCH", `/api/notes/${id}`, { isPinned }),
    onSuccess: (_, vars) => { queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "notes"] }); toast({ title: vars.isPinned === "true" ? s.toastPinned : s.toastUnpinned }); },
  });

  const collectionMutation = useMutation({
    mutationFn: ({ id, collection }: { id: number; collection: string }) => apiRequest("PATCH", `/api/notes/${id}`, { collection }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "notes"] }); },
  });

  const [captureText, setCaptureText] = useState("");
  const captureMutation = useMutation({
    mutationFn: (title: string) => apiRequest("POST", `/api/books/${bookId}/notes`, { title, content: "", type: "note", bookId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "notes"] });
      setCaptureText("");
    },
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const orderedNotes = localOrder
    ? localOrder.map(id => notes.find(n => n.id === id)).filter(Boolean) as Note[]
    : notes;

  const noteCollections = Array.from(new Set(notes.map(n => (n as any).collection).filter(Boolean))) as string[];
  const collections = Array.from(new Set([...customCollections, ...noteCollections]));

  const addCustomCollection = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || collections.includes(trimmed)) return;
    const updated = [...customCollections, trimmed];
    setCustomCollections(updated);
    try { localStorage.setItem(`moodra_custom_cols_${bookId}`, JSON.stringify(updated)); } catch {}
    setSidebarView(trimmed); setCollectionsOpen(true);
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

  const pinnedCount = notes.filter(n => (n as any).isPinned === "true").length;
  const searchLower = search.toLowerCase();

  // Determine notes to show based on sidebar view
  let displayNotes: Note[];
  if (sidebarView.startsWith("chain:")) {
    const chainId = sidebarView.slice(6);
    const chain = chains.find(c => c.id === chainId);
    displayNotes = chain ? chain.noteIds.map(id => notes.find(n => n.id === id)).filter(Boolean) as Note[] : [];
  } else {
    displayNotes = orderedNotes.filter(n => {
      if (sidebarView === "inbox" && (n as any).status !== "inbox") return false;
      if (sidebarView === "pinned" && (n as any).isPinned !== "true") return false;
      if (sidebarView !== "all" && sidebarView !== "inbox" && sidebarView !== "pinned" && sidebarView !== "trash") {
        if ((n as any).collection !== sidebarView) return false;
      }
      return true;
    });
  }

  const filtered = displayNotes.filter(n => {
    if (filterType !== "all" && n.type !== filterType) return false;
    if (searchLower && !(
      n.title.toLowerCase().includes(searchLower) ||
      (n.content || "").toLowerCase().includes(searchLower) ||
      (n.tags || "").toLowerCase().includes(searchLower)
    )) return false;
    return true;
  });

  const sorted = (sidebarView === "all" || sidebarView.startsWith("chain:"))
    ? sidebarView === "all"
      ? [...filtered].sort((a, b) => ((b as any).isPinned === "true" ? 1 : 0) - ((a as any).isPinned === "true" ? 1 : 0))
      : filtered // chain order preserved
    : filtered;

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    if (sidebarView.startsWith("chain:")) {
      // Reorder within chain
      const chainId = sidebarView.slice(6);
      const updated = chains.map(c => {
        if (c.id !== chainId) return c;
        const ids = [...c.noteIds];
        const from = ids.indexOf(active.id as number);
        const to = ids.indexOf(over.id as number);
        if (from < 0 || to < 0) return c;
        return { ...c, noteIds: arrayMove(ids, from, to) };
      });
      setChains(updated);
      saveChains(bookId, updated);
    } else {
      const ids = orderedNotes.map(n => n.id);
      setLocalOrder(arrayMove(ids, ids.indexOf(active.id as number), ids.indexOf(over.id as number)));
    }
  }, [orderedNotes, sidebarView, chains, bookId]);

  const isTrashView = sidebarView === "trash";
  const isEmptyView = filtered.length === 0 && notes.length === 0;
  const isEmptySearch = filtered.length === 0 && notes.length > 0;
  const gridCols = aiPanelOpen ? "grid-cols-3" : "grid-cols-4";

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-border flex-shrink-0">
        <div className="px-4 py-3 flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(249,109,28,0.12)" }}>
            <StickyNote className="h-3.5 w-3.5" style={{ color: "#F96D1C" }} />
          </div>
          <h2 className="font-bold text-sm flex-1">{s.title}</h2>
          <span className="text-[11px] text-muted-foreground/40">{s.count(notes.length)}</span>
          {!isTrashView && (
            <button onClick={() => { setEditNote(undefined); setDialogPrefill(""); setShowDialog(true); }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80 flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #F96D1C, #FB923C)", color: "#fff" }}>
              <Plus className="h-3 w-3" />{s.newBtn}
            </button>
          )}
        </div>
        {/* Quick-capture bar */}
        {!isTrashView && (
          <div className="px-4 pb-3">
            <div className="relative">
              <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/40" />
              <input
                value={captureText}
                onChange={e => setCaptureText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && captureText.trim()) {
                    captureMutation.mutate(captureText.trim());
                  }
                }}
                placeholder={s.quickCapture}
                className="w-full rounded-xl pl-8 pr-10 py-2 outline-none text-xs bg-secondary/50 border border-border/50 focus:border-primary/30 focus:bg-background/80 transition-all placeholder:text-muted-foreground/40"
              />
              {captureText && (
                <button
                  disabled={captureMutation.isPending}
                  onClick={() => { if (captureText.trim()) captureMutation.mutate(captureText.trim()); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg flex items-center justify-center transition-all"
                  style={{ background: "rgba(249,109,28,0.15)", color: "#F96D1C" }}
                >
                  {captureMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <ArrowRight className="h-3 w-3" />}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden" ref={sidebarContainerRef}>
        {/* Sidebar */}
        <div className="flex-shrink-0 border-r border-border/50 flex flex-col overflow-y-auto bg-background/50 py-2 relative" style={{ width: sidebarWidth }}>
          {/* Static views */}
          {[
            { id: "all", label: s.allNotes, icon: Layers, count: notes.length },
            { id: "pinned", label: s.pinned, icon: Pin, count: pinnedCount },
          ].map(item => (
            <button key={item.id} onClick={() => setSidebarView(item.id)}
              className={cn("w-full flex items-center gap-2 px-3 py-2 text-left text-xs transition-colors",
                sidebarView === item.id ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground")}>
              <item.icon className="h-3 w-3 flex-shrink-0" />
              <span className="flex-1 truncate">{item.label}</span>
              {item.count > 0 && <span className="text-[9px] px-1 rounded-full bg-muted text-muted-foreground">{item.count}</span>}
            </button>
          ))}

          {/* Collections */}
          <div className="mt-1 border-t border-border/40 pt-1">
            <div className="w-full flex items-center gap-1 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              <button onClick={() => setCollectionsOpen(!collectionsOpen)} className="flex items-center gap-1.5 flex-1 hover:text-muted-foreground transition-colors">
                <FolderOpen className="h-2.5 w-2.5" />
                <span className="flex-1 text-left">{s.collections}</span>
                {collectionsOpen ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />}
              </button>
              <button onClick={() => { setShowNewColInput(true); setCollectionsOpen(true); setNewColName(""); }}
                className="w-4 h-4 flex items-center justify-center rounded hover:bg-accent/60 text-muted-foreground/50 hover:text-foreground transition-colors flex-shrink-0">
                <Plus className="h-2.5 w-2.5" />
              </button>
            </div>
            {collectionsOpen && (
              <div>
                {showNewColInput && (
                  <div className="flex items-center gap-1 px-3 py-1">
                    <input autoFocus value={newColName} onChange={e => setNewColName(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") { addCustomCollection(newColName); setShowNewColInput(false); setNewColName(""); } if (e.key === "Escape") { setShowNewColInput(false); } }}
                      placeholder="Collection name…"
                      className="flex-1 text-[11px] bg-secondary/60 border border-primary/40 rounded-md px-2 py-0.5 outline-none" />
                    <button onClick={() => { addCustomCollection(newColName); setShowNewColInput(false); setNewColName(""); }}
                      className="w-5 h-5 flex items-center justify-center rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex-shrink-0">
                      <Check className="h-3 w-3" />
                    </button>
                  </div>
                )}
                {collections.map(col => (
                  <div key={col} className={cn("group w-full flex items-center gap-1 px-3 py-1.5 text-left text-xs transition-colors",
                    sidebarView === col ? "bg-primary/8 text-primary font-semibold" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground")}>
                    <button className="flex items-center gap-1.5 flex-1 min-w-0 text-left" onClick={() => setSidebarView(col)}>
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#F96D1C" }} />
                      <span className="truncate flex-1">{col}</span>
                      <span className="text-[9px] text-muted-foreground/50">{notes.filter(n => (n as any).collection === col).length}</span>
                    </button>
                    <button onClick={() => deleteCollection(col)}
                      className="w-3.5 h-3.5 flex items-center justify-center rounded opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:text-destructive transition-all flex-shrink-0">
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

          {/* Chains section */}
          <div className="mt-1 border-t border-border/40 pt-1">
            <div className="w-full flex items-center gap-1 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              <button onClick={() => setChainsOpen(!chainsOpen)} className="flex items-center gap-1.5 flex-1 hover:text-muted-foreground transition-colors">
                <LinkIcon className="h-2.5 w-2.5" />
                <span className="flex-1 text-left">{s.chains}</span>
                {chainsOpen ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />}
              </button>
              <button onClick={() => setShowChainManager(true)}
                className="w-4 h-4 flex items-center justify-center rounded hover:bg-accent/60 text-muted-foreground/50 hover:text-foreground transition-colors flex-shrink-0">
                <Plus className="h-2.5 w-2.5" />
              </button>
            </div>
            {chainsOpen && (
              <div>
                {chains.map(ch => (
                  <div key={ch.id}
                    className={cn("group w-full flex items-center gap-1 px-3 py-1.5 text-left text-xs transition-colors cursor-pointer",
                      sidebarView === `chain:${ch.id}` ? "font-semibold" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground")}
                    style={sidebarView === `chain:${ch.id}` ? { color: ch.color, background: `${ch.color}10` } : {}}>
                    <button className="flex items-center gap-1.5 flex-1 min-w-0 text-left" onClick={() => setSidebarView(`chain:${ch.id}`)}>
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: ch.color }} />
                      <span className="truncate flex-1">{ch.name}</span>
                      <span className="text-[9px] text-muted-foreground/50">{ch.noteIds.length}</span>
                    </button>
                  </div>
                ))}
                {chains.length === 0 && (
                  <p className="px-4 py-2 text-[10px] text-muted-foreground/50">{s.noChains}</p>
                )}
              </div>
            )}
          </div>

          {/* Trash */}
          <div className="mt-auto border-t border-border/40 pt-1">
            <button onClick={() => setSidebarView("trash")}
              className={cn("w-full flex items-center gap-2 px-3 py-2 text-left text-xs transition-colors",
                sidebarView === "trash" ? "bg-destructive/10 text-destructive font-semibold" : "text-muted-foreground/50 hover:bg-secondary/60 hover:text-muted-foreground")}>
              <Trash2 className="h-3 w-3 flex-shrink-0" />
              <span className="flex-1 truncate">{s.trash}</span>
            </button>
          </div>

          {/* Resize handle */}
          <div onMouseDown={e => { isDraggingSidebar.current = true; e.preventDefault(); }}
            className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors group">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-8 rounded-full bg-border/60 group-hover:bg-primary/40 transition-colors" />
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {isTrashView ? (
            <div className="flex-1 overflow-y-auto p-3">
              <div className="flex items-center gap-1.5 mb-3 text-xs text-muted-foreground">
                <AlertTriangle className="h-3 w-3" /><span>{s.trashDesc}</span>
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
                        <h4 className="font-medium text-[12px] truncate">{note.title}</h4>
                        {(note as any).deletedAt && <p className="text-[10px] text-muted-foreground/60">{format(new Date((note as any).deletedAt), "d MMM yyyy", { locale: DATE_LOCALES[lang] })}</p>}
                      </div>
                      <button onClick={() => restoreMutation.mutate(note.id)} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium text-primary hover:bg-primary/10 transition-colors flex-shrink-0">
                        <RotateCcw className="h-2.5 w-2.5" />{s.restore}
                      </button>
                      <button onClick={() => hardDeleteMutation.mutate(note.id)} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0">
                        <Trash2 className="h-2.5 w-2.5" />{s.deleteForever}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Chain view header */}
              {sidebarView.startsWith("chain:") && (() => {
                const ch = chains.find(c => c.id === sidebarView.slice(6));
                if (!ch) return null;
                return (
                  <div className="px-3 py-2 border-b border-border/30 flex items-center gap-2 flex-shrink-0"
                    style={{ background: `${ch.color}08` }}>
                    <LinkIcon className="h-3 w-3" style={{ color: ch.color }} />
                    <span className="text-[11px] font-semibold" style={{ color: ch.color }}>{ch.name}</span>
                    <span className="text-[10px] text-muted-foreground/50">· {ch.noteIds.length} notes · drag to reorder</span>
                    <button onClick={() => setShowChainManager(true)}
                      className="ml-auto text-[10px] px-2 py-0.5 rounded-md hover:bg-secondary text-muted-foreground/60 transition-colors">Edit chain</button>
                  </div>
                );
              })()}

              {/* Search + filter */}
              <div className="px-3 pt-2.5 pb-1.5 flex flex-col gap-1.5">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/50" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder={s.searchPlaceholder}
                    className="w-full rounded-lg pl-7 pr-7 py-1.5 outline-none text-xs bg-secondary/60 border border-transparent focus:border-primary/25 transition-all placeholder:text-muted-foreground/50" />
                  {search
                    ? <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground"><X className="h-3 w-3" /></button>
                    : <button onClick={() => setShowFilters(!showFilters)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground"><Filter className="h-3 w-3" /></button>
                  }
                </div>
                {showFilters && (
                  <div className="flex gap-1 overflow-x-auto pb-0.5">
                    <button onClick={() => setFilterType("all")} className="text-[9px] px-2 py-1 rounded-full whitespace-nowrap font-medium flex-shrink-0 transition-colors"
                      style={{ background: filterType === "all" ? "#F96D1C" : "transparent", color: filterType === "all" ? "#fff" : "#888", border: "1px solid", borderColor: filterType === "all" ? "#F96D1C" : "#e5e7eb" }}>
                      {s.all}
                    </button>
                    {NOTE_TYPES.map(t => (
                      <button key={t.value} onClick={() => setFilterType(t.value)} className="text-[9px] px-2 py-1 rounded-full whitespace-nowrap font-medium flex-shrink-0 flex items-center gap-0.5 transition-colors"
                        style={{ background: filterType === t.value ? `${t.accent}15` : "transparent", color: filterType === t.value ? t.accent : "#888", border: "1px solid", borderColor: filterType === t.value ? `${t.accent}40` : "#e5e7eb" }}>
                        <t.icon className="h-2 w-2" />{s.types[t.value as keyof typeof s.types]}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes grid */}
              <div className="flex-1 overflow-y-auto p-3">
                {isLoading ? (
                  <div className={`grid ${gridCols} gap-2`}>
                    {Array.from({ length: 8 }).map((_, i) => <div key={i} className="bg-muted animate-pulse rounded-xl aspect-square" />)}
                  </div>
                ) : isEmptyView ? (
                  <div className="flex flex-col items-center justify-center h-full min-h-[220px] py-8 px-4">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                      style={{ background: "linear-gradient(135deg, rgba(249,109,28,0.12), rgba(251,146,60,0.06))", border: "1px solid rgba(249,109,28,0.15)" }}>
                      <StickyNote className="h-7 w-7" style={{ color: "#F96D1C" }} />
                    </div>
                    <h3 className="font-semibold text-sm mb-1.5 text-center">{s.emptyTitle}</h3>
                    <p className="text-muted-foreground text-xs max-w-[180px] text-center leading-relaxed mb-4">{s.emptyDesc}</p>
                    <button
                      onClick={() => { setEditNote(undefined); setDialogPrefill(""); setShowDialog(true); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
                      style={{ background: "linear-gradient(135deg, #F96D1C, #FB923C)", color: "#fff" }}>
                      <Plus className="h-3 w-3" />{s.newBtn}
                    </button>
                  </div>
                ) : isEmptySearch ? (
                  <div className="text-center py-10">
                    <Search className="h-8 w-8 mx-auto mb-3 text-muted-foreground/20" />
                    <p className="text-muted-foreground text-sm">{s.noResults}</p>
                  </div>
                ) : (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={sorted.map(n => n.id)} strategy={rectSortingStrategy}>
                      <div className={`grid ${gridCols} gap-2`}>
                        {sorted.map(note => (
                          <NoteCard key={note.id} note={note} chains={chains}
                            collections={collections}
                            onEdit={n => { setEditNote(n); setDialogPrefill(""); setShowDialog(true); }}
                            onTrash={id => trashMutation.mutate(id)}
                            onPin={n => pinMutation.mutate({ id: n.id, isPinned: (n as any).isPinned === "true" ? "false" : "true" })}
                            onCollectionChange={(n, collection) => collectionMutation.mutate({ id: n.id, collection })} />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <NoteDialog
        open={showDialog}
        onClose={() => { setShowDialog(false); setEditNote(undefined); setDialogPrefill(""); }}
        bookId={bookId}
        bookTitle={bookTitle}
        note={editNote}
        prefillTitle={dialogPrefill}
        collections={collections}
        allNotes={notes}
        chains={chains}
      />

      <ChainManagerDialog
        open={showChainManager}
        onClose={() => setShowChainManager(false)}
        chains={chains}
        setChains={setChains}
        bookId={bookId}
        allNotes={notes}
        lang={lang}
      />
    </div>
  );
}
