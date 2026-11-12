import type { ReactNode, SVGProps } from "react";

/**
 * Small, consistent line-icon set (24px grid, 1.75 stroke, round joins).
 * Add a new icon by adding a key below — no icon dependency required.
 */
const PATHS = {
  "arrow-right": <path d="M5 12h14M13 6l6 6-6 6" />,
  "arrow-up-right": <path d="M7 17 17 7M8 7h9v9" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  alert: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5M12 16.5h.01" />
    </>
  ),
  lightbulb: (
    <>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3Z" />
    </>
  ),
  code: <path d="m8 7-5 5 5 5M16 7l5 5-5 5M13.5 5l-3 14" />,
  briefcase: (
    <>
      <rect x="3" y="7.5" width="18" height="12" rx="2" />
      <path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5M3 13h18" />
    </>
  ),
  clapperboard: (
    <>
      <path d="M4 10.5h16V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7.5Z" />
      <path d="m4 10.5-.7-3 15.6-3.8.7 3L4 10.5ZM8.2 6.3l1.9 2.8M13 5.1l1.9 2.8" />
    </>
  ),
  bot: (
    <>
      <rect x="4.5" y="8.5" width="15" height="11" rx="2.5" />
      <path d="M12 8.5V5M12 5h.01M2.5 13.5v2M21.5 13.5v2M9.5 13v1.5M14.5 13v1.5" />
    </>
  ),
  trending: <path d="M3 17l6-6 4 4 8-8M15 7h6v6" />,
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8.5" r="3.5" />
      <path d="M2.5 20c.5-3.6 3-5.5 6.5-5.5s6 1.9 6.5 5.5M16 5.2a3.5 3.5 0 0 1 0 6.6M18.5 14.9c1.7.8 2.7 2.5 3 5.1" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="m3.5 7.5 8.5 6 8.5-6" />
    </>
  ),
  play: <path d="M8 5.5v13l11-6.5-11-6.5Z" />,
  send: <path d="M21 3 10.5 13.5M21 3l-6.5 18-4-7.5L3 9.5 21 3Z" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.5l3.5 2" />
    </>
  ),
  layers: <path d="m12 3 9 5-9 5-9-5 9-5ZM3 12.5l9 5 9-5M3 17l9 5 9-5" />,
  graduation: <path d="m2 9 10-5 10 5-10 5L2 9ZM6 11.5V16c1.5 1.6 3.5 2.5 6 2.5s4.5-.9 6-2.5v-4.5M22 9v6" />,
  linkedin: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="2.5" />
      <path d="M8 10.5V16M8 7.8v.01M12 16v-3.2a2.2 2.2 0 0 1 4.4 0V16M12 10.5V16" />
    </>
  ),
  github: (
    <path d="M9 19c-4 1.2-4-2-5.5-2.5M14.5 21v-3.2c0-.9.1-1.3-.5-1.9 2.6-.3 5-1.3 5-5.4a4.2 4.2 0 0 0-1.1-2.9 3.9 3.9 0 0 0-.1-2.9s-1-.3-3.1 1.1a10.7 10.7 0 0 0-5.4 0C7.2 4.4 6.2 4.7 6.2 4.7a3.9 3.9 0 0 0-.1 2.9A4.2 4.2 0 0 0 5 10.5c0 4.1 2.4 5.1 5 5.4-.6.6-.6 1.2-.5 1.9V21" />
  ),
  instagram: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
      <circle cx="12" cy="12" r="3.8" />
      <path d="M17 7h.01" />
    </>
  ),
  behance: <path d="M3 6h5.5a3 3 0 0 1 0 6H3V6Zm0 6h6a3.2 3.2 0 0 1 0 6.4H3V12Zm12.5-5h5M14 15h7.5c0-2.5-1.4-4.2-3.7-4.2S14 12.5 14 15s1.5 4 3.8 4c1.6 0 2.8-.7 3.4-2" />,
  dribbble: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 4c2.5 3.5 4.5 8 5.5 16.5M3.2 10.5c5 .2 10-.5 14.3-4.6M5.5 18.2c2.5-4.5 8-7.5 15.4-5.7" />
    </>
  ),
  youtube: (
    <>
      <rect x="2.5" y="6" width="19" height="12" rx="3.5" />
      <path d="m10.5 9.5 4.5 2.5-4.5 2.5v-5Z" />
    </>
  ),
  x: <path d="M4 4l16 16M20 4 4 20" />,
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof PATHS;

type Props = { name: IconName; size?: number } & Omit<SVGProps<SVGSVGElement>, "name">;

export function Icon({ name, size = 20, ...rest }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}
