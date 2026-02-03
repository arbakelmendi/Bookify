import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, Headphones, Plus, Clock, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Book } from "@/types/book";

interface BookCardProps {
  book: Book;
  index?: number;
}

export const BookCard = ({ book, index = 0 }: BookCardProps) => {
  const navigate = useNavigate();
  const coverSrc = book.coverImageUrl || book.cover || "https://placehold.co/200x300/png?text=Book";

  const handleClick = () => {
    navigate(`/books/${book.id}`);
  };

  const handleAddToLibrary = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Add to library logic here
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      className="book-card group relative w-44 cursor-pointer"
      onClick={handleClick}
    >
      <div className="relative overflow-hidden rounded-lg shadow-lg">
        <img
          src={coverSrc}
          alt={book.title}
          className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            e.currentTarget.src = "https://placehold.co/200x300/png?text=Book";
          }}
        />
        
        {book.isAudiobook && (
          <div className="absolute top-2 right-2 bg-primary/90 text-primary-foreground p-1.5 rounded-full">
            <Headphones className="w-3 h-3" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <Button size="sm" className="w-full gap-1 text-xs" onClick={handleAddToLibrary}>
              <Plus className="w-3 h-3" />
              Add to Library
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-3 space-y-1">
        <h3 className="font-medium text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
          {book.title}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-1">
          {book.author}
        </p>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {book.description || "No description available yet."}
        </p>
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1 text-primary">
            <Star className="w-3 h-3 fill-current" />
            <span>{book.rating}</span>
          </div>
          {book.duration && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{book.duration}</span>
            </div>
          )}
          {!book.duration && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <BookOpen className="w-3 h-3" />
              <span>{book.pages}p</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
