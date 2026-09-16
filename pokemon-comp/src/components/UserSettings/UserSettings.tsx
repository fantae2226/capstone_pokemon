import { HexagonBackground } from '../animate-ui/components/backgrounds/hexagon';
import { useNavigate } from 'react-router-dom';


export default function UserSettings(){
    const navigate = useNavigate();

    return(
        <div className='relative min-h-screen'>
            <HexagonBackground className='fixed inset-0'/>
            <div className='relative'>
               <div className='user_settings_nav'>
                    <button className='return_btn'>
                        ⇐
                    </button>
                    <button className='manage_userprofile'>
                        Manage User Profile
                    </button>
                    <button className='manage_teams'>
                        Manage Pokemon Teams
                    </button>
                    <button className='import_teamdata'>
                        Import New Team
                    </button>
                    <button className='logout_btn'>
                        Logout
                    </button>
               </div>
            </div>
        </div>
    )
}