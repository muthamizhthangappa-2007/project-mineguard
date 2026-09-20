"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getComplianceMetrics = void 0;
const prisma_js_1 = require("../prisma.js");
const getComplianceMetrics = async (mineId) => {
    const where = mineId ? { mineId } : {};
    const records = await prisma_js_1.prisma.complianceRecord.findMany({
        where,
        include: {
            regulation: true,
            mine: true,
            section: true,
            responsibleOfficer: true,
        },
    });
    const total = records.length;
    if (total === 0) {
        return {
            overallCompliance: 100,
            safetyCompliance: 100,
            equipmentCompliance: 100,
            environmentCompliance: 100,
            emergencyCompliance: 100,
            totalObligations: 0,
            completedObligations: 0,
            pendingObligations: 0,
            dueSoonObligations: 0,
            overdueObligations: 0,
            records: [],
        };
    }
    let completed = 0;
    let pending = 0;
    let dueSoon = 0;
    let overdue = 0;
    const categoryCounts = {
        SAFETY: { total: 0, completed: 0 },
        EQUIPMENT: { total: 0, completed: 0 },
        ENVIRONMENT: { total: 0, completed: 0 },
        EMERGENCY: { total: 0, completed: 0 },
    };
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    for (const rec of records) {
        const cat = rec.regulation.category.toUpperCase();
        if (!categoryCounts[cat]) {
            categoryCounts[cat] = { total: 0, completed: 0 };
        }
        categoryCounts[cat].total++;
        // Dynamic status determination if due
        let currentStatus = rec.status;
        if (currentStatus !== 'COMPLETED') {
            if (rec.dueDate < now) {
                currentStatus = 'OVERDUE';
            }
            else if (rec.dueDate <= threeDaysFromNow) {
                currentStatus = 'DUE_SOON';
            }
        }
        if (currentStatus === 'COMPLETED') {
            completed++;
            categoryCounts[cat].completed++;
        }
        else if (currentStatus === 'OVERDUE') {
            overdue++;
        }
        else if (currentStatus === 'DUE_SOON') {
            dueSoon++;
        }
        else {
            pending++;
        }
    }
    const calcPct = (c, t) => (t > 0 ? Math.round((c / t) * 100) : 100);
    return {
        overallCompliance: calcPct(completed, total),
        safetyCompliance: calcPct(categoryCounts.SAFETY?.completed || 0, categoryCounts.SAFETY?.total || 0),
        equipmentCompliance: calcPct(categoryCounts.EQUIPMENT?.completed || 0, categoryCounts.EQUIPMENT?.total || 0),
        environmentCompliance: calcPct(categoryCounts.ENVIRONMENT?.completed || 0, categoryCounts.ENVIRONMENT?.total || 0),
        emergencyCompliance: calcPct(categoryCounts.EMERGENCY?.completed || 0, categoryCounts.EMERGENCY?.total || 0),
        totalObligations: total,
        completedObligations: completed,
        pendingObligations: pending,
        dueSoonObligations: dueSoon,
        overdueObligations: overdue,
        records,
    };
};
exports.getComplianceMetrics = getComplianceMetrics;
