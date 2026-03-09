import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, ChevronUp, ChevronDown } from 'lucide-react';

interface SkillsManagementProps {
    skills: any[];
    onAddSkill: () => void;
    onEditSkill: (skill: any) => void;
    onDeleteSkill: (id: string, name: string) => void;
    onAddQuestion: (skillId: string) => void;
    onEditQuestion: (question: any, skillId: string) => void;
    onDeleteQuestion: (id: string, text: string) => void;
}

export default function SkillsManagement({
                                             skills,
                                             onAddSkill,
                                             onEditSkill,
                                             onDeleteSkill,
                                             onAddQuestion,
                                             onEditQuestion,
                                             onDeleteQuestion
                                         }: SkillsManagementProps) {
    const [expandedSkill, setExpandedSkill] = useState<string | null>(null);

    return (
        <motion.div key="skills" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="glass-card p-4 sm:p-8 rounded-3xl border-white/10 shadow-2xl">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h3 className="text-3xl font-black tracking-tight uppercase">Skills & Questions</h3>
                        <p className="text-muted-foreground text-xs font-bold tracking-wide mt-1">Manage evaluation criteria and associated questions</p>
                    </div>
                    <button
                        onClick={onAddSkill}
                        className="w-full sm:w-auto px-5 py-3 bg-primary text-white rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl shadow-primary/30 hover:shadow-primary/50 transition-all active:scale-95"
                    >
                        <Plus size={20} /> New Skill
                    </button>
                </div>

                {/* Skills List */}
                <div className="space-y-4">
                    {skills.map((s: any) => (
                        <div key={s._id || s.id} className="bg-white/5 border border-white/5 rounded-3xl overflow-hidden transition-all hover:bg-white/[0.07]">
                            {/* Skill Header */}
                            <div
                                className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
                                onClick={() => setExpandedSkill(expandedSkill === (s._id || s.id) ? null : (s._id || s.id))}
                            >
                                <div className="space-y-2 w-full sm:w-auto">
                                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                        <h4 className="font-black text-xl tracking-tight">{s.name}</h4>
                                        {s.category && (
                                            <span className="px-2 py-0.5 bg-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                                {s.category}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-3 sm:gap-4 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                                        <span className="text-primary/70">Emp Factor: {s.employee_weight}</span>
                                        <span className="text-orange-400/70">Mgr Factor: {s.manager_weight}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t sm:border-t-0 border-white/5 pt-4 sm:pt-0">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onEditSkill(s); }}
                                            className="p-2.5 bg-white/5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onDeleteSkill(s._id || s.id, s.name); }}
                                            className="p-2.5 bg-red-500/5 rounded-xl text-red-500/40 hover:text-red-500 hover:bg-red-500/10 transition-all"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                    {expandedSkill === (s._id || s.id) ? <ChevronUp size={18} className="text-muted-foreground" /> : <ChevronDown size={18} className="text-muted-foreground" />}
                                </div>
                            </div>

                            {/* Questions Section */}
                            <AnimatePresence>
                                {expandedSkill === (s._id || s.id) && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="border-t border-white/5 bg-black/20"
                                    >
                                        <div className="p-4 sm:p-6 sm:pl-10">
                                            <div className="flex justify-between items-center mb-6">
                                                <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Associated Questions</h5>
                                                { /* Add Question button text shortened on mobile or flexible? */}
                                                <button
                                                    onClick={() => onAddQuestion(s._id || s.id)}
                                                    className="px-4 py-2 bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                                                >
                                                    <Plus size={14} /> <span className="hidden sm:inline">Add Question</span><span className="sm:hidden">Add</span>
                                                </button>
                                            </div>

                                            {(!s.questions || s.questions.length === 0) ? (
                                                <div className="p-8 text-center border-2 border-dashed border-white/5 rounded-3xl opacity-40">
                                                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">No questions mapped to this vector</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {s.questions.map((q: any) => (
                                                        <div key={q._id || q.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 bg-white/5 rounded-3xl border border-white/5 group hover:border-white/10 transition-all gap-4">
                                                            <div className="flex items-start sm:items-center gap-4 sm:gap-6">
                                                                <span className={`shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${q.type === 'Boolean' ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20' : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                                                                }`}>
                                                                    {q.type === 'Rating' ? 'Scale' : 'Bool'}
                                                                </span>
                                                                <p className="font-bold text-sm text-foreground/90 leading-relaxed">{q.text}</p>
                                                            </div>
                                                            <div className="flex gap-2 self-end sm:self-auto sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    onClick={() => onEditQuestion(q, s._id || s.id)}
                                                                    className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-muted-foreground hover:text-foreground transition-all"
                                                                >
                                                                    <Edit2 size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={() => onDeleteQuestion(q._id || q.id, q.text)}
                                                                    className="p-2.5 bg-red-500/5 hover:bg-red-500/10 rounded-xl text-red-500/60 hover:text-red-500 transition-all"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}
