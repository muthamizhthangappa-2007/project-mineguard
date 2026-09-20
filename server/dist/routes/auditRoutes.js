"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_js_1 = require("../prisma.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
// GET /api/audit
router.get('/', auth_js_1.authenticateJWT, (0, auth_js_1.requireRole)('ADMIN', 'REGULATOR', 'MINE_MANAGER', 'CORPORATE'), async (req, res) => {
    try {
        const { entity, action, search, limit } = req.query;
        const where = {};
        if (entity)
            where.entity = String(entity);
        if (action)
            where.action = { contains: String(action) };
        if (search) {
            where.OR = [
                { action: { contains: String(search) } },
                { userName: { contains: String(search) } },
                { entityId: { contains: String(search) } },
            ];
        }
        const logs = await prisma_js_1.prisma.auditLog.findMany({
            where,
            orderBy: { timestamp: 'desc' },
            take: limit ? parseInt(String(limit), 10) : 100,
        });
        res.json({ success: true, logs });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch audit logs' });
    }
});
exports.default = router;
