import { api } from "@/lib/api";

export interface FriendLibraryBook {
  bookId: number;
  title: string;
  author: string | null;
  coverImageUrl: string;
  status: "Reading" | "Finished" | "Planned";
  pagesRead?: number | null;
  totalPages?: number | null;
  percent?: number | null;
}

export interface FriendRecentBook {
  bookId: number;
  coverImageUrl: string;
}

export interface FriendCard {
  id: number;
  email: string;
  username?: string | null;
  booksCount: number;
  recentBooks: FriendRecentBook[];
}

export interface FriendStats {
  friends: number;
  reviews: number;
}

export interface FriendMini {
  id: number;
  email: string;
  username: string;
}

export interface FriendReview {
  id: number;
  bookId: number;
  bookTitle: string;
  coverImageUrl: string;
  text: string;
  rating: number;
  createdAt: string;
  updatedAt?: string | null;
}

export const friendsApi = {
  incoming: () => api.get("/api/Friends/incoming").then(r => r.data),
  incomingCount: () => api.get("/api/Friends/requests/incoming/count").then(r => r.data as { count: number }),
  outgoing: () => api.get("/api/Friends/outgoing").then(r => r.data),
  list: () => api.get("/api/Friends/list").then(r => r.data),
  listCards: () => api.get("/api/Friends/list/cards").then(r => r.data as FriendCard[]),
  getFriendLibrary: (friendId: number) =>
    api.get(`/api/Friends/${friendId}/library`).then(r => r.data as FriendLibraryBook[]),
  getFriendStats: (friendId: number) =>
    api.get(`/api/Friends/${friendId}/stats`).then((r) => {
      const data = r.data as {
        friends?: number;
        reviews?: number;
      };

      return {
        friends: data.friends ?? 0,
        reviews: data.reviews ?? 0,
      } satisfies FriendStats;
    }),
  getFriendFriends: (friendId: number) =>
    api.get(`/api/Friends/${friendId}/friends`).then((r) => r.data as FriendMini[]),
  getFriendReviews: (friendId: number) =>
    api.get(`/api/Friends/${friendId}/reviews`).then((r) => r.data as FriendReview[]),

  sendRequest: (receiverId: number) =>
    api.post("/api/Friends/request", { receiverId }).then(r => r.data),

  accept: (id: number) => api.post(`/api/Friends/accept/${id}`),
  reject: (id: number) => api.post(`/api/Friends/reject/${id}`),
  cancel: (id: number) => api.delete(`/api/Friends/cancel/${id}`),
  remove: (friendId: number) => api.delete(`/api/Friends/remove/${friendId}`),
};
