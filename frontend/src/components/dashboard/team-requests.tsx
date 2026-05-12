import React from 'react';
import { motion } from 'framer-motion';
import { Users, Check, X, ShieldAlert, ChevronRight, ChevronDown } from 'lucide-react';
import { CustomSelect } from '@/components/ui/custom-select';

interface TeamRequestsProps {
    requests: any[];
    filter: string;
    onFilterChange: (filter: string) => void;
    pagination?: any;
    onPageChange?: (page: number) => void;
    onAction: (id: string, status: string) => void;
    title?: string;
    subtitle?: string;
    emptyMessage?: string;
}

export default function TeamRequests({
    requests,
    filter,
    onFilterChange,
    pagination,
    onPageChange,
    onAction,
    title = "Requests",
    // subtitle = "Pending authorizations for reporting line reconfigurations",
    emptyMessage
}: TeamRequestsProps) {

    const filteredRequests = pagination ? requests : requests.filter((r: any) => (r.status || '').toLowerCase() === filter.toLowerCase());

    return (
        <motion.div key="requests" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="glass-card p-4 sm:p-8 rounded-3xl border-white/10 shadow-2xl min-h-[500px]">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8 mt-2 sm:mt-0">
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-1 uppercase leading-tight">{title}</h2>
                        {/*{subtitle && <p className="text-muted-foreground text-xs font-bold tracking-wide">{subtitle}</p>}*/}
                    </div>
                    <div className="w-full sm:w-48">
                        <CustomSelect
                            value={filter}
                            onChange={onFilterChange}
                            options={[
                                { value: 'Pending', label: 'Pending' },
                                { value: 'Approved', label: 'Approved' },
                                { value: 'Rejected', label: 'Rejected' }
                            ]}
                            className="w-full"
                            selectClassName="h-10 sm:h-12 bg-primary/5 border-primary/10"
                        />
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
                                        <div className="text-xl font-black tracking-tighter leading-none">{r.employee?.full_name || r.employee_id?.full_name || 'Unknown Employee'}</div>
                                        <div className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                                            {r.request_type === 'join_additional' ? 'Additional Request' : 'Relocation Request'}
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3 mb-8 bg-black/10 p-4 rounded-2xl border border-white/5">
                                    <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest opacity-40">
                                        <span>{r.request_type === 'join_additional' ? ((r.currentManager || r.old_manager_id) ? 'Current Manager' : 'Status') : 'Current Manager'}</span>
                                        <span>{r.request_type === 'join_additional' ? 'Additional Manager' : 'Target Manager'}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-base">{r.currentManager?.full_name || r.old_manager_id?.full_name || 'ROOT'}</span>
                                        {r.request_type === 'join_additional' ? (
                                            <span className="text-primary font-black px-2">+</span>
                                        ) : (
                                            <ChevronRight className="text-primary" size={16} />
                                        )}
                                        <span className="font-extrabold text-base text-primary">{r.targetManager?.full_name || r.new_manager_id?.full_name || 'Target Region'}</span>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    {(r.status || '').toLowerCase() === 'pending' ? (
                                        <>
                                            <button onClick={() => onAction(r._id || r.id, 'approved')} className="flex-1 h-12 bg-green-500 text-white rounded-xl font-black flex items-center justify-center gap-2 text-xs shadow-lg shadow-green-500/20 active:scale-95"><Check size={18} strokeWidth={3} /> Approve</button>
                                            <button onClick={() => onAction(r._id || r.id, 'rejected')} className="flex-1 h-12 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl font-black flex items-center justify-center gap-2 text-xs active:scale-95 hover:bg-red-500 hover:text-white transition-all"><X size={18} strokeWidth={3} /> Reject</button>
                                        </>
                                    ) : (
                                        <div className={`w-full h-12 rounded-xl flex items-center justify-center font-black uppercase tracking-[0.2em] text-[9px] border ${(r.status || '').toLowerCase() === 'approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                            {r.status}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Pagination Controls */}
                {pagination && pagination.totalPages > 1 && (
                    <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-6">
                        <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                            Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => onPageChange && onPageChange(Math.max(1, pagination.page - 1))}
                                disabled={pagination.page <= 1}
                                className="px-4 py-2 rounded-xl bg-white/5 text-white text-xs font-black uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-all border border-white/10"
                            >
                                Prev
                            </button>
                            <button 
                                onClick={() => onPageChange && onPageChange(Math.min(pagination.totalPages, pagination.page + 1))}
                                disabled={pagination.page >= pagination.totalPages}
                                className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-primary/40 transition-all active:scale-95"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
