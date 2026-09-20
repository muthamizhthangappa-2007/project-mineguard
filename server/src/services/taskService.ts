import { prisma } from '../prisma.js';
import { determineResponsibleOfficer } from './officerRoutingService.js';
import { calculateSlaDeadline } from './slaService.js';
import { createNotification } from './notificationService.js';
import { logAuditAction } from './auditService.js';
import { calculateRiskScoreForMine } from './riskService.js';

interface CreateTaskFromObservationParams {
  observationId: string;
  mineId: string;
  sectionId: string;
  category: string;
  severity: string;
  title: string;
  description: string;
  creatorUser?: any;
}

export const createTaskForObservation = async (params: CreateTaskFromObservationParams) => {
  // 1. Determine responsible officer dynamically
  const { officer, departmentId } = await determineResponsibleOfficer({
    mineId: params.mineId,
    sectionId: params.sectionId,
    category: params.category,
  });

  // 2. Calculate SLA hours and deadline
  const { slaHours, deadline } = calculateSlaDeadline(params.severity);

  // 3. Generate sequential task number (e.g. MG-1045)
  const taskCount = await prisma.task.count();
  const taskNumber = `MG-${1000 + taskCount + 1}`;

  // 4. Create Task in database
  const task = await prisma.task.create({
    data: {
      taskNumber,
      observationId: params.observationId,
      mineId: params.mineId,
      sectionId: params.sectionId,
      departmentId: departmentId || officer.departmentId || '',
      assignedToId: officer.id,
      title: params.title,
      description: params.description,
      category: params.category,
      severity: params.severity,
      status: 'ASSIGNED',
      slaHours,
      slaDeadline: deadline,
    },
    include: {
      mine: true,
      section: true,
      assignedTo: true,
      observation: true,
    },
  });

  // 5. Update Observation status
  await prisma.observation.update({
    where: { id: params.observationId },
    data: { status: 'TASK_CREATED' },
  });

  // 6. Send dynamic SMS and in-app Notification to the assigned officer
  const isCriticalOrHigh = params.severity === 'CRITICAL' || params.severity === 'HIGH';
  const smsMessage = `MineGuard AI\n${params.severity} SAFETY OBSERVATION\nMine: ${task.mine.name}\nSection: ${task.section.code}\nIssue: ${params.title}\nTask ID: ${task.taskNumber}\nImmediate action required.`;

  await createNotification({
    userId: officer.id,
    type: isCriticalOrHigh ? 'CRITICAL_OBSERVATION' : 'NEW_TASK',
    title: `New Task Assigned: ${task.taskNumber} (${params.severity})`,
    message: smsMessage,
    taskId: task.id,
    observationId: params.observationId,
    sendSmsAlert: true,
    smsRecipientPhone: officer.phone,
    smsRecipientName: officer.name,
  });

  // 7. Audit Log
  await logAuditAction({
    userId: params.creatorUser?.id,
    userName: params.creatorUser?.name || 'Automated Task Engine',
    action: 'TASK_AUTO_CREATED_AND_ASSIGNED',
    entity: 'Task',
    entityId: task.id,
    newState: {
      taskNumber: task.taskNumber,
      assignedTo: officer.name,
      severity: params.severity,
      slaDeadline: deadline,
    },
    metadata: {
      observationId: params.observationId,
      mineName: task.mine.name,
      sectionCode: task.section.code,
    },
  });

  // 8. Recalculate Mine Risk Score
  await calculateRiskScoreForMine(params.mineId);

  return task;
};

export const addEvidenceToTask = async (params: {
  taskId: string;
  uploadedById: string;
  uploaderName: string;
  evidenceType: 'INITIAL' | 'PROGRESS' | 'FINAL' | 'VERIFICATION';
  fileUrl: string;
  caption?: string;
  latitude?: number;
  longitude?: number;
}) => {
  const evidence = await prisma.taskEvidence.create({
    data: {
      taskId: params.taskId,
      uploadedById: params.uploadedById,
      evidenceType: params.evidenceType,
      fileUrl: params.fileUrl,
      caption: params.caption,
      latitude: params.latitude,
      longitude: params.longitude,
    },
  });

  // If this is FINAL evidence, transition task to PENDING_VERIFICATION
  const task = await prisma.task.findUnique({
    where: { id: params.taskId },
    include: { mine: true, assignedTo: true },
  });

  if (task) {
    let updateData: any = {};
    if (params.evidenceType === 'FINAL') {
      updateData.status = 'PENDING_VERIFICATION';
      updateData.verificationStatus = 'PENDING';
      updateData.resolvedAt = new Date();
    } else if (params.evidenceType === 'PROGRESS') {
      if (task.status === 'ASSIGNED' || task.status === 'ACKNOWLEDGED') {
        updateData.status = 'IN_PROGRESS';
        updateData.startedAt = task.startedAt || new Date();
      }
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.task.update({
        where: { id: params.taskId },
        data: updateData,
      });
    }

    // Notify Mine Manager if final evidence is submitted
    if (params.evidenceType === 'FINAL') {
      const manager = await prisma.user.findFirst({
        where: { mineId: task.mineId, role: 'MINE_MANAGER' },
      });
      if (manager) {
        await createNotification({
          userId: manager.id,
          type: 'EVIDENCE_UPLOADED',
          title: `Resolution Evidence Submitted: ${task.taskNumber}`,
          message: `Final evidence submitted for task ${task.taskNumber} by ${params.uploaderName}. Ready for Manager Verification.`,
          taskId: task.id,
          sendSmsAlert: true,
          smsRecipientPhone: manager.phone,
          smsRecipientName: manager.name,
        });
      }
    }

    await logAuditAction({
      userId: params.uploadedById,
      userName: params.uploaderName,
      action: `EVIDENCE_UPLOADED_${params.evidenceType}`,
      entity: 'TaskEvidence',
      entityId: evidence.id,
      metadata: {
        taskId: params.taskId,
        evidenceType: params.evidenceType,
        caption: params.caption,
      },
    });
  }

  return evidence;
};

export const verifyTaskByManager = async (params: {
  taskId: string;
  managerId: string;
  managerName: string;
  decision: 'APPROVE' | 'REJECT';
  rejectionReason?: string;
}) => {
  const task = await prisma.task.findUnique({
    where: { id: params.taskId },
    include: { assignedTo: true, mine: true },
  });

  if (!task) {
    throw new Error('Task not found');
  }

  const isApproved = params.decision === 'APPROVE';
  const newStatus = isApproved ? 'CLOSED' : 'REOPENED';
  const verificationStatus = isApproved ? 'APPROVED' : 'REJECTED';

  const updatedTask = await prisma.task.update({
    where: { id: params.taskId },
    data: {
      status: newStatus,
      verificationStatus,
      verifiedById: params.managerId,
      verifiedAt: new Date(),
      closedAt: isApproved ? new Date() : null,
      rejectionReason: isApproved ? null : params.rejectionReason,
    },
    include: {
      mine: true,
      section: true,
      assignedTo: true,
      evidence: true,
    },
  });

  // Also close observation if approved
  if (isApproved) {
    await prisma.observation.update({
      where: { id: task.observationId },
      data: { status: 'CLOSED' },
    });
  }

  // Notify responsible officer of result
  await createNotification({
    userId: task.assignedToId,
    type: isApproved ? 'TASK_APPROVED' : 'TASK_REJECTED',
    title: isApproved
      ? `Task Approved & Closed: ${task.taskNumber}`
      : `Task Rejected: ${task.taskNumber}`,
    message: isApproved
      ? `Manager ${params.managerName} approved task ${task.taskNumber}. Status: Closed.`
      : `Manager ${params.managerName} rejected task resolution. Reason: ${params.rejectionReason}. Task Reopened.`,
    taskId: task.id,
    sendSmsAlert: true,
    smsRecipientPhone: task.assignedTo.phone,
    smsRecipientName: task.assignedTo.name,
  });

  // Audit Log
  await logAuditAction({
    userId: params.managerId,
    userName: params.managerName,
    action: isApproved ? 'TASK_VERIFICATION_APPROVED' : 'TASK_VERIFICATION_REJECTED',
    entity: 'Task',
    entityId: task.id,
    previousState: { status: task.status, verificationStatus: task.verificationStatus },
    newState: { status: newStatus, verificationStatus },
    metadata: {
      rejectionReason: params.rejectionReason,
      taskNumber: task.taskNumber,
    },
  });

  // Recalculate Mine Risk Score
  await calculateRiskScoreForMine(task.mineId);

  return updatedTask;
};
