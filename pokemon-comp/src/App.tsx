import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.tsx';
import { ProtectedRoute, PublicOnlyRoute } from './components/RouteGuards.tsx';
import LoginSignup from './pages/LoginSignup/LoginSignup.tsx';
import Dashboard from './pages/Dashboard/Dashboard';
import UserSettings from './pages/UserSettings/UserSettings.tsx';


function App() {

  return (
    <AuthProvider>
      <BrowserRouter>
        
        <Routes>
          <Route element={<PublicOnlyRoute />}>
            <Route path="/" element={<LoginSignup />} />
          </Route>
          
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path='/user-settings' element={<UserSettings />} />
          </Route>
          
        </Routes>
      
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
