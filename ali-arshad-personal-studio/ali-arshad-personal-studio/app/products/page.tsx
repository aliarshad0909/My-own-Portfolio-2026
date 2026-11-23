import type { Metadata } from "next";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { ProductDirectoryClient } from "@/components/products/ProductDirectoryClient";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageHero } from "@/components/ui/PageHero";
import { STUDIO_PRODUCTS } from "@/lib/products/catalog";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Product Directory — SaaS & AI Software Demonstrations",
  description:
    "Explore full-stack SaaS and AI demonstration applications built by Ali Arshad, including live public sandboxes for PipelineOS CRM and StockFlow Inventory + Mobile.",
  path: "/products",
});

export default function ProductsDirectoryPage() {
  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Product Directory", path: "/products" },
        ]}
      />
      <PageHero
        eyebrow="Studio Software Directory"
        title="Full-stack SaaS and AI product demonstrations"
        lead="PipelineOS CRM and StockFlow Inventory (plus its mobile web preview) are live right now at their public domains. Additional studio applications in this directory are verified locally in the repository and available as architectural references for custom builds."
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
