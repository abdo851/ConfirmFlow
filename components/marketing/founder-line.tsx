export function FounderLine({ quote, role }: { quote: string; role: string }) {
  return (
    <figure className="mx-auto max-w-2xl text-center">
      <span
        aria-hidden
        className="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-indigo-600 text-lg font-bold text-white lg:size-16 lg:text-2xl"
      >
        ع
      </span>
      <blockquote className="mt-4 text-base leading-7 italic lg:text-lg">“{quote}”</blockquote>
      <figcaption className="mt-3 text-sm text-muted">{role}</figcaption>
    </figure>
  );
}
