import { ComingSoonBadge } from "@/components/dashboard/coming-soon-badge";
import { Link } from "@/i18n/navigation";

export function NavCards({
  items,
}: {
  items: { href: string; title: string; description: string; soon?: boolean }[];
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="hover-lift rounded-2xl border border-line bg-surface p-4 shadow-soft sm:p-5"
        >
          <h2 className="flex flex-wrap items-center gap-2 text-sm font-semibold sm:text-base">
            {item.title}
            {item.soon ? <ComingSoonBadge /> : null}
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted">{item.description}</p>
        </Link>
      ))}
    </div>
  );
}
