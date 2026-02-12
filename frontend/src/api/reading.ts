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
