import modelIndexJson from "@/data/generated/pokemon-model-index.json";

export interface ModelFormRef {
  id: string;
  nationalDexNumber: number;
  /** Showdown forme label. `"base"` is the default forme, not a Mega whose species name contains "mega". */
  form: string;
}

export interface PokemonModelIndex {
  repository: string;
  commit: string;
  paths: readonly string[];
}

const NAMED_OTHER_FORMS: Record<string, string> = {
  basculinbluestriped: "multiform/BasculinBlueStripe.glb",
  enamorustherian: "multiform/EnamorusTherian.glb",
  lycanrocdusk: "multiform/LycanrocDuskForm.glb",
  lycanrocmidnight: "multiform/LycanrocMidnightForm.glb",
  rotomfan: "multiform/RotomFan.glb",
  rotomfrost: "multiform/RotomFrost.glb",
  rotomheat: "multiform/RotomHeat.glb",
  rotommow: "multiform/RotomMow.glb",
  shayminsky: "multiform/ShayminSky.glb",
  wishiwashischool: "multiform/WishiwashiSchool.glb",
};

const pathSets = new WeakMap<PokemonModelIndex, ReadonlySet<string>>();

export function loadPokemonModelIndex(): PokemonModelIndex {
  return modelIndexJson;
}

export function formatDexNumber(nationalDexNumber: number): string {
  return String(nationalDexNumber).padStart(4, "0");
}

/** Relative path inside `models/opt`, before checking that the file was snapshotted. */
export function pokemonModelRelativePath(form: ModelFormRef, shiny: boolean): string | null {
  const dex = form.nationalDexNumber;
  if (!Number.isInteger(dex) || dex <= 0) {
    return null;
  }

  if (form.form === "base") {
    return shiny ? `shiny/${dex}.glb` : `regular/${dex}.glb`;
  }
  if (form.form === "Alola") {
    return `alolan/${dex}.glb`;
  }
  if (form.form === "Galar") {
    return `galar/${dex}.glb`;
  }
  if (form.form === "Hisui") {
    return `hisuian/${dex}.glb`;
  }
  if (form.form === "Mega") {
    return shiny ? `megaShiny/${dex}.glb` : `mega/${dex}.glb`;
  }
  if (form.form === "Mega-X") {
    return shiny ? `sx/${dex}.glb` : `x/${dex}.glb`;
  }
  if (form.form === "Mega-Y") {
    return shiny ? `sy/${dex}.glb` : `y/${dex}.glb`;
  }
  if (form.form === "Gmax") {
    return `gmax/${dex}.glb`;
  }
  if (form.form === "Primal") {
    return `primal/${dex}.glb`;
  }
  if (form.form === "Origin") {
    return `origin/${dex}.glb`;
  }

  const named = NAMED_OTHER_FORMS[form.id];
  if (!named) {
    return null;
  }
  if (!shiny || !named.startsWith("multiform/")) {
    return named;
  }
  return `multiShinyForm/${named.slice("multiform/".length)}`;
}

export function pokemonIdleModelUrl(
  form: ModelFormRef,
  shiny: boolean,
  index: PokemonModelIndex = loadPokemonModelIndex(),
): string | null {
  const available = availablePaths(index);
  const relative = pokemonModelRelativePath(form, shiny);
  const regular = shiny ? pokemonModelRelativePath(form, false) : null;
  const chosen = [relative, regular].find((path) => path !== null && available.has(path));
  if (!chosen) {
    return null;
  }
  return `https://raw.githubusercontent.com/Pokemon-3D-api/assets/${index.commit}/models/opt/${chosen}`;
}

function availablePaths(index: PokemonModelIndex): ReadonlySet<string> {
  const existing = pathSets.get(index);
  if (existing) {
    return existing;
  }
  const paths = new Set(index.paths);
  pathSets.set(index, paths);
  return paths;
}
