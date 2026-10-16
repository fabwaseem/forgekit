"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Mark } from "@/components/mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "cn";

export function SiteHeader() {
  const router = useRouter();
  const { data, isPending } = authClient.useSession();

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2.5">
          <Mark />
          <span className="font-heading text-xl tracking-tight">Forgekit</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {isPending ? null : data?.user ? (
            <Button onClick={() => router.push("/chat")}>Open workspace</Button>
          ) : (
            <>
              <Link href="/sign-in" className={cn(buttonVariants({ variant: "ghost" }))}>
                Sign in
              </Link>
              <Link href="/sign-up" className={cn(buttonVariants())}>
                Start building
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
