"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Mark } from "@/components/mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/chat";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [github, setGithub] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    void fetch("/api/models")
      .then((response) => response.json())
      .then((body: { githubAuth?: boolean }) => setGithub(Boolean(body.githubAuth)))
      .catch(() => setGithub(false));
  }, []);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    const result =
      mode === "sign-up"
        ? await authClient.signUp.email({ name, email, password, callbackURL: next })
        : await authClient.signIn.email({ email, password, callbackURL: next });
    setPending(false);
    if (result.error) {
      toast.error(result.error.message ?? "Authentication failed");
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <div className="relative grid min-h-dvh place-items-center px-5 py-16">
      <div className="absolute top-5 right-5">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center gap-2.5">
          <Mark />
          <span className="font-heading text-2xl">Forgekit</span>
        </Link>
        <h1 className="text-4xl tracking-tight">
          {mode === "sign-in" ? "Welcome back." : "Create your workspace."}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Email and password are built in. GitHub sign-in appears when OAuth credentials are set.
        </p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          {mode === "sign-up" ? (
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(event) => setName(event.target.value)} required />
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Working…" : mode === "sign-in" ? "Sign in" : "Create account"}
          </Button>
        </form>
        {github ? (
          <Button
            variant="outline"
            className="mt-3 w-full"
            onClick={() =>
              void authClient.signIn.social({ provider: "github", callbackURL: next })
            }
          >
            Continue with GitHub
          </Button>
        ) : null}
        <p className="mt-6 text-sm text-muted-foreground">
          {mode === "sign-in" ? (
            <>
              New here?{" "}
              <Link href="/sign-up" className="text-foreground underline-offset-4 hover:underline">
                Create an account
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link href="/sign-in" className="text-foreground underline-offset-4 hover:underline">
                Sign in
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
