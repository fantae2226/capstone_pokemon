import { HexagonBackground } from '../../components/animate-ui/components/backgrounds/hexagon';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import supabase from '@/lib/supabase';

import PokeTeamContainer from '../../components/EditTeams/PokeTeamContainer';

import User from '../../assets/User.png';
import Edit from '../../assets/Edit.png';

import './UserSettings.css'

export default function UserSettings(){
    const navigate = useNavigate();
    
    type Tab = "user_profile" | "pokemon_teams" | "import_team";

    const [tab, setTab] = useState<Tab>("user_profile");

    async function editUserProfile(e: React.FormEvent){
        e.preventDefault();
    }

    async function importTeam(e: React.FormEvent) {
        e.preventDefault();
    }

    return(
        <div className='relative min-h-screen'>
            <HexagonBackground className='fixed inset-0'/>
            <div className='relative'>
               <div className='user_settings_nav'>
                    <button className='return_btn'
                        onClick={() => navigate("/dashboard")}
                    >
                        ⇐
                    </button>
                    <button className='manage_userprofile'
                        onClick={() => setTab("user_profile")}
                    >
                        Manage User Profile
                    </button>
                    <button className='manage_teams'
                        onClick={() => setTab("pokemon_teams")}
                    >
                        Manage Pokemon Teams
                    </button>
                    <button className='import_teamdata'
                        onClick={() => setTab("import_team")}
                    >
                        Import New Team
                    </button>
                    <button className='logout_btn'
                            onClick={() => supabase.auth.signOut()}
                    >
                        Logout
                    </button>
               </div>

                <div className='settings_container'>
                    {tab === "user_profile" && 
                        <div className='account_info_container'> 
                            <div className='account_info_header'> 
                                <img className='user_icon' src={User} />
                                <p>Account Information</p>
                                <button className='edit_account_info_btn'>
                                    <img className='edit_icon' src={Edit} />
                                    <p>Edit</p>
                                </button>
                            </div>
                            <form className='user_info_form' onSubmit={editUserProfile}>

                                <label htmlFor='username' className='username_input_label'>Username: </label>
                                <input 
                                    type="text"
                                    id='username' 
                                    placeholder='Username' 
                                    className='username_input'
                                    value="Test_User_1"
                                />
                                
                                <label htmlFor='email' className='email_input_label'>Email: </label>
                                <input 
                                    type="text"
                                    id='email' 
                                    placeholder='Email' 
                                    className='email_input'
                                    value="fake_email@gmail.com"
                                />

                                <label htmlFor='password' className='password_input_label'>Password: </label>
                                <input 
                                    type="text"
                                    id='password' 
                                    placeholder='Password' 
                                    className='password_input'
                                    value="Random_pass"
                                />

                            </form>
                            
                        </div>
                    }

                    {tab === "pokemon_teams" && 
                        <div className="pokemon_teams_container">
                            <p>Last Edited Teams</p>
                            <div className="poke_team_container">A</div>
                            <div className="poke_team_container">B</div>
                            <div className="poke_team_container">C</div>
                            <PokeTeamContainer 
                                title='Trick Room'
                                last_modified={new Date("2026-09-16")} />
                        </div>
                    }
                    
                    {tab === "import_team" && 
                        <div className="import_teams_container">
                            <p>Insert your Team import code here</p>
                            <form className='import_form' onSubmit={importTeam}>
                                <label htmlFor='import' className='import_input_label'>Import Code: </label>
                                <input 
                                    type= "number"
                                    id='import' 
                                    placeholder='Import' 
                                    className='import_input'
                                    value="000928925"
                                />
                            </form>
                        </div>
                    }
                </div>

            </div>
        </div>
    )
}