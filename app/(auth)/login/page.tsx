import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { loginAction } from "@/lib/auth/actions";

const ERROR_MESSAGES: Record<string, string> = {
  missing_fields: "Email and password are required.",
  invalid_credentials: "Invalid email or password.",
  auth_required: "Sign in to continue.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const errorMessage = params.error
    ? (ERROR_MESSAGES[params.error] ?? "Unable to sign in.")
    : null;

  return (
    <Card title="Sign in" description="Access your Confirma dashboard.">
      <form action={loginAction} className="space-y-4" aria-label="Sign in form">
        <Input
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@company.com"
          required
        />
        <Input
          label="Password"
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="••••••••"
          required
        />
        {errorMessage ? (
          <p className="text-sm text-red-700 dark:text-red-400" role="alert">
            {errorMessage}
          </p>
        ) : null}
        <Button type="submit" className="w-full">
          Sign in
        </Button>
      </form>
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
