import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Bookmark, Gift, Plus, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { usersApi } from "@/api/users";
import { sendRecommendation } from "@/api/recommendations";
import { getBookById, getBooks } from "@/api/books";
import type { Book, UserBook } from "@/types/book";
import { addToLibrary, updateLibraryStatus } from "@/api/userBooks";
import { ReadingTracker } from "@/components/reading/ReadingTracker";
import { BookSection } from "@/components/books/BookSection";

type UserSearchItem = {
  id: number;
  username: string;
  email?: string | null;
};

const BookDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [book, setBook] = useState<Book | null>(null);
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // ✅ Gift modal state
  const [giftOpen, setGiftOpen] = useState(false);
  const [toUsername, setToUsername] = useState("");
  const [giftMessage, setGiftMessage] = useState("");
  const [giftSending, setGiftSending] = useState(false);
  const [giftStatus, setGiftStatus] = useState<string | null>(null);

  // ✅ Autocomplete state
  const [giftQuery, setGiftQuery] = useState("");
  const [giftResults, setGiftResults] = useState<UserSearchItem[]>([]);
  const [giftSearching, setGiftSearching] = useState(false);

  const inputWrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
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
      setAddError(
        e instanceof Error ? e.message : "Failed to add book to library."
      );
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

  const openGiftModal = () => {
    setGiftOpen(true);
    setGiftStatus(null);
    setGiftMessage("");
    setToUsername("");
    setGiftQuery("");
    setGiftResults([]);
  };

  const closeGiftModal = () => {
    if (giftSending) return;
    setGiftOpen(false);
    setGiftStatus(null);
    setGiftResults([]);
    setGiftSearching(false);
  };

  // ✅ ESC to close modal
  useEffect(() => {
    if (!giftOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeGiftModal();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [giftOpen, giftSending]);

  // ✅ Close autocomplete when clicking outside input area
  useEffect(() => {
    if (!giftOpen) return;

    const onDown = (e: MouseEvent) => {
      const el = inputWrapRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) setGiftResults([]);
    };

    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [giftOpen]);

  // ✅ Autocomplete search (debounced)
  useEffect(() => {
    if (!giftOpen) return;

    const q = giftQuery.trim();
    setToUsername(q);

    if (q.length < 2) {
      setGiftResults([]);
      setGiftSearching(false);
      return;
    }

    let cancelled = false;
    const t = window.setTimeout(async () => {
      try {
        setGiftSearching(true);
        const res = (await usersApi.search(q)) as UserSearchItem[];

        if (cancelled) return;

        // show up to 8 results, only those with username
        const cleaned = (res ?? [])
          .filter((u) => u?.username)
          .slice(0, 8);

        setGiftResults(cleaned);
      } catch {
        if (!cancelled) setGiftResults([]);
      } finally {
        if (!cancelled) setGiftSearching(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [giftQuery, giftOpen]);

  const handlePickUser = (u: UserSearchItem) => {
    setToUsername(u.username);
    setGiftQuery(u.username);
    setGiftResults([]);
    setGiftStatus(null);
  };

  const handleSendGift = async () => {
  if (!book) return;

  const username = toUsername.trim();
  if (!username) {
    setGiftStatus("Write a valid friend username.");
    return;
  }

  setGiftSending(true);
  setGiftStatus(null);

  try {
    await sendRecommendation({
      toUsername: username,
      bookId: Number(book.id),
      message: giftMessage.trim() ? giftMessage.trim() : null,
    });

    // ✅ clean success message
    setGiftStatus("Gift sent.");

    window.setTimeout(() => {
      closeGiftModal();
    }, 650);
  } catch (e: any) {
    // ✅ client.ts tani jep veç mesazhin clean
    setGiftStatus(e?.message ?? "Failed to send gift.");
  } finally {
    setGiftSending(false);
  }
};


  const coverSrc = useMemo(() => {
    return (
      book?.coverImageUrl ||
      book?.cover ||
      "https://placehold.co/600x900/png?text=Book"
    );
  }, [book]);

  const relatedBooks = useMemo(() => {
    if (!book) return [];
    return allBooks
      .filter((b) => b.category === book.category && b.id !== book.id)
      .slice(0, 8);
  }, [allBooks, book]);

  const moreFromAll = useMemo(() => {
    if (!book) return [];
    return allBooks.filter((b) => b.id !== book.id).slice(0, 8);
  }, [allBooks, book]);

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
                e.currentTarget.src =
                  "https://placehold.co/600x900/png?text=Book";
              }}
            />
          </div>

          <div className="space-y-4">
            <Badge variant="secondary">{book.category}</Badge>

            <h1 className="text-3xl font-bold">{book.title}</h1>
            <p className="text-muted-foreground">
              by{" "}
              <span className="text-foreground font-medium">{book.author}</span>
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

              <Button
                size="lg"
                variant="outline"
                className="gap-2"
                onClick={openGiftModal}
              >
                <Gift className="w-5 h-5" />
                Gift Book
              </Button>
            </div>

            {addError && <p className="text-destructive text-sm">{addError}</p>}

            <ReadingTracker bookId={Number(book.id)} />
          </div>
        </div>

        {relatedBooks.length > 0 && (
          <div className="mt-12">
            <BookSection
              title={`More in ${book.category}`}
              books={relatedBooks}
            />
          </div>
        )}

        {moreFromAll.length > 0 && (
          <div className="mt-12">
            <BookSection title="More books" books={moreFromAll} />
          </div>
        )}
      </div>

      {/* ✅ Gift Modal (animated) */}
      <AnimatePresence>
        {giftOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
            onClick={closeGiftModal}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-md rounded-xl border bg-background p-4 shadow-lg"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.18 }}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Gift this book</h3>
                <button
                  className="rounded-md p-2 hover:bg-muted"
                  onClick={closeGiftModal}
                  disabled={giftSending}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <p className="mt-2 text-sm text-muted-foreground">
                Send{" "}
                <span className="font-medium text-foreground">{book.title}</span>{" "}
                to a friend.
              </p>

              <div className="mt-4 space-y-3">
                {/* ✅ AUTOCOMPLETE */}
                <div className="space-y-1 relative" ref={inputWrapRef}>
                  <label className="text-sm font-medium">Friend username</label>

                  <input
                    type="text"
                    value={giftQuery}
                    onChange={(e) => setGiftQuery(e.target.value)}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    placeholder="Search friend..."
                    autoFocus
                    disabled={giftSending}
                  />

                  {giftSearching && giftQuery.trim().length >= 2 && (
                    <div className="absolute right-2 top-9 text-xs text-muted-foreground">
                      searching...
                    </div>
                  )}

                  {giftResults.length > 0 && (
                    <div className="absolute z-50 mt-1 w-full rounded-md border bg-background shadow-lg overflow-hidden">
                      {giftResults.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => handlePickUser(u)}
                          className="w-full text-left px-3 py-2 hover:bg-muted"
                        >
                          <span className="text-sm font-medium">
                            {u.username}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">Message (optional)</label>
                  <textarea
                    value={giftMessage}
                    onChange={(e) => setGiftMessage(e.target.value)}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    placeholder="Write a short message..."
                    rows={3}
                    disabled={giftSending}
                  />
                </div>

                {giftStatus && (
                  <p className="text-sm">
                    {giftStatus.toLowerCase().includes("sent") ? (
                      <span className="text-emerald-600">{giftStatus}</span>
                    ) : (
                      <span className="text-destructive">{giftStatus}</span>
                    )}
                  </p>
                )}


                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={closeGiftModal}
                    disabled={giftSending}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSendGift} disabled={giftSending}>
                    {giftSending ? "Sending..." : "Send Gift"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BookDetail;
