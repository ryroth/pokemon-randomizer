import Image from "next/image";
import type { PokedexShape } from "@/lib/types/taxonomy";

/** Pokémon HOME body shape icons, one for each official shape. */
const HOME_BODY_SHAPE_ICON: Record<PokedexShape, string> = {
  ball: "/body-shapes/ball.png",
  squiggle: "/body-shapes/squiggle.png",
  fish: "/body-shapes/fish.png",
  arms: "/body-shapes/arms.png",
  blob: "/body-shapes/blob.png",
  upright: "/body-shapes/upright.png",
  legs: "/body-shapes/legs.png",
  quadruped: "/body-shapes/quadruped.png",
  wings: "/body-shapes/wings.png",
  tentacles: "/body-shapes/tentacles.png",
  heads: "/body-shapes/heads.png",
  humanoid: "/body-shapes/humanoid.png",
  "bug-wings": "/body-shapes/bug-wings.png",
  armor: "/body-shapes/armor.png",
};

/**
 * The Pokémon HOME picture for an official body shape. The written name stays beside it.
 */
export function BodyShapeIcon({ shape }: { shape: PokedexShape }) {
  return (
    <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-white p-0.5 ring-1 ring-black/15">
      <Image
        src={HOME_BODY_SHAPE_ICON[shape]}
        alt=""
        width={128}
        height={128}
        className="size-full object-contain"
      />
    </span>
  );
}
