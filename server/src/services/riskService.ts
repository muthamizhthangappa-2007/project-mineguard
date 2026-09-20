import { prisma } from '../prisma.js';
import { logAuditAction } from './auditService.js';

interface RiskBreakdown {
  criticalIssuesCount: number;
  highIssuesCount: number;
  mediumIssuesCount: number;
  lowIssuesCount: number;
  overdueTasksCount: number;
  unresolvedCount: number;
  equipmentCriticalCount: number;
  baseSeverityScore: number;
  overduePenaltyScore: number;
  equipmentPenaltyScore: number;
  totalScore: number;
  level: 'LOW' | 'MODERATE' | 'HIGH';
}

export const calculateRiskScoreForMine = async (mineId: string): Promise<RiskBreakdown> => {
  // Fetch active observations
  const observations = await prisma.observation.findMany({
    where: {
      mineId,
      status: { notIn: ['CLOSED'] },
    },
  });

  // Fetch open tasks and overdue tasks
  const openTasks = await prisma.task.findMany({
    where: {
      mineId,
      status: { notIn: ['CLOSED'] },
    },
  });

  const now = new Date();
  const overdueTasks = openTasks.filter(
    (t) => t.status === 'OVERDUE' || t.status === 'ESCALATED' || (t.slaDeadline && t.slaDeadline < now)
  );

  // Fetch equipment status
  const criticalEquipment = await prisma.equipment.findMany({
    where: {
      mineId,
      status: 'CRITICAL',
    },
  });

  let criticalCount = 0;
  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;

  for (const obs of observations) {
    if (obs.severity === 'CRITICAL') criticalCount++;
    else if (obs.severity === 'HIGH') highCount++;
    else if (obs.severity === 'MEDIUM') mediumCount++;
    else lowCount++;
  }

  // Rule-based deterministic formula:
  // Base severity weight: Critical = 15 pts each, High = 8 pts each, Medium = 3 pts each, Low = 1 pt each
  let severityScore = criticalCount * 15 + highCount * 8 + mediumCount * 3 + lowCount * 1;

  // Overdue task penalty: 12 pts each
  let overduePenalty = overdueTasks.length * 12;

  // Critical equipment penalty: 10 pts each
  let equipmentPenalty = criticalEquipment.length * 10;

  // Raw combined score clamped between 0 and 100
  let rawTotal = severityScore + overduePenalty + equipmentPenalty;
  // If no issues at all, baseline safe risk is 10
  if (rawTotal === 0) {
    rawTotal = 12;
  }
  const totalScore = Math.min(100, Math.max(0, Math.round(rawTotal * 10) / 10));

  let level: 'LOW' | 'MODERATE' | 'HIGH' = 'LOW';
  if (totalScore >= 61) {
    level = 'HIGH';
  } else if (totalScore >= 31) {
    level = 'MODERATE';
  } else {
    level = 'LOW';
  }

  const breakdown: RiskBreakdown = {
    criticalIssuesCount: criticalCount,
    highIssuesCount: highCount,
    mediumIssuesCount: mediumCount,
    lowIssuesCount: lowCount,
    overdueTasksCount: overdueTasks.length,
    unresolvedCount: observations.length,
    equipmentCriticalCount: criticalEquipment.length,
    baseSeverityScore: severityScore,
    overduePenaltyScore: overduePenalty,
    equipmentPenaltyScore: equipmentPenalty,
    totalScore,
    level,
  };

  // Update Mine record
  await prisma.mine.update({
    where: { id: mineId },
    data: { riskScore: totalScore },
  });

  // Store historical RiskScore entry
  await prisma.riskScore.create({
    data: {
      mineId,
      score: totalScore,
      level,
      factorBreakdownJson: JSON.stringify(breakdown),
    },
  });

  await logAuditAction({
    userId: null,
    userName: 'AI-Assisted Risk Engine',
    action: 'RISK_SCORE_RECALCULATED',
    entity: 'Mine',
    entityId: mineId,
    newState: { score: totalScore, level },
    metadata: breakdown,
  });

  return breakdown;
};
