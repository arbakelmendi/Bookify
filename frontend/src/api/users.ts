// frontend/src/api/users.ts
import { apiGet } from "./client";

export type UserSearchItem = {
  id: number;
  username: string;
  email?: string | null;
};

export const usersApi = {
  search: (q: string) =>
    apiGet<UserSearchItem[]>(`/api/Users/search`, { q }),

  getById: (id: number) =>
    apiGet<UserSearchItem>(`/api/Users/${id}`),
};
