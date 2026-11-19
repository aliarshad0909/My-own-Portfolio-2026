"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { Icon } from "@/components/ui/Icon";

export type WorkflowScenario = {
  id: string;
  label: string;
  category: string;
  summary: string;
  before: string[];
  after: string[];
  tools: string[];
  humanBoundary: string;
};

type Props = {
  eyebrow?: string;
  title: string;
  lead?: string;
  scenarios: WorkflowScenario[];
};

/**
 * Interactive before / after practical workflow explorer.
 *
 * Lets prospective clients switch between concrete operational scenarios and
 * see what changes, which tools connect, and where human judgement remains.
 */
export function WorkflowScenarios({ eyebrow = "In practice", title, lead, scenarios }: Props) {
  const [activeId, setActiveId] = useState<string>(scenarios[0]?.id ?? "");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const current = scenarios.find((s) => s.id === activeId) ?? scenarios[0];

  if (!current) return null;

  const onTabKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = index;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (index + 1) % scenarios.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (index - 1 + scenarios.length) % scenarios.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = scenarios.length - 1;
    else return;
    e.preventDefault();
    setActiveId(scenarios[next].id);
    tabRefs.current[next]?.focus();
  };

  return (
    <div className="scenarios">
      <div className="section-head">
        <p className="eyebrow eyebrow--plain">{eyebrow}</p>
        <h2 className="section-title">{title}</h2>
        {lead ? <p className="section-sub">{lead}</p> : null}
      </div>

      <div className="scenarios__tabs" role="tablist" aria-label={title}>
        {scenarios.map((s, idx) => {
          const selected = s.id === current.id;
          return (
            <button
              key={s.id}
              ref={(el) => {
                tabRefs.current[idx] = el;
              }}
              type="button"
              role="tab"
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              id={`tab-${s.id}`}
              aria-controls={`panel-${s.id}`}
              className={`scenarios__tab ${selected ? "is-active" : ""}`.trim()}
              onClick={() => setActiveId(s.id)}
              onKeyDown={(e) => onTabKeyDown(e, idx)}
            >
              <span className="scenarios__tab-cat">{s.category}</span>
              <span className="scenarios__tab-label">{s.label}</span>
            </button>
          );
        })}
      </div>

      <div
        className="scenarios__panel"
        role="tabpanel"
        id={`panel-${current.id}`}
        aria-labelledby={`tab-${current.id}`}
      >
        <p className="scenarios__summary">{current.summary}</p>

        <div className="scenarios__compare">
          <div className="scenarios__col scenarios__col--before">
            <h3 className="label">Manual bottleneck (Before)</h3>
            <ul className="plain-list">
              {current.before.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="scenarios__col scenarios__col--after">
            <h3 className="label">Structured workflow (After)</h3>
            <ul className="check-list">
              {current.after.map((item) => (
                <li key={item}>
                  <Icon name="check" size={16} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="scenarios__foot">
          <div className="scenarios__boundary">
            <span className="label">Human boundary</span>
            <p>{current.humanBoundary}</p>
          </div>
          <div className="scenarios__tools">
            <span className="label">Typical stack</span>
            <ul className="tag-list">
              {current.tools.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

