import { LoginForm } from "@/components/login-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="mb-8 text-2xl font-bold text-neutral-900">Sign in</h1>
      <LoginForm />
    </div>
  );
}
