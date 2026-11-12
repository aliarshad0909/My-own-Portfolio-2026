import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectDetail } from "@/components/work/ProjectDetail";
import { caseStudies, isIndexable } from "@/lib/projects";
import { pageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

const records = () => caseStudies();

export function generateStaticParams() {
  return records().map((p) => ({ slug: p.slug }));
}

// Unknown slugs return a 404 instead of rendering on demand.
export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = records().find((p) => p.slug === slug);
  if (!project) return {};
  return pageMetadata({
    title: `${project.title} — Case Study`,
    description: project.summary,
    path: `/case-studies/${project.slug}`,
    index: isIndexable(project),
  });
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const project = records().find((p) => p.slug === slug);
  if (!project) notFound();
  return <ProjectDetail project={project} variant="case-study" />;
}
