import { Navigate } from 'react-router-dom';
import { useAuth, useUser, useClerk } from '@clerk/react';
import { useState, useEffect } from 'react';
import axios from 'axios';

const ProtectedRoute = ({ children, role }) => {
    // Legacy Auth
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('role');

    // Clerk Auth
    const { isLoaded, isSignedIn } = useAuth();
    const { user } = useUser();
    const { signOut } = useClerk();

    // State for bridging
    const [isBridging, setIsBridging] = useState(false);
    const [bridgeError, setBridgeError] = useState(null);

    useEffect(() => {
        // If Clerk is loaded and user is signed in, but we don't have a backend token
        if (isLoaded && isSignedIn && !token) {
            const bridgeClerkToBackend = async () => {
                setIsBridging(true);
                try {
                    const email = user.primaryEmailAddress.emailAddress;
                    const name = user.fullName || user.firstName || email.split('@')[0];
                    
                    // Request legacy JWT from backend with intendedRole
                    const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/clerk-login`, { email, name, intendedRole: role });
                    
                    localStorage.setItem('token', res.data.token);
                    localStorage.setItem('role', res.data.role);
                    localStorage.setItem('name', res.data.name); // Store name to be safe
                    
                    // Reload to ensure all axios instances/app state pick up the token
                    window.location.reload(); 
                } catch (err) {
                    console.error("Bridge Error:", err);
                    setBridgeError(err.response?.data?.msg || "Failed to sync session");
                    setIsBridging(false);
                }
            };
            bridgeClerkToBackend();
        }
    }, [isLoaded, isSignedIn, token, user, role]);

    if (!isLoaded || isBridging) {
        return (
            <div className="min-h-screen bg-[#0a0f18] text-cyan-400 flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin mb-4"></div>
                <p className="font-bold tracking-widest uppercase">Authenticating...</p>
            </div>
        );
    }

    if (bridgeError) {
        return (
            <div className="min-h-screen bg-[#0a0f18] text-rose-500 flex items-center justify-center flex-col">
                <div className="text-6xl mb-6">🚫</div>
                <h2 className="text-2xl font-bold mb-8">{bridgeError}</h2>
                <button 
                    onClick={() => { 
                        localStorage.clear(); 
                        signOut(() => { window.location.href='/'; }); 
                    }} 
                    className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl transition shadow-lg"
                >
                    Sign Out & Return
                </button>
            </div>
        );
    }

    // Check if user is authenticated via EITHER method
    const isLegacyAuth = !!token;
    const isClerkAuth = isSignedIn;

    if (!isLegacyAuth && !isClerkAuth) {
        return <Navigate to="/" />;
    }

    // Role verification against our backend DB role
    if (role && userRole !== role && isLegacyAuth) {
        return (
            <div className="min-h-screen bg-[#0a0f18] text-rose-500 flex items-center justify-center flex-col">
                <div className="text-6xl mb-6">🔒</div>
                <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
                <p className="text-gray-400 mb-8 max-w-md text-center">
                    You are logged in as a <b>{userRole || 'student'}</b>, but this area requires <b>{role}</b> privileges.
                </p>
                <button 
                    onClick={() => { window.location.href='/'; }} 
                    className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl transition shadow-lg"
                >
                    Go to Home
                </button>
            </div>
        );
    }

    return children;
};

export default ProtectedRoute;
