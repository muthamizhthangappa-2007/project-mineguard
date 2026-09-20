"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_js_1 = require("../middleware/auth.js");
const riskService_js_1 = require("../services/riskService.js");
const prisma_js_1 = require("../prisma.js");
const router = (0, express_1.Router)();
// GET /api/risk/mine/:id
router.get('/mine/:id', auth_js_1.authenticateJWT, async (req, res) => {
    try {
        const mineId = String(req.params.id);
        const risk = await (0, riskService_js_1.calculateRiskScoreForMine)(mineId);
        const history = await prisma_js_1.prisma.riskScore.findMany({
            where: { mineId },
            orderBy: { calculatedAt: 'desc' },
            take: 10,
        });
        res.json({ success: true, risk, history });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to calculate risk score' });
    }
});
// POST /api/risk/mine/:id/recalculate
router.post('/mine/:id/recalculate', auth_js_1.authenticateJWT, async (req, res) => {
    try {
        const mineId = String(req.params.id);
        const risk = await (0, riskService_js_1.calculateRiskScoreForMine)(mineId);
        res.json({ success: true, risk });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to recalculate risk' });
    }
});
exports.default = router;
