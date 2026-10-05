import { requireUser } from "@/lib/auth";
import { BottomNav } from "@/components/bottom-nav";
import { SideNav } from "@/components/side-nav";
import { SyncBadge } from "@/components/sync-badge";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Ensures a session, creates the app user and seeds categories on first login.
  await requireUser();

  return (
    <div className="flex min-h-dvh w-full">
      <SideNav />
      <div className="flex min-h-dvh flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center border-b bg-background/95 px-4 backdrop-blur">
          <span className="font-semibold tracking-tight md:hidden">Kharcha</span>
          <div className="ml-auto flex items-center gap-1">
            <SyncBadge />
            <ThemeToggle />
          </div>
        </header>
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-4 pb-28 md:pb-8">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
