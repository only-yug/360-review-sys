import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, UserCheck, ChevronDown, Send, Check } from 'lucide-react';

interface EmployeeRequestsProps {
    currentManagers: any[];
    allManagers: any[];
    selectedCurrentManager: string;
    onSelectedCurrentManagerChange: (value: string) => void;
    targetManager: string;
    onTargetManagerChange: (value: string) => void;
    requestStatus: string | null;
    onSendRequest: (e: React.FormEvent) => void;
}

export default function EmployeeRequests({
    currentManagers,
    allManagers,
    selectedCurrentManager,
    onSelectedCurrentManagerChange,
    targetManager,
    onTargetManagerChange,
    requestStatus,
    onSendRequest
}: EmployeeRequestsProps) {
    return (
        <motion.div key="requests" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="max-w-4xl mx-auto">
                {/* Sector Rotation Form */}
                <div className="glass-card p-8 rounded-[3.5rem] border-white/10 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl -mr-40 -mt-40 transition-colors group-hover:bg-primary/10" />
                    <div className="flex items-center gap-6 mb-10 relative z-10">
                        <div className="w-16 h-16 bg-primary/10 border border-primary/20 text-primary rounded-3xl flex items-center justify-center shadow-lg shadow-primary/10">
                            <UserPlus size={32} />
                        </div>
                        <div>
                            <h3 className="text-3xl font-black tracking-tight mb-1 uppercase">Manager Assignment</h3>
                            <p className="text-muted-foreground text-xs font-bold tracking-widest">Request reporting line adjustments</p>
                        </div>
                    </div>

                    <form onSubmit={onSendRequest} className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Current Manager</label>
                            <div className="relative group">
                                <UserCheck size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <select
                                    value={selectedCurrentManager}
                                    onChange={e => onSelectedCurrentManagerChange(e.target.value)}
                                    required
                                    className="w-full h-16 bg-white/5 dark:bg-black/20 border border-white/10 rounded-2xl pl-16 pr-6 font-black text-sm outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-inner cursor-pointer appearance-none"
                                >
                                    <option value="" className="bg-[#0a0a0a]">Select Assigned Manager...</option>
                                    <option value="new_add" className="bg-[#0a0a0a] text-primary font-bold">+ Assign New Manager (Add)</option>
                                    {currentManagers.map((m: any) => (
                                        <option key={m._id || m.id} value={m._id || m.id} className="bg-[#0a0a0a]">{m.full_name || m.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={16} />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">New Reporting Node</label>
                            <div className="relative group">
                                <UserPlus size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <select
                                    value={targetManager}
                                    onChange={e => onTargetManagerChange(e.target.value)}
                                    required
                                    className="w-full h-16 bg-white/5 dark:bg-black/20 border border-white/10 rounded-2xl pl-16 pr-6 font-black text-sm outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-inner cursor-pointer appearance-none"
                                >
                                    <option value="" className="bg-[#0a0a0a]">Select New Manager...</option>
                                    {allManagers
                                        .filter((m: any) => !currentManagers.some((cm: any) => (cm._id || cm.id) === (m._id || m.id)))
                                        .map((m: any) => (
                                            <option key={m._id || m.id} value={m._id || m.id} className="bg-[#0a0a0a]">{m.full_name}</option>
                                        ))}
                                </select>
                                <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={16} />
                            </div>
                        </div>

                        <div className="md:col-span-2 pt-2">
                            <button
                                type="submit"
                                className="w-full py-5 rounded-[1.5rem] font-black bg-primary text-white flex justify-center items-center gap-3 text-sm uppercase tracking-widest shadow-2xl shadow-primary/30 transition-all active:scale-[0.98] hover:shadow-primary/50 hover:-translate-y-1 group/submit"
                            >
                                <span>Transmit Protocol</span>
                                <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            </button>
                        </div>
                    </form>

                    <AnimatePresence>
                        {requestStatus && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="mt-8 p-5 bg-green-500/10 border border-green-500/20 text-green-500 rounded-2xl flex items-center gap-4 font-bold"
                            >
                                <div className="w-10 h-10 rounded-xl bg-green-500 text-white flex items-center justify-center shadow-lg shadow-green-500/30">
                                    <Check size={20} strokeWidth={3} />
                                </div>
                                <span className="text-sm uppercase tracking-widest">{requestStatus}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
}
