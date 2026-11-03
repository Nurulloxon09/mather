"use client";

/** A row of mutually exclusive options; the chosen one is inked. */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: readonly (readonly [T, React.ReactNode])[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="flex flex-wrap gap-1 text-sm font-semibold" role="radiogroup" aria-label={label}>
      {options.map(([v, text]) => (
        <button
          key={v}
          role="radio"
          aria-checked={value === v}
          onClick={() => onChange(v)}
          className={`rounded-full px-3 py-1.5 ${value === v ? "bg-bb-ink text-bb-bg" : "text-bb-muted hover:text-bb-ink"}`}
        >
          {text}
        </button>
      ))}
    </div>
  );
}
