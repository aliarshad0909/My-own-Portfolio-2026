import { IntegrationsClient } from "@/components/admin/IntegrationsClient";

export const dynamic = "force-dynamic";

export default async function AdminIntegrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ gmail?: string }>;
}) {
  const params = await searchParams;
  return <IntegrationsClient gmailNotice={params.gmail} />;
}
