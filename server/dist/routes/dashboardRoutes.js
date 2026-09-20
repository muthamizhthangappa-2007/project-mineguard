"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_js_1 = require("../prisma.js");
const auth_js_1 = require("../middleware/auth.js");
const complianceService_js_1 = require("../services/complianceService.js");
const riskService_js_1 = require("../services/riskService.js");
const router = (0, express_1.Router)();
// GET /api/dashboard/corporate
router.get('/corporate', auth_js_1.authenticateJWT, (0, auth_js_1.requireRole)('CORPORATE', 'ADMIN', 'REGULATOR'), async (req, res) => {
    try {
        const mines = await prisma_js_1.prisma.mine.findMany({
            include: {
                sections: true,
                _count: {
                    select: {
                        observations: true,
                        tasks: true,
                        equipment: true,
                        users: true,
                    },
                },
            },
        });
        // Update and collect mine risk summaries
        const mineSummaries = [];
        let totalOpenObservations = 0;
        let totalCriticalObservations = 0;
        let totalOverdueTasks = 0;
        let totalTasks = 0;
        let riskDistribution = { LOW: 0, MODERATE: 0, HIGH: 0 };
        const allCompliance = await (0, complianceService_js_1.getComplianceMetrics)();
        for (const m of mines) {
            const risk = await (0, riskService_js_1.calculateRiskScoreForMine)(m.id);
            const tasks = await prisma_js_1.prisma.task.findMany({ where: { mineId: m.id } });
            const obs = await prisma_js_1.prisma.observation.findMany({ where: { mineId: m.id, status: { notIn: ['CLOSED'] } } });
            const openObs = obs.length;
            const critObs = obs.filter((o) => o.severity === 'CRITICAL').length;
            const overdue = tasks.filter((t) => t.status === 'OVERDUE' || t.status === 'ESCALATED').length;
            totalOpenObservations += openObs;
            totalCriticalObservations += critObs;
            totalOverdueTasks += overdue;
            totalTasks += tasks.length;
            riskDistribution[risk.level]++;
            const mineComp = await (0, complianceService_js_1.getComplianceMetrics)(m.id);
            mineSummaries.push({
                id: m.id,
                code: m.code,
                name: m.name,
                location: m.location,
                subsidiary: m.subsidiary,
                mineType: m.mineType,
                managerName: m.managerName,
                riskScore: risk.totalScore,
                riskLevel: risk.level,
                complianceScore: mineComp.overallCompliance,
                openIssues: openObs,
                criticalIssues: critObs,
                overdueTasks: overdue,
                equipmentCount: m._count.equipment,
                workforceCount: m._count.users + 240,
            });
        }
        // Aggregate category trends
        const observations = await prisma_js_1.prisma.observation.findMany({ take: 100, orderBy: { createdAt: 'desc' } });
        const categoryDistribution = {};
        for (const o of observations) {
            categoryDistribution[o.category] = (categoryDistribution[o.category] || 0) + 1;
        }
        res.json({
            success: true,
            summary: {
                totalMines: mines.length,
                totalOpenObservations,
                totalCriticalObservations,
                totalOverdueTasks,
                totalTasks,
                overallCompliance: allCompliance.overallCompliance,
                riskDistribution,
                categoryDistribution,
            },
            mines: mineSummaries,
        });
    }
    catch (error) {
        console.error('Corporate dashboard error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate corporate dashboard data' });
    }
});
// GET /api/dashboard/regulatory
router.get('/regulatory', auth_js_1.authenticateJWT, (0, auth_js_1.requireRole)('REGULATOR', 'ADMIN', 'CORPORATE'), async (req, res) => {
    try {
        const compliance = await (0, complianceService_js_1.getComplianceMetrics)();
        const violations = await prisma_js_1.prisma.task.findMany({
            where: { status: { in: ['OVERDUE', 'ESCALATED'] } },
            include: {
                mine: { select: { id: true, name: true, code: true, location: true } },
                section: { select: { id: true, code: true, name: true } },
                assignedTo: { select: { id: true, name: true, phone: true } },
                evidence: true,
            },
            orderBy: { slaDeadline: 'asc' },
        });
        const overdueObligations = await prisma_js_1.prisma.complianceRecord.findMany({
            where: { status: 'OVERDUE' },
            include: {
                regulation: true,
                mine: true,
                responsibleOfficer: { select: { id: true, name: true } },
            },
        });
        const mines = await prisma_js_1.prisma.mine.findMany({
            select: {
                id: true,
                code: true,
                name: true,
                location: true,
                subsidiary: true,
                riskScore: true,
            },
        });
        const auditLogs = await prisma_js_1.prisma.auditLog.findMany({
            take: 30,
            orderBy: { timestamp: 'desc' },
        });
        res.json({
            success: true,
            compliance,
            violationsCount: violations.length,
            violations,
            overdueObligations,
            mines,
            auditLogs,
        });
    }
    catch (error) {
        console.error('Regulatory dashboard error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate regulatory dashboard data' });
    }
});
// GET /api/dashboard/mine (Quick summary for logged in mine manager)
router.get('/mine', auth_js_1.authenticateJWT, async (req, res) => {
    try {
        const mineId = req.query.mineId || req.user?.mineId;
        if (!mineId) {
            res.status(400).json({ success: false, message: 'Mine ID required' });
            return;
        }
        const mine = await prisma_js_1.prisma.mine.findUnique({
            where: { id: mineId },
            include: {
                sections: true,
                _count: { select: { equipment: true, tasks: true, observations: true } },
            },
        });
        if (!mine) {
            res.status(404).json({ success: false, message: 'Mine not found' });
            return;
        }
        const risk = await (0, riskService_js_1.calculateRiskScoreForMine)(mineId);
        const compliance = await (0, complianceService_js_1.getComplianceMetrics)(mineId);
        const tasks = await prisma_js_1.prisma.task.findMany({
            where: { mineId },
            orderBy: { createdAt: 'desc' },
        });
        const pendingVerificationCount = tasks.filter((t) => t.status === 'PENDING_VERIFICATION').length;
        const overdueCount = tasks.filter((t) => t.status === 'OVERDUE' || t.status === 'ESCALATED').length;
        const inProgressCount = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
        res.json({
            success: true,
            mine,
            risk,
            compliance,
            taskMetrics: {
                total: tasks.length,
                inProgress: inProgressCount,
                pendingVerification: pendingVerificationCount,
                overdue: overdueCount,
                closed: tasks.filter((t) => t.status === 'CLOSED').length,
            },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch mine overview' });
    }
});
exports.default = router;
