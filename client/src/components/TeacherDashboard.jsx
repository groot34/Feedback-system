import { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from './Navbar';
import AnalyticsPanel from './AnalyticsPanel';
import Pagination from './Pagination';

const TeacherDashboard = () => {
    const [responses, setResponses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedSubject, setExpandedSubject] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        fetchResponses();
    }, []);

    const fetchResponses = async () => {
        try {
            const userId = localStorage.getItem('userId');
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/feedback/responses/teacher/${userId}`);
            setResponses(res.data);
        } catch (err) {
            console.error('Error fetching responses:', err);
        } finally {
            setLoading(false);
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

    // Group responses by form title
    const groupedResponses = responses.reduce((acc, r) => {
        const formTitle = r.formId?.title || 'Unknown Form';
        const formId = r.formId?._id || 'unknown';
        if (!acc[formId]) {
            acc[formId] = { title: formTitle, responses: [] };
        }
        acc[formId].responses.push(r);
        return acc;
    }, {});

    return (
        <>
            <Navbar />
            <div className="min-h-screen p-8 bg-[#0a0f18] text-gray-200">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-4xl font-black text-purple-400 mb-8 flex items-center gap-3 tracking-wider text-glow-purple">
                        <span>👩‍🏫</span> Teacher Dashboard
                    </h1>

                    <div className="bg-[#0f172a]/50 rounded-xl border border-purple-900/50 shadow-[0_0_15px_rgba(168,85,247,0.05)_inset] overflow-hidden">
                        <div className="p-6 border-b border-purple-900/30">
                            <h2 className="text-xl font-bold text-gray-100 tracking-wider">Student Feedback Responses</h2>
                            <p className="text-purple-500/70 text-sm mt-1 uppercase tracking-widest font-bold">View anonymous feedback submitted by students</p>
                        </div>

                        <div className="p-6">
                            {loading ? (
                                <p className="text-purple-500/50 text-center py-8 font-bold tracking-widest uppercase animate-pulse">Loading responses...</p>
                            ) : Object.keys(groupedResponses).length === 0 ? (
                                <p className="text-purple-500/50 text-center py-8 font-bold tracking-widest uppercase">No feedback responses yet.</p>
                            ) : expandedSubject ? (
                                <div>
                                    <button
                                        onClick={() => setExpandedSubject(null)}
                                        className="flex items-center gap-2 text-purple-500 hover:text-purple-400 font-bold tracking-wider uppercase text-sm mb-6 transition"
                                    >
                                        ← Back to Subjects
                                    </button>
                                    <h3 className="text-3xl font-black text-white mb-2 text-glow-purple tracking-wider">
                                        {groupedResponses[expandedSubject]?.title}
                                    </h3>
                                    <p className="text-purple-400/80 text-sm font-bold tracking-widest uppercase mb-8">
                                        {groupedResponses[expandedSubject]?.responses.length} response(s)
                                    </p>

                                    {/* Analytics Panel */}
                                    <AnalyticsPanel responses={groupedResponses[expandedSubject]?.responses || []} />

                                    {groupedResponses[expandedSubject]?.responses.length > 10 && (
                                        <Pagination 
                                            currentPage={currentPage}
                                            totalPages={Math.ceil(groupedResponses[expandedSubject]?.responses.length / 10)}
                                            onPageChange={setCurrentPage}
                                        />
                                    )}

                                    <div className="space-y-4 mt-6">
                                        {(groupedResponses[expandedSubject]?.responses.slice((currentPage - 1) * 10, currentPage * 10)).map((response, idx) => (
                                            <div key={response._id} className="border border-purple-500/30 rounded-xl bg-[#1e293b]/60 hover:border-purple-500/60 shadow-neon-purple transition-all overflow-hidden group">
                                                <div className="flex justify-between items-center px-5 py-4 bg-purple-900/40 border-b border-purple-500/30 text-white">
                                                    <span className="font-bold text-lg text-gray-200 tracking-wider">📝 RESPONSE #{(currentPage - 1) * 10 + idx + 1}</span>
                                                    <span className="text-xs text-purple-400 font-mono opacity-80 group-hover:opacity-100 transition-opacity">
                                                        {new Date(response.submittedAt).toLocaleString()}
                                                    </span>
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
                                                                <h4 className="text-sm font-bold text-purple-400 uppercase tracking-widest bg-purple-900/20 px-3 py-2 rounded border-l-2 border-purple-500 inline-block">
                                                                    {section === 'Organization' ? 'Subject Feedback' : section}
                                                                </h4>
                                                                <div className="grid gap-2 pl-2">
                                                                    {answers.map((ans, i) => (
                                                                        <div key={i} className="flex justify-between items-start py-2 border-b border-gray-800/50 last:border-0 text-sm">
                                                                            <span className="text-gray-400 flex-1 pr-4 leading-relaxed">{ans.questionText}</span>
                                                                            <span className="font-bold text-gray-200 text-right min-w-[60px] bg-[#0f172a] px-2 py-1 rounded border border-gray-800">{ans.answer || '—'}</span>
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

                                    {groupedResponses[expandedSubject]?.responses.length > 10 && (
                                        <Pagination 
                                            currentPage={currentPage}
                                            totalPages={Math.ceil(groupedResponses[expandedSubject]?.responses.length / 10)}
                                            onPageChange={setCurrentPage}
                                        />
                                    )}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {Object.entries(groupedResponses).map(([formId, group]) => (
                                        <div
                                            key={formId}
                                            onClick={() => { setExpandedSubject(formId); setCurrentPage(1); }}
                                            className="bg-[#1e293b]/60 border border-purple-500/30 p-6 rounded-xl hover:bg-[#1e293b] hover:border-purple-400/60 shadow-neon-purple cursor-pointer transition-all duration-300 group"
                                        >
                                            <h3 className="font-bold text-xl text-gray-200 group-hover:text-purple-300 transition-colors">{group.title}</h3>
                                            <p className="text-purple-400 font-bold tracking-wider uppercase text-sm mt-3">
                                                {group.responses.length} RESPONSE(S)
                                            </p>
                                            <p className="text-gray-500 mt-4 border-t border-gray-800/50 pt-4 uppercase tracking-widest text-xs group-hover:text-purple-400 flex justify-between items-center transition-colors">
                                                <span>Click to view</span>
                                                <span className="text-lg leading-none transform group-hover:translate-x-1 transition-transform">→</span>
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default TeacherDashboard;
