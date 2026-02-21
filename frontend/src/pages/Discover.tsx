import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { HeroSection } from "@/components/home/HeroSection";
import { BookSection } from "@/components/books/BookSection";
import { getBooks } from "@/api/books";
import type { Book } from "@/types/book";

const Discover = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();

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

  const visibleBooks = useMemo(() => {
    if (!query) return books;
    return books.filter((book) => {
      const title = book.title.toLowerCase();
      const author = (book.author ?? "").toLowerCase();
      return title.includes(query) || author.includes(query);
    });
  }, [books, query]);

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


  return (
    <div className="min-h-screen">
      <HeroSection />

      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-8 space-y-12">
        {loading && <p className="text-muted-foreground">Loading books...</p>}
        {error && <p className="text-destructive">{error}</p>}

        {!loading && !error && (
          <>
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
