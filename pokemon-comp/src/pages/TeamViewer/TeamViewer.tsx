import { HexagonBackground } from "@/components/animate-ui/components/backgrounds/hexagon"
import { useState, useEffect } from "react"
import { useParams } from "react-router-dom";
import pokeball from '../../assets/Pokeball.png';
import type { TeamPokemon } from "@/types/pokemon";
import PokemonEditor from "@/components/PokemonEditor/PokemonEditor";
// import SearchPicker from "@/components/SearchPicker/SearchPicker";
import Modal from "@/components/Modal/Modal";
import PokemonBrowser from "@/components/PokemonBrowser/PokemonBrowser";
import type { PokemonSummary } from "@/types/pokemon";
import './TeamViewer.css';
import supabase from "@/lib/supabase";
import axios from "axios";

const TEAM_SIZE = 6;
const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

//function to read data from PokeAPI and shap it into a TeamPokemon
async function fetchPokemon(idOrName:number | string): Promise<TeamPokemon> {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${idOrName}`);
    if(!res.ok) throw new Error(`PokeAPI request failed: ${res.status}`);

    const data = await res.json();
    const stat = (name: string) => data.stats.find((s: any) => s.stat.name === name).base_stat;

    return {
        id: String(data.id), //note: this is species id for the pokemon, dont forget
        name: data.name,
        spriteUrl: data.sprites.other.home.front_default ?? pokeball,
        baseStats: {
            hp: stat('hp'),
            atk: stat('attack'),
            def: stat('defense'),
            spatk: stat('special-attack'),
            spdef: stat('special-defense'),
            spe: stat('speed')
        },
        moves: [null, null, null, null],
        item: null,
        availableMoves: data.moves.map((m: any) => m.move.name)
    };
}

const GRAPHQL_URL = 'https://graphql.pokeapi.co/v1beta2';
const SPRITE_URL = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home';

let pokemonTableCache: Promise<PokemonSummary[]> | null = null;

//finds one stat.s value in the rawGraphQL stat list, 0 if missing
function findStat(rawStats: any[], apiName: string): number {
    return rawStats.find(s => s.stat.name === apiName)?.base_stat ?? 0;
}

//turns one raw GraphQL pokemon into the shape the table uses
function toSummary(raw: any): PokemonSummary {
    return {
        id: String(raw.id),
        name: raw.name,
        spriteUrl: `${SPRITE_URL}/${raw.id}.png`,
        types: raw.pokemontypes.map((t: any) => t.type.name),
        baseStats: {
            hp: findStat(raw.pokemonstats, 'hp'),
            atk: findStat(raw.pokemonstats, 'attack'),
            def: findStat(raw.pokemonstats, 'defense'),
            spatk: findStat(raw.pokemonstats, 'special-attack'),
            spdef: findStat(raw.pokemonstats, 'special-defense'),
            spe: findStat(raw.pokemonstats, 'speed')
        }
    };
}

function fetchAllPokemon(): Promise<PokemonSummary[]> {
    if(!pokemonTableCache) {
        pokemonTableCache = (async () => {
            const res = await axios.post(GRAPHQL_URL, { query: `{
                    pokemon(order_by: {id: asc}) {
                        id
                        name
                        pokemontypes(order_by: {slot: asc}) { type { name } }
                        pokemonstats {base_stat stat { name } }
                    }
                }`});
            const json = res.data;
            if(json.errors) throw new Error(json.errors[0].message);
            return json.data.pokemon.map(toSummary);

        })().catch(error => { pokemonTableCache = null; throw error; });
    }
    return pokemonTableCache;
}

export default function TeamViewer(){
    const { teamId } = useParams<{ teamId: string}>();

    const [team, setTeam] = useState<(TeamPokemon | null)[]>(Array(TEAM_SIZE).fill(null));
    const [teamName, setTeamName] = useState('');
    const [selected, setSelected] = useState<number | null>(null);
    const [draft, setDraft] = useState<TeamPokemon | null>(null);

    const [pickingSlot, setPickingSlot] = useState<number|null>(null);
    // const [allPokemonNames, setAllPokemonNames] = useState<string[]>([]);
    const [allItemNames, setAllItemNames] = useState<string[]>([]);

    //new modal stuff
    const [allPokemon, setAllPokemon] = useState<PokemonSummary[]>([]);

    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState('');

    async function authHeader(){
        const {data:{session}} = await supabase.auth.getSession();
        return {Authorization: `Bearer ${session?.access_token}`};
    }

    useEffect(() => {
        async function loadTeam() {
            try {
                 const res = await axios.get(`${API}/teams/${teamId}`, {headers: await authHeader()});
                 setTeamName(res.data.name);

                 const loaded: (TeamPokemon | null)[] = Array(TEAM_SIZE).fill(null);
                 await Promise.all(res.data.team_pokemon.map(async (row: any) => {
                    const pokemon = await fetchPokemon(row.species_id);
                    loaded[row.slot] = {
                        ...pokemon,
                        item: row.item,
                        moves: [row.move1, row.move2, row.move3, row.move4]
                    };
                 }));
                 setTeam(loaded);

            } catch (error) {
                console.error('Could not load team', error)
            }
        }

        loadTeam();

    }, [teamId]);

    //download the name lists immediatly so we don't query the api at every keystroke
    useEffect(() => {
        async function loadNameLists(){
            try {
                const [passiveRes, activeRes] = await Promise.all([
                    fetch('https://pokeapi.co/api/v2/item-attribute/holdable-passive'),
                    fetch('https://pokeapi.co/api/v2/item-attribute/holdable-active')
                ]);
                const passiveData = await passiveRes.json();
                const activeData = await activeRes.json();
                
                const itemNames = [...passiveData.items, ...activeData.items].map((i:any) => i.name);
                setAllItemNames(Array.from(new Set(itemNames)));
            } catch (error) {
                console.error('Could not load PokeAPI name lists', error)
            }
        }
        loadNameLists();
    }, []);

    //grab all pokemon data from graphQL query
    useEffect(() => {
        fetchAllPokemon()
            .then(list => {
                console.log('loaded', list.length, list[0]);
                setAllPokemon(list);
            })
            .catch(error => console.error('Could not load pokemon table data', error));
    }, []);

    function openEditor(slot: number, pokemon: TeamPokemon){
        setDraft({ ...pokemon });
        setSelected(slot);
    }

    function closeEditor(){
        setSelected(null);
        setDraft(null);
    }

    function saveEditor(){
        if(selected === null || !draft) return;
        setTeam(prev => prev.map( (p, i) => (i === selected ? draft : p) ));
        closeEditor();
    }

    function handleAdd(slot: number){
        setPickingSlot(slot);
    };

    async function handlePickPokemon(name: string){
        const slot = pickingSlot;
        if(slot === null) return;

        try {
            const pokemon = await fetchPokemon(name);
            setTeam(prev => prev.map( (p, i) => (i === slot ? pokemon : p) ));
            openEditor(slot, pokemon);
            setPickingSlot(null);
        } catch (error) {
            console.error('Could not load pokemon', error)
        }
    }

    // //merges any user changes (moves, items) into the pokemon of 1 slot
    // function updatePokemon(slot: number, changes: Partial<TeamPokemon>){
    //     setTeam(prev => prev.map( (p, i) => (i === slot && p ? {...p, ...changes} : p) ));
    // }

    function handleDelete(slot: number){
        setTeam(prev => prev.map( (p, i) => (i === slot ? null : p) ));
        if (selected === slot){
            setSelected(null);
        }
    };

    //sends whole team (name + all filled slots) to backend in one request
    async function handleSave(){
        setSaving(true);
        setStatus('');
        try {
            const pokemon = team.flatMap((p, slot) =>
                p ? [{slot, species_id: Number(p.id), item: p.item ?? null, moves: p.moves }] : []
            );
            await axios.put(`${API}/teams/${teamId}`, {name: teamName, pokemon}, {headers: await authHeader()});
            setStatus('Saved');
        } catch (error) {
            console.error('Could not save team', error);
            setStatus('Save Failed');
        } finally {
            setSaving(false);
        }
    }

    // const selectedPokemon = selected !== null ? team[selected] : null;


    return(
        <div className="relative min-h-screen">
            <HexagonBackground className='fixed inset-0'/>
            <div className="relative">
                <div className="team_viewer">
                    <input 
                        type="text" 
                        className="team_name_input"
                        value={teamName}
                        onChange={e => setTeamName(e.target.value)}
                        placeholder="Team Name" 
                    />
                    <button className="save_btn" onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Team'}
                    </button>
                    {status && <span>{status}</span>}
                    <div className="team_viewer_slots">
                        {team.map((p, i) => (
                            <div
                                key={i}
                                className={`team_slot ${selected === i ? 'team_slot_selected' : ''}`}

                                // temporary guard, will be lifted later to lead to pokemon customizer
                                onClick={() => p && openEditor(i, p)}
                            >
                                <img src={p ? p.spriteUrl : pokeball} alt={p ? p.name : 'Empty team slot'} />

                                {p ? (
                                    <button onClick={e => {e.stopPropagation(); handleDelete(i);} }>
                                        Delete
                                    </button>
                                ) : (
                                    <button onClick={() => handleAdd(i)}>
                                        Add
                                    </button>
                                )}

                            </div>
                        ))}
                    </div>
                    {pickingSlot !== null && (
                        <Modal onClose={() => setPickingSlot(null)}>
                            <PokemonBrowser
                                pokemon={allPokemon}
                                onPick={handlePickPokemon}
                                onCancel={() => setPickingSlot(null)}
                            />
                        </Modal>
                    )}
                    {/* Pokemon Editor Data */}

                    { selected !== null && draft && (
                        <Modal onClose={closeEditor}>
                            <PokemonEditor
                                pokemon={draft}
                                onChange={changes => setDraft(prev => (prev ? {...prev, ...changes} : prev))}
                                itemOptions={allItemNames}
                            />
                            <button onClick={saveEditor}>Save</button>
                            <button onClick={closeEditor}>Cancel</button>
                        </Modal>
                    )}


                </div>
            </div>
        </div>
    )
}