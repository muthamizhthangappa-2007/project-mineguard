"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_js_1 = require("../prisma.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
router.get('/', auth_js_1.authenticateJWT, async (req, res) => {
    try {
        const { mineId } = req.query;
        const where = {};
        if (mineId)
            where.mineId = String(mineId);
        const sections = await prisma_js_1.prisma.section.findMany({
            where,
            include: {
                _count: {
                    select: {
                        equipment: true,
                        observations: true,
                        tasks: true,
                    },
                },
            },
            orderBy: { code: 'asc' },
        });
        res.json({ success: true, sections });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch sections' });
    }
});
exports.default = router;
