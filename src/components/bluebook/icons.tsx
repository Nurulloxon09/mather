import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

const base = (p: P): P => ({
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  ...p,
});

export const CalculatorIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="5" y="2.5" width="14" height="19" rx="2" />
    <rect x="7.5" y="5" width="9" height="4" rx="0.6" />
    <path d="M8.5 12.5h.01M12 12.5h.01M15.5 12.5h.01M8.5 15.5h.01M12 15.5h.01M15.5 15.5h.01M8.5 18.5h.01M12 18.5h.01M15.5 18.5h.01" strokeWidth={2.4} />
  </svg>
);

export const ReferenceIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 18 L10 6 L16 18 Z" />
    <path d="M17 4.5c.8-.9 3-.9 3 .7 0 1.2-1.5 1.8-3 3.3h3.2" strokeWidth={1.4} />
  </svg>
);

export const MoreIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="5" r="1.3" fill="currentColor" />
    <circle cx="12" cy="12" r="1.3" fill="currentColor" />
    <circle cx="12" cy="19" r="1.3" fill="currentColor" />
  </svg>
);

export const FullscreenIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
  </svg>
);

export const ExitFullscreenIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
  </svg>
);

export const BookmarkIcon = ({ filled, ...p }: P & { filled?: boolean }) => (
  <svg {...base(p)}>
    <path d="M6.5 3.5h11v17l-5.5-4-5.5 4z" fill={filled ? "currentColor" : "none"} />
  </svg>
);

export const ChevronDown = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 9l6 6 6-6" />
  </svg>
);

export const ChevronUp = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 15l6-6 6 6" />
  </svg>
);

export const CloseIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const PinIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 21s-6-5.6-6-11a6 6 0 1112 0c0 5.4-6 11-6 11z" fill="currentColor" stroke="none" />
    <circle cx="12" cy="10" r="2.2" fill="#fff" stroke="none" />
  </svg>
);

export const ClockIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </svg>
);

export const ExpandIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7" />
  </svg>
);

export const CollapseIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M20 10h-6V4M4 14h6v6M14 10l7-7M10 14l-7 7" />
  </svg>
);

export const GripIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M8 6h.01M8 12h.01M8 18h.01M16 6h.01M16 12h.01M16 18h.01" strokeWidth={3} />
  </svg>
);

export const CheckCircle = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9.5" fill="currentColor" stroke="none" />
    <path d="M7.5 12.5l3 3 6-6.5" stroke="#fff" strokeWidth={2.4} />
  </svg>
);

export const XCircle = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9.5" fill="currentColor" stroke="none" />
    <path d="M8.5 8.5l7 7M15.5 8.5l-7 7" stroke="#fff" strokeWidth={2.4} />
  </svg>
);

/** The "ABC" toggle that turns on answer elimination. */
export const StrikeToggleIcon = (p: P) => (
  <svg width={40} height={24} viewBox="0 0 40 24" aria-hidden {...p}>
    <rect x="1" y="1" width="38" height="22" rx="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
    <text x="20" y="16.5" textAnchor="middle" fontSize="12" fontWeight="700" fill="currentColor" fontFamily="inherit">
      ABC
    </text>
    <path d="M5 12h30" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);
