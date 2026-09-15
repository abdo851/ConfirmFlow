import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
      <nav className="mx-auto flex max-w-5xl items-center justify-between">
        <Link href="/" className="font-semibold">
          Confirma
        </Link>
        <div className="flex gap-4 text-sm">
          <Link href="/login">Sign in</Link>
          <Link href="/dashboard">Dashboard</Link>
        </div>
      </nav>
    </header>
  );
}
