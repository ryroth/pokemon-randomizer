"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MAX_ABILITY_COUNT, MIN_ABILITY_COUNT } from "@/lib/randomizer/defaults";
import type { RandomizerConfig } from "@/lib/types/randomizer";

interface AbilityConfigFormProps {
  config: RandomizerConfig;
  poolSize: number;
  beforePokemon: boolean;
  onChange: (config: RandomizerConfig) => void;
}

export function AbilityConfigForm({
  config,
  poolSize,
  beforePokemon,
  onChange,
}: AbilityConfigFormProps) {
  const needsMoreAbilities = beforePokemon && config.abilityCount < config.pokemonCount;

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium">Number of abilities</legend>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Decrease ability count"
          disabled={config.abilityCount <= MIN_ABILITY_COUNT}
          onClick={() =>
            onChange({
              ...config,
              abilityCount: Math.max(MIN_ABILITY_COUNT, config.abilityCount - 1),
            })
          }
        >
          <Minus />
        </Button>
        <input
          id="ability-count"
          type="number"
          inputMode="numeric"
          min={MIN_ABILITY_COUNT}
          max={MAX_ABILITY_COUNT}
          value={config.abilityCount}
          aria-label="Ability count"
          aria-describedby="ability-count-help"
          className="h-8 w-16 rounded-lg border border-input bg-background text-center text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          onChange={(event) => {
            const next = Number(event.target.value);
            onChange({ ...config, abilityCount: Number.isFinite(next) ? next : 0 });
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Increase ability count"
          disabled={config.abilityCount >= MAX_ABILITY_COUNT}
          onClick={() =>
            onChange({
              ...config,
              abilityCount: Math.min(MAX_ABILITY_COUNT, config.abilityCount + 1),
            })
          }
        >
          <Plus />
        </Button>
      </div>
      <p id="ability-count-help" className="text-sm text-muted-foreground">
        {beforePokemon
          ? `Generate ${MIN_ABILITY_COUNT}–${MAX_ABILITY_COUNT} unique abilities from every standard ability, default 3. After you generate Pokémon, you will apply each ability to a Pokémon you choose.`
          : `Generate ${MIN_ABILITY_COUNT}–${MAX_ABILITY_COUNT} unique abilities from every standard ability, default 3, then pick one for the Pokémon you will use in battle.`}
      </p>
      {needsMoreAbilities ? (
        <p role="status" className="text-sm text-muted-foreground">
          You are generating {config.pokemonCount} Pokémon. Extra leftover abilities can stay unused.
        </p>
      ) : null}
      <p aria-live="polite" className="text-sm">
        {poolSize} standard abilities are available.
      </p>
    </fieldset>
  );
}
