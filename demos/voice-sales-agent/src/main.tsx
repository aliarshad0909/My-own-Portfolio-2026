import { useEffect, useRef, useState, type FormEvent } from "react";
import { createRoot } from "react-dom/client";
import { SLOTS, crmPayload, missingRequired, newSession, nextSlot, qualify, reply, type Session } from "./lib/dialogue.ts";
import { createListener, detectSupport, onVoicesReady, speak, stopSpeaking, type Listener, type Support } from "./lib/speech.ts";
import "./styles.css";

const SCRIPTS = [
  { label: "Qualified lead", lines: ["I need to track my vans", "we run about 60 trucks", "we need it asap", "around $3k a month", "I'm Dana Whitfield", "Harlow Logistics", "dana at harlow dot example", "Thursday morning"] },
  { label: "Just browsing", lines: ["fuel costs are high", "we have 4 vans", "honestly just looking for now", "no budget yet", "Marco", "skip", "marco@small.example", "Tuesday"] },
  { label: "Asks for a human", lines: ["how much does it cost?", "can I speak to a person"] },
];

function App() {
  const [session, setSession] = useState<Session>(() => newSession(`v-${Date.now().toString(36)}`, Date.now()));
  const [support, setSupport] = useState<Support>({ recognition: false, synthesis: false });
  const [voiceOut, setVoiceOut] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [notice, setNotice] = useState("");
  const [draft, setDraft] = useState("");
  const listener = useRef<Listener | null>(null);
  const log = useRef<HTMLDivElement>(null);
  const spoken = useRef(0);

  useEffect(() => {
    setSupport(detectSupport());
    return onVoicesReady(setSupport);
  }, []);

  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight, behavior: "smooth" });
    const last = session.turns[session.turns.length - 1];
    if (voiceOut && last.role === "agent" && session.turns.length > spoken.current) {
      spoken.current = session.turns.length;
      speak(last.text, true);
    }
  }, [session.turns.length, voiceOut]);

  const send = (text: string) => {
    if (text.trim() === "") return;
    setSession((s) => reply(s, text, Date.now()));
    setDraft("");
    setInterim("");
  };

  const toggleMic = () => {
    if (listening) {
      listener.current?.stop();
      setListening(false);
      return;
    }
    const l = createListener({
      onFinal: (t) => { send(t); setListening(false); },
      onInterim: setInterim,
      onError: (m) => { setNotice(m); setListening(false); },
      onEnd: () => { setListening(false); setInterim(""); },
    });
    if (!l) {
      setNotice("This browser has no speech recognition. Typing works exactly the same.");
      return;
    }
    listener.current = l;
    setNotice("");
    setListening(true);
    l.start();
  };

  const runScript = async (lines: string[]) => {
    let s = newSession(`v-${Date.now().toString(36)}`, Date.now());
    setSession(s);
    for (const line of lines) {
      await new Promise((r) => setTimeout(r, 420));
      s = reply(s, line, Date.now());
      setSession(s);
    }
  };

  const reset = () => {
    stopSpeaking();
    spoken.current = 0;
    setSession(newSession(`v-${Date.now().toString(36)}`, Date.now()));
    setNotice("");
  };

  const q = qualify(session.slots);
  const asking = nextSlot(session.slots);
  const done = missingRequired(session.slots).length === 0;
  const statusLabel = session.outcome === "qualified" ? "Qualified" : session.outcome === "handoff" ? "Handing to a specialist" : session.outcome === "declined" ? "Closed — not interested" : "In progress";

  return (
    <>
      <a className="skip" href="#main" onClick={(e: { preventDefault(): void }) => { e.preventDefault(); document.getElementById("main")?.focus(); }}>
        Skip to content
      </a>
      <p className="demo-bar">
        <strong>Demonstration.</strong> Kestrel Fleet Systems is a fictional company. This is a <strong>scripted dialogue engine, not a language model</strong>, it makes <strong>no phone calls</strong>, and nothing is sent anywhere.
      </p>

      <header className="top">
        <div className="brand">
          <span className="mark" aria-hidden="true" />
          <div>
            <h1>Kestrel Fleet Systems</h1>
            <p>Inbound sales agent · browser demo</p>
          </div>
        </div>
        <div className="top__actions">
          <button
            type="button"
            className={`btn btn--ghost ${voiceOut ? "is-on" : ""}`}
            aria-pressed={voiceOut}
            disabled={!support.synthesis}
            onClick={() => { const next = !voiceOut; setVoiceOut(next); if (!next) stopSpeaking(); }}
          >
            {support.synthesis ? (voiceOut ? "Voice on" : "Voice off") : "Voice unavailable"}
          </button>
          <button type="button" className="btn btn--ghost" onClick={reset}>
            Reset call
          </button>
        </div>
      </header>

      <main id="main" tabIndex={-1}>
        <div className="layout">
          <section className="call" aria-labelledby="call-title">
            <div className="call__head">
              <h2 id="call-title">Live call</h2>
              <span className={`pill pill--${session.outcome}`}>{statusLabel}</span>
            </div>

            <div className="call__log" ref={log} role="log" aria-live="polite" aria-label="Call transcript">
              {session.turns.map((t, i) => (
                <article key={`${t.at}-${i}`} className={`line line--${t.role}`}>
                  <p className="line__who">{t.role === "agent" ? "Agent" : "Caller"}</p>
                  <p className="line__text">{t.text}</p>
                  {t.filled && t.filled.length > 0 ? (
                    <p className="line__slots">
                      captured: {t.filled.map((f) => SLOTS.find((s) => s.id === f)?.label ?? f).join(", ")}
                    </p>
                  ) : null}
                </article>
              ))}
              {interim ? (
                <article className="line line--caller line--interim">
                  <p className="line__who">Caller (hearing…)</p>
                  <p className="line__text">{interim}</p>
                </article>
              ) : null}
            </div>

            {notice ? (
              <p className="notice" role="status">
                {notice}
              </p>
            ) : null}

            <form
              className="call__input"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                send(draft);
              }}
            >
              <button type="button" className={`mic ${listening ? "is-live" : ""}`} onClick={toggleMic} aria-pressed={listening} aria-label={listening ? "Stop listening" : "Answer by voice"} disabled={!support.recognition}>
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                  <path d="M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM5 11a7 7 0 0 0 14 0M12 18v3" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
                </svg>
              </button>
              <label className="sr" htmlFor="say">
                Type what the caller says
              </label>
              <input id="say" value={draft} placeholder={support.recognition ? "Speak or type your answer" : "Type your answer"} autoComplete="off" onChange={(e: { target: { value: string } }) => setDraft(e.target.value)} />
              <button type="submit" className="btn" disabled={draft.trim() === ""}>
                Send
              </button>
            </form>

            <div className="scripts">
              <span>Play a sample call:</span>
              {SCRIPTS.map((s) => (
                <button key={s.label} type="button" className="chip" onClick={() => void runScript(s.lines)}>
                  {s.label}
                </button>
              ))}
            </div>
          </section>

          <aside className="side">
            <section className="panel" aria-labelledby="qual-title">
              <h2 id="qual-title">Qualification</h2>
              <div className={`score score--${q.band.toLowerCase()}`}>
                <span className="score__num">{q.score}</span>
                <span className="score__band">{q.band} lead</span>
              </div>
              <ul className="reasons">
                {q.reasons.length === 0 ? <li className="muted">Nothing scored yet.</li> : q.reasons.map((r) => <li key={r}>{r}</li>)}
              </ul>
              <h3>Collected</h3>
              <dl className="slots">
                {SLOTS.map((s) => (
                  <div key={s.id} className={session.slots[s.id] ? "is-set" : asking?.id === s.id ? "is-asking" : ""}>
                    <dt>
                      {s.label}
                      {s.required ? <span aria-hidden="true"> *</span> : null}
                    </dt>
                    <dd>{session.slots[s.id] ?? (asking?.id === s.id ? "asking now…" : "—")}</dd>
                  </div>
                ))}
              </dl>
              <p className="muted">{done ? "All required details captured." : `${missingRequired(session.slots).length} required field(s) still open.`}</p>
            </section>

            <section className="panel" aria-labelledby="crm-title">
              <h2 id="crm-title">CRM handoff</h2>
              <p className="muted">The JSON a real deployment would POST to the CRM. This demo displays it and sends nothing.</p>
              <pre>{JSON.stringify(crmPayload(session), null, 2)}</pre>
            </section>
          </aside>
        </div>
      </main>

      <footer className="foot">
        <p>
          <strong>How it works.</strong> Each caller turn is matched against patterns for need, fleet size, timeline, budget, name, company, email and appointment. The agent fills whatever it recognised, answers known product questions from a fixed list, and asks for the next missing field. Every sentence it says is written in <code>src/lib/dialogue.ts</code> — it cannot compose a new one.
        </p>
        <p>
          <strong>Voice.</strong> Speech input and output use the browser&rsquo;s own Web Speech API where available, and some browsers send audio to a vendor service for recognition. Typing always works and is the fallback everywhere. There is no telephony here and no outbound calling: a real phone deployment would need a provider, recorded-call consent and the relevant local compliance.
        </p>
        <p>Built by Ali Arshad as a portfolio demonstration.</p>
      </footer>
    </>
  );
}

createRoot(document.getElementById("root") as HTMLElement).render(<App />);
