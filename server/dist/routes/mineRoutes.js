"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_js_1 = require("../prisma.js");
const auth_js_1 = require("../middleware/auth.js");
const complianceService_js_1 = require("../services/complianceService.js");
const riskService_js_1 = require("../services/riskService.js");
const router = (0, express_1.Router)();
// GET /api/mines
router.get('/', auth_js_1.authenticateJWT, async (req, res) => {
    try {
        const mines = await prisma_js_1.prisma.mine.findMany({
            include: {
                _count: {
                    select: {
                        sections: true,
                        equipment: true,
                        users: true,
                        observations: true,
                        tasks: true,
                    },
                },
            },
            orderBy: { code: 'asc' },
        });
        res.json({ success: true, mines });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch mines' });
    }
});
// GET /api/mines/:id (Digital Mine Profile)
router.get('/:id', auth_js_1.authenticateJWT, async (req, res) => {
    try {
        const mineId = String(req.params.id);
        // Recalculate up-to-date risk score
        const riskBreakdown = await (0, riskService_js_1.calculateRiskScoreForMine)(mineId);
        const mine = await prisma_js_1.prisma.mine.findUnique({
            where: { id: mineId },
            include: {
                sections: {
                    include: {
                        _count: {
                            select: {
                                equipment: true,
                                observations: true,
                                tasks: true,
                            },
                        },
                    },
                },
                departments: true,
                equipment: {
                    include: {
                        section: { select: { id: true, code: true, name: true } },
                    },
                },
                emergencyResources: true,
                productionRecords: { orderBy: { createdAt: 'desc' }, take: 10 },
                environmentalRecords: { orderBy: { recordedAt: 'desc' }, take: 10 },
            },
        });
        if (!mine) {
            res.status(404).json({ success: false, message: 'Mine not found' });
            return;
        }
        // Fetch active observations
        const observations = await prisma_js_1.prisma.observation.findMany({
            where: { mineId },
            include: {
                section: true,
                equipment: true,
                reportedBy: { select: { id: true, name: true } },
                task: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        // Fetch tasks
        const tasks = await prisma_js_1.prisma.task.findMany({
            where: { mineId },
            include: {
                section: true,
                assignedTo: { select: { id: true, name: true, phone: true } },
                verifiedBy: { select: { id: true, name: true } },
                evidence: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        // Evidence collection
        const evidenceList = await prisma_js_1.prisma.taskEvidence.findMany({
            where: { task: { mineId } },
            include: {
                uploadedBy: { select: { id: true, name: true } },
                task: { select: { id: true, taskNumber: true, severity: true, title: true } },
            },
            orderBy: { timestamp: 'desc' },
        });
        // Compliance metrics
        const compliance = await (0, complianceService_js_1.getComplianceMetrics)(mineId);
        // Violations: Tasks or Compliance records overdue
        const violations = tasks.filter((t) => t.status === 'OVERDUE' || t.status === 'ESCALATED');
        // Workforce stats
        const usersInMine = await prisma_js_1.prisma.user.findMany({
            where: { mineId, isActive: true },
            include: { department: true },
        });
        // Department breakdown
        const deptBreakdown = {};
        for (const u of usersInMine) {
            const dName = u.department?.name || 'General Operations';
            deptBreakdown[dName] = (deptBreakdown[dName] || 0) + 1;
        }
        // Safety breakdown
        const severityCounts = {
            CRITICAL: observations.filter((o) => o.severity === 'CRITICAL' && o.status !== 'CLOSED').length,
            HIGH: observations.filter((o) => o.severity === 'HIGH' && o.status !== 'CLOSED').length,
            MEDIUM: observations.filter((o) => o.severity === 'MEDIUM' && o.status !== 'CLOSED').length,
            LOW: observations.filter((o) => o.severity === 'LOW' && o.status !== 'CLOSED').length,
        };
        // Category distribution
        const categoryCounts = {};
        for (const obs of observations) {
            categoryCounts[obs.category] = (categoryCounts[obs.category] || 0) + 1;
        }
        const mineEquipments = mine.equipment || [];
        // Equipment status breakdown
        const equipmentCounts = {
            total: mineEquipments.length,
            normal: mineEquipments.filter((e) => e.status === 'NORMAL').length,
            maintenance: mineEquipments.filter((e) => e.status === 'MAINTENANCE').length,
            critical: mineEquipments.filter((e) => e.status === 'CRITICAL').length,
            categories: {
                conveyors: mineEquipments.filter((e) => e.type.toLowerCase().includes('conveyor')).length,
                pumps: mineEquipments.filter((e) => e.type.toLowerCase().includes('pump')).length,
                electrical: mineEquipments.filter((e) => e.type.toLowerCase().includes('electrical')).length,
                dumpers: mineEquipments.filter((e) => e.type.toLowerCase().includes('dumper')).length,
                ventilation: mineEquipments.filter((e) => e.type.toLowerCase().includes('ventilation')).length,
                machinery: mineEquipments.filter((e) => e.type.toLowerCase().includes('machinery')).length,
            },
        };
        // Audit logs for this mine
        const recentActivity = await prisma_js_1.prisma.auditLog.findMany({
            take: 20,
            orderBy: { timestamp: 'desc' },
        });
        res.json({
            success: true,
            profile: {
                mine,
                risk: riskBreakdown,
                workforce: {
                    totalWorkers: usersInMine.length + 240, // Base workforce demo baseline
                    presentToday: usersInMine.length + 228,
                    leave: 8,
                    absent: 4,
                    departments: deptBreakdown,
                },
                safety: {
                    openObservations: observations.filter((o) => o.status !== 'CLOSED').length,
                    closedObservations: observations.filter((o) => o.status === 'CLOSED').length,
                    severityCounts,
                    categoryCounts,
                    recentObservations: observations.slice(0, 10),
                },
                tasks,
                evidence: evidenceList,
                compliance,
                violations,
                equipmentCounts,
                recentActivity,
            },
        });
    }
    catch (error) {
        console.error('Error fetching digital mine profile:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch digital mine profile' });
    }
});
exports.default = router;
