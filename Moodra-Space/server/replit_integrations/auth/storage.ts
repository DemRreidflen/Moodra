import { users } from "@shared/schema";
import type { User } from "@shared/schema";
import { db } from "../../db";
import { eq, sql } from "drizzle-orm";
import { encryptSecret, decryptSecret } from "../../crypto";

type UpsertUser = Partial<User> & { id: string };

export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserApiKey(id: string, apiKey: string): Promise<void>;
  updateUserModel(id: string, model: string): Promise<void>;
  updateUserProfile(id: string, data: { firstName?: string; lastName?: string }): Promise<User>;
  addTokenUsage(id: string, tokens: number): Promise<void>;
}

class AuthStorage implements IAuthStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    if (user?.openaiApiKey) {
      user.openaiApiKey = decryptSecret(user.openaiApiKey);
    }
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserApiKey(id: string, apiKey: string): Promise<void> {
    await db
      .update(users)
      .set({ openaiApiKey: encryptSecret(apiKey), updatedAt: new Date() })
      .where(eq(users.id, id));
  }

  async updateUserModel(id: string, model: string): Promise<void> {
    await db
      .update(users)
      .set({ openaiModel: model, updatedAt: new Date() })
      .where(eq(users.id, id));
  }

  async updateUserProfile(id: string, data: { firstName?: string; lastName?: string }): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async addTokenUsage(id: string, tokens: number): Promise<void> {
    await db
      .update(users)
      .set({ tokensUsed: sql`COALESCE(tokens_used, 0) + ${tokens}` })
      .where(eq(users.id, id));
  }
}

export const authStorage = new AuthStorage();
