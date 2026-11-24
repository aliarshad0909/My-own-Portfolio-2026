import { MotionMedia } from "@/components/ui/MotionMedia";

type Props = {
  /** Layout scale preset for the existing sculpted 3D "A" mark. */
  variant?: "cta" | "contact";
  className?: string;
};

/**
 * Existing sculpted 3D "A" studio mark (`/images/signature/mark-3d.webp`
 * paired with `/videos/mark-3d.webm` & `.mp4`) placed directly in open visual
 * space — never inside a card, bordered box, tile, or cropped frame.
 *
 * - Screen-blended directly into warm coral/copper/dark surroundings so the
 *   pure-black render backdrop disappears with zero harsh halo or box edge.
 * - Subtle warm ambient light and soft contact shadow sit behind the mark.
 * - Automatic static WebP fallback under `prefers-reduced-motion: reduce`, on
 *   narrow mobile viewports, or if autoplay is blocked.
 * - Decorative only (`aria-hidden="true"`), zero keyboard traps.
 */
export function SignatureMark3D({ variant = "cta", className = "" }: Props) {
  return (
    <div className={`sig3d sig3d--${variant} ${className}`.trim()} aria-hidden="true">
      <span className="sig3d__ambient" />
      <span className="sig3d__shadow" />
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
