import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Bookmark, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { getBookById, getBooks } from "@/api/books";
import type { Book, UserBook } from "@/types/book";
import { addToLibrary, updateLibraryStatus } from "@/api/userBooks";
import { ReadingTracker } from "@/components/reading/ReadingTracker";
import { BookSection } from "@/components/books/BookSection";

const BookDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [book, setBook] = useState<Book | null>(null);
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        // ✅ fetch detail + list (with big pageSize)
        const [detail, list] = await Promise.all([
          getBookById(id),
          getBooks({ page: 1, pageSize: 50 }),
        ]);

        if (!active) return;
        setBook(detail);
        setAllBooks(list);
      } catch (e) {
        if (!active) return;
        setError(e instanceof Error ? e.message : "Failed to load book.");
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [id]);

  const handleAddToLibrary = async () => {
    if (!book) return;

    setAdding(true);
    setAddError(null);

    try {
      const bookId = Number(book.id);
      if (Number.isNaN(bookId)) throw new Error("Invalid book id.");

      await addToLibrary(bookId, "to-read" as UserBook["status"]);
      navigate("/library");
    } catch (e) {
      setAddError(e instanceof Error ? e.message : "Failed to add book to library.");
    } finally {
      setAdding(false);
    }
  };

  const handleSaveToRead = async () => {
    if (!book) return;

    setAdding(true);
    setAddError(null);

    try {
      const bookId = Number(book.id);
      if (Number.isNaN(bookId)) throw new Error("Invalid book id.");

      try {
        await addToLibrary(bookId, "to-read" as UserBook["status"]);
      } catch {
        await updateLibraryStatus(bookId, "to-read");
      }

      navigate("/library?filter=to-read");
    } catch (e) {
      setAddError(e instanceof Error ? e.message : "Failed to save book.");
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading book...</p>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Book not found</h1>
          {error && <p className="text-destructive">{error}</p>}
          <Button onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Discover
          </Button>
        </div>
      </div>
    );
  }

  const coverSrc =
    book.coverImageUrl || book.cover || "https://placehold.co/600x900/png?text=Book";

  const relatedBooks = allBooks
    .filter((b) => b.category === book.category && b.id !== book.id)
    .slice(0, 8);

  const moreFromAll = allBooks.filter((b) => b.id !== book.id).slice(0, 8);

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="grid md:grid-cols-[260px_1fr] gap-8">
          <div className="space-y-3">
            <img
              src={coverSrc}
              alt={book.title}
              className="w-full h-[360px] object-cover rounded-xl border"
              onError={(e) => {
                e.currentTarget.src = "https://placehold.co/600x900/png?text=Book";
              }}
            />
          </div>

          <div className="space-y-4">
            <Badge variant="secondary">{book.category}</Badge>

            <h1 className="text-3xl font-bold">{book.title}</h1>
            <p className="text-muted-foreground">
              by <span className="text-foreground font-medium">{book.author}</span>
            </p>

            <div className="text-sm text-muted-foreground">
              <span>Published: {book.publishedYear || book.year || "—"}</span>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2">About this book</h3>
              <p className="text-muted-foreground leading-relaxed">
                {book.description || "No description available yet."}
              </p>
            </div>

            {/* ✅ ACTION BUTTONS */}
            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                size="lg"
                className="gap-2"
                onClick={() => navigate(`/books/${book.id}/read`)}
              >
                <BookOpen className="w-5 h-5" />
                Read Book
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="gap-2"
                onClick={handleAddToLibrary}
                disabled={adding}
              >
                <Plus className="w-5 h-5" />
                {adding ? "Adding..." : "Add to Library"}
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="gap-2"
                onClick={handleSaveToRead}
                disabled={adding}
              >
                <Bookmark className="w-5 h-5" />
                {adding ? "Saving..." : "Save"}
              </Button>
            </div>

            {addError && <p className="text-destructive text-sm">{addError}</p>}

            {/* ✅ Reading Tracker */}
            <ReadingTracker bookId={Number(book.id)} />
          </div>
        </div>

        {relatedBooks.length > 0 && (
          <div className="mt-12">
            <BookSection title={`More in ${book.category}`} books={relatedBooks} />
          </div>
        )}

        {moreFromAll.length > 0 && (
          <div className="mt-12">
            <BookSection title="More books" books={moreFromAll} />
          </div>
        )}
      </div>
    </div>
  );
};

export default BookDetail;
