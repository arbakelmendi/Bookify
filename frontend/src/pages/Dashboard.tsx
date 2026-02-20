import { motion } from "framer-motion";
import {
  BookOpen,
  BookMarked,
  CheckCircle,
  Clock,
  TrendingUp,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { getMyLibrary } from "@/api/userBooks";
import type { UserBook } from "@/types/book";
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

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getCurrentPage(book: UserBook) {
  return Math.max(1, book.currentPage ?? 1);
}

function getTotalPages(book: UserBook) {
  return Math.max(0, book.totalPages ?? 0);
}

function getPercent(book: UserBook) {
  const cp = getCurrentPage(book);
  const tp = getTotalPages(book);
  const computed = tp > 0 ? Math.round((cp * 100) / tp) : 0;
  const raw = book.percent ?? computed;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

function isReading(book: UserBook) {
  const cp = getCurrentPage(book);
  const tp = getTotalPages(book);
  return book.status === "reading" || (cp > 1 && (tp <= 0 || cp < tp));
}

function isFinished(book: UserBook) {
  const cp = getCurrentPage(book);
  const tp = getTotalPages(book);
  return book.status === "finished" || (tp > 0 && cp >= tp);
}

function isToRead(book: UserBook) {
  return !isFinished(book) && !isReading(book);
}

const Dashboard = () => {
  const navigate = useNavigate();

  const [books, setBooks] = useState<UserBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getMyLibrary();
        if (active) setBooks(data);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Failed to load dashboard data.");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const metrics = useMemo(() => {
    const totalBooks = books.length;
    const readingCount = books.filter(isReading).length;
    const finishedCount = books.filter(isFinished).length;
    const toReadCount = books.filter(isToRead).length;

    return { totalBooks, readingCount, finishedCount, toReadCount };
  }, [books]);

  const currentlyReadingBooks = useMemo(() => {
    return books
      .filter(isReading)
      .sort((a, b) => {
        const aTime = Date.parse(a.lastUpdated ?? "");
        const bTime = Date.parse(b.lastUpdated ?? "");

        if (!Number.isNaN(aTime) && !Number.isNaN(bTime)) return bTime - aTime;
        if (!Number.isNaN(aTime)) return -1;
        if (!Number.isNaN(bTime)) return 1;

        return getPercent(b) - getPercent(a);
      });
  }, [books]);

  const activityData = useMemo(() => {
    const now = new Date();
    const result = Array.from({ length: 7 }, (_, idx) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (6 - idx));
      return {
        name: DAYS[d.getDay()],
        key: d.toISOString().slice(0, 10),
        updates: 0,
      };
    });

    books.forEach((book) => {
      const raw = book.lastUpdated;
      if (!raw) return;
      const d = new Date(raw);
      if (Number.isNaN(d.getTime())) return;
      const dayKey = d.toISOString().slice(0, 10);
      const bucket = result.find((x) => x.key === dayKey);
      if (bucket) bucket.updates += 1;
    });

    return result.map(({ name, updates }) => ({ name, updates }));
  }, [books]);

  const pieData = useMemo(
    () => [
      {
        name: "Reading",
        value: metrics.readingCount,
        color: "hsl(var(--status-reading))",
      },
      {
        name: "Finished",
        value: metrics.finishedCount,
        color: "hsl(var(--status-finished))",
      },
      {
        name: "To Read",
        value: metrics.toReadCount,
        color: "hsl(var(--status-toread))",
      },
    ],
    [metrics]
  );

  const stats = [
    {
      label: "Total Books",
      value: metrics.totalBooks,
      icon: BookOpen,
      color: "text-primary",
    },
    {
      label: "Currently Reading",
      value: metrics.readingCount,
      icon: BookMarked,
      color: "text-status-reading",
    },
    {
      label: "Finished",
      value: metrics.finishedCount,
      icon: CheckCircle,
      color: "text-status-finished",
    },
    {
      label: "To Read",
      value: metrics.toReadCount,
      icon: Clock,
      color: "text-status-toread",
    },
  ];

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
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
        </motion.div>

        {loading && (
          <p className="text-sm text-muted-foreground mb-6">Loading dashboard data...</p>
        )}

        {error && (
          <p className="text-sm text-destructive mb-6">{error}</p>
        )}

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
                      <linearGradient id="colorUpdates" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="updates"
                      stroke="hsl(var(--primary))"
                      fillOpacity={1}
                      fill="url(#colorUpdates)"
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
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="flex justify-center gap-6 mt-4">
                  {pieData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-muted-foreground">
                        {item.name}: {item.value}
                      </span>
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
                {currentlyReadingBooks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No books currently marked as reading.
                  </p>
                ) : (
                  currentlyReadingBooks.map((book) => {
                    const cp = getCurrentPage(book);
                    const tp = getTotalPages(book);
                    const percent = getPercent(book);

                    return (
                      <div key={book.id} className="flex items-center gap-4">
                        <img
                          src={book.coverImageUrl || book.cover || "https://placehold.co/200x300/png?text=Book"}
                          alt={book.title}
                          className="w-12 h-16 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-foreground line-clamp-1">{book.title}</h4>
                          <p className="text-sm text-muted-foreground">{book.author}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Page {cp} of {tp || "?"}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Progress value={percent} className="h-1.5 flex-1" />
                            <span className="text-xs text-muted-foreground">{percent}%</span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => navigate(`/books/${book.id}/read`)}
                        >
                          Continue reading
                        </Button>
                      </div>
                    );
                  })
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
