import { Router, Response } from 'express';
import { prisma } from '../prisma.js';
import { authenticateJWT, AuthRequest } from '../middleware/auth.js';
import { getComplianceMetrics } from '../services/complianceService.js';
import { logAuditAction } from '../services/auditService.js';

const router = Router();

// GET /api/compliance
router.get('/', authenticateJWT, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { mineId } = req.query;
    const metrics = await getComplianceMetrics(mineId ? String(mineId) : undefined);
    res.json({ success: true, ...metrics });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to calculate compliance' });
  }
});

// GET /api/compliance/violations
router.get('/violations', authenticateJWT, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { mineId, severity, status, category } = req.query;

    const taskWhere: any = {
      status: { in: ['OVERDUE', 'ESCALATED'] },
    };
    if (mineId) taskWhere.mineId = String(mineId);
    if (severity) taskWhere.severity = String(severity).toUpperCase();

    const taskViolations = await prisma.task.findMany({
      where: taskWhere,
      include: {
        mine: true,
        section: true,
        assignedTo: true,
        evidence: true,
      },
      orderBy: { slaDeadline: 'asc' },
    });

    const complianceWhere: any = {
      status: 'OVERDUE',
    };
    if (mineId) complianceWhere.mineId = String(mineId);

    const complianceViolations = await prisma.complianceRecord.findMany({
      where: complianceWhere,
      include: {
        regulation: true,
        mine: true,
        section: true,
        responsibleOfficer: true,
      },
      orderBy: { dueDate: 'asc' },
    });

    res.json({
      success: true,
      taskViolations,
      complianceViolations,
      totalViolations: taskViolations.length + complianceViolations.length,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch violations' });
  }
});

// PATCH /api/compliance/records/:id
router.patch('/records/:id', authenticateJWT, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const recordId = String(req.params.id);
    const { status, notes, evidenceUrl } = req.body;
    const updateData: any = {};
    if (status) updateData.status = status;
    if (notes) updateData.notes = notes;
    if (evidenceUrl) updateData.evidenceUrl = evidenceUrl;
    if (status === 'COMPLETED') {
      updateData.completedDate = new Date();
      updateData.verifiedById = req.user!.id;
    }

    const record = await prisma.complianceRecord.update({
      where: { id: recordId },
      data: updateData,
      include: { regulation: true, mine: true },
    });

    await logAuditAction({
      userId: req.user!.id,
      userName: req.user!.name,
      action: 'COMPLIANCE_RECORD_UPDATED',
      entity: 'ComplianceRecord',
      entityId: record.id,
      newState: { status, notes },
    });

    res.json({ success: true, record });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update compliance record' });
  }
});

export default router;
