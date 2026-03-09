'use client';

import React, { useMemo, useState } from 'react';
import { Trophy, Waves, Crown, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api';

interface LeaderboardProps {
    reviews?: any[];
    skills?: any[];
    loading?: boolean;
}

const Leaderboard: React.FC<LeaderboardProps> = ({
    reviews = [],
    skills = [],
    loading = false,
}) => {

    // Default to current year
    const currentYear = new Date().getFullYear().toString();
    const [selectedYear, setSelectedYear] = useState<string>(currentYear);

    // Fetch dynamic aggregated data using React Query to prevent duplicate requests
    const { data: leaderboardData, isLoading: isFetchingDynamic } = useQuery({
        queryKey: ['leaderboard', selectedYear],
        queryFn: async () => {
            const [topOverallRes, topSkillsRes] = await Promise.all([
                apiClient.get(`/scores/top-overall?year=${selectedYear}`).catch(() => ({ data: { data: { topScores: [] } } })),
                apiClient.get(`/scores/top-skills?year=${selectedYear}`).catch(() => ({ data: { data: { topSkillScorers: [] } } }))
            ]);

            const topOverall = (topOverallRes.data?.data?.topScores || []).map((score: any) => ({
                user: score.User,
                score: parseFloat(score.final_score),
                cycleName: score.EvaluationCycle?.cycle_name || `Year ${selectedYear} Average`
            }));

            const skillChampions = (topSkillsRes.data?.data?.topSkillScorers || []).map((item: any) => ({
                skill: item.skill,
                user: item.user,
                score: parseFloat(item.score)
            }));

            return { topOverall, skillChampions };
        },
        staleTime: 60000 // Cache for 1 minute
    });

    const topOverall = leaderboardData?.topOverall || [];
    const skillChampions = leaderboardData?.skillChampions || [];

    if (loading) return (
        <div className="p-8 space-y-4">
            <div className="h-20 bg-white/5 animate-pulse rounded-2xl border border-white/5" />
            <div className="h-20 bg-white/5 animate-pulse rounded-2xl border border-white/5" />
        </div>
    );

    // Generate year options (current year down to 3 years ago)
    const currentY = new Date().getFullYear();
    const yearOptions = Array.from({ length: 4 }, (_, i) => (currentY - i).toString());

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
            {/* Top Overall Section */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-card p-8 rounded-[2.5rem] relative overflow-hidden flex flex-col h-full border-white/10 shadow-2xl"
            >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="bg-amber-100 dark:bg-amber-500/20 p-3 rounded-2xl text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                            <Trophy size={24} strokeWidth={3} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tight">Leaderboard</h2>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Global Top Performers</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 focus-within:ring-2 ring-primary/20 transition-all">
                        <CalendarIcon size={14} className="text-muted-foreground" />
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="bg-transparent border-none text-xs font-black outline-none cursor-pointer placeholder:text-muted-foreground/50"
                        >
                            {yearOptions.map(year => (
                                <option key={year} value={year} className="bg-background text-foreground">{year}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="space-y-4 flex-1">
                    <div className="mb-6 relative">
                        <h3 className="text-xl font-bold mb-4">Top Overall</h3>

                        {isFetchingDynamic && (
                            <div className="absolute inset-0 z-10 bg-background/50 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                                <Loader2 size={24} className="animate-spin text-primary" />
                            </div>
                        )}

                        {topOverall.length === 0 && !isFetchingDynamic ? (
                            <div className="py-12 flex flex-col items-center justify-center opacity-30">
                                <Waves size={40} className="mb-2" />
                                <span className="text-[10px] uppercase font-black tracking-widest">No data for {selectedYear}</span>
                            </div>
                        ) : (
                            topOverall.map((item: any, idx: number) => (
                                <motion.div
                                    key={`${item.user?.id || idx}-${selectedYear}`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="group relative p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-primary/20 transition-all mb-3 flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm border ${idx === 0 ? 'bg-amber-400 text-white border-amber-500 shadow-lg shadow-amber-400/30' :
                                            idx === 1 ? 'bg-slate-300 text-slate-700 border-slate-400' :
                                                'bg-orange-700 text-white border-orange-800'
                                            }`}>
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <div className="font-black text-sm uppercase tracking-wide">{item.user?.full_name || 'Unknown User'}</div>
                                            <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Year {selectedYear} Average</div>
                                        </div>
                                    </div>
                                    <div className="font-black text-xl tabular-nums">
                                        {item.score.toFixed(1)}
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Skill Champions Section */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-card p-8 rounded-[2.5rem] relative overflow-hidden flex flex-col h-full border-white/10 shadow-2xl bg-black/20"
            >
                <div className="flex items-center gap-4 mb-8">
                    <div>
                        <h2 className="text-2xl font-black tracking-tight">Skill Champions</h2>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Domain Experts ({selectedYear})</p>
                    </div>
                </div>

                <div className="space-y-1 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar relative">
                    {isFetchingDynamic && (
                        <div className="absolute inset-0 z-10 bg-background/50 backdrop-blur-sm flex items-center justify-center rounded-xl">
                            <Loader2 size={24} className="animate-spin text-primary" />
                        </div>
                    )}

                    {skillChampions.length === 0 && !isFetchingDynamic ? (
                        <div className="py-12 flex flex-col items-center justify-center opacity-30">
                            <Crown size={40} className="mb-2" />
                            <span className="text-[10px] uppercase font-black tracking-widest">No skill data for {selectedYear}</span>
                        </div>
                    ) : (
                        skillChampions.map((item: any, idx: number) => (
                            <motion.div
                                key={`${item.skill?.id || idx}-${selectedYear}`}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all mb-2"
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <div className="font-bold text-xs text-white">{item.skill.name}</div>
                                    <div className="font-black text-sm text-blue-400 tabular-nums">{item.score.toFixed(1)}</div>
                                </div>
                                <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                                    {item.user?.full_name}
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default Leaderboard;
