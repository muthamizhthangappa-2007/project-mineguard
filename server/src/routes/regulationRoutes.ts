import { Router, Response } from 'express';
import { prisma } from '../prisma.js';
import { authenticateJWT, AuthRequest, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/regulations
router.get('/', authenticateJWT, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { category, department, search } = req.query;
    const where: any = {};

    if (category) where.category = String(category).toUpperCase();
    if (department) where.department = { contains: String(department) };
    if (search) {
      where.OR = [
        { name: { contains: String(search) } },
        { regulationCode: { contains: String(search) } },
        { officialSource: { contains: String(search) } },
      ];
    }

    const regulations = await prisma.regulation.findMany({
      where,
      orderBy: { regulationCode: 'asc' },
    });

    res.json({ success: true, regulations, total: regulations.length });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch regulations' });
  }
});

// POST /api/regulations (Admin only)
router.post(
  '/',
  authenticateJWT,
  requireRole('ADMIN'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const {
        regulationCode,
        officialSource,
        name,
        category,
        department,
        frequency,
        defaultSlaHours,
        evidenceRequired,
        description,
        applicability,
        effectiveDate,
      } = req.body;

      const regulation = await prisma.regulation.create({
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
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to create regulation' });
    }
  }
);

export default router;
