'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    color: string;
    delay?: number;
}

export default function StatCard({ icon, label, value, color, delay = 0 }: StatCardProps) {
    const colorClasses: any = {
        primary: 'from-orange-400/20 to-orange-600/20 text-primary border-primary/20 shadow-primary/10',
        orange: 'from-amber-400/20 to-amber-600/20 text-amber-500 border-amber-500/20 shadow-amber-500/10',
        red: 'from-rose-500/20 to-red-600/20 text-rose-500 border-rose-500/20 shadow-rose-500/10',
        green: 'from-emerald-400/20 to-green-600/20 text-emerald-500 border-emerald-500/20 shadow-emerald-500/10'
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className={`glass-card p-3 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] border border-white/10 hover:border-white/30 transition-all group relative overflow-hidden flex flex-col items-center text-center`}
        >
            <div className="absolute top-0 right-0 w-16 h-16 sm:w-24 sm:h-24 bg-white/5 rounded-full blur-3xl -mr-8 -mt-8 sm:-mr-12 sm:-mt-12 group-hover:bg-primary/5 transition-all" />

            <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center mb-2 sm:mb-3 bg-gradient-to-br ${colorClasses[color] || colorClasses.primary} border shadow-2xl group-hover:scale-110 transition-all duration-500`}>
                {React.cloneElement(icon as React.ReactElement, { className: "w-5 h-5 sm:w-auto sm:h-auto" })}
            </div>
            <div className="space-y-0.5 relative z-10 w-full">
                <div className="text-xl sm:text-3xl font-black text-foreground tracking-tighter tabular-nums leading-none mb-1 group-hover:scale-105 transition-transform truncate w-full">{value}</div>
                <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60 truncate w-full">{label}</p>
            </div>
        </motion.div>
    );
}
