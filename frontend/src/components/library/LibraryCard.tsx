import { useState } from "react";
import { motion } from "framer-motion";
import { Star, MoreVertical } from "lucide-react";
import { UserBook, ReadingStatus } from "@/types/book";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LibraryCardProps {
  book: UserBook;
  index?: number;
  onStatusChange?: (id: string, status: ReadingStatus) => void;
  onRatingChange?: (id: string, rating: number) => void;
}

const statusColors: Record<ReadingStatus, string> = {
  "to-read": "bg-status-toread text-status-toread-foreground",
  "reading": "bg-status-reading text-status-reading-foreground",
  "finished": "bg-status-finished text-status-finished-foreground"
};

const statusLabels: Record<ReadingStatus, string> = {
  "to-read": "To Read",
  "reading": "Reading",
  "finished": "Finished"
};

export const LibraryCard = ({ 
  book, 
  index = 0, 
  onStatusChange,
  onRatingChange 
}: LibraryCardProps) => {
  const [hoveredStar, setHoveredStar] = useState(0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="glass-card group relative rounded-xl overflow-hidden"
    >
      <div className="flex gap-4 p-4">
        <img
          src={book.cover}
          alt={book.title}
          className="w-20 h-28 object-cover rounded-lg shadow-md flex-shrink-0"
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground line-clamp-1">
                {book.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-1">
                {book.author}
              </p>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onStatusChange?.(book.id, "to-read")}>
                  Mark as To Read
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange?.(book.id, "reading")}>
                  Mark as Reading
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange?.(book.id, "finished")}>
                  Mark as Finished
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="mt-2">
            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${statusColors[book.status]}`}>
              {statusLabels[book.status]}
            </span>
          </div>

          {book.status === "reading" && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Progress</span>
                <span>{book.progress}%</span>
              </div>
              <Progress value={book.progress} className="h-1.5" />
            </div>
          )}

          <div className="mt-3 flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(0)}
                onClick={() => onRatingChange?.(book.id, star)}
                className="p-0.5"
              >
                <Star
                  className={`w-4 h-4 transition-colors ${
                    star <= (hoveredStar || book.userRating || 0)
                      ? "text-primary fill-primary"
                      : "text-muted-foreground"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
