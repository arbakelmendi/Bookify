import { apiGet } from "@/api/client";
import type { Book, UserBook } from "@/types/book";

type ApiBook = {
  id: number;
  title: string;
  author?: string | null;
  description?: string | null;
  coverImageUrl?: string | null;
  year?: number | null;
};

const DEFAULT_COVER = "https://placehold.co/200x300/png?text=Book";

export function mapApiBookToBook(apiBook: ApiBook): Book {
  const coverImageUrl = apiBook.coverImageUrl ?? "";
  return {
    id: String(apiBook.id),
    title: apiBook.title,
    author: apiBook.author ?? "Unknown author",
    cover: coverImageUrl || DEFAULT_COVER,
    coverImageUrl: coverImageUrl || undefined,
    rating: 0,
    category: "General",
    description: apiBook.description ?? "No description available yet.",
    pages: 0,
    publishedYear: apiBook.year ?? 0,
    year: apiBook.year ?? undefined,
    duration: undefined,
    isAudiobook: false,
  };
}

export function mapApiBookToUserBook(apiBook: ApiBook): UserBook {
  const base = mapApiBookToBook(apiBook);
  return {
    ...base,
    status: "to-read",
    progress: 0,
    userRating: 0,
    dateAdded: new Date().toISOString(),
  };
}

export async function getBooks(): Promise<Book[]> {
  const data = await apiGet<ApiBook[]>("/api/Books");
  return data.map(mapApiBookToBook);
}

export async function getBookById(id: string): Promise<Book> {
  const data = await apiGet<ApiBook>(`/api/Books/${id}`);
  return mapApiBookToBook(data);
}

export async function getUserBooks(): Promise<UserBook[]> {
  const data = await apiGet<ApiBook[]>("/api/Books");
  return data.map(mapApiBookToUserBook);
}
