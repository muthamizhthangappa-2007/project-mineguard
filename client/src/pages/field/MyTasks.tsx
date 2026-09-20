import React, { useState, useEffect } from 'react';
import { CheckSquare, Play, Camera, CheckCircle2, Clock, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../services/api';
import { SlaCountdown } from '../../components/SlaCountdown';
import { EvidenceTimeline } from '../../components/EvidenceTimeline';
import { CameraCaptureModal } from '../../components/CameraCaptureModal';

export const MyTasks: React.FC = () => {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Evidence upload modal state
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [uploadType, setUploadType] = useState<'PROGRESS' | 'FINAL'>('PROGRESS');
  const [caption, setCaption] = useState('');

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/tasks');
      if (data.success && data.tasks) {
        setTasks(data.tasks);
        if (data.tasks.length > 0 && !selectedTaskId) {
          loadTaskDetail(data.tasks[0].id);
        }
      }
    } catch (e) {
      console.warn('Error loading tasks:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadTaskDetail = async (id: string) => {
    setSelectedTaskId(id);
    try {
      const data = await apiFetch(`/tasks/${id}`);
      if (data.success && data.task) {
        setSelectedTaskDetail(data.task);
      }
    } catch (e) {
      console.warn('Error loading task detail:', e);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleStartTask = async (taskId: string) => {
    try {
      await apiFetch(`/tasks/${taskId}/start`, { method: 'PATCH' });
      await loadTaskDetail(taskId);
      await loadTasks();
    } catch (e) {
      alert('Failed to start task');
    }
  };

  const handleEvidencePhotoCaptured = async (photoUrl: string) => {
    if (!selectedTaskId) return;
    try {
      await apiFetch(`/tasks/${selectedTaskId}/evidence`, {
        method: 'POST',
        body: JSON.stringify({
          evidenceType: uploadType,
          fileUrl: photoUrl,
          caption: caption || `${uploadType} evidence recorded in field`,
          latitude: 23.6338,
          longitude: 85.7032,
        }),
      });
      setEvidenceModalOpen(false);
      setCaption('');
      await loadTaskDetail(selectedTaskId);
      await loadTasks();
    } catch (e) {
      alert('Failed to attach evidence');
    }
  };

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
          onClick={loadTasks}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task List Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl text-slate-100 space-y-4">
          <div className="pb-3 border-b border-slate-800">
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-amber-400" /> Colliery Tasks ({tasks.length})
            </h2>
            <p className="text-xs text-slate-400">Assigned hazard rectifications with active SLA</p>
          </div>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto">
            {tasks.map((t) => (
              <div
                key={t.id}
                onClick={() => loadTaskDetail(t.id)}
                className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                  selectedTaskId === t.id
                    ? 'bg-amber-500/15 border-amber-500 shadow-md'
                    : 'bg-slate-800/60 border-slate-700/70 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono font-bold text-xs text-amber-400">{t.taskNumber}</span>
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded ${
                      t.status === 'CLOSED'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : t.status === 'PENDING_VERIFICATION'
                        ? 'bg-purple-950 text-purple-400 border border-purple-800'
                        : 'bg-slate-800 text-amber-300 border border-slate-700'
                    }`}
                  >
                    {t.status}
                  </span>
                </div>

                <h4 className="font-bold text-xs text-white line-clamp-1">{t.title}</h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Officer: <b>{t.assignedTo?.name || 'Assigned'}</b>
                </p>

                <div className="mt-2 pt-2 border-t border-slate-800/80">
                  <SlaCountdown deadline={t.slaDeadline} status={t.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Task Detail & Timeline Panel */}
        <div className="lg:col-span-2 space-y-6">
          {selectedTaskDetail ? (
            <>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-slate-100 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-bold text-amber-400 text-base">
                        {selectedTaskDetail.taskNumber}
                      </span>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {selectedTaskDetail.category}
                      </span>
                      <span className="text-xs font-black px-2.5 py-0.5 rounded bg-red-950 text-red-400 border border-red-800">
                        {selectedTaskDetail.severity}
                      </span>
                    </div>
                    <h2 className="text-lg font-black text-white">{selectedTaskDetail.title}</h2>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {selectedTaskDetail.description}
                    </p>
                  </div>

                  <SlaCountdown
                    deadline={selectedTaskDetail.slaDeadline}
                    status={selectedTaskDetail.status}
                  />
                </div>

                {/* Meta details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Colliery</span>
                    <span className="font-bold text-white">{selectedTaskDetail.mine?.name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Working Section</span>
                    <span className="font-bold text-white">Section {selectedTaskDetail.section?.code}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Responsible Officer</span>
                    <span className="font-bold text-amber-400">{selectedTaskDetail.assignedTo?.name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Current Status</span>
                    <span className="font-mono font-bold text-emerald-400">{selectedTaskDetail.status}</span>
                  </div>
                </div>

                {/* Worker Action Buttons */}
                <div className="flex flex-wrap gap-2.5 pt-2">
                  {selectedTaskDetail.status === 'ASSIGNED' && (
                    <button
                      onClick={() => handleStartTask(selectedTaskDetail.id)}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow"
                    >
                      <Play className="w-4 h-4 fill-slate-950" /> Start Task (Acknowledge)
                    </button>
                  )}

                  {selectedTaskDetail.status !== 'CLOSED' && (
                    <>
                      <button
                        onClick={() => {
                          setUploadType('PROGRESS');
                          setEvidenceModalOpen(true);
                        }}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs flex items-center gap-1.5"
                      >
                        <Camera className="w-4 h-4 text-blue-400" /> Upload Progress Evidence
                      </button>

                      <button
                        onClick={() => {
                          setUploadType('FINAL');
                          setEvidenceModalOpen(true);
                        }}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Submit Final Evidence
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* 4-Stage Evidence Timeline Component */}
              <EvidenceTimeline
                evidence={selectedTaskDetail.evidence || []}
                taskStatus={selectedTaskDetail.status}
                verificationStatus={selectedTaskDetail.verificationStatus}
                rejectionReason={selectedTaskDetail.rejectionReason}
                canUploadProgress={true}
                canUploadFinal={true}
                onAddEvidenceClick={(type) => {
                  setUploadType(type);
                  setEvidenceModalOpen(true);
                }}
              />
            </>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-sm">
              Select a task from the list to view timeline and upload rectification evidence.
            </div>
          )}
        </div>
      </div>

      {/* Evidence Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={evidenceModalOpen}
        onClose={() => setEvidenceModalOpen(false)}
        onPhotoCaptured={handleEvidencePhotoCaptured}
      />
    </div>
  );
};
