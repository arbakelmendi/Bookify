import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface AppUser {
  id: string;
  username: string;
  email: string;
  role: "user" | "admin";
  createdAt: string;
  status: "active" | "suspended";
}

interface AuthContextType {
  user: AppUser | null;
  users: AppUser[];
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (username: string, password: string) => { success: boolean; error?: string };
  signup: (username: string, email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  updateUser: (userId: string, updates: Partial<AppUser>) => void;
  deleteUser: (userId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Admin credentials
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin123";

// Storage keys
const USERS_STORAGE_KEY = "bookify_users";
const CURRENT_USER_KEY = "bookify_current_user";
const CREDENTIALS_KEY = "bookify_credentials";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [users, setUsers] = useState<AppUser[]>([]);

  // Load users and current user from localStorage on mount
  useEffect(() => {
    const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
    const storedUser = localStorage.getItem(CURRENT_USER_KEY);
    
    if (storedUsers) {
      setUsers(JSON.parse(storedUsers));
    }
    
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Save users to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }, [users]);

  const login = (username: string, password: string): { success: boolean; error?: string } => {
    // Check for admin login
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const adminUser: AppUser = {
        id: "admin-1",
        username: ADMIN_USERNAME,
        email: "admin@bookify.com",
        role: "admin",
        createdAt: new Date().toISOString(),
        status: "active"
      };
      setUser(adminUser);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(adminUser));
      return { success: true };
    }

    // Check stored credentials
    const storedCredentials = localStorage.getItem(CREDENTIALS_KEY);
    const credentials: Record<string, string> = storedCredentials ? JSON.parse(storedCredentials) : {};
    
    if (credentials[username] && credentials[username] === password) {
      const foundUser = users.find(u => u.username === username);
      if (foundUser) {
        if (foundUser.status === "suspended") {
          return { success: false, error: "Your account has been suspended." };
        }
        setUser(foundUser);
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(foundUser));
        return { success: true };
      }
    }

    return { success: false, error: "Invalid username or password." };
  };

  const signup = (username: string, email: string, password: string): { success: boolean; error?: string } => {
    // Check if username already exists
    if (username === ADMIN_USERNAME || users.some(u => u.username === username)) {
      return { success: false, error: "Username already taken." };
    }

    // Check if email already exists
    if (users.some(u => u.email === email)) {
      return { success: false, error: "Email already registered." };
    }

    // Create new user
    const newUser: AppUser = {
      id: `user-${Date.now()}`,
      username,
      email,
      role: "user",
      createdAt: new Date().toISOString(),
      status: "active"
    };

    // Store credentials
    const storedCredentials = localStorage.getItem(CREDENTIALS_KEY);
    const credentials: Record<string, string> = storedCredentials ? JSON.parse(storedCredentials) : {};
    credentials[username] = password;
    localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials));

    // Add user to list
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    
    // Auto-login the new user
    setUser(newUser);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));

    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(CURRENT_USER_KEY);
  };

  const updateUser = (userId: string, updates: Partial<AppUser>) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
  };

  const deleteUser = (userId: string) => {
    const userToDelete = users.find(u => u.id === userId);
    if (userToDelete) {
      // Remove credentials
      const storedCredentials = localStorage.getItem(CREDENTIALS_KEY);
      const credentials: Record<string, string> = storedCredentials ? JSON.parse(storedCredentials) : {};
      delete credentials[userToDelete.username];
      localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials));
    }
    
    setUsers(prev => prev.filter(u => u.id !== userId));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        users,
        isAuthenticated: !!user,
        isAdmin: user?.role === "admin",
        login,
        signup,
        logout,
        updateUser,
        deleteUser
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
