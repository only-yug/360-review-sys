import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Activity, Calendar as CalendarIcon, Trash2, ChevronDown } from 'lucide-react';

interface CyclesManagementProps {
    cycles: any[];
    cyclesTabFilter: string;
    onFilterChange: (filter: string) => void;
    onCreateCycle: () => void;
    onToggleStatus: (id: string) => void;
    onDeleteCycle: (id: string, name: string) => void;
}

export default function CyclesManagement({
    cycles,
    cyclesTabFilter,
    onFilterChange,
    onCreateCycle,
    onToggleStatus,
    onDeleteCycle
}: CyclesManagementProps) {
    return (
        <motion.div key="cycles" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="glass-card p-4 sm:p-8 rounded-3xl border-white/10 shadow-2xl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
                    <div>
                        <h2 className="text-3xl font-black tracking-tight mb-1 uppercase">Evaluation Cycles</h2>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                        <div className="relative w-full sm:w-auto">
                            <select
                                value={cyclesTabFilter}
                                onChange={(e) => onFilterChange(e.target.value)}
                                className="w-full sm:w-auto appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-10 text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-primary/50 transition-all cursor-pointer min-w-[140px]"
                            >
                                <option value="Active" className="bg-zinc-900 text-white">Active</option>
                                <option value="Pending" className="bg-zinc-900 text-white">Pending</option>
                                <option value="Closed" className="bg-zinc-900 text-white">Closed</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        </div>
                        <button onClick={onCreateCycle} className="w-full sm:w-auto px-5 py-3 bg-primary text-white rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl shadow-primary/30 hover:shadow-primary/50 transition-all active:scale-95">
                            <Plus size={20} /> Launch New Cycles
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
                    {cycles.filter((c: any) => c.status === cyclesTabFilter).length === 0 ? (
                        <div className="md:col-span-2 2xl:col-span-3 py-24 flex flex-col items-center justify-center opacity-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                            <Activity size={60} className="mb-4" />
                            <p className="font-black text-lg uppercase tracking-[0.2em]">No {cyclesTabFilter.toLowerCase()} cycles found</p>
                        </div>
                    ) : (
                        cycles.filter((c: any) => c.status === cyclesTabFilter).map((c: any) => (
                            <div key={c._id || c.id} className="glass-card flex flex-col h-full p-6 rounded-3xl bg-white/5 border-white/5 hover:border-primary/20 transition-all relative overflow-hidden group">
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-6 relative z-10">
                                        <div className="space-y-1">
                                            <h4 className="text-xl font-black tracking-tighter leading-tight">{c.name}</h4>
                                            {c.type && (
                                                <div className="inline-flex px-2 py-0.5 bg-primary/10 border border-primary/20 rounded-md text-[8px] font-black uppercase tracking-[0.15em] text-primary">
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
                                    <button onClick={() => onDeleteCycle(c._id || c.id, c.name)} className="w-full h-12 flex items-center justify-center bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl border border-red-500/20 transition-all group-hover:shadow-xl font-bold tracking-widest text-[10px] uppercase gap-2">
                                        <Trash2 size={16} /> Delete Cycle
                                    </button>
                                </div>
                            </div>
                        )))
                    }
                </div>
            </div>
        </motion.div>
    );
}
