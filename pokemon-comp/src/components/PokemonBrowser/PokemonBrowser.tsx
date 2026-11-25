import { useState } from "react";
import type { PokemonSummary } from "@/types/pokemon";
import { typeIcon } from "@/types/pokemon";
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
        <div className="pokemon_browser pc-cut">
            <div className="browser_header">
                <h2 className="browser_title pc-pixel">CHOOSE POKÉMON</h2>
                <button className="pc-btn browser_cancel" onClick={onCancel}>Cancel</button>
            </div>

            <div className="browser_toolbar">
                <input 
                    className="browser_search"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search for a pokemon..."
                    autoFocus
                />
                <button
                    className="browser_filter_btn"
                    onClick={showFilterModal ? () => setShowFilterModal(false) : openFilterModal}
                    disabled={loadingMoves}
                    aria-expanded={showFilterModal}
                >
                    {showFilterModal ? 'Close Filters' : 'Add Filter'}
                </button>
                <span className="browser_count pc-mono">{rows.length} of {pokemon.length}</span>
            </div>

            <div className="filter_chips">
                {sort && (
                    <span className="chip pc-paper">
                        <span className="chip_label">SORT</span>
                        <span className="chip_value">{sort.key.toUpperCase()} {arrow(sort.key)}</span>
                        <button aria-label="Remove sort" onClick={() => setSort(null)}>×</button>
                    </span>
                )}
                {types.map(type => (
                    <span key={type} className="chip pc-paper">
                        <span className="chip_label">TYPE</span>
                        <span className="chip_value">{type}</span>
                        <button aria-label={`Remove ${type} filter`} onClick={() => toggleType(type)}>×</button>
                    </span>
                ))}
                {ability && (
                    <span className="chip pc-paper">
                        <span className="chip_label">ABILITY</span>
                        <span className="chip_value">{ability.replace(/-/g, ' ')}</span>
                        <button aria-label="Remove ability filter" onClick={removeAbility}>×</button>
                    </span>
                )}
                {moves.map(move => (
                    <span key={`move-${move}`} className="chip pc-paper">
                        <span className="chip_label">MOVE</span>
                        <span className="chip_value">{move.replace(/-/g, ' ')}</span>
                        <button aria-label={`Remove ${move} filter`} onClick={() => removeMove(move)}>×</button>
                    </span>
                ))}
                {loadingMoves && <span className="browser_loading">Loading moves...</span>}
                {(sort || types.length > 0 || ability || moves.length > 0) && <button className="reset_filters_btn" onClick={resetFilters}>Reset Filters</button>}
            </div>


            {showFilterModal && (
                <div className="filter_panel">
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

                        <div className="filter_chips">
                            {draft.ability && (
                                    <span className="chip pc-paper">
                                        <span className="chip_label">ABILITY</span>
                                        <span className="chip_value">{draft.ability.replace(/-/g, ' ')}</span>
                                        <button aria-label="Remove ability" onClick={() => setDraft(prev => ({ ...prev, ability: null }))}>×</button>
                                    </span>
                            )}
                            {draft.moves.map(m => (
                                        <span key={m} className="chip pc-paper">
                                            <span className="chip_label">MOVE</span>
                                            <span className="chip_value">{m.replace(/-/g, ' ')}</span>
                                            <button aria-label={`Remove ${m}`} onClick={() => removeDraftMove(m)}>×</button>
                                        </span>
                            ))}
                            {draft.types.map(t => (
                                <span key={`type-${t}`} className="chip pc-paper">
                                    <span className="chip_label">TYPE</span>
                                    <span className="chip_value">{t}</span>
                                    <button aria-label={`Remove ${t}`} onClick={() => toggleDraftType(t)}>×</button>
                                </span>
                            ))}
                        </div>

                        {section === null && (
                            <p className="filter_hint">Pick Ability, Moves, or Types to add a filter.</p>
                        )}

                        {section === 'ability' && (
                            <div className="filter_section">
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
                                        <img src={typeIcon(t)} alt={t} />
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="filter_actions">
                            <button className="pc-btn" onClick={() => setShowFilterModal(false)}>Cancel</button>
                            <button className="pc-btn pc-btn-primary" onClick={applyDraft}>Apply</button>
                        </div>

                    </div>
                </div>
            )}
            <div className="table_scroll">
                <table>
                    <thead>
                        <tr>
                            <th></th>
                            <th className={sort?.key === 'name' ? 'th_sorted' : ''} onClick={() => clickSort('name')}>Name {arrow('name')}</th>
                            <th>Types</th>
                            {STAT_KEYS.map(k => (
                                <th key={k} className={sort?.key === k ? 'th_sorted th_stat' : 'th_stat'} onClick={() => clickSort(k)}>
                                    {k.toUpperCase()}
                                    {arrow(k)}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map(p => (
                            <tr key={p.id} onClick={() => onPick(p.name)}>
                                <td className="row_sprite_cell">
                                    <span className="row_sprite">
                                        <img 
                                            src={p.spriteUrl} 
                                            alt={p.name}
                                            loading="lazy"
                                            width={56}
                                            height={56} 
                                        />
                                    </span>
                                </td>
                                <td className="row_name">{p.name.replace(/-/g, ' ')}</td>
                                <td className="row_types">
                                    {p.types.map(t => (
                                        <img key={t} className="type_icon" src={typeIcon(t)} alt={t} loading="lazy" />
                                    ))}
                                </td>
                                {STAT_KEYS.map(k => <td key={k} className={sort?.key === k ? 'row_stat row_stat_sorted' : 'row_stat'}>{p.baseStats[k]}</td>)}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}