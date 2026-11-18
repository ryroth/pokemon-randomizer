import { describe, expect, it } from "vitest";
import { openDraftInBuilder } from "@/lib/builder/saved-set";
import {
  abilityLockedByRandomizer,
  pendingRandomizerSteps,
} from "@/lib/builder/locks";
import { openBuilder } from "@/lib/builder/draft";
import { builderItemPool } from "@/lib/builder/pools";
import { builderAbilityPool } from "@/lib/randomizer/flow";
import { DEFAULT_RANDOMIZER_CONFIG } from "@/lib/randomizer/defaults";
import { createInitialSession, nextRollKeepingConfig } from "@/lib/randomizer/session";
import { parseStoredSession } from "@/lib/session/storage";
import {
  addDraftToRoster,
  draftedPokemonFromSession,
  importDraftsToRoster,
  removeDraftFromRoster,
  writeBuiltDraft,
} from "@/lib/teams/draftRoster";
import { allDraftRosters } from "@/lib/teams/teams";
import { parseStoredTeams } from "@/lib/teams/storage";
import { createEmptyTeamBox, saveSetToNewTeam } from "@/lib/teams/teams";
import type { PokemonForm } from "@/lib/types/pokemon";
import type { PokemonSet, RandomizerSession } from "@/lib/types/session";

const finished: PokemonSet = {
  pokemonId: "pikachu",
  itemId: null,
  abilityId: "static",
  moveIds: ["thunderbolt"],
  evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
  ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
  natureId: "hardy",
  teraType: "electric",
  gender: null,
  level: 50,
  shiny: false,
  happiness: 255,
};

const form = { id: "pikachu", abilityIds: ["static", "lightningrod"] } as PokemonForm;

function selected(pokemonId = "pikachu", patch: Partial<RandomizerSession> = {}): RandomizerSession {
  const session = createInitialSession();
  return {
    ...session,
    ...patch,
    config: patch.config ?? session.config,
    step: "results",
    selectedPokemonId: pokemonId,
    evolvedPokemonId: pokemonId,
    draft: {
      pokemonId,
      moveIds: [undefined, undefined, undefined, undefined],
      ...patch.draft,
    },
  };
}

describe("draft roster", () => {
  it("keeps the randomizer settings and stores the locks from this Pokémon", () => {
    const session = selected("pikachu", {
      config: { ...DEFAULT_RANDOMIZER_CONFIG, randomizeAbilities: true, shinyChance: 40 },
      draft: {
        pokemonId: "pikachu",
        abilityId: "static",
        shiny: true,
        moveIds: [undefined, undefined, undefined, undefined],
      },
    });
    const captured = draftedPokemonFromSession(session);
    expect(captured?.draft).toMatchObject({ pokemonId: "pikachu", abilityId: "static", shiny: true });
    expect(captured?.locks.ability).toBe(true);
    expect(captured?.locks.moveSlots).toEqual([false, false, false, false]);

    const added = addDraftToRoster(createEmptyTeamBox(), captured!);
    expect(added.ok).toBe(true);
    if (!added.ok) {
      return;
    }
    expect(added.slot).toBe(1);
    expect(added.full).toBe(false);
    expect(added.box.teams).toEqual([]);

    const next = nextRollKeepingConfig(session);
    expect(next.config.randomizeAbilities).toBe(true);
    expect(next.config.shinyChance).toBe(40);
    expect(next.selectedPokemonId).toBeUndefined();
    expect(next.draft.pokemonId).toBeUndefined();
  });

  it("refuses a Pokémon whose randomizer steps are not finished", () => {
    const session = selected("pikachu", {
      config: { ...DEFAULT_RANDOMIZER_CONFIG, randomizeAbilities: true },
    });
    expect(draftedPokemonFromSession(session)).toBeNull();
  });

  it("fills six slots, then the last finished set becomes a normal team", () => {
    let box = createEmptyTeamBox();
    for (let index = 0; index < 6; index += 1) {
      const captured = draftedPokemonFromSession(selected(index === 5 ? "sandshrew" : "pikachu"));
      const added = addDraftToRoster(box, captured!);
      expect(added.ok).toBe(true);
      if (!added.ok) {
        return;
      }
      box = added.box;
    }
    expect(allDraftRosters(box)[0]?.slots).toHaveLength(6);
    const extra = addDraftToRoster(box, draftedPokemonFromSession(selected("squirtle"))!);
    expect(extra.ok).toBe(true);
    if (!extra.ok) {
      return;
    }
    expect(extra.startedNew).toBe(true);
    expect(extra.teamName).not.toBe(allDraftRosters(box)[0]?.name);
    expect(allDraftRosters(extra.box)).toHaveLength(2);
    expect(allDraftRosters(extra.box)[0]?.slots).toHaveLength(6);
    expect(allDraftRosters(extra.box)[1]?.slots).toHaveLength(1);
    box = {
      activeTeamId: extra.box.activeTeamId,
      teams: extra.box.teams,
      draftRosters: [allDraftRosters(extra.box)[0]!],
      activeDraftRosterId: allDraftRosters(extra.box)[0]?.id ?? null,
    };

    const rosterId = allDraftRosters(box)[0]!.id;
    for (let index = 0; index < 5; index += 1) {
      const written = writeBuiltDraft(box, rosterId, index, { ...finished, pokemonId: "pikachu" });
      expect(written.ok && written.promoted).toBe(false);
      if (!written.ok) {
        return;
      }
      expect(written.nextIndex).toBe(index + 1);
      box = written.box;
    }
    expect(removeDraftFromRoster(box, rosterId, 5)).toMatchObject({
      ok: false,
      message: "This team is already being built.",
    });

    const last = writeBuiltDraft(box, rosterId, 5, { ...finished, pokemonId: "sandshrew" });
    expect(last.ok).toBe(true);
    if (!last.ok) {
      return;
    }
    expect(last.promoted).toBe(true);
    expect(allDraftRosters(last.box)).toHaveLength(0);
    expect(last.box.activeTeamId).toBe(rosterId);
    expect(last.box.teams[0]?.sets.map((set) => set.pokemonId)).toEqual([
      "pikachu",
      "pikachu",
      "pikachu",
      "pikachu",
      "pikachu",
      "sandshrew",
    ]);

    const edited = writeBuiltDraft(last.box, rosterId, 5, { ...finished, pokemonId: "sandshrew", nickname: "Sandy" });
    expect(edited.ok && edited.box.teams[0]?.sets[5]?.nickname).toBe("Sandy");
  });

  it("removes a draft and keeps a finished team beside the roster", () => {
    const saved = saveSetToNewTeam(createEmptyTeamBox(), finished, "Built");
    expect(saved.ok).toBe(true);
    if (!saved.ok) {
      return;
    }
    const first = addDraftToRoster(saved.box, draftedPokemonFromSession(selected("pikachu"))!);
    const second = first.ok ? addDraftToRoster(first.box, draftedPokemonFromSession(selected("sandshrew"))!) : first;
    expect(second.ok).toBe(true);
    if (!second.ok) {
      return;
    }
    const removed = second.ok ? removeDraftFromRoster(second.box, second.rosterId, 0) : second;
    expect(removed.ok).toBe(true);
    if (!removed.ok) {
      return;
    }
    const kept = allDraftRosters(removed.box)[0]?.slots[0];
    expect(allDraftRosters(removed.box)[0]?.slots).toHaveLength(1);
    expect(kept?.status).toBe("draft");
    if (kept?.status === "draft") {
      expect(kept.pokemon.draft.pokemonId).toBe("sandshrew");
    }
    expect(removed.box.teams).toHaveLength(1);

    const again = saveSetToNewTeam(removed.box, finished, "Another");
    expect(again.ok && allDraftRosters(again.box)[0]?.slots).toHaveLength(1);
  });

  it("opens a drafted Pokémon with the stored locks, not the current randomizer settings", () => {
    const session = selected("pikachu", {
      config: { ...DEFAULT_RANDOMIZER_CONFIG, randomizeAbilities: true, randomizeItems: true, randomizeMoves: true },
      abilityOptions: ["levitate"],
      itemOptions: ["oranberry"],
      draft: {
        pokemonId: "pikachu",
        abilityId: "static",
        itemId: "lightball",
        moveIds: ["thunderbolt", "quickattack", "irontail", "volttackle"],
      },
    });
    const captured = draftedPokemonFromSession(session);
    expect(captured?.locks).toMatchObject({
      ability: true,
      item: true,
      moveSlots: [true, true, true, true],
    });
    const added = addDraftToRoster(createEmptyTeamBox(), captured!);
    expect(added.ok).toBe(true);
    if (!added.ok || !captured) {
      return;
    }

    const opened = openDraftInBuilder(
      { ...session, config: { ...session.config, randomizeAbilities: false } },
      added.rosterId,
      captured,
      0,
    );
    expect(opened.editingTeamSlot).toBeUndefined();
    expect(opened.buildingDraft).toEqual({ rosterId: added.rosterId, index: 0 });
    expect(abilityLockedByRandomizer(opened)).toBe(true);
    expect(pendingRandomizerSteps(opened)).toEqual([]);
    expect(builderAbilityPool(form, opened)).toEqual(["static", "lightningrod"]);
    expect(builderItemPool(opened, [{ id: "sitrusberry" }])).toEqual([null, "lightball", "sitrusberry"]);
    expect(openBuilder(opened).buildingDraft).toBeUndefined();
  });

  it("drops a broken roster and keeps the finished teams", () => {
    const saved = saveSetToNewTeam(createEmptyTeamBox(), finished);
    expect(saved.ok).toBe(true);
    if (!saved.ok) {
      return;
    }
    const raw = {
      ...saved.box,
      draftRoster: { id: "draft", name: "Team 2", slots: [{ status: "mystery" }] },
    };
    const restored = parseStoredTeams(JSON.stringify(raw));
    expect(allDraftRosters(restored)).toHaveLength(0);
    expect(restored.teams[0]?.sets).toHaveLength(1);

    const captured = draftedPokemonFromSession(selected());
    const added = addDraftToRoster(saved.box, captured!);
    expect(added.ok).toBe(true);
    if (!added.ok) {
      return;
    }
    const roundTrip = parseStoredTeams(JSON.stringify(added.box));
    expect(allDraftRosters(roundTrip)[0]?.slots[0]?.status).toBe("draft");
    expect(roundTrip.teams).toHaveLength(1);

    const legacy = parseStoredTeams(JSON.stringify({ ...saved.box, draftRoster: added.box.draftRosters?.[0] }));
    expect(legacy.draftRoster?.name).toBe(added.teamName);
    expect(allDraftRosters(legacy)).toHaveLength(1);
  });

  it("builds a later slot before the first and keeps the earlier one unbuilt", () => {
    let box = createEmptyTeamBox();
    for (let index = 0; index < 6; index += 1) {
      const added = addDraftToRoster(box, draftedPokemonFromSession(selected(index === 2 ? "sandshrew" : "pikachu"))!);
      expect(added.ok).toBe(true);
      if (!added.ok) {
        return;
      }
      box = added.box;
    }
    const roster = allDraftRosters(box)[0]!;
    const written = writeBuiltDraft(box, roster.id, 2, { ...finished, pokemonId: "sandshrew" });
    expect(written.ok).toBe(true);
    if (!written.ok) {
      return;
    }
    expect(written.promoted).toBe(false);
    expect(written.nextIndex).toBe(0);
    const slots = allDraftRosters(written.box)[0]?.slots ?? [];
    expect(slots[0]?.status).toBe("draft");
    expect(slots[2]?.status).toBe("built");
  });

  it("imports an unbuilt Pokémon onto the open draft team", () => {
    const captured = draftedPokemonFromSession(selected("pikachu"))!;
    const added = addDraftToRoster(createEmptyTeamBox(), captured);
    expect(added.ok).toBe(true);
    if (!added.ok) {
      return;
    }
    const imported = importDraftsToRoster(
      added.box,
      [{ draft: { pokemonId: "squirtle", moveIds: [] }, locks: { ability: false, item: false, moveSlots: [] } }],
      "active",
    );
    expect(imported.ok).toBe(true);
    if (!imported.ok) {
      return;
    }
    expect(imported.teamName).toBe(added.teamName);
    expect(allDraftRosters(imported.box)[0]?.slots).toHaveLength(2);

    let full = imported.box;
    while ((allDraftRosters(full)[0]?.slots.length ?? 0) < 6) {
      const next = addDraftToRoster(full, captured);
      expect(next.ok).toBe(true);
      if (!next.ok) {
        return;
      }
      full = next.box;
    }
    const overflow = importDraftsToRoster(
      full,
      [{ draft: { pokemonId: "bulbasaur", moveIds: [] }, locks: { ability: false, item: false, moveSlots: [] } }],
      "active",
    );
    expect(overflow.ok).toBe(false);
    const created = importDraftsToRoster(
      full,
      [{ draft: { pokemonId: "bulbasaur", moveIds: [] }, locks: { ability: false, item: false, moveSlots: [] } }],
      "new",
    );
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }
    const importedSlot = allDraftRosters(created.box)[1]?.slots[0];
    expect(allDraftRosters(created.box)).toHaveLength(2);
    expect(importedSlot?.status).toBe("draft");
    if (importedSlot?.status === "draft") {
      expect(importedSlot.pokemon.draft.pokemonId).toBe("bulbasaur");
    }
  });

  it("drops a stored builder lock that is not a real draft slot", () => {
    const session = selected();
    const restored = parseStoredSession(JSON.stringify({ ...session, buildingDraft: { rosterId: 4 }, draftLocks: { ability: "yes" } }));
    expect(restored?.buildingDraft).toBeUndefined();
    expect(restored?.draftLocks).toBeUndefined();
    expect(restored?.selectedPokemonId).toBe("pikachu");
  });
});
