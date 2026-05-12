import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, UserCheck, Check, Send, Clock, History, ArrowRight } from 'lucide-react';
import { CustomSelect } from '@/components/ui/custom-select';

interface EmployeeRequestsProps {
    currentManagers: any[];
    allManagers: any[];
    selectedCurrentManager: string;
    onSelectedCurrentManagerChange: (value: string) => void;
    targetManager: string;
    onTargetManagerChange: (value: string) => void;
    requestStatus: string | null;
    onSendRequest: (e: React.FormEvent) => void;
    errors?: Record<string, string>;
    myRequests?: any[];
}

export default function EmployeeRequests({
    currentManagers,
    allManagers,
    selectedCurrentManager,
    onSelectedCurrentManagerChange,
    targetManager,
    onTargetManagerChange,
    requestStatus,
    onSendRequest,
    errors,
    myRequests = []
}: EmployeeRequestsProps) {
    return (
        <motion.div key="requests" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Sector Rotation Form */}
                <div className="glass-card p-8 rounded-[3.5rem] border-white/10 shadow-2xl relative group z-20">
                    <div className="absolute inset-0 overflow-hidden rounded-[3.5rem] pointer-events-none z-0">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl -mr-40 -mt-40 transition-colors group-hover:bg-primary/10" />
                    </div>
                    <div className="flex items-center gap-6 mb-10 relative z-10">
                        <div className="w-16 h-16 bg-primary/10 border border-primary/20 text-primary rounded-3xl flex items-center justify-center shadow-lg shadow-primary/10">
                            <UserPlus size={32} />
                        </div>
                        <div>
                            <h3 className="text-3xl font-black tracking-tight mb-1 uppercase">Manager Assignment</h3>
                            {/*<p className="text-muted-foreground text-xs font-bold tracking-widest">Request reporting line adjustments</p>*/}
                        </div>
                    </div>

                    <form onSubmit={onSendRequest} className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10" noValidate>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Current Manager</label>
                            <CustomSelect
                                value={selectedCurrentManager}
                                onChange={onSelectedCurrentManagerChange}
                                options={[
                                    { value: 'new_add', label: '+ Add New Manager (No Replacement)' },
                                    ...currentManagers.map((m: any) => ({
                                        value: m._id || m.id,
                                        label: m.full_name || m.name
                                    }))
                                ]}
                                placeholder="Select Assigned Manager..."
                                icon={<UserCheck size={20} />}
                                fullWidth
                                error={!!errors?.current_manager}
                                errorText={errors?.current_manager}
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">New Manager</label>
                            <CustomSelect
                                value={targetManager}
                                onChange={onTargetManagerChange}
                                options={allManagers
                                    .filter((m: any) => !currentManagers.some((cm: any) => (cm._id || cm.id) === (m._id || m.id)))
                                    .map((m: any) => ({
                                        value: m._id || m.id,
                                        label: m.full_name
                                    }))
                                }
                                placeholder="Select New Manager..."
                                icon={<UserPlus size={20} />}
                                fullWidth
                                error={!!errors?.target_manager}
                                errorText={errors?.target_manager}
                            />
                        </div>

                        <div className="md:col-span-2 pt-2">
                            <button
                                type="submit"
                                className="w-full py-5 rounded-[1.5rem] font-black bg-primary text-white flex justify-center items-center gap-3 text-sm uppercase tracking-widest shadow-2xl shadow-primary/30 transition-all active:scale-[0.98] hover:shadow-primary/50 hover:-translate-y-1 group/submit"
                            >
                                <span>Send Request</span>
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

                {/* Pending Requests History */}
                <div className="glass-card p-8 rounded-[3.5rem] border-white/10 shadow-2xl overflow-hidden">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 bg-orange-500/10 border border-orange-500/20 text-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/5">
                                <History size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tight">Pending Requests</h3>
                                {/*<p className="text-[10px] text-muted-foreground font-bold tracking-[0.2rem] uppercase">Queue of active protocol transmissions</p>*/}
                            </div>
                        </div>
                        {/*<div className="px-4 py-2 bg-primary/5 rounded-full border border-primary/10">*/}
                        {/*    <span className="text-[10px] font-black text-primary uppercase tracking-widest">{myRequests.length} Active</span>*/}
                        {/*</div>*/}
                    </div>

                    <div className="space-y-4">
                        {myRequests.length === 0 ? (
                            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 border-2 border-dashed border-white/5 rounded-[2.5rem]">
                                <div className="w-16 h-16 bg-muted/10 rounded-full flex items-center justify-center text-muted-foreground/30">
                                    <Clock size={32} />
                                </div>
                                <div>
                                    <p className="text-muted-foreground font-bold uppercase tracking-widest text-sm">No Pending Requests</p>
                                    {/*<p className="text-[10px] text-muted-foreground/50 mt-1 uppercase">All protocols have been resolved or non-initiated</p>*/}
                                </div>
                            </div>
                        ) : (
                            myRequests.map((req: any, idx: number) => (
                                <motion.div
                                    key={req._id || req.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="p-6 bg-white/5 border border-white/10 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-white/[0.07] transition-all group/item"
                                >
                                    <div className="flex items-center gap-6">
                                        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center group-hover/item:scale-110 transition-transform">
                                            {req.request_type === 'transfer' ? <UserPlus className="text-primary" /> : <UserCheck className="text-primary" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                                                    {(req.request_type === 'transfer' || req.request_type === 'relocation') ? 'Replacement Protocol' : 'Additional Request'}
                                                </span>
                                                <span className="w-1 h-1 bg-white/20 rounded-full" />
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase">
                                                    {new Date(req.createdAt || req.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-black text-foreground uppercase tracking-tight">
                                                    {(req.currentManager || req.current_manager || req.old_manager_id)?.full_name || 'Individual Contributor'}
                                                </span>
                                                {(req.request_type === 'transfer' || req.request_type === 'relocation') ? (
                                                    <ArrowRight size={14} className="text-muted-foreground" />
                                                ) : (
                                                    <span className="text-primary font-black px-1">+</span>
                                                )}
                                                <span className="text-sm font-black text-primary uppercase tracking-tight">
                                                    {(req.targetManager || req.target_manager || req.new_manager_id)?.full_name || 'N/A'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex flex-col items-end mr-2">
                                            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Current Status</span>
                                            <div className="flex items-center gap-2 px-3 py-1 bg-orange-500/10 border border-orange-500/20 text-orange-500 rounded-lg">
                                                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">{req.status}</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
