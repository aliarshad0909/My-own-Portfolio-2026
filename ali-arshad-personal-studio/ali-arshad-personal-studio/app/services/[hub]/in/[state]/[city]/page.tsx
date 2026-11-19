import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CityServiceAreaView } from "@/components/services/CityServiceAreaView";
import { getHub } from "@/lib/seo/service-hubs";
import { getState } from "@/lib/geo/states";
import { cityServiceAreas, getCityServiceArea } from "@/lib/seo/service-areas";
import { shouldRender } from "@/lib/seo/publication";
import { cityServiceAreaMeta } from "@/lib/seo/service-area-content";
import { pageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ hub: string; state: string; city: string }> };

export function generateStaticParams() {
  return cityServiceAreas()
    .filter((a) => shouldRender(a.publicationState) && getHub(a.serviceSlug))
    .map((a) => ({ hub: a.serviceSlug, state: a.stateSlug, city: a.citySlug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { hub, state, city } = await params;
  const area = getCityServiceArea(hub, state, city);
  const hubRec = getHub(hub);
  if (!area || !hubRec) return {};
  const meta = cityServiceAreaMeta(area, hubRec);
  return pageMetadata({ title: meta.title, description: meta.description, path: area.url, index: meta.index });
}

export default async function Page({ params }: Props) {
  const { hub, state, city } = await params;
  const area = getCityServiceArea(hub, state, city);
  const hubRec = getHub(hub);
  const stateRec = getState(state);
  if (!area || !hubRec || !stateRec || !shouldRender(area.publicationState)) notFound();
  return <CityServiceAreaView area={area} hub={hubRec} state={stateRec} />;
}
