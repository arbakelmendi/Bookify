import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getBookById } from "@/api/books";
import type { Book } from "@/types/book";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Download,
  FileText,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";

function normalizeUrl(url: string, base: string) {
  const u = url.trim();

  // already absolute
  if (u.startsWith("http://") || u.startsWith("https://")) return u;

  // protocol-relative: //books.google.com/...
  if (u.startsWith("//")) return `https:${u}`;

  // absolute path on same origin: /pdfs/1.pdf
  if (u.startsWith("/")) return u;

  // relative path: pdfs/1.pdf
  return `${base}${u}`;
}

export default function BookReader() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [resourceOk, setResourceOk] = useState<boolean | null>(null);

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

  const { mode, src, isExternal } = useMemo(() => {
    const base = import.meta.env.BASE_URL || "/";
    const cleanBase = base.endsWith("/") ? base : `${base}/`;

    // fallback local pdf
    const fallbackPdf = `${cleanBase}pdfs/${id ?? "0"}.pdf`;

    const pdfUrl = book?.pdfUrl?.trim() || "";
    const previewUrl = book?.previewUrl?.trim() || "";

    if (pdfUrl) {
      const normalized = normalizeUrl(pdfUrl, cleanBase);
      return {
        mode: "pdf" as const,
        src: normalized,
        isExternal: normalized.startsWith("http"),
      };
    }

    if (previewUrl) {
      // 🔥 normalize preview too (prevents localhost-relative bugs)
      const normalized = normalizeUrl(previewUrl, cleanBase);
      return {
        mode: "preview" as const,
        src: normalized,
        isExternal: normalized.startsWith("http"),
      };
    }

    return {
      mode: "pdf" as const,
      src: fallbackPdf,
      isExternal: false,
    };
  }, [book, id]);


  console.log("reader", {
  id,
  pdfUrl: book?.pdfUrl,
  previewUrl: book?.previewUrl,
  mode,
  src,
});


  // ✅ For external URLs: DON'T HEAD fetch (CORS), just assume ok and let iframe load.
  // ✅ For local pdfs: HEAD fetch to avoid ugly 404 in iframe.
  useEffect(() => {
    let active = true;

    (async () => {
      if (!src) return;

      if (isExternal) {
        if (active) setResourceOk(true);
        return;
      }

      try {
        const r = await fetch(src, { method: "HEAD" });
        if (active) setResourceOk(r.ok);
      } catch {
        if (active) setResourceOk(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [src, isExternal]);

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

  const safeFileName =
    (book.title || `book-${id}`).replace(/[^\w\-]+/g, "_") + ".pdf";

  const isPdf = mode === "pdf";

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
              onClick={() => window.open(src, "_blank")}
              disabled={resourceOk === false}
            >
              {isPdf ? (
                <FileText className="w-4 h-4" />
              ) : (
                <ExternalLink className="w-4 h-4" />
              )}
              {isPdf ? "Open PDF" : "Open Preview"}
            </Button>

            {isPdf && (
              <Button
                className="gap-2"
                onClick={() => {
                  const a = document.createElement("a");
                  a.href = src;
                  a.download = safeFileName;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                }}
                disabled={resourceOk === false}
              >
                <Download className="w-4 h-4" />
                Download
              </Button>
            )}
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-4">{book.title}</h1>

        {resourceOk === false && (
          <div className="rounded-xl border bg-card p-6 flex gap-3 items-start">
            <AlertTriangle className="w-5 h-5 mt-0.5 text-destructive" />
            <div className="space-y-2">
              <div className="font-semibold">
                {isPdf ? "PDF not found for this book" : "Preview not available for this book"}
              </div>
              <div className="text-sm text-muted-foreground">
                URL: <span className="font-mono break-all">{src}</span>
              </div>
              {isPdf && (
                <div className="text-sm text-muted-foreground">
                  If using local pdf, put it in:{" "}
                  <span className="font-mono">frontend/public/pdfs/{id}.pdf</span>
                </div>
              )}
            </div>
          </div>
        )}

        {resourceOk && (
          <div className="rounded-xl border bg-card overflow-hidden">
            <iframe
              title={isPdf ? `Read ${book.title}` : `Preview ${book.title}`}
              src={src}
              className="w-full"
              style={{ height: "82vh" }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
