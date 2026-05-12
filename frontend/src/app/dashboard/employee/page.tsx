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
import { useAlert } from '@/lib/alert-context';
import { useQuery, useQueryClient } from '@tanstack/react-query'; // [NEW]
import DashboardOverview from '@/components/dashboard/dashboard-overview';
import UsersList from '@/components/dashboard/users-list';
import ReviewSystem from '@/components/dashboard/review-system';
import EmployeeRequests from '@/components/dashboard/employee-requests';
import DashboardShell from '@/components/dashboard/dashboard-shell';
import ScreenLoader from '@/components/ui/screen-loader';

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

    // Directory pagination
    const [directoryPage, setDirectoryPage] = useState(1);

    // Modals & Filters
    const [cycleFilter, setCycleFilter] = useState('Active');
    const [currentReviewId, setCurrentReviewId] = useState<string | null>(null);
    const { showAlert, showConfirm } = useAlert();
    const [skipError, setSkipError] = useState(false);
    const [validationConfig, setValidationConfig] = useState<any>(null);
    const [requestErrors, setRequestErrors] = useState<Record<string, string>>({});

    // ===================================
    // DATA FETCHING (React Query)
    // ===================================

    // 0. Dashboard Summary — Lightweight counts for stat cards (fires immediately)
    const { data: summaryData, isLoading: summaryLoading } = useQuery({
        queryKey: ['dashboardSummary', 'employee'],
        queryFn: async () => {
            const res = await apiClient.get('/admin/dashboard/summary', { params: { role: 'employee' } });
            return res.data.data;
        },
        enabled: !!user,
        staleTime: 30_000
    });

    // 1. All Users (For Review tab user list) — Only when Review tab is active
    const { data: allUsersData, isLoading: usersLoading } = useQuery({
        queryKey: ['allUsers'],
        queryFn: async () => {
            const res = await apiClient.get('/users?limit=1000');
            return res.data.data.users || [];
        },
        enabled: !!user && activeTab === 'Review'
    });

    // 2. My Managers — Needed for Overview header and Requests tab
    const { data: myManagersData, isLoading: managersLoading } = useQuery({
        queryKey: ['myManagers'],
        queryFn: async () => {
            const res = await apiClient.get('/users/me/manager?limit=100');
            return res.data.data.managers || [];
        },
        enabled: !!user && (activeTab === 'Overview' || activeTab === 'Requests')
    });

    // 3. My Requests — Only when Requests tab is active
    const { data: myRequestsData, isLoading: requestsLoading } = useQuery({
        queryKey: ['myRequests'],
        queryFn: async () => {
            const res = await apiClient.get('/extras/teams/my-requests?status=Pending&limit=50');
            return { requests: res.data.data.requests || [], total: res.data.pagination?.total || 0 };
        },
        enabled: !!user && activeTab === 'Requests'
    });

    // 4. Cycles — Only when Review tab is active
    const { data: cyclesData, isLoading: cyclesLoading } = useQuery({
        queryKey: ['cycles', cycleFilter],
        queryFn: async () => {
            const res = await apiClient.get('/review-cycles', {
                params: {
                    status: cycleFilter.toLowerCase() === 'all' ? undefined : cycleFilter.toLowerCase(),
                    page: 1
                }
            });
            return res.data?.data?.cycles || [];
        },
        enabled: !!user && activeTab === 'Review'
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

    // 6. All Managers (lightweight) — Only for Requests tab dropdown
    const { data: allManagersData } = useQuery({
        queryKey: ['allManagers'],
        queryFn: async () => {
            const res = await apiClient.get('/users', { params: { role: 'manager', limit: 100 } });
            return res.data.data.users || [];
        },
        enabled: !!user && activeTab === 'Requests'
    });

    // 7. Organisation Directory — All non-admin users, read-only
    const { data: directoryData } = useQuery({
        queryKey: ['orgDirectory', directoryPage],
        queryFn: async () => {
            const res = await apiClient.get('/users', { params: { page: directoryPage, limit: 10 } });
            const rawUsers = res.data?.data?.users || [];
            const pagination = res.data?.pagination || null;
            return {
                users: rawUsers.filter((u: any) => u.role !== 'admin'),
                pagination
            };
        },
        enabled: !!user && activeTab === 'Users',
        staleTime: 60_000
    });

    const directoryUsers = directoryData?.users || [];
    const directoryPagination = directoryData?.pagination || null;

    // Derived State
    const allUsers = allUsersData || [];
    const currentManagers = myManagersData || [];
    const pendingRequestsCount = myRequestsData?.total || 0;
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

    const allManagers = (allManagersData || []).filter((u: any) =>
        (u.id || u._id).toString() !== user?.id
    );



    const activeCyclesCount = cycles.filter((c: any) => c.status === 'Active').length;
    // Calculate Stats — Now powered by the lightweight summary API
    const stats = {
        totalUsers: summaryData?.totalWorkforce ?? 0,
        totalManagers: summaryData?.assignedManagers ?? 0,
        pendingRequests: summaryData?.pendingRequests ?? 0,
        activeCycles: summaryData?.activeCycles ?? 0,
    };

    // Only block initial render on the lightweight summary
    const loading = summaryLoading || isMutating;

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
        const categoryLower = (currentCat || '').toLowerCase();
        const isTechnical = categoryLower === 'technical' || (categoryLower.includes('technical') && !categoryLower.includes('non'));
        const configKey = isTechnical ? 'tech' : 'nonTech';

        let isMandatory = false;
        if (validationConfig && typeof validationConfig[configKey] === 'boolean') {
            isMandatory = validationConfig[configKey];
        } else if (isPeer) {
            isMandatory = !isTechnical;
        }

        if (isMandatory) {
            setSkipError(true);
            if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(200);
            setTimeout(() => setSkipError(false), 500);
            return;
        }

        showConfirm(
            'Are you sure you want to skip all questions in this skill? This will mark all questions as skipped. You can undo this later.',
            'Skip Entire Skills?',
            'warning'
        ).then(confirmed => {
            if (confirmed) {
                const currentQuestions = skills[currentSkillIdx].questions || [];
                const updates: Record<string, string> = {};
                currentQuestions.forEach((q: any) => {
                    updates[(q.id || q._id)] = 'Skipped';
                });
                setAssessmentAnswers(prev => ({ ...prev, ...updates }));
                if (currentSkillIdx < skills.length - 1) setCurrentSkillIdx(currentSkillIdx + 1);
            }
        });
    };

    const handleTriggerUndoSkip = () => {
        showConfirm(
            'Are you sure you want to undo the skip? This will allow you to answer questions again.',
            'Undo Skip Skill?',
            'info'
        ).then(confirmed => {
            if (confirmed) {
                const currentQuestions = skills[currentSkillIdx].questions || [];
                const updates = { ...assessmentAnswers };
                currentQuestions.forEach((q: any) => {
                    delete updates[(q.id || q._id)];
                });
                setAssessmentAnswers(updates);
            }
        });
    };

    const handleNextVector = () => {
        if (!validateCurrentSkill()) {
            showAlert('Please answer all questions in this section before proceeding.', 'Validation Warning', 'warning');
            return;
        }

        // Mandatory Comment Check
        if (!isVectorSkipped()) {
            const currentSkillId = skills[currentSkillIdx]?.id;
            const comment = assessmentComments[currentSkillId];
            if (!comment || comment.trim().length === 0) {
                showAlert('Please provide a comment for this section before proceeding.', 'Validation Warning', 'warning');
                return;
            }
        }

        if (currentSkillIdx < skills.length - 1) setCurrentSkillIdx(currentSkillIdx + 1);
    };

    const handleCycleSelect = async (cycle: any) => {
        setSelectedCycle(cycle);
        setIsMutating(true);
        try {
            const statusRes = await apiClient.get(`/feedback/status?cycle_id=${cycle.id || cycle._id}&limit=1000`);
            const { reviews } = statusRes.data.data;
            const reviewsList = (reviews || []).map((r: any) => ({
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
            showAlert("No active review cycle found for this user.", "Missing Review", "error");
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
            showAlert("Failed to load review: " + (e.response?.data?.message || e.message), "Error", "error");
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
                    showAlert('Please answer all questions before submitting.', 'Validation Warning', 'warning');
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
                showAlert('Evaluation captured successfully.', 'Success', 'success');
                setReviewView('cycles');
                queryClient.invalidateQueries({ queryKey: ['cycles'] });
                queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
            } else {
                showAlert('Draft saved successfully.', 'Info', 'info');
                setReviewView('users');
            }
        } catch (err: any) {
            console.error(err);
            showAlert("Submission Failed: " + (err.response?.data?.message || err.message), "Error", "error");
        } finally {
            setIsMutating(false);
        }
    };



    const handleSendRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        const errors: Record<string, string> = {};

        if (!selectedCurrentManager) errors.current_manager = 'Please select your current status';
        if (!targetManager) errors.target_manager = 'Please select a target manager';

        if (Object.keys(errors).length > 0) {
            setRequestErrors(errors);
            return;
        }

        setRequestErrors({});
        setIsMutating(true);
        try {
            await apiClient.post('/extras/teams/requests', {
                target_manager_id: targetManager,
                targetManagerId: targetManager,
                current_manager_id: selectedCurrentManager === 'new_add' ? null : selectedCurrentManager,
                currentManagerId: selectedCurrentManager === 'new_add' ? null : selectedCurrentManager,
                request_type: (selectedCurrentManager === 'new_add' && currentManagers.length > 0) ? 'join_additional' : 'transfer'
            });
            setRequestStatus('Relocation protocol transmit successful.');
            setTimeout(() => setRequestStatus(null), 3000);
            queryClient.invalidateQueries({ queryKey: ['myRequests'] });
            queryClient.invalidateQueries({ queryKey: ['myManagers'] }); // In case of transfer
            queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
        } catch (err: any) {
            console.error(err);
            showAlert("Request Failed: " + (err.response?.data?.message || "Internal data transmission failure."), "Error", "error");
        } finally {
            setIsMutating(false);
        }
    };

    if (authLoading) return <ScreenLoader />;

    if (!user || user.role !== 'employee') return null;

    const tabs = [
        { name: 'Overview', icon: <Activity size={18} /> },
        { name: 'Users', icon: <UserCheck size={18} /> },
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
                <div className="flex items-center gap-2 text-muted-foreground font-black text-sm">
                    <ShieldCheck size={14} className="text-primary" />
                    <span>Assigned Manager: <span className="text-foreground">{currentManagers.map((m: any) => m.full_name || m.name || m).join(', ')}</span></span>
                </div>
            )}
        >
            <AnimatePresence mode="wait">
                {activeTab === 'Overview' && (
                    <DashboardOverview
                        role="employee"
                        user={user}
                        stats={[
                            { icon: <Users size={28} />, label: "Total Users", value: stats.totalUsers || 0, color: "primary", delay: 0.1 },
                            { icon: <UserCheck size={28} />, label: "Assigned Managers", value: stats.totalManagers || 0, color: "green", delay: 0.2 },
                            { icon: <MessageSquare size={28} />, label: "Pending Requests", value: stats.pendingRequests || 0, color: "orange", delay: 0.3 },
                            { icon: <Award size={28} />, label: "Active Cycles", value: stats.activeCycles || 0, color: "red", delay: 0.4 }
                        ]}
                        pendingReviews={pendingReviews}
                        skills={skills}

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
                        cycleFilter={cycleFilter}
                        onCycleFilterChange={setCycleFilter}
                    />
                )}

                {activeTab === 'Users' && (
                    <UsersList
                        role="employee"
                        users={directoryUsers}
                        pagination={directoryPagination}
                        onPageChange={setDirectoryPage}
                        readOnly
                        showManager
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
                        errors={requestErrors}
                        myRequests={myRequestsData?.requests || []}
                    />
                )}
            </AnimatePresence>

            {/* Modals - Common styles */}

        </DashboardShell>
    );
}


