export const STAT_IDS = ["hp", "atk", "def", "spa", "spd", "spe"] as const;

export type StatId = (typeof STAT_IDS)[number];

export const STAT_LABELS: Record<StatId, string> = {
  hp: "HP",
  atk: "Attack",
  def: "Defense",
  spa: "Special Attack",
  spd: "Special Defense",
  spe: "Speed",
};

export const SHOWDOWN_STAT_LABELS: Record<StatId, string> = {
  hp: "HP",
  atk: "Atk",
  def: "Def",
  spa: "SpA",
  spd: "SpD",
  spe: "Spe",
};

export interface StatSpread {
  hp: number;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
}

export const EMPTY_EVS: StatSpread = {
  hp: 0,
  atk: 0,
  def: 0,
  spa: 0,
  spd: 0,
  spe: 0,
};

export const PERFECT_IVS: StatSpread = {
  hp: 31,
  atk: 31,
  def: 31,
  spa: 31,
  spd: 31,
  spe: 31,
};
