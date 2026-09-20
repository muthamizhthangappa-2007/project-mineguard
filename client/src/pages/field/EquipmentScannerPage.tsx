import React, { useState, useEffect } from 'react';
import { QrCode, Search, Wrench, ShieldAlert, History, CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../services/api';
import { QrScannerModal } from '../../components/QrScannerModal';

export const EquipmentScannerPage: React.FC = () => {
  const navigate = useNavigate();

  const [equipmentList, setEquipmentList] = useState<any[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<any | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchEquipment = async (search?: string) => {
    setLoading(true);
    try {
      const url = search ? `/equipment?search=${encodeURIComponent(search)}` : '/equipment';
      const data = await apiFetch(url);
      if (data.success && data.equipment) {
        setEquipmentList(data.equipment);
        if (data.equipment.length > 0 && !selectedEquipment) {
          loadEquipmentHistory(data.equipment[0].id);
        }
      }
    } catch (e) {
      console.warn('Failed to load equipment:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadEquipmentHistory = async (id: string) => {
    try {
      const data = await apiFetch(`/equipment/${id}/history`);
      if (data.success && data.equipment) {
        setSelectedEquipment(data.equipment);
      }
    } catch (e) {
      console.warn('Failed to load history:', e);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/field')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Field Hub
        </button>

        <button
          onClick={() => setIsQrModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20"
        >
          <QrCode className="w-4 h-4" /> Open Camera QR Scanner
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Equipment List & Search */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl text-slate-100 space-y-4">
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <Wrench className="w-5 h-5 text-amber-400" /> Colliery Equipment Register
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">25+ Seeded Demo Machinery Fleet</p>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                fetchEquipment(e.target.value);
              }}
              placeholder="Search equipment or QR..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="space-y-2 max-h-[550px] overflow-y-auto">
            {equipmentList.map((eq) => (
              <div
                key={eq.id}
                onClick={() => loadEquipmentHistory(eq.id)}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  selectedEquipment?.id === eq.id
                    ? 'bg-amber-500/15 border-amber-500 shadow-md'
                    : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[10px] text-amber-400 font-bold">{eq.equipmentCode}</span>
                  <span
                    className={`text-[9px] font-black px-2 py-0.5 rounded ${
                      eq.status === 'CRITICAL'
                        ? 'bg-red-950 text-red-400 border border-red-800'
                        : eq.status === 'MAINTENANCE'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800'
                        : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    }`}
                  >
                    {eq.status}
                  </span>
                </div>
                <h4 className="font-bold text-xs text-white line-clamp-1">{eq.name}</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Section: {eq.section?.code || 'Main'} • Type: {eq.type}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Equipment Complete History View (Section 11) */}
        <div className="lg:col-span-2">
          {selectedEquipment ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-slate-100 space-y-6">
              {/* Header profile */}
              <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold text-amber-400">
                      QR: {selectedEquipment.qrCode}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-400">
                      ID: {selectedEquipment.equipmentCode}
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-white">{selectedEquipment.name}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Manufacturer: <b>{selectedEquipment.manufacturer}</b> • Model: <b>{selectedEquipment.model}</b>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      navigate('/field/report', { state: { prefilledEquipment: selectedEquipment } })
                    }
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow"
                  >
                    + Report Observation for this Equipment
                  </button>
                </div>
              </div>

              {/* Status & Maintenance Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                  <span className="text-[10px] text-slate-400 block">Operational Status</span>
                  <span className="font-black text-xs text-emerald-400">{selectedEquipment.status}</span>
                </div>
                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                  <span className="text-[10px] text-slate-400 block">Commissioning Date</span>
                  <span className="font-semibold text-xs text-white">{selectedEquipment.installationDate}</span>
                </div>
                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                  <span className="text-[10px] text-slate-400 block">Last Maintenance</span>
                  <span className="font-semibold text-xs text-white">{selectedEquipment.lastMaintenanceDate}</span>
                </div>
                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                  <span className="text-[10px] text-slate-400 block">Last Inspection</span>
                  <span className="font-semibold text-xs text-amber-400">{selectedEquipment.lastInspectionDate}</span>
                </div>
              </div>

              {/* Observations & Task History */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <History className="w-4 h-4 text-amber-400" /> Previous Observations &amp; Task History ({selectedEquipment.observations?.length || 0})
                </h3>

                {selectedEquipment.observations && selectedEquipment.observations.length > 0 ? (
                  <div className="divide-y divide-slate-800/80">
                    {selectedEquipment.observations.map((obs: any) => (
                      <div key={obs.id} className="py-3 flex flex-wrap items-start justify-between gap-2 text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-amber-400 font-bold">{obs.observationNumber}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                              {obs.category}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-950 text-red-400">
                              {obs.severity}
                            </span>
                          </div>
                          <p className="font-semibold text-white">{obs.englishReport || obs.description}</p>
                          <p className="text-[10px] text-slate-400">
                            Reported by: {obs.reportedBy?.name} • Date: {new Date(obs.createdAt).toLocaleDateString()}
                          </p>
                        </div>

                        {obs.task && (
                          <div className="text-right">
                            <span className="font-mono text-xs font-bold text-amber-300 block">
                              Task: {obs.task.taskNumber}
                            </span>
                            <span className="text-[10px] text-emerald-400 font-semibold block">
                              Status: {obs.task.status}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 py-3 text-center">
                    No safety incidents logged for this equipment unit.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-sm">
              Select an equipment record to inspect its full history.
            </div>
          )}
        </div>
      </div>

      <QrScannerModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        onEquipmentSelected={(eq) => {
          setSelectedEquipment(eq);
        }}
      />
    </div>
  );
};
