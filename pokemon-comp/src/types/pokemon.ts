

//default pokemon or item image type
export interface PokemonImage{
    id: string;
    name: string;
    spriteUrl: string;
}

export interface Stats {
    hp: number;
    atk: number;
    def: number;
    spatk: number;
    spdef: number;
    spe: number;
}

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
    pokemon: PokemonImage[];
}

export interface PokemonSummary extends PokemonImage{
    types: string[];
    baseStats: TeamPokemon['baseStats'];
    abilities: string[];
}