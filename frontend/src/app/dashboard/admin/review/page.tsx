'use client';

import React, { useState, useEffect } from 'react';
import {
    Activity, Check, ChevronDown, ChevronRight, Clock,
    HelpCircle, ShieldAlert, X, Calendar as CalendarIcon, ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';

export default function ReviewConsolePage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    // State
    const [loading, setLoading] = useState(true);
    const [reviewView, setReviewView] = useState<'cycles' | 'users' | 'assessment'>('cycles');
    const [cycleFilter, setCycleFilter] = useState('Active');
    const [cycles, setCycles] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [skills, setSkills] = useState<any[]>([]);

    // Selection & Assessment State
    const [selectedCycle, setSelectedCycle] = useState<any>(null);
    const [selectedReviewUser, setSelectedReviewUser] = useState<any>(null);
    const [currentReviewId, setCurrentReviewId] = useState<string | null>(null);
    const [pendingReviews, setPendingReviews] = useState<any[]>([]);

    // Form State
    const [currentSkillIdx, setCurrentSkillIdx] = useState(0);
    const [assessmentAnswers, setAssessmentAnswers] = useState<Record<string, any>>({});
    const [assessmentComments, setAssessmentComments] = useState<Record<string, string>>({});

    // Modals & Config
    const [warningModal, setWarningModal] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
    const [skipModal, setSkipModal] = useState<{ show: boolean; questionId: string | null }>({ show: false, questionId: null });
    const [validationConfig, setValidationConfig] = useState<{ tech: boolean; nonTech: boolean }>({ tech: true, nonTech: true });
    const [skipError, setSkipError] = useState(false);

    useEffect(() => {
        if (!authLoading && (!user || user.role !== 'admin')) {
            router.push('/login');
        } else if (user) {
            fetchData();
        }
    }, [user, authLoading, router]);

    const fetchData = async () => {
        try {
            const [u, c] = await Promise.all([
                apiClient.get('/users').catch(() => ({ data: { data: { users: [] } } })),
                apiClient.get('/review-cycles').catch(() => ({ data: { data: { cycles: [] } } })),
            ]);

            setUsers(u.data?.data?.users || []);

            const rawCycles = c.data?.data?.cycles || [];
            const mappedCycles = rawCycles.map((cycle: any) => {
                const now = new Date();
                const startDate = new Date(cycle.start_date || cycle.startDate);
                const endDate = new Date(cycle.end_date || cycle.endDate);
                let status = 'Pending';

                if (now > endDate) status = 'Closed';
                else if (now >= startDate) status = 'Active';

                return {
                    ...cycle,
                    name: cycle.cycle_name || cycle.name,
                    status,
                    start_date: cycle.start_date || cycle.startDate,
                    end_date: cycle.end_date || cycle.endDate
                };
            });
            setCycles(mappedCycles);

        } catch (err) {
            console.error('Fetch Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCycleSelect = async (cycle: any) => {
        setSelectedCycle(cycle);
        setLoading(true);
        try {
            const statusRes = await apiClient.get(`/feedback/status?cycle_id=${cycle.id || cycle._id}`);
            const { pending, completed } = statusRes.data.data;
            const reviewsList = [...(pending || []), ...(completed || [])].map((r: any) => ({
                ...r,
                status: r.status ? r.status.charAt(0).toUpperCase() + r.status.slice(1) : 'Pending'
            }));
            setPendingReviews(reviewsList);
            setReviewView('users');
        } catch (e) {
            console.error("Failed to fetch cycle reviews", e);
            setPendingReviews([]);
            setReviewView('users');
        } finally {
            setLoading(false);
        }
    };

    const handleStartReview = async (targetUser: any) => {
        const review = pendingReviews.find(r => (r.reviewee.id === targetUser.id || r.reviewee._id === targetUser.id));

        if (!review) {
            setWarningModal({ show: true, message: "No active review cycle found for this user." });
            return;
        }

        setSelectedReviewUser(targetUser);
        setCurrentReviewId(String(review.id || review._id));
        setReviewView('assessment');
        setCurrentSkillIdx(0);
        setLoading(true);

        try {
            const res = await apiClient.get(`/feedback/${review.id || review._id}`);
            const { form, meta, feedbackRequest } = res.data.data;

            if (meta?.validationRules) {
                setValidationConfig(meta.validationRules);
            }

            const mappedSkills = form.map((s: any) => ({
                id: String(s.id),
                name: s.skill_name,
                category: s.category,
                questions: s.questions.map((q: any) => ({
                    id: String(q.currentVersion?.id || q.current_version_id),
                    text: q.currentVersion?.question_text,
                    type: q.currentVersion?.question_type === 'scale_1_10' ? 'Rating' : 'Boolean'
                }))
            }));
            setSkills(mappedSkills);

            const initialAnswers: Record<string, any> = {};
            (feedbackRequest.answers || []).forEach((a: any) => {
                const qId = String(a.question_version_id);
                const val = Number(a.score_value);
                const question = mappedSkills.flatMap((s: any) => s.questions).find((q: any) => q.id === qId);

                if (question?.type === 'Boolean') {
                    initialAnswers[qId] = (val === 10);
                } else {
                    initialAnswers[qId] = val;
                }
            });
            setAssessmentAnswers(initialAnswers);

            const initialComments: Record<string, string> = {};
            (feedbackRequest.feedback || []).forEach((c: any) => {
                initialComments[String(c.skill_id)] = c.comment;
            });
            setAssessmentComments(initialComments);

        } catch (e: any) {
            console.error(e);
            setWarningModal({ show: true, message: "Failed to load review: " + (e.response?.data?.message || e.message) });
            setReviewView('users');
        } finally {
            setLoading(false);
        }
    };

    const validateCurrentSkill = () => {
        if (!skills[currentSkillIdx]) return true;
        const currentQuestions = skills[currentSkillIdx].questions || [];
        const missing = currentQuestions.some((q: any) => assessmentAnswers[(q.id || q._id)] === undefined);
        return !missing;
    };

    const isVectorSkipped = () => {
        if (!skills[currentSkillIdx]) return false;
        const currentQuestions = skills[currentSkillIdx].questions || [];
        if (currentQuestions.length === 0) return false;
        return currentQuestions.every((q: any) => assessmentAnswers[(q.id || q._id)] === 'Skipped');
    };

    const handleSkipVector = () => {
        const currentCat = skills[currentSkillIdx]?.category || 'Technical';
        const categoryLower = (currentCat || '').toLowerCase();
        const isTechnical = categoryLower === 'technical' || (categoryLower.includes('technical') && !categoryLower.includes('non'));
        const configKey = isTechnical ? 'tech' : 'nonTech';

        // Check validation config or default to mandatory for admins
        if (validationConfig?.[configKey] !== false) {
            setSkipError(true);
            setTimeout(() => setSkipError(false), 500);
            return;
        }

        setSkipModal({ show: true, questionId: 'VECTOR' });
    };

    const handleTriggerUndoSkip = () => {
        setSkipModal({ show: true, questionId: 'VECTOR_UNDO' });
    };

    const confirmSkip = () => {
        if (skipModal.questionId === 'VECTOR') {
            const currentQuestions = skills[currentSkillIdx].questions || [];
            const updates: Record<string, string> = {};
            currentQuestions.forEach((q: any) => {
                updates[(q.id || q._id)] = 'Skipped';
            });
            setAssessmentAnswers(prev => ({ ...prev, ...updates }));
            setSkipModal({ show: false, questionId: null });
            if (currentSkillIdx < skills.length - 1) setCurrentSkillIdx(currentSkillIdx + 1);
        } else if (skipModal.questionId === 'VECTOR_UNDO') {
            const currentQuestions = skills[currentSkillIdx].questions || [];
            const updates = { ...assessmentAnswers };
            currentQuestions.forEach((q: any) => {
                delete updates[(q.id || q._id)];
            });
            setAssessmentAnswers(updates);
            setSkipModal({ show: false, questionId: null });
        }
    };

    const handleNextVector = () => {
        if (!validateCurrentSkill()) {
            setWarningModal({
                show: true,
                message: 'Please answer all questions before proceeding.'
            });
            return;
        }

        if (!isVectorSkipped()) {
            const currentSkillId = skills[currentSkillIdx]?.id;
            const comment = assessmentComments[currentSkillId];
            if (!comment || comment.trim().length === 0) {
                setWarningModal({
                    show: true,
                    message: 'Please provide a comment for this section.'
                });
                return;
            }
        }

        if (currentSkillIdx < skills.length - 1) setCurrentSkillIdx(currentSkillIdx + 1);
    };

    const submitFeedback = async (isFinal: boolean) => {
        if (!currentReviewId) return;

        if (isFinal && !validateCurrentSkill()) {
            setWarningModal({
                show: true,
                message: 'Please answer all questions before submitting.'
            });
            return;
        }

        setLoading(true);

        const safeAnswers = Object.entries(assessmentAnswers)
            .filter(([k, v]) => v !== 'Skipped' && v !== undefined && v !== null && !isNaN(Number(k)))
            .map(([k, v]) => ({
                questionId: Number(k),
                score: typeof v === 'boolean' ? (v ? 10 : 0) : Number(v)
            }));

        const safeComments = Object.entries(assessmentComments)
            .filter(([k, v]) => !isNaN(Number(k)))
            .map(([k, v]) => ({
                skillId: Number(k),
                comment: v
            }));

        try {
            await apiClient.post(`/feedback/${currentReviewId}/submit`, {
                submit: isFinal,
                answers: safeAnswers,
                comments: safeComments
            });

            if (isFinal) {
                setWarningModal({ show: true, message: 'Evaluation captured successfully.' });
                setReviewView('cycles');
                fetchData();
            } else {
                setWarningModal({ show: true, message: 'Draft saved successfully.' });
            }
        } catch (err: any) {
            console.error('Submit Error:', err);
            setWarningModal({ show: true, message: "Submission Failed: " + (err.response?.data?.message || err.message) });
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#09090b]">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="text-sm font-black text-white/50 uppercase tracking-[0.3em] animate-pulse">Initializing Console</p>
                </div>
            </div>
        );
    }

    if (!user || user.role !== 'admin') return null;

    return (
        <div className="min-h-screen bg-[#09090b] text-white">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-screen flex flex-col">
                {/* Top Navigation Bar */}
                <div className="h-20 border-b border-white/10 px-8 flex items-center justify-between bg-black/20 backdrop-blur-xl">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => router.push('/dashboard/admin')}
                            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-xl font-black tracking-tight uppercase">Review Console</h1>
                            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Administrator Access</p>
                        </div>
                    </div>
                    {selectedCycle && reviewView !== 'cycles' && (
                        <div className="hidden md:flex items-center gap-4 px-4 py-2 bg-primary/10 border border-primary/20 rounded-lg">
                            <Clock size={14} className="text-primary" />
                            <span className="text-xs font-bold text-primary uppercase tracking-widest">{selectedCycle.name}</span>
                        </div>
                    )}
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-hidden relative">
                    {reviewView === 'cycles' && (
                        <div className="h-full overflow-y-auto p-8 sm:p-12">
                            <div className="max-w-[1600px] mx-auto">
                                <div className="flex items-end justify-between mb-10">
                                    <div>
                                        <h2 className="text-4xl font-black tracking-tight mb-2 uppercase">Review Cycles</h2>
                                        <p className="text-white/50 text-sm font-bold tracking-wide">Select an active cycle to begin evaluations</p>
                                    </div>
                                    <div className="relative">
                                        <select
                                            value={cycleFilter}
                                            onChange={(e) => setCycleFilter(e.target.value)}
                                            className="appearance-none bg-white/5 border border-white/10 rounded-xl px-6 py-3 pr-12 text-sm font-bold uppercase tracking-widest focus:outline-none focus:border-primary/50 transition-all cursor-pointer min-w-[200px]"
                                        >
                                            <option value="Active" className="bg-zinc-900 text-white">Active</option>
                                            <option value="Pending" className="bg-zinc-900 text-white">Pending</option>
                                            <option value="Closed" className="bg-zinc-900 text-white">Closed</option>
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {cycles.filter((c: any) => c.status === cycleFilter).length === 0 ? (
                                        <div className="md:col-span-2 lg:col-span-3 xl:col-span-4 py-32 flex flex-col items-center justify-center opacity-20">
                                            <Activity size={80} className="mb-6" />
                                            <p className="font-black text-xl uppercase tracking-[0.2em]">No {cycleFilter.toLowerCase()} cycles found</p>
                                        </div>
                                    ) : (
                                        cycles.filter((c: any) => c.status === cycleFilter).map((c: any) => (
                                            <div
                                                key={c._id || c.id}
                                                onClick={() => c.status === 'Active' && handleCycleSelect(c)}
                                                className={`p-8 rounded-[2rem] bg-white/5 border border-white/5 relative aspect-square flex flex-col transition-all group ${c.status === 'Active' ? 'cursor-pointer hover:border-primary/50 hover:bg-white/[0.07] hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/10' : 'opacity-60 cursor-not-allowed'}`}
                                            >
                                                <div className={`absolute top-6 right-6 inline-flex px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${c.status === 'Active'
                                                    ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                                    : c.status === 'Closed'
                                                        ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                                        : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                                    }`}>
                                                    {c.status}
                                                </div>

                                                <div className="flex-1 flex flex-col justify-end">
                                                    <div className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center text-primary shadow-xl shadow-primary/10 group-hover:rotate-6 transition-transform mb-6">
                                                        <CalendarIcon size={32} />
                                                    </div>
                                                    <h3 className="text-2xl font-black tracking-tighter leading-none mb-2">{c.name}</h3>
                                                    <div className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                                                        {new Date(c.start_date).toLocaleDateString()} - {new Date(c.end_date).toLocaleDateString()}
                                                    </div>
                                                </div>

                                                {c.status === 'Active' && (
                                                    <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between opacity-50 group-hover:opacity-100 transition-opacity">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Enter Console</span>
                                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white"><ChevronRight size={14} /></div>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {reviewView === 'users' && selectedCycle && (
                        <div className="h-full overflow-y-auto p-8 sm:p-12">
                            <div className="max-w-[1600px] mx-auto">
                                <div className="flex items-center gap-6 mb-12">
                                    <button
                                        onClick={() => setReviewView('cycles')}
                                        className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all group border border-white/5 hover:border-white/10"
                                    >
                                        <ChevronRight className="rotate-180 group-hover:-translate-x-1 transition-transform" size={24} />
                                    </button>
                                    <div>
                                        <h2 className="text-4xl font-black tracking-tight mb-2 uppercase">Target Personnel</h2>
                                        <p className="text-white/50 text-sm font-bold tracking-wide">Evaluations for: <span className="text-primary">{selectedCycle.name}</span></p>
                                    </div>
                                </div>

                                <div className="border border-white/5 rounded-[2rem] overflow-hidden bg-white/[0.02]">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 bg-white/[0.02]">
                                                <th className="py-6 pl-8 text-left">Subject Node</th>
                                                <th className="py-6 text-left">Internal Role</th>
                                                <th className="py-6 text-left">Internal Status</th>
                                                <th className="py-6 pr-8 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {pendingReviews.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} className="py-12 text-center text-white/20 font-bold uppercase tracking-widest">No review targets found</td>
                                                </tr>
                                            ) : (
                                                pendingReviews.filter((r: any) => {
                                                    const rCycleId = (r.cycle?._id || r.cycle?.id || r.cycle || r.cycle_id)?.toString();
                                                    const sCycleId = (selectedCycle?._id || selectedCycle?.id)?.toString();
                                                    return rCycleId && sCycleId ? rCycleId === sCycleId : true;
                                                }).map((review: any) => {
                                                    const u = review.reviewee || review.reviewee_id;
                                                    const userObj = typeof u === 'object' ? u : users.find((usr: any) => (usr.id || usr._id) === u) || {};
                                                    const status = review.status === 'submitted' ? 'Completed' : (review.status || 'Pending');
                                                    const isCompleted = status === 'Completed' || status === 'Submitted';

                                                    return (
                                                        <tr key={review._id || review.id} className="group hover:bg-white/5 transition-all">
                                                            <td className="py-6 pl-8 font-extrabold text-lg flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-sm font-black border border-white/10">
                                                                    {userObj.full_name?.[0] || '?'}
                                                                </div>
                                                                {userObj.full_name || 'Unknown'}
                                                            </td>
                                                            <td className="py-6 uppercase text-[10px] font-black tracking-widest text-white/40">{userObj.role || 'N/A'}</td>
                                                            <td className="py-6">
                                                                <div className={`inline-flex px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${isCompleted ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-primary/10 text-primary border-primary/20'}`}>
                                                                    {status}
                                                                </div>
                                                            </td>
                                                            <td className="py-6 pr-8 text-right">
                                                                <button
                                                                    disabled={isCompleted}
                                                                    onClick={() => handleStartReview(userObj)}
                                                                    className="px-6 py-3 bg-primary text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all disabled:opacity-10 active:scale-95 disabled:cursor-not-allowed"
                                                                >
                                                                    {isCompleted ? 'Completed' : 'Review'}
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {reviewView === 'assessment' && selectedReviewUser && (
                        <div className="h-full overflow-y-auto p-8 sm:p-12">
                            <div className="max-w-5xl mx-auto pb-20">
                                {/* Header Section */}
                                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-10">
                                    <div className="flex items-center gap-6">
                                        <button
                                            onClick={() => setReviewView('users')}
                                            className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all group/back border border-white/5"
                                        >
                                            <ChevronRight className="rotate-180 text-white/50 group-hover/back:text-primary transition-colors" size={24} />
                                        </button>

                                        <div className="group/card w-80 h-24 [perspective:1000px]">
                                            <div className="relative w-full h-full transition-all duration-700 [transform-style:preserve-3d] group-hover/card:[transform:rotateX(180deg)] cursor-pointer">
                                                <div className="absolute inset-0 w-full h-full flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-4 [backface-visibility:hidden] shadow-sm">
                                                    <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-white/20 text-2xl font-black blur-md">{selectedReviewUser.full_name[0]}</div>
                                                    <div className="flex flex-col justify-center h-full">
                                                        <div className="text-sm font-bold text-white/30 select-none">Hover to Reveal</div>
                                                    </div>
                                                </div>
                                                <div className="absolute inset-0 w-full h-full flex items-center gap-4 bg-black/90 border border-primary/20 rounded-2xl p-4 [transform:rotateX(180deg)] [backface-visibility:hidden] shadow-2xl shadow-primary/10 backdrop-blur-xl">
                                                    <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-xl shadow-primary/30">{selectedReviewUser.full_name[0]}</div>
                                                    <div>
                                                        <h3 className="text-xl font-black tracking-tight leading-none mb-1 text-white">{selectedReviewUser.full_name}</h3>
                                                        <p className="text-[10px] font-bold text-primary uppercase tracking-widest">{selectedReviewUser.role} • {selectedCycle?.name}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stepper Progress */}
                                    <div className="flex items-center gap-2">
                                        {skills.map((s, i) => (
                                            <div key={i} className="flex flex-col items-center gap-2">
                                                <div className={`w-10 h-1 rounded-full transition-all duration-500 ${i === currentSkillIdx ? 'bg-primary w-20 shadow-lg shadow-primary/30' : i < currentSkillIdx ? 'bg-primary/40' : 'bg-white/10'}`} />
                                                {i === currentSkillIdx && <span className="text-[9px] font-black uppercase tracking-widest text-primary">Step {i + 1}</span>}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <AnimatePresence mode="wait">
                                    {skills[currentSkillIdx] && (
                                        <motion.div
                                            key={skills[currentSkillIdx].id || skills[currentSkillIdx]._id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            className="space-y-8"
                                        >
                                            {/* Skill Header */}
                                            <div className="bg-white/5 border border-white/5 rounded-[2rem] p-8 shadow-sm backdrop-blur-xl relative overflow-hidden">
                                                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                                                    <Activity size={120} className="text-primary rotate-12" />
                                                </div>

                                                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-3">
                                                            <span className="px-3 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
                                                                Vector {currentSkillIdx + 1}/{skills.length}
                                                            </span>
                                                            {skills[currentSkillIdx].category && (
                                                                <span className="px-3 py-1 rounded-lg bg-white/10 text-white/40 text-[10px] font-black uppercase tracking-widest">
                                                                    {skills[currentSkillIdx].category}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <h2 className="text-4xl font-black tracking-tighter text-white">
                                                            {skills[currentSkillIdx].name}
                                                        </h2>
                                                    </div>

                                                    <button
                                                        onClick={isVectorSkipped() ? handleTriggerUndoSkip : handleSkipVector}
                                                        className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 border border-transparent 
                                                            ${skipError
                                                                ? 'bg-red-600 text-white animate-shake shadow-lg shadow-red-500/50'
                                                                : 'bg-white/5 hover:bg-white/10 text-white/50 hover:text-white hover:border-white/10'
                                                            }`}
                                                    >
                                                        {isVectorSkipped() ? 'Undo Skip' : 'Skip Vector'}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Questions List */}
                                            <div className="grid gap-6">
                                                {(skills[currentSkillIdx].questions || []).map((q: any) => (
                                                    <div key={q.id || q._id} className="p-8 rounded-[2rem] bg-[#121212] border border-white/5 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300 group">
                                                        <div className="flex flex-col gap-6">
                                                            <div className="flex justify-between items-start gap-4">
                                                                <p className="text-lg font-bold text-gray-100 leading-relaxed max-w-3xl">{q.text}</p>
                                                                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs font-black text-gray-400">?</div>
                                                            </div>

                                                            <div className="pt-4 border-t border-white/5">
                                                                {q.type === 'Rating' ? (
                                                                    <div className="flex flex-wrap gap-3">
                                                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(val => (
                                                                            <button
                                                                                key={val}
                                                                                onClick={() => setAssessmentAnswers({ ...assessmentAnswers, [(q.id || q._id)]: val })}
                                                                                className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm transition-all duration-200 ${assessmentAnswers[(q.id || q._id)] === val
                                                                                    ? 'bg-primary text-white shadow-xl shadow-primary/40 scale-110 ring-4 ring-primary/20'
                                                                                    : 'bg-white/5 hover:bg-white/10 text-white/40 hover:scale-105'
                                                                                    }`}
                                                                            >
                                                                                {val}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex gap-4">
                                                                        {['Yes', 'No'].map(val => (
                                                                            <button
                                                                                key={val}
                                                                                onClick={() => setAssessmentAnswers({ ...assessmentAnswers, [(q.id || q._id)]: val === 'Yes' })}
                                                                                className={`flex-1 max-w-[140px] h-12 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 ${assessmentAnswers[(q.id || q._id)] === (val === 'Yes')
                                                                                    ? 'bg-primary text-white shadow-lg shadow-primary/30 ring-2 ring-primary/20'
                                                                                    : 'bg-white/5 hover:bg-white/10 text-white/40'
                                                                                    }`}
                                                                            >
                                                                                {val}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Comment Box */}
                                            <div className="bg-white/5 border border-white/5 rounded-[2rem] p-6 mt-6 backdrop-blur-sm">
                                                <h3 className="text-sm font-black uppercase tracking-widest mb-4 text-primary">Vector Feedback</h3>
                                                <textarea
                                                    className="w-full bg-black/20 border border-white/10 rounded-xl p-4 min-h-[100px] outline-none focus:border-primary/50 transition-all text-sm font-medium placeholder:text-white/20"
                                                    placeholder={`Optional feedback for ${skills[currentSkillIdx].name}...`}
                                                    value={assessmentComments[skills[currentSkillIdx].id || skills[currentSkillIdx]._id] || ''}
                                                    onChange={(e) => setAssessmentComments(prev => ({ ...prev, [skills[currentSkillIdx].id || skills[currentSkillIdx]._id]: e.target.value }))}
                                                />
                                            </div>

                                            {/* Footer Actions */}
                                            <div className="flex items-center justify-between pt-8 border-t border-white/5 mt-12 bg-[#0a0a0a]/50 p-6 rounded-[2rem] backdrop-blur-md border border-white/20">
                                                <div className="flex gap-4">
                                                    <button
                                                        onClick={() => setCurrentSkillIdx(Math.max(0, currentSkillIdx - 1))}
                                                        disabled={currentSkillIdx === 0}
                                                        className="px-8 h-14 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 font-bold text-white text-xs uppercase tracking-[0.2em] transition-all disabled:opacity-20 disabled:cursor-not-allowed active:scale-95"
                                                    >
                                                        Previous
                                                    </button>
                                                    <button
                                                        onClick={() => submitFeedback(false)}
                                                        className="px-8 h-14 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 font-bold text-white text-xs uppercase tracking-[0.2em] transition-all active:scale-95 flex items-center gap-2"
                                                    >
                                                        <CalendarIcon size={16} /> Save Draft
                                                    </button>
                                                </div>

                                                {currentSkillIdx < skills.length - 1 ? (
                                                    <button
                                                        onClick={handleNextVector}
                                                        className="px-10 h-14 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:shadow-2xl transition-all active:scale-95 flex items-center gap-3"
                                                    >
                                                        Next Vector <ChevronRight size={16} />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => submitFeedback(true)}
                                                        className="px-10 h-14 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary/30 hover:shadow-primary/50 transition-all active:scale-95 flex items-center gap-3"
                                                    >
                                                        <Check size={18} /> Submit Assessment
                                                    </button>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Modals */}
            {warningModal.show && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 backdrop-blur-xl bg-black/60">
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-[400px] bg-[#1a1a1a] border border-white/10 p-8 rounded-3xl text-center">
                        <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-amber-500"><ShieldAlert size={32} /></div>
                        <h4 className="text-xl font-black tracking-tight text-white uppercase mb-3">Notice</h4>
                        <p className="text-sm font-medium text-gray-400 mb-8">{warningModal.message}</p>
                        <button onClick={() => setWarningModal({ ...warningModal, show: false })} className="w-full h-12 bg-primary text-white rounded-xl font-black uppercase tracking-widest shadow-lg shadow-primary/20">Understood</button>
                    </motion.div>
                </div>
            )}

            {skipModal.show && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 backdrop-blur-xl bg-black/60">
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-[400px] bg-[#1a1a1a] border border-white/10 p-8 rounded-3xl text-center">
                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 text-gray-500"><HelpCircle size={32} /></div>
                        <h4 className="text-xl font-black tracking-tight text-white uppercase mb-3 text-white">
                            {skipModal.questionId === 'VECTOR_UNDO' ? 'Undo Skip Vector?' : 'Skip Entire Vector?'}
                        </h4>
                        <p className="text-sm font-medium text-gray-400 mb-8">
                            {skipModal.questionId === 'VECTOR_UNDO'
                                ? 'Enable questions again for this section?'
                                : 'Mark all questions as skipped? You can undo this later.'}
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setSkipModal({ show: false, questionId: null })} className="flex-1 h-12 bg-white/5 text-white rounded-xl font-black uppercase tracking-widest hover:bg-white/10">Cancel</button>
                            <button onClick={confirmSkip} className="flex-1 h-12 bg-primary text-white rounded-xl font-black uppercase tracking-widest shadow-lg shadow-primary/20">Confirm</button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
