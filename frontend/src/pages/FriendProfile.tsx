import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Edit3, MessageCircle, Share2, Star, UserMinus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { friendsApi, FriendLibraryBook, FriendMini, FriendReview } from "@/api/friends";
import { useAuth } from "@/contexts/AuthContext";
import { getUserById, updateMyBio } from "@/api/users";
import type { User } from "@/types/auth";

const FriendProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user, refreshMe } = useAuth();
  const state = location.state as { email?: string; username?: string } | null;

  const friendNumericId = id ? parseInt(id, 10) : null;
  const isMe = !!user && user.id === friendNumericId;

  const displayName = state?.username || state?.email || `User #${id}`;
  const handleText = state?.username || state?.email || `User #${id}`;
  const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}&backgroundColor=4f46e5&fontColor=ffffff`;

  const [friendLibrary, setFriendLibrary] = useState<FriendLibraryBook[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [stats, setStats] = useState({ friends: 0, reviews: 0 });
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [friendsDialogOpen, setFriendsDialogOpen] = useState(false);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [friendsError, setFriendsError] = useState<string | null>(null);
  const [friendsList, setFriendsList] = useState<FriendMini[]>([]);

  const [reviewsDialogOpen, setReviewsDialogOpen] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [reviewsList, setReviewsList] = useState<FriendReview[]>([]);

  const [editBioOpen, setEditBioOpen] = useState(false);
  const [bioDraft, setBioDraft] = useState("");
  const [savingBio, setSavingBio] = useState(false);
  const [profileUser, setProfileUser] = useState<User | null>(null);

  const librarySectionRef = useRef<HTMLDivElement | null>(null);

  const bioText = (isMe ? user?.bio : profileUser?.bio) ?? "";

  useEffect(() => {
    if (!friendNumericId || isNaN(friendNumericId)) return;
    setLibraryLoading(true);
    friendsApi
      .getFriendLibrary(friendNumericId)
      .then(setFriendLibrary)
      .catch(() => setFriendLibrary([]))
      .finally(() => setLibraryLoading(false));
  }, [friendNumericId]);

  useEffect(() => {
    if (!friendNumericId || isNaN(friendNumericId)) return;
    setStatsError(false);
    setStatsLoading(true);
    friendsApi
      .getFriendStats(friendNumericId)
      .then(setStats)
      .catch((error) => {
        console.error("Failed to load friend stats", error);
        setStatsError(true);
        setStats({ friends: 0, reviews: 0 });
      })
      .finally(() => setStatsLoading(false));
  }, [friendNumericId]);

  useEffect(() => {
    if (!editBioOpen) return;
    setBioDraft(user?.bio ?? "");
  }, [editBioOpen, user?.bio]);

  useEffect(() => {
    if (!friendNumericId || isNaN(friendNumericId)) return;

    if (isMe) {
      setProfileUser(null);
      return;
    }

    getUserById(friendNumericId)
      .then(setProfileUser)
      .catch(() => setProfileUser(null));
  }, [friendNumericId, isMe]);

  const booksRead = friendLibrary.filter((book) => book.status === "Finished").length || friendLibrary.length;
  const currentlyReadingBooks = friendLibrary.filter((book) => {
    const isReading = String(book.status || "").toLowerCase() === "reading";
    if (!isReading) return false;

    const hasProgressData =
      typeof book.percent === "number" ||
      typeof book.pagesRead === "number" ||
      typeof book.totalPages === "number";

    if (!hasProgressData) return true;

    const percentFromPages =
      typeof book.pagesRead === "number" &&
      typeof book.totalPages === "number" &&
      book.totalPages > 0
        ? Math.round((book.pagesRead / book.totalPages) * 100)
        : 0;

    const rawPercent =
      typeof book.percent === "number" ? Math.round(book.percent) : percentFromPages;

    const clampedPercent = Math.max(0, Math.min(100, rawPercent));

    return clampedPercent > 0 || (book.pagesRead ?? 0) > 0;
  });

  const getReadingProgress = (book: FriendLibraryBook) => {
    const percentFromPages =
      typeof book.pagesRead === "number" &&
      typeof book.totalPages === "number" &&
      book.totalPages > 0
        ? Math.round((book.pagesRead / book.totalPages) * 100)
        : 0;

    const rawPercent =
      typeof book.percent === "number" ? Math.round(book.percent) : percentFromPages;

    return Math.max(0, Math.min(100, rawPercent));
  };

  const handleRemoveFriend = async () => {
    if (!friendNumericId || removing || isMe) return;

    try {
      setActionError(null);
      setRemoving(true);
      await friendsApi.remove(friendNumericId);
      navigate("/friends");
    } catch (e: unknown) {
      const message =
        typeof e === "object" &&
        e !== null &&
        "response" in e &&
        typeof (e as { response?: { data?: { message?: string } } }).response?.data?.message === "string"
          ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
          : "Failed to remove friend.";
      setActionError(message);
    } finally {
      setRemoving(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title: `${displayName} on Bookify`, url });
        return;
      } catch {
        // fall back to copy
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied", description: "Profile link copied to clipboard." });
    } catch {
      toast({ title: "Share unavailable", description: "Could not copy profile link.", variant: "destructive" });
    }
  };

  const openFriendsDialog = async () => {
    if (!friendNumericId || isNaN(friendNumericId)) return;

    setFriendsDialogOpen(true);
    setFriendsLoading(true);
    setFriendsError(null);

    try {
      const data = await friendsApi.getFriendFriends(friendNumericId);
      setFriendsList(data);
    } catch {
      setFriendsError("Failed to load friends list.");
      setFriendsList([]);
    } finally {
      setFriendsLoading(false);
    }
  };

  const openReviewsDialog = async () => {
    if (!friendNumericId || isNaN(friendNumericId)) return;

    setReviewsDialogOpen(true);
    setReviewsLoading(true);
    setReviewsError(null);

    try {
      const data = await friendsApi.getFriendReviews(friendNumericId);
      setReviewsList(data);
    } catch {
      setReviewsError("Failed to load reviews.");
      setReviewsList([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleSaveBio = async () => {
    if (!isMe || savingBio) return;

    try {
      setSavingBio(true);
      await updateMyBio(bioDraft);
      await refreshMe();
      setEditBioOpen(false);
      toast({ title: "Bio updated" });
    } catch {
      toast({ title: "Update failed", description: "Could not update bio.", variant: "destructive" });
    } finally {
      setSavingBio(false);
    }
  };

  const formatReviewDate = (review: FriendReview) => {
    const source = review.updatedAt ?? review.createdAt;
    return new Date(source).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (!friendNumericId || isNaN(friendNumericId)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">User not found</h1>
          <Button onClick={() => navigate("/friends")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Friends
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Dialog open={friendsDialogOpen} onOpenChange={setFriendsDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{displayName}'s Friends</DialogTitle>
            <DialogDescription>Browse accepted friends and open their profiles.</DialogDescription>
          </DialogHeader>

          {friendsLoading && <p className="text-sm text-muted-foreground">Loading friends...</p>}
          {friendsError && <p className="text-sm text-destructive">{friendsError}</p>}
          {!friendsLoading && !friendsError && friendsList.length === 0 && (
            <p className="text-sm text-muted-foreground">No friends yet.</p>
          )}

          {!friendsLoading && !friendsError && friendsList.length > 0 && (
            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {friendsList.map((friend) => {
                const friendName = friend.username || friend.email;
                const friendAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(friendName)}&backgroundColor=4f46e5&fontColor=ffffff`;

                return (
                  <button
                    key={friend.id}
                    type="button"
                    onClick={() => {
                      setFriendsDialogOpen(false);
                      navigate(`/friend/${friend.id}`, {
                        state: { email: friend.email, username: friend.username },
                      });
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-md border border-border text-left hover:bg-muted/40 transition-colors"
                  >
                    <img src={friendAvatar} alt={friendName} className="w-10 h-10 rounded-full" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{friendName}</p>
                      <p className="text-xs text-muted-foreground">{friend.email}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={reviewsDialogOpen} onOpenChange={setReviewsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{displayName}'s Reviews</DialogTitle>
            <DialogDescription>Latest reviews sorted by last update.</DialogDescription>
          </DialogHeader>

          {reviewsLoading && <p className="text-sm text-muted-foreground">Loading reviews...</p>}
          {reviewsError && <p className="text-sm text-destructive">{reviewsError}</p>}
          {!reviewsLoading && !reviewsError && reviewsList.length === 0 && (
            <p className="text-sm text-muted-foreground">No reviews yet.</p>
          )}

          {!reviewsLoading && !reviewsError && reviewsList.length > 0 && (
            <div className="max-h-96 overflow-y-auto space-y-3 pr-1">
              {reviewsList.map((review) => (
                <button
                  key={review.id}
                  type="button"
                  onClick={() => {
                    setReviewsDialogOpen(false);
                    navigate(`/books/${review.bookId}`);
                  }}
                  className="w-full p-3 rounded-md border border-border text-left hover:bg-muted/40 transition-colors"
                >
                  <div className="flex gap-3">
                    <img
                      src={review.coverImageUrl}
                      alt={review.bookTitle}
                      className="w-14 h-20 object-cover rounded-md border border-border"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-foreground truncate">{review.bookTitle}</p>
                        <span className="text-xs text-muted-foreground">{formatReviewDate(review)}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-amber-500">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span className="text-xs font-medium">{review.rating}/5</span>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground line-clamp-3">{review.text}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={editBioOpen} onOpenChange={setEditBioOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Bio</DialogTitle>
            <DialogDescription>Tell others a bit about your reading interests.</DialogDescription>
          </DialogHeader>
          <Textarea
            value={bioDraft}
            onChange={(e) => setBioDraft(e.target.value)}
            placeholder="Write your bio..."
            className="min-h-[120px]"
            maxLength={500}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditBioOpen(false)} disabled={savingBio}>
              Cancel
            </Button>
            <Button onClick={handleSaveBio} disabled={savingBio}>
              {savingBio ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cover banner */}
      <div className="relative h-52 md:h-64 lg:h-72 bg-gradient-to-r from-primary/30 via-primary/20 to-primary/10">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1600&h=600&fit=crop')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/70 to-transparent" />
        <div className="absolute top-4 left-4 z-10">
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
      </div>

      <div className="container mx-auto px-4 pb-16">
        {/* Profile header */}
        <div className="relative -mt-16 md:-mt-20 mb-8 flex flex-col lg:flex-row lg:items-end gap-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative shrink-0"
          >
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-28 h-28 md:w-32 md:h-32 rounded-full object-cover border-4 border-white shadow-xl"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex-1 space-y-2"
          >
            <h1 className="text-3xl font-bold text-foreground">{displayName}</h1>
            <p className="text-muted-foreground text-sm">{handleText}</p>
            {bioText.trim() ? (
              <p className="text-sm text-muted-foreground">{bioText}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">No bio yet.</p>
            )}
            {isMe && (
              <>
                <Button variant="outline" size="sm" className="gap-2" onClick={() => setEditBioOpen(true)}>
                  <Edit3 className="w-4 h-4" />
                  Edit bio
                </Button>
              </>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex items-center gap-2"
          >
            {!isMe && (
              <>
                <Button variant="outline" onClick={handleRemoveFriend} disabled={removing} className="gap-2">
                  <UserMinus className="w-4 h-4" />
                  {removing ? "Removing..." : "Remove"}
                </Button>
                <Button onClick={() => navigate(`/messages/${friendNumericId}`)} className="gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Message
                </Button>
              </>
            )}
            <Button variant="outline" size="icon" onClick={handleShare}>
              <Share2 className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>

        {actionError && (
          <div className="mb-6 p-3 rounded-md border border-destructive/30 bg-destructive/10 text-destructive">
            {actionError}
          </div>
        )}

        {/* Stats cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-10 grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-foreground">{libraryLoading ? "..." : String(booksRead)}</p>
              <p className="text-sm text-muted-foreground">Books Read</p>
            </CardContent>
          </Card>

          <Card>
            <button
              type="button"
              onClick={() => librarySectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className="w-full p-4 text-left"
            >
              <p className="text-2xl font-bold text-foreground">{libraryLoading ? "..." : String(friendLibrary.length)}</p>
              <p className="text-sm text-muted-foreground">Books in Library</p>
            </button>
          </Card>

          <Card>
            <button type="button" onClick={openFriendsDialog} className="w-full p-4 text-left">
              <div className="flex items-center justify-between gap-2">
                <p className="text-2xl font-bold text-foreground">
                  {statsLoading ? "..." : statsError ? "-" : String(stats.friends)}
                </p>
                <Users className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">Friends</p>
            </button>
          </Card>

          <Card>
            <button type="button" onClick={openReviewsDialog} className="w-full p-4 text-left">
              <div className="flex items-center justify-between gap-2">
                <p className="text-2xl font-bold text-foreground">
                  {statsLoading ? "..." : statsError ? "-" : String(stats.reviews)}
                </p>
                <Star className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">Reviews</p>
            </button>
          </Card>
        </motion.div>

        {/* Currently reading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-10"
        >
          <h2 className="text-xl font-semibold text-foreground mb-4">Currently Reading</h2>
          {currentlyReadingBooks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No books currently being read.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentlyReadingBooks.map((book) => {
                const currentProgress = getReadingProgress(book);
                return (
                  <Card key={book.bookId}>
                    <CardContent className="p-5 flex gap-4">
                      <img
                        src={book.coverImageUrl}
                        alt={book.title}
                        className="w-20 h-28 object-cover rounded-md border border-border"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground">{book.title}</p>
                        <p className="text-sm text-muted-foreground mb-4">{book.author ?? "Unknown Author"}</p>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Progress</span>
                            <span>{currentProgress}%</span>
                          </div>
                          <Progress value={currentProgress} className="h-2" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Library */}
        <motion.div
          ref={librarySectionRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-16"
        >
          <h2 className="text-xl font-semibold text-foreground mb-6">{displayName}'s Library</h2>

          {libraryLoading ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="animate-pulse space-y-2">
                  <div className="bg-muted rounded-lg aspect-[2/3]" />
                  <div className="bg-muted h-3 rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : friendLibrary.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>{displayName} hasn't added any books yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
              {friendLibrary.map((book, i) => (
                <motion.div
                  key={book.bookId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="group cursor-pointer"
                  onClick={() => navigate(`/books/${book.bookId}`)}
                >
                  <img
                    src={book.coverImageUrl}
                    alt={book.title}
                    className="w-full aspect-[2/3] object-cover rounded-lg shadow-md group-hover:opacity-80 group-hover:scale-[1.02] transition-all duration-200"
                  />
                  <p className="mt-1.5 text-xs font-medium text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                    {book.title}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default FriendProfile;
