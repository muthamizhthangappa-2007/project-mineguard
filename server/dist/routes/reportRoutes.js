"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_js_1 = require("../prisma.js");
const auth_js_1 = require("../middleware/auth.js");
const complianceService_js_1 = require("../services/complianceService.js");
const router = (0, express_1.Router)();
// GET /api/reports/safety (CSV or structured JSON)
router.get('/safety', auth_js_1.authenticateJWT, async (req, res) => {
    try {
        const { mineId, format } = req.query;
        const where = {};
        if (mineId)
            where.mineId = String(mineId);
        const observations = await prisma_js_1.prisma.observation.findMany({
            where,
            include: {
                mine: true,
                section: true,
                equipment: true,
                reportedBy: true,
                task: { include: { assignedTo: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        if (format === 'csv') {
            const headers = 'Observation Number,Mine,Section,Equipment,Category,Severity,Status,Reported By,Assigned Officer,Created At,Description\n';
            const rows = observations.map((o) => {
                const cleanDesc = (o.englishReport || o.description).replace(/[,\n\r]/g, ' ');
                return `"${o.observationNumber}","${o.mine.name}","${o.section.code}","${o.equipment?.name || 'N/A'}","${o.category}","${o.severity}","${o.status}","${o.reportedBy.name}","${o.task?.assignedTo.name || 'Unassigned'}","${o.createdAt.toISOString()}","${cleanDesc}"`;
            }).join('\n');
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="safety-report.csv"');
            res.send(headers + rows);
            return;
        }
        res.json({ success: true, count: observations.length, data: observations });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to generate safety report' });
    }
});
// GET /api/reports/compliance
router.get('/compliance', auth_js_1.authenticateJWT, async (req, res) => {
    try {
        const { mineId, format } = req.query;
        const metrics = await (0, complianceService_js_1.getComplianceMetrics)(mineId ? String(mineId) : undefined);
        if (format === 'csv') {
            const headers = 'Regulation Code,Official Source,Category,Frequency,Mine,Status,Due Date,Notes\n';
            const rows = metrics.records.map((r) => {
                return `"${r.regulation.regulationCode}","${r.regulation.officialSource}","${r.regulation.category}","${r.regulation.frequency}","${r.mine.name}","${r.status}","${r.dueDate.toISOString()}","${r.notes || ''}"`;
            }).join('\n');
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="compliance-report.csv"');
            res.send(headers + rows);
            return;
        }
        res.json({ success: true, metrics });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to generate compliance report' });
    }
});
// GET /api/reports/tasks
router.get('/tasks', auth_js_1.authenticateJWT, async (req, res) => {
    try {
        const { mineId, format } = req.query;
        const where = {};
        if (mineId)
            where.mineId = String(mineId);
        const tasks = await prisma_js_1.prisma.task.findMany({
            where,
            include: {
                mine: true,
                section: true,
                assignedTo: true,
                verifiedBy: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        if (format === 'csv') {
            const headers = 'Task Number,Title,Mine,Section,Category,Severity,Status,SLA Hours,SLA Deadline,Assigned Officer,Verification Status\n';
            const rows = tasks.map((t) => {
                return `"${t.taskNumber}","${t.title.replace(/[,\n\r]/g, ' ')}","${t.mine.name}","${t.section.code}","${t.category}","${t.severity}","${t.status}","${t.slaHours}","${t.slaDeadline.toISOString()}","${t.assignedTo.name}","${t.verificationStatus || 'N/A'}"`;
            }).join('\n');
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="tasks-report.csv"');
            res.send(headers + rows);
            return;
        }
        res.json({ success: true, count: tasks.length, tasks });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to generate task report' });
    }
});
exports.default = router;
