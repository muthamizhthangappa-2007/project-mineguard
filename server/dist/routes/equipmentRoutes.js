"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_js_1 = require("../prisma.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
// GET /api/equipment
router.get('/', auth_js_1.authenticateJWT, async (req, res) => {
    try {
        const { mineId, sectionId, type, status, search } = req.query;
        const where = {};
        if (mineId)
            where.mineId = String(mineId);
        if (sectionId)
            where.sectionId = String(sectionId);
        if (type)
            where.type = String(type);
        if (status)
            where.status = String(status).toUpperCase();
        if (search) {
            where.OR = [
                { name: { contains: String(search) } },
                { equipmentCode: { contains: String(search) } },
                { qrCode: { contains: String(search) } },
            ];
        }
        const equipment = await prisma_js_1.prisma.equipment.findMany({
            where,
            include: {
                mine: { select: { id: true, name: true, code: true } },
                section: { select: { id: true, code: true, name: true } },
            },
            orderBy: { name: 'asc' },
        });
        res.json({ success: true, equipment });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch equipment' });
    }
});
// GET /api/equipment/qr/:code
// Auto-look up scanned QR code or Equipment Code with complete history
router.get('/qr/:code', auth_js_1.authenticateJWT, async (req, res) => {
    try {
        const rawCode = String(req.params.code).trim();
        const equipment = await prisma_js_1.prisma.equipment.findFirst({
            where: {
                OR: [
                    { qrCode: rawCode },
                    { equipmentCode: rawCode },
                    { qrCode: `QR-${rawCode}` },
                    { equipmentCode: rawCode.replace(/^QR-/, '') },
                ],
            },
            include: {
                mine: true,
                section: true,
                observations: {
                    include: {
                        reportedBy: { select: { id: true, name: true } },
                        task: {
                            include: {
                                assignedTo: { select: { id: true, name: true } },
                                evidence: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!equipment) {
            res.status(404).json({ success: false, message: `Equipment not found for QR code: ${rawCode}` });
            return;
        }
        // Separate open and closed tasks
        const openTasks = [];
        const closedTasks = [];
        const allEvidence = [];
        for (const obs of equipment.observations) {
            if (obs.task) {
                if (obs.task.status === 'CLOSED') {
                    closedTasks.push(obs.task);
                }
                else {
                    openTasks.push(obs.task);
                }
                if (obs.task.evidence) {
                    allEvidence.push(...obs.task.evidence);
                }
            }
        }
        res.json({
            success: true,
            equipment: {
                ...equipment,
                openTasks,
                closedTasks,
                allEvidence,
                riskScore: equipment.status === 'CRITICAL' ? 85 : equipment.status === 'MAINTENANCE' ? 45 : 15,
            },
        });
    }
    catch (error) {
        console.error('Error finding equipment by QR:', error);
        res.status(500).json({ success: false, message: 'Failed to lookup equipment QR' });
    }
});
// GET /api/equipment/:id/history
router.get('/:id/history', auth_js_1.authenticateJWT, async (req, res) => {
    try {
        const targetId = String(req.params.id);
        const equipment = await prisma_js_1.prisma.equipment.findUnique({
            where: { id: targetId },
            include: {
                mine: true,
                section: true,
                observations: {
                    include: {
                        reportedBy: { select: { id: true, name: true } },
                        task: {
                            include: {
                                assignedTo: { select: { id: true, name: true } },
                                evidence: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!equipment) {
            res.status(404).json({ success: false, message: 'Equipment not found' });
            return;
        }
        res.json({ success: true, equipment });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch equipment history' });
    }
});
exports.default = router;
