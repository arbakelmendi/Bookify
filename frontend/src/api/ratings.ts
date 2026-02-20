import { apiGet, apiPost } from "@/api/client";

export type RatingSummaryDto = {
  average: number;
  count: number;
};

export type MyRatingDto = {
  value: number | null;
};

export function getRatingSummary(bookId: number) {
  return apiGet<RatingSummaryDto>(`/api/Ratings/book/${Number(bookId)}/summary`);
}

export function getMyRating(bookId: number) {
  return apiGet<MyRatingDto>(`/api/Ratings/book/${Number(bookId)}/mine`);
}

export function setMyRating(bookId: number, value: number) {
  return apiPost<MyRatingDto>("/api/Ratings", { bookId: Number(bookId), value });
}