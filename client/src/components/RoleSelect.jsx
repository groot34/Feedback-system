import { useNavigate } from 'react-router-dom';
import { SignInButton, SignUpButton, useAuth } from '@clerk/react';
import { useEffect } from 'react';

const roles = [
    {
        key: 'student',
        label: 'Student',
        icon: '🎓',
        description: 'Access feedback forms and submit responses',
        color: 'from-cyan-400 to-cyan-600',
        border: 'border-cyan-500',
        shadow: 'shadow-neon-cyan',
        textGlow: 'text-glow-cyan',
        bgGlow: 'group-hover:bg-cyan-900/40',
        canRegister: true,
    },
    {
        key: 'teacher',
        label: 'Teacher',
        icon: '📖',
        description: 'View student feedback for your subjects',
        color: 'from-purple-500 to-purple-700',
        border: 'border-purple-500',
        shadow: 'shadow-neon-purple',
        textGlow: 'text-glow-purple',
        bgGlow: 'group-hover:bg-purple-900/40',
        canRegister: true,
    },
    {
        key: 'admin',
        label: 'Admin',
        icon: '🛡️',
        description: 'Manage users, forms, and system settings',
        color: 'from-emerald-400 to-emerald-600',
        border: 'border-emerald-500',
        shadow: 'shadow-neon-emerald',
        textGlow: 'text-glow-emerald',
        bgGlow: 'group-hover:bg-emerald-900/40',
        canRegister: false,
    },
];

const RoleSelect = () => {
    const navigate = useNavigate();
    const { isSignedIn } = useAuth();
    const legacyRole = localStorage.getItem('role');

    useEffect(() => {
        if (isSignedIn) {
            navigate('/student');
        } else if (legacyRole) {
            navigate(`/${legacyRole}`);
        }
    }, [isSignedIn, legacyRole, navigate]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4 sm:px-8 selection:bg-cyan-500/30">
            {/* Deep Space Background */}
            <div className="absolute inset-0 bg-[#06090f] z-[-3]"></div>
            
            {/* Animated Grid / Hexagon overlay could go here, simulating with radial gradients */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,255,0.03)_1px,transparent_1px)] bg-[length:24px_24px] z-[-2]"></div>

            {/* Glowing Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] bg-cyan-900/20 rounded-full blur-[120px] z-[-1] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] bg-purple-900/20 rounded-full blur-[120px] z-[-1]"></div>
            <div className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] bg-emerald-900/10 rounded-full blur-[100px] z-[-1]"></div>

            {/* Header */}
            <div className="text-center mb-20 relative z-10 flex flex-col items-center">
                {/* Logo Container */}
                <div className="relative group mb-8">
                    <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full group-hover:bg-cyan-400/30 transition-all duration-500"></div>
                    <div className="relative bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-[0_0_30px_rgba(0,255,255,0.15)] flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                        <img 
                            src="/collegeLogo.png" 
                            alt="IIITM Gwalior Logo" 
                            className="w-24 h-24 object-contain filter drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" 
                        />
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-5xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 tracking-wider mb-4 drop-shadow-[0_0_15px_rgba(0,255,255,0.5)]">
                    Feedback System
                </h1>
                
                {/* Subtitle */}
                <p className="text-gray-400 text-lg sm:text-2xl font-bold tracking-[0.2em] uppercase">
                    ABV — IIITM Gwalior
                </p>
                
                {/* Decorative Line */}
                <div className="mt-8 flex items-center justify-center gap-4">
                    <div className="h-[2px] w-12 sm:w-32 bg-gradient-to-r from-transparent to-cyan-500/50"></div>
                    <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(0,255,255,1)] animate-ping"></div>
                    <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(0,255,255,1)]"></div>
                    <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(0,255,255,1)] animate-ping"></div>
                    <div className="h-[2px] w-12 sm:w-32 bg-gradient-to-l from-transparent to-cyan-500/50"></div>
                </div>
            </div>

            {/* Role Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl relative z-10">
                {roles.map((role) => (
                    <div
                        key={role.key}
                        className={`bg-[#0f172a]/80 backdrop-blur-xl rounded-2xl border ${role.border} ${role.shadow} transition-all duration-300 overflow-hidden group hover:-translate-y-2 ${role.key !== 'student' ? 'cursor-pointer' : ''}`}
                        onClick={() => {
                            if (role.key !== 'student') navigate(`/login/${role.key}`);
                        }}
                    >
                        <div className={`p-8 flex flex-col items-center text-center h-full ${role.bgGlow} transition-colors duration-500`}>
                            <div className="h-24 w-24 mb-6 relative flex items-center justify-center">
                                {/* Simulated glow behind icon */}
                                <div className={`absolute inset-0 bg-gradient-to-tr ${role.color} opacity-20 blur-xl rounded-full group-hover:opacity-40 transition-opacity`}></div>
                                <span className="text-7xl group-hover:scale-110 transition-transform duration-300 relative z-10 drop-shadow-lg">
                                    {role.icon}
                                </span>
                            </div>
                            
                            <h2 className={`text-3xl font-bold text-white mb-3 tracking-wide ${role.textGlow}`}>
                                {role.label}
                            </h2>
                            <p className="text-gray-400 text-sm mb-8 flex-grow">{role.description}</p>

                            {role.key === 'student' ? (
                                <SignInButton mode="modal" forceRedirectUrl="/student">
                                    <button
                                        className={`w-full py-3 rounded-lg text-black font-extrabold tracking-widest uppercase text-sm bg-gradient-to-r ${role.color} hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all duration-300 border border-white/20`}
                                    >
                                        Login as {role.label}
                                    </button>
                                </SignInButton>
                            ) : role.key === 'teacher' ? (
                                <SignInButton mode="modal" forceRedirectUrl="/teacher">
                                    <button
                                        className={`w-full py-3 rounded-lg text-black font-extrabold tracking-widest uppercase text-sm bg-gradient-to-r ${role.color} hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all duration-300 border border-white/20`}
                                    >
                                        Login as {role.label}
                                    </button>
                                </SignInButton>
                            ) : (
                                <button
                                    className={`w-full py-3 rounded-lg text-black font-extrabold tracking-widest uppercase text-sm bg-gradient-to-r ${role.color} hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all duration-300 border border-white/20`}
                                >
                                    Login as {role.label}
                                </button>
                            )}

                            {role.canRegister ? (
                                role.key === 'student' ? (
                                    <SignUpButton mode="modal" forceRedirectUrl="/student">
                                        <button className="mt-6 text-sm text-gray-500 hover:text-white transition-colors">
                                            New {role.label}? <span className="underline decoration-white/50 underline-offset-4">Sign up</span>
                                        </button>
                                    </SignUpButton>
                                ) : role.key === 'teacher' ? (
                                    <div className="mt-6 h-5"></div> /* No manual signup for teachers, they are synced */
                                ) : (
                                    <button
                                        className="mt-6 text-sm text-gray-500 hover:text-white transition-colors"
                                        onClick={(e) => { e.stopPropagation(); navigate(`/register/${role.key}`); }}
                                    >
                                        New {role.label}? <span className="underline decoration-white/50 underline-offset-4">Sign up</span>
                                    </button>
                                )
                            ) : (
                                <div className="mt-6 h-5"></div> /* Placeholder for spacing alignment */
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RoleSelect;
