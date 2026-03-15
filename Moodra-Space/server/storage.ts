import { db } from "./db";
import { books, chapters, characters, notes, sources, users, hypotheses, boards, drafts } from "@shared/schema";
import type {
  Book, InsertBook, Chapter, InsertChapter, Character, InsertCharacter,
  Note, InsertNote, Source, InsertSource, User,
  Hypothesis, InsertHypothesis, Board, Draft, InsertDraft
} from "@shared/schema";
import { eq, desc, asc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: Partial<User> & { id: string }): Promise<User>;

  getBooks(userId: string): Promise<Book[]>;
  getBook(id: number): Promise<Book | undefined>;
  createBook(book: InsertBook & { userId: string }): Promise<Book>;
  updateBook(id: number, data: Partial<InsertBook>): Promise<Book | undefined>;
  deleteBook(id: number): Promise<void>;

  getChapters(bookId: number): Promise<Chapter[]>;
  getChapter(id: number): Promise<Chapter | undefined>;
  createChapter(chapter: InsertChapter): Promise<Chapter>;
  updateChapter(id: number, data: Partial<InsertChapter>): Promise<Chapter | undefined>;
  deleteChapter(id: number): Promise<void>;

  getCharacters(bookId: number): Promise<Character[]>;
  getCharacter(id: number): Promise<Character | undefined>;
  createCharacter(character: InsertCharacter): Promise<Character>;
  updateCharacter(id: number, data: Partial<InsertCharacter>): Promise<Character | undefined>;
  deleteCharacter(id: number): Promise<void>;

  getNotes(bookId: number): Promise<Note[]>;
  createNote(note: InsertNote): Promise<Note>;
  updateNote(id: number, data: Partial<InsertNote>): Promise<Note | undefined>;
  deleteNote(id: number): Promise<void>;

  getSources(bookId: number): Promise<Source[]>;
  createSource(source: InsertSource): Promise<Source>;
  updateSource(id: number, data: Partial<InsertSource>): Promise<Source | undefined>;
  deleteSource(id: number): Promise<void>;

  getHypotheses(bookId: number): Promise<Hypothesis[]>;
  createHypothesis(hyp: InsertHypothesis): Promise<Hypothesis>;
  updateHypothesis(id: number, data: Partial<InsertHypothesis>): Promise<Hypothesis | undefined>;
  deleteHypothesis(id: number): Promise<void>;

  getBoard(bookId: number): Promise<Board | undefined>;
  upsertBoard(bookId: number, data: string): Promise<Board>;

  getDrafts(bookId: number): Promise<Draft[]>;
  createDraft(draft: InsertDraft): Promise<Draft>;
  updateDraft(id: number, data: Partial<InsertDraft>): Promise<Draft | undefined>;
  deleteDraft(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string) {
    const [u] = await db.select().from(users).where(eq(users.id, id));
    return u;
  }
  async upsertUser(userData: Partial<User> & { id: string }) {
    const [u] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: { ...userData, updatedAt: new Date() },
      })
      .returning();
    return u;
  }

  async getBooks(userId: string) {
    return db.select().from(books).where(eq(books.userId, userId)).orderBy(desc(books.updatedAt));
  }
  async getBook(id: number) {
    const [b] = await db.select().from(books).where(eq(books.id, id));
    return b;
  }
  async createBook(book: InsertBook & { userId: string }) {
    const [b] = await db.insert(books).values(book).returning();
    return b;
  }
  async updateBook(id: number, data: Partial<InsertBook>) {
    const [b] = await db.update(books).set({ ...data, updatedAt: new Date() }).where(eq(books.id, id)).returning();
    return b;
  }
  async deleteBook(id: number) {
    await db.delete(books).where(eq(books.id, id));
  }

  async getChapters(bookId: number) {
    return db.select().from(chapters).where(eq(chapters.bookId, bookId)).orderBy(asc(chapters.order));
  }
  async getChapter(id: number) {
    const [c] = await db.select().from(chapters).where(eq(chapters.id, id));
    return c;
  }
  async createChapter(chapter: InsertChapter) {
    const [c] = await db.insert(chapters).values(chapter).returning();
    return c;
  }
  async updateChapter(id: number, data: Partial<InsertChapter>) {
    const [c] = await db.update(chapters).set({ ...data, updatedAt: new Date() }).where(eq(chapters.id, id)).returning();
    return c;
  }
  async deleteChapter(id: number) {
    await db.delete(chapters).where(eq(chapters.id, id));
  }

  async getCharacters(bookId: number) {
    return db.select().from(characters).where(eq(characters.bookId, bookId)).orderBy(asc(characters.name));
  }
  async getCharacter(id: number) {
    const [c] = await db.select().from(characters).where(eq(characters.id, id));
    return c;
  }
  async createCharacter(character: InsertCharacter) {
    const [c] = await db.insert(characters).values(character).returning();
    return c;
  }
  async updateCharacter(id: number, data: Partial<InsertCharacter>) {
    const [c] = await db.update(characters).set(data).where(eq(characters.id, id)).returning();
    return c;
  }
  async deleteCharacter(id: number) {
    await db.delete(characters).where(eq(characters.id, id));
  }

  async getNotes(bookId: number) {
    return db.select().from(notes).where(eq(notes.bookId, bookId)).orderBy(desc(notes.updatedAt));
  }
  async createNote(note: InsertNote) {
    const [n] = await db.insert(notes).values(note).returning();
    return n;
  }
  async updateNote(id: number, data: Partial<InsertNote>) {
    const [n] = await db.update(notes).set({ ...data, updatedAt: new Date() }).where(eq(notes.id, id)).returning();
    return n;
  }
  async deleteNote(id: number) {
    await db.delete(notes).where(eq(notes.id, id));
  }

  async getSources(bookId: number) {
    return db.select().from(sources).where(eq(sources.bookId, bookId)).orderBy(desc(sources.createdAt));
  }
  async createSource(source: InsertSource) {
    const [s] = await db.insert(sources).values(source).returning();
    return s;
  }
  async updateSource(id: number, data: Partial<InsertSource>) {
    const [s] = await db.update(sources).set(data).where(eq(sources.id, id)).returning();
    return s;
  }
  async deleteSource(id: number) {
    await db.delete(sources).where(eq(sources.id, id));
  }

  async getHypotheses(bookId: number) {
    return db.select().from(hypotheses).where(eq(hypotheses.bookId, bookId)).orderBy(desc(hypotheses.createdAt));
  }
  async createHypothesis(hyp: InsertHypothesis) {
    const [h] = await db.insert(hypotheses).values(hyp).returning();
    return h;
  }
  async updateHypothesis(id: number, data: Partial<InsertHypothesis>) {
    const [h] = await db.update(hypotheses).set({ ...data, updatedAt: new Date() }).where(eq(hypotheses.id, id)).returning();
    return h;
  }
  async deleteHypothesis(id: number) {
    await db.delete(hypotheses).where(eq(hypotheses.id, id));
  }

  async getBoard(bookId: number) {
    const [b] = await db.select().from(boards).where(eq(boards.bookId, bookId));
    return b;
  }
  async upsertBoard(bookId: number, data: string) {
    const existing = await this.getBoard(bookId);
    if (existing) {
      const [b] = await db.update(boards).set({ data, updatedAt: new Date() }).where(eq(boards.bookId, bookId)).returning();
      return b;
    } else {
      const [b] = await db.insert(boards).values({ bookId, data }).returning();
      return b;
    }
  }

  async getDrafts(bookId: number) {
    return db.select().from(drafts).where(eq(drafts.bookId, bookId)).orderBy(desc(drafts.updatedAt));
  }
  async createDraft(draft: InsertDraft) {
    const [d] = await db.insert(drafts).values(draft).returning();
    return d;
  }
  async updateDraft(id: number, data: Partial<InsertDraft>) {
    const [d] = await db.update(drafts).set({ ...data, updatedAt: new Date() }).where(eq(drafts.id, id)).returning();
    return d;
  }
  async deleteDraft(id: number) {
    await db.delete(drafts).where(eq(drafts.id, id));
  }
}

export const storage = new DatabaseStorage();
