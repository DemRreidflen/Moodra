import { useState, useCallback, useEffect } from "react";

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastWriteDate: string | null;
  totalDaysWritten: number;
  wroteTodayAlready: boolean;
}

export interface StreakGoal {
  type: "words" | "chapters";
  amount: number;
}

export interface WritingLogEntry {
  date: string;
  bookId?: number;
  bookTitle?: string;
  chapterId?: number;
  chapterTitle?: string;
  action: "wrote" | "edited" | "created";
  note?: string;
  planned?: boolean;
  plannedNote?: string;
}

const storageKey = (uid?: string | number) =>
  uid ? `moodra_streak_v2_${uid}` : "moodra_streak_v2";
const goalKey = (uid?: string | number) =>
  uid ? `moodra_streak_goal_${uid}` : "moodra_streak_goal";
const logKey = (uid?: string | number) =>
  uid ? `moodra_writing_log_v2_${uid}` : "moodra_writing_log_v2";

export const GOAL_KEY = "moodra_streak_goal";
export const LOG_KEY = "moodra_writing_log_v2";

export function getTodayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isYesterday(dateStr: string): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const y = yesterday.getFullYear();
  const m = String(yesterday.getMonth() + 1).padStart(2, "0");
  const day = String(yesterday.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}` === dateStr;
}

function loadStreak(uid?: string | number): StreakData & { _raw: any } {
  try {
    const raw = JSON.parse(localStorage.getItem(storageKey(uid)) || "{}");
    const today = getTodayStr();
    const lastDate = raw.lastWriteDate || null;
    let current = raw.currentStreak || 0;

    if (lastDate === today) {
    } else if (lastDate && isYesterday(lastDate)) {
    } else if (lastDate) {
      current = 0;
    }

    return {
      currentStreak: current,
      longestStreak: raw.longestStreak || 0,
      lastWriteDate: lastDate,
      totalDaysWritten: raw.totalDaysWritten || 0,
      wroteTodayAlready: lastDate === today,
      _raw: raw,
    };
  } catch {
    return { currentStreak: 0, longestStreak: 0, lastWriteDate: null, totalDaysWritten: 0, wroteTodayAlready: false, _raw: {} };
  }
}

export function loadWritingLog(uid?: string | number): WritingLogEntry[] {
  try {
    return JSON.parse(localStorage.getItem(logKey(uid)) || "[]");
  } catch {
    return [];
  }
}

export function saveWritingLog(log: WritingLogEntry[], uid?: string | number): void {
  try {
    localStorage.setItem(logKey(uid), JSON.stringify(log));
  } catch {}
}

export function loadStreakGoal(uid?: string | number): StreakGoal | null {
  try {
    return JSON.parse(localStorage.getItem(goalKey(uid)) || "null");
  } catch {
    return null;
  }
}

export function saveStreakGoal(goal: StreakGoal | null, uid?: string | number): void {
  try {
    if (goal) localStorage.setItem(goalKey(uid), JSON.stringify(goal));
    else localStorage.removeItem(goalKey(uid));
  } catch {}
}

export function addLogEntry(entry: Omit<WritingLogEntry, "date"> & { date?: string }, uid?: string | number): void {
  const log = loadWritingLog(uid);
  const today = entry.date || getTodayStr();
  const existing = log.findIndex(
    e => e.date === today && !e.planned && e.bookId === entry.bookId && e.chapterId === entry.chapterId
  );
  if (existing >= 0) {
    log[existing] = { ...log[existing], ...entry, date: today };
  } else {
    log.unshift({ ...entry, date: today } as WritingLogEntry);
  }
  saveWritingLog(log.slice(0, 365), uid);
}

export function addPlannedEntry(date: string, note: string, uid?: string | number): void {
  const log = loadWritingLog(uid);
  const existing = log.findIndex(e => e.date === date && e.planned);
  if (existing >= 0) {
    if (note.trim()) {
      log[existing] = { ...log[existing], plannedNote: note, date };
    } else {
      log.splice(existing, 1);
    }
  } else if (note.trim()) {
    log.unshift({ date, planned: true, plannedNote: note, action: "wrote" });
  }
  saveWritingLog(log.slice(0, 365), uid);
}

export function addDayNote(date: string, note: string, uid?: string | number): void {
  const log = loadWritingLog(uid);
  const existing = log.findIndex(e => e.date === date && !e.planned);
  if (existing >= 0) {
    log[existing] = { ...log[existing], note };
  } else {
    log.unshift({ date, note, action: "wrote" } as WritingLogEntry);
  }
  saveWritingLog(log.slice(0, 365), uid);
}

export function useStreak(uid?: string | number) {
  const [streak, setStreak] = useState<StreakData>(() => {
    const { _raw, ...s } = loadStreak(uid);
    return s;
  });

  const recordWriting = useCallback((ctx?: {
    bookId?: number;
    bookTitle?: string;
    chapterId?: number;
    chapterTitle?: string;
  }) => {
    const { _raw, ...current } = loadStreak(uid);

    if (!current.wroteTodayAlready) {
      const today = getTodayStr();
      const newStreak = current.lastWriteDate && isYesterday(current.lastWriteDate)
        ? current.currentStreak + 1
        : 1;

      const newData = {
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, current.longestStreak),
        lastWriteDate: today,
        totalDaysWritten: current.totalDaysWritten + 1,
        wroteTodayAlready: true,
      };

      localStorage.setItem(storageKey(uid), JSON.stringify(newData));
      setStreak(newData);
    }

    if (ctx?.bookId) {
      addLogEntry({
        bookId: ctx.bookId,
        bookTitle: ctx.bookTitle,
        chapterId: ctx.chapterId,
        chapterTitle: ctx.chapterTitle,
        action: "wrote",
      }, uid);
    }
  }, [uid]);

  useEffect(() => {
    const { _raw, ...s } = loadStreak(uid);
    setStreak(s);
  }, [uid]);

  return { streak, recordWriting };
}
