// frontend/src/api/recommendations.ts
import { apiGet, apiPost, apiDelete } from "./client";

/* =======================
   TYPES
======================= */

export type RecommendationDto = {
  id: number;
  fromUserId: number;
  toUserId: number;
  bookId: number;
  message?: string | null;
  createdAt: string;
};

export type SendRecommendationDto = {
  toUsername: string;
  bookId: number;
  message?: string | null;
};

/* =======================
   SEND
======================= */

export function sendRecommendation(payload: SendRecommendationDto) {
  return apiPost<RecommendationDto>("/api/Recommendations", payload);
}

/* =======================
   FETCH
======================= */

export function getInboxRecommendations() {
  return apiGet<RecommendationDto[]>("/api/Recommendations/inbox");
}

export function getSentRecommendations() {
  return apiGet<RecommendationDto[]>("/api/Recommendations/sent");
}

/* =======================
   ACCEPT
   → adds book to library
   → removes recommendation
======================= */

export function acceptRecommendation(id: number) {
  return apiPost<{ ok: boolean }>(
    `/api/Recommendations/${id}/accept`,
    {}
  );
}

/* =======================
   DELETE / CANCEL
   → inbox: delete gift
   → sent: cancel gift
======================= */

export function deleteRecommendation(id: number) {
  return apiDelete<{ ok: boolean }>(
    `/api/Recommendations/${id}`
  );
}
