import { Router, Response } from 'express';
import { prisma } from '../prisma.js';
import { authenticateJWT, AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticateJWT, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { mineId } = req.query;
    const where: any = {};
    if (mineId) where.mineId = String(mineId);

    const sections = await prisma.section.findMany({
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
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch sections' });
  }
});

export default router;
