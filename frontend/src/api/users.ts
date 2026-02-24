import { api } from "@/lib/api";
import type { User } from "@/types/auth";

export const usersApi = {
  search: (q: string) =>
    api.get("/api/Users/search", { params: { q } }).then((r) => r.data),
};

export async function getUserById(id: number) {
  return api.get(`/api/Users/${id}`).then((r) => r.data as User);
}

export async function updateMyBio(bio: string) {
  return api.put("/api/Users/me/bio", { bio }).then((r) => r.data as User);
}
