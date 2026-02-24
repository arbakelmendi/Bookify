import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MessageCircle, Search, Pencil, Trash2, Check, X, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { messagesApi, MessageDto, ConversationSummaryDto } from "@/api/messages";
import { useChatHub } from "@/hooks/useChatHub";
import { useAuth } from "@/contexts/AuthContext";

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function dateSeparator(prev: MessageDto | undefined, curr: MessageDto) {
  if (!prev) return formatDate(curr.sentAt);
  const a = new Date(prev.sentAt).toDateString();
  const b = new Date(curr.sentAt).toDateString();
  return a !== b ? formatDate(curr.sentAt) : null;
}

const Messages = () => {
  const { user } = useAuth();
  const [activeFriendId, setActiveFriendId] = useState<number | null>(null);

  const [conversations, setConversations] = useState<ConversationSummaryDto[]>([]);
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingMessageIds, setDeletingMessageIds] = useState<Set<number>>(new Set());

  const messageListRef = useRef<HTMLDivElement>(null);
  const scrollByConversationRef = useRef<Record<number, number>>({});

  const getDistanceFromBottom = useCallback(() => {
    const el = messageListRef.current;
    if (!el) return 0;
    return el.scrollHeight - el.scrollTop - el.clientHeight;
  }, []);

  const isNearBottom = useCallback(() => getDistanceFromBottom() <= 150, [getDistanceFromBottom]);

  const preserveOrStick = useCallback((prevTop: number, prevHeight: number, shouldStickToBottom: boolean) => {
    window.requestAnimationFrame(() => {
      const el = messageListRef.current;
      if (!el) return;

      if (shouldStickToBottom) {
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
        return;
      }

      const delta = el.scrollHeight - prevHeight;
      el.scrollTop = prevTop + delta;
    });
  }, []);

  const saveCurrentConversationScroll = useCallback(() => {
    if (!activeFriendId || !messageListRef.current) return;
    scrollByConversationRef.current[activeFriendId] = messageListRef.current.scrollTop;
  }, [activeFriendId]);

  const loadConversations = useCallback(async () => {
    try {
      const data = await messagesApi.conversations();
      setConversations(data);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    return () => {
      saveCurrentConversationScroll();
    };
  }, [saveCurrentConversationScroll]);

  useEffect(() => {
    setEditingMessageId(null);
    setEditContent("");

    if (!activeFriendId) {
      setMessages([]);
      return;
    }

    messagesApi
      .getMessages(activeFriendId)
      .then((data) => {
        setMessages(data);
        window.requestAnimationFrame(() => {
          const el = messageListRef.current;
          if (!el) return;
          const saved = scrollByConversationRef.current[activeFriendId];
          el.scrollTop = typeof saved === "number" ? saved : 0;
        });
      })
      .catch(() => setMessages([]));

    messagesApi.markRead(activeFriendId).then(() => {
      setConversations((prev) =>
        prev.map((c) => (c.friendId === activeFriendId ? { ...c, unreadCount: 0 } : c))
      );
    });
  }, [activeFriendId]);

  const handleIncoming = useCallback(
    (msg: MessageDto) => {
      setConversations((prev) => {
        const exists = prev.find((c) => c.friendId === msg.senderId || c.friendId === msg.receiverId);
        const friendId = msg.senderId === user?.id ? msg.receiverId : msg.senderId;

        if (exists) {
          return prev
            .map((c) =>
              c.friendId === friendId
                ? {
                    ...c,
                    lastMessage: msg.content,
                    lastMessageAt: msg.sentAt,
                    unreadCount:
                      friendId === activeFriendId ? 0 : c.unreadCount + (msg.senderId !== user?.id ? 1 : 0),
                  }
                : c
            )
            .sort((a, b) => (b.lastMessageAt ?? "").localeCompare(a.lastMessageAt ?? ""));
        }

        loadConversations();
        return prev;
      });

      const inActiveConversation = msg.senderId === activeFriendId || msg.receiverId === activeFriendId;
      if (!inActiveConversation) return;

      const prevTop = messageListRef.current?.scrollTop ?? 0;
      const prevHeight = messageListRef.current?.scrollHeight ?? 0;
      const shouldStickToBottom = isNearBottom();

      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });

      preserveOrStick(prevTop, prevHeight, shouldStickToBottom);

      if (msg.senderId === activeFriendId) {
        messagesApi.markRead(activeFriendId);
      }
    },
    [activeFriendId, isNearBottom, loadConversations, preserveOrStick, user?.id]
  );

  useChatHub(handleIncoming);

  const activeName =
    conversations.find((c) => c.friendId === activeFriendId)?.friendUsername ??
    (activeFriendId ? `User #${activeFriendId}` : "");

  const filteredConversations = conversations.filter((c) =>
    c.friendUsername.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openConversation = (friendId: number) => {
    saveCurrentConversationScroll();
    setActiveFriendId(friendId);
  };

  const closeConversationOnMobile = () => {
    saveCurrentConversationScroll();
    setActiveFriendId(null);
  };

  const handleSend = async () => {
    if (!activeFriendId || !input.trim() || sending) return;

    const content = input.trim();
    const prevTop = messageListRef.current?.scrollTop ?? 0;
    const prevHeight = messageListRef.current?.scrollHeight ?? 0;
    const shouldStickToBottom = isNearBottom();

    setInput("");
    setSending(true);

    try {
      const msg = await messagesApi.send(activeFriendId, content);

      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      setConversations((prev) =>
        prev
          .map((c) =>
            c.friendId === activeFriendId
              ? { ...c, lastMessage: msg.content, lastMessageAt: msg.sentAt }
              : c
          )
          .sort((a, b) => (b.lastMessageAt ?? "").localeCompare(a.lastMessageAt ?? ""))
      );

      preserveOrStick(prevTop, prevHeight, shouldStickToBottom);
    } catch {
      setInput(content);
    } finally {
      setSending(false);
    }
  };

  const startEdit = (msg: MessageDto) => {
    setEditingMessageId(msg.id);
    setEditContent(msg.content);
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditContent("");
  };

  const saveEdit = async (messageId: number) => {
    const trimmed = editContent.trim();
    if (!trimmed || savingEdit) return;

    const prevTop = messageListRef.current?.scrollTop ?? 0;
    const prevHeight = messageListRef.current?.scrollHeight ?? 0;
    const shouldStickToBottom = isNearBottom();

    setSavingEdit(true);
    try {
      const updated = await messagesApi.updateMessage(messageId, trimmed);
      setMessages((prev) => prev.map((m) => (m.id === messageId ? updated : m)));
      preserveOrStick(prevTop, prevHeight, shouldStickToBottom);
      cancelEdit();
    } finally {
      setSavingEdit(false);
    }
  };

  const deleteMessage = async (messageId: number) => {
    const prevTop = messageListRef.current?.scrollTop ?? 0;
    const prevHeight = messageListRef.current?.scrollHeight ?? 0;
    const shouldStickToBottom = isNearBottom();
    const previousMessages = messages;

    setDeletingMessageIds((prev) => new Set(prev).add(messageId));
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    preserveOrStick(prevTop, prevHeight, shouldStickToBottom);

    try {
      await messagesApi.deleteMessage(messageId);
    } catch {
      setMessages(previousMessages);
      preserveOrStick(prevTop, prevHeight, shouldStickToBottom);
      console.error("Failed to delete message.");
    } finally {
      setDeletingMessageIds((prev) => {
        const next = new Set(prev);
        next.delete(messageId);
        return next;
      });
      if (editingMessageId === messageId) {
        cancelEdit();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void handleSend();
  };

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <div className="h-[calc(100vh-64px)] min-h-0">
      <div className="h-full flex min-h-0 overflow-hidden">
        <div
          className={`${activeFriendId ? "hidden md:flex" : "flex"} w-full md:w-[320px] shrink-0 border-r border-border flex-col min-h-0`}
        >
          <div className="p-4 border-b border-border shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <h1 className="text-lg font-semibold text-foreground">Messages</h1>
              {totalUnread > 0 && <Badge className="h-5 min-w-5 px-1.5 text-xs">{totalUnread}</Badge>}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2 p-6">
                <MessageCircle className="w-10 h-10 opacity-30" />
                <p className="text-sm text-center">No conversations yet. Start by messaging a friend.</p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <button
                  key={conv.friendId}
                  onClick={() => openConversation(conv.friendId)}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors border-b border-border/50 ${
                    activeFriendId === conv.friendId ? "bg-muted" : ""
                  }`}
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
                    {conv.friendUsername.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="font-medium text-foreground truncate text-sm">{conv.friendUsername}</p>
                      {conv.lastMessageAt && (
                        <p className="text-xs text-muted-foreground shrink-0">
                          {formatDate(conv.lastMessageAt) === "Today"
                            ? formatTime(conv.lastMessageAt)
                            : formatDate(conv.lastMessageAt)}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {conv.lastMessage ?? "No messages yet"}
                    </p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <Badge className="h-5 min-w-5 px-1.5 text-xs shrink-0 self-center">
                      {conv.unreadCount}
                    </Badge>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        <div className={`${activeFriendId ? "flex" : "hidden md:flex"} flex-1 flex-col min-w-0 min-h-0`}>
          {activeFriendId ? (
            <>
              <div className="px-4 md:px-6 py-2.5 border-b border-border flex items-center gap-2.5 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={closeConversationOnMobile}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-xs">
                  {activeName.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">{activeName}</p>
                  <p className="text-xs text-muted-foreground">Friend</p>
                </div>
              </div>

              <div ref={messageListRef} className="flex-1 overflow-y-auto min-h-0 px-4 md:px-6 py-4 space-y-1">
                <AnimatePresence initial={false}>
                  {messages.map((msg, i) => {
                    const isMine = msg.senderId === user?.id;
                    const sep = dateSeparator(messages[i - 1], msg);
                    const isEditing = editingMessageId === msg.id;
                    const deleting = deletingMessageIds.has(msg.id);

                    return (
                      <div key={msg.id}>
                        {sep && (
                          <div className="flex items-center gap-2 my-3">
                            <div className="flex-1 h-px bg-border" />
                            <span className="text-xs text-muted-foreground">{sep}</span>
                            <div className="flex-1 h-px bg-border" />
                          </div>
                        )}

                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`group flex ${isMine ? "justify-end" : "justify-start"} mb-1`}
                        >
                          <div className={`flex items-start gap-1.5 ${isMine ? "flex-row-reverse" : ""}`}>
                            {isMine && !isEditing && (
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-1 flex items-center gap-0.5">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => startEdit(msg)}
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive"
                                  onClick={() => deleteMessage(msg.id)}
                                  disabled={deleting}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            )}

                            <div
                              className={`max-w-[420px] md:max-w-[520px] px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
                                isMine
                                  ? "bg-primary text-primary-foreground rounded-br-sm"
                                  : "bg-muted text-foreground rounded-bl-sm"
                              } ${deleting ? "opacity-50" : ""}`}
                            >
                              {isEditing ? (
                                <div className="space-y-2">
                                  <Input
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    maxLength={2000}
                                    autoFocus
                                    className="bg-background text-foreground"
                                  />
                                  <div className="flex justify-end gap-1">
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-7 w-7"
                                      onClick={cancelEdit}
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-7 w-7"
                                      onClick={() => saveEdit(msg.id)}
                                      disabled={!editContent.trim() || savingEdit}
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                                  <p
                                    className={`text-[10px] mt-0.5 ${
                                      isMine
                                        ? "text-primary-foreground/70 text-right"
                                        : "text-muted-foreground"
                                    }`}
                                  >
                                    {formatTime(msg.sentAt)}
                                    {msg.editedAt && " | edited"}
                                  </p>
                                </>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    );
                  })}
                </AnimatePresence>
              </div>

              <form className="px-4 md:px-6 py-3 border-t border-border shrink-0" onSubmit={handleSubmit}>
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Message ${activeName}...`}
                    maxLength={2000}
                    className="flex-1"
                  />
                  <Button type="submit" size="icon" disabled={!input.trim() || sending}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="hidden md:flex flex-1 min-h-0 flex-col items-center justify-center text-muted-foreground gap-3 px-4 text-center">
              <MessageCircle className="w-14 h-14 opacity-20" />
              <p className="text-lg font-medium">Select a conversation</p>
              <p className="text-sm">Choose a friend from the list to start chatting.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
