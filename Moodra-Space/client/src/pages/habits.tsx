import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Flame, Target, Trophy, CalendarDays, Plus, Check, BookOpen, Edit3, PenLine, X, ListTodo, Circle, CheckCircle2, Flag, Trash2 } from "lucide-react";
import { useLang } from "@/contexts/language-context";
import { LanguagePicker } from "@/components/language-picker";
import { SiteFooter } from "@/components/site-footer";
import { useAuth } from "@/hooks/use-auth";
import {
  useStreak, loadWritingLog, saveWritingLog, loadStreakGoal, saveStreakGoal,
  addPlannedEntry, addDayNote, deleteLogEntry, getTodayStr,
  type WritingLogEntry, type StreakGoal,
} from "@/hooks/use-streak";

const LANG_FLAG: Record<string, string> = {
  en: "🇬🇧", ru: "🇷🇺", ua: "🇺🇦", de: "🇩🇪",
  fr: "🇫🇷", es: "🇪🇸", it: "🇮🇹", pl: "🇵🇱",
  zh: "🇨🇳", ja: "🇯🇵", ko: "🇰🇷", pt: "🇧🇷",
};

// ─── To-Do helpers ────────────────────────────────────────────────────────────

interface TodoItem {
  id: string;
  text: string;
  done: boolean;
  priority: "normal" | "high";
  createdAt: string;
}

function todoKey(uid?: string | number) {
  return uid ? `moodra_todos_${uid}` : "moodra_todos";
}

function loadTodos(uid?: string | number): TodoItem[] {
  try { return JSON.parse(localStorage.getItem(todoKey(uid)) || "[]"); } catch { return []; }
}
function saveTodos(items: TodoItem[], uid?: string | number) {
  localStorage.setItem(todoKey(uid), JSON.stringify(items));
}

// ─── Calendar helpers ──────────────────────────────────────────────────────────

function getMonthDays(year: number, month: number): { date: string; dayOfWeek: number }[] {
  const days: { date: string; dayOfWeek: number }[] = [];
  const d = new Date(year, month, 1);
  while (d.getMonth() === month) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    days.push({ date: `${y}-${m}-${day}`, dayOfWeek: d.getDay() });
    d.setDate(d.getDate() + 1);
  }
  return days;
}

function formatDate(dateStr: string, lang: string): string {
  try {
    const d = new Date(dateStr + "T12:00:00");
    const locales: Record<string, string> = { en: "en-US", ru: "ru-RU", ua: "uk-UA", de: "de-DE" };
    return d.toLocaleDateString(locales[lang] || "en-US", { weekday: "long", day: "numeric", month: "long" });
  } catch {
    return dateStr;
  }
}

function formatMonth(year: number, month: number, lang: string): string {
  try {
    const d = new Date(year, month, 1);
    const locales: Record<string, string> = { en: "en-US", ru: "ru-RU", ua: "uk-UA", de: "de-DE" };
    return d.toLocaleDateString(locales[lang] || "en-US", { month: "long", year: "numeric" });
  } catch {
    return `${year}-${month + 1}`;
  }
}

const WEEKDAY_LABELS: Record<string, string[]> = {
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  ru: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
  ua: ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
  de: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
};

export default function HabitsPage() {
  const [, navigate] = useLocation();
  const { t, lang } = useLang();
  const h = t.habits;
  const { user } = useAuth();
  const uid = user?.id;
  const { streak } = useStreak(uid);

  const today = getTodayStr();
  const todayDate = new Date(today);
  const [viewYear, setViewYear] = useState(todayDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(todayDate.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [log, setLog] = useState<WritingLogEntry[]>([]);
  const [goal, setGoal] = useState<StreakGoal | null>(null);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalType, setGoalType] = useState<"words" | "chapters">("words");
  const [goalAmount, setGoalAmount] = useState(500);
  const [showNoteFor, setShowNoteFor] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState("");

  // ── To-Do state ─────────────────────────────────────────────────────────────
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [todoInput, setTodoInput] = useState("");
  const [todoPriority, setTodoPriority] = useState<"normal" | "high">("normal");
  const [showDone, setShowDone] = useState(false);
  const todoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTodos(loadTodos(uid));
  }, [uid]);

  const addTodo = () => {
    if (!todoInput.trim()) return;
    const item: TodoItem = {
      id: Math.random().toString(36).slice(2, 10),
      text: todoInput.trim(),
      done: false,
      priority: todoPriority,
      createdAt: new Date().toISOString(),
    };
    const updated = [item, ...todos];
    setTodos(updated);
    saveTodos(updated, uid);
    setTodoInput("");
    setTodoPriority("normal");
  };

  const toggleTodo = (id: string) => {
    const updated = todos.map(t => t.id === id ? { ...t, done: !t.done } : t);
    setTodos(updated);
    saveTodos(updated, uid);
  };

  const deleteTodo = (id: string) => {
    const updated = todos.filter(t => t.id !== id);
    setTodos(updated);
    saveTodos(updated, uid);
  };

  const clearDone = () => {
    const updated = todos.filter(t => !t.done);
    setTodos(updated);
    saveTodos(updated, uid);
  };
  // ────────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    setLog(loadWritingLog(uid));
    const g = loadStreakGoal(uid);
    setGoal(g);
    if (g) { setGoalType(g.type); setGoalAmount(g.amount); }
  }, [uid]);

  const days = getMonthDays(viewYear, viewMonth);
  const firstDayOfWeek = days[0]?.dayOfWeek ?? 0;

  const logByDate = new Map<string, WritingLogEntry[]>();
  log.forEach(entry => {
    const arr = logByDate.get(entry.date) || [];
    arr.push(entry);
    logByDate.set(entry.date, arr);
  });

  const hasActivity = (date: string) => {
    const entries = logByDate.get(date) || [];
    return entries.some(e => !e.planned);
  };

  const hasPlanned = (date: string) => {
    const entries = logByDate.get(date) || [];
    return entries.some(e => e.planned);
  };

  const isToday = (date: string) => date === today;
  const isFuture = (date: string) => date > today;

  const selectedEntries = selectedDate ? (logByDate.get(selectedDate) || []) : [];
  const selectedRealEntries = selectedEntries.filter(e => !e.planned);
  const selectedPlanned = selectedEntries.find(e => e.planned);

  const saveGoal = () => {
    const g: StreakGoal = { type: goalType, amount: goalAmount };
    saveStreakGoal(g, uid);
    setGoal(g);
    setShowGoalModal(false);
  };

  const removeGoal = () => {
    saveStreakGoal(null, uid);
    setGoal(null);
    setShowGoalModal(false);
  };

  const saveNote = (date: string) => {
    addDayNote(date, noteInput, uid);
    setLog(loadWritingLog(uid));
    setShowNoteFor(null);
    setNoteInput("");
  };

  const savePlanned = (date: string) => {
    addPlannedEntry(date, noteInput, uid);
    setLog(loadWritingLog(uid));
    setShowNoteFor(null);
    setNoteInput("");
  };

  const removeEntry = (entry: WritingLogEntry) => {
    deleteLogEntry(entry.date, !!entry.planned, entry.bookId, entry.chapterId, uid);
    setLog(loadWritingLog(uid));
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
    setSelectedDate(null);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
    setSelectedDate(null);
  };

  const goalDisplay = goal
    ? `${goal.amount} ${goal.type === "words"
      ? (lang === "ru" ? "слов" : lang === "ua" ? "слів" : lang === "de" ? "Wörter" : "words")
      : (lang === "ru" ? "глав" : lang === "ua" ? "розділів" : lang === "de" ? "Kapitel" : "chapters")
    }`
    : null;

  const weekdays = WEEKDAY_LABELS[lang] || WEEKDAY_LABELS.en;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "hsl(30, 58%, 97%)", fontFamily: "var(--font-sans)" }}>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b" style={{ background: "rgba(250,242,234,0.92)", backdropFilter: "blur(12px)", borderColor: "rgba(249,109,28,0.1)" }}>
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm font-medium transition-opacity hover:opacity-70" style={{ color: "#8a7a70" }}>
            <ArrowLeft className="w-4 h-4" />
            {t.common.back}
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <LanguagePicker size="sm" />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-8 space-y-8">

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Flame, value: streak.currentStreak, label: h.streakLabel, color: "#F96D1C", bg: "rgba(249,109,28,0.08)" },
            { icon: Trophy, value: streak.longestStreak, label: h.longestStreak, color: "#F59E0B", bg: "rgba(245,158,11,0.08)" },
            { icon: CalendarDays, value: streak.totalDaysWritten, label: h.totalDays, color: "#10B981", bg: "rgba(16,185,129,0.08)" },
          ].map(({ icon: Icon, value, label, color, bg }) => (
            <div key={label} className="rounded-2xl p-4 flex flex-col items-center gap-1" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-1" style={{ background: bg }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <span className="text-2xl font-bold" style={{ color: "#2d1a0e" }}>{value}</span>
              <span className="text-[11px] text-center" style={{ color: "#8a7a70" }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Goal card */}
        <div className="rounded-2xl p-5 flex items-center justify-between" style={{ background: "#fff", border: "1px solid rgba(249,109,28,0.12)", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(249,109,28,0.10)" }}>
              <Target className="w-4 h-4" style={{ color: "#F96D1C" }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "#2d1a0e" }}>{h.goalLabel}</p>
              <p className="text-xs" style={{ color: "#8a7a70" }}>
                {goalDisplay ? `${goalDisplay} / ${lang === "ru" ? "день" : lang === "ua" ? "день" : lang === "de" ? "Tag" : "day"}` : h.goalNone}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowGoalModal(true)}
            className="px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
            style={{ background: "rgba(249,109,28,0.10)", color: "#F96D1C" }}
          >
            {h.setGoal}
          </button>
        </div>

        {/* Calendar */}
        <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}>
          {/* Month nav */}
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
            <button onClick={prevMonth} className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:bg-black/5" style={{ color: "#8a7a70" }}>
              ‹
            </button>
            <span className="text-sm font-semibold capitalize" style={{ color: "#2d1a0e" }}>
              {formatMonth(viewYear, viewMonth, lang)}
            </span>
            <button onClick={nextMonth} className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:bg-black/5" style={{ color: "#8a7a70" }}>
              ›
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 px-3 pt-3">
            {weekdays.map(wd => (
              <div key={wd} className="text-center text-[11px] font-semibold pb-2" style={{ color: "#c0b0a0" }}>{wd}</div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-0.5 px-3 pb-4">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`empty-${i}`} />)}
            {days.map(({ date }) => {
              const active = hasActivity(date);
              const planned = !active && hasPlanned(date);
              const todayFlag = isToday(date);
              const futureFlag = isFuture(date);
              const selected = selectedDate === date;
              const dayNum = parseInt(date.slice(8));

              return (
                <button
                  key={date}
                  onClick={() => setSelectedDate(selected ? null : date)}
                  className="relative flex flex-col items-center justify-center rounded-xl py-2 transition-all"
                  style={{
                    background: selected
                      ? "#F96D1C"
                      : active
                      ? "rgba(249,109,28,0.12)"
                      : todayFlag
                      ? "rgba(249,109,28,0.06)"
                      : "transparent",
                    outline: todayFlag && !selected ? "2px solid rgba(249,109,28,0.3)" : "none",
                  }}
                >
                  <span
                    className="text-sm font-medium"
                    style={{
                      color: selected ? "#fff" : active ? "#F96D1C" : futureFlag ? "#c0b0a0" : "#2d1a0e",
                      fontWeight: todayFlag ? 700 : 500,
                    }}
                  >
                    {dayNum}
                  </span>
                  <div className="flex gap-0.5 mt-0.5 h-1">
                    {active && <div className="w-1 h-1 rounded-full" style={{ background: selected ? "rgba(255,255,255,0.7)" : "#F96D1C" }} />}
                    {planned && <div className="w-1 h-1 rounded-full" style={{ background: "#3B82F6", opacity: 0.6 }} />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected day detail */}
        {selectedDate && (
          <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: "1px solid rgba(249,109,28,0.15)", boxShadow: "0 2px 16px rgba(249,109,28,0.08)" }}>
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "rgba(249,109,28,0.1)", background: "rgba(249,109,28,0.04)" }}>
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4" style={{ color: "#F96D1C" }} />
                <span className="text-sm font-semibold capitalize" style={{ color: "#2d1a0e" }}>
                  {formatDate(selectedDate, lang)}
                </span>
              </div>
              {isToday(selectedDate) && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(249,109,28,0.15)", color: "#F96D1C" }}>
                  {h.today}
                </span>
              )}
            </div>

            <div className="p-5 space-y-4">
              {/* Real entries */}
              {selectedRealEntries.length === 0 && !selectedPlanned && (
                <p className="text-sm" style={{ color: "#8a7a70" }}>{h.noActivity}</p>
              )}

              {selectedRealEntries.map((entry, i) => (
                <div key={i} className="flex items-start gap-3 group">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "rgba(249,109,28,0.10)" }}>
                    {entry.action === "wrote" ? <PenLine className="w-3.5 h-3.5" style={{ color: "#F96D1C" }} /> :
                     entry.action === "edited" ? <Edit3 className="w-3.5 h-3.5" style={{ color: "#F96D1C" }} /> :
                     <Plus className="w-3.5 h-3.5" style={{ color: "#F96D1C" }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        {entry.bookTitle && <p className="text-sm font-medium" style={{ color: "#2d1a0e" }}>{entry.bookTitle}</p>}
                        {entry.chapterTitle && <p className="text-xs" style={{ color: "#8a7a70" }}>{entry.chapterTitle}</p>}
                      </div>
                      <button
                        onClick={() => removeEntry(entry)}
                        className="flex-shrink-0 opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-lg transition-all hover:bg-red-50"
                        style={{ color: "#c0b0a0" }}
                        title={lang === "ru" ? "Удалить" : lang === "ua" ? "Видалити" : "Delete"}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span className="text-[11px] capitalize px-2 py-0.5 rounded-full" style={{ background: "rgba(249,109,28,0.08)", color: "#c47040" }}>
                        {h[entry.action as keyof typeof h] || entry.action}
                      </span>
                      {entry.wordCount != null && entry.wordCount > 0 && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: "rgba(16,185,129,0.08)", color: "#059669" }}>
                          {entry.wordCount.toLocaleString()} {lang === "ru" ? "сл." : lang === "ua" ? "сл." : lang === "de" ? "Wörter" : "words"}
                        </span>
                      )}
                      {entry.language && LANG_FLAG[entry.language] && (
                        <span className="text-[13px]" title={entry.language.toUpperCase()}>{LANG_FLAG[entry.language]}</span>
                      )}
                    </div>
                    {entry.note && (
                      <p className="text-sm mt-1 italic" style={{ color: "#6b5a50" }}>"{entry.note}"</p>
                    )}
                  </div>
                </div>
              ))}

              {/* Planned entry */}
              {selectedPlanned && (
                <div className="flex items-start gap-3 p-3 rounded-xl group" style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)" }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(59,130,246,0.12)" }}>
                    <CalendarDays className="w-3.5 h-3.5" style={{ color: "#3B82F6" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold" style={{ color: "#3B82F6" }}>{h.planned}</p>
                      <button
                        onClick={() => removeEntry(selectedPlanned)}
                        className="flex-shrink-0 opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-lg transition-all hover:bg-red-50"
                        style={{ color: "#c0b0a0" }}
                        title={lang === "ru" ? "Удалить" : lang === "ua" ? "Видалити" : "Delete"}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {selectedPlanned.plannedNote && <p className="text-sm mt-0.5" style={{ color: "#2d1a0e" }}>{selectedPlanned.plannedNote}</p>}
                  </div>
                </div>
              )}

              {/* Add note / plan buttons */}
              {showNoteFor === selectedDate ? (
                <div className="space-y-2">
                  <textarea
                    autoFocus
                    value={noteInput}
                    onChange={e => setNoteInput(e.target.value)}
                    placeholder={h.notePlaceholder}
                    rows={3}
                    className="w-full p-3 text-sm rounded-xl border outline-none resize-none"
                    style={{ background: "hsl(30,58%,98%)", borderColor: "rgba(249,109,28,0.2)", color: "#2d1a0e" }}
                    onFocus={e => (e.target.style.borderColor = "rgba(249,109,28,0.4)")}
                    onBlur={e => (e.target.style.borderColor = "rgba(249,109,28,0.2)")}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => isFuture(selectedDate) ? savePlanned(selectedDate) : saveNote(selectedDate)}
                      className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                      style={{ background: "#F96D1C", color: "#fff" }}
                    >
                      {h.save}
                    </button>
                    <button
                      onClick={() => { setShowNoteFor(null); setNoteInput(""); }}
                      className="px-4 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-70"
                      style={{ background: "rgba(0,0,0,0.06)", color: "#6b5a50" }}
                    >
                      {t.common.cancel}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 pt-1">
                  {!isFuture(selectedDate) && (
                    <button
                      onClick={() => {
                        const existing = selectedRealEntries.find(e => e.note);
                        setNoteInput(existing?.note || "");
                        setShowNoteFor(selectedDate);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all hover:opacity-80"
                      style={{ background: "rgba(249,109,28,0.08)", color: "#c47040" }}
                    >
                      <PenLine className="w-3 h-3" />
                      {h.addNote}
                    </button>
                  )}
                  {isFuture(selectedDate) && (
                    <button
                      onClick={() => {
                        setNoteInput(selectedPlanned?.plannedNote || "");
                        setShowNoteFor(selectedDate);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all hover:opacity-80"
                      style={{ background: "rgba(59,130,246,0.08)", color: "#3B82F6" }}
                    >
                      <CalendarDays className="w-3 h-3" />
                      {h.planSession}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── To-Do Section ───────────────────────────────────────────────────── */}
        {(() => {
          const activeTodos = todos.filter(t => !t.done);
          const doneTodos = todos.filter(t => t.done);
          const todoLabels: Record<string, Record<string, string>> = {
            en: { title: "To-Do", add: "Add task…", placeholder: "What do you want to accomplish?", markHigh: "High priority", done: "Done", noDone: "No completed tasks", noTasks: "Your to-do list is empty", clearDone: "Clear done", showDone: "Show done", hideDone: "Hide done" },
            ru: { title: "Задачи", add: "Добавить задачу…", placeholder: "Что нужно сделать?", markHigh: "Приоритет", done: "Выполнено", noDone: "Нет выполненных задач", noTasks: "Список задач пуст", clearDone: "Очистить выполненные", showDone: "Показать выполненные", hideDone: "Скрыть выполненные" },
            ua: { title: "Завдання", add: "Додати завдання…", placeholder: "Що потрібно зробити?", markHigh: "Пріоритет", done: "Виконано", noDone: "Немає виконаних завдань", noTasks: "Список завдань порожній", clearDone: "Очистити виконані", showDone: "Показати виконані", hideDone: "Сховати виконані" },
            de: { title: "Aufgaben", add: "Aufgabe hinzufügen…", placeholder: "Was möchtest du erledigen?", markHigh: "Hohe Priorität", done: "Erledigt", noDone: "Keine erledigten Aufgaben", noTasks: "Aufgabenliste ist leer", clearDone: "Erledigte löschen", showDone: "Erledigte anzeigen", hideDone: "Erledigte ausblenden" },
          };
          const tl = todoLabels[lang] || todoLabels.en;

          return (
            <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}>
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: "rgba(99,102,241,0.10)" }}>
                    <ListTodo className="w-3.5 h-3.5" style={{ color: "#6366F1" }} />
                  </div>
                  <span className="text-sm font-bold" style={{ color: "#2d1a0e" }}>{tl.title}</span>
                  {activeTodos.length > 0 && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(99,102,241,0.12)", color: "#6366F1" }}>
                      {activeTodos.length}
                    </span>
                  )}
                </div>
                {doneTodos.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowDone(v => !v)}
                      className="text-[11px] font-medium transition-all hover:opacity-70"
                      style={{ color: "#8a7a70" }}
                    >
                      {showDone ? tl.hideDone : `${tl.showDone} (${doneTodos.length})`}
                    </button>
                    {showDone && (
                      <button
                        onClick={clearDone}
                        className="text-[11px] font-medium transition-all hover:opacity-70 flex items-center gap-1"
                        style={{ color: "#ef4444" }}
                      >
                        <Trash2 className="w-3 h-3" /> {tl.clearDone}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Add input */}
              <div className="px-4 py-3 border-b" style={{ borderColor: "rgba(0,0,0,0.04)", background: "rgba(99,102,241,0.02)" }}>
                <div className="flex gap-2 items-center">
                  <button
                    onClick={() => setTodoPriority(p => p === "high" ? "normal" : "high")}
                    title={tl.markHigh}
                    className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg transition-all hover:opacity-80"
                    style={{ background: todoPriority === "high" ? "rgba(239,68,68,0.12)" : "rgba(0,0,0,0.05)" }}
                  >
                    <Flag className="w-3 h-3" style={{ color: todoPriority === "high" ? "#ef4444" : "#c0b0a0" }} />
                  </button>
                  <input
                    ref={todoInputRef}
                    value={todoInput}
                    onChange={e => setTodoInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") addTodo(); }}
                    placeholder={tl.placeholder}
                    className="flex-1 h-9 px-3 text-sm rounded-xl border outline-none transition-colors"
                    style={{ background: "#fff", borderColor: "rgba(99,102,241,0.2)", color: "#2d1a0e" }}
                    onFocus={e => (e.target.style.borderColor = "#6366F1")}
                    onBlur={e => (e.target.style.borderColor = "rgba(99,102,241,0.2)")}
                  />
                  <button
                    onClick={addTodo}
                    disabled={!todoInput.trim()}
                    className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl transition-all disabled:opacity-30"
                    style={{ background: "rgba(99,102,241,0.12)", color: "#6366F1" }}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Active tasks */}
              <div className="p-3 space-y-1">
                {activeTodos.length === 0 && doneTodos.length === 0 && (
                  <p className="text-xs text-center py-4" style={{ color: "#c0b0a0" }}>{tl.noTasks}</p>
                )}
                {activeTodos.map(item => (
                  <div key={item.id}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all group hover:bg-black/[0.025]">
                    <button onClick={() => toggleTodo(item.id)} className="flex-shrink-0 transition-all hover:scale-110">
                      <Circle className="w-4 h-4" style={{ color: item.priority === "high" ? "#ef4444" : "#c0b0a0" }} />
                    </button>
                    {item.priority === "high" && (
                      <Flag className="w-2.5 h-2.5 flex-shrink-0" style={{ color: "#ef4444" }} />
                    )}
                    <span className="flex-1 text-sm" style={{ color: "#2d1a0e" }}>{item.text}</span>
                    <button
                      onClick={() => deleteTodo(item.id)}
                      className="opacity-0 group-hover:opacity-100 flex-shrink-0 transition-all hover:text-red-500"
                      style={{ color: "#c0b0a0" }}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {/* Done tasks */}
                {showDone && doneTodos.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 px-2 pt-2 pb-1">
                      <div className="h-px flex-1" style={{ background: "rgba(0,0,0,0.06)" }} />
                      <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#c0b0a0" }}>{tl.done}</span>
                      <div className="h-px flex-1" style={{ background: "rgba(0,0,0,0.06)" }} />
                    </div>
                    {doneTodos.map(item => (
                      <div key={item.id}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all group hover:bg-black/[0.02] opacity-50">
                        <button onClick={() => toggleTodo(item.id)} className="flex-shrink-0 transition-all hover:scale-110">
                          <CheckCircle2 className="w-4 h-4" style={{ color: "#10B981" }} />
                        </button>
                        <span className="flex-1 text-sm line-through" style={{ color: "#8a7a70" }}>{item.text}</span>
                        <button
                          onClick={() => deleteTodo(item.id)}
                          className="opacity-0 group-hover:opacity-100 flex-shrink-0 transition-all hover:text-red-500"
                          style={{ color: "#c0b0a0" }}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          );
        })()}

        {/* Recent activity list */}
        <div>
          <h2 className="text-base font-bold mb-4" style={{ color: "#2d1a0e" }}>{h.monthActivity}</h2>
          {log.filter(e => !e.planned && e.date.startsWith(`${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`)).length === 0 ? (
            <div className="text-center py-12 rounded-2xl" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.06)" }}>
              <BookOpen className="w-8 h-8 mx-auto mb-3" style={{ color: "#c0b0a0" }} />
              <p className="text-sm font-medium mb-1" style={{ color: "#8a7a70" }}>{h.noEntries}</p>
              <p className="text-xs" style={{ color: "#c0b0a0" }}>{h.noEntriesHint}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {log
                .filter(e => !e.planned && e.date.startsWith(`${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`))
                .slice(0, 30)
                .map((entry, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all hover:shadow-sm group"
                    style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.06)" }}
                    onClick={() => setSelectedDate(entry.date)}
                  >
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(249,109,28,0.09)" }}>
                      <Flame className="w-3.5 h-3.5" style={{ color: "#F96D1C" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "#2d1a0e" }}>
                        {entry.bookTitle || h.wrote}
                      </p>
                      {entry.chapterTitle && (
                        <p className="text-xs truncate" style={{ color: "#8a7a70" }}>{entry.chapterTitle}</p>
                      )}
                      {(entry.wordCount != null && entry.wordCount > 0 || entry.language) && (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {entry.wordCount != null && entry.wordCount > 0 && (
                            <span className="text-[11px] px-1.5 py-0.5 rounded-md" style={{ background: "rgba(16,185,129,0.08)", color: "#059669" }}>
                              {entry.wordCount.toLocaleString()} {lang === "ru" || lang === "ua" ? "сл." : lang === "de" ? "W." : "w."}
                            </span>
                          )}
                          {entry.language && LANG_FLAG[entry.language] && (
                            <span className="text-[12px]" title={entry.language.toUpperCase()}>{LANG_FLAG[entry.language]}</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs" style={{ color: "#c0b0a0" }}>
                        {entry.date.slice(5)}
                      </span>
                      <button
                        onClick={e => { e.stopPropagation(); removeEntry(entry); }}
                        className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-lg transition-all hover:bg-red-50"
                        style={{ color: "#c0b0a0" }}
                        title={lang === "ru" ? "Удалить" : lang === "ua" ? "Видалити" : "Delete"}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </main>

      <SiteFooter />

      {/* Goal modal */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[3px] px-6" onClick={() => setShowGoalModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-5">
              <Target className="w-5 h-5" style={{ color: "#F96D1C" }} />
              <h3 className="text-lg font-bold" style={{ color: "#2d1a0e" }}>{h.setGoal}</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide block mb-2" style={{ color: "#8a7a70" }}>{h.goalType}</label>
                <div className="flex gap-2">
                  {(["words", "chapters"] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setGoalType(type)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                      style={{
                        background: goalType === type ? "#F96D1C" : "rgba(249,109,28,0.07)",
                        color: goalType === type ? "#fff" : "#8a7a70",
                      }}
                    >
                      {type === "words" ? h.words : h.chapters}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wide block mb-2" style={{ color: "#8a7a70" }}>{h.goalAmount}</label>
                <input
                  type="number"
                  value={goalAmount}
                  onChange={e => setGoalAmount(Math.max(1, parseInt(e.target.value) || 1))}
                  min={1}
                  className="w-full h-10 px-3 text-sm rounded-xl border outline-none"
                  style={{ background: "hsl(30,58%,98%)", borderColor: "rgba(249,109,28,0.2)", color: "#2d1a0e" }}
                  onFocus={e => (e.target.style.borderColor = "#F96D1C")}
                  onBlur={e => (e.target.style.borderColor = "rgba(249,109,28,0.2)")}
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button onClick={saveGoal} className="flex-1 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-all" style={{ background: "#F96D1C", color: "#fff" }}>
                  {h.saveGoal}
                </button>
                {goal && (
                  <button onClick={removeGoal} className="px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-80 transition-all" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
                    ✕
                  </button>
                )}
                <button onClick={() => setShowGoalModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium hover:opacity-70 transition-all" style={{ background: "rgba(0,0,0,0.05)", color: "#6b5a50" }}>
                  {h.cancelGoal}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
