import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getBookById } from "@/api/books";
import type { Book } from "@/types/book";

const BookAudio = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;

    const load = async () => {
      try {
        const data = await getBookById(id);
        if (active) {
          setBook(data);
        }
      } catch (e) {
        if (active) {
          setError(e instanceof Error ? e.message : "Failed to load audio.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [id]);

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <Button variant="ghost" className="mb-6 gap-2" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        {loading && <p className="text-muted-foreground">Loading audio...</p>}
        {error && <p className="text-destructive">{error}</p>}

        {!loading && !error && book && (
          <div className="space-y-6">
            <h1 className="text-3xl font-display font-bold text-foreground">
              {book.title}
            </h1>
            <p className="text-muted-foreground">Audio player coming soon.</p>

            <div className="p-4 rounded-xl border border-border bg-card">
              <audio controls disabled className="w-full">
                <source src="" />
              </audio>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookAudio;
