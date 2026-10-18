import { HexagonBackground } from "@/components/animate-ui/components/backgrounds/hexagon"
import { useState, useEffect } from "react"
import axios from "axios"
import supabase from "@/lib/supabase"
import PokeTeamContainer from "@/components/EditTeams/PokeTeamContainer"
import type { PokemonImage, PokemonTeam } from "@/types/pokemon"




const API = 'http://localhost:8000';
//page that holds all of a users teams
export default function BrowseTeams(){
    // const [teams, setTeams] = useState<PokemonTeam[]>([
    //     { id: '1', title: 'Rain Team', last_modified: new Date(), pokemon: [] },
    //     { id: '2', title: 'Sun Team',  last_modified: new Date(), pokemon: [] },
    // ]);
    // const [numId, setNumId] = useState<string>('3'); //just for testing

    const [teams, setTeams] = useState<PokemonTeam[]>([]);

    //quick function to do session checking
    async function authHeader(){
        const {data:{session}} = await supabase.auth.getSession();
        return {Authorization: `Bearer ${session?.access_token}`};
    }

    function rowToTeam(row: any): PokemonTeam {
        return {
            id: row.id,
            title: row.name,
            last_modified: new Date(row.updated_at),
            pokemon: []
        };
    }

    //load the logged in user's teams when the page opens
    useEffect(() => {
        async function loadTeams() {
            try {
                const res = await axios.get(`${API}/teams`, {headers: await authHeader() });
                setTeams(res.data.map(rowToTeam));
            } catch (error) {
                console.error('Could not load teams', error);
            }
        }

        loadTeams();
    }, []);

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
            const res = await axios.post(`${API}/teams`, {}, {headers: await authHeader() });
            setTeams(prev => [...prev, rowToTeam(res.data)]);
            
        } catch (error) {
            console.error('Could not add team', error)
        }
    }

    //function to delete games
    async function deleteTeam(id: string){
        try {
            await axios.delete(`${API}/teams/${id}`, {headers: await authHeader()});
            setTeams(prev => prev.filter(team => team.id !== id));
        } catch (error) {
            console.error('Could not delete team', error)
        }
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