import { Navigate } from 'react-router-dom';
import { useAuth } from '@clerk/react';

const ProtectedRoute = ({ children, role }) => {
    // Legacy Auth
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('role');

    // Clerk Auth
    const { isLoaded, isSignedIn } = useAuth();

    // While Clerk is initializing, we can just show a loader or nothing
    if (!isLoaded) return null;

    // Check if user is authenticated via EITHER method
    const isLegacyAuth = !!token;
    const isClerkAuth = isSignedIn;

    if (!isLegacyAuth && !isClerkAuth) {
        return <Navigate to="/" />;
    }

    // Role verification
    if (role) {
        if (isClerkAuth) {
            // If they are logged in via Clerk, we treat them as a student for now
            if (role !== 'student') {
                return <Navigate to="/" />;
            }
        } else if (isLegacyAuth && userRole !== role) {
            // Check legacy role
            return <Navigate to="/" />;
        }
    }

    return children;
};

export default ProtectedRoute;
