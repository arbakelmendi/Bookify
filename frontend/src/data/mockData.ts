import { Book, UserBook, User } from "@/types/book";

export const mockBooks: Book[] = [
  {
    id: "1",
    title: "The Midnight Library",
    author: "Matt Haig",
    cover: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=400&fit=crop",
    rating: 4.8,
    category: "Fiction",
    description: "Between life and death there is a library, and within that library, the shelves go on forever.",
    pages: 304,
    publishedYear: 2020,
    duration: "8h 50m",
    isAudiobook: true
  },
  {
    id: "2",
    title: "Atomic Habits",
    author: "James Clear",
    cover: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=300&h=400&fit=crop",
    rating: 4.9,
    category: "Self-Help",
    description: "An easy and proven way to build good habits and break bad ones.",
    pages: 320,
    publishedYear: 2018,
    duration: "5h 35m",
    isAudiobook: true
  },
  {
    id: "3",
    title: "Project Hail Mary",
    author: "Andy Weir",
    cover: "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=300&h=400&fit=crop",
    rating: 4.7,
    category: "Sci-Fi",
    description: "A lone astronaut must save the earth from disaster in this incredible new science-based thriller.",
    pages: 496,
    publishedYear: 2021,
    duration: "16h 10m",
    isAudiobook: true
  },
  {
    id: "4",
    title: "The Psychology of Money",
    author: "Morgan Housel",
    cover: "https://images.unsplash.com/photo-1554244933-d876deb6b2ff?w=300&h=400&fit=crop",
    rating: 4.6,
    category: "Finance",
    description: "Timeless lessons on wealth, greed, and happiness.",
    pages: 256,
    publishedYear: 2020
  },
  {
    id: "5",
    title: "Dune",
    author: "Frank Herbert",
    cover: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=300&h=400&fit=crop",
    rating: 4.5,
    category: "Sci-Fi",
    description: "Set on the desert planet Arrakis, Dune is the story of Paul Atreides.",
    pages: 688,
    publishedYear: 1965,
    duration: "21h 2m",
    isAudiobook: true
  },
  {
    id: "6",
    title: "The Silent Patient",
    author: "Alex Michaelides",
    cover: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300&h=400&fit=crop",
    rating: 4.4,
    category: "Thriller",
    description: "A woman's act of violence against her husband and the therapist obsessed with uncovering her motive.",
    pages: 336,
    publishedYear: 2019,
    duration: "8h 43m",
    isAudiobook: true
  },
  {
    id: "7",
    title: "Tomorrow, and Tomorrow, and Tomorrow",
    author: "Gabrielle Zevin",
    cover: "https://images.unsplash.com/photo-1535905557558-afc4877a26fc?w=300&h=400&fit=crop",
    rating: 4.6,
    category: "Fiction",
    description: "A dazzling and imaginative novel about two friends who find an unexpected form of immortality.",
    pages: 416,
    publishedYear: 2023,
    duration: "11h 30m",
    isAudiobook: true
  },
  {
    id: "8",
    title: "Fourth Wing",
    author: "Rebecca Yarros",
    cover: "https://images.unsplash.com/photo-1509021436665-8f07dbf5bf1d?w=300&h=400&fit=crop",
    rating: 4.7,
    category: "Fantasy",
    description: "Twenty-year-old Violet Sorrengail was supposed to enter the Scribe Quadrant.",
    pages: 528,
    publishedYear: 2023
  },
  {
    id: "9",
    title: "Lessons in Chemistry",
    author: "Bonnie Garmus",
    cover: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=300&h=400&fit=crop",
    rating: 4.5,
    category: "Fiction",
    description: "A witty, heartwarming novel about a female chemist in 1960s California.",
    pages: 400,
    publishedYear: 2022,
    duration: "11h 55m",
    isAudiobook: true
  },
  {
    id: "10",
    title: "The House in the Cerulean Sea",
    author: "TJ Klune",
    cover: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop",
    rating: 4.8,
    category: "Fantasy",
    description: "A magical story about finding your family and learning to believe in yourself.",
    pages: 398,
    publishedYear: 2020,
    duration: "13h 27m",
    isAudiobook: true
  }
];

export const mockUserBooks: UserBook[] = [
  {
    ...mockBooks[0],
    status: "reading",
    progress: 65,
    userRating: 5,
    dateAdded: "2024-01-15"
  },
  {
    ...mockBooks[1],
    status: "finished",
    progress: 100,
    userRating: 5,
    dateAdded: "2024-01-10"
  },
  {
    ...mockBooks[2],
    status: "reading",
    progress: 30,
    userRating: 4,
    dateAdded: "2024-01-20"
  },
  {
    ...mockBooks[3],
    status: "to-read",
    progress: 0,
    dateAdded: "2024-01-22"
  },
  {
    ...mockBooks[5],
    status: "finished",
    progress: 100,
    userRating: 4,
    dateAdded: "2024-01-05"
  },
  {
    ...mockBooks[6],
    status: "to-read",
    progress: 0,
    dateAdded: "2024-01-25"
  }
];

export const mockFriends: User[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    booksCount: 42,
    recentBooks: [mockBooks[0], mockBooks[2], mockBooks[4]]
  },
  {
    id: "2",
    name: "Michael Chen",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    booksCount: 28,
    recentBooks: [mockBooks[1], mockBooks[3], mockBooks[5]]
  },
  {
    id: "3",
    name: "Emma Williams",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    booksCount: 56,
    recentBooks: [mockBooks[6], mockBooks[7], mockBooks[8]]
  },
  {
    id: "4",
    name: "David Kim",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    booksCount: 35,
    recentBooks: [mockBooks[9], mockBooks[0], mockBooks[1]]
  }
];

export const categories = [
  "All",
  "Fiction",
  "Non-Fiction",
  "Sci-Fi",
  "Fantasy",
  "Thriller",
  "Romance",
  "Self-Help",
  "Biography",
  "History"
];
