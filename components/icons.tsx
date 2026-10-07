import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement> & { size?: number };

function Base({ size = 22, children, ...rest }: P & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

/** Sun on the horizon line */
export const IconToday = (p: P) => (
  <Base {...p}>
    <path d="M3 17h18" />
    <path d="M7 17a5 5 0 0 1 10 0" />
    <path d="M12 6.5V8M5.6 9.6l1 1M18.4 9.6l-1 1" />
  </Base>
);

/** Horizon bar with a notch: a fast in progress */
export const IconFast = (p: P) => (
  <Base {...p}>
    <circle cx="12" cy="13" r="7.5" />
    <path d="M12 13V9M10 3h4" />
  </Base>
);

/** Tide curve */
export const IconHistory = (p: P) => (
  <Base {...p}>
    <path d="M3 18h18" />
    <path d="M3 14c2.5 0 3.5-7 6-7s3.5 9 6 9 3-5 6-5" />
  </Base>
);

export const IconSettings = (p: P) => (
  <Base {...p}>
    <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
    <circle cx="16" cy="7" r="2" />
    <circle cx="10" cy="17" r="2" />
  </Base>
);

export const IconPlus = (p: P) => (
  <Base {...p}>
    <path d="M12 5v14M5 12h14" />
  </Base>
);

export const IconCheck = (p: P) => (
  <Base {...p}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Base>
);

export const IconChevron = (p: P) => (
  <Base {...p}>
    <path d="M9 6l6 6-6 6" />
  </Base>
);

export const IconClose = (p: P) => (
  <Base {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Base>
);

export const IconDrop = (p: P) => (
  <Base {...p}>
    <path d="M12 3.5c3 3.6 5.5 6.6 5.5 10a5.5 5.5 0 0 1-11 0c0-3.4 2.5-6.4 5.5-10z" />
  </Base>
);

export const IconEdit = (p: P) => (
  <Base {...p}>
    <path d="M4 20h4L19 9l-4-4L4 16v4z" />
  </Base>
);

export const IconDownload = (p: P) => (
  <Base {...p}>
    <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
  </Base>
);

export const IconUpload = (p: P) => (
  <Base {...p}>
    <path d="M12 15V4M7 9l5-5 5 5M5 20h14" />
  </Base>
);

export const IconTrash = (p: P) => (
  <Base {...p}>
    <path d="M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13" />
  </Base>
);

export const IconLock = (p: P) => (
  <Base {...p}>
    <rect x="5" y="10.5" width="14" height="9.5" rx="2" />
    <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
  </Base>
);

export const IconMinus = (p: P) => (
  <Base {...p}>
    <path d="M5 12h14" />
  </Base>
);

export const IconCalendar = (p: P) => (
  <Base {...p}>
    <rect x="4" y="5" width="16" height="15" rx="3" />
    <path d="M4 10h16M9 3v4M15 3v4" />
    <path d="M12 13.5v2.5l1.5 1" />
  </Base>
);

/* ---------- metric icons (same 1.6 stroke family) ---------- */
export const IconHunger = (p: P) => (
  <Base {...p}>
    <path d="M4 11h16a8 8 0 0 1-16 0z" />
    <path d="M9 4.5c0 1.5 1 1.5 1 3M13 4.5c0 1.5 1 1.5 1 3" />
  </Base>
);

export const IconMoon = (p: P) => (
  <Base {...p}>
    <path d="M19.5 14.5A7.5 7.5 0 0 1 9.5 4.5a7.5 7.5 0 1 0 10 10z" />
  </Base>
);

export const IconScale = (p: P) => (
  <Base {...p}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
    <path d="M8.5 9a5 5 0 0 1 7 0M12 9l1.2-1.6" />
  </Base>
);

export const IconTimer = (p: P) => (
  <Base {...p}>
    <circle cx="12" cy="13" r="7.5" />
    <path d="M12 9.5V13l2.2 1.6M10 3h4" />
  </Base>
);

export const IconHeart = (p: P) => (
  <Base {...p}>
    <path d="M12 19s-7-4.4-7-9.6A4 4 0 0 1 12 7a4 4 0 0 1 7 2.4C19 14.6 12 19 12 19z" />
    <path d="M7.5 12h2.2l1.2-2 1.8 4 1.1-2h2.7" />
  </Base>
);

export const IconSteps = (p: P) => (
  <Base {...p}>
    <path d="M8 13.5c-1.6 0-2.5-1.6-2.5-4S6.6 5 8 5s2.3 2 2.3 4.4-.7 4.1-2.3 4.1zM6 16.5l4 .8" />
    <path d="M16 19c-1.6 0-2.3-1.7-2.3-4.1S14.6 10.5 16 10.5s2.5 2 2.5 4.4S17.6 19 16 19z" />
  </Base>
);

export const IconSpark = (p: P) => (
  <Base {...p}>
    <path d="M12 4v3M12 17v3M4 12h3M17 12h3M6.6 6.6l2 2M15.4 15.4l2 2M17.4 6.6l-2 2M8.6 15.4l-2 2" />
  </Base>
);

export const IconTrend = ({ dir, ...p }: P & { dir: 'up' | 'down' }) => (
  <Base {...p} strokeWidth={2}>
    {dir === 'down' ? <path d="M7 9l5 6 5-6" /> : <path d="M7 15l5-6 5 6" />}
  </Base>
);
