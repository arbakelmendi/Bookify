import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Star, 
  Headphones, 
  Play, 
  Plus, 
  BookOpen, 
  Clock, 
  ArrowLeft, 
  Calendar,
  Tag,
  Heart,
  Share2,
  Bookmark
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { mockBooks } from "@/data/mockData";
import { BookSection } from "@/components/books/BookSection";

const BookDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const book = mockBooks.find(b => b.id === id);

  if (!book) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Book not found</h1>
          <Button onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Discover
          </Button>
        </div>
      </div>
    );
  }

  // Get related books (same category, excluding current)
  const relatedBooks = mockBooks
    .filter(b => b.category === book.category && b.id !== book.id)
    .slice(0, 6);

  // Get more from author (mock - just get some books)
  const moreFromAuthor = mockBooks
    .filter(b => b.id !== book.id)
    .slice(0, 4);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center overflow-hidden">
        {/* Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${book.cover})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/30" />
        </div>

        {/* Back Button */}
        <div className="absolute top-4 left-4 z-20">
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

        {/* Content */}
        <div className="container mx-auto px-4 relative z-10 pt-16">
          <div className="grid md:grid-cols-[300px_1fr] gap-12 items-start">
            {/* Book Cover */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="flex justify-center md:justify-start"
            >
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-primary/5 rounded-2xl blur-2xl" />
                <img
                  src={book.cover}
                  alt={book.title}
                  className="relative w-64 h-80 md:w-72 md:h-96 object-cover rounded-xl shadow-2xl"
                />
                {book.isAudiobook && (
                  <div className="absolute -bottom-4 -right-4 bg-primary text-primary-foreground p-4 rounded-full shadow-lg">
                    <Headphones className="w-6 h-6" />
                  </div>
                )}
              </div>
            </motion.div>

            {/* Book Info */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-6"
            >
              <div className="space-y-3">
                <Badge variant="secondary" className="gap-1">
                  <Tag className="w-3 h-3" />
                  {book.category}
                </Badge>
                
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground leading-tight">
                  {book.title}
                </h1>

                <p className="text-lg text-muted-foreground">
                  by <span className="text-foreground font-medium">{book.author}</span>
                </p>
              </div>

              {/* Rating & Stats */}
              <div className="flex flex-wrap items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        className={`w-5 h-5 ${star <= Math.round(book.rating) ? 'text-primary fill-current' : 'text-muted-foreground'}`} 
                      />
                    ))}
                  </div>
                  <span className="font-semibold text-foreground">{book.rating}</span>
                  <span className="text-muted-foreground">(2,847 reviews)</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  <span>{book.pages} pages</span>
                </div>
                {book.duration && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    <span>{book.duration}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  <span>Published {book.publishedYear}</span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">About this book</h3>
                <p className="text-muted-foreground leading-relaxed max-w-2xl">
                  {book.description}
                </p>
                <p className="text-muted-foreground leading-relaxed max-w-2xl">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-2">
                <Button size="lg" className="gap-2">
                  <Plus className="w-5 h-5" />
                  Add to Library
                </Button>
                {book.isAudiobook && (
                  <Button size="lg" variant="outline" className="gap-2">
                    <Play className="w-5 h-5" />
                    Listen Now
                  </Button>
                )}
                <Button size="lg" variant="outline" className="gap-2">
                  <Bookmark className="w-5 h-5" />
                  Save
                </Button>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-4 pt-2">
                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                  <Heart className="w-4 h-4" />
                  Add to Wishlist
                </Button>
                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Additional Info Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Book Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <h3 className="font-semibold text-lg text-foreground">Book Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Publisher</span>
                <span className="text-foreground">Penguin Books</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Language</span>
                <span className="text-foreground">English</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">ISBN</span>
                <span className="text-foreground">978-0-14-028329-7</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Format</span>
                <span className="text-foreground">{book.isAudiobook ? "eBook, Audiobook" : "eBook"}</span>
              </div>
            </div>
          </motion.div>

          {/* Reading Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <h3 className="font-semibold text-lg text-foreground">Reading Stats</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Currently Reading</span>
                <span className="text-foreground">1,234 readers</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Have Read</span>
                <span className="text-foreground">45,678 readers</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Want to Read</span>
                <span className="text-foreground">12,345 readers</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Avg. Reading Time</span>
                <span className="text-foreground">~6 hours</span>
              </div>
            </div>
          </motion.div>

          {/* Genres & Tags */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <h3 className="font-semibold text-lg text-foreground">Genres & Tags</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{book.category}</Badge>
              <Badge variant="outline">Bestseller</Badge>
              <Badge variant="outline">Award Winner</Badge>
              <Badge variant="outline">Book Club Pick</Badge>
              <Badge variant="outline">Popular</Badge>
              <Badge variant="outline">Must Read</Badge>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-xl text-foreground">Reader Reviews</h3>
            <Button variant="outline" size="sm">Write a Review</Button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              { name: "Sarah M.", rating: 5, date: "2 days ago", text: "Absolutely captivating! I couldn't put it down. The author has a way with words that pulls you into the story immediately." },
              { name: "John D.", rating: 4, date: "1 week ago", text: "Great read overall. The pacing was perfect and the characters were well-developed. Highly recommend for fans of the genre." },
              { name: "Emily R.", rating: 5, date: "2 weeks ago", text: "This book changed my perspective on so many things. Beautifully written and thought-provoking. A must-read!" },
              { name: "Michael T.", rating: 4, date: "3 weeks ago", text: "Engaging from start to finish. The plot twists were unexpected and kept me guessing until the very end." }
            ].map((review, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-4 rounded-lg bg-card border border-border space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-semibold">{review.name[0]}</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{review.name}</p>
                      <p className="text-xs text-muted-foreground">{review.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        className={`w-4 h-4 ${star <= review.rating ? 'text-primary fill-current' : 'text-muted-foreground'}`} 
                      />
                    ))}
                  </div>
                </div>
                <p className="text-muted-foreground text-sm">{review.text}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Related Books */}
      {relatedBooks.length > 0 && (
        <section className="container mx-auto px-4 py-12">
          <BookSection title={`More in ${book.category}`} books={relatedBooks} />
        </section>
      )}

      {/* More from Author */}
      <section className="container mx-auto px-4 py-12">
        <BookSection title="You Might Also Like" books={moreFromAuthor} />
      </section>
    </div>
  );
};

export default BookDetail;
