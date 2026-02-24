export interface User {
  id: number;
  email: string;
  username: string;
  role: "user" | "admin";
  bio?: string | null;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}
