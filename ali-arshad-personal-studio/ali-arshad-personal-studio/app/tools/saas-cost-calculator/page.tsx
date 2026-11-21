import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { SaasCostCalculator } from "@/components/tools/SaasCostCalculator";
import { getTool, toolState } from "@/lib/tools/catalog";
import { isIndexable, shouldRender } from "@/lib/seo/publication";
import { pageMetadata } from "@/lib/seo";

const tool = getTool("saas-cost-calculator")!;

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
      <SaasCostCalculator />
    </ToolPageShell>
  );
}
