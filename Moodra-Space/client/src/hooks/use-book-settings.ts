import { useState, useCallback } from "react";

export interface BookTypographySettings {
  pageSize: "A4" | "A5" | "B5";
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  paragraphSpacing: number;
  firstLineIndent: number;
  letterSpacing: number;
  textAlign: "justify" | "left";
  chapterBreak: boolean;
  h1Size: number;
  h2Size: number;
  h3Size: number;
  headerEnabled: boolean;
  headerLeft: string;
  headerRight: string;
  footerPageNumber: boolean;
  footerBookTitle: boolean;
  footerAlignment: "left" | "center" | "right" | "mirror";
  textDensity: number;
  layoutPreset: "classic" | "vibe" | "mono" | "modern";
}

export const DEFAULT_BOOK_SETTINGS: BookTypographySettings = {
  pageSize: "A5",
  marginTop: 20,
  marginBottom: 22,
  marginLeft: 20,
  marginRight: 16,
  fontFamily: "Georgia, 'Times New Roman', serif",
  fontSize: 11,
  lineHeight: 1.6,
  paragraphSpacing: 0.5,
  firstLineIndent: 1.2,
  letterSpacing: 0,
  textAlign: "justify",
  chapterBreak: true,
  h1Size: 22,
  h2Size: 16,
  h3Size: 13,
  headerEnabled: false,
  headerLeft: "",
  headerRight: "",
  footerPageNumber: true,
  footerBookTitle: false,
  footerAlignment: "center",
  textDensity: 0.88,
  layoutPreset: "classic",
};

export type LayoutPreset = BookTypographySettings["layoutPreset"];

export const LAYOUT_PRESETS: Record<LayoutPreset, Partial<BookTypographySettings>> = {
  classic: {
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontSize: 11,
    lineHeight: 1.6,
    paragraphSpacing: 0.5,
    firstLineIndent: 1.2,
    textAlign: "justify",
    h1Size: 22,
    h2Size: 16,
    h3Size: 13,
  },
  vibe: {
    fontFamily: "'Palatino Linotype', Palatino, serif",
    fontSize: 11.5,
    lineHeight: 1.75,
    paragraphSpacing: 0.8,
    firstLineIndent: 1.2,
    textAlign: "left",
    h1Size: 28,
    h2Size: 18,
    h3Size: 14,
  },
  mono: {
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: 10,
    lineHeight: 1.5,
    paragraphSpacing: 0.3,
    firstLineIndent: 1.2,
    textAlign: "left",
    h1Size: 18,
    h2Size: 14,
    h3Size: 12,
  },
  modern: {
    fontFamily: "Inter, 'Helvetica Neue', Arial, sans-serif",
    fontSize: 10.5,
    lineHeight: 1.7,
    paragraphSpacing: 0.6,
    firstLineIndent: 1.2,
    textAlign: "left",
    h1Size: 24,
    h2Size: 16,
    h3Size: 13,
  },
};

export function useBookSettings(bookId: number) {
  const key = `moodra_layout_settings_${bookId}`;

  const [settings, setSettings] = useState<BookTypographySettings>(() => {
    if (!bookId) return DEFAULT_BOOK_SETTINGS;
    const stored = localStorage.getItem(key);
    if (stored) {
      try { return { ...DEFAULT_BOOK_SETTINGS, ...JSON.parse(stored) }; } catch {}
    }
    return DEFAULT_BOOK_SETTINGS;
  });

  const update = useCallback((patch: Partial<BookTypographySettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...patch };
      localStorage.setItem(key, JSON.stringify(next));
      return next;
    });
  }, [key]);

  return { settings, update };
}
