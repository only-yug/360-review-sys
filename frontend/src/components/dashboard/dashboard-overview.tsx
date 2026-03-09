'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
import StatCard from './stat-card';
import Leaderboard from './leaderboard';
import AnalyticsCharts from './analytics-charts';
import SkillsDNA from './skills-dna';

interface DashboardOverviewProps {
    role: 'admin' | 'manager' | 'employee';
    user: any;
    stats: {
        icon: React.ReactNode;
        label: string;
        value: string | number;
        color: string;
        delay: number;
    }[];
    pendingReviews: any[];
    skills: any[];
    // For Select Dropdown Logic
    allUsers?: any[]; // For Admin
    team?: any[]; // For Manager
    selectedUserForChart?: string;
    onUserSelect?: (val: string) => void;
    teamRequestsCount?: number; // For Admin Open Tickets stat calculation logic if needed, but stats are passed fully formed.
}

export default function DashboardOverview({
    role,
    user,
    stats,
    pendingReviews,
    skills,
    allUsers = [],
    team = [],
    selectedUserForChart,
    onUserSelect
}: DashboardOverviewProps) {

    const renderAnalyticsHeader = () => {
        if (role === 'employee') {
            return (
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-primary/10 border border-primary/20 text-primary rounded-2xl flex items-center justify-center shadow-xl shadow-primary/10">
                        <BarChart3 size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black tracking-tight uppercase">Performance Vector Analysis</h2>
                        <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">Visualizing your individual vector growth trajectories</p>
                    </div>
                </div>
            );
        }

        if (role === 'manager') {
            return (
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 border border-primary/20 text-primary rounded-2xl flex items-center justify-center shadow-xl shadow-primary/10">
                            <BarChart3 size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tight uppercase">Performance Vector Analysis</h2>
                            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">Granular analytics across departmental vectors</p>
                        </div>
                    </div>
                    {onUserSelect && (
                        <select
                            value={selectedUserForChart}
                            onChange={(e) => onUserSelect(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-xl h-12 px-4 font-black text-xs outline-none focus:ring-4 focus:ring-primary/10 transition-all min-w-[240px]"
                        >
                            <option value={(user.id || user._id || '').toString()}>{user.full_name} (Me)</option>
                            {team.map((u: any) => (
                                <option key={u._id || u.id} value={u._id || u.id}>{u.full_name}</option>
                            ))}
                        </select>
                    )}
                </div>
            );
        }

        if (role === 'admin') {
            return (
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <h2 className="text-2xl font-black tracking-tight uppercase">Performance Vector Analysis</h2>
                    {onUserSelect && (
                        <select
                            value={selectedUserForChart}
                            onChange={(e) => onUserSelect(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-xl h-12 px-4 font-black text-xs outline-none focus:ring-4 focus:ring-primary/10 transition-all min-w-[240px]"
                        >
                            <option value="">Aggregate Workforce View</option>
                            {allUsers
                                .filter((u: any) => u.role !== 'admin')
                                .map((u: any) => (
                                    <option key={u._id || u.id} value={u._id || u.id}>{u.full_name} ({u.role})</option>
                                ))}
                        </select>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <motion.div key="overview" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} className="space-y-8">
            <div className={`grid grid-cols-2 sm:grid-cols-2 ${role === 'admin' ? 'md:grid-cols-4' : 'lg:grid-cols-4'} gap-3 sm:gap-6`}>
                {stats.map((stat, idx) => (
                    <StatCard
                        key={idx}
                        icon={stat.icon}
                        label={stat.label}
                        value={stat.value}
                        color={stat.color}
                        delay={stat.delay}
                    />
                ))}
            </div>

            <div className="flex flex-col gap-8">
                <div className="w-full">
                    <Leaderboard
                        reviews={pendingReviews}
                        skills={skills}
                    />
                </div>
                <div className="w-full">
                    <div className="glass-card p-4 sm:p-8 md:p-10 lg:p-14 rounded-[2rem] sm:rounded-[3rem] lg:rounded-[4rem] border-white/10 shadow-2xl h-full flex flex-col">
                        {renderAnalyticsHeader()}
                        <div className="flex-1">
                            <AnalyticsCharts
                                userId={role === 'employee' ? user.id : selectedUserForChart}
                                showSkillDropdown={true} // Enabled for all roles as per request
                                skillsData={skills}
                            />
                        </div>
                    </div>
                </div>

                <div className="w-full">
                    <SkillsDNA userId={role === 'employee' ? user.id : selectedUserForChart} />
                </div>
            </div>
        </motion.div>
    );
}
