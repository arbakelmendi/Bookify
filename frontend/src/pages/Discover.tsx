import { useEffect, useState } from "react";
import { HeroSection } from "@/components/home/HeroSection";
import { BookSection } from "@/components/books/BookSection";
import { getBooks } from "@/api/books";
import type { Book } from "@/types/book";

const Discover = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const trending = books.filter(book => book.rating >= 4.5);
  const newReleases = books.filter(book => book.publishedYear >= 2023);
  const audiobooks = books.filter(book => book.isAudiobook);
  const recommended = books.slice(0, 6);

  return (
    <div className="min-h-screen">
      <HeroSection />
      
      <div className="container mx-auto px-4 py-8 space-y-12">
        {loading && <p className="text-muted-foreground">Loading books...</p>}
        {error && <p className="text-destructive">{error}</p>}
        {!loading && !error && (
          <>
            <BookSection title="Trending Now" books={trending.length ? trending : books} />
            <BookSection title="New Releases" books={newReleases.length ? newReleases : books} />
            <BookSection title="Audiobooks" books={audiobooks.length ? audiobooks : books} />
            <BookSection title="Recommended for You" books={recommended.length ? recommended : books} />
          </>
        )}
      </div>
    </div>
  );
};

export default Discover;
