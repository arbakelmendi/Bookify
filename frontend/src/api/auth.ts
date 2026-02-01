import { apiGet, apiPost } from "./client";
import type { LoginRequest, LoginResponse, RegisterRequest, User } from "@/types/auth";

const TOKEN_KEY = "bookify_auth_token";

export async function loginUser(email: string, password: string): Promise<LoginResponse> {
  const request: LoginRequest = { email, password };
  const response = await apiPost<LoginResponse>("/api/auth/login", request);

  // Store token in localStorage
  if (response.token) {
    localStorage.setItem(TOKEN_KEY, response.token);
  }

  return response;
}

export async function registerUser(
  email: string,
  username: string,
  password: string
): Promise<{ message: string }> {
  const request: RegisterRequest = { email, username, password };
  return apiPost<{ message: string }>("/api/auth/register", request);
}

export async function getCurrentUser(): Promise<User> {
  return apiGet<User>("/api/auth/me");
}

export function logoutUser(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
