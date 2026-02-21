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
const BOOK_METADATA_OVERRIDES: Record<
  string,
  { pages?: number; duration?: string; year?: number; category?: string; coverImageUrl?: string }
> = {
  "and then there were none": { pages: 272, year: 1939, category: "Mystery" },
  "five little pigs": { pages: 288, year: 1942, category: "Mystery" },
  "the 7½ deaths of evelyn hardcastle": { pages: 512, year: 2018, category: "Mystery" },
  "how to break up with your phone": {
    pages: 192,
    year: 2018,
    category: "Self-Help",
    coverImageUrl: "https://covers.openlibrary.org/b/isbn/9780399581120-L.jpg",
  },
  "the lost throne": { pages: 416, duration: "12h 0m", year: 2008, category: "Thriller" },
  "clean code": { pages: 464, duration: "14h 20m", year: 2008, category: "Programming" },
  "dracula": { pages: 418, duration: "12h 30m", year: 1897, category: "Horror" },
  "the adventures of sherlock holmes": { pages: 307, duration: "9h 30m", year: 1892, category: "Mystery" },
  "how to take charge of your life: the user’s guide to nlp": {
    pages: 320,
    duration: "9h 30m",
    year: 2008,
    category: "Self-Help",
    coverImageUrl: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&h=900&fit=crop",
  },
  "refactoring": { pages: 448, duration: "13h 30m", year: 1999, category: "Programming" },
  "domain-driven design": { pages: 560, duration: "17h 0m", year: 2003, category: "Programming" },
  "design patterns": { pages: 416, duration: "12h 0m", year: 1994, category: "Programming" },
  "the pragmatic programmer": { pages: 352, duration: "10h 30m", year: 1999, category: "Programming" },
  "frankenstein": { pages: 280, duration: "8h 20m", year: 1818, category: "Classic" },
  "jane eyre": { pages: 532, duration: "16h 0m", year: 1847, category: "Classic" },
  "moby-dick": { pages: 704, duration: "22h 0m", year: 1851, category: "Classic" },
  "the picture of dorian gray": { pages: 288, duration: "8h 30m", year: 1890, category: "Classic" },
  "the midnight library": { pages: 304, duration: "8h 50m", year: 2020, category: "Fiction" },
  "project hail mary": { pages: 496, duration: "16h 10m", year: 2021, category: "Sci-Fi" },
  "atomic habits": { pages: 320, duration: "5h 35m", year: 2018, category: "Self-Help" },
  "dune": { pages: 688, duration: "21h 2m", year: 1965, category: "Sci-Fi" },
  "the psychology of money": { pages: 256, year: 2020, category: "Finance" },
  "the silent patient": { pages: 336, duration: "8h 43m", year: 2019, category: "Thriller" },
};

export function mapApiBookToBook(apiBook: ApiBook): Book {
  const titleKey = (apiBook.title ?? "").trim().toLowerCase();
  const override = BOOK_METADATA_OVERRIDES[titleKey];
  const pages = Number(apiBook.pages ?? apiBook.pageCount ?? override?.pages ?? 0) || 0;
  const duration =
    (apiBook.duration ?? apiBook.durationText ?? override?.duration ?? "").trim() || undefined;
  const categoryName =
    (apiBook.categoryName ?? apiBook.category ?? override?.category ?? "General").trim() || "General";
  const ratingValue = typeof apiBook.rating === "number" ? apiBook.rating : 0;
  const publishedYear = apiBook.year ?? override?.year ?? undefined;
  const stableCover = apiBook.coverImageUrl ?? override?.coverImageUrl ?? "";

  return {
    id: String(apiBook.id),
    title: apiBook.title ?? "Untitled",
    author: apiBook.author ?? "Unknown author",
    cover: stableCover || coverImageUrl || DEFAULT_COVER,
    coverImageUrl: stableCover || coverImageUrl || undefined,
    categoryId: apiBook.categoryId ?? null,
    categoryName,
    rating: ratingValue,
    category: categoryName,
    description: apiBook.description ?? "No description available yet.",
    pages,
    publishedYear: publishedYear ?? 0,
    year: publishedYear,
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
