import "./styles.css";
import { StrictMode, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { BRAND, CAMPAIGN, PAIRINGS, PALETTE } from "./data/brand.ts";
import { checkContrast, contrastRatio, THRESHOLD } from "./lib/color.ts";
import { BASE_PX, RATIO, buildScale } from "./lib/type-scale.ts";
import { DEFAULT_EMAIL, buildEmail, buildPlainText } from "./lib/email.ts";
import { Lockup, Mark, SquarePost, StoryPost, WideBanner } from "./components/assets.tsx";

const SECTIONS = [
  { id: "identity", label: "Identity" },
  { id: "colour", label: "Colour" },
  { id: "type", label: "Type" },
  { id: "assets", label: "Assets" },
  { id: "campaign", label: "Campaign" },
  { id: "email", label: "Email" },
  { id: "page", label: "Landing page" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

/* ------------------------------------------------------------------ */
/* Downloads: real files, built in the browser from the live SVG.      */
/* ------------------------------------------------------------------ */

function download(filename: string, contents: string, type: string) {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke on the next tick so the download has started.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function serialiseSvg(node: SVGSVGElement): string {
  const clone = node.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.removeAttribute("class");
  return `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(clone)}`;
}

function DownloadableSvg({ filename, children, caption }: { filename: string; children: React.ReactNode; caption: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);
  return (
    <figure className="asset">
      <div className="asset__stage" ref={host}>
        {children}
      </div>
      <figcaption className="asset__cap">
        <span>{caption}</span>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={() => {
            const svg = host.current?.querySelector("svg");
            if (!svg) return;
            download(filename, serialiseSvg(svg as SVGSVGElement), "image/svg+xml");
            setDone(true);
            setTimeout(() => setDone(false), 2200);
          }}
        >
          {done ? "Downloaded" : "Download SVG"}
        </button>
      </figcaption>
    </figure>
  );
}

/* ------------------------------------------------------------------ */

function Identity() {
  return (
    <section className="stack" aria-labelledby="identity-h">
      <header className="section-head">
        <h2 id="identity-h">Identity</h2>
        <p className="lede">{BRAND.positioning}</p>
      </header>

      <div className="hero-card">
        <Lockup variant="stacked" on="dark" size={1.1} />
        <p className="hero-card__line">{BRAND.copy.headline}</p>
      </div>

      <div className="two-up">
        <div className="panel">
          <h3>Voice</h3>
          <dl className="voice">
            <dt>It is</dt>
            <dd>{BRAND.voice.is.join(" · ")}</dd>
            <dt>It is not</dt>
            <dd>{BRAND.voice.isNot.join(" · ")}</dd>
          </dl>
        </div>
        <div className="panel">
          <h3>At a glance</h3>
          <dl className="facts">
            <div><dt>Category</dt><dd>{BRAND.category}</dd></div>
            <div><dt>Descriptor</dt><dd>{BRAND.descriptor}</dd></div>
            <div><dt>Radius scale</dt><dd>{Object.entries(BRAND.radius).map(([k, v]) => `${k} ${v}px`).join(", ")}</dd></div>
            <div><dt>Spacing scale</dt><dd>{BRAND.spacing.join(" · ")}</dd></div>
          </dl>
        </div>
      </div>

      <ol className="principles">
        {BRAND.principles.map((p, i) => (
          <li key={p.title} className="panel principle">
            <span className="principle__n">{String(i + 1).padStart(2, "0")}</span>
            <h3>{p.title}</h3>
            <p>{p.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function ContrastTester() {
  const [fg, setFg] = useState("#A94F30");
  const [bg, setBg] = useState("#FBF7F2");
  const valid = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(fg) && /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(bg);
  // checkContrast throws on malformed input, so only call it once the input parses.
  const result = useMemo(() => (valid ? checkContrast(fg, bg) : null), [fg, bg, valid]);

  return (
    <div className="panel tester">
      <h3>Check any pair</h3>
      <p className="muted">Ratios are computed from the WCAG 2.2 relative-luminance formula, in the browser, as you type.</p>
      <div className="tester__controls">
        <div className="field">
          <label htmlFor="fg">Foreground</label>
          <div className="field__row">
            <input id="fg" type="color" value={valid ? fg : "#000000"} onChange={(e) => setFg(e.target.value.toUpperCase())} aria-label="Foreground colour picker" />
            <input type="text" value={fg} onChange={(e) => setFg(e.target.value)} spellCheck={false} aria-label="Foreground hex value" />
          </div>
        </div>
        <div className="field">
          <label htmlFor="bg">Background</label>
          <div className="field__row">
            <input id="bg" type="color" value={valid ? bg : "#FFFFFF"} onChange={(e) => setBg(e.target.value.toUpperCase())} aria-label="Background colour picker" />
            <input type="text" value={bg} onChange={(e) => setBg(e.target.value)} spellCheck={false} aria-label="Background hex value" />
          </div>
        </div>
      </div>

      {valid && result ? (
        <>
          <div className="tester__preview" style={{ background: bg, color: fg }}>
            <strong>{result.ratio}:1</strong>
            <span>Body text at this ratio looks like this.</span>
          </div>
          <ul className="grades" data-testid="grades">
            <li data-pass={result.ratio >= 3}>Large text (3:1) {result.ratio >= 3 ? "passes" : "fails"}</li>
            <li data-pass={result.aa}>AA body (4.5:1) {result.aa ? "passes" : "fails"}</li>
            <li data-pass={result.aaa}>AAA body (7:1) {result.aaa ? "passes" : "fails"}</li>
          </ul>
        </>
      ) : (
        <p className="warn" role="status">Enter two hex colours, for example #2A1E3F.</p>
      )}
    </div>
  );
}

function Colour() {
  const failures = PAIRINGS.filter((p) => contrastRatio(p.fg, p.bg) < THRESHOLD[p.use]);
  return (
    <section className="stack" aria-labelledby="colour-h">
      <header className="section-head">
        <h2 id="colour-h">Colour</h2>
        <p className="lede">
          Eight colours, each with a stated job. Every documented pairing is measured live — the table below is computed on render, not typed out.
        </p>
      </header>

      <ul className="swatches">
        {PALETTE.map((s) => (
          <li key={s.token} className="swatch">
            <div className="swatch__chip" style={{ background: s.hex }} aria-hidden="true" />
            <div className="swatch__meta">
              <strong>{s.name}</strong>
              <code>{s.hex}</code>
              <p>{s.role}</p>
              <code className="token">{s.token}</code>
              {s.note ? <p className="swatch__note">{s.note}</p> : null}
            </div>
          </li>
        ))}
      </ul>

      <div className="panel">
        <h3>Documented pairings</h3>
        <div className="table-wrap">
          <table className="table" data-testid="pairings">
            <caption className="sr">Contrast ratio for each approved colour pairing, with pass or fail against its WCAG threshold</caption>
            <thead>
              <tr><th scope="col">Pairing</th><th scope="col">Use</th><th scope="col">Ratio</th><th scope="col">Required</th><th scope="col">Result</th></tr>
            </thead>
            <tbody>
              {PAIRINGS.map((p) => {
                const ratio = contrastRatio(p.fg, p.bg);
                const pass = ratio >= THRESHOLD[p.use];
                return (
                  <tr key={p.label}>
                    <th scope="row">
                      <span className="pair" style={{ background: p.bg, color: p.fg }} aria-hidden="true">Aa</span>
                      {p.label}
                    </th>
                    <td>{p.use === "body" ? "Body text" : p.use === "large" ? "Large text" : "UI element"}</td>
                    <td><code>{ratio}:1</code></td>
                    <td>{THRESHOLD[p.use]}:1</td>
                    <td><span className="pill" data-pass={pass}>{pass ? "Pass" : "Fail"}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="muted" data-testid="pairing-summary">
          {failures.length === 0
            ? `All ${PAIRINGS.length} pairings meet their threshold.`
            : `${failures.length} of ${PAIRINGS.length} pairings fail: ${failures.map((f) => f.label).join(", ")}.`}
        </p>
      </div>

      <ContrastTester />
    </section>
  );
}

/* ------------------------------------------------------------------ */

function TypeScale() {
  const [base, setBase] = useState(BASE_PX);
  const [ratio, setRatio] = useState(RATIO);
  const scale = useMemo(() => buildScale(base, ratio), [base, ratio]);

  return (
    <section className="stack" aria-labelledby="type-h">
      <header className="section-head">
        <h2 id="type-h">Type</h2>
        <p className="lede">
          Instrument Serif for headlines, Public Sans for everything else. The scale is generated from a base size and a ratio, so changing either
          regenerates every step rather than breaking the system.
        </p>
      </header>

      <div className="panel scale-controls">
        <div className="field">
          <label htmlFor="base">Base size: {base}px</label>
          <input id="base" type="range" min={14} max={22} step={1} value={base} onChange={(e) => setBase(Number(e.target.value))} />
        </div>
        <div className="field">
          <label htmlFor="ratio">Ratio: {ratio}</label>
          <input id="ratio" type="range" min={1.125} max={1.5} step={0.025} value={ratio} onChange={(e) => setRatio(Number(e.target.value))} />
        </div>
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => { setBase(BASE_PX); setRatio(RATIO); }}>
          Reset to brand values
        </button>
      </div>

      <ol className="scale" data-testid="scale">
        {scale.map((s) => (
          <li key={s.name} className="scale__row">
            <div className="scale__meta">
              <strong>{s.name}</strong>
              <code>{s.px}px / {s.rem}rem</code>
              <span className="muted">line {s.lineHeight} · tracking {s.tracking}em</span>
              <span className="muted">{s.usage}</span>
            </div>
            <p
              className={s.step > 0 ? "scale__sample scale__sample--serif" : "scale__sample"}
              style={{ fontSize: `${s.px}px`, lineHeight: s.lineHeight, letterSpacing: `${s.tracking}em` }}
            >
              Sleep is not a project
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function Assets() {
  return (
    <section className="stack" aria-labelledby="assets-h">
      <header className="section-head">
        <h2 id="assets-h">Assets</h2>
        <p className="lede">Three lockups plus the mark on its own. Each one downloads as a real SVG file, serialised from what you see.</p>
      </header>
      <div className="asset-grid">
        <DownloadableSvg filename="halcyon-lockup-horizontal-dark.svg" caption="Horizontal, on dark">
          <div className="asset__bg asset__bg--dark"><Lockup variant="horizontal" on="dark" /></div>
        </DownloadableSvg>
        <DownloadableSvg filename="halcyon-lockup-horizontal-light.svg" caption="Horizontal, on light">
          <div className="asset__bg asset__bg--light"><Lockup variant="horizontal" on="light" /></div>
        </DownloadableSvg>
        <DownloadableSvg filename="halcyon-lockup-stacked.svg" caption="Stacked">
          <div className="asset__bg asset__bg--dark"><Lockup variant="stacked" on="dark" /></div>
        </DownloadableSvg>
        <DownloadableSvg filename="halcyon-mark.svg" caption="Mark only">
          <div className="asset__bg asset__bg--light"><Mark size={72} fill="#A94F30" title="Halcyon mark" /></div>
        </DownloadableSvg>
      </div>

      <div className="panel">
        <h3>Clear space and minimum size</h3>
        <p>Keep clear space equal to the height of the mark on all sides. Minimum width for the horizontal lockup is 120px; below that, use the mark alone.</p>
        <div className="clearspace">
          <div className="clearspace__box"><Lockup variant="horizontal" on="light" size={0.6} /></div>
          <p className="muted">The dashed boundary is the minimum clear space, not part of the asset.</p>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function Campaign() {
  const [square, story, banner] = BRAND.copy.social;
  return (
    <section className="stack" aria-labelledby="campaign-h">
      <header className="section-head">
        <h2 id="campaign-h">Campaign — {CAMPAIGN.name}</h2>
        <p className="lede">{CAMPAIGN.objective}</p>
      </header>

      <div className="notice" role="note">
        <strong>No campaign has run.</strong> {CAMPAIGN.notActual}
      </div>

      <div className="two-up">
        <div className="panel">
          <h3>Audience</h3>
          <p>{CAMPAIGN.audience}</p>
        </div>
        <div className="panel">
          <h3>What would be measured</h3>
          <ul className="bullets">
            {CAMPAIGN.measurement.map((m) => <li key={m}>{m}</li>)}
          </ul>
        </div>
      </div>

      <div className="panel">
        <h3>Channels</h3>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th scope="col">Channel</th><th scope="col">Role</th><th scope="col">Asset</th></tr></thead>
            <tbody>
              {CAMPAIGN.channels.map((c) => (
                <tr key={c.name}><th scope="row">{c.name}</th><td>{c.role}</td><td>{c.asset}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <h3 className="sub">Templates</h3>
      <div className="template-grid">
        <DownloadableSvg filename="halcyon-square-post.svg" caption="Square post, 600×600">
          <SquarePost headline={square.headline} body={square.body} />
        </DownloadableSvg>
        <DownloadableSvg filename="halcyon-story.svg" caption="Story, 1080×1920 at 338×600">
          <StoryPost headline={story.headline} body={story.body} />
        </DownloadableSvg>
        <DownloadableSvg filename="halcyon-banner.svg" caption="Wide banner, 728×240">
          <WideBanner headline={banner.headline} body={banner.body} />
        </DownloadableSvg>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function EmailTemplate() {
  const [headline, setHeadline] = useState(DEFAULT_EMAIL.headline);
  const [cta, setCta] = useState(DEFAULT_EMAIL.ctaLabel);
  const [copied, setCopied] = useState<"html" | "text" | null>(null);
  const content = { ...DEFAULT_EMAIL, headline, ctaLabel: cta };
  const html = useMemo(() => buildEmail(content), [headline, cta]);

  const copy = async (what: "html" | "text") => {
    const payload = what === "html" ? html : buildPlainText(content);
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(what);
      setTimeout(() => setCopied(null), 2200);
    } catch {
      // Clipboard access can be denied. Fall back to a download so the action still does something.
      download(what === "html" ? "halcyon-email.html" : "halcyon-email.txt", payload, what === "html" ? "text/html" : "text/plain");
    }
  };

  return (
    <section className="stack" aria-labelledby="email-h">
      <header className="section-head">
        <h2 id="email-h">Email template</h2>
        <p className="lede">
          Table-based, 600px, inline styles, with an Outlook conditional and a hidden preheader. The preview below is the real generated HTML rendered in
          an iframe — edit the fields and it regenerates.
        </p>
      </header>

      <div className="panel email-controls">
        <div className="field">
          <label htmlFor="email-headline">Headline</label>
          <input id="email-headline" type="text" value={headline} onChange={(e) => setHeadline(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="email-cta">Button label</label>
          <input id="email-cta" type="text" value={cta} onChange={(e) => setCta(e.target.value)} />
        </div>
        <div className="btn-row">
          <button type="button" className="btn btn--sm" onClick={() => copy("html")}>{copied === "html" ? "Copied" : "Copy HTML"}</button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => copy("text")}>{copied === "text" ? "Copied" : "Copy plain text"}</button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => download("halcyon-email.html", html, "text/html")}>Download .html</button>
        </div>
      </div>

      <iframe className="email-preview" title="Email template preview" srcDoc={html} data-testid="email-frame" />

      <details className="panel">
        <summary>Why tables and inline styles</summary>
        <p>
          Outlook on Windows renders mail with the Word engine, so flexbox and grid are unreliable and external stylesheets may be stripped. A 600px table
          with inline styles is the format that survives across Outlook, Gmail, Apple Mail and the webmail clients. The plain-text alternative is not
          optional either — a multipart send needs both parts, and some filters score HTML-only mail worse.
        </p>
      </details>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function LandingPage() {
  return (
    <section className="stack" aria-labelledby="page-h">
      <header className="section-head">
        <h2 id="page-h">Landing page</h2>
        <p className="lede">The system applied: one page, one decision, built from the same tokens as everything above.</p>
      </header>

      <div className="lp" data-testid="landing">
        <header className="lp__nav">
          <Lockup variant="horizontal" on="dark" size={0.56} />
          <nav aria-label="Halcyon landing page">
            <a href="#lp-range">The range</a>
            <a href="#lp-how">How it works</a>
          </nav>
        </header>

        <div className="lp__hero">
          <h3>{BRAND.copy.headline}</h3>
          <p>{BRAND.copy.subhead}</p>
          <div className="lp__cta">
            <span className="lp__btn">{BRAND.copy.cta}</span>
            <span className="lp__btn lp__btn--ghost">{BRAND.copy.secondaryCta}</span>
          </div>
          <p className="lp__note">Buttons are shown as part of the design, not wired to a checkout — this is a brand template, not a shop.</p>
        </div>

        <div className="lp__range" id="lp-range">
          {[
            { name: "Fade lamp", line: "Twenty minutes from warm to off. One switch, nothing to charge." },
            { name: "Weighted throw", line: "Cotton, 4.5kg, washable. Sized for a sofa or a single bed." },
            { name: "Bedside carafe", line: "Stoneware, 700ml, with a cup that sits as the lid." },
          ].map((p) => (
            <article key={p.name} className="lp__card">
              <div className="lp__thumb" aria-hidden="true" />
              <h4>{p.name}</h4>
              <p>{p.line}</p>
            </article>
          ))}
        </div>

        <div className="lp__how" id="lp-how">
          <h4>How it works</h4>
          <p>There is no app. You turn the lamp on when you start winding down and it goes out on its own. That is the whole mechanism.</p>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

const VIEWS: Record<SectionId, () => JSX.Element> = {
  identity: Identity,
  colour: Colour,
  type: TypeScale,
  assets: Assets,
  campaign: Campaign,
  email: EmailTemplate,
  page: LandingPage,
};

function App() {
  const [active, setActive] = useState<SectionId>("identity");
  const View = VIEWS[active];
  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <header className="masthead">
        <div className="shell masthead__inner">
          <div className="masthead__brand">
            <Mark size={30} fill="#F3B98A" title="Halcyon mark" />
            <div>
              <h1>{BRAND.name}</h1>
              <span>Brand system</span>
            </div>
          </div>
          <p className="masthead__note">Fictional brand · built to demonstrate design-system work</p>
        </div>
        <nav className="tabs" aria-label="Sections">
          <div className="shell tabs__inner">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                className="tab"
                aria-current={active === s.id ? "page" : undefined}
                onClick={() => setActive(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </nav>
      </header>

      <main id="main" className="shell">
        <View />
      </main>

      <footer className="foot">
        <div className="shell">
          <p>
            Halcyon is invented. No products exist, no campaign has run and there are no results to report. The contrast ratios, type scale and email
            markup are real and computed in the browser.
          </p>
        </div>
      </footer>
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
