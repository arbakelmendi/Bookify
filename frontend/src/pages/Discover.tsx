import { HeroSection } from "@/components/home/HeroSection";
import { BookSection } from "@/components/books/BookSection";
import { mockBooks } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";

const Discover = () => {
  const { isAuthenticated } = useAuth();
  const trendingBooks = mockBooks.filter(book => book.rating >= 4.5);
  const newReleases = mockBooks.filter(book => book.publishedYear >= 2023);
  const audiobooks = mockBooks.filter(book => book.isAudiobook);
  const recommended = mockBooks.slice(0, 6);

  return (
    <div className="min-h-screen">
      <HeroSection />

      {isAuthenticated && (
        <div className="container mx-auto px-4 py-8 space-y-12">
          <BookSection title="Trending Now" books={trendingBooks} />
          <BookSection title="New Releases" books={newReleases} />
          <BookSection title="Audiobooks" books={audiobooks} />
          <BookSection title="Recommended for You" books={recommended} />
        </div>
      )}
    </div>
  );
};

export default Discover;
