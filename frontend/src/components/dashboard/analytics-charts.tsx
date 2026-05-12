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
import { CustomSelect } from '@/components/ui/custom-select';

import { useQuery } from '@tanstack/react-query';

interface AnalyticsChartsProps {
    userId?: string;
    showSkillDropdown?: boolean;
    initialData?: any[];
    skillsData?: any[];
    preventFetch?: boolean;
}


const AnalyticsCharts: React.FC<AnalyticsChartsProps & { headerContent?: React.ReactNode }> = ({
    userId,
    showSkillDropdown = true,
    initialData,
    skillsData,
    preventFetch = false,
    headerContent
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
            return chartDataRaw.map((item: any) => {
                let displayPeriod = item.period || item.EvaluationCycle?.cycle_name || 'Cycle';
                
                // If backend provided a date, format it for the X-axis
                if (item.date) {
                    try {
                        const dateObj = new Date(item.date);
                        displayPeriod = new Intl.DateTimeFormat('en-US', { 
                            month: 'short', 
                            day: '2-digit',
                            year: '2-digit'
                        }).format(dateObj);
                    } catch (e) {
                        console.error("Date formatting failed", e);
                    }
                }

                return {
                    period: displayPeriod,
                    fullCycleName: item.period || item.EvaluationCycle?.cycle_name,
                    score: parseFloat(item.score || item.total_score || 0)
                };
            });
        }
        return [];
    }, [initialData, chartDataRaw]);

    const loading = (!initialData && !preventFetch) ? loadingChart : false;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full"
        >
            <div className="flex flex-wrap md:flex-nowrap justify-between items-start md:items-center mb-6 sm:mb-8 gap-4 md:gap-6 w-full">
                {headerContent && <div className="w-full md:w-auto flex-shrink-0 flex-grow-0">{headerContent}</div>}
                
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full md:w-auto justify-start md:justify-end mt-2 md:mt-0 pt-4 md:pt-0 border-t border-white/5 md:border-t-0">
                    {showSkillDropdown && (
                        <div className="w-full sm:w-64 md:w-56 lg:w-64">
                            <CustomSelect
                                value={selectedSkill}
                                onChange={setSelectedSkill}
                                options={[
                                    { value: '', label: 'Overall Performance' },
                                    ...skills.map((s: any) => ({
                                        value: (s._id || s.id).toString(),
                                        label: s.name
                                    }))
                                ]}
                                className="w-full"
                                selectClassName="h-10 sm:h-12 rounded-xl bg-primary/5 border-primary/10"
                            />
                        </div>
                    )}

                    <div className="w-full sm:w-32 md:w-40">
                        <CustomSelect
                            value={filter}
                            onChange={setFilter}
                            options={[
                                { value: '1m', label: '1M' },
                                { value: '3m', label: '3M' },
                                { value: '6m', label: '6M' },
                                { value: 'all', label: 'All' }
                            ]}
                            icon={<Calendar size={14} />}
                            className="w-full"
                            selectClassName="h-10 sm:h-12 rounded-xl bg-primary/5 border-primary/10"
                        />
                    </div>
                </div>
            </div>

            <div className="h-[260px] sm:h-[300px] md:h-[340px] w-full relative bg-white/5 dark:bg-black/10 rounded-[1.5rem] p-3 sm:p-6 border border-white/10 shadow-inner group">
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
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                            <div className="p-4 rounded-[1.25rem] bg-black/90 backdrop-blur-xl border border-white/10 shadow-2xl min-w-[140px]">
                                                <div className="flex flex-col gap-0.5 mb-2">
                                                    <p className="text-[9px] font-black uppercase text-amber-500 tracking-[0.2em]">
                                                        {data.fullCycleName}
                                                    </p>
                                                    <p className="text-sm font-black text-white">
                                                        {data.period}
                                                    </p>
                                                </div>
                                                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Score</span>
                                                    <span className="text-base font-black text-amber-500">{data.score}</span>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
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
                    <div className="flex flex-col items-center justify-center h-full gap-0 opacity-40">
                        <div className="p-8 bg-white/5 rounded-full border border-white/5">
                            <Cpu size={64} className="text-muted-foreground" />
                        </div>
                        <div className="text-center">
                            <div className="text-xl font-black text-foreground mb-1">No Data Available</div>
                            {/*<p className="text-sm font-bold text-muted-foreground">Please select a user to view the chart.</p>*/}
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default AnalyticsCharts;
