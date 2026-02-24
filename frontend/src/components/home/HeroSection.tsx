import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, Headphones, Plus, BookOpen, Clock, Users, TrendingUp, BookMarked } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mockBooks } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { getBooks } from "@/api/books";
import type { Book } from "@/types/book";

interface HeroSectionProps {
  contentClassName?: string;
}

export const HeroSection = ({ contentClassName = "mx-auto w-full max-w-[1280px] px-4 md:px-6" }: HeroSectionProps) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [featuredBooks, setFeaturedBooks] = useState<Book[]>([]);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const featuredBook = useMemo(() => {
    if (isAuthenticated && featuredBooks.length > 0) {
      return featuredBooks[featuredIndex % featuredBooks.length];
    }
    return mockBooks[0];
  }, [isAuthenticated, featuredBooks, featuredIndex]);
  const coverSrc = featuredBook.coverImageUrl || featuredBook.cover || "https://placehold.co/600x900/png?text=Book";

  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;

    (async () => {
      try {
        const books = await getBooks({ page: 1, pageSize: 50, sortBy: "id", sortDir: "desc" });
        if (!active) return;
        setFeaturedBooks(books.filter((b) => b?.id && b?.title));
      } catch {
        if (!active) return;
        setFeaturedBooks([]);
      }
    })();

    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || featuredBooks.length <= 1) return;
    const timer = window.setInterval(() => {
      setFeaturedIndex((prev) => (prev + 1) % featuredBooks.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [isAuthenticated, featuredBooks.length]);

  const handleBookClick = () => {
    navigate(`/books/${featuredBook.id}`);
  };

  // Landing page for non-authenticated users
  if (!isAuthenticated) {
    return (
      <section className="relative min-h-[80vh] flex items-center overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />

        {/* Content */}
        <div className={`${contentClassName} relative z-10`}>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary text-sm font-medium"
                >
                  <BookOpen className="w-4 h-4" />
                  Your Personal Library
                </motion.div>

                <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold text-foreground leading-tight">
                  Welcome to{" "}
                  <span className="text-primary">Bookify</span>
                </h1>

                <p className="text-xl text-muted-foreground max-w-xl leading-relaxed">
                  Your ultimate companion for managing, discovering, and enjoying books. Track your reading progress, connect with friends, and explore thousands of titles.
                </p>
              </div>

              {/* Features */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-col items-start gap-2"
                >
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <BookMarked className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">Track Progress</h3>
                  <p className="text-sm text-muted-foreground">Monitor your reading journey</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex flex-col items-start gap-2"
                >
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">Connect</h3>
                  <p className="text-sm text-muted-foreground">Share with friends</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-col items-start gap-2"
                >
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">Discover</h3>
                  <p className="text-sm text-muted-foreground">Find your next favorite</p>
                </motion.div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  size="lg"
                  className="text-lg px-8"
                  onClick={() => navigate("/signup")}
                >
                  Sign Up
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8"
                  onClick={() => navigate("/login")}
                >
                  Login
                </Button>
              </div>

              <p className="text-sm text-muted-foreground">
                Join thousands of readers already using Bookify
              </p>
            </motion.div>

            {/* Right side - Book showcase */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="hidden md:flex justify-center"
            >
              <div className="relative">
                <div className="absolute -inset-8 bg-gradient-to-r from-primary/20 to-primary/10 rounded-3xl blur-3xl" />
                <div className="relative grid grid-cols-2 gap-4">
                  {mockBooks.slice(0, 4).map((book, index) => (
                    <motion.div
                      key={book.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="group"
                    >
                      <img
                        src={book.cover}
                        alt={book.title}
                        className="w-32 h-44 object-cover rounded-lg shadow-xl transition-transform duration-300 hover:scale-105 hover:shadow-2xl"
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative min-h-[70vh] flex items-center overflow-hidden">
      {/* Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${coverSrc})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/30" />
      </div>

      {/* Content */}
      <div className={`${contentClassName} relative z-10`}>
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6 cursor-pointer"
            onClick={handleBookClick}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 text-primary text-sm">
              <Star className="w-4 h-4 fill-current" />
              Featured Book
            </div>

            <h1 
              className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground leading-tight cursor-pointer hover:text-primary transition-colors"
              onClick={handleBookClick}
            >
              {featuredBook.title}
            </h1>

            <p className="text-lg text-muted-foreground">
              by <span className="text-foreground font-medium">{featuredBook.author}</span>
            </p>

            <p className="text-muted-foreground max-w-lg leading-relaxed">
              {featuredBook.description}
            </p>

            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-primary fill-current" />
                <span className="font-semibold text-foreground">{featuredBook.rating}</span>
                <span className="text-muted-foreground">rating</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <BookOpen className="w-5 h-5" />
                <span>{featuredBook.pages > 0 ? `${featuredBook.pages} pages` : "Pages unavailable"}</span>
              </div>
              {featuredBook.duration && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-5 h-5" />
                  <span>{featuredBook.duration}</span>
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-2">
              <Button
                size="lg"
                className="gap-2"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/books/${featuredBook.id}`);
                }}
              >
                <Plus className="w-5 h-5" />
                Add to Library
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="hidden md:flex justify-center cursor-pointer"
            onClick={handleBookClick}
          >
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-primary/5 rounded-2xl blur-2xl group-hover:from-primary/30 transition-all" />
              <img
                src={coverSrc}
                alt={featuredBook.title}
                className="relative w-72 h-96 object-cover rounded-xl shadow-2xl transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  e.currentTarget.src = "https://placehold.co/600x900/png?text=Book";
                }}
              />
              {featuredBook.isAudiobook && (
                <div className="absolute -bottom-4 -right-4 bg-primary text-primary-foreground p-4 rounded-full shadow-lg">
                  <Headphones className="w-6 h-6" />
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
