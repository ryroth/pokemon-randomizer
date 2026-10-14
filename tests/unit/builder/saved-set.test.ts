import { describe, expect, it } from "vitest";
import { abilityLockedByRandomizer, itemLockedByRandomizer, moveSlotLockedByRandomizer, pendingRandomizerSteps, savedSetEditAccess } from "@/lib/builder/locks";
import { openSavedSetInBuilder } from "@/lib/builder/saved-set";
import { builderItemPool } from "@/lib/builder/pools";
import { builderAbilityPool } from "@/lib/randomizer/flow";
import { createInitialSession } from "@/lib/randomizer/session";
import { DEFAULT_RANDOMIZER_CONFIG } from "@/lib/randomizer/defaults";
import type { PokemonForm } from "@/lib/types/pokemon";
import type { PokemonSet } from "@/lib/types/session";

const mud: PokemonSet = {
  pokemonId: "swampert",
  itemId: "leftovers",
  abilityId: "damp",
  moveIds: ["earthquake", "protect"],
  evs: { hp: 252, atk: 252, def: 0, spa: 0, spd: 4, spe: 0 },
  ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
  natureId: "adamant",
  teraType: "water",
  gender: "F",
  level: 50,
  shiny: true,
  happiness: 200,
  nickname: "Mud",
};

const form = {
  id: "swampert",
  abilityIds: ["torrent", "damp"],
} as PokemonForm;

describe("openSavedSetInBuilder", () => {
  it("loads the saved Pokémon into the builder and remembers the team slot", () => {
    const session = openSavedSetInBuilder(createInitialSession(), mud, "team-1", 0);
    expect(session.step).toBe("builder");
    expect(session.selectedPokemonId).toBe("swampert");
    expect(session.evolvedPokemonId).toBe("swampert");
    expect(session.draft.nickname).toBe("Mud");
    expect(session.draft.abilityId).toBe("damp");
    expect(session.draft.moveIds).toEqual(["earthquake", "protect", undefined, undefined]);
    expect(session.draft.shiny).toBe(true);
    expect(session.editingTeamSlot).toEqual({ teamId: "team-1", index: 0 });
    expect(savedSetEditAccess(mud)).toEqual({ ability: true, item: true, moves: [0, 1] });
  });

  it("keeps every part editable even when randomizers are on", () => {
    const session = openSavedSetInBuilder(
      createInitialSession({
        ...DEFAULT_RANDOMIZER_CONFIG,
        randomizeAbilities: true,
        randomizeMoves: true,
        randomizeItems: true,
      }),
      mud,
      "team-1",
      2,
    );
    session.abilityOptions = ["levitate"];
    session.itemOptions = ["oranberry"];
    expect(abilityLockedByRandomizer(session)).toBe(false);
    expect(itemLockedByRandomizer(session)).toBe(false);
    expect(moveSlotLockedByRandomizer(session, 0)).toBe(false);
    expect(pendingRandomizerSteps(session)).toEqual([]);
    expect(builderAbilityPool(form, session)).toEqual(["torrent", "damp"]);
    expect(builderItemPool(session, [{ id: "sitrusberry" }])).toEqual([null, "leftovers", "sitrusberry"]);
  });
});
