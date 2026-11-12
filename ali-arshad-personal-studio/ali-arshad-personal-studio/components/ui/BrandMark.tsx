/** The coral "A" mark, recreated as SVG. */
export function BrandMark({ size = 30, title }: { size?: number; title?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" role={title ? "img" : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <path d="M20 4 38 38h-7.9C27.9 29.700 24.500 26 20 26s-7.9 3.700-10.100 12H2L20 4Z" fill="var(--coral)" />
    </svg>
  );
}
