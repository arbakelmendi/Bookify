import { apiGet, apiPost, apiPut } from "@/api/client";

export type ReadingEntry = {
  id: number;
  userId: number;
  bookId: number;
  status: "Reading" | "Finished" | string;
  totalPages: number;
  pagesRead: number;
  percent: number;
  startedAt: string;
  lastUpdated: string;
};

export type PdfProgressViewDto = {
  bookId: number;
  userBookId: number;
  currentPage: number;
  totalPages: number;
  pagesRead: number;
  percent: number;
  status: string;
  lastUpdated: string;
};

export type UpdatePdfProgressDto = {
  currentPage: number;
  totalPages?: number;
  status?: string;
};

const BASE_URL = import.meta.env.DEV
  ? ""
  : (import.meta.env.VITE_API_BASE_URL ?? "");

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("bookify_auth_token");
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

export async function getCurrentReading(): Promise<ReadingEntry[]> {
  return apiGet<ReadingEntry[]>("/api/Reading/current");
}

export async function getFinishedReading(): Promise<ReadingEntry[]> {
  return apiGet<ReadingEntry[]>("/api/Reading/finished");
}

export async function getReadingById(id: number): Promise<ReadingEntry> {
  return apiGet<ReadingEntry>(`/api/Reading/${id}`);
}

export async function startReading(
  bookId: number,
  totalPages: number
): Promise<ReadingEntry> {
  return apiPost<ReadingEntry>("/api/Reading/start", { bookId, totalPages });
}

export async function updateProgress(
  id: number,
  pagesRead: number
): Promise<void> {
  return apiPut<void>(`/api/Reading/${id}/progress`, { pagesRead });
}

export async function finishReading(id: number): Promise<void> {
  return apiPut<void>(`/api/Reading/${id}/finish`);
}

export async function getPdfProgress(bookId: number): Promise<PdfProgressViewDto | null> {
  const response = await fetch(`${BASE_URL}/api/Reading/book/${bookId}/progress`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (response.status === 404) return null;

  if (!response.ok) {
    const message = (await response.text()).trim() || "Failed to load PDF progress.";
    throw new Error(message);
  }

  return response.json();
}

export async function upsertPdfProgress(
  bookId: number,
  body: UpdatePdfProgressDto
): Promise<PdfProgressViewDto | void> {
  return apiPut<PdfProgressViewDto | void>(`/api/Reading/book/${bookId}/progress`, body);
}
