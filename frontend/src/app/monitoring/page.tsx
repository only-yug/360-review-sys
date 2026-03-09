"use client";

import React, { useState, useEffect } from 'react';
import { DashboardShell } from '@/components/admin/DashboardShell';
import { EmployeeSidebar } from '@/components/admin/EmployeeSidebar';
import { AuditPanel } from '@/components/admin/AuditPanel';
import { Cycle, Employee } from '@/types/adminDashboard';
import apiClient from '@/lib/api';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { useQuery } from '@tanstack/react-query';

export default function AdminDashboardPage() {
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'target' | 'reviewer'>('target');
    const [selectedCycleId, setSelectedCycleId] = useState<string>('');

    // Fetch Cycles
    const { data: cyclesData, isLoading: loadingCycles } = useQuery({
        queryKey: ['monitoringCycles'],
        queryFn: async () => {
            const res = await apiClient.get('/admin/cycles').catch(() => ({ data: [] }));
            return res.data;
        }
    });

    // Default cycle selection effect - dependent on cycle data stability
    useEffect(() => {
        if (cyclesData && cyclesData.length > 0 && !selectedCycleId) {
            const active = cyclesData.find((c: any) => c.status === 'active');
            setSelectedCycleId(active ? active.id : cyclesData[0].id);
        }
    }, [cyclesData, selectedCycleId]);

    // Fetch Employees
    const { data: employeesData, isLoading: loadingEmployees } = useQuery<Employee[]>({
        queryKey: ['monitoringEmployees', selectedCycleId],
        queryFn: async () => {
            const res = await apiClient.get('/admin/dashboard/employees', {
                params: { cycleId: selectedCycleId, limit: 100 }
            }).catch(() => ({ data: { data: [] } }));
            return res.data.data || [];
        },
        enabled: !!selectedCycleId
    });

    const cycles = cyclesData || [];
    const employees = employeesData || [];

    const selectedEmployee = employees.find((e: Employee) => e.id === selectedEmployeeId) || null;

    if (loadingCycles) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-background">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <DashboardShell
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            cycleId={selectedCycleId}
            onCycleChange={setSelectedCycleId}
            cycles={cycles}
        >
            <div className="flex h-full w-full">
                {/* Left Sidebar - Navigation */}
                <div className="w-80 border-r bg-card/30 backdrop-blur-sm h-full shrink-0 hidden md:block">
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
                <div className="flex-1 h-full overflow-hidden bg-background relative">
                    {selectedEmployeeId ? (
                        <AuditPanel
                            employee={selectedEmployee}
                            viewMode={viewMode}
                            cycleId={selectedCycleId}
                            cycles={cycles}
                            key={selectedEmployeeId} // Force remount on switch for clean data fetch
                        />
                    ) : (
                        // Empty State
                        <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground animate-in fade-in zoom-in duration-300">
                            <div className="w-64 text-center space-y-4">
                                <div className="w-20 h-20 bg-muted rounded-full mx-auto flex items-center justify-center">
                                    <span className="text-4xl">👋</span>
                                </div>
                                <h2 className="text-2xl font-bold text-foreground">Welcome, Admin</h2>
                                <p>Select an employee from the list to start auditing their performance reviews.</p>
                                <p className="text-xs opacity-70">Pro Tip: Use the toggle in the top bar to switch perspectives.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardShell>
    );
};
