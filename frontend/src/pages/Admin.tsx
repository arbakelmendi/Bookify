import React, { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { motion } from "framer-motion";


import {
  Users,
  BookOpen,
  BarChart3,
  Shield,
  TrendingUp,
  Activity,
  Library,
  Search,
  MoreHorizontal,
  Trash2,
  RefreshCw,
  UserPlus,
  Edit,
  Plus,
  MessageSquare,
  Star,
  Check,
  X,
  Tag,
}from "lucide-react";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  type CategoryDto,
} from "@/api/categories";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiDelete, apiGet, apiPost, apiPut } from "@/api/client";
import {
  createAdminReview,
  deleteAdminReview,
  getAdminReviews,
  type AdminReviewDto,
  patchAdminReview,
} from "@/api/adminReviews";
import type { User } from "@/types/auth";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];


interface UserFormData {
  email: string;
  username: string;
  password: string;
  role: "user" | "admin";
}

// Minimal shape for admin table (supports both your backend + old mock fields)
type AdminBook = {
  id: number;
  title: string;
  author?: string | null;
  description?: string | null;
  coverImageUrl?: string | null; // backend
  cover?: string | null; // mock style
  category?: string | null;
  rating?: number | null;
  isAudiobook?: boolean | null;
  publishedYear?: number | null;
  year?: number | null;
  pdfUrl?: string | null;
  previewUrl?: string | null;
};

type BookFormState = {
  title: string;
  author: string;
  description: string;
  coverImageUrl: string;
  category: string;
  rating: number;
  isAudiobook: boolean;
  publishedYear?: number;
  pdfUrl: string;
  previewUrl: string;
};

type AdminActivityPoint = {
  date: string;
  label: string;
  activeUsers: number;
  reviewEvents: number;
  readingEvents: number;
  totalEvents: number;
};

const emptyBookForm = (): BookFormState => ({
  title: "",
  author: "",
  description: "",
  coverImageUrl: "",
  category: "",
  rating: 0,
  isAudiobook: false,
  publishedYear: undefined,
  pdfUrl: "",
  previewUrl: "",
});

const Admin = () => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();

  // USERS
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Create/Edit user dialogs
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    email: "",
    username: "",
    password: "",
    role: "user",
  });
  const [formLoading, setFormLoading] = useState(false);

  // BOOKS
  const [books, setBooks] = useState<AdminBook[]>([]);
  const [booksLoading, setBooksLoading] = useState(false);
  const [booksError, setBooksError] = useState<string | null>(null);
  const [bookSearch, setBookSearch] = useState("");

  const [bookToDelete, setBookToDelete] = useState<AdminBook | null>(null);
  const [bookDeleteDialogOpen, setBookDeleteDialogOpen] = useState(false);

  const [createBookDialogOpen, setCreateBookDialogOpen] = useState(false);
  const [editBookDialogOpen, setEditBookDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<AdminBook | null>(null);
  const [bookForm, setBookForm] = useState<BookFormState>(emptyBookForm());
  const [bookFormLoading, setBookFormLoading] = useState(false);

  // REVIEWS
  const [reviews, setReviews] = useState<AdminReviewDto[]>([]);
  const [analyticsReviews, setAnalyticsReviews] = useState<AdminReviewDto[]>([]);
  const [analyticsActivity, setAnalyticsActivity] = useState<AdminActivityPoint[]>([]);
  const [analyticsTotals, setAnalyticsTotals] = useState({
    activeUsers: 0,
    reviewEvents: 0,
    readingEvents: 0,
    totalEvents: 0,
  });
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [reviewSearchInput, setReviewSearchInput] = useState("");
  const [reviewSearch, setReviewSearch] = useState("");
  const [reviewUserFilter, setReviewUserFilter] = useState<string>("all");
  const [reviewBookFilter, setReviewBookFilter] = useState<string>("all");
  const [reviewRatingFilter, setReviewRatingFilter] = useState<string>("all");
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewPageSize, setReviewPageSize] = useState<10 | 20 | 50>(10);
  const [reviewTotalItems, setReviewTotalItems] = useState(0);
  const [reviewTotalPages, setReviewTotalPages] = useState(1);

  const [createReviewDialogOpen, setCreateReviewDialogOpen] = useState(false);
  const [reviewDeleteDialogOpen, setReviewDeleteDialogOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<AdminReviewDto | null>(null);
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<{ rating: number; comment: string }>({
    rating: 5,
    comment: "",
  });
  const [reviewFormLoading, setReviewFormLoading] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    bookId: "",
    rating: "5",
    comment: "",
  });
  const [reviewCreateBookSearch, setReviewCreateBookSearch] = useState("");

    // -------------------- Categories state --------------------
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [catLoading, setCatLoading] = useState(false);
  const [catCreateLoading, setCatCreateLoading] = useState(false);
  const [catError, setCatError] = useState<string | null>(null);

  const [newCategoryName, setNewCategoryName] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");


  // Redirect if not admin
  if (!isAdmin) return <Navigate to="/login" replace />;

  const normalized = (s?: string | null) => (s ?? "").trim().toLowerCase();

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await apiGet<User[]>("/api/users");
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast({
        title: "Error",
        description: "Failed to load users. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch books from API
  const fetchBooks = async () => {
    try {
      setBooksLoading(true);
      setBooksError(null);

      const pageSize = 50;
      let page = 1;
      let totalPages = 1;
      const all: AdminBook[] = [];

      do {
        const data = await apiGet<any>("/api/Books", {
          page,
          pageSize,
          sortBy: "id",
          sortDir: "desc",
        });

        const list: AdminBook[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
          ? data.items
          : [];

        all.push(...list);
        totalPages = Math.max(1, Number(data?.totalPages ?? 1));
        page += 1;
      } while (page <= totalPages && page <= 100);

      setBooks(all);
    } catch (error) {
      console.error("Failed to fetch books:", error);
      setBooksError("Failed to load books.");
      toast({
        title: "Error",
        description: "Failed to load books. Please try again.",
        variant: "destructive",
      });
    } finally {
      setBooksLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      setReviewsError(null);

      const data = await getAdminReviews({
        search: reviewSearch.trim() || undefined,
        userId: reviewUserFilter === "all" ? undefined : Number(reviewUserFilter),
        bookId: reviewBookFilter === "all" ? undefined : Number(reviewBookFilter),
        minRating: reviewRatingFilter === "all" ? undefined : Number(reviewRatingFilter),
        maxRating: reviewRatingFilter === "all" ? undefined : Number(reviewRatingFilter),
        page: reviewPage,
        pageSize: reviewPageSize,
      });

      setReviews(data.items ?? []);
      setReviewTotalItems(data.totalItems ?? 0);
      setReviewTotalPages(Math.max(1, data.totalPages ?? 1));
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
      setReviewsError(error instanceof Error ? error.message : "Failed to load reviews.");
      toast({
        title: "Error",
        description: "Failed to load reviews. Please try again.",
        variant: "destructive",
      });
    } finally {
      setReviewsLoading(false);
    }
  };

  const fetchAnalyticsReviews = async () => {
    try {
      const pageSize = 200;
      let page = 1;
      let totalPages = 1;
      const all: AdminReviewDto[] = [];

      do {
        const data = await getAdminReviews({ page, pageSize });
        all.push(...(data.items ?? []));
        totalPages = Math.max(1, data.totalPages ?? 1);
        page += 1;
      } while (page <= totalPages && page <= 10);

      setAnalyticsReviews(all);
    } catch (error) {
      console.error("Failed to fetch analytics reviews:", error);
      setAnalyticsReviews([]);
    }
  };

  const fetchAnalyticsActivity = async () => {
    try {
      const data = await apiGet<{
        items: AdminActivityPoint[];
        totals?: {
          activeUsers?: number;
          reviewEvents?: number;
          readingEvents?: number;
          totalEvents?: number;
        };
      }>("/api/admin/analytics/activity", { days: 7 });

      const items = Array.isArray(data?.items) ? data.items : [];
      setAnalyticsActivity(items);
      setAnalyticsTotals({
        activeUsers: Number(data?.totals?.activeUsers ?? 0),
        reviewEvents: Number(data?.totals?.reviewEvents ?? 0),
        readingEvents: Number(data?.totals?.readingEvents ?? 0),
        totalEvents: Number(data?.totals?.totalEvents ?? 0),
      });
    } catch (error) {
      console.error("Failed to fetch analytics activity:", error);
      setAnalyticsActivity([]);
      setAnalyticsTotals({
        activeUsers: 0,
        reviewEvents: 0,
        readingEvents: 0,
        totalEvents: 0,
      });
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchBooks();
    fetchReviews();
    fetchAnalyticsReviews();
    fetchAnalyticsActivity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => setReviewSearch(reviewSearchInput), 400);
    return () => window.clearTimeout(t);
  }, [reviewSearchInput]);

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewSearch, reviewUserFilter, reviewBookFilter, reviewRatingFilter, reviewPage, reviewPageSize]);

  useEffect(() => {
    fetchAnalyticsReviews();
    fetchAnalyticsActivity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewTotalItems]);

  useEffect(() => {
    const id = window.setInterval(() => {
      fetchAnalyticsActivity();
    }, 15000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setReviewPage(1);
  }, [reviewSearch, reviewUserFilter, reviewBookFilter, reviewRatingFilter, reviewPageSize]);

  // Filter users based on search
  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return users.filter(
      (u) => u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  // Filter + sort books
  const filteredBooks = useMemo(() => {
    const q = normalized(bookSearch);
    return books
      .filter((b) => {
        if (!q) return true;
        return normalized(b.title).includes(q) || normalized(b.author).includes(q);
      })
      .sort((a, b) => a.id - b.id);
  }, [books, bookSearch]);

  const bookCategoryOptions = useMemo(() => {
    const names = categories.map((c) => c.name.trim()).filter(Boolean);
    return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
  }, [categories]);

  const categorySelectOptions = useMemo(() => {
    const currentCategory = (bookForm.category ?? "").trim();
    if (currentCategory && !bookCategoryOptions.includes(currentCategory)) {
      return [...bookCategoryOptions, currentCategory];
    }
    return bookCategoryOptions;
  }, [bookCategoryOptions, bookForm.category]);

  // Create user
  const handleCreateUser = async () => {
    if (!formData.email || !formData.username || !formData.password) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      setFormLoading(true);
      await apiPost("/api/auth/register", {
        email: formData.email,
        username: formData.username,
        password: formData.password,
      });

      toast({
        title: "User Created",
        description: `${formData.username} has been successfully created.`,
      });

      setCreateDialogOpen(false);
      setFormData({ email: "", username: "", password: "", role: "user" });
      fetchUsers();
    } catch (error) {
      console.error("Failed to create user:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setFormLoading(false);
    }
  };

  // Open edit dialog
  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      username: user.username,
      password: "",
      role: user.role,
    });
    setEditDialogOpen(true);
  };

  // Update user
  const handleUpdateUser = async () => {
    if (!editingUser || !formData.email || !formData.username) return;

    try {
      setFormLoading(true);
      await apiPut(`/api/users/${editingUser.id}`, {
        email: formData.email,
        username: formData.username,
        role: formData.role,
      });

      toast({
        title: "User Updated",
        description: `${formData.username}'s information has been updated.`,
      });

      setEditDialogOpen(false);
      setEditingUser(null);
      setFormData({ email: "", username: "", password: "", role: "user" });
      fetchUsers();
    } catch (error) {
      console.error("Failed to update user:", error);
      toast({
        title: "Error",
        description: "Failed to update user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setFormLoading(false);
    }
  };

  // Delete user
  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      await apiDelete(`/api/users/${userToDelete.id}`);
      toast({
        title: "User Deleted",
        description: `${userToDelete.username} has been permanently deleted.`,
      });
      setUserToDelete(null);
      setDeleteDialogOpen(false);
      fetchUsers();
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast({
        title: "Error",
        description: "Failed to delete user. Please try again.",
        variant: "destructive",
      });
    }
  };

  const validateBookForm = () => {
    if (!bookForm.title.trim()) return "Title is required.";
    if (!bookForm.description.trim()) return "Description is required.";
    if (bookForm.rating < 0 || bookForm.rating > 5) return "Rating must be between 0 and 5.";
    return null;
  };

  // Create book
  const handleCreateBook = async () => {
    const err = validateBookForm();
    if (err) {
      toast({ title: "Validation Error", description: err, variant: "destructive" });
      return;
    }

    try {
      setBookFormLoading(true);

      const payload = {
        title: bookForm.title.trim(),
        author: bookForm.author.trim() || null,
        description: bookForm.description.trim(),
        coverImageUrl: bookForm.coverImageUrl.trim() || null,
        category: bookForm.category.trim() || null,
        rating: Number.isFinite(bookForm.rating) && bookForm.rating > 0 ? bookForm.rating : null,
        isAudiobook: !!bookForm.isAudiobook,
        year: bookForm.publishedYear ?? null,
        pdfUrl: bookForm.pdfUrl.trim() || null,
        previewUrl: bookForm.previewUrl.trim() || null,
      };

      const created = await apiPost<AdminBook>("/api/Books", payload);

      toast({ title: "Book Created", description: `"${payload.title}" has been created.` });

      setBooks((prev) => {
        // if backend returns created item, append; otherwise just refetch
        if (created && typeof created.id === "number") return [...prev, created];
        return prev;
      });

      setCreateBookDialogOpen(false);
      setBookForm(emptyBookForm());
      fetchBooks();
    } catch (error) {
      console.error("Failed to create book:", error);
      toast({
        title: "Error",
        description: "Failed to create book. Please try again.",
        variant: "destructive",
      });
    } finally {
      setBookFormLoading(false);
    }
  };

  // Update book
  const handleUpdateBook = async () => {
    if (!editingBook) return;

    const err = validateBookForm();
    if (err) {
      toast({ title: "Validation Error", description: err, variant: "destructive" });
      return;
    }

    try {
      setBookFormLoading(true);

      const payload = {
        id: editingBook.id,
        title: bookForm.title.trim(),
        author: bookForm.author.trim() || null,
        description: bookForm.description.trim(),
        coverImageUrl: bookForm.coverImageUrl.trim() || null,
        category: bookForm.category.trim() || null,
        rating: Number.isFinite(bookForm.rating) && bookForm.rating > 0 ? bookForm.rating : null,
        isAudiobook: !!bookForm.isAudiobook,
        year: bookForm.publishedYear ?? null,
        pdfUrl: bookForm.pdfUrl.trim() || null,
        previewUrl: bookForm.previewUrl.trim() || null,
      };

      const updated = await apiPut<AdminBook>(`/api/Books/${editingBook.id}`, payload);

      toast({ title: "Book Updated", description: `"${payload.title}" has been updated.` });

      setBooks((prev) =>
        prev.map((b) => (b.id === editingBook.id ? (updated ?? ({ ...b, ...payload } as any)) : b))
      );

      setEditBookDialogOpen(false);
      setEditingBook(null);
      setBookForm(emptyBookForm());
      fetchBooks();
    } catch (error) {
      console.error("Failed to update book:", error);
      toast({
        title: "Error",
        description: "Failed to update book. Please try again.",
        variant: "destructive",
      });
    } finally {
      setBookFormLoading(false);
    }
  };

  // Delete book
  const handleDeleteBook = async () => {
    if (!bookToDelete) return;

    try {
      await apiDelete(`/api/Books/${bookToDelete.id}`);
      toast({
        title: "Book Deleted",
        description: `"${bookToDelete.title}" has been deleted.`,
      });

      setBooks((prev) => prev.filter((b) => b.id !== bookToDelete.id));
      setBookToDelete(null);
      setBookDeleteDialogOpen(false);
    } catch (error) {
      console.error("Failed to delete book:", error);
      toast({
        title: "Error",
        description: "Failed to delete book. Please try again.",
        variant: "destructive",
      });
    }
  };

  async function loadCategories() {
  setCatLoading(true);
  setCatError(null);
  try {
    const data = await getCategories();
    // sort alfabetik
    data.sort((a, b) => a.name.localeCompare(b.name));
    setCategories(data);
  } catch (e: any) {
    setCatError(e?.message ?? "Failed to load categories.");
  } finally {
    setCatLoading(false);
  }
}

async function handleCreateCategory() {
  const name = newCategoryName.trim();
  if (!name) {
    toast({
      title: "Validation Error",
      description: "Category name is required.",
      variant: "destructive",
    });
    return;
  }

  setCatError(null);
  setCatCreateLoading(true);
  try {
    const created = await createCategory(name);
    toast({ title: "Category created" });
    setNewCategoryName("");
    setCategories((prev) =>
      [...prev, created].sort((a, b) => a.name.localeCompare(b.name))
    );
  } catch (e: any) {
    const message = e?.message ?? "Failed to create category.";
    setCatError(message);
    toast({
      title: "Error",
      description: message,
      variant: "destructive",
    });
  } finally {
    setCatCreateLoading(false);
  }
}

function startEditCategory(cat: CategoryDto) {
  setEditingId(cat.id);
  setEditingName(cat.name);
}

function cancelEditCategory() {
  setEditingId(null);
  setEditingName("");
}

async function handleUpdateCategory() {
  if (editingId === null) return;

  const name = editingName.trim();
  if (!name) return;

  setCatError(null);
  try {
    await updateCategory(editingId, name);
    cancelEditCategory();
    await loadCategories();
  } catch (e: any) {
    setCatError(e?.message ?? "Failed to update category.");
  }
}

async function handleDeleteCategory(id: number) {
  const ok = window.confirm("Are you sure you want to delete this category?");
  if (!ok) return;

  setCatError(null);
  try {
    await deleteCategory(id);
    await loadCategories();
  } catch (e: any) {
    setCatError(e?.message ?? "Failed to delete category.");
  }
}
useEffect(() => {
  loadCategories();
}, []);


  const resetReviewForm = () => {
    setReviewForm({
      bookId: "",
      rating: "5",
      comment: "",
    });
  };

  const handleCreateReview = async () => {
    if (!reviewForm.bookId) {
      toast({
        title: "Validation Error",
        description: "Please select a book.",
        variant: "destructive",
      });
      return;
    }

    try {
      setReviewFormLoading(true);
      await createAdminReview({
        bookId: Number(reviewForm.bookId),
        rating: Number(reviewForm.rating),
        comment: reviewForm.comment.trim() || null,
      });

      toast({
        title: "Review Created",
        description: "Review has been created successfully.",
      });

      setCreateReviewDialogOpen(false);
      resetReviewForm();
      setReviewPage(1);
      if (reviewPage === 1) {
        fetchReviews();
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to create review. Please try again.";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setReviewFormLoading(false);
    }
  };

  const startInlineEdit = (review: AdminReviewDto) => {
    setEditingReviewId(review.id);
    setEditDraft({
      rating: review.rating,
      comment: review.comment ?? "",
    });
  };

  const cancelInlineEdit = () => {
    setEditingReviewId(null);
  };

  const handleInlineSave = async (review: AdminReviewDto) => {
    try {
      setReviewFormLoading(true);

      const payload: { rating?: number; comment?: string | null } = {};
      if (editDraft.rating !== review.rating) payload.rating = editDraft.rating;
      if ((editDraft.comment ?? "") !== (review.comment ?? "")) {
        payload.comment = editDraft.comment.trim() || null;
      }

      if (Object.keys(payload).length === 0) {
        setEditingReviewId(null);
        return;
      }

      const updated = await patchAdminReview(review.id, payload);
      setReviews((prev) =>
        prev.map((r) =>
          r.id === review.id ? (updated ? updated : { ...r, ...payload, updatedAt: new Date().toISOString() }) : r
        )
      );
      setEditingReviewId(null);
      toast({ title: "Review updated" });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update review.",
        variant: "destructive",
      });
    } finally {
      setReviewFormLoading(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!reviewToDelete) return;

    try {
      await deleteAdminReview(reviewToDelete.id);
      toast({
        title: "Review Deleted",
        description: "Review has been deleted successfully.",
      });
      setReviewDeleteDialogOpen(false);
      setReviewToDelete(null);
      const shouldGoPrevPage = reviews.length === 1 && reviewPage > 1;
      if (shouldGoPrevPage) {
        setReviewPage((prev) => Math.max(1, prev - 1));
      } else {
        fetchReviews();
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to delete review. Please try again.",
        variant: "destructive",
      });
    }
  };

  const analyticsActivityData = useMemo(() => {
    if (analyticsActivity.length > 0) {
      return analyticsActivity.map((d) => ({
        name: d.label,
        users: d.activeUsers,
        books: d.totalEvents,
      }));
    }

    const fallback: { name: string; users: number; books: number }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      fallback.push({
        name: d.toLocaleDateString(undefined, { weekday: "short" }),
        users: 0,
        books: 0,
      });
    }
    return fallback;
  }, [analyticsActivity]);

  const analyticsCategoryData = useMemo(() => {
    const bucket = new Map<string, number>();
    for (const b of books) {
      const name = (b.category ?? "").trim() || "Uncategorized";
      bucket.set(name, (bucket.get(name) ?? 0) + 1);
    }

    return Array.from(bucket.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [books]);

  const activeUsersLast7d = analyticsTotals.activeUsers;

  const stats = [
    {
      title: "Total Users",
      value: users.length,
      icon: Users,
      change: `${activeUsersLast7d} active in 7d`,
      changeType: "positive" as const,
    },
    {
      title: "Total Books",
      value: books.length,
      icon: BookOpen,
      change: `${analyticsCategoryData.length} categories`,
      changeType: "positive" as const,
    },
    {
      title: "Active Users (7d)",
      value: activeUsersLast7d,
      icon: Activity,
      change: `${analyticsTotals.totalEvents} total events`,
      changeType: "positive" as const,
    },
    {
      title: "Reviews Total",
      value: analyticsReviews.length,
      icon: Library,
      change: `${analyticsTotals.readingEvents} reading updates`,
      changeType: "positive" as const,
    },
  ];

  const renderStars = (
    value: number,
    onClick?: (v: number) => void
  ) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((v) => (
        <button
          key={v}
          type="button"
          disabled={!onClick}
          onClick={(e) => {
            e.stopPropagation();
            onClick?.(v);
          }}
          className={onClick ? "cursor-pointer" : "cursor-default"}
        >
          <Star
            className={`w-4 h-4 ${
              value >= v ? "fill-primary text-primary" : "text-muted-foreground"
            }`}
          />
        </button>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              </div>
              <p className="text-muted-foreground">
                Manage users, books, and monitor platform activity
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{stat.title}</p>
                        <p className="text-3xl font-bold mt-1">{stat.value}</p>
                        <div className="flex items-center gap-1 mt-2">
                          <TrendingUp className="w-3 h-3 text-green-500" />
                          <span className="text-xs text-green-500">{stat.change}</span>
                        </div>
                      </div>
                      <div className="p-3 bg-primary/10 rounded-full">
                        <stat.icon className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Main Content */}
          <Tabs defaultValue="users" className="space-y-6">
            <TabsList className="grid w-full max-w-2xl grid-cols-5">
              <TabsTrigger value="users" className="gap-2">
                <Users className="w-4 h-4" />
                Users
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="books" className="gap-2">
                <BookOpen className="w-4 h-4" />
                Books
              </TabsTrigger>
              <TabsTrigger value="reviews" className="gap-2">
                <MessageSquare className="w-4 h-4" />
                Reviews
              </TabsTrigger>
              <TabsTrigger value="categories" className="gap-2">
              <Tag className="w-4 h-4" />
              Categories
            </TabsTrigger>

            </TabsList>

            {/* Users Tab */}
            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>User Management</CardTitle>
                      <CardDescription>View and manage all registered users</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Search users..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                      <Button variant="outline" size="icon" onClick={fetchUsers}>
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                      <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
                        <UserPlus className="w-4 h-4" />
                        Add User
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {loading ? (
                    <div className="text-center py-12">
                      <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
                      <p className="text-muted-foreground">Loading users...</p>
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No users found</p>
                      {searchQuery && <p className="text-sm">Try adjusting your search</p>}
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Username</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.id}</TableCell>
                            <TableCell>{user.username}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                                {user.role}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEditClick(user)}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit User
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => {
                                      setUserToDelete(user);
                                      setDeleteDialogOpen(true);
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete User
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

             {/* Analytics Tab */}
            <TabsContent value="analytics">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Platform Activity</CardTitle>
                    <CardDescription>Weekly user and book activity</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={analyticsActivityData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="name" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="users"
                          stackId="1"
                          stroke="hsl(var(--primary))"
                          fill="hsl(var(--primary))"
                          fillOpacity={0.3}
                        />
                        <Area
                          type="monotone"
                          dataKey="books"
                          stackId="2"
                          stroke="hsl(var(--chart-2))"
                          fill="hsl(var(--chart-2))"
                          fillOpacity={0.3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Book Categories</CardTitle>
                    <CardDescription>Distribution by category</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={analyticsCategoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {analyticsCategoryData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>

                    <div className="flex flex-wrap justify-center gap-4 mt-4">
                      {analyticsCategoryData.map((item, index) => (
                        <div key={item.name} className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: COLORS[index] }}
                          />
                          <span className="text-sm text-muted-foreground">{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Books Tab */}
            <TabsContent value="books">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <CardTitle>Book Catalog</CardTitle>
                      <CardDescription>
                        Manage the book collection ({filteredBooks.length} books)
                      </CardDescription>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Search books..."
                          value={bookSearch}
                          onChange={(e) => setBookSearch(e.target.value)}
                          className="pl-9"
                        />
                      </div>

                      <Button
                        variant="outline"
                        size="icon"
                        onClick={fetchBooks}
                        title="Refresh books"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>

                      <Button
                        onClick={() => {
                          setEditingBook(null);
                          setBookForm(emptyBookForm());
                          setCreateBookDialogOpen(true);
                        }}
                        className="gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Book
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {booksLoading ? (
                    <div className="text-center py-12">
                      <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
                      <p className="text-muted-foreground">Loading books...</p>
                    </div>
                  ) : booksError ? (
                    <p className="text-destructive">{booksError}</p>
                  ) : filteredBooks.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No books found</p>
                      {bookSearch && <p className="text-sm">Try adjusting your search</p>}
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Cover</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Author</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Rating</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {filteredBooks.map((book) => {
                          const coverSrc =
                            book.coverImageUrl ||
                            book.cover ||
                            "https://placehold.co/60x90/png?text=Book";
                          const isBroken = !book.pdfUrl && !book.previewUrl;

                          return (
                            <TableRow key={book.id}>
                              <TableCell className="font-medium">{book.id}</TableCell>

                              <TableCell>
                                <img
                                  src={coverSrc}
                                  alt={book.title}
                                  className="w-10 h-14 object-cover rounded"
                                  onError={(e) => {
                                    e.currentTarget.src =
                                      "https://placehold.co/60x90/png?text=Book";
                                  }}
                                />
                              </TableCell>

                              <TableCell className="font-medium">
                                {book.title}
                                {isBroken && (
                                  <Badge className="ml-2" variant="destructive">
                                    Broken
                                  </Badge>
                                )}
                              </TableCell>

                              <TableCell>{book.author || "â€”"}</TableCell>

                              <TableCell>
                                <Badge variant="outline">{book.category || "â€”"}</Badge>
                              </TableCell>

                                                            <TableCell>
                                {typeof book.rating === "number" && book.rating > 0 ? (
                                  <div className="flex items-center gap-2">
                                    {renderStars(Math.round(book.rating))}
                                    <span className="text-sm text-muted-foreground">
                                      {book.rating.toFixed(1)}
                                    </span>
                                  </div>
                                ) : (
                                  "—"
                                )}
                              </TableCell>

                              <TableCell>
                                {book.isAudiobook ? (
                                  <Badge>Audiobook</Badge>
                                ) : (
                                  <Badge variant="secondary">eBook</Badge>
                                )}
                              </TableCell>

                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>

                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setEditingBook(book);
                                        setBookForm({
                                          title: book.title ?? "",
                                          author: book.author ?? "",
                                          description: book.description ?? "",
                                          coverImageUrl:
                                            (book.coverImageUrl ?? book.cover ?? "") as string,
                                          category: book.category ?? "",
                                          rating: typeof book.rating === "number" ? book.rating : 0,
                                          isAudiobook: !!book.isAudiobook,
                                          publishedYear:
                                            (book.publishedYear ?? book.year) || undefined,
                                          pdfUrl: book.pdfUrl ?? "",
                                          previewUrl: book.previewUrl ?? "",
                                        });
                                        setEditBookDialogOpen(true);
                                      }}
                                    >
                                      <Edit className="w-4 h-4 mr-2" />
                                      Edit Book
                                    </DropdownMenuItem>

                                    <DropdownMenuItem
                                      className="text-destructive"
                                      onClick={() => {
                                        setBookToDelete(book);
                                        setBookDeleteDialogOpen(true);
                                      }}
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete Book
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>


                 {/* Reviews Tab */}
            <TabsContent value="reviews">
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <CardTitle>Ratings & Reviews</CardTitle>
                      <CardDescription>Manage all user ratings and review comments</CardDescription>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Search by user/book/comment..."
                          value={reviewSearchInput}
                          onChange={(e) => setReviewSearchInput(e.target.value)}
                          className="pl-9"
                        />
                      </div>

                      <Select value={reviewRatingFilter} onValueChange={setReviewRatingFilter}>
                        <SelectTrigger className="w-28">
                          <SelectValue placeholder="Rating" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All ratings</SelectItem>
                          <SelectItem value="5">5 stars</SelectItem>
                          <SelectItem value="4">4 stars</SelectItem>
                          <SelectItem value="3">3 stars</SelectItem>
                          <SelectItem value="2">2 stars</SelectItem>
                          <SelectItem value="1">1 star</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={reviewUserFilter} onValueChange={setReviewUserFilter}>
                        <SelectTrigger className="w-44">
                          <SelectValue placeholder="User" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All users</SelectItem>
                          {users.map((u) => (
                            <SelectItem key={u.id} value={String(u.id)}>
                              {u.username} ({u.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={reviewBookFilter} onValueChange={setReviewBookFilter}>
                        <SelectTrigger className="w-56">
                          <SelectValue placeholder="Book" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All books</SelectItem>
                          {books.map((b) => (
                            <SelectItem key={b.id} value={String(b.id)}>
                              {b.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={String(reviewPageSize)}
                        onValueChange={(value) => setReviewPageSize(Number(value) as 10 | 20 | 50)}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue placeholder="Size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        variant="outline"
                        size="icon"
                        onClick={fetchReviews}
                        title="Refresh reviews"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>

                      <Button
                        onClick={() => {
                          resetReviewForm();
                          setReviewCreateBookSearch("");
                          setCreateReviewDialogOpen(true);
                        }}
                        className="gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Review
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {reviewsLoading ? (
                    <div className="text-center py-12">
                      <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
                      <p className="text-muted-foreground">Loading reviews...</p>
                    </div>
                  ) : reviewsError ? (
                    <p className="text-destructive">{reviewsError}</p>
                  ) : reviews.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No reviews found</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Book</TableHead>
                          <TableHead>Rating</TableHead>
                          <TableHead>Comment</TableHead>
                          <TableHead>Updated / Created</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reviews.map((review) => (
                          <TableRow key={review.id}>
                            <TableCell>
                              <div className="font-medium">{review.username}</div>
                              <div className="text-xs text-muted-foreground">{review.email}</div>
                            </TableCell>
                            <TableCell className="max-w-[260px] truncate">{review.bookTitle}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {editingReviewId === review.id
                                  ? renderStars(editDraft.rating, (v) =>
                                      setEditDraft((prev) => ({ ...prev, rating: v }))
                                    )
                                  : renderStars(review.rating)}
                                <span className="text-sm text-muted-foreground">
                                  {editingReviewId === review.id ? editDraft.rating : review.rating}/5
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="max-w-[320px]">
                              {editingReviewId === review.id ? (
                                <Input
                                  value={editDraft.comment}
                                  onChange={(e) =>
                                    setEditDraft((prev) => ({ ...prev, comment: e.target.value }))
                                  }
                                  placeholder="Optional comment"
                                />
                              ) : (
                                <div className="truncate">{review.comment || "-"}</div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div>{new Date(review.updatedAt ?? review.createdAt).toLocaleString()}</div>
                                <div className="text-xs text-muted-foreground">
                                  Created: {new Date(review.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              {editingReviewId === review.id ? (
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleInlineSave(review)}
                                    disabled={reviewFormLoading}
                                  >
                                    <Check className="w-4 h-4 text-green-600" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={cancelInlineEdit}
                                    disabled={reviewFormLoading}
                                  >
                                    <X className="w-4 h-4 text-muted-foreground" />
                                  </Button>
                                </div>
                              ) : (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => startInlineEdit(review)}>
                                      <Edit className="w-4 h-4 mr-2" />
                                      Edit Review
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-destructive"
                                      onClick={() => {
                                        setReviewToDelete(review);
                                        setReviewDeleteDialogOpen(true);
                                      }}
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete Review
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}

                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {reviewTotalItems === 0
                        ? "Showing 0 of 0"
                        : `Showing ${(reviewPage - 1) * reviewPageSize + 1}-${Math.min(
                            reviewPage * reviewPageSize,
                            reviewTotalItems
                          )} of ${reviewTotalItems}`}
                    </p>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setReviewPage((p) => Math.max(1, p - 1))}
                        disabled={reviewPage <= 1 || reviewsLoading}
                      >
                        Prev
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Page {reviewPage} / {reviewTotalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setReviewPage((p) => Math.min(reviewTotalPages, p + 1))}
                        disabled={reviewPage >= reviewTotalPages || reviewsLoading}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
                          
            {/* Categories Tab (MOVED AFTER REVIEWS) */}
  <TabsContent value="categories">
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle>Categories</CardTitle>
            <CardDescription>Add, edit, or delete book categories.</CardDescription>
          </div>

          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              handleCreateCategory();
            }}
          >
            <div className="relative w-72">
              <Input
                placeholder="New category name..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              disabled={catLoading || catCreateLoading}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              {catCreateLoading ? "Adding..." : "Add"}
            </Button>


            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={loadCategories}
              disabled={catLoading || catCreateLoading}
              title="Refresh categories"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </CardHeader>

      <CardContent>
        {catLoading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading categories...</p>
          </div>
        ) : catError ? (
          <p className="text-destructive">{catError}</p>
        ) : categories.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Tag className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No categories yet</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {categories.map((cat) => {
                const isEditing = editingId === cat.id;

                return (
                  <TableRow key={cat.id}>
                    <TableCell className="font-medium">{cat.id}</TableCell>

                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="max-w-sm"
                        />
                      ) : (
                        <span className="font-medium">{cat.name}</span>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      {isEditing ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            onClick={handleUpdateCategory}
                            disabled={!editingName.trim() || catLoading}
                          >
                            Save
                          </Button>
                          <Button
                            variant="outline"
                            onClick={cancelEditCategory}
                            disabled={catLoading}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => startEditCategory(cat)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteCategory(cat.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  </TabsContent>
              
          </Tabs>
        </motion.div>
      </div>

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account. They will be able to log in with these credentials.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-username">Username</Label>
              <Input
                id="create-username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="johndoe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-email">Email</Label>
              <Input
                id="create-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-password">Password</Label>
              <Input
                id="create-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value: "user" | "admin") => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={formLoading}>
              Cancel
            </Button>
            <Button onClick={handleCreateUser} disabled={formLoading}>
              {formLoading ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information including username, email, and role.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-username">Username</Label>
              <Input
                id="edit-username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="johndoe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value: "user" | "admin") => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={formLoading}>
              Cancel
            </Button>
            <Button onClick={handleUpdateUser} disabled={formLoading}>
              {formLoading ? "Updating..." : "Update User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {userToDelete?.username}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Book Dialog */}
      <Dialog open={createBookDialogOpen} onOpenChange={setCreateBookDialogOpen}>
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle>Add New Book</DialogTitle>
            <DialogDescription>Create a new book in the catalog.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={bookForm.title} onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label>Author</Label>
              <Input value={bookForm.author} onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })} />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label>Description *</Label>
              <Input
                value={bookForm.description}
                onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Cover Image URL</Label>
              <Input
                value={bookForm.coverImageUrl}
                onChange={(e) => setBookForm({ ...bookForm, coverImageUrl: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={(bookForm.category ?? "").trim() || "__none"}
                onValueChange={(value) =>
                  setBookForm({ ...bookForm, category: value === "__none" ? "" : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">No category</SelectItem>
                  {categorySelectOptions.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>


            <div className="space-y-2">
              <Label>Rating (0â€“5)</Label>
              <Input
                type="number"
                step="0.1"
                value={bookForm.rating}
                onChange={(e) => setBookForm({ ...bookForm, rating: Number(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label>Published Year</Label>
              <Input
                type="number"
                value={bookForm.publishedYear ?? ""}
                onChange={(e) => {
                  const v = e.target.value.trim();
                  setBookForm({ ...bookForm, publishedYear: v ? Number(v) : undefined });
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>pdfUrl</Label>
              <Input
                value={bookForm.pdfUrl}
                onChange={(e) => setBookForm({ ...bookForm, pdfUrl: e.target.value })}
                placeholder="/pdfs/file.pdf"
              />
            </div>

            <div className="space-y-2">
              <Label>previewUrl (Google Books embed)</Label>
              <Input value={bookForm.previewUrl} onChange={(e) => setBookForm({ ...bookForm, previewUrl: e.target.value })} />
            </div>

            <div className="md:col-span-2 flex items-center gap-2 pt-2">
              <input
                id="isAudiobookCreate"
                type="checkbox"
                checked={bookForm.isAudiobook}
                onChange={(e) => setBookForm({ ...bookForm, isAudiobook: e.target.checked })}
              />
              <Label htmlFor="isAudiobookCreate">Is Audiobook</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateBookDialogOpen(false)} disabled={bookFormLoading}>
              Cancel
            </Button>
            <Button onClick={handleCreateBook} disabled={bookFormLoading}>
              {bookFormLoading ? "Creating..." : "Create Book"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Book Dialog */}
      <Dialog open={editBookDialogOpen} onOpenChange={setEditBookDialogOpen}>
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle>Edit Book</DialogTitle>
            <DialogDescription>Update book details.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={bookForm.title} onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label>Author</Label>
              <Input value={bookForm.author} onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })} />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label>Description *</Label>
              <Input
                value={bookForm.description}
                onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Cover Image URL</Label>
              <Input
                value={bookForm.coverImageUrl}
                onChange={(e) => setBookForm({ ...bookForm, coverImageUrl: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={(bookForm.category ?? "").trim() || "__none"}
                onValueChange={(value) =>
                  setBookForm({ ...bookForm, category: value === "__none" ? "" : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">No category</SelectItem>
                  {categorySelectOptions.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>


            <div className="space-y-2">
              <Label>Rating (0â€“5)</Label>
              <Input
                type="number"
                step="0.1"
                value={bookForm.rating}
                onChange={(e) => setBookForm({ ...bookForm, rating: Number(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label>Published Year</Label>
              <Input
                type="number"
                value={bookForm.publishedYear ?? ""}
                onChange={(e) => {
                  const v = e.target.value.trim();
                  setBookForm({ ...bookForm, publishedYear: v ? Number(v) : undefined });
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>pdfUrl</Label>
              <Input value={bookForm.pdfUrl} onChange={(e) => setBookForm({ ...bookForm, pdfUrl: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label>previewUrl</Label>
              <Input value={bookForm.previewUrl} onChange={(e) => setBookForm({ ...bookForm, previewUrl: e.target.value })} />
            </div>

            <div className="md:col-span-2 flex items-center gap-2 pt-2">
              <input
                id="isAudiobookEdit"
                type="checkbox"
                checked={bookForm.isAudiobook}
                onChange={(e) => setBookForm({ ...bookForm, isAudiobook: e.target.checked })}
              />
              <Label htmlFor="isAudiobookEdit">Is Audiobook</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditBookDialogOpen(false)} disabled={bookFormLoading}>
              Cancel
            </Button>
            <Button onClick={handleUpdateBook} disabled={bookFormLoading}>
              {bookFormLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Book Confirmation */}
      <AlertDialog open={bookDeleteDialogOpen} onOpenChange={setBookDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Book</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <b>{bookToDelete?.title}</b>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBook}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Review Dialog */}
      <Dialog open={createReviewDialogOpen} onOpenChange={setCreateReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Review</DialogTitle>
            <DialogDescription>Create a rating/review as your admin account.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Book</Label>
              <Input
                value={reviewCreateBookSearch}
                onChange={(e) => setReviewCreateBookSearch(e.target.value)}
                placeholder="Search book..."
              />
              <Select
                value={reviewForm.bookId}
                onValueChange={(value) => setReviewForm((prev) => ({ ...prev, bookId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select book" />
                </SelectTrigger>
                <SelectContent>
                  {books
                    .filter((b) => {
                      const q = reviewCreateBookSearch.trim().toLowerCase();
                      if (!q) return true;
                      return (b.title ?? "").toLowerCase().includes(q);
                    })
                    .map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.title}
                    </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Rating</Label>
              <div className="flex items-center gap-2">
                {renderStars(Number(reviewForm.rating), (v) =>
                  setReviewForm((prev) => ({ ...prev, rating: String(v) }))
                )}
                <span className="text-sm text-muted-foreground">{reviewForm.rating}/5</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Comment</Label>
              <Input
                value={reviewForm.comment}
                onChange={(e) => setReviewForm((prev) => ({ ...prev, comment: e.target.value }))}
                placeholder="Optional comment"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateReviewDialogOpen(false)} disabled={reviewFormLoading}>
              Cancel
            </Button>
            <Button onClick={handleCreateReview} disabled={reviewFormLoading}>
              {reviewFormLoading ? "Saving..." : "Create Review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Review Confirmation */}
      <AlertDialog open={reviewDeleteDialogOpen} onOpenChange={setReviewDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this review for <b>{reviewToDelete?.bookTitle}</b> by{" "}
              <b>{reviewToDelete?.username}</b>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteReview}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Admin;


