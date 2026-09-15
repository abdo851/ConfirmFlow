import Link from "next/link";
import type { ReactNode } from "react";

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
        <nav className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Confirma
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-neutral-600 dark:text-neutral-400"
          >
            Dashboard
          </Link>
        </nav>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-12">{children}</main>
    </div>
  );
}
