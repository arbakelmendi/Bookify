import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { HeroSection } from "@/components/home/HeroSection";
import { BookSection } from "@/components/books/BookSection";
<<<<<<< HEAD
import { mockBooks } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";

const Discover = () => {
  const { isAuthenticated } = useAuth();
  const trendingBooks = mockBooks.filter(book => book.rating >= 4.5);
  const newReleases = mockBooks.filter(book => book.publishedYear >= 2023);
  const audiobooks = mockBooks.filter(book => book.isAudiobook);
  const recommended = mockBooks.slice(0, 6);
=======
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
        if (active) {
          setBooks(data);
        }
      } catch (e) {
        if (active) {
          setError(e instanceof Error ? e.message : "Failed to load books.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
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

  const trending = visibleBooks.filter(book => book.rating >= 4.5);
  const newReleases = visibleBooks.filter(book => book.publishedYear >= 2023);
  const audiobooks = visibleBooks.filter(book => book.isAudiobook);
  const recommended = visibleBooks.slice(0, 6);
>>>>>>> 6c6c3fadbcb834fea22d5f9c3daa8201035d10f1

  return (
    <div className="min-h-screen">
      <HeroSection />
<<<<<<< HEAD

      {isAuthenticated && (
        <div className="container mx-auto px-4 py-8 space-y-12">
          <BookSection title="Trending Now" books={trendingBooks} />
          <BookSection title="New Releases" books={newReleases} />
          <BookSection title="Audiobooks" books={audiobooks} />
          <BookSection title="Recommended for You" books={recommended} />
        </div>
      )}
=======
      
      <div className="container mx-auto px-4 py-8 space-y-12">
        {loading && <p className="text-muted-foreground">Loading books...</p>}
        {error && <p className="text-destructive">{error}</p>}
        {!loading && !error && (
          <>
            {query && visibleBooks.length === 0 && (
              <p className="text-muted-foreground">No books found for "{query}".</p>
            )}
            <BookSection title="Trending Now" books={trending.length ? trending : visibleBooks} />
            <BookSection title="New Releases" books={newReleases.length ? newReleases : visibleBooks} />
            <BookSection title="Audiobooks" books={audiobooks.length ? audiobooks : visibleBooks} />
            <BookSection title="Recommended for You" books={recommended.length ? recommended : visibleBooks} />
          </>
        )}
      </div>
>>>>>>> 6c6c3fadbcb834fea22d5f9c3daa8201035d10f1
    </div>
  );
};

export default Discover;
