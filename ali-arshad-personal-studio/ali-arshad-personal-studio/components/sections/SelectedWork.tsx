import { ArrowLink } from "@/components/ui/Button";
import { ProjectCard } from "@/components/work/ProjectCard";
import { featuredProjects } from "@/lib/projects";

export function SelectedWork() {
  const projects = featuredProjects(3);
  const hasSampleMedia = projects.some((p) => p.usesSampleMedia === true);

  return (
    <section className="section section--tight" aria-labelledby="selected-work-title">
      <div className="container">
        <div className="panel panel--lg reveal">
          <div className="panel__head">
            <div>
              <h2 className="section-title" id="selected-work-title">
                Selected Work
              </h2>
              <p className="section-sub">A selection of creative, technical, and business projects.</p>
            </div>
            <ArrowLink href="/work">View All Projects</ArrowLink>
          </div>
          <div className={`project-grid ${projects.length === 1 ? "project-grid--single" : ""}`.trim()}>
            {projects.map((p) => (
              <ProjectCard key={p.slug} project={p} sizes={projects.length === 1 ? "(min-width: 900px) 620px, 100vw" : undefined} />
            ))}
          </div>
          {hasSampleMedia ? (
            <p className="panel__note">Cards marked with sample artwork are previews of the layout, not client work.</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
