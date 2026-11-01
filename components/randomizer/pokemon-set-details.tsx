import { type ReactNode } from "react";
import { TypeBadge } from "@/components/recap/type-badge";
import { formatMoveAccuracy, formatMovePower } from "@/lib/data/moveDisplay";
import { MOVE_CATEGORY_LABELS, type Ability, type Item, type Move } from "@/lib/types/catalog-entities";

/**
 * Abilities, moves, and an item already on a Pokémon while another randomizer is open.
 * A chosen ability replaces the species list. That list is empty while abilities are being randomized. Descriptions are the catalog text.
 */
export function PokemonSetDetails({
  chosenAbility,
  speciesAbilities = [],
  moves = [],
  item,
  itemIsNone = false,
}: {
  chosenAbility?: Ability;
  speciesAbilities?: readonly Ability[];
  moves?: readonly Move[];
  item?: Item;
  itemIsNone?: boolean;
}) {
  const abilities = chosenAbility ? [chosenAbility] : speciesAbilities;
  const abilityHeading = chosenAbility ? "Ability" : "Current abilities";
  const filledMoves = moves.filter((move) => Boolean(move));
  if (abilities.length === 0 && filledMoves.length === 0 && !item && !itemIsNone) {
    return null;
  }

  return (
    <div className="space-y-4">
      {abilities.length > 0 ? (
        <section className="space-y-3" aria-label={abilityHeading}>
          <h3 className="text-sm font-medium">{abilityHeading}</h3>
          {abilities.map((ability) => (
            <PartSummary key={ability.id} name={ability.name} description={ability.description} />
          ))}
        </section>
      ) : null}
      {filledMoves.length > 0 ? (
        <section className="space-y-3" aria-label="Moves">
          <h3 className="text-sm font-medium">Moves</h3>
          {filledMoves.map((move) => (
            <PartSummary
              key={move.id}
              name={move.name}
              description={move.description}
              meta={
                <>
                  <TypeBadge type={move.type} />
                  <span className="rounded-full border border-border px-2 py-0.5 text-xs">
                    {MOVE_CATEGORY_LABELS[move.category]}
                  </span>
                  <span className="rounded-full border border-border px-2 py-0.5 text-xs">
                    {formatMovePower(move.power)}
                  </span>
                  <span className="rounded-full border border-border px-2 py-0.5 text-xs">
                    {formatMoveAccuracy(move.accuracy)}
                  </span>
                </>
              }
            />
          ))}
        </section>
      ) : null}
      {item ? (
        <section className="space-y-3" aria-label="Item">
          <h3 className="text-sm font-medium">Item</h3>
          <PartSummary name={item.name} description={item.description} />
        </section>
      ) : itemIsNone ? (
        <section className="space-y-1" aria-label="Item">
          <h3 className="text-sm font-medium">Item</h3>
          <p className="text-sm">None</p>
        </section>
      ) : null}
    </div>
  );
}

function PartSummary({
  name,
  description,
  meta,
}: {
  name: string;
  description: string;
  meta?: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium">{name}</p>
      {meta ? <p className="flex flex-wrap gap-1.5">{meta}</p> : null}
      {description ? <p className="text-sm leading-6 text-muted-foreground">{description}</p> : null}
    </div>
  );
}
