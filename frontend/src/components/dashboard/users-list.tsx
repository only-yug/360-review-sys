'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { UserCheck, Plus, Edit2, Trash2, Lock } from 'lucide-react';

interface UsersListProps {
    role: 'admin' | 'manager' | 'employee';
    users: any[];
    pagination?: any;
    onPageChange?: (page: number) => void;
    onAddUser?: () => void;
    onEditUser?: (user: any) => void;
    onDeleteUser?: (id: string, name: string) => void;
    /**
     * When true: hides all edit/delete/add buttons — pure read-only directory view.
     * Defaults to false (admin mode with full actions).
     */
    readOnly?: boolean;
    /**
     * When true: shows the "Assigned Manager" column.
     * Admin always sees it. Non-admin only sees it when explicitly passed.
     */
    showManager?: boolean;
}

export default function UsersList({
    role,
    users,
    pagination,
    onPageChange,
    onAddUser,
    onEditUser,
    onDeleteUser,
    readOnly = false,
    showManager = false,
}: UsersListProps) {

    const isAdmin = role === 'admin' && !readOnly;

    // Header text
    const getHeaderText = () => {
        if (isAdmin) return { title: 'All Users', subtitle: '' };
        if (role === 'manager') return { title: 'All Users'};
        return { title: 'All Users'};
    };

    const getColumnHeader = () => {
        if (role === 'employee') return 'Subject Node';
        if (role === 'manager') return 'Member Profile';
        return 'Profile';
    };

    const header = getHeaderText();
    const showManagerCol = isAdmin || showManager;

    const renderRoleBadge = (u: any) => (
        <span className={`inline-flex px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-[0.15em] border ${
            u.role === 'admin'
                ? 'bg-red-500/10 text-red-500 border-red-500/20'
                : u.role === 'manager'
                    ? 'bg-green-500/10 text-green-500 border-green-500/20'
                    : 'bg-primary/10 text-primary border-primary/20'
        }`}>
            {u.role}
        </span>
    );

    const renderManagerCell = (u: any) => {
        if (!showManagerCol) return null;
        const mgr = u.manager || u.managers;
        return (
            <td className="py-6 font-black text-xs uppercase tracking-widest text-muted-foreground">
                {mgr ? (
                    Array.isArray(mgr)
                        ? mgr.map((m: any) => m.name || m.full_name || m.email || m).join(', ')
                        : (mgr.name || mgr.full_name || (typeof mgr === 'string' ? mgr : 'Autonomous'))
                ) : <span className="opacity-20 text-[8px]">Autonomous</span>}
            </td>
        );
    };

    return (
        <motion.div key="users" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="glass-card p-4 sm:p-8 rounded-3xl border-white/10 shadow-2xl min-h-[500px]">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
                    <div>
                        <h2 className="text-3xl font-black tracking-tight mb-1 uppercase">{header.title}</h2>
                        {header.subtitle && <p className="text-muted-foreground text-xs font-bold tracking-wide">{header.subtitle}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Read-only badge for non-admin */}
                        {/*{readOnly && (*/}
                        {/*    <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-muted-foreground">*/}
                        {/*        <Lock size={12} />*/}
                        {/*        <span>View Only</span>*/}
                        {/*    </div>*/}
                        {/*)}*/}
                        {isAdmin && onAddUser && (
                            <button
                                onClick={onAddUser}
                                className="px-5 py-3 bg-primary text-white rounded-2xl font-black flex items-center gap-3 shadow-xl shadow-primary/30 hover:shadow-primary/50 transition-all active:scale-95"
                            >
                                <Plus size={20} /> Add New User
                            </button>
                        )}
                    </div>
                </div>

                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto -mx-4 px-4 sm:-mx-8 sm:px-8">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/5 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                                <th className="text-xs pb-3 text-left pl-2">{getColumnHeader()}</th>
                                <th className="text-xs pb-3 text-left">Email</th>
                                <th className="text-xs pb-3 text-left">Role</th>
                                {showManagerCol && <th className="text-xs pb-3 text-left">Assigned Manager</th>}
                                {isAdmin && <th className="text-xs pb-3 text-right pr-2">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {users.map((u: any) => (
                                <tr key={u._id || u.id} className="group hover:bg-white/5 transition-colors">
                                    <td className="py-6 pl-2">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-xl group-hover:shadow-primary/30">
                                                <UserCheck size={20} />
                                            </div>
                                            <div className="font-extrabold text-lg">{u.full_name}</div>
                                        </div>
                                    </td>
                                    <td className="py-6 text-muted-foreground font-black text-base lowercase">{u.email}</td>
                                    <td className="py-6">{renderRoleBadge(u)}</td>
                                    {renderManagerCell(u)}
                                    {isAdmin && (
                                        <td className="py-6 text-right pr-2">
                                            {u.role !== 'admin' && (
                                                <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                                                    {onEditUser && (
                                                        <button onClick={() => onEditUser(u)} className="p-3 bg-primary/10 rounded-xl text-primary border border-primary/20 hover:bg-primary hover:text-white transition-all"><Edit2 size={18} /></button>
                                                    )}
                                                    {onDeleteUser && (
                                                        <button onClick={() => onDeleteUser(u._id || u.id, u.full_name)} className="p-3 bg-red-500/5 rounded-xl text-red-400 hover:text-white hover:bg-red-500 border border-red-500/10 transition-all"><Trash2 size={18} /></button>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards */}
                <div className="lg:hidden space-y-4">
                    {users.map((u: any) => (
                        <div key={u._id || u.id} className="bg-black/5 border border-white/5 rounded-2xl p-5 space-y-4">
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
                                    {renderRoleBadge(u)}
                                </div>
                                {showManagerCol && (
                                    <div>
                                        <div className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">Reporting To</div>
                                        <div className="font-black text-xs uppercase tracking-widest text-muted-foreground truncate">
                                            {(() => {
                                                const mgr = u.manager || u.managers;
                                                if (!mgr) return <span className="opacity-20 text-[8px]">Autonomous</span>;
                                                if (Array.isArray(mgr)) return mgr.map((m: any) => m.name || m.full_name || m.email || m).join(', ');
                                                return mgr.name || mgr.full_name || 'Autonomous';
                                            })()}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {isAdmin && u.role !== 'admin' && (
                                <div className="flex gap-2 pt-2 justify-end border-t border-white/5">
                                    {onEditUser && (
                                        <button onClick={() => onEditUser(u)} className="flex-1 py-3 bg-primary/10 rounded-xl text-primary border border-primary/20 hover:bg-primary hover:text-white transition-all flex justify-center"><Edit2 size={18} /></button>
                                    )}
                                    {onDeleteUser && (
                                        <button onClick={() => onDeleteUser(u._id || u.id, u.full_name)} className="flex-1 py-3 bg-red-500/5 rounded-xl text-red-400 hover:text-white hover:bg-red-500 border border-red-500/10 transition-all flex justify-center"><Trash2 size={18} /></button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Empty state */}
                {users.length === 0 && (
                    <div className="py-24 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-3xl opacity-20">
                        <UserCheck size={64} className="mb-4 text-primary" />
                        <p className="font-black text-lg uppercase tracking-[0.3em]">No users found</p>
                    </div>
                )}

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                    <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-6">
                        <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                            Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => onPageChange && onPageChange(Math.max(1, pagination.page - 1))}
                                disabled={pagination.page <= 1}
                                className="px-4 py-2 rounded-xl bg-gray-500 text-white text-xs font-black uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-600 transition-all border border-white/10"
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
