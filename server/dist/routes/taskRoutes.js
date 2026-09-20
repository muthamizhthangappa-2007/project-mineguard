"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_js_1 = require("../prisma.js");
const auth_js_1 = require("../middleware/auth.js");
const taskService_js_1 = require("../services/taskService.js");
const auditService_js_1 = require("../services/auditService.js");
const router = (0, express_1.Router)();
// GET /api/tasks
router.get('/', auth_js_1.authenticateJWT, async (req, res) => {
    try {
        const { mineId, sectionId, status, severity, assignedToId } = req.query;
        const where = {};
        if (mineId)
            where.mineId = String(mineId);
        if (sectionId)
            where.sectionId = String(sectionId);
        if (status)
            where.status = String(status).toUpperCase();
        if (severity)
            where.severity = String(severity).toUpperCase();
        if (assignedToId)
            where.assignedToId = String(assignedToId);
        if (req.query.myTasks === 'true' && req.user) {
            where.assignedToId = req.user.id;
        }
        else if (req.user?.role === 'MINE_MANAGER' && req.user.mineId && !mineId) {
            where.mineId = req.user.mineId;
        }
        const tasks = await prisma_js_1.prisma.task.findMany({
            where,
            include: {
                mine: { select: { id: true, name: true, code: true } },
                section: { select: { id: true, code: true, name: true } },
                assignedTo: { select: { id: true, name: true, employeeId: true, phone: true } },
                verifiedBy: { select: { id: true, name: true } },
                observation: {
                    select: {
                        id: true,
                        observationNumber: true,
                        initialPhotoUrl: true,
                        hindiTranscript: true,
                        englishReport: true,
                        equipment: { select: { id: true, name: true, equipmentCode: true, qrCode: true } },
                    },
                },
                evidence: {
                    select: { id: true, evidenceType: true, fileUrl: true, timestamp: true },
                },
                escalations: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ success: true, tasks });
    }
    catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch tasks' });
    }
});
// GET /api/tasks/:id
router.get('/:id', auth_js_1.authenticateJWT, async (req, res) => {
    try {
        const taskId = String(req.params.id);
        const task = await prisma_js_1.prisma.task.findUnique({
            where: { id: taskId },
            include: {
                mine: true,
                section: true,
                department: true,
                assignedTo: { select: { id: true, name: true, employeeId: true, phone: true, email: true } },
                verifiedBy: { select: { id: true, name: true, employeeId: true } },
                observation: {
                    include: {
                        reportedBy: { select: { id: true, name: true, employeeId: true } },
                        equipment: true,
                    },
                },
                evidence: {
                    include: {
                        uploadedBy: { select: { id: true, name: true, employeeId: true } },
                    },
                    orderBy: { timestamp: 'asc' },
                },
                escalations: {
                    include: {
                        escalatedTo: { select: { id: true, name: true, phone: true } },
                    },
                    orderBy: { triggeredAt: 'asc' },
                },
            },
        });
        if (!task) {
            res.status(404).json({ success: false, message: 'Task not found' });
            return;
        }
        res.json({ success: true, task });
    }
    catch (error) {
        console.error('Error fetching task details:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch task details' });
    }
});
// PATCH /api/tasks/:id/start
router.patch('/:id/start', auth_js_1.authenticateJWT, async (req, res) => {
    try {
        const taskId = String(req.params.id);
        const task = await prisma_js_1.prisma.task.findUnique({ where: { id: taskId } });
        if (!task) {
            res.status(404).json({ success: false, message: 'Task not found' });
            return;
        }
        const updatedTask = await prisma_js_1.prisma.task.update({
            where: { id: taskId },
            data: {
                status: 'IN_PROGRESS',
                startedAt: new Date(),
            },
        });
        await (0, auditService_js_1.logAuditAction)({
            userId: req.user.id,
            userName: req.user.name,
            action: 'TASK_STARTED',
            entity: 'Task',
            entityId: task.id,
            previousState: { status: task.status },
            newState: { status: 'IN_PROGRESS' },
        });
        res.json({ success: true, task: updatedTask });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Failed to start task' });
    }
});
// POST /api/tasks/:id/evidence
router.post('/:id/evidence', auth_js_1.authenticateJWT, async (req, res) => {
    try {
        const taskId = String(req.params.id);
        const { evidenceType, fileUrl, caption, latitude, longitude } = req.body;
        if (!evidenceType || !fileUrl) {
            res.status(400).json({ success: false, message: 'evidenceType and fileUrl are required' });
            return;
        }
        const evidence = await (0, taskService_js_1.addEvidenceToTask)({
            taskId,
            uploadedById: req.user.id,
            uploaderName: req.user.name,
            evidenceType: evidenceType,
            fileUrl,
            caption,
            latitude: latitude ? parseFloat(latitude) : undefined,
            longitude: longitude ? parseFloat(longitude) : undefined,
        });
        res.status(201).json({ success: true, evidence });
    }
    catch (error) {
        console.error('Error adding evidence:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to attach evidence' });
    }
});
// GET /api/tasks/:id/evidence
router.get('/:id/evidence', auth_js_1.authenticateJWT, async (req, res) => {
    try {
        const taskId = String(req.params.id);
        const evidence = await prisma_js_1.prisma.taskEvidence.findMany({
            where: { taskId },
            include: {
                uploadedBy: { select: { id: true, name: true } },
            },
            orderBy: { timestamp: 'asc' },
        });
        res.json({ success: true, evidence });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch task evidence' });
    }
});
// PATCH /api/tasks/:id/verify (Manager verification)
router.patch('/:id/verify', auth_js_1.authenticateJWT, (0, auth_js_1.requireRole)('MINE_MANAGER', 'ADMIN'), async (req, res) => {
    try {
        const taskId = String(req.params.id);
        const { decision, rejectionReason } = req.body;
        if (!decision || (decision !== 'APPROVE' && decision !== 'REJECT')) {
            res.status(400).json({ success: false, message: 'Decision must be APPROVE or REJECT' });
            return;
        }
        if (decision === 'REJECT' && !rejectionReason) {
            res.status(400).json({ success: false, message: 'Rejection reason is required when rejecting resolution' });
            return;
        }
        const updatedTask = await (0, taskService_js_1.verifyTaskByManager)({
            taskId,
            managerId: req.user.id,
            managerName: req.user.name,
            decision,
            rejectionReason,
        });
        res.json({ success: true, task: updatedTask });
    }
    catch (error) {
        console.error('Manager verification error:', error);
        res.status(500).json({ success: false, message: error.message || 'Verification failed' });
    }
});
// PATCH /api/tasks/:id/assign
router.patch('/:id/assign', auth_js_1.authenticateJWT, (0, auth_js_1.requireRole)('MINE_MANAGER', 'ADMIN'), async (req, res) => {
    try {
        const taskId = String(req.params.id);
        const { assignedToId } = req.body;
        const targetUser = await prisma_js_1.prisma.user.findUnique({ where: { id: String(assignedToId) } });
        if (!targetUser) {
            res.status(404).json({ success: false, message: 'Target officer not found' });
            return;
        }
        const updatedTask = await prisma_js_1.prisma.task.update({
            where: { id: taskId },
            data: {
                assignedToId: String(assignedToId),
                status: 'ASSIGNED',
            },
        });
        res.json({ success: true, task: updatedTask });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to reassign task' });
    }
});
exports.default = router;
