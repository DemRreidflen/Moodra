import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  openaiApiKey: varchar("openai_api_key"),
  openaiModel: varchar("openai_model").default("gpt-4o-mini"),
  tokensUsed: integer("tokens_used").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const books = pgTable("books", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").default(""),
  mode: text("mode").notNull().default("scientific"),
  genre: text("genre").default(""),
  coverColor: text("cover_color").default("#6366f1"),
  coverImage: text("cover_image").default(""),
  language: text("language").default("ru"),
  status: text("status").default("draft"),
  wordCount: integer("word_count").default(0),
  narrativeContext: jsonb("narrative_context").$type<{
    coreIdea?: string;
    themes?: string;
    structure?: string;
    tone?: string;
    targetReader?: string;
  }>().default({}),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const chapters = pgTable("chapters", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  bookId: integer("book_id").notNull().references(() => books.id, { onDelete: "cascade" }),
  parentId: integer("parent_id"),
  title: text("title").notNull(),
  content: text("content").default(""),
  summary: text("summary").default(""),
  order: integer("order").default(0),
  level: integer("level").default(0),
  type: text("type").default("chapter"),
  wordCount: integer("word_count").default(0),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const characters = pgTable("characters", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  bookId: integer("book_id").notNull().references(() => books.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  role: text("role").default("secondary"),
  description: text("description").default(""),
  biography: text("biography").default(""),
  traits: text("traits").default(""),
  goals: text("goals").default(""),
  conflicts: text("conflicts").default(""),
  arc: text("arc").default(""),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const notes = pgTable("notes", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  bookId: integer("book_id").notNull().references(() => books.id, { onDelete: "cascade" }),
  chapterId: integer("chapter_id"),
  title: text("title").notNull(),
  content: text("content").default(""),
  type: text("type").default("quick_thought"),
  tags: text("tags").default(""),
  color: text("color").default("yellow"),
  status: text("status").default("inbox"),
  collection: text("collection").default(""),
  collectionIds: text("collection_ids").default(""),
  isPinned: text("is_pinned").default("false"),
  isQuick: text("is_quick").default("false"),
  importance: text("importance").default("normal"),
  linkedNoteIds: text("linked_note_ids").default(""),
  linkedSourceIds: text("linked_source_ids").default(""),
  linkedDraftIds: text("linked_draft_ids").default(""),
  semanticTags: text("semantic_tags").default(""),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const noteCollections = pgTable("note_collections", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  bookId: integer("book_id").notNull().references(() => books.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color").default("#F59E0B"),
  description: text("description").default(""),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const sources = pgTable("sources", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  bookId: integer("book_id").notNull().references(() => books.id, { onDelete: "cascade" }),
  chapterId: integer("chapter_id"),
  title: text("title").notNull(),
  author: text("author").default(""),
  url: text("url").default(""),
  quote: text("quote").default(""),
  notes: text("notes").default(""),
  type: text("type").default("book"),
  summary: text("summary").default(""),
  keyConcepts: text("key_concepts").default(""),
  keyQuotes: text("key_quotes").default(""),
  tags: text("tags").default(""),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const hypotheses = pgTable("hypotheses", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  bookId: integer("book_id").notNull().references(() => books.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").default(""),
  status: text("status").default("hypothesis"),
  arguments: text("arguments").default(""),
  counterarguments: text("counterarguments").default(""),
  sourceIds: text("source_ids").default(""),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const boards = pgTable("boards", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  bookId: integer("book_id").notNull().references(() => books.id, { onDelete: "cascade" }).unique(),
  data: text("data").default("{}"),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const drafts = pgTable("drafts", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  bookId: integer("book_id").notNull().references(() => books.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").default(""),
  type: text("type").default("paragraph"),
  status: text("status").default("active"),
  connectedNoteIds: text("connected_note_ids").default(""),
  connectedSourceIds: text("connected_source_ids").default(""),
  tags: text("tags").default(""),
  wordCount: integer("word_count").default(0),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertBookSchema = createInsertSchema(books).omit({ id: true, createdAt: true, updatedAt: true });
export const insertChapterSchema = createInsertSchema(chapters).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCharacterSchema = createInsertSchema(characters).omit({ id: true, createdAt: true });
export const insertNoteSchema = createInsertSchema(notes).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSourceSchema = createInsertSchema(sources).omit({ id: true, createdAt: true });
export const insertHypothesisSchema = createInsertSchema(hypotheses).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDraftSchema = createInsertSchema(drafts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertNoteCollectionSchema = createInsertSchema(noteCollections).omit({ id: true, createdAt: true });

export type User = typeof users.$inferSelect;
export type Book = typeof books.$inferSelect;
export type InsertBook = z.infer<typeof insertBookSchema>;
export type Chapter = typeof chapters.$inferSelect;
export type InsertChapter = z.infer<typeof insertChapterSchema>;
export type Character = typeof characters.$inferSelect;
export type InsertCharacter = z.infer<typeof insertCharacterSchema>;
export type Note = typeof notes.$inferSelect;
export type InsertNote = z.infer<typeof insertNoteSchema>;
export type Source = typeof sources.$inferSelect;
export type InsertSource = z.infer<typeof insertSourceSchema>;
export type Hypothesis = typeof hypotheses.$inferSelect;
export type InsertHypothesis = z.infer<typeof insertHypothesisSchema>;
export type Board = typeof boards.$inferSelect;
export type Draft = typeof drafts.$inferSelect;
export type InsertDraft = z.infer<typeof insertDraftSchema>;
export type NoteCollection = typeof noteCollections.$inferSelect;
export type InsertNoteCollection = z.infer<typeof insertNoteCollectionSchema>;
