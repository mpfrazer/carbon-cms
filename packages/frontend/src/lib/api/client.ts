const API_URL = process.env.CARBON_API_URL ?? "http://localhost:3001";

export async function apiGet(path: string): Promise<unknown> {
  const url = `${API_URL}${path}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`API error ${res.status} for ${path}`);
  return res.json();
}

// For server-side calls to protected endpoints. Uses the internal AUTH_SECRET
// bearer token that the API proxy accepts to bypass rate limiting and auth.
export async function serverApiGet(path: string): Promise<unknown> {
  const url = `${API_URL}${path}`;
  const res = await fetch(url, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${process.env.AUTH_SECRET}` },
  });
  if (!res.ok) throw new Error(`API error ${res.status} for ${path}`);
  return res.json();
}
