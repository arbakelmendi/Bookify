export type ReadingStatus = "to-read" | "reading" | "finished";

export interface Book {
  id: string;
  title: string;
  author: string;
  cover: string;
  coverImageUrl?: string;

  rating: number;
  category: string;
  description: string;
  pages: number;
  publishedYear: number;
  year?: number;
  duration?: string;
  isAudiobook: boolean;

  // ✅ NEW: where to read as PDF
  pdfUrl?: string;
  previewUrl?: string;

}

export interface UserBook extends Book {
  status: ReadingStatus;
  progress: number;
  currentPage?: number;
  pagesRead?: number;
  totalPages?: number;
  percent?: number;
  lastUpdated?: string;
  userRating?: number;
  dateAdded: string;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  booksCount: number;
  recentBooks: Book[];
}
