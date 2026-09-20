import { prisma } from '../prisma.js';

interface AuditLogParams {
  userId?: string | null;
  userName?: string;
  action: string;
  entity: string;
  entityId: string;
  previousState?: any;
  newState?: any;
  metadata?: any;
}

export const logAuditAction = async (params: AuditLogParams) => {
  try {
    return await prisma.auditLog.create({
      data: {
        userId: params.userId || null,
        userName: params.userName || 'System / Automated Engine',
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        previousStateJson: params.previousState ? JSON.stringify(params.previousState) : null,
        newStateJson: params.newState ? JSON.stringify(params.newState) : null,
        metadataJson: params.metadata ? JSON.stringify(params.metadata) : null,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    return null;
  }
};
