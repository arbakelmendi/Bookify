import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  BookOpen, 
  Users, 
  MessageCircle, 
  UserMinus, 
  Star,
  Calendar,
  MapPin,
  Link as LinkIcon,
  Clock,
  TrendingUp,
  Heart,
  Share2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { mockFriends, mockBooks } from "@/data/mockData";
import { BookCard } from "@/components/books/BookCard";

const FriendProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const friend = mockFriends.find(f => f.id === id);
  const [isFollowing, setIsFollowing] = useState(true);

  if (!friend) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">User not found</h1>
          <Button onClick={() => navigate("/friends")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Friends
          </Button>
        </div>
      </div>
    );
  }

  // Mock additional data for the friend
  const friendData = {
    ...friend,
    username: `@${friend.name.toLowerCase().replace(" ", "_")}`,
    bio: "Avid reader and book lover. Always looking for the next great story to dive into. Fantasy and sci-fi enthusiast! 📚✨",
    location: "New York, USA",
    website: "goodreads.com/user",
    joinedDate: "January 2023",
    following: 156,
    followers: 234,
    currentlyReading: mockBooks[2],
    readingGoal: { current: 24, target: 50 },
    favoriteGenres: ["Fantasy", "Sci-Fi", "Mystery"],
    readingStats: {
      booksThisYear: 24,
      pagesRead: 8432,
      avgRating: 4.2,
      reviewsWritten: 18
    },
    activity: [
      { type: "finished", book: mockBooks[0], date: "2 hours ago" },
      { type: "started", book: mockBooks[3], date: "1 day ago" },
      { type: "reviewed", book: mockBooks[1], date: "3 days ago", rating: 5 },
      { type: "added", book: mockBooks[5], date: "1 week ago" },
    ],
    shelf: mockBooks.slice(0, 8)
  };

  return (
    <div className="min-h-screen">
      {/* Cover Image */}
      <div className="relative h-48 md:h-64 bg-gradient-to-r from-primary/30 via-primary/20 to-primary/10">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1200&h=400&fit=crop')] bg-cover bg-center opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        
        {/* Back Button */}
        <div className="absolute top-4 left-4 z-10">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)}
            className="gap-2 bg-background/50 backdrop-blur-sm hover:bg-background/70"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>
      </div>

      {/* Profile Header */}
      <div className="container mx-auto px-4">
        <div className="relative -mt-20 mb-8">
          <div className="flex flex-col md:flex-row md:items-end gap-6">
            {/* Avatar */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative"
            >
              <img
                src={friend.avatar}
                alt={friend.name}
                className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-background shadow-xl"
              />
              <div className="absolute -bottom-2 -right-2 bg-green-500 w-6 h-6 rounded-full border-4 border-background" />
            </motion.div>

            {/* Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex-1 space-y-2"
            >
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
                  {friend.name}
                </h1>
                <Badge variant="secondary">Book Worm</Badge>
              </div>
              <p className="text-muted-foreground">{friendData.username}</p>
              <p className="text-foreground max-w-lg">{friendData.bio}</p>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pt-2">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {friendData.location}
                </span>
                <span className="flex items-center gap-1">
                  <LinkIcon className="w-4 h-4" />
                  {friendData.website}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Joined {friendData.joinedDate}
                </span>
              </div>
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex gap-3"
            >
              <Button 
                variant={isFollowing ? "outline" : "default"}
                onClick={() => setIsFollowing(!isFollowing)}
                className="gap-2"
              >
                {isFollowing ? (
                  <>
                    <UserMinus className="w-4 h-4" />
                    Unfollow
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4" />
                    Follow
                  </>
                )}
              </Button>
              <Button variant="outline" className="gap-2">
                <MessageCircle className="w-4 h-4" />
                Message
              </Button>
              <Button variant="ghost" size="icon">
                <Share2 className="w-4 h-4" />
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{friend.booksCount}</p>
            <p className="text-sm text-muted-foreground">Books Read</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{friendData.followers}</p>
            <p className="text-sm text-muted-foreground">Followers</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{friendData.following}</p>
            <p className="text-sm text-muted-foreground">Following</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{friendData.readingStats.reviewsWritten}</p>
            <p className="text-sm text-muted-foreground">Reviews</p>
          </div>
        </motion.div>

        {/* Currently Reading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card border border-border rounded-lg p-6 mb-8"
        >
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Currently Reading
          </h3>
          <div className="flex gap-4">
            <img
              src={friendData.currentlyReading.cover}
              alt={friendData.currentlyReading.title}
              className="w-20 h-28 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate(`/books/${friendData.currentlyReading.id}`)}
            />
            <div className="flex-1 space-y-2">
              <h4 
                className="font-medium text-foreground hover:text-primary cursor-pointer transition-colors"
                onClick={() => navigate(`/books/${friendData.currentlyReading.id}`)}
              >
                {friendData.currentlyReading.title}
              </h4>
              <p className="text-sm text-muted-foreground">{friendData.currentlyReading.author}</p>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="text-foreground font-medium">45%</span>
                </div>
                <Progress value={45} className="h-2" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Reading Goal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card border border-border rounded-lg p-6 mb-8"
        >
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            2024 Reading Challenge
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {friendData.readingGoal.current} of {friendData.readingGoal.target} books
              </span>
              <span className="text-foreground font-medium">
                {Math.round((friendData.readingGoal.current / friendData.readingGoal.target) * 100)}%
              </span>
            </div>
            <Progress 
              value={(friendData.readingGoal.current / friendData.readingGoal.target) * 100} 
              className="h-3" 
            />
            <p className="text-sm text-muted-foreground">
              {friendData.readingGoal.target - friendData.readingGoal.current} books behind schedule
            </p>
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue="library" className="mb-12">
          <TabsList className="mb-6">
            <TabsTrigger value="library">Library</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>

          <TabsContent value="library">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg text-foreground">
                  {friend.name}'s Library
                </h3>
                <p className="text-sm text-muted-foreground">{friend.booksCount} books</p>
              </div>
              <div className="flex flex-wrap gap-6">
                {friendData.shelf.map((book, index) => (
                  <BookCard key={book.id} book={book} index={index} />
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="activity">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-foreground">Recent Activity</h3>
              {friendData.activity.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex gap-4 p-4 bg-card border border-border rounded-lg"
                >
                  <img
                    src={item.book.cover}
                    alt={item.book.title}
                    className="w-12 h-16 rounded object-cover cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => navigate(`/books/${item.book.id}`)}
                  />
                  <div className="flex-1">
                    <p className="text-foreground">
                      {item.type === "finished" && (
                        <>
                          <span className="font-medium">{friend.name}</span> finished reading{" "}
                          <span 
                            className="font-medium text-primary cursor-pointer hover:underline"
                            onClick={() => navigate(`/books/${item.book.id}`)}
                          >
                            {item.book.title}
                          </span>
                        </>
                      )}
                      {item.type === "started" && (
                        <>
                          <span className="font-medium">{friend.name}</span> started reading{" "}
                          <span 
                            className="font-medium text-primary cursor-pointer hover:underline"
                            onClick={() => navigate(`/books/${item.book.id}`)}
                          >
                            {item.book.title}
                          </span>
                        </>
                      )}
                      {item.type === "reviewed" && (
                        <>
                          <span className="font-medium">{friend.name}</span> reviewed{" "}
                          <span 
                            className="font-medium text-primary cursor-pointer hover:underline"
                            onClick={() => navigate(`/books/${item.book.id}`)}
                          >
                            {item.book.title}
                          </span>
                          {item.rating && (
                            <span className="inline-flex items-center gap-1 ml-2">
                              <Star className="w-4 h-4 text-primary fill-current" />
                              {item.rating}
                            </span>
                          )}
                        </>
                      )}
                      {item.type === "added" && (
                        <>
                          <span className="font-medium">{friend.name}</span> added{" "}
                          <span 
                            className="font-medium text-primary cursor-pointer hover:underline"
                            onClick={() => navigate(`/books/${item.book.id}`)}
                          >
                            {item.book.title}
                          </span>{" "}
                          to their shelf
                        </>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.date}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="reviews">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-foreground">Reviews by {friend.name}</h3>
              {[mockBooks[0], mockBooks[1], mockBooks[4]].map((book, index) => (
                <motion.div
                  key={book.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 bg-card border border-border rounded-lg space-y-3"
                >
                  <div className="flex gap-4">
                    <img
                      src={book.cover}
                      alt={book.title}
                      className="w-16 h-24 rounded object-cover cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => navigate(`/books/${book.id}`)}
                    />
                    <div className="flex-1">
                      <h4 
                        className="font-medium text-foreground hover:text-primary cursor-pointer transition-colors"
                        onClick={() => navigate(`/books/${book.id}`)}
                      >
                        {book.title}
                      </h4>
                      <p className="text-sm text-muted-foreground">{book.author}</p>
                      <div className="flex items-center gap-1 mt-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} 
                            className={`w-4 h-4 ${star <= 5 - index ? 'text-primary fill-current' : 'text-muted-foreground'}`} 
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    "An incredible journey from start to finish. The author masterfully weaves together complex themes with compelling characters. Highly recommend to anyone looking for their next great read!"
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <button className="flex items-center gap-1 hover:text-foreground transition-colors">
                      <Heart className="w-4 h-4" />
                      24 likes
                    </button>
                    <span>Reviewed 2 weeks ago</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="about">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg text-foreground mb-4">Reading Stats</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between p-3 bg-card border border-border rounded-lg">
                      <span className="text-muted-foreground">Books This Year</span>
                      <span className="font-medium text-foreground">{friendData.readingStats.booksThisYear}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-card border border-border rounded-lg">
                      <span className="text-muted-foreground">Pages Read</span>
                      <span className="font-medium text-foreground">{friendData.readingStats.pagesRead.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-card border border-border rounded-lg">
                      <span className="text-muted-foreground">Average Rating</span>
                      <span className="font-medium text-foreground flex items-center gap-1">
                        <Star className="w-4 h-4 text-primary fill-current" />
                        {friendData.readingStats.avgRating}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg text-foreground mb-4">Favorite Genres</h3>
                  <div className="flex flex-wrap gap-2">
                    {friendData.favoriteGenres.map((genre) => (
                      <Badge key={genre} variant="secondary" className="text-sm">
                        {genre}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold text-lg text-foreground mb-4">Recently Read</h3>
                  <div className="flex gap-2">
                    {friend.recentBooks.map((book) => (
                      <img
                        key={book.id}
                        src={book.cover}
                        alt={book.title}
                        className="w-16 h-24 rounded object-cover cursor-pointer hover:opacity-80 transition-opacity"
                        title={book.title}
                        onClick={() => navigate(`/books/${book.id}`)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default FriendProfile;
