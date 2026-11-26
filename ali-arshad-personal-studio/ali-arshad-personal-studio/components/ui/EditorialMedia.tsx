import Image from "next/image";

type Props = {
  src: string;
  alt: string;
  caption?: string;
  badge?: string;
  priority?: boolean;
  aspect?: "16/10" | "16/9" | "4/3";
  className?: string;
};

/**
 * Standardized editorial photograph frame preventing CLS and visual crop drift
 * across service hubs, subpages, and Studio Network sections.
 */
export function EditorialMedia({
  src,
  alt,
  caption,
  badge,
  priority = false,
  aspect = "16/10",
  className = "",
}: Props) {
  return (
    <figure className={`editorial-media ${className}`.trim()}>
      <div className={`editorial-media__frame editorial-media__frame--${aspect.replace("/", "-")}`}>
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes="(min-width: 1200px) 580px, (min-width: 768px) 48vw, 94vw"
          className="editorial-media__img"
        />
        {badge ? <span className="editorial-media__badge">{badge}</span> : null}
      </div>
      {caption ? <figcaption className="editorial-media__caption">{caption}</figcaption> : null}
    </figure>
  );
}
