/**
 * Shared expertise primitives.
 *
 * These were the homepage dashboard; the homepage now has purpose-built
 * sections, so only the two reusable lists remain, used by /experience.
 */
import { EXPERTISE, TOOLS } from "@/lib/expertise";

export function ToolGrid() {
  return (
    <ul className="tool-grid">
      {TOOLS.map((t) => (
        <li key={t.name} className={`tool tool--${t.group.toLowerCase()}`}>
          <span className="tool__mark" aria-hidden="true">
            {t.mark}
          </span>
          <span className="tool__name">{t.name}</span>
        </li>
      ))}
    </ul>
  );
}

export function ExpertiseList() {
  return (
    <ul className="expertise-list">
      {EXPERTISE.map((e) => (
        <li key={e.discipline} className="expertise">
          <h3 className="expertise__title">{e.discipline}</h3>
          <p className="expertise__text">{e.description}</p>
          <ul className="expertise__tools" aria-label={`${e.discipline} tools and focus areas`}>
            {e.tools.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}
