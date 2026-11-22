import type { TeamPokemon, Stats } from "@/types/pokemon";
import { useState } from "react";
import SearchPicker from "../SearchPicker/SearchPicker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../animate-ui/components/radix/tabs";
import './PokemonEditor.css';

interface PokemonEditorProps {
    pokemon: TeamPokemon;
    onChange: (changes: Partial<TeamPokemon>) => void;
    itemOptions: string[];
}


type StatKey = keyof Stats;

const STAT_KEYS: StatKey[] = ['hp', 'atk', 'def', 'spatk', 'spdef', 'spe'];
const STAT_LABELS: Record<StatKey, string> = { hp: 'HP', atk: 'Atk', def: 'Def', spatk: 'SpA', spdef: 'SpD', spe: 'Spe' };

//all natures listed and which stats its raises and lowers in dropdown
const NATURES: { name: string; up: StatKey | null; down: StatKey | null }[] = [
    { name: 'lonely',  up: 'atk',   down: 'def' },
    { name: 'adamant', up: 'atk',   down: 'spatk' },
    { name: 'naughty', up: 'atk',   down: 'spdef' },
    { name: 'brave',   up: 'atk',   down: 'spe' },
    { name: 'bold',    up: 'def',   down: 'atk' },
    { name: 'impish',  up: 'def',   down: 'spatk' },
    { name: 'lax',     up: 'def',   down: 'spdef' },
    { name: 'relaxed', up: 'def',   down: 'spe' },
    { name: 'modest',  up: 'spatk', down: 'atk' },
    { name: 'mild',    up: 'spatk', down: 'def' },
    { name: 'rash',    up: 'spatk', down: 'spdef' },
    { name: 'quiet',   up: 'spatk', down: 'spe' },
    { name: 'calm',    up: 'spdef', down: 'atk' },
    { name: 'gentle',  up: 'spdef', down: 'def' },
    { name: 'careful', up: 'spdef', down: 'spatk' },
    { name: 'sassy',   up: 'spdef', down: 'spe' },
    { name: 'timid',   up: 'spe',   down: 'atk' },
    { name: 'hasty',   up: 'spe',   down: 'def' },
    { name: 'jolly',   up: 'spe',   down: 'spatk' },
    { name: 'naive',   up: 'spe',   down: 'spdef' },
    { name: 'hardy',   up: null,    down: null },
    { name: 'docile',  up: null,    down: null },
    { name: 'serious', up: null,    down: null },
    { name: 'bashful', up: null,    down: null },
    { name: 'quirky',  up: null,    down: null },
];

const NATURE_GROUPS: (StatKey | null)[] = ['atk', 'def', 'spatk', 'spdef', 'spe', null];

//use pokemon stat formula : we assume 31 IVs
function calcStat(stat: StatKey, base: number, ev: number, level: number, natureName: string){
    if(stat === 'hp' && base === 1) return 1; //for shedinja who always has 1 hp
    const core = Math.floor((2 * base + 31 + Math.floor(ev / 4)) * level / 100);
    if(stat === 'hp') return core + level + 10;

    const nature = NATURES.find(n => n.name === natureName);
    const multiplier = nature?.up === stat ? 11 : nature?.down === stat ? 9 : 10;
    return Math.floor((core + 5) * multiplier / 10);
}

function calcStats(p: TeamPokemon): Stats {
    return {
        hp:    calcStat('hp',    p.baseStats.hp,    p.evs.hp,    p.level, p.nature),
        atk:   calcStat('atk',   p.baseStats.atk,   p.evs.atk,   p.level, p.nature),
        def:   calcStat('def',   p.baseStats.def,   p.evs.def,   p.level, p.nature),
        spatk: calcStat('spatk', p.baseStats.spatk, p.evs.spatk, p.level, p.nature),
        spdef: calcStat('spdef', p.baseStats.spdef, p.evs.spdef, p.level, p.nature),
        spe:   calcStat('spe',   p.baseStats.spe,   p.evs.spe,   p.level, p.nature),
    };
}

//a full bar = what a base 200 stat reaches at this level with 0 evs and a neutral nature
//hp gets its own (bigger) cap automatically because calcStat uses the hp formula for it
function statCap(stat: StatKey, level: number){
    return calcStat(stat, 200, 0, level, 'serious');
}

function statColor(value: number, cap: number){
    const statRange = Math.min(value / cap, 1);
    const hue = statRange * 190;
    const lightness = 30 + Math.min(statRange * 3, 1) * 20;
    return `hsl(${hue}, 80%, ${lightness}%)`;
}

//keeps typed levels inside the 1-100 range as a whole number
function clampLevel(value: number){
    return Math.min(100, Math.max(1, Math.round(value)));
}

interface StatRowProps {
    label: string;
    base: number;
    real: number;
    cap: number;
    boost: 'up' | 'down' | null; 
}

//makes one row of the stat display
function StatRow({ label, base, real, cap, boost }: StatRowProps){
    const labelClass = boost ? `stat_label stat_label_${boost}` : `stat_label`;

    return (
        <div className="stat_row">
            <span className={labelClass}>{label}</span>
            <span className="stat_base">{base}</span>
            <div className="stat_bar">
                <div 
                    className="stat_bar_fill"
                    style={ {
                        width : `${Math.min(real / cap, 1) * 100}%`,
                        backgroundColor : statColor(real, cap)
                    } } 
                />
            </div>
            <span className="stat_value">{real}</span>
        </div>
    );
}


export default function PokemonEditor( { pokemon, onChange, itemOptions }: PokemonEditorProps){
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

    const realStats = calcStats(pokemon);
    const nature = NATURES.find(n => n.name === pokemon.nature);
    return(
        <div className="pokemon_editor">
            <div className="pokemon_editor_left">
                <img className="pokemon_editor_sprite" src={pokemon.spriteUrl} alt={pokemon.name} />
                <div className="pokemon_editor_stats">
                    {STAT_KEYS.map(stat => (
                        <StatRow 
                            key={stat}
                            label={STAT_LABELS[stat]}
                            base={pokemon.baseStats[stat]}
                            real={realStats[stat]}
                            cap={statCap(stat, pokemon.level)}
                            boost={nature?.up === stat ? 'up' : nature?.down === stat ? 'down' : null}
                        />
                    ))}
                </div>
            </div>

            <Tabs defaultValue="moves" className="pokemon_editor_tabs">
                <TabsList>
                    <TabsTrigger value="moves">Moves</TabsTrigger>
                    <TabsTrigger value="stats">Stats</TabsTrigger>
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

                <TabsContent value="stats">
                    <div className="pokemon_editor_details">
                        <label className="detail_row">
                            Nature
                            <select 
                                value={pokemon.nature}
                                onChange={e => onChange({ nature: e.target.value })}
                            >
                                {NATURE_GROUPS.map(up => (
                                    <optgroup key={up ?? 'neutral'} label={up ? `+${STAT_LABELS[up]}` : 'Neutral'}>
                                        {NATURES.filter(n => n.up === up).map(n => (
                                            <option key={n.name} value={n.name}>
                                                {n.name}{n.up && n.down ? ` (+${STAT_LABELS[n.up]} / −${STAT_LABELS[n.down]})` : ''}
                                            </option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                        </label>
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