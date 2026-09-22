import { Link } from "@/i18n/navigation";

export function NavCards({
  items,
}: {
  items: { href: string; title: string; description: string }[];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="hover-lift rounded-2xl border border-line bg-surface p-5 shadow-soft"
        >
          <h2 className="text-base font-semibold">{item.title}</h2>
          <p className="mt-1 text-sm leading-6 text-muted">{item.description}</p>
        </Link>
      ))}
    </div>
  );
}
