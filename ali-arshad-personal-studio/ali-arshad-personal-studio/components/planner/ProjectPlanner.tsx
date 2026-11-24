"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  COMPARE_ALTERNATE_PRESET,
  DEFAULT_PLANNER_STATE,
  PLANNER_AUDIENCES,
  PLANNER_BUDGETS,
  PLANNER_FEATURES,
  PLANNER_GOALS,
  PLANNER_INTEGRATIONS,
  PLANNER_MOODS,
  PLANNER_PAGES,
  PLANNER_PALETTES,
  PLANNER_PLATFORMS,
  PLANNER_PROJECT_TYPES,
  PLANNER_TIMELINES,
  PLANNER_TYPOGRAPHY,
  buildOpenQuestions,
  decodePlannerShareQuery,
  encodePlannerShareQuery,
  formatDiscoveryBrief,
  getPalette,
  getProjectTypeMeta,
  getTypography,
  matchPortfolioRecommendations,
  type PlannerState,
} from "@/lib/project-planner";

const STEPS = [
  { num: 1, short: "Goals", title: "Project type, audience & problem" },
  { num: 2, short: "Features", title: "Pages, capabilities & platform" },
  { num: 3, short: "Palette", title: "Brand mood & color system" },
  { num: 4, short: "Layout", title: "Typography, buttons, cards & hero" },
  { num: 5, short: "Delivery", title: "Content, motion, a11y & timing" },
  { num: 6, short: "Brief", title: "Discovery summary, matches & export" },
] as const;

function LiveVisualMockup({ state, label }: { state: PlannerState; label: string }) {
  const palette = getPalette(state.paletteId);
  const typo = getTypography(state.typographyId);
  const typeMeta = getProjectTypeMeta(state.projectType);

  const btnRadius =
    state.buttonStyle === "pill" ? "999px" : state.buttonStyle === "soft-radius" ? "10px" : "2px";
  const cardBorder =
    state.cardStyle === "flat-minimal" ? "1px solid transparent" : `1px solid ${palette.border}`;
  const cardShadow =
    state.cardStyle === "elevated" ? "0 14px 28px rgba(0, 0, 0, 0.24)" : "none";
  const hScale =
    state.typeScale === "expressive" ? "1.32rem" : state.typeScale === "compact" ? "1.02rem" : "1.16rem";

  const previewHeading =
    state.projectLabel.trim() ||
    (state.projectType === "ecommerce-storefront"
      ? "Modern Direct Storefront"
      : state.projectType === "ai-agent-automation"
        ? "Grounded AI Ops Desk"
        : state.projectType === "internal-dashboard"
          ? "Operations Command View"
          : state.projectType === "creative-brand-launch"
            ? "Studio Brand Launch"
            : "Focused Product Platform");

  const visibleNavItems = (state.pages.length ? state.pages : ["home", "services", "contact-book"]).slice(0, 4);

  return (
    <div
      className="planner-mockup"
      style={{
        backgroundColor: palette.bg,
        color: palette.text,
        borderColor: palette.border,
        fontFamily: typo.bodyFont,
      }}
      aria-label={`${label}: ${palette.name}, ${typo.label}, ${state.heroStyle} hero`}
    >
      <div className="planner-mockup__chrome" style={{ borderBottomColor: palette.border }}>
        <div className="planner-mockup__dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <span className="planner-mockup__url" style={{ color: palette.muted }}>
          {label} · {palette.name}
        </span>
      </div>

      <div className={`planner-mockup__shell ${state.navLayout === "sidebar-app" ? "is-sidebar" : ""}`}>
        {state.navLayout === "sidebar-app" ? (
          <div
            className="planner-mockup__sidebar"
            style={{ backgroundColor: palette.surface, borderRightColor: palette.border }}
          >
            <strong className="planner-mockup__brand" style={{ fontFamily: typo.headingFont }}>
              {previewHeading.slice(0, 14)}
            </strong>
            <div className="planner-mockup__sidelinks">
              {visibleNavItems.map((pg, idx) => (
                <span
                  key={pg}
                  style={{
                    color: idx === 0 ? palette.accent : palette.muted,
                    borderColor: idx === 0 ? palette.accent : "transparent",
                  }}
                >
                  {PLANNER_PAGES.find((p) => p.id === pg)?.label.split(" ")[0] ?? pg}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div className="planner-mockup__viewport">
          {state.navLayout !== "sidebar-app" ? (
            <div
              className={`planner-mockup__nav ${state.navLayout === "centered-brand" ? "is-centered" : ""}`}
              style={{ borderBottomColor: palette.border }}
            >
              <strong className="planner-mockup__brand" style={{ fontFamily: typo.headingFont }}>
                {previewHeading.slice(0, 18)}
              </strong>
              <div className="planner-mockup__navlinks" style={{ color: palette.muted }}>
                {visibleNavItems.map((pg) => (
                  <span key={pg}>{PLANNER_PAGES.find((p) => p.id === pg)?.label.split(" ")[0] ?? pg}</span>
                ))}
              </div>
              <span
                className="planner-mockup__cta-mini"
                style={{
                  backgroundColor: palette.accent,
                  color: palette.accentInk,
                  borderRadius: btnRadius,
                }}
              >
                Start
              </span>
            </div>
          ) : null}

          <div
            className={`planner-mockup__hero planner-mockup__hero--${state.heroStyle}`}
            style={{
              background:
                state.brandMood === "bold-studio"
                  ? `radial-gradient(circle at 80% 20%, ${palette.accent}2e, transparent 60%)`
                  : undefined,
            }}
          >
            <div className="planner-mockup__hero-copy">
              <span className="planner-mockup__eyebrow" style={{ color: palette.accent }}>
                {typeMeta.label} · {state.accessibilityTarget.toUpperCase()}
              </span>
              <h4
                className="planner-mockup__h1"
                style={{ fontFamily: typo.headingFont, fontSize: hScale }}
              >
                {previewHeading}
              </h4>
              <p className="planner-mockup__lead" style={{ color: palette.muted }}>
                {state.problemNote.trim()
                  ? state.problemNote.trim().slice(0, 110)
                  : `Tailored ${state.mobilePriority.replace(/-/g, " ")} experience designed for ${
                      PLANNER_AUDIENCES.find((a) => a.id === state.audience)?.label.toLowerCase() ?? "your team"
                    }.`}
              </p>
              <div className="planner-mockup__hero-btns">
                <span
                  className="planner-mockup__btn"
                  style={{
                    backgroundColor: palette.accent,
                    color: palette.accentInk,
                    borderRadius: btnRadius,
                  }}
                >
                  Primary Action
                </span>
                <span
                  className="planner-mockup__btn planner-mockup__btn--ghost"
                  style={{
                    borderColor: palette.border,
                    color: palette.text,
                    borderRadius: btnRadius,
                  }}
                >
                  Explore Scope
                </span>
              </div>
            </div>

            {state.heroStyle !== "centered-editorial" ? (
              <div
                className="planner-mockup__visual"
                style={{
                  backgroundColor: palette.surface,
                  border: cardBorder,
                  boxShadow: cardShadow,
                }}
              >
                <div className="planner-mockup__viz-top">
                  <span style={{ color: palette.accent }}>
                    {state.imageryStyle === "3d-motion"
                      ? "3D / Motion Frame"
                      : state.imageryStyle === "clean-diagrams"
                        ? "System Diagram"
                        : state.imageryStyle === "editorial-photo"
                          ? "Editorial Frame"
                          : "Live UI Preview"}
                  </span>
                  <span style={{ color: palette.muted }}>{state.motionLevel.split("-")[0]}</span>
                </div>
                <div className="planner-mockup__bars" aria-hidden="true">
                  <span style={{ width: "86%", backgroundColor: palette.accent }} />
                  <span style={{ width: "64%", backgroundColor: palette.muted, opacity: 0.4 }} />
                  <span style={{ width: "74%", backgroundColor: palette.accent, opacity: 0.55 }} />
                </div>
              </div>
            ) : null}
          </div>

          <div className="planner-mockup__cards">
            {(state.features.length ? state.features : ["search-filter", "crm-forms", "analytics-charts"])
              .slice(0, 3)
              .map((ft) => (
                <div
                  key={ft}
                  className="planner-mockup__card"
                  style={{
                    backgroundColor: palette.surface,
                    border: cardBorder,
                    boxShadow: cardShadow,
                  }}
                >
                  <span className="planner-mockup__card-dot" style={{ backgroundColor: palette.accent }} />
                  <strong>{PLANNER_FEATURES.find((f) => f.id === ft)?.label ?? ft}</strong>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProjectPlanner() {
  const [state, setState] = useState<PlannerState>(DEFAULT_PLANNER_STATE);
  const [step, setStep] = useState<number>(1);
  const [compareMode, setCompareMode] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string>("");

  // Hydrate ONLY non-personal option IDs from URL if someone opened a shared link
  useEffect(() => {
    if (window.location.search) {
      setState(decodePlannerShareQuery(window.location.search));
    }
  }, []);

  const setField = <K extends keyof PlannerState>(key: K, value: PlannerState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const toggleList = (key: "goals" | "pages" | "features" | "integrations", id: string) => {
    setState((prev) => {
      const list = prev[key];
      const exists = list.includes(id);
      return { ...prev, [key]: exists ? list.filter((x) => x !== id) : [...list, id] };
    });
  };

  const briefText = useMemo(() => formatDiscoveryBrief(state), [state]);
  const openQuestions = useMemo(() => buildOpenQuestions(state), [state]);
  const matched = useMemo(() => matchPortfolioRecommendations(state), [state]);
  const typeMeta = getProjectTypeMeta(state.projectType);

  const compareState: PlannerState = useMemo(
    () => ({ ...state, ...COMPARE_ALTERNATE_PRESET }),
    [state],
  );

  const flash = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(""), 3200);
  };

  const copyBrief = async () => {
    try {
      await navigator.clipboard.writeText(briefText);
      flash("Copied discovery brief to clipboard.");
    } catch {
      flash("Clipboard unavailable — select and copy from the brief box below.");
    }
  };

  const copyShareLink = async () => {
    const query = encodePlannerShareQuery(state);
    const url = `${window.location.origin}/project-planner?${query}`;
    try {
      await navigator.clipboard.writeText(url);
      flash("Copied privacy-safe config link (free-text notes & PII excluded).");
    } catch {
      flash("Share link ready in your address bar.");
      window.history.replaceState(null, "", `/project-planner?${query}`);
    }
  };

  const contactHandoffHref = useMemo(() => {
    const summary = `Visual Planner Brief: ${typeMeta.label} | Platform: ${state.platform} | Mood: ${state.brandMood} (${state.paletteId}) | Features: ${state.features.join(", ") || "TBD"} | Timing: ${state.timeline}`;
    return `/contact?service=${encodeURIComponent(typeMeta.contactService)}&summary=${encodeURIComponent(summary)}`;
  }, [state, typeMeta]);

  return (
    <div className="planner-root">
      {/* Step progress bar */}
      <nav className="planner-stepper panel" aria-label="Project Planner steps">
        <ol className="planner-stepper__list">
          {STEPS.map((s) => {
            const active = s.num === step;
            const done = s.num < step;
            return (
              <li key={s.num}>
                <button
                  type="button"
                  className={`planner-step-btn ${active ? "is-active" : ""} ${done ? "is-done" : ""}`.trim()}
                  onClick={() => setStep(s.num)}
                  aria-current={active ? "step" : undefined}
                >
                  <span className="planner-step-btn__num">{s.num}</span>
                  <span className="planner-step-btn__label">{s.short}</span>
                </button>
              </li>
            );
          })}
        </ol>
        <div className="planner-stepper__meta">
          <span className="mono-tag">Step {step} of 6</span>
          <button
            type="button"
            className="chip chip--sm"
            onClick={() => {
              setState(DEFAULT_PLANNER_STATE);
              setStep(1);
              flash("Planner reset to default studio preset.");
            }}
          >
            Reset defaults
          </button>
        </div>
      </nav>

      {/* Main split workspace: left controls, right real-time preview */}
      <div className="planner-workspace">
        <div className="planner-controls panel panel--lg">
          <div className="planner-controls__head">
            <p className="eyebrow eyebrow--plain">Step 0{step}</p>
            <h2 className="section-title section-title--sm">{STEPS[step - 1].title}</h2>
          </div>

          {step === 1 ? (
            <div className="planner-step-body">
              <fieldset className="planner-group">
                <legend>What are you planning to build?</legend>
                <div className="planner-option-grid">
                  {PLANNER_PROJECT_TYPES.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      className={`planner-choice ${state.projectType === opt.id ? "is-selected" : ""}`}
                      onClick={() => setField("projectType", opt.id)}
                      aria-pressed={state.projectType === opt.id}
                    >
                      <strong>{opt.label}</strong>
                      <span>{opt.short}</span>
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset className="planner-group">
                <legend>Who is the primary audience?</legend>
                <div className="planner-chip-wrap">
                  {PLANNER_AUDIENCES.map((aud) => (
                    <button
                      key={aud.id}
                      type="button"
                      className={`chip ${state.audience === aud.id ? "is-active" : ""}`}
                      onClick={() => setField("audience", aud.id)}
                      aria-pressed={state.audience === aud.id}
                    >
                      {aud.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset className="planner-group">
                <legend>Primary goals (select any)</legend>
                <div className="planner-chip-wrap">
                  {PLANNER_GOALS.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      className={`chip ${state.goals.includes(g.id) ? "is-active" : ""}`}
                      onClick={() => toggleList("goals", g.id)}
                      aria-pressed={state.goals.includes(g.id)}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <div className="form__row">
                <div className="field">
                  <label htmlFor="pp-label">Working project name (optional, stays local)</label>
                  <input
                    id="pp-label"
                    type="text"
                    maxLength={80}
                    placeholder="e.g. Q3 Operations Portal"
                    value={state.projectLabel}
                    onChange={(e) => setField("projectLabel", e.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="pp-problem">Core bottleneck to solve (optional, stays local)</label>
                  <input
                    id="pp-problem"
                    type="text"
                    maxLength={220}
                    placeholder="e.g. Manual quoting takes 2 days across spreadsheets"
                    value={state.problemNote}
                    onChange={(e) => setField("problemNote", e.target.value)}
                  />
                </div>
              </div>
              <p className="fine-print">
                Privacy note: free-text notes stay strictly in your browser and are never added to shareable URLs.
              </p>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="planner-step-body">
              <fieldset className="planner-group">
                <legend>Expected sections or pages</legend>
                <div className="planner-chip-wrap">
                  {PLANNER_PAGES.map((pg) => (
                    <button
                      key={pg.id}
                      type="button"
                      className={`chip ${state.pages.includes(pg.id) ? "is-active" : ""}`}
                      onClick={() => toggleList("pages", pg.id)}
                      aria-pressed={state.pages.includes(pg.id)}
                    >
                      {pg.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset className="planner-group">
                <legend>Key features &amp; capabilities</legend>
                <div className="planner-chip-wrap">
                  {PLANNER_FEATURES.map((ft) => (
                    <button
                      key={ft.id}
                      type="button"
                      className={`chip ${state.features.includes(ft.id) ? "is-active" : ""}`}
                      onClick={() => toggleList("features", ft.id)}
                      aria-pressed={state.features.includes(ft.id)}
                    >
                      {ft.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset className="planner-group">
                <legend>Connected tools &amp; integrations</legend>
                <div className="planner-chip-wrap">
                  {PLANNER_INTEGRATIONS.map((ig) => (
                    <button
                      key={ig.id}
                      type="button"
                      className={`chip ${state.integrations.includes(ig.id) ? "is-active" : ""}`}
                      onClick={() => toggleList("integrations", ig.id)}
                      aria-pressed={state.integrations.includes(ig.id)}
                    >
                      {ig.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset className="planner-group">
                <legend>Preferred technical platform</legend>
                <div className="planner-chip-wrap">
                  {PLANNER_PLATFORMS.map((pl) => (
                    <button
                      key={pl.id}
                      type="button"
                      className={`chip ${state.platform === pl.id ? "is-active" : ""}`}
                      onClick={() => setField("platform", pl.id)}
                      aria-pressed={state.platform === pl.id}
                    >
                      {pl.label}
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="planner-step-body">
              <fieldset className="planner-group">
                <legend>Visual mood &amp; personality</legend>
                <div className="planner-option-grid">
                  {PLANNER_MOODS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      className={`planner-choice ${state.brandMood === m.id ? "is-selected" : ""}`}
                      onClick={() => setField("brandMood", m.id)}
                      aria-pressed={state.brandMood === m.id}
                    >
                      <strong>{m.label}</strong>
                      <span>{m.desc}</span>
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset className="planner-group">
                <legend>Color palette direction</legend>
                <div className="planner-palette-grid">
                  {PLANNER_PALETTES.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className={`planner-palette-btn ${state.paletteId === p.id ? "is-selected" : ""}`}
                      onClick={() => setField("paletteId", p.id)}
                      aria-pressed={state.paletteId === p.id}
                    >
                      <span className="planner-palette-swatches" aria-hidden="true">
                        <span style={{ backgroundColor: p.bg }} />
                        <span style={{ backgroundColor: p.surface }} />
                        <span style={{ backgroundColor: p.accent }} />
                      </span>
                      <strong>{p.name}</strong>
                      <small>{p.note}</small>
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="planner-step-body">
              <fieldset className="planner-group">
                <legend>Typography pairing</legend>
                <div className="planner-option-grid">
                  {PLANNER_TYPOGRAPHY.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className={`planner-choice ${state.typographyId === t.id ? "is-selected" : ""}`}
                      onClick={() => setField("typographyId", t.id)}
                      aria-pressed={state.typographyId === t.id}
                    >
                      <strong style={{ fontFamily: t.headingFont }}>{t.label}</strong>
                      <span>{t.desc}</span>
                    </button>
                  ))}
                </div>
              </fieldset>

              <div className="planner-control-pairs">
                <fieldset className="planner-group">
                  <legend>Heading scale</legend>
                  <div className="planner-chip-wrap">
                    {(["compact", "balanced", "expressive"] as const).map((sc) => (
                      <button
                        key={sc}
                        type="button"
                        className={`chip ${state.typeScale === sc ? "is-active" : ""}`}
                        onClick={() => setField("typeScale", sc)}
                        aria-pressed={state.typeScale === sc}
                      >
                        {sc}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="planner-group">
                  <legend>Button geometry</legend>
                  <div className="planner-chip-wrap">
                    {(["pill", "soft-radius", "sharp"] as const).map((b) => (
                      <button
                        key={b}
                        type="button"
                        className={`chip ${state.buttonStyle === b ? "is-active" : ""}`}
                        onClick={() => setField("buttonStyle", b)}
                        aria-pressed={state.buttonStyle === b}
                      >
                        {b.replace("-", " ")}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="planner-group">
                  <legend>Card surface style</legend>
                  <div className="planner-chip-wrap">
                    {(["bordered", "elevated", "flat-minimal"] as const).map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={`chip ${state.cardStyle === c ? "is-active" : ""}`}
                        onClick={() => setField("cardStyle", c)}
                        aria-pressed={state.cardStyle === c}
                      >
                        {c.replace("-", " ")}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="planner-group">
                  <legend>Navigation pattern</legend>
                  <div className="planner-chip-wrap">
                    {(
                      [
                        ["top-bar", "Top Bar"],
                        ["centered-brand", "Centered Brand"],
                        ["sidebar-app", "App Sidebar"],
                      ] as const
                    ).map(([id, lbl]) => (
                      <button
                        key={id}
                        type="button"
                        className={`chip ${state.navLayout === id ? "is-active" : ""}`}
                        onClick={() => setField("navLayout", id)}
                        aria-pressed={state.navLayout === id}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                </fieldset>
              </div>

              <fieldset className="planner-group">
                <legend>Hero layout style</legend>
                <div className="planner-chip-wrap">
                  {(
                    [
                      ["split-visual", "Split Copy + Visual"],
                      ["centered-editorial", "Centered Editorial"],
                      ["product-frame", "Product Frame Focus"],
                      ["metrics-strip", "Compact Utility Strip"],
                    ] as const
                  ).map(([id, lbl]) => (
                    <button
                      key={id}
                      type="button"
                      className={`chip ${state.heroStyle === id ? "is-active" : ""}`}
                      onClick={() => setField("heroStyle", id)}
                      aria-pressed={state.heroStyle === id}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>
          ) : null}

          {step === 5 ? (
            <div className="planner-step-body">
              <div className="planner-control-pairs">
                <fieldset className="planner-group">
                  <legend>Content &amp; copy readiness</legend>
                  <div className="planner-chip-wrap">
                    {(
                      [
                        ["ready", "Copy & assets ready"],
                        ["partial-drafts", "Rough drafts / notes"],
                        ["need-help", "Need UX writing support"],
                      ] as const
                    ).map(([id, lbl]) => (
                      <button
                        key={id}
                        type="button"
                        className={`chip ${state.contentReadiness === id ? "is-active" : ""}`}
                        onClick={() => setField("contentReadiness", id)}
                        aria-pressed={state.contentReadiness === id}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="planner-group">
                  <legend>Imagery direction</legend>
                  <div className="planner-chip-wrap">
                    {(
                      [
                        ["product-ui", "Product UI captures"],
                        ["editorial-photo", "Brand photography"],
                        ["3d-motion", "3D / Motion accents"],
                        ["clean-diagrams", "Technical diagrams"],
                      ] as const
                    ).map(([id, lbl]) => (
                      <button
                        key={id}
                        type="button"
                        className={`chip ${state.imageryStyle === id ? "is-active" : ""}`}
                        onClick={() => setField("imageryStyle", id)}
                        aria-pressed={state.imageryStyle === id}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="planner-group">
                  <legend>Motion comfort</legend>
                  <div className="planner-chip-wrap">
                    {(
                      [
                        ["minimal-static", "Minimal / reduced motion"],
                        ["subtle-polish", "Subtle micro-transitions"],
                        ["expressive-guided", "Expressive guided motion"],
                      ] as const
                    ).map(([id, lbl]) => (
                      <button
                        key={id}
                        type="button"
                        className={`chip ${state.motionLevel === id ? "is-active" : ""}`}
                        onClick={() => setField("motionLevel", id)}
                        aria-pressed={state.motionLevel === id}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="planner-group">
                  <legend>Accessibility &amp; device priority</legend>
                  <div className="planner-chip-wrap">
                    <button
                      type="button"
                      className={`chip ${state.accessibilityTarget === "wcag-aa" ? "is-active" : ""}`}
                      onClick={() => setField("accessibilityTarget", "wcag-aa")}
                      aria-pressed={state.accessibilityTarget === "wcag-aa"}
                    >
                      WCAG 2.2 AA
                    </button>
                    <button
                      type="button"
                      className={`chip ${state.accessibilityTarget === "wcag-aaa-strict" ? "is-active" : ""}`}
                      onClick={() => setField("accessibilityTarget", "wcag-aaa-strict")}
                      aria-pressed={state.accessibilityTarget === "wcag-aaa-strict"}
                    >
                      Strict WCAG AAA
                    </button>
                    {(["mobile-first", "balanced-responsive", "desktop-heavy-app"] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        className={`chip ${state.mobilePriority === m ? "is-active" : ""}`}
                        onClick={() => setField("mobilePriority", m)}
                        aria-pressed={state.mobilePriority === m}
                      >
                        {m.replace(/-/g, " ")}
                      </button>
                    ))}
                  </div>
                </fieldset>
              </div>

              <div className="form__row">
                <div className="field">
                  <label htmlFor="pp-timeline">Desired timeline</label>
                  <select
                    id="pp-timeline"
                    value={state.timeline}
                    onChange={(e) => setField("timeline", e.target.value)}
                  >
                    {PLANNER_TIMELINES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="pp-budget">Budget comfort (optional)</label>
                  <select
                    id="pp-budget"
                    value={state.budget}
                    onChange={(e) => setField("budget", e.target.value)}
                  >
                    {PLANNER_BUDGETS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ) : null}

          {step === 6 ? (
            <div className="planner-step-body">
              <div className="planner-disclaimer" role="note">
                <Icon name="alert" size={18} />
                <p>
                  <strong>Exploratory discovery brief:</strong> This summary helps align visual taste, scope shape, and
                  open questions before a call. It is <strong>not</strong> a fixed quote, contract, or guaranteed timeline.
                </p>
              </div>

              <div className="planner-export-actions">
                <button type="button" className="btn btn--primary btn--sm" onClick={copyBrief}>
                  <Icon name="check" size={15} />
                  <span>Copy readable brief</span>
                </button>
                <button type="button" className="btn btn--secondary btn--sm" onClick={() => window.print()}>
                  <span>Print / Save PDF</span>
                </button>
                <button type="button" className="btn btn--secondary btn--sm" onClick={copyShareLink}>
                  <span>Copy privacy-safe config URL</span>
                </button>
                <Link href={contactHandoffHref} className="btn btn--secondary btn--sm">
                  <span>Open in Contact Inquiry</span>
                  <Icon name="arrow-up-right" size={15} />
                </Link>
              </div>

              {feedback ? (
                <p className="planner-feedback" role="status">
                  {feedback}
                </p>
              ) : null}

              <div className="planner-brief-section">
                <h3 className="card-title">Tailored discovery questions to align on</h3>
                <ol className="planner-questions">
                  {openQuestions.map((q) => (
                    <li key={q}>{q}</li>
                  ))}
                </ol>
              </div>

              <div className="planner-brief-section">
                <h3 className="card-title">Matched studio services &amp; portfolio references</h3>
                <div className="location-pill-list" style={{ marginTop: "10px" }}>
                  {matched.services.map((s) => (
                    <Link key={s.href} href={s.href} className="location-pill location-pill--all">
                      {s.label} →
                    </Link>
                  ))}
                </div>
                <div className="planner-matched-projects">
                  {matched.projects.map((p) => (
                    <Link key={p.slug} href={`/work/${p.slug}`} className="planner-match-card">
                      <StatusBadge status={p.status} />
                      <strong>{p.title}</strong>
                      <span>{p.categories.join(" · ")}</span>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="planner-brief-section">
                <h3 className="card-title">Plain-text brief (ready to copy or print)</h3>
                <pre className="planner-brief-pre">{briefText}</pre>
              </div>
            </div>
          ) : null}

          <div className="planner-nav-footer">
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              disabled={step === 1}
              onClick={() => setStep((s) => Math.max(1, s - 1))}
            >
              <Icon name="arrow-right" size={15} className="flip" />
              <span>Previous step</span>
            </button>
            {step < 6 ? (
              <button
                type="button"
                className="btn btn--primary btn--sm"
                onClick={() => setStep((s) => Math.min(6, s + 1))}
              >
                <span>{step === 5 ? "Review discovery brief" : "Next step"}</span>
                <Icon name="arrow-right" size={15} />
              </button>
            ) : (
              <button type="button" className="btn btn--secondary btn--sm" onClick={() => setStep(1)}>
                <span>Revise answers</span>
              </button>
            )}
          </div>
        </div>

        {/* Sticky Live Preview Pane */}
        <aside className="planner-preview-col" aria-label="Live visual mockup preview">
          <div className="panel planner-preview-card">
            <div className="planner-preview-head">
              <div>
                <p className="eyebrow eyebrow--plain">Real-time visual mockup</p>
                <p className="fine-print">Updates immediately as you change mood, palette, type, or layout.</p>
              </div>
              <button
                type="button"
                className={`chip chip--sm ${compareMode ? "is-active" : ""}`}
                onClick={() => setCompareMode((v) => !v)}
                aria-pressed={compareMode}
              >
                {compareMode ? "Single preview" : "Compare daylight preset"}
              </button>
            </div>

            <div className={`planner-preview-stack ${compareMode ? "is-comparing" : ""}`}>
              <LiveVisualMockup state={state} label="Your direction" />
              {compareMode ? <LiveVisualMockup state={compareState} label="Daylight editorial contrast" /> : null}
            </div>

            <dl className="planner-live-summary">
              <div>
                <dt>Project</dt>
                <dd>{typeMeta.label}</dd>
              </div>
              <div>
                <dt>Visual system</dt>
                <dd>
                  {getPalette(state.paletteId).name} · {getTypography(state.typographyId).label}
                </dd>
              </div>
              <div>
                <dt>Structure</dt>
                <dd>
                  {state.pages.length} pages · {state.features.length} features · {state.integrations.length} integrations
                </dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}
