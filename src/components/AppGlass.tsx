"use client";

import { useMemo, useSyncExternalStore } from "react";
import GlassWorkspace, { type GlassSettings, type GlassWorkspaceProps } from "./ui/adjustable-glass-dashboard";
import { NAV, type NavKey } from "./AppHeader";

/** The standard look of the glass. Viewers can change it; it's remembered in the browser. */
const BASE_GLASS: GlassSettings = { blur: 22, opacity: 0.42, saturation: 1.3, tint: "#ffffff", edge: 0.6 };
const KEY = "mather:glass";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}
function readSaved() {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}
function parse(raw: string | null): Partial<GlassSettings> | undefined {
  try {
    const v: unknown = JSON.parse(raw ?? "null");
    return v && typeof v === "object" ? (v as Partial<GlassSettings>) : undefined;
  } catch {
    return undefined;
  }
}
function save(settings: GlassSettings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // Storage can be off (private windows); the look just isn't remembered.
  }
}

/**
 * The glass dashboard with the app's menu, colors (.bb-glass in globals.css) and the viewer's
 * saved look, shared by Practice and Stats.
 */
export function AppGlass({
  active,
  ...props
}: { active: NavKey } & Omit<GlassWorkspaceProps, "brand" | "brandHref" | "links" | "glass" | "initialGlass" | "onGlassChange" | "className">) {
  // Read after hydration (the server has no saved look), then kept in step with other tabs.
  const raw = useSyncExternalStore(subscribe, readSaved, () => null);
  const saved = useMemo(() => parse(raw), [raw]);
  return (
    <GlassWorkspace
      {...props}
      className="bb-glass"
      brand="mather"
      links={NAV.map((n) => ({ href: n.href, label: n.label, current: n.key === active }))}
      glass={BASE_GLASS}
      initialGlass={saved}
      onGlassChange={save}
    />
  );
}
