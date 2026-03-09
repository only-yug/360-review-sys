'use client';

import React, { useState, useEffect } from 'react';
import apiClient from '@/lib/api';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { Calendar, Cpu, PieChart } from 'lucide-react';
import { motion } from 'framer-motion';

import { useQuery } from '@tanstack/react-query';

interface AnalyticsChartsProps {
    userId?: string;
    showSkillDropdown?: boolean;
    initialData?: any[];
    skillsData?: any[];
    preventFetch?: boolean;
}


const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
    userId,
    showSkillDropdown = true,
    initialData,
    skillsData,
    preventFetch = false
}) => {
    const [filter, setFilter] = useState('1m');
    const [selectedSkill, setSelectedSkill] = useState('');

    // Fetch Skills
    const { data: skillsQueryData } = useQuery({
        queryKey: ['adminSkillsOptions'],
        queryFn: async () => {
            const res = await apiClient.get('/admin/skills/options');
            return res.data?.data?.skills || [];
        },
        enabled: !skillsData && !preventFetch && showSkillDropdown,
    });

    const skills = React.useMemo(() => {
        if (skillsData) return skillsData.map((s: any) => ({ ...s, name: s.skill_name || s.name }));
        if (skillsQueryData) return skillsQueryData.map((s: any) => ({ ...s, name: s.skill_name || s.name }));
        return [];
    }, [skillsData, skillsQueryData]);

    // Fetch Chart Data
    const { data: chartDataRaw, isLoading: loadingChart } = useQuery({
        queryKey: ['adminScoresHistory', userId, filter, selectedSkill],
        queryFn: async () => {
            const params: any = { filter };
            if (selectedSkill) params.skill_id = selectedSkill;

            let endpoint = '/scores/history';
            if (userId) endpoint = `/scores/history/${userId}`;

            const res = await apiClient.get(endpoint, { params });
            return res.data?.data?.history || res.data?.history || [];
        },
        enabled: !initialData && !preventFetch,
    });

    const chartData = React.useMemo(() => {
        if (initialData) return initialData;
        if (chartDataRaw) {
            return chartDataRaw.map((item: any) => ({
                period: item.period || item.EvaluationCycle?.cycle_name || 'Cycle',
                score: parseFloat(item.score || item.total_score || 0)
            }));
        }
        return [];
    }, [initialData, chartDataRaw]);

    const loading = (!initialData && !preventFetch) ? loadingChart : false;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4"
        >
            <div className="flex flex-wrap justify-between items-center mb-10 gap-6">
                <div className="flex items-center gap-4">
                    <div className="chai-gradient p-3 rounded-2xl text-white shadow-xl shadow-primary/20">
                        <PieChart size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black tracking-tight text-foreground">Performance Analytics</h2>
                        <p className="text-sm text-muted-foreground font-bold uppercase tracking-wider">Live telemetry</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-4 items-center">
                    {showSkillDropdown && (
                        <select
                            value={selectedSkill}
                            onChange={(e) => setSelectedSkill(e.target.value)}
                            className="bg-white/5 border border-white/10 dark:bg-black/20 rounded-2xl h-14 px-4 font-bold outline-none focus:ring-2 focus:ring-primary/50 transition-all min-w-[200px]"
                        >
                            <option value="">Aggregate View</option>
                            {skills.map((s: any) => (
                                <option key={s._id || s.id} value={s._id || s.id}>{s.name}</option>
                            ))}
                        </select>
                    )}

                    <div className="relative group">
                        <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground z-10 transition-colors group-focus-within:text-primary" />
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="bg-white/5 border border-white/10 dark:bg-black/20 rounded-2xl h-14 pl-12 pr-4 font-black outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        >
                            <option value="1w">1W</option>
                            <option value="1m">1M</option>
                            <option value="3m">3M</option>
                            <option value="6m">6M</option>
                            <option value="all">All</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="h-[400px] w-full relative bg-white/5 dark:bg-black/10 rounded-[2.5rem] p-8 border border-white/10 shadow-inner group">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                        <span className="text-xs font-black text-muted-foreground tracking-[0.2em] uppercase">Synchronizing...</span>
                    </div>
                ) : chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsla(var(--foreground), 0.05)" vertical={false} />
                            <XAxis
                                dataKey="period"
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fontWeight: 800 }}
                                dy={10}
                            />
                            <YAxis
                                domain={[0, 10]}
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fontWeight: 800 }}
                            />
                            <Tooltip
                                contentStyle={{
                                    background: 'hsla(var(--background), 0.8)',
                                    backdropFilter: 'blur(16px)',
                                    border: '1px solid hsla(var(--foreground), 0.1)',
                                    borderRadius: '1.25rem',
                                    padding: '1rem',
                                    boxShadow: '0 20px 40px -10px rgba(0,0,0,0.2)',
                                    fontWeight: 900
                                }}
                                itemStyle={{ color: 'hsl(var(--primary))' }}
                                cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 2, strokeDasharray: '5 5' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="score"
                                stroke="hsl(var(--primary))"
                                strokeWidth={4}
                                fillOpacity={1}
                                fill="url(#colorScore)"
                                animationDuration={1500}
                                activeDot={{ r: 8, strokeWidth: 0, fill: 'hsl(var(--primary))' }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-6 opacity-40">
                        <div className="p-8 bg-white/5 rounded-full border border-white/5">
                            <Cpu size={64} className="text-muted-foreground" />
                        </div>
                        <div className="text-center">
                            <div className="text-xl font-black text-foreground mb-1">Baseline Undetected</div>
                            <p className="text-sm font-bold text-muted-foreground">No data points captured for this period.</p>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default AnalyticsCharts;
