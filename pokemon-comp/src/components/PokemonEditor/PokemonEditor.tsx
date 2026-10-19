import type { TeamPokemon } from "@/types/pokemon";
import { useState } from "react";
import SearchPicker from "../SearchPicker/SearchPicker";
import './PokemonEditor.css';

interface PokemonEditorProps {
    pokemon: TeamPokemon;
    onChange: (changes: Partial<TeamPokemon>) => void;
    itemOptions: string[];
}

const STAT_COLOR_CAP = 200;
function statColor(value: number){
    const statRange = Math.min(value / STAT_COLOR_CAP, 1);
    const hue = statRange * 190;
    const lightness = 30 + Math.min(statRange * 3, 1) * 20;
    return `hsl(${hue}, 80%, ${lightness}%)`;
}

export default function PokemonEditor( { pokemon, onChange, itemOptions }: PokemonEditorProps){
    const MAX_STAT = 200; //not actual max stat, just so that bar always caps at 200
    const [editingMove, setEditingMove] = useState<number | null>(null); //which move slot is being searched
    const [editingItem, setEditingItem] = useState(false);

    //copy the moves, swap in the new one, and tell TeamViewer
    function pickMove(i: number, name: string){
        const newMoves = [...pokemon.moves];
        newMoves[i] = name;
        onChange({ moves: newMoves });
        setEditingMove(null);
    }

    function pickItem(name: string){
        onChange({ item: name });
        setEditingItem(false);
    }

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
                    <div key={i} className="move_slot" onClick={() => { setEditingMove(i); setEditingItem(false); }}>
                        {move ? move.replace(/-/g, ' ') : `Move ${i + 1}`}
                    </div>
                ))}

                {editingMove !== null && (
                    <SearchPicker
                        options={(pokemon.availableMoves ?? []).filter(m => !pokemon.moves.includes(m))}
                        placeholder={`Search moves for ${pokemon.name}...`}
                        onPick={name => pickMove(editingMove, name)}
                        onCancel={() => setEditingMove(null)}
                    />
                )}

                <div className="item_slot" onClick={() => {setEditingItem(true); setEditingMove(null);}}>
                    {pokemon.item ? pokemon.item.replace(/-/g, ' ') : 'Item'}
                </div>

                {editingItem && (
                    <SearchPicker
                        options={itemOptions}
                        placeholder="Search Items..."
                        onPick={pickItem}
                        onCancel={() => setEditingItem(false)}
                    />
                )}

            </div>
        </div>
    );
}