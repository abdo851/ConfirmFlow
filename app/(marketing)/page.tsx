import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 py-24 text-center">
      <h1 className="text-4xl font-bold tracking-tight">Confirma</h1>
      <p className="text-lg text-neutral-600 dark:text-neutral-400">
        Order confirmation and conversion tracking — foundation scaffold (M0).
      </p>
      <div className="flex gap-4">
        <Button href="/login">Sign in</Button>
        <Button variant="outline" href="/signup">
          Get started
        </Button>
      </div>
    </section>
  );
}
