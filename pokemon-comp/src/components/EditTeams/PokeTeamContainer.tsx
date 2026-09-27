import pokeball from '../../assets/Pokeball.png';
import Edit from '../../assets/Edit.png';
import Delete from '../../assets/Delete.png'

import './PokeTeamContainer.css';

interface PokemonImage{
    id: string;
    name: string;
    spriteUrl: string;
}

interface PokeTeamContainerProps {
    title: string;
    last_modified: Date;
    pokemon?: PokemonImage[];
}

const TEAM_SIZE = 6;

export default function PokeTeamContainer({title, last_modified, pokemon = []} : PokeTeamContainerProps) {
    

    const slots = Array.from({length: TEAM_SIZE}, (_, i) => pokemon[i] ?? null);

    return(
        <div className='team_container'>
            <div className="team_container_header">
                <div className="team_container_title">{title}</div>
                <div className="team_container_date">{last_modified.toLocaleDateString()}</div>
                <button className='edit_btn'>
                    <img className='edit_icon' src={Edit} />
                </button>
                <button className='delete_btn'>
                    <img className='delete_icon' src={Delete} />
                </button>
            </div>
            <div className="team_container_sprites">
                {slots.map((pokemonSprite, i) => 
                    pokemonSprite ? (
                        <img key={pokemonSprite.id} 
                             src={pokemonSprite.spriteUrl}
                             alt={pokemonSprite.name}
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