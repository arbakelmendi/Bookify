import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search,
  BookOpen,
  Menu,
  X,
  LogIn,
  LogOut,
  User,
  Shield,
  Gift,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { getInboxRecommendations } from "@/api/recommendations";
import { friendsApi } from "@/api/friends";
import { messagesApi } from "@/api/messages";

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [giftCount, setGiftCount] = useState<number>(0);
  const [friendRequestCount, setFriendRequestCount] = useState<number>(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState<number>(0);

  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();

  // Dynamic nav links based on authentication and role
  const navLinks = useMemo(() => {
    const links: { name: string; path: string }[] = [{ name: "Discover", path: "/" }];

    if (isAuthenticated) {
      links.push(
        { name: "My Library", path: "/library" },
        { name: "Progress", path: "/dashboard" },
        { name: "Friends", path: "/friends" },
        { name: "Messages", path: "/messages" },
        { name: "Gifts", path: "/gifts" }
      );
    }

    return links;
  }, [isAuthenticated]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get("q") ?? "";
    setSearchQuery(q);
  }, [location.search]);

  // ✅ load gifts count (simple: inbox length)
  useEffect(() => {
    if (!isAuthenticated) {
      setGiftCount(0);
      setFriendRequestCount(0);
      setUnreadMessageCount(0);
      return;
    }

    let active = true;

    const load = async () => {
      try {
        const [inbox, incomingCount, conversations] = await Promise.all([
          getInboxRecommendations(),
          friendsApi.incomingCount(),
          messagesApi.conversations(),
        ]);
        if (!active) return;
        setGiftCount(Array.isArray(inbox) ? inbox.length : 0);
        setFriendRequestCount(Number(incomingCount?.count ?? 0));
        setUnreadMessageCount(
          Array.isArray(conversations)
            ? conversations.reduce((s: number, c: { unreadCount: number }) => s + c.unreadCount, 0)
            : 0
        );
      } catch {
        if (!active) return;
        setGiftCount(0);
        setFriendRequestCount(0);
        setUnreadMessageCount(0);
      }
    };

    load();
    const onFriendRefresh = () => {
      void load();
    };
    const onMessagesRefresh = () => {
      void load();
    };
    window.addEventListener("friends:incoming-count-refresh", onFriendRefresh);
    window.addEventListener("messages:unread-count-refresh", onMessagesRefresh);
    const t = window.setInterval(load, 15000); // refresh every 15s
    return () => {
      active = false;
      window.removeEventListener("friends:incoming-count-refresh", onFriendRefresh);
      window.removeEventListener("messages:unread-count-refresh", onMessagesRefresh);
      window.clearInterval(t);
    };
  }, [isAuthenticated]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleSearchSubmit = () => {
    const query = searchQuery.trim();
    if (query.length > 0) {
      navigate(`/?q=${encodeURIComponent(query)}`);
    } else {
      navigate("/");
    }
    setIsOpen(false);
  };

  const handleSearchSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearchSubmit();
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-display font-bold text-foreground">
              Bookify
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              const isGifts = link.path === "/gifts";
              const isFriends = link.path === "/friends";
              const isMessages = link.path === "/messages";

              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`nav-link relative py-1 text-sm font-medium transition-colors ${
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    {isGifts && <Gift className="w-4 h-4" />}
                    {isMessages && <MessageCircle className="w-4 h-4" />}
                    {link.name}

                    {isGifts && isAuthenticated && giftCount > 0 && (
                      <span className="ml-1 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[11px] leading-none">
                        {giftCount > 99 ? "99+" : giftCount}
                      </span>
                    )}
                    {isFriends && isAuthenticated && friendRequestCount > 0 && (
                      <span className="ml-1 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[11px] leading-none">
                        {friendRequestCount > 99 ? "99+" : friendRequestCount}
                      </span>
                    )}
                    {isMessages && isAuthenticated && unreadMessageCount > 0 && (
                      <span className="ml-1 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[11px] leading-none">
                        {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
                      </span>
                    )}
                  </span>

                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full"
                    />
                  )}
                </Link>
              );
            })}

            {isAdmin && (
              <Link
                to="/admin"
                className={`nav-link relative py-1 text-sm font-medium transition-colors flex items-center gap-1 ${
                  location.pathname === "/admin"
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Shield className="w-4 h-4" />
                Admin
                {location.pathname === "/admin" && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full"
                  />
                )}
              </Link>
            )}
          </div>

          {/* Search & Actions */}
          <div className="hidden md:flex items-center gap-4">
            <form className="relative" onSubmit={handleSearchSubmitForm}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search books..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64 bg-muted/50"
              />
            </form>

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <User className="w-4 h-4" />
                    {user?.username ?? "User"}
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                    Signed in as {user?.email}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={() => navigate("/gifts")}>
                    <Gift className="w-4 h-4 mr-2" />
                    Gifts
                    {giftCount > 0 && (
                      <span className="ml-auto inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[11px] leading-none">
                        {giftCount > 99 ? "99+" : giftCount}
                      </span>
                    )}
                  </DropdownMenuItem>

                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate("/admin")}>
                        <Shield className="w-4 h-4 mr-2" />
                        Admin Dashboard
                      </DropdownMenuItem>
                    </>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => navigate("/login")}>
                  Login
                </Button>
                <Button onClick={() => navigate("/signup")}>
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign Up
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden py-4 border-t border-border"
          >
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                const isGifts = link.path === "/gifts";
                const isFriends = link.path === "/friends";
                const isMessages = link.path === "/messages";

                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsOpen(false)}
                    className={`py-2 text-sm font-medium flex items-center justify-between ${
                      isActive ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      {isGifts && <Gift className="w-4 h-4" />}
                      {isMessages && <MessageCircle className="w-4 h-4" />}
                      {link.name}
                    </span>

                    {isGifts && isAuthenticated && giftCount > 0 && (
                      <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[11px] leading-none">
                        {giftCount > 99 ? "99+" : giftCount}
                      </span>
                    )}
                    {isFriends && isAuthenticated && friendRequestCount > 0 && (
                      <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[11px] leading-none">
                        {friendRequestCount > 99 ? "99+" : friendRequestCount}
                      </span>
                    )}
                    {isMessages && isAuthenticated && unreadMessageCount > 0 && (
                      <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[11px] leading-none">
                        {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
                      </span>
                    )}
                  </Link>
                );
              })}

              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setIsOpen(false)}
                  className={`py-2 text-sm font-medium flex items-center gap-2 ${
                    location.pathname === "/admin"
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  Admin
                </Link>
              )}

              <form className="relative mt-2" onSubmit={handleSearchSubmitForm}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search books..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-muted/50"
                />
              </form>

              <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-border">
                {isAuthenticated ? (
                  <>
                    <div className="text-sm text-muted-foreground px-2">
                      Signed in as{" "}
                      <span className="font-medium text-foreground">
                        {user?.username}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleLogout}
                      className="w-full"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigate("/login");
                        setIsOpen(false);
                      }}
                      className="w-full"
                    >
                      Sign In
                    </Button>
                    <Button
                      onClick={() => {
                        navigate("/signup");
                        setIsOpen(false);
                      }}
                      className="w-full"
                    >
                      <LogIn className="w-4 h-4 mr-2" />
                      Sign Up
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </nav>
  );
};
