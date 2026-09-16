import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { signupAction } from "@/lib/auth/actions";

const ERROR_MESSAGES: Record<string, string> = {
  missing_fields: "All fields are required.",
  password_mismatch: "Passwords do not match.",
  signup_failed: "Unable to create account. Please try again.",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const errorMessage = params.error
    ? (ERROR_MESSAGES[params.error] ?? "Unable to create account.")
    : null;

  return (
    <Card
      title="Create account"
      description="Start sending verified conversions to Meta."
    >
      <form
        action={signupAction}
        className="space-y-4"
        aria-label="Create account form"
      >
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
          autoComplete="new-password"
          placeholder="••••••••"
          required
        />
        <Input
          label="Confirm password"
          type="password"
          name="confirmPassword"
          autoComplete="new-password"
          placeholder="••••••••"
          required
        />
        {errorMessage ? (
          <p className="text-sm text-red-700 dark:text-red-400" role="alert">
            {errorMessage}
          </p>
        ) : null}
        <Button type="submit" className="w-full">
          Create account
        </Button>
      </form>
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
