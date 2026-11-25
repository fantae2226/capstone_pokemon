//default pokemon or item image type
export interface PokemonImage{
    id: string;
    name: string;
    spriteUrl: string;
    fallbackUrl?: string;
}

export interface Stats {
    hp: number;
    atk: number;
    def: number;
    spatk: number;
    spdef: number;
    spe: number;
}

export type StatKey = keyof Stats; //'hp' | 'atk' | 'def' | 'spatk' | 'spdef' | 'spe'

//short display name for each stat
export const STAT_LABELS: Record<StatKey, string> = { hp: 'HP', atk: 'Atk', def: 'Def', spatk: 'SpA', spdef: 'SpD', spe: 'Spe' };

//team pokemon type
export interface TeamPokemon extends PokemonImage{
    baseStats: Stats;
    moves: (string | null)[]; //always has 4 entries, null for empty move slots
    item?: string | null; //held item (ex: leftovers), from PokeAPI
    availableMoves?: string[]; //pokemon's learnset, from PokeAPI

    nature: string;
    ability: string | null;
    availableAbilities: { name: string; hidden: boolean }[];
    gender: 'male' | 'female' | null;
    genderOptions: ('male' | 'female')[];
    shiny: boolean;
    level: number;
    evs: Stats;
    sprites: {
        default: string;
        shiny: string | null;
        female: string | null;
        shinyFemale: string | null;
    };
}

export interface PokemonTeam {
    id: string;
    title: string;
    last_modified: Date;
    pokemon: (PokemonImage | null)[];
}

export interface PokemonSummary extends PokemonImage{
    types: string[];
    baseStats: TeamPokemon['baseStats'];
    abilities: string[];
}

//details for the rich move / item / ability cards in the editor, read from PokeAPI
export interface MoveInfo {
    name: string;
    type: string;
    category: string; //physical, special or status
    power: number | null;
    accuracy: number | null;
    pp: number | null;
    description: string;
}

export interface ItemInfo {
    name: string;
    spriteUrl: string | null;
    description: string;
}

export interface AbilityInfo {
    name: string;
    description: string;
}

export type DetailKind = 'move' | 'item' | 'ability';

//every detail loaded so far, looked up by kind then name, ex: details.move['earthquake']
export interface DetailMaps {
    move: Record<string, MoveInfo>;
    item: Record<string, ItemInfo>;
    ability: Record<string, AbilityInfo>;
}

//Scarlet/Violet type labels from PokeAPI, looked up by PokeAPI's type id
const TYPE_ICON_URL = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-ix/scarlet-violet';
const TYPE_IDS: Record<string, number> = {
    normal: 1, fighting: 2, flying: 3, poison: 4, ground: 5, rock: 6,
    bug: 7, ghost: 8, steel: 9, fire: 10, water: 11, grass: 12,
    electric: 13, psychic: 14, ice: 15, dragon: 16, dark: 17, fairy: 18
};

export function typeIcon(type: string){
    return `${TYPE_ICON_URL}/${TYPE_IDS[type]}.png`;
}

//simplified Gen 9 type icon: just the coloured symbol, no name (60x60)
export function typeSmallIcon(type: string){
    return `${TYPE_ICON_URL}/small/${TYPE_IDS[type]}.png`;
}