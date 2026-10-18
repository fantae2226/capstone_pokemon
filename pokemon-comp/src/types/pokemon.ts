

//default pokemon or item image type
export interface PokemonImage{
    id: string;
    name: string;
    spriteUrl: string;
}

//team pokemon type
export interface TeamPokemon extends PokemonImage{
    baseStats: {
        hp: number;
        atk: number;
        def: number;
        spatk: number;
        spdef: number;
        spe: number;
    };
    moves: (string | null)[]; //always has 4 entries, null for empty move slots
    item?: string | null; //held item (ex: leftovers), from PokeAPI
    availableMoves?: string[]; //pokemon's learnset, from PokeAPI
}

export interface PokemonTeam {
    id: string;
    title: string;
    last_modified: Date;
    pokemon: PokemonImage[];
}