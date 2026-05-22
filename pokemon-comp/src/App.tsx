import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginSignup from './components/LoginSignup/LoginSignup'
import Dashboard from './components/Dashboard/Dashboard'
import {useEffect} from 'react';
import supabase from './supabase.ts'

function App() {
  
  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        console.log('User signed in:', session);
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out');
      }
    });
  }, []);

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginSignup />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
