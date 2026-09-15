import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function SignupPage() {
  return (
    <Card
      title="Create account"
      description="Start sending verified conversions to Meta."
    >
      <form className="space-y-4" aria-label="Create account form">
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
          autoComplete="new-password"
          placeholder="••••••••"
        />
        <Input
          label="Confirm password"
          type="password"
          name="confirmPassword"
          autoComplete="new-password"
          placeholder="••••••••"
        />
        <Button type="button" disabled className="w-full">
          Create account
        </Button>
      </form>
      <p className="mt-4 text-xs text-neutral-500">
        Authentication is not connected yet. This form is a UI shell for a future
        milestone.
      </p>
      <p className="mt-4 text-sm">
        <span className="text-neutral-600 dark:text-neutral-400">
          Already have an account?{" "}
        </span>
        <Link href="/login" className="underline">
          Sign in
        </Link>
      </p>
    </Card>
  );
}
