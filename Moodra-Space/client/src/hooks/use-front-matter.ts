import { useState, useCallback } from "react";

export type TitlePagePreset = "classic" | "minimal" | "modern" | "bold";

export interface TitlePageSettings {
  enabled: boolean;
  useBookTitle: boolean;
  customTitle: string;
  subtitle: string;
  annotation: string;
  useBookAnnotation: boolean;
  author: string;
  publisherName: string;
  city: string;
  year: string;
  alignment: "left" | "center" | "right";
  decorativeStyle: "none" | "lines" | "ornament";
  titlePreset: TitlePagePreset;
  titleFontSize: number;
  subtitleFontSize: number;
  authorFontSize: number;
  annotationFontSize: number;
  elementSpacing: number;
  titleLineHeight: number;
}

export interface CopyrightPageSettings {
  enabled: boolean;
  annotation: string;
  useBookAnnotation: boolean;
  isbn: string;
  rights: string;
  editor: string;
  coverDesigner: string;
  publisher: string;
  copyrightYear: string;
  copyrightHolder: string;
  useBookAuthor: boolean;
  alignment: "left" | "center" | "right";
  fontSize: number;
  lineHeight: number;
}

export interface DedicationPageSettings {
  enabled: boolean;
  text: string;
  alignment: "left" | "center" | "right";
  verticalPosition: "top" | "center" | "bottom";
  fontSize: number;
  lineHeight: number;
}

export interface FrontMatterSettings {
  titlePage: TitlePageSettings;
  copyrightPage: CopyrightPageSettings;
  dedicationPage: DedicationPageSettings;
  tocEnabled: boolean;
}

export const TITLE_PAGE_PRESETS: Record<TitlePagePreset, Partial<TitlePageSettings>> = {
  classic: {
    alignment: "center",
    decorativeStyle: "lines",
    titleFontSize: 28,
    subtitleFontSize: 13,
    authorFontSize: 12,
    annotationFontSize: 10,
    elementSpacing: 1.2,
    titleLineHeight: 1.2,
  },
  minimal: {
    alignment: "left",
    decorativeStyle: "none",
    titleFontSize: 24,
    subtitleFontSize: 12,
    authorFontSize: 11,
    annotationFontSize: 10,
    elementSpacing: 0.8,
    titleLineHeight: 1.1,
  },
  modern: {
    alignment: "center",
    decorativeStyle: "ornament",
    titleFontSize: 32,
    subtitleFontSize: 14,
    authorFontSize: 12,
    annotationFontSize: 10,
    elementSpacing: 1.5,
    titleLineHeight: 1.15,
  },
  bold: {
    alignment: "center",
    decorativeStyle: "none",
    titleFontSize: 36,
    subtitleFontSize: 13,
    authorFontSize: 11,
    annotationFontSize: 10,
    elementSpacing: 1.0,
    titleLineHeight: 1.0,
  },
};

export const DEFAULT_FRONT_MATTER: FrontMatterSettings = {
  titlePage: {
    enabled: true,
    useBookTitle: true,
    customTitle: "",
    subtitle: "",
    annotation: "",
    useBookAnnotation: true,
    author: "",
    publisherName: "",
    city: "",
    year: new Date().getFullYear().toString(),
    alignment: "center",
    decorativeStyle: "lines",
    titlePreset: "classic",
    titleFontSize: 28,
    subtitleFontSize: 13,
    authorFontSize: 12,
    annotationFontSize: 10,
    elementSpacing: 1.2,
    titleLineHeight: 1.2,
  },
  copyrightPage: {
    enabled: false,
    annotation: "",
    useBookAnnotation: true,
    isbn: "",
    rights: "All rights reserved. No part of this book may be reproduced without written permission from the author.",
    editor: "",
    coverDesigner: "",
    publisher: "",
    copyrightYear: new Date().getFullYear().toString(),
    copyrightHolder: "",
    useBookAuthor: true,
    alignment: "left",
    fontSize: 9,
    lineHeight: 1.5,
  },
  dedicationPage: {
    enabled: false,
    text: "",
    alignment: "center",
    verticalPosition: "center",
    fontSize: 12,
    lineHeight: 1.8,
  },
  tocEnabled: true,
};

export function useFrontMatter(bookId: number) {
  const key = `moodra_front_matter_${bookId}`;

  const [frontMatter, setFrontMatter] = useState<FrontMatterSettings>(() => {
    if (!bookId) return DEFAULT_FRONT_MATTER;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return {
          ...DEFAULT_FRONT_MATTER,
          ...parsed,
          titlePage: { ...DEFAULT_FRONT_MATTER.titlePage, ...parsed.titlePage },
          copyrightPage: { ...DEFAULT_FRONT_MATTER.copyrightPage, ...parsed.copyrightPage },
          dedicationPage: { ...DEFAULT_FRONT_MATTER.dedicationPage, ...parsed.dedicationPage },
        };
      } catch {}
    }
    return DEFAULT_FRONT_MATTER;
  });

  const update = useCallback((patch: Partial<FrontMatterSettings>) => {
    setFrontMatter(prev => {
      const next = { ...prev, ...patch };
      localStorage.setItem(key, JSON.stringify(next));
      return next;
    });
  }, [key]);

  const updateTitlePage = useCallback((patch: Partial<TitlePageSettings>) => {
    setFrontMatter(prev => {
      const next = { ...prev, titlePage: { ...prev.titlePage, ...patch } };
      localStorage.setItem(key, JSON.stringify(next));
      return next;
    });
  }, [key]);

  const updateCopyrightPage = useCallback((patch: Partial<CopyrightPageSettings>) => {
    setFrontMatter(prev => {
      const next = { ...prev, copyrightPage: { ...prev.copyrightPage, ...patch } };
      localStorage.setItem(key, JSON.stringify(next));
      return next;
    });
  }, [key]);

  const updateDedicationPage = useCallback((patch: Partial<DedicationPageSettings>) => {
    setFrontMatter(prev => {
      const next = { ...prev, dedicationPage: { ...prev.dedicationPage, ...patch } };
      localStorage.setItem(key, JSON.stringify(next));
      return next;
    });
  }, [key]);

  return { frontMatter, update, updateTitlePage, updateCopyrightPage, updateDedicationPage };
}
