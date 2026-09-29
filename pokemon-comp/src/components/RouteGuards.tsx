import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export function ProtectedRoute(){
    const { session, loading } = useAuth();
    if (loading){
        //return a placeholder loading component until I go and create a proper one
        return(<div>Loading...</div>);
    }

    return session ? <Outlet /> : <Navigate to="/" replace />
}

export function PublicOnlyRoute(){
    const { session, loading } = useAuth();
    if (loading){
        //return a placeholder loading component until I go and create a proper one
        return(<div>Loading...</div>);
    }

    return session ? <Navigate to="/dashboard" replace /> : <Outlet />
}