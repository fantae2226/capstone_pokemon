import { useState } from "react";
import type { PokemonSummary } from "@/types/pokemon";
import './PokemonBrowser.css';

interface PokemonBrowserProps {
    pokemon: PokemonSummary[];
    onPick: (name: string) => void;
    onCancel: () => void;
}

type StatKey = keyof PokemonSummary['baseStats'];
const STAT_KEYS: StatKey[] = ['hp', 'atk', 'def', 'spatk', 'spdef', 'spe'];

type SortKey ='name' | StatKey;
interface Sort {
    key: SortKey;
    direction: 'asc' | 'desc';
}

export default function PokemonBrowser( { pokemon, onPick, onCancel } : PokemonBrowserProps){
    const ALL_TYPES = [
        'normal', 'fire', 'water', 'electric', 'grass', 'ice',
        'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
        'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'
    ];
    const MAX_TYPES = 2;


    const [query, setQuery] = useState('');
    const [sort, setSort] = useState<Sort | null>(null);

    const [types, setTypes] = useState<string[]>([]);
    const [showTypePicker, setShowTypePicker] = useState(false);

    const cleaned = query.trim().toLowerCase().replace(/\s+/g, '-');
    const rows = pokemon
        .filter(p => p.name.includes(cleaned))
        .filter(p => types.every(t => p.types.includes(t)));

    if(sort){
        const direction = sort.direction === 'asc' ? 1 : -1;
        rows.sort((a, b) =>
            sort.key === 'name'
                ? a.name.localeCompare(b.name) * direction
                : (a.baseStats[sort.key] - b.baseStats[sort.key]) * direction
        );
    }

    const arrow = (key: SortKey) => 
            (sort && sort.key === key ? (sort.direction === 'asc' ? '▲' : '▼') : '');

    function clickSort(key: SortKey){
        setSort(prev => 
            prev && prev.key === key
                ? {key, direction: prev.direction === 'asc' ? 'desc' : 'asc'}
                : {key, direction: 'asc'}
        );
    }

    function toggleType(t: string){
        setTypes(prev => {
            if(prev.includes(t)) return prev.filter(x => x !== t);
            if(prev.length >= MAX_TYPES) return prev;
            return [...prev, t];
        });
    }

    function resetFilters(){
        setSort(null);
        setTypes([]);
    }

    

    return (
        <div className="pokemon_browser">
            <button onClick={onCancel}>Cancel</button>
            <input 
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search for a pokemon..."
                autoFocus
            />
            <div className="filter_chips">
                {sort && (
                    <span className="chip">
                        {sort.key.toUpperCase()} {arrow(sort.key)}
                        <button onClick={() => setSort(null)}>X</button>
                    </span>
                )}
                {types.map(type => (
                    <span key={type} className="chip">
                        {type}
                        <button onClick={() => toggleType(type)}>X</button>
                    </span>
                ))}
                {(sort || types.length > 0) && <button onClick={resetFilters}>Reset Filters</button>}
            </div>

            {showTypePicker && (
                <div className="type_picker">
                    {ALL_TYPES.map(t => (
                        <button
                            key={t}
                            className={types.includes(t) ? 'type_btn type_btn_active' : 'type_btn'}
                            disabled={!types.includes(t) && types.length >= MAX_TYPES}
                            onClick={() => toggleType(t)}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            )}
            <div className="table_scroll">
                <table>
                    <thead>
                        <tr>
                            <th></th>
                            <th onClick={() => clickSort('name')}>Name {arrow('name')}</th>
                            <th onClick={() => setShowTypePicker(s => !s)}>Types</th>
                            {STAT_KEYS.map(k => (
                                <th key={k} onClick={() => clickSort(k)}>
                                    {k.toUpperCase()}
                                    {arrow(k)}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map(p => (
                            <tr key={p.id} onClick={() => onPick(p.name)}>
                                <td>
                                    <img 
                                        src={p.spriteUrl} 
                                        alt={p.name}
                                        loading="lazy"
                                        width={48}
                                        height={48} 
                                    />
                                </td>
                                <td>{p.name.replace(/-/g, ' ')}</td>
                                <td>{p.types.join(' / ')}</td>
                                {STAT_KEYS.map(k => <td key={k}>{p.baseStats[k]}</td>)}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}