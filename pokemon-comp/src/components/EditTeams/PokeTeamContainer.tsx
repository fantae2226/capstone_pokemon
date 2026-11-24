import pokeball from '../../assets/Pokeball.png';
import { useState } from 'react';
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
    const filled = slots.filter(Boolean).length;
    const [confirming, setConfirming] = useState(false);

    return(
        <div className='team_container pc-cut'>
            <div className="team_container_header">
                <div className="team_container_name pc-paper">
                    <div className="team_container_title">{title}</div>
                    <div className="team_container_date">Edited {last_modified.toLocaleDateString()}</div>
                </div>
                <span className="team_container_count pc-mono">{filled}/6</span>
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

            {confirming ? (
                <div className="team_container_confirm">
                    <span>Delete {title}? This can't be undone.</span>
                    <span className="team_container_confirm_btns">
                        <button className="keep_btn" onClick={() => setConfirming(false)}>Keep</button>
                        <button className="confirm_delete_btn" onClick={() => onDelete(id)}>Delete team</button>
                    </span>
                </div>
            ) : (
                <div className="team_container_actions">
                    <button className='edit_btn' onClick={() => navigate(`/team-viewer/${id}`)}>Edit</button>
                    <button className='delete_btn' onClick={() => setConfirming(true)}>Delete</button>
                </div>
            )}

        </div>
    )
}