import React, { useState } from 'react';
import { Camera, CheckCircle2, Clock, AlertTriangle, Eye, ShieldCheck, XCircle } from 'lucide-react';

interface EvidenceItem {
  id: string;
  evidenceType: 'INITIAL' | 'PROGRESS' | 'FINAL' | 'VERIFICATION';
  fileUrl: string;
  caption?: string;
  timestamp: string | Date;
  latitude?: number;
  longitude?: number;
  uploadedBy?: { name: string; employeeId?: string };
}

interface EvidenceTimelineProps {
  evidence: EvidenceItem[];
  taskStatus: string;
  verificationStatus?: string | null;
  rejectionReason?: string | null;
  onAddEvidenceClick?: (type: 'PROGRESS' | 'FINAL') => void;
  canUploadProgress?: boolean;
  canUploadFinal?: boolean;
}

export const EvidenceTimeline: React.FC<EvidenceTimelineProps> = ({
  evidence,
  taskStatus,
  verificationStatus,
  rejectionReason,
  onAddEvidenceClick,
  canUploadProgress = false,
  canUploadFinal = false,
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const initialEv = evidence.filter((e) => e.evidenceType === 'INITIAL');
  const progressEv = evidence.filter((e) => e.evidenceType === 'PROGRESS');
  const finalEv = evidence.filter((e) => e.evidenceType === 'FINAL');

  const steps = [
    {
      type: 'INITIAL',
      label: 'Initial Evidence',
      description: 'Problem discovered in field',
      items: initialEv,
      isComplete: initialEv.length > 0,
    },
    {
      type: 'PROGRESS',
      label: 'Progress Evidence',
      description: 'Rectification work underway',
      items: progressEv,
      isComplete: progressEv.length > 0,
      canAdd: canUploadProgress && taskStatus !== 'CLOSED',
    },
    {
      type: 'FINAL',
      label: 'Final Evidence',
      description: 'Problem resolved by engineer',
      items: finalEv,
      isComplete: finalEv.length > 0,
      canAdd: canUploadFinal && taskStatus !== 'CLOSED',
    },
    {
      type: 'VERIFICATION',
      label: 'Manager Verification',
      description:
        verificationStatus === 'APPROVED'
          ? 'Approved & Closed by Mine Manager'
          : verificationStatus === 'REJECTED'
          ? `Rejected: ${rejectionReason || 'Requires rework'}`
          : 'Pending review by Mine Manager',
      items: [],
      isComplete: verificationStatus === 'APPROVED',
      isRejected: verificationStatus === 'REJECTED',
    },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-xl">
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Camera className="w-5 h-5 text-amber-400" /> 4-Stage Evidence Timeline
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Initial Observation → Progress → Final Resolution → Manager Verification
          </p>
        </div>
      </div>

      {/* Stepper Visualization */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
        {steps.map((step, idx) => {
          let stepBg = 'bg-slate-800/60 border-slate-700';
          let iconColor = 'text-slate-500';

          if (step.isComplete) {
            stepBg = 'bg-emerald-950/40 border-emerald-700/60';
            iconColor = 'text-emerald-400';
          } else if ((step as any).isRejected) {
            stepBg = 'bg-rose-950/40 border-rose-700/60';
            iconColor = 'text-rose-400';
          } else if (idx === 0 || steps[idx - 1]?.isComplete) {
            stepBg = 'bg-amber-950/30 border-amber-600/60';
            iconColor = 'text-amber-400';
          }

          return (
            <div key={step.type} className={`rounded-xl border p-4 flex flex-col justify-between ${stepBg}`}>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Stage {idx + 1}
                  </span>
                  {step.isComplete ? (
                    <CheckCircle2 className={`w-5 h-5 ${iconColor}`} />
                  ) : (step as any).isRejected ? (
                    <XCircle className={`w-5 h-5 ${iconColor}`} />
                  ) : (
                    <Clock className="w-5 h-5 text-slate-500" />
                  )}
                </div>

                <h4 className="font-bold text-sm text-white">{step.label}</h4>
                <p className="text-[11px] text-slate-300 mt-1 leading-snug">{step.description}</p>
              </div>

              {/* Photo previews */}
              <div className="mt-3 space-y-2">
                {step.items.map((item) => (
                  <div
                    key={item.id}
                    className="relative group rounded-lg overflow-hidden border border-slate-700 aspect-video bg-slate-950 cursor-pointer"
                    onClick={() => setSelectedPhoto(item.fileUrl)}
                  >
                    <img
                      src={item.fileUrl}
                      alt={item.caption || step.label}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1">
                      <Eye className="w-4 h-4" /> View Full
                    </div>
                    {item.uploadedBy && (
                      <span className="absolute bottom-1 left-1 text-[9px] bg-slate-900/80 px-1.5 py-0.5 rounded text-slate-300 backdrop-blur-sm">
                        {item.uploadedBy.name}
                      </span>
                    )}
                  </div>
                ))}

                {/* Upload action button */}
                {step.canAdd && onAddEvidenceClick && (
                  <button
                    onClick={() => onAddEvidenceClick(step.type as 'PROGRESS' | 'FINAL')}
                    className="w-full py-2 px-3 mt-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 shadow transition-all"
                  >
                    <Camera className="w-3.5 h-3.5" /> Upload {step.label}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Lightbox / Full Photo Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="max-w-3xl max-h-[90vh] relative" onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedPhoto}
              alt="Evidence Full View"
              className="max-h-[85vh] w-auto max-w-full rounded-xl border border-slate-700 shadow-2xl object-contain mx-auto"
            />
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-slate-900/80 text-white hover:bg-slate-800"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
