import type { TeamPokemon } from "@/types/pokemon";
import { useState } from "react";
import SearchPicker from "../SearchPicker/SearchPicker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../animate-ui/components/radix/tabs";
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

//keeps typed levels inside the 1-100 range as a whole number
function clampLevel(value: number){
    return Math.min(100, Math.max(1, Math.round(value)));
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

            <Tabs defaultValue="moves" className="pokemon_editor_tabs">
                <TabsList>
                    <TabsTrigger value="moves">Moves</TabsTrigger>
                    <TabsTrigger value="details">Details</TabsTrigger>
                </TabsList>
            

                <TabsContent value="moves">
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
                </TabsContent>

                <TabsContent value="details">
                    <div className="pokemon_editor_details">
                        <label className="detail_row">
                            Level
                            <input 
                                type="number"
                                min={1}
                                max={100}
                                value={pokemon.level}
                                onChange={e => {
                                    if(e.target.value !== '') onChange({ level: clampLevel(Number(e.target.value)) });
                                }}
                            />
                        </label>

                        <label className="detail_row">
                            Gender
                            {pokemon.genderOptions.length === 0 ? (
                                <span>Genderless</span>
                            ) : (
                                <select 
                                    value={pokemon.gender ?? ''}
                                    disabled={pokemon.genderOptions.length === 1}
                                    onChange={e => onChange({ gender: e.target.value as 'male' | 'female'})}
                                >
                                    {pokemon.genderOptions.map(g => (
                                        <option key={g} value={g}>{g === 'male' ? '♂ Male' : '♀ Female'}</option>
                                    ))}
                                </select>
                            )}
                        </label>

                        <label className="detail_row">
                            Shiny
                            <input 
                                type="checkbox"
                                checked={pokemon.shiny}
                                onChange={e => onChange({ shiny: e.target.checked })}
                            />
                        </label>

                        <label className="detail_row">
                            Ability
                            <select 
                                value={pokemon.ability ?? ''}
                                onChange={e => onChange({ ability: e.target.value })}
                            >
                                {pokemon.availableAbilities.map((a, i) => (
                                    <option key={i} value={a.name}>
                                        {a.name.replace(/-/g, ' ')}{a.hidden ? ' (Hidden)' : ''}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>
                </TabsContent>
            </Tabs>
            
        </div>
    );
}