"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, Plus } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Mark } from "@/components/mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button, buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "cn";

type ChatRow = { id: string; title: string };

const links = [
  { href: "/chat", label: "Chats" },
  { href: "/knowledge", label: "Knowledge" },
  { href: "/usage", label: "Usage" },
];

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {links.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={cn(
              "rounded-lg px-3 py-2 text-sm",
              active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data, isPending } = authClient.useSession();
  const [chats, setChats] = useState<ChatRow[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isPending && !data) router.replace("/sign-in");
  }, [data, isPending, router]);

  useEffect(() => {
    if (!data) return;
    void fetch("/api/chats")
      .then((response) => (response.ok ? response.json() : { chats: [] }))
      .then((body: { chats: ChatRow[] }) => setChats(body.chats ?? []))
      .catch(() => setChats([]));
  }, [data, pathname]);

  if (isPending || !data) {
    return <div className="grid h-dvh place-items-center text-sm text-muted-foreground">Opening workspace…</div>;
  }

  const sidebar = (
    <div className="flex h-full flex-col gap-4">
      <Link href="/" className="flex items-center gap-2 px-1">
        <Mark className="size-7" />
        <span className="font-heading text-xl">Forgekit</span>
      </Link>
      <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} />
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
        <p className="px-3 pt-2 text-[11px] tracking-wide text-muted-foreground uppercase">Recent</p>
        {chats.length === 0 ? (
          <p className="px-3 text-sm text-muted-foreground">No chats yet.</p>
        ) : (
          chats.map((chat) => (
            <Link
              key={chat.id}
              href={`/chat/${chat.id}`}
              onClick={() => setOpen(false)}
              className={cn(
                "block truncate rounded-lg px-3 py-2 text-sm",
                pathname === `/chat/${chat.id}` ? "bg-muted" : "hover:bg-muted",
              )}
            >
              {chat.title}
            </Link>
          ))
        )}
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
        <p className="truncate text-xs text-muted-foreground">{data.user.email}</p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            void authClient.signOut().then(() => {
              router.push("/");
              router.refresh();
            })
          }
        >
          Sign out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-dvh bg-background">
      <aside className="hidden w-72 shrink-0 border-r border-border p-4 md:flex">{sidebar}</aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-border px-3 py-2 md:justify-end">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={<Button variant="ghost" size="icon" className="md:hidden" aria-label="Open navigation" />}
            >
              <Menu />
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-4">
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              {sidebar}
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <Link href="/chat" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1")}>
              <Plus className="size-3.5" />
              New chat
            </Link>
            <ThemeToggle />
          </div>
        </div>
        <div className="min-h-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
