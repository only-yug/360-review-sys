"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { AlertTriangle, Mail, History, ChevronDown, User, BarChart2, Loader2, Save, X, Trophy, Target, AlertCircle } from 'lucide-react';
import {
    Employee,
    Feedback,
    Cycle
} from '@/types/adminDashboard';
import { Button } from '@/components/ui/button';
import apiClient from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SkillAccordion } from './SkillAccordion';
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Tooltip
} from 'recharts';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface AuditPanelProps {
    employee: Employee | null;
    viewMode?: 'target' | 'reviewer';
    cycleId: string;
    cycles: Cycle[];
}

export const AuditPanel: React.FC<AuditPanelProps> = ({ employee, viewMode = 'target', cycleId, cycles }) => {
    const queryClient = useQueryClient();
    const [historyCycleId, setHistoryCycleId] = useState<string | null>(null);

    // Available cycles for history dropdown (excluding current)
    const historyOptions = cycles.filter(c => c.id.toString() !== cycleId.toString());

    // --- Helpers ---
    const reconstructFeedbacks = (data: any): Feedback[] => {
        if (!data.meta || !data.rows) return data.feedbacks || [];
        const { meta, rows } = data;
        return rows.map((row: any) => {
            const isTargetMode = viewMode === 'target';
            const entityId = isTargetMode ? row.rId : row.eeId;
            const entityMeta = isTargetMode ? meta.reviewers?.[entityId] : meta.reviewees?.[entityId];

            return {
                id: String(row.fId),
                reviewId: String(row.revId),
                reviewerId: String(isTargetMode ? row.rId : row.revId),
                reviewerName: entityMeta?.name || 'Unknown',
                reviewerRole: entityMeta?.role || 'Peer',
                skillId: String(row.sId),
                skillName: meta.skills[row.sId]?.name || 'Unknown Skill',
                totalScore: row.score,
                score: row.score,
                comment: row.comm,
                createdAt: row.date,
                answers: row.ans.map((a: any) => ({
                    answerId: a.aId,
                    questionId: a.qId,
                    questionText: meta.questions[a.qId]?.text || 'Unknown Question',
                    questionType: meta.questions[a.qId]?.type || 'rating',
                    score: a.val,
                    maxScore: 10
                }))
            };
        });
    };

    // --- React Query Fetching ---

    // 1. Primary Audit Data
    const { data: auditData, isLoading: loadingPrimary } = useQuery({
        queryKey: ['adminAudit', employee?.id, cycleId, viewMode],
        queryFn: async () => {
            if (!employee || !cycleId) return null;
            const endpoint = viewMode === 'target' ? `/admin/audit/${employee.id}` : `/admin/audit/reviewer/${employee.id}`;
            const res = await apiClient.get(endpoint, { params: { cycleId } });
            return res.data;
        },
        enabled: !!employee && !!cycleId,
        staleTime: 5 * 60 * 1000 // 5 minutes to aggressively hide Strict Mode re-renders
    });

    const feedbacks = useMemo(() => {
        if (auditData?.success) {
            return reconstructFeedbacks(auditData.data);
        }
        return [];
    }, [auditData, viewMode]);

    const overallScore = auditData?.success ? (auditData.data.overallScore || '0.0') : '0.0';
    const missingReviewers = auditData?.success ? (auditData.data.missingReviewers || auditData.data.missingReviews || []) : [];

    // 2. History Audit Data
    const { data: historyData, isLoading: loadingHistory } = useQuery({
        queryKey: ['adminAuditHistory', employee?.id, historyCycleId, viewMode],
        queryFn: async () => {
            if (!employee || !historyCycleId) return null;
            const endpoint = viewMode === 'target' ? `/admin/audit/${employee.id}` : `/admin/audit/reviewer/${employee.id}`;
            const res = await apiClient.get(endpoint, { params: { cycleId: historyCycleId } });
            return res.data;
        },
        enabled: !!employee && !!historyCycleId,
        staleTime: 5 * 60 * 1000
    });

    const historyFeedbacks = useMemo(() => {
        if (historyData?.success) {
            return reconstructFeedbacks(historyData.data);
        }
        return [];
    }, [historyData, viewMode]);

    // 3. Chart Data
    const { data: chartDataRaw } = useQuery({
        queryKey: ['adminAuditChart', employee?.id, cycleId],
        queryFn: async () => {
            if (!employee || !cycleId || viewMode !== 'target') return null;
            const res = await apiClient.get(`/scores/distribution/${employee.id}`, {
                params: { cycle_id: cycleId }
            });
            return res.data;
        },
        enabled: !!employee && !!cycleId && viewMode === 'target',
        staleTime: 5 * 60 * 1000
    });

    const chartData = useMemo(() => {
        if (chartDataRaw?.status === 'success') {
            return chartDataRaw.data.distribution.map((d: any) => ({
                subject: d.skill,
                A: d.score,
                fullMark: d.fullMark
            }));
        }
        return [];
    }, [chartDataRaw]);

    // --- Handlers ---
    const handleScoreOverride = async (feedbackId: string, newScore: number, newComment?: string) => {
        try {
            await apiClient.patch(`/admin/feedback/${feedbackId}`, { score: newScore, comment: newComment });
            // Invalidate the cache to trigger a refetch
            queryClient.invalidateQueries({ queryKey: ['adminAudit', employee?.id, cycleId, viewMode] });
        } catch (error) {
            console.error("Failed to update score", error);
        }
    };

    const handleAnswerUpdate = async (answerId: string, newScore: number) => {
        try {
            await apiClient.patch(`/admin/feedback/answers/${answerId}`, { score: newScore });
            // Invalidate the cache to trigger a refetch
            queryClient.invalidateQueries({ queryKey: ['adminAudit', employee?.id, cycleId, viewMode] });
        } catch (error) {
            console.error("Failed to update answer", error);
        }
    };

    // --- Grouping ---
    const groupedFeedbacks = useMemo(() => {
        const grouped: Record<string, Feedback[]> = {};
        if (!employee) return {};
        if (viewMode === 'target') {
            feedbacks.forEach(fb => {
                const key = fb.skillId;
                if (!grouped[key]) grouped[key] = [];
                grouped[key].push(fb);
            });
        } else {
            feedbacks.forEach(fb => {
                const key = fb.reviewerName;
                if (!grouped[key]) grouped[key] = [];
                grouped[key].push(fb);
            });
        }
        return grouped;
    }, [feedbacks, employee, viewMode]);

    // chartData is fetched via React Query and processed in useMemo above

    // --- Aggregate Stats ---
    // Use the backend-provided overall score
    // const avgScore = useMemo(() => { ... }, [feedbacks]); -> Removed in favor of backend value
    const avgScore = overallScore;

    if (!employee) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground dark:text-zinc-500">
                <div className="bg-muted dark:bg-zinc-900/50 p-6 rounded-full mb-4 border border-border dark:border-white/5 shadow-2xl">
                    <History className="w-12 h-12 opacity-50 text-indigo-500" />
                </div>
                <h3 className="text-xl font-semibold text-foreground dark:text-zinc-300">Select an Employee</h3>
                <p>Click on an employee from the sidebar to view their audit.</p>
            </div>
        );
    }

    if (loadingPrimary) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col overflow-y-auto bg-transparent relative custom-scrollbar">

            {/* --- Hero / Profile Section --- */}
            <div className="p-8 pb-0">
                <div className="flex flex-col xl:flex-row gap-6 items-start">
                    {/* Left: Profile & Radar */}
                    <div className={cn(
                        "grid grid-cols-1 md:grid-cols-3 bg-card dark:bg-zinc-900/40 backdrop-blur-md border border-border dark:border-white/5 rounded-3xl overflow-hidden shadow-xl",
                        viewMode === 'target' ? "flex-1" : "w-full flex-col" /* Fallback for reviewer mode to just be full width block */
                    )}>
                        {/* Avatar & Basic Info */}
                        <div className={cn(
                            "flex flex-col items-center sm:items-start border-b md:border-b-0 md:border-r border-border dark:border-white/5 p-6 gap-6",
                            viewMode === 'reviewer' ? "w-full border-r-0 flex-row items-center justify-between md:col-span-3" : "md:col-span-1"
                        )}>
                            <div className={cn("flex flex-col items-center sm:items-start gap-4", viewMode === 'reviewer' && "flex-row items-center gap-6")}>
                                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-500/20 text-4xl font-bold text-white shrink-0">
                                    {employee.name.charAt(0)}
                                </div>
                                <div className="text-center sm:text-left">
                                    <h1 className="text-2xl font-bold text-foreground dark:text-white tracking-tight">{employee.name}</h1>
                                    <p className="text-muted-foreground dark:text-zinc-400 text-sm font-medium">{employee.role}</p>
                                    <div className="mt-3 flex flex-wrap gap-2 justify-center sm:justify-start">
                                        <span className="px-2.5 py-1 rounded-md bg-muted dark:bg-white/5 border border-border dark:border-white/5 text-xs text-foreground dark:text-zinc-300">{employee.department}</span>
                                        <span className="px-2.5 py-1 rounded-md bg-indigo-100 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-xs text-indigo-700 dark:text-indigo-300">FTE</span>
                                    </div>
                                </div>
                            </div>

                            {/* Mini Stats */}
                            <div className={cn("grid gap-3 w-full mt-auto", viewMode === 'reviewer' ? "flex w-auto pt-0 mt-0" : "grid-cols-2")}>
                                <div className="bg-muted dark:bg-black/20 rounded-xl p-3 text-center min-w-[100px]">
                                    <div className="text-2xl font-bold text-foreground dark:text-white">{feedbacks.length}</div>
                                    <div className="text-[10px] text-muted-foreground dark:text-zinc-500 uppercase tracking-widest">Feedbacks</div>
                                </div>
                                {viewMode === 'target' && (
                                    <div className="bg-muted dark:bg-black/20 rounded-xl p-3 text-center min-w-[100px]">
                                        <div className={cn("text-2xl font-bold", parseFloat(avgScore) >= 8 ? "text-emerald-500 dark:text-emerald-400" : "text-yellow-500 dark:text-yellow-400")}>{avgScore}</div>
                                        <div className="text-[10px] text-muted-foreground dark:text-zinc-500 uppercase tracking-widest">Avg Score</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Radar Chart (Target Mode Only) */}
                        {viewMode === 'target' && (
                            <div className="md:col-span-2 h-[300px] w-full relative p-4 flex items-center justify-center">
                                {chartData.length > 2 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                                            <PolarGrid stroke="rgba(255,255,255,0.05)" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#a1a1aa', fontSize: 10 }} />
                                            <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                                            <Radar
                                                name="Skills"
                                                dataKey="A"
                                                stroke="#8b5cf6"
                                                fill="#8b5cf6"
                                                fillOpacity={0.3}
                                            />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }}
                                                itemStyle={{ color: '#e4e4e7' }}
                                            />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-muted-foreground dark:text-zinc-600 text-sm italic">
                                        Not enough data for chart
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right: Actions & Alerts */}
                    <div className="w-full xl:w-80 flex flex-col gap-4">
                        {/* Compare Tool */}
                        <div className="bg-card dark:bg-zinc-900/40 backdrop-blur-md border border-border dark:border-white/5 rounded-2xl p-4 shadow-lg">
                            <div className="flex items-center gap-2 mb-3 text-foreground dark:text-zinc-300 text-sm font-medium">
                                <History className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                                <span>Time Travel</span>
                            </div>
                            <div className="relative">
                                <select
                                    value={historyCycleId || "none"}
                                    onChange={(e) => setHistoryCycleId(e.target.value === "none" ? null : e.target.value)}
                                    className="w-full h-10 pl-3 pr-8 text-sm bg-background dark:bg-black/20 border border-border dark:border-white/10 rounded-lg appearance-none focus:outline-none focus:ring-1 focus:ring-indigo-500/50 text-foreground dark:text-zinc-300"
                                >
                                    <option value="none" className="bg-background dark:bg-zinc-900">Current Cycle</option>
                                    {historyOptions.map(cycle => (
                                        <option key={cycle.id} value={cycle.id} className="bg-background dark:bg-zinc-900">{cycle.label}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-muted-foreground dark:text-zinc-500 pointer-events-none" />
                            </div>
                        </div>

                        {/* Missing Reviewers Alert */}
                        {missingReviewers.length > 0 && (
                            <div className="flex-1 bg-red-500/5 border border-red-500/20 rounded-2xl p-4 overflow-hidden flex flex-col">
                                <div className="flex items-center gap-2 mb-3 text-red-400 text-sm font-medium">
                                    <AlertTriangle className="w-4 h-4" />
                                    <span>Missing Reviews ({missingReviewers.length})</span>
                                </div>
                                <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 gap-2 content-start custom-scrollbar max-h-[200px] xl:max-h-full">
                                    {missingReviewers.map((r: any) => (
                                        <div key={r.id} className="bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/10 flex items-center justify-center text-center group hover:bg-red-500/20 transition-colors">
                                            <div className="text-xs font-medium text-red-200 truncate w-full">
                                                {r.name}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- Feedbacks List --- */}
            <div className="p-8 pt-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-foreground dark:text-white flex items-center gap-2">
                        {viewMode === 'target' ? <Target className="w-5 h-5 text-indigo-500 dark:text-indigo-400" /> : <User className="w-5 h-5 text-purple-500 dark:text-purple-400" />}
                        {viewMode === 'target' ? 'Deep Dive Analysis' : 'Reviewer Breakdown'}
                    </h2>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {Object.keys(groupedFeedbacks).map(key => {
                        const groupFeedbacks = groupedFeedbacks[key];
                        const firstFb = groupFeedbacks[0];
                        const displayItem = viewMode === 'target'
                            ? { id: key, name: firstFb.skillName || "Unknown Skill", category: "Skill" }
                            : { id: key, name: key, category: 'Reviewer' };

                        const historyGroup = loadingHistory ? [] : historyFeedbacks.filter(hf =>
                            viewMode === 'target' ? hf.skillId === key : hf.reviewerName === key
                        );

                        return (
                            <SkillAccordion
                                key={key}
                                skill={displayItem}
                                feedbacks={groupFeedbacks}
                                isComparisonMode={!!historyCycleId}
                                historyFeedbacks={historyGroup}
                                onScoreUpdate={handleScoreOverride}
                                onAnswerUpdate={handleAnswerUpdate}
                                viewMode={viewMode}
                            />
                        );
                    })}
                </div>
            </div>
        </div >
    );
};
