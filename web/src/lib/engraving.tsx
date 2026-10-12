import type { ReactNode } from "react";

// The Engraving: the shared visual primitives of the banknote world.
// All are decorative/structural SVG drawn in code — the guilloché is a real
// generated epitrochoid (not an image), the seal a real medallion. Kept here so
// every screen composes the same note, cards, and marks.

// ---- Guilloché ------------------------------------------------------------
// Concentric epitrochoid "spirograph" curves + fine rings: banknote security
// line-work generated at render time.
export function Guilloche({
  w = 338,
  h = 200,
  stroke = "rgba(241,234,214,.5)",
  sw = 0.55,
  layers = 5,
  f = 7,
  R = 150,
  className = "guilloche",
}: {
  w?: number;
  h?: number;
  stroke?: string;
  sw?: number;
  layers?: number;
  f?: number;
  R?: number;
  className?: string;
}) {
  const cx = w / 2;
  const cy = h / 2;
  const paths: string[] = [];
  for (let L = 0; L < layers; L++) {
    const e = 0.28 + L * 0.11;
    const rot = L * (Math.PI / layers);
    const rr = R * (0.55 + L * 0.09);
    let d = "M";
    const steps = 480;
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * Math.PI * 2;
      const x = cx + rr * (Math.cos(t + rot) + e * Math.cos(f * t + rot));
      const y = cy + rr * (Math.sin(t + rot) + e * Math.sin(f * t + rot));
      d += (i ? " L" : "") + x.toFixed(1) + "," + y.toFixed(1);
    }
    paths.push(d);
  }
  const rings: number[] = [];
  for (let r = R * 0.2; r < R * 1.15; r += R * 0.14) rings.push(r);
  return (
    <svg
      className={className}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {paths.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={stroke} strokeWidth={sw} />
      ))}
      {rings.map((r, i) => (
        <circle
          key={"r" + i}
          cx={cx}
          cy={cy}
          r={Number(r.toFixed(1))}
          fill="none"
          stroke={stroke}
          strokeWidth={Number((sw * 0.7).toFixed(2))}
          opacity={0.5}
        />
      ))}
    </svg>
  );
}

// ---- Seal / medallion -----------------------------------------------------
// Carries a state word (sync status, account open, etc.) stamped in gold.
export function Seal({
  state = "ISSUED",
  className = "seal",
}: {
  state?: string;
  className?: string;
}) {
  const ring = "KHARCHA · REGISTER OF ACCOUNT · ".split("");
  const R = 40;
  const cx = 50;
  const cy = 50;
  return (
    <span className={className}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="47" fill="none" stroke="var(--gold)" strokeWidth="1.4" />
        <circle cx="50" cy="50" r="33" fill="none" stroke="var(--gold)" strokeWidth="0.8" opacity="0.8" />
        {ring.map((c, i) => {
          const a = (i / ring.length) * Math.PI * 2 - Math.PI / 2;
          const x = cx + R * Math.cos(a);
          const y = cy + R * Math.sin(a);
          return (
            <text
              key={i}
              x={x.toFixed(1)}
              y={y.toFixed(1)}
              fontFamily="Archivo"
              fontSize="5.4"
              fill="var(--gold)"
              textAnchor="middle"
              transform={`rotate(${(a * 180 / Math.PI + 90).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})`}
            >
              {c === " " ? "·" : c}
            </text>
          );
        })}
        <path d="M38 50 l8 8 l16 -18" stroke="var(--gold)" strokeWidth="1" fill="none" />
        <text x="50" y="70" fontFamily="Archivo" fontSize="6.5" fill="var(--gold)" textAnchor="middle" fontWeight="600">
          {state}
        </text>
      </svg>
    </span>
  );
}

// ---- Icons ----------------------------------------------------------------
// One stroke weight, drawn (never emoji/unicode).
const PATHS = {
  dash: (<><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18M8 4v16" /></>),
  entries: (<><path d="M4 7h11M4 12h16M4 17h8" /><path d="M17 5l3 2-3 2" /></>),
  accounts: (<><rect x="3" y="6" width="18" height="12" rx="2" /><circle cx="12" cy="12" r="2.3" /></>),
  books: (<><path d="M4 4h7l9 9-7 7-9-9z" /><circle cx="8" cy="8" r="1.2" fill="currentColor" /></>),
  report: (<><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v4h4M9 13h6M9 17h6" /></>),
  plus: <path d="M12 5v14M5 12h14" />,
  up: <path d="M12 19V6M6 12l6-6 6 6" />,
  down: <path d="M12 5v13M6 12l6 6 6-6" />,
  swap: <path d="M7 7h11l-3-3M17 17H6l3 3" />,
  chevL: <path d="M15 6l-6 6 6 6" />,
  chevR: <path d="M9 6l6 6-6 6" />,
  search: (<><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></>),
  download: <path d="M12 4v10M8 11l4 4 4-4M5 19h14" />,
  trash: (<><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" /></>),
  signout: (<><path d="M9 21H5V3h4M14 8l4 4-4 4M18 12H9" /></>),
  check: <path d="M5 12l4 4 10-11" />,
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof PATHS;

export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}

// Icon for a transaction type (arrow direction / transfer).
export function typeIcon(type: "INCOME" | "EXPENSE" | "TRANSFER"): IconName {
  return type === "INCOME" ? "up" : type === "EXPENSE" ? "down" : "swap";
}

// ---- Account avatar (monogram medallion) ----------------------------------
// The web client shows a drawn monogram rather than fetching a bank favicon
// (that's a device-local mobile feature). Color is derived from the id so it is
// stable per account.
const AVATAR_COLORS = ["#27456b", "#13553b", "#9a7322", "#5a2f4a", "#1f5a56", "#6b5330", "#9c2b24", "#4f5a28"];

export function accountColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export function monogram(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
