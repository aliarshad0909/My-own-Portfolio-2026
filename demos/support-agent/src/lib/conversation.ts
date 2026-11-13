import { CONFIDENCE_FLOOR, confidence, search, type Hit, type Index } from "./retrieval.ts";

export type Role = "customer" | "agent" | "system";

export type Message = {
  id: string;
  role: Role;
  text: string;
  at: number;
  /** Articles the answer came from, so the source is always visible. */
  sources?: { id: string; title: string }[];
  confidence?: number;
  /** Suggestions the customer can tap. */
  options?: string[];
};

export type Contact = { name: string; email: string; note: string; consent: boolean };

export type Conversation = {
  id: string;
  startedAt: number;
  messages: Message[];
  /** Questions the agent could not answer confidently. */
  unanswered: string[];
  escalated: boolean;
  contact: Contact | null;
  resolvedBy: "agent" | "human" | null;
};

export const GREETING =
  "Hi — I'm the Tideline support assistant. I search our help articles and quote them back to you. I'm not a language model, so I can't invent an answer: if I don't find a good match I'll hand you to a person.";

export const emptyContact = (): Contact => ({ name: "", email: "", note: "", consent: false });

export const newConversation = (id: string, now: number): Conversation => ({
  id,
  startedAt: now,
  messages: [{ id: `${id}-0`, role: "agent", text: GREETING, at: now, options: ["How much does it cost?", "Reset my password", "Cancel my subscription"] }],
  unanswered: [],
  escalated: false,
  contact: null,
  resolvedBy: null,
});

export type Reply = { conversation: Conversation; hit: Hit | null };

/** Phrases that should go straight to a human, whatever the knowledge base says. */
const HUMAN_REQUEST = /\b(speak|talk|chat)\s+(to|with)\s+(a\s+)?(human|person|someone|agent|advisor)|real person|human please/i;

/**
 * Answer one customer message.
 *
 * The agent only ever returns text from an article. When confidence is below
 * the floor, it says it doesn't know and offers a human — it never guesses.
 */
export function respond(conv: Conversation, index: Index, text: string, now: number): Reply {
  const trimmed = text.trim();
  if (trimmed === "") return { conversation: conv, hit: null };

  const n = conv.messages.length;
  const customer: Message = { id: `${conv.id}-${n}`, role: "customer", text: trimmed, at: now };

  if (HUMAN_REQUEST.test(trimmed)) {
    const agent: Message = {
      id: `${conv.id}-${n + 1}`,
      role: "agent",
      text: "Of course. Leave your details below and a person will pick this up — they'll see everything we've discussed so far.",
      at: now,
    };
    return { conversation: { ...conv, messages: [...conv.messages, customer, agent], escalated: true }, hit: null };
  }

  const hits = search(index, trimmed, 3);
  const score = confidence(hits, trimmed);
  const top = hits[0] ?? null;

  if (!top || score < CONFIDENCE_FLOOR) {
    const suggestions = hits.slice(0, 3).map((h) => h.article.title);
    const agent: Message = {
      id: `${conv.id}-${n + 1}`,
      role: "agent",
      text:
        suggestions.length > 0
          ? "I'm not confident I have the right article for that. These are the closest matches — or I can pass you to a person."
          : "I couldn't find anything in the help centre that matches that. A person will be able to help — shall I pass you over?",
      at: now,
      confidence: score,
      options: [...suggestions, "Talk to a person"],
    };
    return {
      conversation: { ...conv, messages: [...conv.messages, customer, agent], unanswered: [...conv.unanswered, trimmed] },
      hit: null,
    };
  }

  const agent: Message = {
    id: `${conv.id}-${n + 1}`,
    role: "agent",
    text: top.article.answer,
    at: now,
    sources: [{ id: top.article.id, title: top.article.title }],
    confidence: score,
    options: ["That helped", "Talk to a person"],
  };
  return { conversation: { ...conv, messages: [...conv.messages, customer, agent], resolvedBy: null }, hit: top };
}

export type ContactErrors = Partial<Record<keyof Contact, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateContact(c: Contact): ContactErrors {
  const e: ContactErrors = {};
  if (c.name.trim().length < 2) e.name = "Please enter your name.";
  if (!EMAIL.test(c.email.trim())) e.email = "Please enter a valid email address.";
  if (!c.consent) e.consent = "Please confirm we can use these details to reply.";
  return e;
}

/** What a real deployment would POST to a helpdesk or CRM. */
export function handoffPayload(conv: Conversation) {
  return {
    conversationId: conv.id,
    startedAt: new Date(conv.startedAt).toISOString(),
    contact: conv.contact,
    unanswered: conv.unanswered,
    transcript: conv.messages.map((m) => ({ role: m.role, text: m.text, at: new Date(m.at).toISOString(), sources: m.sources?.map((s) => s.id) ?? [] })),
  };
}
