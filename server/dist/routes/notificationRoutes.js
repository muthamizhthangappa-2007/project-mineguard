"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_js_1 = require("../prisma.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
// GET /api/notifications
router.get('/', auth_js_1.authenticateJWT, async (req, res) => {
    try {
        const notifications = await prisma_js_1.prisma.notification.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
        const unreadCount = notifications.filter((n) => !n.isRead).length;
        res.json({ success: true, notifications, unreadCount });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
    }
});
// PATCH /api/notifications/:id/read
router.patch('/:id/read', auth_js_1.authenticateJWT, async (req, res) => {
    try {
        const id = String(req.params.id);
        const notification = await prisma_js_1.prisma.notification.update({
            where: { id },
            data: { isRead: true },
        });
        res.json({ success: true, notification });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update notification' });
    }
});
// PATCH /api/notifications/read-all
router.patch('/read-all', auth_js_1.authenticateJWT, async (req, res) => {
    try {
        await prisma_js_1.prisma.notification.updateMany({
            where: { userId: req.user.id, isRead: false },
            data: { isRead: true },
        });
        res.json({ success: true, message: 'All notifications marked as read' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to mark notifications read' });
    }
});
exports.default = router;
