import type { ReactNode } from "react";

type Props = {
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  children?: ReactNode;
  /** Optional visual placed on the right on desktop. */
  aside?: ReactNode;
};

/** Shared inner-page hero so every page opens with the same rhythm. */
export function PageHero({ eyebrow, title, lead, children, aside }: Props) {
  return (
    <section className={`page-hero ${aside ? "page-hero--split" : ""}`.trim()}>
      <div className="container page-hero__inner">
        <div className="page-hero__copy enter">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="page-title">{title}</h1>
          {lead ? <p className="lead">{lead}</p> : null}
          {children}
        </div>
        {aside ? <div className="page-hero__aside">{aside}</div> : null}
      </div>
    </section>
  );
}
