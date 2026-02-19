// frontend/src/pages/GifsInBox.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Gift,
  Inbox,
  Send,
  Search,
  RefreshCcw,
  BookOpen,
  User,
  Trash2,
  XCircle,
  CheckCircle2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

import {
  getInboxRecommendations,
  getSentRecommendations,
  acceptRecommendation,
  deleteRecommendation,
  type RecommendationDto,
} from "@/api/recommendations";

import { getBookById } from "@/api/books";
import type { Book } from "@/types/book";
import { apiGet } from "@/api/client";

type TabValue = "inbox" | "sent";

type UserMini = {
  id: number;
  email?: string | null;
  username?: string | null;
};

type EnrichedRecommendation = RecommendationDto & {
  book?: Book | null;
  fromUser?: UserMini | null;
  toUser?: UserMini | null;
};

function cleanErr(e: any) {
  const msg =
    e?.response?.data?.message ||
    e?.message ||
    "Action failed.";

  // remove "HTTP 403:" / "HTTPS 403:" / "HTTP 400:" prefixes
  return String(msg).replace(/^HTTPS?\s*\d+\s*:\s*/i, "").trim();
}

async function safeGetUser(id: number) {
  try {
    return await apiGet<UserMini>(`/api/Users/${id}`);
  } catch {
    return null;
  }
}

async function safeGetBook(bookId: number) {
  try {
    return await getBookById(String(bookId));
  } catch {
    return null;
  }
}

export default function GifsInBox() {
  const navigate = useNavigate();

  const [tab, setTab] = useState<TabValue>("inbox");
  const [searchQuery, setSearchQuery] = useState("");

  const [inbox, setInbox] = useState<EnrichedRecommendation[]>([]);
  const [sent, setSent] = useState<EnrichedRecommendation[]>([]);

  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // ✅ nicer status banner (instead of “tick sent” vibe)
  const [notice, setNotice] = useState<{ type: "success" | "info"; text: string } | null>(null);

  const inboxCount = inbox.length;
  const sentCount = sent.length;

  const loadAll = async () => {
    try {
      setErr(null);
      setLoading(true);

      const [inb, snt] = await Promise.all([
        getInboxRecommendations(),
        getSentRecommendations(),
      ]);

      const bookIds = new Set<number>();
      const userIds = new Set<number>();

      [...inb, ...snt].forEach((r) => {
        bookIds.add(r.bookId);
        userIds.add(r.fromUserId);
        userIds.add(r.toUserId);
      });

      const [booksArr, usersArr] = await Promise.all([
        Promise.all(
          Array.from(bookIds).map((id) =>
            safeGetBook(id).then((b) => [id, b] as const)
          )
        ),
        Promise.all(
          Array.from(userIds).map((id) =>
            safeGetUser(id).then((u) => [id, u] as const)
          )
        ),
      ]);

      const booksMap = new Map<number, Book | null>(booksArr);
      const usersMap = new Map<number, UserMini | null>(usersArr);

      const enrich = (r: RecommendationDto): EnrichedRecommendation => ({
        ...r,
        book: booksMap.get(r.bookId) ?? null,
        fromUser: usersMap.get(r.fromUserId) ?? null,
        toUser: usersMap.get(r.toUserId) ?? null,
      });

      setInbox(inb.map(enrich));
      setSent(snt.map(enrich));
    } catch (e: any) {
      setErr(cleanErr(e) || "Failed to load gifts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // auto-hide notice
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 2500);
    return () => clearTimeout(t);
  }, [notice]);

  const filteredInbox = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return inbox;

    return inbox.filter((r) => {
      const from = (
        r.fromUser?.username ||
        r.fromUser?.email ||
        `User #${r.fromUserId}`
      ).toLowerCase();
      const title = (r.book?.title || `Book #${r.bookId}`).toLowerCase();
      const msg = (r.message ?? "").toLowerCase();
      return from.includes(q) || title.includes(q) || msg.includes(q);
    });
  }, [inbox, searchQuery]);

  const filteredSent = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sent;

    return sent.filter((r) => {
      const to = (
        r.toUser?.username ||
        r.toUser?.email ||
        `User #${r.toUserId}`
      ).toLowerCase();
      const title = (r.book?.title || `Book #${r.bookId}`).toLowerCase();
      const msg = (r.message ?? "").toLowerCase();
      return to.includes(q) || title.includes(q) || msg.includes(q);
    });
  }, [sent, searchQuery]);

  const withAction = async (id: number, fn: () => Promise<any>) => {
    try {
      setErr(null);
      setNotice(null);
      setActionLoadingId(id);
      await fn();
      await loadAll();
    } catch (e: any) {
      setErr(cleanErr(e));
    } finally {
      setActionLoadingId(null);
    }
  };

  // ✅ Accept Gift => backend adds to library + removes from inbox
  const acceptGift = (recId: number) =>
    withAction(recId, async () => {
      await acceptRecommendation(recId);
      setNotice({ type: "success", text: "Gift accepted — added to your library." });
      // optional: shko te library
      setTimeout(() => navigate("/library?filter=to-read"), 500);
    });

  // ✅ Delete from inbox
  const deleteGift = (recId: number) =>
    withAction(recId, async () => {
      await deleteRecommendation(recId);
      setNotice({ type: "info", text: "Gift removed from inbox." });
    });

  // ✅ Cancel from sent (same endpoint)
  const cancelSent = (recId: number) =>
    withAction(recId, async () => {
      await deleteRecommendation(recId);
      setNotice({ type: "info", text: "Gift cancelled." });
    });

  const formatWhen = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString();
    } catch {
      return iso;
    }
  };

  const GiftCard = ({
    r,
    mode,
    index,
  }: {
    r: EnrichedRecommendation;
    mode: "inbox" | "sent";
    index: number;
  }) => {
    const bookTitle = r.book?.title || `Book #${r.bookId}`;
    const cover =
      r.book?.coverImageUrl ||
      r.book?.cover ||
      "https://placehold.co/120x160/png?text=Book";

    const leftTitle =
      mode === "inbox"
        ? r.fromUser?.username || r.fromUser?.email || `User #${r.fromUserId}`
        : r.toUser?.username || r.toUser?.email || `User #${r.toUserId}`;

    const leftSub =
      mode === "inbox"
        ? r.fromUser?.email
          ? r.fromUser.email
          : `ID #${r.fromUserId}`
        : r.toUser?.email
        ? r.toUser.email
        : `ID #${r.toUserId}`;

    const isBusy = actionLoadingId === r.id;

    return (
      <motion.div
        key={r.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className="p-4 bg-card border border-border rounded-lg flex items-center gap-4"
      >
        <img
          src={cover}
          alt={bookTitle}
          className="h-20 w-14 rounded-md border object-cover"
          onError={(e) => {
            e.currentTarget.src = "https://placehold.co/120x160/png?text=Book";
          }}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-foreground truncate">{bookTitle}</p>
            <Badge variant="secondary" className="shrink-0">
              {mode === "inbox" ? "Gift" : "Sent"}
            </Badge>
          </div>

          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground truncate">
            <User className="h-4 w-4 shrink-0" />
            <span className="truncate">{leftTitle}</span>
            <span className="text-muted-foreground/60">•</span>
            <span className="truncate">{leftSub}</span>
          </div>

          <div className="mt-1 text-xs text-muted-foreground">
            {formatWhen(r.createdAt)}
          </div>

          {r.message && (
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
              “{r.message}”
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/books/${r.bookId}`)}
          >
            View
          </Button>

          {mode === "inbox" ? (
            <>
              <Button
                size="sm"
                onClick={() => acceptGift(r.id)}
                disabled={isBusy}
                className="gap-2"
              >
                <BookOpen className="h-4 w-4" />
                {isBusy ? "Adding..." : "Accept"}
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => deleteGift(r.id)}
                disabled={isBusy}
                className="gap-2"
                title="Delete this gift"
              >
                <Trash2 className="h-4 w-4" />
                {isBusy ? "..." : "Delete"}
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => cancelSent(r.id)}
              disabled={isBusy}
              className="gap-2"
              title="Cancel this gift"
            >
              <XCircle className="h-4 w-4" />
              {isBusy ? "..." : "Cancel"}
            </Button>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">
              Gifts Inbox
            </h1>
            <p className="text-muted-foreground">
              Gifts / recommendations your friends sent you.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={loadAll}
              disabled={loading}
            >
              <RefreshCcw className="w-4 h-4" />
              Refresh
            </Button>

            <Button
              variant="outline"
              className="gap-2 relative"
              onClick={() => setTab("inbox")}
              disabled={loading}
            >
              <Gift className="w-4 h-4" />
              Inbox
              {inboxCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {inboxCount}
                </Badge>
              )}
            </Button>
          </div>
        </motion.div>

        {/* Notice (nice success/info) */}
        {notice && (
          <div
            className={`mb-6 p-3 rounded-md border ${
              notice.type === "success"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
                : "border-border bg-muted/40 text-foreground"
            } flex items-center gap-2`}
          >
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm">{notice.text}</span>
          </div>
        )}

        {/* Error (clean, no HTTP/HTTPS prefix) */}
        {err && (
          <div className="mb-6 p-3 rounded-md border border-destructive/30 bg-destructive/10 text-destructive">
            {err}
          </div>
        )}

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex gap-2 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={
                  tab === "inbox"
                    ? "Search gifts by sender, book or message..."
                    : "Search sent gifts by receiver, book or message..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                disabled={loading}
              />
            </div>
          </div>
        </motion.div>

        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as TabValue)}
          className="space-y-6"
        >
          <TabsList>
            <TabsTrigger value="inbox" className="gap-2">
              <Inbox className="w-4 h-4" />
              Inbox ({inboxCount})
              {inboxCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {inboxCount}
                </Badge>
              )}
            </TabsTrigger>

            <TabsTrigger value="sent" className="gap-2">
              <Send className="w-4 h-4" />
              Sent ({sentCount})
              {sentCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {sentCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* INBOX */}
          <TabsContent value="inbox">
            {loading ? (
              <div className="text-muted-foreground">Loading...</div>
            ) : (
              <div className="space-y-4 max-w-3xl">
                {filteredInbox.length > 0 ? (
                  filteredInbox.map((r, idx) => (
                    <GiftCard key={r.id} r={r} mode="inbox" index={idx} />
                  ))
                ) : (
                  <div className="flex items-center justify-center">
                    <div className="text-center py-12">
                      <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">
                        No gifts yet
                      </h3>
                      <p className="text-muted-foreground">
                        When a friend sends you a book gift, it will appear here.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* SENT */}
          <TabsContent value="sent">
            {loading ? (
              <div className="text-muted-foreground">Loading...</div>
            ) : (
              <div className="space-y-4 max-w-3xl">
                {filteredSent.length > 0 ? (
                  filteredSent.map((r, idx) => (
                    <GiftCard key={r.id} r={r} mode="sent" index={idx} />
                  ))
                ) : (
                  <div className="flex items-center justify-center">
                    <div className="text-center py-12">
                      <Send className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">
                        No sent gifts
                      </h3>
                      <p className="text-muted-foreground">
                        Gifts you send will appear here.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
