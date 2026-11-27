import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadGeneratedCatalog } from "../../lib/data/loadCatalog";

const ASSETS_API = "https://api.github.com/repos/pagefaultgames/pokerogue-assets/commits/beta";
const SPECIES_URL = "https://raw.githubusercontent.com/pagefaultgames/pokerogue/beta/src/enums/species-id.ts";

const TYPE_SUFFIXES = new Set([
  "bug",
  "dark",
  "dragon",
  "electric",
  "fairy",
  "fighting",
  "fire",
  "flying",
  "ghost",
  "grass",
  "ground",
  "ice",
  "normal",
  "poison",
  "psychic",
  "rock",
  "steel",
  "water",
]);

const PREFIX_EXTRAS = new Set(["mask", "tera", "masktera", "meteor", "plumage"]);

/** Showdown's base form, when PokéRogue only has a named file for it. First match wins. */
const BASE_FORMS = [
  "normal",
  "red-striped",
  "plant",
  "overcast",
  "spring",
  "incarnate",
  "red",
  "west",
  "altered",
  "ordinary",
  "apex-build",
  "three",
  "aria",
  "disguised",
  "ultimate-mode",
  "teal-mask",
  "zero",
  "counterfeit",
  "land",
  "green-plumage",
  "curly",
  "meadow",
  "neutral",
  "unremarkable",
  "a",
];

type ShinyKind = "sheet" | "palette" | "variant";

interface SpriteEntry {
  key: string;
  shiny: ShinyKind;
  femaleKey?: string;
  femaleShiny?: ShinyKind;
}

/**
 * Maps every catalog Pokémon to a PokéRogue sprite key.
 * Regional forms are their own species ids in PokéRogue (Alolan Raichu is 2026, not 26-alola).
 * Other forms use `{speciesId}-{formKey}` (`6-mega-x`). The variant masterlist says whether the
 * official shiny is a sheet, a `_1` file, or a palette.
 */
async function main() {
  const commit = await fetchJson<{ sha: string }>(ASSETS_API).then((body) => body.sha);
  const [speciesSource, master, tree] = await Promise.all([
    fetchText(SPECIES_URL),
    fetchJson<Record<string, unknown>>(
      `https://raw.githubusercontent.com/pagefaultgames/pokerogue-assets/${commit}/images/pokemon/variant/_masterlist.json`,
    ),
    fetchJson<{ tree: Array<{ path?: string }> }>(
      `https://api.github.com/repos/pagefaultgames/pokerogue-assets/git/trees/${commit}?recursive=1`,
    ),
  ]);

  const speciesIds = parseSpeciesIds(speciesSource);
  assertSpeciesIds(speciesIds);
  const sprites = new Set<string>();
  const females = new Set<string>();
  for (const entry of tree.tree) {
    const filePath = entry.path;
    if (!filePath?.startsWith("images/pokemon/") || !filePath.endsWith(".json")) {
      continue;
    }
    const relative = filePath.slice("images/pokemon/".length, -".json".length);
    if (relative.startsWith("female/")) {
      females.add(relative.slice("female/".length));
      continue;
    }
    if (relative.includes("/")) {
      continue;
    }
    sprites.add(relative);
  }
  const shinyFlags = new Map<string, number[]>();
  const femaleFlags = new Map<string, number[]>();
  for (const [key, value] of Object.entries(master)) {
    if (key === "female" && value && typeof value === "object" && !Array.isArray(value)) {
      for (const [femaleKey, flags] of Object.entries(value)) {
        if (Array.isArray(flags)) {
          femaleFlags.set(femaleKey, flags.map(Number));
          females.add(femaleKey);
        }
      }
      continue;
    }
    if (Array.isArray(value)) {
      shinyFlags.set(key, value.map(Number));
    }
  }

  const catalog = loadGeneratedCatalog();
  const speciesName = new Map(catalog.species.map((species) => [species.id, species.showdownName]));
  const pokemon: Record<string, SpriteEntry> = {};
  const missing: string[] = [];

  for (const form of catalog.pokemon) {
    const baseName = speciesName.get(form.speciesId);
    if (!baseName) {
      missing.push(`${form.id} (no species)`);
      continue;
    }
    const key = matchSpriteKey(form.showdownName, baseName, speciesIds, sprites);
    if (!key) {
      missing.push(`${form.showdownName} [${form.id}]`);
      continue;
    }
    const entry: SpriteEntry = { key, shiny: shinyKind(shinyFlags.get(key)) };
    if (females.has(key)) {
      entry.femaleKey = `female/${key}`;
      entry.femaleShiny = shinyKind(femaleFlags.get(key));
    }
    pokemon[form.id] = entry;
  }

  const ordered = Object.fromEntries(Object.entries(pokemon).sort(([left], [right]) => left.localeCompare(right)));
  const filePath = path.join(process.cwd(), "data", "generated", "pokerogue-sprites.json");
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify({ commit, pokemon: ordered }, null, 2)}\n`);

  console.log(`Wrote ${filePath}`);
  console.log(`  assets ${commit}`);
  console.log(`  ${Object.keys(ordered).length} of ${catalog.pokemon.length} Pokémon`);
  console.log(`  missing ${missing.length}`);
  for (const line of missing) {
    console.log(`  - ${line}`);
  }

  await assertReachable(commit, ordered.bulbasaur, "bulbasaur");
  await assertReachable(commit, ordered.charizardmegax, "charizardmegax");
  await assertReachable(commit, ordered.raichualola, "raichualola");
}

function matchSpriteKey(
  showdownName: string,
  speciesShowdownName: string,
  speciesIds: Map<string, number>,
  sprites: Set<string>,
): string | null {
  const speciesEnum = toEnumName(speciesShowdownName);
  const speciesId = speciesIds.get(speciesEnum);
  const remainder = showdownName.startsWith(`${speciesShowdownName}-`)
    ? showdownName.slice(speciesShowdownName.length + 1)
    : "";
  const attempts: Array<{ id: number; suffix: string }> = [];

  if (remainder.toLowerCase() === "white-striped") {
    const hisui = speciesIds.get("HISUI_BASCULIN");
    if (hisui !== undefined) {
      attempts.push({ id: hisui, suffix: "" });
    }
  }
  if (remainder) {
    const [head, ...rest] = remainder.split("-");
    const flipped = speciesIds.get(`${headToken(head)}_${speciesEnum}`);
    if (flipped !== undefined) {
      attempts.push({ id: flipped, suffix: rest.join("-") });
    }
  }
  if (speciesId !== undefined) {
    attempts.push({ id: speciesId, suffix: remainder });
  }

  for (const attempt of attempts) {
    const key = pickKey(attempt.id, attempt.suffix, sprites);
    if (key) {
      return key;
    }
  }
  // Caps, antiques, and other forms PokéRogue does not draw separately use the species sprite.
  if (speciesId !== undefined) {
    return pickKey(speciesId, "", sprites);
  }
  return null;
}

function pickKey(id: number, suffix: string, sprites: Set<string>): string | null {
  const plain = String(id);
  if (!suffix) {
    if (sprites.has(plain)) {
      return plain;
    }
    for (const form of BASE_FORMS) {
      const named = `${plain}-${form}`;
      if (sprites.has(named)) {
        return named;
      }
    }
    return null;
  }
  const wanted = suffixNorms(suffix);
  const owned = [...sprites.keys()].filter((key) => key === plain || key.startsWith(`${plain}-`));
  for (const want of wanted) {
    const exact = owned.find((key) => key !== plain && norm(key.slice(plain.length + 1)) === want);
    if (exact) {
      return exact;
    }
  }
  const prefixHits = owned.filter((key) => {
    if (key === plain) {
      return false;
    }
    const form = norm(key.slice(plain.length + 1));
    return wanted.some((want) => {
      if (want.length < 3 || !form.startsWith(want) || form === want) {
        return false;
      }
      return PREFIX_EXTRAS.has(form.slice(want.length));
    });
  });
  if (prefixHits.length > 0) {
    prefixHits.sort((left, right) => left.length - right.length);
    return prefixHits[0];
  }
  if (TYPE_SUFFIXES.has(suffix.toLowerCase()) && sprites.has(plain)) {
    return plain;
  }
  if (norm(suffix) === "combat" && sprites.has(plain)) {
    return plain;
  }
  return null;
}

function suffixNorms(suffix: string): string[] {
  const raw = suffix.toLowerCase();
  const norms = new Set<string>([norm(raw)]);
  if (raw === "f") {
    norms.add("female");
  }
  if (raw === "spiky-eared") {
    norms.add("spiky");
  }
  if (raw === "meteor") {
    norms.add("redmeteor");
  }
  if (raw === "low-key-gmax") {
    norms.add("gmax");
  }
  if (raw === "blue" || raw === "white" || raw === "yellow" || raw === "green") {
    norms.add(norm(`${raw}-plumage`));
  }
  if (raw === "m") {
    norms.add("male");
  }
  if (raw === "super") {
    norms.add("jumbo");
  }
  if (raw === "gmax") {
    norms.add(norm("gigantamax"));
    norms.add(norm("gigantamax-single"));
  }
  if (raw.endsWith("-gmax")) {
    const rest = raw.slice(0, -"-gmax".length);
    norms.add(norm(rest ? `gigantamax-${rest}` : "gigantamax"));
    if (rest === "rapid-strike") {
      norms.add(norm("gigantamax-rapid"));
    }
    if (rest === "single-strike") {
      norms.add(norm("gigantamax-single"));
    }
  }
  if (raw === "10%") {
    norms.add("10");
    norms.add("10pc");
  }
  if (raw === "50%") {
    norms.add("50");
    norms.add("50pc");
  }
  if (raw.endsWith("-tera")) {
    const base = raw.slice(0, -"-tera".length);
    norms.add(norm(`${base}-mask-tera`));
    norms.add(norm(`${base}-tera`));
  }
  for (const mask of ["teal", "wellspring", "hearthflame", "cornerstone"]) {
    if (raw === mask) {
      norms.add(norm(`${mask}-mask`));
    }
  }
  return [...norms];
}

function norm(value: string): string {
  return value
    .toLowerCase()
    .replace(/gigantamax/g, "gmax")
    .replace(/%/g, "percent")
    .replace(/[^a-z0-9]/g, "");
}

function headToken(head: string): string {
  const token = head.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (token === "ASH" || token === "BOND") {
    return "BATTLE_BOND";
  }
  return token;
}

function toEnumName(showdown: string): string {
  return showdown
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/♀/g, " F")
    .replace(/♂/g, " M")
    .replace(/['’‘ʼ′.:%]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
}

function shinyKind(flags: number[] | undefined): ShinyKind {
  const official = flags?.[0] ?? 0;
  if (official === 2) {
    return "variant";
  }
  if (official === 1) {
    return "palette";
  }
  return "sheet";
}

function parseSpeciesIds(source: string): Map<string, number> {
  const body = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  const enumBody = body.slice(start + 1, end);
  const ids = new Map<string, number>();
  let next = 0;
  for (const match of enumBody.matchAll(/\b([A-Z][A-Z0-9_]*)\s*(?:=\s*(\d+))?\s*,/g)) {
    if (match[2]) {
      next = Number(match[2]);
    }
    ids.set(match[1], next);
    next += 1;
  }
  return ids;
}

function assertSpeciesIds(ids: Map<string, number>) {
  const expected: Array<[string, number]> = [
    ["BULBASAUR", 1],
    ["CHARIZARD", 6],
    ["PIKACHU", 25],
    ["MEW", 151],
    ["PECHARUNT", 1025],
    ["ALOLA_RAICHU", 2026],
    ["BATTLE_BOND_GRENINJA", 2658],
    ["PALDEA_TAUROS", 8128],
    ["BLOODMOON_URSALUNA", 8901],
  ];
  for (const [name, id] of expected) {
    if (ids.get(name) !== id) {
      throw new Error(`SpeciesId.${name} resolved to ${ids.get(name)}, expected ${id}`);
    }
  }
}

async function assertReachable(commit: string, entry: SpriteEntry | undefined, label: string) {
  if (!entry) {
    throw new Error(`No sprite entry for ${label}`);
  }
  const url = `https://cdn.jsdelivr.net/gh/pagefaultgames/pokerogue-assets@${commit}/images/pokemon/${entry.key}.json`;
  const response = await fetch(url, { method: "GET" });
  if (!response.ok) {
    throw new Error(`${response.status} for ${label} at ${url}`);
  }
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${response.status} ${url}`);
  }
  return response.text();
}

async function fetchJson<T>(url: string): Promise<T> {
  return JSON.parse(await fetchText(url)) as T;
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
