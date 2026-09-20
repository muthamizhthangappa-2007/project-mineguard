import { Router, Response } from 'express';
import { prisma } from '../prisma.js';
import { authenticateJWT, AuthRequest, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/audit
router.get(
  '/',
  authenticateJWT,
  requireRole('ADMIN', 'REGULATOR', 'MINE_MANAGER', 'CORPORATE'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { entity, action, search, limit } = req.query;
      const where: any = {};

      if (entity) where.entity = String(entity);
      if (action) where.action = { contains: String(action) };
      if (search) {
        where.OR = [
          { action: { contains: String(search) } },
          { userName: { contains: String(search) } },
          { entityId: { contains: String(search) } },
        ];
      }

      const logs = await prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: limit ? parseInt(String(limit), 10) : 100,
      });

      res.json({ success: true, logs });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch audit logs' });
    }
  }
);

export default router;
