import { ArrowLink } from "@/components/ui/Button";
import { ProjectCard } from "@/components/work/ProjectCard";
import { featuredProjects } from "@/lib/projects";

export function SelectedWork() {
  const projects = featuredProjects(3);
  const hasPlaceholders = projects.some((p) => p.status === "placeholder");

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
          <div className="project-grid">
            {projects.map((p) => (
              <ProjectCard key={p.slug} project={p} />
            ))}
          </div>
          {hasPlaceholders ? (
            <p className="panel__note">Cards marked &ldquo;Placeholder&rdquo; use sample artwork to preview the layout. Real client projects are being added.</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
