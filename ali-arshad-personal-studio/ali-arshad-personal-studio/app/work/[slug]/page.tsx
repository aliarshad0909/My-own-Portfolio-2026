import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { ProjectDetail } from "@/components/work/ProjectDetail";
import { breadcrumbSchema, creativeWorkSchema } from "@/lib/structured-data";
import { PROJECTS, isIndexable } from "@/lib/projects";
import { pageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

const records = () => PROJECTS;

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
    title: project.title,
    description: project.summary,
    path: `/work/${project.slug}`,
    index: isIndexable(project),
  });
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const project = records().find((p) => p.slug === slug);
  if (!project) notFound();
  return (
    <>
      <JsonLd data={creativeWorkSchema(project, "project")} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Work", path: "/work" },
          { name: project.title, path: `/work/${project.slug}` },
        ])}
      />
      <ProjectDetail project={project} variant="project" />
    </>
  );
}
