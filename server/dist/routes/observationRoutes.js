"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_js_1 = require("../prisma.js");
const auth_js_1 = require("../middleware/auth.js");
const taskService_js_1 = require("../services/taskService.js");
const auditService_js_1 = require("../services/auditService.js");
const router = (0, express_1.Router)();
router.post('/', auth_js_1.authenticateJWT, async (req, res) => {
    try {
        const { mineId, sectionId, equipmentId, category, severity, description, hindiTranscript, englishReport, initialPhotoUrl, audioUrl, latitude, longitude, offlineSyncId, } = req.body;
        if (!mineId || !sectionId || !category || !severity || (!description && !englishReport)) {
            res.status(400).json({ success: false, message: 'Missing required observation fields.' });
            return;
        }
        // Deduplication check for offline sync (Section 9)
        if (offlineSyncId) {
            const existing = await prisma_js_1.prisma.observation.findUnique({
                where: { offlineSyncId: String(offlineSyncId) },
                include: { task: true },
            });
            if (existing) {
                res.status(200).json({
                    success: true,
                    message: 'Observation already synchronized',
                    observation: existing,
                    task: existing.task,
                    deduplicated: true,
                });
                return;
            }
        }
        const obsCount = await prisma_js_1.prisma.observation.count();
        const observationNumber = `OBS-${new Date().getFullYear()}-${1000 + obsCount + 1}`;
        const effectiveDescription = englishReport || description;
        // 1. Create Observation record
        const observation = await prisma_js_1.prisma.observation.create({
            data: {
                observationNumber,
                mineId: String(mineId),
                sectionId: String(sectionId),
                equipmentId: equipmentId ? String(equipmentId) : null,
                reportedById: req.user.id,
                category: String(category).toUpperCase(),
                severity: String(severity).toUpperCase(),
                description: effectiveDescription,
                hindiTranscript: hindiTranscript ? String(hindiTranscript) : null,
                englishReport: englishReport ? String(englishReport) : null,
                initialPhotoUrl: initialPhotoUrl ? String(initialPhotoUrl) : null,
                audioUrl: audioUrl ? String(audioUrl) : null,
                latitude: latitude ? parseFloat(String(latitude)) : null,
                longitude: longitude ? parseFloat(String(longitude)) : null,
                offlineSyncId: offlineSyncId ? String(offlineSyncId) : null,
            },
            include: {
                mine: true,
                section: true,
                equipment: true,
                reportedBy: { select: { id: true, name: true, employeeId: true } },
            },
        });
        // 2. Automatically trigger task creation and dynamic responsible officer assignment
        const taskTitle = `${category} Observation: ${effectiveDescription.slice(0, 50)}${effectiveDescription.length > 50 ? '...' : ''}`;
        const task = await (0, taskService_js_1.createTaskForObservation)({
            observationId: observation.id,
            mineId: String(mineId),
            sectionId: String(sectionId),
            category: observation.category,
            severity: observation.severity,
            title: taskTitle,
            description: effectiveDescription,
            creatorUser: req.user,
        });
        // 3. If initial photo was taken, record as INITIAL task evidence
        if (initialPhotoUrl) {
            await (0, taskService_js_1.addEvidenceToTask)({
                taskId: task.id,
                uploadedById: req.user.id,
                uploaderName: req.user.name,
                evidenceType: 'INITIAL',
                fileUrl: String(initialPhotoUrl),
                caption: 'Initial Hazard Observation Photo captured by Field Inspector',
                latitude: observation.latitude || undefined,
                longitude: observation.longitude || undefined,
            });
        }
        // 4. Audit trail
        await (0, auditService_js_1.logAuditAction)({
            userId: req.user.id,
            userName: req.user.name,
            action: 'OBSERVATION_CREATED',
            entity: 'Observation',
            entityId: observation.id,
            newState: {
                observationNumber: observation.observationNumber,
                category: observation.category,
                severity: observation.severity,
                assignedTaskNumber: task.taskNumber,
            },
            metadata: {
                offlineSyncId,
                hasAudio: !!audioUrl,
                hasPhoto: !!initialPhotoUrl,
                hindiTranscript: !!hindiTranscript,
            },
        });
        res.status(201).json({
            success: true,
            observation,
            task,
        });
    }
    catch (error) {
        console.error('Error creating observation:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to submit observation' });
    }
});
router.get('/', auth_js_1.authenticateJWT, async (req, res) => {
    try {
        const { mineId, sectionId, severity, category, status } = req.query;
        const where = {};
        if (mineId)
            where.mineId = String(mineId);
        if (sectionId)
            where.sectionId = String(sectionId);
        if (severity)
            where.severity = String(severity).toUpperCase();
        if (category)
            where.category = String(category).toUpperCase();
        if (status)
            where.status = String(status).toUpperCase();
        // If role is FIELD_STAFF and not asking for another mine, filter or allow user's mine
        if (req.user?.role === 'FIELD_STAFF' && req.user.mineId && !mineId) {
            where.mineId = req.user.mineId;
        }
        const observations = await prisma_js_1.prisma.observation.findMany({
            where,
            include: {
                mine: { select: { id: true, name: true, code: true } },
                section: { select: { id: true, code: true, name: true } },
                equipment: { select: { id: true, name: true, equipmentCode: true } },
                reportedBy: { select: { id: true, name: true, employeeId: true } },
                task: {
                    select: {
                        id: true,
                        taskNumber: true,
                        status: true,
                        severity: true,
                        slaDeadline: true,
                        assignedTo: { select: { id: true, name: true, phone: true } },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ success: true, observations });
    }
    catch (error) {
        console.error('Error fetching observations:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch observations' });
    }
});
router.get('/:id', auth_js_1.authenticateJWT, async (req, res) => {
    try {
        const observation = await prisma_js_1.prisma.observation.findUnique({
            where: { id: String(req.params.id) },
            include: {
                mine: true,
                section: true,
                equipment: true,
                reportedBy: { select: { id: true, name: true, employeeId: true, phone: true } },
                task: {
                    include: {
                        assignedTo: { select: { id: true, name: true, employeeId: true, phone: true } },
                        evidence: { include: { uploadedBy: { select: { id: true, name: true } } } },
                        escalations: true,
                    },
                },
            },
        });
        if (!observation) {
            res.status(404).json({ success: false, message: 'Observation not found' });
            return;
        }
        res.json({ success: true, observation });
    }
    catch (error) {
        console.error('Error fetching observation:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch observation details' });
    }
});
exports.default = router;
