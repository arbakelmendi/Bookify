import { useEffect, useMemo, useState } from "react";
import { Search, UserPlus, X, Loader2, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { usersApi } from "../../api/users";
import { friendsApi } from "../../api/friends";

interface AddFriendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type Relationship = "NONE" | "INCOMING" | "OUTGOING" | "FRIEND";

type UserSearchResult = {
  id: number;
  email: string;
  username: string;
  relationship: Relationship;
  requestId?: number | null;
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

  // për spinner te butonat (id e userit për të cilin po bëhet veprimi)
  const [busyUserId, setBusyUserId] = useState<number | null>(null);

  // reset kur mbyllet dialogu
  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setResults([]);
      setLoading(false);
      setBusyUserId(null);
    }
  }, [open]);

  // Search users (debounce)
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
        const data: UserSearchResult[] = await usersApi.search(q);
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

  const filteredResults = useMemo(() => results, [results]);

  const refreshSearchRow = async (q: string) => {
    // rifresko listën (opsionale, por e bën UI-në menjëherë korrekt)
    if (q.trim().length < 2) return;
    const data: UserSearchResult[] = await usersApi.search(q.trim());
    setResults(data);
  };

  const handleSendRequest = async (user: UserSearchResult) => {
    try {
      setBusyUserId(user.id);
      await friendsApi.sendRequest(user.id);

      toast({
        title: "Friend request sent!",
        description: `Request sent to ${user.username || user.email}.`,
      });

      onSuccess?.();
      await refreshSearchRow(searchQuery);
    } catch (e: any) {
      toast({
        title: "Could not send request",
        description: e?.response?.data?.message ?? "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setBusyUserId(null);
    }
  };

  const handleCancelRequest = async (user: UserSearchResult) => {
    const requestId = user.requestId;
    if (!requestId) return;

    try {
      setBusyUserId(user.id);
      await friendsApi.cancel(requestId);

      toast({
        title: "Request cancelled",
        description: "Friend request has been cancelled.",
      });

      onSuccess?.();
      await refreshSearchRow(searchQuery);
    } catch (e: any) {
      toast({
        title: "Could not cancel request",
        description: e?.response?.data?.message ?? "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setBusyUserId(null);
    }
  };

  const handleAccept = async (user: UserSearchResult) => {
    const requestId = user.requestId;
    if (!requestId) return;

    try {
      setBusyUserId(user.id);
      await friendsApi.accept(requestId);

      toast({
        title: "Friend request accepted",
        description: `You are now friends with ${user.username || user.email}.`,
      });

      onSuccess?.();
      await refreshSearchRow(searchQuery);
    } catch (e: any) {
      toast({
        title: "Could not accept request",
        description: e?.response?.data?.message ?? "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setBusyUserId(null);
    }
  };

  const handleDecline = async (user: UserSearchResult) => {
    const requestId = user.requestId;
    if (!requestId) return;

    try {
      setBusyUserId(user.id);
      await friendsApi.reject(requestId);

      toast({
        title: "Request declined",
        description: "Friend request has been declined.",
      });

      onSuccess?.();
      await refreshSearchRow(searchQuery);
    } catch (e: any) {
      toast({
        title: "Could not decline request",
        description: e?.response?.data?.message ?? "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setBusyUserId(null);
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
            Search users by email or username, then add/accept requests.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
                const busy = busyUserId === user.id;

                return (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border hover:bg-accent/50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-medium text-foreground">
                      {(user.username?.[0] ?? user.email?.[0] ?? "U").toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground truncate">
                          {user.username || "—"}
                        </p>

                        {user.relationship === "FRIEND" && (
                          <Badge variant="secondary">Friends</Badge>
                        )}
                        {user.relationship === "OUTGOING" && (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                        {user.relationship === "INCOMING" && (
                          <Badge variant="secondary">Requested you</Badge>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground truncate">
                        {user.email} • ID #{user.id}
                      </p>
                    </div>

                    {/* Actions */}
                    {user.relationship === "NONE" && (
                      <Button
                        size="sm"
                        onClick={() => handleSendRequest(user)}
                        className="gap-1"
                        disabled={busy}
                      >
                        {busy ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <UserPlus className="w-3 h-3" />
                        )}
                        Add
                      </Button>
                    )}

                    {user.relationship === "OUTGOING" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancelRequest(user)}
                        className="gap-1"
                        disabled={busy}
                      >
                        {busy ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <X className="w-3 h-3" />
                        )}
                        Cancel
                      </Button>
                    )}

                    {user.relationship === "INCOMING" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAccept(user)}
                          disabled={busy}
                          className="gap-1"
                        >
                          {busy ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Check className="w-3 h-3" />
                          )}
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDecline(user)}
                          disabled={busy}
                        >
                          Decline
                        </Button>
                      </div>
                    )}

                    {user.relationship === "FRIEND" && (
                      <Button size="sm" variant="secondary" disabled>
                        Friends
                      </Button>
                    )}
                  </div>
                );
              })}

              {!loading &&
                searchQuery.trim().length >= 2 &&
                filteredResults.length === 0 && (
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
        </div>
      </DialogContent>
    </Dialog>
  );
};
