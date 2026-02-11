import { apiGet, apiPost, apiPut, apiDelete } from "@/api/client";
import type { Book, UserBook } from "@/types/book";

type ApiUserBook = {
  id: number;
  userId: number;
  bookId: number;
  status: string;

  title: string;
  author?: string | null;
  description?: string | null;
  coverImageUrl?: string | null;
  year?: number | null;
};

const DEFAULT_COVER = "https://placehold.co/200x300/png?text=Book";

// backend: Reading | Completed | Planned
// UI: reading | finished | to-read
function apiStatusToUi(status?: string): UserBook["status"] {
  const s = (status ?? "").toLowerCase();
  if (s === "completed" || s === "finished") return "finished";
  if (s === "planned" || s === "to-read") return "to-read";
  return "reading";
}

function uiStatusToApi(status: UserBook["status"]): string {
  if (status === "finished") return "Completed";
  if (status === "to-read") return "Planned";
  return "Reading";
}

export function mapApiUserBookToUserBook(x: ApiUserBook): UserBook {
  const cover = x.coverImageUrl ?? "";
  const base: Book = {
    id: String(x.bookId),
    title: x.title,
    author: x.author ?? "Unknown author",
    cover: cover || DEFAULT_COVER,
    coverImageUrl: cover || undefined,
    rating: 0,
    category: "General",
    description: x.description ?? "No description available yet.",
    pages: 0,
    publishedYear: x.year ?? 0,
    year: x.year ?? undefined,
    duration: undefined,
    isAudiobook: false,
  };

  return {
    ...base,
    status: apiStatusToUi(x.status),
    progress: 0,
    userRating: 0,
    dateAdded: new Date().toISOString(),
  };
}

// ✅ list my library (persisted)
export async function getMyLibrary(): Promise<UserBook[]> {
  const data = await apiGet<ApiUserBook[]>("/api/UserBooks");
  return (data ?? []).map(mapApiUserBookToUserBook);
}

// ✅ add a book to my library
export async function addToLibrary(bookId: number, status: UserBook["status"] = "to-read") {
  return apiPost("/api/UserBooks", { bookId, status: uiStatusToApi(status) });
}

// ✅ update status persisted
export async function updateLibraryStatus(bookId: number, status: UserBook["status"]) {
  return apiPut(`/api/UserBooks/book/${bookId}/status`, { status: uiStatusToApi(status) });
}

// ✅ remove from library
export async function removeFromLibrary(bookId: number) {
  return apiDelete(`/api/UserBooks/book/${bookId}`);
}
