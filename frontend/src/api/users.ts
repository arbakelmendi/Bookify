import { api } from "@/lib/api";

export const usersApi = {
  search: (query: string) =>
    api.get(`/api/Users/search?query=${encodeURIComponent(query)}`).then((r) => r.data),
};
