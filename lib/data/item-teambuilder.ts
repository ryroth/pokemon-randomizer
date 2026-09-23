import type { ItemCategory } from "@/lib/types/catalog-entities";

/**
 * Fields from a Showdown item that the current-gen singles teambuilder uses
 * when it buckets holdables into Popular / Items / Pokémon-specific /
 * Usually useless / Useless.
 */
export interface ItemTeambuilderHints {
  id: string;
  name: string;
  itemUser?: readonly string[] | null;
  megaStone?: unknown;
}

/**
 * Popular items on pokemonshowdown.com's default teambuilder (Gen 9 singles).
 * Doubles-only and Metronome-only popular items stay in Items.
 */
const POPULAR_ITEM_IDS = new Set([
  "choiceband",
  "choicespecs",
  "eviolite",
  "leftovers",
  "lifeorb",
  "choicescarf",
  "assaultvest",
  "focussash",
  "powerherb",
  "rockyhelmet",
  "airballoon",
  "loadeddice",
  "heavydutyboots",
  "expertbelt",
  "salacberry",
  "mentalherb",
]);

const POKEMON_SPECIFIC_ITEM_IDS = new Set([
  "adamantorb",
  "griseousorb",
  "lustrousorb",
  "blueorb",
  "redorb",
  "souldew",
  "leek",
  "stick",
  "thickclub",
  "lightball",
  "luckypunch",
  "quickpowder",
  "metalpowder",
  "deepseascale",
  "deepseatooth",
]);

const USUALLY_USELESS_ITEM_IDS = new Set([
  "aspearberry",
  "bindingband",
  "cheriberry",
  "destinyknot",
  "enigmaberry",
  "floatstone",
  "ironball",
  "jabocaberry",
  "oranberry",
  "machobrace",
  "pechaberry",
  "persimberry",
  "poweranklet",
  "powerband",
  "powerbelt",
  "powerbracer",
  "powerlens",
  "powerweight",
  "rawstberry",
  "ringtarget",
  "rowapberry",
  "bigroot",
  "focusband",
  "psncureberry",
  "przcureberry",
  "burntberry",
  "bitterberry",
  "iceberry",
  "berry",
]);

const USELESS_ITEM_IDS = new Set([
  "dragonscale",
  "mail",
  "rarebone",
  "belueberry",
  "blukberry",
  "cornnberry",
  "durinberry",
  "hondewberry",
  "magostberry",
  "nanabberry",
  "nomelberry",
  "pamtreberry",
  "pinapberry",
  "pomegberry",
  "qualotberry",
  "rabutaberry",
  "razzberry",
  "spelonberry",
  "tamatoberry",
  "watmelberry",
  "wepearberry",
  "energypowder",
  "electirizer",
  "oldamber",
  "dawnstone",
  "dubiousdisc",
  "duskstone",
  "firestone",
  "icestone",
  "leafstone",
  "magmarizer",
  "moonstone",
  "ovalstone",
  "prismscale",
  "protector",
  "reapercloth",
  "sachet",
  "shinystone",
  "sunstone",
  "thunderstone",
  "upgrade",
  "waterstone",
  "whippeddream",
  "bottlecap",
  "goldbottlecap",
  "galaricacuff",
  "chippedpot",
  "crackedpot",
  "galaricawreath",
  "auspiciousarmor",
  "maliciousarmor",
  "masterpieceteacup",
  "metalalloy",
  "unremarkableteacup",
  "bignugget",
]);

/**
 * Classify a holdable the way pokemonshowdown.com's default teambuilder does
 * (current generation, singles, not Metronome Battle).
 *
 * Showdown hides an extra Unreleased bucket (Mail, most Gems) in Gen 9. Those
 * rows still exist in this catalog, so they map to Useless Items.
 */
export function classifyShowdownItemTeambuilderCategory(
  item: ItemTeambuilderHints,
): ItemCategory {
  if (POPULAR_ITEM_IDS.has(item.id)) {
    return "popular";
  }
  if (POKEMON_SPECIFIC_ITEM_IDS.has(item.id)) {
    return "pokemon-specific";
  }
  if (USELESS_ITEM_IDS.has(item.id)) {
    return "useless";
  }
  if (USUALLY_USELESS_ITEM_IDS.has(item.id)) {
    return "usually-useless";
  }

  const name = item.name;
  if (
    name.endsWith(" Ball") ||
    name.endsWith(" Fossil") ||
    name.startsWith("Fossilized ") ||
    name.endsWith(" Sweet") ||
    name.endsWith(" Apple")
  ) {
    return "useless";
  }
  if (name.startsWith("TR")) {
    return "useless";
  }
  if (name.endsWith(" Gem") && name !== "Normal Gem") {
    return "useless";
  }
  if (name.endsWith(" Drive") || name.endsWith(" Memory") || name.startsWith("Rusted")) {
    return "pokemon-specific";
  }
  if ((item.itemUser && item.itemUser.length > 0) || Boolean(item.megaStone)) {
    return "pokemon-specific";
  }
  return "items";
}
