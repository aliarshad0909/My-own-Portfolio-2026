import { MotionMedia } from "@/components/ui/MotionMedia";

type Props = {
  /** Layout presentation preset for the restored original 3D "A" mark. */
  variant?: "cta" | "hero-badge" | "contact";
  className?: string;
};

/**
 * Restored original sculpted 3D "A" studio mark (`/images/signature/mark-3d.webp`
 * paired with its rendered `/videos/mark-3d.webm` & `.mp4` motion loop).
 *
 * - Pure black render is screen-blended onto obsidian + warm coral glow halos.
 * - Automatic static WebP fallback under `prefers-reduced-motion: reduce`, on
 *   narrow mobile viewports (no heavy video download), or if autoplay is blocked.
 * - Decorative only (`aria-hidden="true"`), zero keyboard traps.
 */
export function SignatureMark3D({ variant = "cta", className = "" }: Props) {
  return (
    <div className={`sig3d sig3d--${variant} ${className}`.trim()} aria-hidden="true">
      <span className="sig3d__halo" />
      <div className="sig3d__media">
        <MotionMedia
          still={{
            src: "/images/signature/mark-3d.webp",
            alt: "",
            width: 720,
            height: 720,
          }}
          sources={[
            { src: "/videos/mark-3d.webm", type: "video/webm" },
            { src: "/videos/mark-3d.mp4", type: "video/mp4" },
          ]}
          minWidth={768}
        />
      </div>
    </div>
  );
}
