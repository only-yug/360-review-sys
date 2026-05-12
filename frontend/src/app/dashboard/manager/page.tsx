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
import DashboardOverview from '@/components/dashboard/dashboard-overview';
import UsersList from '@/components/dashboard/users-list';
import ReviewSystem from '@/components/dashboard/review-system';
import TeamRequests from '@/components/dashboard/team-requests';
import { useQuery, useQueryClient } from '@tanstack/react-query'; // [NEW]
import DashboardShell from '@/components/dashboard/dashboard-shell';
import ScreenLoader from '@/components/ui/screen-loader';

export default function ManagerDashboardPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('Overview');
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [requestFilter, setRequestFilter] = useState('Pending');
    const [teamPage, setTeamPage] = useState(1);
    const [requestsPage, setRequestsPage] = useState(1);
    const [directoryPage, setDirectoryPage] = useState(1);
    const limit = 10;

    // UI State for Reviews
    const [reviewView, setReviewView] = useState<'cycles' | 'users' | 'assessment'>('cycles');
    const [selectedCycle, setSelectedCycle] = useState<any>(null);
    const [selectedReviewUser, setSelectedReviewUser] = useState<any>(null);
    const [currentSkillIdx, setCurrentSkillIdx] = useState(0);
    const [assessmentAnswers, setAssessmentAnswers] = useState<Record<string, any>>({});
    const [assessmentComments, setAssessmentComments] = useState<Record<string, string>>({});
    const [pendingReviews, setPendingReviews] = useState<any[]>([]);

    // UI State for Modals
    const { showAlert, showConfirm } = useAlert();
    const [skipError, setSkipError] = useState(false);
    const [validationConfig, setValidationConfig] = useState<any>(null);
    const [cycleFilter, setCycleFilter] = useState('Active');
    const [currentReviewId, setCurrentReviewId] = useState<string | null>(null);

    // =========================================================================
    // REACT QUERY: DATA FETCHING
    // =========================================================================

    // 0. Dashboard Summary — Lightweight counts for stat cards (fires immediately)
    const { data: summaryData, isLoading: summaryLoading } = useQuery({
        queryKey: ['dashboardSummary', 'manager', 'employee'], // Added employee dependency
        queryFn: async () => {
            const [mRes, eRes] = await Promise.all([
                apiClient.get('/admin/dashboard/summary', { params: { role: 'manager' } }),
                apiClient.get('/admin/dashboard/summary', { params: { role: 'employee' } })
            ]);
            return {
                ...mRes.data.data,
                totalWorkforce: eRes.data.data.totalWorkforce
            };
        },
        enabled: !!user,
        staleTime: 30_000
    });

    // 1. Fetch My Team (paginated) — For My Team tab table view
    const { data: teamData, isLoading: teamLoading } = useQuery({
        queryKey: ['myTeam', teamPage, limit],
        queryFn: async () => {
            const res = await apiClient.get(`/users/me/team?page=${teamPage}&limit=${limit}`);
            return { team: res.data.data.team || [], pagination: res.data.pagination };
        },
        enabled: !!user && (activeTab === 'My Team' || activeTab === 'Review')
    });

    // 1b. Fetch ALL Team Members (unpaginated) — For analysis dropdown in Overview
    const { data: allTeamForDropdownData } = useQuery({
        queryKey: ['allTeamForDropdown'],
        queryFn: async () => {
            const res = await apiClient.get('/users/me/team?limit=1000');
            return res.data?.data?.team || [];
        },
        enabled: !!user && activeTab === 'Overview',
        staleTime: 60_000
    });

    const allTeamForDropdown = allTeamForDropdownData || [];

    // 2. Fetch My Requests — Only when Team Requests tab is active
    const { data: requestsData, isLoading: requestsLoading } = useQuery({
        queryKey: ['myRequests', requestsPage, limit, requestFilter],
        queryFn: async () => {
            const res = await apiClient.get(`/extras/teams/my-requests?status=${requestFilter !== 'All' ? requestFilter : ''}&page=${requestsPage}&limit=${limit}`);
            return { requests: res.data.data.requests || [], pagination: res.data.pagination };
        },
        enabled: !!user && activeTab === 'Team Requests'
    });

    // 3. Fetch Cycles — Only when Review tab is active
    const { data: cyclesData, isLoading: cyclesLoading } = useQuery({
        queryKey: ['cycles'],
        queryFn: async () => {
            const res = await apiClient.get('/review-cycles');
            return res.data.data.cycles || [];
        },
        enabled: !!user && activeTab === 'Review'
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


    // 5. Organisation Directory — All non-admin users, read-only, only on Directory tab
    const { data: directoryData, isLoading: directoryLoading } = useQuery({
        queryKey: ['orgDirectory', directoryPage],
        queryFn: async () => {
            const res = await apiClient.get('/users', { params: { page: directoryPage, limit: 10 } });
            // Filter out admins on the frontend — the API already excludes the current user
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

    const myTeam = teamData?.team || [];
    const teamPagination = teamData?.pagination || null;
    const myRequests = requestsData?.requests || [];
    const requestsPagination = requestsData?.pagination || null;
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

    // Calculate Stats — Now powered by the lightweight summary API
    const stats = {
        totalTeamMembers: summaryData?.totalTeamMembers ?? 0,
        pendingRequests: summaryData?.pendingRequests ?? 0,
        activeCycles: summaryData?.activeCycles ?? 0,
        totalUsers: summaryData?.totalWorkforce ?? 0
    };

    // Only block initial render on the lightweight summary
    const loading = summaryLoading;

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
        let isMandatory = false;

        // Manager-to-Manager Review Specific Rules
        if (selectedReviewUser?.role?.toLowerCase() === 'manager') {
            const categoryLower = (currentCategory || '').toLowerCase();
            const isTechnical = categoryLower === 'technical' || (categoryLower.includes('technical') && !categoryLower.includes('non'));
            const configKey = isTechnical ? 'tech' : 'nonTech';

            if (validationConfig && typeof validationConfig[configKey] === 'boolean') {
                isMandatory = validationConfig[configKey];
            } else {
                isMandatory = !isTechnical;
            }
        } else {
            isMandatory = currentCategory === 'technical' ? validationConfig?.tech : validationConfig?.nonTech;
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
                const currentQuestions = localSkills[currentSkillIdx].questions || [];
                const updates: Record<string, string> = {};
                currentQuestions.forEach((q: any) => {
                    updates[(q.id || q._id)] = 'Skipped';
                });
                setAssessmentAnswers(prev => ({ ...prev, ...updates }));
                if (currentSkillIdx < localSkills.length - 1) setCurrentSkillIdx(currentSkillIdx + 1);
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
                const currentQuestions = localSkills[currentSkillIdx].questions || [];
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
            showAlert('Please answer all questions in this vector before proceeding. Manager assessments are comprehensive and mandatory.', 'Validation Warning', 'warning');
            return;
        }

        if (!isVectorSkipped()) {
            const currentSkillId = localSkills[currentSkillIdx]?.id || (localSkills[currentSkillIdx] as any)?._id;
            const comment = assessmentComments[currentSkillId];
            if (!comment || comment.trim().length === 0) {
                showAlert('Please provide a comment for this section before proceeding.', 'Validation Warning', 'warning');
                return;
            }
        }

        if (currentSkillIdx < localSkills.length - 1) setCurrentSkillIdx(currentSkillIdx + 1);
    };

    const handleCycleSelect = async (cycle: any) => {
        setSelectedCycle(cycle);
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
        }
    };

    const handleStartReviewFixed = async (targetUser: any) => {
        const review = pendingReviews.find(r => (r.reviewee.id === targetUser.id || r.reviewee._id === targetUser.id));
        if (!review) {
            showAlert("No active review cycle found for this user.", "Missing Review", "error");
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
            showAlert("Failed to load review: " + (e.response?.data?.message || e.message), "Error", "error");
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
                showAlert('Feedback Submitted Successfully!', 'Success', 'success');
                setReviewView('cycles');
                // TODO: Invalidate relevant React Query caches here, e.g., queryClient.invalidateQueries({ queryKey: ['myTeam'] });
            } else {
                showAlert("Draft Saved.", "Info", "info");
                setReviewView('users');
            }
        } catch (e: any) {
            showAlert("Submission Failed: " + (e.response?.data?.message || e.message), "Error", "error");
        }
    }

    const handleRequestAction = async (id: string, status: string) => {
        try {
            await apiClient.put(`/extras/teams/admin/requests/${id}`, { status });
            // Invalidate requests query to refresh UI
            queryClient.invalidateQueries({ queryKey: ['myRequests'] });
            queryClient.invalidateQueries({ queryKey: ['myTeam'] });
            queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
        } catch (e: any) {
            showAlert("Action Failed: " + (e.response?.data?.message || e.message), "Error", "error");
        }
    };

    // AUTH CHECK
    useEffect(() => {
        if (!authLoading && (!user || user.role !== 'manager')) {
            router.push('/login'); 
        }
    }, [user, authLoading, router]);

    // RENDER
    if (authLoading) return <ScreenLoader />;

    if (!user || user.role !== 'manager') return null;

    const tabs = [
        { name: 'Overview', icon: <Activity size={18} /> },
        { name: 'Users', icon: <UserCheck size={18} /> },
        { name: 'My Team', icon: <Users size={18} /> },
        { name: 'Review', icon: <BookOpen size={18} /> },
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
                        { icon: <Users size={28} />, label: "Total Users", value: stats.totalUsers || 0, color: "primary", delay: 0.1 },
                        { icon: <Users size={28} />, label: "Total Team Users", value: stats.totalTeamMembers || 0, color: "green", delay: 0.2 },
                        { icon: <MessageSquare size={28} />, label: "Pending Requests", value: stats.pendingRequests || 0, color: "orange", delay: 0.3 },
                        { icon: <Award size={28} />, label: "Active Cycles", value: stats.activeCycles || 0, color: "red", delay: 0.4 }
                    ]}
                    pendingReviews={pendingReviews}
                    skills={localSkills}
                    team={allTeamForDropdown}
                    selectedUserForChart={selectedUserId}
                    onUserSelect={setSelectedUserId}
                />
            )}

            {activeTab === 'My Team' && (
                <UsersList
                    role="manager"
                    users={myTeam}
                    pagination={teamPagination}
                    onPageChange={setTeamPage}
                />
            )}

            {activeTab === 'Users' && (
                <UsersList
                    role="manager"
                    users={directoryUsers}
                    pagination={directoryPagination}
                    onPageChange={setDirectoryPage}
                    readOnly
                    showManager
                />
            )}

            {activeTab === 'Review' && (
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
                    cycleFilter={cycleFilter}
                    onCycleFilterChange={setCycleFilter}
                />
            )}

            {activeTab === 'Team Requests' && (
                <TeamRequests
                    requests={myRequests}
                    filter={requestFilter}
                    onFilterChange={(newFilter) => {
                        setRequestFilter(newFilter);
                        setRequestsPage(1); // Reset page on filter change
                    }}
                    pagination={requestsPagination}
                    onPageChange={setRequestsPage}
                    onAction={handleRequestAction}
                />
            )}
        </DashboardShell>
    );
}




