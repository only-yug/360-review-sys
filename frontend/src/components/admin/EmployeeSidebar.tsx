"use client";

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Employee } from '@/types/adminDashboard';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

// Simple Progress component since it wasn't valid in ui list
const SimpleProgress = ({ value, max, className }: { value: number, max: number, className?: string }) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    return (
        <div className={cn("h-1.5 w-full bg-secondary rounded-full overflow-hidden", className)}>
            <div
                className="h-full bg-primary transition-all duration-500 ease-in-out"
                style={{ width: `${percentage}%` }}
            />
        </div>
    )
}

interface EmployeeSidebarProps {
    employees: Employee[];
    selectedEmployeeId: string | null;
    onSelectEmployee: (id: string) => void;
    viewMode?: 'target' | 'reviewer';
}

export const EmployeeSidebar: React.FC<EmployeeSidebarProps> = ({ employees, selectedEmployeeId, onSelectEmployee, viewMode = 'target' }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredEmployees = employees.filter(emp =>
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="h-full flex flex-col border-r border-border dark:border-white/5 bg-background dark:bg-zinc-900/30 backdrop-blur-md">
            <div className="p-5 border-b border-border dark:border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-lg text-foreground dark:text-white tracking-tight">Employees</h2>
                    <span className="text-xs bg-muted dark:bg-white/5 text-muted-foreground dark:text-zinc-400 px-2 py-1 rounded-full">{filteredEmployees.length}</span>
                </div>
                <div className="relative group">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground dark:text-zinc-500 group-focus-within:text-indigo-500 dark:group-focus-within:text-indigo-400 transition-colors" />
                    <input
                        placeholder="Search by name or role..."
                        className="w-full h-9 pl-9 pr-4 bg-background dark:bg-black/20 border border-border dark:border-white/5 rounded-lg text-sm text-foreground dark:text-zinc-200 placeholder:text-muted-foreground dark:placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/30 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
                {filteredEmployees.map((emp) => (
                    <motion.button
                        layout
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={emp.id}
                        onClick={() => onSelectEmployee(emp.id)}
                        className={cn(
                            "w-full flex flex-col p-3 rounded-xl text-left transition-all duration-200 border border-transparent group relative overflow-hidden",
                            selectedEmployeeId === emp.id
                                ? "bg-muted dark:bg-white/5 border-border dark:border-white/10 shadow-lg shadow-black/5 dark:shadow-black/20"
                                : "hover:bg-accent dark:hover:bg-white/5 hover:border-border dark:hover:border-white/5"
                        )}
                    >
                        {selectedEmployeeId === emp.id && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-l-xl" />
                        )}

                        <div className="flex justify-between items-start w-full mb-3 pl-2">
                            <div>
                                <span className={cn("font-medium block text-sm transition-colors", selectedEmployeeId === emp.id ? "text-foreground dark:text-white" : "text-muted-foreground dark:text-zinc-300 group-hover:text-foreground dark:group-hover:text-white")}>
                                    {emp.name}
                                </span>
                                <span className="text-[11px] text-muted-foreground dark:text-zinc-500 uppercase tracking-wide block">{emp.role}</span>
                            </div>
                            {/* Status Dot */}
                            <div className={cn(
                                "w-2 h-2 rounded-full mt-1.5 shadow-[0_0_8px]",
                                emp.stats?.status === 'Complete' ? 'bg-emerald-500 shadow-emerald-500/50' :
                                    emp.stats?.status === 'At Risk' ? 'bg-rose-500 shadow-rose-500/50' : 'bg-amber-500 shadow-amber-500/50'
                            )} />
                        </div>

                        {/* Progress Bar - Context Aware */}
                        <div className="w-full space-y-1.5 pl-2">
                            <div className="flex justify-between text-[10px] text-muted-foreground dark:text-zinc-500 font-medium">
                                <span>{viewMode === 'target' ? 'Received' : 'Written'}</span>
                                <span className={cn(selectedEmployeeId === emp.id && "text-indigo-600 dark:text-indigo-400")}>
                                    {viewMode === 'target'
                                        ? `${emp.stats?.reviewsReceived || 0} / ${emp.stats?.totalReviewsExpected || 0}`
                                        : `${emp.stats?.reviewsWritten || 0} / ${emp.stats?.totalReviewsToWrite || 0}`
                                    }
                                </span>
                            </div>
                            <div className="h-1.5 w-full bg-border dark:bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                    className={cn(
                                        "h-full transition-all duration-500 ease-in-out rounded-full",
                                        selectedEmployeeId === emp.id ? "bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" : "bg-zinc-300 dark:bg-zinc-600 group-hover:bg-zinc-400 dark:group-hover:bg-zinc-500"
                                    )}
                                    style={{
                                        width: `${Math.min(100, Math.max(0, (
                                            viewMode === 'target'
                                                ? ((emp.stats?.reviewsReceived || 0) / (emp.stats?.totalReviewsExpected || 1))
                                                : ((emp.stats?.reviewsWritten || 0) / (emp.stats?.totalReviewsToWrite || 1))
                                        ) * 100))}%`
                                    }}
                                />
                            </div>
                        </div>
                    </motion.button>
                ))}

                {filteredEmployees.length === 0 && (
                    <div className="p-8 text-center text-sm text-muted-foreground dark:text-zinc-600 flex flex-col items-center">
                        <Search className="w-8 h-8 opacity-20 mb-2" />
                        <span>No employees found</span>
                    </div>
                )}
            </div>
        </div>
    );
};
