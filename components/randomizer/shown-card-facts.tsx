"use client";

import {
  FilterDropdown,
  FilterToolbar,
  ToggleChip,
  toggleFilterValue,
} from "@/components/randomizer/filter-dropdown";
import { describeShownCardFacts } from "@/lib/randomizer/cardFacts";
import { CARD_FACTS, CARD_FACT_LABELS, type CardFact } from "@/lib/types/card-facts";
import type { RandomizerConfig } from "@/lib/types/randomizer";

export function ShownCardFacts({
  config,
  onChange,
}: {
  config: RandomizerConfig;
  onChange: (config: RandomizerConfig) => void;
}) {
  const facts = (config.shownCardFacts ?? CARD_FACTS).filter((fact) =>
    (CARD_FACTS as readonly string[]).includes(fact),
  );
  const setFacts = (shownCardFacts: CardFact[]) => {
    onChange({
      ...config,
      shownCardFacts,
      showPokedexEntry: shownCardFacts.includes("pokedexEntry"),
    });
  };

  return (
    <FilterDropdown
      label="Shown on cards"
      summary={describeShownCardFacts(facts)}
      description="Everything starts on, so a generated card looks the same as usual, including the name, the picture, and every base stat. Height and weight on that card use both metric and imperial. Turn pieces off for a guessing round. The name, the picture, and the form stay hidden until you select a Pokémon, and then every card opens to that usual card. Highest and lowest base stats are clues, and each shows that stat with its number. A Pokédex entry during the round uses one entry at random and says This Pokemon wherever the name was. Both typings shows every type, and a single-typed Pokémon has no secondary type. Body shape is the picture, without the shape's name."
    >
      <FilterToolbar
        legend="shown on cards"
        onSelectAll={() => setFacts([...CARD_FACTS])}
        onClear={() => setFacts([])}
      />
      <div className="flex flex-wrap gap-2">
        {CARD_FACTS.map((fact) => (
          <ToggleChip
            key={fact}
            label={CARD_FACT_LABELS[fact]}
            checked={facts.includes(fact)}
            onChange={() => setFacts(toggleFilterValue(facts, fact))}
          />
        ))}
      </div>
    </FilterDropdown>
  );
}
