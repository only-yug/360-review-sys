import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Activity, Calendar as CalendarIcon, Trash2, ChevronDown } from 'lucide-react';
import { CustomSelect } from '@/components/ui/custom-select';

interface CyclesManagementProps {
    cycles: any[];
    cyclesTabFilter: string;
    onFilterChange: (filter: string) => void;
    pagination?: any;
    onPageChange?: (page: number) => void;
    onCreateCycle: () => void;
    onToggleStatus: (id: string) => void;
    onDeleteCycle: (id: string, name: string) => void;
}

export default function CyclesManagement({
    cycles,
    cyclesTabFilter,
    onFilterChange,
    pagination,
    onPageChange,
    onCreateCycle,
    onToggleStatus,
    onDeleteCycle
}: CyclesManagementProps) {

    const displayedCycles = cycles.filter((c: any) => c.status.toLowerCase() === cyclesTabFilter.toLowerCase());
    return (
        <motion.div key="cycles" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="glass-card p-4 sm:p-8 rounded-3xl border-white/10 shadow-2xl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
                    <div>
                        <h2 className="text-3xl font-black tracking-tight mb-1 uppercase">Evaluation Cycles</h2>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto mt-2 sm:mt-0">
                        <CustomSelect
                            value={cyclesTabFilter}
                            onChange={onFilterChange}
                            options={[
                                { value: 'Active', label: 'Active' },
                                { value: 'Pending', label: 'Pending' },
                                { value: 'Closed', label: 'Closed' },
                                { value: 'Deleted', label: 'Deleted' }
                            ]}
                            className="w-full sm:w-48"
                            selectClassName="h-10 sm:h-12 bg-primary/5 border-primary/10"
                        />
                        <button onClick={onCreateCycle} className="w-full sm:w-auto px-5 py-3 bg-primary text-white rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-3 shadow-xl shadow-primary/30 hover:shadow-primary/50 transition-all active:scale-95 whitespace-nowrap">
                            <Plus size={18} /> Launch New Cycles
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
                    {displayedCycles.length === 0 ? (
                        <div className="md:col-span-2 2xl:col-span-3 py-24 flex flex-col items-center justify-center opacity-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                            <Activity size={60} className="mb-4" />
                            <p className="font-black text-lg uppercase tracking-[0.2em]">No {cyclesTabFilter.toLowerCase()} cycles found</p>
                        </div>
                    ) : (
                        displayedCycles.map((c: any) => (
                            <div key={c._id || c.id} className="glass-card flex flex-col h-full p-6 rounded-3xl bg-white/5 border-white/5 hover:border-primary/20 transition-all relative overflow-hidden group">
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-6 relative z-10">
                                        <div className="space-y-1">
                                            <h4 className="text-xl font-black tracking-tighter leading-tight">{c.name}</h4>
                                            {c.type && (
                                                <div className="inline-flex px-2 py-0.5 bg-primary/10 border border-primary/20 rounded-md text-[9px] font-black uppercase text-primary">
                                                    {c.type} frequency
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${c.status === 'Active'
                                                ? 'bg-green-500/10 text-green-500 border-green-500/20 shadow-lg shadow-green-500/10'
                                                : c.status === 'Closed'
                                                    ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                                    : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                                }`}>
                                                {c.status}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-muted-foreground font-black text-xs uppercase tracking-widest mb-6 relative z-10">
                                        <CalendarIcon size={16} className="text-primary/60" />
                                        {new Date(c.start_date).toLocaleDateString()} — {new Date(c.end_date).toLocaleDateString()}
                                    </div>
                                </div>
                                <div className="flex gap-2 relative z-10 pt-6 border-t border-white/5 mt-auto">
                                    {(c.status === 'Active' || c.status === 'Pending') && (
                                        <button onClick={() => onDeleteCycle(c._id || c.id, c.name)} className="w-full h-12 flex items-center justify-center bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl border border-red-500/20 transition-all group-hover:shadow-xl font-bold tracking-widest text-[10px] uppercase gap-2">
                                            <Trash2 size={16} /> Delete Cycle
                                        </button>
                                    )}
                                </div>
                            </div>
                        )))
                    }
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
