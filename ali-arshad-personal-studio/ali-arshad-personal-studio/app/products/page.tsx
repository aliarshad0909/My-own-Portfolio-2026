import type { Metadata } from "next";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { ProductDirectoryClient } from "@/components/products/ProductDirectoryClient";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageHero } from "@/components/ui/PageHero";
import { STUDIO_PRODUCTS } from "@/lib/products/catalog";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "12-Product SaaS & AI Software Ecosystem | Ali Arshad Personal Studio",
  description:
    "Explore twelve full-stack SaaS and AI products built with independent product identities, PostgreSQL persistence, authentication, real workflows, and automated QA — from CRM and ERP to React Flow automation and mobile inventory.",
  path: "/products",
});

export default function ProductsDirectoryPage() {
  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Product Ecosystem", path: "/products" },
        ]}
      />
      <PageHero
        eyebrow="12-Product SaaS & AI Ecosystem"
        title="Twelve standalone software products — engineered end to end."
        lead="Every product below is a working full-stack application with its own visual identity, PostgreSQL schema, authentication, seeded demonstration dataset, and automated test suite. Products marked Locally Tested / Demo Ready are verified locally and queued for consolidated deployment."
      />

      <section className="container section section--tight-top" aria-label="Product directory">
        <ProductDirectoryClient products={STUDIO_PRODUCTS} />

        <p className="fine-print" style={{ marginTop: "24px" }}>
          Honesty note: All twelve products are studio demonstration applications using fictional companies and datasets — none is presented as a paid client deployment, and public live URLs activate only after live hosting and HTTPS verification are complete.
        </p>
      </section>

      <ContactCTA
        standalone
        eyebrow="Commission a custom SaaS product"
        title="Need a tailored SaaS, ERP, AI workflow or mobile companion?"
        text="Every product in this directory can serve as an architectural reference for a custom-built platform scoped to your exact business operations."
        button="Discuss Your Software Build"
        secondaryHref="/tools"
        secondaryLabel="Open 10 Business Calculators"
      />
    </>
  );
}
