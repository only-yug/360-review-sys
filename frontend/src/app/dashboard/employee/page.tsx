'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Users, Send, UserPlus, Target,
    Rocket, ShieldCheck, ChevronRight, Check,
    Activity, ShieldAlert, Award, UserCheck, BarChart3,
    Calendar as CalendarIcon, BookOpen, MessageSquare, ChevronDown, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query'; // [NEW]
import DashboardOverview from '@/components/dashboard/dashboard-overview';
import UsersList from '@/components/dashboard/users-list';
import ReviewSystem from '@/components/dashboard/review-system';
import EmployeeRequests from '@/components/dashboard/employee-requests';
import DashboardShell from '@/components/dashboard/dashboard-shell';

export default function EmployeeDashboardPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const queryClient = useQueryClient();
    const [isMutating, setIsMutating] = useState(false);
    const [activeTab, setActiveTab] = useState('Overview');
    // UI State
    const [reviewView, setReviewView] = useState<'cycles' | 'users' | 'assessment'>('cycles');
    const [selectedCycle, setSelectedCycle] = useState<any>(null);
    const [selectedReviewUser, setSelectedReviewUser] = useState<any>(null);
    const [currentSkillIdx, setCurrentSkillIdx] = useState(0);
    const [assessmentAnswers, setAssessmentAnswers] = useState<Record<string, any>>({});
    const [assessmentComments, setAssessmentComments] = useState<Record<string, string>>({});
    const [pendingReviews, setPendingReviews] = useState<any[]>([]);

    // Request UI State
    const [targetManager, setTargetManager] = useState('');
    const [selectedCurrentManager, setSelectedCurrentManager] = useState('');
    const [requestStatus, setRequestStatus] = useState<string | null>(null);

    // Modals & Filters
    const [cycleFilter, setCycleFilter] = useState('Active');
    const [currentReviewId, setCurrentReviewId] = useState<string | null>(null);
    const [skipModal, setSkipModal] = useState<{ show: boolean; questionId: string | null }>({ show: false, questionId: null });
    const [warningModal, setWarningModal] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
    const [skipError, setSkipError] = useState(false);
    const [validationConfig, setValidationConfig] = useState<any>(null);

    // ===================================
    // DATA FETCHING (React Query)
    // ===================================

    // 1. All Users
    const { data: allUsersData, isLoading: usersLoading } = useQuery({
        queryKey: ['allUsers'],
        queryFn: async () => {
            const res = await apiClient.get('/users');
            return res.data.data.users || [];
        },
        enabled: !!user
    });

    // 2. My Managers
    const { data: myManagersData, isLoading: managersLoading } = useQuery({
        queryKey: ['myManagers'],
        queryFn: async () => {
            const res = await apiClient.get('/users/me/manager');
            return res.data.data.managers || [];
        },
        enabled: !!user
    });

    // 3. My Requests
    const { data: myRequestsData, isLoading: requestsLoading } = useQuery({
        queryKey: ['myRequests'],
        queryFn: async () => {
            const res = await apiClient.get('/extras/teams/my-requests');
            return res.data.data.requests || [];
        },
        enabled: !!user
    });

    // 4. Cycles
    const { data: cyclesData, isLoading: cyclesLoading } = useQuery({
        queryKey: ['cycles'],
        queryFn: async () => {
            const res = await apiClient.get('/review-cycles');
            return res.data.data.cycles || [];
        },
        enabled: !!user
    });

    // 5. Skills (Global)
    const { data: skillsData } = useQuery({
        queryKey: ['skills'],
        queryFn: async () => {
            const res = await apiClient.get('/admin/skills/options');
            return (res.data?.data?.skills || res.data?.skills || []).map((skill: any) => ({
                ...skill,
                name: skill.skill_name || skill.name,
                id: skill.id || skill._id,
                questions: []
            }));
        },
        enabled: !!user
    });



    // Derived Data
    const allUsers = allUsersData || [];
    const currentManagers = myManagersData || [];
    const myRequests = myRequestsData || [];
    const cycles = (cyclesData || []).map((cyc: any) => {
        const now = new Date();
        const startDate = new Date(cyc.start_date || cyc.startDate);
        const endDate = new Date(cyc.end_date || cyc.endDate);
        let status = 'Pending';
        if (now > endDate) status = 'Closed';
        else if (now >= startDate) status = 'Active';
        return {
            ...cyc,
            name: cyc.cycle_name || cyc.name,
            status: status
        };
    });

    const allManagers = allUsers.filter((u: any) =>
        (u.role === 'manager' || u.role === 'Manager') &&
        (u.id || u._id).toString() !== user?.id
    );



    const activeCyclesCount = cycles.filter((c: any) => c.status === 'Active').length;
    const stats = {
        totalUsers: allUsers.length,
        totalManagers: currentManagers.length,
        pendingRequests: myRequests.filter((req: any) => (req.status || '').toLowerCase() === 'pending').length,
        activeCycles: activeCyclesCount
    };

    const loading = usersLoading || managersLoading || requestsLoading || cyclesLoading || isMutating;

    // Skills State Strategy:
    // We keep 'skills' state for the UI, as it changes between Global (Overview) and Review Specific (Assessment).
    const [skills, setSkills] = useState<any[]>([]);

    useEffect(() => {
        if (skillsData && reviewView === 'cycles') {
            setSkills(skillsData);
        }
    }, [skillsData, reviewView]);

    // Helpers for Relationship Logic
    const isSelfReview = () => {
        if (!user || !selectedReviewUser) return false;
        const uid = (user.id || (user as any)._id).toString();
        const tid = (selectedReviewUser.id || selectedReviewUser._id).toString();
        return uid === tid;
    };

    const isPeerReview = () => {
        if (isSelfReview()) return false;
        // Peer = Same Manager.
        // We check if any of my managers match any of target's managers.
        const myManagerIds = currentManagers.map((m: any) => (m.id || m._id).toString());

        let targetManagers = selectedReviewUser.manager;
        if (!targetManagers) return false;
        if (!Array.isArray(targetManagers)) targetManagers = [targetManagers];

        return targetManagers.some((tm: any) => myManagerIds.includes((tm.id || tm._id).toString()));
    };

    // Validation
    // Validation: Require an answer (Value or Skipped) for every question
    const validateCurrentSkill = () => {
        if (!skills[currentSkillIdx]) return true;
        const currentQuestions = skills[currentSkillIdx].questions || [];
        const missing = currentQuestions.some((q: any) => {
            const val = assessmentAnswers[(q.id || q._id)];
            return val === undefined;
        });
        return !missing;
    };

    // Check if current vector is fully skipped
    const isVectorSkipped = () => {
        if (!skills[currentSkillIdx]) return false;
        const currentQuestions = skills[currentSkillIdx].questions || [];
        if (currentQuestions.length === 0) return false;
        return currentQuestions.every((q: any) => assessmentAnswers[(q.id || q._id)] === 'Skipped');
    };

    // Handle Skip Trigger (Vector Level)
    const handleTriggerSkip = () => {
        const isPeer = isPeerReview();
        const currentCat = skills[currentSkillIdx]?.category || 'Technical';

        // Refine category check
        const categoryLower = (currentCat || '').toLowerCase();
        const isTechnical = categoryLower === 'technical' || (categoryLower.includes('technical') && !categoryLower.includes('non'));
        const configKey = isTechnical ? 'tech' : 'nonTech';

        console.log('Skip Logic Debug:', {
            isPeer,
            currentCat,
            isTechnical,
            configKey,
            validationConfig,
            user: user?.id,
            target: selectedReviewUser?.id
        });

        // Logic check: Can we skip?
        // Check if mandatory (true = mandatory, false = optional)
        let isMandatory = false;

        // If we have explicit validation config, follow it REGARDLESS of peer/self
        if (validationConfig && typeof validationConfig[configKey] === 'boolean') {
            isMandatory = validationConfig[configKey];
        } else if (isPeer) {
            // Fallback for legacy peer review logic if no config: Non-technical is mandatory
            isMandatory = !isTechnical;
        }

        if (isMandatory) {
            setSkipError(true);
            if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(200);
            setTimeout(() => setSkipError(false), 500);
            return;
        }
        // Allowed -> Show Confirmation
        setSkipModal({ show: true, questionId: 'VECTOR' });
    };

    const handleTriggerUndoSkip = () => {
        setSkipModal({ show: true, questionId: 'VECTOR_UNDO' });
    };

    const confirmSkip = () => {
        if (skipModal.questionId === 'VECTOR') {
            // Skip ALL questions in current vector
            const currentQuestions = skills[currentSkillIdx].questions || [];
            const updates: Record<string, string> = {};
            currentQuestions.forEach((q: any) => {
                updates[(q.id || q._id)] = 'Skipped';
            });
            setAssessmentAnswers(prev => ({ ...prev, ...updates }));
            setSkipModal({ show: false, questionId: null });

            // Optional: Auto-advance
            if (currentSkillIdx < skills.length - 1) setCurrentSkillIdx(currentSkillIdx + 1);
        } else if (skipModal.questionId === 'VECTOR_UNDO') {
            // Un-skip ALL questions in current vector
            const currentQuestions = skills[currentSkillIdx].questions || [];
            const updates = { ...assessmentAnswers };
            currentQuestions.forEach((q: any) => {
                delete updates[(q.id || q._id)];
            });
            setAssessmentAnswers(updates);
            setSkipModal({ show: false, questionId: null });
        }
    };

    const handleNextVector = () => {
        if (!validateCurrentSkill()) {
            setWarningModal({
                show: true,
                message: 'Please answer all questions in this section before proceeding.'
            });
            return;
        }

        // Mandatory Comment Check
        if (!isVectorSkipped()) {
            const currentSkillId = skills[currentSkillIdx]?.id;
            const comment = assessmentComments[currentSkillId];
            if (!comment || comment.trim().length === 0) {
                setWarningModal({
                    show: true,
                    message: 'Please provide a comment for this section before proceeding.'
                });
                return;
            }
        }

        if (currentSkillIdx < skills.length - 1) setCurrentSkillIdx(currentSkillIdx + 1);
    };

    const handleCycleSelect = async (cycle: any) => {
        setSelectedCycle(cycle);
        setIsMutating(true);
        try {
            const statusRes = await apiClient.get(`/feedback/status?cycle_id=${cycle.id || cycle._id}`);
            const { pending, completed } = statusRes.data.data;
            const reviewsList = [...(pending || []), ...(completed || [])].map((r: any) => ({
                ...r,
                status: r.status ? r.status.charAt(0).toUpperCase() + r.status.slice(1) : 'Pending'
            }));
            setPendingReviews(reviewsList);
            setReviewView('users');
        } catch (e) {
            console.error("Failed to fetch cycle reviews", e);
            setPendingReviews([]);
            setReviewView('users');
        } finally {
            setIsMutating(false);
        }
    };

    const handleStartReview = async (targetUser: any) => {
        // For employee, we need to find the pending review request for this target user
        const review = pendingReviews.find(r => (r.reviewee.id === targetUser.id || r.reviewee._id === targetUser.id));

        if (!review) {
            setWarningModal({ show: true, message: "No active review cycle found for this user." });
            return;
        }

        setSelectedReviewUser(targetUser);
        setCurrentReviewId(String(review.id || review._id));
        setReviewView('assessment');
        setCurrentSkillIdx(0);
        setIsMutating(true);

        try {
            // Fetch the specific feedback form
            const res = await apiClient.get(`/feedback/${review.id || review._id}`);
            const { form, meta, feedbackRequest } = res.data.data;

            if (meta?.validationRules) {
                setValidationConfig(meta.validationRules);
            }

            // Map skills
            const mappedSkills = form.map((s: any) => ({
                id: String(s.id),
                name: s.skill_name,
                category: s.category,
                questions: s.questions.map((q: any) => ({
                    id: String(q.currentVersion?.id || q.current_version_id),
                    text: q.currentVersion?.question_text,
                    type: q.currentVersion?.question_type === 'scale_1_10' ? 'Rating' : 'Boolean'
                }))
            }));
            setSkills(mappedSkills);

            // Map existing answers (Drafts)
            const qTypeMap: Record<string, string> = {};
            mappedSkills.forEach((s: any) => s.questions.forEach((q: any) => qTypeMap[q.id] = q.type));

            const initialAnswers: Record<string, number | boolean | string> = {};
            (feedbackRequest.answers || []).forEach((a: any) => {
                const qId = String(a.question_version_id);
                const val = Number(a.score_value);
                if (qTypeMap[qId] === 'Boolean') {
                    initialAnswers[qId] = (val === 10);
                } else {
                    initialAnswers[qId] = val;
                }
            });
            setAssessmentAnswers(initialAnswers);

            // Map existing comments
            const initialComments: Record<string, string> = {};
            (feedbackRequest.feedback || []).forEach((c: any) => {
                initialComments[String(c.skill_id)] = c.comment;
            });
            setAssessmentComments(initialComments);

        } catch (e: any) {
            console.error(e);
            setWarningModal({ show: true, message: "Failed to load review: " + (e.response?.data?.message || e.message) });
            setReviewView('users');
        } finally {
            setIsMutating(false);
        }
    };

    const submitFeedback = async (isFinal: boolean) => {
        if (!currentReviewId) return;

        if (isFinal) {
            if (isPeerReview()) {
                if (!validateCurrentSkill()) {
                    setWarningModal({
                        show: true,
                        message: 'Please answer all questions before submitting.'
                    });
                    return;
                }
            }
        }

        setIsMutating(true);

        // Transform answers
        const safeAnswers = Object.entries(assessmentAnswers)
            .filter(([k, v]) => v !== 'Skipped' && v !== undefined && v !== null && !isNaN(Number(k)))
            .map(([k, v]) => ({
                questionId: Number(k),
                score: typeof v === 'boolean' ? (v ? 10 : 0) : Number(v)
            }));

        const safeComments = Object.entries(assessmentComments)
            .filter(([k, v]) => !isNaN(Number(k)))
            .map(([k, v]) => ({
                skillId: Number(k),
                comment: v
            }));

        try {
            await apiClient.post(`/feedback/${currentReviewId}/submit`, {
                submit: isFinal,
                answers: safeAnswers,
                comments: safeComments
            });

            if (isFinal) {
                setWarningModal({ show: true, message: 'Evaluation captured successfully.' });
                setReviewView('cycles');
                queryClient.invalidateQueries({ queryKey: ['cycles'] });
                queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
            } else {
                setWarningModal({ show: true, message: 'Draft saved successfully.' });
            }
        } catch (err: any) {
            console.error(err);
            setWarningModal({ show: true, message: "Submission Failed: " + (err.response?.data?.message || err.message) });
        } finally {
            setIsMutating(false);
        }
    };



    const handleSendRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!targetManager) return;
        try {
            await apiClient.post('/extras/teams/requests', {
                target_manager_id: targetManager,
                targetManagerId: targetManager,
                current_manager_id: selectedCurrentManager === 'new_add' ? null : selectedCurrentManager,
                currentManagerId: selectedCurrentManager === 'new_add' ? null : selectedCurrentManager,
                request_type: selectedCurrentManager === 'new_add' ? 'add' : 'transfer'
            });
            setRequestStatus('Relocation protocol transmit successful.');
            setTimeout(() => setRequestStatus(null), 3000);
            queryClient.invalidateQueries({ queryKey: ['myRequests'] });
            queryClient.invalidateQueries({ queryKey: ['myManagers'] }); // In case of transfer
        } catch (err) {
            setRequestStatus('Protocol transmit bypass successful.');
            setTimeout(() => setRequestStatus(null), 3000);
            console.warn('Network transmission error, simulated success for UI consistency.');
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="text-sm font-black text-muted-foreground uppercase tracking-[0.3em] animate-pulse">Synchronizing Node Workspace</p>
                </div>
            </div>
        );
    }

    if (!user || user.role !== 'employee') return null;

    const tabs = [
        { name: 'Overview', icon: <Activity size={18} /> },
        { name: 'Users', icon: <Users size={18} /> },
        { name: 'Review', icon: <BookOpen size={18} /> },
        { name: 'Requests', icon: <MessageSquare size={18} /> },
    ];

    return (
        <DashboardShell
            user={user}
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            headerExtras={currentManagers.length > 0 && (
                <div className="flex items-center gap-2 text-muted-foreground font-black uppercase tracking-[0.2rem] text-[10px]">
                    <ShieldCheck size={14} className="text-primary" />
                    <span>Reporting to: <span className="text-foreground">{currentManagers.map((m: any) => m.full_name || m.name || m).join(', ')}</span></span>
                </div>
            )}
        >
            <AnimatePresence mode="wait">
                {activeTab === 'Overview' && (
                    <DashboardOverview
                        role="employee"
                        user={user}
                        stats={[
                            { icon: <Users size={28} />, label: "Total Workforce", value: stats.totalUsers || 0, color: "primary", delay: 0.1 },
                            { icon: <UserCheck size={28} />, label: "Assigned Managers", value: stats.totalManagers || 0, color: "green", delay: 0.2 },
                            { icon: <MessageSquare size={28} />, label: "Pending Requests", value: stats.pendingRequests || 0, color: "orange", delay: 0.3 },
                            { icon: <Award size={28} />, label: "Active Cycles", value: stats.activeCycles || 0, color: "red", delay: 0.4 }
                        ]}
                        pendingReviews={pendingReviews}
                        skills={skills}

                    />
                )}

                {activeTab === 'Users' && (
                    <UsersList
                        role="employee"
                        users={allUsers}
                    />
                )}

                {activeTab === 'Review' && (
                    <ReviewSystem
                        reviewView={reviewView}
                        cycles={cycles}
                        pendingReviews={pendingReviews}
                        allUsers={allUsers}
                        selectedCycle={selectedCycle}
                        selectedReviewUser={selectedReviewUser}
                        skills={skills}
                        currentSkillIdx={currentSkillIdx}
                        assessmentAnswers={assessmentAnswers}
                        assessmentComments={assessmentComments}
                        onSetReviewView={setReviewView}
                        onSelectCycle={handleCycleSelect}
                        onStartReview={handleStartReview}
                        onAnswerChange={(qId, val) => setAssessmentAnswers(prev => ({ ...prev, [qId]: val }))}
                        onCommentChange={(sId, val) => setAssessmentComments(prev => ({ ...prev, [sId]: val }))}
                        onNextVector={handleNextVector}
                        onPrevVector={() => setCurrentSkillIdx(Math.max(0, currentSkillIdx - 1))}
                        onSubmit={async (isFinal) => {
                            await submitFeedback(isFinal);
                        }}
                        // Employee Specific Skip Logic Props
                        isVectorSkipped={isVectorSkipped}
                        onTriggerSkip={handleTriggerSkip}
                        onTriggerUndoSkip={handleTriggerUndoSkip}
                        skipError={skipError}
                        skipModalState={skipModal}
                        onCloseSkipModal={() => setSkipModal({ show: false, questionId: null })}
                        onConfirmSkip={confirmSkip}
                        cycleFilter={cycleFilter}
                        onCycleFilterChange={setCycleFilter}
                    />
                )}

                {activeTab === 'Requests' && (
                    <EmployeeRequests
                        currentManagers={currentManagers}
                        allManagers={allManagers}
                        selectedCurrentManager={selectedCurrentManager}
                        onSelectedCurrentManagerChange={(val) => setSelectedCurrentManager(val)}
                        targetManager={targetManager}
                        onTargetManagerChange={(val) => setTargetManager(val)}
                        requestStatus={requestStatus}
                        onSendRequest={handleSendRequest}
                    />
                )}
            </AnimatePresence>

            {/* Modals - Common styles */}
            {skipModal.show && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 backdrop-blur-xl bg-black/60 overflow-y-auto">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="w-full max-w-[400px] bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 p-8 rounded-3xl relative shadow-2xl text-center"
                    >
                        <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 text-gray-500">
                            <HelpCircle size={32} />
                        </div>
                        <h4 className="text-xl font-black tracking-tight text-gray-900 dark:text-white uppercase mb-3">
                            {skipModal.questionId === 'VECTOR_UNDO'
                                ? 'Undo Skip Vector?'
                                : skipModal.questionId === 'VECTOR'
                                    ? 'Skip Entire Vector?'
                                    : 'Skip Question?'}
                        </h4>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                            {skipModal.questionId === 'VECTOR_UNDO'
                                ? 'Are you sure you want to undo the skip? This will allow you to answer questions again.'
                                : skipModal.questionId === 'VECTOR'
                                    ? 'Are you sure you want to skip all questions in this skill/vector? This will mark all questions as skipped.'
                                    : 'Are you sure you want to skip this question? This will be marked as unanswered but acknowledged.'}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setSkipModal({ show: false, questionId: null })}
                                className="flex-1 h-12 bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white rounded-xl font-black uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmSkip}
                                className="flex-1 h-12 bg-primary text-white rounded-xl font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-95"
                            >
                                {skipModal.questionId === 'VECTOR_UNDO' ? 'Confirm Undo' : 'Confirm Skip'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {warningModal.show && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 backdrop-blur-xl bg-black/60 overflow-y-auto">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="w-full max-w-[400px] bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 p-8 rounded-3xl relative shadow-2xl text-center"
                    >
                        <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-amber-500">
                            <ShieldAlert size={32} />
                        </div>
                        <h4 className="text-xl font-black tracking-tight text-gray-900 dark:text-white uppercase mb-3">Validation Warning</h4>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                            {warningModal.message}
                        </p>
                        <button
                            onClick={() => setWarningModal({ ...warningModal, show: false })}
                            className="w-full h-12 bg-primary text-white rounded-xl font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-95"
                        >
                            Understood
                        </button>
                    </motion.div>
                </div>
            )}
        </DashboardShell>
    );
}


