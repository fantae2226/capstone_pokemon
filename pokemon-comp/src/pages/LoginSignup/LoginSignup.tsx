import { HexagonBackground } from '../../components/animate-ui/components/backgrounds/hexagon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/animate-ui/components/radix/tabs';
import pokeball from '../../assets/Pokeball.png';
import { useState } from 'react';
import supabase from '@/lib/supabase';
import { validateEmail, validatePassword } from '@/lib/validation';

import './LoginSignup.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function LoginSignup() {
    const [loginData, setLoginData] = useState({ email: '', password: '' });
    const [signupData, setSignupData] = useState({ username: '', email: '', password: '', confirmPassword:'' });
    const [inputError, setInputError] = useState({ email:'', password:'', confirmPassword:'' })
    const [tab, setTab] = useState('login');
    const [signupMessage, setSignupMessage] = useState('');
    const [loginError, setLoginError] = useState('');
    // const navigate = useNavigate();


    function verifyPassword(e: React.FormEvent) {
        e.preventDefault();

        // const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        // const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

        const errors = {
            email: validateEmail(signupData.email),
            password: validatePassword(signupData.password),
            confirmPassword: signupData.password !== signupData.confirmPassword
                ? 'Password does not match the one given above.'
                : '',
        };

        setInputError(errors);

        if (errors.email || errors.password || errors.confirmPassword) return;

        handleSignup();
    }

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setLoginError('');

        const {data, error} = await supabase.auth.signInWithPassword({
            email: loginData.email,
            password: loginData.password
        });

        if (error) {
            console.error('Error logging in:', error);
            setLoginError(error.message === 'Invalid login credentials'
                    ? 'Wrong email or password. Try again.'
                    : error.message
            );
            return;
        }

        console.log('Login successful:', data);
        // navigate('/dashboard');
    }


    async function handleSignup() {
        const res = await fetch(`${API}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(signupData)
        });
        const data = await res.json();
        
        if(!res.ok){
            setInputError(prev => ({...prev, email: data.error ?? 'Signup failed. Try again.'}));
            return;
        }

        setLoginData({ email: signupData.email, password: ''});
        setSignupMessage('Account created. Log in to continue.');
        setTab('login');
    }


    return (
        <div className="login-page">
            <HexagonBackground className="login-hexagon-bg"/>

            <div className="login-content">
                <div className="login-frame">

                    {/* left / top screen: logo and what the site does */}
                    <section className="login-screen login-screen-top pc-cut">
                        <div>
                            <div className="login-logo">
                                <img src={pokeball} alt="Pokeball"/>
                                <div className="login-logo-text">PokeComp</div>
                            </div>
                            <p className="login-tagline">Build competitive teams and tune every set, from EVs to moves.</p>
                        </div>
                        <div className="login-features">
                            <div className="pc-label-row pc-paper">
                                <span className="pc-label">Build</span>
                                <span className="pc-value">Six slots, any Pokémon, saved to your account</span>
                            </div>
                            <div className="pc-label-row pc-paper">
                                <span className="pc-label">Tune</span>
                                <span className="pc-value">EVs, natures, moves, items, and abilities</span>
                            </div>
                            <div className="pc-label-row pc-paper">
                                <span className="pc-label">Browse</span>
                                <span className="pc-value">Filter every Pokémon by type, ability, and moves</span>
                            </div>
                        </div>
                    </section>

                    {/* right / bottom screen: the forms */}
                    <section className="login-screen login-screen-bottom pc-cut">
                        <Tabs value={tab} onValueChange={setTab} className="login-tabs">
                            <TabsList className="login-tabs-list">
                                <TabsTrigger value="login">Login</TabsTrigger>
                                <TabsTrigger value="signup">Sign Up</TabsTrigger>
                            </TabsList>
                            <TabsContent value="login">
                                <form className="login-form" onSubmit={handleLogin}>
                                    <h1 className="login-heading">Welcome back</h1>
                                    {signupMessage && <p className="login-success">{signupMessage}</p>}
                                    <label htmlFor="login-email" className="login-label">Email</label>
                                    <input
                                        type="text"
                                        id="login-email"
                                        placeholder="name@example.com"
                                        className="login-input"
                                        value={loginData.email}
                                        onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                                    />
                                    <label htmlFor="login-password" className="login-label">Password</label>
                                    <input
                                        type="password"
                                        id="login-password"
                                        placeholder="Your password"
                                        className="login-input"
                                        value={loginData.password}
                                        onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                                    />
                                    {loginError && <p className="login-error" role="alert">{loginError}</p>}
                                    <button type="submit" className="login-submit-btn pc-btn pc-btn-primary">Login</button>
                                </form>
                            </TabsContent>

                            <TabsContent value="signup">
                                <form className="login-form" onSubmit={verifyPassword}>
                                    <h1 className="login-heading">Create your account</h1>
                                    <label htmlFor="signup-username" className="login-label">Username</label>
                                    <input
                                        type="text"
                                        id="signup-username"
                                        placeholder="Trainer name"
                                        className="login-input"
                                        value={signupData.username}
                                        onChange={(e) => setSignupData({...signupData, username: e.target.value})}
                                    />

                                    <label htmlFor="signup-email" className="login-label">Email</label>
                                    <input
                                        type="text"
                                        id="signup-email"
                                        placeholder="name@example.com"
                                        className="login-input"
                                        aria-invalid={!!inputError.email}
                                        value={signupData.email}
                                        onChange={(e) => setSignupData({...signupData, email: e.target.value})}
                                    />
                                    {inputError.email && <p className="login-error">{inputError.email}</p>}

                                    <label htmlFor="signup-password" className="login-label">Password</label>
                                    <input
                                        type="password"
                                        id="signup-password"
                                        placeholder="At least 8 characters"
                                        className="login-input"
                                        aria-invalid={!!inputError.password}
                                        value={signupData.password}
                                        onChange={(e) => setSignupData({...signupData, password: e.target.value})}
                                    />
                                    {inputError.password && <p className="login-error">{inputError.password}</p>}

                                    <label htmlFor="signup-confirm-password" className="login-label">Confirm Password</label>
                                    <input
                                        type="password"
                                        id="signup-confirm-password"
                                        placeholder="Repeat your password"
                                        className="login-input"
                                        aria-invalid={!!inputError.confirmPassword}
                                        value={signupData.confirmPassword}
                                        onChange={(e) => setSignupData({...signupData, confirmPassword: e.target.value})}
                                    />
                                    {inputError.confirmPassword && <p className="login-error">{inputError.confirmPassword}</p>}

                                    <button type="submit" className="signup-submit-btn pc-btn pc-btn-primary">Sign Up</button>
                                </form>
                            </TabsContent>
                        </Tabs>
                    </section>

                </div>
            </div>
        </div>
    );
}