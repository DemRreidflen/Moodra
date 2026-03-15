export interface User {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  openaiApiKey: string | null;
  tokensUsed: number | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}
