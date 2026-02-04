import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Users, UserPlus, Search, Filter, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AddFriendDialog } from "@/components/friends/AddFriendDialog";
import { friendsApi } from "@/api/friends";

type FriendUser = { id: number; email: string };

type FriendRequestViewDto = {
  id: number;

  senderId: number;
  senderEmail: string;
  senderUsername: string;

  receiverId: number;
  receiverEmail: string;
  receiverUsername: string;

  status: string;
  createdAt: string;
  respondedAt?: string | null;
};

type TabValue = "friends" | "requests" | "outgoing";

const Friends = () => {
  const [tab, setTab] = useState<TabValue>("friends");
  const [searchQuery, setSearchQuery] = useState("");
  const [addFriendOpen, setAddFriendOpen] = useState(false);

  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [incoming, setIncoming] = useState<FriendRequestViewDto[]>([]);
  const [outgoing, setOutgoing] = useState<FriendRequestViewDto[]>([]);

  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const loadAll = async () => {
    try {
      setErr(null);
      setLoading(true);

      const [f, inc, out] = await Promise.all([
        friendsApi.list(),
        friendsApi.incoming(),
        friendsApi.outgoing(),
      ]);

      setFriends(f);
      setIncoming(inc);
      setOutgoing(out);
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? "Failed to load friends data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const filteredFriends = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return friends;
    return friends.filter((f) => (f.email ?? "").toLowerCase().includes(q));
  }, [friends, searchQuery]);

  const pendingCount = incoming.length;

  const withAction = async (id: number, fn: () => Promise<any>) => {
    try {
      setErr(null);
      setActionLoadingId(id);
      await fn();
      await loadAll();
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? "Action failed.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const accept = (id: number) => withAction(id, () => friendsApi.accept(id));
  const reject = (id: number) => withAction(id, () => friendsApi.reject(id));
  const cancel = (id: number) => withAction(id, () => friendsApi.cancel(id));
  const removeFriend = (friendId: number) =>
    withAction(friendId, () => friendsApi.remove(friendId));

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">
              Friends
            </h1>
            <p className="text-muted-foreground">
              Manage friends, requests, and connect with others.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="gap-2 relative"
              onClick={() => setTab("requests")}
              disabled={loading}
            >
              <Bell className="w-4 h-4" />
              Requests
              {pendingCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {pendingCount}
                </Badge>
              )}
            </Button>

            <Button
              className="gap-2"
              onClick={() => setAddFriendOpen(true)}
              disabled={loading}
            >
              <UserPlus className="w-4 h-4" />
              Add Friend
            </Button>
          </div>
        </motion.div>

        {/* Error */}
        {err && (
          <div className="mb-6 p-3 rounded-md border border-destructive/30 bg-destructive/10 text-destructive">
            {err}
          </div>
        )}

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex gap-2 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search friends by email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                disabled={loading}
              />
            </div>
            <Button variant="outline" size="icon" onClick={() => {}} disabled>
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)} className="space-y-6">
          <TabsList>
            <TabsTrigger value="friends" className="gap-2">
              <Users className="w-4 h-4" />
              Friends ({friends.length})
            </TabsTrigger>

            <TabsTrigger value="requests" className="gap-2">
              Requests
              {pendingCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>

            <TabsTrigger value="outgoing" className="gap-2">
              Outgoing
              {outgoing.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {outgoing.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* FRIENDS */}
          <TabsContent value="friends">
            {loading ? (
              <div className="text-muted-foreground">Loading...</div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredFriends.map((f) => (
                    <div
                      key={f.id}
                      className="p-4 bg-card border border-border rounded-lg flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{f.email}</p>
                        <p className="text-sm text-muted-foreground">User #{f.id}</p>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeFriend(f.id)}
                        disabled={actionLoadingId === f.id}
                      >
                        {actionLoadingId === f.id ? "Removing..." : "Remove"}
                      </Button>
                    </div>
                  ))}
                </div>

                {filteredFriends.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      No friends found
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {searchQuery
                        ? `No friends matching "${searchQuery}"`
                        : "Start by adding some friends!"}
                    </p>
                    <Button onClick={() => setAddFriendOpen(true)}>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Friend
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* INCOMING REQUESTS */}
          <TabsContent value="requests">
            {loading ? (
              <div className="text-muted-foreground">Loading...</div>
            ) : (
              <div className="space-y-4 max-w-2xl">
                {incoming.length > 0 ? (
                  incoming.map((r, index) => (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-4 p-4 bg-card border border-border rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {r.senderUsername || r.senderEmail}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {r.senderEmail}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => accept(r.id)}
                          disabled={actionLoadingId === r.id}
                        >
                          {actionLoadingId === r.id ? "..." : "Accept"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => reject(r.id)}
                          disabled={actionLoadingId === r.id}
                        >
                          Decline
                        </Button>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      No pending requests
                    </h3>
                    <p className="text-muted-foreground">
                      When someone sends you a friend request, it will appear here.
                    </p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* OUTGOING */}
          <TabsContent value="outgoing">
            {loading ? (
              <div className="text-muted-foreground">Loading...</div>
            ) : (
              <div className="space-y-4 max-w-2xl">
                {outgoing.length > 0 ? (
                  outgoing.map((r, index) => (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-4 p-4 bg-card border border-border rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {r.receiverUsername || r.receiverEmail}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {r.receiverEmail}
                        </p>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => cancel(r.id)}
                        disabled={actionLoadingId === r.id}
                      >
                        {actionLoadingId === r.id ? "..." : "Cancel"}
                      </Button>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      No outgoing requests
                    </h3>
                    <p className="text-muted-foreground">
                      Requests you send will appear here until accepted or rejected.
                    </p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <AddFriendDialog
        open={addFriendOpen}
        onOpenChange={setAddFriendOpen}
        onSuccess={loadAll}
      />
    </div>
  );
};

export default Friends;
