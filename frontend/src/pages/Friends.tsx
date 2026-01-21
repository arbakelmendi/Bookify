import { useState } from "react";
import { motion } from "framer-motion";
import { Users, UserPlus, Search, Filter, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { mockFriends, mockBooks } from "@/data/mockData";
import { FriendCard } from "@/components/friends/FriendCard";
import { AddFriendDialog } from "@/components/friends/AddFriendDialog";
import { useNavigate } from "react-router-dom";

const Friends = () => {
  const navigate = useNavigate();
  const [friends] = useState(mockFriends);
  const [searchQuery, setSearchQuery] = useState("");
  const [addFriendOpen, setAddFriendOpen] = useState(false);

  // Mock friend requests
  const friendRequests = [
    {
      id: "10",
      name: "Sophie Turner",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop",
      mutualFriends: 4
    },
    {
      id: "11",
      name: "James Wilson",
      avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop",
      mutualFriends: 2
    }
  ];

  // Mock activity feed
  const activityFeed = [
    { friend: mockFriends[0], type: "finished", book: mockBooks[0], time: "2 hours ago" },
    { friend: mockFriends[1], type: "started", book: mockBooks[3], time: "5 hours ago" },
    { friend: mockFriends[2], type: "reviewed", book: mockBooks[1], time: "1 day ago", rating: 5 },
    { friend: mockFriends[3], type: "added", book: mockBooks[5], time: "2 days ago" },
    { friend: mockFriends[0], type: "finished", book: mockBooks[7], time: "3 days ago" },
  ];

  const filteredFriends = friends.filter(friend =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              See what your friends are reading and discover new books together
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2 relative">
              <Bell className="w-4 h-4" />
              Requests
              {friendRequests.length > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {friendRequests.length}
                </Badge>
              )}
            </Button>
            <Button className="gap-2" onClick={() => setAddFriendOpen(true)}>
              <UserPlus className="w-4 h-4" />
              Add Friend
            </Button>
          </div>
        </motion.div>

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
                placeholder="Search friends..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="icon">
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
            <TabsTrigger value="activity">Activity Feed</TabsTrigger>
            <TabsTrigger value="requests" className="gap-2">
              Requests
              {friendRequests.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {friendRequests.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="friends">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFriends.map((friend, index) => (
                <FriendCard key={friend.id} friend={friend} index={index} />
              ))}
            </div>

            {filteredFriends.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No friends found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? `No friends matching "${searchQuery}"` : "Start by adding some friends!"}
                </p>
                <Button onClick={() => setAddFriendOpen(true)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Friend
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="activity">
            <div className="space-y-4 max-w-2xl">
              {activityFeed.map((activity, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex gap-4 p-4 bg-card border border-border rounded-lg hover:border-primary/30 transition-colors"
                >
                  <img
                    src={activity.friend.avatar}
                    alt={activity.friend.name}
                    className="w-10 h-10 rounded-full object-cover cursor-pointer hover:opacity-80"
                    onClick={() => navigate(`/friend/${activity.friend.id}`)}
                  />
                  <div className="flex-1">
                    <p className="text-foreground">
                      <span 
                        className="font-medium hover:text-primary cursor-pointer"
                        onClick={() => navigate(`/friend/${activity.friend.id}`)}
                      >
                        {activity.friend.name}
                      </span>
                      {activity.type === "finished" && " finished reading "}
                      {activity.type === "started" && " started reading "}
                      {activity.type === "reviewed" && " reviewed "}
                      {activity.type === "added" && " added "}
                      <span 
                        className="font-medium text-primary cursor-pointer hover:underline"
                        onClick={() => navigate(`/book/${activity.book.id}`)}
                      >
                        {activity.book.title}
                      </span>
                      {activity.type === "added" && " to their shelf"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">{activity.time}</p>
                  </div>
                  <img
                    src={activity.book.cover}
                    alt={activity.book.title}
                    className="w-10 h-14 rounded object-cover cursor-pointer hover:opacity-80"
                    onClick={() => navigate(`/book/${activity.book.id}`)}
                  />
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="requests">
            <div className="space-y-4 max-w-2xl">
              {friendRequests.length > 0 ? (
                friendRequests.map((request, index) => (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-4 p-4 bg-card border border-border rounded-lg"
                  >
                    <img
                      src={request.avatar}
                      alt={request.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{request.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {request.mutualFriends} mutual friends
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm">Accept</Button>
                      <Button size="sm" variant="outline">Decline</Button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No pending requests</h3>
                  <p className="text-muted-foreground">
                    When someone sends you a friend request, it will appear here.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <AddFriendDialog open={addFriendOpen} onOpenChange={setAddFriendOpen} />
    </div>
  );
};

export default Friends;
