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
  removeDraftFromRoster,
  writeBuiltDraft,
} from "@/lib/teams/draftRoster";
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
    expect(box.draftRoster?.slots).toHaveLength(6);
    const extra = addDraftToRoster(box, draftedPokemonFromSession(selected())!);
    expect(extra).toMatchObject({ ok: false });

    const rosterId = box.draftRoster!.id;
    for (let index = 0; index < 5; index += 1) {
      const written = writeBuiltDraft(box, rosterId, index, { ...finished, pokemonId: "pikachu" });
      expect(written.ok && written.promoted).toBe(false);
      if (!written.ok) {
        return;
      }
      expect(written.nextIndex).toBe(index + 1);
      box = written.box;
    }
    expect(removeDraftFromRoster(box, 5)).toMatchObject({
      ok: false,
      message: "This team is already being built.",
    });

    const last = writeBuiltDraft(box, rosterId, 5, { ...finished, pokemonId: "sandshrew" });
    expect(last.ok).toBe(true);
    if (!last.ok) {
      return;
    }
    expect(last.promoted).toBe(true);
    expect(last.box.draftRoster).toBeUndefined();
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
    const removed = removeDraftFromRoster(second.box, 0);
    expect(removed.ok).toBe(true);
    if (!removed.ok) {
      return;
    }
    expect(removed.box.draftRoster?.slots).toHaveLength(1);
    expect(removed.box.draftRoster?.slots[0]?.status === "draft" && removed.box.draftRoster.slots[0].pokemon.draft.pokemonId).toBe(
      "sandshrew",
    );
    expect(removed.box.teams).toHaveLength(1);

    const again = saveSetToNewTeam(removed.box, finished, "Another");
    expect(again.ok && again.box.draftRoster?.slots).toHaveLength(1);
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
    expect(restored.draftRoster).toBeUndefined();
    expect(restored.teams[0]?.sets).toHaveLength(1);

    const captured = draftedPokemonFromSession(selected());
    const added = addDraftToRoster(saved.box, captured!);
    expect(added.ok).toBe(true);
    if (!added.ok) {
      return;
    }
    const roundTrip = parseStoredTeams(JSON.stringify(added.box));
    expect(roundTrip.draftRoster?.slots[0]?.status).toBe("draft");
    expect(roundTrip.teams).toHaveLength(1);
  });

  it("drops a stored builder lock that is not a real draft slot", () => {
    const session = selected();
    const restored = parseStoredSession(JSON.stringify({ ...session, buildingDraft: { rosterId: 4 }, draftLocks: { ability: "yes" } }));
    expect(restored?.buildingDraft).toBeUndefined();
    expect(restored?.draftLocks).toBeUndefined();
    expect(restored?.selectedPokemonId).toBe("pikachu");
  });
});
