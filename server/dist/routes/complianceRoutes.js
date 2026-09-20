"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_js_1 = require("../prisma.js");
const auth_js_1 = require("../middleware/auth.js");
const complianceService_js_1 = require("../services/complianceService.js");
const auditService_js_1 = require("../services/auditService.js");
const router = (0, express_1.Router)();
// GET /api/compliance
router.get('/', auth_js_1.authenticateJWT, async (req, res) => {
    try {
        const { mineId } = req.query;
        const metrics = await (0, complianceService_js_1.getComplianceMetrics)(mineId ? String(mineId) : undefined);
        res.json({ success: true, ...metrics });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to calculate compliance' });
    }
});
// GET /api/compliance/violations
router.get('/violations', auth_js_1.authenticateJWT, async (req, res) => {
    try {
        const { mineId, severity, status, category } = req.query;
        const taskWhere = {
            status: { in: ['OVERDUE', 'ESCALATED'] },
        };
        if (mineId)
            taskWhere.mineId = String(mineId);
        if (severity)
            taskWhere.severity = String(severity).toUpperCase();
        const taskViolations = await prisma_js_1.prisma.task.findMany({
            where: taskWhere,
            include: {
                mine: true,
                section: true,
                assignedTo: true,
                evidence: true,
            },
            orderBy: { slaDeadline: 'asc' },
        });
        const complianceWhere = {
            status: 'OVERDUE',
        };
        if (mineId)
            complianceWhere.mineId = String(mineId);
        const complianceViolations = await prisma_js_1.prisma.complianceRecord.findMany({
            where: complianceWhere,
            include: {
                regulation: true,
                mine: true,
                section: true,
                responsibleOfficer: true,
            },
            orderBy: { dueDate: 'asc' },
        });
        res.json({
            success: true,
            taskViolations,
            complianceViolations,
            totalViolations: taskViolations.length + complianceViolations.length,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch violations' });
    }
});
// PATCH /api/compliance/records/:id
router.patch('/records/:id', auth_js_1.authenticateJWT, async (req, res) => {
    try {
        const recordId = String(req.params.id);
        const { status, notes, evidenceUrl } = req.body;
        const updateData = {};
        if (status)
            updateData.status = status;
        if (notes)
            updateData.notes = notes;
        if (evidenceUrl)
            updateData.evidenceUrl = evidenceUrl;
        if (status === 'COMPLETED') {
            updateData.completedDate = new Date();
            updateData.verifiedById = req.user.id;
        }
        const record = await prisma_js_1.prisma.complianceRecord.update({
            where: { id: recordId },
            data: updateData,
            include: { regulation: true, mine: true },
        });
        await (0, auditService_js_1.logAuditAction)({
            userId: req.user.id,
            userName: req.user.name,
            action: 'COMPLIANCE_RECORD_UPDATED',
            entity: 'ComplianceRecord',
            entityId: record.id,
            newState: { status, notes },
        });
        res.json({ success: true, record });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update compliance record' });
    }
});
exports.default = router;
