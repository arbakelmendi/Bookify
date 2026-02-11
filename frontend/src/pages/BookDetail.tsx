import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Star,
  Headphones,
  Play,
  Plus,
  BookOpen,
  Clock,
  ArrowLeft,
  Calendar,
  Tag,
  Heart,
  Share2,
  Bookmark
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getBookById, getBooks } from "@/api/books";
import { BookSection } from "@/components/books/BookSection";
import type { Book, UserBook } from "@/types/book";
import { addToLibrary } from "@/api/userBooks";

const BookDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [book, setBook] = useState<Book | null>(null);
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // add-to-library state
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;

    const load = async () => {
      try {
        setError(null);
        const [detail, list] = await Promise.all([getBookById(id), getBooks()]);
        if (active) {
          setBook(detail);
          setAllBooks(list);
        }
      } catch (e) {
        if (active) {
          setError(e instanceof Error ? e.message : "Failed to load book.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [id]);

  // ✅ Add to Library (persist in DB via POST /api/UserBooks)
  const handleAddToLibrary = async () => {
    if (!book) return;

    setAdding(true);
    setAddError(null);

    try {
      // book.id te types/book është string -> konverto në number
      const bookId = Number(book.id);
      if (Number.isNaN(bookId)) {
        throw new Error("Invalid book id.");
      }

      // default status: "to-read"
      await addToLibrary(bookId, "to-read" as UserBook["status"]);

      // pas suksesit: shko te My Library (opsionale)
      navigate("/library");
    } catch (e) {
      setAddError(e instanceof Error ? e.message : "Failed to add book to library.");
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

  const relatedBooks = allBooks
    .filter((b) => b.category === book.category && b.id !== book.id)
    .slice(0, 6);

  const moreFromAuthor = allBooks.filter((b) => b.id !== book.id).slice(0, 4);

  const coverSrc =
    book.coverImageUrl || book.cover || "https://placehold.co/600x900/png?text=Book";

  return (
    <div className="min-h-screen">
      <section className="relative min-h-[60vh] flex items-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${coverSrc})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/30" />
        </div>

        <div className="absolute top-4 left-4 z-20">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="gap-2 bg-background/50 backdrop-blur-sm hover:bg-background/70"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>

        <div className="container mx-auto px-4 relative z-10 pt-16">
          <div className="grid md:grid-cols-[300px_1fr] gap-12 items-start">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="flex justify-center md:justify-start"
            >
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-primary/5 rounded-2xl blur-2xl" />
                <img
                  src={coverSrc}
                  alt={book.title}
                  className="relative w-64 h-80 md:w-72 md:h-96 object-cover rounded-xl shadow-2xl"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://placehold.co/600x900/png?text=Book";
                  }}
                />
                {book.isAudiobook && (
                  <div className="absolute -bottom-4 -right-4 bg-primary text-primary-foreground p-4 rounded-full shadow-lg">
                    <Headphones className="w-6 h-6" />
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-6"
            >
              <div className="space-y-3">
                <Badge variant="secondary" className="gap-1">
                  <Tag className="w-3 h-3" />
                  {book.category}
                </Badge>

                <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground leading-tight">
                  {book.title}
                </h1>

                <p className="text-lg text-muted-foreground">
                  by <span className="text-foreground font-medium">{book.author}</span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${
                          star <= Math.round(book.rating)
                            ? "text-primary fill-current"
                            : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-semibold text-foreground">{book.rating}</span>
                  <span className="text-muted-foreground">(2,847 reviews)</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  <span>{book.pages} pages</span>
                </div>
                {book.duration && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    <span>{book.duration}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  <span>Published {book.publishedYear}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">About this book</h3>
                <p className="text-muted-foreground leading-relaxed max-w-2xl">
                  {book.description || "No description available yet."}
                </p>
              </div>

              {/* ✅ Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-2">
                <Button
                  size="lg"
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
                  onClick={() => navigate(`/books/${book.id}/audio`)}
                >
                  <Play className="w-5 h-5" />
                  Listen Now
                </Button>

                <Button size="lg" variant="outline" className="gap-2">
                  <Bookmark className="w-5 h-5" />
                  Save
                </Button>
              </div>

              {addError && <p className="text-destructive text-sm">{addError}</p>}

              <div className="flex items-center gap-4 pt-2">
                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                  <Heart className="w-4 h-4" />
                  Add to Wishlist
                </Button>
                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <h3 className="font-semibold text-lg text-foreground">Book Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Publisher</span>
                <span className="text-foreground">Penguin Books</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Language</span>
                <span className="text-foreground">English</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">ISBN</span>
                <span className="text-foreground">978-0-14-028329-7</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Format</span>
                <span className="text-foreground">{book.isAudiobook ? "eBook, Audiobook" : "eBook"}</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <h3 className="font-semibold text-lg text-foreground">Reading Stats</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Currently Reading</span>
                <span className="text-foreground">1,234 readers</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Have Read</span>
                <span className="text-foreground">45,678 readers</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Want to Read</span>
                <span className="text-foreground">12,345 readers</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Avg. Reading Time</span>
                <span className="text-foreground">~6 hours</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <h3 className="font-semibold text-lg text-foreground">Genres & Tags</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{book.category}</Badge>
              <Badge variant="outline">Bestseller</Badge>
              <Badge variant="outline">Award Winner</Badge>
              <Badge variant="outline">Book Club Pick</Badge>
              <Badge variant="outline">Popular</Badge>
              <Badge variant="outline">Must Read</Badge>
            </div>
          </motion.div>
        </div>
      </section>

      {relatedBooks.length > 0 && (
        <section className="container mx-auto px-4 py-12">
          <BookSection title={`More in ${book.category}`} books={relatedBooks} />
        </section>
      )}

      <section className="container mx-auto px-4 py-12">
        <BookSection title="You Might Also Like" books={moreFromAuthor} />
      </section>
    </div>
  );
};

export default BookDetail;
