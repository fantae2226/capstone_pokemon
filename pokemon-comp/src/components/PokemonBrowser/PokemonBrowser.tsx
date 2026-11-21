import { useState } from "react";
import type { PokemonSummary } from "@/types/pokemon";
import Modal from "@/components/Modal/Modal";
import './PokemonBrowser.css';

interface PokemonBrowserProps {
    pokemon: PokemonSummary[];
    moveNames: string[];
    fetchMoveLearners: (moves: string[]) => Promise<Set<string>>;
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

//all filters that will be set when hitting Apply button
interface Filters {
    ability: string | null;
    moves: string[];
    types: string[];
}

type FilterSection = 'ability' | 'moves' | 'types';

export default function PokemonBrowser( { pokemon, moveNames ,fetchMoveLearners, onPick, onCancel } : PokemonBrowserProps){
    const ALL_TYPES = [
        'normal', 'fire', 'water', 'electric', 'grass', 'ice',
        'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
        'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'
    ];
    const MAX_TYPES = 2;
    const MAX_MOVES = 4;
    const MAX_SUGGESTIONS = 10;


    const [query, setQuery] = useState('');
    const [sort, setSort] = useState<Sort | null>(null);

    const [types, setTypes] = useState<string[]>([]);
    // const [showTypePicker, setShowTypePicker] = useState(false);

    const [ability, setAbility] = useState<string | null>(null);
    const [moves, setMoves] = useState<string[]>([]);
    const [moveLearners, setMoveLearners] = useState<Set<string> | null>(null);
    const [loadingMoves, setLoadingMoves] = useState(false);

    //filter modal stuff
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [draft, setDraft] = useState<Filters>({ ability: null, moves: [], types: []});
    const [section, setSection] = useState<FilterSection | null>(null);
    const [filterQuery, setFilterQuery] = useState('');

    const cleaned = query.trim().toLowerCase().replace(/\s+/g, '-');
    const rows = pokemon
        .filter(p => p.name.includes(cleaned))
        .filter(p => types.every(t => p.types.includes(t)))
        .filter(p => ability === null || p.abilities.includes(ability))
        .filter(p => moveLearners === null || moveLearners.has(p.id));

    if(sort){
        const direction = sort.direction === 'asc' ? 1 : -1;
        rows.sort((a, b) =>
            sort.key === 'name'
                ? a.name.localeCompare(b.name) * direction
                : (a.baseStats[sort.key] - b.baseStats[sort.key]) * direction
        );
    }

    //get every ability any pokemon has with no dupes
    const abilityNames = Array.from(new Set(pokemon.flatMap(p => p.abilities))).sort();
    
    //what user typed into the filter modal, it is cleaned like pokemon search is
    const filterSearch = filterQuery.trim().toLowerCase().replace(/\s+/g, '-');

    const abilitySuggestions = filterSearch === '' ? [] : abilityNames
        .filter(a => a.includes(filterSearch))
        .slice(0, MAX_SUGGESTIONS);
    
    const moveSuggestions = filterSearch === '' ? [] : moveNames
        .filter(m => m.includes(filterSearch) && !draft.moves.includes(m))
        .slice(0, MAX_SUGGESTIONS);

    async function applyFilters(next: Filters){
        
        //query graphQL if moves were changed
        const movesChanged = next.moves.length !== moves.length 
            || next.moves.some(m => !moves.includes(m));
        
        let learners = moveLearners;

        if(movesChanged){
            if(next.moves.length === 0){
                learners = null;
            } else{
                setLoadingMoves(true);

                try {
                    learners = await fetchMoveLearners(next.moves);
                } catch (error) {
                    console.error('Could not load move learners', error);
                    return;
                } finally {
                    setLoadingMoves(false);
                }
            }
        }

        setAbility(next.ability);
        setTypes(next.types);
        setMoves(next.moves);
        setMoveLearners(learners);
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

    
    function removeAbility(){
        applyFilters({ability: null, moves, types});
    }
    
    function removeMove(move: string){
        applyFilters({ability, moves: moves.filter(m=> m !== move), types});
    }
    
    function resetFilters(){
        setSort(null);
        setTypes([]);
        setAbility(null);
        setMoves([]);
        setMoveLearners(null);
    }

    function openFilterModal(){
        setDraft({ ability, moves, types });
        setSection(null);
        setFilterQuery('');
        setShowFilterModal(true);
    }

    function chooseSection(next: FilterSection){
        setSection(next);
        setFilterQuery('');
    }

    function pickAbility(name: string){
        setDraft(prev => ({...prev, ability: name }));
        setFilterQuery('');
    }

    function addMove(name: string){
        setDraft(prev => 
            prev.moves.length >= MAX_MOVES || prev.moves.includes(name)
                ? prev
                : { ...prev, moves: [...prev.moves, name] }
        );
        setFilterQuery('');
    }

    function removeDraftMove(name: string){
        setDraft(prev => ({ ...prev, moves: prev.moves.filter(m => m !==  name)}));
    }

    function toggleDraftType(t: string){
        setDraft(prev => {
            if(prev.types.includes(t)){
                return { ...prev, types: prev.types.filter(x => x !== t)};
            } 
            if(prev.types.length >= MAX_TYPES) return prev;
            return { ...prev, types: [...prev.types, t]}
        })
    }

    function applyDraft(){
        applyFilters(draft);
        setShowFilterModal(false);
    }

    return (
        <div className="pokemon_browser">
            <button onClick={onCancel}>Cancel</button>
            
            <button onClick={openFilterModal}>Add Filter</button>
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
                {ability && (
                    <span className="chip">
                        {ability.replace(/-/g, ' ')}
                        <button onClick={removeAbility}>X</button>
                    </span>
                )}
                {moves.map(move => (
                    <span key={`move-${move}`} className="chip">
                        {move.replace(/-/g, ' ')}
                        <button onClick={() => removeMove(move)}>X</button>
                    </span>
                ))}
                {loadingMoves && <span>Loading moves...</span>}
                {(sort || types.length > 0 || ability || moves.length > 0) && <button onClick={resetFilters}>Reset Filters</button>}
            </div>


            {showFilterModal && (
                <Modal onClose={() => setShowFilterModal(false)}>
                    <div className="filter_modal">
                        <div className="filter_sections">
                            <button
                                className={section === 'ability' ? 'type_btn_active' : ''}
                                onClick={() => chooseSection('ability')}
                            >
                                Ability
                            </button>
                            <button
                                className={section === 'moves' ? 'type_btn_active' : ''}
                                onClick={() => chooseSection('moves')}
                            >
                                Moves
                            </button>
                            <button
                                className={section === 'types' ? 'type_btn_active' : ''}
                                onClick={() => chooseSection('types')}
                            >
                                Types
                            </button>

                        </div>

                        {section === 'ability' && (
                            <div className="filter_section">
                                {draft.ability && (
                                    <span className="chip">
                                        {draft.ability.replace(/-/g, ' ')}
                                        <button onClick={() => setDraft(prev => ({ ...prev, ability: null }))}>X</button>
                                    </span>
                                )}
                                <input 
                                    value={filterQuery} 
                                    onChange={e => setFilterQuery(e.target.value)}
                                    placeholder="Search for an ability..."
                                    autoFocus
                                />
                                <ul className="suggestions">
                                    {abilitySuggestions.map(a => (
                                        <li key={a}>
                                            <button onClick={() => pickAbility(a)}>{a.replace(/-/g, ' ')}</button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {section === 'moves' && (
                            <div className="filter_section">
                                <div className="filter_chips">
                                    {draft.moves.map(m => (
                                        <span key={m} className="chip">
                                            {m.replace(/-/g, ' ')}
                                            <button onClick={() => removeDraftMove(m)}>X</button>
                                        </span>
                                    ))}
                                </div>
                                <input 
                                    value={filterQuery}
                                    onChange={e => setFilterQuery(e.target.value)}
                                    placeholder={draft.moves.length >= MAX_MOVES ? 'Max 4 moves selected' : 'Search for a move...'}
                                    disabled={draft.moves.length >= MAX_MOVES}
                                    autoFocus
                                />
                                <ul className="suggestions">
                                    {moveSuggestions.map(m => (
                                        <li key={m}>
                                            <button onClick={() => addMove(m)}>{m.replace(/-/g, ' ')}</button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {section === 'types' && (
                            <div className="type_picker">
                                {ALL_TYPES.map(t => (
                                    <button
                                        key={t}
                                        className={draft.types.includes(t) ? 'type_btn type_btn_active' : 'type_btn'}
                                        disabled={!draft.types.includes(t) && draft.types.length >= MAX_TYPES}
                                        onClick={() => toggleDraftType(t)}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="filter_actions">
                            <button onClick={() => setShowFilterModal(false)}>Cancel</button>
                            <button onClick={applyDraft}>Apply</button>
                        </div>

                    </div>
                </Modal>
            )}
            <div className="table_scroll">
                <table>
                    <thead>
                        <tr>
                            <th></th>
                            <th onClick={() => clickSort('name')}>Name {arrow('name')}</th>
                            <th>Types</th>
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