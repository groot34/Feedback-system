import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { UserButton, useAuth, useUser } from '@clerk/react';

const Navbar = () => {
    const navigate = useNavigate();
    const { isSignedIn } = useAuth();
    const { user } = useUser();
    
    const role = localStorage.getItem('role') || (isSignedIn ? 'student' : null);
    const name = localStorage.getItem('name') || (isSignedIn && user ? user.fullName || user.firstName : null);

    const roleLabels = {
        student: { label: 'Student Portal', icon: '🎓', glow: 'text-glow-cyan' },
        teacher: { label: 'Teacher Console', icon: '📖', glow: 'text-glow-purple' },
        admin: { label: 'Admin Command Center', icon: '🛡️', glow: 'text-glow-blue' },
    };

    const config = roleLabels[role] || roleLabels.student;

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('userId');
        localStorage.removeItem('name');
        toast.success('Logged out successfully');
        navigate('/');
    };

    return (
        <nav className="bg-[#0f172a]/90 backdrop-blur-md border-b border-cyan-900/50 text-white px-6 py-4 flex justify-between items-center shadow-[0_4px_30px_rgba(0,0,0,0.5)] z-50 sticky top-0 relative">
            {/* Top glowing line */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>
            
            <div className="flex items-center gap-4">
                <div className="bg-white/10 backdrop-blur-sm p-1.5 rounded-xl border border-white/20 shadow-[0_0_15px_rgba(0,255,255,0.2)]">
                    <img src="/collegeLogo.png" alt="IIIT Gwalior" className="w-8 h-8 object-contain filter drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]" />
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="font-bold text-xl text-gray-200 tracking-wide">IIITM Gwalior Feedback</span>
                    <span className="text-gray-500 font-bold mx-1">|</span>
                    <span className={`text-cyan-400 font-black text-lg ${config.glow} tracking-wider`}>{config.label}</span>
                </div>
            </div>

            <div className="flex items-center gap-6">
                {/* Fake Network indicator for Admin */}
                {role === 'admin' && (
                    <div className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-900/20 shadow-[0_0_10px_rgba(0,255,102,0.1)_inset]">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </span>
                        <span className="text-emerald-400 text-xs font-bold tracking-widest uppercase">Network: Mainnet</span>
                    </div>
                )}

                <div className="flex items-center gap-4 bg-[#1e293b]/50 border border-slate-700/50 rounded-full pl-4 pr-1 py-1 shadow-inner">
                    <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-lg">{config.icon}</span>
                        {name && (
                            <span className="text-sm font-medium text-gray-300 tracking-wide pr-2">
                                Hello, <span className="text-white font-bold">{name}</span>
                            </span>
                        )}
                    </div>
                    {isSignedIn ? (
                        <div className="px-1 py-1 flex items-center justify-center">
                            <UserButton afterSignOutUrl="/" />
                        </div>
                    ) : (
                        <button
                            onClick={handleLogout}
                            className="px-4 py-1.5 rounded-full text-xs font-bold bg-slate-800 hover:bg-slate-700 text-gray-300 border border-slate-600 hover:border-slate-500 transition-all duration-300 hover:text-white"
                        >
                            Logout
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
