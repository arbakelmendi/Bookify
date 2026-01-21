export type ReadingStatus = "to-read" | "reading" | "finished";

export interface Book {
  id: string;
  title: string;
  author: string;
  cover: string;
  rating: number;
  category: string;
  description: string;
  pages: number;
  publishedYear: number;
  duration?: string;
  isAudiobook?: boolean;
}

export interface UserBook extends Book {
  status: ReadingStatus;
  progress: number;
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
