import { AnimatedPokemon } from "@/components/art/animated-pokemon";

/** The PokéRogue sprite on the recap card, in the set's colors. */
export function ModelArtwork({
  pokemonId,
  src,
  name,
  shiny = false,
  female = false,
}: {
  pokemonId: string;
  src: string | null;
  name: string;
  shiny?: boolean;
  female?: boolean;
}) {
  const label = shiny ? `Shiny sprite of ${name}` : `Sprite of ${name}`;

  return (
    <AnimatedPokemon
      pokemonId={pokemonId}
      name={name}
      shiny={shiny}
      female={female}
      fallbackSrc={src}
      label={label}
      className="h-64 w-64 max-h-full max-w-full sm:h-72 sm:w-72"
    />
  );
}
