import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Headphones } from "lucide-react";
import { Book } from "@/types/book";

interface BookCardProps {
  book: Book;
  index?: number;
}

export const BookCard = ({ book, index = 0 }: BookCardProps) => {
  const navigate = useNavigate();
  const coverSrc =
    book.coverImageUrl ||
    book.cover ||
    "https://placehold.co/200x300/png?text=Book";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="group relative w-44 cursor-pointer"
      onClick={() => navigate(`/books/${book.id}`)}
    >
      <div className="relative overflow-hidden rounded-lg shadow-lg">
        <img
          src={coverSrc}
          alt={book.title}
          className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            e.currentTarget.src =
              "https://placehold.co/200x300/png?text=Book";
          }}
        />

        {book.isAudiobook && (
          <div className="absolute top-2 right-2 bg-primary/90 text-primary-foreground p-1.5 rounded-full">
            <Headphones className="w-3 h-3" />
          </div>
        )}
      </div>

      <div className="mt-3">
        <h3 className="font-medium text-sm text-foreground line-clamp-1 group-hover:text-primary">
          {book.title}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-1">
          {book.author}
        </p>
      </div>
    </motion.div>
  );
};
