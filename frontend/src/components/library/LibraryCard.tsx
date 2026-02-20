import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MoreVertical, BookOpen, Trash2 } from "lucide-react";
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
  onRemove?: (id: string) => void;
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
  onRemove
}: LibraryCardProps) => {
  const navigate = useNavigate();
  const coverSrc = book.coverImageUrl || book.cover || "https://placehold.co/200x300/png?text=Book";
  const currentPage = Math.max(1, book.currentPage ?? 1);
  const totalPages = Math.max(0, book.totalPages ?? 0);
  const percent = Math.max(
    0,
    Math.min(100, book.percent ?? (totalPages > 0 ? (currentPage * 100) / totalPages : 0))
  );
  const isFinished =
    book.status === "finished" || (totalPages > 0 && currentPage >= totalPages);
  const isReading =
    book.status === "reading" || (currentPage > 1 && (totalPages <= 0 || currentPage < totalPages));
  const readingCtaLabel = isFinished ? "Read again" : isReading ? "Continue reading" : "Start reading";

  const handleNavigate = () => {
    navigate(`/books/${book.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="glass-card group relative rounded-xl overflow-hidden cursor-pointer h-full min-h-[240px] flex flex-col"
      onClick={handleNavigate}
    >
      <div className="flex gap-4 p-4 h-full flex-1">
        <img
          src={coverSrc}
          alt={book.title}
          className="w-20 h-28 object-cover rounded-lg shadow-md flex-shrink-0"
          onError={(e) => {
            e.currentTarget.src = "https://placehold.co/200x300/png?text=Book";
          }}
        />
        
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground line-clamp-1">
                {book.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-1">
                {book.author}
              </p>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {book.description || "No description available yet."}
              </p>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={() => onStatusChange?.(book.id, "to-read")}>
                  Mark as To Read
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange?.(book.id, "reading")}>
                  Mark as Reading
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange?.(book.id, "finished")}>
                  Mark as Finished
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onRemove?.(book.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove from Library
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="mt-2">
            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${statusColors[book.status]}`}>
              {statusLabels[book.status]}
            </span>
          </div>

          <div className="mt-3 h-[56px]">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Progress</span>
              <span>{Math.round(isReading || isFinished ? percent : 0)}%</span>
            </div>
            <Progress value={isReading || isFinished ? percent : 0} className="h-1.5" />
            <p className="mt-1 text-xs text-muted-foreground">
              {isReading || isFinished
                ? `Page ${currentPage} of ${totalPages || "?"}`
                : "Not started"}
            </p>
          </div>

          <div className="mt-auto pt-3">
            <Button
              size="sm"
              className="w-full gap-2"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/books/${book.id}/read`);
              }}
            >
              <BookOpen className="w-4 h-4" />
              {readingCtaLabel}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
