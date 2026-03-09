import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Activity, Calendar as CalendarIcon, Check, HelpCircle, ChevronDown, User } from 'lucide-react';

interface ReviewSystemProps {
    // State
    reviewView: 'cycles' | 'users' | 'assessment';
    cycles: any[];
    pendingReviews: any[];
    selectedCycle: any;
    selectedReviewUser: any;
    skills: any[];
    currentSkillIdx: number;
    assessmentAnswers: Record<string, any>;
    assessmentComments: Record<string, string>;

    allUsers?: any[]; // For looking up user details if reviewee is an ID

    // Filters & UI State
    cycleFilter?: string;
    onCycleFilterChange?: (filter: string) => void;
    skipError?: boolean;
    // Skip Modal State (Optional, for Manager/Employee)
    skipModalState?: { show: boolean; questionId: string | null };
    onCloseSkipModal?: () => void;
    onConfirmSkip?: () => void;

    // Actions
    onSetReviewView: (view: 'cycles' | 'users' | 'assessment') => void;
    onSelectCycle: (cycle: any) => void;
    onStartReview: (user: any) => void;
    onAnswerChange: (questionId: string, value: any) => void;
    onCommentChange: (skillId: string, value: string) => void;
    onNextVector?: () => void;
    onPrevVector?: () => void;
    onTriggerSkip?: () => void;
    onTriggerUndoSkip?: () => void;
    onSubmit: (isFinal: boolean) => void;

    // Helpers
    isVectorSkipped?: () => boolean;
}

export default function ReviewSystem({
                                         reviewView,
                                         cycles,
                                         pendingReviews,
                                         selectedCycle,
                                         selectedReviewUser,
                                         skills,
                                         currentSkillIdx,
                                         assessmentAnswers,
                                         assessmentComments,
                                         allUsers = [], // Default to empty array
                                         cycleFilter,
                                         onCycleFilterChange,
                                         skipError,
                                         skipModalState,
                                         onCloseSkipModal,
                                         onConfirmSkip,
                                         onSetReviewView,
                                         onSelectCycle,
                                         onStartReview,
                                         onAnswerChange,
                                         onCommentChange,
                                         onNextVector,
                                         onPrevVector,
                                         onTriggerSkip,
                                         onTriggerUndoSkip,
                                         onSubmit,
                                         isVectorSkipped
                                     }: ReviewSystemProps) {

    return (
        <motion.div key="review" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="glass-card p-4 sm:p-8 rounded-3xl border-white/10 shadow-2xl min-h-[600px]">
                {reviewView === 'cycles' && (
                    <>
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
                            <div>
                                <h2 className="text-3xl font-black tracking-tight mb-1 uppercase">Review Cycles</h2>
                                <p className="text-muted-foreground text-xs font-bold tracking-wide">Select an active cycle to begin evaluations</p>
                            </div>
                            {onCycleFilterChange && cycleFilter && (
                                <div className="relative w-full sm:w-auto">
                                    <select
                                        value={cycleFilter}
                                        onChange={(e) => onCycleFilterChange(e.target.value)}
                                        className="w-full sm:w-auto appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-3 sm:py-2 pr-10 text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-primary/50 transition-all cursor-pointer min-w-[140px]"
                                    >
                                        <option value="Active" className="bg-zinc-900 text-white">Active</option>
                                        <option value="Pending" className="bg-zinc-900 text-white">Pending</option>
                                        <option value="Closed" className="bg-zinc-900 text-white">Closed</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                </div>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {(cycleFilter ? cycles.filter((c: any) => c.status === cycleFilter) : cycles).length === 0 ? (
                                <div className="md:col-span-2 lg:col-span-3 py-24 flex flex-col items-center justify-center opacity-20 group">
                                    <Activity size={60} className="mb-4 group-hover:scale-110 transition-transform" />
                                    <p className="font-black text-lg uppercase tracking-[0.2em]">No cycles found</p>
                                </div>
                            ) : (
                                (cycleFilter ? cycles.filter((c: any) => c.status === cycleFilter) : cycles).map((c: any) => (
                                    <div key={c._id || c.id} className="p-8 rounded-[2rem] bg-white/5 border border-white/5 hover:border-primary/20 transition-all shadow-xl group relative">
                                        <div className="flex justify-between items-start gap-4 mb-6">
                                            <div className="flex items-center gap-4 min-w-0">
                                                <div className="w-14 h-14 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center text-primary shadow-xl shadow-primary/10 group-hover:rotate-6 transition-transform shrink-0">
                                                    <CalendarIcon size={28} />
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="text-xl font-black tracking-tighter leading-tight break-words">{c.name}</h3>
                                                    <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1">
                                                        {new Date(c.start_date || c.startDate).toLocaleDateString()} - {new Date(c.end_date || c.endDate).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={`shrink-0 inline-flex px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${c.status === 'Active'
                                                ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                                : c.status === 'Closed'
                                                    ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                                    : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                            }`}>
                                                {c.status}
                                            </div>
                                        </div>
                                        <button
                                            disabled={c.status !== 'Active'}
                                            onClick={() => onSelectCycle(c)}
                                            className={`w-full h-12 rounded-xl font-black flex items-center justify-center gap-2 text-[9px] uppercase tracking-widest transition-all ${c.status === 'Active'
                                                ? 'bg-primary text-white shadow-lg shadow-primary/20 hover:shadow-primary/50 active:scale-95'
                                                : 'bg-white/5 text-muted-foreground opacity-50 cursor-not-allowed border border-white/5'
                                            }`}
                                        >
                                            Review
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                )}

                {reviewView === 'users' && selectedCycle && (
                    <>
                        <div className="flex items-center gap-4 mb-8">
                            <button onClick={() => onSetReviewView('cycles')} className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all"><ChevronRight className="rotate-180" size={20} /></button>
                            <div>
                                <h2 className="text-3xl font-black tracking-tight mb-1 uppercase">Target Personnel</h2>
                                <p className="text-muted-foreground text-xs font-bold tracking-wide">Evaluations for: <span className="text-primary">{selectedCycle.name}</span></p>
                            </div>
                        </div>
                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto -mx-4 px-4 sm:-mx-8 sm:px-8">
                            <table className="w-full">
                                <thead>
                                <tr className="border-b border-white/5 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                                    <th className="text-xs pb-3 text-left pl-2">Subject Node</th>
                                    <th className="text-xs pb-3 text-left">Internal Role</th>
                                    <th className="text-xs pb-3 text-left">Internal Status</th>
                                    <th className="text-xs pb-3 text-right pr-2">Action</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                {pendingReviews
                                    .filter((r: any) => {
                                        const rCycleId = (r.cycle?._id || r.cycle?.id || r.cycle || r.cycle_id)?.toString();
                                        const sCycleId = (selectedCycle?._id || selectedCycle?.id)?.toString();
                                        return rCycleId && sCycleId ? rCycleId === sCycleId : true;
                                    })
                                    .map((review: any) => {
                                        const u = review.reviewee || review.reviewee_id;
                                        // Enhanced lookup logic using allUsers if provided
                                        let userObj = (typeof u === 'object' && u !== null) ? u : null;

                                        if (!userObj && allUsers.length > 0) {
                                            userObj = allUsers.find((usr: any) => (usr.id || usr._id) === u);
                                        }

                                        // Final fallback
                                        userObj = userObj || { full_name: 'Unknown', role: 'N/A' };

                                        const status = review.status === 'submitted' ? 'Completed' : (review.status || 'Pending');
                                        const isCompleted = status === 'Completed' || status === 'Submitted';

                                        return (
                                            <tr key={review._id || review.id} className="group hover:bg-white/5 transition-all">
                                                <td className="py-6 pl-2 font-extrabold text-lg">{userObj.full_name || 'Unknown'}</td>
                                                <td className="py-6 uppercase text-[10px] font-black tracking-widest text-muted-foreground">{userObj.role || 'N/A'}</td>
                                                <td className="py-6">
                                                    <div className={`inline-flex px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${isCompleted ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-primary/10 text-primary border-primary/20'}`}>
                                                        {status}
                                                    </div>
                                                </td>
                                                <td className="py-6 text-right pr-2">
                                                    <button
                                                        disabled={isCompleted}
                                                        onClick={() => onStartReview(userObj)}
                                                        className="px-6 py-3 bg-primary text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all disabled:opacity-10 active:scale-95"
                                                    >
                                                        Review
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-4">
                            {pendingReviews
                                .filter((r: any) => {
                                    const rCycleId = (r.cycle?._id || r.cycle?.id || r.cycle || r.cycle_id)?.toString();
                                    const sCycleId = (selectedCycle?._id || selectedCycle?.id)?.toString();
                                    return rCycleId && sCycleId ? rCycleId === sCycleId : true;
                                })
                                .map((review: any) => {
                                    const u = review.reviewee || review.reviewee_id;
                                    let userObj = (typeof u === 'object' && u !== null) ? u : null;
                                    if (!userObj && allUsers.length > 0) {
                                        userObj = allUsers.find((usr: any) => (usr.id || usr._id) === u);
                                    }
                                    userObj = userObj || { full_name: 'Unknown', role: 'N/A' };
                                    const status = review.status === 'submitted' ? 'Completed' : (review.status || 'Pending');
                                    const isCompleted = status === 'Completed' || status === 'Submitted';

                                    return (
                                        <div key={review._id || review.id} className="bg-white/5 border border-white/5 rounded-2xl p-5 space-y-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-primary shadow-xl shadow-primary/10">
                                                    <User size={20} />
                                                </div>
                                                <div>
                                                    <div className="font-black text-lg leading-tight">{userObj.full_name || 'Unknown'}</div>
                                                    <div className="text-muted-foreground font-bold text-xs lowercase opacity-70">{userObj.role || 'N/A'}</div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                                <div className={`inline-flex px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${isCompleted ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-primary/10 text-primary border-primary/20'}`}>
                                                    {status}
                                                </div>
                                            </div>

                                            <button
                                                disabled={isCompleted}
                                                onClick={() => onStartReview(userObj)}
                                                className="w-full py-3 bg-primary text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all disabled:opacity-10 active:scale-95 flex items-center justify-center"
                                            >
                                                Start Review
                                            </button>
                                        </div>
                                    );
                                })}
                        </div>
                    </>
                )}

                {reviewView === 'assessment' && selectedReviewUser && (
                    <div className="max-w-5xl mx-auto py-8">
                        {/* Header Section */}
                        {/* Header Section */}
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <button
                                    onClick={() => onSetReviewView('users')}
                                    className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all group/back border border-white/5 shrink-0"
                                >
                                    <ChevronRight className="rotate-180 text-muted-foreground group-hover/back:text-primary transition-colors" size={24} />
                                </button>

                                <div className="group/card flex-1 md:w-80 h-24 [perspective:1000px]">
                                    <div className="relative w-full h-full transition-all duration-700 [transform-style:preserve-3d] group-hover/card:[transform:rotateX(180deg)] cursor-pointer">
                                        {/* Front Face */}
                                        <div className="absolute inset-0 w-full h-full flex items-center gap-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-4 [backface-visibility:hidden] shadow-sm">
                                            <div className="w-14 h-14 bg-gray-100 dark:bg-white/5 rounded-2xl flex items-center justify-center text-gray-400 dark:text-white/20 text-2xl font-black blur-md shrink-0">
                                                {(selectedReviewUser.full_name || 'U')[0]}
                                            </div>
                                            <div className="flex flex-col justify-center h-full overflow-hidden">
                                                <div className="text-sm font-bold text-gray-400 dark:text-muted-foreground/50 select-none truncate">Hover to Reveal</div>
                                            </div>
                                        </div>

                                        {/* Back Face */}
                                        <div className="absolute inset-0 w-full h-full flex items-center gap-4 bg-white dark:bg-black/90 border border-primary/20 rounded-2xl p-4 [transform:rotateX(180deg)] [backface-visibility:hidden] shadow-2xl shadow-primary/10 backdrop-blur-xl">
                                            <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-xl shadow-primary/30 shrink-0">
                                                {(selectedReviewUser.full_name || 'U')[0]}
                                            </div>
                                            <div className="overflow-hidden">
                                                <h3 className="text-xl font-black tracking-tight leading-none mb-1 text-gray-900 dark:text-white truncate">{selectedReviewUser.full_name}</h3>
                                                <p className="text-[10px] font-bold text-primary uppercase tracking-widest truncate">{selectedReviewUser.role} • {selectedCycle?.name}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Stepper Progress */}
                            <div className="flex items-center justify-center gap-2 flex-wrap w-full md:w-auto">
                                {skills.map((s, i) => (
                                    <div key={i} className="flex flex-col items-center gap-2">
                                        <div
                                            className={`w-10 h-1 rounded-full transition-all duration-500 ${i === currentSkillIdx ? 'bg-primary w-20 shadow-lg shadow-primary/30' : i < currentSkillIdx ? 'bg-primary/40' : 'bg-gray-200 dark:bg-white/10'}`}
                                        />
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
                                    <div className="bg-white/50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-[2rem] p-8 shadow-sm backdrop-blur-xl relative overflow-hidden">
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
                                                        <span className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 text-[10px] font-black uppercase tracking-widest">
                                                            {skills[currentSkillIdx].category}
                                                        </span>
                                                    )}
                                                </div>
                                                <h2 className="text-4xl font-black tracking-tighter text-gray-900 dark:text-white">
                                                    {skills[currentSkillIdx].name}
                                                </h2>
                                            </div>

                                            {onTriggerSkip && isVectorSkipped && (
                                                <button
                                                    onClick={isVectorSkipped() ? onTriggerUndoSkip : onTriggerSkip}
                                                    className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 border border-transparent 
                                                        ${skipError
                                                        ? 'bg-red-600 text-white animate-shake shadow-lg shadow-red-500/50'
                                                        : 'bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-white/10'
                                                    }`}
                                                >
                                                    {isVectorSkipped() ? 'Undo Skip' : 'Skip Vector'}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Questions List */}
                                    <div className="grid gap-6">
                                        {(skills[currentSkillIdx].questions || []).map((q: any) => (
                                            <div
                                                key={q.id || q._id}
                                                className="p-8 rounded-[2rem] bg-white dark:bg-[#121212] border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300 group"
                                            >
                                                <div className="flex flex-col gap-6">
                                                    <div className="flex justify-between items-start gap-4">
                                                        <p className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-relaxed max-w-3xl">
                                                            {q.text}
                                                        </p>
                                                        <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center text-xs font-black text-gray-400">
                                                            ?
                                                        </div>
                                                    </div>

                                                    <div className="pt-4 border-t border-gray-100 dark:border-white/5">
                                                        {q.type === 'Rating' ? (
                                                            <div className="flex flex-wrap gap-3">
                                                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(val => (
                                                                    <button
                                                                        key={val}
                                                                        onClick={() => onAnswerChange((q.id || q._id), val)}
                                                                        className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm transition-all duration-200 ${assessmentAnswers[(q.id || q._id)] === val
                                                                            ? 'bg-primary text-white shadow-xl shadow-primary/40 scale-110 ring-4 ring-primary/20'
                                                                            : 'bg-gray-50 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 hover:scale-105'
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
                                                                        onClick={() => onAnswerChange((q.id || q._id), val === 'Yes')}
                                                                        className={`flex-1 max-w-[140px] h-12 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 ${assessmentAnswers[(q.id || q._id)] === (val === 'Yes')
                                                                            ? 'bg-primary text-white shadow-lg shadow-primary/30 ring-2 ring-primary/20'
                                                                            : 'bg-gray-50 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400'
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
                                    <div className="bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-[2rem] p-6 mt-6 backdrop-blur-sm">
                                        <h3 className="text-sm font-black uppercase tracking-widest mb-4 text-primary">Vector Feedback</h3>
                                        <textarea
                                            className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl p-4 min-h-[100px] outline-none focus:border-primary/50 transition-all text-sm font-medium placeholder:text-muted-foreground"
                                            placeholder={`Optional feedback for ${skills[currentSkillIdx].name}...`}
                                            value={assessmentComments[skills[currentSkillIdx].id || skills[currentSkillIdx]._id] || ''}
                                            onChange={(e) => onCommentChange(skills[currentSkillIdx].id || skills[currentSkillIdx]._id, e.target.value)}
                                        />
                                    </div>

                                    {/* Footer Actions */}
                                    <div className="flex flex-col sm:flex-row items-center justify-between pt-8 border-t border-gray-200 dark:border-white/5 mt-12 bg-white/50 dark:bg-[#0a0a0a]/50 p-6 rounded-[2rem] backdrop-blur-md border border-white/20 gap-4 sm:gap-0">
                                        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                                            {onPrevVector && (
                                                <button
                                                    onClick={() => {
                                                        if (currentSkillIdx > 0 && onPrevVector) onPrevVector();
                                                    }}
                                                    disabled={currentSkillIdx === 0}
                                                    className="w-full sm:w-auto px-8 h-14 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 font-bold text-gray-700 dark:text-white text-xs uppercase tracking-[0.2em] transition-all disabled:opacity-20 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center"
                                                >
                                                    Previous
                                                </button>
                                            )}

                                            <button
                                                onClick={() => onSubmit(false)}
                                                className="w-full sm:w-auto px-8 h-14 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 font-bold text-gray-700 dark:text-white text-xs uppercase tracking-[0.2em] transition-all active:scale-95 flex items-center justify-center gap-2"
                                            >
                                                <CalendarIcon size={16} /> Save Draft
                                            </button>
                                        </div>

                                        {currentSkillIdx < skills.length - 1 ? (
                                            <button
                                                onClick={() => onNextVector && onNextVector()}
                                                className="w-full sm:w-auto px-10 h-14 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-black font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3"
                                            >
                                                Next Vector <ChevronRight size={16} />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => onSubmit(true)}
                                                className="w-full sm:w-auto px-10 h-14 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary/30 hover:shadow-primary/50 transition-all active:scale-95 flex items-center justify-center gap-3"
                                            >
                                                <Check size={18} /> Submit Assessment
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Skip Confirmation Modal */}
            {skipModalState && skipModalState.show && onCloseSkipModal && onConfirmSkip && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 backdrop-blur-xl bg-black/60 overflow-y-auto">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="w-full max-w-[400px] bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 p-8 rounded-3xl relative shadow-2xl text-center"
                    >
                        <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 text-gray-500">
                            <HelpCircle size={32} />
                        </div>
                        <h4 className="text-xl font-black tracking-tight text-gray-900 dark:text-white uppercase mb-3">
                            {skipModalState.questionId === 'VECTOR_UNDO' ? 'Undo Skip Vector?' : 'Skip Entire Vector?'}
                        </h4>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                            {skipModalState.questionId === 'VECTOR_UNDO'
                                ? 'Are you sure you want to undo the skip? This will allow you to answer questions again.'
                                : 'Are you sure you want to skip all questions in this skill/vector? This will mark all questions as skipped. You can undo this later.'}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={onCloseSkipModal}
                                className="flex-1 h-12 bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white rounded-xl font-black uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onConfirmSkip}
                                className="flex-1 h-12 bg-primary text-white rounded-xl font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-95"
                            >
                                {skipModalState.questionId === 'VECTOR_UNDO' ? 'Confirm Undo' : 'Confirm Skip'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </motion.div>
    );
}
