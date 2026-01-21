import { motion } from "framer-motion";
import { BookOpen, BookMarked, CheckCircle, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { apiGet } from "@/api/client";
import { mockUserBooks } from "@/data/mockData";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useEffect, useMemo, useState } from "react";

type ApiBook = {
  id: number;
  title: string;
  author: string | null;
  year: number | null;
};

// Ky tip është vetëm për UI-në që e ke tash (mockUserBooks)
type UiBook = {
  id: number | string;
  title: string;
  author?: string;
  year?: number;
  cover?: string;
  progress?: number;
  status?: "reading" | "finished" | "to-read";
};

const Dashboard = () => {
  const [apiBooks, setApiBooks] = useState<ApiBook[] | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // ✅ Merr librat nga backend (GET /api/books)
  useEffect(() => {
    let ignore = false;

    (async () => {
      try {
        setApiError(null);
        const data = await apiGet<ApiBook[]>("/api/books");
        if (!ignore) {
          setApiBooks(data);
        }
      } catch (err: any) {
        if (!ignore) {
          setApiError(err?.message ?? "Unknown API error");
          setApiBooks(null);
        }
      }
    })();

    return () => {
      ignore = true;
    };
  }, []);

  // ✅ Konverto API books → UI books (për me e përdor në UI)
  const booksForUi: UiBook[] = useMemo(() => {
    if (apiBooks) {
      return apiBooks.map((b) => ({
        id: b.id,
        title: b.title,
        author: b.author ?? "Unknown",
        year: b.year ?? undefined,
        // këto s’i jep API-ja ende, i vendosim default për demo
        cover: "https://placehold.co/200x300/png?text=Book",
        progress: 0,
        status: "to-read",
      }));
    }

    // fallback në mock data nëse API s’ka data ose failon
    return mockUserBooks as unknown as UiBook[];
  }, [apiBooks]);

  const totalBooks = booksForUi.length;
  const readingBooks = booksForUi.filter((b) => b.status === "reading");
  const finishedBooks = booksForUi.filter((b) => b.status === "finished");
  const toReadBooks = booksForUi.filter((b) => b.status === "to-read");

  const activityData = [
    { name: "Mon", books: 2 },
    { name: "Tue", books: 3 },
    { name: "Wed", books: 1 },
    { name: "Thu", books: 4 },
    { name: "Fri", books: 2 },
    { name: "Sat", books: 5 },
    { name: "Sun", books: 3 }
  ];

  const pieData = [
    { name: "Reading", value: readingBooks.length, color: "hsl(var(--status-reading))" },
    { name: "Finished", value: finishedBooks.length, color: "hsl(var(--status-finished))" },
    { name: "To Read", value: toReadBooks.length, color: "hsl(var(--status-toread))" }
  ];

  const stats = [
    { label: "Total Books", value: totalBooks, icon: BookOpen, color: "text-primary" },
    { label: "Currently Reading", value: readingBooks.length, icon: BookMarked, color: "text-status-reading" },
    { label: "Finished", value: finishedBooks.length, icon: CheckCircle, color: "text-status-finished" },
    { label: "To Read", value: toReadBooks.length, icon: Clock, color: "text-status-toread" }
  ];

  const isFetchError = apiError?.toLowerCase().includes("failed to fetch");

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Track your reading progress and insights
          </p>

          {/* ✅ status i thjeshtë për API */}
          <div className="mt-3 text-sm">
            {apiError && !isFetchError ? (
              <span className="text-destructive">API error: {apiError}</span>
            ) : apiBooks ? (
              <span className="text-muted-foreground">Loaded {apiBooks.length} books from API.</span>
            ) : apiError && isFetchError ? (
              <span className="text-muted-foreground">API unavailable. Using mock data.</span>
            ) : (
              <span className="text-muted-foreground">Loading books from API...</span>
            )}
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-3xl font-bold text-foreground mt-1">{stat.value}</p>
                    </div>
                    <stat.icon className={`w-8 h-8 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Reading Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={activityData}>
                    <defs>
                      <linearGradient id="colorBooks" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="books"
                      stroke="hsl(var(--primary))"
                      fillOpacity={1}
                      fill="url(#colorBooks)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Library Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-6 mt-4">
                  {pieData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm text-muted-foreground">{item.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Currently Reading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Currently Reading</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {readingBooks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No books currently marked as reading.</p>
                ) : (
                  readingBooks.map((book) => (
                    <div key={book.id} className="flex items-center gap-4">
                      <img
                        src={book.cover ?? "https://placehold.co/200x300/png?text=Book"}
                        alt={book.title}
                        className="w-12 h-16 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground line-clamp-1">{book.title}</h4>
                        <p className="text-sm text-muted-foreground">{book.author}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={book.progress ?? 0} className="h-1.5 flex-1" />
                          <span className="text-xs text-muted-foreground">{book.progress ?? 0}%</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
