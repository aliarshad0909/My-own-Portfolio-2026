import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { ProfitMarginCalculator } from "@/components/tools/ProfitMarginCalculator";
import { getTool, toolState } from "@/lib/tools/catalog";
import { isIndexable, shouldRender } from "@/lib/seo/publication";
import { pageMetadata } from "@/lib/seo";

const tool = getTool("profit-margin-calculator")!;

export const metadata: Metadata = pageMetadata({
  title: tool.title,
  description: tool.lead,
  path: `/tools/${tool.slug}`,
  index: isIndexable(toolState(tool)),
});

export default function Page() {
  if (!shouldRender(toolState(tool))) notFound();
  return (
    <ToolPageShell tool={tool}>
      <ProfitMarginCalculator />
    </ToolPageShell>
  );
}
