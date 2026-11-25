import Image from "next/image";
import type { ProjectMedia } from "@/lib/projects";

/** Image and video gallery for detail pages with clear screen captions. Videos never autoplay. */
export function MediaGallery({ items }: { items: ProjectMedia[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="media-gallery">
      {items.map((m, idx) => (
        <li key={m.src} className="media-gallery__item panel">
          <figure className="media-gallery__figure">
            {m.type === "image" ? (
              <Image
                src={m.src}
                alt={m.alt}
                width={m.width}
                height={m.height}
                loading={idx < 4 ? "eager" : "lazy"}
                sizes="(min-width: 1024px) 600px, 100vw"
              />
            ) : (
              <video src={m.src} poster={m.poster} controls preload="none" playsInline aria-label={m.alt} />
            )}
            <figcaption className="media-gallery__caption">{m.alt}</figcaption>
          </figure>
        </li>
      ))}
    </ul>
  );
}
