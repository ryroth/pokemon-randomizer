import { cn } from "@/lib/utils";

export function ModelArtwork({ src, name, shiny = false }: { src: string | null; name: string; shiny?: boolean }) {
  const kind = src && !src.includes("/official-artwork/") ? "sprite" : "artwork";
  const label = shiny ? `Shiny ${kind} of ${name}` : `${kind === "sprite" ? "Sprite" : "Artwork"} of ${name}`;
  if (!src) {
    return <p className="px-4 text-center text-sm text-white/80">No artwork is available for {name}.</p>;
  }

  return (
    // Catalog artwork is a remote URL. next/image is unnecessary for this fallback.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={label}
      className={cn(
        "h-64 w-64 max-h-full max-w-full object-contain sm:h-72 sm:w-72",
        // Official artwork is a large painting. Only the small game sprites need crisp pixels.
        !src.includes("/official-artwork/") && "[image-rendering:pixelated]",
      )}
    />
  );
}
