import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, Users, MessageCircle, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User } from "@/types/book";

interface FriendCardProps {
  friend: User;
  index?: number;
}

export const FriendCard = ({ friend, index = 0 }: FriendCardProps) => {
  const navigate = useNavigate();

  const handleViewProfile = () => {
    navigate(`/friend/${friend.id}`);
  };

  const handleBookClick = (bookId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/book/${bookId}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div 
          className="flex items-center gap-4 cursor-pointer group"
          onClick={handleViewProfile}
        >
          <div className="relative">
            <img
              src={friend.avatar}
              alt={friend.name}
              className="w-14 h-14 rounded-full object-cover ring-2 ring-primary/30 group-hover:ring-primary transition-all"
            />
            <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-card" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
              {friend.name}
            </h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              {friend.booksCount} books
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleViewProfile}>
              View Profile
            </DropdownMenuItem>
            <DropdownMenuItem>Send Message</DropdownMenuItem>
            <DropdownMenuItem>Share Profile</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">
              Unfollow
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Recently Read */}
      <div className="mb-4">
        <p className="text-xs text-muted-foreground mb-2">Recently Read</p>
        <div className="flex gap-2">
          {friend.recentBooks.slice(0, 3).map((book) => (
            <img
              key={book.id}
              src={book.cover}
              alt={book.title}
              className="w-12 h-16 rounded object-cover cursor-pointer hover:opacity-80 transition-opacity hover:scale-105"
              title={book.title}
              onClick={(e) => handleBookClick(book.id, e)}
            />
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1"
          onClick={handleViewProfile}
        >
          <Users className="w-4 h-4 mr-2" />
          View Library
        </Button>
        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <MessageCircle className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
};
