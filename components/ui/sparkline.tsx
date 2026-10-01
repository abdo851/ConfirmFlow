import { EmptyState } from "@/components/ui/empty-state";

interface SparklineProps {
  label: string;
  caption?: string;
  values?: number[];
}

function smoothArea(values: number[], width: number, height: number) {
  const peak = Math.max(...values, 1);
  const step = values.length === 1 ? 0 : width / (values.length - 1);
  const points = values.map((value, index) => {
    const x = values.length === 1 ? width / 2 : index * step;
    const y = height - 4 - (value / peak) * (height - 8);
    return [x, y] as const;
  });
  let line = `M ${points[0][0]} ${points[0][1]}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const mid = (current[0] + next[0]) / 2;
    line += ` C ${mid} ${current[1]}, ${mid} ${next[1]}, ${next[0]} ${next[1]}`;
  }
  const area = `${line} L ${width} ${height} L 0 ${height} Z`;
  return { line, area };
}

export function Sparkline({ label, caption, values }: SparklineProps) {
  const source = values ?? [];
  if (source.length === 0) {
    return <EmptyState title={label} description={caption ?? label} />;
  }

  const width = 320;
  const height = 96;
  const { line, area } = smoothArea(source, width, height);

  return (
    <figure className="hover-lift w-full rounded-2xl border border-line bg-surface p-6 shadow-soft">
      <figcaption className="text-sm font-medium">{label}</figcaption>
      <div className="relative mt-4 h-24">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full" aria-hidden preserveAspectRatio="none">
          <defs>
            <linearGradient id="spark-area-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <path d={area} fill="url(#spark-area-fill)" />
          <path d={line} fill="none" stroke="#4f46e5" strokeWidth="2" />
        </svg>
        <div className="absolute inset-0 flex">
          {source.map((value, index) => (
            <div key={`${index}-${value}`} className="group relative flex-1">
              <span
                dir="ltr"
                className="pointer-events-none absolute bottom-full start-0 end-0 text-center text-xs font-medium text-foreground opacity-0 motion-safe:transition-opacity motion-safe:duration-200 group-hover:opacity-100"
              >
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>
      {caption ? <p className="mt-3 text-xs text-muted">{caption}</p> : null}
    </figure>
  );
}
