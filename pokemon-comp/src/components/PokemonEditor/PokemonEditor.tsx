import type { TeamPokemon } from "@/types/pokemon";
import './PokemonEditor.css';

interface PokemonEditorProps {
    pokemon: TeamPokemon;
}

const STAT_COLOR_CAP = 200;
function statColor(value: number){
    const statRange = Math.min(value / STAT_COLOR_CAP, 1);
    const hue = statRange * 190;
    const lightness = 30 + Math.min(statRange * 3, 1) * 20;
    return `hsl(${hue}, 80%, ${lightness}%)`;
}

export default function PokemonEditor( { pokemon }: PokemonEditorProps){
    const MAX_STAT = 200; //not actual max stat, just so that bar always caps at 200
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
                                    style={ {
                                        width : `${Math.min(value / MAX_STAT, 1) * 100}%`,
                                        backgroundColor: statColor(value)
                                    } }
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