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

/**
 * The shiny 3D model, only when a separate shiny file was published for this forme. It never
 * falls back to the regular model, because that would show regular colors for a shiny Pokémon.
 */
export function pokemonShinyModelUrl(
  form: ModelFormRef,
  index: PokemonModelIndex = loadPokemonModelIndex(),
): string | null {
  const shinyPath = pokemonModelRelativePath(form, true);
  if (shinyPath === null || shinyPath === pokemonModelRelativePath(form, false)) {
    return null;
  }
  return availablePaths(index).has(shinyPath) ? modelUrl(index, shinyPath) : null;
}

/**
 * How to show a Pokémon in 3D. The viewer always animates `src`, the regular model, because the
 * shiny files carry no idle clip. For a shiny Pokémon `shinySrc` is the shiny file whose
 * textures are painted on. Shiny with no shiny file has no plan, so the page uses the shiny
 * sprite or artwork instead of showing regular colors.
 */
export interface IdleModelPlan {
  src: string;
  shinySrc: string | null;
}

export function idleModelPlan(
  form: ModelFormRef,
  shiny: boolean,
  index: PokemonModelIndex = loadPokemonModelIndex(),
): IdleModelPlan | null {
  const src = pokemonIdleModelUrl(form, false, index);
  if (!src) {
    return null;
  }
  if (!shiny) {
    return { src, shinySrc: null };
  }
  const shinySrc = pokemonShinyModelUrl(form, index);
  return shinySrc ? { src, shinySrc } : null;
}

function modelUrl(index: PokemonModelIndex, relativePath: string): string {
  return `https://raw.githubusercontent.com/Pokemon-3D-api/assets/${index.commit}/models/opt/${relativePath}`;
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
