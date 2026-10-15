import type { TeamPokemon } from "@/types/pokemon";
import './PokemonEditor.css';

interface PokemonEditorProps {
    pokemon: TeamPokemon;
}

export default function PokemonEditor( { pokemon }: PokemonEditorProps){
    const MAX_STAT = 255;
    return(
        <div className="pokemon_editor">
            <div className="pokemon_editor_left">
                <img className="pokemon_editor_sprite" src={pokemon.spriteUrl} alt={pokemon.name} />
                <div className="pokemon_editor_stats">
                    {Object.entries(pokemon.baseStats).map( ([stat, value]) => (
                        <div key={stat} className="stat_row">
                            <span className="stat_label">{stat.toUpperCase()}</span>
                            <div className="stat_bar">
                                <div 
                                    className="stat_bar_fill" 
                                    style={ {width : `${(value / MAX_STAT) * 100}%`} }
                                />
                            </div>
                            <span className="stat_value">{value}</span>
                        </div>
                    ) )}
                </div>
            </div>

            <div className="pokemon_editor_moves">
                {pokemon.moves.map( (move, i) => (
                    <div key={i} className="move_slot">{move ?? `Move ${i + 1}`}</div>
                ))}
            </div>
        </div>
    );
}