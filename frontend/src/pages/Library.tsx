import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LibraryCard } from "@/components/library/LibraryCard";
import { UserBook, ReadingStatus } from "@/types/book";
import { getMyLibrary, removeFromLibrary, updateLibraryStatus } from "@/api/userBooks";
import { useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

function normalizeStatus(raw?: unknown) {
  return String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-")
    .replace(/\s+/g, "-");
}

const Library = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [books, setBooks] = useState<UserBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const searchQuery = searchParams.get("q") ?? "";
  const filter = normalizeStatus(searchParams.get("filter") || "all");
  const prevFilterRef = useRef<string>(filter);
  const firstReadingRef = useRef<HTMLDivElement | null>(null);
  const lastReadingRef = useRef<HTMLDivElement | null>(null);
  const pendingScrollRef = useRef<"first-reading" | "last-reading" | null>(null);

  const load = async (activeRef?: { current: boolean }) => {
    try {
      setError(null);
      const data = await getMyLibrary();
      if (!activeRef || activeRef.current) {
        setBooks(data);
      }
    } catch (e) {
      if (!activeRef || activeRef.current) {
        setError(e instanceof Error ? e.message : "Failed to load library.");
      }
    } finally {
      if (!activeRef || activeRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    const active = { current: true };
    load(active);
    return () => {
      active.current = false;
    };
  }, []);

  const updateParams = (patch: Record<string, string | null | undefined>) => {
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        Object.entries(patch).forEach(([key, value]) => {
          if (!value || value === "all") sp.delete(key);
          else sp.set(key, String(value));
        });
        return sp;
      },
      { replace: true }
    );
  };

  const setFilter = (next: string) => {
    const sp = new URLSearchParams(searchParams);
    if (!next || next === "all") sp.delete("filter");
    else sp.set("filter", next);
    if (next !== "reading") {
      pendingScrollRef.current = null;
    }
    setSearchParams(sp, { replace: true });
  };

  const handleReadingClick = () => {
    const prev = prevFilterRef.current;

    if (prev === "finished") pendingScrollRef.current = "last-reading";
    else if (prev === "to-read") pendingScrollRef.current = "first-reading";
    else pendingScrollRef.current = "first-reading";

    setFilter("reading");
  };

  useEffect(() => {
    prevFilterRef.current = filter;
  }, [filter]);

  const readingBooks = useMemo(() => {
    return books.filter((book) => normalizeStatus(book.status) === "reading");
  }, [books]);

  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const matchesSearch =
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter = filter === "all" ? true : normalizeStatus(book.status) === filter;

      return matchesSearch && matchesFilter;
    });
  }, [books, filter, searchQuery]);

  useEffect(() => {
    if (filter !== "reading") return;

    const intent = pendingScrollRef.current;
    if (!intent) return;

    const raf = window.requestAnimationFrame(() => {
      if (readingBooks.length === 0) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        pendingScrollRef.current = null;
        return;
      }

      const el =
        intent === "last-reading" ? lastReadingRef.current : firstReadingRef.current;

      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }

      pendingScrollRef.current = null;
    });

    return () => window.cancelAnimationFrame(raf);
  }, [filter, filteredBooks.length, readingBooks.length]);

  const handleStatusChange = async (id: string, status: ReadingStatus) => {
    const currentBook = books.find((book) => book.id === id);
    const bookTotalPages = currentBook ? Math.max(0, currentBook.totalPages ?? currentBook.pages ?? 0) : 0;
    const hasProgress = currentBook
      ? (currentBook.currentPage ?? 0) > 1 || (currentBook.pagesRead ?? 0) > 0 || (currentBook.percent ?? 0) > 0
      : false;

    const totalPagesForRequest =
      (status === "finished" || status === "reading") && bookTotalPages > 0 ? bookTotalPages : undefined;
    const currentPageForReading =
      status === "reading" && !hasProgress ? 1 : undefined;

    setBooks((prev) =>
      prev.map((book) =>
        book.id === id
          ? {
              ...book,
              status,
              currentPage:
                status === "finished"
                  ? (book.totalPages ?? 0) > 0
                    ? book.totalPages
                    : Math.max(1, book.currentPage ?? 1)
                  : status === "to-read"
                  ? 1
                  : book.status === "finished" && !hasProgress
                  ? 1
                  : Math.max(1, book.currentPage ?? 1),
              pagesRead:
                status === "finished"
                  ? (book.totalPages ?? 0) > 0
                    ? book.totalPages
                    : Math.max(1, book.pagesRead ?? book.currentPage ?? 1)
                  : status === "to-read"
                  ? 0
                  : !hasProgress
                  ? 0
                  : Math.max(0, book.pagesRead ?? 0),
              percent:
                status === "finished"
                  ? 100
                  : status === "to-read"
                  ? 0
                  : (() => {
                      const total = Math.max(0, book.totalPages ?? book.pages ?? 0);
                      if (total > 0) {
                        const basePage = !hasProgress ? 1 : Math.max(1, book.currentPage ?? 1);
                        return Math.max(1, Math.min(99, Math.round((basePage * 100) / total)));
                      }
                      return !hasProgress ? Math.max(0, book.percent ?? 0) : book.percent;
                    })(),
              progress:
                status === "finished"
                  ? 100
                  : status === "to-read"
                  ? 0
                  : book.progress,
            }
          : book
      )
    );

    try {
      const bookId = Number(id);
      await updateLibraryStatus(bookId, status, totalPagesForRequest, currentPageForReading);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update status.");
      await load();
    }
  };

  const handleRemove = async (id: string) => {
    const bookId = Number(id);
    if (Number.isNaN(bookId)) return;

    const previous = books;
    setBooks((prev) => prev.filter((book) => book.id !== id));

    try {
      await removeFromLibrary(bookId);
      toast({ title: "Removed from library" });
    } catch (e) {
      setBooks(previous);
      setError(e instanceof Error ? e.message : "Failed to remove book.");
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">My Library</h1>
          <p className="text-muted-foreground">
            {loading ? "Loading..." : `${books.length} books in your collection`}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-4 mb-8"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search your library..."
              value={searchQuery}
              onChange={(e) => updateParams({ q: e.target.value })}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              type="button"
              onClick={() => setFilter("all")}
              className="flex-shrink-0"
            >
              All Books
            </Button>
            <Button
              variant={filter === "reading" ? "default" : "outline"}
              size="sm"
              type="button"
              onClick={handleReadingClick}
              className="flex-shrink-0"
            >
              Reading
            </Button>
            <Button
              variant={filter === "to-read" ? "default" : "outline"}
              size="sm"
              type="button"
              onClick={() => setFilter("to-read")}
              className="flex-shrink-0"
            >
              To Read
            </Button>
            <Button
              variant={filter === "finished" ? "default" : "outline"}
              size="sm"
              type="button"
              onClick={() => setFilter("finished")}
              className="flex-shrink-0"
            >
              Finished
            </Button>
          </div>
        </motion.div>

        {error && <p className="text-destructive mb-4">{error}</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
          {filteredBooks.map((book, index) => {
            const isReadingView = filter === "reading";
            const isFirst = isReadingView && index === 0;
            const isLast = isReadingView && index === filteredBooks.length - 1;

            return (
              <div
                key={book.id}
                ref={isFirst ? firstReadingRef : isLast ? lastReadingRef : undefined}
              >
                <LibraryCard
                  book={book}
                  index={index}
                  onStatusChange={handleStatusChange}
                  onRemove={handleRemove}
                />
              </div>
            );
          })}
        </div>

        {filteredBooks.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
            <p className="text-muted-foreground">No books found</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Library;
