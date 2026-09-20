import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, Check, RefreshCw } from 'lucide-react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoCaptured: (photoDataUrl: string) => void;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onPhotoCaptured,
}) => {
  const [useCamera, setUseCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);

  // Realistic sample industrial photo presets
  const sampleEvidencePhotos = [
    {
      title: 'Conveyor Belt Guard Damaged',
      url: '/uploads/demo-conveyor-guard.jpg',
    },
    {
      title: 'Pump Seal Leakage (Water Pump #3)',
      url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="%231e293b"/><circle cx="300" cy="200" r="100" fill="%230284c7"/><text x="300" y="200" fill="white" font-size="20" text-anchor="middle">Water Pump #3 Leakage</text></svg>',
    },
    {
      title: 'Electrical Substation Warning',
      url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="%231e293b"/><rect x="150" y="80" width="300" height="240" fill="%23f59e0b"/><text x="300" y="200" fill="%230f172a" font-size="20" font-weight="bold" text-anchor="middle">Panel B-12 Flashover</text></svg>',
    },
  ];

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      setStream(mediaStream);
      setUseCamera(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (e) {
      console.warn('Camera not available or access denied:', e);
      alert('Camera access denied or unavailable. Please browse an image or select a demo photo.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setUseCamera(false);
  };

  const takeSnapshot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedUrl(dataUrl);
      stopCamera();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCapturedUrl(reader.result as string);
      stopCamera();
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedUrl(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl text-slate-100">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base text-white">Capture Photographic Evidence</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Main preview / camera container */}
          <div className="relative border-2 border-dashed border-slate-700 rounded-xl overflow-hidden aspect-video bg-slate-950 flex flex-col items-center justify-center">
            {capturedUrl ? (
              <img src={capturedUrl} alt="Captured evidence" className="w-full h-full object-cover" />
            ) : useCamera ? (
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            ) : (
              <div className="text-center p-4">
                <Camera className="w-10 h-10 text-slate-500 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-medium">Camera or File Upload</p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            {useCamera ? (
              <button
                onClick={takeSnapshot}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow flex items-center justify-center gap-2 transition-all"
              >
                <Camera className="w-4 h-4" /> Click Snapshot
              </button>
            ) : (
              <button
                onClick={startCamera}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Camera className="w-4 h-4 text-amber-400" /> Use Camera
              </button>
            )}

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Upload className="w-4 h-4 text-blue-400" /> Browse Image
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          {/* Preset demo photos */}
          <div>
            <p className="text-xs font-bold text-slate-400 mb-2">Or select high-resolution demo photo:</p>
            <div className="space-y-1.5">
              {sampleEvidencePhotos.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => setCapturedUrl(p.url)}
                  className="w-full p-2 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-left text-xs font-semibold text-slate-200 flex items-center justify-between"
                >
                  <span>{p.title}</span>
                  <span className="text-[10px] text-amber-400">Select</span>
                </button>
              ))}
            </div>
          </div>

          {/* Confirmation */}
          <div className="flex gap-3 pt-2 border-t border-slate-800">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (capturedUrl) {
                  onPhotoCaptured(capturedUrl);
                  onClose();
                }
              }}
              disabled={!capturedUrl}
              className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
            >
              <Check className="w-4 h-4" /> Confirm Photo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
