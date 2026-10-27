"use client";

import type { ReactNode } from "react";
import { tex } from "@/lib/rich";
import { FloatingPanel } from "./FloatingPanel";

const L = ({ x, y, children, a = "middle" }: { x: number; y: number; children: ReactNode; a?: "start" | "middle" | "end" }) => (
  <text x={x} y={y} textAnchor={a} fontSize="13" fontStyle="italic" fontFamily="var(--font-content), Georgia, serif" fill="#1e1e1e">
    {children}
  </text>
);

const S = { fill: "none", stroke: "#1e1e1e", strokeWidth: 1.4 } as const;
const D = { ...S, strokeDasharray: "4 3" } as const;

function Fig({ children, formulas }: { children: ReactNode; formulas: string[] }) {
  return (
    <figure className="flex flex-col items-center gap-1">
      <svg width="130" height="105" viewBox="0 0 130 105">
        {children}
      </svg>
      {formulas.map((f) => (
        <figcaption key={f} className="text-[15px]" dangerouslySetInnerHTML={{ __html: tex(f) }} />
      ))}
    </figure>
  );
}

function Sheet() {
  return (
    <div className="h-full overflow-auto p-5">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-x-3 gap-y-5">
        <Fig formulas={["A = \\pi r^2", "C = 2\\pi r"]}>
          <circle cx="65" cy="52" r="40" {...S} />
          <circle cx="65" cy="52" r="1.8" fill="#1e1e1e" />
          <line x1="65" y1="52" x2="105" y2="52" {...S} />
          <L x={85} y={47}>r</L>
        </Fig>
        <Fig formulas={["A = \\ell w"]}>
          <rect x="15" y="25" width="100" height="55" {...S} />
          <L x={65} y={96}>ℓ</L>
          <L x={123} y={57}>w</L>
        </Fig>
        <Fig formulas={["A = \\tfrac{1}{2}bh"]}>
          <path d="M10 85 L120 85 L45 15 Z" {...S} />
          <line x1="45" y1="15" x2="45" y2="85" {...D} />
          <path d="M45 78 h7 v7" {...S} />
          <L x={65} y={100}>b</L>
          <L x={38} y={55}>h</L>
        </Fig>
        <Fig formulas={["c^2 = a^2 + b^2"]}>
          <path d="M20 85 L115 85 L20 20 Z" {...S} />
          <path d="M20 77 h8 v8" {...S} />
          <L x={10} y={57}>a</L>
          <L x={67} y={100}>b</L>
          <L x={74} y={48}>c</L>
        </Fig>
        <figure className="flex flex-col items-center gap-1">
          <svg width="130" height="105" viewBox="0 0 130 105">
            <path d="M20 85 L110 85 L20 25 Z" {...S} />
            <path d="M20 77 h8 v8" {...S} />
            <L x={72} y={48}>2x</L>
            <L x={10} y={60}>x</L>
            <L x={65} y={100}>x√3</L>
            <text x="27" y="42" fontSize="11" fill="#1e1e1e">60°</text>
            <text x="82" y="81" fontSize="11" fill="#1e1e1e">30°</text>
          </svg>
          <figcaption className="text-center text-xs text-bb-muted">Special right triangles</figcaption>
        </figure>
        <figure className="flex flex-col items-center gap-1">
          <svg width="130" height="105" viewBox="0 0 130 105">
            <path d="M20 85 L90 85 L20 15 Z" {...S} />
            <path d="M20 77 h8 v8" {...S} />
            <L x={64} y={45}>s√2</L>
            <L x={11} y={55}>s</L>
            <L x={55} y={100}>s</L>
            <text x="25" y="35" fontSize="11" fill="#1e1e1e">45°</text>
            <text x="64" y="81" fontSize="11" fill="#1e1e1e">45°</text>
          </svg>
          <figcaption className="text-center text-xs text-bb-muted">Special right triangles</figcaption>
        </figure>
        <Fig formulas={["V = \\ell w h"]}>
          <path d="M15 40 L85 40 L85 90 L15 90 Z" {...S} />
          <path d="M15 40 L40 20 L110 20 L85 40 M110 20 L110 70 L85 90" {...S} />
          <path d="M15 90 L40 70 L110 70 M40 70 L40 20" {...D} />
          <L x={50} y={103}>ℓ</L>
          <L x={104} y={88}>w</L>
          <L x={7} y={68}>h</L>
        </Fig>
        <Fig formulas={["V = \\pi r^2 h"]}>
          <ellipse cx="65" cy="22" rx="35" ry="10" {...S} />
          <path d="M30 22 V82 M100 22 V82" {...S} />
          <path d="M30 82 A35 10 0 0 0 100 82" {...S} />
          <path d="M30 82 A35 10 0 0 1 100 82" {...D} />
          <line x1="65" y1="22" x2="100" y2="22" {...S} />
          <L x={82} y={18}>r</L>
          <L x={112} y={56}>h</L>
        </Fig>
        <Fig formulas={["V = \\tfrac{4}{3}\\pi r^3"]}>
          <circle cx="65" cy="52" r="40" {...S} />
          <path d="M25 52 A40 11 0 0 0 105 52" {...S} />
          <path d="M25 52 A40 11 0 0 1 105 52" {...D} />
          <line x1="65" y1="52" x2="105" y2="52" {...S} />
          <circle cx="65" cy="52" r="1.8" fill="#1e1e1e" />
          <L x={85} y={47}>r</L>
        </Fig>
        <Fig formulas={["V = \\tfrac{1}{3}\\pi r^2 h"]}>
          <path d="M30 82 L65 10 L100 82" {...S} />
          <path d="M30 82 A35 10 0 0 0 100 82" {...S} />
          <path d="M30 82 A35 10 0 0 1 100 82" {...D} />
          <line x1="65" y1="10" x2="65" y2="82" {...D} />
          <line x1="65" y1="82" x2="100" y2="82" {...D} />
          <L x={58} y={52}>h</L>
          <L x={84} y={78}>r</L>
        </Fig>
        <Fig formulas={["V = \\tfrac{1}{3}\\ell w h"]}>
          <path d="M15 80 L85 80 L110 62 M15 80 L62 12 L85 80 M62 12 L110 62" {...S} />
          <path d="M15 80 L40 62 L110 62 M40 62 L62 12" {...D} />
          <line x1="62" y1="12" x2="62" y2="71" {...D} />
          <L x={50} y={96}>ℓ</L>
          <L x={104} y={78}>w</L>
          <L x={55} y={50}>h</L>
        </Fig>
      </div>
      <ul className="mt-6 space-y-2 font-serif text-[15px] leading-snug">
        <li>The number of degrees of arc in a circle is 360.</li>
        <li>
          The number of radians of arc in a circle is <span dangerouslySetInnerHTML={{ __html: tex("2\\pi") }} />.
        </li>
        <li>The sum of the measures in degrees of the angles of a triangle is 180.</li>
      </ul>
    </div>
  );
}

export function ReferenceSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <FloatingPanel
      title="Reference"
      open={open}
      onClose={onClose}
      initial={{ x: typeof window === "undefined" ? 600 : Math.max(16, window.innerWidth - 640), y: 96, w: 600, h: 560 }}
      minW={320}
      minH={260}
    >
      <Sheet />
    </FloatingPanel>
  );
}
