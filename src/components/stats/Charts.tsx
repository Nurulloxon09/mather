"use client";

import { useEffect, useRef, useState } from "react";

// Small single-series SVG charts: columns for counts, a line for rates and scores.
// One series each, in the app's blue; hairline grid; hover/focus tooltip; every chart
// has a table twin (ChartTable) so no value is only reachable by hovering.

const C = {
  series: "var(--bb-blue)",
  seriesHover: "var(--bb-blue-dark)",
  grid: "var(--bb-hair)",
  axis: "var(--bb-line)",
  muted: "var(--bb-muted)",
  surface: "var(--bb-bg)",
};

export type Datum = { label: string; value: number | null; tip: string };

const PAD = { top: 18, right: 14, bottom: 26, left: 40 };

function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.floor(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/** Show every k-th x label so they never collide (about 56px each). */
function labelStep(n: number, plotWidth: number) {
  return Math.max(1, Math.ceil((n * 56) / Math.max(1, plotWidth)));
}

function Tooltip({ x, y, width, value, label }: { x: number; y: number; width: number; value: string; label: string }) {
  const w = 150;
  const left = Math.max(0, Math.min(width - w, x - w / 2));
  return (
    <div
      className="pointer-events-none absolute z-10 rounded-lg border border-bb-hair bg-bb-surface px-3 py-2 text-sm shadow-[0_4px_14px_rgba(0,0,0,0.12)]"
      style={{ left, top: Math.max(0, y - 58), width: w }}
      role="status"
    >
      <div className="font-bold text-bb-ink">{value}</div>
      <div className="text-xs text-bb-muted">{label}</div>
    </div>
  );
}

function YGrid({ ticks, y, width, format }: { ticks: number[]; y: (v: number) => number; width: number; format: (v: number) => string }) {
  return (
    <g>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke={C.grid} strokeWidth={1} />
          <text x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize={11} fill={C.muted} className="tabular-nums">
            {format(t)}
          </text>
        </g>
      ))}
    </g>
  );
}

/** Rounded data-end (4px), square at the baseline. */
function barPath(x: number, y: number, w: number, h: number) {
  const r = Math.min(4, w / 2, h);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

export function niceMax(v: number) {
  if (v <= 4) return 4;
  const mag = 10 ** Math.floor(Math.log10(v));
  const n = v / mag;
  const step = n <= 2 ? 2 : n <= 4 ? 4 : n <= 5 ? 5 : 10;
  return step * mag;
}

export function ColumnChart({
  data,
  height = 190,
  format = (v) => String(v),
  ariaLabel,
}: {
  data: Datum[];
  height?: number;
  format?: (v: number) => string;
  ariaLabel: string;
}) {
  const [ref, width] = useWidth();
  const [hover, setHover] = useState<number | null>(null);
  const max = niceMax(Math.max(0, ...data.map((d) => d.value ?? 0)));
  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const plotH = height - PAD.top - PAD.bottom;
  const band = data.length ? plotW / data.length : 0;
  const barW = Math.max(2, Math.min(24, band * 0.62));
  const y = (v: number) => PAD.top + plotH - (v / max) * plotH;
  const step = labelStep(data.length, plotW);

  return (
    <div ref={ref} className="relative" style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={ariaLabel}>
          <YGrid ticks={[0, max / 2, max]} y={y} width={width} format={format} />
          <line x1={PAD.left} x2={width - PAD.right} y1={y(0)} y2={y(0)} stroke={C.axis} strokeWidth={1} />
          {data.map((d, i) => {
            const cx = PAD.left + band * i + band / 2;
            const v = d.value ?? 0;
            const h = (v / max) * plotH;
            return (
              <g key={i}>
                {v > 0 && (
                  <path d={barPath(cx - barW / 2, y(v), barW, h)} fill={hover === i ? C.seriesHover : C.series} />
                )}
                {/* The whole column is the hit target, not just the painted bar. */}
                <rect
                  x={PAD.left + band * i}
                  y={PAD.top}
                  width={band}
                  height={plotH}
                  fill="transparent"
                  tabIndex={0}
                  aria-label={`${d.label}: ${d.tip}`}
                  onPointerEnter={() => setHover(i)}
                  onPointerLeave={() => setHover(null)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  className="outline-none"
                />
                {i % step === 0 && (
                  <text x={cx} y={height - 8} textAnchor="middle" fontSize={11} fill={C.muted}>
                    {d.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      )}
      {hover !== null && data[hover] && (
        <Tooltip
          x={PAD.left + band * hover + band / 2}
          y={y(data[hover].value ?? 0)}
          width={width}
          value={data[hover].tip}
          label={data[hover].label}
        />
      )}
    </div>
  );
}

export function LineChart({
  data,
  domain,
  ticks,
  height = 190,
  format = (v) => String(v),
  ariaLabel,
}: {
  data: Datum[];
  domain: [number, number];
  ticks: number[];
  height?: number;
  format?: (v: number) => string;
  ariaLabel: string;
}) {
  const [ref, width] = useWidth();
  const [hover, setHover] = useState<number | null>(null);
  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const plotH = height - PAD.top - PAD.bottom;
  const n = data.length;
  // Points sit in the middle of equal slots, so one point is centered rather than on the axis.
  const x = (i: number) => PAD.left + (n ? (plotW / n) * (i + 0.5) : 0);
  const y = (v: number) => PAD.top + plotH - ((v - domain[0]) / (domain[1] - domain[0])) * plotH;
  const step = labelStep(n, plotW);

  // Break the line where there's no value (a week with no answers).
  const segments: string[] = [];
  let cur = "";
  data.forEach((d, i) => {
    if (d.value === null) {
      if (cur) segments.push(cur);
      cur = "";
    } else {
      cur += `${cur ? "L" : "M"}${x(i)},${y(d.value)}`;
    }
  });
  if (cur) segments.push(cur);
  const lastIdx = data.map((d) => d.value !== null).lastIndexOf(true);
  const showAllDots = n <= 30;

  const nearest = (clientX: number, rect: DOMRect) => {
    const i = Math.round(((clientX - rect.left - PAD.left) / Math.max(1, plotW)) * n - 0.5);
    return Math.max(0, Math.min(n - 1, i));
  };

  return (
    <div ref={ref} className="relative" style={{ height }}>
      {width > 0 && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={ariaLabel}
          tabIndex={0}
          className="outline-none focus-visible:outline-2 focus-visible:outline-bb-blue"
          onPointerMove={(e) => setHover(nearest(e.clientX, e.currentTarget.getBoundingClientRect()))}
          onPointerLeave={() => setHover(null)}
          onFocus={() => setHover(lastIdx >= 0 ? lastIdx : 0)}
          onBlur={() => setHover(null)}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") setHover((h) => Math.max(0, (h ?? 0) - 1));
            if (e.key === "ArrowRight") setHover((h) => Math.min(n - 1, (h ?? 0) + 1));
          }}
        >
          <YGrid ticks={ticks} y={y} width={width} format={format} />
          {hover !== null && (
            <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + plotH} stroke={C.axis} strokeWidth={1} />
          )}
          {segments.map((d, i) => (
            <path key={i} d={d} fill="none" stroke={C.series} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          ))}
          {data.map((d, i) =>
            d.value !== null && (showAllDots || i === lastIdx || i === hover) ? (
              <circle
                key={i}
                cx={x(i)}
                cy={y(d.value)}
                r={i === hover ? 5.5 : 4}
                fill={C.series}
                stroke={C.surface}
                strokeWidth={2}
              />
            ) : null,
          )}
          {lastIdx >= 0 && hover === null && (
            <text
              x={Math.min(x(lastIdx) + 8, width - 4)}
              y={y(data[lastIdx].value!) - 10}
              textAnchor={x(lastIdx) + 40 > width ? "end" : "start"}
              fontSize={12}
              fontWeight={700}
              fill="var(--bb-ink)"
            >
              {format(data[lastIdx].value!)}
            </text>
          )}
          {data.map((d, i) =>
            i % step === 0 ? (
              <text key={i} x={x(i)} y={height - 8} textAnchor="middle" fontSize={11} fill={C.muted}>
                {d.label}
              </text>
            ) : null,
          )}
        </svg>
      )}
      {hover !== null && data[hover] && (
        <Tooltip
          x={x(hover)}
          y={data[hover].value === null ? PAD.top + plotH / 2 : y(data[hover].value!)}
          width={width}
          value={data[hover].tip}
          label={data[hover].label}
        />
      )}
    </div>
  );
}

/** The table twin of a chart: same values, readable without hovering. */
export function ChartTable({ head, rows }: { head: [string, string]; rows: [string, string][] }) {
  return (
    <details className="mt-2 text-sm">
      <summary className="cursor-pointer select-none text-bb-muted hover:text-bb-ink">Show as table</summary>
      <div className="mt-2 max-h-64 overflow-auto rounded-lg border border-bb-hair">
        <table className="w-full">
          <thead className="sticky top-0 bg-bb-subtle text-left text-xs text-bb-muted">
            <tr>
              <th className="px-3 py-1.5">{head[0]}</th>
              <th className="px-3 py-1.5 text-right">{head[1]}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([a, b], i) => (
              <tr key={i} className="border-t border-bb-hair">
                <td className="px-3 py-1.5">{a}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{b}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

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
