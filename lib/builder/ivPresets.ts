import { STAT_IDS, type StatSpread } from "@/lib/types/stats";

export type IvPresetId = "all-31" | "min-atk" | "min-atk-min-spe" | "min-spe";

export interface IvPreset {
  id: IvPresetId;
  /** The group heading in the dropdown. */
  group: string;
  label: string;
  ivs: StatSpread;
}

/**
 * The same spreads as the "IV spreads" menu in the Pokémon Showdown teambuilder. Hidden Power is
 * gone from current games, so only the four spreads that still matter are kept: all 31s, no
 * Attack IVs (special attackers and Foul Play), no Speed IVs (Trick Room), and both.
 */
export const IV_PRESETS: readonly IvPreset[] = [
  {
    id: "min-atk",
    group: "Minimum Attack",
    label: "31/0/31/31/31/31",
    ivs: { hp: 31, atk: 0, def: 31, spa: 31, spd: 31, spe: 31 },
  },
  {
    id: "min-atk-min-spe",
    group: "Minimum Attack and Speed",
    label: "31/0/31/31/31/0",
    ivs: { hp: 31, atk: 0, def: 31, spa: 31, spd: 31, spe: 0 },
  },
  {
    id: "all-31",
    group: "Maximum",
    label: "31/31/31/31/31/31",
    ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
  },
  {
    id: "min-spe",
    group: "Minimum Speed",
    label: "31/31/31/31/31/0",
    ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 0 },
  },
];

export function ivPresetById(id: string): IvPreset | undefined {
  return IV_PRESETS.find((preset) => preset.id === id);
}

/** The preset that matches these IVs exactly, or undefined for a custom spread. */
export function matchingIvPreset(ivs: Partial<StatSpread> | undefined): IvPreset | undefined {
  if (!ivs) {
    return undefined;
  }
  return IV_PRESETS.find((preset) => STAT_IDS.every((stat) => preset.ivs[stat] === ivs[stat]));
}
