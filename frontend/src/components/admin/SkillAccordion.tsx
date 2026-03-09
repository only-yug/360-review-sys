"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, BarChart2 } from 'lucide-react';
import { Feedback, Skill } from '@/types/adminDashboard';
import { FeedbackCard } from './FeedbackCard';
import { cn } from '@/lib/utils';

interface SkillAccordionProps {
    skill: Skill | { id: string, name: string, category: string }; // Allow partial skill objects
    feedbacks: Feedback[];
    isComparisonMode?: boolean;
    historyFeedbacks?: Feedback[];
    onScoreUpdate?: (feedbackId: string, newScore: number, newComment?: string) => void;
    onAnswerUpdate?: (answerId: string, newScore: number) => void;
    viewMode?: 'target' | 'reviewer';
}

export const SkillAccordion: React.FC<SkillAccordionProps> = ({
    skill,
    feedbacks,
    isComparisonMode,
    historyFeedbacks,
    onScoreUpdate,
    onAnswerUpdate,
    viewMode = 'target'
}) => {
    const [isOpen, setIsOpen] = useState(false);

    // Calculate average score
    // Calculate average score using totalScore
    const averageScore = feedbacks.length > 0
        ? (feedbacks.reduce((acc, curr) => acc + (curr.totalScore || curr.score || 0), 0) / feedbacks.length).toFixed(1)
        : 'N/A';

    // Determine color based on score (mock logic)
    const scoreColor = averageScore !== 'N/A' && parseFloat(averageScore) >= 8 ? 'text-green-600' :
        averageScore !== 'N/A' && parseFloat(averageScore) >= 5 ? 'text-yellow-600' : 'text-red-600';

    return (
        <div className="mb-4 rounded-xl bg-card/40 dark:bg-zinc-900/40 backdrop-blur-sm border border-border dark:border-white/5 overflow-hidden transition-all hover:border-border dark:hover:border-white/10 hover:bg-card/60 dark:hover:bg-zinc-900/60 shadow-lg">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 focus:outline-none group"
            >
                <div className="flex items-center space-x-4">
                    <div className="p-2.5 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl border border-border dark:border-white/5 flex items-center justify-center shadow-inner">
                        <BarChart2 className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                    </div>
                    <div className="text-left">
                        <h3 className="font-semibold text-foreground dark:text-white text-lg tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">{skill.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted dark:bg-white/5 text-muted-foreground dark:text-zinc-400 border border-border dark:border-white/5">{skill.category}</span>
                            <span className="text-xs text-muted-foreground dark:text-zinc-500">•</span>
                            <span className="text-xs text-muted-foreground dark:text-zinc-500">{feedbacks.length} Reviews</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center space-x-6">
                    {viewMode === 'target' && averageScore !== 'N/A' && (
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] text-muted-foreground dark:text-zinc-500 uppercase tracking-widest font-semibold mb-0.5">Avg Score</span>
                            <div className={cn(
                                "text-lg font-bold px-3 py-0.5 rounded-lg border",
                                parseFloat(averageScore) >= 8 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" :
                                    parseFloat(averageScore) >= 5 ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" :
                                        "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                            )}>
                                {averageScore}
                            </div>
                        </div>
                    )}
                    <div className={cn(
                        "w-8 h-8 rounded-full bg-muted dark:bg-white/5 flex items-center justify-center transition-all duration-300 group-hover:bg-accent dark:group-hover:bg-white/10",
                        isOpen && "bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rotate-180"
                    )}>
                        <ChevronDown className="w-4 h-4" />
                    </div>
                </div>
            </button>

            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial="collapsed"
                        animate="open"
                        exit="collapsed"
                        variants={{
                            open: { opacity: 1, height: "auto" },
                            collapsed: { opacity: 0, height: 0 }
                        }}
                        transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                    >
                        <div className="p-4 bg-muted/20 dark:bg-black/20 space-y-4 border-t border-border dark:border-white/5">
                            {feedbacks.length > 0 ? (
                                <div className={cn(
                                    "grid gap-4",
                                    "grid gap-4 grid-cols-1"
                                )}>
                                    {feedbacks.map(fb => (
                                        <FeedbackCard
                                            key={fb.id}
                                            feedback={fb}
                                            isComparisonMode={isComparisonMode}
                                            historyFeedback={historyFeedbacks?.find(h => h.reviewerId === fb.reviewerId)}
                                            onScoreUpdate={onScoreUpdate}
                                            onAnswerUpdate={onAnswerUpdate}
                                            viewMode={viewMode}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground dark:text-zinc-600 text-sm flex flex-col items-center">
                                    <BarChart2 className="w-8 h-8 opacity-20 mb-2" />
                                    No feedback available for this skill yet.
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
