import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  return (
    <Card
      title="Sign in"
      description="Access your Confirma dashboard."
    >
      <form className="space-y-4" aria-label="Sign in form">
        <Input
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@company.com"
        />
        <Input
          label="Password"
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="••••••••"
        />
        <Button type="button" disabled className="w-full">
          Sign in
        </Button>
      </form>
      <p className="mt-4 text-xs text-neutral-500">
        Authentication is not connected yet. This form is a UI shell for a future
        milestone.
      </p>
      <p className="mt-4 text-sm">
        <span className="text-neutral-600 dark:text-neutral-400">
          Don&apos;t have an account?{" "}
        </span>
        <Link href="/signup" className="underline">
          Get started
        </Link>
      </p>
      <p className="mt-2 text-sm">
        <Link href="/" className="underline">
          Back to home
        </Link>
      </p>
    </Card>
  );
}
