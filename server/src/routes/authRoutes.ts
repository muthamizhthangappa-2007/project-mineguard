import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma.js';
import { authenticateJWT, AuthRequest } from '../middleware/auth.js';
import { logAuditAction } from '../services/auditService.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'mineguard_ai_secure_super_secret_jwt_key_2026';

router.post('/login', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { identifier, password, language } = req.body;

    if (!identifier || !password) {
      res.status(400).json({ success: false, message: 'Employee ID or Email and Password are required' });
      return;
    }

    const cleanIdentifier = identifier.trim().toLowerCase();

    // Check by employeeId or email (case-insensitive)
    const user = await prisma.user.findFirst({
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

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid password. Please check your credentials.' });
      return;
    }

    // Update preferred language if provided
    if (language && language !== user.language) {
      await prisma.user.update({
        where: { id: user.id },
        data: { language },
      });
      user.language = language;
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, employeeId: user.employeeId },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Audit login
    await logAuditAction({
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
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Internal server error during login' });
  }
});

router.get('/me', authenticateJWT, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
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
  } catch (error: any) {
    console.error('Get /me error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve profile' });
  }
});

router.post('/logout', authenticateJWT, async (req: AuthRequest, res: Response): Promise<void> => {
  if (req.user) {
    await logAuditAction({
      userId: req.user.id,
      userName: req.user.name,
      action: 'USER_LOGOUT',
      entity: 'User',
      entityId: req.user.id,
    });
  }
  res.json({ success: true, message: 'Logged out successfully' });
});

export default router;
