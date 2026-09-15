import Link from "next/link";
import type { ReactNode } from "react";

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
        <nav className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/dashboard" className="font-semibold">
            Confirma Dashboard
          </Link>
          <Link href="/" className="text-sm">
            Home
          </Link>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
