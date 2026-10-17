import { HexagonBackground } from "@/components/animate-ui/components/backgrounds/hexagon"
import { useState } from "react"
import PokeTeamContainer from "@/components/EditTeams/PokeTeamContainer"
import type { PokemonTeam } from "@/types/pokemon"





//page that holds all of a users teams
export default function BrowseTeams(){
    const [teams, setTeams] = useState<PokemonTeam[]>([
        { id: '1', title: 'Rain Team', last_modified: new Date(), pokemon: [] },
        { id: '2', title: 'Sun Team',  last_modified: new Date(), pokemon: [] },
    ]);
    const [numId, setNumId] = useState<string>('3'); //just for testing



    //function to add team 
    function addTeam(){
        const newTeam: PokemonTeam = {
            id: numId,
            title: `New Team ${numId}`,
            last_modified: new Date(),
            pokemon: []
        };
        setTeams(prev => [...prev, newTeam]);
        setNumId(String(Number(numId) + 1));
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
                            title={team.title}
                            last_modified={team.last_modified}
                            pokemon={team.pokemon}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}