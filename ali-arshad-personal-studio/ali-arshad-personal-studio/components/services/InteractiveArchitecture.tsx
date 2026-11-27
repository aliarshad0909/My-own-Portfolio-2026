"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { Icon, type IconName } from "@/components/ui/Icon";

export type ArchNodeKind = "trigger" | "logic" | "integration" | "human" | "output";

export type ArchNode = {
  id: string;
  stage: string;
  label: string;
  subtitle: string;
  icon: IconName;
  kind: ArchNodeKind;
  summary: string;
  inputs: string;
  outputs: string;
  guardrail: string;
};

const KIND_LABEL: Record<ArchNodeKind, string> = {
  trigger: "Trigger",
  logic: "Logic & rules",
  integration: "Integration",
  human: "Human in the loop",
  output: "Output",
};

type Props = {
  eyebrow?: string;
  title: string;
  lead?: string;
  nodes: ArchNode[];
  caption: string;
};

/**
 * Interactive workflow & system architecture diagram.
 *
 * Visitors can inspect each stage of a pipeline (inputs, outputs, error or
 * human-approval guardrails) without leaving the page. Drawn in semantic HTML
 * so it reflows cleanly on narrow screens and stays fully keyboard-accessible.
 */
export function InteractiveArchitecture({ eyebrow = "Architecture", title, lead, nodes, caption }: Props) {
  const [activeId, setActiveId] = useState<string>(nodes[0]?.id ?? "");
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const active = nodes.find((n) => n.id === activeId) ?? nodes[0];

  if (!active) return null;

  const onNodeKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = index;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (index + 1) % nodes.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (index - 1 + nodes.length) % nodes.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = nodes.length - 1;
    else return;
    e.preventDefault();
    setActiveId(nodes[next].id);
    btnRefs.current[next]?.focus();
  };

  return (
    <figure className="arch">
      <div className="arch__head">
        <div>
          <p className="eyebrow eyebrow--plain">{eyebrow}</p>
          <figcaption>
            <h2 className="section-title section-title--sm">{title}</h2>
          </figcaption>
          {lead ? <p className="arch__lead measure">{lead}</p> : null}
        </div>
        <p className="arch__hint" aria-hidden="true">
          Select a stage to inspect
        </p>
      </div>

      <ol className="arch__track" role="list">
        {nodes.map((node, index) => {
          const isSelected = node.id === active.id;
          return (
            <li key={node.id} className="arch__item">
              <button
                ref={(el) => {
                  btnRefs.current[index] = el;
                }}
                type="button"
                className={`arch__node arch__node--${node.kind} ${isSelected ? "is-active" : ""}`.trim()}
                aria-pressed={isSelected}
                onClick={() => setActiveId(node.id)}
                onKeyDown={(e) => onNodeKeyDown(e, index)}
              >
                <span className="arch__node-top">
                  <span className="arch__num">{String(index + 1).padStart(2, "0")}</span>
                  <span className="arch__kind">{KIND_LABEL[node.kind]}</span>
                </span>
                <span className="arch__node-main">
                  <Icon name={node.icon} size={18} className="arch__icon" />
                  <span className="arch__label">{node.label}</span>
                </span>
                <span className="arch__sub">{node.subtitle}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="arch__inspector" role="region" aria-live="polite" aria-label={`Stage details: ${active.label}`}>
        <div className="arch__inspector-head">
          <span className={`arch__pill arch__pill--${active.kind}`}>{KIND_LABEL[active.kind]}</span>
          <h3 className="arch__inspector-title">
            {active.stage}: {active.label}
          </h3>
        </div>
        <p className="arch__inspector-summary">{active.summary}</p>
        <dl className="arch__meta">
          <div>
            <dt>Inputs</dt>
            <dd>{active.inputs}</dd>
          </div>
          <div>
            <dt>Outputs</dt>
            <dd>{active.outputs}</dd>
          </div>
          <div>
            <dt>Guardrail &amp; failure path</dt>
            <dd>{active.guardrail}</dd>
          </div>
        </dl>
      </div>

      <p className="arch__caption">{caption}</p>
    </figure>
  );
}

