/** Accuracy against 100%: a filled bar on a lighter track of the same blue. */
export function Meter({ value, label }: { value: number; label: string }) {
  return (
    <div
      className="h-1.5 overflow-hidden rounded-full bg-bb-blue-soft"
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
      aria-label={label}
    >
      <div className="h-full rounded-full bg-bb-blue" style={{ width: `${Math.round(value * 100)}%` }} />
    </div>
  );
}
