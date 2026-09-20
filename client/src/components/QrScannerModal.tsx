import React, { useState, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { QrCode, Camera, Check, X, Search } from 'lucide-react';
import { apiFetch } from '../services/api';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEquipmentSelected: (equipment: any) => void;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  isOpen,
  onClose,
  onEquipmentSelected,
}) => {
  const [scannerActive, setScannerActive] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Demo seed equipment quick shortcuts
  const demoEquipmentPresets = [
    { code: 'QR-EQUIP-MB12-CB05', name: 'Conveyor Belt #5', section: 'B-12' },
    { code: 'QR-EQUIP-MB12-WP03', name: 'Water Pump #3', section: 'B-12' },
    { code: 'QR-EQUIP-MB12-EP12', name: 'Electrical Panel B-12', section: 'B-12' },
    { code: 'QR-EQUIP-MA04-DP07', name: 'Dumper #7', section: 'A-04' },
    { code: 'QR-EQUIP-MC09-VF02', name: 'Ventilation Fan #2', section: 'C-09' },
  ];

  const handleLookup = async (code: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch(`/equipment/qr/${encodeURIComponent(code)}`);
      if (data.success && data.equipment) {
        onEquipmentSelected(data.equipment);
        onClose();
      } else {
        setError(`No equipment matching QR code "${code}"`);
      }
    } catch (err: any) {
      setError(err.message || 'Equipment lookup failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let html5QrCode: Html5Qrcode | null = null;

    if (isOpen && scannerActive) {
      const qrRegionId = 'html5qr-code-full-region';
      html5QrCode = new Html5Qrcode(qrRegionId);

      html5QrCode
        .start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            html5QrCode?.stop().catch(() => {});
            handleLookup(decodedText);
          },
          () => {}
        )
        .catch((err) => {
          console.warn('Camera scanning error or permission denied:', err);
          setError('Camera permission denied or camera not found. Please use demo QR shortcuts below.');
          setScannerActive(false);
        });
    }

    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(() => {});
      }
    };
  }, [isOpen, scannerActive]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base text-white">Equipment QR Scanner</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-xs text-red-300">
              {error}
            </div>
          )}

          {/* Camera View Area */}
          <div className="relative border-2 border-dashed border-slate-700 rounded-xl overflow-hidden min-h-[220px] bg-slate-950 flex flex-col items-center justify-center p-4">
            <div id="html5qr-code-full-region" className="w-full max-w-sm" />
            {!scannerActive && (
              <div className="text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-amber-400">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">Scan Colliery QR Tag</p>
                  <p className="text-xs text-slate-400 mt-0.5">Use device camera to scan barcode/QR</p>
                </div>
                <button
                  onClick={() => setScannerActive(true)}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow transition-all inline-flex items-center gap-1.5"
                >
                  <Camera className="w-4 h-4" /> Start Camera Scanner
                </button>
              </div>
            )}
          </div>

          {/* Manual Input Search */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Enter Equipment / QR Code Manually
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="e.g. QR-EQUIP-MB12-CB05 or EQUIP-MB12-CB05"
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
              <button
                onClick={() => handleLookup(manualCode)}
                disabled={!manualCode.trim() || loading}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-600 text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Search className="w-3.5 h-3.5" /> Lookup
              </button>
            </div>
          </div>

          {/* Seed Equipment Quick Selectors (Section 10 demo items) */}
          <div>
            <p className="text-xs font-bold text-slate-400 mb-2">Demo Equipment QR Quick-Scan:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {demoEquipmentPresets.map((eq) => (
                <button
                  key={eq.code}
                  onClick={() => handleLookup(eq.code)}
                  className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-500/50 text-left transition-all group flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">
                      {eq.name}
                    </p>
                    <span className="text-[10px] font-mono text-slate-400">
                      Section {eq.section} • {eq.code}
                    </span>
                  </div>
                  <Check className="w-3.5 h-3.5 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
