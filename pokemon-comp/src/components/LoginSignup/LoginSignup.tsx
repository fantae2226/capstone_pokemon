import { HexagonBackground } from '../animate-ui/components/backgrounds/hexagon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../animate-ui/components/radix/tabs';
import loginIcon from '../../assets/Lock.png';
import signupIcon from '../../assets/UserPlus.png';
import pokeball from '../../assets/Pokeball.png';
import { useState, useEffect } from 'react';
import supabase from '@/supabase';
import { useNavigate } from 'react-router-dom';


export default function LoginSignup() {
    const [loginData, setLoginData] = useState({ email: '', password: '' });
    const [signupData, setSignupData] = useState({ username: '', email: '', password: '', confirmPassword:'' });
    const [inputError, setInputError] = useState({ email:'', password:'', confirmPassword:'' })
    const navigate = useNavigate();


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
        
        const {data, error} = await supabase.auth.signInWithPassword({
            email: loginData.email, 
            password: loginData.password
        });

        if (error) {
            console.error('Error logging in:', error);
            return;
        }

        console.log('Login successful:', data);
        navigate('/dashboard');
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
        <div className="relative min-h-screen">
                <HexagonBackground className='fixed inset-0'/>
                
                <div className='relative z-10 pointer-events-none'>
                    <div className='flex items-center w-fit mx-auto mt-10 pointer-events-auto'>
                        <img src={pokeball} alt="Pokeball" className="w-10 h-10"/>
                        <div className='ml-2 text-2xl font-bold text-gray-800 dark:text-gray-200'>PokeComp</div>
                    </div>
                    <Tabs defaultValue="login" className="w-full max-w-md mx-auto mt-20 pointer-events-auto">
                        <TabsList className="bg-gray-200 dark:bg-gray-700 rounded-lg p-1 w-full">
                            <TabsTrigger value="login">
                                <img src={loginIcon} alt="Login Icon" className=" w-5 h-5 mr-2"/>
                                Login
                            </TabsTrigger>
                            <TabsTrigger value="signup">
                                <img src={signupIcon} alt="Sign Up Icon" className="w-5 h-5 mr-2"/>
                                Sign Up
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="login">
                            <form className='flex flex-col gap-4 mt-4' onSubmit={handleLogin}>
                                <label htmlFor='login-email' className='w-1 h-2 mr-2'>Email</label>
                                <input 
                                    type="text"
                                    id='login-email' 
                                    placeholder='Email' 
                                    className='p-2 border rounded'
                                    value={loginData.email}
                                    onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                                />
                                <label htmlFor='login-password' className='w-1 h-2 mr-2'>Password</label>
                                <input 
                                    type="password"
                                    id='login-password' 
                                    placeholder='Password' 
                                    className='p-2 border rounded'
                                    value={loginData.password}
                                    onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                                />
                                <button type='submit' className='bg-blue-500 text-white py-2 rounded'>Login</button>
                            </form>
                        </TabsContent>

                        <TabsContent value="signup">
                            <form className='flex flex-col gap-4 mt-4' onSubmit={verifyPassword}>
                                <label htmlFor='signup-username'>Username</label>                                                                
                                <input 
                                    type="text" 
                                    id='signup-username'
                                    placeholder='Username' 
                                    className='p-2 border rounded'
                                    value={signupData.username}
                                    onChange={(e) => setSignupData({...signupData, username: e.target.value})}
                                />

                                <label htmlFor='signup-email'>Email</label>                                
                                <input 
                                    type="text" 
                                    id='signup-email'
                                    placeholder='Email' 
                                    className='p-2 border rounded'
                                    value={signupData.email}
                                    onChange={(e) => setSignupData({...signupData, email: e.target.value})}
                                />
                                {inputError.email && <p className='text-red-600 text-sm'>{inputError.email}</p>}

                                <label htmlFor='signup-password'>Password</label>
                                <input 
                                    type="password"
                                    id='signup-password' 
                                    placeholder='Password' 
                                    className='p-2 border rounded'
                                    value={signupData.password}
                                    onChange={(e) => setSignupData({...signupData, password: e.target.value})}
                                />
                                {inputError.password && <p className='text-red-600 text-sm'>{inputError.password}</p>}

                                <label htmlFor='signup-confirm-password'>Confirm Password</label>
                                <input 
                                    type="text"
                                    id='signup-confirm-password' 
                                    placeholder='Confirm Password' 
                                    className='p-2 border rounded'
                                    value={signupData.confirmPassword}
                                    onChange={(e) => setSignupData({...signupData, confirmPassword: e.target.value})}
                                />
                                {inputError.confirmPassword && <p className='text-red-600 text-sm'>{inputError.confirmPassword}</p>}

                                <button type='submit' className='bg-green-500 text-white py-2 rounded'>Sign Up</button>
                            </form>
                        </TabsContent>
                    </Tabs>
                </div>

            
        </div>
    );
}