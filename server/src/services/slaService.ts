import { prisma } from '../prisma.js';
import { createNotification } from './notificationService.js';
import { logAuditAction } from './auditService.js';

export const getSlaHoursForSeverity = (severity: string): number => {
  switch (severity.toUpperCase()) {
    case 'CRITICAL':
      return 6;
    case 'HIGH':
      return 24;
    case 'MEDIUM':
      return 48;
    case 'LOW':
    default:
      return 72;
  }
};

export const calculateSlaDeadline = (severity: string, fromDate: Date = new Date()): { slaHours: number; deadline: Date } => {
  const slaHours = getSlaHoursForSeverity(severity);
  const deadline = new Date(fromDate.getTime() + slaHours * 60 * 60 * 1000);
  return { slaHours, deadline };
};

export const checkAndEscalateOverdueTasks = async () => {
  const now = new Date();

  try {
    // Find open tasks that have passed their SLA deadline
    const overdueTasks = await prisma.task.findMany({
      where: {
        status: { in: ['ASSIGNED', 'ACKNOWLEDGED', 'IN_PROGRESS', 'REOPENED'] },
        slaDeadline: { lt: now },
      },
      include: {
        mine: true,
        section: true,
        assignedTo: true,
        escalations: true,
      },
    });

    for (const task of overdueTasks) {
      const escalationCount = task.escalations.length;
      let nextLevel = escalationCount + 1;
      let escalateToUser = null;
      let escalationReason = '';

      if (nextLevel === 1) {
        // Level 1: Escalate to Department Head or Mine Safety Officer
        escalateToUser = await prisma.user.findFirst({
          where: {
            mineId: task.mineId,
            role: 'MINE_MANAGER',
            isActive: true,
          },
        });
        escalationReason = `SLA Exceeded (${task.slaHours}h expired). Auto-escalated to Department Authority / Mine Manager.`;
      } else if (nextLevel >= 2) {
        // Level 2/3: Escalate to Corporate Management
        escalateToUser = await prisma.user.findFirst({
          where: {
            role: 'CORPORATE',
            isActive: true,
          },
        });
        escalationReason = `Critical unresolved delay. Auto-escalated to Corporate Safety Directorate.`;
      }

      if (!escalateToUser) {
        escalateToUser = task.assignedTo;
      }

      // Update task status to OVERDUE or ESCALATED
      const newStatus = nextLevel >= 2 ? 'ESCALATED' : 'OVERDUE';
      await prisma.task.update({
        where: { id: task.id },
        data: { status: newStatus },
      });

      // Create Escalation entry
      await prisma.escalation.create({
        data: {
          taskId: task.id,
          level: nextLevel,
          escalatedToId: escalateToUser.id,
          previousAssigneeId: task.assignedToId,
          reason: escalationReason,
        },
      });

      // Dispatch Notification & SMS to escalated user
      await createNotification({
        userId: escalateToUser.id,
        type: 'SLA_OVERDUE',
        title: `⚠️ SLA VIOLATION: Task ${task.taskNumber} Overdue (${task.severity})`,
        message: `Task ${task.taskNumber} at Mine: ${task.mine.name}, Section: ${task.section.code} has breached SLA. Assigned to: ${task.assignedTo.name}. Immediate intervention required.`,
        taskId: task.id,
        sendSmsAlert: true,
        smsRecipientPhone: escalateToUser.phone,
        smsRecipientName: escalateToUser.name,
      });

      // Audit trail entry
      await logAuditAction({
        userId: null,
        userName: 'SLA Background Monitor',
        action: 'TASK_SLA_BREACH_ESCALATED',
        entity: 'Task',
        entityId: task.id,
        previousState: { status: task.status },
        newState: { status: newStatus, escalationLevel: nextLevel },
        metadata: {
          taskNumber: task.taskNumber,
          slaDeadline: task.slaDeadline,
          escalatedTo: escalateToUser.name,
          reason: escalationReason,
        },
      });

      console.log(`[SLA-ENGINE] Task ${task.taskNumber} escalated to Level ${nextLevel} (${escalateToUser.name})`);
    }
  } catch (error) {
    console.error('[SLA-ENGINE] Error checking overdue tasks:', error);
  }
};

let slaInterval: NodeJS.Timeout | null = null;

export const startSlaBackgroundWorker = () => {
  if (slaInterval) return;
  console.log('[SLA-ENGINE] Background SLA and Escalation worker started.');
  // Check every 60 seconds
  slaInterval = setInterval(checkAndEscalateOverdueTasks, 60000);
  // Initial check
  checkAndEscalateOverdueTasks();
};
