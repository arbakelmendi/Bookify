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
type FriendRequestDto = {
  id: number;
  senderId: number;
  receiverId: number;
  status: string;
  createdAt: string;
  respondedAt?: string | null;
};

const Friends = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [addFriendOpen, setAddFriendOpen] = useState(false);

  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [incoming, setIncoming] = useState<FriendRequestDto[]>([]);
  const [outgoing, setOutgoing] = useState<FriendRequestDto[]>([]);
  const [loading, setLoading] = useState(true);
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

  const accept = async (id: number) => {
    await friendsApi.accept(id);
    await loadAll();
  };

  const reject = async (id: number) => {
    await friendsApi.reject(id);
    await loadAll();
  };

  const cancel = async (id: number) => {
    await friendsApi.cancel(id);
    await loadAll();
  };

  const removeFriend = async (friendId: number) => {
    await friendsApi.remove(friendId);
    await loadAll();
  };

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
            <Button variant="outline" className="gap-2 relative" onClick={() => {}}>
              <Bell className="w-4 h-4" />
              Requests
              {pendingCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {pendingCount}
                </Badge>
              )}
            </Button>

            <Button className="gap-2" onClick={() => setAddFriendOpen(true)}>
              <UserPlus className="w-4 h-4" />
              Add Friend
            </Button>
          </div>
        </motion.div>

        {/* Error / Loading */}
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
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search friends by email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="icon" onClick={() => {}}>
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>

        <Tabs defaultValue="friends" className="space-y-6">
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

          {/* FRIENDS TAB */}
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
                      <div>
                        <p className="font-medium text-foreground">{f.email}</p>
                        <p className="text-sm text-muted-foreground">User #{f.id}</p>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeFriend(f.id)}
                      >
                        Remove
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

          {/* REQUESTS TAB (incoming) */}
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
                      <div className="flex-1">
                        <p className="font-medium text-foreground">
                          From user #{r.senderId}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Request ID: {r.id}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => accept(r.id)}>
                          Accept
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => reject(r.id)}>
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

          {/* OUTGOING TAB */}
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
                      <div className="flex-1">
                        <p className="font-medium text-foreground">
                          To user #{r.receiverId}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Request ID: {r.id}
                        </p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => cancel(r.id)}>
                        Cancel
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
        // shumë e rëndësishme: pas suksesit, rifresko
        onSuccess={loadAll as any}
      />
    </div>
  );
};

export default Friends;
