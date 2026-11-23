import type { InsightPost } from "@/lib/content/insights";

/**
 * Editorial SVG cover illustrations for Insights posts.
 * Consistent obsidian-and-coral visual language, varied per topic,
 * clearly illustrative rather than mistaken for screenshots or stock photos.
 */
export function InsightCoverArt({
  variant,
  title,
}: {
  variant: InsightPost["coverVariant"];
  title: string;
}) {
  return (
    <div className="insight-cover" role="img" aria-label={`Editorial illustration for ${title}`}>
      {variant === "crm" ? (
        <svg viewBox="0 0 640 360" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="640" height="360" fill="#101319" />
          <path d="M40 310H600" stroke="#242934" strokeWidth="1" />
          <rect x="64" y="84" width="144" height="196" rx="12" fill="#161B24" stroke="#2A3140" />
          <rect x="248" y="64" width="144" height="216" rx="12" fill="#161B24" stroke="#FF7A5C" strokeOpacity="0.55" />
          <rect x="432" y="108" width="144" height="172" rx="12" fill="#161B24" stroke="#2A3140" />
          <rect x="84" y="112" width="104" height="34" rx="6" fill="#202633" />
          <rect x="84" y="158" width="104" height="34" rx="6" fill="#202633" />
          <rect x="268" y="96" width="104" height="40" rx="6" fill="#FF7A5C" fillOpacity="0.18" stroke="#FF7A5C" strokeOpacity="0.6" />
          <rect x="268" y="150" width="104" height="36" rx="6" fill="#202633" />
          <rect x="452" y="136" width="104" height="42" rx="6" fill="#10B981" fillOpacity="0.16" stroke="#34D399" strokeOpacity="0.5" />
          <path d="M208 130H248M392 155H432" stroke="#FF7A5C" strokeWidth="2" strokeDasharray="4 4" />
          <text x="64" y="46" fill="#9AA3B2" fontFamily="monospace" fontSize="12" letterSpacing="1.6">
            EDITORIAL DIAGRAM · CRM ARCHITECTURE
          </text>
        </svg>
      ) : variant === "inventory" ? (
        <svg viewBox="0 0 640 360" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="640" height="360" fill="#101319" />
          <rect x="64" y="96" width="150" height="168" rx="12" fill="#161B24" stroke="#2A3140" />
          <rect x="245" y="76" width="150" height="208" rx="12" fill="#161B24" stroke="#34D399" strokeOpacity="0.55" />
          <rect x="426" y="112" width="150" height="152" rx="12" fill="#161B24" stroke="#2A3140" />
          <circle cx="139" cy="180" r="34" fill="#FF7A5C" fillOpacity="0.15" stroke="#FF7A5C" strokeOpacity="0.65" />
          <rect x="275" y="120" width="90" height="18" rx="4" fill="#34D399" fillOpacity="0.28" />
          <rect x="275" y="152" width="90" height="18" rx="4" fill="#242B38" />
          <rect x="275" y="184" width="90" height="18" rx="4" fill="#242B38" />
          <rect x="275" y="216" width="60" height="18" rx="4" fill="#FF7A5C" fillOpacity="0.3" />
          <rect x="466" y="142" width="70" height="94" rx="10" fill="#0D1117" stroke="#34D399" strokeOpacity="0.55" />
          <path d="M214 180H245M395 180H426" stroke="#34D399" strokeWidth="2" />
          <text x="64" y="46" fill="#9AA3B2" fontFamily="monospace" fontSize="12" letterSpacing="1.6">
            EDITORIAL DIAGRAM · ATOMIC LEDGER &amp; MOBILE SYNC
          </text>
        </svg>
      ) : variant === "automation" ? (
        <svg viewBox="0 0 640 360" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="640" height="360" fill="#101319" />
          <rect x="64" y="146" width="118" height="68" rx="12" fill="#161B24" stroke="#2A3140" />
          <rect x="234" y="88" width="144" height="72" rx="12" fill="#161B24" stroke="#FF7A5C" strokeOpacity="0.65" />
          <rect x="234" y="200" width="144" height="72" rx="12" fill="#161B24" stroke="#2A3140" />
          <rect x="436" y="146" width="140" height="68" rx="12" fill="#FF7A5C" fillOpacity="0.14" stroke="#FF7A5C" />
          <path d="M182 180C208 180 208 124 234 124" stroke="#FF7A5C" strokeWidth="2" />
          <path d="M182 180C208 180 208 236 234 236" stroke="#64748B" strokeWidth="2" />
          <path d="M378 124C408 124 408 180 436 180" stroke="#FF7A5C" strokeWidth="2" />
          <path d="M378 236C408 236 408 180 436 180" stroke="#64748B" strokeWidth="2" />
          <text x="64" y="46" fill="#9AA3B2" fontFamily="monospace" fontSize="12" letterSpacing="1.6">
            EDITORIAL DIAGRAM · HUMAN-IN-THE-LOOP ROUTING
          </text>
        </svg>
      ) : (
        <svg viewBox="0 0 640 360" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="640" height="360" fill="#101319" />
          <polygon points="320,66 470,148 320,230 170,148" fill="#161B24" stroke="#FF7A5C" strokeOpacity="0.7" strokeWidth="1.5" />
          <polygon points="320,110 470,192 320,274 170,192" fill="#161B24" fillOpacity="0.7" stroke="#334155" strokeWidth="1.5" />
          <polygon points="320,152 470,234 320,316 170,234" fill="#0D1117" fillOpacity="0.8" stroke="#242934" strokeWidth="1.5" />
          <circle cx="320" cy="148" r="18" fill="#FF7A5C" fillOpacity="0.22" stroke="#FF7A5C" />
          <text x="64" y="46" fill="#9AA3B2" fontFamily="monospace" fontSize="12" letterSpacing="1.6">
            EDITORIAL DIAGRAM · SELECTIVE 3D &amp; MOTION
          </text>
        </svg>
      )}
    </div>
  );
}
