'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { useAlert } from '@/lib/alert-context';

export const CustomAlert = () => {
    const { state, hideAlert } = useAlert();

    const icons = {
        success: <CheckCircle2 size={40} className="text-green-500" />,
        error: <ShieldAlert size={40} className="text-red-500" />,
        warning: <AlertTriangle size={40} className="text-amber-500" />,
        info: <Info size={40} className="text-blue-500" />,
    };

    const bgColors = {
        success: 'bg-green-500/10 border-green-500/20',
        error: 'bg-red-500/10 border-red-500/20',
        warning: 'bg-amber-500/10 border-amber-500/20',
        info: 'bg-blue-500/10 border-blue-500/20',
    };

    if (!state.show) return null;

    return (
        <AnimatePresence>
            {state.show && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 backdrop-blur-xl bg-black/60 overflow-y-auto">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="w-full max-w-[440px] bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 p-10 rounded-[2.5rem] relative shadow-2xl text-center overflow-hidden"
                    >
                        {/* Background Decorative Element */}
                        <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl opacity-20 -mr-16 -mt-16 rounded-full ${bgColors[state.type].split(' ')[0]}`} />

                        {/* Icon Container */}
                        <div className={`w-20 h-20 mx-auto mb-8 rounded-3xl flex items-center justify-center border ${bgColors[state.type]}`}>
                            {icons[state.type]}
                        </div>

                        {/* Text Content */}
                        <h4 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white uppercase mb-4">
                            {state.title}
                        </h4>
                        <p className="text-base font-medium text-gray-600 dark:text-gray-400 mb-10 leading-relaxed px-2">
                            {state.message}
                        </p>

                        {/* Action Buttons */}
                        <div className="flex gap-4">
                            {state.mode === 'confirm' && (
                                <button
                                    onClick={() => hideAlert(false)}
                                    className="flex-1 h-14 bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white rounded-2xl font-black uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-white/10 transition-all border border-gray-200 dark:border-white/5 active:scale-95"
                                >
                                    Cancel
                                </button>
                            )}
                            <button
                                onClick={() => hideAlert(true)}
                                className="flex-1 h-14 bg-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/30 hover:shadow-primary/50 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                {state.mode === 'confirm' ? 'Confirm' : 'Confirm'}
                            </button>
                        </div>

                        {/* Close button for non-confirm alerts (optional) */}
                        {state.mode === 'alert' && (
                            <button 
                                onClick={() => hideAlert(false)}
                                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
