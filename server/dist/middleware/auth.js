"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.authenticateJWT = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_js_1 = require("../prisma.js");
const JWT_SECRET = process.env.JWT_SECRET || 'mineguard_ai_secure_super_secret_jwt_key_2026';
const authenticateJWT = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ success: false, message: 'Authorization token missing or invalid' });
        return;
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const user = await prisma_js_1.prisma.user.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                employeeId: true,
                email: true,
                name: true,
                role: true,
                mineId: true,
                sectionId: true,
                departmentId: true,
                phone: true,
                language: true,
                isActive: true,
            },
        });
        if (!user || !user.isActive) {
            res.status(401).json({ success: false, message: 'User not found or account is deactivated' });
            return;
        }
        req.user = user;
        next();
    }
    catch (err) {
        res.status(401).json({ success: false, message: 'Invalid or expired authentication token' });
    }
};
exports.authenticateJWT = authenticateJWT;
const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                message: `Forbidden: role '${req.user.role}' does not have permission for this resource.`,
            });
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
