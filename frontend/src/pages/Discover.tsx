import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ListFilter, X } from "lucide-react";
import { HeroSection } from "@/components/home/HeroSection";
import { BookSection } from "@/components/books/BookSection";
import { getBooks } from "@/api/books";
import type { Book } from "@/types/book";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Discover = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const data = await getBooks();
        if (active) setBooks(data);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Failed to load books.");
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  const query = (searchParams.get("q") ?? "").trim().toLowerCase();
  const categoryFilter = (searchParams.get("category") ?? "").trim().toLowerCase();

  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    books.forEach((book) => {
      const category = (book.category ?? "").trim();
      if (category) set.add(category);
    });

    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [books]);

  const applyCategoryFilter = (category: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (category && category.trim()) {
      next.set("category", category.trim());
    } else {
      next.delete("category");
    }
    setSearchParams(next, { replace: true });
  };

  const visibleBooks = useMemo(() => {
    return books.filter((book) => {
      const category = (book.category ?? "").trim().toLowerCase();
      if (categoryFilter) {
        const sciFiAndFantasy =
          categoryFilter === "sci-fi" && (category === "sci-fi" || category === "fantasy");
        if (!sciFiAndFantasy && category !== categoryFilter) return false;
      }

      if (!query) return true;
      const title = book.title.toLowerCase();
      const author = (book.author ?? "").toLowerCase();
      return title.includes(query) || author.includes(query);
    });
  }, [books, query, categoryFilter]);

  const trending = visibleBooks.filter((b) => b.rating >= 4.5);
  const newReleases = visibleBooks.filter((b) => b.publishedYear >= 2023);
  const audiobooks = visibleBooks.filter((b) => b.isAudiobook);
  const recommended = visibleBooks;
  const booksByCategory = useMemo(() => {
    const grouped = new Map<string, Book[]>();

    visibleBooks.forEach((book) => {
      const key = (book.category ?? "").trim() || "General";
      const list = grouped.get(key) ?? [];
      list.push(book);
      grouped.set(key, list);
    });

    return Array.from(grouped.entries())
      .map(([category, items]) => ({
        category,
        items,
      }))
      .sort((a, b) => a.category.localeCompare(b.category));
  }, [visibleBooks]);

  const pageContainerClass = "mx-auto w-full max-w-[1280px] px-4 md:px-6";

  return (
    <div className="min-h-screen">
      <HeroSection contentClassName={pageContainerClass} />

      <div className={`${pageContainerClass} py-8 space-y-12`}>
        {loading && <p className="text-muted-foreground">Loading books...</p>}
        {error && <p className="text-destructive">{error}</p>}

        {!loading && !error && (
          <>
            <section className="sticky top-[72px] z-20 rounded-xl border border-border/70 bg-background/90 p-3 backdrop-blur supports-[backdrop-filter]:bg-background/70">
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2 shrink-0">
                      <ListFilter className="h-4 w-4" />
                      Genres
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuItem onClick={() => applyCategoryFilter(null)}>
                      All categories
                    </DropdownMenuItem>
                    {categoryOptions.map((category) => (
                      <DropdownMenuItem key={category} onClick={() => applyCategoryFilter(category)}>
                        {category}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="flex-1 overflow-x-auto scrollbar-hide">
                  <div className="flex min-w-max items-center gap-2 pr-1">
                    <Button
                      variant={categoryFilter ? "outline" : "default"}
                      size="sm"
                      className="rounded-full"
                      onClick={() => applyCategoryFilter(null)}
                    >
                      All
                    </Button>
                    {categoryOptions.map((category) => {
                      const active = category.toLowerCase() === categoryFilter;
                      return (
                        <Button
                          key={category}
                          variant={active ? "default" : "outline"}
                          size="sm"
                          className="rounded-full"
                          onClick={() => applyCategoryFilter(category)}
                        >
                          {category}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {categoryFilter && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={() => applyCategoryFilter(null)}
                    title="Clear category filter"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </section>

            {query && visibleBooks.length === 0 && (
              <p className="text-muted-foreground">No books found for "{query}".</p>
            )}

            {/* show trending only if it exists, otherwise skip it */}
            {trending.length > 0 && <BookSection title="Trending Now" books={trending} />}

            {newReleases.length > 0 && <BookSection title="New Releases" books={newReleases} />}

            {audiobooks.length > 0 && <BookSection title="Audiobooks" books={audiobooks} />}

            <BookSection title="Recommended for You" books={recommended.length ? recommended : visibleBooks} />

            {booksByCategory.length > 0 && (
              <div className="space-y-10 pt-4">
                <h2 className="text-2xl font-display font-bold text-foreground">Browse by Category</h2>
                {booksByCategory.map(({ category, items }) => (
                  <BookSection key={category} title={category} books={items} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Discover;
