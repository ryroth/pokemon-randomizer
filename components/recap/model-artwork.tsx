import { isPixelSprite } from "@/lib/art/pokemonImage";
import { cn } from "@/lib/utils";

/** The still picture of a Pokémon on the recap card: official artwork in the matching colors. */
export function ModelArtwork({ src, name, shiny = false }: { src: string | null; name: string; shiny?: boolean }) {
  const pixel = src !== null && isPixelSprite(src);
  const kind = pixel ? "sprite" : "artwork";
  const label = shiny ? `Shiny ${kind} of ${name}` : `${kind === "sprite" ? "Sprite" : "Artwork"} of ${name}`;
  if (!src) {
    return <p className="px-4 text-center text-sm text-white/80">No artwork is available for {name}.</p>;
  }

  return (
    // Catalog artwork is a remote URL. next/image is unnecessary here.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={label}
      className={cn(
        "h-64 w-64 max-h-full max-w-full object-contain sm:h-72 sm:w-72",
        // Only the small pixel sprites need crisp edges.
        pixel && "[image-rendering:pixelated]",
      )}
    />
  );
}
