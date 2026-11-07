"use client";

import { Fragment, useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { Check, Layers, Settings2, X, type LucideIcon } from "lucide-react";

gsap.registerPlugin(useGSAP);

/*
 * Adjustable Glass Dashboard, adapted from the 21st.dev component of the same name.
 *
 * Kept: the frosted-glass shell (top bar, side rail, bottom dock, mobile tabs), the
 * adjustable material panel, the reveal animation, the toast, the optional background
 * photo, and the stylesheet with its --gw-* color variables.
 *
 * Changed: the finance views (balance, cash flow, transactions, savings) are gone. A page
 * passes its own views, built from the gw-* classes below plus GlassChart and GlassSegment.
 * The top bar takes the site's links, the theme follows the host page, and the fake
 * notifications bell and avatar are removed.
 */

export type GlassSettings = {
  blur: number;
  opacity: number;
  saturation: number;
  tint: string;
  edge: number;
};

export type GlassView = {
  id: string;
  /** Tab label in the rail and dock. */
  label: string;
  icon: LucideIcon;
  /** Heading of the view. */
  title: string;
  /** Small line above the heading. */
  eyebrow?: string;
  /** Right side of the heading, when there's no action. */
  aside?: ReactNode;
  /** A button in the heading. A returned string is shown as a toast. */
  action?: { label: string; icon?: LucideIcon; run: () => string | void };
  content: ReactNode;
};

export type GlassLink = { href: string; label: string; current?: boolean };

export interface GlassWorkspaceProps {
  brand: string;
  brandHref?: string;
  links?: GlassLink[];
  views: GlassView[];
  view: string;
  onViewChange: (id: string) => void;
  /** Shown above the top bar, e.g. a connection warning. */
  banner?: ReactNode;
  footerNote?: ReactNode;
  backgroundImage?: string;
  /** The standard look; "Reset appearance" returns to it. */
  glass?: Partial<GlassSettings>;
  /** A look to start from instead, such as one the viewer saved. */
  initialGlass?: Partial<GlassSettings>;
  onGlassChange?: (settings: GlassSettings) => void;
  className?: string;
  style?: CSSProperties;
}

const defaults: GlassSettings = {
  blur: 22,
  opacity: 0.3,
  saturation: 1.2,
  tint: "#ffffff",
  edge: 0.6,
};
const bounded = (value: number, min: number, max: number, fallback: number) =>
  Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
export const normalizeGlass = (v: Partial<GlassSettings>): GlassSettings => ({
  blur: bounded(v.blur ?? defaults.blur, 0, 40, defaults.blur),
  opacity: bounded(v.opacity ?? defaults.opacity, 0.08, 0.9, defaults.opacity),
  saturation: bounded(v.saturation ?? defaults.saturation, 0.5, 2, defaults.saturation),
  edge: bounded(v.edge ?? defaults.edge, 0, 1, defaults.edge),
  tint: /^#[0-9a-f]{6}$/i.test(v.tint ?? "") ? v.tint! : defaults.tint,
});

export default function GlassWorkspace({
  brand,
  brandHref = "/",
  links = [],
  views,
  view,
  onViewChange,
  banner,
  footerNote,
  backgroundImage,
  glass = defaults,
  initialGlass,
  onGlassChange,
  className = "",
  style,
}: GlassWorkspaceProps) {
  const root = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const settingsTrigger = useRef<HTMLButtonElement>(null);
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const [material, setMaterial] = useState(() => normalizeGlass({ ...glass, ...initialGlass }));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [failedImage, setFailedImage] = useState<string>();
  const current = views.find((v) => v.id === view) ?? views[0];

  useEffect(() => {
    if (settingsOpen) root.current?.querySelector<HTMLButtonElement>(".gw-material button")?.focus();
  }, [settingsOpen]);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const panels = content.current?.querySelectorAll(".gw-reveal");
        if (!panels?.length) return;
        gsap.fromTo(
          panels,
          { y: 12, opacity: 0.45, filter: "blur(3px)" },
          {
            y: 0,
            opacity: 1,
            filter: "blur(0px)",
            duration: 0.48,
            stagger: 0.045,
            ease: "power3.out",
            clearProps: "transform,opacity,filter",
          },
        );
      });
      return () => mm.revert();
    },
    { scope: root, dependencies: [current?.id], revertOnUpdate: true },
  );

  function updateGlass(patch: Partial<GlassSettings>) {
    const next = normalizeGlass({ ...material, ...patch });
    setMaterial(next);
    onGlassChange?.(next);
  }
  function closeSettings() {
    setSettingsOpen(false);
    settingsTrigger.current?.focus();
  }

  const nav = (compact = false) => (
    <nav className={compact ? "gw-rail gw-glass" : "gw-dock gw-glass"} aria-label={compact ? "Quick navigation" : "Views"}>
      {views.map((tab, i) => (
        <button
          key={tab.id}
          type="button"
          aria-label={compact ? tab.label : undefined}
          title={compact ? tab.label : undefined}
          aria-current={current?.id === tab.id ? "page" : undefined}
          onClick={() => onViewChange(tab.id)}
          onKeyDown={(e) => {
            if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(e.key)) return;
            e.preventDefault();
            const last = views.length - 1;
            const forward = e.key === "ArrowRight" || e.key === "ArrowDown";
            const next = e.key === "Home" ? 0 : e.key === "End" ? last : (i + (forward ? 1 : last)) % views.length;
            onViewChange(views[next].id);
            (e.currentTarget.parentElement?.children[next] as HTMLButtonElement | undefined)?.focus();
          }}
        >
          <tab.icon size={18} strokeWidth={1.7} aria-hidden="true" />
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );

  if (!current) return null;
  const Action = current.action;

  return (
    <div
      ref={root}
      className={`gw-root ${className}`}
      style={
        {
          "--gw-blur": `${material.blur}px`,
          "--gw-opacity": material.opacity,
          "--gw-saturation": material.saturation,
          "--gw-tint": `color-mix(in srgb, var(--gw-canvas, Canvas) 80%, ${material.tint})`,
          "--gw-edge": material.edge,
          ...style,
        } as CSSProperties
      }
      onKeyDown={(e) => {
        if (e.key === "Escape" && settingsOpen) closeSettings();
      }}
    >
      <style>{styles}</style>
      {backgroundImage && failedImage !== backgroundImage && (
        // A plain <img> so any address works without image-domain setup.
        // eslint-disable-next-line @next/next/no-img-element
        <img className="gw-room" src={backgroundImage} alt="" onError={() => setFailedImage(backgroundImage)} />
      )}
      <div className="gw-room-shade" aria-hidden="true" />
      {banner && <div className="gw-banner">{banner}</div>}
      <div className="gw-workspace">
        <header className="gw-topbar gw-glass">
          <Link className="gw-brand" href={brandHref}>
            <strong>{brand}</strong>
          </Link>
          <div className="gw-toolbar">
            {links.length > 0 && (
              <nav className="gw-links" aria-label="Main">
                {links.map((l) => (
                  <Link key={l.href} href={l.href} aria-current={l.current ? "page" : undefined}>
                    {l.label}
                  </Link>
                ))}
              </nav>
            )}
            <button
              type="button"
              className="gw-adjust"
              ref={settingsTrigger}
              onClick={() => setSettingsOpen(!settingsOpen)}
              aria-expanded={settingsOpen}
              aria-controls={`${id}-material`}
              aria-label="Adjust glass"
            >
              <Settings2 size={16} aria-hidden="true" />
              <span>Adjust glass</span>
            </button>
          </div>
        </header>
        <div className="gw-stage">
          {nav(true)}
          <main className="gw-main gw-glass">
            <div className="gw-view-heading">
              <div>
                {current.eyebrow && <p className="gw-greeting">{current.eyebrow}</p>}
                <h1>{current.title}</h1>
              </div>
              <div className="gw-heading-action">
                {Action ? (
                  <button
                    type="button"
                    className="gw-button"
                    onClick={() => {
                      const message = Action.run();
                      if (message) setNotice(message);
                    }}
                  >
                    {Action.icon && <Action.icon size={14} aria-hidden="true" />}
                    {Action.label}
                  </button>
                ) : (
                  current.aside
                )}
              </div>
            </div>
            <div className="gw-mobile-nav">{nav()}</div>
            <div ref={content} key={current.id} className="gw-view">
              {current.content}
            </div>
            {footerNote && (
              <footer className="gw-footer">
                <span>
                  <i />
                  {footerNote}
                </span>
              </footer>
            )}
            <div className="gw-desktop-dock">{nav()}</div>
          </main>
        </div>
        {settingsOpen && (
          <aside className="gw-material gw-glass" id={`${id}-material`} aria-label="Glass appearance">
            <div className="gw-material-title">
              <div>
                <span className="gw-material-icon">
                  <Settings2 size={18} aria-hidden="true" />
                </span>
                <h2>Glass appearance</h2>
              </div>
              <button type="button" className="gw-icon-button" aria-label="Close glass settings" onClick={closeSettings}>
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <p>Adjust the material across the page. It&apos;s remembered on this device.</p>
            <div className="gw-material-sample" aria-hidden="true">
              <Layers size={28} strokeWidth={1.1} />
              <span>Live material preview</span>
            </div>
            <div className="gw-presets" role="group" aria-label="Glass presets">
              {[
                { name: "Clear", value: { blur: 8, opacity: 0.12, saturation: 1.1, edge: 0.8 } },
                { name: "Frosted", value: normalizeGlass(glass) },
                { name: "Solid", value: { blur: 32, opacity: 0.86, saturation: 1, edge: 0.35 } },
              ].map((p) => (
                <button key={p.name} type="button" onClick={() => updateGlass(p.value)}>
                  {p.name}
                </button>
              ))}
            </div>
            {(
              [
                { key: "blur", label: "Blur", min: 0, max: 40, step: 1, value: `${Math.round(material.blur)} px` },
                { key: "opacity", label: "Opacity", min: 0.08, max: 0.9, step: 0.01, value: `${Math.round(material.opacity * 100)}%` },
                { key: "saturation", label: "Saturation", min: 0.5, max: 2, step: 0.05, value: `${Math.round(material.saturation * 100)}%` },
                { key: "edge", label: "Edge light", min: 0, max: 1, step: 0.05, value: `${Math.round(material.edge * 100)}%` },
              ] as const
            ).map((c) => (
              <label className="gw-range" key={c.key}>
                <span>
                  {c.label}
                  <output>{c.value}</output>
                </span>
                <input
                  type="range"
                  aria-label={c.label}
                  min={c.min}
                  max={c.max}
                  step={c.step}
                  value={material[c.key]}
                  onChange={(e) => updateGlass({ [c.key]: Number(e.target.value) })}
                />
              </label>
            ))}
            <label className="gw-tint">
              Glass tint{" "}
              <input type="color" value={material.tint} onChange={(e) => updateGlass({ tint: e.target.value })} />
            </label>
            <button className="gw-reset" type="button" onClick={() => updateGlass(normalizeGlass(glass))}>
              Reset appearance
            </button>
          </aside>
        )}
      </div>
      {notice && (
        <div className="gw-toast" role="status">
          <Check size={16} aria-hidden="true" />
          {notice}
        </div>
      )}
    </div>
  );
}

/** Buttons that pick one option, styled for the glass panels. */
export function GlassSegment<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: readonly (readonly [T, ReactNode])[];
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div className="gw-segment" role="group" aria-label={label}>
      {options.map(([key, text]) => (
        <button key={key} type="button" aria-pressed={value === key} onClick={() => onChange(key)}>
          {text}
        </button>
      ))}
    </div>
  );
}

export type GlassSeries = { name: string; values: (number | null)[]; muted?: boolean };

const isNumber = (v: number | null): v is number => v !== null && Number.isFinite(v);

/**
 * The dashboard's line chart. The first series is drawn in the accent color with a soft area
 * under it; a muted series is drawn in the text color. Missing values (null) leave a gap, and a
 * point with no neighbor is drawn as a dot.
 */
export function GlassChart({
  labels,
  series,
  min = 0,
  max,
  format,
  ariaLabel,
}: {
  labels: string[];
  series: GlassSeries[];
  min?: number;
  max?: number;
  format: (value: number) => string;
  ariaLabel: string;
}) {
  const gid = `gw${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const n = labels.length;
  const top = max ?? Math.max(min + 1, ...series.flatMap((s) => s.values.filter(isNumber)));
  const x = (i: number) => (n === 1 ? 300 : (i * 600) / (n - 1));
  const y = (v: number) => 180 - ((Math.min(top, Math.max(min, v)) - min) / (top - min || 1)) * 160;
  const runs = (values: (number | null)[]) => {
    const out: number[][] = [];
    let run: number[] = [];
    values.forEach((v, i) => {
      if (isNumber(v)) run.push(i);
      else if (run.length) {
        out.push(run);
        run = [];
      }
    });
    if (run.length) out.push(run);
    return out;
  };
  // Every label up to 7 points, then every few at an even step.
  const step = n <= 7 ? 1 : Math.ceil(n / 6);

  return (
    <div className="gw-chart-wrap">
      <div className="gw-chart-labels" aria-hidden="true">
        <span>{format(top)}</span>
        <span>{format((top + min) / 2)}</span>
        <span>{format(min)}</span>
      </div>
      <svg viewBox="0 0 600 185" role="img" aria-label={ariaLabel} preserveAspectRatio="none">
        <desc>
          {labels
            .map(
              (label, i) =>
                `${label}: ${series.map((s) => `${s.name} ${isNumber(s.values[i]) ? format(s.values[i]!) : "none"}`).join(", ")}`,
            )
            .join(". ")}
        </desc>
        <defs>
          <linearGradient id={`${gid}-area`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--gw-accent)" stopOpacity=".23" />
            <stop offset="1" stopColor="var(--gw-accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[20, 100, 180].map((gy) => (
          <path
            key={gy}
            d={`M0 ${gy} H600`}
            stroke="currentColor"
            opacity=".11"
            strokeDasharray="3 5"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {series.map((s, si) => {
          const stroke = s.muted ? "currentColor" : "var(--gw-accent)";
          const strokeOpacity = s.muted ? 0.45 : 1;
          return (
            <g key={s.name}>
              {runs(s.values).map((run) =>
                run.length > 1 ? (
                  <Fragment key={run[0]}>
                    {si === 0 && !s.muted && (
                      <path
                        d={`M${x(run[0])} 185 ${run.map((i) => `L${x(i)} ${y(s.values[i]!)}`).join(" ")} L${x(run[run.length - 1])} 185 Z`}
                        fill={`url(#${gid}-area)`}
                      />
                    )}
                    <polyline
                      points={run.map((i) => `${x(i)},${y(s.values[i]!)}`).join(" ")}
                      fill="none"
                      stroke={stroke}
                      strokeOpacity={strokeOpacity}
                      strokeWidth={si === 0 ? 2.6 : 2}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  </Fragment>
                ) : (
                  <path
                    key={run[0]}
                    d={`M${x(run[0])} ${y(s.values[run[0]]!)} h0.01`}
                    stroke={stroke}
                    strokeOpacity={strokeOpacity}
                    strokeWidth={7}
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                ),
              )}
            </g>
          );
        })}
      </svg>
      <div className="gw-chart-months" aria-hidden="true">
        {labels.map(
          (label, i) =>
            i % step === 0 && (
              <span
                key={`${label}-${i}`}
                style={{
                  left: `${x(i) / 6}%`,
                  transform:
                    i === 0 && n > 1 ? "none" : i === n - 1 && n > 1 ? "translateX(-100%)" : "translateX(-50%)",
                }}
              >
                {label}
              </span>
            ),
        )}
      </div>
    </div>
  );
}

const styles = `
.gw-root {
  --gw-ink: var(--color-foreground, CanvasText);
  --gw-muted: var(--color-muted-foreground, GrayText);
  --gw-accent: var(--color-primary, Highlight);
  --gw-positive: var(--gw-accent);
  --gw-negative: #c13145;
  --gw-line: color-mix(in srgb, var(--color-border, CanvasText) 35%, transparent);
  --gw-canvas: var(--color-background, Canvas);
  --gw-background: var(--color-background, Canvas);
  --gw-shade: color-mix(in srgb, var(--color-background, Canvas) 22%, transparent);
  --gw-surface: var(--color-card, var(--color-background, Canvas));
  --gw-panel: var(--color-card, var(--color-background, Canvas));
  --gw-rail-active: color-mix(in srgb, var(--color-secondary, ButtonFace) 70%, transparent);
  --gw-positive-surface: color-mix(in srgb, var(--color-primary, Highlight) 15%, var(--color-card, Canvas));
  --gw-negative-surface: color-mix(in srgb, #c13145 15%, var(--color-card, Canvas));
  --gw-account-surface: color-mix(in srgb, var(--color-secondary, ButtonFace) 45%, transparent);
  --gw-account-action: color-mix(in srgb, var(--color-secondary, ButtonFace) 45%, transparent);
  --gw-segment: color-mix(in srgb, var(--color-muted, ButtonFace) 25%, transparent);
  --gw-segment-active: color-mix(in srgb, var(--color-card, Canvas) 85%, transparent);
  --gw-transaction-surface: color-mix(in srgb, var(--color-secondary, ButtonFace) 45%, transparent);
  --gw-income-surface: color-mix(in srgb, var(--color-primary, Highlight) 15%, transparent);
  --gw-goal-surface: color-mix(in srgb, var(--color-secondary, ButtonFace) 40%, transparent);
  --gw-pending: var(--color-muted-foreground, GrayText);
  --gw-dock: color-mix(in srgb, var(--color-card, Canvas) 70%, transparent);
  --gw-dock-active: var(--color-secondary, ButtonFace);
  --gw-dock-ink: var(--color-secondary-foreground, CanvasText);
  --gw-button: var(--color-primary, Highlight);
  --gw-button-ink: var(--color-primary-foreground, HighlightText);
  --gw-search: color-mix(in srgb, var(--color-input, Canvas) 35%, transparent);
  --gw-savings-orb: color-mix(in srgb, var(--color-primary, Highlight) 15%, transparent);
  --gw-popover: color-mix(in srgb, var(--color-popover, Canvas) 94%, transparent);
  --gw-fallback: var(--color-card, Canvas);
  --gw-mobile-dock: color-mix(in srgb, var(--color-card, Canvas) 55%, transparent);
  --gw-shadow: color-mix(in srgb, var(--color-foreground, CanvasText) 18%, transparent);
  --gw-panel-shadow: color-mix(in srgb, var(--color-foreground, CanvasText) 16%, transparent);
  --gw-soft-shadow: color-mix(in srgb, var(--color-foreground, CanvasText) 7%, transparent);
  --gw-segment-shadow: color-mix(in srgb, var(--color-foreground, CanvasText) 6%, transparent);
  --gw-dock-shadow: color-mix(in srgb, var(--color-foreground, CanvasText) 7%, transparent);
  --gw-popover-shadow: color-mix(in srgb, var(--color-foreground, CanvasText) 20%, transparent);
  --gw-sample-shadow: color-mix(in srgb, var(--color-foreground, CanvasText) 35%, transparent);
  --gw-toast-shadow: color-mix(in srgb, var(--color-foreground, CanvasText) 13%, transparent);
  --gw-toast: var(--color-primary, Highlight);
  --gw-toast-ink: var(--color-primary-foreground, HighlightText);
  --gw-selection: color-mix(in srgb, var(--color-primary, Highlight) 35%, transparent);
  --gw-scrollbar: var(--color-muted-foreground, GrayText);
  --gw-hover: color-mix(in srgb, var(--color-secondary, ButtonFace) 25%, transparent);
  --gw-dock-hover: color-mix(in srgb, var(--color-secondary, ButtonFace) 30%, transparent);
  --gw-control-hover: color-mix(in srgb, var(--color-secondary, ButtonFace) 35%, transparent);
  --gw-strong-edge: color-mix(in srgb, var(--color-card, Canvas) 60%, transparent);
  --gw-soft-edge: color-mix(in srgb, var(--color-card, Canvas) 53%, transparent);
  --gw-highlight: var(--color-card, Canvas);
  position: relative;
  isolation: isolate;
  min-height: 100svh;
  overflow: hidden;
  padding: 24px 28px 32px;
  background: var(--gw-background);
  color: var(--gw-ink);
  font-family: inherit;
  font-size: 14px;
  line-height: 1.5;
  letter-spacing: -0.012em;
  font-variant-numeric: tabular-nums;
  box-sizing: border-box;
}
.gw-root * { box-sizing: border-box; }
.gw-root ::selection { background: var(--gw-selection); }
.gw-root button,
.gw-root input,
.gw-root a { font: inherit; color: inherit; }
.gw-root a { text-decoration: none; }
.gw-root button { cursor: pointer; border: 0; background: none; }
.gw-root button:disabled { cursor: not-allowed; opacity: 0.5; }
.gw-root button,
.gw-root a,
.gw-root input { outline-offset: 4px; }
.gw-root :focus-visible { outline: 2px solid var(--gw-accent); }
.gw-root h1,
.gw-root h2,
.gw-root h3,
.gw-root p { margin: 0; }
.gw-room {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 56%;
  z-index: -3;
}
.gw-room-shade {
  position: absolute;
  inset: 0;
  background: var(--gw-shade);
  z-index: -2;
}
.gw-workspace {
  position: relative;
  width: min(1280px, 100%);
  margin: auto;
}
.gw-banner { width: min(1280px, 100%); margin: 0 auto 14px; }
.gw-banner:empty { display: none; }
.gw-glass {
  background: color-mix(in srgb, var(--gw-surface) calc(var(--gw-opacity) * 100%), transparent);
  backdrop-filter: blur(var(--gw-blur)) saturate(var(--gw-saturation));
  -webkit-backdrop-filter: blur(var(--gw-blur)) saturate(var(--gw-saturation));
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--gw-highlight) calc(var(--gw-edge) * 100%), transparent),
    inset 0 0 0 1px color-mix(in srgb, var(--gw-highlight) calc(var(--gw-edge) * 34%), transparent),
    0 20px 52px -25px var(--gw-shadow);
  position: relative;
}
.gw-glass:before {
  content: "";
  position: absolute;
  inset: 0;
  background: var(--gw-tint);
  opacity: 0.12;
  pointer-events: none;
  border-radius: inherit;
}
.gw-topbar {
  height: 62px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  border-radius: 20px;
  margin-bottom: 18px;
  padding: 0 20px;
}
.gw-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  white-space: nowrap;
}
.gw-brand strong { font-size: 18px; font-weight: 800; letter-spacing: -0.03em; }
.gw-toolbar { display: flex; align-items: center; gap: 10px; }
.gw-links {
  display: flex;
  align-items: center;
  gap: 26px;
  margin-right: 10px;
  font-size: 15px;
  font-weight: 600;
  white-space: nowrap;
}
.gw-links a { color: var(--gw-muted); }
.gw-links a:hover,
.gw-links a[aria-current="page"] { color: var(--gw-ink); }
.gw-links a[aria-current="page"] {
  text-decoration: underline;
  text-decoration-thickness: 2px;
  text-underline-offset: 9px;
}
.gw-adjust {
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: 9px;
  padding: 8px 10px;
  font-size: 13px;
}
.gw-adjust:hover { background: var(--gw-hover); }
.gw-icon-button {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  flex: none;
}
.gw-icon-button:hover { background: var(--gw-hover); }
.gw-stage { display: flex; gap: 16px; align-items: flex-start; }
.gw-rail {
  border-radius: 23px;
  width: 50px;
  padding: 8px 5px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 50px;
  flex: none;
}
.gw-rail button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: grid;
  place-items: center;
}
.gw-rail button span { display: none; }
.gw-rail button[aria-current] {
  background: var(--gw-rail-active);
  box-shadow: 0 3px 8px var(--gw-soft-shadow);
}
.gw-main {
  border-radius: 27px;
  padding: 30px 30px 98px;
  flex: 1;
  min-width: 0;
}
.gw-view-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px 20px;
  margin-bottom: 28px;
}
.gw-greeting {
  font-size: 13px;
  color: var(--gw-muted);
  margin-bottom: 5px !important;
}
.gw-view-heading h1 {
  font-size: clamp(25px, 2.3vw, 31px);
  font-weight: 600;
  letter-spacing: -0.035em;
  line-height: 1.18;
}
.gw-date { font-size: 13px; color: var(--gw-muted); white-space: nowrap; }
.gw-panel {
  background: color-mix(in srgb, var(--gw-panel) calc((0.16 + var(--gw-opacity) * 0.5) * 100%), transparent);
  border-radius: 17px;
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--gw-highlight) calc(var(--gw-edge) * 75%), transparent),
    0 8px 22px -20px var(--gw-panel-shadow);
  padding: 21px;
  min-width: 0;
  position: relative;
}
.gw-panel-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
  color: var(--gw-muted);
  font-size: 13px;
}
.gw-panel-title h2 {
  font-size: 15px;
  letter-spacing: -0.02em;
  font-weight: 600;
  color: var(--gw-ink);
}
.gw-panel-title > svg { opacity: 0.65; flex: none; }
.gw-overview-grid {
  display: grid;
  grid-template-columns: 0.82fr 1.5fr;
  gap: 16px;
  margin-bottom: 16px;
}
.gw-balance { display: flex; flex-direction: column; }
.gw-balance-value {
  font-size: clamp(40px, 4.4vw, 60px);
  font-weight: 600;
  letter-spacing: -0.04em;
  line-height: 1.1;
  white-space: nowrap;
}
.gw-balance-meta {
  font-size: 13px;
  color: var(--gw-muted);
  margin-top: 10px !important;
}
.gw-positive { color: var(--gw-positive); }
.gw-negative { color: var(--gw-negative); }
.gw-balance-meta .gw-positive,
.gw-balance-meta .gw-negative,
.gw-balance-meta .gw-flat {
  border-radius: 5px;
  padding: 2px 6px;
  margin-right: 5px;
  font-weight: 600;
}
.gw-balance-meta .gw-positive { background: var(--gw-positive-surface); }
.gw-balance-meta .gw-negative { background: var(--gw-negative-surface); }
.gw-balance-meta .gw-flat { background: var(--gw-segment); color: var(--gw-ink); }
.gw-account {
  margin-top: auto;
  padding-top: 30px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.gw-account-icon {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--gw-account-surface);
  flex: none;
}
.gw-account > div { display: flex; flex-direction: column; min-width: 0; }
.gw-account strong { font-weight: 600; font-size: 13px; }
.gw-account span { font-size: 12px; color: var(--gw-muted); }
.gw-account > button,
.gw-account > a {
  margin-left: auto;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--gw-account-action);
  display: grid;
  place-items: center;
  flex: none;
}
.gw-account > a:hover { color: var(--gw-accent); }
.gw-segment {
  display: flex;
  gap: 3px;
  background: var(--gw-segment);
  border-radius: 9px;
  padding: 3px;
  font-size: 12px;
  color: var(--gw-muted);
  white-space: nowrap;
}
.gw-segment button { padding: 4px 9px; border-radius: 7px; }
.gw-segment button:hover { color: var(--gw-ink); }
.gw-segment button[aria-pressed="true"] {
  background: var(--gw-segment-active);
  box-shadow: 0 2px 4px var(--gw-segment-shadow);
  color: var(--gw-ink);
  font-weight: 600;
}
.gw-chart-summary { display: flex; gap: 34px; margin-bottom: 18px; }
.gw-chart-legend {
  display: flex;
  gap: 20px;
  margin: -4px 0 14px;
  font-size: 12px;
  color: var(--gw-muted);
}
.gw-chart-legend span { display: flex; gap: 6px; align-items: center; }
.gw-chart-legend i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--gw-accent);
}
.gw-chart-legend span + span i { background: var(--gw-muted); }
.gw-chart-summary > div { display: flex; flex-direction: column; gap: 4px; }
.gw-chart-summary span {
  font-size: 12px;
  color: var(--gw-muted);
  display: flex;
  align-items: center;
  gap: 5px;
}
.gw-chart-summary i {
  width: 6px;
  height: 6px;
  background: var(--gw-accent);
  border-radius: 50%;
}
.gw-chart-summary > div + div i { background: var(--gw-muted); }
.gw-chart-summary strong { font-size: 22px; font-weight: 600; letter-spacing: -0.03em; }
.gw-chart-wrap { position: relative; padding-left: 39px; padding-top: 2px; }
.gw-chart-wrap svg {
  display: block;
  width: 100%;
  height: 126px;
  overflow: visible;
}
.gw-chart-labels {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 26px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  font-size: 10px;
  color: var(--gw-muted);
}
.gw-chart-months {
  position: relative;
  height: 24px;
  font-size: 11px;
  color: var(--gw-muted);
  padding-top: 10px;
}
.gw-chart-months > span { position: absolute; white-space: nowrap; }
.gw-lower-grid {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: 16px;
}
.gw-text-button {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px !important;
}
.gw-text-button:hover { color: var(--gw-accent); }
.gw-transaction {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 11px 0;
  border-top: 1px solid var(--gw-line);
  min-width: 0;
}
.gw-transaction:first-child { border-top: 0; padding-top: 0; }
.gw-transaction:last-child { padding-bottom: 0; }
a.gw-transaction:hover .gw-transaction-name strong { text-decoration: underline; }
.gw-transaction-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: var(--gw-transaction-surface);
  flex: none;
}
.gw-transaction-icon.is-income {
  background: var(--gw-income-surface);
  color: var(--gw-accent);
}
.gw-transaction-icon.is-right { color: var(--gw-positive); }
.gw-transaction-icon.is-wrong { color: var(--gw-negative); }
.gw-transaction-name {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}
.gw-transaction-name strong {
  font-size: 14px;
  font-weight: 600;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.gw-transaction-name span {
  font-size: 12px;
  color: var(--gw-muted);
  margin-top: 2px;
}
.gw-transaction > strong { font-size: 14px; font-weight: 600; white-space: nowrap; }
.gw-transaction-status {
  font-size: 12px;
  color: var(--gw-muted);
  white-space: nowrap;
  min-width: 44px;
  text-align: right;
}
.gw-small-label { font-size: 12px; }
.gw-goal + .gw-goal { margin-top: 22px; }
.gw-goal-top { display: flex; align-items: center; gap: 9px; }
.gw-goal-top strong {
  font-size: 13px;
  font-weight: 600;
  flex: 1;
  min-width: 0;
}
.gw-goal-top a:hover { text-decoration: underline; }
.gw-goal-top > span:last-child { font-size: 13px; color: var(--gw-muted); }
.gw-goal-icon {
  width: 30px;
  height: 30px;
  border-radius: 9px;
  background: var(--gw-goal-surface);
  display: grid;
  place-items: center;
  flex: none;
}
.gw-goal-track {
  height: 5px;
  background: var(--gw-line);
  margin: 11px 0 6px;
  border-radius: 5px;
  overflow: hidden;
}
.gw-goal-track i {
  height: 100%;
  display: block;
  background: var(--gw-accent);
  border-radius: 5px;
}
.gw-goal p {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
  color: var(--gw-muted);
}
.gw-goal p strong { font-weight: 600; color: var(--gw-ink); }
.gw-goal p a { color: var(--gw-accent); font-weight: 600; }
.gw-goal p a:hover { text-decoration: underline; }
.gw-slow { color: var(--gw-pending); font-weight: 600; }
.gw-subhead {
  font-size: 12px;
  color: var(--gw-muted);
  margin: 24px 0 14px !important;
}
.gw-footer {
  display: flex;
  align-items: center;
  color: var(--gw-muted);
  font-size: 12px;
  margin-top: 22px;
  gap: 16px;
}
.gw-footer > span:first-child { display: flex; align-items: center; gap: 7px; }
.gw-footer i {
  height: 4px;
  width: 4px;
  flex: none;
  background: var(--gw-accent);
  border-radius: 50%;
}
.gw-desktop-dock {
  position: absolute;
  bottom: 19px;
  left: 50%;
  transform: translateX(-50%);
}
.gw-dock {
  display: flex;
  align-items: center;
  gap: 3px;
  border-radius: 30px;
  padding: 5px;
  white-space: nowrap;
  background: var(--gw-dock);
  backdrop-filter: blur(20px);
}
.gw-dock button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 24px;
  padding: 10px 17px;
  font-size: 13px;
  transition: background 0.22s, color 0.22s;
}
.gw-dock button svg { width: 15px; }
.gw-dock button[aria-current] {
  background: var(--gw-dock-active);
  color: var(--gw-dock-ink);
  box-shadow: 0 3px 7px var(--gw-dock-shadow);
}
.gw-dock button:not([aria-current]):hover { background: var(--gw-dock-hover); }
.gw-mobile-nav { display: none; }
.gw-button {
  padding: 9px 13px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  gap: 7px;
  background: var(--gw-button) !important;
  color: var(--gw-button-ink) !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  white-space: nowrap;
}
.gw-button:hover { filter: brightness(1.13); }
.gw-search {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--gw-search);
  border: 1px solid var(--gw-line);
  border-radius: 9px;
  padding: 7px 10px;
}
.gw-search input {
  width: 190px;
  background: none;
  border: 0;
  outline: 0;
  caret-color: var(--gw-accent);
  font-size: 13px;
}
.gw-search:focus-within { outline: 2px solid var(--gw-accent); outline-offset: 2px; }
.gw-search input::placeholder { color: var(--gw-muted); }
.gw-search button { padding: 0; display: flex; }
.gw-filter { margin: -6px 0 18px; display: flex; }
.gw-count { margin-left: 6px; font-size: 12px; font-weight: 400; color: var(--gw-muted); }
.gw-empty {
  text-align: center;
  padding: 50px 15px;
  color: var(--gw-muted);
  font-size: 13px;
}
.gw-empty svg { display: block; margin: 0 auto 12px; }
.gw-empty h3 { font-size: 15px; color: var(--gw-ink); margin-bottom: 6px; }
.gw-empty a,
.gw-empty button { display: inline-block; margin-top: 15px; color: var(--gw-accent); font-weight: 600; }
.gw-empty a:hover,
.gw-empty button:hover { text-decoration: underline; }
.gw-savings-intro {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 10px 10px 30px;
}
.gw-savings-orb {
  width: 65px;
  height: 65px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--gw-savings-orb);
  box-shadow: inset 0 1px 0 var(--gw-strong-edge);
  color: var(--gw-accent);
  flex: none;
}
.gw-savings-intro p { font-size: 13px; color: var(--gw-muted); }
.gw-savings-intro strong { font-size: 40px; letter-spacing: -0.04em; font-weight: 600; line-height: 1.2; }
.gw-savings-intro > span:last-child {
  margin-left: auto;
  font-size: 13px;
  color: var(--gw-muted);
  text-align: right;
}
.gw-view:has(.gw-savings-intro) .gw-goals {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 26px 34px;
}
.gw-view:has(.gw-savings-intro) .gw-goal + .gw-goal { margin-top: 0; }
.gw-view:has(.gw-savings-intro) .gw-panel + .gw-panel { margin-top: 16px; }
.gw-savings-note {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--gw-muted);
  font-size: 13px;
  padding: 24px 4px 0;
}
.gw-savings-note svg { flex: none; }
.gw-report-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}
.gw-reports-grid + .gw-report-stats { margin-top: 16px; }
.gw-report-stats strong {
  font-size: 30px;
  font-weight: 600;
  letter-spacing: -0.035em;
  display: block;
}
.gw-report-stats section > span { font-size: 12px; color: var(--gw-muted); }
.gw-report-stats .gw-panel-title { margin-bottom: 12px; }
.gw-reports-grid {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 16px;
}
.gw-reports-grid .gw-chart-wrap svg { height: 185px; }
.gw-chart-footnote {
  font-size: 12px;
  color: var(--gw-muted);
  margin-top: 12px !important;
}
.gw-category-list > div + div { margin-top: 19px; }
.gw-category-list > div > div {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 13px;
}
.gw-category-list strong { margin-left: auto; font-weight: 600; }
.gw-category-list svg { width: 15px; flex: none; }
.gw-category-list a:hover { text-decoration: underline; }
.gw-category-track {
  display: block;
  height: 4px;
  border-radius: 3px;
  background: var(--gw-line);
  margin-top: 9px;
}
.gw-category-track i {
  display: block;
  height: 100%;
  background: var(--gw-accent);
  border-radius: 3px;
}
.gw-material {
  position: absolute;
  z-index: 20;
  max-height: calc(100svh - 128px);
  overflow: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--gw-scrollbar) transparent;
  right: 10px;
  top: 75px;
  width: 300px;
  border-radius: 22px;
  padding: 22px;
  background: var(--gw-popover);
  box-shadow: inset 0 1px 0 var(--gw-soft-edge), 0 24px 80px var(--gw-popover-shadow);
}
.gw-material-title { display: flex; align-items: center; justify-content: space-between; }
.gw-material-title > div { display: flex; gap: 10px; align-items: center; }
.gw-material h2 { font-size: 17px; font-weight: 600; letter-spacing: -0.03em; }
.gw-material-icon { display: grid; place-items: center; }
.gw-material > p { font-size: 12px; color: var(--gw-muted); margin: 7px 0 18px; }
.gw-material-sample {
  height: 87px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  border-radius: 13px;
  margin-bottom: 17px;
  background: color-mix(in srgb, var(--gw-tint) calc(var(--gw-opacity) * 100%), transparent);
  backdrop-filter: blur(var(--gw-blur));
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--gw-highlight) calc(var(--gw-edge) * 100%), transparent),
    0 12px 20px -18px var(--gw-sample-shadow);
  font-size: 13px;
}
.gw-presets { display: flex; gap: 5px; margin-bottom: 20px; }
.gw-presets button {
  flex: 1;
  border: 1px solid var(--gw-line);
  border-radius: 7px;
  padding: 6px 0;
  font-size: 12px;
}
.gw-presets button:hover { background: var(--gw-control-hover); }
.gw-range { display: block; margin: 17px 0; }
.gw-range > span { display: flex; justify-content: space-between; font-size: 12px; }
.gw-range output { font-size: 12px; color: var(--gw-muted); }
.gw-range input {
  width: 100%;
  accent-color: var(--gw-accent);
  height: 16px;
  margin: 8px 0 0;
  cursor: pointer;
}
.gw-tint {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  margin-top: 20px;
}
.gw-tint input {
  height: 28px;
  width: 42px;
  padding: 2px;
  background: none;
  border: 1px solid var(--gw-line);
  border-radius: 6px;
  cursor: pointer;
}
.gw-reset {
  width: 100%;
  border: 1px solid var(--gw-line) !important;
  border-radius: 8px;
  padding: 8px;
  margin-top: 22px;
  font-size: 12px !important;
}
.gw-reset:hover { background: var(--gw-control-hover); }
.gw-toast {
  position: fixed;
  left: 50%;
  bottom: 25px;
  transform: translateX(-50%);
  z-index: 30;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 13px 20px;
  border-radius: 12px;
  background: var(--gw-toast);
  color: var(--gw-toast-ink);
  box-shadow: 0 10px 30px var(--gw-toast-shadow);
  font-size: 13px;
  white-space: nowrap;
}
.gw-chart-empty { padding: 35px 15px; min-height: 160px; }
@supports not (backdrop-filter: blur(1px)) {
  .gw-glass,
  .gw-panel { background: var(--gw-fallback); }
}
@media (min-width: 1550px) {
  .gw-root { padding-top: 40px; }
  .gw-main { padding-top: 36px; }
  .gw-chart-wrap svg { height: 150px; }
  .gw-panel { padding: 25px; }
  .gw-transaction { padding: 14px 0; }
}
@media (max-width: 1050px) {
  .gw-root { padding: 18px 18px 24px; }
  .gw-main { padding: 25px 23px 92px; }
  .gw-rail { display: none; }
  .gw-transaction-status { display: none; }
  .gw-panel { padding: 18px; }
  .gw-chart-summary { gap: 20px; }
  .gw-chart-summary strong { font-size: 20px; }
  .gw-links { gap: 18px; margin-right: 0; }
}
@media (max-width: 700px) {
  .gw-root { padding: 12px 10px 24px; }
  .gw-topbar {
    height: 56px;
    padding: 0 12px;
    border-radius: 17px;
    margin-bottom: 12px;
  }
  .gw-toolbar { gap: 4px; }
  .gw-brand strong { font-size: 16px; }
  .gw-links { gap: 14px; font-size: 14px; }
  .gw-adjust { padding: 8px; }
  .gw-adjust span { display: none; }
  .gw-main { border-radius: 20px; padding: 23px 15px; }
  .gw-view-heading { gap: 12px; margin-bottom: 20px; }
  .gw-view-heading h1 { font-size: 26px; line-height: 1.12; }
  .gw-greeting { font-size: 12px; }
  .gw-heading-action .gw-button { padding: 8px 10px; font-size: 12px !important; }
  .gw-mobile-nav { display: block; margin-bottom: 20px; }
  .gw-mobile-nav .gw-dock {
    width: 100%;
    padding: 4px;
    border-radius: 12px;
    justify-content: space-between;
    background: var(--gw-mobile-dock);
    box-shadow: none;
  }
  .gw-dock button {
    font-size: 12px;
    padding: 9px 8px;
    border-radius: 9px;
    gap: 5px;
  }
  .gw-dock button svg { width: 13px; height: 13px; }
  .gw-desktop-dock { display: none; }
  .gw-overview-grid,
  .gw-lower-grid,
  .gw-reports-grid { grid-template-columns: 1fr; gap: 12px; }
  .gw-overview-grid { margin-bottom: 12px; }
  .gw-panel { border-radius: 15px; padding: 18px; }
  .gw-chart-wrap svg { height: 130px; }
  .gw-chart-summary { gap: 28px; }
  .gw-panel-title { gap: 8px; margin-bottom: 18px; flex-wrap: wrap; }
  .gw-footer { font-size: 11px; margin-top: 24px; }
  .gw-material {
    right: 4px;
    top: 65px;
    width: min(310px, calc(100% - 8px));
    padding: 20px;
    max-height: calc(100svh - 90px);
  }
  .gw-search { padding: 7px; width: 100%; }
  .gw-search input { width: 100%; min-width: 0; }
  .gw-filter { overflow-x: auto; }
  .gw-report-stats { grid-template-columns: 1fr; gap: 12px; margin-bottom: 12px; }
  .gw-reports-grid + .gw-report-stats { margin-top: 12px; }
  .gw-report-stats .gw-panel {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
  }
  .gw-report-stats .gw-panel-title { margin: 0; }
  .gw-report-stats .gw-panel-title svg { display: none; }
  .gw-report-stats strong { font-size: 26px; }
  .gw-report-stats section > span { grid-column: 1/-1; margin-top: 6px; }
  .gw-savings-intro { gap: 14px; padding: 6px 2px 24px; flex-wrap: wrap; }
  .gw-savings-intro strong { font-size: 34px; }
  .gw-savings-intro > span:last-child { margin-left: 0; text-align: left; width: 100%; }
  .gw-savings-orb { width: 52px; height: 52px; }
  .gw-view:has(.gw-savings-intro) .gw-goals { grid-template-columns: 1fr; gap: 24px; }
  .gw-toast { max-width: calc(100% - 30px); white-space: normal; }
  .gw-chart-months { font-size: 10px; }
}
@media (max-height: 550px) {
  .gw-material { top: 70px; max-height: calc(100svh - 110px); }
}
@media (prefers-reduced-motion: reduce) {
  .gw-root * { scroll-behavior: auto !important; transition: none !important; }
}
`;
