"use client";

import type { ReactNode } from "react";

function renderInline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*|_[^_]+_)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={idx} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={idx}
          className="rounded bg-[#0d0f14] px-1.5 py-0.5 font-mono text-[0.85em] text-[#ffb4a2]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if ((part.startsWith("*") && part.endsWith("*")) || (part.startsWith("_") && part.endsWith("_"))) {
      return (
        <em key={idx} className="text-[#9ca7bc] italic">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
}

type Segment =
  | { kind: "h2"; text: string }
  | { kind: "h3"; text: string }
  | { kind: "h4"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] }
  | { kind: "p"; text: string };

function parseMarkdown(content: string): Segment[] {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const segments: Segment[] = [];
  let i = 0;

  while (i < lines.length) {
    const trimmed = lines[i].trim();
    if (!trimmed) {
      i += 1;
      continue;
    }

    if (trimmed.startsWith("#### ")) {
      segments.push({ kind: "h4", text: trimmed.slice(5) });
      i += 1;
      continue;
    }
    if (trimmed.startsWith("### ")) {
      segments.push({ kind: "h3", text: trimmed.slice(4) });
      i += 1;
      continue;
    }
    if (trimmed.startsWith("## ")) {
      segments.push({ kind: "h2", text: trimmed.slice(3) });
      i += 1;
      continue;
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const items: string[] = [];
      while (i < lines.length) {
        const t = lines[i].trim();
        if (t.startsWith("- ") || t.startsWith("* ")) {
          items.push(t.slice(2));
          i += 1;
        } else {
          break;
        }
      }
      segments.push({ kind: "ul", items });
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length) {
        const t = lines[i].trim();
        if (/^\d+\.\s+/.test(t)) {
          items.push(t.replace(/^\d+\.\s+/, ""));
          i += 1;
        } else {
          break;
        }
      }
      segments.push({ kind: "ol", items });
      continue;
    }

    const paraLines: string[] = [];
    while (i < lines.length) {
      const t = lines[i].trim();
      if (
        !t ||
        t.startsWith("## ") ||
        t.startsWith("### ") ||
        t.startsWith("#### ") ||
        t.startsWith("- ") ||
        t.startsWith("* ") ||
        /^\d+\.\s+/.test(t)
      ) {
        break;
      }
      paraLines.push(t);
      i += 1;
    }
    segments.push({ kind: "p", text: paraLines.join(" ") });
  }

  return segments;
}

export function MarkdownRenderer({ content }: { content: string }) {
  const segments = parseMarkdown(content);

  return (
    <div className="space-y-3 text-sm leading-relaxed text-[#cbd4e4]">
      {segments.map((seg, idx) => {
        if (seg.kind === "h4") {
          return (
            <h4 key={idx} className="pt-1 text-sm font-bold text-[#ffb4a2]">
              {renderInline(seg.text)}
            </h4>
          );
        }
        if (seg.kind === "h3") {
          return (
            <h3 key={idx} className="pt-1 text-base font-bold text-white">
              {renderInline(seg.text)}
            </h3>
          );
        }
        if (seg.kind === "h2") {
          return (
            <h2 key={idx} className="pt-2 text-lg font-bold tracking-tight text-white">
              {renderInline(seg.text)}
            </h2>
          );
        }
        if (seg.kind === "ul") {
          return (
            <ul key={idx} className="space-y-1.5 pl-5">
              {seg.items.map((item, lIdx) => (
                <li key={lIdx} className="list-disc text-[#cbd4e4] marker:text-[#ff6b4a]">
                  {renderInline(item)}
                </li>
              ))}
            </ul>
          );
        }
        if (seg.kind === "ol") {
          return (
            <ol key={idx} className="space-y-1.5 pl-5">
              {seg.items.map((item, lIdx) => (
                <li key={lIdx} className="list-decimal text-[#cbd4e4] marker:font-semibold marker:text-[#ff6b4a]">
                  {renderInline(item)}
                </li>
              ))}
            </ol>
          );
        }
        return (
          <p key={idx} className="text-[#cbd4e4]">
            {renderInline(seg.text)}
          </p>
        );
      })}
    </div>
  );
}
