import axios from "axios";

const TOKEN_KEY = "bookify_auth_token";
const BASE_URL = import.meta.env.DEV ? "" : (import.meta.env.VITE_API_BASE_URL ?? "");

export const api = axios.create({
  baseURL: BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);

  if (token) {
    // Axios v1: headers is AxiosHeaders
    config.headers?.set("Authorization", `Bearer ${token}`);
  }

  return config;
});
