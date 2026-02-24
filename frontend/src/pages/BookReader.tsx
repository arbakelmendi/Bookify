import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";
import { getBookById } from "@/api/books";
import { getPdfProgress, upsertPdfProgress, type PdfProgressViewDto } from "@/api/reading";
import type { Book } from "@/types/book";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Minus,
  Plus,
} from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

function normalizeUrl(url: string, base: string) {
  const u = url.trim();

  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  if (u.startsWith("//")) return `https:${u}`;
  if (u.startsWith("/")) return u;

  return `${base}${u}`;
}

function clampPage(page: number, total: number) {
  if (total <= 0) return 1;
  if (page < 1) return 1;
  if (page > total) return total;
  return page;
}

export default function BookReader() {
  const { id } = useParams();
  const navigate = useNavigate();
  const bookId = Number(id);

  const [book, setBook] = useState<Book | null>(null);
  const [loadingBook, setLoadingBook] = useState(true);
  const [bookError, setBookError] = useState<string | null>(null);

  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [useProxy, setUseProxy] = useState(false);

  const [restoredPage, setRestoredPage] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const pageRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const [pageWidth, setPageWidth] = useState<number | undefined>(undefined);

  const didRestoreRef = useRef(false);
  const programmaticScrollRef = useRef(false);
  const programmaticTimerRef = useRef<number | null>(null);
  const latestPageRef = useRef(1);
  const latestNumPagesRef = useRef(0);
  const lastSavedKeyRef = useRef("");

  useEffect(() => {
    latestPageRef.current = currentPage;
    latestNumPagesRef.current = numPages;
  }, [currentPage, numPages]);

  useEffect(() => {
    setNumPages(0);
    setCurrentPage(1);
    setRestoredPage(null);
    setUseProxy(false);
    didRestoreRef.current = false;
    pageRefs.current = {};
    if (programmaticTimerRef.current != null) {
      window.clearTimeout(programmaticTimerRef.current);
      programmaticTimerRef.current = null;
    }
    programmaticScrollRef.current = false;
  }, [bookId]);

  useEffect(() => {
    if (!id || Number.isNaN(bookId)) return;

    let active = true;

    (async () => {
      try {
        setLoadingBook(true);
        setBookError(null);

        const [bookData, progress] = await Promise.all([
          getBookById(id),
          getPdfProgress(bookId),
        ]);

        if (!active) return;

        setBook(bookData);
        if (progress?.currentPage != null) {
          const savedPage = Math.max(1, Number(progress.currentPage));
          setRestoredPage(savedPage);
          setCurrentPage(savedPage);
        } else {
          setRestoredPage(1);
          setCurrentPage(1);
        }
      } catch (error) {
        if (!active) return;
        setBookError(error instanceof Error ? error.message : "Failed to load reader.");
      } finally {
        if (active) setLoadingBook(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [id, bookId]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const width = Math.floor(el.clientWidth);
      if (width > 0) {
        setPageWidth(Math.max(280, Math.min(width - 40, 1000)));
      }
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  const pdfUrl = useMemo(() => {
    if (!book?.pdfUrl?.trim()) return null;

    if (useProxy && !Number.isNaN(bookId)) {
      return `/api/Books/${bookId}/pdf-proxy`;
    }

    const base = import.meta.env.BASE_URL || "/";
    const cleanBase = base.endsWith("/") ? base : `${base}/`;
    return normalizeUrl(book.pdfUrl, cleanBase);
  }, [book, useProxy, bookId]);

  const getScrollRoot = useCallback((): Window | HTMLDivElement => {
    const el = containerRef.current;
    if (!el) return window;
    const isScrollable = el.scrollHeight > el.clientHeight + 5;
    return isScrollable ? el : window;
  }, []);

  const documentFile = useMemo(
    () => (pdfUrl ? { url: pdfUrl, withCredentials: false } : null),
    [pdfUrl]
  );

  const saveProgressNow = useCallback(
    async (force: boolean) => {
      if (!id || Number.isNaN(bookId)) return;
      if (!didRestoreRef.current) return;
      const total = latestNumPagesRef.current;
      if (total <= 0) return;

      const page = clampPage(latestPageRef.current, total);
      const key = `${bookId}:${page}:${total}`;
      if (!force && key === lastSavedKeyRef.current) return;

      try {
        const result = await upsertPdfProgress(bookId, {
          currentPage: page,
          totalPages: total,
          status: "Reading",
        });
        const progress = result as PdfProgressViewDto | void;
        const savedPage =
          progress && typeof progress.currentPage === "number"
            ? clampPage(progress.currentPage, progress.totalPages || total)
            : page;
        latestPageRef.current = savedPage;
        lastSavedKeyRef.current = key;
      } catch {
        // Best effort save.
      }
    },
    [id, bookId]
  );

  useEffect(() => {
    if (numPages <= 0) return;

    const timer = window.setTimeout(() => {
      void saveProgressNow(false);
    }, 2500);

    return () => window.clearTimeout(timer);
  }, [currentPage, numPages, saveProgressNow]);

  useEffect(() => {
    return () => {
      void saveProgressNow(true);
    };
  }, [saveProgressNow]);

  const scrollToPage = useCallback(
    (page: number, behavior: ScrollBehavior = "smooth") => {
      if (numPages <= 0) return;

      const safePage = clampPage(page, numPages);
      const el = pageRefs.current[safePage];
      if (!el) return;

      programmaticScrollRef.current = true;
      if (programmaticTimerRef.current != null) {
        window.clearTimeout(programmaticTimerRef.current);
      }
      programmaticTimerRef.current = window.setTimeout(() => {
        programmaticScrollRef.current = false;
        programmaticTimerRef.current = null;
      }, 400);

      const root = getScrollRoot();
      if (root === window) {
        const top = el.getBoundingClientRect().top + window.scrollY - 16;
        window.scrollTo({ top, behavior });
        return;
      }

      const container = root as HTMLDivElement;
      const top =
        el.getBoundingClientRect().top -
        container.getBoundingClientRect().top +
        container.scrollTop -
        16;
      container.scrollTo({ top, behavior });
    },
    [numPages, getScrollRoot]
  );

  useEffect(() => {
    if (numPages <= 0) return;

    let raf = 0;
    const root = getScrollRoot();

    const calculateCurrentPage = () => {
      if (!didRestoreRef.current) return;
      if (programmaticScrollRef.current) return;

      let centerY = window.innerHeight / 2;
      if (root !== window) {
        const container = root as HTMLDivElement;
        const rect = container.getBoundingClientRect();
        centerY = rect.top + container.clientHeight / 2;
      }

      let bestPage = latestPageRef.current;
      let bestDistance = Number.POSITIVE_INFINITY;

      for (let page = 1; page <= numPages; page += 1) {
        const el = pageRefs.current[page];
        if (!el) continue;

        const rect = el.getBoundingClientRect();
        const elementCenter = rect.top + rect.height / 2;
        const distance = Math.abs(elementCenter - centerY);

        if (distance < bestDistance) {
          bestDistance = distance;
          bestPage = page;
        }
      }

      setCurrentPage((prev) => (prev === bestPage ? prev : bestPage));
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        calculateCurrentPage();
      });
    };

    const hasPages = Object.keys(pageRefs.current).length > 0;
    if (!hasPages) return;

    calculateCurrentPage();

    root.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      if (raf) cancelAnimationFrame(raf);
      root.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [numPages, getScrollRoot, scale]);

  useEffect(() => {
    if (!numPages) return;
    if (restoredPage == null) return;
    if (didRestoreRef.current) return;

    const targetPage = clampPage(restoredPage, numPages);
    const targetEl = pageRefs.current[targetPage];
    if (!targetEl) return;

    didRestoreRef.current = true;
    scrollToPage(targetPage, "auto");
  }, [numPages, restoredPage, bookId, scrollToPage]);

  useEffect(() => {
    return () => {
      if (programmaticTimerRef.current != null) {
        window.clearTimeout(programmaticTimerRef.current);
      }
    };
  }, []);

  const onPdfLoadSuccess = useCallback(({ numPages: total }: { numPages: number }) => {
    setPdfError(null);
    setNumPages(total);

    // TODO: For very large PDFs (>400 pages), consider virtualization to reduce memory/render cost.
  }, []);

  const onPdfLoadError = useCallback(
    (error: Error) => {
      if (!useProxy && !Number.isNaN(bookId)) {
        setUseProxy(true);
        setPdfError("Direct PDF access failed. Retrying via server proxy...");
        return;
      }

      setPdfError(error.message || "Failed to load PDF.");
    },
    [useProxy, bookId]
  );

  if (loadingBook) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading reader...
      </div>
    );
  }

  if (bookError || !book) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="text-lg font-semibold">Reader not available</div>
          {bookError && <div className="text-destructive">{bookError}</div>}
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </div>
    );
  }

  if (!pdfUrl) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
          <h1 className="text-2xl font-bold mb-4">{book.title}</h1>
          <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
            This book has no PDF URL configured.
          </div>
        </div>
      </div>
    );
  }

  const safeFileName =
    (book.title || `book-${id}`).replace(/[^\w-]+/g, "_") + ".pdf";

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
              onClick={() => window.open(pdfUrl, "_blank", "noopener,noreferrer")}
            >
              <ExternalLink className="w-4 h-4" />
              Open PDF
            </Button>

            <Button
              className="gap-2"
              onClick={() => {
                const a = document.createElement("a");
                a.href = pdfUrl;
                a.download = safeFileName;
                document.body.appendChild(a);
                a.click();
                a.remove();
              }}
            >
              <Download className="w-4 h-4" />
              Download
            </Button>
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-4">{book.title}</h1>

        <div className="rounded-xl border bg-card p-4 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => scrollToPage(currentPage - 1)}
              disabled={numPages <= 0 || currentPage <= 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Prev
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => scrollToPage(currentPage + 1)}
              disabled={numPages <= 0 || currentPage >= numPages}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>

            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setScale((s) => Math.max(0.6, Number((s - 0.1).toFixed(2))))}
              >
                <Minus className="w-4 h-4" />
              </Button>

              <span className="text-sm text-muted-foreground min-w-14 text-center">
                {Math.round(scale * 100)}%
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setScale((s) => Math.min(2.2, Number((s + 0.1).toFixed(2))))}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute top-3 right-3 z-20 rounded-md border bg-background/95 px-3 py-1 text-sm shadow-sm">
            Page {currentPage} / {numPages || "..."}
          </div>

          <div
            ref={containerRef}
            className="rounded-xl border bg-card p-4 h-[78vh] overflow-auto"
          >
            <Document
              file={documentFile ?? undefined}
              onLoadSuccess={onPdfLoadSuccess}
              onLoadError={onPdfLoadError}
              loading={<div className="text-muted-foreground">Loading PDF...</div>}
              error={null}
              noData={<div className="text-muted-foreground">No PDF file provided.</div>}
            >
              <div className="space-y-4 flex flex-col items-center">
                {numPages > 0 &&
                  Array.from({ length: numPages }, (_, i) => (
                    <div
                      key={i + 1}
                      data-page={i + 1}
                      className="pdf-page-wrapper w-full flex justify-center"
                      ref={(node) => {
                        pageRefs.current[i + 1] = node;
                      }}
                    >
                      <Page
                        pageNumber={i + 1}
                        scale={scale}
                        width={pageWidth}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                      />
                    </div>
                  ))}
              </div>
            </Document>
          </div>
        </div>

        {pdfError && (
          <div className="mt-3 text-sm text-destructive">{pdfError}</div>
        )}
      </div>
    </div>
  );
}
