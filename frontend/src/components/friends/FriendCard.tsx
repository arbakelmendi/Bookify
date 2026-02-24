import { Book, MessageCircle, MoreHorizontal, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { FriendCard as FriendCardData } from "@/api/friends";

interface FriendCardProps {
  friend: FriendCardData;
  onViewLibrary: (friend: FriendCardData) => void;
  onRemoveFriend: (friendId: number) => void;
  removing?: boolean;
}

export const FriendCard = ({
  friend,
  onViewLibrary,
  onRemoveFriend,
  removing = false,
}: FriendCardProps) => {
  const navigate = useNavigate();
  const displayName = friend.username || friend.email;
  const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}&backgroundColor=4f46e5&fontColor=ffffff`;
  const handleHeaderActivate = () => onViewLibrary(friend);
  const handleChatClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    navigate(`/messages/${friend.id}`);
  };

  return (
    <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div
          className="flex items-center gap-3 min-w-0 rounded-md px-1 py-1 cursor-pointer transition-colors hover:bg-muted/30"
          role="button"
          tabIndex={0}
          onClick={handleHeaderActivate}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleHeaderActivate();
            }
          }}
          aria-label={`Open ${displayName}'s library`}
        >
          <div className="relative">
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-12 h-12 rounded-full object-cover ring-1 ring-border"
            />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground truncate">
              {displayName}
            </h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Book className="w-3.5 h-3.5" />
              {friend.booksCount} books
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onViewLibrary(friend)}>
              View Library
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onRemoveFriend(friend.id)}
              className="text-destructive focus:text-destructive"
              disabled={removing}
            >
              {removing ? "Removing..." : "Remove Friend"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Recently Read */}
      <div className="mb-4">
        <p className="text-xs text-muted-foreground mb-2">Recently Read</p>
        <div className="flex gap-2">
          {Array.from({ length: 3 }).map((_, index) => {
            const recent = friend.recentBooks[index];
            return recent ? (
              <img
                key={`${recent.bookId}-${index}`}
                src={recent.coverImageUrl}
                alt="Recent book cover"
                className="h-14 w-14 rounded-md object-cover border border-border"
              />
            ) : (
              <div
                key={`placeholder-${friend.id}-${index}`}
                className="h-14 w-14 rounded-md border border-dashed border-border bg-muted/40"
              />
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => onViewLibrary(friend)}
        >
          <Users className="w-4 h-4 mr-2" />
          View Library
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9"
          onClick={handleChatClick}
        >
          <MessageCircle className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

