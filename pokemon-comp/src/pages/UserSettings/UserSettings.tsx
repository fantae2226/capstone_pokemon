import { HexagonBackground } from '../../components/animate-ui/components/backgrounds/hexagon';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import supabase from '@/lib/supabase';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';

import PokeTeamContainer from '../../components/EditTeams/PokeTeamContainer';

import User from '../../assets/User.png';
import Edit from '../../assets/Edit.png';

import './UserSettings.css'
import { validateEmail, validatePassword } from '@/lib/validation';

export default function UserSettings(){
    const navigate = useNavigate();
    const { user, session } = useAuth();
    const userId = user?.id;
    const userEmail = user?.email;

    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    
    const [form, setForm] = useState({username: "", email: ""});
    const [savedForm, setSavedForm] = useState({username: "", email: ""});

    
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    
    const [showSecurity, setShowSecurity] = useState(false);
    const [secError, setSecError] = useState<string | null>(null);
    const [secForm, setSecForm] = useState({
        newEmail: "",
        newPassword: "",
        confirmPassword: "",
        currentPassword: ""
    });

    type Tab = "user_profile" | "pokemon_teams" | "import_team";
    const [tab, setTab] = useState<Tab>("user_profile");


    useEffect(() => {
        if(!userId){
            setLoading(false);
            return;
        }
        async function loadUser() {
            const { data: row, error } = await supabase
                .from('users')
                .select('username')
                .eq('id', userId)
                .single();
            
                if(error) {
                    console.error(error)
                }

            const values = {
                username: row?.username ?? "",
                email: userEmail ?? ""
            };

            setForm(values);
            setSavedForm(values);
            setLoading(false);
        }

        loadUser();

    }, [userId, userEmail]);


    function handleUserFormChange(e: React.ChangeEvent<HTMLInputElement>){
        setForm({...form, [e.target.id]: e.target.value });
    }

    function handleSecFormChange(e: React.ChangeEvent<HTMLInputElement>){
        setSecForm({ ...secForm, [e.target.id]: e.target.value} );
    }
    
    async function editUserProfile(e: React.FormEvent){
        e.preventDefault();
        setError(null);
        setMessage(null);

        //if nothing changes, leave edit mode
        if(form.username === savedForm.username){
            setIsEditing(false);
            return;
        }

        try {
            // const {data: { session }} = await supabase.auth.getSession();

            const { data } = await axios.patch(
                'http://localhost:8000/user/username',
                { username: form.username },
                { headers: { Authorization: `Bearer ${session?.access_token}`}}
            );

            setForm({ ...form, username: data.username });
            setSavedForm({ ...savedForm, username: data.username });
            setIsEditing(false)
            setMessage('Username updated.');
        } catch (err) {
            if(axios.isAxiosError(err)) {
                setError(err.response?.data?.error ?? 'Something went wrong...');
            } else {
                setError('Something went wrong...')
            }
        }
    }

    async function chagneCredentials(e: React.FormEvent){
        e.preventDefault();
        setSecError(null);

        const newEmail = secForm.newEmail.trim();
        const emailChanging = newEmail !== "" && newEmail !== savedForm.email;
        const passwordChanging = secForm.newPassword !== "";

        if (!emailChanging && !passwordChanging){
            return setSecError('Enter a new email or password.');
        }
        if(emailChanging) {
            const emailError = validateEmail(newEmail);
            if(emailError) return setSecError(emailError);
        }
        if(passwordChanging) {
            const passwordError = validatePassword(secForm.newPassword);
            if(passwordError) return setSecError(passwordError);
        }
        if(passwordChanging && secForm.newPassword !== secForm.confirmPassword) {
            return setSecError("New passwords don't match.");
        }
        if (secForm.currentPassword === "") {
            return setSecError('Enter your current password');
        }
        
        try {
            await axios.patch('http://localhost:8000/user/credentials',
                {
                    currentPassword: secForm.currentPassword,
                    ...(emailChanging && { newEmail }),
                    ...(passwordChanging && { newPassword: secForm.newPassword })
                },
                { headers: { Authorization: `Bearer ${session?.access_token}`} }
            );

            //backend ended session, clear browser copy
            await supabase.auth.signOut();
        } catch (err) {
            if(axios.isAxiosError(err)){
                setSecError(err.response?.data?.error ?? 'Something went wrong...');
            } else{
                setSecError('Something went wrong');
            }
        }




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
                                <button 
                                    className='edit_account_info_btn'
                                    onClick={() => { 
                                        if(isEditing) setForm(savedForm);
                                        setIsEditing(!isEditing);}}
                                >
                                    <img className='edit_icon' src={Edit}/>
                                    <p>{isEditing ? "Cancel" : "Edit"}</p>
                                </button>
                            </div>
                            <form className='user_info_form' onSubmit={editUserProfile}>

                                <label htmlFor='username' className='username_input_label'>Username: </label>
                                <input 
                                    type="text"
                                    id='username' 
                                    placeholder='Username' 
                                    className='username_input'
                                    value={form.username}
                                    onChange={handleUserFormChange}
                                    readOnly={!isEditing}
                                />
                                
                                <label htmlFor='email' className='email_input_label'>Email: </label>
                                <input 
                                    type="email"
                                    id='email' 
                                    placeholder='Email' 
                                    className='email_input'
                                    value={form.email}
                                    readOnly
                                />

                                {isEditing && <button type="submit" className='save_btn'>Save</button>}
                                {error && <p className='error'>{error}</p>}
                                {message && <p className='success'>{message}</p>}
                            </form>

                            <button
                                type="button"
                                className='security_toggle_btn'
                                onClick={() => {
                                    setShowSecurity(!showSecurity);
                                    setSecError(null);
                                    setSecForm({ newEmail: "", newPassword: "", confirmPassword: "", currentPassword: "" });
                                }}
                            >
                                {showSecurity ? "Cancel" : "Change Email or Password"}
                            </button>

                            {showSecurity && (
                                <form className='user_info_form security_form' onSubmit={chagneCredentials}>
                                    <label htmlFor='newEmail'>New Email: </label>
                                    <input type="email" id='newEmail' placeholder='Leave blank to keep current'
                                        value={secForm.newEmail} onChange={handleSecFormChange} />

                                    <label htmlFor='newPassword'>New Password: </label>
                                    <input type="password" id='newPassword' placeholder='Leave blank to keep current'
                                        autoComplete="new-password"
                                        value={secForm.newPassword} onChange={handleSecFormChange} />

                                    <label htmlFor='confirmPassword'>Confirm Password: </label>
                                    <input type="password" id='confirmPassword' autoComplete="new-password"
                                        value={secForm.confirmPassword} onChange={handleSecFormChange} />

                                    <label htmlFor='currentPassword'>Current Password: </label>
                                    <input type="password" id='currentPassword' autoComplete="current-password"
                                        value={secForm.currentPassword} onChange={handleSecFormChange} />

                                    <button type="submit" className='save_btn'>Update</button>
                                    {secError && <p className='error'>{secError}</p>}

                                </form>
                            )}
                            
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