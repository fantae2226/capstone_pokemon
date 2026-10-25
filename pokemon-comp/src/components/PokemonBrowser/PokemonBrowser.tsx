import type { PokemonSummary } from "@/types/pokemon";

interface PokemonBrowserProps {
    pokemon: PokemonSummary[];
    onPick: (name: string) => void;
    onCancel: () => void;
}

export default function PokemonBrowser( { pokemon, onPick, onCancel } : PokemonBrowserProps){
    return (
        <div className="pokemon_browser">
            <button onClick={onCancel}>Cancel</button>
            <p>{pokemon.length} pokemon loaded</p>
        </div>
    )
}