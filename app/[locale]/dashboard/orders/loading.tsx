export default function OrdersLoading() {
  return (
    <div className="animate-pulse space-y-6" aria-busy="true" aria-live="polite">
      <div className="h-8 w-40 rounded-xl bg-surface-muted" />
      <div className="h-4 w-72 max-w-full rounded-lg bg-surface-muted" />
      <div className="h-24 rounded-2xl bg-surface-muted" />
      <div className="h-11 w-full max-w-xl rounded-xl bg-surface-muted" />
      <div className="space-y-2 rounded-2xl border border-line bg-surface p-4">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="h-12 rounded-lg bg-surface-muted" />
        ))}
      </div>
    </div>
  );
}
