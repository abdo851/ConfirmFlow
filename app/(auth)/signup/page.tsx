import Link from "next/link";
import { Card } from "@/components/ui/card";

export default function SignupPage() {
  return (
    <Card title="Create account" description="Authentication placeholder (M0).">
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Supabase Auth integration will be implemented in a future milestone.
      </p>
      <p className="mt-4 text-sm">
        <Link href="/login" className="underline">
          Already have an account?
        </Link>
      </p>
    </Card>
  );
}
