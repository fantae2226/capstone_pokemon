

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
}