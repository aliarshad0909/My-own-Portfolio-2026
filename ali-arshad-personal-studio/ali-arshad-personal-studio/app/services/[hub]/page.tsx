import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServiceHubView } from "@/components/services/ServiceHubView";
import { SERVICE_HUBS, getHub } from "@/lib/seo/service-hubs";
import { isIndexable, shouldRender } from "@/lib/seo/publication";
import { pageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ hub: string }> };

export function generateStaticParams() {
  return SERVICE_HUBS.filter((h) => shouldRender(h.publicationState)).map((h) => ({
    hub: h.slug,
  }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { hub } = await params;
  const record = getHub(hub);
  if (!record) return {};
  return pageMetadata({
    title: record.title,
    description: record.lead,
    path: `/services/${record.slug}`,
    index: isIndexable(record.publicationState),
  });
}

export default async function HubPage({ params }: Props) {
  const { hub } = await params;
  const record = getHub(hub);
  if (!record || !shouldRender(record.publicationState)) notFound();
  return <ServiceHubView hub={record} />;
}
