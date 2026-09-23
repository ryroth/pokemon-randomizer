export interface NamedAPIResource {
  name: string;
  url: string;
}

export interface NameEntry {
  name: string;
  language: NamedAPIResource;
}

export interface VerboseEffect {
  effect?: string;
  short_effect?: string;
  language: NamedAPIResource;
}

export interface FlavorTextEntry {
  flavor_text?: string;
  text?: string;
  language: NamedAPIResource;
  version?: NamedAPIResource;
  version_group?: NamedAPIResource;
}

export interface PokeApiPokemon {
  id: number;
  name: string;
  is_default: boolean;
  species: NamedAPIResource;
  types: Array<{ slot: number; type: NamedAPIResource }>;
  abilities: Array<{ is_hidden: boolean; slot: number; ability: NamedAPIResource }>;
  stats: Array<{ base_stat: number; stat: NamedAPIResource }>;
  sprites: {
    front_default: string | null;
    front_shiny: string | null;
    other?: {
      "official-artwork"?: {
        front_default: string | null;
        front_shiny: string | null;
      };
    };
  };
}

export interface PokeApiSpecies {
  id: number;
  name: string;
  gender_rate: number;
  is_baby: boolean;
  is_legendary: boolean;
  is_mythical: boolean;
  generation: NamedAPIResource;
  evolution_chain: { url: string };
  names: NameEntry[];
  flavor_text_entries: FlavorTextEntry[];
}

export interface PokeApiChainLink {
  species: NamedAPIResource;
  evolves_to: PokeApiChainLink[];
}

export interface PokeApiEvolutionChain {
  id: number;
  chain: PokeApiChainLink;
}

export interface PokeApiAbility {
  id: number;
  name: string;
  names: NameEntry[];
  flavor_text_entries: FlavorTextEntry[];
  effect_entries: VerboseEffect[];
}

export interface PokeApiMove {
  id: number;
  name: string;
  names: NameEntry[];
  type: NamedAPIResource;
  damage_class: NamedAPIResource;
  power: number | null;
  accuracy: number | null;
  pp: number | null;
  flavor_text_entries: FlavorTextEntry[];
  effect_entries: VerboseEffect[];
}

export interface PokeApiItem {
  id: number;
  name: string;
  names: NameEntry[];
  flavor_text_entries: FlavorTextEntry[];
  effect_entries: VerboseEffect[];
  category: NamedAPIResource;
}

export interface PokeApiNature {
  id: number;
  name: string;
  names: NameEntry[];
  increased_stat: NamedAPIResource | null;
  decreased_stat: NamedAPIResource | null;
}

export interface ResourceList {
  count: number;
  results: NamedAPIResource[];
}

export interface PokeApiSnapshot {
  pokemonNames: string[];
  speciesNames: string[];
  abilityNames: string[];
  moveNames: string[];
  itemNames: string[];
  natureNames: string[];
  pokemonByName: Map<string, PokeApiPokemon>;
  speciesByName: Map<string, PokeApiSpecies>;
  abilitiesByName: Map<string, PokeApiAbility>;
  movesByName: Map<string, PokeApiMove>;
  itemsByName: Map<string, PokeApiItem>;
  naturesByName: Map<string, PokeApiNature>;
  evolutionChainsById: Map<number, PokeApiEvolutionChain>;
}
