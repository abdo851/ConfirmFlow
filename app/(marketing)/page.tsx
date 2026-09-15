import { Button } from "@/components/ui/button";

const flowSteps = [
  "Store",
  "Order created",
  "Order confirmed",
  "Confirma",
  "Meta Conversion API",
] as const;

const setupSteps = [
  {
    title: "Connect your store",
    description: "Link Shopify, WooCommerce, or YouCan to receive orders.",
  },
  {
    title: "Connect Meta",
    description: "Add your Meta Pixel and Conversions API credentials.",
  },
  {
    title: "Configure confirmation",
    description: "Define how orders are confirmed before conversions are sent.",
  },
] as const;

export default function LandingPage() {
  return (
    <>
      <section className="mx-auto max-w-5xl px-6 py-20 text-center">
        <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-500">
          Confirma
        </p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Send Meta only the conversions that matter.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-neutral-600 dark:text-neutral-400">
          Confirma sits between your store and Meta. Only confirmed orders become
          conversion events — so your ad optimization reflects real purchases,
          not abandoned checkouts.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Button href="/signup">Get started</Button>
          <Button variant="outline" href="/login">
            Sign in
          </Button>
        </div>
      </section>

      <section className="border-y border-neutral-200 bg-neutral-50 px-6 py-14 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-sm font-semibold uppercase tracking-wider text-neutral-500">
            How it works
          </h2>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm font-medium">
            {flowSteps.map((step, index) => (
              <div key={step} className="flex items-center gap-3">
                <span className="rounded-md border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900">
                  {step}
                </span>
                {index < flowSteps.length - 1 ? (
                  <span className="text-neutral-400">→</span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="text-center text-2xl font-semibold">Three steps to get started</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {setupSteps.map((step, index) => (
            <div
              key={step.title}
              className="rounded-lg border border-neutral-200 p-6 dark:border-neutral-800"
            >
              <p className="text-sm font-semibold text-neutral-500">Step {index + 1}</p>
              <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
