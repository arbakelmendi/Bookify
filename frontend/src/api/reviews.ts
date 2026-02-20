import { apiDelete, apiGet, apiPost } from "@/api/client";

export type ReviewDto = {
  id: number;
  userId: number;
  bookId: number;
  userName: string;
  text: string;
  ratingValue: number;
  createdAt: string;
  updatedAt?: string | null;
};

export function getReviewsByBook(bookId: number) {
  return apiGet<ReviewDto[]>(`/api/Reviews/book/${Number(bookId)}`);
}

export function createReview(bookId: number, text: string) {
  return apiPost<ReviewDto>("/api/Reviews", { bookId: Number(bookId), text });
}

export function deleteMyReviewById(reviewId: number) {
  return apiDelete(`/api/Reviews/${Number(reviewId)}/mine`);
}