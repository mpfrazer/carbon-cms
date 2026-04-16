import { redirect } from "next/navigation";

// Root redirects to admin. The public-facing frontend lives here in Phase 2.
export default function RootPage() {
  redirect("/admin");
}
