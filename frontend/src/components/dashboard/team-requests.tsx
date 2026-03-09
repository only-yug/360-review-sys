import React from 'react';
import { motion } from 'framer-motion';
import { Users, Check, X, ShieldAlert, ChevronRight, ChevronDown } from 'lucide-react';

interface TeamRequestsProps {
    requests: any[];
    filter: string;
    onFilterChange: (filter: string) => void;
    onAction: (id: string, status: string) => void;
    title?: string;
    subtitle?: string;
    emptyMessage?: string;
}

export default function TeamRequests({
    requests,
    filter,
    onFilterChange,
    onAction,
    title = "Team Requests",
    subtitle = "Pending authorizations for reporting line reconfigurations",
    emptyMessage
}: TeamRequestsProps) {

    const filteredRequests = requests.filter((r: any) => r.status === filter);

    return (
        <motion.div key="requests" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="glass-card p-4 sm:p-8 rounded-3xl border-white/10 shadow-2xl min-h-[500px]">
                <div className="flex items-end justify-between mb-8">
                    <div>
                        <h2 className="text-3xl font-black tracking-tight mb-1 uppercase">{title}</h2>
                        {subtitle && <p className="text-muted-foreground text-xs font-bold tracking-wide">{subtitle}</p>}
                    </div>
                    <div className="relative">
                        <select
                            value={filter}
                            onChange={(e) => onFilterChange(e.target.value)}
                            className="appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-2 pr-10 text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-primary/50 transition-all cursor-pointer min-w-[140px]"
                        >
                            <option value="Pending" className="bg-zinc-900 text-white">Pending</option>
                            <option value="Approved" className="bg-zinc-900 text-white">Approved</option>
                            <option value="Rejected" className="bg-zinc-900 text-white">Rejected</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredRequests.length === 0 ? (
                        <div className="md:col-span-2 lg:col-span-3 py-24 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-3xl opacity-20">
                            <ShieldAlert size={64} className="mb-4 text-primary" />
                            <p className="font-black text-lg uppercase tracking-[0.3em]">
                                {emptyMessage || `No ${filter.toLowerCase()} relocation requests`}
                            </p>
                        </div>
                    ) : (
                        filteredRequests.map((r: any) => (
                            <div key={r._id || r.id} className="p-8 rounded-[2rem] bg-white/5 border border-white/5 hover:border-primary/20 transition-all shadow-xl group">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center text-white shadow-xl shadow-primary/30 group-hover:rotate-6 transition-transform">
                                        <Users size={28} />
                                    </div>
                                    <div className="space-y-0.5">
                                        <div className="text-xl font-black tracking-tighter leading-none">{r.employee_id?.full_name}</div>
                                        <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Relocation Request</div>
                                    </div>
                                </div>
                                <div className="space-y-3 mb-8 bg-black/20 p-4 rounded-2xl border border-white/5">
                                    <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest opacity-40">
                                        <span>Current Sector</span>
                                        <span>Target Sector</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-base">{r.old_manager_id?.full_name || 'ROOT'}</span>
                                        <ChevronRight className="text-primary" size={16} />
                                        <span className="font-extrabold text-base text-primary">{r.new_manager_id?.full_name}</span>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    {r.status === 'Pending' ? (
                                        <>
                                            <button onClick={() => onAction(r._id || r.id, 'Approved')} className="flex-1 h-12 bg-green-500 text-white rounded-xl font-black flex items-center justify-center gap-2 text-xs shadow-lg shadow-green-500/20 active:scale-95"><Check size={18} strokeWidth={3} /> Approve</button>
                                            <button onClick={() => onAction(r._id || r.id, 'Rejected')} className="flex-1 h-12 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl font-black flex items-center justify-center gap-2 text-xs active:scale-95 hover:bg-red-500 hover:text-white transition-all"><X size={18} strokeWidth={3} /> Reject</button>
                                        </>
                                    ) : (
                                        <div className={`w-full h-12 rounded-xl flex items-center justify-center font-black uppercase tracking-[0.2em] text-[9px] border ${r.status === 'Approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                            {r.status}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </motion.div>
    );
}
