'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

interface Tab {
    name: string;
    icon: React.ReactNode;
}

interface DashboardShellProps {
    user: {
        full_name: string;
        role?: string;
    } | null;
    tabs: Tab[];
    activeTab: string;
    onTabChange: (tab: string) => void;
    children: React.ReactNode;
    headerExtras?: React.ReactNode;
}

export default function DashboardShell({
    user,
    tabs,
    activeTab,
    onTabChange,
    children,
    headerExtras
}: DashboardShellProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    // On mount: restore tab from URL ?tab= param
    useEffect(() => {
        const tabFromUrl = searchParams.get('tab');
        if (tabFromUrl && tabs.some(t => t.name === tabFromUrl) && tabFromUrl !== activeTab) {
            onTabChange(tabFromUrl);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // When tab changes: sync to URL
    const handleTabChange = useCallback((tabName: string) => {
        onTabChange(tabName);
        const params = new URLSearchParams(searchParams.toString());
        if (tabName === tabs[0]?.name) {
            params.delete('tab'); // Don't clutter URL for default tab
        } else {
            params.set('tab', tabName);
        }
        const qs = params.toString();
        router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
    }, [onTabChange, searchParams, tabs, pathname, router]);

    if (!user) return null;

    return (
        <div className="min-h-screen bg-background pt-20 sm:pt-32 pb-10 px-4 sm:px-8 max-w-[1600px] mx-auto">
            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 lg:gap-10 mb-6 lg:mb-10 relative z-40"
            >
                <div className="space-y-4 flex items-center justify-between lg:block w-full lg:w-auto">
                    <div>
                        <h1 className="text-2xl sm:text-4xl font-black tracking-tighter leading-none mb-2">
                            {user.role === 'manager' ? 'Manager Portal' : (user.role === 'admin' ? 'Admin Hub' : 'Welcome Back,')}
                            <span className="text-primary italic block sm:inline"> {user.full_name}</span>
                        </h1>
                        {headerExtras}
                    </div>
 
                    {/* Mobile Sidebar Toggle */}
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="lg:hidden p-2 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white active:scale-95 transition-transform"
                    >
                        <Menu size={24} />
                    </button>
                </div>
 
                {/* Desktop Tabs */}
                <div className="hidden lg:flex flex-wrap p-1.5 gap-1 bg-white/10 dark:bg-white/5 border border-white/10 rounded-[2rem] backdrop-blur-2xl shadow-2xl overflow-hidden self-start lg:self-auto uppercase tracking-tighter">
                    {tabs.map(tab => (
                        <button
                            key={tab.name}
                            onClick={() => handleTabChange(tab.name)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-[1.5rem] text-[13px] font-black transition-all active:scale-[0.95] whitespace-nowrap ${activeTab === tab.name
                                ? 'bg-primary text-white shadow-xl shadow-primary/30'
                                : 'text-gray-600 dark:text-muted-foreground hover:text-gray-900 dark:hover:text-foreground hover:bg-gray-100 dark:hover:bg-white/5'
                                }`}
                        >
                            {tab.icon}
                            {tab.name}
                        </button>
                    ))}
                </div>
            </motion.header>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsSidebarOpen(false)}
                            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm lg:hidden"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 right-0 z-[101] w-64 bg-white dark:bg-[#0a0a0a] border-l border-gray-200 dark:border-white/10 shadow-2xl p-6 lg:hidden overflow-y-auto"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Menu</h3>
                                <button
                                    onClick={() => setIsSidebarOpen(false)}
                                    className="p-2 bg-gray-100 dark:bg-white/5 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 transition-colors text-gray-500 dark:text-gray-400"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="flex flex-col gap-2">
                                {tabs.map(tab => (
                                    <button
                                        key={tab.name}
                                        onClick={() => {
                                            handleTabChange(tab.name);
                                            setIsSidebarOpen(false);
                                        }}
                                        className={`flex items-center gap-3 px-5 py-4 rounded-[1.25rem] text-sm font-bold transition-all active:scale-[0.98] ${activeTab === tab.name
                                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                            : 'text-gray-600 dark:text-muted-foreground hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10'
                                            }`}
                                    >
                                        {tab.icon}
                                        {tab.name}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content Area - Just Render Children */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {children}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
