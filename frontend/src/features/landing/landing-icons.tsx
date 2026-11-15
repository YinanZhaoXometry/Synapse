// Inline icon set ported from the Open Design deliverable (stroke icons ride
// currentColor and size via the .lp-icon custom property in landing.css).

function iconProps(className = "lp-icon") {
  return {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
}

/* The GitHub mark (owner ask 2026-11-15): the official filled silhouette —
 * a brand glyph, not a stroke icon, so it overrides the shared props. */
export function GithubIcon() {
  return (
    <svg className="lp-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.75 2.69 1.25 3.34.95.1-.74.4-1.25.72-1.53-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.78 0c2.2-1.49 3.16-1.18 3.16-1.18.63 1.59.24 2.76.12 3.05.74.8 1.19 1.83 1.19 3.09 0 4.42-2.7 5.39-5.27 5.68.41.35.78 1.05.78 2.12 0 1.53-.01 2.76-.01 3.14 0 .3.2.67.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  );
}

export function DownloadIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M12 3v12m0 0 4-4m-4 4-4-4M5 17v3h14v-3" />
    </svg>
  );
}

export function ArrowDownIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M12 5v14m0 0 5-5m-5 5-5-5" />
    </svg>
  );
}

export function ArrowRightIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M5 12h14m-5-5 5 5-5 5" />
    </svg>
  );
}

export function CloseIcon() {
  return (
    <svg {...iconProps()}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

export function MenuIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function CheckIcon() {
  return (
    <svg {...iconProps()}>
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

export function BulbIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M12 3a6 6 0 0 0-3.5 10.9c.8.6 1.2 1.3 1.3 2.1h4.4c.1-.8.5-1.5 1.3-2.1A6 6 0 0 0 12 3Z" />
      <path d="M10 19h4m-3 2h2" />
    </svg>
  );
}

/** The tab rail's four feature icons (03 产品演示 sidebar). */
export function OrganizeIcon() {
  return (
    <svg {...{ ...iconProps(), strokeWidth: 1.7 }}>
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="18" cy="6" r="2.5" />
      <circle cx="12" cy="18" r="2.5" />
      <path d="m7.5 7.5 3.3 8M16.5 7.5l-3.3 8M8.5 6h7" />
    </svg>
  );
}

export function PlanIcon() {
  return (
    <svg {...{ ...iconProps(), strokeWidth: 1.7 }}>
      <rect x="4" y="5" width="16" height="15" rx="3" />
      <path d="M8 3v4m8-4v4M4 10h16m-11 4h2m3 0h2m-7 3h2" />
    </svg>
  );
}

export function AskIcon() {
  return (
    <svg {...{ ...iconProps(), strokeWidth: 1.7 }}>
      <path d="M20 15a3 3 0 0 1-3 3H9l-5 3v-6a3 3 0 0 1-1-2.2V7a3 3 0 0 1 3-3h11a3 3 0 0 1 3 3Z" />
      <path d="M8 9h8m-8 4h5" />
    </svg>
  );
}

export function ReviewIcon() {
  return (
    <svg {...{ ...iconProps(), strokeWidth: 1.7 }}>
      <path d="M4 19V5m0 14h16" />
      <path d="m7 15 4-5 3 3 5-7" />
      <circle cx="7" cy="15" r="1" />
      <circle cx="11" cy="10" r="1" />
      <circle cx="14" cy="13" r="1" />
      <circle cx="19" cy="6" r="1" />
    </svg>
  );
}

/**
 * The Synapse mark (header brand + footer): the app's own /logo.png, same
 * asset + rounded-corner treatment as AppLayout's brand block (round 3
 * unification). The round-1 coral SVG mark lives on as a design reference at
 * docs/design/landing-brand-mark-round1.svg.
 */
export function BrandMark({ className = "lp-brand-mark" }: { className?: string }) {
  return <img src="/logo.png" alt="" aria-hidden="true" className={className} draggable={false} />;
}
