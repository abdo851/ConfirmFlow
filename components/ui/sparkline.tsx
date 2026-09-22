interface SparklineProps {
  label: string;
  caption?: string;
  values?: number[];
}

const FALLBACK = [28, 40, 34, 52, 46, 64, 58];

export function Sparkline({ label, caption, values }: SparklineProps) {
  const source = values && values.length > 0 ? values : FALLBACK;
  const peak = Math.max(...source, 1);

  return (
    <figure className="rounded-2xl border border-line bg-surface p-4 shadow-soft sm:p-6">
      <figcaption className="text-sm font-medium">{label}</figcaption>
      <div className="mt-4 flex h-24 items-end gap-2" aria-hidden>
        {source.map((value, index) => (
          <span
            key={`${index}-${value}`}
            className="spark-bar flex-1 rounded-t-lg bg-gradient-to-t from-indigo-600 to-teal-400"
            style={{ height: `${Math.max(8, Math.round((value / peak) * 100))}%` }}
          />
        ))}
      </div>
      {caption ? <p className="mt-3 text-xs text-muted">{caption}</p> : null}
    </figure>
  );
}
