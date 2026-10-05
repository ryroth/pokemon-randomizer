export function ModelArtwork({ src, name, shiny = false }: { src: string | null; name: string; shiny?: boolean }) {
  const label = shiny ? `Shiny artwork of ${name}` : `Artwork of ${name}`;
  if (!src) {
    return <p className="px-4 text-center text-sm text-white/80">No artwork is available for {name}.</p>;
  }

  return (
    // Catalog artwork is a remote URL. next/image is unnecessary for this fallback.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={label}
      className="h-64 w-64 max-h-full max-w-full object-contain [image-rendering:pixelated] sm:h-72 sm:w-72"
    />
  );
}
