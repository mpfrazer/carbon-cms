const apiUrl = process.env.CARBON_API_URL ?? "http://localhost:3001";
const internalSecret = process.env.CARBON_INTERNAL_SECRET ?? "";

export async function apiFetch(path: string): Promise<Response> {
  return fetch(`${apiUrl}${path}`, {
    headers: { "X-Carbon-Internal": internalSecret },
    next: { revalidate: 60 },
  });
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await apiFetch(path);
  if (!res.ok) throw new Error(`API error ${res.status} for ${path}`);
  return res.json();
}
