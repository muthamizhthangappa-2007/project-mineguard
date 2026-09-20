import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma.js';
import { authenticateJWT, AuthRequest, requireRole } from '../middleware/auth.js';
import { logAuditAction } from '../services/auditService.js';

const router = Router();

// GET /api/users
router.get('/', authenticateJWT, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { mineId, role } = req.query;
    const where: any = {};
    if (mineId) where.mineId = String(mineId);
    if (role) where.role = String(role).toUpperCase();

    const users = await prisma.user.findMany({
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
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

// POST /api/users (Admin only)
router.post(
  '/',
  authenticateJWT,
  requireRole('ADMIN'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { employeeId, email, password, name, role, phone, mineId, sectionId, departmentId, language } = req.body;

      if (!employeeId || !email || !password || !name || !role) {
        res.status(400).json({ success: false, message: 'Missing required user fields' });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
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

      await logAuditAction({
        userId: req.user!.id,
        userName: req.user!.name,
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
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to create user' });
    }
  }
);

// PATCH /api/users/:id/toggle-status
router.patch(
  '/:id/toggle-status',
  authenticateJWT,
  requireRole('ADMIN'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const targetId = String(req.params.id);
      const user = await prisma.user.findUnique({ where: { id: targetId } });
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      const updated = await prisma.user.update({
        where: { id: targetId },
        data: { isActive: !user.isActive },
      });

      await logAuditAction({
        userId: req.user!.id,
        userName: req.user!.name,
        action: 'USER_STATUS_TOGGLED',
        entity: 'User',
        entityId: user.id,
        newState: { isActive: updated.isActive },
      });

      res.json({ success: true, isActive: updated.isActive });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to toggle user status' });
    }
  }
);

export default router;
