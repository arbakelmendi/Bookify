const BASE_URL = import.meta.env.DEV ? "" : (import.meta.env.VITE_API_BASE_URL ?? "");

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  return response.json();
}
