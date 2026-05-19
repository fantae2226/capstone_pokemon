import './LoginSignup.css';
import { HexagonBackground } from '../animate-ui/components/backgrounds/hexagon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../animate-ui/components/radix/tabs';
import loginIcon from '../../assets/Lock.png';
import signupIcon from '../../assets/UserPlus.png';
import pokeball from '../../assets/Pokeball.png';

export default function LoginSignup() {
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
                            <form className='flex flex-col gap-4 mt-4'>
                                <input type="text" placeholder='Username' className='p-2 border rounded'/>
                                <input type="password" placeholder='Password' className='p-2 border rounded'/>
                                <button type='submit' className='bg-blue-500 text-white py-2 rounded'>Login</button>
                            </form>
                        </TabsContent>

                        <TabsContent value="signup">
                            <form className='flex flex-col gap-4 mt-4'>
                                <input type="text" placeholder='Username' className='p-2 border rounded'/>
                                <input type="email" placeholder='Email' className='p-2 border rounded'/>
                                <input type="password" placeholder='Password' className='p-2 border rounded'/>
                                <button type='submit' className='bg-green-500 text-white py-2 rounded'>Sign Up</button>
                            </form>
                        </TabsContent>
                    </Tabs>
                </div>

            
        </div>
    );
}