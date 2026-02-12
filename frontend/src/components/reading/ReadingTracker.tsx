import { useEffect, useMemo, useState } from "react";
import {
  finishReading,
  getCurrentReading,
  getFinishedReading,
  startReading,
  updateProgress,
  type ReadingEntry,
} from "@/api/reading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

type Props = { bookId: number };

export function ReadingTracker({ bookId }: Props) {
  const [loading, setLoading] = useState(true);
  const [entry, setEntry] = useState<ReadingEntry | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [totalPages, setTotalPages] = useState<number>(250);
  const [pagesRead, setPagesRead] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  const percent = useMemo(() => {
    if (!entry) return 0;
    // fallback nëse percent s’vjen
    const p =
      typeof entry.percent === "number"
        ? entry.percent
        : entry.totalPages > 0
          ? Math.round((entry.pagesRead / entry.totalPages) * 100)
          : 0;
    return Math.max(0, Math.min(100, Math.round(p)));
  }, [entry]);

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const [current, finished] = await Promise.all([
        getCurrentReading(),
        getFinishedReading(),
      ]);

      const found =
        current.find((x) => x.bookId === bookId) ??
        finished.find((x) => x.bookId === bookId) ??
        null;

      setEntry(found);
      setPagesRead(found?.pagesRead ?? 0);
      setTotalPages(found?.totalPages ?? 250);
    } catch (e: any) {
      const msg =
        e?.response?.status === 401
          ? "Duhet me u kyç (login) për me përdor reading tracking."
          : e?.response?.data?.message || e?.message || "Gabim gjatë ngarkimit.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId]);

  async function onStart() {
    setSaving(true);
    setError(null);
    try {
      const created = await startReading(bookId, totalPages);
      setEntry(created);
      setPagesRead(created.pagesRead ?? 0);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "S’u kriju tracking.");
    } finally {
      setSaving(false);
    }
  }

  async function onSaveProgress() {
    if (!entry) return;
    setSaving(true);
    setError(null);

    try {
      await updateProgress(entry.id, pagesRead);
      await load();
    } catch (e: any) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "S’u ruajt progress. Kontrollo pagesRead."
      );
    } finally {
      setSaving(false);
    }
  }

  async function onFinish() {
    if (!entry) return;
    setSaving(true);
    setError(null);

    try {
      await finishReading(entry.id);
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "S’u mbyll libri.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mt-6 rounded-xl border bg-card p-4 text-sm text-muted-foreground">
        Loading reading tracker...
      </div>
    );
  }

  const isFinished = entry?.status === "Finished";

  return (
    <div className="mt-6 rounded-2xl border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">Reading Tracker</h3>
          <p className="text-xs text-muted-foreground">
            Tracko progresin (pages + percent).
          </p>
        </div>

        {entry?.status && (
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              isFinished
                ? "bg-emerald-500/15 text-emerald-600"
                : "bg-sky-500/15 text-sky-600"
            }`}
          >
            {entry.status}
          </span>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Start state */}
      {!entry && (
        <div className="mt-5 space-y-3">
          <div className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
            S’ke fillu ende me e track-u leximin për këtë libër.
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <Label htmlFor="totalPages" className="text-xs">
                Total pages
              </Label>
              <Input
                id="totalPages"
                type="number"
                min={1}
                value={totalPages}
                onChange={(e) => setTotalPages(Number(e.target.value))}
              />
            </div>

            <Button onClick={onStart} disabled={saving || totalPages <= 0}>
              {saving ? "Starting..." : "Start Reading"}
            </Button>
          </div>
        </div>
      )}

      {/* Tracking exists */}
      {entry && (
        <div className="mt-5 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {entry.pagesRead}/{entry.totalPages} pages
              </span>
              <span className="font-medium text-foreground">{percent}%</span>
            </div>

            <Progress value={percent} />

            <div className="text-xs text-muted-foreground">
              Last updated: {new Date(entry.lastUpdated).toLocaleString()}
            </div>
          </div>

          {!isFinished ? (
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <div>
                <Label htmlFor="pagesRead" className="text-xs">
                  Pages read
                </Label>
                <Input
                  id="pagesRead"
                  type="number"
                  min={0}
                  max={entry.totalPages}
                  value={pagesRead}
                  onChange={(e) => setPagesRead(Number(e.target.value))}
                />
                <div className="mt-1 text-xs text-muted-foreground">
                  Max: {entry.totalPages}
                </div>
              </div>

              <div className="flex gap-2 sm:justify-end">
                <Button onClick={onSaveProgress} disabled={saving}>
                  {saving ? "Saving..." : "Save progress"}
                </Button>
                <Button variant="outline" onClick={onFinish} disabled={saving}>
                  Finish
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 p-3 text-sm text-emerald-700">
              Ky libër është i përfunduar ✅
            </div>
          )}
        </div>
      )}
    </div>
  );
}
