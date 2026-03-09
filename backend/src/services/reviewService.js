const { Review, User, ReportingLine, EvaluationCycle, sequelize } = require('../models');

exports.generateReviewsForCycle = async (cycleId, transaction) => {
    console.log(`Generating reviews for Cycle ID: ${cycleId}`);

    // [GUARD]: Prevent catastrophic duplicate review generation
    const existing = await Review.count({ where: { cycle_id: cycleId }, transaction });
    if (existing > 0) {
        console.log(`Abort generation: Cycle ${cycleId} already has ${existing} reviews in the DB.`);
        return 0; // Skip to prevent dupes
    }

    // 1. Fetch all active users with their Reporting Lines
    const users = await User.findAll({
        where: { role: ['admin', 'manager', 'employee'] },
        include: [
            {
                model: ReportingLine,
                as: 'managedBy', // Who manages me?
                where: { is_active: true },
                required: false
            }
        ],
        transaction
    });

    const reviewsToCreate = [];
    const set = new Set();

    // Helper to prevent duplicates
    const addReview = (reviewerId, revieweeId) => {
        const key = `${reviewerId}-${revieweeId}`;
        if (set.has(key)) return;
        set.add(key);
        reviewsToCreate.push({
            cycle_id: cycleId,
            reviewer_id: reviewerId,
            reviewee_id: revieweeId,
            status: 'pending'
        });
    };

    const admins = users.filter(u => u.role === 'admin');

    // Map to find peers: managerId -> [employeeIds]
    const teamMap = {};

    // First pass: Organize teams and handle Managers
    users.forEach(reviewee => {
        // A. Self-Review (DISABLED per requirements)
        // addReview(reviewee.id, reviewee.id);

        // B. Admin reviews everyone
        admins.forEach(admin => {
            if (admin.id !== reviewee.id) addReview(admin.id, reviewee.id);
        });

        // C. Managers review Employee (Downward) & Employee reviews Manager (Upward)
        if (reviewee.managedBy && reviewee.managedBy.length > 0) {
            reviewee.managedBy.forEach(line => {
                const managerId = line.manager_id;

                // Manager -> Employee
                addReview(managerId, reviewee.id);

                // Employee -> Manager
                addReview(reviewee.id, managerId);

                // Build Team Map for Peers (Only consider 'primary' or default relationships for peers?)
                // Assuming all reporting lines imply a team relationship -> Add to that manager's team
                if (!teamMap[managerId]) teamMap[managerId] = [];
                teamMap[managerId].push(reviewee.id);
            });
        }
    });

    // Second pass: Peer Reviews (Intra-Team)
    // For each manager, all their direct reports review each other
    Object.keys(teamMap).forEach(managerId => {
        const teamMembers = teamMap[managerId];
        // If team has more than 1 member, they are peers
        if (teamMembers.length > 1) {
            for (let i = 0; i < teamMembers.length; i++) {
                for (let j = 0; j < teamMembers.length; j++) {
                    if (i !== j) {
                        // Peer A -> Peer B
                        addReview(teamMembers[i], teamMembers[j]);
                    }
                }
            }
        }
    });

    // Third pass: Universal Cross-Team (Catch-All)
    // "Manager and other employees not in team can also review"
    // This ensures every user reviews every other user (unless restricted)
    users.forEach(reviewer => {
        users.forEach(reviewee => {
            // 1. No Self-Reviews
            if (reviewer.id === reviewee.id) return;

            // 2. Admin Protection: Nobody reviews the Admin (unless Admin reviews Admin? No, self covered)
            // Ideally only Admin reviews Admin? Or Admin is just never reviewed.
            if (reviewee.role === 'admin') return;

            // 3. Add Review (deduplication handled inside)
            addReview(reviewer.id, reviewee.id);
        });
    });

    // Bulk Create
    if (reviewsToCreate.length > 0) {
        await Review.bulkCreate(reviewsToCreate, { transaction });
        console.log(`Generated ${reviewsToCreate.length} reviews (Self, Peers, Managers, Admins).`);
    } else {
        console.log('No reviews generated.');
    }

    return reviewsToCreate.length;
};
