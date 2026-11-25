"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import type { CoarseRegion, VerifiedCollaborator } from "@/lib/studio-network";

export type PublicGlobeCollaborator = VerifiedCollaborator & {
  lat: number;
  lng: number;
  area: CoarseRegion["area"];
};

type Props = {
  collaborators: PublicGlobeCollaborator[];
  deliveryConfigured: boolean;
};

const DEG = Math.PI / 180;
const CX = 240;
const CY = 240;
const R = 192;

/** Simplified stylized continental polygons [lng, lat] for lightweight zero-dependency SVG globe. */
const CONTINENTS: [number, number][][] = [
  // North America
  [[-166, 65], [-140, 70], [-110, 68], [-82, 62], [-64, 46], [-72, 41], [-80, 26], [-97, 25], [-105, 20], [-117, 32], [-125, 48], [-145, 60]],
  // South America
  [[-80, 10], [-62, 11], [-36, -6], [-40, -22], [-56, -36], [-68, -54], [-74, -42], [-72, -18], [-81, -4]],
  // Europe
  [[-10, 36], [-9, 43], [-4, 48], [2, 51], [8, 56], [20, 64], [34, 68], [46, 60], [42, 46], [28, 40], [16, 42], [6, 43], [-2, 37]],
  // UK
  [[-6, 50], [-5, 58], [1, 57], [2, 51]],
  // Africa
  [[-17, 15], [-6, 35], [10, 37], [32, 31], [43, 12], [51, 11], [41, -12], [32, -28], [18, -34], [12, -16], [9, 4], [-8, 5]],
  // Asia
  [[42, 42], [62, 66], [105, 72], [148, 66], [142, 44], [124, 38], [120, 22], [106, 10], [96, 16], [80, 8], [67, 24], [54, 24], [46, 30]],
  // Australia
  [[114, -22], [130, -12], [146, -16], [153, -28], [147, -38], [134, -34], [116, -34]],
];

/** Remote studio coverage anchor (approximate region, never a street address). */
const STUDIO_HUB = {
  id: "studio-hub",
  label: "Ali Arshad Personal Studio (Remote Hub)",
  region: "Remote Studio · US Time-Zone Overlap",
  lat: 33.7,
  lng: 73.1,
};

const US_COVERAGE_ANCHORS = [
  { id: "cov-us-east", label: "US Eastern Overlap", lat: 40.7, lng: -74.0 },
  { id: "cov-us-central", label: "US Central Overlap", lat: 35.5, lng: -96.8 },
  { id: "cov-us-west", label: "US Pacific Overlap", lat: 37.8, lng: -122.4 },
];

const REGION_PRESETS = [
  { id: "us", label: "North America", rotLng: -96, rotLat: 26 },
  { id: "eu", label: "Europe", rotLng: 12, rotLat: 42 },
  { id: "asia", label: "South Asia & Hub", rotLng: 72, rotLat: 26 },
  { id: "global", label: "Atlantic Bridge", rotLng: -28, rotLat: 28 },
];

function projectPoint(lat: number, lng: number, rotLng: number, rotLat: number) {
  const phi = lat * DEG;
  const lambda = (lng - rotLng) * DEG;
  const phi0 = rotLat * DEG;

  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);
  const cosPhi0 = Math.cos(phi0);
  const sinPhi0 = Math.sin(phi0);
  const cosLam = Math.cos(lambda);
  const sinLam = Math.sin(lambda);

  const z = sinPhi0 * sinPhi + cosPhi0 * cosPhi * cosLam;
  const x = CX + R * cosPhi * sinLam;
  const y = CY - R * (cosPhi0 * sinPhi - sinPhi0 * cosPhi * cosLam);

  return { x, y, visible: z >= -0.04, z };
}

function buildPolygonPath(coords: [number, number][], rotLng: number, rotLat: number): string {
  const pts = coords.map(([lng, lat]) => projectPoint(lat, lng, rotLng, rotLat));
  if (!pts.some((p) => p.visible)) return "";
  const clamped = pts.map((p) => {
    if (p.visible) return p;
    const dx = p.x - CX;
    const dy = p.y - CY;
    const dist = Math.hypot(dx, dy) || 1;
    return { ...p, x: CX + (dx / dist) * R, y: CY + (dy / dist) * R };
  });
  return clamped
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ") + " Z";
}

function buildGraticulePaths(rotLng: number, rotLat: number): string[] {
  const paths: string[] = [];
  for (let lat = -60; lat <= 60; lat += 30) {
    let seg = "";
    for (let lng = -180; lng <= 180; lng += 12) {
      const p = projectPoint(lat, lng, rotLng, rotLat);
      if (p.visible) {
        seg += `${seg ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)} `;
      } else if (seg) {
        paths.push(seg.trim());
        seg = "";
      }
    }
    if (seg) paths.push(seg.trim());
  }
  for (let lng = -180; lng < 180; lng += 30) {
    let seg = "";
    for (let lat = -84; lat <= 84; lat += 12) {
      const p = projectPoint(lat, lng, rotLng, rotLat);
      if (p.visible) {
        seg += `${seg ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)} `;
      } else if (seg) {
        paths.push(seg.trim());
        seg = "";
      }
    }
    if (seg) paths.push(seg.trim());
  }
  return paths;
}

export function StudioNetworkGlobe({ collaborators, deliveryConfigured }: Props) {
  const [rotLng, setRotLng] = useState(-34);
  const [rotLat, setRotLat] = useState(26);
  const [autoSpin, setAutoSpin] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [selectedId, setSelectedId] = useState<string>("studio-hub");
  const dragRef = useRef<{ active: boolean; x: number; y: number; lng: number; lat: number }>({
    active: false,
    x: 0,
    y: 0,
    lng: -34,
    lat: 26,
  });

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      setReducedMotion(mq.matches);
      if (mq.matches) setAutoSpin(false);
    };
    sync();
    mq.addEventListener?.("change", sync);
    return () => mq.removeEventListener?.("change", sync);
  }, []);

  useEffect(() => {
    if (!autoSpin || reducedMotion) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(48, now - last);
      last = now;
      setRotLng((prev) => {
        const next = prev + dt * 0.008;
        return next > 180 ? next - 360 : next;
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [autoSpin, reducedMotion]);

  const graticules = useMemo(() => buildGraticulePaths(rotLng, rotLat), [rotLng, rotLat]);
  const landPaths = useMemo(
    () => CONTINENTS.map((poly) => buildPolygonPath(poly, rotLng, rotLat)).filter(Boolean),
    [rotLng, rotLat],
  );

  const hubPos = projectPoint(STUDIO_HUB.lat, STUDIO_HUB.lng, rotLng, rotLat);
  const coveragePins = US_COVERAGE_ANCHORS.map((a) => ({
    ...a,
    pos: projectPoint(a.lat, a.lng, rotLng, rotLat),
  }));
  const collaboratorPins = collaborators.map((c) => ({
    ...c,
    pos: projectPoint(c.lat, c.lng, rotLng, rotLat),
  }));

  const selectedCollaborator = collaborators.find((c) => c.id === selectedId) ?? null;

  const onPointerDown = (e: PointerEvent<SVGSVGElement>) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setAutoSpin(false);
    dragRef.current = { active: true, x: e.clientX, y: e.clientY, lng: rotLng, lat: rotLat };
  };

  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    if (!dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    let nextLng = dragRef.current.lng - dx * 0.35;
    if (nextLng > 180) nextLng -= 360;
    if (nextLng < -180) nextLng += 360;
    const nextLat = Math.max(-55, Math.min(62, dragRef.current.lat + dy * 0.25));
    setRotLng(nextLng);
    setRotLat(nextLat);
  };

  const onPointerUp = () => {
    dragRef.current.active = false;
  };

  const onKeyDown = (e: KeyboardEvent<SVGSVGElement>) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setAutoSpin(false);
      setRotLng((v) => (v - 18 < -180 ? v + 342 : v - 18));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setAutoSpin(false);
      setRotLng((v) => (v + 18 > 180 ? v - 342 : v + 18));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setAutoSpin(false);
      setRotLat((v) => Math.min(62, v + 12));
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setAutoSpin(false);
      setRotLat((v) => Math.max(-55, v - 12));
    } else if (e.key === "Home" || e.key === "r" || e.key === "R") {
      e.preventDefault();
      setRotLng(-34);
      setRotLat(26);
    }
  };

  return (
    <div className="globe-showcase" aria-labelledby="network-globe-title">
      <div className="globe-showcase__stage panel">
        <div className="globe-showcase__bar">
          <div className="globe-showcase__presets" role="group" aria-label="Focus globe region">
            {REGION_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className="chip chip--sm"
                onClick={() => {
                  setAutoSpin(false);
                  setRotLng(preset.rotLng);
                  setRotLat(preset.rotLat);
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="chip chip--sm"
            onClick={() => setAutoSpin((s) => !s)}
            disabled={reducedMotion}
            aria-pressed={autoSpin}
            title={reducedMotion ? "Auto-drift disabled because reduced motion is enabled" : "Toggle slow globe rotation"}
          >
            {reducedMotion ? "Static (Reduced Motion)" : autoSpin ? "Pause Rotation" : "Slow Drift"}
          </button>
        </div>

        <div className="globe-stage-wrap">
          <svg
            viewBox="0 0 480 480"
            className="globe-svg"
            role="application"
            tabIndex={0}
            aria-label="Interactive privacy-first Studio Network globe. Drag or use arrow keys to rotate across remote collaboration regions."
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onKeyDown={onKeyDown}
          >
            <defs>
              <radialGradient id="snGlobeBg" cx="38%" cy="32%" r="70%">
                <stop offset="0%" stopColor="#1b2638" />
                <stop offset="68%" stopColor="#0f1520" />
                <stop offset="100%" stopColor="#080b11" />
              </radialGradient>
              <radialGradient id="snGlobeHalo" cx="50%" cy="50%" r="50%">
                <stop offset="76%" stopColor="rgba(255,122,92,0)" />
                <stop offset="94%" stopColor="rgba(255,122,92,0.14)" />
                <stop offset="100%" stopColor="rgba(56,189,248,0)" />
              </radialGradient>
            </defs>

            <circle cx={CX} cy={CY} r={R + 18} fill="url(#snGlobeHalo)" />
            <circle cx={CX} cy={CY} r={R} fill="url(#snGlobeBg)" stroke="#2c3a4f" strokeWidth="1.5" />

            {/* Latitude / longitude wireframe */}
            <g fill="none" stroke="rgba(167, 179, 198, 0.14)" strokeWidth="1">
              {graticules.map((d, i) => (
                <path key={i} d={d} />
              ))}
            </g>

            {/* Stylized landmass silhouettes */}
            <g fill="#1a2433" stroke="#314158" strokeWidth="1.1">
              {landPaths.map((d, i) => (
                <path key={i} d={d} />
              ))}
            </g>

            {/* Remote US time-zone overlap anchor arcs (informational coverage, not physical offices) */}
            {coveragePins.map((anchor) =>
              anchor.pos.visible && hubPos.visible ? (
                <path
                  key={`arc-${anchor.id}`}
                  d={`M${hubPos.x.toFixed(1)},${hubPos.y.toFixed(1)} Q${((hubPos.x + anchor.pos.x) / 2).toFixed(1)},${(
                    Math.min(hubPos.y, anchor.pos.y) - 34
                  ).toFixed(1)} ${anchor.pos.x.toFixed(1)},${anchor.pos.y.toFixed(1)}`}
                  fill="none"
                  stroke="rgba(56, 189, 248, 0.34)"
                  strokeWidth="1.25"
                  strokeDasharray="4 4"
                />
              ) : null,
            )}

            {/* US remote overlap anchor dots */}
            {coveragePins.map((anchor) =>
              anchor.pos.visible ? (
                <g key={anchor.id}>
                  <circle cx={anchor.pos.x} cy={anchor.pos.y} r="4.5" fill="#38bdf8" opacity="0.82" />
                  <circle cx={anchor.pos.x} cy={anchor.pos.y} r="9" fill="#38bdf8" opacity="0.16" />
                </g>
              ) : null,
            )}

            {/* Studio Remote Hub pin */}
            {hubPos.visible ? (
              <g
                className="globe-pin"
                role="button"
                tabIndex={0}
                aria-label="Ali Arshad Personal Studio remote hub"
                onClick={() => setSelectedId("studio-hub")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedId("studio-hub");
                  }
                }}
              >
                <circle cx={hubPos.x} cy={hubPos.y} r="13" fill="rgba(255, 122, 92, 0.22)" />
                <circle cx={hubPos.x} cy={hubPos.y} r="6.5" fill="#ff7a5c" stroke="#fff7f3" strokeWidth="2" />
              </g>
            ) : null}

            {/* Verified + approved + explicitly opted-in collaborator pins ONLY */}
            {collaboratorPins.map((c) =>
              c.pos.visible ? (
                <g
                  key={c.id}
                  className="globe-pin"
                  role="button"
                  tabIndex={0}
                  aria-label={`${c.name}, ${c.role}, approximate region ${c.approximateLocation}`}
                  onClick={() => setSelectedId(c.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedId(c.id);
                    }
                  }}
                >
                  <circle cx={c.pos.x} cy={c.pos.y} r="12" fill="rgba(52, 211, 153, 0.24)" />
                  <circle
                    cx={c.pos.x}
                    cy={c.pos.y}
                    r="6"
                    fill="#34d399"
                    stroke={selectedId === c.id ? "#ffffff" : "#0b1117"}
                    strokeWidth="2"
                  />
                </g>
              ) : null,
            )}
          </svg>
        </div>

        <p className="fine-print globe-showcase__hint">
          Drag or use arrow keys to rotate the globe (<kbd>R</kbd> resets view). Blue nodes indicate remote US time-zone overlap — not physical studio offices.
        </p>
      </div>

      <aside className="globe-showcase__panel panel" aria-live="polite">
        <div className="globe-showcase__status-row">
          <span className="badge badge--demo">Privacy-First Directory</span>
          <span className="mono-tag globe-showcase__count">
            {collaborators.length} public pin{collaborators.length === 1 ? "" : "s"}
          </span>
        </div>

        {selectedCollaborator ? (
          <div className="globe-detail-card">
            <h3 className="card-title">{selectedCollaborator.name}</h3>
            <p className="roster-card__meta">
              {selectedCollaborator.role} · {selectedCollaborator.approximateLocation}
            </p>
            <p className="section-sub">{selectedCollaborator.specialty}</p>
            {selectedCollaborator.portfolioUrl ? (
              <a
                href={selectedCollaborator.portfolioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="arrow-link"
              >
                <span>View verified portfolio</span>
                <Icon name="arrow-up-right" size={14} />
              </a>
            ) : null}
          </div>
        ) : (
          <div className="globe-detail-card">
            <h3 className="card-title">{STUDIO_HUB.label}</h3>
            <p className="roster-card__meta">{STUDIO_HUB.region}</p>
            <p className="section-sub">
              {collaborators.length === 0
                ? "Zero public collaborator pins are published right now. Submissions stay private by default until each independent specialist opts into public listing, verifies their identity, and passes manual moderation."
                : "Select any green pin on the globe to view an approved collaborator's coarse metro region and specialty."}
            </p>
          </div>
        )}

        <ul className="check-list check-list--spaced globe-privacy-rules">
          <li>
            <Icon name="check" size={15} />
            <span>
              <strong>Private by default:</strong> registering interest never places you on this globe automatically.
            </span>
          </li>
          <li>
            <Icon name="check" size={15} />
            <span>
              <strong>Approximate city/region only:</strong> exact home addresses, street details, and emails are never published.
            </span>
          </li>
          <li>
            <Icon name="check" size={15} />
            <span>
              <strong>Separate from demo scenarios:</strong> illustrative fictional teams on{" "}
              <Link href="/demo-scenarios">/demo-scenarios</Link> never appear on this collaborator globe.
            </span>
          </li>
        </ul>

        {!deliveryConfigured ? (
          <p className="fine-print globe-showcase__unconfigured">
            Note: Server intake and moderation webhooks are not connected in this environment yet, so new registrations cannot be stored or auto-published here.
          </p>
        ) : null}
      </aside>
    </div>
  );
}
