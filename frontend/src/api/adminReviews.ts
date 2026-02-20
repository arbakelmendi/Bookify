import { apiDelete, apiGet, apiPost } from "@/api/client";

export type AdminReviewDto = {
  id: number;
  userId: number;
  username: string;
  email: string;
  bookId: number;
  bookTitle: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  updatedAt?: string | null;
};

type PagedResponse<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type AdminReviewQuery = {
  search?: string;
  bookId?: number;
  userId?: number;
  minRating?: number;
  maxRating?: number;
  page?: number;
  pageSize?: number;
};

export type CreateAdminReviewPayload = {
  bookId: number;
  rating: number;
  comment?: string | null;
};

export type PatchAdminReviewPayload = {
  rating?: number;
  comment?: string | null;
};

export function getAdminReviews(params?: AdminReviewQuery) {
  return apiGet<PagedResponse<AdminReviewDto>>("/api/admin/reviews", params);
}

export function getAdminReviewById(id: number) {
  return apiGet<AdminReviewDto>(`/api/admin/reviews/${id}`);
}

export function createAdminReview(payload: CreateAdminReviewPayload) {
  return apiPost<AdminReviewDto>("/api/admin/reviews", payload);
}

export async function patchAdminReview(id: number, payload: PatchAdminReviewPayload) {
  const BASE_URL = import.meta.env.DEV
    ? ""
    : (import.meta.env.VITE_API_BASE_URL ?? "");
  const token = localStorage.getItem("bookify_auth_token");

  const response = await fetch(`${BASE_URL}/api/admin/reviews/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = (await response.text()).trim() || "Failed to update review.";
    throw new Error(message);
  }

  if (response.status === 204) return undefined as unknown as AdminReviewDto;
  return response.json() as Promise<AdminReviewDto>;
}

export function deleteAdminReview(id: number) {
  return apiDelete<void>(`/api/admin/reviews/${id}`);
}
