import { HexagonBackground } from "@/components/animate-ui/components/backgrounds/hexagon"
import { useState } from "react"
import PokeTeamContainer from "@/components/EditTeams/PokeTeamContainer"
import type { PokemonImage, PokemonTeam } from "@/types/pokemon"





//page that holds all of a users teams
export default function BrowseTeams(){
    const [teams, setTeams] = useState<PokemonTeam[]>([
        { id: '1', title: 'Rain Team', last_modified: new Date(), pokemon: [] },
        { id: '2', title: 'Sun Team',  last_modified: new Date(), pokemon: [] },
    ]);
    const [numId, setNumId] = useState<string>('3'); //just for testing

    async function fetchPokemonImg(idOrName:number | string):Promise<PokemonImage>{
        
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${idOrName}`);
        if(!res.ok){
            throw new Error(`PokeAPI request failed: ${res.status}`);
        }

        const data = await res.json();
        return {
            id: data.id,
            name: data.name,
            spriteUrl: data.sprites.other.home.front_default
        }

    }

    //function to add team 
    async function addTeam(){
        try {
            const pokemon = await Promise.all(['crobat', 'espurr', 'pikachu', 'diglett', 7, 493].map(fetchPokemonImg))


            const newTeam: PokemonTeam = {
                id: numId,
                title: `New Team ${numId}`,
                last_modified: new Date(),
                pokemon
            };
            setTeams(prev => [...prev, newTeam]);
            setNumId(String(Number(numId) + 1));
            
        } catch (error) {
            console.error('Could not add team', error)
        }
    }

    //function to delete games
    function deleteTeam(id: string){
        setTeams(prev => prev.filter(team => team.id !== id));
    }

    //jsx will contain team container blocks using poketeam container
    return(
        <div className="relative min-h-screen">
            <HexagonBackground className="fixed inset-0" />
            <div className="relative">
                <button className="add_btn" onClick={addTeam}>
                    Add Team
                </button>
                <div className="teams_container">
                    {teams.map(team => (
                        <PokeTeamContainer
                            key={team.id}
                            id={team.id}
                            title={team.title}
                            last_modified={team.last_modified}
                            pokemon={team.pokemon}
                            onDelete={deleteTeam}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}