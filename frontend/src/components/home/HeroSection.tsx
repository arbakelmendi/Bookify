import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, Headphones, Play, Plus, BookOpen, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mockBooks } from "@/data/mockData";

export const HeroSection = () => {
  const navigate = useNavigate();
  const featuredBook = mockBooks[0];

  const handleBookClick = () => {
    navigate(`/book/${featuredBook.id}`);
  };

  return (
    <section className="relative min-h-[70vh] flex items-center overflow-hidden">
      {/* Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${featuredBook.cover})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/30" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
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
                <span>{featuredBook.pages} pages</span>
              </div>
              {featuredBook.duration && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-5 h-5" />
                  <span>{featuredBook.duration}</span>
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-2">
              <Button size="lg" className="gap-2">
                <Plus className="w-5 h-5" />
                Add to Library
              </Button>
              {featuredBook.isAudiobook && (
                <Button size="lg" variant="outline" className="gap-2">
                  <Play className="w-5 h-5" />
                  Listen Now
                </Button>
              )}
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
                src={featuredBook.cover}
                alt={featuredBook.title}
                className="relative w-72 h-96 object-cover rounded-xl shadow-2xl transition-transform duration-300 group-hover:scale-105"
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
