import { useEffect, useMemo, useState } from "react";
import { Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getRatingSummary, getMyRating, setMyRating } from "@/api/ratings";
import {
  createReview,
  deleteMyReviewById,
  getReviewsByBook,
  type ReviewDto,
} from "@/api/reviews";

type Mode = "summary" | "public" | "modal";

const TOKEN_KEY = "bookify_auth_token";

function hasAuthToken() {
  return typeof window !== "undefined" && !!localStorage.getItem(TOKEN_KEY);
}

function getCurrentUserId(): number | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;

  try {
    const payloadBase64 = token.split(".")[1];
    if (!payloadBase64) return null;
    const payload = JSON.parse(atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/")));
    const rawId =
      payload?.nameid ??
      payload?.sub ??
      payload?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];
    const parsed = Number(rawId);
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function reviewDateLabel(review: ReviewDto) {
  return new Date(review.updatedAt ?? review.createdAt).toLocaleString();
}

function ReviewEditor({
  text,
  posting,
  error,
  onChange,
  onCancel,
  onPost,
}: {
  text: string;
  posting: boolean;
  error: string | null;
  onChange: (value: string) => void;
  onCancel?: () => void;
  onPost: () => Promise<void>;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label className="text-sm font-medium">Your review</label>
        <textarea
          value={text}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[120px] w-full rounded-md border bg-background px-3 py-2 text-sm"
          placeholder="Write your review..."
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={posting}>
            Cancel
          </Button>
        )}
        <Button onClick={() => void onPost()} disabled={posting}>
          {posting ? "Posting..." : "Post"}
        </Button>
      </div>
    </div>
  );
}

export function FeedbackPanel({
  bookId,
  mode,
  onDone,
}: {
  bookId: number;
  mode: Mode;
  onDone?: () => void;
}) {
  const [avg, setAvg] = useState(0);
  const [count, setCount] = useState(0);
  const [myRating, setMyRatingState] = useState<number | null>(null);
  const [savingRating, setSavingRating] = useState(false);

  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const canRate = hasAuthToken();

  const loadRatings = async () => {
    try {
      const summary = await getRatingSummary(bookId);
      setAvg(Number(summary?.average ?? 0));
      setCount(Number(summary?.count ?? 0));

      if (!canRate) {
        setMyRatingState(null);
        return;
      }

      const mine = await getMyRating(bookId);
      setMyRatingState(mine?.value ?? null);
    } catch {
      if (!canRate) {
        setMyRatingState(null);
      }
    }
  };

  const loadReviews = async () => {
    setLoadingReviews(true);
    try {
      const list = await getReviewsByBook(bookId);
      setReviews(
        [...(list ?? [])].sort((a, b) => {
          const aTime = new Date(a.updatedAt ?? a.createdAt).getTime();
          const bTime = new Date(b.updatedAt ?? b.createdAt).getTime();
          return bTime - aTime;
        }),
      );
    } catch {
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    if (!bookId) return;

    void loadRatings();
    if (mode === "public") {
      void loadReviews();
    }
    setCurrentUserId(getCurrentUserId());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId, mode]);

  const displayStars = useMemo(() => {
    const value = myRating ?? Math.round(avg);
    return Math.max(0, Math.min(5, Number(value) || 0));
  }, [avg, myRating]);

  const handleRate = async (value: number) => {
    if (!canRate) return;

    setSavingRating(true);
    try {
      await setMyRating(bookId, value);
      setMyRatingState(value);
      await loadRatings();
      if (mode === "public") {
        await loadReviews();
      }
    } finally {
      setSavingRating(false);
    }
  };

  const handlePostReview = async () => {
    setError(null);
    const trimmed = text.trim();

    if (!trimmed) {
      setError("Write something first.");
      return;
    }

    setPosting(true);
    try {
      await createReview(bookId, trimmed);
      setText("");
      setIsModalOpen(false);
      await Promise.all([loadReviews(), loadRatings()]);
      onDone?.();
    } catch (e: any) {
      setError(e?.message ?? "Failed to post review.");
    } finally {
      setPosting(false);
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    try {
      await deleteMyReviewById(reviewId);
      await Promise.all([loadReviews(), loadRatings()]);
    } catch {
      // ignore
    }
  };

  if (mode === "summary") {
    return (
      <div className="flex items-center gap-3 pt-2">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((value) => {
            const filled = displayStars >= value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => void handleRate(value)}
                disabled={savingRating || !canRate}
                className={`p-0.5 ${filled ? "text-foreground" : "text-muted-foreground"}`}
                title={canRate ? `Rate ${value}` : "Sign in to rate"}
              >
                <Star className={`h-4 w-4 ${filled ? "fill-foreground" : "fill-transparent"}`} />
              </button>
            );
          })}
        </div>

        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{avg.toFixed(1)}</span>{" "}
          <span>({count} ratings)</span>
        </div>
      </div>
    );
  }

  if (mode === "modal") {
    return (
      <ReviewEditor
        text={text}
        posting={posting}
        error={error}
        onChange={setText}
        onCancel={onDone}
        onPost={handlePostReview}
      />
    );
  }

  return (
    <section className="container mx-auto px-4 pb-16 max-w-6xl">
      <div className="w-full rounded-xl border bg-background p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Reader Reviews</h2>
          <Button onClick={() => setIsModalOpen(true)}>Write a Review</Button>
        </div>

        <div className="mt-6">
          {loadingReviews ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reviews yet.</p>
          ) : (
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {reviews.map((review) => (
                <div key={review.id} className="rounded-xl border bg-background p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-semibold">
                        {(review.userName?.[0] ?? "U").toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold">{review.userName}</p>
                        <p className="text-xs text-muted-foreground">{reviewDateLabel(review)}</p>
                      </div>
                    </div>

                    {currentUserId != null && review.userId === currentUserId && (
                      <button
                        onClick={() => void handleDeleteReview(review.id)}
                        className="text-muted-foreground hover:text-destructive"
                        title="Delete review"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="mt-2 flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <Star
                        key={v}
                        className={`h-4 w-4 ${Number(review.ratingValue ?? 0) >= v ? "fill-foreground" : "fill-transparent text-muted-foreground"}`}
                      />
                    ))}
                  </div>

                  <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{review.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Write a Review</DialogTitle>
            <DialogDescription>Share your thoughts about this book.</DialogDescription>
          </DialogHeader>

          <ReviewEditor
            text={text}
            posting={posting}
            error={error}
            onChange={setText}
            onCancel={() => setIsModalOpen(false)}
            onPost={handlePostReview}
          />
        </DialogContent>
      </Dialog>
    </section>
  );
}
