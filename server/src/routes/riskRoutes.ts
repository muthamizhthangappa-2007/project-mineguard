import { Router, Response } from 'express';
import { authenticateJWT, AuthRequest } from '../middleware/auth.js';
import { calculateRiskScoreForMine } from '../services/riskService.js';
import { prisma } from '../prisma.js';

const router = Router();

// GET /api/risk/mine/:id
router.get('/mine/:id', authenticateJWT, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const mineId = String(req.params.id);
    const risk = await calculateRiskScoreForMine(mineId);
    const history = await prisma.riskScore.findMany({
      where: { mineId },
      orderBy: { calculatedAt: 'desc' },
      take: 10,
    });

    res.json({ success: true, risk, history });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to calculate risk score' });
  }
});

// POST /api/risk/mine/:id/recalculate
router.post('/mine/:id/recalculate', authenticateJWT, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const mineId = String(req.params.id);
    const risk = await calculateRiskScoreForMine(mineId);
    res.json({ success: true, risk });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to recalculate risk' });
  }
});

export default router;
