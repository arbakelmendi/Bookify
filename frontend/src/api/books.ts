import { apiGet } from "@/api/client";
import type { Book, UserBook } from "@/types/book";
import { getMyLibrary } from "@/api/userBooks";

type ApiBook = {
  id: number;
  title: string;
  author?: string | null;
  description?: string | null;
  coverImageUrl?: string | null;
  year?: number | null;

  // ✅ Hybrid fields (optional)
  pdfUrl?: string | null;
  previewUrl?: string | null;
};

type PagedResponse<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

const DEFAULT_COVER = "https://placehold.co/200x300/png?text=Book";

export function mapApiBookToBook(apiBook: ApiBook): Book {
  const coverImageUrl = apiBook.coverImageUrl ?? "";
  const year = apiBook.year ?? undefined;

  return {
    id: String(apiBook.id),
    title: apiBook.title ?? "Untitled",
    author: apiBook.author ?? "Unknown author",
    cover: coverImageUrl || DEFAULT_COVER,
    coverImageUrl: coverImageUrl || undefined,

    rating: 0,
    category: "General",
    description: apiBook.description ?? "No description available yet.",
    pages: 0,
    publishedYear: year ?? 0,
    year,
    duration: undefined,
    isAudiobook: false,

    // ✅ Hybrid: backend decides
    pdfUrl: apiBook.pdfUrl ?? undefined,
    previewUrl: apiBook.previewUrl ?? undefined,
  };
}


// ✅ IMPORTANT: fetch more than 10 (backend is paged)
export async function getBooks(params?: {
  search?: string;
  title?: string;
  author?: string;
  year?: number;
  page?: number;
  pageSize?: number;
  sortBy?: "id" | "title" | "author" | "year";
  sortDir?: "asc" | "desc";
}): Promise<Book[]> {
  const data = await apiGet<PagedResponse<ApiBook>>("/api/Books", {
    page: 1,
    pageSize: 50,
    ...params,
  });

  return (data?.items ?? []).map(mapApiBookToBook);
}

export async function getBookById(id: string): Promise<Book> {
  const data = await apiGet<ApiBook>(`/api/Books/${id}`);
  return mapApiBookToBook(data);
}

// ✅ library
export async function getUserBooks(): Promise<UserBook[]> {
  return getMyLibrary();
}
