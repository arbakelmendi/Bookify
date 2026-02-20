import { api } from "@/lib/api";

export const friendsApi = {
  incoming: () => api.get("/api/Friends/incoming").then(r => r.data),
  incomingCount: () => api.get("/api/Friends/requests/incoming/count").then(r => r.data as { count: number }),
  outgoing: () => api.get("/api/Friends/outgoing").then(r => r.data),
  list: () => api.get("/api/Friends/list").then(r => r.data),

  sendRequest: (receiverId: number) =>
    api.post("/api/Friends/request", { receiverId }).then(r => r.data),

  accept: (id: number) => api.post(`/api/Friends/accept/${id}`),
  reject: (id: number) => api.post(`/api/Friends/reject/${id}`),
  cancel: (id: number) => api.delete(`/api/Friends/cancel/${id}`),
  remove: (friendId: number) => api.delete(`/api/Friends/remove/${friendId}`),
};
