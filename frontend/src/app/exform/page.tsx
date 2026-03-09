'use client';

import React, { useState } from 'react';
import apiClient from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// --- Types ---
interface QuestionVersion {
    id: number;
    question_text: string;
    question_type: 'scale_1_10' | 'yes_no' | 'text';
}

interface Question {
    id: number;
    current_version_id: number;
    currentVersion: QuestionVersion;
}

interface Skill {
    id: number;
    skill_name: string;
    category: string;
    questions: Question[];
}

interface ReviewInterfaceData {
    feedbackRequest: any;
    form: Skill[];
    meta: {
        validationRules: {
            tech: boolean;
            nonTech: boolean;
        }
    };
}

export default function ExFormPage() {
    const [reviewId, setReviewId] = useState('');
    const [data, setData] = useState<ReviewInterfaceData | null>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    // State for Form Data
    const [answers, setAnswers] = useState<Record<number, number>>({}); // QuestionVersionID -> Score
    const [comments, setComments] = useState<Record<number, string>>({}); // SkillID -> Comment

    const loadInterface = async () => {
        if (!reviewId) return;
        setLoading(true);
        setMessage('');
        try {
            // Corrected Endpoint: /feedback/:id (not /feedback/review/:id/interface)
            const res = await apiClient.get(`/feedback/${reviewId}`);
            const responseData = res.data.data;
            setData(responseData);

            // Pre-fill Logic (Draft Retrieval)
            const fetchedAnswers = responseData.feedbackRequest.answers || [];
            const fetchedComments = responseData.feedbackRequest.feedback || [];

            const initialAnswers: Record<number, number> = {};
            fetchedAnswers.forEach((a: any) => {
                initialAnswers[a.question_version_id] = Number(a.score_value);
            });
            setAnswers(initialAnswers);

            const initialComments: Record<number, string> = {};
            fetchedComments.forEach((c: any) => {
                initialComments[c.skill_id] = c.comment;
            });
            setComments(initialComments);

            setMessage('Interface loaded successfully (Draft data restored if available).');
        } catch (err: any) {
            console.error(err);
            setMessage(`Error loading interface: ${err.response?.data?.message || err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleScoreChange = (qVersionId: number, score: number) => {
        setAnswers(prev => ({ ...prev, [qVersionId]: score }));
    };



    const handleCommentChange = (skillId: number, text: string) => {
        setComments(prev => ({ ...prev, [skillId]: text }));
    };

    const handleSubmit = async (isFinalSubmit: boolean) => {
        if (!reviewId) return;
        setLoading(true);
        setMessage('');

        const payload = {
            submit: isFinalSubmit,
            answers: Object.entries(answers).map(([qId, score]) => ({
                questionId: Number(qId),
                score: score
            })),
            comments: Object.entries(comments).map(([sId, comment]) => ({
                skillId: Number(sId),
                comment: comment
            }))
        };

        try {
            // Corrected Endpoint: /feedback/:id/submit (not /feedback/review/:id/submit)
            const res = await apiClient.post(`/feedback/${reviewId}/submit`, payload);
            setMessage(res.data.message);
            if (isFinalSubmit) {
                // Optionally refresh or lock form
                loadInterface(); // Reload to see updated status
            }
        } catch (err: any) {
            console.error(err);
            setMessage(`Error submitting: ${err.response?.data?.message || err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-8 max-w-4xl space-y-8">
            <h1 className="text-3xl font-bold mb-4">Experimental Review Form (/exform)</h1>

            {/* 1. Review ID Loader */}
            <Card>
                <CardHeader>
                    <CardTitle>Load Review Interface</CardTitle>
                </CardHeader>
                <CardContent className="flex gap-4 items-end">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="reviewId">Review ID</Label>
                        <Input
                            type="text"
                            id="reviewId"
                            placeholder="Enter Review ID (e.g. 1)"
                            value={reviewId}
                            onChange={(e) => setReviewId(e.target.value)}
                        />
                    </div>
                    <Button onClick={loadInterface} disabled={loading}>
                        {loading ? 'Loading...' : 'Load Interface'}
                    </Button>
                </CardContent>
            </Card>

            {message && (
                <div className={`p-4 rounded-md ${message.includes('Error') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                    {message}
                </div>
            )}

            {/* 2. dynamic Form */}
            {data && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center bg-slate-100 p-4 rounded-md">
                        <div>
                            <p><strong>Reviewee:</strong> {data.feedbackRequest.reviewee?.full_name}</p>
                            <p><strong>Status:</strong> {data.feedbackRequest.status}</p>
                        </div>
                        <div className="space-x-2">
                            <Button variant="outline" onClick={() => handleSubmit(false)} disabled={loading}>
                                Save Draft
                            </Button>
                            <Button onClick={() => handleSubmit(true)} disabled={loading}>
                                Submit Feedback
                            </Button>
                        </div>
                    </div>

                    {data.form.map((skill) => {
                        const isMandatory = skill.category === 'technical'
                            ? data.meta.validationRules.tech
                            : data.meta.validationRules.nonTech;

                        return (
                            <Card key={skill.id}>
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between">
                                        <CardTitle className="text-xl">{skill.skill_name}</CardTitle>
                                        <span className={`text-xs px-2 py-1 rounded ${isMandatory ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {isMandatory ? 'Required' : 'Optional'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 capitalize">{skill.category}</p>
                                </CardHeader>
                                <CardContent className="space-y-6">

                                    {/* Questions */}
                                    {skill.questions.map((q) => {
                                        const qVer = q.currentVersion;
                                        const qKey = qVer?.id || 0; // The question_version_id

                                        return (
                                            <div key={q.id} className="space-y-2 border-b pb-4 last:border-0">
                                                <Label className="text-base">{qVer?.question_text}</Label>

                                                {/* Render Input based on Type */}
                                                {qVer?.question_type === 'scale_1_10' && (
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                                                            <button
                                                                key={num}
                                                                onClick={() => handleScoreChange(qKey, num)}
                                                                className={`w-10 h-10 rounded-full border text-sm font-medium transition-colors
                                    ${answers[qKey] === num
                                                                        ? 'bg-primary text-primary-foreground border-primary bg-black text-white'
                                                                        : 'bg-background hover:bg-slate-100 text-slate-900 border-slate-200'}`}
                                                            >
                                                                {num}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}

                                                {qVer?.question_type === 'yes_no' && (
                                                    <div className="flex gap-4 mt-2">
                                                        <Button
                                                            variant={answers[qKey] === 10 ? 'default' : 'outline'}
                                                            onClick={() => handleScoreChange(qKey, 10)}
                                                        >
                                                            Yes
                                                        </Button>
                                                        <Button
                                                            variant={answers[qKey] === 0 ? 'default' : 'outline'}
                                                            onClick={() => handleScoreChange(qKey, 0)}
                                                        >
                                                            No
                                                        </Button>
                                                    </div>
                                                )}


                                            </div>
                                        );
                                    })}

                                    {/* Comment Section */}
                                    <div className="pt-2">
                                        <Label>Feedback / Comments</Label>
                                        <textarea
                                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-2"
                                            placeholder={`Comments for ${skill.skill_name}...`}
                                            value={comments[skill.id] || ''}
                                            onChange={(e) => handleCommentChange(skill.id, e.target.value)}
                                        />
                                    </div>

                                </CardContent>
                            </Card>
                        );
                    })}

                    <div className="flex justify-end space-x-4 py-8">
                        <Button variant="outline" size="lg" onClick={() => handleSubmit(false)} disabled={loading}>
                            Save Draft
                        </Button>
                        <Button size="lg" onClick={() => handleSubmit(true)} disabled={loading}>
                            Submit Final Feedback
                        </Button>
                    </div>

                </div>
            )}
        </div>
    );
}
