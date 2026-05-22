import { HexagonBackground } from '../animate-ui/components/backgrounds/hexagon';

export default function Dashboard() {
    return (
        <div className="relative min-h-screen"> 
            <HexagonBackground className='fixed inset-0'/>
            <div className='relative z-10 flex flex-col items-center justify-center h-full text-gray-800 dark:text-gray-200'>
                <h1 className='text-4xl font-bold mb-4'>Welcome to your Dashboard!</h1>
                <p className='text-lg'>This is where you can manage your profile, view your Pokemon collection, and more.</p>
            </div>
        </div>
    )};