'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { BarChart3, LogOut, User as UserIcon, Mail, Shield, ChevronDown, Activity } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';
import { Button } from './ui/button';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

export function Navbar() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    // Close dropdown on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-gray-200 dark:border-white/10 h-20 transition-all duration-300">
            <div className="container mx-auto h-full px-4 sm:px-6 flex items-center justify-between">
                {/* Branding */}
                <Link href="/" className="flex items-center gap-2 sm:gap-3 group transition-all hover:scale-[1.02] active:scale-[0.98]">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-primary flex items-center justify-center shadow-xl shadow-primary/30 text-white transform group-hover:rotate-6 transition-transform">
                        <BarChart3 size={24} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xl sm:text-2xl font-black tracking-tighter text-foreground leading-none">
                            360<span className="text-primary italic">Feedback</span>
                        </span>
                        <span className="text-[8px] sm:text-[10px] text-muted-foreground font-bold tracking-[0.2em] uppercase mt-0.5 ml-0.5 hidden xs:block">Performance Intelligence</span>
                    </div>
                </Link>

                {/* Actions */}
                <div className="flex items-center gap-2 sm:gap-4">
                    <div className="p-1 px-1.5 rounded-xl sm:rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center shadow-inner">
                        <ThemeToggle />
                    </div>

                    {user?.role === 'admin' && (
                        <Link href="/monitoring">
                            <button className="flex items-center gap-2 p-1.5 sm:p-2 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/10 transition-all active:scale-[0.95] group">
                                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-500 group-hover:bg-indigo-500/20 transition-colors">
                                    <Activity size={18} />
                                </div>
                                <span className="hidden sm:inline font-bold text-sm text-foreground mr-2">Monitoring</span>
                            </button>
                        </Link>
                    )}

                    {user ? (
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className="flex items-center gap-2 p-1.5 sm:p-2 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/10 transition-all active:scale-[0.95] group"
                            >
                                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/20 text-primary transition-transform group-hover:rotate-3">
                                    <UserIcon size={18} />
                                </div>
                                <div className="hidden md:block text-left mr-1">
                                    <p className="text-sm font-black text-foreground leading-none tracking-tight">{user.firstName} {user.lastName}</p>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-extrabold mt-1">{user.role}</p>
                                </div>
                                <ChevronDown size={16} className={`text-muted-foreground transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Profile Dropdown */}
                            {isProfileOpen && (
                                <div className="absolute top-full right-0 mt-3 w-64 sm:w-72 bg-white dark:bg-[#0d0d0d] rounded-[2rem] shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden animate-fade-in z-[60] chai-glow">
                                    <div className="p-5 bg-gray-50/50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                                                <UserIcon size={24} />
                                            </div>
                                            <div className="flex flex-col">
                                                <p className="font-black text-foreground text-lg leading-tight tracking-tight">{user.full_name}</p>
                                                <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5 mt-0.5">
                                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                                    {user.role}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3 p-2 rounded-xl bg-gray-100 dark:bg-white/5 text-muted-foreground hover:text-foreground transition-colors group">
                                                <Mail size={16} className="text-primary/60 group-hover:text-primary transition-colors" />
                                                <span className="text-xs font-bold truncate tracking-tight">{user.email}</span>
                                            </div>
                                            <div className="flex items-center gap-3 p-2 rounded-xl bg-gray-100 dark:bg-white/5 text-muted-foreground hover:text-foreground transition-colors group">
                                                <Shield size={16} className="text-primary/60 group-hover:text-primary transition-colors" />
                                                <span className="text-xs font-bold uppercase tracking-wider">{user.role} Authorization</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-2">
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 p-3 rounded-xl bg-destructive/5 text-destructive hover:bg-destructive hover:text-white transition-all group font-bold"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                                                <LogOut size={18} />
                                            </div>
                                            <span>Sign Out</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="hidden sm:flex items-center gap-2">
                            <Link href="/login">
                                <Button variant="ghost" className="rounded-2xl font-bold hover:bg-primary/10 transition-colors">Login</Button>
                            </Link>
                            <Link href="/register">
                                <Button className="rounded-2xl font-bold chai-gradient shadow-lg shadow-primary/30 text-white border-0 hover:shadow-primary/50 transition-all">Get Started</Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
