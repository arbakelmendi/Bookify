import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { HeroSection } from "@/components/home/HeroSection";
import { BookSection } from "@/components/books/BookSection";
import { getBooks } from "@/api/books";
import type { Book } from "@/types/book";
import { CategoryFilterBar } from "@/components/discover/CategoryFilterBar";

const Discover = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState("All");

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

  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    books.forEach((book) => {
      const category = (book.category ?? "").trim();
      if (category) set.add(category);
    });

    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [books]);

  useEffect(() => {
    if (selectedCategory !== "All" && !categoryOptions.includes(selectedCategory)) {
      setSelectedCategory("All");
    }
  }, [categoryOptions, selectedCategory]);

  const browseCategories = useMemo(() => ["All", ...categoryOptions], [categoryOptions]);

  const visibleBooks = useMemo(() => {
    return books.filter((book) => {
      if (!query) return true;
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
  const filteredCategorySections = useMemo(() => {
    if (selectedCategory === "All") return booksByCategory;
    return booksByCategory.filter(({ category }) => category === selectedCategory);
  }, [booksByCategory, selectedCategory]);

  const pageContainerClass = "mx-auto w-full max-w-[1280px] px-4 md:px-6";

  return (
    <div className="min-h-screen">
      <HeroSection contentClassName={pageContainerClass} />

      <div className={`${pageContainerClass} py-8 space-y-12`}>
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

            <div className="space-y-4 pt-4">
              <CategoryFilterBar
                categories={browseCategories}
                value={selectedCategory}
                onChange={setSelectedCategory}
              />

              {filteredCategorySections.length > 0 ? (
                filteredCategorySections.map(({ category, items }) => (
                  <BookSection key={category} title={category} books={items} />
                ))
              ) : (
                <p className="text-muted-foreground">No books in this category.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Discover;
