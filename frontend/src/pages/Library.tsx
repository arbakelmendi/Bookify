import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LibraryCard } from "@/components/library/LibraryCard";
import { mockUserBooks } from "@/data/mockData";
import { UserBook, ReadingStatus } from "@/types/book";

const Library = () => {
  const [books, setBooks] = useState<UserBook[]>(mockUserBooks);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<ReadingStatus | "all">("all");

  const filters: { label: string; value: ReadingStatus | "all" }[] = [
    { label: "All Books", value: "all" },
    { label: "Reading", value: "reading" },
    { label: "To Read", value: "to-read" },
    { label: "Finished", value: "finished" }
  ];

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         book.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === "all" || book.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const handleStatusChange = (id: string, status: ReadingStatus) => {
    setBooks(prev => prev.map(book => 
      book.id === id 
        ? { ...book, status, progress: status === "finished" ? 100 : status === "to-read" ? 0 : book.progress }
        : book
    ));
  };

  const handleRatingChange = (id: string, rating: number) => {
    setBooks(prev => prev.map(book => 
      book.id === id ? { ...book, userRating: rating } : book
    ));
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            My Library
          </h1>
          <p className="text-muted-foreground">
            {books.length} books in your collection
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-4 mb-8"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search your library..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
            {filters.map(filter => (
              <Button
                key={filter.value}
                variant={activeFilter === filter.value ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter(filter.value)}
                className="flex-shrink-0"
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBooks.map((book, index) => (
            <LibraryCard
              key={book.id}
              book={book}
              index={index}
              onStatusChange={handleStatusChange}
              onRatingChange={handleRatingChange}
            />
          ))}
        </div>

        {filteredBooks.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-muted-foreground">No books found</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Library;
