import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { createRoot } from "react-dom/client";
import { ARTICLES } from "./data/kb.ts";
import {
  GREETING, emptyContact, handoffPayload, newConversation, respond, validateContact,
  type Contact, type ContactErrors, type Conversation,
} from "./lib/conversation.ts";
import { CONFIDENCE_FLOOR, buildIndex, search } from "./lib/retrieval.ts";
import "./styles.css";

const index = buildIndex(ARTICLES);
const CATEGORIES = [...new Set(ARTICLES.map((a) => a.category))];

/** Renders **bold** only. No HTML from the knowledge base is ever injected. */
function RichText({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong> : <span key={i}>{part}</span>,
      )}
    </>
  );
}

function Chat({ conv, setConv, onEscalate }: { conv: Conversation; setConv: (c: Conversation) => void; onEscalate: () => void }) {
  const [draft, setDraft] = useState("");
  const log = useRef<HTMLDivElement>(null);

  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight, behavior: "smooth" });
  }, [conv.messages.length]);

  const send = (text: string) => {
    if (text.trim() === "") return;
    if (/talk to a person/i.test(text)) {
      setConv({ ...respond(conv, index, "talk to a person", Date.now()).conversation });
      onEscalate();
      setDraft("");
      return;
    }
    if (/that helped/i.test(text)) {
      setConv({
        ...conv,
        resolvedBy: "agent",
        messages: [...conv.messages, { id: `${conv.id}-${conv.messages.length}`, role: "system", text: "Marked as resolved by the assistant.", at: Date.now() }],
      });
      setDraft("");
      return;
    }
    setConv(respond(conv, index, text, Date.now()).conversation);
    setDraft("");
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(draft);
  };

  const last = conv.messages[conv.messages.length - 1];

  return (
    <div className="chat">
      <div className="chat__head">
        <span className="avatar" aria-hidden="true" />
        <div>
          <h2>Tideline assistant</h2>
          <p>Searches 24 help articles · never writes new answers</p>
        </div>
      </div>

      <div className="chat__log" ref={log} role="log" aria-live="polite" aria-label="Conversation">
        {conv.messages.map((m) => (
          <article key={m.id} className={`msg msg--${m.role}`}>
            <p className="msg__who">{m.role === "customer" ? "You" : m.role === "agent" ? "Assistant" : "System"}</p>
            <div className="msg__body">
              <RichText text={m.text} />
            </div>
            {m.sources && m.sources.length > 0 ? (
              <p className="msg__source">
                Source: <a href={`#${m.sources[0].id}`}>{m.sources[0].title}</a>
                {m.confidence !== undefined ? <span className="msg__score"> · match {Math.round(m.confidence * 100)}%</span> : null}
              </p>
            ) : m.confidence !== undefined ? (
              <p className="msg__source msg__source--low">Best match scored {Math.round(m.confidence * 100)}%, below the {Math.round(CONFIDENCE_FLOOR * 100)}% threshold</p>
            ) : null}
          </article>
        ))}
      </div>

      {last.options && last.options.length > 0 ? (
        <div className="chips" aria-label="Suggested replies">
          {last.options.map((o) => (
            <button key={o} type="button" className="chip" onClick={() => send(o)}>
              {o}
            </button>
          ))}
        </div>
      ) : null}

      <form className="chat__input" onSubmit={onSubmit}>
        <label className="sr" htmlFor="ask">
          Type your question
        </label>
        <input id="ask" value={draft} placeholder="Ask about billing, accounts, projects…" autoComplete="off" onChange={(e: { target: { value: string } }) => setDraft(e.target.value)} />
        <button type="submit" className="btn" disabled={draft.trim() === ""}>
          Send
        </button>
      </form>
    </div>
  );
}

function HandoffForm({ conv, onSubmit }: { conv: Conversation; onSubmit: (c: Contact) => void }) {
  const [contact, setContact] = useState<Contact>(emptyContact());
  const [errors, setErrors] = useState<ContactErrors>({});

  if (conv.contact) {
    return (
      <div className="card card--ok" role="status">
        <h3>Passed to a person</h3>
        <p>
          Thanks {conv.contact.name.split(" ")[0]} — in a live deployment this conversation, including the {conv.unanswered.length} question
          {conv.unanswered.length === 1 ? "" : "s"} I couldn&rsquo;t answer, would be posted to the helpdesk queue. Nothing was actually sent from this demo.
        </p>
        <details>
          <summary>See the handoff payload</summary>
          <pre>{JSON.stringify(handoffPayload(conv), null, 2)}</pre>
        </details>
      </div>
    );
  }

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const found = validateContact(contact);
    setErrors(found);
    if (Object.keys(found).length === 0) onSubmit(contact);
  };

  return (
    <form className="card" onSubmit={submit} noValidate aria-labelledby="handoff-title">
      <h3 id="handoff-title">Talk to a person</h3>
      <p className="muted">Leave your details and the full conversation goes with them.</p>
      <label className="field">
        <span>Name</span>
        <input name="name" value={contact.name} onChange={(e: { target: { value: string } }) => setContact({ ...contact, name: e.target.value })} aria-invalid={errors.name ? true : undefined} />
        {errors.name ? <em>{errors.name}</em> : null}
      </label>
      <label className="field">
        <span>Email</span>
        <input name="email" type="email" value={contact.email} onChange={(e: { target: { value: string } }) => setContact({ ...contact, email: e.target.value })} aria-invalid={errors.email ? true : undefined} />
        {errors.email ? <em>{errors.email}</em> : null}
      </label>
      <label className="field">
        <span>Anything to add <small>(optional)</small></span>
        <textarea name="note" rows={3} value={contact.note} onChange={(e: { target: { value: string } }) => setContact({ ...contact, note: e.target.value })} />
      </label>
      <label className="check">
        <input name="consent" type="checkbox" checked={contact.consent} onChange={() => setContact({ ...contact, consent: !contact.consent })} aria-invalid={errors.consent ? true : undefined} />
        <span>I agree that Tideline may store these details to reply to me.</span>
      </label>
      {errors.consent ? <em className="err">{errors.consent}</em> : null}
      <button type="submit" className="btn">
        Send to the team
      </button>
    </form>
  );
}

function Operator({ conv }: { conv: Conversation }) {
  const answered = conv.messages.filter((m) => m.sources).length;
  const asked = conv.messages.filter((m) => m.role === "customer").length;
  const rate = asked === 0 ? 0 : Math.round((answered / asked) * 100);
  return (
    <section className="panel" aria-labelledby="ops-title">
      <h2 id="ops-title">Operator view</h2>
      <p className="muted">What a support lead would watch. Live for this conversation.</p>
      <dl className="stats">
        <div>
          <dt>Questions asked</dt>
          <dd>{asked}</dd>
        </div>
        <div>
          <dt>Answered from the KB</dt>
          <dd>{answered}</dd>
        </div>
        <div>
          <dt>Deflection rate</dt>
          <dd>{rate}%</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{conv.contact ? "With a human" : conv.escalated ? "Escalating" : conv.resolvedBy === "agent" ? "Resolved" : "Active"}</dd>
        </div>
      </dl>
      <h3>Unanswered questions</h3>
      {conv.unanswered.length === 0 ? (
        <p className="muted">None yet. These are the gaps worth writing a new article for.</p>
      ) : (
        <ol className="gaps">
          {conv.unanswered.map((q, i) => (
            <li key={`${q}-${i}`}>{q}</li>
          ))}
        </ol>
      )}
    </section>
  );
}

function KnowledgeBase() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("All");
  const hits = useMemo(() => (q.trim() ? new Set(search(index, q, 24).map((h) => h.article.id)) : null), [q]);
  const list = ARTICLES.filter((a) => (cat === "All" || a.category === cat) && (!hits || hits.has(a.id)));
  return (
    <section className="panel" aria-labelledby="kb-title">
      <div className="panel__head">
        <h2 id="kb-title">Knowledge base</h2>
        <p className="muted">{list.length} of {ARTICLES.length} articles</p>
      </div>
      <div className="kb-controls">
        <label className="field">
          <span className="sr">Search articles</span>
          <input type="search" placeholder="Search articles" value={q} onChange={(e: { target: { value: string } }) => setQ(e.target.value)} />
        </label>
        <div className="chips">
          {["All", ...CATEGORIES].map((c) => (
            <button key={c} type="button" className={`chip ${cat === c ? "is-on" : ""}`} aria-pressed={cat === c} onClick={() => setCat(c)}>
              {c}
            </button>
          ))}
        </div>
      </div>
      {list.length === 0 ? (
        <p className="muted">No articles match. That gap is exactly what the operator view tracks.</p>
      ) : (
        <ul className="kb">
          {list.map((a) => (
            <li key={a.id} id={a.id}>
              <details>
                <summary>
                  <span className="kb__cat">{a.category}</span>
                  {a.title}
                </summary>
                <p>
                  <RichText text={a.answer} />
                </p>
              </details>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function App() {
  const [conv, setConv] = useState<Conversation>(() => newConversation(`c-${Date.now().toString(36)}`, Date.now()));
  const handoffRef = useRef<HTMLDivElement>(null);

  const reset = () => setConv(newConversation(`c-${Date.now().toString(36)}`, Date.now()));
  const scrollToHandoff = () => requestAnimationFrame(() => handoffRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }));

  return (
    <>
      <a className="skip" href="#main" onClick={(e: { preventDefault(): void }) => { e.preventDefault(); document.getElementById("main")?.focus(); }}>
        Skip to content
      </a>
      <p className="demo-bar">
        <strong>Demonstration.</strong> Tideline is a fictional product. This assistant retrieves answers from a fixed knowledge base — it is <strong>not</strong> a language model and cannot generate new text.
      </p>
      <header className="top">
        <div className="brand">
          <span className="mark" aria-hidden="true" />
          <div>
            <h1>Tideline Support</h1>
            <p>Retrieval assistant with human handoff</p>
          </div>
        </div>
        <button type="button" className="btn btn--ghost" onClick={reset}>
          New conversation
        </button>
      </header>

      <main id="main" tabIndex={-1}>
        <div className="layout">
          <div className="layout__chat">
            <Chat conv={conv} setConv={setConv} onEscalate={scrollToHandoff} />
            <div ref={handoffRef}>
              {conv.escalated || conv.contact ? <HandoffForm conv={conv} onSubmit={(c) => setConv({ ...conv, contact: c, resolvedBy: "human" })} /> : null}
            </div>
          </div>
          <div className="layout__side">
            <Operator conv={conv} />
            <KnowledgeBase />
          </div>
        </div>
      </main>

      <footer className="foot">
        <p>
          <strong>How it works.</strong> Questions are tokenised, stemmed and expanded with a synonym map, then ranked against the knowledge base with Okapi BM25 and a title boost. Confidence combines how much of your question matched with the margin over the runner-up. Below {Math.round(CONFIDENCE_FLOOR * 100)}%, the assistant says it doesn&rsquo;t know and offers a person.
        </p>
        <p>Everything runs in your browser. No network calls, no tracking, no data leaves the page. Built by Ali Arshad as a portfolio demonstration.</p>
      </footer>
    </>
  );
}

createRoot(document.getElementById("root") as HTMLElement).render(<App />);
