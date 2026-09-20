import { getPendingReports, updateReportSyncStatus, OfflineReport } from './db';
import { apiFetch, uploadFile } from './api';

type SyncListener = (syncing: boolean, pendingCount: number) => void;
const listeners: Set<SyncListener> = new Set();

let isSyncing = false;

export const subscribeToSyncStatus = (listener: SyncListener) => {
  listeners.add(listener);
  // Trigger initial count
  getPendingReports().then((items) => listener(isSyncing, items.length));
  return () => {
    listeners.delete(listener);
  };
};

const notifyListeners = async () => {
  const pending = await getPendingReports();
  listeners.forEach((fn) => fn(isSyncing, pending.length));
};

export const syncOfflineReports = async () => {
  if (isSyncing || !navigator.onLine) {
    return;
  }

  isSyncing = true;
  await notifyListeners();

  try {
    const pendingReports = await getPendingReports();
    console.log(`[SYNC-SERVICE] Found ${pendingReports.length} pending offline reports to synchronize.`);

    for (const report of pendingReports) {
      if (!report.id) continue;

      try {
        let initialPhotoUrl = undefined;
        let audioUrl = undefined;

        // 1. If photo exists as base64 data, upload to backend first
        if (report.photoDataUrl && report.photoDataUrl.startsWith('data:')) {
          try {
            initialPhotoUrl = await uploadFile(report.photoDataUrl);
          } catch (uploadErr) {
            console.error('Failed to upload photo for offline report:', uploadErr);
          }
        }

        // 2. If audio exists as base64 data
        if (report.audioDataUrl && report.audioDataUrl.startsWith('data:')) {
          try {
            audioUrl = await uploadFile(report.audioDataUrl);
          } catch (audioErr) {
            console.error('Failed to upload audio for offline report:', audioErr);
          }
        }

        // 3. Post observation to API with offlineSyncId for deduplication
        await apiFetch('/observations', {
          method: 'POST',
          body: JSON.stringify({
            mineId: report.mineId,
            sectionId: report.sectionId,
            equipmentId: report.equipmentId,
            category: report.category,
            severity: report.severity,
            description: report.description,
            hindiTranscript: report.hindiTranscript,
            englishReport: report.englishReport,
            initialPhotoUrl: initialPhotoUrl || report.photoDataUrl,
            audioUrl: audioUrl || report.audioDataUrl,
            latitude: report.latitude,
            longitude: report.longitude,
            offlineSyncId: report.offlineSyncId,
          }),
        });

        // 4. Mark Synced in IndexedDB
        await updateReportSyncStatus(report.id, 'SYNCED');
        console.log(`[SYNC-SERVICE] Report ${report.offlineSyncId} successfully synced.`);
      } catch (err: any) {
        console.error(`[SYNC-SERVICE] Sync failed for report ${report.offlineSyncId}:`, err);
        await updateReportSyncStatus(report.id, 'ERROR', err.message);
      }
    }
  } catch (error) {
    console.error('[SYNC-SERVICE] Error during background sync:', error);
  } finally {
    isSyncing = false;
    await notifyListeners();
  }
};

// Listen for network connectivity restoration
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[SYNC-SERVICE] Network online event detected. Starting sync...');
    syncOfflineReports();
  });
}
