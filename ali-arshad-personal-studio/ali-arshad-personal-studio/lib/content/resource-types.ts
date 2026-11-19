import type { PublicationState } from "@/lib/seo/publication";

export type ArticleBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "callout"; title: string; text: string }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "code"; text: string };

export type ResourceCategory =
  | "AI & Automation"
  | "Web Engineering"
  | "Ecommerce & Brand"
  | "Creative & Sourcing";

export type Resource = {
  slug: string; // /resources/<slug>
  keywordId: string;
  category: ResourceCategory;
  readMinutes: number;
  title: string;
  description: string;
  /** Short standfirst under the H1. */
  lead: string;
  publicationState: PublicationState;
  /** Internal links to weave in (service hub, tool, work). */
  related: string[];
  body: ArticleBlock[];
};

export const p = (text: string): ArticleBlock => ({ type: "p", text });
export const h2 = (text: string): ArticleBlock => ({ type: "h2", text });
export const h3 = (text: string): ArticleBlock => ({ type: "h3", text });
export const ul = (items: string[]): ArticleBlock => ({ type: "ul", items });
export const ol = (items: string[]): ArticleBlock => ({ type: "ol", items });
export const callout = (title: string, text: string): ArticleBlock => ({ type: "callout", title, text });
export const table = (headers: string[], rows: string[][]): ArticleBlock => ({ type: "table", headers, rows });
export const code = (text: string): ArticleBlock => ({ type: "code", text });

