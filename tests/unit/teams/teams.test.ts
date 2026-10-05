import { describe, expect, it } from "vitest";
import type { RecapCatalog } from "@/lib/recap/entries";
import { teamShowdownText } from "@/lib/teams/export";
import { parseStoredTeams } from "@/lib/teams/storage";
import {
  clearTeam,
  createEmptyTeamBox,
  removeSetFromTeam,
  moveSetToSlot,
  saveSetToNewTeam,
  saveSetToNextSlot,
  slotIndexAfterMove,
  TEAM_SIZE,
  type TeamBox,
} from "@/lib/teams/teams";
import type { PokemonSet } from "@/lib/types/session";

const swampert: PokemonSet = {
  pokemonId: "swampert",
  itemId: "leftovers",
  abilityId: "damp",
  moveIds: ["stealthrock", "flipturn", "earthquake", "knockoff"],
  evs: { hp: 252, atk: 252, def: 0, spa: 0, spd: 4, spe: 0 },
  ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
  natureId: "adamant",
  teraType: "water",
  gender: null,
  level: 100,
  shiny: false,
  happiness: 255,
  nickname: "Mud",
};

const marshtomp: PokemonSet = { ...swampert, pokemonId: "marshtomp", nickname: "Puddle" };

const catalog: RecapCatalog = {
  pokemon: [
    {
      id: "swampert",
      speciesId: "swampert",
      nationalDexNumber: 260,
      form: "base",
      displayName: "Swampert",
      showdownName: "Swampert",
      types: ["water", "ground"],
      dexEntries: [{ text: "It can swim while towing a large ship." }],
      baseStats: { hp: 100, atk: 110, def: 90, spa: 85, spd: 90, spe: 60 },
      sprites: { sprite: null, spriteShiny: null, artwork: null },
    },
    {
      id: "marshtomp",
      speciesId: "marshtomp",
      nationalDexNumber: 259,
      form: "base",
      displayName: "Marshtomp",
      showdownName: "Marshtomp",
      types: ["water", "ground"],
      dexEntries: [],
      baseStats: { hp: 70, atk: 85, def: 70, spa: 60, spd: 70, spe: 50 },
      sprites: { sprite: null, spriteShiny: null, artwork: null },
    },
  ],
  abilities: [{ id: "damp", showdownName: "Damp", description: "Prevents explosive moves." }],
  moves: [
    { id: "stealthrock", showdownName: "Stealth Rock", type: "rock", category: "status", power: null, accuracy: null, pp: 20, description: "" },
    { id: "flipturn", showdownName: "Flip Turn", type: "water", category: "physical", power: 60, accuracy: 100, pp: 20, description: "" },
    { id: "earthquake", showdownName: "Earthquake", type: "ground", category: "physical", power: 100, accuracy: 100, pp: 10, description: "" },
    { id: "knockoff", showdownName: "Knock Off", type: "dark", category: "physical", power: 65, accuracy: 100, pp: 20, description: "" },
  ],
  items: [{ id: "leftovers", showdownName: "Leftovers", description: "Restores HP." }],
  natures: [{ id: "adamant", showdownName: "Adamant", plusStat: "atk", minusStat: "spa" }],
};

describe("saved teams", () => {
  it("keeps an earlier team when the next Pokémon starts a new one", () => {
    const first = saveSetToNewTeam(createEmptyTeamBox(), swampert);
    expect(first.ok).toBe(true);
    if (!first.ok) {
      return;
    }
    expect(first.slot).toBe(1);
    expect(first.teamName).toBe("Team 1");

    const second = saveSetToNewTeam(first.box, marshtomp);
    expect(second.ok).toBe(true);
    if (!second.ok) {
      return;
    }
    expect(second.box.teams).toHaveLength(2);
    expect(second.box.teams[0]?.sets).toHaveLength(1);
    expect(second.box.teams[0]?.sets[0]?.nickname).toBe("Mud");
    expect(second.box.teams[1]?.sets[0]?.nickname).toBe("Puddle");
    expect(second.box.activeTeamId).toBe(second.teamId);
    expect(first.box.teams[0]?.sets).toHaveLength(1);
  });

  it("fills the next slot of the active team and stops at six", () => {
    const created = saveSetToNewTeam(createEmptyTeamBox(), swampert);
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }

    let box: TeamBox = created.box;
    for (let slot = 2; slot <= TEAM_SIZE; slot += 1) {
      const saved = saveSetToNextSlot(box, { ...marshtomp, nickname: `Slot ${slot}` });
      expect(saved.ok).toBe(true);
      if (!saved.ok) {
        return;
      }
      expect(saved.slot).toBe(slot);
      box = saved.box;
    }

    expect(box.teams[0]?.sets).toHaveLength(TEAM_SIZE);
    const full = saveSetToNextSlot(box, swampert);
    expect(full).toEqual({
      ok: false,
      message: "Team 1 already has 6 Pokémon. Save this one to a new team.",
    });
    expect(box.teams[0]?.sets).toHaveLength(TEAM_SIZE);
    expect(saveSetToNextSlot(createEmptyTeamBox(), swampert)).toEqual({
      ok: false,
      message: "Save this Pokémon to a new team first.",
    });
  });

  it("exports every saved set and ignores a broken save", () => {
    const created = saveSetToNewTeam(createEmptyTeamBox(), swampert);
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }
    const added = saveSetToNextSlot(created.box, marshtomp);
    expect(added.ok).toBe(true);
    if (!added.ok) {
      return;
    }
    const exported = teamShowdownText(added.box.teams[0]?.sets ?? [], catalog);
    expect(exported.ok).toBe(true);
    if (!exported.ok) {
      return;
    }
    expect(exported.text).toContain("Mud (Swampert) @ Leftovers");
    expect(exported.text).toContain("Puddle (Marshtomp) @ Leftovers");
    expect(exported.text).toMatch(/Knock Off\n\nPuddle/);
    expect(parseStoredTeams(JSON.stringify(added.box)).teams[0]?.sets).toHaveLength(2);
    expect(parseStoredTeams("{")).toEqual(createEmptyTeamBox());
    expect(teamShowdownText([], catalog)).toEqual({ ok: false, message: "This team has no Pokémon to copy." });
  });

  it("removes one slot and keeps the other team intact", () => {
    const created = saveSetToNewTeam(createEmptyTeamBox(), swampert);
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }
    const duplicated = saveSetToNextSlot(created.box, swampert);
    expect(duplicated.ok).toBe(true);
    if (!duplicated.ok) {
      return;
    }
    const secondTeam = saveSetToNewTeam(duplicated.box, marshtomp);
    expect(secondTeam.ok).toBe(true);
    if (!secondTeam.ok) {
      return;
    }

    const removed = removeSetFromTeam(secondTeam.box, created.teamId, 1);
    expect(removed).toMatchObject({ ok: true, teamName: "Team 1", slot: 2 });
    if (!removed.ok) {
      return;
    }
    expect(removed.box.teams[0]?.sets).toEqual([expect.objectContaining({ nickname: "Mud" })]);
    expect(removed.box.teams[1]?.sets).toEqual([expect.objectContaining({ nickname: "Puddle" })]);
    expect(secondTeam.box.teams[0]?.sets).toHaveLength(2);
    expect(removeSetFromTeam(removed.box, created.teamId, 3)).toEqual({
      ok: false,
      message: "That slot is already empty.",
    });
  });

  it("moves a Pokémon into another slot and leaves the other team in place", () => {
    const created = saveSetToNewTeam(createEmptyTeamBox(), swampert);
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }
    const second = saveSetToNextSlot(created.box, marshtomp);
    expect(second.ok).toBe(true);
    if (!second.ok) {
      return;
    }
    const third = saveSetToNextSlot(second.box, { ...swampert, nickname: "Anchor" });
    expect(third.ok).toBe(true);
    if (!third.ok) {
      return;
    }
    const other = saveSetToNewTeam(third.box, { ...marshtomp, nickname: "Side" });
    expect(other.ok).toBe(true);
    if (!other.ok) {
      return;
    }

    const moved = moveSetToSlot(other.box, created.teamId, 0, 2);
    expect(moved).toMatchObject({ ok: true, teamName: "Team 1", fromSlot: 1, toSlot: 3 });
    if (!moved.ok) {
      return;
    }
    expect(moved.box.teams[0]?.sets.map((set) => set.nickname)).toEqual(["Puddle", "Anchor", "Mud"]);
    expect(moved.box.teams[1]?.sets.map((set) => set.nickname)).toEqual(["Side"]);
    expect(other.box.teams[0]?.sets.map((set) => set.nickname)).toEqual(["Mud", "Puddle", "Anchor"]);
    expect(slotIndexAfterMove(0, 0, 2)).toBe(2);
    expect(slotIndexAfterMove(2, 0, 2)).toBe(1);
    expect(slotIndexAfterMove(1, 2, 0)).toBe(2);
    expect(moveSetToSlot(moved.box, created.teamId, 0, 5)).toEqual({
      ok: false,
      message: "Choose a slot that already has a Pokémon.",
    });
  });

  it("clears one team and leaves the other team saved", () => {
    const created = saveSetToNewTeam(createEmptyTeamBox(), swampert);
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }
    const filled = saveSetToNextSlot(created.box, marshtomp);
    expect(filled.ok).toBe(true);
    if (!filled.ok) {
      return;
    }
    const other = saveSetToNewTeam(filled.box, { ...swampert, nickname: "Side" });
    expect(other.ok).toBe(true);
    if (!other.ok) {
      return;
    }

    const cleared = clearTeam(other.box, created.teamId);
    expect(cleared).toMatchObject({ ok: true, teamName: "Team 1" });
    if (!cleared.ok) {
      return;
    }
    expect(cleared.box.teams).toHaveLength(1);
    expect(cleared.box.teams[0]?.name).toBe("Team 2");
    expect(cleared.box.teams[0]?.sets.map((set) => set.nickname)).toEqual(["Side"]);
    expect(cleared.box.activeTeamId).toBe(other.teamId);
    expect(other.box.teams).toHaveLength(2);
    expect(clearTeam(cleared.box, created.teamId)).toEqual({
      ok: false,
      message: "That team is no longer saved.",
    });
  });
});
