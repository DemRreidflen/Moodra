import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { createRequire } from "module";
const _cjsRequire = createRequire(import.meta.url);
const Hypher = _cjsRequire("hypher");
const _hyphenPatternRu = _cjsRequire("hyphenation.ru");
const _hyphenPatternUk = _cjsRequire("hyphenation.uk");
import { storage } from "./storage";
import { insertBookSchema, insertChapterSchema, insertCharacterSchema, insertNoteSchema, insertSourceSchema, insertHypothesisSchema, insertDraftSchema, insertNoteCollectionSchema, insertAuthorRoleModelSchema } from "@shared/schema";
import { assembleNoteContext, buildStructuredPrompt } from "./promptEngine";
import { generateAndStoreEmbedding, findRelevantModels, buildEmbeddingText } from "./embeddings";
import OpenAI from "openai";
import multer from "multer";
import path from "path";
import fs from "fs";
import { isAuthenticated } from "./replit_integrations/auth/replitAuth";
import { authStorage } from "./replit_integrations/auth/storage";
import JSZip from "jszip";
import { Document, Paragraph, HeadingLevel, TextRun, PageBreak, Header, Footer, AlignmentType, PageNumber, NumberFormat, convertInchesToTwip, LineRuleType, BorderStyle } from "docx";

function getUserId(req: Request): string {
  return (req.user as any)?.id as string;
}

// ─── PDF Hyphenation helpers (RU / UK only) ──────────────────────────────────
// Hypher instances are created once at module level for performance.
// English and German use CSS hyphens:auto and are not preprocessed here.
const _hypherRu = new Hypher(_hyphenPatternRu);
const _hypherUk = new Hypher(_hyphenPatternUk);

/**
 * Returns true if the given raw book-language string is Cyrillic (ru or uk).
 * Internally the app stores Ukrainian as "ua"; BCP-47 "uk" also accepted.
 */
function isCyrillicLang(lang: string): lang is "ru" | "uk" | "ua" {
  return lang === "ru" || lang === "uk" || lang === "ua";
}

/** Normalise internal lang codes to hypher lang keys */
function normalisePdfLang(lang: string): "ru" | "uk" | null {
  if (lang === "ru") return "ru";
  if (lang === "uk" || lang === "ua") return "uk";
  return null;
}

/**
 * Hyphenate a plain-text string, inserting U+00AD soft hyphens.
 * Skips:
 *   - strings that already contain soft hyphens
 *   - URLs, emails, file paths, code-like tokens
 *   - very short words (< 5 characters)
 */
function hyphenateTextContent(text: string, lang: "ru" | "uk"): string {
  if (!text || text.includes("\u00AD")) return text;
  const h = lang === "ru" ? _hypherRu : _hypherUk;
  // hyphenateText(str, minLength) — minLength is min word length to hyphenate (default 4).
  // We use 5 to skip very short words like "было", "если", etc.
  return h.hyphenateText(text, 5);
}

/**
 * Walk through an HTML fragment and hyphenate only text nodes.
 * Preserves all tags, attributes, and non-text content untouched.
 * Skips strings that contain URLs or look like code/paths.
 *
 * Demo:
 *   RU: "Это длинное слово должно корректно переноситься в конце строки."
 *       → "Это длин­ное сло­во долж­но кор­рект­но пе­ре­но­сить­ся в кон­це стро­ки."
 *   UK: "Найдовше слово має коректно переноситися наприкінці рядка."
 *       → "Най­дов­ше сло­во має ко­рект­но пе­ре­но­си­ти­ся на­при­кін­ці ряд­ка."
 */
function hyphenateHtmlContent(html: string, lang: "ru" | "uk"): string {
  if (!html || html.includes("\u00AD")) return html;
  // Replace text nodes: content that is NOT inside a tag.
  // Regex captures: (closing>) (text node) (<opening or end)
  return html.replace(/(>|^)([^<]+)(?=<|$)/g, (_match, before, textNode) => {
    const trimmed = textNode.trim();
    // Skip empty, URLs, emails, code-like, file paths
    if (
      !trimmed ||
      /https?:\/\//.test(trimmed) ||
      /\S+@\S+\.\S+/.test(trimmed) ||
      /[\/\\]/.test(trimmed)
    ) {
      return before + textNode;
    }
    return before + hyphenateTextContent(textNode, lang);
  });
}
// ─────────────────────────────────────────────────────────────────────────────

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only images allowed"));
  },
});

const uploadText = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = [".epub", ".txt", ".md", ".text"];
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error("Only EPUB or text files are supported"));
  },
});

const ALLOWED_MODELS = ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini", "gpt-4.1", "o4-mini", "gpt-3.5-turbo", "gpt-4-turbo"];
const DEFAULT_MODEL = "gpt-4o-mini";

async function getOpenAI(req: Request): Promise<OpenAI> {
  const userId = getUserId(req);
  if (userId) {
    const user = await authStorage.getUser(userId);
    if (user?.openaiApiKey) {
      return new OpenAI({ apiKey: user.openaiApiKey });
    }
  }
  const noKeyError: any = new Error("API ключ не настроен");
  noKeyError.code = "no_api_key";
  noKeyError.status = 402;
  throw noKeyError;
}

async function getUserModel(req: Request): Promise<string> {
  const userId = getUserId(req);
  if (userId) {
    const user = await authStorage.getUser(userId);
    if (user?.openaiModel && ALLOWED_MODELS.includes(user.openaiModel)) {
      return user.openaiModel;
    }
  }
  return DEFAULT_MODEL;
}

function trackTokens(userId: string | undefined, tokens: number): void {
  if (!userId || tokens <= 0) return;
  authStorage.addTokenUsage(userId, tokens).catch(() => {});
}

const LANG_INSTRUCTIONS: Record<string, string> = {
  en: "Write in English.",
  ru: "Пиши на русском языке.",
  ua: "Пиши українською мовою.",
  de: "Schreibe auf Deutsch.",
};

function getLangInstruction(req: Request): string {
  const lang = (req.body?.lang as string) || "ru";
  return LANG_INSTRUCTIONS[lang] || LANG_INSTRUCTIONS.ru;
}

function openAIErrorMessage(e: any): { status: number; message: string; code: string } {
  const code = e?.code || e?.error?.code || "";
  const type = e?.type || e?.error?.type || "";
  if (code === "no_api_key") {
    return { status: 402, message: "API ключ OpenAI не настроен", code: "no_api_key" };
  }
  if (code === "insufficient_quota" || type === "insufficient_quota" || e?.status === 429) {
    return { status: 402, message: "Баланс OpenAI исчерпан. Пополните счёт на platform.openai.com", code: "quota_exceeded" };
  }
  if (code === "invalid_api_key" || e?.status === 401) {
    return { status: 401, message: "Неверный OpenAI API ключ", code: "invalid_key" };
  }
  return { status: 500, message: e?.message || "Ошибка AI-сервиса", code: "unknown" };
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {

  // ---- Cover image upload ----
  app.post("/api/books/:id/cover", upload.single("cover"), async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (!req.file) return res.status(400).json({ error: "Файл не загружен" });
      const base64 = req.file.buffer.toString("base64");
      const mimeType = req.file.mimetype || "image/jpeg";
      const coverImage = `data:${mimeType};base64,${base64}`;
      const book = await storage.updateBook(id, { coverImage });
      if (!book) return res.status(404).json({ error: "Книга не найдена" });
      res.json({ coverImage });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ---- Models pricing (update here when OpenAI changes prices) ----
  // Source: https://platform.openai.com/docs/models — all prices are per 1M tokens (USD)
  app.get("/api/models/pricing", (_req: Request, res: Response) => {
    const pricing: Record<string, { input: number; output: number; cachedInput?: number }> = {
      "gpt-4o-mini":   { input: 0.150,  output: 0.600,  cachedInput: 0.075 },
      "gpt-4.1-mini":  { input: 0.40,   output: 1.60,   cachedInput: 0.10  },
      "gpt-3.5-turbo": { input: 0.50,   output: 1.50                       },
      "gpt-4o":        { input: 2.50,   output: 10.00,  cachedInput: 1.25  },
      "gpt-4.1":       { input: 2.00,   output: 8.00,   cachedInput: 0.50  },
      "gpt-4-turbo":   { input: 10.00,  output: 30.00                      },
      "o4-mini":       { input: 1.10,   output: 4.40,   cachedInput: 0.275 },
      "o3-mini":       { input: 1.10,   output: 4.40,   cachedInput: 0.55  },
      "gpt-4":         { input: 30.00,  output: 60.00                      },
    };
    res.json({ pricing, updatedAt: "2025-04-22", source: "https://platform.openai.com/docs/models" });
  });

  // ---- User profile ----
  app.get("/api/me", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.patch("/api/me", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const { firstName, lastName } = req.body;
      const user = await authStorage.updateUserProfile(userId, { firstName, lastName });
      res.json(user);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.patch("/api/me/api-key", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const { apiKey } = req.body;
      if (!apiKey || typeof apiKey !== "string") {
        return res.status(400).json({ error: "API ключ не указан" });
      }
      const testClient = new OpenAI({ apiKey: apiKey.trim() });
      await testClient.models.list();
      await authStorage.updateUserApiKey(userId, apiKey.trim());
      res.json({ ok: true });
    } catch (e: any) {
      if (e?.status === 401) {
        return res.status(401).json({ error: "Неверный API ключ. Проверьте его на platform.openai.com" });
      }
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/me/api-key", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      await authStorage.updateUserApiKey(userId, "");
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.patch("/api/user/model", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const { model } = req.body;
      if (!model || !ALLOWED_MODELS.includes(model)) {
        return res.status(400).json({ error: "Недопустимая модель" });
      }
      await authStorage.updateUserModel(userId, model);
      res.json({ ok: true, model });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ---- Books ----
  app.get("/api/books", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const books = await storage.getBooks(userId);
      res.json(books);
    } catch (e) {
      res.status(500).json({ error: "Ошибка загрузки книг" });
    }
  });

  app.get("/api/books/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const book = await storage.getBook(Number(req.params.id));
      if (!book) return res.status(404).json({ error: "Книга не найдена" });
      res.json(book);
    } catch (e) {
      res.status(500).json({ error: "Ошибка загрузки книги" });
    }
  });

  app.post("/api/books", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const data = insertBookSchema.parse(req.body);
      const book = await storage.createBook({ ...data, userId });
      res.status(201).json(book);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.patch("/api/books/:id", async (req: Request, res: Response) => {
    try {
      const book = await storage.updateBook(Number(req.params.id), req.body);
      if (!book) return res.status(404).json({ error: "Книга не найдена" });
      res.json(book);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete("/api/books/:id", async (req: Request, res: Response) => {
    try {
      await storage.deleteBook(Number(req.params.id));
      res.status(204).send();
    } catch (e) {
      res.status(500).json({ error: "Ошибка удаления книги" });
    }
  });

  // ─── Narrative Context (per-book AI context) ─────────────────────────────
  app.get("/api/books/:id/narrative", isAuthenticated, async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const bookId = Number(req.params.id);
    const book = await storage.getBook(bookId);
    if (!book || book.userId !== userId) return res.status(404).json({ error: "Not found" });
    res.json(book.narrativeContext || {});
  });

  app.put("/api/books/:id/narrative", isAuthenticated, async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const bookId = Number(req.params.id);
    const book = await storage.getBook(bookId);
    if (!book || book.userId !== userId) return res.status(404).json({ error: "Not found" });
    const updated = await storage.updateBook(bookId, { narrativeContext: req.body });
    res.json(updated?.narrativeContext || {});
  });

  // ---- Chapters ----
  app.get("/api/books/:bookId/chapters", async (req: Request, res: Response) => {
    try {
      const chapters = await storage.getChapters(Number(req.params.bookId));
      res.json(chapters);
    } catch (e) {
      res.status(500).json({ error: "Ошибка загрузки глав" });
    }
  });

  app.get("/api/chapters/:id", async (req: Request, res: Response) => {
    try {
      const chapter = await storage.getChapter(Number(req.params.id));
      if (!chapter) return res.status(404).json({ error: "Глава не найдена" });
      res.json(chapter);
    } catch (e) {
      res.status(500).json({ error: "Ошибка загрузки главы" });
    }
  });

  app.post("/api/books/:bookId/chapters", async (req: Request, res: Response) => {
    try {
      const data = insertChapterSchema.parse({ ...req.body, bookId: Number(req.params.bookId) });
      const chapter = await storage.createChapter(data);
      res.status(201).json(chapter);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.patch("/api/chapters/:id", async (req: Request, res: Response) => {
    try {
      const chapter = await storage.updateChapter(Number(req.params.id), req.body);
      if (!chapter) return res.status(404).json({ error: "Глава не найдена" });
      if (chapter.bookId) storage.updateBook(chapter.bookId, {}).catch(() => {});
      res.json(chapter);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete("/api/chapters/:id", async (req: Request, res: Response) => {
    try {
      await storage.deleteChapter(Number(req.params.id));
      res.status(204).send();
    } catch (e) {
      res.status(500).json({ error: "Ошибка удаления главы" });
    }
  });

  // ---- Characters ----
  app.get("/api/books/:bookId/characters", async (req: Request, res: Response) => {
    try {
      const chars = await storage.getCharacters(Number(req.params.bookId));
      res.json(chars);
    } catch (e) {
      res.status(500).json({ error: "Ошибка загрузки персонажей" });
    }
  });

  app.post("/api/books/:bookId/characters", async (req: Request, res: Response) => {
    try {
      const data = insertCharacterSchema.parse({ ...req.body, bookId: Number(req.params.bookId) });
      const char = await storage.createCharacter(data);
      res.status(201).json(char);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.patch("/api/characters/:id", async (req: Request, res: Response) => {
    try {
      const char = await storage.updateCharacter(Number(req.params.id), req.body);
      if (!char) return res.status(404).json({ error: "Персонаж не найден" });
      res.json(char);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete("/api/characters/:id", async (req: Request, res: Response) => {
    try {
      await storage.deleteCharacter(Number(req.params.id));
      res.status(204).send();
    } catch (e) {
      res.status(500).json({ error: "Ошибка удаления персонажа" });
    }
  });

  // ---- Notes ----
  app.get("/api/books/:bookId/notes", async (req: Request, res: Response) => {
    try {
      const notesList = await storage.getNotes(Number(req.params.bookId));
      res.json(notesList);
    } catch (e) {
      res.status(500).json({ error: "Ошибка загрузки заметок" });
    }
  });

  app.post("/api/books/:bookId/notes", async (req: Request, res: Response) => {
    try {
      const bookId = Number(req.params.bookId);
      const data = insertNoteSchema.parse({ ...req.body, bookId });
      const note = await storage.createNote(data);
      storage.updateBook(bookId, {}).catch(() => {});
      res.status(201).json(note);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.patch("/api/notes/:id", async (req: Request, res: Response) => {
    try {
      const note = await storage.updateNote(Number(req.params.id), req.body);
      if (!note) return res.status(404).json({ error: "Заметка не найдена" });
      if (note.bookId) storage.updateBook(note.bookId, {}).catch(() => {});
      res.json(note);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.get("/api/books/:bookId/notes/trash", async (req: Request, res: Response) => {
    try {
      const trashed = await storage.getTrashedNotes(Number(req.params.bookId));
      res.json(trashed);
    } catch (e) {
      res.status(500).json({ error: "Failed to load trash" });
    }
  });

  app.patch("/api/notes/:id/trash", async (req: Request, res: Response) => {
    try {
      await storage.trashNote(Number(req.params.id));
      res.status(204).send();
    } catch (e) {
      res.status(500).json({ error: "Failed to trash note" });
    }
  });

  app.patch("/api/notes/:id/restore", async (req: Request, res: Response) => {
    try {
      await storage.restoreNote(Number(req.params.id));
      res.status(204).send();
    } catch (e) {
      res.status(500).json({ error: "Failed to restore note" });
    }
  });

  app.delete("/api/notes/:id", async (req: Request, res: Response) => {
    try {
      await storage.deleteNote(Number(req.params.id));
      res.status(204).send();
    } catch (e) {
      res.status(500).json({ error: "Ошибка удаления заметки" });
    }
  });

  app.post("/api/books/:bookId/notes/trash-collection", async (req: Request, res: Response) => {
    try {
      const { collection } = req.body;
      if (!collection) return res.status(400).json({ error: "collection required" });
      await storage.trashCollectionNotes(Number(req.params.bookId), collection);
      res.status(204).send();
    } catch (e) {
      res.status(500).json({ error: "Failed to trash collection" });
    }
  });

  app.get("/api/notes/:id/attachments", async (req: Request, res: Response) => {
    try {
      const attachments = await storage.getAttachments(Number(req.params.id));
      res.json(attachments.map(a => ({ ...a, fileContent: undefined, hasFile: true })));
    } catch (e) {
      res.status(500).json({ error: "Failed to load attachments" });
    }
  });

  app.get("/api/attachments/:id/download", async (req: Request, res: Response) => {
    try {
      const { db: dbConn } = await import("./db");
      const { noteAttachments: attTable } = await import("@shared/schema");
      const { eq: eqFn } = await import("drizzle-orm");
      const [attachment] = await dbConn.select().from(attTable).where(eqFn(attTable.id, Number(req.params.id)));
      if (!attachment) return res.status(404).json({ error: "Not found" });
      const buf = Buffer.from(attachment.fileContent, "base64");
      res.set("Content-Type", attachment.fileType || "application/octet-stream");
      res.set("Content-Disposition", `attachment; filename="${attachment.fileName}"`);
      res.send(buf);
    } catch (e) {
      res.status(500).json({ error: "Failed to download" });
    }
  });

  app.post("/api/notes/:id/attachments", async (req: Request, res: Response) => {
    try {
      const { fileName, fileType, fileSize, fileContent } = req.body;
      if (!fileName || !fileContent) return res.status(400).json({ error: "fileName and fileContent required" });
      if (fileSize > 5 * 1024 * 1024) return res.status(400).json({ error: "File too large (max 5MB)" });
      const att = await storage.createAttachment({ noteId: Number(req.params.id), fileName, fileType: fileType || "", fileSize: fileSize || 0, fileContent });
      res.status(201).json({ ...att, fileContent: undefined });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete("/api/attachments/:id", async (req: Request, res: Response) => {
    try {
      await storage.deleteAttachment(Number(req.params.id));
      res.status(204).send();
    } catch (e) {
      res.status(500).json({ error: "Failed to delete attachment" });
    }
  });

  // ---- Sources ----
  app.get("/api/books/:bookId/sources", async (req: Request, res: Response) => {
    try {
      const sourcesList = await storage.getSources(Number(req.params.bookId));
      res.json(sourcesList);
    } catch (e) {
      res.status(500).json({ error: "Ошибка загрузки источников" });
    }
  });

  app.post("/api/books/:bookId/sources", async (req: Request, res: Response) => {
    try {
      const data = insertSourceSchema.parse({ ...req.body, bookId: Number(req.params.bookId) });
      const src = await storage.createSource(data);
      res.status(201).json(src);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.patch("/api/sources/:id", async (req: Request, res: Response) => {
    try {
      const src = await storage.updateSource(Number(req.params.id), req.body);
      if (!src) return res.status(404).json({ error: "Источник не найден" });
      res.json(src);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete("/api/sources/:id", async (req: Request, res: Response) => {
    try {
      await storage.deleteSource(Number(req.params.id));
      res.status(204).send();
    } catch (e) {
      res.status(500).json({ error: "Ошибка удаления источника" });
    }
  });

  // ---- Hypotheses ----
  app.get("/api/books/:bookId/hypotheses", async (req: Request, res: Response) => {
    try {
      const hyps = await storage.getHypotheses(Number(req.params.bookId));
      res.json(hyps);
    } catch (e) { res.status(500).json({ error: "Ошибка загрузки гипотез" }); }
  });

  app.post("/api/books/:bookId/hypotheses", async (req: Request, res: Response) => {
    try {
      const data = insertHypothesisSchema.parse({ ...req.body, bookId: Number(req.params.bookId) });
      const hyp = await storage.createHypothesis(data);
      res.status(201).json(hyp);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });

  app.patch("/api/hypotheses/:id", async (req: Request, res: Response) => {
    try {
      const hyp = await storage.updateHypothesis(Number(req.params.id), req.body);
      if (!hyp) return res.status(404).json({ error: "Гипотеза не найдена" });
      res.json(hyp);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });

  app.delete("/api/hypotheses/:id", async (req: Request, res: Response) => {
    try {
      await storage.deleteHypothesis(Number(req.params.id));
      res.status(204).send();
    } catch (e) { res.status(500).json({ error: "Ошибка удаления" }); }
  });

  // ---- Drafts ----
  app.get("/api/books/:bookId/drafts", async (req: Request, res: Response) => {
    try {
      const draftsList = await storage.getDrafts(Number(req.params.bookId));
      res.json(draftsList);
    } catch (e) { res.status(500).json({ error: "Error loading drafts" }); }
  });

  app.post("/api/books/:bookId/drafts", async (req: Request, res: Response) => {
    try {
      const bookId = Number(req.params.bookId);
      const data = insertDraftSchema.parse({ ...req.body, bookId });
      const draft = await storage.createDraft(data);
      storage.updateBook(bookId, {}).catch(() => {});
      res.status(201).json(draft);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });

  app.patch("/api/drafts/:id", async (req: Request, res: Response) => {
    try {
      const draft = await storage.updateDraft(Number(req.params.id), req.body);
      if (!draft) return res.status(404).json({ error: "Draft not found" });
      res.json(draft);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });

  app.delete("/api/drafts/:id", async (req: Request, res: Response) => {
    try {
      await storage.deleteDraft(Number(req.params.id));
      res.status(204).send();
    } catch (e) { res.status(500).json({ error: "Error deleting draft" }); }
  });

  // ---- Note Collections ----
  app.get("/api/books/:bookId/collections", async (req: Request, res: Response) => {
    try {
      const cols = await storage.getNoteCollections(Number(req.params.bookId));
      res.json(cols);
    } catch (e) { res.status(500).json({ error: "Error loading collections" }); }
  });

  app.post("/api/books/:bookId/collections", async (req: Request, res: Response) => {
    try {
      const data = insertNoteCollectionSchema.parse({ ...req.body, bookId: Number(req.params.bookId) });
      const col = await storage.createNoteCollection(data);
      res.status(201).json(col);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });

  app.patch("/api/collections/:id", async (req: Request, res: Response) => {
    try {
      const col = await storage.updateNoteCollection(Number(req.params.id), req.body);
      if (!col) return res.status(404).json({ error: "Collection not found" });
      res.json(col);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });

  app.delete("/api/collections/:id", async (req: Request, res: Response) => {
    try {
      await storage.deleteNoteCollection(Number(req.params.id));
      res.status(204).send();
    } catch (e) { res.status(500).json({ error: "Error deleting collection" }); }
  });

  // ─── Author Role Models ───────────────────────────────────────────────────

  app.get("/api/books/:bookId/role-models", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const models = await storage.getAuthorRoleModels(Number(req.params.bookId));
      res.json(models);
    } catch (e) { res.status(500).json({ error: "Error loading role models" }); }
  });

  app.post("/api/books/:bookId/role-models", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const data = insertAuthorRoleModelSchema.parse({ ...req.body, bookId: Number(req.params.bookId) });
      const model = await storage.createAuthorRoleModel(data);
      res.status(201).json(model);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });

  app.patch("/api/role-models/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const model = await storage.updateAuthorRoleModel(Number(req.params.id), req.body);
      if (!model) return res.status(404).json({ error: "Role model not found" });
      res.json(model);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });

  app.delete("/api/role-models/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      await storage.deleteAuthorRoleModel(Number(req.params.id));
      res.status(204).send();
    } catch (e) { res.status(500).json({ error: "Error deleting role model" }); }
  });

  // ─── File Text Extraction ───────────────────────────────────────────────────
  // POST /api/extract-file-text — extract plain text from EPUB / FB2 / TXT
  const uploadFileText = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 30 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const allowed = [".epub", ".fb2", ".txt", ".md", ".text"];
      if (allowed.includes(ext)) cb(null, true);
      else cb(new Error("Unsupported file type. Use EPUB, FB2, or TXT."));
    },
  });

  app.post("/api/extract-file-text", isAuthenticated, uploadFileText.single("file"), async (req: Request, res: Response) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });
      const ext = path.extname(req.file.originalname).toLowerCase();
      let text = "";

      if (ext === ".epub") {
        // EPUB is a ZIP file — extract text from HTML/XHTML content files
        const zip = await JSZip.loadAsync(req.file.buffer);
        const textParts: string[] = [];
        for (const [filename, file] of Object.entries(zip.files)) {
          if (filename.endsWith(".html") || filename.endsWith(".xhtml") || filename.endsWith(".htm")) {
            const html = await (file as any).async("string");
            // Strip HTML tags
            const plain = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
              .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
              .replace(/<[^>]+>/g, " ")
              .replace(/\s{2,}/g, " ")
              .trim();
            if (plain.length > 50) textParts.push(plain);
          }
        }
        text = textParts.join("\n\n");
      } else if (ext === ".fb2") {
        // FB2 is XML — strip tags and decode entities
        const raw = req.file.buffer.toString("utf-8");
        text = raw
          .replace(/<binary[^>]*>[\s\S]*?<\/binary>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
          .replace(/\s{2,}/g, " ")
          .trim();
      } else {
        // TXT / MD
        text = req.file.buffer.toString("utf-8");
      }

      // Limit to ~80k characters to avoid token overflow
      const trimmed = text.slice(0, 80000);
      res.json({ text: trimmed, chars: trimmed.length });
    } catch (e: any) {
      res.status(500).json({ error: e.message || "Text extraction failed" });
    }
  });

  // ─── Deep Structural Analysis ─────────────────────────────────────────────
  // POST /api/role-models/:id/deep-analyze
  // Reconstructs the creative model of an author from source material.
  app.post("/api/role-models/:id/deep-analyze", isAuthenticated, async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const { rawSourceText, lang, customInstruction } = req.body;
    if (!rawSourceText?.trim()) return res.status(400).json({ error: "rawSourceText is required" });

    const langInstruction =
      lang === "ru" ? "IMPORTANT: Respond ONLY in Russian." :
      lang === "ua" ? "IMPORTANT: Respond ONLY in Ukrainian." :
      lang === "de" ? "IMPORTANT: Respond ONLY in German." :
      "Respond in English.";

    const systemPrompt = `You are a specialized deep literary analyst and cognitive style researcher operating inside the Moodra writing platform. Your task is to perform a complete, multi-layered reconstruction of the author's mind, writing method, and intellectual style from the provided source text.

This is NOT a summary. You are reconstructing the COGNITIVE AND STYLISTIC MODEL of the author — how they think, argue, structure ideas, build rhythm, use language, and engage emotionally with the reader.

${langInstruction}

Perform your analysis across these dimensions:

STAGE 1 — NARRATIVE STYLE: Type of narration, author's distance from subject, level of subjectivity, intensity of imagery.
STAGE 2 — SENTENCE ARCHITECTURE: Average sentence length, syntactic complexity, rhythm patterns, density of meaning per sentence.
STAGE 3 — LANGUAGE TEXTURE: Vocabulary density, abstraction level, metaphor types, symbolic frequency.
STAGE 4 — INTELLECTUAL METHOD: How the author thinks — deductively, inductively, associatively, philosophically, analytically, or narratively. How they form and connect ideas.
STAGE 5 — ARGUMENT STRUCTURE: How the author builds a case — through examples, concepts, stories, or logical chains. How they handle objections and counter-arguments.
STAGE 6 — COGNITIVE PATTERNS: Repeating mental models, favourite constructions, characteristic themes, recurring oppositions and tensions.
STAGE 7 — EMOTIONAL DYNAMICS: Emotional temperature of the text (calm / intellectual / expressive / cold / ironic / dramatic), how emotion is embedded in structure rather than stated directly.

Return ONLY a valid JSON object with exactly these 9 fields. Each field must be rich, specific, analytical — minimum 4 sentences, maximum 8. Do not use vague generalities. Be precise about what you observe in the text.

{
  "conceptualTendencies": "Deep analysis of how the author constructs and connects ideas. Their intellectual instincts, pattern of thought formation, preferred cognitive moves. How abstract and concrete levels interact in their thinking.",
  "stylePatterns": "Detailed description of sentence structure, rhythm, voice register, use of abstraction vs. concreteness, density of meaning per paragraph. What makes this author's prose immediately recognisable.",
  "structurePatterns": "How the author organises sections and arguments at macro and micro level. How chapters or sections are opened and closed. What holds the argument architecture together.",
  "rhythmObservations": "Pace of writing, how energy builds and releases, transition mechanics, use of pauses, short sentences, and acceleration. The music of the prose.",
  "vocabularyTendencies": "Characteristic vocabulary: which domains it draws from, abstraction level, metaphor types, linguistic register (formal/conversational/technical/literary), signature phrases or constructions.",
  "argumentBehavior": "How the author makes a case — deductive or inductive, through evidence or through narrative, how objections are preempted or addressed. The logic of persuasion in the text.",
  "emotionalDynamics": "Emotional temperature of the text, what emotions are invoked in the reader, how affect is embedded in structural and linguistic choices rather than stated directly.",
  "reusableParameters": "5–7 concrete, specific techniques a writer could adopt from this author. Each should be a named device or method with a brief description of how to apply it.",
  "styleInstruction": "A dense, precise, actionable system instruction (3–5 sentences) for an AI writing assistant to produce text in this author's style and cognitive register. Must be specific enough to produce recognisably similar output — not just 'write clearly' but 'use short declarative sentences followed by a longer elaborating sentence; open with a provocative claim; avoid hedging language; prefer concrete metaphors drawn from physical experience'."
}${customInstruction ? `\n\nAdditional focus instruction from the user: ${customInstruction}` : ""}`;

    // System prompt for the "fast pattern scanner" — gpt-4o-mini
    const systemPromptMini = `${systemPrompt}

FOCUS FOR THIS PASS: Surface-level style patterns, sentence architecture, vocabulary tendencies, rhythm, and reusable techniques. Be extremely concrete and specific — name exact patterns, quote representative sentence structures, identify signature devices.`;

    // System prompt for the "deep cognitive analyst" — gpt-4o
    const systemPromptDeep = `${systemPrompt}

FOCUS FOR THIS PASS: Deep cognitive reconstruction — intellectual method, conceptual architecture, argument logic, emotional dynamics, and the hidden mental models that drive the writing. Go beyond the surface. Identify the author's unique epistemological approach, their way of moving between abstract and concrete, and their persuasion philosophy. Produce an analysis rich enough to function as a complete author fingerprint.`;

    const userPromptMini = `Perform a precise, surface-level style reconstruction on the following text. Focus on observable patterns: sentence structure, vocabulary, rhythm, and reusable techniques. Return the JSON object with all 9 fields:\n\n---\n${rawSourceText.slice(0, 10000)}\n---`;

    const userPromptDeep = `Perform a deep cognitive and intellectual reconstruction of the author behind this text. Focus on how they think, argue, and construct meaning. Use the FULL text provided. Return the JSON object with all 9 fields:\n\n---\n${rawSourceText.slice(0, 16000)}\n---`;

    const parseAnalysis = (raw: string) => {
      let text = raw.trim();
      const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (fence) text = fence[1].trim();
      const firstBrace = text.indexOf("{");
      const lastBrace = text.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1) text = text.slice(firstBrace, lastBrace + 1);
      return JSON.parse(text);
    };

    const mergeAnalyses = (a: Record<string, string>, b: Record<string, string>): Record<string, string> => {
      const fields = ["conceptualTendencies", "stylePatterns", "structurePatterns", "rhythmObservations", "vocabularyTendencies", "argumentBehavior", "emotionalDynamics", "reusableParameters", "styleInstruction"] as const;
      const merged: Record<string, string> = {};
      for (const key of fields) {
        const va = (a[key] || "").trim();
        const vb = (b[key] || "").trim();
        if (!va) { merged[key] = vb; continue; }
        if (!vb) { merged[key] = va; continue; }
        if (key === "styleInstruction") {
          // Merge style instructions into one rich composite instruction
          merged[key] = `${va} ${vb}`;
        } else if (key === "reusableParameters") {
          // Concatenate both lists of techniques
          merged[key] = `${va}\n\n${vb}`;
        } else {
          // Combine both analyses, keeping non-overlapping insights
          merged[key] = `${va}\n\n${vb}`;
        }
      }
      return merged;
    };

    const applyMergedAnalysis = async (merged: Record<string, string>) => {
      const updated = await storage.updateAuthorRoleModel(id, {
        rawSourceText,
        analysisStatus: "analyzed",
        conceptualTendencies: merged.conceptualTendencies || "",
        stylePatterns: merged.stylePatterns || "",
        structurePatterns: merged.structurePatterns || "",
        rhythmObservations: merged.rhythmObservations || "",
        vocabularyTendencies: merged.vocabularyTendencies || "",
        argumentBehavior: merged.argumentBehavior || "",
        emotionalDynamics: merged.emotionalDynamics || "",
        reusableParameters: merged.reusableParameters || "",
        styleInstruction: merged.styleInstruction || "",
        analysisText: [
          merged.conceptualTendencies,
          merged.stylePatterns,
          merged.structurePatterns,
        ].filter(Boolean).join(" | "),
      });
      return updated;
    };

    try {
      const ai = await getOpenAI(req);
      const userId = getUserId(req);

      // Run gpt-4o-mini (surface patterns) and gpt-4o (deep cognitive analysis) in parallel
      const [miniCompletion, deepCompletion] = await Promise.all([
        ai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPromptMini },
            { role: "user", content: userPromptMini },
          ],
          max_tokens: 4000,
          response_format: { type: "json_object" },
        }),
        ai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: systemPromptDeep },
            { role: "user", content: userPromptDeep },
          ],
          max_tokens: 6000,
          response_format: { type: "json_object" },
        }),
      ]);

      const rawMini = miniCompletion.choices[0]?.message?.content || "{}";
      const rawDeep = deepCompletion.choices[0]?.message?.content || "{}";

      const totalTokens = (miniCompletion.usage?.total_tokens || 0) + (deepCompletion.usage?.total_tokens || 0);
      if (totalTokens) trackTokens(userId, totalTokens);

      const parsedMini = parseAnalysis(rawMini);
      const parsedDeep = parseAnalysis(rawDeep);
      const merged = mergeAnalyses(parsedMini, parsedDeep);

      const updated = await applyMergedAnalysis(merged);

      // Fire-and-forget: generate embedding from the 8 analysis fields.
      // This does NOT block the response and never breaks if it fails.
      generateAndStoreEmbedding(
        ai,
        id,
        merged,
        (mid, data) => storage.updateAuthorRoleModel(mid, data),
      ).catch(() => {});

      return res.json({ model: updated });
    } catch (e: any) {
      const { code } = openAIErrorMessage(e);
      if (code !== "no_api_key") {
        const { status, message } = openAIErrorMessage(e);
        return res.status(status).json({ error: message, code });
      }
    }

    // Fallback: free Pollinations (single model)
    try {
      const seed = Math.floor(Math.random() * 99999);
      const pollinationsRes = await fetch("https://text.pollinations.ai/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Perform a deep author style reconstruction on the following text. Return the JSON object with all 9 fields filled in full detail:\n\n---\n${rawSourceText.slice(0, 8000)}\n---` },
          ],
          model: "openai",
          seed,
          private: true,
          jsonMode: true,
        }),
        signal: AbortSignal.timeout(50000),
      });
      if (!pollinationsRes.ok) return res.status(502).json({ error: "free_unavailable" });
      let text = (await pollinationsRes.text()).trim();
      if (text.startsWith("{") || text.startsWith("[")) {
        try { const p = JSON.parse(text); if (p?.choices) text = p.choices[0]?.message?.content || text; } catch {}
      }
      const parsed = parseAnalysis(text);
      const updated = await applyMergedAnalysis(parsed);
      return res.json({ model: updated });
    } catch (e: any) {
      return res.status(500).json({ error: "analysis_error", message: e?.message });
    }
  });

  // ─── Co-Author Synthesis ──────────────────────────────────────────────────
  // POST /api/books/:bookId/ai/co-author — parallel multi-model synthesis
  app.post("/api/books/:bookId/ai/co-author", isAuthenticated, async (req: Request, res: Response) => {
    const { text, instruction, mode } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: "text required" });

    let ai: OpenAI;
    let aiModel: string;
    try {
      ai = await getOpenAI(req);
      aiModel = await getUserModel(req);
    } catch (e: any) {
      const { status, message, code } = openAIErrorMessage(e);
      return res.status(status).json({ error: message, code });
    }

    const langInstruction = getLangInstruction(req);
    const bookId = Number(req.params.bookId);

    try {
      const allModels = await storage.getAuthorRoleModels(bookId);
      const activeModels = allModels.filter(m => (m.influencePercent ?? 0) > 0);

      // No active role models — fall through to simple improve
      if (activeModels.length === 0) {
        const baseInstruction = instruction || "Improve and enhance this text while preserving the author's voice and core meaning.";
        const completion = await ai.chat.completions.create({
          model: aiModel,
          messages: [
            { role: "system", content: `You are an expert editor. ${baseInstruction} Return ONLY the result. ${langInstruction}` },
            { role: "user", content: text },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        });
        trackTokens(getUserId(req), completion.usage?.total_tokens || 0);
        return res.json({ improved: completion.choices[0].message.content?.trim() || "", usedModels: [] });
      }

      // ── Build rich author context from deep analysis fields (Phase 4) ─────────
      // Falls back to styleInstruction if structured fields are missing,
      // and to minimal identity line if styleInstruction is also absent.
      const buildCoAuthorContext = (rm: typeof activeModels[0]): string => {
        const t = (s: string | null | undefined, max = 400) => s?.trim().slice(0, max) ?? "";

        const structured = [
          t(rm.conceptualTendencies) && `[THINKING & CONCEPTS]\n${t(rm.conceptualTendencies)}`,
          t(rm.stylePatterns)         && `[STYLE & VOICE]\n${t(rm.stylePatterns)}`,
          t(rm.structurePatterns)     && `[STRUCTURE]\n${t(rm.structurePatterns)}`,
          t(rm.rhythmObservations)    && `[RHYTHM & PACING]\n${t(rm.rhythmObservations)}`,
          t(rm.vocabularyTendencies)  && `[VOCABULARY]\n${t(rm.vocabularyTendencies)}`,
          t(rm.argumentBehavior)      && `[ARGUMENTATION]\n${t(rm.argumentBehavior)}`,
          t(rm.emotionalDynamics)     && `[EMOTIONAL REGISTER]\n${t(rm.emotionalDynamics)}`,
          t(rm.reusableParameters)    && `[CRAFT PARAMETERS]\n${t(rm.reusableParameters)}`,
        ].filter(Boolean);

        const authorId = [rm.name, rm.authorName].filter(Boolean).join(" / ");
        const pct = rm.influencePercent ?? 0;

        // Intensity instruction tied to influencePercent — affects how boldly
        // the model expresses this style in the parallel output
        const intensityNote = pct >= 67
          ? "Express your style fully, distinctively, and without restraint."
          : pct >= 34
            ? "Express your style clearly while allowing natural variation in the execution."
            : "Apply your style as a subtle but perceptible coloring — do not overpower the source material.";

        if (structured.length === 0) {
          // Fallback: structured fields absent — use styleInstruction or bare identity
          const fallback = t(rm.styleInstruction, 500);
          const base = fallback
            ? `You are writing as ${authorId}.\n${fallback}`
            : `You are writing in the style of ${authorId}.`;
          return `${base}\n\n${intensityNote}`;
        }

        // Full structured context with optional styleInstruction nuance at the end
        const extra = t(rm.styleInstruction, 300);
        const extraBlock = extra ? `\n\n[ADDITIONAL STYLE NOTE]\n${extra}` : "";
        return `You are writing as ${authorId}.\n\n${structured.join("\n\n")}${extraBlock}\n\n${intensityNote}`;
      };
      // ─────────────────────────────────────────────────────────────────────────

      // Parallel: one request per active role model
      const baseInstruction = instruction || (mode === "continue" ? "Continue this text in the author's style." : "Improve and enhance this text.");
      const parallelResults = await Promise.all(
        activeModels.slice(0, 5).map(async (rm) => {
          const styleCtx = buildCoAuthorContext(rm);
          const c = await ai.chat.completions.create({
            model: aiModel,
            messages: [
              { role: "system", content: `${styleCtx}\n\n${baseInstruction} Return ONLY the result. ${langInstruction}` },
              { role: "user", content: text },
            ],
            temperature: 0.75,
            max_tokens: 1800,
          });
          trackTokens(getUserId(req), c.usage?.total_tokens || 0);
          return { name: rm.authorName || rm.name, pct: rm.influencePercent ?? 0, result: c.choices[0].message.content?.trim() || "" };
        })
      );

      // Synthesis agent — upgraded to explicit weight guidance
      const total = parallelResults.reduce((s, r) => s + r.pct, 0) || 1;
      const versionsBlock = parallelResults
        .map(r => `=== ${r.name} (influence: ${Math.round((r.pct / total) * 100)}%) ===\n${r.result}`)
        .join("\n\n");

      // Build explicit weight list and dominant-voice guidance for the synthesizer
      const weightList = parallelResults
        .map(r => `${r.name}: ${Math.round((r.pct / total) * 100)}%`)
        .join(", ");
      const dominant = parallelResults.reduce((a, b) => a.pct > b.pct ? a : b);
      const dominantShare = dominant.pct / total;
      const blendGuidance = dominantShare > 0.6
        ? `${dominant.name} is the dominant voice (${Math.round(dominantShare * 100)}%). Their style should define the overall voice, structure, and emotional register of the synthesis. Other authors contribute subtle colorings — specific vocabulary choices, rhythm variations, thematic echoes — without overriding the primary voice.`
        : `No single author dominates. Weave all styles proportionally so each voice is perceptible throughout without any one overwhelming the others.`;

      const synthesisCompletion = await ai.chat.completions.create({
        model: aiModel,
        messages: [
          {
            role: "system",
            content: `You are a master synthesis agent. You receive multiple stylistically distinct versions of a text, each written under the influence of a different author at a specified weight. Your task: produce a single, coherent, polished text that blends these styles proportionally to their influence weights. Preserve the original meaning exactly. Return ONLY the final synthesized text. ${langInstruction}`,
          },
          {
            role: "user",
            content:
              `ORIGINAL TEXT:\n${text}\n\n` +
              `STYLE WEIGHTS: ${weightList}\n\n` +
              `STYLED VERSIONS:\n${versionsBlock}\n\n` +
              `SYNTHESIS INSTRUCTIONS:\n${blendGuidance}\n` +
              `Produce one seamless, natural text that honours these proportions exactly.`,
          },
        ],
        temperature: 0.65,
        max_tokens: 2200,
      });
      trackTokens(getUserId(req), synthesisCompletion.usage?.total_tokens || 0);

      const improved = synthesisCompletion.choices[0].message.content?.trim() || "";
      res.json({
        improved,
        usedModels: parallelResults.map(r => ({ name: r.name, pct: r.pct })),
      });
    } catch (e: any) {
      const { status, message } = openAIErrorMessage(e);
      res.status(status).json({ error: message });
    }
  });

  // ---- Idea Board ----
  app.get("/api/books/:bookId/board", async (req: Request, res: Response) => {
    try {
      const board = await storage.getBoard(Number(req.params.bookId));
      res.json(board || { data: "{}" });
    } catch (e) { res.status(500).json({ error: "Ошибка загрузки доски" }); }
  });

  app.patch("/api/books/:bookId/board", async (req: Request, res: Response) => {
    try {
      const { data } = req.body;
      const board = await storage.upsertBoard(Number(req.params.bookId), data);
      res.json(board);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });

  // ---- AI Hypothesis Generator ----
  app.post("/api/ai/hypotheses", async (req: Request, res: Response) => {
    try {
      const { bookTitle, bookMode, sources: srcs, existingHypotheses } = req.body;
      const sourcesText = (srcs || []).map((s: any) => `- "${s.title}" (${s.author || ""}): ${s.notes || s.quote || ""}`).join("\n");
      const existingText = (existingHypotheses || []).map((h: any) => h.title).join(", ");

      const langInstruction = getLangInstruction(req);
      const systemPrompt = `Ты — философ и исследователь. Генерируй глубокие, нетривиальные гипотезы на основе предоставленных источников. ${langInstruction}
Отвечай ТОЛЬКО валидным JSON без markdown-блоков.
Структура:
{
  "hypotheses": [
    {
      "title": "Краткая формулировка гипотезы",
      "description": "Развёрнутое описание (3-4 предложения)",
      "arguments": "Поддерживающие аргументы (через точку с запятой)",
      "counterarguments": "Возможные возражения (через точку с запятой)"
    }
  ]
}`;

      const userPrompt = `Книга: "${bookTitle}" (${bookMode === "fiction" ? "художественная" : "научная"})
${sourcesText ? `Источники:\n${sourcesText}` : ""}
${existingText ? `Уже есть гипотезы: ${existingText}` : ""}
Сгенерируй 4 оригинальные гипотезы. Не дублируй существующие.`;

      const ai = await getOpenAI(req);
      const aiModel = await getUserModel(req);
      const completion = await ai.chat.completions.create({
        model: aiModel,
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
        temperature: 0.8,
        max_tokens: 2000,
        response_format: { type: "json_object" },
      });
      trackTokens(getUserId(req), completion.usage?.total_tokens || 0);
      const parsed = JSON.parse(completion.choices[0].message.content || "{}");
      res.json(parsed);
    } catch (e: any) { const { status, message } = openAIErrorMessage(e); res.status(status).json({ error: message }); }
  });

  // ---- AI Research Discovery ----
  app.post("/api/ai/research", async (req: Request, res: Response) => {
    try {
      const { query, bookTitle, bookMode, existingSources } = req.body;
      if (!query?.trim()) return res.status(400).json({ error: "Запрос не указан" });

      const existing = (existingSources || []).map((s: any) => s.title).join(", ");

      const langInstruction2 = getLangInstruction(req);
      const systemPrompt = `Ты — эксперт-исследователь и библиограф. Твоя задача — помочь автору книги найти источники для исследования. ${langInstruction2}
Отвечай ТОЛЬКО валидным JSON без markdown-блоков и лишнего текста.
Структура ответа:
{
  "advice": "Стратегический совет по исследованию темы (2-3 абзаца)",
  "sources": [
    {
      "title": "Название источника",
      "author": "Автор (Фамилия И.О. или организация)",
      "type": "book|article|website|research",
      "url": "URL если применимо (или пустая строка)",
      "notes": "Краткое пояснение почему этот источник важен для данной темы",
      "quote": "Ключевая идея или типичная цитата из этого источника (если применимо)"
    }
  ]
}`;

      const userPrompt = `Книга: "${bookTitle}" (режим: ${bookMode === "fiction" ? "художественная" : "научная"})
Тема запроса: "${query}"
${existing ? `Уже есть в базе: ${existing}` : ""}

Предоставь:
1. Стратегический совет по исследованию этой темы
2. Ровно 6 релевантных источников (разные типы: книги, статьи, сайты, исследования)
${existing ? "Не дублируй уже имеющиеся источники." : ""}
Источники должны быть реалистичными и содержательными.`;

      const ai = await getOpenAI(req);
      const aiModel = await getUserModel(req);
      const completion = await ai.chat.completions.create({
        model: aiModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" },
      });
      trackTokens(getUserId(req), completion.usage?.total_tokens || 0);
      const raw = completion.choices[0].message.content || "{}";
      const parsed = JSON.parse(raw);
      res.json(parsed);
    } catch (e: any) {
      const { status, message } = openAIErrorMessage(e);
      res.status(status).json({ error: message });
    }
  });

  // ---- AI Draft Assistant ----
  // Generates a draft sketch from a plan/outline, or expands bullet-point theses.
  app.post("/api/ai/draft-assist", async (req: Request, res: Response) => {
    try {
      const { mode, input, bookTitle, bookMode } = req.body;
      if (!input?.trim()) return res.status(400).json({ error: "input required" });

      const langInstruction = getLangInstruction(req);
      const ai = await getOpenAI(req);
      const aiModel = await getUserModel(req);

      const prompts: Record<string, string> = {
        sketch:
          `You are a creative writing assistant. The user provides a brief plan or outline. ` +
          `Transform it into a flowing draft text — full sentences, natural paragraphs, vivid language. ` +
          `Preserve all ideas from the plan. Do not add a title. Return ONLY the draft text. ${langInstruction}`,
        expand:
          `You are a creative writing assistant. The user provides a list of bullet-point theses or short ideas. ` +
          `Expand each one into a rich, developed paragraph. Use concrete details, examples, and smooth transitions. ` +
          `Return ONLY the expanded text as flowing prose. ${langInstruction}`,
        continue:
          `You are a creative writing assistant. Continue the given text naturally for one or two more paragraphs. ` +
          `Match the existing style, tone and pace. Do not repeat what was written. Return ONLY the continuation. ${langInstruction}`,
        ideas:
          `You are a creative writing assistant. Based on the given draft text or outline, ` +
          `generate 5 concrete development ideas — directions the text could grow: new angles, scenes, arguments, or details. ` +
          `Format as a short numbered list. Return ONLY the list. ${langInstruction}`,
      };

      const systemPrompt = (prompts[mode] || prompts.sketch) +
        `\nContext: Book "${bookTitle || ""}" (${bookMode === "fiction" ? "fiction" : "non-fiction"})`;

      const completion = await ai.chat.completions.create({
        model: aiModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: input },
        ],
        temperature: 0.8,
        max_tokens: 2000,
      });
      trackTokens(getUserId(req), completion.usage?.total_tokens || 0);
      const result = completion.choices[0].message.content?.trim() || "";
      res.json({ result });
    } catch (e: any) {
      const { status, message } = openAIErrorMessage(e);
      res.status(status).json({ error: message });
    }
  });

  // ---- Blank Page Fear ----
  app.post("/api/ai/blank-page-help", async (req: Request, res: Response) => {
    try {
      const { rawDump, bookTitle, bookMode } = req.body;
      if (!rawDump?.trim()) return res.status(400).json({ error: "rawDump required" });

      const langInstruction = getLangInstruction(req);
      const ai = await getOpenAI(req);
      const aiModel = await getUserModel(req);

      const systemPrompt =
        `You are a warm, encouraging writing coach. The user is experiencing writer's block and has dumped their raw thoughts, fears, fragments, and ideas below. ` +
        `Your job is to help them start writing without fear. ` +
        `Respond with the following structure (use these exact section headers):\n\n` +
        `**Your ideas have real potential.** (1-2 encouraging sentences reacting to their specific dump — be genuine, not generic)\n\n` +
        `**Here's how I'd structure this:**\n` +
        `(A numbered list of 3-5 concrete chapter/section ideas extracted or inferred from their dump. Each line: "1. [Short title] — [one sentence description]")\n\n` +
        `**Start here — your first sentence:**\n` +
        `(Write one specific opening sentence they could use right now, based on their most vivid idea)\n\n` +
        `**Three small steps to get unstuck:**\n` +
        `(3 bullet points with immediate, tiny, concrete actions for today)\n\n` +
        `Context: Book "${bookTitle || "untitled"}" (${bookMode === "fiction" ? "fiction" : "non-fiction"}). ${langInstruction}`;

      const completion = await ai.chat.completions.create({
        model: aiModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: rawDump.trim() },
        ],
        temperature: 0.85,
        max_tokens: 1200,
      });
      trackTokens(getUserId(req), completion.usage?.total_tokens || 0);
      const result = completion.choices[0].message.content?.trim() || "";
      res.json({ result });
    } catch (e: any) {
      const { status, message } = openAIErrorMessage(e);
      res.status(status).json({ error: message });
    }
  });

  // ---- AI Improve ----
  app.post("/api/ai/improve", async (req: Request, res: Response) => {
    try {
      const {
        text, mode, style, bookTitle, bookMode, bookGenre, customInstruction, targetLang,
        // Phase 3: optional author role model context
        bookId, useRoleModels, selectedRoleModelIds,
      } = req.body;

      const langInstruction3 = getLangInstruction(req);
      const modeInstructions: Record<string, string> = {
        improve:      "Improve and enhance this text: make it clearer, more expressive, and more compelling. Preserve the author's voice and core meaning.",
        expand:       "Expand this text with more detail, vivid examples, and deeper analysis. Make it richer and more comprehensive.",
        shorten:      "Make this text more concise — cut unnecessary words, tighten sentences, keep only what matters. Preserve the core meaning.",
        rephrase:     "Rephrase this text in a different way while preserving the exact meaning. Change the expression, not the substance.",
        rewrite:      "Completely rewrite this text from scratch while preserving its meaning and intent. Use fresh phrasing, new sentence structures, and a slightly different angle.",
        simplify:     "Simplify this text: use plainer language, shorter sentences, and clearer ideas. Make it easy to understand without dumbing it down.",
        example:      "Add a concrete, vivid example or illustration that supports the ideas in this text. Integrate it naturally.",
        strengthen:   "Strengthen the argument and emotional impact of this text. Make it more powerful, convincing, and memorable.",
        fix:          "Fix all grammar, spelling, punctuation, and style errors in this text. Preserve the author's voice and meaning.",
        "fix-grammar":"Fix all grammar, spelling, punctuation, and style errors in this text. Preserve the author's voice and meaning.",
        "paragraphs": "Split this text into well-structured paragraphs. Each paragraph should develop one clear idea and flow naturally into the next. Separate every paragraph with a blank line. Preserve all content and wording exactly — only add or adjust paragraph breaks, do not change the words themselves.",
        "adapt-tone": "Adapt the tone of this text as instructed. Keep the meaning intact while shifting the register, voice, or emotional quality.",
        translate:    targetLang ? `Translate this text into ${targetLang}. Keep the meaning, tone, and style as close to the original as possible.` : "Translate this text into English. Keep the meaning, tone, and style as close to the original as possible.",
        format:       "Format and restructure this text according to the user's formatting instructions. Preserve all content and meaning.",
      };
      const modeInstruction = modeInstructions[mode] || modeInstructions.improve;
      const styleNote = style && style !== "original" ? ` Apply a ${style} style.` : "";
      const customNote = customInstruction ? ` Additional instruction: ${customInstruction}` : "";

      // getOpenAI is called early so it can be reused for embedding lookup below
      const ai = await getOpenAI(req);

      // ── Role model style context (Phase 3) ──────────────────────────────────
      // Only injected when the caller explicitly opts in via useRoleModels+bookId.
      // Entire block is non-fatal: any failure falls back to no role model context.
      let roleModelContext = "";
      if (useRoleModels && bookId) {
        try {
          const numericBookId = parseInt(bookId, 10);
          if (!isNaN(numericBookId)) {
            const allModels = await storage.getAuthorRoleModels(numericBookId);
            let candidates = allModels;

            // Filter to requested IDs if provided; otherwise use all book models
            if (Array.isArray(selectedRoleModelIds) && selectedRoleModelIds.length > 0) {
              const idSet = new Set(selectedRoleModelIds.map(Number));
              candidates = allModels.filter(m => idSet.has(m.id));
            }

            if (candidates.length > 0) {
              // Rank by embedding similarity to the current text
              // Models without embeddings fall to the end but are still included
              const ranked = await findRelevantModels(ai, text, candidates);
              const withEmbedding = ranked.map(r => r.model);
              const withoutEmbedding = candidates.filter(
                m => !ranked.find(r => r.model.id === m.id),
              );
              const ordered = [...withEmbedding, ...withoutEmbedding].slice(0, 3);

              const trim = (s: string | null | undefined, max = 350) =>
                s?.trim() ? s.trim().slice(0, max) : "";

              const sections = ordered.map(m => {
                const label = [m.name, m.authorName].filter(Boolean).join(" — ");
                const influence = m.influencePercent ? ` (${m.influencePercent}% influence)` : "";
                const fields = [
                  trim(m.conceptualTendencies) && `Conceptual tendencies: ${trim(m.conceptualTendencies)}`,
                  trim(m.stylePatterns)         && `Style patterns: ${trim(m.stylePatterns)}`,
                  trim(m.structurePatterns)     && `Structure patterns: ${trim(m.structurePatterns)}`,
                  trim(m.rhythmObservations)    && `Rhythm: ${trim(m.rhythmObservations)}`,
                  trim(m.vocabularyTendencies)  && `Vocabulary: ${trim(m.vocabularyTendencies)}`,
                  trim(m.argumentBehavior)      && `Argument behavior: ${trim(m.argumentBehavior)}`,
                  trim(m.emotionalDynamics)     && `Emotional dynamics: ${trim(m.emotionalDynamics)}`,
                  trim(m.reusableParameters)    && `Reusable parameters: ${trim(m.reusableParameters)}`,
                  // styleInstruction as an extra layer when the structured fields are thin
                  (!trim(m.stylePatterns) && !trim(m.conceptualTendencies) && trim(m.styleInstruction))
                    && `Style note: ${trim(m.styleInstruction)}`,
                ].filter(Boolean);

                if (fields.length === 0) return null;
                return `[${label}${influence}]\n${fields.join("\n")}`;
              }).filter(Boolean);

              if (sections.length > 0) {
                roleModelContext =
                  `\n\nSTYLE CONTEXT — Author role models to embody:\n\n` +
                  sections.join("\n\n") +
                  `\n\nAlign the writing style and voice to the above profile. ` +
                  `The action's purpose (${mode}) takes priority — style is secondary.`;
              }
            }
          }
        } catch (rmErr) {
          console.error("[ai/improve] Role model context failed (non-fatal):", rmErr);
        }
      }
      // ────────────────────────────────────────────────────────────────────────

      // Fetch master prompt for the book if bookId is provided
      let masterPromptContext = "";
      if (bookId) {
        try {
          const numericId = parseInt(bookId, 10);
          if (!isNaN(numericId)) {
            const bookData = await storage.getBook(numericId);
            if (bookData?.masterPrompt?.trim()) {
              masterPromptContext = `\n\n[MASTER PROMPT — TOP PRIORITY AUTHOR CONTEXT]\n${bookData.masterPrompt.trim()}\n[END MASTER PROMPT]`;
            }
          }
        } catch {}
      }

      const genreNote = bookGenre ? ` Genre: ${bookGenre}.` : "";
      const systemPrompt =
        `You are an expert editor and writer.${masterPromptContext} ${modeInstruction}${styleNote}${customNote}` +
        `${roleModelContext}` +
        ` Return ONLY the result, no preamble or explanation.` +
        ` IMPORTANT: If the input contains blank lines (double newlines) separating paragraphs,` +
        ` you MUST preserve those blank lines in the exact same positions in your output — do not merge paragraphs or remove the blank lines.` +
        ` ${langInstruction3}\nContext: Book "${bookTitle || ""}" (${bookMode === "fiction" ? "fiction" : "non-fiction"}).${genreNote}`;

      const aiModel = await getUserModel(req);
      const completion = await ai.chat.completions.create({
        model: aiModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });
      trackTokens(getUserId(req), completion.usage?.total_tokens || 0);
      const improved = completion.choices[0].message.content?.trim() || "";
      res.json({ original: text, improved });
    } catch (e: any) {
      const { status, message } = openAIErrorMessage(e);
      res.status(status).json({ error: message });
    }
  });

  app.post("/api/ai/adapt-language", async (req: Request, res: Response) => {
    try {
      const { text, targetLanguage, bookTitle, bookMode, chapterTitle } = req.body;
      if (!text || !targetLanguage) return res.status(400).json({ error: "text and targetLanguage are required" });

      const systemPrompt = `You are the Native Translation Agent — a specialist in literary language adaptation.
Your task: Adapt the text natively into ${targetLanguage}.
Preserve meaning, narrative tone, and stylistic identity of the original text.
Ensure the adaptation reads naturally for a native ${targetLanguage} speaker while remaining faithful to the original structure and intent.
This is NOT a literal word-for-word translation but a stylistic language adaptation.
Return ONLY the adapted text, no preamble or explanation. Do NOT skip or summarize any part — translate the ENTIRE input.
Context: Book "${bookTitle || ""}" (${bookMode === "fiction" ? "literary fiction" : "non-fiction"})`;

      const ai = await getOpenAI(req);
      const ADAPT_MODEL = "o4-mini";
      const ADAPT_MAX_TOKENS = 32000;

      const CHUNK_WORD_LIMIT = 6000;
      const paragraphs = text.split(/\n\n+/);

      const splitOversizedParagraph = (para: string): string[] => {
        const words = para.split(/\s+/).filter(Boolean);
        if (words.length <= CHUNK_WORD_LIMIT) return [para];
        const parts: string[] = [];
        const sentences = para.split(/(?<=[.!?])\s+/);
        let buf: string[] = [];
        let bufWords = 0;
        for (const sentence of sentences) {
          const sWords = sentence.split(/\s+/).filter(Boolean).length;
          if (bufWords + sWords > CHUNK_WORD_LIMIT && buf.length > 0) {
            parts.push(buf.join(" "));
            buf = [sentence];
            bufWords = sWords;
          } else {
            buf.push(sentence);
            bufWords += sWords;
          }
        }
        if (buf.length > 0) parts.push(buf.join(" "));
        return parts;
      };

      const chunks: string[] = [];
      let currentChunk: string[] = [];
      let currentWordCount = 0;

      for (const para of paragraphs) {
        const subParas = splitOversizedParagraph(para);
        for (const sub of subParas) {
          const subWords = sub.split(/\s+/).filter(Boolean).length;
          if (currentWordCount + subWords > CHUNK_WORD_LIMIT && currentChunk.length > 0) {
            chunks.push(currentChunk.join("\n\n"));
            currentChunk = [sub];
            currentWordCount = subWords;
          } else {
            currentChunk.push(sub);
            currentWordCount += subWords;
          }
        }
      }
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.join("\n\n"));
      }

      const adaptedChunks: string[] = [];
      let totalTokens = 0;

      for (const chunk of chunks) {
        const completion = await ai.chat.completions.create({
          model: ADAPT_MODEL,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: chunk },
          ],
          max_completion_tokens: ADAPT_MAX_TOKENS,
        });
        totalTokens += completion.usage?.total_tokens || 0;
        const finishReason = completion.choices[0].finish_reason;
        if (finishReason === "length") {
          throw Object.assign(new Error("Adaptation output was truncated (max tokens reached). Try splitting the chapter into smaller parts."), { status: 422 });
        }
        const result = completion.choices[0].message.content?.trim() || "";
        adaptedChunks.push(result);
      }

      trackTokens(getUserId(req), totalTokens);
      const adapted = adaptedChunks.join("\n\n");

      let adaptedTitle = chapterTitle || "";
      if (chapterTitle) {
        try {
          const titleCompletion = await ai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: `Translate this chapter title to ${targetLanguage}. Return ONLY the translated title, no quotes, no explanation.` },
              { role: "user", content: chapterTitle },
            ],
            max_completion_tokens: 100,
          });
          adaptedTitle = titleCompletion.choices[0]?.message?.content?.trim() || chapterTitle;
        } catch { adaptedTitle = chapterTitle; }
      }

      res.json({ adapted, adaptedTitle, chunkCount: chunks.length });
    } catch (e: any) {
      const { status, message, code } = openAIErrorMessage(e);
      res.status(status).json({ error: message, code });
    }
  });

  // ---- AI Book Annotation Generation ----
  app.post("/api/ai/book-annotation", async (req: Request, res: Response) => {
    try {
      const { prompt, bookTitle, chapterSummaries, lang } = req.body;
      const langInstruction = getLangInstruction(req);
      const systemPrompt = `You are a professional book editor and copywriter. Write a compelling back-cover annotation (book blurb) for the book described below. The annotation must: be between 350 and 600 characters, be written in the same language as the user's description, capture the essence and intrigue of the book without spoilers, be engaging and enticing. Return ONLY the annotation text with no headers, no quotes, no explanations. ${langInstruction}`;
      const context = [
        bookTitle ? `Book title: "${bookTitle}"` : "",
        chapterSummaries ? `Chapter overview:\n${chapterSummaries}` : "",
        prompt ? `Author's description / notes:\n${prompt}` : "",
      ].filter(Boolean).join("\n");

      let annotation = "";
      try {
        const ai = await getOpenAI(req);
        const aiModel = await getUserModel(req);
        const completion = await ai.chat.completions.create({
          model: aiModel,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: context },
          ],
          temperature: 0.75,
          max_tokens: 400,
        });
        trackTokens(getUserId(req), completion.usage?.total_tokens || 0);
        annotation = completion.choices[0].message.content?.trim() || "";
      } catch (openaiErr: any) {
        const seed = Math.floor(Math.random() * 99999);
        const pollinationsRes = await fetch("https://text.pollinations.ai/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: context },
            ],
            model: "openai",
            seed,
            private: true,
          }),
          signal: AbortSignal.timeout(35000),
        });
        if (!pollinationsRes.ok) {
          return res.status(502).json({ error: "free_unavailable", message: "AI unavailable. Try again in a moment." });
        }
        annotation = (await pollinationsRes.text()).trim();
        if (annotation.startsWith("{") || annotation.startsWith("[")) {
          try {
            const parsed = JSON.parse(annotation);
            annotation = parsed?.choices?.[0]?.message?.content || parsed?.content || annotation;
          } catch {}
        }
      }
      annotation = annotation.slice(0, 600);
      res.json({ annotation });
    } catch (e: any) {
      res.status(500).json({ error: "annotation_error", message: e?.message || "Failed to generate annotation" });
    }
  });

  // ---- File Text Extraction (EPUB / TXT / MD) ----
  app.post("/api/ai/parse-file", uploadText.single("file"), async (req: Request, res: Response) => {
    try {
      const file = (req as any).file as Express.Multer.File | undefined;
      if (!file) return res.status(400).json({ error: "No file uploaded" });

      const ext = path.extname(file.originalname).toLowerCase();
      let text = "";

      if (ext === ".epub") {
        const zip = await JSZip.loadAsync(file.buffer);
        const htmlFiles: string[] = [];
        zip.forEach((relativePath) => {
          if (/\.(xhtml|html|htm|xml)$/.test(relativePath) && !relativePath.includes("toc")) {
            htmlFiles.push(relativePath);
          }
        });
        htmlFiles.sort();
        const parts: string[] = [];
        for (const f of htmlFiles) {
          const content = await zip.file(f)!.async("string");
          const stripped = content
            .replace(/<[^>]+>/g, " ")
            .replace(/&[a-z]+;/gi, " ")
            .replace(/\s+/g, " ")
            .trim();
          if (stripped.length > 30) parts.push(stripped);
        }
        text = parts.join("\n\n");
      } else {
        text = file.buffer.toString("utf-8");
      }

      if (text.length < 50) {
        return res.status(422).json({ error: "File contains too little text" });
      }

      res.json({ text: text.slice(0, 120000), length: text.length, filename: file.originalname });
    } catch (e: any) {
      res.status(500).json({ error: "parse_error", message: e?.message || "Failed to parse file" });
    }
  });

  // ---- AI Style Analysis ----
  app.post("/api/ai/analyze-style", async (req: Request, res: Response) => {
    try {
      const { content, bookTitle, bookMode } = req.body;
      if (!content || content.trim().length < 50) {
        return res.status(400).json({ error: "Недостаточно текста для анализа" });
      }
      const ai = await getOpenAI(req);
      const aiModel = await getUserModel(req);
      const completion = await ai.chat.completions.create({
        model: aiModel,
        messages: [
          {
            role: "system",
            content: `You are an expert literary analyst. Deeply analyze the author's unique writing style in the provided text and return a JSON object with exactly these fields:
- vocabularyLevel: "simple" | "medium" | "complex" — richness and variety of word choice
- avgSentenceLength: "short" | "medium" | "long" — typical sentence construction
- tone: "neutral" | "academic" | "journalistic" | "philosophical" | "lyrical" | "satirical" | "ironic" | "dramatic" — dominant emotional register
- rhythm: "dynamic" | "measured" | "meditative" | "staccato" | "flowing" — prose rhythm and pacing
- pov: "first-person" | "third-person-close" | "third-person-distant" | "second-person" | "mixed" — narrative perspective
- dialogueStyle: "sparse" | "moderate" | "frequent" | "none" — how dialogue is used
- devices: string[] — list of 4–6 literary/rhetorical techniques this author uses (e.g. "rich metaphors", "short declarative sentences", "stream of consciousness", "detailed sensory descriptions")
- patterns: string — 2–3 sentences describing this author's most distinctive stylistic fingerprints and patterns
- summary: string — 3–4 sentences capturing the overall writing style, voice, and what makes this author unique
- styleInstruction: string — a precise, actionable instruction (3–5 sentences) for an AI co-author to perfectly mimic this writing style when generating new text
Return only valid JSON, no extra wrappers or markdown.`,
          },
          {
            role: "user",
            content: `Book: "${bookTitle || ""}" (${bookMode === "fiction" ? "fiction" : "non-fiction"})\n\nText sample:\n${content.slice(0, 5000)}`,
          },
        ],
        temperature: 0.2,
        response_format: { type: "json_object" },
      });
      trackTokens(getUserId(req), completion.usage?.total_tokens || 0);
      const raw = completion.choices[0].message.content || "{}";
      res.json(JSON.parse(raw));
    } catch (e: any) {
      const { status, message } = openAIErrorMessage(e);
      res.status(status).json({ error: message });
    }
  });

  // ---- AI Generation ----
  app.post("/api/ai/generate", async (req: Request, res: Response) => {
    try {
      const { mode, prompt, context, bookMode, chapterTitle, bookTitle, styleAnalysis } = req.body;

      const lang4 = getLangInstruction(req);
      const styleHint = styleAnalysis
        ? `\n\n=== AUTHOR STYLE PROFILE ===\nTone: ${styleAnalysis.tone || ""}. Vocabulary: ${styleAnalysis.vocabularyLevel || ""}. Sentences: ${styleAnalysis.avgSentenceLength || ""}. Rhythm: ${styleAnalysis.rhythm || ""}. POV: ${styleAnalysis.pov || ""}. Dialogue: ${styleAnalysis.dialogueStyle || ""}. Literary devices: ${(styleAnalysis.devices || []).join(", ")}.\nDistinctive patterns: ${styleAnalysis.patterns || ""}\n${styleAnalysis.styleInstruction ? `Style instruction: ${styleAnalysis.styleInstruction}` : ""}\nIMPORTANT: Generate text that precisely matches this author's unique style, voice, and rhythm. Do NOT default to generic writing.`
        : "";

      const systemPrompts: Record<string, string> = {
        continue: `You are a professional co-author. Continue the text naturally and organically, preserving the author's style and tone. Do not repeat what was already written, simply continue. ${lang4}${styleHint}`,
        develop: `You are a professional co-author. Develop the idea, add new ideas, arguments and examples. Expand the concept. ${lang4}${styleHint}`,
        newChapter: `You are a professional co-author. Create a complete new chapter for the book. Include an introduction, main body with several paragraphs and a conclusion. ${lang4}${styleHint}`,
        alternatives: `You are a professional co-author. Create 3 alternative versions of the given text. Each version should be marked "Version 1:", "Version 2:", "Version 3:". ${lang4}`,
        improve: `You are a professional editor and writer. Improve the given text: make it clearer, more expressive and compelling. Preserve the main idea. ${lang4}`,
        ideas: `You are a creative writing assistant. Generate 5–7 new ideas for developing the topic or book. Each idea should be specific and interesting. ${lang4}`,
        chapters: `You are a literary editor. Suggest 5 new chapters for the book with a brief description (2–3 sentences) of each. Take into account the already written context. ${lang4} Format: "Chapter N: [Title]\n[Description]"`,
        topics: `You are an expert in book structure. Suggest 5–7 new topics for research or development within this book. Justify each topic in 1–2 sentences. ${lang4}`,
        research: `You are a scientific consultant. Suggest 5 new research directions on the book's topic. For each: title, brief justification and possible sources. ${lang4}`,
        scientific: `You are an expert in scientific writing. Help create a logically structured scientific text with theses, arguments and evidence. ${lang4}`,
        fiction: `You are a master of literary prose. Help create vivid, imaginative literary text with bright characters, dialogues and atmosphere. ${lang4}`,
      };

      const systemPrompt = systemPrompts[mode] || systemPrompts.continue;
      const contextInfo = context ? `\n\nКонтекст книги:\nНазвание: ${bookTitle || ""}\nТекущая глава: ${chapterTitle || ""}\n\nСуществующий текст:\n${context}` : "";

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const ai = await getOpenAI(req);
      const aiModel = await getUserModel(req);
      const userId = getUserId(req);
      let totalTokens = 0;

      const stream = await ai.chat.completions.create({
        model: aiModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt + contextInfo },
        ],
        stream: true,
        stream_options: { include_usage: true },
        max_completion_tokens: 2000,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
        if (chunk.usage?.total_tokens) {
          totalTokens = chunk.usage.total_tokens;
        }
      }

      trackTokens(userId, totalTokens);
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (e: any) {
      const { status, message } = openAIErrorMessage(e);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
        res.end();
      } else {
        res.status(status).json({ error: message });
      }
    }
  });

  // ───── FREE AI ROUTE (no API key required) ─────

  app.post("/api/ai/free", async (req: Request, res: Response) => {
    try {
      const { prompt, context, bookTitle, chapterTitle, lang, mode } = req.body;

      const langPrefix = lang === "ru" ? "Отвечай ТОЛЬКО на русском языке."
        : lang === "ua" ? "Відповідай ТІЛЬКИ українською мовою."
        : lang === "de" ? "Antworte NUR auf Deutsch."
        : "Reply ONLY in English.";

      const modeInstructions: Record<string, string> = {
        continue:    "You are a creative co-author. Continue the text naturally, preserving the author's voice and style. Do not repeat what was written. Be concise (max 250 words).",
        develop:     "You are a creative co-author. Develop the idea further — add new angles, arguments, examples, and depth. Expand the concept thoughtfully. Be concise (max 250 words).",
        improve:     "You are an expert editor. Improve the given text: make it clearer, more expressive, and more compelling. Preserve the author's core voice. Return ONLY the improved text, no explanations.",
        expand:      "You are an expert writer. Expand this text with more detail, vivid examples, and deeper analysis. Make it richer and more comprehensive. Return ONLY the expanded text.",
        shorten:     "You are an expert editor. Make this text more concise — cut unnecessary words, tighten sentences, keep only what matters. Return ONLY the condensed version.",
        rephrase:    "You are an expert editor. Rephrase this text in a different way while preserving the exact meaning. Change the expression, not the substance. Return ONLY the rephrased version.",
        example:     "You are a skilled writer. Add a concrete, vivid example or illustration that supports the ideas in this text. Integrate it naturally. Return the original text with the example added.",
        strengthen:  "You are a rhetorical expert. Strengthen the argument and emotional impact of this text. Make it more powerful, convincing, and memorable. Return ONLY the strengthened version.",
        fix:         "You are an expert proofreader. Fix all grammar, spelling, punctuation, and style errors in the text. Preserve the author's voice and meaning. Return ONLY the corrected text.",
        format:      "You are a professional editor. Format and restructure the provided text according to the user's formatting instructions. Preserve all content. Return ONLY the reformatted text.",
        newChapter:  "You are a literary editor. Draft a complete new chapter introduction for this book, with a strong opening, key ideas, and a compelling narrative thread. Be concise (max 300 words).",
        chapters:    "You are a literary editor. Suggest 5 new chapters for this book. For each: write the title and a 2–3 sentence description. Format: 'Chapter N: [Title]\\n[Description]'",
        topics:      "You are an expert book architect. Suggest 5–7 new topics or angles for this book. For each: title and 1–2 sentence justification. Be specific and insightful.",
        research:    "You are a research consultant. Suggest 5 research directions for this book's subject. For each: title, brief rationale, and type of sources to explore.",
        ideas:       "You are a creative writing consultant. Generate 5–7 specific, interesting ideas for developing this book's topic or narrative. Each idea should open new possibilities.",
        alternatives:"You are a creative editor. Write 3 alternative versions of the given text, each with a distinct voice or angle. Label them 'Version 1:', 'Version 2:', 'Version 3:'.",
        style_analyze: "You are an expert literary analyst. Deeply analyze the author's unique writing style. Return a JSON object with these fields: vocabularyLevel ('simple'|'medium'|'complex'), avgSentenceLength ('short'|'medium'|'long'), tone ('neutral'|'academic'|'journalistic'|'philosophical'|'lyrical'|'satirical'|'ironic'|'dramatic'), rhythm ('dynamic'|'measured'|'meditative'|'staccato'|'flowing'), pov ('first-person'|'third-person-close'|'third-person-distant'|'second-person'|'mixed'), dialogueStyle ('sparse'|'moderate'|'frequent'|'none'), devices (array of 4-6 specific literary/rhetorical techniques used), patterns (2-3 sentences on distinctive fingerprints), summary (3-4 sentences on overall voice and what makes this author unique), styleInstruction (3-5 sentence precise instruction for an AI to mimic this exact style). Return ONLY valid raw JSON, no markdown wrappers.",
      };

      const modeInstruction = modeInstructions[mode] || modeInstructions.continue;
      const systemHint = `${langPrefix} ${modeInstruction}`;

      const contextBlock = context
        ? `\nBook: "${bookTitle || ""}"\nChapter: "${chapterTitle || ""}"\nExisting text:\n${context.slice(0, 1200)}\n`
        : "";

      const userPrompt = `${contextBlock}\n${prompt}`.trim();

      const seed = Math.floor(Math.random() * 99999);

      // Use POST to avoid URL length limits (Cyrillic text encodes to 6x size via GET)
      const pollinationsRes = await fetch("https://text.pollinations.ai/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemHint },
            { role: "user", content: userPrompt },
          ],
          model: "openai",
          seed,
          private: true,
        }),
        signal: AbortSignal.timeout(35000),
      });

      if (!pollinationsRes.ok) {
        // Fallback to GET for short prompts if POST fails
        if (userPrompt.length < 800) {
          const encodedPrompt = encodeURIComponent(userPrompt);
          const encodedSystem = encodeURIComponent(systemHint);
          const fallbackUrl = `https://text.pollinations.ai/${encodedPrompt}?model=openai&seed=${seed}&system=${encodedSystem}&private=true`;
          const fallbackRes = await fetch(fallbackUrl, { method: "GET", signal: AbortSignal.timeout(30000) });
          if (fallbackRes.ok) {
            const fallbackText = await fallbackRes.text();
            return res.json({ content: fallbackText.trim() });
          }
        }
        if (pollinationsRes.status === 429) {
          return res.status(429).json({ error: "free_rate_limit", message: "Free AI rate limit reached. Try again in a moment, or add your OpenAI key for unlimited access." });
        }
        return res.status(502).json({ error: "free_unavailable", message: `Free AI unavailable (${pollinationsRes.status})` });
      }

      const resultText = await pollinationsRes.text();
      // Handle case where Pollinations returns JSON instead of plain text
      let content = resultText.trim();
      if (content.startsWith("{") || content.startsWith("[")) {
        try {
          const parsed = JSON.parse(content);
          content = parsed?.choices?.[0]?.message?.content || parsed?.content || content;
        } catch { /* keep as-is */ }
      }
      res.json({ content });
    } catch (e: any) {
      if (e?.name === "TimeoutError") {
        return res.status(504).json({ error: "free_timeout", message: "Free AI timed out. Try again or add your OpenAI key for faster responses." });
      }
      res.status(500).json({ error: "free_error", message: e?.message || "Free AI error" });
    }
  });

  // ─── Multi-Agent AI endpoint ─────────────────────────────────────────────
  app.post("/api/ai/agent", isAuthenticated, async (req: Request, res: Response) => {
    const { agentType, readerProfile, chapterText, bookTitle, bookMode, narrativeContext, lang, characters } = req.body;
    if (!agentType) return res.status(400).json({ error: "agentType required" });

    let ai: OpenAI;
    let model: string;
    try {
      ai = await getOpenAI(req);
      model = await getUserModel(req);
    } catch (e: any) {
      const { status, message, code } = openAIErrorMessage(e);
      return res.status(status).json({ error: message, code });
    }

    const nc = (narrativeContext as Record<string, string>) || {};
    const bookCtx = [
      `Book: "${bookTitle || ""}" (${bookMode || "general"})`,
      nc.coreIdea ? `Core Idea: ${nc.coreIdea}` : "",
      nc.themes ? `Themes: ${nc.themes}` : "",
      nc.structure ? `Structure: ${nc.structure}` : "",
      nc.tone ? `Tone: ${nc.tone}` : "",
      nc.targetReader ? `Target Reader: ${nc.targetReader}` : "",
    ].filter(Boolean).join("\n");

    const chapterCtx = chapterText
      ? `\n\nChapter Text:\n${String(chapterText).slice(0, 3000)}`
      : "";
    const charCtx = Array.isArray(characters) && characters.length
      ? `\n\nCharacters: ${characters.map((c: any) => `${c.name} (${c.role})`).join(", ")}`
      : "";

    const langInstruction =
      lang === "ru" ? "Respond entirely in Russian." :
      lang === "ua" ? "Respond entirely in Ukrainian." :
      lang === "de" ? "Respond entirely in German." :
      "Respond in English.";

    const REPORT_SECTIONS = `
**1. STRUCTURAL OVERVIEW**
Analysis of the text's architecture — how it is organised, what sections exist, how information flows.

**2. CORE IDEA EXTRACTION**
The central thesis, narrative driver, or main claim. State it precisely, then evaluate how well the text communicates it.

**3. DEEP ANALYSIS**
Detailed breakdown specific to this agent's domain (see task below).

**4. STRENGTH ASSESSMENT**
What works particularly well — be specific, reference actual passages or choices.

**5. WEAKNESS DIAGNOSIS**
Specific structural, conceptual, or craft problems. Name them precisely, not generally.

**6. READER EXPERIENCE SIMULATION**
How the text may be perceived, where readers will engage or disengage, what questions it triggers.

**7. STRATEGIC RECOMMENDATIONS**
Concrete, actionable suggestions ranked by impact. Reference specific passages where possible.

**8. VISION VECTORS**
New directions the author could explore — what could make this text exceptional or transformative.`;

    type AgentDef = { role: string; task: string };
    const agentDefs: Record<string, AgentDef> = {
      editor: {
        role: "You are a professional Editorial Agent — a seasoned book editor who has worked with major publishers. You read manuscripts with surgical precision, caring about clarity, structure, and the reader's experience on every page. You write your analysis as a formal editorial memo addressed to the author.",
        task: `Produce a full editorial review memo. Your domain is: clarity of writing, logical paragraph structure, sentence construction, readability, flow between ideas, and the quality of transitions.\n\nFormat your response using this structure:\n${REPORT_SECTIONS}\n\nIn section 3 (DEEP ANALYSIS), perform a line-by-line editorial assessment: identify unclear sentences, weak transitions, overly long or short paragraphs, and readability problems.\n\nWrite as a thoughtful, constructive editor — direct but respectful. This should feel like a professional editorial letter.`,
      },
      critic: {
        role: "You are a Critic Agent — a rigorous intellectual critic who analyses texts for logical integrity, argumentative strength, and intellectual honesty. You have the standards of an academic peer reviewer combined with the directness of a sharp cultural critic. You write as a professional critical review.",
        task: `Produce a full critical review. Your domain is: logical coherence, argument structure, evidence quality, intellectual claims, and reasoning validity.\n\nFormat your response using this structure:\n${REPORT_SECTIONS}\n\nIn section 3 (DEEP ANALYSIS), map every major argument: identify the premises, the reasoning chain, the conclusion, and evaluate each link. Identify logical fallacies, unsupported assertions, and circular reasoning explicitly.\n\nBe rigorous but fair. Write as an intelligent, honest critic who wants the work to succeed.`,
      },
      philosopher: {
        role: "You are a Philosophical Agent — a philosopher and intellectual analyst who explores the deeper conceptual architecture of texts. You think in frameworks, trace assumptions, and illuminate the ideas beneath the surface of the writing. You write as a philosophical commentary.",
        task: `Produce a full philosophical analysis. Your domain is: conceptual frameworks, underlying assumptions, philosophical implications, and the deeper ideas the text engages with.\n\nFormat your response using this structure:\n${REPORT_SECTIONS}\n\nIn section 3 (DEEP ANALYSIS), reconstruct the text's implicit philosophical framework: What worldview does it assume? What ontological and epistemological positions does it take? What alternative frameworks would produce different conclusions?\n\nWrite with intellectual depth. This should feel like a philosophical dialogue with the text.`,
      },
      reader: {
        role: `You are a Reader Simulation Agent embodying the perspective of a ${readerProfile || "general"} reader. You inhabit this reader type completely and report your authentic experience of reading this text — confusion, engagement, questions, emotions, and judgments as this specific type of reader would have them.`,
        task: `Produce a full reader experience report from the perspective of a ${readerProfile || "general"} reader.\n\nFormat your response using this structure:\n${REPORT_SECTIONS}\n\nIn section 3 (DEEP ANALYSIS), trace your reading experience sentence by sentence through the major passages — where you leaned in, where you lost the thread, what confused you, what excited you, what questions arose. Be authentic to the ${readerProfile || "general"} reader archetype.\n\nWrite in first person as this reader. Make it feel like a genuine reading diary combined with a structured review.`,
      },
      story_analyst: {
        role: "You are a Narrative Architect Agent — a structural analyst who studies how stories and arguments are built, paced, and resolved. You understand narrative theory, story structure frameworks, and the craft of creating tension, release, and forward momentum in a text.",
        task: `Produce a full narrative structure analysis. Your domain is: story architecture, pacing rhythm, tension curves, narrative voice, scene construction, and structural coherence.\n\nFormat your response using this structure:\n${REPORT_SECTIONS}\n\nIn section 3 (DEEP ANALYSIS), map the narrative or argumentative structure visually in text — identify the opening move, the development phases, the climax or core revelation, and the resolution. Analyse the pacing: where does the text speed up, slow down, lose momentum?\n\nWrite as a structural expert who loves the craft of storytelling.`,
      },
      argument_analyst: {
        role: "You are an Argument Analyst Agent — a specialist in logical structures, rhetorical strategies, and the architecture of persuasion. You evaluate reasoning the way an engineer evaluates a bridge: looking for load-bearing elements, structural weaknesses, and design choices that affect the whole.",
        task: `Produce a full argument analysis report. Your domain is: thesis identification, premise mapping, evidence evaluation, logical chain analysis, and persuasive effectiveness.\n\nFormat your response using this structure:\n${REPORT_SECTIONS}\n\nIn section 3 (DEEP ANALYSIS), create a structured argument map: list each major argument with its premise(s), reasoning chain, and conclusion. Rate each: Strong / Moderate / Weak. Identify which arguments carry the text's persuasive weight and which undermine it.\n\nWrite with the precision of a logician and the accessibility of a debate coach.`,
      },
      consistency: {
        role: "You are a Consistency Agent — a specialist in internal logic, continuity, and coherence across a text. You function like a continuity editor on a film set: nothing escapes your attention when details contradict each other or when the text fails to honour its own rules and premises.",
        task: `Produce a full consistency and continuity review. Your domain is: internal contradictions, character or concept inconsistencies, factual errors, tonal inconsistencies, and continuity failures.\n\nFormat your response using this structure:\n${REPORT_SECTIONS}\n\nIn section 3 (DEEP ANALYSIS), go through the text systematically: list every potential inconsistency you find, however small. For each: describe what is inconsistent, why it matters, and how it could be resolved. If no inconsistencies are found, confirm the text's internal consistency explicitly with evidence.\n\nWrite with the thoroughness of a copy editor and the strategic mind of a developmental editor.`,
      },
    };

    const agent = agentDefs[agentType];
    if (!agent) return res.status(400).json({ error: "Unknown agent type" });

    const systemPrompt = `${agent.role}\n\n${langInstruction}\n\nYou produce long-form, professional analytical reports — not short feedback. Your reports must be substantial enough to provide meaningful, actionable guidance. Write with depth and specificity.`;
    const userPrompt = `BOOK CONTEXT:\n${bookCtx}${chapterCtx}${charCtx}\n\n---\n${agent.task}`;

    try {
      const completion = await ai.chat.completions.create({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 2500,
      });
      const text = completion.choices[0]?.message?.content || "";
      res.json({ result: text });
    } catch (e: any) {
      const { status, message, code } = openAIErrorMessage(e);
      res.status(status).json({ error: message, code });
    }
  });

  // ─── Author Mind Analysis ─────────────────────────────────────────────────
  app.post("/api/ai/author-analysis", isAuthenticated, async (req: Request, res: Response) => {
    const { text, authorName, lang } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: "text required" });

    let ai: OpenAI;
    let model: string;
    try {
      ai = await getOpenAI(req);
      model = await getUserModel(req);
    } catch (e: any) {
      const { status, message, code } = openAIErrorMessage(e);
      return res.status(status).json({ error: message, code });
    }

    const langInstruction =
      lang === "ru" ? "Respond entirely in Russian." :
      lang === "ua" ? "Respond entirely in Ukrainian." :
      lang === "de" ? "Respond entirely in German." :
      "Respond in English.";

    const authorCtx = authorName ? `Author: ${authorName}\n` : "";
    const systemPrompt = `You are an expert in literary analysis, intellectual history, and cognitive science of writing. You reconstruct the author's thinking model from textual evidence — not what they said, but HOW they think, construct arguments, and create meaning.\n\n${langInstruction}\n\nProduce a long-form, multi-layer Author Mind Analysis. This is not a summary — it is a reconstruction of the author's creative and intellectual methodology.`;

    const userPrompt = `${authorCtx}TEXT FOR ANALYSIS:\n${String(text).slice(0, 5000)}\n\n---\nProduce a complete Author Mind Analysis structured as follows:\n\n**1. CONCEPTUAL FRAMEWORK**\nThe philosophical or thematic foundation of this author's thinking. What is their worldview? What assumptions underpin everything they write?\n\n**2. ARGUMENT STRUCTURE**\nHow does this author build reasoning? Inductive or deductive? What is their preferred reasoning pattern?\n\n**3. NARRATIVE STRUCTURE**\nHow does the author organize information, story, or ideas? What structural patterns repeat?\n\n**4. STYLISTIC SIGNATURE**\nSentence rhythm, vocabulary preferences, tonal range, use of metaphor, rhetorical devices. What makes this author's prose immediately recognizable?\n\n**5. THINKING METHODOLOGY**\nThe cognitive approach: how does this author move between abstract and concrete? Between theory and example? What is their method of developing an idea?\n\n**6. EMOTIONAL DYNAMICS**\nHow does the author create tension, urgency, intimacy, or intellectual excitement? What emotional patterns run through the text?\n\n**7. AUTHOR MIND MODEL SUMMARY**\nA synthesized profile of this author's intellectual and creative DNA — what a writer would need to understand to genuinely learn from this author's approach.\n\n**8. KEY TECHNIQUES TO ADOPT**\nSpecific, actionable techniques from this author's toolkit that another writer could study and practice.`;

    try {
      const completion = await ai.chat.completions.create({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 2800,
      });
      const result = completion.choices[0]?.message?.content || "";
      res.json({ result });
    } catch (e: any) {
      const { status, message, code } = openAIErrorMessage(e);
      res.status(status).json({ error: message, code });
    }
  });

  // ─── Agent Collaboration (Full Editorial Board Review) ───────────────────
  app.post("/api/ai/agent-collab", isAuthenticated, async (req: Request, res: Response) => {
    const { chapterText, bookTitle, bookMode, narrativeContext, lang, characters } = req.body;

    let ai: OpenAI;
    let model: string;
    try {
      ai = await getOpenAI(req);
      model = await getUserModel(req);
    } catch (e: any) {
      const { status, message, code } = openAIErrorMessage(e);
      return res.status(status).json({ error: message, code });
    }

    const langInstruction =
      lang === "ru" ? "Respond entirely in Russian." :
      lang === "ua" ? "Respond entirely in Ukrainian." :
      lang === "de" ? "Respond entirely in German." :
      "Respond in English.";

    const nc = (narrativeContext as Record<string, string>) || {};
    const bookCtx = [
      `Book: "${bookTitle || ""}" (${bookMode || "general"})`,
      nc.coreIdea ? `Core Idea: ${nc.coreIdea}` : "",
      nc.themes ? `Themes: ${nc.themes}` : "",
      nc.structure ? `Structure: ${nc.structure}` : "",
      nc.tone ? `Tone: ${nc.tone}` : "",
      nc.targetReader ? `Target Reader: ${nc.targetReader}` : "",
    ].filter(Boolean).join("\n");

    const chapterCtx = chapterText ? `\n\nCHAPTER TEXT:\n${String(chapterText).slice(0, 3500)}` : "";
    const charCtx = Array.isArray(characters) && characters.length
      ? `\nCharacters: ${characters.map((c: any) => `${c.name} (${c.role})`).join(", ")}`
      : "";

    const systemPrompt = `You are the Editorial Board of a major literary publisher — five distinct expert voices who have collaboratively reviewed this manuscript. You write a joint editorial board report that synthesises multiple professional perspectives into one authoritative document.\n\n${langInstruction}\n\nYou represent: a Senior Editor (clarity & structure), a Critic (logic & argument), a Philosopher (conceptual depth), a Narrative Architect (story structure & pacing), and a Consistency Editor (internal logic & continuity). Each contributes their perspective to a unified report.`;

    const userPrompt = `BOOK CONTEXT:\n${bookCtx}${chapterCtx}${charCtx}\n\n---\nProduce a Full Editorial Board Review — a comprehensive, multi-perspective manuscript analysis. Structure it as follows:\n\n**EDITORIAL BOARD REVIEW**\n*Collaborative analysis from five expert perspectives*\n\n**1. EDITORIAL ASSESSMENT** *(Senior Editor)*\nClarity, structure, paragraph quality, readability, and prose effectiveness.\n\n**2. CRITICAL ANALYSIS** *(Critic)*\nLogical integrity, argument strength, evidence quality, reasoning validity.\n\n**3. PHILOSOPHICAL DIMENSIONS** *(Philosopher)*\nConceptual framework, underlying assumptions, intellectual depth.\n\n**4. NARRATIVE ARCHITECTURE** *(Narrative Architect)*\nStory or argument structure, pacing, tension, forward momentum.\n\n**5. CONSISTENCY REVIEW** *(Consistency Editor)*\nInternal logic, continuity, contradictions, tonal coherence.\n\n**6. CONSENSUS STRENGTHS**\nWhat all board members agree works exceptionally well.\n\n**7. PRIORITY REVISIONS**\nThe top 5 most important changes the board recommends, in order of impact.\n\n**8. STRATEGIC VISION**\nHow this text could become something exceptional — the board's shared vision for its potential.\n\nWrite each section distinctly, as if a different expert is speaking. The report should feel like a professional editorial board letter to the author.`;

    try {
      const completion = await ai.chat.completions.create({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 3500,
      });
      const result = completion.choices[0]?.message?.content || "";
      res.json({ result });
    } catch (e: any) {
      const { status, message, code } = openAIErrorMessage(e);
      res.status(status).json({ error: message, code });
    }
  });

  // ───── COGNITIVE AGENTS (Linker / Distiller / Expansion / Structuring / Tension / Relevance / Transformation / Mapping) ─────

  app.post("/api/ai/cognitive-agent", async (req: Request, res: Response) => {
    const { agentType, functionType, content, bookTitle, lang } = req.body;
    if (!agentType || !functionType || !content?.trim()) {
      return res.status(400).json({ error: "agentType, functionType, and content are required" });
    }

    const langInstruction =
      lang === "ru" ? "Respond ONLY in Russian." :
      lang === "ua" ? "Respond ONLY in Ukrainian." :
      lang === "de" ? "Respond ONLY in German." :
      "Respond in English.";

    const bookCtx = bookTitle ? `\nBook context: "${bookTitle}"\n` : "";

    type FnMap = Record<string, { system: string; userPrefix: string }>;
    const agentPrompts: Record<string, FnMap> = {
      linker: {
        suggest_links: {
          system: `You are a semantic linking agent. Your task is to find meaningful conceptual connections between the given text and potential related ideas, themes, or knowledge objects. ${langInstruction}`,
          userPrefix: `Find 4–6 meaningful connections for this text. For each connection: (1) name what it connects to, (2) explain why the link is meaningful, (3) describe what new insight the connection reveals. Format as a numbered list with clear headers.\n\nText:\n`,
        },
        suggest_backlinks: {
          system: `You are a semantic backlink agent. Your task is to identify what foundational ideas, sources, or concepts this text builds upon or references. ${langInstruction}`,
          userPrefix: `Identify 4–6 backlinks for this text — what it LINKS BACK to. For each: name the foundational concept/source, explain what is borrowed from it, and suggest how to acknowledge this connection. Format as a numbered list.\n\nText:\n`,
        },
        detect_related: {
          system: `You are a conceptual neighborhood mapper. You identify related concepts, themes, and ideas that exist in the same intellectual space as the given text. ${langInstruction}`,
          userPrefix: `Identify 5–7 related concepts that exist in the same conceptual neighborhood as this text. For each: name the concept, describe the nature of the relationship (sibling idea, broader context, parallel example, contrasting concept, etc.), and explain its relevance.\n\nText:\n`,
        },
        hidden_connections: {
          system: `You are a deep semantic analyst. You find hidden, non-obvious, and surprising conceptual connections — things beneath the surface that most readers would miss. ${langInstruction}`,
          userPrefix: `Find 3–5 hidden or non-obvious connections in this text. Look beyond surface meaning to latent structures, unexpected parallels, and subtle thematic bridges. For each: name the hidden connection and explain why it is significant.\n\nText:\n`,
        },
      },
      distiller: {
        summarize_thesis: {
          system: `You are a thesis distillation agent. You compress complex texts to their single essential claim. ${langInstruction}`,
          userPrefix: `Distill this text into ONE precise thesis sentence that captures the essential claim or insight. Then provide 2–3 sentences of explanation — why this is the core, what supports it, and what it implies.\n\nText:\n`,
        },
        extract_key_ideas: {
          system: `You are a key idea extractor. You identify and articulate the most important ideas in a text with precision. ${langInstruction}`,
          userPrefix: `Extract the 4–6 most important ideas from this text. For each idea: state it clearly in one sentence, explain what makes it significant, and note how it relates to the text's central argument.\n\nText:\n`,
        },
        reduce_to_insight: {
          system: `You are an insight reduction agent. You find the diamond at the center of complex thinking. ${langInstruction}`,
          userPrefix: `Reduce this text to its clearest, most essential insight — the single thing that matters most. Remove all complexity. Then explain: what surrounds this insight, what supports it, and what it leads to. Be precise and direct.\n\nText:\n`,
        },
        identify_center: {
          system: `You are a conceptual center finder. You identify the gravitational core that holds everything else together in a piece of thinking. ${langInstruction}`,
          userPrefix: `Identify the conceptual center of this text — the core idea that everything else revolves around. Describe: the center itself, the inner ring (directly connected ideas), the outer ring (more loosely connected themes), and what holds the whole together.\n\nText:\n`,
        },
      },
      expansion: {
        expand_argument: {
          system: `You are an argument expansion agent. You develop ideas into fully structured arguments. ${langInstruction}`,
          userPrefix: `Expand this into a fully developed argument seed. Structure it as: Thesis statement → Key premises (3–4) → Supporting evidence directions → Counterarguments to address → Conclusion direction. Keep it structured and write-ready.\n\nIdea/note:\n`,
        },
        expand_quote: {
          system: `You are a quote reflection agent. You expand quotes and passages into rich intellectual reflections. ${langInstruction}`,
          userPrefix: `Take this quote/passage and expand it into a full reflection. Cover: (1) meaning analysis, (2) implications and consequences, (3) connections to broader themes, (4) tensions or complications, (5) how it could be used in writing. Write as a flowing intellectual reflection.\n\nQuote/passage:\n`,
        },
        expand_to_draft: {
          system: `You are a draft expansion agent. You transform notes and concepts into ready-to-write draft starters. ${langInstruction}`,
          userPrefix: `Expand this concept/note into a draft starter — a strong opening paragraph (100–150 words) that could begin a section or chapter, followed by a 5–7 point outline of where the argument/narrative could go. Make it immediately write-ready.\n\nConcept/note:\n`,
        },
        expand_cluster: {
          system: `You are a thematic outline agent. You transform clusters of related ideas into structured thematic outlines. ${langInstruction}`,
          userPrefix: `Expand these ideas into a thematic outline for a section or chapter. Structure it as: Theme title → Opening framing → 4–6 major sections with brief descriptions → Closing direction → Suggested connections to develop. Make it a complete structural blueprint.\n\nIdeas/cluster:\n`,
        },
      },
      structuring: {
        recommend_tags: {
          system: `You are a tagging specialist. You create precise, useful conceptual tags — not generic ones. ${langInstruction}`,
          userPrefix: `Suggest 6–10 precise tags for this text. Prioritize conceptual tags over generic ones. For each tag: the tag name, and a one-line explanation of why it fits. Also suggest 2–3 "cluster tags" that could group this with other related notes.\n\nText:\n`,
        },
        recommend_collection: {
          system: `You are a collection and classification agent. You identify where knowledge objects belong in a larger system. ${langInstruction}`,
          userPrefix: `Recommend which collection(s) or category this text belongs to. Suggest 3 options ranked by fit. For each: the collection name, a brief rationale, and how this text would enrich that collection.\n\nText:\n`,
        },
        suggest_note_type: {
          system: `You are a note type classification agent. You match texts to their most appropriate note type. ${langInstruction}`,
          userPrefix: `Analyze this text and recommend the most appropriate note type from: idea, concept, argument, quote, question, insight, observation, reflection, scene, hypothesis, character. Suggest the top 2 types with detailed reasoning. Explain what properties make this text fit each type.\n\nText:\n`,
        },
        suggest_placement: {
          system: `You are a structural placement agent. You identify where a piece of thinking belongs within a book structure. ${langInstruction}`,
          userPrefix: `Suggest where this text belongs in a book structure. Recommend: ideal chapter type (introduction, development, evidence, conclusion, case study, reflection, etc.), position in the arc (early/middle/late), and what should come before and after it. Explain the reasoning.\n\nText:\n`,
        },
        suggest_cluster: {
          system: `You are a knowledge clustering agent. You design ideal intellectual neighborhoods for notes and ideas. ${langInstruction}`,
          userPrefix: `Design the ideal cluster for this text. Describe: the central note (this text's role), the satellite notes that should surround it (4–6 note types/topics), the connections between satellites, and the outer context ring. Explain the logic of the cluster.\n\nText:\n`,
        },
      },
      tension: {
        detect_conflicts: {
          system: `You are a conceptual conflict detector. You find contradictions, tensions, and unresolved oppositions within texts. ${langInstruction}`,
          userPrefix: `Analyze this text for conceptual conflicts. Identify: internal contradictions (where the text argues against itself), unresolved tensions (things left in productive ambiguity), and explicit oppositions. For each: name it precisely, explain why it matters, and suggest whether to resolve or exploit it.\n\nText:\n`,
        },
        show_opposing: {
          system: `You are an adversarial thinking agent. You construct the strongest possible opposing position to any argument. ${langInstruction}`,
          userPrefix: `Construct the strongest possible opposing position to the main claim in this text. Argue it rigorously and seriously — as if you genuinely believe the opposite. Then briefly note: what this opposition reveals about weaknesses in the original argument.\n\nText:\n`,
        },
        identify_contradictions: {
          system: `You are a contradiction mapping agent. You find every internal inconsistency in a piece of thinking. ${langInstruction}`,
          userPrefix: `Find all internal contradictions in this text. For each contradiction: (1) state it precisely — what Claim A says vs what Claim B says, (2) explain why this is a genuine contradiction, (3) suggest how to resolve it OR how to productively exploit the tension.\n\nText:\n`,
        },
        expose_tensions: {
          system: `You are an underdeveloped tension excavator. You find the pressure points and unresolved questions that a text gestures toward but doesn't fully explore. ${langInstruction}`,
          userPrefix: `Expose the underdeveloped tensions in this text — the points of intellectual pressure that are implied but not explored. For each tension: name it, explain why it matters to the text's core argument, rate how developed it is (1–5), and suggest how to develop it further.\n\nText:\n`,
        },
      },
      relevance: {
        detect_core: {
          system: `You are a relevance evaluation agent. You determine whether knowledge objects are core or peripheral to a body of work. ${langInstruction}`,
          userPrefix: `Evaluate whether this text is CORE or PERIPHERAL to the book context. Provide: a relevance score (1–10), a brief verdict (Core / High Relevance / Moderate / Low / Noise), and a detailed explanation of why. Note what would make it more or less relevant.\n\nText:\n`,
        },
        identify_noise: {
          system: `You are a noise detection agent. You identify what detracts from the signal in a piece of thinking. ${langInstruction}`,
          userPrefix: `Analyze this text for noise — parts that distract from, dilute, or don't contribute to the core argument. For each noisy element: identify it, explain why it's noise (tangential, redundant, unclear, underdeveloped, etc.), and suggest what to do with it (cut, develop, relocate, reframe).\n\nText:\n`,
        },
        show_unused: {
          system: `You are an unrealized potential detector. You find important ideas that are mentioned but never developed. ${langInstruction}`,
          userPrefix: `Identify the unused potential in this text — important insights that are mentioned in passing but not developed, ideas that deserve much more attention. For each: name the underdeveloped idea, explain its potential importance, and suggest how to develop it.\n\nText:\n`,
        },
        prioritize: {
          system: `You are a concept prioritization agent. You rank ideas by importance and strategic value. ${langInstruction}`,
          userPrefix: `Rank all the concepts in this text by importance. Create a clear priority ordering: Tier 1 (load-bearing — the text fails without these), Tier 2 (important but not essential), Tier 3 (supporting material). For each tier, list the concepts with brief justification.\n\nText:\n`,
        },
      },
      transformation: {
        note_to_draft: {
          system: `You are a note-to-draft transformation agent. You transform raw notes into polished draft fragments ready for use in writing. ${langInstruction}`,
          userPrefix: `Transform this note into a draft fragment — a polished, expanded piece of prose (150–250 words) that could be used directly in writing. Keep the core idea but develop it into literary or analytical form. Then suggest: where in a chapter it might best appear.\n\nNote:\n`,
        },
        note_to_board: {
          system: `You are a note-to-board transformation agent. You transform notes into optimal idea board cards. ${langInstruction}`,
          userPrefix: `Transform this note into an idea board card. Provide: (1) Recommended card type (idea/concept/argument/quote/chapter_seed), (2) Title (max 8 words, punchy), (3) Card content (2–3 sentences, distilled), (4) 3–4 relevant tags, (5) Suggested connections to other potential cards. Format clearly.\n\nNote:\n`,
        },
        source_to_note: {
          system: `You are a source-to-note transformation agent. You extract key insights from source material and transform them into standalone knowledge notes. ${langInstruction}`,
          userPrefix: `Extract the key insight from this source material and transform it into a standalone note. The note should: (1) be self-contained and meaningful without the source, (2) capture the essential contribution, (3) connect it to the book's context. Then suggest a title, type, and tags for the note.\n\nSource material:\n`,
        },
        cluster_to_draft: {
          system: `You are a cluster-to-draft transformation agent. You transform collections of related ideas into ready-to-write draft seeds. ${langInstruction}`,
          userPrefix: `Transform this cluster of ideas into a chapter/section draft seed. Provide: (1) A strong opening paragraph (120–150 words), (2) The governing argument or narrative thread, (3) 5–7 development points in order, (4) A suggested closing move. Make it immediately write-ready.\n\nIdea cluster:\n`,
        },
        map_to_structure: {
          system: `You are a map-to-structure transformation agent. You transform note collections into logical book structures. ${langInstruction}`,
          userPrefix: `Transform this collection of notes/ideas into a book structure — a logical hierarchical outline. Organize into: Part/Chapter titles → Sub-sections → Key arguments per section → Narrative flow logic. Show how the ideas connect into a coherent arc. This should be a real structural blueprint.\n\nNotes/ideas:\n`,
        },
      },
      mapping: {
        create_local_map: {
          system: `You are a local concept map agent. You create structured maps of ideas and their immediate relationships. ${langInstruction}`,
          userPrefix: `Create a local concept map of this text. Structure it as: (1) Central concept, (2) Immediate neighbors — 4–6 directly connected concepts with relationship type, (3) Bridge concepts — ideas that connect two neighbors, (4) Entry point — how a reader enters this map, (5) Exit vectors — where the map leads.\n\nText:\n`,
        },
        concept_cluster: {
          system: `You are a concept cluster agent. You design rich conceptual clusters with multiple rings and bridges. ${langInstruction}`,
          userPrefix: `Create a concept cluster map for the central idea in this text. Design it as: Core concept → Inner ring (3–4 directly connected concepts + connection type) → Middle ring (4–6 related themes) → Outer ring (broader context concepts) → Bridge concepts (connecting rings). Describe the visual shape and the logic.\n\nText:\n`,
        },
        note_constellation: {
          system: `You are a note constellation agent. You design note networks that form meaningful patterns. ${langInstruction}`,
          userPrefix: `Design a note constellation for this text. Describe: (1) The central note (this text's role), (2) 5–7 satellite notes that should orbit it (with brief descriptions), (3) Connections between satellites, (4) The constellation's shape and name, (5) How to navigate this constellation from different entry points.\n\nText:\n`,
        },
        theme_map: {
          system: `You are a theme mapping agent. You create comprehensive thematic maps of texts and collections. ${langInstruction}`,
          userPrefix: `Create a theme map for this text. Identify: Primary themes (1–2 themes the text is fundamentally about), Secondary themes (3–4 important but subordinate themes), Implicit themes (2–3 themes present but unspoken), Thematic tensions (where themes conflict), and Thematic resolution (how themes converge or diverge). Show the relationships.\n\nText:\n`,
        },
        moc_skeleton: {
          system: `You are a Map of Content (MOC) architect. You design MOC notes that serve as navigational hubs in a knowledge system. ${langInstruction}`,
          userPrefix: `Create a Map of Content (MOC) skeleton for the themes in this text. A MOC is a meta-note that links to all related notes. Design: (1) MOC title, (2) Opening description (2–3 sentences), (3) 10–14 note titles organized by sub-theme, (4) 3–4 connections to other MOCs, (5) A brief navigation guide — how to use this MOC. Format as a real MOC skeleton.\n\nText:\n`,
        },
      },
    };

    const agentFns = agentPrompts[agentType];
    if (!agentFns) return res.status(400).json({ error: `Unknown agent type: ${agentType}` });
    const fnDef = agentFns[functionType];
    if (!fnDef) return res.status(400).json({ error: `Unknown function: ${functionType}` });

    const systemPrompt = fnDef.system;
    const userPrompt = `${bookCtx}${fnDef.userPrefix}${content.slice(0, 4000)}`;

    // Try premium (OpenAI) first
    try {
      const ai = await getOpenAI(req);
      const model = await getUserModel(req);
      const completion = await ai.chat.completions.create({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 1800,
      });
      const result = completion.choices[0]?.message?.content || "";
      const userId = getUserId(req);
      if (completion.usage?.total_tokens) trackTokens(userId, completion.usage.total_tokens);
      return res.json({ result });
    } catch (e: any) {
      const { code } = openAIErrorMessage(e);
      if (code !== "no_api_key") {
        const { status, message } = openAIErrorMessage(e);
        return res.status(status).json({ error: message, code });
      }
    }

    // Fallback: free mode via Pollinations
    try {
      const seed = Math.floor(Math.random() * 99999);
      const pollinationsRes = await fetch("https://text.pollinations.ai/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          model: "openai",
          seed,
          private: true,
        }),
        signal: AbortSignal.timeout(35000),
      });
      if (!pollinationsRes.ok) {
        return res.status(502).json({ error: "free_unavailable", message: `Free AI unavailable (${pollinationsRes.status})` });
      }
      let content2 = (await pollinationsRes.text()).trim();
      if (content2.startsWith("{") || content2.startsWith("[")) {
        try { const p = JSON.parse(content2); content2 = p?.choices?.[0]?.message?.content || p?.content || content2; } catch {}
      }
      return res.json({ result: content2 });
    } catch (e: any) {
      return res.status(500).json({ error: "cognitive_agent_error", message: e?.message || "Agent error" });
    }
  });

  // ───── META-PROMPT SMART-ACTION ROUTE ─────────────────────────────────────
  // Assembles full note context from DB, builds a structured layered prompt,
  // and dispatches to the appropriate specialist agent.

  app.post("/api/ai/notes/:noteId/smart-action", isAuthenticated, async (req: Request, res: Response) => {
    const noteId = parseInt(req.params.noteId, 10);
    const { bookId, intent, lang } = req.body;

    if (isNaN(noteId) || !bookId || !intent) {
      return res.status(400).json({ error: "noteId, bookId, and intent are required" });
    }

    const VALID_INTENTS = ["connect", "expand", "distill", "suggest_tags", "to_draft", "suggest_collection"];
    if (!VALID_INTENTS.includes(intent)) {
      return res.status(400).json({ error: `Unknown intent. Valid: ${VALID_INTENTS.join(", ")}` });
    }

    try {
      const ctx = await assembleNoteContext(noteId, bookId, intent, lang || "en");
      const { systemPrompt, userPrompt, maxTokens } = buildStructuredPrompt(ctx);

      // Try premium (user's OpenAI key) first
      try {
        const ai = await getOpenAI(req);
        const model = await getUserModel(req);
        const completion = await ai.chat.completions.create({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          max_tokens: maxTokens,
        });
        const result = completion.choices[0]?.message?.content || "";
        const userId = getUserId(req);
        if (completion.usage?.total_tokens) trackTokens(userId, completion.usage.total_tokens);
        return res.json({ result, intent, contextSummary: {
          linkedNotes: ctx.linkedNotes.length,
          linkedSources: ctx.linkedSources.length,
          collections: ctx.collections.length,
          backlinks: ctx.backlinkedNotes.length,
          recentNotes: ctx.recentNotes.length,
        }});
      } catch (e: any) {
        const { code } = openAIErrorMessage(e);
        if (code !== "no_api_key") {
          const { status, message } = openAIErrorMessage(e);
          return res.status(status).json({ error: message, code });
        }
      }

      // Fallback: free Pollinations
      const seed = Math.floor(Math.random() * 99999);
      const pollinationsRes = await fetch("https://text.pollinations.ai/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          model: "openai",
          seed,
          private: true,
        }),
        signal: AbortSignal.timeout(40000),
      });
      if (!pollinationsRes.ok) {
        return res.status(502).json({ error: "free_unavailable", message: `Free AI unavailable (${pollinationsRes.status})` });
      }
      let text = (await pollinationsRes.text()).trim();
      if (text.startsWith("{") || text.startsWith("[")) {
        try { const p = JSON.parse(text); text = p?.choices?.[0]?.message?.content || p?.content || text; } catch {}
      }
      return res.json({ result: text, intent, contextSummary: {
        linkedNotes: ctx.linkedNotes.length,
        linkedSources: ctx.linkedSources.length,
        collections: ctx.collections.length,
        backlinks: ctx.backlinkedNotes.length,
        recentNotes: ctx.recentNotes.length,
      }});
    } catch (e: any) {
      return res.status(500).json({ error: "smart_action_error", message: e?.message || "Smart action failed" });
    }
  });

  // ───── EXPORT ROUTES ─────

  function blocksToText(blocks: any[]): string {
    if (!Array.isArray(blocks)) return "";
    return blocks.map((b: any) => {
      const text = b.content || b.text || "";
      if (b.type === "heading") return `\n## ${text}\n`;
      if (b.type === "quote") return `> ${text}`;
      return text;
    }).join("\n");
  }

  function escapeXml(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  // Strip HTML tags from rich-text content before embedding in EPUB XHTML.
  // The block editor stores content as HTML; we convert it to safe plain text
  // (decode entities, strip tags, then re-escape for XML).
  function htmlToXhtmlText(html: string): string {
    if (!html) return "";
    return escapeXml(
      html
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/p>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&nbsp;/g, " ")
        .replace(/\u00AD/g, "")
        .trim()
    );
  }

  function blocksToXhtml(blocks: any[], chapterTitle: string): string {
    const bodyLines: string[] = [];
    bodyLines.push(`<h1>${escapeXml(chapterTitle)}</h1>`);
    if (!Array.isArray(blocks)) return bodyLines.join("\n");
    for (const b of blocks) {
      const text = htmlToXhtmlText(b.content || b.text || "");
      if (b.type === "divider") { bodyLines.push("<hr/>"); continue; }
      if (!text) continue;
      switch (b.type) {
        case "h1":
        case "heading":
          bodyLines.push(`<h2>${text}</h2>`);
          break;
        case "h2":
          bodyLines.push(`<h3>${text}</h3>`);
          break;
        case "h3":
          bodyLines.push(`<h4>${text}</h4>`);
          break;
        case "quote":
          bodyLines.push(`<blockquote><p>${text}</p></blockquote>`);
          break;
        case "hypothesis":
          bodyLines.push(`<div class="callout"><p><strong>&#9670;</strong> ${text}</p></div>`);
          break;
        case "argument":
          bodyLines.push(`<div class="callout"><p><strong>&#10003;</strong> ${text}</p></div>`);
          break;
        case "counterargument":
          bodyLines.push(`<div class="callout"><p><strong>&#10007;</strong> ${text}</p></div>`);
          break;
        case "idea":
          bodyLines.push(`<div class="callout"><p><strong>&#9673;</strong> ${text}</p></div>`);
          break;
        case "question":
          bodyLines.push(`<div class="callout"><p><strong>?</strong> ${text}</p></div>`);
          break;
        case "example":
        case "observation":
        case "research":
        case "source_ref":
          bodyLines.push(`<p><em>${text}</em></p>`);
          break;
        default:
          bodyLines.push(`<p>${text}</p>`);
      }
    }
    return bodyLines.join("\n");
  }

  app.get("/api/books/:id/export/epub", isAuthenticated, async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const bookId = Number(req.params.id);
    if (isNaN(bookId)) return res.status(400).json({ error: "Invalid id" });
    const book = await storage.getBook(bookId);
    if (!book || book.userId !== userId) return res.status(404).json({ error: "Not found" });
    const chapters = await storage.getChapters(bookId);

    // Use query params if provided, fall back to book data
    const epubTitle = String(req.query.title || book.title || "Untitled");
    const epubAuthor = String(req.query.author || "");
    const epubLanguage = String(req.query.language || book.language || "ru");

    const zip = new JSZip();

    zip.file("mimetype", "application/epub+zip", { compression: "STORE" });

    zip.folder("META-INF")!.file("container.xml",
      `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`);

    const oebps = zip.folder("OEBPS")!;
    const safeTitle = escapeXml(epubTitle);
    const now = new Date().toISOString().split("T")[0];

    // Cover image embedding
    let coverManifestExtra = "";
    let coverMetaExtra = "";
    let coverSpineItem = "";
    if (book.coverImage && book.coverImage.startsWith("data:")) {
      const match = book.coverImage.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        const mimeType = match[1];
        const base64Data = match[2];
        const ext = mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
        const coverFilename = `cover.${ext}`;
        oebps.file(coverFilename, Buffer.from(base64Data, "base64"));
        oebps.file("cover.xhtml",
          `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><meta charset="UTF-8"/><title>Cover</title>
<style>body{margin:0;padding:0;}img{width:100%;height:100vh;object-fit:cover;display:block;}</style>
</head>
<body><img src="${coverFilename}" alt="Cover"/></body>
</html>`);
        coverManifestExtra = `\n    <item id="cover-image" href="${coverFilename}" media-type="${mimeType}" properties="cover-image"/>
    <item id="cover-page" href="cover.xhtml" media-type="application/xhtml+xml"/>`;
        coverMetaExtra = `\n    <meta name="cover" content="cover-image"/>`;
        coverSpineItem = `<itemref idref="cover-page" linear="yes"/>`;
      }
    }

    const manifestItems = chapters.map(ch =>
      `<item id="ch${ch.id}" href="ch${ch.id}.xhtml" media-type="application/xhtml+xml"/>`
    ).join("\n    ");
    const spineItems = chapters.map(ch =>
      `<itemref idref="ch${ch.id}"/>`
    ).join("\n    ");

    oebps.file("content.opf",
      `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="uid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${safeTitle}</dc:title>
    ${epubAuthor ? `<dc:creator>${escapeXml(epubAuthor)}</dc:creator>` : ""}
    <dc:language>${escapeXml(epubLanguage)}</dc:language>
    <dc:date>${now}</dc:date>
    <dc:identifier id="uid">moodra-${bookId}-${now}</dc:identifier>${coverMetaExtra}
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>${coverManifestExtra}
    ${manifestItems}
  </manifest>
  <spine toc="ncx">
    ${coverSpineItem}
    ${spineItems}
  </spine>
</package>`);

    const navPoints = chapters.map((ch, i) =>
      `<navPoint id="np${ch.id}" playOrder="${i + 1}">
        <navLabel><text>${escapeXml(ch.title)}</text></navLabel>
        <content src="ch${ch.id}.xhtml"/>
      </navPoint>`
    ).join("\n    ");

    oebps.file("toc.ncx",
      `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head><meta name="dtb:uid" content="moodra-${bookId}"/></head>
  <docTitle><text>${safeTitle}</text></docTitle>
  <navMap>
    ${navPoints}
  </navMap>
</ncx>`);

    const navList = chapters.map(ch =>
      `<li><a href="ch${ch.id}.xhtml">${escapeXml(ch.title)}</a></li>`
    ).join("\n      ");
    oebps.file("nav.xhtml",
      `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><meta charset="UTF-8"/><title>${safeTitle}</title></head>
<body>
  <nav epub:type="toc"><h1>Contents</h1><ol>${navList}</ol></nav>
</body>
</html>`);

    for (const ch of chapters) {
      let blocks: any[] = [];
      try { blocks = typeof ch.content === "string" ? JSON.parse(ch.content) : (ch.content || []); } catch {}
      const body = blocksToXhtml(blocks, ch.title);
      oebps.file(`ch${ch.id}.xhtml`,
        `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><meta charset="UTF-8"/><title>${escapeXml(ch.title)}</title></head>
<body>
${body}
</body>
</html>`);
    }

    const epubBuffer = await zip.generateAsync({
      type: "nodebuffer",
      mimeType: "application/epub+zip",
      compression: "DEFLATE",
    });

    const safeFilename = book.title.replace(/[^a-z0-9а-яёА-ЯЁ\s]/gi, "").trim().replace(/\s+/g, "_") || "book";
    res.setHeader("Content-Type", "application/epub+zip");
    res.setHeader("Content-Disposition", `attachment; filename="${safeFilename}.epub"`);
    res.send(epubBuffer);
  });

  app.get("/api/books/:id/export/docx", isAuthenticated, async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const bookId = Number(req.params.id);
    if (isNaN(bookId)) return res.status(400).json({ error: "Invalid id" });
    const book = await storage.getBook(bookId);
    if (!book || book.userId !== userId) return res.status(404).json({ error: "Not found" });
    const chapters = await storage.getChapters(bookId);

    const FONT = "Georgia";
    const BODY_SIZE = 24;
    const H1_SIZE = 32;
    const H2_SIZE = 26;
    const LINE_SPACING = { rule: LineRuleType.EXACT, value: 360 };
    const MARGINS = {
      top: convertInchesToTwip(1),
      bottom: convertInchesToTwip(1),
      left: convertInchesToTwip(1.25),
      right: convertInchesToTwip(1),
    };

    const tocEntries = chapters.map((ch, i) =>
      new Paragraph({
        children: [
          new TextRun({ text: `${i + 1}.  ${ch.title}`, font: FONT, size: BODY_SIZE, color: "444444" }),
        ],
        spacing: { before: 60, after: 60 },
      })
    );

    const allChildren: Paragraph[] = [
      new Paragraph({
        children: [new TextRun({ text: book.title, font: FONT, size: 56, bold: true })],
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { before: 1440, after: 480 },
      }),
      ...(book.description ? [new Paragraph({
        children: [new TextRun({ text: book.description, font: FONT, size: BODY_SIZE, italics: true, color: "666666" })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 2880 },
      })] : []),
      new Paragraph({ children: [new PageBreak()] }),
      new Paragraph({
        children: [new TextRun({ text: "Contents", font: FONT, size: H1_SIZE, bold: true })],
        spacing: { before: 0, after: 480 },
      }),
      ...tocEntries,
      new Paragraph({ children: [new PageBreak()] }),
    ];

    for (let i = 0; i < chapters.length; i++) {
      const ch = chapters[i];
      let blocks: any[] = [];
      try { blocks = typeof ch.content === "string" ? JSON.parse(ch.content) : (ch.content || []); } catch {}

      allChildren.push(
        new Paragraph({
          children: [new TextRun({ text: ch.title, font: FONT, size: H1_SIZE, bold: true })],
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 0, after: 480 },
          pageBreakBefore: i > 0,
        })
      );

      for (const block of blocks) {
        const text = String(block.content || block.text || "").trim();
        if (!text) continue;
        if (block.type === "heading") {
          allChildren.push(new Paragraph({
            children: [new TextRun({ text, font: FONT, size: H2_SIZE, bold: true })],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 240, after: 120 },
          }));
        } else if (block.type === "quote") {
          allChildren.push(new Paragraph({
            children: [new TextRun({ text, font: FONT, size: BODY_SIZE, italics: true, color: "555555" })],
            indent: { left: convertInchesToTwip(0.5) },
            spacing: { before: 120, after: 120, line: LINE_SPACING.value, lineRule: LINE_SPACING.rule },
          }));
        } else {
          allChildren.push(new Paragraph({
            children: [new TextRun({ text, font: FONT, size: BODY_SIZE })],
            spacing: { before: 0, after: 160, line: LINE_SPACING.value, lineRule: LINE_SPACING.rule },
          }));
        }
      }
    }

    const doc = new Document({
      creator: "Moodra Space",
      title: book.title,
      description: book.description || "",
      sections: [{
        properties: {
          page: {
            margin: MARGINS,
            pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: book.title, font: FONT, size: 18, color: "888888" }),
                ],
                alignment: AlignmentType.RIGHT,
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 18, color: "888888" }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        },
        children: allChildren,
      }],
    });

    const { Packer } = await import("docx");
    const buffer = await Packer.toBuffer(doc);
    const safeFilename = book.title.replace(/[^a-z0-9а-яёА-ЯЁ\s]/gi, "").trim().replace(/\s+/g, "_") || "book";
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", `attachment; filename="${safeFilename}.docx"`);
    res.send(buffer);
  });

  app.get("/api/books/:id/export/pdf-html", isAuthenticated, async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const bookId = Number(req.params.id);
    if (isNaN(bookId)) return res.status(400).json({ error: "Invalid id" });
    const book = await storage.getBook(bookId);
    if (!book || book.userId !== userId) return res.status(404).json({ error: "Not found" });
    const chapters = await storage.getChapters(bookId);

    // ─── Language / BCP-47 mapping ──────────────────────────────────
    // The app stores Ukrainian as "ua" internally, but HTML lang=""
    // and CSS hyphens:auto require proper BCP 47 codes ("uk" for Ukrainian).
    const bookLangRaw = (book as any).language || "ru";
    const langBcp47Map: Record<string, string> = { ua: "uk", ru: "ru", de: "de", en: "en" };
    const htmlLang = langBcp47Map[bookLangRaw] ?? bookLangRaw;
    // pdfLang: the hypher key ("ru" | "uk") if the book is Cyrillic, or null otherwise.
    // null means no server-side hyphenation — CSS hyphens:auto handles EN/DE.
    const pdfLang = normalisePdfLang(bookLangRaw);

    // ─── Layout settings from query params (with safe defaults) ────
    const q = req.query as Record<string, string>;
    const psKey = (q.pageSize || "A5").toUpperCase();
    const pageSizeCSS = psKey === "A4" ? "A4" : psKey === "B5" ? "176mm 250mm" : psKey === "LETTER" ? "letter" : "A5";
    const marginTop    = Math.max(5,  Math.min(50, Number(q.marginTop    ?? 20)));
    const marginBottom = Math.max(5,  Math.min(50, Number(q.marginBottom ?? 22)));
    const marginLeft   = Math.max(5,  Math.min(50, Number(q.marginLeft   ?? 20)));
    const marginRight  = Math.max(5,  Math.min(50, Number(q.marginRight  ?? 16)));
    const fontFamily   = q.fontFamily ?? "Georgia, \"Times New Roman\", serif";
    const fontSize     = Math.max(7,  Math.min(18, Number(q.fontSize     ?? 10.5)));
    const lineHeight   = Math.max(1,  Math.min(3,  Number(q.lineHeight   ?? 1.72)));
    const paraSpacing       = Math.max(0,   Math.min(3,  Number(q.paragraphSpacing ?? 0)));
    const firstLineIndent   = Math.max(0,   Math.min(5,  Number(q.firstLineIndent  ?? 1.2)));
    const textAlign         = q.textAlign === "left" ? "left" : "justify";
    const h1Size       = Math.max(10, Math.min(36, Number(q.h1Size ?? 16)));
    const h2Size       = Math.max(8,  Math.min(30, Number(q.h2Size ?? 12)));
    const h3Size       = Math.max(7,  Math.min(24, Number(q.h3Size ?? 11)));
    const chapterBreak = q.chapterBreak !== "false";
    const headerEnabled   = q.headerEnabled === "true";
    const headerLeft      = q.headerLeft  ?? "";
    const headerRight     = q.headerRight ?? "";
    const footerPageNum   = q.footerPageNumber !== "false";
    const footerBookTitle = q.footerBookTitle === "true";
    const chapterLabel    = q.chapterLabel  ?? "Chapter";
    const tocHeading      = q.tocHeading    ?? "Table of Contents";
    // ───────────────────────────────────────────────────────────────

    const sanitizeContent = (html: string) => {
      return (html || "")
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
        .replace(/on\w+="[^"]*"/gi, "");
    };

    const blockToHtml = (b: any, chapterTitle: string): string => {
      const raw = b.content || b.text || "";
      if (!raw && b.type !== "divider") return "";
      const content = sanitizeContent(raw);
      const indentLevel = Math.max(0, Math.min(8, Number(b.metadata?.indentLevel ?? 0)));
      const indentEm = indentLevel * 1.8;
      const nestBorder = indentLevel > 0 ? ";border-left:2px solid rgba(0,0,0,0.10);padding-left:0.5em" : "";

      // For non-list paragraphs: indent level shifts the left margin; suppress text-indent when indented
      const indentAttr = indentLevel > 0
        ? ` style="margin-left:${indentEm}em;text-indent:0${nestBorder}"`
        : (b.metadata?.indent === false ? ' style="text-indent:0"'
          : b.metadata?.indent === true ? ' style="text-indent:1.6em"' : '');

      // For RU/UK: apply server-side soft-hyphen preprocessing to body text.
      // Headings (h1/h2/h3/heading) are intentionally excluded from hyphenation.
      const hyph = (html: string) =>
        pdfLang ? hyphenateHtmlContent(html, pdfLang) : html;

      switch (b.type) {
        // ── Headings: never hyphenate ──
        case "h1": return `<h2 class="section-h1">${content}</h2>`;
        case "h2": return `<h3 class="section-h2">${content}</h3>`;
        case "h3": return `<h4 class="section-h3">${content}</h4>`;
        case "heading": return `<h2 class="section-h1">${content}</h2>`;
        // ── Body blocks: hyphenate for RU/UK ──
        case "quote":
          return `<blockquote style="margin-left:${indentEm}em${nestBorder}">${hyph(content)}</blockquote>`;
        case "bullet_item": {
          const ml = (indentLevel + 1) * 1.8;
          return `<p class="list-bullet" style="margin-left:${ml}em;text-indent:-1.4em;padding-left:0${nestBorder}">&#8226;&nbsp;${hyph(content)}</p>`;
        }
        case "numbered_item": {
          const ml = (indentLevel + 1) * 1.8;
          return `<p class="list-numbered" style="margin-left:${ml}em;text-indent:0${nestBorder}">${hyph(content)}</p>`;
        }
        case "check_item": {
          const ml = (indentLevel + 1) * 1.8;
          const checked = b.metadata?.checked ? "&#9745;" : "&#9744;";
          return `<p class="list-check" style="margin-left:${ml}em;text-indent:-1.4em;padding-left:0${nestBorder}">${checked}&nbsp;${hyph(content)}</p>`;
        }
        case "hypothesis": return `<div class="callout callout-hypothesis" style="margin-left:${indentEm}em"><span class="callout-icon">&#9670;</span><div>${hyph(content)}</div></div>`;
        case "argument": return `<div class="callout callout-argument" style="margin-left:${indentEm}em"><span class="callout-icon">&#10003;</span><div>${hyph(content)}</div></div>`;
        case "counterargument": return `<div class="callout callout-counter" style="margin-left:${indentEm}em"><span class="callout-icon">&#10007;</span><div>${hyph(content)}</div></div>`;
        case "idea": return `<div class="callout callout-idea" style="margin-left:${indentEm}em"><span class="callout-icon">&#9861;</span><div>${hyph(content)}</div></div>`;
        case "question": return `<div class="callout callout-question" style="margin-left:${indentEm}em"><span class="callout-icon">?</span><div>${hyph(content)}</div></div>`;
        case "observation": return `<div class="callout callout-idea" style="margin-left:${indentEm}em"><span class="callout-icon">&#128065;</span><div>${hyph(content)}</div></div>`;
        case "divider": return `<hr class="divider"/>`;
        default:
          return `<p${indentAttr}>${hyph(content)}</p>`;
      }
    };

    const tocEntries = chapters.map((ch, i) => `
      <tr>
        <td class="toc-num">${i + 1}</td>
        <td class="toc-title">${escapeXml(ch.title)}</td>
        <td class="toc-dots"></td>
      </tr>`).join("");

    let body = "";
    for (let ci = 0; ci < chapters.length; ci++) {
      const ch = chapters[ci];
      let blocks: any[] = [];
      try { blocks = typeof ch.content === "string" ? JSON.parse(ch.content) : (ch.content || []); } catch {}

      const contentHtml = blocks.map(b => blockToHtml(b, ch.title)).filter(Boolean).join("\n");

      body += `
<div class="chapter" data-chapter="${escapeXml(ch.title)}">
  <div class="chapter-header-line">
    <span class="chapter-num">${chapterLabel} ${ci + 1}</span>
  </div>
  <h1 class="chapter-title">${escapeXml(ch.title)}</h1>
  <div class="chapter-content">
${contentHtml || '<p class="empty-chapter">—</p>'}
  </div>
</div>`;
    }

    const date = new Date().toLocaleDateString("ru-RU", { year: "numeric", month: "long", day: "numeric" });

    const html = `<!DOCTYPE html>
<html lang="${htmlLang}">
<head>
<meta charset="UTF-8">
<title>${escapeXml(book.title)}</title>
<style>
  @page {
    size: ${pageSizeCSS};
    margin: ${marginTop}mm ${marginRight}mm ${marginBottom}mm ${marginLeft}mm;
    @top-center { content: string(chapter-name); font-family: ${fontFamily}; font-size: 8pt; color: #888; }
    @bottom-center { content: counter(page); font-family: ${fontFamily}; font-size: 8pt; color: #888; }
  }
  @page :first { @top-center { content: ""; } @bottom-center { content: ""; } }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: ${fontFamily};
    font-size: ${fontSize}pt;
    line-height: ${lineHeight};
    color: #1a1209;
    background: #fff;
    counter-reset: page 1;
  }

  /* ── Cover page ── */
  .cover {
    page-break-after: always;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    min-height: 100vh;
    padding: 40px 24px;
    background: #fff;
    position: relative;
  }
  .cover-ornament {
    font-size: 28pt;
    color: #d4a96a;
    margin-bottom: 32px;
    letter-spacing: 12px;
  }
  .cover-title {
    font-size: 22pt;
    font-weight: 700;
    letter-spacing: -0.5px;
    line-height: 1.2;
    color: #1a0d06;
    margin-bottom: 16px;
  }
  .cover-subtitle {
    font-size: 10pt;
    color: #6a5544;
    font-style: italic;
    margin-bottom: 48px;
    max-width: 300px;
    line-height: 1.6;
  }
  .cover-rule {
    width: 48px;
    height: 2px;
    background: #d4a96a;
    margin: 0 auto 40px;
  }
  .cover-meta {
    font-size: 8pt;
    color: #aaa;
    letter-spacing: 1px;
    text-transform: uppercase;
    position: absolute;
    bottom: 32px;
    left: 50%;
    transform: translateX(-50%);
    white-space: nowrap;
  }

  /* ── TOC ── */
  .toc-page {
    page-break-after: always;
    padding: 20px 0;
  }
  .toc-heading {
    font-size: 13pt;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #1a0d06;
    margin-bottom: 24px;
    border-bottom: 1px solid #d4a96a;
    padding-bottom: 8px;
  }
  .toc-table { width: 100%; border-collapse: collapse; }
  .toc-num { width: 28px; font-size: 8.5pt; color: #aaa; vertical-align: top; padding: 4px 8px 4px 0; }
  .toc-title { font-size: 10pt; color: #1a0d06; vertical-align: top; padding: 4px 8px 4px 0; }
  .toc-dots {
    width: 40px;
    font-size: 8pt;
    color: #ccc;
    vertical-align: bottom;
    padding: 4px 0;
    border-bottom: 1px dotted #ddd;
  }

  /* ── Chapter ── */
  .chapter {
    page-break-before: ${chapterBreak ? "always" : "auto"};
    string-set: chapter-name content(attr(data-chapter));
    padding-top: 8mm;
  }
  .chapter-header-line {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
  }
  .chapter-num {
    font-size: 7.5pt;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #c8975a;
    font-family: ${fontFamily};
  }
  .chapter-title {
    font-size: ${h1Size}pt;
    font-weight: 700;
    line-height: 1.25;
    color: #1a0d06;
    margin-bottom: 28px;
    letter-spacing: -0.3px;
  }
  .chapter-content {}

  /* ── Typography ── */
  p {
    margin-bottom: ${paraSpacing > 0 ? paraSpacing + "em" : "0"};
    text-align: ${textAlign};
    text-indent: ${firstLineIndent > 0 ? firstLineIndent + "em" : "0"};
    orphans: 3;
    widows: 3;
    hyphens: auto;
    -webkit-hyphens: auto;
    word-break: normal;
    overflow-wrap: normal;
    hyphenate-limit-chars: 6 3 3;
    -webkit-hyphenate-limit-before: 3;
    -webkit-hyphenate-limit-after: 3;
  }
  p:first-child, h2 + p, h3 + p, h4 + p { text-indent: 0; }
  .chapter-content > p:first-child { text-indent: 0; }

  /* Headings: never hyphenate */
  h1, h2, h3, h4, h5, h6,
  .chapter-title, .chapter-num, .chapter-header-line,
  .toc-heading, .toc-title, .toc-num,
  .cover-title, .cover-subtitle, .cover-ornament, .cover-meta {
    hyphens: none;
    -webkit-hyphens: none;
    word-break: keep-all;
  }
  h2.section-h1 {
    font-size: ${h2Size}pt;
    font-weight: 700;
    margin: 20px 0 8px;
    color: #1a0d06;
    text-indent: 0;
    page-break-after: avoid;
  }
  h3.section-h2 {
    font-size: ${h3Size}pt;
    font-weight: 700;
    font-style: italic;
    margin: 16px 0 6px;
    color: #3d2e26;
    text-indent: 0;
    page-break-after: avoid;
  }
  h4.section-h3 {
    font-size: ${Math.max(7, h3Size - 1)}pt;
    font-weight: 600;
    margin: 14px 0 4px;
    color: #3d2e26;
    text-indent: 0;
    page-break-after: avoid;
  }

  blockquote {
    border-left: 2.5px solid #d4a96a;
    padding: 6px 0 6px 14px;
    margin: 14px 8px;
    font-style: italic;
    color: #5a4a3a;
    text-indent: 0;
    hyphens: auto;
    -webkit-hyphens: auto;
    hyphenate-limit-chars: 6 3 3;
  }

  hr.divider {
    border: none;
    border-top: 1px solid #e0d4c4;
    margin: 18px 40px;
  }

  .callout {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    padding: 8px 12px;
    margin: 12px 0;
    border-radius: 4px;
    font-size: 9.5pt;
    text-indent: 0;
    hyphens: auto;
    -webkit-hyphens: auto;
    hyphenate-limit-chars: 6 3 3;
  }
  .callout-icon { font-size: 8pt; padding-top: 2px; flex-shrink: 0; }
  .callout-hypothesis { background: #f5f0ea; border-left: 2px solid #d4a96a; }
  .callout-argument { background: #f0f5ee; border-left: 2px solid #7aad6a; }
  .callout-counter { background: #f5f0ee; border-left: 2px solid #c4756a; }
  .callout-idea { background: #f0f2f8; border-left: 2px solid #7a8ac4; }
  .callout-question { background: #faf5e8; border-left: 2px solid #c8af6a; }

  .empty-chapter { color: #bbb; font-style: italic; text-indent: 0; }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
${pdfLang ? '<script src="/paged.polyfill.js"></script>' : ""}
</head>
<body lang="${htmlLang}">

<!-- Cover -->
${book.coverImage && book.coverImage.startsWith("data:") ? `<div style="page-break-after:always;margin:0;padding:0;width:100%;height:100vh;overflow:hidden;"><img src="${book.coverImage}" alt="cover" style="width:100%;height:100%;object-fit:cover;display:block;"/></div>` : `<div class="cover">
  <div class="cover-ornament">&middot; &middot; &middot;</div>
  <div class="cover-title">${escapeXml(book.title)}</div>
  ${book.description ? `<div class="cover-subtitle">${escapeXml(book.description)}</div>` : ""}
  <div class="cover-rule"></div>
  <div class="cover-meta">Moodra &middot; ${date}</div>
</div>`}

<!-- Table of Contents -->
${chapters.length > 1 ? `
<div class="toc-page">
  <div class="toc-heading">${tocHeading}</div>
  <table class="toc-table">
    ${tocEntries}
  </table>
</div>` : ""}

<!-- Chapters -->
${body}

${pdfLang ? `<script>
/* ═══════════════════════════════════════════════════════════════════════════
   CyrillicPageBreakHyphenFix — pagedjs Handler for RU / UK exports
   ───────────────────────────────────────────────────────────────────────────
   Why soft-hyphen preprocessing alone is insufficient:
     Hypher inserts U+00AD (soft hyphen) at linguistically valid positions.
     CSS hyphens:manual ONLY renders a visible hyphen when a LINE WRAP happens
     exactly at a soft-hyphen position. However, pagedjs splits words at PAGE
     BOUNDARIES using its own overflow algorithm (character-by-character or
     word-by-word), which may land between two soft-hyphens — at a position
     that has no U+00AD. In that case, no visible hyphen appears and the word
     is silently broken at the page edge.
   This handler runs after each page is laid out. It checks whether the page
   break happened inside a Cyrillic word and, if so, appends a literal "-" to
   the last rendered text node on that page.
   Limitations:
     • Pagedjs page breaking is deterministic per run but may differ across
       browsers (Chromium vs Firefox) due to different font metrics.
     • The charBefore/charAfter heuristic can fail if the last text node in
       .pagedjs_page_content is not the one truncated at the break (e.g. a
       running header appearing last in DOM order). The "last char matches"
       guard minimises false positives.
     • Does not alter book content in the database — rendering only.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  var CYR          = /[\\u0400-\\u04FF]/;
  var ALREADY_HYP  = /[-\\u2010\\u2011\\u2012\\u2013\\u00AD]\\s*$/;
  var SKIP_TAGS    = { H1:1, H2:1, H3:1, H4:1, H5:1, H6:1 };
  var SKIP_CLS     = [
    'pagedjs_margin', 'pagedjs_margin_content', 'pagedjs_margin_top',
    'pagedjs_margin_bottom', 'pagedjs_margin_left', 'pagedjs_margin_right',
    'toc-page', 'toc-title', 'toc-num', 'toc-heading', 'toc-dots',
    'chapter-title', 'chapter-num', 'chapter-header-line', 'empty-chapter',
    'cover', 'cover-title', 'cover-subtitle', 'cover-ornament', 'cover-meta'
  ];
  var DEV = (
    typeof location !== 'undefined' &&
    (location.hostname === 'localhost' ||
     location.hostname.endsWith('.replit.dev') ||
     location.hostname.endsWith('.repl.co'))
  );

  function isSkipped(node) {
    var el = node.parentElement;
    while (el) {
      if (SKIP_TAGS[el.tagName]) return true;
      var cls = el.classList;
      for (var i = 0; i < SKIP_CLS.length; i++) {
        if (cls.contains(SKIP_CLS[i])) return true;
      }
      el = el.parentElement;
    }
    return false;
  }

  function getLastContentTextNode(pageEl) {
    var area = pageEl.querySelector('.pagedjs_page_content') || pageEl;
    var walker = document.createTreeWalker(area, NodeFilter.SHOW_TEXT, null);
    var last = null, n;
    while ((n = walker.nextNode())) {
      if (n.textContent.trim().length > 0) last = n;
    }
    return last;
  }

  class CyrillicPageBreakHyphenFix extends Paged.Handler {
    afterPageLayout(pageEl, page, breakToken) {
      // breakToken is null on the very last page — nothing to do
      if (!breakToken) return;

      var srcNode = breakToken.node;
      var offset  = breakToken.offset;

      // We only handle breaks inside text nodes
      if (!srcNode || srcNode.nodeType !== Node.TEXT_NODE) return;
      if (typeof offset !== 'number' || offset <= 0) return;

      var srcText    = srcNode.textContent || '';
      var charBefore = srcText[offset - 1]; // last char on THIS page
      var charAfter  = srcText[offset];     // first char on NEXT page

      // Both sides of the split must be Cyrillic letters
      if (!charBefore || !charAfter) return;
      if (!CYR.test(charBefore) || !CYR.test(charAfter)) return;

      // Locate the last visible text node rendered inside this page's content area
      var lastNode = getLastContentTextNode(pageEl);
      if (!lastNode) return;
      if (isSkipped(lastNode)) return;

      var txt = lastNode.textContent;
      if (!txt || txt.trim().length < 3) return;

      // Guard: the last rendered character must match the expected charBefore.
      // This confirms we found the right node (not a footer/margin artifact).
      if (txt[txt.length - 1] !== charBefore) return;

      // Never double-hyphenate
      if (ALREADY_HYP.test(txt)) return;

      // Insert the visible hyphen
      lastNode.textContent = txt + '-';

      if (DEV) {
        console.log('[CyrHyphen] Page break inside Cyrillic word');
        console.log('[CyrHyphen]  before break:', JSON.stringify(srcText.slice(Math.max(0, offset - 30), offset)));
        console.log('[CyrHyphen]  after  break:', JSON.stringify(srcText.slice(offset, offset + 20)));
        console.log('[CyrHyphen]  appended hyphen to node ending with:', JSON.stringify(txt.slice(-10)));
      }
    }
  }

  Paged.registerHandlers(CyrillicPageBreakHyphenFix);

  // Trigger pagedjs rendering, then open the print dialog
  window.addEventListener('load', function () {
    var previewer = new Paged.Previewer();
    previewer.preview().then(function () {
      // Short delay so pagedjs finishes painting before the print dialog opens
      setTimeout(function () { window.print(); }, 600);
    });
  });

  // Close the tab automatically after the user dismisses the print dialog
  window.addEventListener('afterprint', function () {
    setTimeout(function () { window.close(); }, 600);
  });
})();
</script>` : `<script>
/* EN / DE: native browser @page layout — no pagedjs needed */
window.addEventListener('load', function () {
  setTimeout(function () { window.print(); }, 400);
});
</script>`}
</body>
</html>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  });

  // ─── Cyrillic Engine PDF export ───────────────────────────────────────────
  // Generates clean WeasyPrint-optimised HTML and forwards it to the Python
  // cyrillic-renderer service (port 3001). Returns the PDF binary directly.
  app.post("/api/books/:id/export/pdf-cyrillic", isAuthenticated, async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const bookId = Number(req.params.id);
    if (isNaN(bookId)) return res.status(400).json({ error: "Invalid id" });
    const book = await storage.getBook(bookId);
    if (!book || book.userId !== userId) return res.status(404).json({ error: "Not found" });
    const chapters = await storage.getChapters(bookId);

    const body = req.body as Record<string, any>;
    const docLang: "ru" | "uk" = body.documentLanguage === "uk" ? "uk" : "ru";
    const htmlLang = docLang === "uk" ? "uk" : "ru";

    // Layout settings from request body with safe defaults
    const psKey = (body.pageSize || "A5").toUpperCase();
    const pageSizeCSS = psKey === "A4" ? "A4" : psKey === "B5" ? "176mm 250mm" : "A5";
    const marginTop    = Math.max(5, Math.min(50, Number(body.marginTop    ?? 20)));
    const marginBottom = Math.max(5, Math.min(50, Number(body.marginBottom ?? 22)));
    const marginLeft   = Math.max(5, Math.min(50, Number(body.marginLeft   ?? 20)));
    const marginRight  = Math.max(5, Math.min(50, Number(body.marginRight  ?? 16)));
    const fontFamily   = body.fontFamily ?? "Georgia, \"Times New Roman\", serif";
    const fontSize     = Math.max(7, Math.min(18, Number(body.fontSize     ?? 11)));
    const lineHeight   = Math.max(1, Math.min(3,  Number(body.lineHeight   ?? 1.6)));
    const paraSpacing  = Math.max(0, Math.min(3,  Number(body.paragraphSpacing ?? 0.5)));
    const firstLineIndent = Math.max(0, Math.min(5, Number(body.firstLineIndent ?? 1.2)));
    const textAlign    = body.textAlign === "left" ? "left" : "justify";
    const h1Size       = Math.max(10, Math.min(36, Number(body.h1Size ?? 22)));
    const h2Size       = Math.max(8,  Math.min(30, Number(body.h2Size ?? 16)));
    const h3Size       = Math.max(7,  Math.min(24, Number(body.h3Size ?? 13)));
    const chapterBreak = body.chapterBreak !== false;
    const enableHyphHeadings = body.cyrillicHyphenHeadings !== false;
    const enableHyphToc      = body.cyrillicHyphenToc !== false;

    const escHtml = (s: string) => String(s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

    const sanitize = (html: string) => (html || "")
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
      .replace(/on\w+="[^"]*"/gi, "");

    const cyrBlockToHtml = (b: any): string => {
      const raw = b.content || b.text || "";
      if (!raw && b.type !== "divider") return "";
      const content = sanitize(raw);
      const indentLevel = Math.max(0, Math.min(8, Number(b.metadata?.indentLevel ?? 0)));
      const indentEm = indentLevel * 1.8;
      const nestBorder = indentLevel > 0 ? ";border-left:2px solid rgba(0,0,0,0.10);padding-left:0.5em" : "";
      const indentAttr = indentLevel > 0
        ? ` style="margin-left:${indentEm}em;text-indent:0${nestBorder}"`
        : "";

      switch (b.type) {
        case "h1": return `<h2 class="section-h1">${content}</h2>`;
        case "h2": return `<h3 class="section-h2">${content}</h3>`;
        case "h3": return `<h4 class="section-h3">${content}</h4>`;
        case "heading": return `<h2 class="section-h1">${content}</h2>`;
        case "quote": return `<blockquote style="margin-left:${indentEm}em${nestBorder}">${content}</blockquote>`;
        case "bullet_item": {
          const ml = (indentLevel + 1) * 1.8;
          return `<p class="list-bullet" style="margin-left:${ml}em;text-indent:-1.4em;padding-left:0${nestBorder}">&#8226;&nbsp;${content}</p>`;
        }
        case "numbered_item": {
          const ml = (indentLevel + 1) * 1.8;
          return `<p class="list-numbered" style="margin-left:${ml}em;text-indent:0${nestBorder}">${content}</p>`;
        }
        case "check_item": {
          const ml = (indentLevel + 1) * 1.8;
          const checked = b.metadata?.checked ? "&#9745;" : "&#9744;";
          return `<p class="list-check" style="margin-left:${ml}em;text-indent:-1.4em;padding-left:0${nestBorder}">${checked}&nbsp;${content}</p>`;
        }
        case "hypothesis": return `<div class="callout callout-hypothesis" style="margin-left:${indentEm}em"><span class="callout-icon">&#9670;</span><div>${content}</div></div>`;
        case "argument": return `<div class="callout callout-argument" style="margin-left:${indentEm}em"><span class="callout-icon">&#10003;</span><div>${content}</div></div>`;
        case "counterargument": return `<div class="callout callout-counter" style="margin-left:${indentEm}em"><span class="callout-icon">&#10007;</span><div>${content}</div></div>`;
        case "idea": return `<div class="callout callout-idea" style="margin-left:${indentEm}em"><span class="callout-icon">&#9861;</span><div>${content}</div></div>`;
        case "question": return `<div class="callout callout-question" style="margin-left:${indentEm}em"><span class="callout-icon">?</span><div>${content}</div></div>`;
        case "observation": return `<div class="callout callout-idea" style="margin-left:${indentEm}em"><span class="callout-icon">&#128065;</span><div>${content}</div></div>`;
        case "divider": return `<hr class="divider"/>`;
        default: return `<p${indentAttr}>${content}</p>`;
      }
    };

    // Build TOC
    const tocRows = chapters.map((ch, i) => `
      <tr>
        <td class="toc-num">${i + 1}.</td>
        <td class="toc-title">${escHtml(ch.title)}</td>
      </tr>`).join("");

    // Build chapter bodies
    let bodyHtml = "";
    for (let ci = 0; ci < chapters.length; ci++) {
      const ch = chapters[ci];
      let blocks: any[] = [];
      try { blocks = typeof ch.content === "string" ? JSON.parse(ch.content) : (ch.content || []); } catch {}
      const contentHtml = blocks.map(b => cyrBlockToHtml(b)).filter(Boolean).join("\n");
      bodyHtml += `
<section class="chapter${chapterBreak ? " chapter-break" : ""}">
  <div class="chapter-header-line"><span class="chapter-num">${docLang === "uk" ? "Розділ" : "Глава"} ${ci + 1}</span></div>
  <h1 class="chapter-title">${escHtml(ch.title)}</h1>
  <div class="chapter-content">
${contentHtml || '<p class="empty-chapter">—</p>'}
  </div>
</section>`;
    }

    const hyphBody = `
  html[lang="ru"] p, html[lang="uk"] p,
  html[lang="ru"] blockquote, html[lang="uk"] blockquote,
  html[lang="ru"] .callout div, html[lang="uk"] .callout div,
  html[lang="ru"] li, html[lang="uk"] li {
    hyphens: auto;
    hyphenate-character: "-";
    hyphenate-limit-chars: 6 3 3;
    hyphenate-limit-zone: 8%;
  }`;

    const hyphHeadings = enableHyphHeadings ? "" : `
  h1, h2, h3, h4, h5, h6,
  .chapter-title, .chapter-num, .chapter-header-line { hyphens: none !important; }`;

    const hyphToc = enableHyphToc ? "" : `
  .toc, .toc *, .toc-heading, .toc-title, .toc-num { hyphens: none !important; }`;

    const cyrHtml = `<!DOCTYPE html>
<html lang="${htmlLang}" class="cyrillic-engine">
<head>
<meta charset="UTF-8">
<title>${escHtml(book.title)}</title>
<style>
  /* ── Page layout ── */
  @page {
    size: ${pageSizeCSS};
    margin: ${marginTop}mm ${marginRight}mm ${marginBottom}mm ${marginLeft}mm;
  }
  @page :first { margin-top: ${marginTop + 5}mm; }

  /* ── Reset ── */
  * { box-sizing: border-box; margin: 0; padding: 0; }

  /* ── Body ── */
  body {
    font-family: ${fontFamily};
    font-size: ${fontSize}pt;
    line-height: ${lineHeight};
    color: #1a1209;
    background: #fff;
    text-rendering: optimizeLegibility;
  }

  /* ── Cyrillic hyphenation (WeasyPrint + Pyphen) ── */
  ${hyphBody}

  /* ── Headings: no hyphenation ── */
  h1, h2, h3, h4, h5, h6,
  .chapter-title, .chapter-num, .chapter-header-line,
  .cover-title, .cover-subtitle, .cover-meta,
  a, code, pre, .url, .email, .filepath {
    hyphens: none;
    word-break: keep-all;
  }
  ${hyphHeadings}
  ${hyphToc}

  /* ── Cover page ── */
  .cover-page {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    text-align: center;
    page-break-after: always;
    padding: 20mm 15mm;
  }
  .cover-title { font-size: ${Math.min(h1Size + 6, 40)}pt; font-weight: 700; margin-bottom: 0.4em; line-height: 1.2; }
  .cover-subtitle { font-size: ${h2Size}pt; color: #666; margin-bottom: 1.5em; }
  .cover-ornament { font-size: 18pt; margin: 1em 0; color: #aaa; }
  .cover-meta { font-size: 10pt; color: #888; margin-top: auto; }

  /* ── TOC ── */
  .toc-page { page-break-after: always; padding-top: 10mm; }
  .toc-heading { font-size: ${h1Size}pt; font-weight: 700; margin-bottom: 8mm; text-align: center; }
  .toc table { width: 100%; border-collapse: collapse; }
  .toc-num { width: 2em; color: #888; font-size: 9pt; vertical-align: top; padding-top: 2pt; white-space: nowrap; }
  .toc-title { font-size: 10pt; padding-bottom: 4pt; }

  /* ── Chapter ── */
  .chapter { padding-top: 8mm; }
  .chapter-break { page-break-before: always; }
  .chapter-header-line { margin-bottom: 3mm; }
  .chapter-num { font-size: 9pt; text-transform: uppercase; letter-spacing: 0.12em; color: #888; font-weight: 400; }
  .chapter-title {
    font-size: ${h1Size}pt;
    font-weight: 700;
    margin-bottom: 6mm;
    line-height: 1.2;
    color: #1a0d06;
    page-break-after: avoid;
  }
  .chapter-content { }

  /* ── Typography ── */
  p {
    margin-bottom: ${paraSpacing > 0 ? paraSpacing + "em" : "0"};
    text-align: ${textAlign};
    text-indent: ${firstLineIndent > 0 ? firstLineIndent + "em" : "0"};
    orphans: 3;
    widows: 3;
    word-break: normal;
    overflow-wrap: normal;
  }
  p:first-child, h2 + p, h3 + p, h4 + p { text-indent: 0; }
  .chapter-content > p:first-child { text-indent: 0; }

  h2.section-h1 {
    font-size: ${h2Size}pt;
    font-weight: 700;
    margin: 20px 0 8px;
    color: #1a0d06;
    text-indent: 0;
    page-break-after: avoid;
  }
  h3.section-h2 {
    font-size: ${h3Size}pt;
    font-weight: 700;
    font-style: italic;
    margin: 16px 0 6px;
    color: #3d2e26;
    text-indent: 0;
    page-break-after: avoid;
  }
  h4.section-h3 {
    font-size: ${Math.max(7, h3Size - 1)}pt;
    font-weight: 600;
    margin: 14px 0 4px;
    color: #3d2e26;
    text-indent: 0;
    page-break-after: avoid;
  }

  blockquote {
    border-left: 2.5px solid #d4a96a;
    padding: 6px 0 6px 14px;
    margin: 14px 8px;
    font-style: italic;
    color: #5a4a3a;
    text-indent: 0;
  }

  hr.divider {
    border: none;
    border-top: 1px solid #e0d4c4;
    margin: 18px 40px;
  }

  .callout {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    padding: 8px 12px;
    margin: 12px 0;
    border-radius: 4px;
    font-size: 9.5pt;
    text-indent: 0;
  }
  .callout-icon { font-size: 8pt; padding-top: 2px; flex-shrink: 0; }
  .callout-hypothesis { background: #f5f0ea; border-left: 2px solid #d4a96a; }
  .callout-argument { background: #f0f5ee; border-left: 2px solid #7aad6a; }
  .callout-counter { background: #f5f0ee; border-left: 2px solid #c4756a; }
  .callout-idea { background: #f0f2f8; border-left: 2px solid #7a8ac4; }
  .callout-question { background: #faf5e8; border-left: 2px solid #c8af6a; }

  .list-bullet, .list-numbered, .list-check { margin-bottom: 0.3em; }
  .empty-chapter { color: #bbb; font-style: italic; text-indent: 0; }
</style>
</head>
<body class="book-export cyrillic-engine">

  <!-- Cover -->
  <div class="cover-page">
    <div class="cover-title">${escHtml(book.title)}</div>
    ${book.description ? `<div class="cover-subtitle">${escHtml(book.description.slice(0, 120))}</div>` : ""}
    <div class="cover-ornament">&#10022; &#10022; &#10022;</div>
    <div class="cover-meta">${new Date().getFullYear()}</div>
  </div>

  <!-- TOC -->
  <div class="toc-page">
    <div class="toc">
      <div class="toc-heading">${docLang === "uk" ? "Зміст" : "Содержание"}</div>
      <table>${tocRows}</table>
    </div>
  </div>

  <!-- Chapters -->
  ${bodyHtml}

</body>
</html>`;

    // Forward to Python Cyrillic Renderer service
    const RENDERER_URL = process.env.CYRILLIC_RENDERER_URL || "http://localhost:3001";
    const fontName = fontFamily.split(",")[0].trim().replace(/['"]/g, "");

    let pdfBuffer: Buffer;
    try {
      const response = await fetch(`${RENDERER_URL}/render-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          html: cyrHtml,
          language: docLang,
          page: {
            format: pageSizeCSS,
            margins: {
              top: `${marginTop}mm`,
              right: `${marginRight}mm`,
              bottom: `${marginBottom}mm`,
              left: `${marginLeft}mm`,
            },
          },
          fonts: [{ family: fontName }],
          meta: { bookId: String(bookId), title: book.title },
        }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({ error: "Unknown renderer error" }));
        console.error("[CyrillicExport] Renderer error:", response.status, errBody);
        return res.status(502).json({
          error: errBody.error || "Cyrillic renderer failed",
          hint: "Make sure the Cyrillic Renderer service is running.",
        });
      }

      const arrayBuf = await response.arrayBuffer();
      pdfBuffer = Buffer.from(arrayBuf);
    } catch (err: any) {
      console.error("[CyrillicExport] Failed to reach renderer:", err?.message);
      return res.status(503).json({
        error: "Кириллический PDF-рендерер временно недоступен. Попробуйте позже или переключитесь на Latin Engine.",
        hint: "Cyrillic Renderer service is not running on port 3001.",
      });
    }

    const safeTitle = book.title.replace(/[^\w\s-]/g, "").trim() || "book";
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${safeTitle}.pdf"`);
    res.setHeader("X-Engine", "weasyprint-cyrillic");
    res.send(pdfBuffer);
  });

  app.post("/api/grammar/fix", async (req, res) => {
    try {
      const { text, language } = req.body as { text: string; language?: string };
      if (!text) return res.status(400).json({ error: "Missing text" });
      if (text.length > 8000) return res.status(400).json({ error: "Text too long (max 8000 chars)" });

      const params = new URLSearchParams({
        text,
        language: language || "auto",
        enabledOnly: "false",
      });
      const ltRes = await fetch("https://api.languagetool.org/v2/check", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
          "User-Agent": "Moodra-SpellCheck/1.0",
        },
        body: params.toString(),
        signal: AbortSignal.timeout(12000),
      });
      if (!ltRes.ok) return res.status(502).json({ error: "LanguageTool unavailable" });

      const data = (await ltRes.json()) as {
        matches?: { offset: number; length: number; replacements: { value: string }[] }[];
      };
      const matches = (data.matches || []).filter(m => m.replacements?.length > 0);

      // Apply fixes in reverse order so earlier offsets stay valid
      let improved = text;
      const sorted = [...matches].sort((a, b) => b.offset - a.offset);
      for (const m of sorted) {
        const best = m.replacements[0].value;
        improved = improved.slice(0, m.offset) + best + improved.slice(m.offset + m.length);
      }

      return res.json({ original: text, improved });
    } catch (e: any) {
      if (e?.name === "TimeoutError") return res.status(504).json({ error: "LanguageTool timeout" });
      return res.status(500).json({ error: "Internal error" });
    }
  });

  app.post("/api/text-check", async (req, res) => {
    try {
      const { text, language } = req.body as { text: string; language: string };
      if (!text || !language) {
        return res.status(400).json({ matches: [], error: "Missing text or language" });
      }
      if (text.length > 8000) {
        return res.status(400).json({ matches: [], error: "Text too long (max 8000 chars)" });
      }
      const params = new URLSearchParams({
        text,
        language,
        enabledOnly: "false",
      });
      const ltRes = await fetch("https://api.languagetool.org/v2/check", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
          "User-Agent": "Moodra-SpellCheck/1.0",
        },
        body: params.toString(),
        signal: AbortSignal.timeout(10000),
      });
      if (!ltRes.ok) {
        return res.status(502).json({ matches: [], error: "LanguageTool API error" });
      }
      const data = (await ltRes.json()) as { matches?: unknown[] };
      return res.json({ matches: data.matches || [] });
    } catch (e: any) {
      if (e?.name === "TimeoutError") {
        return res.status(504).json({ matches: [], error: "LanguageTool API timeout" });
      }
      return res.status(500).json({ matches: [], error: "Internal error" });
    }
  });

  return httpServer;
}
