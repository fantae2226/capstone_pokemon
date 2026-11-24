import pokeball from '../../assets/Pokeball.png';
import Edit from '../../assets/Edit.png';
import Delete from '../../assets/Delete.png'
import { useNavigate } from 'react-router-dom';
import type { PokemonImage } from '@/types/pokemon';

import './PokeTeamContainer.css';


interface PokeTeamContainerProps {
    id: string;
    title: string;
    last_modified: Date;
    pokemon?: (PokemonImage | null)[];
    onDelete: (id: string) => void;
}

const TEAM_SIZE = 6;

export default function PokeTeamContainer({id, title, last_modified, pokemon = [], onDelete} : PokeTeamContainerProps) {
    
    const navigate = useNavigate();
    const slots = Array.from({length: TEAM_SIZE}, (_, i) => pokemon[i] ?? null);

    return(
        <div className='team_container'>
            <div className="team_container_header">
                <div className="team_container_title">{title}</div>
                <div className="team_container_date">{last_modified.toLocaleDateString()}</div>
                <button className='edit_btn'
                        onClick={() => navigate(`/team-viewer/${id}`)}
                >
                    <img className='edit_icon' src={Edit} />
                </button>
                <button className='delete_btn' onClick={() => onDelete(id)}>
                    <img className='delete_icon' src={Delete} />
                </button>
            </div>
            <div className="team_container_sprites">
                {slots.map((pokemonSprite, i) => 
                    pokemonSprite ? (
                        <img key={`slot-${i}`} 
                             src={pokemonSprite.spriteUrl}
                             alt={pokemonSprite.name}
                             onError={e => {
                                 //female sprite missing -> swap to the normal one (only once, so it can't loop)
                                 if(pokemonSprite.fallbackUrl && e.currentTarget.src !== pokemonSprite.fallbackUrl){
                                     e.currentTarget.src = pokemonSprite.fallbackUrl;
                                 }
                             }}
                        />
                    ) : (
                        <img key={`empty-${i}`} 
                             src={pokeball}
                             alt="Empty team slot"
                        />
                    )
                )}
            </div>
        </div>
    )
}