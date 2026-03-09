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
import DashboardOverview from '@/components/dashboard/dashboard-overview';
import UsersList from '@/components/dashboard/users-list';
import ReviewSystem from '@/components/dashboard/review-system';
import TeamRequests from '@/components/dashboard/team-requests';
import { useQuery, useQueryClient } from '@tanstack/react-query'; // [NEW]
import DashboardShell from '@/components/dashboard/dashboard-shell';

export default function ManagerDashboardPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('Overview');
    const [requestFilter, setRequestFilter] = useState('Pending');

    // UI State for Reviews
    const [reviewView, setReviewView] = useState<'cycles' | 'users' | 'assessment'>('cycles');
    const [selectedCycle, setSelectedCycle] = useState<any>(null);
    const [selectedReviewUser, setSelectedReviewUser] = useState<any>(null);
    const [currentSkillIdx, setCurrentSkillIdx] = useState(0);
    const [assessmentAnswers, setAssessmentAnswers] = useState<Record<string, any>>({});
    const [assessmentComments, setAssessmentComments] = useState<Record<string, string>>({});
    const [pendingReviews, setPendingReviews] = useState<any[]>([]);

    // UI State for Modals
    const [skipModal, setSkipModal] = useState<{ show: boolean; questionId: string | null }>({ show: false, questionId: null });
    const [warningModal, setWarningModal] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
    const [skipError, setSkipError] = useState(false);
    const [validationConfig, setValidationConfig] = useState<any>(null);
    const [cycleFilter, setCycleFilter] = useState('Active');
    const [currentReviewId, setCurrentReviewId] = useState<string | null>(null);

    // =========================================================================
    // REACT QUERY: DATA FETCHING
    // =========================================================================

    // 1. Fetch My Team
    const { data: teamData, isLoading: teamLoading } = useQuery({
        queryKey: ['myTeam'],
        queryFn: async () => {
            const res = await apiClient.get('/users/me/team');
            return res.data.data.team || [];
        },
        enabled: !!user
    });

    // 2. Fetch My Requests (Team Change Requests targeted to me)
    const { data: requestsData, isLoading: requestsLoading } = useQuery({
        queryKey: ['myRequests'],
        queryFn: async () => {
            const res = await apiClient.get('/extras/teams/my-requests');
            return res.data.data.requests || [];
        },
        enabled: !!user
    });

    // 3. Fetch Cycles
    const { data: cyclesData, isLoading: cyclesLoading } = useQuery({
        queryKey: ['cycles'],
        queryFn: async () => {
            const res = await apiClient.get('/review-cycles');
            return res.data.data.cycles || [];
        },
        enabled: !!user
    });

    // 4. Fetch Skills (for review form structure)
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



    // Derived State
    const myTeam = teamData || [];
    const myRequests = requestsData || [];
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

    // Local state for skills, initialized from query but can be overridden for assessment form
    const [localSkills, setLocalSkills] = useState<any[]>([]);
    useEffect(() => {
        if (skillsData) {
            setLocalSkills(skillsData);
        }
    }, [skillsData]);



    const activeCyclesCount = cycles.filter((c: any) => c.status === 'Active').length;

    // Calculate Stats
    const stats = {
        totalTeamMembers: myTeam.length,
        pendingRequests: myRequests.filter((r: any) => r.status === 'pending').length,
        activeCycles: activeCyclesCount,
        teamPerformance: 0 // Placeholder
    };

    const loading = teamLoading || requestsLoading || cyclesLoading;

    // =========================================================================
    // HELPER FUNCTIONS (Preserved from original)
    // =========================================================================

    // Validation
    const validateCurrentSkill = () => {
        if (!localSkills[currentSkillIdx]) return true;
        const currentQuestions = localSkills[currentSkillIdx].questions || [];
        const missing = currentQuestions.some((q: any) => assessmentAnswers[(q.id || q._id)] === undefined);
        return !missing;
    };

    const isVectorSkipped = () => {
        if (!localSkills[currentSkillIdx]) return false;
        const currentQuestions = localSkills[currentSkillIdx].questions || [];
        if (currentQuestions.length === 0) return false;
        return currentQuestions.every((q: any) => assessmentAnswers[(q.id || q._id)] === 'Skipped');
    };

    const handleSkipVector = () => {
        const currentCategory = localSkills[currentSkillIdx]?.category;
        let isMandatory = currentCategory === 'technical' ? validationConfig.tech : validationConfig.nonTech;

        // Manager-to-Manager Review Specific Rules
        if (selectedReviewUser?.role?.toLowerCase() === 'manager') {
            // Updated dynamic validation logic
            const categoryLower = (currentCategory || '').toLowerCase();
            const isTechnical = categoryLower === 'technical' || (categoryLower.includes('technical') && !categoryLower.includes('non'));
            const configKey = isTechnical ? 'tech' : 'nonTech';

            // Check config if available, otherwise fallback
            if (validationConfig && typeof validationConfig[configKey] === 'boolean') {
                isMandatory = validationConfig[configKey];
            } else {
                // Default fallback: Technical optional (false), Non-Technical mandatory (true)
                isMandatory = !isTechnical;
            }
        }

        if (isMandatory) {
            setSkipError(true);
            if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(200);
            setTimeout(() => setSkipError(false), 500);
            return;
        }
        setSkipModal({ show: true, questionId: 'VECTOR' });
    };

    const handleTriggerUndoSkip = () => {
        setSkipModal({ show: true, questionId: 'VECTOR_UNDO' });
    };

    const confirmSkip = () => {
        if (skipModal.questionId === 'VECTOR') {
            const currentQuestions = localSkills[currentSkillIdx].questions || [];
            const updates: Record<string, string> = {};
            currentQuestions.forEach((q: any) => {
                updates[(q.id || q._id)] = 'Skipped';
            });
            setAssessmentAnswers(prev => ({ ...prev, ...updates }));
            setSkipModal({ show: false, questionId: null });
            if (currentSkillIdx < localSkills.length - 1) setCurrentSkillIdx(currentSkillIdx + 1);
        } else if (skipModal.questionId === 'VECTOR_UNDO') {
            const currentQuestions = localSkills[currentSkillIdx].questions || [];
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
                message: 'Please answer all questions in this vector before proceeding. Manager assessments are comprehensive and mandatory.'
            });
            return;
        }

        // Mandatory Comment Check
        if (!isVectorSkipped()) {
            // Safe access using optional chaining and fallback
            const currentSkillId = localSkills[currentSkillIdx]?.id || (localSkills[currentSkillIdx] as any)?._id;
            const comment = assessmentComments[currentSkillId];
            if (!comment || comment.trim().length === 0) {
                setWarningModal({
                    show: true,
                    message: 'Please provide a comment for this section before proceeding.'
                });
                return;
            }
        }

        if (currentSkillIdx < localSkills.length - 1) setCurrentSkillIdx(currentSkillIdx + 1);
    };

    const handleCycleSelect = async (cycle: any) => {
        setSelectedCycle(cycle);
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
        }
    };

    const handleStartReviewFixed = async (targetUser: any) => {
        const review = pendingReviews.find(r => (r.reviewee.id === targetUser.id || r.reviewee._id === targetUser.id));
        if (!review) {
            setWarningModal({ show: true, message: "No active review cycle found for this user." });
            return;
        }

        setSelectedReviewUser(targetUser);
        setCurrentReviewId(String(review.id || review._id));
        setReviewView('assessment');
        setCurrentSkillIdx(0);

        try {
            const res = await apiClient.get(`/feedback/${review.id || review._id}`);
            const { form, meta, feedbackRequest } = res.data.data;
            if (meta?.validationRules) setValidationConfig(meta.validationRules);

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

            setLocalSkills(mappedSkills); // Override for assessment

            // Map Answers...
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

            const initialComments: Record<string, string> = {};
            (feedbackRequest.feedback || []).forEach((c: any) => {
                initialComments[String(c.skill_id)] = c.comment;
            });
            setAssessmentComments(initialComments);

        } catch (e: any) {
            console.error(e);
            setWarningModal({ show: true, message: "Failed to load review: " + (e.response?.data?.message || e.message) });
            setReviewView('users');
        }
    };

    const submitFeedback = async (isFinal: boolean) => {
        if (!currentReviewId) return;

        const safeAnswers = Object.entries(assessmentAnswers)
            .filter(([k, v]) => v !== 'Skipped' && v !== undefined && v !== null)
            .map(([k, v]) => ({
                questionId: Number(k),
                score: typeof v === 'boolean' ? (v ? 10 : 0) : Number(v)
            }));

        const safeComments = Object.entries(assessmentComments)
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
                setWarningModal({ show: true, message: 'Feedback Submitted Successfully!' });
                setReviewView('cycles');
                // TODO: Invalidate relevant React Query caches here, e.g., queryClient.invalidateQueries({ queryKey: ['myTeam'] });
            } else {
                setWarningModal({ show: true, message: "Draft Saved." });
            }
        } catch (e: any) {
            setWarningModal({ show: true, message: "Submission Failed: " + (e.response?.data?.message || e.message) });
        }
    }

    const handleRequestAction = async (id: string, status: string) => {
        try {
            await apiClient.put(`/extras/teams/requests/${id}`, { status });
            // Invalidate requests query to refresh UI
            // queryClient.invalidateQueries({ queryKey: ['myRequests'] });
            // For now, doing manual update or rely on useQuery re-fetch if we had access to queryClient here.
            // Since we don't have queryClient instance captured in a variable, we should add it.
        } catch (e: any) {
            setWarningModal({ show: true, message: "Action Failed: " + (e.response?.data?.message || e.message) });
        }
    };

    // AUTH CHECK
    useEffect(() => {
        if (!authLoading && (!user || user.role !== 'manager')) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    // RENDER
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

    if (!user || user.role !== 'manager') return null;

    const tabs = [
        { name: 'Overview', icon: <Activity size={18} /> },
        { name: 'My Team', icon: <Users size={18} /> },
        { name: 'Perform Review', icon: <BookOpen size={18} /> },
        { name: 'Team Requests', icon: <MessageSquare size={18} /> },
    ];

    return (
        <DashboardShell
            user={user}
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
        >
            {activeTab === 'Overview' && (
                <DashboardOverview
                    role="manager"
                    user={user}
                    stats={[
                        { icon: <Users size={28} />, label: "Total Team", value: stats.totalTeamMembers || 0, color: "primary", delay: 0.1 },
                        { icon: <UserCheck size={28} />, label: "Avg Performance", value: stats.teamPerformance || 0, color: "green", delay: 0.2 },
                        { icon: <MessageSquare size={28} />, label: "Pending Requests", value: stats.pendingRequests || 0, color: "orange", delay: 0.3 },
                        { icon: <Award size={28} />, label: "Active Cycles", value: stats.activeCycles || 0, color: "red", delay: 0.4 }
                    ]}
                    pendingReviews={pendingReviews}
                    skills={localSkills}

                />
            )}

            {activeTab === 'My Team' && (
                <UsersList
                    role="manager"
                    users={myTeam}
                />
            )}

            {activeTab === 'Perform Review' && (
                <ReviewSystem
                    reviewView={reviewView}
                    cycles={cycles}
                    pendingReviews={pendingReviews}
                    allUsers={myTeam} // Manager reviews their team
                    selectedCycle={selectedCycle}
                    selectedReviewUser={selectedReviewUser}
                    skills={localSkills}
                    currentSkillIdx={currentSkillIdx}
                    assessmentAnswers={assessmentAnswers}
                    assessmentComments={assessmentComments}
                    onSetReviewView={setReviewView}
                    onSelectCycle={handleCycleSelect}
                    onStartReview={handleStartReviewFixed}
                    onAnswerChange={(qId, val) => setAssessmentAnswers(prev => ({ ...prev, [qId]: val }))}
                    onCommentChange={(sId, val) => setAssessmentComments(prev => ({ ...prev, [sId]: val }))}
                    onNextVector={handleNextVector}
                    onPrevVector={() => setCurrentSkillIdx(Math.max(0, currentSkillIdx - 1))}
                    onSubmit={async (isFinal) => {
                        await submitFeedback(isFinal);
                    }}
                    // Manager Specific Props
                    isVectorSkipped={isVectorSkipped}
                    onTriggerSkip={handleSkipVector}
                    onTriggerUndoSkip={handleTriggerUndoSkip}
                    skipError={skipError}
                    skipModalState={skipModal}
                    onCloseSkipModal={() => setSkipModal({ show: false, questionId: null })}
                    onConfirmSkip={confirmSkip}
                    cycleFilter={cycleFilter}
                    onCycleFilterChange={setCycleFilter}
                />
            )}

            {activeTab === 'Team Requests' && (
                <TeamRequests
                    requests={myRequests}
                    filter={requestFilter}
                    onFilterChange={setRequestFilter}
                    onAction={handleRequestAction}
                />
            )}
        </DashboardShell>
    );
}




