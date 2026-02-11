const BASE_URL = import.meta.env.DEV
  ? ""
  : (import.meta.env.VITE_API_BASE_URL ?? "");

const TOKEN_KEY = "bookify_auth_token";

/* ================================
   AUTH HEADERS
================================ */

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem(TOKEN_KEY);

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

/* ================================
   BUILD URL WITH QUERY PARAMS
================================ */

function buildUrl(path: string, params?: Record<string, any>): string {
  const url = new URL(`${BASE_URL}${path}`, window.location.origin);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (
        value === undefined ||
        value === null ||
        value === "" ||
        (typeof value === "number" && isNaN(value))
      ) {
        return;
      }

      url.searchParams.set(key, String(value));
    });
  }

  // Return relative path (important for dev mode)
  return url.pathname + url.search;
}

/* ================================
   RESPONSE HANDLER
================================ */

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      window.location.href = "/login";
      throw new Error("Session expired. Please login again.");
    }

    const text = await response.text();
    let errorMessage = `HTTP ${response.status}: ${text}`;

    try {
      const json = JSON.parse(text);
      errorMessage = json.message || errorMessage;
    } catch {
      // not JSON
    }

    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

/* ================================
   HTTP METHODS
================================ */

export async function apiGet<T>(
  path: string,
  params?: Record<string, any>
): Promise<T> {
  const response = await fetch(buildUrl(path, params), {
    method: "GET",
    headers: getAuthHeaders(),
  });

  return handleResponse<T>(response);
}

export async function apiPost<T>(
  path: string,
  body?: unknown
): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });

  return handleResponse<T>(response);
}

export async function apiPut<T>(
  path: string,
  body?: unknown
): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });

  return handleResponse<T>(response);
}

export async function apiDelete<T>(
  path: string
): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  return handleResponse<T>(response);
}
