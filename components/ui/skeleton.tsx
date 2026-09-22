interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={`skeleton rounded-full ${className}`.trim()}
    />
  );
}
