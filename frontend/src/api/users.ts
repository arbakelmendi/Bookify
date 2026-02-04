import { api } from "@/lib/api";

export const usersApi = {
  search: (q: string) => api.get(`/api/Users/search?q=${encodeURIComponent(q)}`).then(r => r.data),
};
