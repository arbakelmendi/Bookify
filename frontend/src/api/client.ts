const BASE_URL = import.meta.env.DEV
  ? ""
  : (import.meta.env.VITE_API_BASE_URL ?? "");

const TOKEN_KEY = "bookify_auth_token";

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem(TOKEN_KEY);

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function buildUrl(path: string, params?: Record<string, any>): string {
  const url = new URL(`${BASE_URL}${path}`, window.location.origin);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (
        value === undefined ||
        value === null ||
        value === "" ||
        (typeof value === "number" && isNaN(value))
      ) return;

      url.searchParams.set(key, String(value));
    });
  }

  return url.pathname + url.search;
}

async function extractErrorMessage(response: Response): Promise<string> {
  // try json first
  try {
    const data = await response.clone().json();
    if (data?.message) return String(data.message);
    if (data?.error) return String(data.error);
  } catch {
    // ignore
  }

  // fallback to text
  try {
    const text = (await response.clone().text()).trim();
    if (text) return text;
  } catch {
    // ignore
  }

  // last resort generic
  return "Request failed.";
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      window.location.href = "/login";
      throw new Error("Session expired. Please login again.");
    }

    const msg = await extractErrorMessage(response);
    // ✅ never prefix with HTTP 403:
    throw new Error(msg);
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

export async function apiGet<T>(path: string, params?: Record<string, any>): Promise<T> {
  const response = await fetch(buildUrl(path, params), {
    method: "GET",
    headers: getAuthHeaders(),
  });
  return handleResponse<T>(response);
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(response);
}

export async function apiPut<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(response);
}

export async function apiDelete<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  return handleResponse<T>(response);
}
