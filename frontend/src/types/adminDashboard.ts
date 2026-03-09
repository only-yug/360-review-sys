export type Cycle = {
    id: string;
    label: string;
    status: 'active' | 'closed';
    startDate?: string;
    endDate?: string;
};

export type Employee = {
    id: string;
    name: string;
    role: string;
    department: string;
    avatar?: string;
    stats?: {
        reviewsReceived: number;
        totalReviewsExpected: number;
        reviewsWritten: number;
        totalReviewsToWrite: number;
        status: 'Complete' | 'Pending' | 'At Risk';
    };
    // Keeping flat properties for compatibility until full migration
    reviewsReceived?: number;
    totalReviewsExpected?: number;
    reviewsWritten?: number;
    totalReviewsToWrite?: number;
    status?: 'Complete' | 'Pending' | 'At Risk';
};

export type Reviewer = {
    id: string;
    name: string;
    role: 'Peer' | 'Manager' | 'Direct Report';
    avatar?: string;
    status: 'Completed' | 'Pending' | 'Skipped';
};

export type Feedback = {
    id: string;
    reviewId?: string; // Add reviewId
    reviewerId: string;
    reviewerName: string;
    reviewerRole: string; // Changed from stringent union to string to match backend 'Peer' default
    cycleId?: string;
    skillId: string;
    skillName?: string; // Add skillName
    totalScore: number; // Changed from score to totalScore
    score?: number; // Backwards compatibility
    comment: string;
    createdAt?: string;
    answers: {
        answerId?: string; // Add answerId
        questionId: string;
        questionText: string;
        questionType?: string;
        score: number;
        maxScore: number;
    }[];
    history?: {
        score: number;
        comment: string;
        cycleId: string;
    };
};

export type Skill = {
    id: string;
    name: string;
    category: string;
};
