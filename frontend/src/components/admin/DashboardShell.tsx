"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, LayoutGrid, Users, ChevronDown, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Cycle } from '@/types/adminDashboard';
import { cn } from '@/lib/utils';

interface DashboardShellProps {
    children: React.ReactNode;
    viewMode: 'target' | 'reviewer';
    onViewModeChange: (mode: 'target' | 'reviewer') => void;
    cycleId: string;
    onCycleChange: (id: string) => void;
    cycles: Cycle[];
}

export const DashboardShell: React.FC<DashboardShellProps> = ({ children, viewMode, onViewModeChange, cycleId, onCycleChange, cycles }) => {
    return (
        <div className="h-screen w-full flex flex-col bg-background text-foreground dark:bg-zinc-950 dark:text-zinc-100 overflow-hidden font-sans relative selection:bg-indigo-500/30">
            {/* Background Gradient Mesh */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/20 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/20 blur-[120px]" />
            </div>

            {/* Top Control Bar */}
            <header className="h-20 border-b border-border dark:border-white/5 bg-background/80 dark:bg-zinc-950/60 backdrop-blur-xl flex items-center justify-between px-8 shrink-0 z-50">
                <div className="flex items-center space-x-6">
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard/admin">
                            <Button variant="ghost" className="h-10 w-10 p-0 rounded-xl bg-muted dark:bg-white/5 border border-border dark:border-white/10 hover:bg-accent dark:hover:bg-white/10 text-foreground dark:text-white hover:text-foreground/80 dark:hover:text-white/80 transition-all">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="font-bold text-xl tracking-tight text-foreground dark:text-white leading-none">Monitoring</h1>
                            <span className="text-xs font-medium text-muted-foreground dark:text-zinc-500 uppercase tracking-widest">Audit Console</span>
                        </div>
                    </div>

                    <div className="h-8 w-px bg-border dark:bg-white/10 mx-2" />

                    {/* Cycle Selector */}
                    <div className="relative group">
                        <select
                            className="w-[240px] h-10 pl-4 pr-10 text-sm bg-muted/50 dark:bg-zinc-900/50 border border-border dark:border-white/10 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all hover:bg-muted dark:hover:bg-zinc-900/80 text-foreground dark:text-zinc-300 font-medium"
                            value={cycleId}
                            onChange={(e) => onCycleChange(e.target.value)}
                        >
                            {cycles.map(cycle => (
                                <option key={cycle.id} value={cycle.id} className="bg-background dark:bg-zinc-900 text-foreground dark:text-zinc-300">
                                    {cycle.label}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-muted-foreground dark:text-zinc-500 pointer-events-none group-hover:text-foreground dark:group-hover:text-zinc-300 transition-colors" />
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    {/* View Mode Toggle */}
                    <div className="flex items-center bg-muted dark:bg-zinc-900/80 p-1.5 rounded-lg border border-border dark:border-white/5">
                        <button
                            onClick={() => onViewModeChange('target')}
                            className={cn(
                                "px-4 py-2 text-xs font-semibold rounded-md flex items-center gap-2 transition-all duration-300",
                                viewMode === 'target'
                                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/20"
                                    : "text-muted-foreground hover:text-foreground dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5"
                            )}
                        >
                            <Users className="w-3.5 h-3.5" /> Target
                        </button>
                        <button
                            onClick={() => onViewModeChange('reviewer')}
                            className={cn(
                                "px-4 py-2 text-xs font-semibold rounded-md flex items-center gap-2 transition-all duration-300",
                                viewMode === 'reviewer'
                                    ? "bg-purple-600 text-white shadow-lg shadow-purple-900/20"
                                    : "text-muted-foreground hover:text-foreground dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5"
                            )}
                        >
                            <Users className="w-3.5 h-3.5" /> Reviewer
                        </button>
                    </div>

                    <Button variant="outline" size="sm" className="h-10 border-border dark:border-white/10 bg-muted dark:bg-white/5 hover:bg-accent dark:hover:bg-white/10 text-foreground dark:text-zinc-300 hover:text-foreground dark:hover:text-white gap-2 rounded-lg transition-all">
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">Export</span>
                    </Button>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 overflow-hidden relative z-10 flex">
                {children}
            </main>
        </div>
    );
};
