import type { Metadata } from "next";
import { GpuQuoteEstimator } from "@/components/tools/GpuQuoteEstimator";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { pageMetadata } from "@/lib/seo";
import { getTool } from "@/lib/tools/catalog";

const tool = getTool("gpu-quote-estimator");

export const metadata: Metadata = pageMetadata({
  title: tool?.title ?? "GPU & Compute Quote Scope Estimator",
  description:
    tool?.lead ??
    "Structure your workload footprint, access needs, and persistence expectations to request an honest GPU compute availability check and custom quote.",
  path: "/tools/gpu-quote-estimator",
});

export default function GpuQuoteEstimatorPage() {
  if (!tool) return null;
  return (
    <ToolPageShell tool={tool}>
      <GpuQuoteEstimator />
    </ToolPageShell>
  );
}
