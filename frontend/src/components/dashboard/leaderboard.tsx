'use client';

import React, { useState } from 'react';
import { Trophy, Waves, Crown, Calendar as CalendarIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { CustomSelect } from '@/components/ui/custom-select';
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

    // Fetch dynamic aggregated data using React Query
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
        staleTime: 60000
    });

    const topOverall = leaderboardData?.topOverall || [];
    const skillChampions = leaderboardData?.skillChampions || [];

    // Generate year options
    const currentY = new Date().getFullYear();
    const yearOptions = Array.from({ length: 4 }, (_, i) => (currentY - i).toString());

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
            {/* Top Overall Section */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-card p-8 rounded-[2.5rem] relative overflow-hidden flex flex-col h-full border border-gray-200 dark:border-white/10 shadow-2xl shadow-black/5 dark:shadow-none"
            >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="bg-amber-100 dark:bg-amber-500/20 p-3 rounded-2xl text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                            <Trophy size={24} strokeWidth={3} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tight text-foreground">Leaderboard</h2>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Top Performers</p>
                        </div>
                    </div>

                    <CustomSelect
                        value={selectedYear}
                        onChange={setSelectedYear}
                        options={yearOptions.map(year => ({
                            value: year,
                            label: year
                        }))}
                        icon={<CalendarIcon size={14} />}
                        className="w-32 sm:w-40"
                        selectClassName="h-10 rounded-xl bg-primary/5 border-primary/10"
                    />
                </div>

                <div className="space-y-4 flex-1 min-h-[300px]">
                    <div className="mb-6 relative">
                        <h3 className="text-xl font-bold mb-4 text-foreground">Top Overall</h3>

                        {topOverall.length === 0 && !isFetchingDynamic ? (
                            <div className="py-20 flex flex-col items-center justify-center opacity-30">
                                <Waves size={48} className="mb-4 text-foreground" />
                                <span className="text-xs uppercase font-black tracking-[0.2em] text-foreground">No data for {selectedYear}</span>
                            </div>
                        ) : (
                            <div className="min-h-[200px]">
                                {topOverall.map((item: any, idx: number) => (
                                    <motion.div
                                        key={`${item.user?.id || idx}-${selectedYear}`}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="group relative p-4 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-100 dark:border-white/5 hover:bg-gray-200 dark:hover:bg-white/10 hover:border-primary/20 transition-all mb-3 flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm border ${idx === 0 ? 'bg-amber-400 text-white border-amber-500 shadow-lg shadow-amber-400/30' :
                                                idx === 1 ? 'bg-slate-300 text-slate-700 border-slate-400' :
                                                    'bg-orange-700 text-white border-orange-800'
                                                }`}>
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <div className="font-black text-sm uppercase tracking-wide text-foreground">{item.user?.full_name || 'Unknown User'}</div>
                                                <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Year {selectedYear} Average</div>
                                            </div>
                                        </div>
                                        <div className="font-black text-xl tabular-nums text-foreground">
                                            {item.score.toFixed(1)}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Skill Champions Section */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-card p-8 rounded-[2.5rem] relative overflow-hidden flex flex-col h-full border border-gray-200 dark:border-white/10 shadow-2xl shadow-black/5 dark:shadow-none dark:bg-black/20"
            >
                <div className="flex items-center gap-4 mb-8">
                    <div>
                        <h2 className="text-2xl font-black tracking-tight text-foreground">Skill Champions</h2>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Skills Experts ({selectedYear})</p>
                    </div>
                </div>

                <div className="space-y-1 overflow-y-auto h-[400px] pr-2 scrollbar-hide relative text-foreground">
                    {skillChampions.length === 0 && !isFetchingDynamic ? (
                        <div className="py-20 flex flex-col items-center justify-center opacity-30">
                            <Crown size={48} className="mb-4 text-foreground" />
                            <span className="text-xs uppercase font-black tracking-[0.2em] text-foreground">No skill data for {selectedYear}</span>
                        </div>
                    ) : (
                        <div className="min-h-[300px]">
                            {skillChampions.map((item: any, idx: number) => (
                                <motion.div
                                    key={`${item.skill?.id || idx}-${selectedYear}`}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="p-4 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-100 dark:border-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-all mb-2"
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <div className="font-bold text-sm text-foreground">{item.skill.name}</div>
                                        <div className="font-black text-md text-blue-500 dark:text-blue-400 tabular-nums">{item.score.toFixed(1)}</div>
                                    </div>
                                    <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                                        {item.user?.full_name}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default Leaderboard;
