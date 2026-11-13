/**
 * Lexical retrieval over the knowledge base: Okapi BM25 with a small synonym
 * map and a title boost.
 *
 * This is NOT a language model. It ranks existing articles by term overlap and
 * returns the best match with a confidence score. It cannot write a new answer,
 * and when nothing scores well enough it says so and escalates.
 */

export type Article = {
  id: string;
  title: string;
  /** Short answer shown in the chat. */
  answer: string;
  /** Extra phrasings a customer might use. Indexed alongside the body. */
  questions: string[];
  category: string;
  body: string;
};

const STOPWORDS = new Set(
  "a an and are as at be but by can could do does did for from had has have how i if in into is it its me my of on or our so than that the their them then there these they this to up was we were what when where which who why will with you your".split(" "),
);

/** Light stemmer: enough to match plurals and common verb endings without a dependency. */
function stem(w: string): string {
  if (w.length <= 3) return w;
  for (const suffix of ["ingly", "edly", "ing", "ies", "ied", "es", "ed", "ly", "s"]) {
    if (w.endsWith(suffix) && w.length - suffix.length >= 3) {
      const base = w.slice(0, -suffix.length);
      return suffix === "ies" || suffix === "ied" ? `${base}y` : base;
    }
  }
  return w;
}

/** Words a customer uses that differ from the words in the docs. */
const SYNONYMS: Record<string, string[]> = {
  cancel: ["cancellation", "terminate", "end", "stop"],
  refund: ["money", "back", "reimburse", "charge"],
  password: ["passcode", "login", "signin", "credential"],
  invoice: ["bill", "billing", "receipt", "statement"],
  price: ["cost", "pricing", "fee", "charge"],
  upgrade: ["plan", "tier", "change"],
  delete: ["remove", "erase", "wipe"],
  export: ["download", "backup", "extract"],
  sso: ["saml", "okta", "single", "signon"],
  seat: ["user", "member", "licence", "license"],
  mobile: ["phone", "ios", "android", "app"],
  integration: ["connect", "api", "webhook", "zapier"],
  trial: ["free", "demo", "evaluation"],
  slow: ["performance", "lag", "speed"],
};

/**
 * Expansion runs both ways: a customer typing "bill" must reach an article
 * that says "invoice", not only the reverse. Built once at module load.
 */
const EXPANSION: Map<string, string[]> = (() => {
  const groups = Object.entries(SYNONYMS).map(([k, v]) => [k, ...v]);
  const map = new Map<string, Set<string>>();
  for (const group of groups) {
    for (const word of group) {
      const key = stem(word);
      const set = map.get(key) ?? new Set<string>();
      for (const other of group) if (stem(other) !== key) set.add(stem(other));
      map.set(key, set);
    }
  }
  return new Map([...map].map(([k, v]) => [k, [...v]]));
})();

export function tokenize(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w))
    .map(stem);
  const out = [...words];
  for (const w of words) {
    const extra = EXPANSION.get(w);
    if (extra) out.push(...extra);
  }
  return out;
}

type Indexed = { article: Article; terms: Map<string, number>; titleTerms: Set<string>; length: number };

export type Index = {
  docs: Indexed[];
  avgLength: number;
  /** Number of documents containing each term. */
  df: Map<string, number>;
};

export function buildIndex(articles: Article[]): Index {
  const docs: Indexed[] = articles.map((article) => {
    const tokens = tokenize(`${article.title} ${article.questions.join(" ")} ${article.body}`);
    const terms = new Map<string, number>();
    for (const t of tokens) terms.set(t, (terms.get(t) ?? 0) + 1);
    return { article, terms, titleTerms: new Set(tokenize(`${article.title} ${article.questions.join(" ")}`)), length: tokens.length };
  });
  const df = new Map<string, number>();
  for (const d of docs) for (const t of d.terms.keys()) df.set(t, (df.get(t) ?? 0) + 1);
  return { docs, avgLength: docs.reduce((s, d) => s + d.length, 0) / Math.max(1, docs.length), df };
}

export type Hit = { article: Article; score: number; matched: string[] };

const K1 = 1.4;
const B = 0.72;
const TITLE_BOOST = 1.8;

/** Rank articles for a query. Scores are normalised to 0–1 against the best possible match. */
export function search(index: Index, query: string, limit = 3): Hit[] {
  const terms = tokenize(query);
  if (terms.length === 0) return [];
  const N = index.docs.length;
  const scored = index.docs.map((d) => {
    let score = 0;
    const matched: string[] = [];
    for (const t of new Set(terms)) {
      const tf = d.terms.get(t);
      if (!tf) continue;
      matched.push(t);
      const df = index.df.get(t) ?? 0;
      const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
      const norm = tf * (K1 + 1) / (tf + K1 * (1 - B + (B * d.length) / index.avgLength));
      score += idf * norm * (d.titleTerms.has(t) ? TITLE_BOOST : 1);
    }
    return { article: d.article, score, matched };
  });
  const best = Math.max(...scored.map((s) => s.score), 0);
  if (best === 0) return [];
  return scored
    .map((s) => ({ ...s, score: Math.round((s.score / best) * 100) / 100 }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || a.article.id.localeCompare(b.article.id))
    .slice(0, limit);
}

/**
 * Confidence combines the margin over the runner-up with how much of the
 * question was actually matched. A single weak keyword is not confidence.
 */
export function confidence(hits: Hit[], query: string): number {
  if (hits.length === 0) return 0;
  const queryTerms = new Set(tokenize(query));
  if (queryTerms.size === 0) return 0;
  const coverage = hits[0].matched.length / queryTerms.size;
  const margin = hits.length > 1 ? Math.min(1, (hits[0].score - hits[1].score) / 0.4) : 1;
  return Math.round(Math.min(1, coverage * 0.75 + margin * 0.25) * 100) / 100;
}

/** Below this, the agent admits it does not know and offers a human. */
export const CONFIDENCE_FLOOR = 0.5;
