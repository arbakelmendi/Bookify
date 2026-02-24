import { useEffect, useMemo, useState } from "react";
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
    .replace(/\s|_/g, "-");
}

const Library = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [books, setBooks] = useState<UserBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const searchQuery = searchParams.get("q") ?? "";

  const parsedFilter = normalizeStatus(searchParams.get("filter") || "all");
  const activeFilter: ReadingStatus | "all" =
    parsedFilter === "reading" ||
    parsedFilter === "to-read" ||
    parsedFilter === "finished" ||
    parsedFilter === "all"
      ? (parsedFilter as ReadingStatus | "all")
      : "all";

  const load = async (activeRef?: { current: boolean }) => {
    try {
      setError(null);
      const data = await getMyLibrary();
      if (!activeRef || activeRef.current) {
        setBooks(data);
        console.log("LIBRARY RAW", (data ?? []).slice(0, 5));
        console.log(
          "STATUSES",
          (data ?? []).map((x) => {
            const raw = x as UserBook & { readingStatus?: string; reading_status?: string };
            return raw.status ?? raw.readingStatus ?? raw.reading_status;
          })
        );
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

  const filters: { label: string; value: ReadingStatus | "all" }[] = [
    { label: "All Books", value: "all" },
    { label: "Reading", value: "reading" },
    { label: "To Read", value: "to-read" },
    { label: "Finished", value: "finished" },
  ];

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

  useEffect(() => {
    console.log("FILTER URL", searchParams.toString(), "activeFilter", activeFilter);
  }, [searchParams, activeFilter]);

  const normalizedItems = useMemo(() => {
    return books.map((x) => {
      const raw = x as UserBook & {
        readingStatus?: string;
        reading_status?: string;
        reading_state?: string;
        total_pages?: number;
        pages?: number;
        current_page?: number;
        page?: number;
      };
      const statusRaw =
        raw.status ?? raw.readingStatus ?? raw.reading_status ?? raw.reading_state ?? "";
      const status = normalizeStatus(statusRaw);

      const totalPages = Number(raw.totalPages ?? raw.total_pages ?? raw.pages ?? 0) || 0;
      const currentPage = Number(raw.currentPage ?? raw.current_page ?? raw.page ?? 0) || 0;

      const isFinished = status === "finished" || (totalPages > 0 && currentPage >= totalPages);
      const isToRead = status === "to-read" || status === "toread" || (!isFinished && currentPage <= 1);
      const isReading = status === "reading" || (!isFinished && currentPage > 1);

      return {
        ...raw,
        _status: status,
        _isFinished: isFinished,
        _isToRead: isToRead,
        _isReading: isReading,
        _totalPages: totalPages,
        _currentPage: currentPage,
      } as UserBook & {
        _status: string;
        _isFinished: boolean;
        _isToRead: boolean;
        _isReading: boolean;
        _totalPages: number;
        _currentPage: number;
      };
    });
  }, [books]);

  const filteredItems = useMemo(() => {
    return normalizedItems.filter((book) => {
      const matchesSearch =
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter =
        activeFilter === "all"
          ? true
          : activeFilter === "finished"
          ? book._isFinished
          : activeFilter === "to-read"
          ? book._isToRead
          : book._isReading;

      return matchesSearch && matchesFilter;
    });
  }, [activeFilter, normalizedItems, searchQuery]);

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
            {filters.map((filter) => (
              <Button
                key={filter.value}
                variant={activeFilter === filter.value ? "default" : "outline"}
                size="sm"
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log("TAB CLICK", filter.value);
                  updateParams({ filter: filter.value });
                }}
                className="flex-shrink-0"
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </motion.div>

        {error && <p className="text-destructive mb-4">{error}</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
          {filteredItems.map((book, index) => (
            <LibraryCard
              key={book.id}
              book={book}
              index={index}
              onStatusChange={handleStatusChange}
              onRemove={handleRemove}
            />
          ))}
        </div>

        {filteredItems.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
            <p className="text-muted-foreground">No books found</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Library;
