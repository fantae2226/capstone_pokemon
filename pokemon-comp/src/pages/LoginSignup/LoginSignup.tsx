import { HexagonBackground } from '../../components/animate-ui/components/backgrounds/hexagon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/animate-ui/components/radix/tabs';
import loginIcon from '../../assets/Lock.png';
import signupIcon from '../../assets/UserPlus.png';
import pokeball from '../../assets/Pokeball.png';
import { useState } from 'react';
import supabase from '@/lib/supabase';
// import { useNavigate } from 'react-router-dom';
import './LoginSignup.css';


export default function LoginSignup() {
    const [loginData, setLoginData] = useState({ email: '', password: '' });
    const [signupData, setSignupData] = useState({ username: '', email: '', password: '', confirmPassword:'' });
    const [inputError, setInputError] = useState({ email:'', password:'', confirmPassword:'' })
    // const navigate = useNavigate();


    function verifyPassword(e: React.FormEvent) {
        e.preventDefault();

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

        const errors = {
            email: !emailRegex.test(signupData.email)
                ? 'Please Enter a valid Email Address.'
                : '',
            password: !passwordRegex.test(signupData.password)
                ? 'Password must have minimum eight characters, at least one uppercase letter, one lowercase letter, one number and one special character.'
                : '',
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

        const {data, error} = await supabase.auth.signInWithPassword({
            email: loginData.email,
            password: loginData.password
        });

        if (error) {
            console.error('Error logging in:', error);
            return;
        }

        console.log('Login successful:', data);
        // navigate('/dashboard');
    }


    async function handleSignup() {
        const res = await fetch('http://localhost:8000/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(signupData)
        });
        const data = await res.json();
        console.log('Signup response:', data);
    }


    return (
        <div className="login-page">
            <HexagonBackground className="login-hexagon-bg"/>

            <div className="login-content">
                <div className="login-logo">
                    <img src={pokeball} alt="Pokeball"/>
                    <div className="login-logo-text">PokeComp</div>
                </div>
                <Tabs defaultValue="login" className="login-tabs">
                    <TabsList className="login-tabs-list">
                        <TabsTrigger value="login">
                            <img src={loginIcon} alt="Login Icon" className="login-tab-icon"/>
                            Login
                        </TabsTrigger>
                        <TabsTrigger value="signup">
                            <img src={signupIcon} alt="Sign Up Icon" className="login-tab-icon"/>
                            Sign Up
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="login">
                        <form className="login-form" onSubmit={handleLogin}>
                            <label htmlFor="login-email" className="login-label">Email</label>
                            <input
                                type="text"
                                id="login-email"
                                placeholder="Email"
                                className="login-input"
                                value={loginData.email}
                                onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                            />
                            <label htmlFor="login-password" className="login-label">Password</label>
                            <input
                                type="password"
                                id="login-password"
                                placeholder="Password"
                                className="login-input"
                                value={loginData.password}
                                onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                            />
                            <button type="submit" className="login-submit-btn">Login</button>
                        </form>
                    </TabsContent>

                    <TabsContent value="signup">
                        <form className="login-form" onSubmit={verifyPassword}>
                            <label htmlFor="signup-username">Username</label>
                            <input
                                type="text"
                                id="signup-username"
                                placeholder="Username"
                                className="login-input"
                                value={signupData.username}
                                onChange={(e) => setSignupData({...signupData, username: e.target.value})}
                            />

                            <label htmlFor="signup-email">Email</label>
                            <input
                                type="text"
                                id="signup-email"
                                placeholder="Email"
                                className="login-input"
                                value={signupData.email}
                                onChange={(e) => setSignupData({...signupData, email: e.target.value})}
                            />
                            {inputError.email && <p className="login-error">{inputError.email}</p>}

                            <label htmlFor="signup-password">Password</label>
                            <input
                                type="password"
                                id="signup-password"
                                placeholder="Password"
                                className="login-input"
                                value={signupData.password}
                                onChange={(e) => setSignupData({...signupData, password: e.target.value})}
                            />
                            {inputError.password && <p className="login-error">{inputError.password}</p>}

                            <label htmlFor="signup-confirm-password">Confirm Password</label>
                            <input
                                type="text"
                                id="signup-confirm-password"
                                placeholder="Confirm Password"
                                className="login-input"
                                value={signupData.confirmPassword}
                                onChange={(e) => setSignupData({...signupData, confirmPassword: e.target.value})}
                            />
                            {inputError.confirmPassword && <p className="login-error">{inputError.confirmPassword}</p>}

                            <button type="submit" className="signup-submit-btn">Sign Up</button>
                        </form>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}