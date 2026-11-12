import Link from "next/link";
import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/Icon";

type Variant = "primary" | "secondary" | "ghost";

type Props = {
  href: string;
  children: ReactNode;
  variant?: Variant;
  icon?: IconName | null;
  iconLeft?: IconName;
  className?: string;
  size?: "md" | "sm";
};

/** Link styled as a button. Use for all navigational CTAs. */
export function ButtonLink({ href, children, variant = "primary", icon = "arrow-right", iconLeft, className = "", size = "md" }: Props) {
  return (
    <Link href={href} className={`btn btn--${variant} btn--${size} ${className}`.trim()}>
      {iconLeft ? <Icon name={iconLeft} size={18} /> : null}
      <span>{children}</span>
      {icon ? <Icon name={icon} size={18} className="btn__icon" /> : null}
    </Link>
  );
}

/** Inline text link with an arrow. */
export function ArrowLink({ href, children, className = "" }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={`arrow-link ${className}`.trim()}>
      <span>{children}</span>
      <Icon name="arrow-right" size={18} />
    </Link>
  );
}
