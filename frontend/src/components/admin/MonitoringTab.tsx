"use client";

import React, { useState, useEffect } from 'react';
import { DashboardShell } from '@/components/admin/DashboardShell';
import { EmployeeSidebar } from '@/components/admin/EmployeeSidebar';
import { AuditPanel } from '@/components/admin/AuditPanel';
import { Cycle, Employee } from '@/types/adminDashboard';
import apiClient from '@/lib/api';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const MonitoringTab = () => {
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'target' | 'reviewer'>('target');
    const [selectedCycleId, setSelectedCycleId] = useState<string>('');
    const [cycles, setCycles] = useState<Cycle[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loadingCycles, setLoadingCycles] = useState(true);
    const [loadingEmployees, setLoadingEmployees] = useState(false);

    // Fetch Cycles
    useEffect(() => {
        const fetchCycles = async () => {
            try {
                const res = await apiClient.get('/admin/cycles');
                const fetchedCycles = res.data;
                setCycles(fetchedCycles);
                if (fetchedCycles.length > 0 && !selectedCycleId) {
                    // Default to active or first
                    const active = fetchedCycles.find((c: any) => c.status === 'active');
                    setSelectedCycleId(active ? active.id : fetchedCycles[0].id);
                }
            } catch (error) {
                console.error("Failed to fetch cycles", error);
            } finally {
                setLoadingCycles(false);
            }
        };
        fetchCycles();
    }, []);

    // Fetch Employees when cycle changes
    useEffect(() => {
        if (!selectedCycleId) return;

        const fetchEmployees = async () => {
            setLoadingEmployees(true);
            try {
                const res = await apiClient.get('/admin/dashboard/employees', {
                    params: { cycleId: selectedCycleId, limit: 100 }
                });
                setEmployees(res.data.data);
            } catch (error) {
                console.error("Failed to fetch employees", error);
            } finally {
                setLoadingEmployees(false);
            }
        };
        fetchEmployees();
    }, [selectedCycleId]);

    const selectedEmployee = employees.find(e => e.id === selectedEmployeeId) || null;

    if (loadingCycles) {
        return (
            <div className="h-[600px] w-full flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full h-[85vh] rounded-[2rem] overflow-hidden border border-border dark:border-white/10 shadow-2xl bg-card dark:bg-[#09090b]"
        >
            <DashboardShell
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                cycleId={selectedCycleId}
                onCycleChange={setSelectedCycleId}
                cycles={cycles}
            >
                <div className="flex h-full w-full">
                    {/* Left Sidebar - Navigation */}
                    <div className="w-80 border-r border-border dark:border-white/10 bg-muted/30 dark:bg-zinc-950/50 backdrop-blur-sm h-full shrink-0 hidden md:block">
                        {loadingEmployees ? (
                            <div className="flex h-full items-center justify-center">
                                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <EmployeeSidebar
                                employees={employees}
                                selectedEmployeeId={selectedEmployeeId}
                                onSelectEmployee={setSelectedEmployeeId}
                                viewMode={viewMode}
                            />
                        )}
                    </div>

                    {/* Right Panel - Workspace */}
                    <div className="flex-1 h-full overflow-hidden bg-background dark:bg-zinc-950 relative">
                        {selectedEmployeeId ? (
                            <AuditPanel
                                employee={selectedEmployee}
                                viewMode={viewMode}
                                cycleId={selectedCycleId}
                                cycles={cycles}
                                key={selectedEmployeeId}
                            />
                        ) : (
                            // Empty State
                            <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground animate-in fade-in zoom-in duration-300">
                                <div className="w-64 text-center space-y-4">
                                    <div className="w-20 h-20 bg-muted dark:bg-white/5 rounded-full mx-auto flex items-center justify-center">
                                        <span className="text-4xl">👋</span>
                                    </div>
                                    <h2 className="text-2xl font-bold text-foreground">Audit Console</h2>
                                    <p>Select an employee from the sidebar to begin auditing performance reviews.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </DashboardShell>
        </motion.div>
    );
};
