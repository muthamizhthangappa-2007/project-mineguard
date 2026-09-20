import React, { useState, useEffect } from 'react';
import { FileText, Camera, RefreshCw, CheckCircle2, Clock, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../services/api';
import { getAllOfflineReports, OfflineReport } from '../../services/db';
import { syncOfflineReports } from '../../services/syncService';
import { useAuth } from '../../context/AuthContext';

export const MyReports: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [syncedObservations, setSyncedObservations] = useState<any[]>([]);
  const [offlineReports, setOfflineReports] = useState<OfflineReport[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    setLoading(true);
    try {
      // 1. Load local IndexedDB records
      const local = await getAllOfflineReports();
      setOfflineReports(local);

      // 2. Load synced observations from backend
      if (navigator.onLine) {
        const data = await apiFetch('/observations');
        if (data.success && data.observations) {
          setSyncedObservations(data.observations);
        }
      }
    } catch (e) {
      console.warn('Could not load backend observations:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/field')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Field Hub
        </button>

        <button
          onClick={async () => {
            await syncOfflineReports();
            await loadAll();
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh &amp; Sync
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-slate-100">
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-800">
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-400" /> My Field Hazard Reports
            </h1>
            <p className="text-xs text-slate-400">
              Synchronized colliery observations and pending offline queue
            </p>
          </div>
        </div>

        {/* Offline Reports Queue (IndexedDB) */}
        {offlineReports.filter((r) => r.syncStatus === 'PENDING' || r.syncStatus === 'ERROR').length > 0 && (
          <div className="mb-6 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              Pending Local Offline Queue ({offlineReports.filter((r) => r.syncStatus !== 'SYNCED').length})
            </h3>

            <div className="space-y-2">
              {offlineReports
                .filter((r) => r.syncStatus !== 'SYNCED')
                .map((rep, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-amber-950/30 border border-amber-600/60 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500 text-slate-950 mb-1">
                        🟠 Pending Sync (IndexedDB)
                      </span>
                      <h4 className="font-bold text-sm text-white">{rep.englishReport || rep.description}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Mine: {rep.mineName} • Section: {rep.sectionCode} • Category: {rep.category} • Severity: {rep.severity}
                      </p>
                      {rep.hindiTranscript && (
                        <p className="text-xs text-amber-300 mt-1 italic">&ldquo;{rep.hindiTranscript}&rdquo;</p>
                      )}
                    </div>
                    {rep.photoDataUrl && (
                      <img
                        src={rep.photoDataUrl}
                        alt="Photo"
                        className="w-16 h-12 object-cover rounded border border-slate-700"
                      />
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Synced Database Observations */}
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Synchronized Colliery Observations ({syncedObservations.length})
          </h3>

          {syncedObservations.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">No synchronized reports yet.</p>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {syncedObservations.map((obs) => (
                <div key={obs.id} className="py-4 flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-amber-400">{obs.observationNumber}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {obs.category}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                          obs.severity === 'CRITICAL'
                            ? 'bg-red-950 text-red-400 border border-red-800'
                            : obs.severity === 'HIGH'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : 'bg-blue-950 text-blue-400 border border-blue-800'
                        }`}
                      >
                        {obs.severity}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-white">{obs.englishReport || obs.description}</h4>
                    {obs.hindiTranscript && (
                      <p className="text-xs text-slate-400 italic">&ldquo;{obs.hindiTranscript}&rdquo;</p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
                      <span>Colliery: {obs.mine?.name} ({obs.section?.code})</span>
                      {obs.equipment && <span>Equipment: <b>{obs.equipment.name}</b></span>}
                      {obs.task && (
                        <span className="text-amber-400 font-mono">
                          Auto-Task: {obs.task.taskNumber} ({obs.task.status})
                        </span>
                      )}
                    </div>
                  </div>

                  {obs.initialPhotoUrl && (
                    <img
                      src={obs.initialPhotoUrl}
                      alt="Photo"
                      className="w-20 h-16 object-cover rounded-xl border border-slate-700 shrink-0"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
