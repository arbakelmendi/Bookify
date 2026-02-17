import { apiGet, apiPost, apiPut, apiDelete } from "@/api/client";
import type { Book, UserBook } from "@/types/book";

type ApiUserBookFlat = {
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

// sometimes backend returns nested Book object; tolerate both
type ApiUserBookMaybeNested = ApiUserBookFlat & {
  book?: {
    id?: number;
    title?: string;
    author?: string | null;
    description?: string | null;
    coverImageUrl?: string | null;
    year?: number | null;
  };
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

export function mapApiUserBookToUserBook(x: ApiUserBookMaybeNested): UserBook {
  const b = x.book ?? ({} as any);

  const title = x.title ?? b.title ?? "Untitled";
  const author = x.author ?? b.author ?? "Unknown author";
  const description = x.description ?? b.description ?? "No description available yet.";
  const year = x.year ?? b.year ?? undefined;
  const coverUrl = x.coverImageUrl ?? b.coverImageUrl ?? "";

  const base: Book = {
    id: String(x.bookId ?? b.id ?? 0),
    title,
    author,
    cover: coverUrl || DEFAULT_COVER,
    coverImageUrl: coverUrl || undefined,

    rating: 0,
    category: "General",
    description,
    pages: 0,
    publishedYear: year ?? 0,
    year,
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
  const data = await apiGet<ApiUserBookMaybeNested[]>("/api/UserBooks");
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
