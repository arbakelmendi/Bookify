import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";

type BookDto = {
  id: number;
  title: string;
  author?: string | null;
  description?: string | null;
  coverImageUrl?: string | null;
  year?: number | null;
};

const API_BASE = "http://localhost:5000"; // ndrysho nëse backend është në port tjetër

export default function BookDetailsPage() {
  const { id } = useParams();
  const [book, setBook] = useState<BookDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    setError(null);

    axios
      .get<BookDto>(`${API_BASE}/api/Books/${id}`)
      .then((res) => setBook(res.data))
      .catch((err) => {
        console.error(err);
        setError("Could not load book details.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;
  if (!book) return <p>Book not found.</p>;

  return (
    <div style={{ padding: 16, maxWidth: 900, margin: "0 auto" }}>
      <Link to="/books">← Back to Books</Link>

      <h1 style={{ marginTop: 12 }}>{book.title}</h1>

      {book.coverImageUrl ? (
        <img
          src={book.coverImageUrl}
          alt={book.title}
          style={{ width: 220, borderRadius: 8, margin: "12px 0" }}
        />
      ) : null}

      <p>
        <strong>Author:</strong> {book.author ?? "—"}
      </p>
      <p>
        <strong>Year:</strong> {book.year ?? "—"}
      </p>

      <h3 style={{ marginTop: 16 }}>Description</h3>
      <p style={{ lineHeight: 1.6 }}>{book.description ?? "No description."}</p>
    </div>
  );
}
