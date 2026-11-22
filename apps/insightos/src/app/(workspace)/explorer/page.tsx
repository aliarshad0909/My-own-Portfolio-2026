import { ExplorerClient } from "@/components/ExplorerClient";

export default async function ExplorerPage({
  searchParams,
}: {
  searchParams: Promise<{ datasetId?: string; dashboardId?: string }>;
}) {
  const params = await searchParams;
  return (
    <ExplorerClient
      initialDatasetId={params.datasetId || ""}
      initialDashboardId={params.dashboardId || ""}
    />
  );
}
