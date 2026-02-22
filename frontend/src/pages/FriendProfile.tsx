import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { friendsApi, FriendLibraryBook } from "@/api/friends";

const FriendProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { email?: string; username?: string } | null;

  const friendNumericId = id ? parseInt(id, 10) : null;

  const displayName = state?.username || state?.email || `User #${id}`;
  const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}&backgroundColor=4f46e5&fontColor=ffffff`;

  const [friendLibrary, setFriendLibrary] = useState<FriendLibraryBook[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);

  useEffect(() => {
    if (!friendNumericId || isNaN(friendNumericId)) return;
    setLibraryLoading(true);
    friendsApi.getFriendLibrary(friendNumericId)
      .then(setFriendLibrary)
      .catch(() => setFriendLibrary([]))
      .finally(() => setLibraryLoading(false));
  }, [friendNumericId]);

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
    <div className="min-h-screen">
      {/* Cover banner */}
      <div className="relative h-40 md:h-52 bg-gradient-to-r from-primary/30 via-primary/20 to-primary/10">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1200&h=400&fit=crop')] bg-cover bg-center opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
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

      <div className="container mx-auto px-4">
        {/* Profile header */}
        <div className="relative -mt-16 mb-10 flex flex-col md:flex-row md:items-end gap-5">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-28 h-28 md:w-36 md:h-36 rounded-full object-cover border-4 border-background shadow-xl"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex-1 space-y-1 pb-1"
          >
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
              {displayName}
            </h1>
            {state?.email && state?.username && (
              <p className="text-muted-foreground text-sm">{state.email}</p>
            )}
          </motion.div>
        </div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg text-sm text-muted-foreground">
            <BookOpen className="w-4 h-4 text-primary" />
            {libraryLoading ? "..." : friendLibrary.length} books in library
          </div>
        </motion.div>

        {/* Library */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-16"
        >
          <h2 className="text-xl font-semibold text-foreground mb-6">
            {displayName}'s Library
          </h2>

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
