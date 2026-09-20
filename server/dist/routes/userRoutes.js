"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_js_1 = require("../prisma.js");
const auth_js_1 = require("../middleware/auth.js");
const auditService_js_1 = require("../services/auditService.js");
const router = (0, express_1.Router)();
// GET /api/users
router.get('/', auth_js_1.authenticateJWT, async (req, res) => {
    try {
        const { mineId, role } = req.query;
        const where = {};
        if (mineId)
            where.mineId = String(mineId);
        if (role)
            where.role = String(role).toUpperCase();
        const users = await prisma_js_1.prisma.user.findMany({
            where,
            select: {
                id: true,
                employeeId: true,
                email: true,
                name: true,
                role: true,
                phone: true,
                language: true,
                mineId: true,
                sectionId: true,
                departmentId: true,
                isActive: true,
                createdAt: true,
                mine: { select: { id: true, name: true, code: true } },
                section: { select: { id: true, code: true, name: true } },
                department: { select: { id: true, name: true, code: true } },
            },
            orderBy: { name: 'asc' },
        });
        res.json({ success: true, users });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch users' });
    }
});
// POST /api/users (Admin only)
router.post('/', auth_js_1.authenticateJWT, (0, auth_js_1.requireRole)('ADMIN'), async (req, res) => {
    try {
        const { employeeId, email, password, name, role, phone, mineId, sectionId, departmentId, language } = req.body;
        if (!employeeId || !email || !password || !name || !role) {
            res.status(400).json({ success: false, message: 'Missing required user fields' });
            return;
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        const user = await prisma_js_1.prisma.user.create({
            data: {
                employeeId: employeeId.trim(),
                email: email.trim().toLowerCase(),
                passwordHash,
                name,
                role: role.toUpperCase(),
                phone: phone || '+91 90000 00000',
                mineId: mineId ? String(mineId) : null,
                sectionId: sectionId ? String(sectionId) : null,
                departmentId: departmentId ? String(departmentId) : null,
                language: language || 'en',
            },
        });
        await (0, auditService_js_1.logAuditAction)({
            userId: req.user.id,
            userName: req.user.name,
            action: 'ADMIN_USER_CREATED',
            entity: 'User',
            entityId: user.id,
            newState: { employeeId: user.employeeId, role: user.role, name: user.name },
        });
        res.status(201).json({
            success: true,
            user: {
                id: user.id,
                employeeId: user.employeeId,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Failed to create user' });
    }
});
// PATCH /api/users/:id/toggle-status
router.patch('/:id/toggle-status', auth_js_1.authenticateJWT, (0, auth_js_1.requireRole)('ADMIN'), async (req, res) => {
    try {
        const targetId = String(req.params.id);
        const user = await prisma_js_1.prisma.user.findUnique({ where: { id: targetId } });
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }
        const updated = await prisma_js_1.prisma.user.update({
            where: { id: targetId },
            data: { isActive: !user.isActive },
        });
        await (0, auditService_js_1.logAuditAction)({
            userId: req.user.id,
            userName: req.user.name,
            action: 'USER_STATUS_TOGGLED',
            entity: 'User',
            entityId: user.id,
            newState: { isActive: updated.isActive },
        });
        res.json({ success: true, isActive: updated.isActive });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to toggle user status' });
    }
});
exports.default = router;
