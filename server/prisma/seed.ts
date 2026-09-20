import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding MineGuard AI database with realistic demo data...');

  // Clear existing records in reverse dependency order
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.escalation.deleteMany({});
  await prisma.taskEvidence.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.observation.deleteMany({});
  await prisma.complianceRecord.deleteMany({});
  await prisma.riskScore.deleteMany({});
  await prisma.environmentalRecord.deleteMany({});
  await prisma.productionRecord.deleteMany({});
  await prisma.emergencyResource.deleteMany({});
  await prisma.equipment.deleteMany({});
  await prisma.regulation.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.department.deleteMany({});
  await prisma.section.deleteMany({});
  await prisma.mine.deleteMany({});

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Create Mines
  const mine05 = await prisma.mine.create({
    data: {
      code: 'MINE-05',
      name: 'Rajrappa Open Cast Mine #05',
      location: 'Ramgarh, Jharkhand',
      state: 'Jharkhand',
      district: 'Ramgarh',
      subsidiary: 'Central Coalfields Limited (CCL)',
      mineType: 'Opencast / Mechanized',
      operationalStatus: 'Active',
      area: '14.8 sq km',
      commissioningDate: '1982-04-15',
      managerName: 'Er. Rajesh Sharma',
      contactPhone: '+91 94311 02941',
      latitude: 23.6322,
      longitude: 85.7042,
      riskScore: 28.5,
    },
  });

  const mine02 = await prisma.mine.create({
    data: {
      code: 'MINE-02',
      name: 'Jharia Underground Colliery #02',
      location: 'Dhanbad, Jharkhand',
      state: 'Jharkhand',
      district: 'Dhanbad',
      subsidiary: 'Bharat Coking Coal Limited (BCCL)',
      mineType: 'Underground / Continuous Miner',
      operationalStatus: 'Active',
      area: '9.2 sq km',
      commissioningDate: '1976-11-20',
      managerName: 'Er. Sandeep Mukherjee',
      contactPhone: '+91 94311 88321',
      latitude: 23.7428,
      longitude: 86.4165,
      riskScore: 68.0,
    },
  });

  const mine08 = await prisma.mine.create({
    data: {
      code: 'MINE-08',
      name: 'Korba Super Pit #08',
      location: 'Korba, Chhattisgarh',
      state: 'Chhattisgarh',
      district: 'Korba',
      subsidiary: 'South Eastern Coalfields Limited (SECL)',
      mineType: 'Opencast / Highwall',
      operationalStatus: 'Active',
      area: '21.5 sq km',
      commissioningDate: '1995-08-10',
      managerName: 'Er. Alok Ranjan',
      contactPhone: '+91 94790 12560',
      latitude: 22.3595,
      longitude: 82.7501,
      riskScore: 34.0,
    },
  });

  // 2. Create Sections for Mine #05
  const sectionB12 = await prisma.section.create({
    data: {
      code: 'B-12',
      name: 'Section B-12 Overburden & Main Conveyor Line',
      mineId: mine05.id,
      riskLevel: 'MODERATE',
      coordinatesJson: JSON.stringify([
        { lat: 23.6335, lng: 85.7025 },
        { lat: 23.6348, lng: 85.7058 },
        { lat: 23.6315, lng: 85.7062 },
        { lat: 23.6308, lng: 85.7031 },
      ]),
    },
  });

  const sectionA04 = await prisma.section.create({
    data: {
      code: 'A-04',
      name: 'Section A-04 Coal Seam Bench 3',
      mineId: mine05.id,
      riskLevel: 'LOW',
      coordinatesJson: JSON.stringify([
        { lat: 23.6360, lng: 85.7010 },
        { lat: 23.6375, lng: 85.7040 },
        { lat: 23.6350, lng: 85.7050 },
      ]),
    },
  });

  const sectionC09 = await prisma.section.create({
    data: {
      code: 'C-09',
      name: 'Section C-09 Coal Handling & Crushing Yard',
      mineId: mine05.id,
      riskLevel: 'LOW',
    },
  });

  // Sections for Mine 02
  const sectionUG1 = await prisma.section.create({
    data: {
      code: 'UG-1',
      name: 'Seam XIV Incline Drive & Return Airway',
      mineId: mine02.id,
      riskLevel: 'HIGH',
    },
  });

  // 3. Create Departments
  const deptMechanical = await prisma.department.create({
    data: { code: 'MECH', name: 'Mechanical & Machinery Department', mineId: mine05.id },
  });
  const deptElectrical = await prisma.department.create({
    data: { code: 'ELEC', name: 'Electrical Maintenance Department', mineId: mine05.id },
  });
  const deptSafety = await prisma.department.create({
    data: { code: 'SAFETY', name: 'Safety & Strata Control Department', mineId: mine05.id },
  });
  const deptVentilation = await prisma.department.create({
    data: { code: 'VENT', name: 'Ventilation & Environmental Department', mineId: mine05.id },
  });

  // 4. Create Users for all 5 roles
  // FIELD_STAFF
  const fieldStaff1 = await prisma.user.create({
    data: {
      employeeId: 'EMP-FLD-01',
      email: 'field@mineguard.gov.in',
      passwordHash,
      name: 'Ramesh Kumar',
      role: 'FIELD_STAFF',
      phone: '+91 98351 10021',
      mineId: mine05.id,
      sectionId: sectionB12.id,
      departmentId: deptMechanical.id,
      language: 'hi',
    },
  });

  // Responsible Officer / Mechanical Engineer in Section B-12
  const mechOfficer = await prisma.user.create({
    data: {
      employeeId: 'EMP-MECH-01',
      email: 'sunil.mech@mineguard.gov.in',
      passwordHash,
      name: 'Sunil Verma',
      role: 'FIELD_STAFF',
      phone: '+91 94311 55421',
      mineId: mine05.id,
      sectionId: sectionB12.id,
      departmentId: deptMechanical.id,
      language: 'en',
    },
  });

  // Electrical Officer in Section B-12
  const elecOfficer = await prisma.user.create({
    data: {
      employeeId: 'EMP-ELEC-01',
      email: 'amit.elec@mineguard.gov.in',
      passwordHash,
      name: 'Amit Patil',
      role: 'FIELD_STAFF',
      phone: '+91 94311 66890',
      mineId: mine05.id,
      sectionId: sectionB12.id,
      departmentId: deptElectrical.id,
      language: 'en',
    },
  });

  // MINE_MANAGER
  const mineManager = await prisma.user.create({
    data: {
      employeeId: 'EMP-MGR-05',
      email: 'manager@mineguard.gov.in',
      passwordHash,
      name: 'Er. Rajesh Sharma',
      role: 'MINE_MANAGER',
      phone: '+91 94311 02941',
      mineId: mine05.id,
      language: 'en',
    },
  });

  // CORPORATE
  const corporateUser = await prisma.user.create({
    data: {
      employeeId: 'EMP-CORP-01',
      email: 'corporate@mineguard.gov.in',
      passwordHash,
      name: 'Dr. Ananya Sen',
      role: 'CORPORATE',
      phone: '+91 98110 44552',
      language: 'en',
    },
  });

  // REGULATOR
  const regulatorUser = await prisma.user.create({
    data: {
      employeeId: 'EMP-REG-01',
      email: 'regulator@mineguard.gov.in',
      passwordHash,
      name: 'Shri V. K. Verma',
      role: 'REGULATOR',
      phone: '+91 99341 90812',
      language: 'en',
    },
  });

  // ADMIN
  const adminUser = await prisma.user.create({
    data: {
      employeeId: 'EMP-ADM-01',
      email: 'admin@mineguard.gov.in',
      passwordHash,
      name: 'Sanjay Mukherjee',
      role: 'ADMIN',
      phone: '+91 94311 11223',
      language: 'en',
    },
  });

  // 5. Create 25 Equipment records (including Conveyor Belt #5, Water Pump #3, Electrical Panel B-12, Dumper #7, Ventilation Fan #2)
  const equipmentData = [
    {
      equipmentCode: 'EQUIP-MB12-CB05',
      qrCode: 'QR-EQUIP-MB12-CB05',
      name: 'Conveyor Belt #5',
      type: 'Conveyor',
      mineId: mine05.id,
      sectionId: sectionB12.id,
      manufacturer: 'Elecon Engineering Ltd.',
      model: 'EL-TR800 HD Conveyor',
      installationDate: '2021-03-12',
      lastMaintenanceDate: '2026-08-15',
      status: 'NORMAL',
      lastInspectionDate: '2026-09-10',
      latitude: 23.6338,
      longitude: 85.7032,
    },
    {
      equipmentCode: 'EQUIP-MB12-WP03',
      qrCode: 'QR-EQUIP-MB12-WP03',
      name: 'Water Pump #3',
      type: 'Pump',
      mineId: mine05.id,
      sectionId: sectionB12.id,
      manufacturer: 'Kirloskar Brothers',
      model: 'KBL Dewatering High-Lift 150HP',
      installationDate: '2022-06-18',
      lastMaintenanceDate: '2026-08-28',
      status: 'NORMAL',
      lastInspectionDate: '2026-09-14',
      latitude: 23.6329,
      longitude: 85.7041,
    },
    {
      equipmentCode: 'EQUIP-MB12-EP12',
      qrCode: 'QR-EQUIP-MB12-EP12',
      name: 'Electrical Panel B-12',
      type: 'Electrical',
      mineId: mine05.id,
      sectionId: sectionB12.id,
      manufacturer: 'Schneider Electric',
      model: 'Prisma Plus 11kV Substation Unit',
      installationDate: '2020-01-25',
      lastMaintenanceDate: '2026-09-02',
      status: 'NORMAL',
      lastInspectionDate: '2026-09-12',
      latitude: 23.6340,
      longitude: 85.7045,
    },
    {
      equipmentCode: 'EQUIP-MA04-DP07',
      qrCode: 'QR-EQUIP-MA04-DP07',
      name: 'Dumper #7',
      type: 'Dumper',
      mineId: mine05.id,
      sectionId: sectionA04.id,
      manufacturer: 'BEML India',
      model: 'BH100 Mining Dump Truck',
      installationDate: '2019-11-04',
      lastMaintenanceDate: '2026-07-20',
      status: 'MAINTENANCE',
      lastInspectionDate: '2026-09-08',
      latitude: 23.6362,
      longitude: 85.7022,
    },
    {
      equipmentCode: 'EQUIP-MC09-VF02',
      qrCode: 'QR-EQUIP-MC09-VF02',
      name: 'Ventilation Fan #2',
      type: 'Ventilation',
      mineId: mine05.id,
      sectionId: sectionC09.id,
      manufacturer: 'Alstom Power Mines',
      model: 'Axial Flow Main Surface Fan 500kW',
      installationDate: '2018-05-14',
      lastMaintenanceDate: '2026-09-01',
      status: 'NORMAL',
      lastInspectionDate: '2026-09-15',
      latitude: 23.6310,
      longitude: 85.7055,
    },
    {
      equipmentCode: 'EQUIP-MB12-EX01',
      qrCode: 'QR-EQUIP-MB12-EX01',
      name: 'Hydraulic Excavator #1',
      type: 'Machinery',
      mineId: mine05.id,
      sectionId: sectionB12.id,
      manufacturer: 'Komatsu',
      model: 'PC2000-8 Mining Shovel',
      installationDate: '2020-08-10',
      lastMaintenanceDate: '2026-08-22',
      status: 'NORMAL',
      lastInspectionDate: '2026-09-16',
      latitude: 23.6345,
      longitude: 85.7039,
    },
    {
      equipmentCode: 'EQUIP-MA04-DR02',
      qrCode: 'QR-EQUIP-MA04-DR02',
      name: 'Blast Hole Drill Rig #2',
      type: 'Machinery',
      mineId: mine05.id,
      sectionId: sectionA04.id,
      manufacturer: 'Epiroc',
      model: 'Pit Viper 271 Crawler Drill',
      installationDate: '2021-02-14',
      lastMaintenanceDate: '2026-09-05',
      status: 'NORMAL',
      lastInspectionDate: '2026-09-17',
      latitude: 23.6368,
      longitude: 85.7035,
    },
    {
      equipmentCode: 'EQUIP-MC09-CR01',
      qrCode: 'QR-EQUIP-MC09-CR01',
      name: 'Rotary Coal Crusher Unit #1',
      type: 'Machinery',
      mineId: mine05.id,
      sectionId: sectionC09.id,
      manufacturer: 'McNally Bharat',
      model: 'Single Roll Sizer 1200 TPH',
      installationDate: '2017-09-19',
      lastMaintenanceDate: '2026-08-11',
      status: 'NORMAL',
      lastInspectionDate: '2026-09-11',
      latitude: 23.6305,
      longitude: 85.7060,
    },
    {
      equipmentCode: 'EQUIP-MB12-LT04',
      qrCode: 'QR-EQUIP-MB12-LT04',
      name: 'Mobile High-Mast Light Tower #4',
      type: 'Electrical',
      mineId: mine05.id,
      sectionId: sectionB12.id,
      manufacturer: 'Atlas Copco',
      model: 'HiLight V5+ LED',
      installationDate: '2022-10-05',
      lastMaintenanceDate: '2026-09-10',
      status: 'NORMAL',
      lastInspectionDate: '2026-09-18',
      latitude: 23.6325,
      longitude: 85.7030,
    },
    {
      equipmentCode: 'EQUIP-MB12-DS02',
      qrCode: 'QR-EQUIP-MB12-DS02',
      name: 'Dust Suppression Mist Cannon #2',
      type: 'Other',
      mineId: mine05.id,
      sectionId: sectionB12.id,
      manufacturer: 'Fogmaker Systems',
      model: 'DustBoss DB-60 High-Pressure',
      installationDate: '2023-04-12',
      lastMaintenanceDate: '2026-09-04',
      status: 'NORMAL',
      lastInspectionDate: '2026-09-16',
      latitude: 23.6332,
      longitude: 85.7048,
    },
  ];

  // Add more equipment records to reach 20+ items
  for (let i = 11; i <= 24; i++) {
    const isMine2 = i > 18;
    const mineId = isMine2 ? mine02.id : mine05.id;
    const sectionId = isMine2 ? sectionUG1.id : (i % 2 === 0 ? sectionB12.id : sectionA04.id);
    const types = ['Conveyor', 'Pump', 'Electrical', 'Dumper', 'Ventilation', 'Machinery'];
    const type = types[i % types.length];

    equipmentData.push({
      equipmentCode: `EQUIP-GEN-${100 + i}`,
      qrCode: `QR-EQUIP-GEN-${100 + i}`,
      name: `${type} Unit #${i}`,
      type,
      mineId,
      sectionId,
      manufacturer: 'L&T Heavy Engineering',
      model: `Model-HD${i}00`,
      installationDate: `202${i % 4}-0${(i % 8) + 1}-10`,
      lastMaintenanceDate: '2026-08-30',
      status: i === 13 ? 'CRITICAL' : 'NORMAL',
      lastInspectionDate: '2026-09-12',
      latitude: 23.632 + (i * 0.0003),
      longitude: 85.703 + (i * 0.0003),
    });
  }

  for (const eq of equipmentData) {
    await prisma.equipment.create({ data: eq });
  }

  // 6. Seed Verified Official Sample Regulations (Section 28)
  const regulations = [
    {
      regulationCode: 'CMR-2017-R104',
      officialSource: 'Coal Mines Regulations 2017, Regulation 104',
      name: 'Guarding of Moving Machinery & Conveyor Belts',
      category: 'SAFETY',
      department: 'Mechanical',
      frequency: 'WEEKLY',
      defaultSlaHours: 24,
      evidenceRequired: 'Photographic proof of interlocking mesh guards and emergency pull-wire switch testing.',
      description: 'Every fly-wheel, gear, belt and moving part of machinery shall be kept securely fenced by substantial guards.',
      applicability: 'All Opencast and Underground Conveyors and Drives',
      effectiveDate: '2017-11-27',
    },
    {
      regulationCode: 'CMR-2017-R129',
      officialSource: 'Coal Mines Regulations 2017, Regulation 129',
      name: 'Mine Ventilation Standard & Inflammable Gas Monitoring',
      category: 'SAFETY',
      department: 'Ventilation',
      frequency: 'DAILY',
      defaultSlaHours: 6,
      evidenceRequired: 'Calibrated methanometer readout log, anemometer velocity sheet and shift safety endorsement.',
      description: 'Air velocity shall be maintained above 30 m/min at working faces; inflammable gas concentration shall not exceed 0.5%.',
      applicability: 'All Underground Incline Workings and Shaft Drives',
      effectiveDate: '2017-11-27',
    },
    {
      regulationCode: 'CMR-2017-R136',
      officialSource: 'Coal Mines Regulations 2017, Regulation 136',
      name: 'Inspection of Flameproof Electrical Apparatus',
      category: 'EQUIPMENT',
      department: 'Electrical',
      frequency: 'MONTHLY',
      defaultSlaHours: 48,
      evidenceRequired: 'Earth leakage relay trip test sheet, flanged gap measurement log, and thermal imaging report.',
      description: 'Flameproof enclosures and switchgear shall be examined by a competent electrical supervisor once in every 30 days.',
      applicability: 'All Surface Substations and Underground Distribution Switchgear',
      effectiveDate: '2017-11-27',
    },
    {
      regulationCode: 'CMR-2017-R182',
      officialSource: 'Coal Mines Regulations 2017, Regulation 182',
      name: 'Emergency Refuge Chambers & First Aid Readiness',
      category: 'EMERGENCY',
      department: 'Safety & Strata Control',
      frequency: 'MONTHLY',
      defaultSlaHours: 24,
      evidenceRequired: 'Life-support oxygen cylinder pressure log, ration inventory check, and communication battery test.',
      description: 'Refuge chambers shall have adequate breathable air for 48 hours for maximum personnel stationed.',
      applicability: 'Deep Opencast Rest Shelters and Underground Working Panels',
      effectiveDate: '2017-11-27',
    },
    {
      regulationCode: 'CMR-2017-R195',
      officialSource: 'Coal Mines Regulations 2017, Regulation 195',
      name: 'Dust Suppression & Ambient Air Particulate Standards',
      category: 'ENVIRONMENT',
      department: 'Environment & Dust Control',
      frequency: 'WEEKLY',
      defaultSlaHours: 48,
      evidenceRequired: 'Water sprinkler nozzle operational status photo, continuous ambient PM10/PM2.5 sensor log.',
      description: 'Water sprays and mist cannons must operate continuously along coal haul roads and transfer points.',
      applicability: 'Haul Roads, Coal Transfer Hoppers, and Stockyards',
      effectiveDate: '2017-11-27',
    },
  ];

  for (const reg of regulations) {
    const createdReg = await prisma.regulation.create({ data: reg });

    // Create realistic Compliance Records for Mine #05
    await prisma.complianceRecord.create({
      data: {
        regulationId: createdReg.id,
        mineId: mine05.id,
        sectionId: sectionB12.id,
        responsibleOfficerId: mechOfficer.id,
        status: reg.regulationCode === 'CMR-2017-R104' ? 'DUE_SOON' : 'COMPLETED',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        notes: 'Mandatory statutory audit record verified by safety inspector.',
      },
    });

    // Also for Mine #02 (with one overdue to simulate realistic compliance variance)
    await prisma.complianceRecord.create({
      data: {
        regulationId: createdReg.id,
        mineId: mine02.id,
        sectionId: sectionUG1.id,
        responsibleOfficerId: fieldStaff1.id,
        status: reg.regulationCode === 'CMR-2017-R129' ? 'OVERDUE' : 'PENDING',
        dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        notes: 'Inspection scheduled following ventilation audit.',
      },
    });
  }

  // 7. Seed Initial Observation, Task, and Evidence for Conveyor Belt #5
  const conveyorEq = await prisma.equipment.findFirst({ where: { qrCode: 'QR-EQUIP-MB12-CB05' } });

  const initialObs = await prisma.observation.create({
    data: {
      observationNumber: 'OBS-2026-0101',
      mineId: mine05.id,
      sectionId: sectionB12.id,
      equipmentId: conveyorEq?.id,
      reportedById: fieldStaff1.id,
      category: 'MACHINERY',
      severity: 'HIGH',
      description: 'Conveyor belt return roller vibrating excessively with damaged side skirt rubber.',
      hindiTranscript: 'कन्वेयर बेल्ट का साइड स्कर्ट रबर खराब हो गया है।',
      englishReport: 'The side skirt rubber of the conveyor belt is damaged.',
      latitude: 23.6338,
      longitude: 85.7032,
      status: 'TASK_CREATED',
      initialPhotoUrl: '/uploads/demo-conveyor-guard.jpg',
    },
  });

  const demoTask = await prisma.task.create({
    data: {
      taskNumber: 'MG-1001',
      observationId: initialObs.id,
      mineId: mine05.id,
      sectionId: sectionB12.id,
      departmentId: deptMechanical.id,
      assignedToId: mechOfficer.id,
      title: 'Repair Conveyor Belt #5 Side Guard & Skirting',
      description: 'Inspect roller vibration and replace damaged skirting on Conveyor Belt #5.',
      category: 'MACHINERY',
      severity: 'HIGH',
      status: 'IN_PROGRESS',
      slaHours: 24,
      slaDeadline: new Date(Date.now() + 18 * 60 * 60 * 1000), // 18 hours remaining
      startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
  });

  // Add Initial Evidence
  await prisma.taskEvidence.create({
    data: {
      taskId: demoTask.id,
      uploadedById: fieldStaff1.id,
      evidenceType: 'INITIAL',
      fileUrl: '/uploads/demo-conveyor-guard.jpg',
      caption: 'Initial observation photo taken during morning patrol.',
      latitude: 23.6338,
      longitude: 85.7032,
    },
  });

  // 8. Seed Environmental Records for Mine #05
  await prisma.environmentalRecord.create({
    data: {
      mineId: mine05.id,
      sectionId: sectionB12.id,
      aqi: 118,
      pm25: 42.5,
      pm10: 84.0,
      noiseDb: 76.5,
      methanePpm: 0.02,
      coPpm: 1.4,
      waterDischargePh: 7.2,
      status: 'NORMAL',
    },
  });

  // 9. Seed Production Records
  await prisma.productionRecord.create({
    data: {
      mineId: mine05.id,
      date: new Date().toISOString().split('T')[0],
      targetTonnes: 12500,
      actualTonnes: 11980,
      shift: 'Shift A & B',
      remarks: 'Normal extraction across Section B-12 and A-04.',
    },
  });

  // 10. Seed Emergency Resources
  await prisma.emergencyResource.create({
    data: {
      mineId: mine05.id,
      resourceType: 'AMBULANCE',
      name: 'Advanced Life Support (ALS) Mine Ambulance #1',
      location: 'Section B-12 Dispatch Station',
      contactPerson: 'Dr. S. K. Roy (Chief Medical Officer)',
      contactPhone: '+91 94311 77200',
      status: 'READY',
      lastChecked: '2026-09-18',
    },
  });

  await prisma.emergencyResource.create({
    data: {
      mineId: mine05.id,
      resourceType: 'RESCUE_TEAM',
      name: 'Mines Rescue Sub-Station Station Unit 4',
      location: 'Central Surface Yard',
      contactPerson: 'Capt. R. P. Singh (Rescue Superintendent)',
      contactPhone: '+91 94311 77310',
      status: 'READY',
      lastChecked: '2026-09-17',
    },
  });

  // 11. Initial Audit Logs
  await prisma.auditLog.create({
    data: {
      userId: adminUser.id,
      userName: adminUser.name,
      action: 'SYSTEM_INITIALIZATION',
      entity: 'System',
      entityId: 'SYSTEM-ROOT',
      metadataJson: JSON.stringify({ message: 'MineGuard AI seeded with standard industrial demo data.' }),
    },
  });

  console.log('MineGuard AI database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
