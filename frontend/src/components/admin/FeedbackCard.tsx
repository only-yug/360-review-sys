"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Star, ArrowUp, ArrowDown, ChevronDown, ChevronUp, User, Pencil, Save, X, Calculator } from 'lucide-react';
import { Feedback } from '@/types/adminDashboard';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { EditFeedbackModal } from './EditFeedbackModal';

interface FeedbackCardProps {
    feedback: Feedback;
    isComparisonMode?: boolean;
    historyFeedback?: Feedback;
    onScoreUpdate?: (feedbackId: string, newScore: number, newComment?: string) => void;
    onAnswerUpdate?: (answerId: string, newScore: number) => void;
    viewMode?: 'target' | 'reviewer';
}

// ... (imports remain same)

export const FeedbackCard: React.FC<FeedbackCardProps> = ({
    feedback,
    isComparisonMode = false,
    historyFeedback,
    onScoreUpdate,
    onAnswerUpdate,
    viewMode = 'target'
}) => {
    // ... (state remains same)
    const [isExpanded, setIsExpanded] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedScore, setEditedScore] = useState(feedback.totalScore ?? feedback.score ?? 0);
    const [editedComment, setEditedComment] = useState(feedback.comment);
    const [editedAnswers, setEditedAnswers] = useState(feedback.answers ? [...feedback.answers] : []);

    // Calculate trends for comparison mode
    const displayScore = isEditing ? editedScore : (feedback.totalScore ?? feedback.score ?? 0);
    const historyScore = historyFeedback?.totalScore || historyFeedback?.score;
    const scoreDiff = historyScore !== undefined ? (displayScore - historyScore).toFixed(1) : null;
    const isPositive = scoreDiff && parseFloat(scoreDiff) >= 0;

    // Effect to reset state when feedback changes or edit mode closes
    useEffect(() => {
        if (!isEditing) {
            setEditedScore(feedback.totalScore ?? feedback.score ?? 0);
            setEditedComment(feedback.comment);
            setEditedAnswers(feedback.answers ? [...feedback.answers] : []);
        }
    }, [isEditing, feedback]);

    const handleSave = () => {
        if (onScoreUpdate) {
            onScoreUpdate(feedback.id, editedScore, editedComment);
        }
    };

    // Trigger save on blur for main score/comment
    const handleBlur = () => {
        handleSave();
    };

    const handleAnswerChange = (index: number, newScore: number) => {
        const newAnswers = [...editedAnswers];
        const answer = newAnswers[index];
        newAnswers[index] = { ...answer, score: newScore };
        setEditedAnswers(newAnswers);

        // Auto-recalculate total score based on average
        if (newAnswers.length > 0) {
            const total = newAnswers.reduce((acc, curr) => acc + curr.score, 0);
            const avg = total / newAnswers.length;
            setEditedScore(Math.round(avg * 10) / 10);
        }
    };

    // Trigger save on blur for answers
    const handleAnswerBlur = (index: number) => {
        const answer = editedAnswers[index];
        if (onAnswerUpdate && answer.answerId) {
            onAnswerUpdate(answer.answerId, answer.score || 0);
        }
        // Also trigger main save to persist the new execution-calculated average 
        // (Optional: depending on if backend auto-calcs total from answers or if we need to set override)
        handleSave();
    };

    const isReviewMode = viewMode === 'reviewer';
    const displayTitle = isReviewMode ? (feedback.skillName || "Skill") : feedback.reviewerName;
    const displaySubtitle = isReviewMode ? "Skill Analysis" : feedback.reviewerRole;
    const avatarChar = displayTitle.charAt(0);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const handleModalSave = (id: string, newScore: number, newComment: string, newAnswers: any[]) => {
        if (onScoreUpdate) {
            onScoreUpdate(id, newScore, newComment);
        }
        // If there's a separate handler for bulk answers or individual, call it.
        // For now, adhering to the interface which processes one answer at a time might be tricky if we want bulk save.
        // But since onAnswerUpdate is for individual updates, we might need to loop or update the parent to accept bulk.
        // For this specific safe refactor, we can iterate:
        if (onAnswerUpdate) {
            newAnswers.forEach(ans => {
                // Only update if changed or all? simple iteration is safe
                if (ans.answerId) onAnswerUpdate(ans.answerId, ans.score);
            });
        }
    };

    return (
        <>
            <EditFeedbackModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                feedback={feedback}
                onSave={handleModalSave}
            />

            <Card className="mb-0 overflow-hidden border-l-4 border-l-indigo-500 shadow-lg bg-card dark:bg-zinc-900/50 border-y-0 border-r-0 border-t border-t-white/10 dark:border-t-white/5 border-b border-b-border dark:border-b-white/5 backdrop-blur-sm transition-all hover:bg-muted/50 dark:hover:bg-zinc-900/80 group">
                {/* Edit Button - Toggle Edit Mode */}
                {!isComparisonMode && (
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-muted dark:hover:bg-white/10 text-muted-foreground dark:text-zinc-400 hover:text-foreground dark:hover:text-white" onClick={() => setIsEditModalOpen(true)}>
                            <Pencil className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                )}

                <CardHeader className="pb-3 pt-4 px-5 bg-muted/20 dark:bg-white/5 border-b border-border dark:border-white/5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-border dark:border-white/5 shrink-0">
                                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-300">
                                    {avatarChar}
                                </span>
                            </div>
                            <div>
                                <p className="font-semibold text-sm text-foreground dark:text-zinc-100">{displayTitle}</p>
                                <p className="text-xs text-muted-foreground dark:text-zinc-500">{displaySubtitle}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            {!isComparisonMode && (
                                <div className="flex items-center space-x-1 bg-muted dark:bg-white/5 px-2.5 py-1 rounded-md border border-border dark:border-white/5">
                                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                    <span className="font-bold text-foreground dark:text-zinc-200 text-sm">{displayScore.toFixed(1)} <span className="text-muted-foreground dark:text-zinc-600 text-xs font-normal">/ 10</span></span>
                                </div>
                            )}
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="pt-4 pb-4 px-5">
                    {isComparisonMode ? (
                        <div className="grid grid-cols-2 gap-6">
                            <div className="border-r border-white/5 pr-6">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Current</span>
                                    <div className="flex items-center space-x-2">
                                        <span className="font-bold text-foreground dark:text-white">{displayScore.toFixed(1)}</span>
                                        {scoreDiff && (
                                            <div className={cn("text-xs font-medium flex items-center px-1.5 py-0.5 rounded", isPositive ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10" : "text-rose-600 dark:text-rose-400 bg-rose-500/10")}>
                                                {isPositive ? <ArrowUp className="w-3 h-3 mr-0.5" /> : <ArrowDown className="w-3 h-3 mr-0.5" />}
                                                {Math.abs(parseFloat(scoreDiff))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <p className="text-sm text-foreground/80 dark:text-zinc-300 leading-relaxed">{feedback.comment}</p>
                            </div>
                            <div className="pl-2">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] font-bold text-muted-foreground dark:text-zinc-500 uppercase tracking-widest">Previous</span>
                                    <span className="font-bold text-muted-foreground dark:text-zinc-500">{historyScore !== undefined ? historyScore.toFixed(1) : '-'}</span>
                                </div>
                                <p className="text-sm text-muted-foreground dark:text-zinc-500 leading-relaxed italic">{historyFeedback?.comment || "No data"}</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <p className="text-sm text-foreground/80 dark:text-zinc-300 leading-relaxed">{feedback.comment}</p>
                        </>
                    )}

                    {/* Granular Q&A Section */}
                    <div className="mt-4 pt-4 border-t border-border dark:border-white/5">
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="flex items-center text-xs text-muted-foreground dark:text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors focus:outline-none w-full justify-center group/btn"
                        >
                            {isExpanded ? (
                                <>Hide Breakdown <ChevronUp className="w-3 h-3 ml-1" /></>
                            ) : (
                                <>View Breakdown <ChevronDown className="w-3 h-3 ml-1 group-hover/btn:translate-y-0.5 transition-transform" /></>
                            )}
                        </button>

                        <AnimatePresence>
                            {isExpanded && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="pt-4 text-sm space-y-2">
                                        {(feedback.answers)?.map((answer, idx) => (
                                            <div key={idx} className="p-3 bg-muted dark:bg-white/5 rounded-lg flex items-start justify-between border border-border dark:border-white/5 hover:border-border dark:hover:border-white/10 transition-colors">
                                                <div className="flex-1 pr-4">
                                                    <p className="text-xs text-muted-foreground dark:text-zinc-400 font-medium mb-1">{answer.questionText}</p>
                                                </div>

                                                <div className="flex items-center space-x-1 shrink-0">
                                                    {answer.questionType === 'yes_no' ? (
                                                        <div className={cn(
                                                            "px-3 py-1 rounded-full border text-xs font-bold w-16 text-center shadow-sm",
                                                            answer.score >= 5
                                                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                                                : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                                                        )}>
                                                            {answer.score >= 5 ? "Yes" : "No"}
                                                        </div>
                                                    ) : (
                                                        <div className={cn(
                                                            "flex items-center justify-center gap-1 px-2 py-1 rounded-md border w-16 shadow-sm",
                                                            answer.score >= 8
                                                                ? "bg-emerald-500/5 border-emerald-500/20"
                                                                : answer.score >= 5
                                                                    ? "bg-amber-500/5 dark:bg-amber-500/5 border-amber-500/20"
                                                                    : "bg-rose-500/5 dark:bg-rose-500/5 border-rose-500/20"
                                                        )}>
                                                            <span className={cn(
                                                                "font-bold text-sm",
                                                                answer.score >= 8 ? "text-emerald-600 dark:text-emerald-400" : answer.score >= 5 ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400"
                                                            )}>{answer.score}</span>
                                                            <span className="text-[10px] text-muted-foreground dark:text-zinc-600 font-medium">/10</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </CardContent>
            </Card>
        </>
    );
};
