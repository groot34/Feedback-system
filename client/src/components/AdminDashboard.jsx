import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Navbar from './Navbar';
import AnalyticsPanel from './AnalyticsPanel';

const AdminDashboard = () => {
    const [stats, setStats] = useState({ pendingCount: 0, onChainCount: 0 });
    const [forms, setForms] = useState([]);
    const [responses, setResponses] = useState([]);
    const [activeTab, setActiveTab] = useState('dashboard'); // Changed default to dashboard
    const [expandedSubject, setExpandedSubject] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const formsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/feedback/all`);
            setForms(formsRes.data);

            const responsesRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/feedback/responses`);
            setResponses(responsesRes.data);
        } catch (err) {
            console.error('Error fetching data:', err);
        }
    };

    const triggerBatch = async () => {
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/force-batch`);
            toast.success(res.data.msg + (res.data.count ? ` (${res.data.count} users processed)` : ''));
        } catch (err) {
            console.error(err);
            toast.error('Error triggering batch process');
        }
    };

    const syncTeachers = async () => {
        const confirm = window.confirm("This will fetch the latest teacher directory from the IIITM website. It will ADD new teachers and DELETE any current teachers not found on the site. Continue?");
        if (!confirm) return;
        
        const loadingToast = toast.loading('Syncing teacher directory...');
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/sync-teachers`);
            toast.success(`Sync Complete: Added ${res.data.added}, Removed ${res.data.deleted}. Active: ${res.data.totalActive}`, { id: loadingToast });
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.msg || 'Failed to sync teachers.', { id: loadingToast });
        }
    };

    // Infer section from question text for old responses missing the section field
    const labKeywords = ['experiment', 'lab manual', 'methodical', 'laboratory', 'lab session', 'creative was'];
    const generalKeywords = ['Five best', 'work load', 'lectures held regularly', 'like / dislike', 'hours per week', 'additional comments'];
    const getSection = (ans) => {
        if (ans.section) return ans.section;
        const t = (ans.questionText || '').toLowerCase();
        if (labKeywords.some(k => t.includes(k))) return 'Presentation and Interaction (Lab Component - Optional)';
        if (generalKeywords.some(k => t.toLowerCase().includes(k.toLowerCase()))) return 'General Comments';
        return 'Subject Feedback';
    };

    // Toggle approval for a single response
    const toggleApproval = async (responseId) => {
        try {
            const res = await axios.patch(`${import.meta.env.VITE_API_URL}/api/feedback/approve/${responseId}`);
            setResponses(prev => prev.map(r => r._id === responseId ? { ...r, approvedForTeacher: res.data.approved } : r));
            toast.success(res.data.approved ? 'Approved for teacher' : 'Approval revoked');
        } catch (err) {
            console.error(err);
            toast.error('Failed to update approval');
        }
    };

    // Delete a form
    const deleteForm = async (formId) => {
        if (!window.confirm("Are you sure you want to delete this form? This will permanently delete the form and ALL its submitted feedback responses.")) return;
        
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/feedback/${formId}`);
            setForms(prev => prev.filter(f => f._id !== formId));
            setResponses(prev => prev.filter(r => r.formId?._id !== formId));
            if (expandedSubject === formId) setExpandedSubject(null);
            toast.success('Form and all its responses deleted successfully!');
        } catch (err) {
            console.error(err);
            toast.error('Failed to delete form');
        }
    };

    // Close a form instantly
    const closeForm = async (formId) => {
        if (!window.confirm("Are you sure you want to close this form now? Students will no longer be able to submit feedback for it.")) return;
        
        try {
            const res = await axios.patch(`${import.meta.env.VITE_API_URL}/api/feedback/close/${formId}`);
            // Update the local form state with the new endDate returned from server
            setForms(prev => prev.map(f => f._id === formId ? { ...f, endDate: res.data.endDate } : f));
            toast.success('Form closed successfully!');
        } catch (err) {
            console.error(err);
            toast.error('Failed to close form');
        }
    };

    // Approve or revoke all responses for a form
    const approveAll = async (formId, approve) => {
        try {
            await axios.patch(`${import.meta.env.VITE_API_URL}/api/feedback/approve-all/${formId}`, { approve });
            setResponses(prev => prev.map(r => r.formId?._id === formId ? { ...r, approvedForTeacher: approve } : r));
            toast.success(approve ? 'All responses approved' : 'All approvals revoked');
        } catch (err) {
            console.error(err);
            toast.error('Failed to update approvals');
        }
    };

    // Group responses by form title
    const groupedResponses = responses.reduce((acc, r) => {
        const formTitle = r.formId?.title || 'Unknown Form';
        const formId = r.formId?._id || 'unknown';
        const professorName = r.formId?.assignedFaculty?.name || 'Unknown Professor';
        
        if (!acc[formId]) {
            acc[formId] = { title: formTitle, professorName, responses: [] };
        }
        acc[formId].responses.push(r);
        return acc;
    }, {});

    // Helper to determine form status
    const getFormStatus = (form) => {
        if (!form.active) return { label: 'Inactive', color: 'bg-gray-100 text-gray-500', raw: 'inactive' };
        
        const now = new Date();
        if (form.endDate && now > new Date(form.endDate)) {
            return { label: '🔴 Expired', color: 'bg-red-100 text-red-700', raw: 'expired' };
        }
        if (form.startDate && now < new Date(form.startDate)) {
            return { label: '🟡 Opening Soon', color: 'bg-yellow-100 text-yellow-800', raw: 'upcoming' };
        }
        return { label: '🟢 Active', color: 'bg-green-100 text-green-700', raw: 'active' };
    };

    return (
        <div className="min-h-screen bg-[#0a0f18] text-gray-200">
            <Navbar />
            
            <div className="flex">
                {/* Sidebar */}
                <aside className="w-64 border-r border-cyan-900/50 bg-[#0f172a]/50 hidden md:block min-h-[calc(100vh-76px)] p-6 z-20">
                    <div className="space-y-4">
                        <div 
                            onClick={() => { setActiveTab('dashboard'); setExpandedSubject(null); }}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-300 ${activeTab === 'dashboard' ? 'bg-cyan-900/20 border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(0,255,255,0.1)_inset]' : 'border-transparent text-gray-400 hover:text-cyan-300 hover:bg-cyan-900/10'}`}
                        >
                            <span className="text-xl">🎛️</span>
                            <span className={`font-bold tracking-widest text-sm uppercase ${activeTab === 'dashboard' ? 'text-glow-cyan' : ''}`}>Dashboard</span>
                        </div>
                        <div 
                            onClick={() => { setActiveTab('forms'); setExpandedSubject(null); }}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-300 ${activeTab === 'forms' ? 'bg-cyan-900/20 border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(0,255,255,0.1)_inset]' : 'border-transparent text-gray-400 hover:text-cyan-300 hover:bg-cyan-900/10'}`}
                        >
                            <span className="text-xl">📋</span>
                            <span className={`font-bold tracking-widest text-sm uppercase ${activeTab === 'forms' ? 'text-glow-cyan' : ''}`}>Forms</span>
                        </div>
                        <div 
                            onClick={() => { setActiveTab('responses'); setExpandedSubject(null); }}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-300 ${activeTab === 'responses' ? 'bg-cyan-900/20 border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(0,255,255,0.1)_inset]' : 'border-transparent text-gray-400 hover:text-cyan-300 hover:bg-cyan-900/10'}`}
                        >
                            <span className="text-xl">📊</span>
                            <span className={`font-bold tracking-widest text-sm uppercase ${activeTab === 'responses' ? 'text-glow-cyan' : ''}`}>Responses</span>
                        </div>
                    </div>
                </aside>

                {/* Main Content Area */}
                <div className="flex-1 p-8 relative">
                    {/* Background Grid simulating Image 2 */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] z-0 pointer-events-none"></div>

                    <div className="max-w-6xl mx-auto relative z-10">
                        <h1 className="text-4xl font-black text-cyan-400 tracking-wider mb-8 flex items-center gap-3 text-glow-cyan">
                            Admin Dashboard
                        </h1>

                        {/* Top Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                            {/* Active Forms Stat */}
                            <div className="bg-[#0f172a]/80 backdrop-blur-md rounded-xl p-6 border border-blue-500/40 shadow-neon-blue relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition"></div>
                                <h3 className="text-blue-300 text-sm font-bold uppercase tracking-widest mb-1">Active Forms</h3>
                                <div className="flex justify-between items-end">
                                    <p className="text-5xl font-black text-white">{forms.length}</p>
                                    <div className="h-10 w-24 border-b-2 border-r-2 border-blue-400/50 rounded-br-lg skew-x-12 opacity-50"></div>
                                </div>
                            </div>
                            
                            {/* Responses Stat */}
                            <div className="bg-[#0f172a]/80 backdrop-blur-md rounded-xl p-6 border border-cyan-500/40 shadow-neon-cyan relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition"></div>
                                <h3 className="text-cyan-300 text-sm font-bold uppercase tracking-widest mb-1">Responses</h3>
                                <div className="flex justify-between items-end">
                                    <p className="text-5xl font-black text-white">{responses.length}</p>
                                    <div className="flex gap-1 items-end h-8 opacity-70">
                                        <div className="w-2 h-4 bg-cyan-500 rounded-t-sm animate-pulse"></div>
                                        <div className="w-2 h-6 bg-cyan-400 rounded-t-sm animate-pulse" style={{animationDelay: '100ms'}}></div>
                                        <div className="w-2 h-3 bg-cyan-600 rounded-t-sm animate-pulse" style={{animationDelay: '200ms'}}></div>
                                        <div className="w-2 h-8 bg-cyan-400 rounded-t-sm animate-pulse" style={{animationDelay: '300ms'}}></div>
                                        <div className="w-2 h-5 bg-cyan-500 rounded-t-sm animate-pulse" style={{animationDelay: '400ms'}}></div>
                                    </div>
                                </div>
                            </div>

                            {/* On-Chain Users Stat */}
                            <div className="bg-[#0f172a]/80 backdrop-blur-md rounded-xl p-6 border border-emerald-500/40 shadow-neon-emerald relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition"></div>
                                <h3 className="text-emerald-300 text-sm font-bold uppercase tracking-widest mb-1">On-Chain Users</h3>
                                <div className="flex justify-between items-center">
                                    <p className="text-5xl font-black text-white">{stats.onChainCount || 0}</p>
                                    <div className="text-4xl opacity-50 drop-shadow-[0_0_10px_rgba(0,255,102,0.8)]">🧊</div>
                                </div>
                            </div>
                        </div>

                        {/* Actions Row */}
                        <div className="mb-10">
                            <h2 className="text-lg font-bold text-gray-400 tracking-widest uppercase mb-4 border-b border-gray-800 pb-2">Actions</h2>
                            <div className="flex flex-wrap gap-4">
                                <button 
                                    onClick={triggerBatch}
                                    className="flex items-center gap-2 bg-gradient-to-r from-blue-900/80 to-blue-800/80 hover:from-blue-800 hover:to-blue-700 text-blue-100 px-6 py-3 rounded-xl border border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)] transition font-bold tracking-wider uppercase text-sm"
                                >
                                    <span>⚙️</span> FORCE BATCH PROCESSING
                                </button>
                                <a 
                                    href="/admin/create-feedback"
                                    className="flex items-center gap-2 bg-gradient-to-r from-emerald-900/80 to-emerald-800/80 hover:from-emerald-800 hover:to-emerald-700 text-emerald-100 px-6 py-3 rounded-xl border border-emerald-500/50 shadow-[0_0_15px_rgba(0,255,102,0.3)] transition font-bold tracking-wider uppercase text-sm inline-block"
                                >
                                    <span>⊕</span> CREATE FEEDBACK FORM <span className="text-emerald-300 opacity-70 ml-2">~</span>
                                </a>
                                <button 
                                    onClick={syncTeachers}
                                    className="flex items-center gap-2 bg-gradient-to-r from-purple-900/80 to-purple-800/80 hover:from-purple-800 hover:to-purple-700 text-purple-100 px-6 py-3 rounded-xl border border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.3)] transition font-bold tracking-wider uppercase text-sm"
                                >
                                    <span>🔄</span> SYNC TEACHERS
                                </button>
                            </div>
                        </div>

                        {/* Render Main Content based on active tab */}
                        {activeTab === 'dashboard' && (
                            <div className="p-6 bg-[#0f172a]/30 rounded-xl border border-gray-800 backdrop-blur-sm min-h-[400px]">
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4 opacity-80">🛡️</div>
                                    <h2 className="text-2xl font-bold text-gray-300 mb-2 tracking-wider">System Overview Mode</h2>
                                    <p className="text-gray-500 max-w-lg mx-auto leading-relaxed">
                                        Welcome to the Admin Command Center. Use the sidebar to navigate to specific sections.
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className={`${activeTab === 'dashboard' ? 'hidden' : 'block'} p-6 bg-[#0f172a]/30 rounded-xl border border-gray-800 backdrop-blur-sm min-h-[400px]`}>
                            {activeTab === 'forms' ? (
                                forms.length === 0 ? (
                                    <p className="text-gray-500 text-center py-8">No forms created yet.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {forms.map(form => {
                                            const status = getFormStatus(form);
                                            return (
                                            <div key={form._id} className="border border-indigo-500/30 bg-[#1e293b]/60 p-5 rounded-xl hover:bg-[#1e293b] hover:border-cyan-500/50 hover:shadow-neon-cyan flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all duration-300 group">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="font-bold text-xl text-gray-100 group-hover:text-cyan-300 transition-colors">{form.title}</h3>
                                                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${status.raw === 'active' ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-500/50' : status.raw === 'expired' ? 'bg-rose-900/50 text-rose-400 border border-rose-500/50' : 'bg-amber-900/50 text-amber-400 border border-amber-500/50'}`}>
                                                            {status.label}
                                                        </span>
                                                    </div>
                                                    <p className="text-gray-400 text-sm mb-2">{form.description}</p>
                                                    {form.assignedFaculty && (
                                                        <p className="text-cyan-500/80 text-sm font-medium mt-1">Professor: {form.assignedFaculty.name}</p>
                                                    )}
                                                    <p className="text-xs text-gray-400 mt-2">
                                                        {form.questions?.length || 0} questions • Created {new Date(form.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {(status.raw === 'active' || status.raw === 'upcoming') && (
                                                        <button 
                                                            onClick={() => closeForm(form._id)}
                                                            className="flex flex-col items-center justify-center text-amber-500/70 hover:text-amber-400 transition group/btn"
                                                            title="Close Form"
                                                        >
                                                            <span className="text-2xl group-hover/btn:scale-110 group-hover/btn:drop-shadow-[0_0_8px_rgba(245,158,11,0.8)] transition-all">✕</span>
                                                            <span className="text-[10px] font-bold mt-1">Close</span>
                                                        </button>
                                                    )}
                                                    <button 
                                                        onClick={() => deleteForm(form._id)}
                                                        className="flex flex-col items-center justify-center text-rose-500/70 hover:text-rose-400 transition group/btn ml-2"
                                                        title="Delete Form"
                                                    >
                                                        <span className="text-2xl group-hover/btn:scale-110 group-hover/btn:drop-shadow-[0_0_8px_rgba(244,63,94,0.8)] transition-all">🗑</span>
                                                        <span className="text-[10px] font-bold mt-1">Delete</span>
                                                    </button>
                                                </div>
                                            </div>
                                        )})}
                                    </div>
                                )
                            ) : (
                                Object.keys(groupedResponses).length === 0 ? (
                                    <p className="text-gray-500 text-center py-8">No feedback responses yet.</p>
                                ) : expandedSubject ? (
                                    <div>
                                        <button
                                            onClick={() => setExpandedSubject(null)}
                                            className="flex items-center gap-2 text-cyan-500 hover:text-cyan-400 font-medium mb-4 transition"
                                        >
                                            ← Back to Subjects
                                        </button>
                                        <h3 className="text-3xl font-black text-white mb-2 tracking-wide text-glow-cyan">
                                            {groupedResponses[expandedSubject]?.title}
                                        </h3>
                                        <p className="text-cyan-500/80 text-sm font-bold tracking-widest uppercase mb-6 flex items-center gap-2">
                                            <span>👨‍🏫 {groupedResponses[expandedSubject]?.professorName}</span>
                                            <span className="text-cyan-900/50">•</span>
                                            <span>{groupedResponses[expandedSubject]?.responses.length} response(s)</span>
                                        </p>
                                        <div className="flex gap-3 mb-8">
                                            <button
                                                onClick={() => approveAll(expandedSubject, true)}
                                                className="px-4 py-2 bg-emerald-900/40 border border-emerald-500/50 text-emerald-400 hover:bg-emerald-800 hover:text-white text-sm font-bold uppercase tracking-wider rounded-lg transition shadow-[0_0_10px_rgba(0,255,102,0.1)] hover:shadow-neon-emerald"
                                            >
                                                ✅ Approve All
                                            </button>
                                            <button
                                                onClick={() => approveAll(expandedSubject, false)}
                                                className="px-4 py-2 bg-rose-900/40 border border-rose-500/50 text-rose-400 hover:bg-rose-800 hover:text-white text-sm font-bold uppercase tracking-wider rounded-lg transition shadow-[0_0_10px_rgba(244,63,94,0.1)] hover:shadow-[0_0_15px_rgba(244,63,94,0.4)]"
                                            >
                                                ❌ Revoke All
                                            </button>
                                        </div>

                                        {/* Analytics Panel */}
                                        <div className="mb-8 p-4 bg-[#0a0f18]/80 border border-cyan-900/50 rounded-xl">
                                            <AnalyticsPanel responses={groupedResponses[expandedSubject]?.responses || []} />
                                        </div>

                                        <div className="space-y-4">
                                            {groupedResponses[expandedSubject]?.responses.map((response, idx) => (
                                                <div key={response._id} className={`border rounded-xl bg-[#0f172a] overflow-hidden transition-all duration-300 ${response.approvedForTeacher ? 'border-emerald-500/50 shadow-[0_0_10px_rgba(0,255,102,0.1)]' : 'border-gray-700 hover:border-cyan-500/30'}`}>
                                                    <div className={`flex justify-between items-center px-5 py-3 text-white border-b ${response.approvedForTeacher ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-[#1e293b]/50 border-gray-700'}`}>
                                                        <span className="font-bold text-lg text-gray-200">📝 RESPONSE #{idx + 1}</span>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-xs text-cyan-500/80 font-mono">
                                                                {new Date(response.submittedAt).toLocaleString()}
                                                            </span>
                                                            <button
                                                                onClick={() => toggleApproval(response._id)}
                                                                className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all duration-300 border ${response.approvedForTeacher ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 hover:bg-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/50 hover:bg-amber-500/30 hover:shadow-[0_0_10px_rgba(245,158,11,0.2)]'}`}
                                                            >
                                                                {response.approvedForTeacher ? '✅ Approved' : '👆 Approve'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="p-5 space-y-6 bg-gradient-to-b from-transparent to-[#0a0f18]/30">
                                                        {(() => {
                                                            const sections = {};
                                                            response.answers?.forEach(ans => {
                                                                const sec = getSection(ans);
                                                                if (!sections[sec]) sections[sec] = [];
                                                                sections[sec].push(ans);
                                                            });
                                                            return Object.entries(sections).map(([section, answers]) => (
                                                                <div key={section} className="space-y-3">
                                                                    <h4 className="text-sm font-bold text-cyan-400 uppercase tracking-widest bg-cyan-900/20 px-3 py-2 rounded border-l-2 border-cyan-500 inline-block">
                                                                        {section === 'Organization' ? 'Subject Feedback' : section}
                                                                    </h4>
                                                                    <div className="grid gap-2 pl-2">
                                                                        {answers.map((ans, i) => (
                                                                            <div key={i} className="flex justify-between items-start py-2 border-b border-gray-800/50 last:border-0 text-sm">
                                                                                <span className="text-gray-400 flex-1 pr-4 leading-relaxed">{ans.questionText}</span>
                                                                                <span className="font-bold text-gray-200 text-right min-w-[60px] bg-[#1e293b] px-2 py-1 rounded border border-gray-700">{ans.answer || '—'}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ));
                                                        })()}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {Object.entries(groupedResponses).map(([formId, group]) => (
                                            <div
                                                key={formId}
                                                onClick={() => setExpandedSubject(formId)}
                                                className="bg-[#1e293b]/60 border border-indigo-500/30 p-6 rounded-xl hover:bg-[#1e293b] hover:border-purple-500/50 hover:shadow-neon-purple cursor-pointer transition-all duration-300 group"
                                            >
                                                <h3 className="font-bold text-xl text-gray-200 group-hover:text-purple-300 transition-colors">{group.title}</h3>
                                                <p className="text-gray-400 text-sm mt-1 flex items-center gap-2">
                                                    <span>👨‍🏫</span> {group.professorName}
                                                </p>
                                                <p className="text-purple-400 font-bold text-sm mt-3 tracking-wider">
                                                    {group.responses.length} RESPONSE(S)
                                                </p>
                                                <div className="mt-4 pt-4 border-t border-gray-700/50 flex justify-between items-center">
                                                    <p className="text-xs text-gray-500 uppercase tracking-widest group-hover:text-gray-400">Click to expand</p>
                                                    <span className="text-purple-500 group-hover:translate-x-1 transition-transform">→</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
