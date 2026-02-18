import React, { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users,
  BookOpen,
  BarChart3,
  Settings,
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
} from "lucide-react";

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

const activityData = [
  { name: "Mon", users: 12, books: 45 },
  { name: "Tue", users: 19, books: 52 },
  { name: "Wed", users: 15, books: 48 },
  { name: "Thu", users: 25, books: 61 },
  { name: "Fri", users: 22, books: 55 },
  { name: "Sat", users: 30, books: 70 },
  { name: "Sun", users: 28, books: 65 },
];

const categoryData = [
  { name: "Fiction", value: 35 },
  { name: "Sci-Fi", value: 20 },
  { name: "Fantasy", value: 15 },
  { name: "Self-Help", value: 18 },
  { name: "Other", value: 12 },
];

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const BOOK_CATEGORIES = [
  "Fiction",
  "Sci-Fi",
  "Fantasy",
  "Thriller",
  "Romance",
  "Self-Help",
  "Finance",
  "Biography",
  "Non-Fiction",
  "Psychology",
  "Other",
] as const;


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

      // supports both: Array<Book> OR { items: Book[] }
      const data = await apiGet<any>("/api/Books");

      const list: AdminBook[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.items)
        ? data.items
        : [];

      setBooks(list);
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

  useEffect(() => {
    fetchUsers();
    fetchBooks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        rating: Number.isFinite(bookForm.rating) ? bookForm.rating : null,
        isAudiobook: !!bookForm.isAudiobook,
        publishedYear: bookForm.publishedYear ?? null,
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
        rating: Number.isFinite(bookForm.rating) ? bookForm.rating : null,
        isAudiobook: !!bookForm.isAudiobook,
        publishedYear: bookForm.publishedYear ?? null,
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

  const stats = [
    {
      title: "Total Users",
      value: users.length,
      icon: Users,
      change: "+12%",
      changeType: "positive" as const,
    },
    {
      title: "Total Books",
      value: books.length,
      icon: BookOpen,
      change: "+5%",
      changeType: "positive" as const,
    },
    {
      title: "Active Sessions",
      value: Math.floor(users.length * 0.7),
      icon: Activity,
      change: "+8%",
      changeType: "positive" as const,
    },
    {
      title: "Library Views",
      value: "1.2k",
      icon: Library,
      change: "+15%",
      changeType: "positive" as const,
    },
  ];

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
            <Button variant="outline" className="gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </Button>
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
                          <span className="text-xs text-muted-foreground">vs last week</span>
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
            <TabsList className="grid w-full max-w-md grid-cols-3">
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
                      <AreaChart data={activityData}>
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
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {categoryData.map((_, index) => (
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
                      {categoryData.map((item, index) => (
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

                              <TableCell>{book.author || "—"}</TableCell>

                              <TableCell>
                                <Badge variant="outline">{book.category || "—"}</Badge>
                              </TableCell>

                              <TableCell>
                                {typeof book.rating === "number" ? `⭐ ${book.rating}` : "—"}
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
                placeholder="••••••••"
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
                value={bookForm.category || "Other"}
                onValueChange={(value) => setBookForm({ ...bookForm, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {BOOK_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>


            <div className="space-y-2">
              <Label>Rating (0–5)</Label>
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
                value={bookForm.category || "Other"}
                onValueChange={(value) => setBookForm({ ...bookForm, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {BOOK_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>


            <div className="space-y-2">
              <Label>Rating (0–5)</Label>
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
    </div>
  );
};

export default Admin;
