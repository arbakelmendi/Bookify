import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { loginUser as apiLoginUser, registerUser as apiRegisterUser, getCurrentUser, logoutUser as apiLogoutUser, getStoredToken } from "@/api/auth";
import type { User } from "@/types/auth";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  refreshMe: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (username: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount if token exists
  useEffect(() => {
    const restoreSession = async () => {
      await refreshMe();
    };

    restoreSession();
  }, []);

  const refreshMe = async () => {
    const token = getStoredToken();

    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error("Failed to restore session:", error);
      // Token is invalid or expired, clear it
      apiLogoutUser();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      const response = await apiLoginUser(email, password);

      setUser(response.user);
      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Login failed. Please try again."
      };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (username: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      await apiRegisterUser(email, username, password);

      // Auto-login after successful registration
      return await login(email, password);
    } catch (error) {
      console.error("Signup error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Signup failed. Please try again."
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    apiLogoutUser();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role === "admin",
        loading,
        refreshMe,
        login,
        signup,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
