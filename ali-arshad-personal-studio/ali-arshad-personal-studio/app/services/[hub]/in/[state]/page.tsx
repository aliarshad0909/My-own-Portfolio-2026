import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServiceAreaView } from "@/components/services/ServiceAreaView";
import { getHub } from "@/lib/seo/service-hubs";
import { getState } from "@/lib/geo/states";
import { getServiceArea, serviceAreaMatrix } from "@/lib/seo/service-areas";
import { shouldRender } from "@/lib/seo/publication";
import { serviceAreaMeta } from "@/lib/seo/service-area-content";
import { pageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ hub: string; state: string }> };

export function generateStaticParams() {
  return serviceAreaMatrix()
    .filter((a) => shouldRender(a.publicationState) && getHub(a.serviceSlug))
    .map((a) => ({ hub: a.serviceSlug, state: a.stateSlug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { hub, state } = await params;
  const area = getServiceArea(hub, state);
  const hubRec = getHub(hub);
  const stateRec = getState(state);
  if (!area || !hubRec || !stateRec) return {};
  const meta = serviceAreaMeta(area, hubRec, stateRec);
  return pageMetadata({ title: meta.title, description: meta.description, path: area.url, index: meta.index });
}

export default async function Page({ params }: Props) {
  const { hub, state } = await params;
  const area = getServiceArea(hub, state);
  const hubRec = getHub(hub);
  const stateRec = getState(state);
  if (!area || !hubRec || !stateRec || !shouldRender(area.publicationState)) notFound();
  return <ServiceAreaView area={area} hub={hubRec} state={stateRec} />;
}
