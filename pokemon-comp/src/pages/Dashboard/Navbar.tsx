import User from '@/assets/User.png'
import Pokeball from '@/assets/Pokeball.png'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import './Navbar.css'

// Checking if new repo works

export default function Navbar(){
    const [menuOpen, setMenuOpen] = useState(false);
    const navigate = useNavigate();


    return (
        <div className='relative' style={{width: '100%'}}>
            <div className={`main_nav ${menuOpen ? 'menu-open' : ''}`}>
                <div className='logo'>
                    <img src={Pokeball}/>
                    Poke-Comp
                </div>
                <div className="menu_hamburger"
                    onClick={() => setMenuOpen(!menuOpen)}
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
                <div className='nav_link'>
                    <button value="browse_pokemon">Browse Pokemon</button>
                </div>
                <div className='nav_link'>
                    <button value="browse_teams">Browse Teams</button>
                </div>
                <div className='nav_link'>
                    <button className='user' 
                        value="user_settings"
                        onClick={() => navigate('/user-settings')} 
                    >
                        <div className="user_wrapper">
                            <img className='user_profile' src={User}/>
                            <div className="username">TestUser1</div>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    )
};