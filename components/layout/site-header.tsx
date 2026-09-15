import Link from "next/link";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
      <nav className="mx-auto flex max-w-5xl items-center justify-between">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Confirma
        </Link>
        <div className="flex items-center gap-3">
          <Button variant="outline" href="/login">
            Sign in
          </Button>
          <Button href="/signup">Get started</Button>
        </div>
      </nav>
    </header>
  );
}
