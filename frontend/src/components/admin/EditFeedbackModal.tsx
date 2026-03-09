import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Feedback } from '@/types/adminDashboard';
import { Star, Save, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';

interface EditFeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    feedback: Feedback;
    onSave: (feedbackId: string, newScore: number, newComment: string, answers: any[]) => void;
}

export const EditFeedbackModal: React.FC<EditFeedbackModalProps> = ({
    isOpen,
    onClose,
    feedback,
    onSave
}) => {
    const [score, setScore] = useState(feedback.totalScore ?? feedback.score ?? 0);
    const [comment, setComment] = useState(feedback.comment);
    const [answers, setAnswers] = useState(feedback.answers ? [...feedback.answers] : []);

    useEffect(() => {
        if (isOpen) {
            setScore(feedback.totalScore ?? feedback.score ?? 0);
            setComment(feedback.comment);
            setAnswers(feedback.answers ? [...feedback.answers] : []);
        }
    }, [isOpen, feedback]);

    const handleAnswerChange = (index: number, newScore: number) => {
        const newAnswers = [...answers];
        newAnswers[index] = { ...newAnswers[index], score: newScore };
        setAnswers(newAnswers);

        // Auto-recalculate total score
        if (newAnswers.length > 0) {
            // Simple average for now, could be weighted
            const total = newAnswers.reduce((acc, curr) => acc + curr.score, 0);
            const avg = total / newAnswers.length;
            setScore(Math.round(avg * 10) / 10);
        }
    };

    const handleSave = () => {
        onSave(feedback.id, score, comment, answers);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[600px] bg-background dark:bg-zinc-900/95 border-border dark:border-white/10 text-foreground dark:text-white backdrop-blur-xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        Edit Feedback
                        <span className="text-sm font-normal text-muted-foreground dark:text-zinc-400 ml-2">({feedback.reviewerName})</span>
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto px-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {/* Overall Score */}
                    <div className="grid gap-2">
                        <Label htmlFor="score" className="text-muted-foreground dark:text-zinc-300">Overall Score</Label>
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <span className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{score.toFixed(1)}</span>
                                <span className="text-sm text-muted-foreground dark:text-zinc-500 ml-2">/ 10</span>
                            </div>
                            {/* Optional: Allow manual override if needed, but auto-calc is better */}
                        </div>
                    </div>

                    {/* Comment */}
                    <div className="grid gap-2">
                        <Label htmlFor="comment" className="text-muted-foreground dark:text-zinc-300">Feedback Comment</Label>
                        <button className="hidden" /> {/* Hidden button to prevent auto-focus on textarea if desired, or just use semantic classes */}
                        <Textarea
                            id="comment"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="bg-muted dark:bg-black/20 border-border dark:border-white/10 min-h-[100px] text-foreground dark:text-zinc-200 focus:border-indigo-500/50"
                        />
                    </div>

                    {/* Questions */}
                    <div className="grid gap-4 border-t border-border dark:border-white/10 pt-4">
                        <Label className="text-muted-foreground dark:text-zinc-300 text-sm uppercase tracking-wider font-semibold">Breakdown</Label>
                        {answers.map((answer, idx) => (
                            <div key={idx} className="bg-card dark:bg-white/5 px-3 py-2.5 rounded-lg border border-border dark:border-white/5 flex items-center justify-between gap-4">
                                <p className="text-sm text-foreground/80 dark:text-zinc-300 font-medium flex-1">{answer.questionText}</p>
                                <div className="shrink-0 w-[140px]">
                                    {answer.questionType === 'yes_no' ? (
                                        <div className="flex items-center gap-1 w-full">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleAnswerChange(idx, 0)}
                                                className={cn(
                                                    "flex-1 border-border dark:border-white/10 h-8 text-xs hover:bg-rose-500/20 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-500/50 transition-all",
                                                    answer.score < 5 && "bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 border-rose-500/50"
                                                )}
                                            >
                                                No
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleAnswerChange(idx, 10)}
                                                className={cn(
                                                    "flex-1 border-border dark:border-white/10 h-8 text-xs hover:bg-emerald-500/20 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/50 transition-all",
                                                    answer.score >= 5 && "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-500/50"
                                                )}
                                            >
                                                Yes
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 w-full">
                                            <Input
                                                type="number"
                                                min="0"
                                                max="10"
                                                step="0.1"
                                                value={answer.score}
                                                onChange={(e) => handleAnswerChange(idx, parseFloat(e.target.value))}
                                                className="bg-muted dark:bg-black/30 border-border dark:border-white/10 h-8 text-right font-mono text-sm"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={onClose} className="border-border dark:border-white/10 hover:bg-accent dark:hover:bg-white/5 text-muted-foreground dark:text-zinc-300">
                        Cancel
                    </Button>
                    <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                        <Save className="w-4 h-4" /> Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
