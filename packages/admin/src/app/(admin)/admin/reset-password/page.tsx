import { Suspense } from "react";
import { ResetPasswordForm } from "./reset-password-form";

export default function Page() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
