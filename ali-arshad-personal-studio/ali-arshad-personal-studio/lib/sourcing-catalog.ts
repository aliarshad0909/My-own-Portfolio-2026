/**
 * Complete Product Sourcing Catalogue data access layer.
 *
 * Server components import `ALL_SOURCING_PRODUCTS` (from `sourcing-catalog-data.json`)
 * for individual product pages, sitemap generation, and structured data.
 * Client search UI imports `SOURCING_CATALOG_INDEX` (from `sourcing-catalog-index.json`)
 * ONLY on the dedicated `/services/product-sourcing/catalog` route.
 */
import fullCatalogRaw from "@/lib/sourcing-catalog-data.json" with { type: "json" };
import catalogIndexRaw from "@/lib/sourcing-catalog-index.json" with { type: "json" };

export const MASTER_CATALOG_PDF_PATH = "/downloads/Ali-Arshad-Product-Sourcing-Catalogue.pdf";
export const SOURCING_CATALOG_PATH = "/services/product-sourcing/catalog";

export type SourcingCatalogCategoryId =
  | "kitchen-appliances"
  | "bags-luggage"
  | "mobile-accessories"
  | "lighting-solar"
  | "toys";

export type SourcingProductSpec = {
  label: string;
  value: string;
};

export type SourcingCatalogProduct = {
  slug: string;
  modelCode: string;
  shortName: string;
  title: string;
  categoryId: SourcingCatalogCategoryId;
  categoryLabel: string;
  subcategory: string;
  referenceCode: string;
  referenceCatalogLabel: string;
  sourceLocation: string;
  hasSpecSheet: boolean;
  variantCodes: string[];
  specs: SourcingProductSpec[];
  summary: string;
  availabilityStatus: string;
  attributionNote: string;
  image: string;
  imageAlt: string;
  pagePath: string;
  pdfPath: string;
  calculatorHref: string;
  calculatorLabel: string;
  guideHref: string;
  guideLabel: string;
};

export type SourcingCatalogIndexItem = {
  slug: string;
  modelCode: string;
  title: string;
  categoryId: SourcingCatalogCategoryId;
  categoryLabel: string;
  subcategory: string;
  referenceCode: string;
  hasSpecSheet: boolean;
  variantCount: number;
  variantCodes: string[];
  topSpecs: string[];
  image: string;
  imageAlt: string;
  pdfPath: string;
  pagePath: string;
  calculatorHref: string;
  calculatorLabel: string;
};

export const ALL_SOURCING_PRODUCTS: SourcingCatalogProduct[] =
  fullCatalogRaw as SourcingCatalogProduct[];

export const SOURCING_CATALOG_INDEX: SourcingCatalogIndexItem[] =
  catalogIndexRaw as SourcingCatalogIndexItem[];

export const INDEXABLE_SOURCING_PRODUCTS: SourcingCatalogProduct[] =
  ALL_SOURCING_PRODUCTS.filter((p) => p.hasSpecSheet);

const BY_SLUG = new Map<string, SourcingCatalogProduct>(
  ALL_SOURCING_PRODUCTS.map((p) => [p.slug, p]),
);

export function getSourcingProduct(slug: string): SourcingCatalogProduct | undefined {
  return BY_SLUG.get(slug);
}

export function relatedSourcingProducts(
  product: SourcingCatalogProduct,
  limit = 4,
): SourcingCatalogProduct[] {
  const sameSub = ALL_SOURCING_PRODUCTS.filter(
    (p) => p.slug !== product.slug && p.subcategory === product.subcategory,
  );
  const sameCat = ALL_SOURCING_PRODUCTS.filter(
    (p) =>
      p.slug !== product.slug &&
      p.categoryId === product.categoryId &&
      p.subcategory !== product.subcategory,
  );
  return [...sameSub.slice(0, limit), ...sameCat].slice(0, limit);
}

export const SOURCING_CATALOG_STATS = {
  totalUniqueProducts: ALL_SOURCING_PRODUCTS.length,
  withSpecSheet: INDEXABLE_SOURCING_PRODUCTS.length,
  visualOnly: ALL_SOURCING_PRODUCTS.length - INDEXABLE_SOURCING_PRODUCTS.length,
  totalVariantCodes: ALL_SOURCING_PRODUCTS.reduce((acc, p) => acc + p.variantCodes.length, 0),
  categoryCounts: {
    "kitchen-appliances": ALL_SOURCING_PRODUCTS.filter((p) => p.categoryId === "kitchen-appliances").length,
    "bags-luggage": ALL_SOURCING_PRODUCTS.filter((p) => p.categoryId === "bags-luggage").length,
    "mobile-accessories": ALL_SOURCING_PRODUCTS.filter((p) => p.categoryId === "mobile-accessories").length,
    "lighting-solar": ALL_SOURCING_PRODUCTS.filter((p) => p.categoryId === "lighting-solar").length,
    toys: ALL_SOURCING_PRODUCTS.filter((p) => p.categoryId === "toys").length,
  },
} as const;
