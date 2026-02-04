import { useEffect, useMemo, useState } from "react";
import { Search, UserPlus, X, Loader2 } from "lucide-react";
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
import { usersApi } from "../../api/users";
import { friendsApi } from "../../api/friends";




interface AddFriendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type UserSearchResult = {
  id: number;
  email: string;
  username: string;
  role?: string;
};

type FriendRequestDto = {
  id: number;
  senderId: number;
  receiverId: number;
  status: string;
  createdAt: string;
  respondedAt?: string | null;
};

export const AddFriendDialog = ({
  open,
  onOpenChange,
  onSuccess,
}: AddFriendDialogProps) => {
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  // map receiverUserId -> requestId (so we can cancel)
  const [pendingRequestIds, setPendingRequestIds] = useState<Record<number, number>>({});
  const [sendingForUserId, setSendingForUserId] = useState<number | null>(null);

  // reset when closing
  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setResults([]);
      setLoading(false);
      setSendingForUserId(null);
      setPendingRequestIds({});
    }
  }, [open]);

  // Search users (debounced light)
  useEffect(() => {
    if (!open) return;

    const q = searchQuery.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }

    const t = setTimeout(async () => {
      try {
        setLoading(true);
        const data = await usersApi.search(q);
        setResults(data);
      } catch (e: any) {
        toast({
          title: "Search failed",
          description: e?.response?.data?.message ?? "Could not search users.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(t);
  }, [searchQuery, open, toast]);

  const filteredResults = useMemo(() => {
    // if you want to show "suggested" when empty, keep empty list for now
    return results;
  }, [results]);

  const handleSendRequest = async (user: UserSearchResult) => {
    try {
      setSendingForUserId(user.id);
      const dto: FriendRequestDto = await friendsApi.sendRequest(user.id);

      setPendingRequestIds((prev) => ({
        ...prev,
        [user.id]: dto.id,
      }));

      toast({
        title: "Friend request sent!",
        description: `Request sent to ${user.username || user.email}.`,
      });

      onSuccess?.();
    } catch (e: any) {
      toast({
        title: "Could not send request",
        description: e?.response?.data?.message ?? "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setSendingForUserId(null);
    }
  };

  const handleCancelRequest = async (receiverUserId: number) => {
    const requestId = pendingRequestIds[receiverUserId];
    if (!requestId) return;

    try {
      setSendingForUserId(receiverUserId);
      await friendsApi.cancel(requestId);

      setPendingRequestIds((prev) => {
        const copy = { ...prev };
        delete copy[receiverUserId];
        return copy;
      });

      toast({
        title: "Request cancelled",
        description: "Friend request has been cancelled.",
      });

      onSuccess?.();
    } catch (e: any) {
      toast({
        title: "Could not cancel request",
        description: e?.response?.data?.message ?? "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setSendingForUserId(null);
    }
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
            Search for users by email or username, then send a request.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by email or username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Search Results</p>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredResults.map((user) => {
                const pending = !!pendingRequestIds[user.id];
                const busy = sendingForUserId === user.id;

                return (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border hover:bg-accent/50 transition-colors"
                  >
                    {/* Simple avatar circle with initial */}
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-medium text-foreground">
                      {(user.username?.[0] ?? user.email?.[0] ?? "U").toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {user.username}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {user.email} • ID #{user.id}
                      </p>
                    </div>

                    {pending ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancelRequest(user.id)}
                        className="gap-1"
                        disabled={busy}
                      >
                        {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                        Cancel
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleSendRequest(user)}
                        className="gap-1"
                        disabled={busy}
                      >
                        {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3 h-3" />}
                        Add
                      </Button>
                    )}
                  </div>
                );
              })}

              {!loading && searchQuery.trim().length >= 2 && filteredResults.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No users found matching "{searchQuery}"
                </p>
              )}

              {searchQuery.trim().length < 2 && (
                <p className="text-center text-muted-foreground py-4">
                  Type at least 2 characters to search.
                </p>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-border">
            <p className="text-sm text-muted-foreground text-center">
              Share your profile link to invite friends
            </p>
            <div className="flex gap-2 mt-2">
              <Input value="bookify.app/u/yourname" readOnly className="text-sm" />
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
