import { useState, useEffect } from 'react';
import Navbar from './Navbar';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Identity } from '@semaphore-protocol/identity';
import { Group } from '@semaphore-protocol/group';
import { generateProof } from '@semaphore-protocol/proof';
import { BrowserProvider, Contract } from 'ethers';
import FeedbackABI from '../abis/Feedback.json';

const StudentDashboard = () => {
    const [identity, setIdentity] = useState(null);
    const [forms, setForms] = useState([]);
    const [submittedFormIds, setSubmittedFormIds] = useState([]);
    const [selectedForm, setSelectedForm] = useState(null);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');

    // Constants
    const GROUP_ID = 1;
    const CONTRACT_ADDRESS = "0xExampleAddress";

    useEffect(() => {
        const savedIdentity = localStorage.getItem('blockFeedback_identity');
        if (savedIdentity) {
            setIdentity(new Identity(savedIdentity));
        }
        fetchForms();
        fetchSubmittedForms();
    }, []);

    const fetchForms = async () => {
        try {
            const userId = localStorage.getItem('userId');
            const url = userId 
                ? `${import.meta.env.VITE_API_URL}/api/feedback/all?studentId=${userId}`
                : `${import.meta.env.VITE_API_URL}/api/feedback/all`;
            
            const res = await axios.get(url);
            setForms(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchSubmittedForms = async () => {
        try {
            const userId = localStorage.getItem('userId');
            if (userId) {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/feedback/submitted/${userId}`);
                setSubmittedFormIds(res.data.submittedFormIds || []);
            }
        } catch (err) {
            console.error(err);
        }
    };


    const createIdentity = async () => {
        const newIdentity = new Identity();
        setIdentity(newIdentity);
        localStorage.setItem('blockFeedback_identity', newIdentity.toString());

        try {
            const userId = localStorage.getItem('userId');
            await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/add-student-identity`, {
                userId,
                identityCommitment: newIdentity.commitment.toString()
            });
            toast.success('Identity Created & Sent for Verification!');
        } catch (err) {
            console.error(err);
            toast.error('Failed to send identity to server');
        }
    };

    const handleAnswerChange = (questionId, value) => {
        setAnswers({ ...answers, [questionId]: value });
    };

    const submitFeedback = async (e) => {
        e.preventDefault();
        if (!identity) { toast.error('Create Identity first'); return; }
        if (!selectedForm) return;

        setLoading(true);
        setStatus('Generating Proof...');

        try {
            // Prepare answers for DB
            const formattedAnswers = selectedForm.questions.map(q => ({
                questionId: q._id,
                questionText: q.text,
                answer: answers[q._id],
                section: q.section || 'General'
            }));

            // 1. ZK Proof Generation (Mocked for now as we don't have full chain setup)
            // const group = new Group(GROUP_ID);
            // group.addMember(identity.commitment);
            // const fullProof = await generateProof(identity, group, BigInt(GROUP_ID), 1);

            console.log("Mocking ZK Proof generation...");
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay

            setStatus('Submitting to Server...');

            // 2. Submit to Backend
            await axios.post(`${import.meta.env.VITE_API_URL}/api/feedback/submit`, {
                formId: selectedForm._id,
                answers: formattedAnswers,
                studentId: localStorage.getItem('userId') // Optional
            });

            // 3. Mock Blockchain Transaction
            console.log("Mocking Blockchain Transaction...");
            // if (window.ethereum) { ... }

            setStatus('Feedback Submitted Successfully!');
            toast.success('Feedback Submitted Successfully!');

            // Add this form to submitted list so it shows as completed
            setSubmittedFormIds(prev => [...prev, selectedForm._id]);

            setSelectedForm(null);
            setAnswers({});

        } catch (err) {
            console.error(err);
            const errorMsg = err.response?.data?.msg || err.response?.data || err.message;
            setStatus('Submission Failed: ' + errorMsg);
            toast.error('Submission Failed: ' + errorMsg);
        } finally {
            setLoading(false);
        }
    };


    return (
        <>
            <Navbar />
            
            {/* Anonymous Confidence Banner */}
            <div className="bg-emerald-900/40 border-b border-emerald-500/50 text-emerald-100 shadow-[0_0_15px_rgba(0,255,102,0.1)] px-4 py-3 sticky top-0 z-10 flex items-center justify-center gap-3 text-sm font-bold tracking-widest uppercase">
                <span className="text-lg drop-shadow-[0_0_8px_rgba(0,255,102,0.8)]">🔒</span>
                Your feedback is 100% anonymous and encrypted. Teachers cannot see who submitted this.
            </div>

            <div className="min-h-screen p-8 bg-[#0a0f18] text-gray-200">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-4xl font-black text-cyan-400 mb-8 flex items-center gap-3 tracking-wider text-glow-cyan">
                        <span>🎓</span> Student Dashboard
                    </h1>

                    {/* Identity Section */}
                    <div className="p-6 bg-[#0f172a]/50 rounded-xl border border-blue-900/50 shadow-neon-blue mb-8 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition"></div>
                        <h2 className="text-sm font-bold text-blue-300 tracking-widest uppercase mb-4">Your Anonymous Identity</h2>
                        {identity ? (
                            <div className="bg-[#1e293b]/60 border border-emerald-500/30 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div className="flex items-center gap-3">
                                    <span className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 shadow-[0_0_8px_rgba(0,255,102,0.8)]"></span>
                                    </span>
                                    <p className="text-emerald-400 font-bold uppercase tracking-wider">Identity Active</p>
                                </div>
                                <p className="text-xs text-blue-400/70 font-mono truncate max-w-full sm:max-w-[50%] bg-[#0a0f18] px-3 py-2 rounded border border-blue-900">{identity.commitment.toString()}</p>
                            </div>
                        ) : (
                            <button
                                onClick={createIdentity}
                                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-900/80 to-blue-800/80 hover:from-blue-800 hover:to-blue-700 text-blue-100 rounded-lg border border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)] transition font-bold tracking-wider uppercase text-sm flex items-center justify-center gap-2"
                            >
                                <span>🔑</span> Generate & Register Identity
                            </button>
                        )}
                    </div>

                    {/* Feedback Forms List */}
                    {!selectedForm ? (
                        <div className="p-6 bg-[#0f172a]/50 rounded-xl border border-cyan-900/50 shadow-[0_0_15px_rgba(0,255,255,0.05)_inset]">
                            <h2 className="text-sm font-bold text-cyan-300 tracking-widest uppercase mb-6 border-b border-cyan-900/30 pb-2">Available Feedback Forms</h2>
                            {forms.filter(form => !form.endDate || new Date() <= new Date(form.endDate)).length === 0 ? (
                                <p className="text-cyan-500/50 font-bold uppercase tracking-widest text-center py-8">No active forms available.</p>
                            ) : (
                                <div className="space-y-4">
                                    {forms
                                        .filter(form => !form.endDate || new Date() <= new Date(form.endDate))
                                        .map(form => {
                                            const isSubmitted = submittedFormIds.includes(form._id);
                                            const hasStarted = !form.startDate || new Date() >= new Date(form.startDate);

                                            const handleStartClick = () => {
                                                if (!hasStarted) {
                                                    const formattedDate = new Date(form.startDate).toLocaleString();
                                                    toast.error(`Feedback for this subject opens on ${formattedDate}`);
                                                    return;
                                                }
                                                setSelectedForm(form);
                                            };
                                            return (
                                                <div key={form._id} className={`p-5 rounded-xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all duration-300 group ${isSubmitted ? 'bg-emerald-900/10 border-emerald-500/30 shadow-[0_0_10px_rgba(0,255,102,0.05)_inset]' : 'bg-[#1e293b]/60 border-cyan-500/30 hover:bg-[#1e293b] hover:border-cyan-400/60 shadow-neon-cyan'}`}>
                                                    <div className="flex-1">
                                                        <h3 className={`font-black tracking-wider text-xl mb-1 transition-colors ${isSubmitted ? 'text-gray-400' : 'text-gray-200 group-hover:text-cyan-300'}`}>{form.title}</h3>
                                                        <p className="text-gray-400 text-sm mb-2 leading-relaxed">{form.description}</p>
                                                        {form.assignedFaculty && (
                                                            <p className="text-indigo-400 text-xs font-bold tracking-widest uppercase mb-3">
                                                                PROF: <span className="text-gray-300">{form.assignedFaculty.name}</span>
                                                            </p>
                                                        )}
                                                        {(form.startDate || form.endDate) && (
                                                            <div className="text-[10px] font-bold text-cyan-500/70 bg-cyan-900/20 px-2 py-1 rounded inline-block uppercase tracking-wider border border-cyan-900/50">
                                                                ⏱️ Window: {form.startDate ? new Date(form.startDate).toLocaleDateString() : 'Now'} - {form.endDate ? new Date(form.endDate).toLocaleDateString() : 'Anytime'}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="w-full md:w-auto text-right md:text-left mt-2 md:mt-0">
                                                        {isSubmitted ? (
                                                            <span className="inline-block px-4 py-2 bg-emerald-900/40 border border-emerald-500/50 text-emerald-400 rounded text-xs font-bold uppercase tracking-wider shadow-[0_0_8px_rgba(0,255,102,0.2)]">
                                                                ✅ Completed
                                                            </span>
                                                        ) : (
                                                            <button
                                                                onClick={handleStartClick}
                                                                className={`w-full md:w-auto px-6 py-2.5 rounded border text-xs font-bold uppercase tracking-widest transition-all ${hasStarted ? 'bg-cyan-900/40 text-cyan-400 border-cyan-500/50 hover:bg-cyan-800 hover:text-white shadow-[0_0_10px_rgba(0,255,255,0.2)] hover:shadow-neon-cyan hover:scale-105' : 'bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed'}`}
                                                            >
                                                                {hasStarted ? 'Start Form' : 'Upcoming'}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            )}
                        </div>
                    ) : (
                        // Selected Form View
                        <div className="p-8 bg-[#0f172a]/80 backdrop-blur-md rounded-xl shadow-[0_0_20px_rgba(0,255,255,0.05)_inset] border border-cyan-900/50">
                            {/* Header */}
                            <div className="text-center mb-10 border-b border-cyan-900/30 pb-8 relative">
                                <div className="absolute top-0 right-0 p-2 opacity-10 blur-xl bg-cyan-500 w-32 h-32 rounded-full pointer-events-none"></div>
                                <h2 className="text-4xl font-black text-white mb-3 tracking-wider text-glow-cyan">{selectedForm.title}</h2>
                                <p className="text-gray-400 font-medium max-w-2xl mx-auto leading-relaxed">{selectedForm.description}</p>
                                {selectedForm.assignedFaculty && (
                                    <p className="text-indigo-400 font-bold tracking-widest uppercase mt-4 text-sm bg-indigo-900/20 inline-block px-4 py-1.5 rounded-full border border-indigo-500/30">
                                        Professor: <span className="text-indigo-200">{selectedForm.assignedFaculty.name}</span>
                                    </p>
                                )}
                                <div className="mt-8 flex justify-between items-center text-xs font-bold uppercase tracking-widest text-gray-500">
                                    <span className="bg-[#1e293b] px-3 py-1.5 rounded font-mono">📅 {new Date().toLocaleDateString()}</span>
                                    <button onClick={() => setSelectedForm(null)} className="text-rose-500 hover:text-rose-400 transition-colors border border-rose-500/30 px-4 py-1.5 rounded hover:bg-rose-500/10 hover:shadow-[0_0_10px_rgba(244,63,94,0.3)]">Cancel & Go Back</button>
                                </div>
                            </div>

                            <form onSubmit={submitFeedback} className="space-y-12 relative z-10">
                                {/* Group questions by section */}
                                {Object.entries(selectedForm.questions.reduce((acc, q) => {
                                    const section = q.section || 'General';
                                    if (!acc[section]) acc[section] = [];
                                    acc[section].push(q);
                                    return acc;
                                }, {})).map(([section, questions]) => (
                                    <div key={section} className="space-y-6">
                                        <h3 className="text-lg font-bold text-cyan-400 uppercase tracking-widest bg-cyan-900/20 px-4 py-2.5 rounded border-l-2 border-cyan-500 inline-block drop-shadow-[0_0_8px_rgba(0,255,255,0.3)]">
                                            {section === 'Organization' ? 'Subject Feedback' : section}
                                        </h3>
                                        {(section.includes('Presentation') || section.includes('Lab Component')) && (
                                            <p className="text-amber-400 text-xs font-bold tracking-widest uppercase px-4 py-2 bg-amber-900/20 rounded border border-amber-500/30 flex items-center gap-2 max-w-fit">
                                                <span className="text-lg">⚠</span> Fill this section if Lab Component is present
                                            </p>
                                        )}

                                        {/* Grid Layout for specific sections */}
                                        {(section === 'Organization' || section.includes('Lab Component') || section.includes('Presentation and Interaction')) ? (
                                            <div className="overflow-x-auto rounded-xl border border-gray-800 shadow-[0_0_15px_rgba(0,0,0,0.5)_inset]">
                                                <table className="w-full text-sm text-left whitespace-nowrap md:whitespace-normal">
                                                    <thead className="text-xs text-gray-400 uppercase tracking-widest bg-[#1e293b]/80 border-b border-gray-800">
                                                        <tr>
                                                            <th className="px-6 py-4 w-1/2 font-bold">Question Details</th>
                                                            {[5, 4, 3, 2, 1].map(num => (
                                                                <th key={num} className="px-3 py-4 text-center font-bold">{num}</th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {questions.map((q) => (
                                                            <tr key={q._id} className="bg-[#0f172a]/60 border-b border-gray-800/50 hover:bg-[#1e293b]/60 transition-colors">
                                                                <td className="px-6 py-4 font-medium text-gray-300 leading-relaxed max-w-md whitespace-normal">
                                                                    {q.text}
                                                                </td>
                                                                {[5, 4, 3, 2, 1].map(num => (
                                                                        <td key={num} className="px-3 py-4 text-center">
                                                                            <label className="relative flex items-center justify-center p-3 rounded-lg cursor-pointer group transition-all duration-300 w-full h-full border border-transparent has-[:checked]:border-cyan-400 has-[:checked]:bg-cyan-900/30 has-[:checked]:shadow-neon-cyan hover:bg-white/5">
                                                                                <input
                                                                                    type="radio"
                                                                                    name={q._id}
                                                                                    required={section.includes('Presentation') || section.includes('Lab Component') ? false : q.required}
                                                                                    value={num}
                                                                                    checked={answers[q._id] == num}
                                                                                    onChange={(e) => handleAnswerChange(q._id, e.target.value)}
                                                                                    className="sr-only"
                                                                                />
                                                                                <span className="text-gray-500 font-bold group-has-[:checked]:text-cyan-400 group-has-[:checked]:text-glow-cyan transition-colors">{num}</span>
                                                                            </label>
                                                                        </td>
                                                                ))}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            // Standard List Layout for other sections
                                            <div className="grid gap-6">
                                                {questions.map((q) => (
                                                    <div key={q._id} className="bg-[#1e293b]/40 p-6 rounded-xl border border-gray-800 hover:border-cyan-900/50 transition-colors shadow-sm">
                                                        <label className="block text-gray-200 mb-4 font-medium leading-relaxed">{q.text}</label>
                                                        {q.type === 'score' ? (
                                                            <div className="flex flex-wrap gap-4 mt-4">
                                                                {[1, 2, 3, 4, 5].map(n => (
                                                                    <label key={n} className="flex items-center justify-center w-12 h-12 cursor-pointer group rounded-xl border border-gray-700 bg-[#0f172a] hover:border-cyan-500/50 hover:bg-white/5 transition-all duration-300 has-[:checked]:border-cyan-400 has-[:checked]:bg-cyan-900/40 has-[:checked]:shadow-neon-cyan has-[:checked]:scale-105">
                                                                        <input
                                                                            type="radio"
                                                                            name={q._id}
                                                                            required={q.required}
                                                                            value={n}
                                                                            checked={answers[q._id] == n}
                                                                            onChange={(e) => handleAnswerChange(q._id, e.target.value)}
                                                                            className="sr-only"
                                                                        />
                                                                        <span className="text-gray-500 font-black text-lg group-has-[:checked]:text-cyan-400 group-has-[:checked]:text-glow-cyan transition-colors">{n}</span>
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        ) : q.type === 'choice' ? (
                                                            <div className="flex flex-wrap gap-4 mt-4">
                                                                {q.options && q.options.map(opt => (
                                                                    <label key={opt} className="flex items-center gap-3 cursor-pointer group py-3 px-5 border border-gray-700 bg-[#0f172a] rounded-xl hover:border-indigo-500/50 hover:bg-white/5 transition-all duration-300 has-[:checked]:border-indigo-400 has-[:checked]:bg-indigo-900/30 has-[:checked]:shadow-[0_0_15px_rgba(99,102,241,0.2)] has-[:checked]:-translate-y-1">
                                                                        <input
                                                                            type="radio"
                                                                            name={q._id}
                                                                            required={q.required}
                                                                            value={opt}
                                                                            checked={answers[q._id] === opt}
                                                                            onChange={(e) => handleAnswerChange(q._id, e.target.value)}
                                                                            className="sr-only"
                                                                        />
                                                                        {/* Indicator Light */}
                                                                        <div className="w-2 h-2 rounded-full bg-gray-600 group-has-[:checked]:bg-indigo-400 group-has-[:checked]:shadow-[0_0_8px_rgba(99,102,241,0.8)] transition-all"></div>
                                                                        <span className="text-gray-400 group-has-[:checked]:text-indigo-400 font-bold transition-colors">{opt}</span>
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <textarea
                                                                className="w-full p-4 bg-[#0a0f18] border border-gray-700 rounded-lg text-gray-200 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all shadow-[0_0_15px_rgba(0,0,0,0.5)_inset] placeholder-gray-600"
                                                                rows="4"
                                                                placeholder="Type your answer here..."
                                                                required={q.required}
                                                                onChange={(e) => handleAnswerChange(q._id, e.target.value)}
                                                            />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}

                                <div className="pt-8 border-t border-cyan-900/30 mt-12 mb-4">
                                    <button
                                        type="submit"
                                        disabled={loading || !identity}
                                        className={`w-full py-4 rounded-xl text-white font-black text-lg uppercase tracking-widest shadow-md transition-all duration-300 border ${loading || !identity ? 'bg-[#1e293b] text-gray-600 border-gray-700 cursor-not-allowed' : 'bg-gradient-to-r from-emerald-900/80 to-emerald-800/80 border-emerald-500/50 text-emerald-100 hover:text-white hover:from-emerald-800 hover:to-emerald-700 hover:shadow-neon-emerald hover:scale-[1.01]'}`}
                                    >
                                        {loading ? (
                                            <span className="flex items-center justify-center gap-3">
                                                <svg className="animate-spin h-6 w-6 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                <span className="text-emerald-500 font-bold">{status}</span>
                                            </span>
                                        ) : 'Submit Confidential Feedback'}
                                    </button>
                                    <p className="text-center text-emerald-500/50 text-xs font-bold uppercase tracking-widest mt-6 flex items-center justify-center gap-2">
                                        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(0,255,102,0.8)]"></span>
                                        Identity encrypted via Zero-Knowledge Proofs
                                    </p>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default StudentDashboard;
