import type { Metadata } from "next";
import { MoqQuantityHelper } from "@/components/tools/MoqQuantityHelper";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { pageMetadata } from "@/lib/seo";
import { getTool } from "@/lib/tools/catalog";

const tool = getTool("moq-quantity-helper");

export const metadata: Metadata = pageMetadata({
  title: tool?.title ?? "MOQ & Order Quantity Helper",
  description:
    tool?.lead ??
    "Translate supplier MOQs, carton pack quantities, and export carton dimensions into cartons needed, total CBM volume, gross weight, and capital outlay.",
  path: "/tools/moq-quantity-helper",
});

export default function MoqQuantityHelperPage() {
  if (!tool) return null;
  return (
    <ToolPageShell tool={tool}>
      <MoqQuantityHelper />
    </ToolPageShell>
  );
}
