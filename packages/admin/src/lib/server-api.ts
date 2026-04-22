import { auth } from "@/lib/auth";

const apiUrl = process.env.CARBON_API_URL ?? "http://localhost:3001";
const internalSecret = process.env.CARBON_INTERNAL_SECRET ?? "";

// Used in server components to call the API as the current authenticated user.
// Passes the internal secret so the API trusts the call without re-verifying JWT.
export async function serverFetch(path: string, options?: RequestInit): Promise<Response> {
  const session = await auth();

  return fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers as Record<string, string>),
      "X-Carbon-Internal": internalSecret,
      "X-Carbon-User-Id": session?.user?.id ?? "",
      "X-Carbon-User-Role": (session?.user as { role?: string })?.role ?? "author",
    },
  });
}

export async function serverGet<T>(path: string): Promise<T> {
  const res = await serverFetch(path);
  if (!res.ok) throw new Error(`API error ${res.status} for ${path}`);
  const json = await res.json();
  return json.data ?? json;
}
