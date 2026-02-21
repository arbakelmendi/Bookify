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
  pages?: number | null;
  pageCount?: number | null;
  duration?: string | null;
  durationText?: string | null;
  categoryId?: number | null;
  category?: string | null;
  categoryName?: string | null;
  rating?: number | null;
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
const BOOK_METADATA_OVERRIDES: Record<string, { pages?: number; duration?: string }> = {
  "dracula": { pages: 418, duration: "12h 30m" },
  "clean code": { pages: 464, duration: "14h 20m" },
  "the midnight library": { pages: 304, duration: "8h 50m" },
  "project hail mary": { pages: 496, duration: "16h 10m" },
  "atomic habits": { pages: 320, duration: "5h 35m" },
  "dune": { pages: 688, duration: "21h 2m" },
  "the psychology of money": { pages: 256 },
  "the silent patient": { pages: 336, duration: "8h 43m" },
};

export function mapApiBookToBook(apiBook: ApiBook): Book {
  const coverImageUrl = apiBook.coverImageUrl ?? "";
  const year = apiBook.year ?? undefined;
  const titleKey = (apiBook.title ?? "").trim().toLowerCase();
  const override = BOOK_METADATA_OVERRIDES[titleKey];
  const pages = Number(apiBook.pages ?? apiBook.pageCount ?? override?.pages ?? 0) || 0;
  const duration =
    (apiBook.duration ?? apiBook.durationText ?? override?.duration ?? "").trim() || undefined;
  const categoryName = (apiBook.categoryName ?? apiBook.category ?? "General").trim() || "General";
  const ratingValue = typeof apiBook.rating === "number" ? apiBook.rating : 0;

  return {
    id: String(apiBook.id),
    title: apiBook.title ?? "Untitled",
    author: apiBook.author ?? "Unknown author",
    cover: coverImageUrl || DEFAULT_COVER,
    coverImageUrl: coverImageUrl || undefined,
    categoryId: apiBook.categoryId ?? null,
    categoryName,
    rating: ratingValue,
    category: categoryName,
    description: apiBook.description ?? "No description available yet.",
    pages,
    publishedYear: year ?? 0,
    year,
    duration,
    isAudiobook: false,
    pdfUrl: apiBook.pdfUrl ?? undefined,
    previewUrl: apiBook.previewUrl ?? undefined,
  };
}

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

export async function getUserBooks(): Promise<UserBook[]> {
  return getMyLibrary();
}
