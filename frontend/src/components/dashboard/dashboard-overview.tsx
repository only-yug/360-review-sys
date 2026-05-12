'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
import StatCard from './stat-card';
import Leaderboard from './leaderboard';
import AnalyticsCharts from './analytics-charts';
import SkillsDNA from './skills-dna';
import { CustomSelect } from '@/components/ui/custom-select';

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
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/10 border border-primary/20 text-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/10">
                        <BarChart3 size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black tracking-tight uppercase">Performance Analysis</h2>
                        {/*<p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">Growth trajectories</p>*/}
                    </div>
                </div>
            );
        }

        if (role === 'manager') {
            return (
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 flex-shrink-0 bg-primary/10 border border-primary/20 text-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/10">
                            <BarChart3 size={20} />
                        </div>
                        <div className="flex-shrink-0">
                            <h2 className="text-lg font-black tracking-tight uppercase">Performance Analysis</h2>
                            {/*<p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest leading-none">Departments</p>*/}
                        </div>
                    </div>
                    {onUserSelect && (
                        <div className="w-full md:w-64 lg:w-72">
                            <CustomSelect
                                value={(selectedUserForChart || user.id || user._id || '').toString()}
                                onChange={onUserSelect}
                                options={[
                                    { value: (user.id || user._id || '').toString(), label: `${user.full_name} (Me)` },
                                    ...team.map((u: any) => ({
                                        value: (u._id || u.id).toString(),
                                        label: u.full_name
                                    }))
                                ]}
                                className="w-full"
                                selectClassName="h-10 rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors border-primary/10"
                            />
                        </div>
                    )}
                </div>
            );
        }

        if (role === 'admin') {
            return (
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 flex-shrink-0 bg-primary/10 border border-primary/20 text-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/10">
                            <BarChart3 size={20} />
                        </div>
                        <div className="flex-shrink-0">
                            <h2 className="text-lg font-black tracking-tight uppercase leading-tight tracking-tighter">Performance Analysis</h2>
                            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest leading-none">Employee Overview</p>
                        </div>
                    </div>
                    {onUserSelect && (
                        <div className="w-full md:w-64 lg:w-72">
                            <CustomSelect
                                value={selectedUserForChart || ''}
                                onChange={onUserSelect}
                                options={[
                                    { value: '', label: 'Select Users' },
                                    ...allUsers
                                        .filter((u: any) => u.role !== 'admin')
                                        .map((u: any) => ({
                                            value: (u._id || u.id).toString(),
                                            label: `${u.full_name} (${u.role})`
                                        }))
                                ]}
                                className="w-full"
                                selectClassName="h-10 rounded-xl bg-primary/5 transition-colors border-primary/10"
                            />
                        </div>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <motion.div key="overview" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} className="space-y-6">
            <div className={`grid grid-cols-2 sm:grid-cols-2 ${role === 'admin' ? 'md:grid-cols-4' : 'lg:grid-cols-4'} gap-4`}>
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

            <div className="flex flex-col gap-6">
                <div className="w-full">
                    <Leaderboard
                        reviews={pendingReviews}
                        skills={skills}
                    />
                </div>
                <div className="w-full">
                    <div className="glass-card p-4 sm:p-6 lg:p-8 rounded-[2rem] border-white/10 shadow-2xl h-full flex flex-col relative">
                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-primary/5 blur-[120px] pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-amber-500/5 blur-[120px] pointer-events-none" />

                        {/* No longer calling renderAnalyticsHeader() here as it's passed to AnalyticsCharts */}
                        <div className="flex-1">
                            <AnalyticsCharts
                                userId={role === 'employee' ? user.id : selectedUserForChart}
                                showSkillDropdown={true} // Enabled for all roles as per request
                                skillsData={skills}
                                headerContent={renderAnalyticsHeader()}
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
