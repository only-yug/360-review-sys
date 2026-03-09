import React from 'react';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';

interface MonitoringOverviewProps {
    monitoring: any[];
}

export default function MonitoringOverview({ monitoring }: MonitoringOverviewProps) {
    return (
        <motion.div key="monitoring" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="glass-card p-4 sm:p-8 rounded-3xl border-white/10 shadow-2xl min-h-[500px]">
                <div className="mb-8">
                    <h2 className="text-3xl font-black tracking-tight mb-1 uppercase">Real-time Oversight</h2>
                </div>
                <div className="overflow-x-auto -mx-4 px-4 sm:-mx-8 sm:px-8">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/5 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                                <th className="pb-3 text-xs text-left pl-2">Reviewer Node</th>
                                <th className="pb-3 text-xs text-left">Subject Node</th>
                                <th className="pb-3 text-xs text-left">Temporal Cycle</th>
                                <th className="pb-3 text-xs text-left">Sync Status</th>
                                <th className="pb-3 text-xs text-right pr-2">Telemetry Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {monitoring.map((m: any) => (
                                <tr key={m._id || m.id} className="group hover:bg-white/5 transition-colors">
                                    <td className="py-6 pl-2">
                                        <div className="font-extrabold text-base">{m.reviewer_id?.full_name || 'System Auto'}</div>
                                        <div className="text-[8px] font-black text-muted-foreground uppercase mt-0.5 tracking-widest">{m.reviewer_id?.role || 'Service'}</div>
                                    </td>
                                    <td className="py-6">
                                        <div className="font-extrabold text-base">{m.reviewee_id?.full_name}</div>
                                        <div className="text-[8px] font-black text-muted-foreground uppercase mt-0.5 tracking-widest">{m.reviewee_id?.role}</div>
                                    </td>
                                    <td className="py-6">
                                        <div className="inline-flex px-3 py-1 bg-primary/10 border border-primary/20 text-primary rounded-lg text-[9px] font-black uppercase tracking-widest">
                                            {m.cycle_id?.name || 'V-Cycle'}
                                        </div>
                                    </td>
                                    <td className="py-6">
                                        <div className={`flex items-center gap-1.5 font-black text-[9px] uppercase tracking-widest ${m.status === 'Completed' ? 'text-green-500' : 'text-amber-500'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${m.status === 'Completed' ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`} />
                                            {m.status}
                                        </div>
                                    </td>
                                    <td className="py-6 text-right pr-2 font-black text-[10px] text-muted-foreground opacity-60">
                                        {new Date(m.createdAt || m.created_at).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {monitoring.length === 0 && (
                        <div className="py-24 flex flex-col items-center justify-center opacity-20 group">
                            <Activity size={60} className="mb-4 group-hover:scale-110 transition-transform" />
                            <p className="font-black text-lg uppercase tracking-[0.2em]">No telemetry data captured</p>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
