import { RegisterForm } from "@/components/register-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="mb-8 text-2xl font-bold text-neutral-900">Create account</h1>
      <RegisterForm />
    </div>
  );
}
