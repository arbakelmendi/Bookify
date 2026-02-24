import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MessageCircle, Search } from "lucide-react";
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
  const [searchParams, setSearchParams] = useSearchParams();
  const userParam = searchParams.get("user");
  const friendParam = searchParams.get("friend");
  const activeFriendId = userParam
    ? Number(userParam)
    : friendParam
      ? Number(friendParam)
      : null;

  const [conversations, setConversations] = useState<ConversationSummaryDto[]>([]);
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () =>
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  // Load conversations
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

  // Load messages when active friend changes
  useEffect(() => {
    if (!activeFriendId) { setMessages([]); return; }

    messagesApi.getMessages(activeFriendId).then(data => {
      setMessages(data);
      setTimeout(scrollToBottom, 50);
    }).catch(() => setMessages([]));

    messagesApi.markRead(activeFriendId).then(() => {
      setConversations(prev =>
        prev.map(c => c.friendId === activeFriendId ? { ...c, unreadCount: 0 } : c)
      );
    });
  }, [activeFriendId]);

  // Real-time incoming messages via SignalR
  const handleIncoming = useCallback((msg: MessageDto) => {
    // Update conversation list
    setConversations(prev => {
      const exists = prev.find(c => c.friendId === msg.senderId || c.friendId === msg.receiverId);
      const friendId = msg.senderId === user?.id ? msg.receiverId : msg.senderId;
      if (exists) {
        return prev.map(c =>
          c.friendId === friendId
            ? {
                ...c,
                lastMessage: msg.content,
                lastMessageAt: msg.sentAt,
                unreadCount: friendId === activeFriendId ? 0 : c.unreadCount + (msg.senderId !== user?.id ? 1 : 0),
              }
            : c
        ).sort((a, b) =>
          (b.lastMessageAt ?? "").localeCompare(a.lastMessageAt ?? "")
        );
      }
      // New conversation — reload
      loadConversations();
      return prev;
    });

    // If currently viewing this conversation, append message
    const inActiveConv =
      msg.senderId === activeFriendId || msg.receiverId === activeFriendId;
    if (inActiveConv) {
      setMessages(prev => {
        // Avoid duplicates (REST send + SignalR echo)
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      setTimeout(scrollToBottom, 50);
      // Mark read immediately if it's incoming
      if (msg.senderId === activeFriendId) {
        messagesApi.markRead(activeFriendId);
      }
    }
  }, [activeFriendId, user?.id, loadConversations]);

  useChatHub(handleIncoming);

  const activeName = conversations.find(c => c.friendId === activeFriendId)?.friendUsername
    ?? (activeFriendId ? `User #${activeFriendId}` : "");

  const filteredConversations = conversations.filter(c =>
    c.friendUsername.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSend = async () => {
    if (!activeFriendId || !input.trim() || sending) return;
    const content = input.trim();
    setInput("");
    setSending(true);
    try {
      // Send via REST — always saves to DB even if receiver is offline
      const msg = await messagesApi.send(activeFriendId, content);
      // Immediately show in sender's own view
      setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
      // Update conversation list
      setConversations(prev =>
        prev.map(c =>
          c.friendId === activeFriendId
            ? { ...c, lastMessage: msg.content, lastMessageAt: msg.sentAt }
            : c
        ).sort((a, b) => (b.lastMessageAt ?? "").localeCompare(a.lastMessageAt ?? ""))
      );
      setTimeout(scrollToBottom, 50);
    } catch {
      setInput(content); // restore on failure
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const totalUnread = conversations.reduce((s, c) => s + c.unreadCount, 0);

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      <div className="flex flex-1 overflow-hidden">
        {/* ── Left panel: conversation list ── */}
        <div className="w-full md:w-80 lg:w-96 border-r border-border flex flex-col shrink-0">
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2 mb-3">
              <h1 className="text-xl font-semibold text-foreground">Messages</h1>
              {totalUnread > 0 && (
                <Badge className="h-5 min-w-5 px-1.5 text-xs">{totalUnread}</Badge>
              )}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2 p-6">
                <MessageCircle className="w-10 h-10 opacity-30" />
                <p className="text-sm text-center">No conversations yet. Start by messaging a friend.</p>
              </div>
            ) : (
              filteredConversations.map(conv => (
                <button
                  key={conv.friendId}
                  onClick={() => setSearchParams({ user: String(conv.friendId) })}
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

        {/* ── Right panel: chat ── */}
        <div className="flex-1 flex flex-col min-w-0">
          {activeFriendId ? (
            <>
              {/* Chat header */}
              <div className="px-5 py-3 border-b border-border flex items-center gap-3 shrink-0">
                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
                  {activeName.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-foreground">{activeName}</p>
                  <p className="text-xs text-muted-foreground">Friend</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
                <AnimatePresence initial={false}>
                  {messages.map((msg, i) => {
                    const isMine = msg.senderId === user?.id;
                    const sep = dateSeparator(messages[i - 1], msg);
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
                          className={`flex ${isMine ? "justify-end" : "justify-start"} mb-1`}
                        >
                          <div
                            className={`max-w-[70%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
                              isMine
                                ? "bg-primary text-primary-foreground rounded-br-sm"
                                : "bg-muted text-foreground rounded-bl-sm"
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                            <p className={`text-[10px] mt-0.5 ${isMine ? "text-primary-foreground/70 text-right" : "text-muted-foreground"}`}>
                              {formatTime(msg.sentAt)}
                            </p>
                          </div>
                        </motion.div>
                      </div>
                    );
                  })}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="px-4 py-3 border-t border-border shrink-0">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Message ${activeName}...`}
                    maxLength={2000}
                    className="flex-1"
                  />
                  <Button
                    size="icon"
                    onClick={handleSend}
                    disabled={!input.trim() || sending}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
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
