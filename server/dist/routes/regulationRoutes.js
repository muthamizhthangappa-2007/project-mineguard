"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_js_1 = require("../prisma.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
// GET /api/regulations
router.get('/', auth_js_1.authenticateJWT, async (req, res) => {
    try {
        const { category, department, search } = req.query;
        const where = {};
        if (category)
            where.category = String(category).toUpperCase();
        if (department)
            where.department = { contains: String(department) };
        if (search) {
            where.OR = [
                { name: { contains: String(search) } },
                { regulationCode: { contains: String(search) } },
                { officialSource: { contains: String(search) } },
            ];
        }
        const regulations = await prisma_js_1.prisma.regulation.findMany({
            where,
            orderBy: { regulationCode: 'asc' },
        });
        res.json({ success: true, regulations, total: regulations.length });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch regulations' });
    }
});
// POST /api/regulations (Admin only)
router.post('/', auth_js_1.authenticateJWT, (0, auth_js_1.requireRole)('ADMIN'), async (req, res) => {
    try {
        const { regulationCode, officialSource, name, category, department, frequency, defaultSlaHours, evidenceRequired, description, applicability, effectiveDate, } = req.body;
        const regulation = await prisma_js_1.prisma.regulation.create({
            data: {
                regulationCode,
                officialSource,
                name,
                category: category.toUpperCase(),
                department,
                frequency: frequency.toUpperCase(),
                defaultSlaHours: parseInt(defaultSlaHours, 10) || 24,
                evidenceRequired,
                description,
                applicability,
                effectiveDate,
            },
        });
        res.status(201).json({ success: true, regulation });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Failed to create regulation' });
    }
});
exports.default = router;
