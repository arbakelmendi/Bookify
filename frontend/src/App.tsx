import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import ScrollToTop from "@/components/ScrollToTop";

import Discover from "@/pages/Discover";
import Library from "@/pages/Library";
import Dashboard from "@/pages/Dashboard";
import Friends from "@/pages/Friends";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Admin from "@/pages/Admin";
import BookDetail from "@/pages/BookDetail";
import BookAudio from "@/pages/BookAudio";
import FriendProfile from "@/pages/FriendProfile";
import NotFound from "@/pages/NotFound";
import ImportBook from "@/pages/ImportBook";
import BookReader from "@/pages/BookReader";
import GiftsInbox from "@/pages/GiftsInbox";   // ✅ NEW
import Messages from "@/pages/Messages";

import { api } from "@/lib/api";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    api
      .get("/api/Auth/me")
      .then((r) => console.log("OK", r.data))
      .catch((e) => console.log("ERR", e.response?.status));
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <AuthProvider>
            <div className="min-h-screen bg-background flex flex-col">
              <Navbar />
              <main className="flex-1">
                <Routes>

                  {/* Public */}
                  <Route path="/" element={<Discover />} />
                  <Route path="/import" element={<ImportBook />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />

                  {/* Protected */}
                  <Route
                    path="/library"
                    element={
                      <ProtectedRoute>
                        <Library />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/friends"
                    element={
                      <ProtectedRoute>
                        <Friends />
                      </ProtectedRoute>
                    }
                  />

                  {/* ✅ NEW: Gifts Inbox */}
                  <Route
                    path="/gifts"
                    element={
                      <ProtectedRoute>
                        <GiftsInbox />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/books/:id"
                    element={
                      <ProtectedRoute>
                        <BookDetail />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/books/:id/read"
                    element={
                      <ProtectedRoute>
                        <BookReader />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/books/:id/audio"
                    element={
                      <ProtectedRoute>
                        <BookAudio />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/messages"
                    element={
                      <ProtectedRoute>
                        <Messages />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/friend/:id"
                    element={
                      <ProtectedRoute>
                        <FriendProfile />
                      </ProtectedRoute>
                    }
                  />

                  {/* Admin */}
                  <Route
                    path="/admin"
                    element={
                      <AdminRoute>
                        <Admin />
                      </AdminRoute>
                    }
                  />

                  {/* 404 */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
