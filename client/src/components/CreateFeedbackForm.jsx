import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const CreateFeedbackForm = () => {
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [questions, setQuestions] = useState([]);
    const [newQuestionText, setNewQuestionText] = useState('');
    const [newQuestionType, setNewQuestionType] = useState('text');
    const [newQuestionSection, setNewQuestionSection] = useState('General');

    // Dates & Elective Constraints
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [allowedEmails, setAllowedEmails] = useState([]);

    // Faculty Assignment
    const [facultyList, setFacultyList] = useState([]);
    const [assignedFaculty, setAssignedFaculty] = useState('');



    useEffect(() => {
        const fetchFaculty = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/feedback/faculty-list`);
                setFacultyList(res.data);
            } catch (err) {
                console.error("Failed to fetch faculty list", err);
            }
        };
        fetchFaculty();
    }, []);

    const loadStandardTemplate = () => {

        const orgQuestions = [
            { text: 'Objectives and plan of the subject were specified', type: 'score', section: 'Subject Feedback', predefined: true },
            { text: 'Coverage and depth of the subject was', type: 'score', section: 'Subject Feedback', predefined: true },
            { text: 'Pace of teaching / learning and communication skill were', type: 'score', section: 'Subject Feedback', predefined: true },
            { text: 'The topics provided new knowledge was', type: 'score', section: 'Subject Feedback', predefined: true },
            { text: 'Prescribed reading material was available', type: 'score', section: 'Subject Feedback', predefined: true },
            { text: 'In terms of organization, clarity and presentation of the fundamental concepts, the lectures were', type: 'score', section: 'Subject Feedback', predefined: true },
            { text: 'Instructor\'s oral presentation in terms of audibility and articulation was', type: 'score', section: 'Subject Feedback', predefined: true },
            { text: 'Instructor\'s whiteboard (or ppt) presentation in terms of organization and legibility was', type: 'score', section: 'Subject Feedback', predefined: true },
            { text: 'Encouragements given by the instructor to think and reason, logically and objectively was', type: 'score', section: 'Subject Feedback', predefined: true },
            { text: 'Instructor\'s response to the questions asked in the class was', type: 'score', section: 'Subject Feedback', predefined: true },
            { text: 'The availability and approachability of instructors outside class was', type: 'score', section: 'Subject Feedback', predefined: true },
            { text: 'Instructor\'s attitude towards teaching of this course was', type: 'score', section: 'Subject Feedback', predefined: true },
            { text: 'The overall quality of the teaching was', type: 'score', section: 'Subject Feedback', predefined: true },
        ];

        const labQuestions = [
            { text: 'The experiments provided new insights', type: 'score', section: 'Presentation and Interaction (Lab Component - Optional)', predefined: true },
            { text: 'Handouts / lab manuals were available', type: 'score', section: 'Presentation and Interaction (Lab Component - Optional)', predefined: true },
            { text: 'Methodical / systematic work was emphasized', type: 'score', section: 'Presentation and Interaction (Lab Component - Optional)', predefined: true },
            { text: 'Your presentation before going to the laboratory was', type: 'score', section: 'Presentation and Interaction (Lab Component - Optional)', predefined: true },
            { text: 'Instructor\'s feedback on your report was prompt', type: 'score', section: 'Presentation and Interaction (Lab Component - Optional)', predefined: true },
            { text: 'During the lab session, your interaction with the instructor was useful', type: 'score', section: 'Presentation and Interaction (Lab Component - Optional)', predefined: true },
            { text: 'Encouragement given by the instructor to think and be creative was', type: 'score', section: 'Presentation and Interaction (Lab Component - Optional)', predefined: true },
            { text: 'Overall, the laboratory experience was', type: 'score', section: 'Presentation and Interaction (Lab Component - Optional)', predefined: true },
        ];

        const generalQuestions = [
            { text: 'Would you rate this subject as one of the Five best subjects you had so far?', type: 'choice', options: ['Yes', 'No'], section: 'General Comments', predefined: true },
            { text: 'The work load in this subject in comparison to the subjects this semester was', type: 'choice', options: ['Very little', 'Just right', 'Too heavy'], section: 'General Comments', predefined: true },
            { text: 'Were the lectures held regularly and on time?', type: 'choice', options: ['Yes', 'No'], section: 'General Comments', predefined: true },
            { text: 'What did you like / dislike about this subject?', type: 'text', section: 'General Comments', predefined: true },
            { text: 'In additional to the class hours, how many hours per week did you put in?', type: 'text', section: 'General Comments', predefined: true },
            { text: 'Please give additional comments to improve the subject further', type: 'text', section: 'General Comments', predefined: true }
        ];

        // Always include all sections - lab is optional for students
        setQuestions([...orgQuestions, ...labQuestions, ...generalQuestions]);
    };

    // Load template by default on mount
    useEffect(() => { loadStandardTemplate(); }, []);

    const addQuestion = () => {
        if (!newQuestionText) return;
        setQuestions([...questions, { text: newQuestionText, type: newQuestionType, section: newQuestionSection }]);
        setNewQuestionText('');
    };

    const removeQuestion = (index) => {
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target.result;
            // Regex to match anything that looks like an email address anywhere in the text
            const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
            const foundEmails = text.match(emailRegex) || [];
            
            // Deduplicate and convert to lowercase
            const uniqueEmails = [...new Set(foundEmails.map(e => e.toLowerCase()))];
            
            setAllowedEmails(uniqueEmails);
            toast.success(`Found and added ${uniqueEmails.length} valid student emails from CSV!`);
        };
        reader.readAsText(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (allowedEmails.length === 0) {
            const confirmPublic = window.confirm("You haven't uploaded a student email CSV. This means ALL students on campus will be able to see and submit this form. Are you sure you want to proceed?");
            if (!confirmPublic) return;
        }

        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/feedback/create`, {
                title,
                description,
                questions,
                assignedFaculty,
                startDate: startDate || undefined,
                endDate: endDate || undefined,
                allowedEmails: allowedEmails.length > 0 ? allowedEmails : undefined
            });
            toast.success('Feedback Form Created Successfully!');
            navigate('/admin');
        } catch (err) {
            console.error(err);
            toast.error('Failed to create form');
        }
    };

    return (
        <div className="min-h-screen p-8 bg-[#0a0f18] text-gray-200">
            <div className="max-w-4xl mx-auto bg-[#0f172a]/80 backdrop-blur-xl rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-emerald-900/50 p-8 relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none"></div>
                <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>

                <div className="flex justify-between items-center mb-10 border-b border-gray-800 pb-6 relative z-10">
                    <h1 className="text-4xl font-black text-emerald-400 tracking-wider text-glow-emerald">
                        Create Feedback Form
                    </h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                    <div className="bg-[#1e293b]/40 p-6 rounded-xl border border-gray-800 hover:border-emerald-900/50 transition-colors shadow-sm">
                        <label className="block text-xs font-bold text-emerald-400 uppercase tracking-widest mb-3">Form Title (Subject Name)</label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-3 bg-[#0a0f18] text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-inner transition-colors placeholder-gray-600"
                            placeholder="e.g. Advanced AI (Code: CS501)"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="bg-[#1e293b]/40 p-6 rounded-xl border border-gray-800 hover:border-emerald-900/50 transition-colors shadow-sm">
                        <label className="block text-xs font-bold text-emerald-400 uppercase tracking-widest mb-3">Assign Subject Professor</label>
                        <select
                            className="w-full px-4 py-3 bg-[#0a0f18] text-gray-200 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-inner appearance-none custom-select"
                            value={assignedFaculty}
                            onChange={(e) => setAssignedFaculty(e.target.value)}
                        >
                            <option value="" className="bg-[#0a0f18]">-- Select Professor --</option>
                            {facultyList.map(f => (
                                <option key={f._id} value={f._id} className="bg-[#0a0f18] text-gray-200">{f.name} ({f.email})</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#1e293b]/40 p-6 rounded-xl border border-gray-800 hover:border-emerald-900/50 transition-colors shadow-sm">
                        <div>
                            <label className="block text-xs font-bold text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-2"><span>🕒</span> Start Date & Time (Optional)</label>
                            <input
                                type="datetime-local"
                                className="w-full px-4 py-3 bg-[#0a0f18] text-gray-200 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-inner [color-scheme:dark]"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                            <p className="text-xs text-gray-500 mt-2 font-medium">When should students be able to start submitting?</p>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-2"><span>⌛</span> End Date & Time (Optional)</label>
                            <input
                                type="datetime-local"
                                className="w-full px-4 py-3 bg-[#0a0f18] text-gray-200 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-inner [color-scheme:dark]"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                            <p className="text-xs text-gray-500 mt-2 font-medium">When should the form expire and disappear?</p>
                        </div>
                    </div>

                    <div className="bg-[#1e293b]/40 p-6 rounded-xl border border-cyan-900/50 hover:border-cyan-500/50 transition-colors shadow-[0_0_15px_rgba(0,255,255,0.02)_inset]">
                        <label className="block text-sm font-black text-cyan-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <span>🎯</span> Specific Student Targeting (Elective Subjects)
                        </label>
                        <p className="text-xs text-gray-400 mb-4 leading-relaxed max-w-2xl">
                            Upload a CSV file containing student emails. Only these students will be able to see and submit this form. If left empty, <strong>all</strong> students will see it.
                        </p>
                        <input 
                            type="file" 
                            accept=".csv, .txt" 
                            onChange={handleFileUpload}
                            className="block w-full text-sm text-gray-400 file:mr-4 file:py-2.5 file:px-6 file:rounded-lg file:border-0 file:text-xs file:font-bold file:uppercase file:tracking-wider file:bg-cyan-900/40 file:text-cyan-400 hover:file:bg-cyan-800/60 file:transition-colors file:cursor-pointer hover:file:shadow-neon-cyan border border-gray-800 rounded-lg p-2 bg-[#0a0f18]"
                        />
                        {allowedEmails.length > 0 && (
                            <div className="mt-4 p-4 bg-emerald-900/20 border border-emerald-500/30 rounded-lg shadow-[0_0_10px_rgba(0,255,102,0.1)_inset]">
                                <p className="text-sm font-bold text-emerald-400 flex items-center gap-3 tracking-wide">
                                    <span className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 shadow-[0_0_8px_rgba(0,255,102,0.8)]"></span>
                                    </span>
                                    Targeting activated for {allowedEmails.length} specific student{allowedEmails.length !== 1 ? 's' : ''}.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="bg-[#1e293b]/40 p-6 rounded-xl border border-gray-800 hover:border-emerald-900/50 transition-colors shadow-sm">
                        <label className="block text-xs font-bold text-emerald-400 uppercase tracking-widest mb-3">Description / Subject Details</label>
                        <textarea
                            className="w-full px-4 py-3 bg-[#0a0f18] text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-inner transition-colors placeholder-gray-600"
                            rows="3"
                            placeholder="Add any extra instructions or details here..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        ></textarea>
                    </div>

                    {/* Questions List */}
                    <div className="space-y-4 pt-6 border-t border-gray-800">
                        <div className="flex items-center gap-3 mb-6">
                            <h2 className="text-xl font-black text-gray-200 tracking-wider">Form Schema</h2>
                            <span className="bg-emerald-900/40 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/30">
                                {questions.length} Questions
                            </span>
                        </div>
                        
                        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {questions.map((q, i) => (
                                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#0a0f18] rounded-xl border border-gray-800 hover:border-gray-600 transition-colors group gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 bg-indigo-900/20 px-2 py-0.5 rounded border border-indigo-500/20">
                                                {q.section || 'General'}
                                            </span>
                                            <span className="text-[10px] uppercase font-bold text-gray-500">
                                                Type: <span className="text-gray-400">{q.type}</span>
                                            </span>
                                        </div>
                                        <p className="font-medium text-gray-300 leading-relaxed text-sm">{q.text}</p>
                                    </div>
                                    {!q.predefined && (
                                        <button 
                                            type="button" 
                                            onClick={() => removeQuestion(i)} 
                                            className="self-end sm:self-center bg-rose-900/20 hover:bg-rose-900/40 text-rose-400 p-2 rounded-lg border border-transparent hover:border-rose-500/30 transition-all hover:shadow-[0_0_10px_rgba(244,63,94,0.3)]"
                                            title="Remove custom question"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Add Question */}
                    <div className="p-6 bg-[#1e293b]/60 rounded-xl border border-blue-900/40 space-y-5 shadow-[0_0_15px_rgba(59,130,246,0.05)_inset]">
                        <h3 className="font-bold text-blue-400 flex items-center gap-2 tracking-wider"><span>➕</span> Add Custom Form Field</h3>
                        <input
                            type="text"
                            placeholder="Type your question here..."
                            className="w-full px-4 py-3 bg-[#0a0f18] text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-inner placeholder-gray-600"
                            value={newQuestionText}
                            onChange={(e) => setNewQuestionText(e.target.value)}
                        />
                        <div className="flex flex-col sm:flex-row gap-4">
                            <select
                                className="flex-1 px-4 py-3 bg-[#0a0f18] text-gray-300 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 custom-select"
                                value={newQuestionType}
                                onChange={(e) => setNewQuestionType(e.target.value)}
                            >
                                <option value="text" className="bg-[#0a0f18]">Long Text</option>
                                <option value="score" className="bg-[#0a0f18]">Score (1-5)</option>
                                <option value="choice" className="bg-[#0a0f18]">Choice (Yes/No)</option>
                            </select>
                            <select
                                className="flex-[2] px-4 py-3 bg-[#0a0f18] text-gray-300 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 custom-select"
                                value={newQuestionSection}
                                onChange={(e) => setNewQuestionSection(e.target.value)}
                            >
                                <option value="General" className="bg-[#0a0f18]">Section: General</option>
                                <option value="Organization" className="bg-[#0a0f18]">Section: Organization</option>
                                <option value="Presentation and Interaction (Lab Component - Optional)" className="bg-[#0a0f18]">Section: Lab Component</option>
                                <option value="General Comments" className="bg-[#0a0f18]">Section: Comments</option>
                            </select>
                            <button
                                type="button"
                                onClick={addQuestion}
                                className="flex-1 py-3 px-6 bg-blue-900/60 text-blue-300 border border-blue-500/50 rounded-lg hover:bg-blue-800 hover:text-white font-bold tracking-widest uppercase text-sm transition-all hover:shadow-neon-blue"
                            >
                                Add Field
                            </button>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-gray-800 mt-12">
                        <button
                            type="submit"
                            className="w-full py-4 bg-gradient-to-r from-emerald-900/80 to-emerald-800/80 text-emerald-100 rounded-xl font-black text-xl tracking-widest uppercase hover:from-emerald-800 hover:to-emerald-700 hover:text-white border border-emerald-500/50 hover:shadow-neon-emerald transition-all duration-300 hover:scale-[1.01]"
                        >
                            Generate & Deploy Form
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateFeedbackForm;
