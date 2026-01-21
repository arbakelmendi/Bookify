import { useState } from "react";
import { Search, UserPlus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface AddFriendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Mock suggested users
const suggestedUsers = [
  {
    id: "5",
    name: "Alex Rivera",
    username: "@alex_reads",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
    mutualFriends: 3
  },
  {
    id: "6",
    name: "Jessica Lee",
    username: "@jess_bookworm",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop",
    mutualFriends: 5
  },
  {
    id: "7",
    name: "Chris Martinez",
    username: "@chris_pages",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop",
    mutualFriends: 2
  },
  {
    id: "8",
    name: "Taylor Swift",
    username: "@taylor_reads",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
    mutualFriends: 8
  }
];

export const AddFriendDialog = ({ open, onOpenChange }: AddFriendDialogProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingRequests, setPendingRequests] = useState<string[]>([]);
  const { toast } = useToast();

  const filteredUsers = suggestedUsers.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendRequest = (userId: string, userName: string) => {
    setPendingRequests([...pendingRequests, userId]);
    toast({
      title: "Friend request sent!",
      description: `Your friend request has been sent to ${userName}.`,
    });
  };

  const handleCancelRequest = (userId: string) => {
    setPendingRequests(pendingRequests.filter(id => id !== userId));
    toast({
      title: "Request cancelled",
      description: "Friend request has been cancelled.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Add Friends
          </DialogTitle>
          <DialogDescription>
            Search for users or see suggestions based on mutual connections.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">
              {searchQuery ? "Search Results" : "Suggested Friends"}
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border hover:bg-accent/50 transition-colors"
                >
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{user.name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {user.username} • {user.mutualFriends} mutual friends
                    </p>
                  </div>
                  {pendingRequests.includes(user.id) ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCancelRequest(user.id)}
                      className="gap-1"
                    >
                      <X className="w-3 h-3" />
                      Cancel
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleSendRequest(user.id, user.name)}
                      className="gap-1"
                    >
                      <UserPlus className="w-3 h-3" />
                      Add
                    </Button>
                  )}
                </div>
              ))}

              {filteredUsers.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No users found matching "{searchQuery}"
                </p>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-border">
            <p className="text-sm text-muted-foreground text-center">
              Share your profile link to invite friends
            </p>
            <div className="flex gap-2 mt-2">
              <Input
                value="bookify.app/u/yourname"
                readOnly
                className="text-sm"
              />
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText("bookify.app/u/yourname");
                  toast({ title: "Link copied!" });
                }}
              >
                Copy
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
