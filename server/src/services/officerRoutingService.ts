import { prisma } from '../prisma.js';

interface RoutingCriteria {
  mineId: string;
  sectionId: string;
  category: string; // ELECTRICAL, MACHINERY, ROOF, VENTILATION, FIRE, PPE, ENVIRONMENT, OTHER
}

export const determineResponsibleOfficer = async (criteria: RoutingCriteria) => {
  // 1. Map issue category to department keyword
  const categoryDepartmentMap: Record<string, string> = {
    ELECTRICAL: 'Electrical',
    MACHINERY: 'Mechanical',
    ROOF: 'Safety & Strata Control',
    VENTILATION: 'Ventilation',
    FIRE: 'Safety & Strata Control',
    PPE: 'Safety & Strata Control',
    ENVIRONMENT: 'Environment & Dust Control',
    OTHER: 'General Maintenance',
  };

  const targetDeptName = categoryDepartmentMap[criteria.category.toUpperCase()] || 'General Maintenance';

  // 2. Find or match the department in this mine
  let department = await prisma.department.findFirst({
    where: {
      mineId: criteria.mineId,
      name: { contains: targetDeptName },
    },
  });

  if (!department) {
    // Fallback to any department in the mine or create/pick first
    department = await prisma.department.findFirst({
      where: { mineId: criteria.mineId },
    });
  }

  // 3. Find officer assigned to this mine + section + department
  let officer = null;

  if (department) {
    officer = await prisma.user.findFirst({
      where: {
        mineId: criteria.mineId,
        departmentId: department.id,
        sectionId: criteria.sectionId,
        role: { in: ['FIELD_STAFF', 'MINE_MANAGER'] },
        isActive: true,
      },
    });

    if (!officer) {
      // Find officer in this department across this mine
      officer = await prisma.user.findFirst({
        where: {
          mineId: criteria.mineId,
          departmentId: department.id,
          role: { in: ['FIELD_STAFF', 'MINE_MANAGER'] },
          isActive: true,
        },
      });
    }
  }

  // 4. Fallback to any active officer or the mine manager for this mine
  if (!officer) {
    officer = await prisma.user.findFirst({
      where: {
        mineId: criteria.mineId,
        role: 'MINE_MANAGER',
        isActive: true,
      },
    });
  }

  // 5. Ultimate fallback if no manager is tied to this mine
  if (!officer) {
    officer = await prisma.user.findFirst({
      where: {
        role: { in: ['MINE_MANAGER', 'ADMIN'] },
        isActive: true,
      },
    });
  }

  if (!officer) {
    throw new Error('No responsible officer could be assigned for this mine.');
  }

  return {
    officer,
    departmentId: department?.id || officer.departmentId,
  };
};
