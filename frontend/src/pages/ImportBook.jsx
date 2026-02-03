import { useState } from "react";

const API = import.meta.env.VITE_API_URL; // ose përdor REACT_APP_... nëse s'është Vite

export default function ImportBook() {
  const [isbn, setIsbn] = useState("");
  const [book, setBook] = useState(null);
  const [err, setErr] = useState("");

  const search = async () => {
    setErr("");
    setBook(null);

    const res = await fetch(`${API}/api/books/external/isbn/${isbn}`);
    if (!res.ok) {
      setErr("S’u gjet libri me kete ISBN.");
      return;
    }
    const data = await res.json();
    setBook(data);
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Import Book by ISBN</h2>

      <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
        <input
          value={isbn}
          onChange={(e) => setIsbn(e.target.value)}
          placeholder="p.sh. 9780132350884"
          style={{ padding: 10, width: 260 }}
        />
        <button onClick={search}>Search</button>
      </div>

      {err && <p style={{ marginTop: 12 }}>{err}</p>}

      {book && (
        <div style={{ marginTop: 20, display: "flex", gap: 20 }}>
          {book.coverImageUrl && (
            <img src={book.coverImageUrl} alt="cover" style={{ width: 160 }} />
          )}
          <div>
            <h3>{book.title}</h3>
            <p><b>Authors:</b> {book.authors}</p>
            <p><b>Publisher:</b> {book.publisher}</p>
            <p><b>Published:</b> {book.publishedDate}</p>
            <p><b>Pages:</b> {book.pageCount}</p>
            <p style={{ maxWidth: 700 }}>{book.description}</p>
          </div>
        </div>
      )}
    </div>
  );
}
