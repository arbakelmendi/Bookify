import { api } from "@/lib/api";

export interface MessageDto {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  sentAt: string;
  isRead: boolean;
}

export interface ConversationSummaryDto {
  friendId: number;
  friendUsername: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

export const messagesApi = {
  conversations: () =>
    api.get("/api/Messages/conversations").then(r => r.data as ConversationSummaryDto[]),

  getMessages: (friendId: number, page = 1) =>
    api.get(`/api/Messages/${friendId}?page=${page}`).then(r => r.data as MessageDto[]),

  send: (friendId: number, content: string) =>
    api.post(`/api/Messages/${friendId}`, { content }).then(r => r.data as MessageDto),

  markRead: (friendId: number) =>
    api.put(`/api/Messages/${friendId}/read`),
};
