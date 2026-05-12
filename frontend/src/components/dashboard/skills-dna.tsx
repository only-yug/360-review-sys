'use client';

import React, { useState, useEffect } from 'react';
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Tooltip
} from 'recharts';
import { Hexagon } from 'lucide-react';
import { motion } from 'framer-motion';
import apiClient from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { CustomSelect } from '@/components/ui/custom-select';

interface SkillsDNAProps {
    userId?: string;
    showTitle?: boolean;
}

const SkillsDNA: React.FC<SkillsDNAProps> = ({ userId, showTitle = true }) => {
    const [selectedCycle, setSelectedCycle] = useState<string>('');

    // Fetch available cycles
    const { data: cyclesData } = useQuery({
        queryKey: ['adminCyclesListAll'],
        queryFn: async () => {
            const res = await apiClient.get('/review-cycles/minimal/list');
            return res.data?.data?.cycles || [];
        }
    });

    const { data: rawData, isLoading: loading } = useQuery({
        queryKey: ['adminScoresDistribution', userId, selectedCycle],
        queryFn: async () => {
            let endpoint = '/scores/distribution';
            if (userId) endpoint = `/scores/distribution/${userId}`;

            const params: any = {};
            if (selectedCycle) params.cycle_id = selectedCycle;

            const res = await apiClient.get(endpoint, { params });
            return res.data?.data || null;
        }
    });

    const { data, cycleName } = React.useMemo(() => {
        if (!rawData) return { data: [], cycleName: '' };

        const distribution = rawData.distribution || [];
        const cycle = rawData.cycle;

        const formatted = distribution.map((item: any) => ({
            subject: (item.skill || '').toUpperCase(),
            score: item.score,
            fullMark: 10
        }));

        return {
            data: formatted,
            cycleName: cycle?.name || ''
        };
    }, [rawData]);

    if (loading) {
        return (
            <div className="h-[300px] w-full flex flex-col items-center justify-center gap-4 bg-black/20 rounded-[2.5rem] border border-white/5">
                <div className="w-10 h-10 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                <span className="text-xs font-black text-muted-foreground tracking-[0.2em] uppercase">Sequencing DNA...</span>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full"
        >
            <div className="glass-card p-6 sm:p-8 rounded-[2rem] border-white/10 shadow-2xl bg-[#050505] relative">
                {/* Background Grid Decoration */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none rounded-[2rem]" />

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-6 sm:mb-8 relative z-30">
                    {showTitle && (
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/10">
                                <Hexagon size={20} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black tracking-tight uppercase">Skill Overview</h2>
                                <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-[0.2em]">Skills for {cycleName || 'Current Cycle'}</p>
                            </div>
                        </div>
                    )}

                    <div className="w-full sm:w-80">
                        <CustomSelect
                            value={selectedCycle}
                            onChange={setSelectedCycle}
                            options={[
                                { value: '', label: 'Latest Cycle DNA' },
                                ...(cyclesData || []).map((c: any) => ({
                                    value: (c.id || c._id).toString(),
                                    label: c.cycle_name
                                }))
                            ]}
                            className="w-full"
                            selectClassName="h-10 sm:h-12 rounded-xl bg-primary/5 border-primary/10"
                        />
                    </div>
                </div>

                <div className="h-[300px] sm:h-[350px] md:h-[380px] w-full mt-4 relative z-10">
                    {data.length === 0 ? (
                        <div className="h-full w-full flex flex-col items-center justify-center gap-6 opacity-60">
                            <Hexagon size={48} className="text-muted-foreground opacity-50" />
                            <div className="text-center">
                                <div className="text-lg font-black text-foreground mb-1 uppercase tracking-widest">No Data Available</div>
                                <p className="text-xs font-bold text-muted-foreground">Skill data is not available for this cycle.</p>
                            </div>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                                <PolarGrid stroke="#333" strokeWidth={1} />
                                <PolarAngleAxis
                                    dataKey="subject"
                                    tick={{ fill: '#888', fontSize: 10, fontWeight: 800, letterSpacing: '0.05em' }}
                                />
                                <PolarRadiusAxis
                                    angle={30}
                                    domain={[0, 10]}
                                    tick={{ fill: '#444', fontSize: 9, fontWeight: 700 }}
                                    axisLine={false}
                                />
                                <Radar
                                    name="Skill Score"
                                    dataKey="score"
                                    stroke="#d97706" /* amber-600 */
                                    strokeWidth={3}
                                    fill="#fbbf24" /* amber-400 */
                                    fillOpacity={0.25}
                                />
                                <Tooltip
                                    contentStyle={{
                                        background: 'rgba(0,0,0,0.8)',
                                        backdropFilter: 'blur(8px)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        padding: '8px 12px',
                                        boxShadow: '0 10px 20px rgba(0,0,0,0.5)'
                                    }}
                                    itemStyle={{ color: '#fbbf24', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}
                                    labelStyle={{ color: '#fff', fontWeight: 900, marginBottom: '4px', fontSize: '13px' }}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default SkillsDNA;
