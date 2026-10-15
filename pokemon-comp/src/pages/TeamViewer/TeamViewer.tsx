import { HexagonBackground } from "@/components/animate-ui/components/backgrounds/hexagon"
import { useState } from "react"
import pokeball from '../../assets/Pokeball.png';
import type { TeamPokemon } from "@/types/pokemon";
import PokemonEditor from "@/components/PokemonEditor/PokemonEditor";
import './TeamViewer.css';

const TEAM_SIZE = 6;

const PLACEHOLDER_POKEMON: TeamPokemon = {
    id: '0',
    name: 'Placeholdermon',
    spriteUrl: pokeball,
    baseStats: {
        hp: 100,
        atk: 100,
        def: 100,
        spatk: 100,
        spdef: 100,
        spe: 100 
    },
    moves: [null, null, null, null]
};

export default function TeamViewer(){
    const [team, setTeam] = useState<(TeamPokemon | null)[]>(Array(TEAM_SIZE).fill(null));
    const [selected, setSelected] = useState<number | null>(null);

    function handleAdd(slot: number){
        setTeam(prev => prev.map( (p, i) => (i === slot ? PLACEHOLDER_POKEMON : p) ));
        setSelected(slot);
    };

    function handleDelete(slot: number){
        setTeam(prev => prev.map( (p, i) => (i === slot ? null : p) ));
        if (selected === slot){
            setSelected(null);
        }
    };

    const selectedPokemon = selected !== null ? team[selected] : null;


    return(
        <div className="relative min-h-screen">
            <HexagonBackground className='fixed inset-0'/>
            <div className="relative">
                <div className="team_viewer">
                    <div className="team_viewer_slots">
                        {team.map((p, i) => (
                            <div
                                key={i}
                                className={`team_slot ${selected === i ? 'team_slot_selected' : ''}`}

                                // temporary guard, will be lifted later to lead to pokemon customizer
                                onClick={() => p && setSelected(i)}
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
                    {/* Pokemon Editor Data */}

                    { selectedPokemon && <PokemonEditor pokemon={selectedPokemon} /> }



                </div>
            </div>
        </div>
    )
}