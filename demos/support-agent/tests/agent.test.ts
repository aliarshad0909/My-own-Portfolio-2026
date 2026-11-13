import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ARTICLES } from "../src/data/kb.ts";
import { handoffPayload, newConversation, respond, validateContact, type Conversation } from "../src/lib/conversation.ts";
import { CONFIDENCE_FLOOR, buildIndex, confidence, search, tokenize } from "../src/lib/retrieval.ts";

const index = buildIndex(ARTICLES);
const ask = (q: string) => search(index, q, 3);
const topId = (q: string) => ask(q)[0]?.article.id ?? null;

describe("tokenizer", () => {
  it("lowercases, drops stopwords and stems", () => {
    const base = tokenize("How do I CANCEL the subscriptions?");
    assert.ok(base.includes("cancel") && base.includes("subscription"));
    assert.ok(!base.includes("how") && !base.includes("the"), "stopwords must be dropped");
  });
  it("expands synonyms in both directions", () => {
    // Customers say "bill"; the article says "invoice".
    assert.ok(tokenize("bill").includes("invoice"), JSON.stringify(tokenize("bill")));
    assert.ok(tokenize("invoice").includes("bill"));
    assert.ok(tokenize("I forgot my login").includes("password"));
    assert.ok(tokenize("password").includes("login"));
  });
  it("ignores punctuation-only input", () => {
    assert.deepEqual(tokenize("??? !!!"), []);
  });
});

describe("retrieval", () => {
  const cases: [query: string, expected: string][] = [
    ["how do I cancel my subscription", "kb-01"],
    ["can I get my money back", "kb-02"],
    ["I need a receipt for accounting", "kb-03"],
    ["how much does it cost per user", "kb-04"],
    ["I want to upgrade to business", "kb-05"],
    ["I forgot my password", "kb-06"],
    ["set up two factor authentication", "kb-07"],
    ["do you support okta", "kb-08"],
    ["delete my account permanently", "kb-09"],
    ["invite a colleague to my team", "kb-10"],
    ["what can a guest see", "kb-11"],
    ["where did my archived project go", "kb-12"],
    ["export everything to csv", "kb-13"],
    ["restore a deleted task", "kb-14"],
    ["post updates to slack", "kb-15"],
    ["create an api key", "kb-16"],
    ["sync with google calendar", "kb-17"],
    ["is there an android app", "kb-18"],
    ["the app is really slow", "kb-19"],
    ["I am not getting notification emails", "kb-20"],
    ["is my data stored in the eu", "kb-21"],
    ["who changed this permission", "kb-22"],
    ["how do I create my first project", "kb-23"],
    ["how long is the free trial", "kb-24"],
  ];
  for (const [q, expected] of cases) {
    it(`"${q}" → ${expected}`, () => {
      assert.equal(topId(q), expected, `got ${topId(q)} (${ask(q)[0]?.article.title})`);
    });
  }
  it("returns nothing for an unrelated question", () => {
    assert.equal(ask("what is the weather in lahore tomorrow").length, 0);
  });
  it("ranks deterministically", () => {
    assert.deepEqual(ask("refund").map((h) => h.article.id), ask("refund").map((h) => h.article.id));
  });
  it("scores the best hit at 1 and others below", () => {
    const hits = ask("cancel subscription");
    assert.equal(hits[0].score, 1);
    assert.ok(hits.length === 1 || hits[1].score <= 1);
  });
});

describe("confidence", () => {
  it("is high for a well-matched question", () => {
    const q = "how do I cancel my subscription";
    assert.ok(confidence(ask(q), q) >= CONFIDENCE_FLOOR, String(confidence(ask(q), q)));
  });
  it("is zero when nothing matches", () => {
    const q = "what is the weather in lahore tomorrow";
    assert.equal(confidence(ask(q), q), 0);
  });
  it("is low when only a stray word matches a long question", () => {
    const q = "my dog ate the project paperwork and now the landlord wants compensation urgently";
    assert.ok(confidence(ask(q), q) < CONFIDENCE_FLOOR, String(confidence(ask(q), q)));
  });
});

describe("conversation", () => {
  const start = () => newConversation("c1", 1000);

  it("opens by stating it is not a language model", () => {
    const c = start();
    assert.equal(c.messages.length, 1);
    assert.match(c.messages[0].text, /not a language model/i);
  });

  it("answers a known question from an article and cites it", () => {
    const { conversation, hit } = respond(start(), index, "how do I cancel my subscription", 2000);
    const last = conversation.messages[conversation.messages.length - 1];
    assert.equal(hit?.article.id, "kb-01");
    assert.equal(last.role, "agent");
    assert.equal(last.text, ARTICLES[0].answer, "answer must be the article text, never generated");
    assert.deepEqual(last.sources, [{ id: "kb-01", title: "How to cancel your subscription" }]);
    assert.equal(conversation.unanswered.length, 0);
  });

  it("never invents an answer: every agent reply is an article or a fixed system line", () => {
    const answers = new Set(ARTICLES.map((a) => a.answer));
    let conv: Conversation = start();
    for (const q of ["cancel", "refund me", "banana helicopter", "slack", "qwertyuiop"]) {
      conv = respond(conv, index, q, 3000).conversation;
    }
    for (const m of conv.messages.filter((m) => m.role === "agent" && m.sources)) {
      assert.ok(answers.has(m.text), `agent produced text not in the knowledge base: ${m.text}`);
    }
  });

  it("admits it does not know and records the question", () => {
    const { conversation, hit } = respond(start(), index, "what is the weather in lahore tomorrow", 2000);
    assert.equal(hit, null);
    const last = conversation.messages[conversation.messages.length - 1];
    assert.match(last.text, /couldn't find|not confident/i);
    assert.deepEqual(conversation.unanswered, ["what is the weather in lahore tomorrow"]);
    assert.ok(last.options?.includes("Talk to a person"));
  });

  it("offers near matches when it is unsure rather than guessing", () => {
    const q = "my dog ate the project paperwork and now the landlord wants compensation urgently";
    const { conversation, hit } = respond(start(), index, q, 2000);
    assert.equal(hit, null);
    const last = conversation.messages[conversation.messages.length - 1];
    assert.ok((last.options?.length ?? 0) > 1);
    assert.equal(conversation.unanswered.length, 1);
  });

  it("escalates immediately when a human is requested", () => {
    for (const q of ["talk to a person", "I want to speak with a human", "can I chat to someone"]) {
      const { conversation } = respond(start(), index, q, 2000);
      assert.equal(conversation.escalated, true, q);
      assert.equal(conversation.unanswered.length, 0, q);
    }
  });

  it("ignores empty input", () => {
    const c = start();
    assert.equal(respond(c, index, "   ", 2000).conversation.messages.length, 1);
  });

  it("keeps the full transcript in order", () => {
    let conv = start();
    conv = respond(conv, index, "how much does it cost", 2000).conversation;
    conv = respond(conv, index, "and the free trial", 3000).conversation;
    assert.deepEqual(conv.messages.map((m) => m.role), ["agent", "customer", "agent", "customer", "agent"]);
    assert.ok(conv.messages.every((m, i) => i === 0 || m.at >= conv.messages[i - 1].at));
  });
});

describe("handoff", () => {
  it("requires a name, a valid email and consent", () => {
    assert.deepEqual(Object.keys(validateContact({ name: "", email: "nope", note: "", consent: false })).sort(), ["consent", "email", "name"]);
    assert.deepEqual(validateContact({ name: "Sam", email: "sam@example.com", note: "", consent: true }), {});
  });
  it("builds a payload with the transcript, sources and unanswered questions", () => {
    let conv = respond(newConversation("c9", 1000), index, "how do I cancel", 2000).conversation;
    conv = respond(conv, index, "what is the weather in lahore", 3000).conversation;
    conv = { ...conv, contact: { name: "Sam", email: "sam@example.com", note: "urgent", consent: true } };
    const p = handoffPayload(conv);
    assert.equal(p.conversationId, "c9");
    assert.equal(p.contact?.email, "sam@example.com");
    assert.deepEqual(p.unanswered, ["what is the weather in lahore"]);
    assert.equal(p.transcript.length, conv.messages.length);
    assert.deepEqual(p.transcript[2].sources, ["kb-01"]);
    assert.match(p.startedAt, /^\d{4}-\d{2}-\d{2}T/);
  });
});
