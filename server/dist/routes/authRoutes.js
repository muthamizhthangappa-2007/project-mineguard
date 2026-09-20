"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_js_1 = require("../prisma.js");
const auth_js_1 = require("../middleware/auth.js");
const auditService_js_1 = require("../services/auditService.js");
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || 'mineguard_ai_secure_super_secret_jwt_key_2026';
router.post('/login', async (req, res) => {
    try {
        const { identifier, password, language } = req.body;
        if (!identifier || !password) {
            res.status(400).json({ success: false, message: 'Employee ID or Email and Password are required' });
            return;
        }
        const cleanIdentifier = identifier.trim().toLowerCase();
        // Check by employeeId or email (case-insensitive)
        const user = await prisma_js_1.prisma.user.findFirst({
            where: {
                OR: [
                    { employeeId: { equals: identifier.trim() } },
                    { email: { equals: cleanIdentifier } },
                ],
            },
            include: {
                mine: true,
                section: true,
                department: true,
            },
        });
        if (!user) {
            res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
            return;
        }
        if (!user.isActive) {
            res.status(403).json({ success: false, message: 'Your account has been deactivated. Contact Administrator.' });
            return;
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isMatch) {
            res.status(401).json({ success: false, message: 'Invalid password. Please check your credentials.' });
            return;
        }
        // Update preferred language if provided
        if (language && language !== user.language) {
            await prisma_js_1.prisma.user.update({
                where: { id: user.id },
                data: { language },
            });
            user.language = language;
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role, employeeId: user.employeeId }, JWT_SECRET, { expiresIn: '7d' });
        // Audit login
        await (0, auditService_js_1.logAuditAction)({
            userId: user.id,
            userName: user.name,
            action: 'USER_LOGIN',
            entity: 'User',
            entityId: user.id,
            metadata: { role: user.role, ip: req.ip, language: user.language },
        });
        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                employeeId: user.employeeId,
                email: user.email,
                name: user.name,
                role: user.role, // Determined strictly by backend
                phone: user.phone,
                language: user.language,
                mineId: user.mineId,
                sectionId: user.sectionId,
                departmentId: user.departmentId,
                mine: user.mine,
                section: user.section,
                department: user.department,
            },
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Internal server error during login' });
    }
});
router.get('/me', auth_js_1.authenticateJWT, async (req, res) => {
    try {
        const user = await prisma_js_1.prisma.user.findUnique({
            where: { id: req.user?.id },
            include: {
                mine: true,
                section: true,
                department: true,
            },
        });
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }
        res.json({
            success: true,
            user: {
                id: user.id,
                employeeId: user.employeeId,
                email: user.email,
                name: user.name,
                role: user.role,
                phone: user.phone,
                language: user.language,
                mineId: user.mineId,
                sectionId: user.sectionId,
                departmentId: user.departmentId,
                mine: user.mine,
                section: user.section,
                department: user.department,
            },
        });
    }
    catch (error) {
        console.error('Get /me error:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve profile' });
    }
});
router.post('/logout', auth_js_1.authenticateJWT, async (req, res) => {
    if (req.user) {
        await (0, auditService_js_1.logAuditAction)({
            userId: req.user.id,
            userName: req.user.name,
            action: 'USER_LOGOUT',
            entity: 'User',
            entityId: req.user.id,
        });
    }
    res.json({ success: true, message: 'Logged out successfully' });
});
exports.default = router;
