import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Page not found — Ali Arshad", robots: { index: false } };

export default function NotFound() {
  return (
    <section className="page-hero not-found">
      <div className="container enter">
        <p className="eyebrow">404</p>
        <h1 className="page-title">This page doesn&rsquo;t exist</h1>
        <p className="lead">The link may be out of date, or the page may have moved.</p>
        <div className="hero__actions">
          <ButtonLink href="/">Back to home</ButtonLink>
          <ButtonLink href="/work" variant="secondary" icon={null}>
            View work
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
