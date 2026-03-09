'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { UserCheck, Plus, Edit2, Trash2 } from 'lucide-react';

interface UsersListProps {
    role: 'admin' | 'manager' | 'employee';
    users: any[];
    onAddUser?: () => void;
    onEditUser?: (user: any) => void;
    onDeleteUser?: (id: string, name: string) => void;
}

export default function UsersList({
                                      role,
                                      users,
                                      onAddUser,
                                      onEditUser,
                                      onDeleteUser
                                  }: UsersListProps) {

    // Define Role-Specific Text Content
    const getHeaderText = () => {
        if (role === 'admin') return { title: 'All Users', subtitle: '' };
        if (role === 'manager') return { title: 'Workforce Directory', subtitle: 'Comprehensive list of all platform users' };
        return { title: 'Workforce Directory', subtitle: 'Comprehensive list of all platform nodes' };
    };

    const getColumnHeader = () => {
        if (role === 'employee') return 'Subject Node';
        if (role === 'manager') return 'Member Profile';
        return 'Profile';
    };

    const header = getHeaderText();

    return (
        <motion.div key="users" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="glass-card p-4 sm:p-8 rounded-3xl border-white/10 shadow-2xl min-h-[500px]">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
                    <div>
                        <h2 className="text-3xl font-black tracking-tight mb-1 uppercase">{header.title}</h2>
                        {header.subtitle && <p className="text-muted-foreground text-xs font-bold tracking-wide">{header.subtitle}</p>}
                    </div>
                    {role === 'admin' && onAddUser && (
                        <button
                            onClick={onAddUser}
                            className="px-5 py-3 bg-primary text-white rounded-2xl font-black flex items-center gap-3 shadow-xl shadow-primary/30 hover:shadow-primary/50 transition-all active:scale-95"
                        >
                            <Plus size={20} /> Add New User
                        </button>
                    )}
                </div>
                {/* Desktop View */}
                <div className="hidden md:block overflow-x-auto -mx-4 px-4 sm:-mx-8 sm:px-8">
                    <table className="w-full">
                        <thead>
                        <tr className="border-b border-white/5 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                            <th className="text-xs pb-3 text-left pl-2">{getColumnHeader()}</th>
                            <th className="text-xs pb-3 text-left">Communication</th>
                            <th className="text-xs pb-3 text-left">Authority</th>
                            <th className="text-xs pb-3 text-left">Reporting Line</th>
                            {role === 'admin' && <th className="text-xs pb-3 text-right pr-2">Protocols</th>}
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                        {users.map((u: any) => (
                            <tr key={u._id || u.id} className="group hover:bg-white/5 transition-colors">
                                <td className="py-6 pl-2 underline-offset-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-xl group-hover:shadow-primary/30">
                                            <UserCheck size={20} />
                                        </div>
                                        <div className="font-extrabold text-lg">{u.full_name}</div>
                                    </div>
                                </td>
                                <td className="py-6 text-muted-foreground font-black text-base lowercase">{u.email}</td>
                                <td className="py-6">
                                        <span className={`inline-flex px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-[0.15em] border ${u.role === 'admin' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                            u.role === 'manager' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                                'bg-primary/10 text-primary border-primary/20'
                                        }`}>
                                            {u.role}
                                        </span>
                                </td>
                                <td className="py-6 font-black text-xs uppercase tracking-widest text-muted-foreground">
                                    {u.manager ? (
                                        Array.isArray(u.manager)
                                            ? u.manager.map((m: any) => m.name || m.full_name || m.email || m).join(', ')
                                            : (u.manager.name || u.manager.full_name || (typeof u.manager === 'string' ? (u.manager.length > 20 ? "ID: " + u.manager.substring(0, 5) + "..." : u.manager) : "Autonomous"))
                                    ) : <span className="opacity-20 text-[8px]">Autonomous</span>}
                                </td>
                                {role === 'admin' && (
                                    <td className="py-6 text-right pr-2">
                                        <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                                            {onEditUser && (
                                                <button onClick={() => onEditUser(u)} className="p-3 bg-white/5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/10 border border-white/5 transition-all"><Edit2 size={18} /></button>
                                            )}
                                            {onDeleteUser && (
                                                <button onClick={() => onDeleteUser(u._id || u.id, u.full_name)} className="p-3 bg-red-500/5 rounded-xl text-red-400 hover:text-white hover:bg-red-500 border border-red-500/10 transition-all"><Trash2 size={18} /></button>
                                            )}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View */}
                <div className="md:hidden space-y-4">
                    {users.map((u: any) => (
                        <div key={u._id || u.id} className="bg-white/5 border border-white/5 rounded-2xl p-5 space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-primary shadow-xl shadow-primary/10">
                                    <UserCheck size={20} />
                                </div>
                                <div>
                                    <div className="font-black text-lg leading-tight">{u.full_name}</div>
                                    <div className="text-muted-foreground font-bold text-xs lowercase opacity-70">{u.email}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
                                <div>
                                    <div className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">Role</div>
                                    <span className={`inline-flex px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-[0.15em] border ${u.role === 'admin' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                        u.role === 'manager' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                            'bg-primary/10 text-primary border-primary/20'
                                    }`}>
                                        {u.role}
                                    </span>
                                </div>
                                <div>
                                    <div className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">Reporting To</div>
                                    <div className="font-black text-xs uppercase tracking-widest text-muted-foreground truncate">
                                        {u.manager ? (
                                            Array.isArray(u.manager)
                                                ? u.manager.map((m: any) => m.name || m.full_name || m.email || m).join(', ')
                                                : (u.manager.name || u.manager.full_name || (typeof u.manager === 'string' ? (u.manager.length > 20 ? "ID: " + u.manager.substring(0, 5) + "..." : u.manager) : "Autonomous"))
                                        ) : <span className="opacity-20 text-[8px]">Autonomous</span>}
                                    </div>
                                </div>
                            </div>

                            {role === 'admin' && (
                                <div className="flex gap-2 pt-2 justify-end border-t border-white/5">
                                    {onEditUser && (
                                        <button onClick={() => onEditUser(u)} className="flex-1 py-3 bg-white/5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/10 border border-white/5 transition-all flex justify-center"><Edit2 size={18} /></button>
                                    )}
                                    {onDeleteUser && (
                                        <button onClick={() => onDeleteUser(u._id || u.id, u.full_name)} className="flex-1 py-3 bg-red-500/5 rounded-xl text-red-400 hover:text-white hover:bg-red-500 border border-red-500/10 transition-all flex justify-center"><Trash2 size={18} /></button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}
