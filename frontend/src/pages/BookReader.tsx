import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getBookById } from "@/api/books";
import type { Book } from "@/types/book";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, FileText, AlertTriangle } from "lucide-react";

export default function BookReader() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [pdfExists, setPdfExists] = useState<boolean | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;

    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const b = await getBookById(id);
        if (active) setBook(b);
      } catch (e) {
        if (active) setErr(e instanceof Error ? e.message : "Failed to load reader.");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [id]);

  const pdfSrc = useMemo(() => {
    // ✅ robust base path for Vite
    const base = import.meta.env.BASE_URL || "/";
    const bookId = book?.id ?? id ?? "0";
    return `${base}pdfs/${bookId}.pdf`;
  }, [book, id]);

  // ✅ check if PDF exists, so we don't show ugly iframe-404
  useEffect(() => {
    let active = true;
    (async () => {
      if (!pdfSrc) return;
      try {
        const r = await fetch(pdfSrc, { method: "HEAD" });
        if (active) setPdfExists(r.ok);
      } catch {
        if (active) setPdfExists(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [pdfSrc]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading reader...
      </div>
    );
  }

  if (err || !book) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="text-lg font-semibold">Reader not available</div>
          {err && <div className="text-destructive">{err}</div>}
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => window.open(pdfSrc, "_blank")}
              disabled={!pdfExists}
            >
              <FileText className="w-4 h-4" />
              Open PDF
            </Button>

            <Button
              className="gap-2"
              onClick={() => {
                const a = document.createElement("a");
                a.href = pdfSrc;
                a.download = `${book.title}.pdf`;
                a.click();
              }}
              disabled={!pdfExists}
            >
              <Download className="w-4 h-4" />
              Download
            </Button>
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-4">{book.title}</h1>

        {/* ✅ if PDF missing, show nice message instead of iframe 404 */}
        {pdfExists === false && (
          <div className="rounded-xl border bg-card p-6 flex gap-3 items-start">
            <AlertTriangle className="w-5 h-5 mt-0.5 text-destructive" />
            <div className="space-y-2">
              <div className="font-semibold">PDF not found for this book</div>
              <div className="text-sm text-muted-foreground">
                Expected file: <span className="font-mono">{pdfSrc}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Put the PDF in: <span className="font-mono">frontend/public/pdfs/{book.id}.pdf</span>
              </div>
            </div>
          </div>
        )}

        {pdfExists && (
          <div className="rounded-xl border bg-card overflow-hidden">
            <iframe
              title={`Read ${book.title}`}
              src={pdfSrc}
              className="w-full"
              style={{ height: "82vh" }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
