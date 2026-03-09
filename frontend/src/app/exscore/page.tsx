'use client';

import React, { useState, useEffect } from 'react';
import apiClient from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar
} from 'recharts';
import { Loader2, Trophy, Activity, Hexagon, Search, Filter } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export default function ExScorePage() {
    // Controls
    const [userId, setUserId] = useState('');
    const [timeFilter, setTimeFilter] = useState('6m');
    const [skillFilter, setSkillFilter] = useState('');
    const [message, setMessage] = useState('');

    // Data
    // Fetch Global Data (Top Scores & Skill List)
    const { data: topOverallData } = useQuery({
        queryKey: ['exTopOverall'],
        queryFn: async () => {
            const res = await apiClient.get('/scores/top-overall').catch(() => ({ data: { data: { topScores: [] } } }));
            return res.data?.data?.topScores || [];
        }
    });

    const { data: topSkillsData } = useQuery({
        queryKey: ['exTopSkills'],
        queryFn: async () => {
            const res = await apiClient.get('/scores/top-skills').catch(() => ({ data: { data: { topSkillScorers: [] } } }));
            return res.data?.data?.topSkillScorers || [];
        }
    });

    const { data: skillsListData } = useQuery({
        queryKey: ['exSkillsOptions'],
        queryFn: async () => {
            const res = await apiClient.get('/admin/skills/options').catch(() => ({ data: { data: { skills: [] } } }));
            return res.data?.data?.skills || [];
        }
    });

    const topOverall = topOverallData || [];
    const topSkills = topSkillsData || [];
    const skillsList = skillsListData || [];

    // [Trigger] Only fetch user data when they hit ENTER or click "Load Data"
    const [activeUserId, setActiveUserId] = useState('');

    const loadUserData = () => {
        if (!userId.trim()) {
            setMessage('Please enter a User ID');
            return;
        }
        setActiveUserId(userId.trim());
        setMessage(`Data loaded for User ID: ${userId.trim()}`);
    };

    // 1. Fetch History
    const { data: historyRaw, isFetching: loadingHistory } = useQuery({
        queryKey: ['exScoresHistory', activeUserId, timeFilter, skillFilter],
        queryFn: async () => {
            const params: any = { filter: timeFilter };
            if (skillFilter) params.skill_id = skillFilter;
            const res = await apiClient.get(`/scores/history/${activeUserId}`, { params }).catch(() => ({ data: { data: { history: [] } } }));
            return res.data?.data?.history || [];
        },
        enabled: !!activeUserId
    });

    // 2. Fetch Spider
    const { data: spiderDataRaw, isFetching: loadingSpider } = useQuery({
        queryKey: ['exScoresDistribution', activeUserId],
        queryFn: async () => {
            const res = await apiClient.get(`/scores/distribution/${activeUserId}`).catch(() => ({ data: { data: { distribution: [] } } }));
            return res.data?.data?.distribution || [];
        },
        enabled: !!activeUserId
    });

    const historyData = React.useMemo(() => {
        if (!historyRaw) return [];
        return historyRaw.map((item: any) => ({
            period: item.period || 'Unknown',
            score: parseFloat(item.score || 0)
        }));
    }, [historyRaw]);

    const spiderData = spiderDataRaw || [];
    const loading = loadingHistory || loadingSpider;

    return (
        <div className="container mx-auto p-8 space-y-8 max-w-7xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-4xl font-black tracking-tight">ExScore Dashboard</h1>
                <div className={`px-4 py-2 rounded-full text-sm font-bold ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'} transition-all opacity-90`}>
                    {message || 'Ready'}
                </div>
            </div>

            {/* CONTROL PANEL */}
            <Card className="border-2 border-primary/10 shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Search className="w-5 h-5 text-primary" />
                        Explore User Data
                    </CardTitle>
                    <CardDescription>Enter a User ID to inspect their score history and skill distribution.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="userId" className="font-bold">User ID</Label>
                        <Input
                            type="text"
                            id="userId"
                            placeholder="e.g. 1"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && loadUserData()}
                        />
                    </div>
                    <Button onClick={loadUserData} disabled={loading} size="lg" className="font-bold">
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Load Data'}
                    </Button>
                </CardContent>
            </Card>

            {/* 1. TOP SCORES SECTION (Global) */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-yellow-100 text-yellow-700 rounded-xl shadow-sm">
                        <Trophy size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">Leaderboard</h2>
                        <p className="text-muted-foreground text-sm font-medium">Global Top Performers</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Top Overall */}
                    <Card className="overflow-hidden border-yellow-100 dark:border-yellow-900/20">
                        <CardHeader className="bg-gradient-to-r from-yellow-50 to-transparent dark:from-yellow-900/10">
                            <CardTitle>Top Overall</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="space-y-3">
                                {topOverall.length === 0 ? <p className="text-muted-foreground">No data available</p> : (
                                    topOverall.map((item: any, idx: number) => (
                                        <div key={idx} className="flex justify-between items-center p-3 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${idx === 0 ? 'bg-yellow-500 text-white' : idx === 1 ? 'bg-slate-400 text-white' : idx === 2 ? 'bg-orange-400 text-white' : 'bg-primary/20 text-primary'}`}>
                                                    {idx + 1}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm">{item.User?.full_name || 'Unknown'}</p>
                                                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{item.EvaluationCycle?.cycle_name}</p>
                                                </div>
                                            </div>
                                            <span className="font-mono font-black text-lg text-foreground">{parseFloat(item.final_score).toFixed(1)}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Top by Skill */}
                    <Card className="overflow-hidden border-indigo-100 dark:border-indigo-900/20">
                        <CardHeader className="bg-gradient-to-r from-indigo-50 to-transparent dark:from-indigo-900/10">
                            <CardTitle>Skill Champions</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {topSkills.length === 0 ? <p className="text-muted-foreground">No data available</p> : (
                                    topSkills.map((item: any, idx: number) => (
                                        <div key={idx} className="flex justify-between items-center p-3 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors">
                                            <div>
                                                <p className="font-bold text-sm text-foreground">{item.skill?.name}</p>
                                                <p className="text-xs text-muted-foreground font-medium">{item.user?.full_name}</p>
                                            </div>
                                            <span className="font-mono font-bold text-primary">{parseFloat(item.score).toFixed(1)}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* 2. HISTORY CHART */}
            <section>
                <div className="flex flex-wrap justify-between items-end mb-6 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 text-blue-700 rounded-xl shadow-sm">
                            <Activity size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">Progression History</h2>
                            <p className="text-muted-foreground text-sm font-medium">{userId ? `Tracking User #${userId}` : 'Select a user to view history'}</p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex gap-2 items-center">
                        <div className="relative group">
                            <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10" />
                            <select
                                className="h-10 pl-9 pr-4 rounded-md border border-input bg-background text-sm font-medium ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                value={skillFilter}
                                onChange={(e) => setSkillFilter(e.target.value)}
                            >
                                <option value="">All Skills (Average)</option>
                                {skillsList.map((s: any) => (
                                    <option key={s.id} value={s.id}>{s.skill_name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="bg-secondary/50 p-1 rounded-md flex gap-1">
                            {['1m', '3m', '6m', '1y', 'all'].map(t => (
                                <button
                                    key={t}
                                    onClick={() => setTimeFilter(t)}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-sm transition-all ${timeFilter === t ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    {t.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <Card className="p-6">
                    <div className="h-[400px] w-full">
                        {historyData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorHistoryScore" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                    <XAxis
                                        dataKey="period"
                                        stroke="hsl(var(--muted-foreground))"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        dy={10}
                                        tick={{ fontWeight: 600 }}
                                    />
                                    <YAxis
                                        domain={[0, 10]}
                                        stroke="hsl(var(--muted-foreground))"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `${value}`}
                                        tick={{ fontWeight: 600 }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            background: 'hsl(var(--popover))',
                                            borderRadius: '12px',
                                            border: '1px solid hsl(var(--border))',
                                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                                        }}
                                        labelStyle={{ color: 'hsl(var(--muted-foreground))', fontWeight: 'bold', marginBottom: '4px' }}
                                        itemStyle={{ color: 'hsl(var(--primary))', fontWeight: 'bold' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="score"
                                        stroke="hsl(var(--primary))"
                                        fillOpacity={1}
                                        fill="url(#colorHistoryScore)"
                                        strokeWidth={4}
                                        activeDot={{ r: 6, strokeWidth: 0, fill: 'hsl(var(--primary))' }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-4">
                                <Activity size={48} className="opacity-20" />
                                <p className="font-medium">{userId ? 'No history data found for this selection' : 'Enter User ID to view history'}</p>
                            </div>
                        )}
                    </div>
                </Card>
            </section>

            {/* 3. SPIDER CHART SECTION */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-purple-100 text-purple-700 rounded-xl shadow-sm">
                        <Hexagon size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">Skill DNA</h2>
                        <p className="text-muted-foreground text-sm font-medium">{userId ? `Profile for User #${userId}` : 'Select a user to view distribution'}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-8">
                    <Card className="flex flex-col items-center p-8 border-purple-100 dark:border-purple-900/20">
                        <div className="h-[500px] w-full max-w-4xl">
                            {spiderData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={spiderData}>
                                        <PolarGrid stroke="hsl(var(--border))" />
                                        <PolarAngleAxis dataKey="skill" tick={{ fill: 'hsl(var(--foreground))', fontSize: 13, fontWeight: 700 }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 10]} stroke="hsl(var(--muted-foreground))" />
                                        <Radar
                                            name="Skill Score"
                                            dataKey="score"
                                            stroke="hsl(var(--primary))"
                                            strokeWidth={3}
                                            fill="hsl(var(--primary))"
                                            fillOpacity={0.3}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                background: 'hsl(var(--background))',
                                                borderColor: 'hsl(var(--border))',
                                                borderRadius: '8px'
                                            }}
                                            itemStyle={{ fontWeight: 'bold', color: 'hsl(var(--primary))' }}
                                        />
                                    </RadarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-4">
                                    <Hexagon size={48} className="opacity-20" />
                                    <p className="font-medium">{userId ? 'No skill data found for this user' : 'Enter User ID to view skill distribution'}</p>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </section>
        </div>
    );
}
