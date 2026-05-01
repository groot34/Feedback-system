import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate, useParams, Link } from 'react-router-dom';

const roleConfig = {
    student: {
        label: 'Student',
        icon: '🎓',
        color: 'bg-cyan-600/80 hover:bg-cyan-500 hover:shadow-[0_0_15px_rgba(0,255,255,0.4)]',
        ring: 'focus:ring-cyan-500 focus:border-cyan-500',
        gradient: 'from-cyan-900/80 to-cyan-800/80 border-b border-cyan-500/50',
        textGlow: 'text-glow-cyan drop-shadow-[0_0_8px_rgba(0,255,255,0.5)]',
        showName: false,
    },
    teacher: {
        label: 'Teacher',
        icon: '📖',
        color: 'bg-purple-600/80 hover:bg-purple-500 hover:shadow-[0_0_15px_rgba(176,38,255,0.4)]',
        ring: 'focus:ring-purple-500 focus:border-purple-500',
        gradient: 'from-purple-900/80 to-purple-800/80 border-b border-purple-500/50',
        textGlow: 'text-glow-purple drop-shadow-[0_0_8px_rgba(176,38,255,0.5)]',
        showName: true,
    },
};

const Register = () => {
    const { role } = useParams();
    const config = roleConfig[role] || roleConfig.student;
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Redirect if already logged in
    useEffect(() => {
        const token = localStorage.getItem('token');
        const savedRole = localStorage.getItem('role');
        if (token && savedRole) {
            navigate(`/${savedRole}`, { replace: true });
        }
    }, [navigate]);

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
                name: config.showName ? name : undefined,
                email,
                password,
                role,
            });
            toast.success('Registration Successful! Please Login.');
            navigate(`/login/${role}`);
        } catch (err) {
            const serverMsg = err.response?.data?.msg;
            toast.error(serverMsg || 'Registration failed. Please check your inputs.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 selection:bg-cyan-500/30">
            {/* Deep Space Background */}
            <div className="absolute inset-0 bg-[#06090f] z-[-3]"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,255,0.03)_1px,transparent_1px)] bg-[length:24px_24px] z-[-2]"></div>

            <div className={`absolute top-1/4 right-1/4 w-[500px] h-[500px] ${config.gradient.split(' ')[0].replace('from-', 'bg-').replace('/80', '')}/10 rounded-full blur-[120px] z-[-1] animate-pulse`}></div>

            <div className="w-full max-w-md relative z-10">
                {/* Back */}
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition group"
                >
                    <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to role selection
                </button>

                <div className={`bg-[#0f172a]/80 backdrop-blur-xl rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-${config.ring.split('-')[2]}-900/50 overflow-hidden`}>
                    {/* Gradient header */}
                    <div className={`bg-gradient-to-r ${config.gradient} p-8 text-center text-white relative overflow-hidden`}>
                        <div className="absolute inset-0 bg-white/5 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%] animate-shine"></div>
                        <span className="text-6xl block mb-4 relative z-10 drop-shadow-lg transition-transform hover:scale-110">{config.icon}</span>
                        <h2 className={`text-3xl font-black ${config.textGlow} relative z-10 tracking-wider`}>{config.label} Sign Up</h2>
                    </div>

                    <div className="p-8 space-y-6">
                        {error && (
                            <div className="bg-rose-900/20 text-rose-400 text-sm px-4 py-3 rounded-lg border border-rose-500/30 flex items-center gap-3">
                                <span>⚠️</span> {error}
                            </div>
                        )}
                        <form onSubmit={handleRegister} className="space-y-6">
                            {config.showName && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Dr. Joydeep"
                                        className={`w-full px-4 py-3 bg-[#0a0f18] text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 ${config.ring} shadow-inner transition-colors placeholder-gray-600`}
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Email</label>
                                <input
                                    type="email"
                                    required
                                    placeholder="Enter your email"
                                    className={`w-full px-4 py-3 bg-[#0a0f18] text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 ${config.ring} shadow-inner transition-colors placeholder-gray-600`}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Password</label>
                                <input
                                    type="password"
                                    required
                                    placeholder="Enter your password"
                                    className={`w-full px-4 py-3 bg-[#0a0f18] text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 ${config.ring} shadow-inner transition-colors placeholder-gray-600`}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                            <button
                                type="submit"
                                className={`w-full px-4 py-3 font-bold text-white rounded-lg transition-all border border-white/10 tracking-wider uppercase text-sm ${config.color} focus:outline-none focus:ring-2 ${config.ring} mt-4`}
                            >
                                Create {config.label} Account
                            </button>
                        </form>

                        <p className="text-sm text-center text-gray-500 pt-4 border-t border-gray-800">
                            Already have an account?{' '}
                            <Link to={`/login/${role}`} className={`font-bold transition-colors hover:underline underline-offset-4 text-${config.ring.split('-')[2]}-400 hover:text-${config.ring.split('-')[2]}-300`}>
                                Login
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
