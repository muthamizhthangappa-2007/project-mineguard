import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface OfflineReport {
  id?: number;
  offlineSyncId: string;
  mineId: string;
  mineName: string;
  sectionId: string;
  sectionCode: string;
  equipmentId?: string;
  equipmentName?: string;
  category: string;
  severity: string;
  description: string;
  hindiTranscript?: string;
  englishReport?: string;
  photoDataUrl?: string; // Base64 data
  audioDataUrl?: string; // Base64 data
  latitude?: number;
  longitude?: number;
  timestamp: string;
  userId: string;
  userName: string;
  syncStatus: 'PENDING' | 'SYNCED' | 'ERROR';
  syncError?: string;
  retries: number;
}

interface MineGuardDB extends DBSchema {
  offlineReports: {
    key: number;
    value: OfflineReport;
    indexes: {
      'by-sync-status': string;
      'by-sync-id': string;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<MineGuardDB>> | null = null;

export const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<MineGuardDB>('mineguard-offline-db', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('offlineReports')) {
          const store = db.createObjectStore('offlineReports', {
            keyPath: 'id',
            autoIncrement: true,
          });
          store.createIndex('by-sync-status', 'syncStatus');
          store.createIndex('by-sync-id', 'offlineSyncId', { unique: true });
        }
      },
    });
  }
  return dbPromise;
};

export const saveOfflineReport = async (report: Omit<OfflineReport, 'id'>): Promise<number> => {
  const db = await getDB();
  return await db.add('offlineReports', report as OfflineReport);
};

export const getPendingReports = async (): Promise<OfflineReport[]> => {
  const db = await getDB();
  const allReports = await db.getAll('offlineReports');
  return allReports.filter((r) => r.syncStatus === 'PENDING' || r.syncStatus === 'ERROR');
};

export const getAllOfflineReports = async (): Promise<OfflineReport[]> => {
  const db = await getDB();
  return await db.getAll('offlineReports');
};

export const updateReportSyncStatus = async (
  id: number,
  status: 'PENDING' | 'SYNCED' | 'ERROR',
  errorMsg?: string
) => {
  const db = await getDB();
  const report = await db.get('offlineReports', id);
  if (report) {
    report.syncStatus = status;
    if (errorMsg) {
      report.syncError = errorMsg;
      report.retries = (report.retries || 0) + 1;
    }
    await db.put('offlineReports', report);
  }
};

export const deleteOfflineReport = async (id: number) => {
  const db = await getDB();
  await db.delete('offlineReports', id);
};
