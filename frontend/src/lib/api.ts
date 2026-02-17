import axios, { AxiosHeaders } from "axios";

const TOKEN_KEY = "bookify_auth_token";
const BASE_URL = import.meta.env.DEV ? "" : (import.meta.env.VITE_API_BASE_URL ?? "");

export const api = axios.create({
  baseURL: BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);

  if (token) {
    // Axios v1 expects AxiosHeaders (not plain object)
    if (!config.headers) {
      config.headers = new AxiosHeaders();
    }

    // If it's AxiosHeaders, use .set()
    if (config.headers instanceof AxiosHeaders) {
      config.headers.set("Authorization", `Bearer ${token}`);
    } else {
      // fallback if some other code set headers as plain object
      (config.headers as any)["Authorization"] = `Bearer ${token}`;
    }
  }

  return config;
});
