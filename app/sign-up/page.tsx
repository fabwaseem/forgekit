import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="grid min-h-dvh place-items-center text-sm text-muted-foreground">Loading…</div>}>
      <AuthForm mode="sign-up" />
    </Suspense>
  );
}
