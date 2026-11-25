import { HexagonBackground } from '../../components/animate-ui/components/backgrounds/hexagon';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import supabase from '@/lib/supabase';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';

import Navbar from '../Dashboard/Navbar';

import './UserSettings.css'
import { validateEmail, validatePassword } from '@/lib/validation';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function UserSettings(){
    const navigate = useNavigate();
    const { user, session } = useAuth();
    const userId = user?.id;
    const userEmail = user?.email;

    const [isEditing, setIsEditing] = useState(false);
    const [, setLoading] = useState(true);
    
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
                `${API}/user/username`,
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
            await axios.patch(`${API}/user/credentials`,
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





    return(
        <div className='relative min-h-screen'>
            <HexagonBackground className='fixed inset-0'/>
            <div className='relative'>
                <Navbar />

                <main className='settings_page'>
                    <div className='settings_top'>
                        <button className='return_btn' onClick={() => navigate("/dashboard")}>
                            ← Dashboard
                        </button>
                        <button className='logout_btn' onClick={() => supabase.auth.signOut()}>
                            Logout
                        </button>
                    </div>

                    <div className='settings_frame'>
                        <section className='settings_screen pc-cut'>

                            {/* ---------- profile ---------- */}
                            <div className='account_info_header'>
                                <div>
                                    <div className='settings_label pc-pixel'>SETTINGS</div>
                                    <h1 className='settings_heading'>Account Information</h1>
                                </div>
                                <button
                                    className='edit_account_info_btn'
                                    onClick={() => {
                                        if(isEditing) setForm(savedForm);
                                        setIsEditing(!isEditing);}}
                                >
                                    {isEditing ? "Cancel" : "Edit"}
                                </button>
                            </div>

                            <form className='user_info_form' onSubmit={editUserProfile}>
                                <div className='pc-label-row pc-paper settings_row'>
                                    <label htmlFor='username' className='pc-label'>Username</label>
                                    <span className='pc-value'>
                                        <input
                                            type="text"
                                            id='username'
                                            placeholder='Username'
                                            className='settings_row_input'
                                            value={form.username}
                                            onChange={handleUserFormChange}
                                            readOnly={!isEditing}
                                        />
                                    </span>
                                </div>

                                <div className='pc-label-row pc-paper settings_row'>
                                    <label htmlFor='email' className='pc-label'>Email</label>
                                    <span className='pc-value'>
                                        <input
                                            type="email"
                                            id='email'
                                            placeholder='Email'
                                            className='settings_row_input'
                                            value={form.email}
                                            readOnly
                                        />
                                    </span>
                                </div>

                                {(isEditing || error || message) && (
                                    <div className='settings_form_footer'>
                                        {isEditing && <button type="submit" className='settings_save_btn pc-btn pc-btn-primary'>Save</button>}
                                        {error && <p className='settings_error'>{error}</p>}
                                        {message && <p className='settings_success'>{message}</p>}
                                    </div>
                                )}
                            </form>

                            {/* ---------- email and password ---------- */}
                            <div className='security_section'>
                                <div className='security_header'>
                                    <div>
                                        <h2 className='settings_subheading'>Email and password</h2>
                                        <p className='settings_note'>You'll be logged out after updating, so you can sign in with the new details.</p>
                                    </div>
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
                                </div>

                                {showSecurity && (
                                    <form className='security_form' onSubmit={chagneCredentials}>
                                        <label htmlFor='newEmail' className='security_field security_field_full'>New Email
                                            <input type="email" id='newEmail' placeholder='Leave blank to keep current'
                                                value={secForm.newEmail} onChange={handleSecFormChange} />
                                        </label>

                                        <label htmlFor='newPassword' className='security_field'>New Password
                                            <input type="password" id='newPassword' placeholder='Leave blank to keep current'
                                                autoComplete="new-password"
                                                value={secForm.newPassword} onChange={handleSecFormChange} />
                                        </label>

                                        <label htmlFor='confirmPassword' className='security_field'>Confirm Password
                                            <input type="password" id='confirmPassword' placeholder='Repeat the new password'
                                                autoComplete="new-password"
                                                value={secForm.confirmPassword} onChange={handleSecFormChange} />
                                        </label>

                                        <div className='security_confirm'>
                                            <label htmlFor='currentPassword' className='security_field'>Current Password
                                                <input type="password" id='currentPassword' placeholder='Required to save changes'
                                                    autoComplete="current-password"
                                                    value={secForm.currentPassword} onChange={handleSecFormChange} />
                                            </label>
                                            <button type="submit" className='settings_save_btn pc-btn pc-btn-primary'>Update</button>
                                        </div>

                                        {secError && <p className='settings_error security_field_full'>{secError}</p>}
                                    </form>
                                )}
                            </div>

                        </section>
                    </div>
                </main>
            </div>
        </div>
    )
}