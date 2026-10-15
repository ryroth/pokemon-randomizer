/**
 * Forms that stay in the catalog but are never rolled.
 *
 * Costume Pikachu, weather Castform, and the mid-battle forms below are real
 * forms. Castform's weather forms follow Forecast. Darmanitan and Galarian
 * Darmanitan enter Zen Mode from the Zen Mode ability. Meloetta enters
 * Pirouette from Relic Song. Wishiwashi, Mimikyu, Cramorant, Eiscue, Morpeko,
 * and Palafin change during battle from Schooling, Disguise, Gulp Missile,
 * Ice Face, Hunger Switch, and Zero to Hero. Eternatus-Eternamax is not a
 * form a player selects. The base form is what gets generated, so a set that
 * has the triggering ability or move still represents the battle form.
 *
 * Vivillon's cosmetic patterns are omitted at import. Meadow is the base form.
 * Fancy and Poké Ball stay generatable. Any other Vivillon id is not.
 */
const NON_GENERATABLE_POKEMON_IDS = [
  "pikachucosplay",
  "pikachurockstar",
  "pikachubelle",
  "pikachupopstar",
  "pikachuphd",
  "pikachulibre",
  "pikachuoriginal",
  "pikachuhoenn",
  "pikachusinnoh",
  "pikachuunova",
  "pikachukalos",
  "pikachualola",
  "pikachupartner",
  "pikachuworld",
  "castformsunny",
  "castformrainy",
  "castformsnowy",
  "darmanitanzen",
  "darmanitangalarzen",
  "meloettapirouette",
  "wishiwashischool",
  "mimikyubusted",
  "cramorantgorging",
  "cramorantgulping",
  "eiscuenoice",
  "morpekohangry",
  "eternatuseternamax",
  "palafinhero",
] as const;

const GENERATABLE_VIVILLON_IDS = new Set(["vivillon", "vivillonfancy", "vivillonpokeball"]);

const nonGeneratableIds = new Set<string>(NON_GENERATABLE_POKEMON_IDS);

export const NON_GENERATABLE_POKEMON_ID_LIST: readonly string[] = NON_GENERATABLE_POKEMON_IDS;

export function isGeneratablePokemon(pokemon: { id: string }): boolean {
  if (pokemon.id.startsWith("vivillon") && !GENERATABLE_VIVILLON_IDS.has(pokemon.id)) {
    return false;
  }

  return !nonGeneratableIds.has(pokemon.id);
}
