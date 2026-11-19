import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServiceSpokeView } from "@/components/services/ServiceSpokeView";
import { pageMetadata } from "@/lib/seo";
import { isIndexable, shouldRender } from "@/lib/seo/publication";
import { SERVICE_HUBS, getHub, getSpoke } from "@/lib/seo/service-hubs";

type Props = { params: Promise<{ hub: string; spoke: string }> };

export function generateStaticParams() {
  const params: { hub: string; spoke: string }[] = [];
  for (const h of SERVICE_HUBS) {
    for (const s of h.spokes) {
      if (shouldRender(s.publicationState)) params.push({ hub: h.slug, spoke: s.slug });
    }
  }
  return params;
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { hub, spoke } = await params;
  const record = getSpoke(hub, spoke);
  if (!record) return {};
  return pageMetadata({
    title: record.title,
    description: record.lead,
    path: `/services/${hub}/${spoke}`,
    index: isIndexable(record.publicationState),
  });
}

export default async function SpokePage({ params }: Props) {
  const { hub, spoke } = await params;
  const hubRecord = getHub(hub);
  const record = getSpoke(hub, spoke);
  if (!hubRecord || !record || !shouldRender(record.publicationState)) notFound();

  return <ServiceSpokeView hub={hubRecord} spoke={record} />;
}
