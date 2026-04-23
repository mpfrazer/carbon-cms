const API_URL = process.env.CARBON_API_URL ?? "http://localhost:3001";

async function apiFetch(path: string, init: RequestInit = {}): Promise<unknown> {
  const url = `${API_URL}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.AUTH_SECRET}`,
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` })) as { error?: string };
    throw new Error(body.error ?? `API ${res.status}`);
  }
  return res.json();
}

export const serverGet = (path: string) => apiFetch(path);
