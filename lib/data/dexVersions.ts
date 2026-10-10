/**
 * Mainline games that have English Pokédex text in PokéAPI, in release order, with the generation
 * each one belongs to. Spin-offs such as Let's Go and Legends: Arceus sit in the generation of the
 * console they ran on.
 */
export interface DexVersion {
  id: string;
  label: string;
  generation: number;
}

export const DEX_VERSIONS: readonly DexVersion[] = [
  { id: "red", label: "Red", generation: 1 },
  { id: "blue", label: "Blue", generation: 1 },
  { id: "yellow", label: "Yellow", generation: 1 },
  { id: "gold", label: "Gold", generation: 2 },
  { id: "silver", label: "Silver", generation: 2 },
  { id: "crystal", label: "Crystal", generation: 2 },
  { id: "ruby", label: "Ruby", generation: 3 },
  { id: "sapphire", label: "Sapphire", generation: 3 },
  { id: "emerald", label: "Emerald", generation: 3 },
  { id: "firered", label: "FireRed", generation: 3 },
  { id: "leafgreen", label: "LeafGreen", generation: 3 },
  { id: "diamond", label: "Diamond", generation: 4 },
  { id: "pearl", label: "Pearl", generation: 4 },
  { id: "platinum", label: "Platinum", generation: 4 },
  { id: "heartgold", label: "HeartGold", generation: 4 },
  { id: "soulsilver", label: "SoulSilver", generation: 4 },
  { id: "black", label: "Black", generation: 5 },
  { id: "white", label: "White", generation: 5 },
  { id: "black-2", label: "Black 2", generation: 5 },
  { id: "white-2", label: "White 2", generation: 5 },
  { id: "x", label: "X", generation: 6 },
  { id: "y", label: "Y", generation: 6 },
  { id: "omega-ruby", label: "Omega Ruby", generation: 6 },
  { id: "alpha-sapphire", label: "Alpha Sapphire", generation: 6 },
  { id: "sun", label: "Sun", generation: 7 },
  { id: "moon", label: "Moon", generation: 7 },
  { id: "ultra-sun", label: "Ultra Sun", generation: 7 },
  { id: "ultra-moon", label: "Ultra Moon", generation: 7 },
  { id: "lets-go-pikachu", label: "Let's Go, Pikachu!", generation: 7 },
  { id: "lets-go-eevee", label: "Let's Go, Eevee!", generation: 7 },
  { id: "sword", label: "Sword", generation: 8 },
  { id: "shield", label: "Shield", generation: 8 },
  { id: "brilliant-diamond", label: "Brilliant Diamond", generation: 8 },
  { id: "shining-pearl", label: "Shining Pearl", generation: 8 },
  { id: "legends-arceus", label: "Legends: Arceus", generation: 8 },
  { id: "scarlet", label: "Scarlet", generation: 9 },
  { id: "violet", label: "Violet", generation: 9 },
  { id: "legends-z-a", label: "Legends: Z-A", generation: 9 },
];

const byId = new Map(DEX_VERSIONS.map((version, index) => [version.id, { version, index }]));

export function dexVersion(id: string): DexVersion | undefined {
  return byId.get(id)?.version;
}

/** Position in release order. Unknown versions sort last. */
export function dexVersionOrder(id: string): number {
  return byId.get(id)?.index ?? Number.MAX_SAFE_INTEGER;
}

export function dexVersionLabel(id: string): string {
  return byId.get(id)?.version.label ?? id;
}

/**
 * One Pokédex text for one generation. Games in that generation that print the same words share
 * a group, such as Ruby and Sapphire.
 */
export interface DexEntryGroup {
  generation: number;
  versions: string[];
  text: string;
}

/** Compact stored form: [generation, versions, text]. */
export type StoredDexEntryGroup = readonly [number, readonly string[], string];

export function dexEntryGroupFromStored(stored: StoredDexEntryGroup): DexEntryGroup {
  return { generation: stored[0], versions: [...stored[1]], text: stored[2] };
}

export function formatDexVersions(versions: readonly string[]): string {
  return versions.map(dexVersionLabel).join(", ");
}
