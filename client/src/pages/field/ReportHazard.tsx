import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ShieldAlert,
  Camera,
  Mic,
  QrCode,
  MapPin,
  Check,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Wifi,
  WifiOff,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { apiFetch, uploadFile } from '../../services/api';
import { saveOfflineReport } from '../../services/db';
import { syncOfflineReports } from '../../services/syncService';
import { QrScannerModal } from '../../components/QrScannerModal';
import { HindiSpeechModal } from '../../components/HindiSpeechModal';
import { CameraCaptureModal } from '../../components/CameraCaptureModal';

export const ReportHazard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // 10 Steps wizard state (Step 1 to 10)
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form Fields
  const [mines, setMines] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [selectedMineId, setSelectedMineId] = useState<string>(user?.mineId || '');
  const [selectedSectionId, setSelectedSectionId] = useState<string>(user?.sectionId || '');
  const [equipment, setEquipment] = useState<any | null>(null);

  const [initialPhotoUrl, setInitialPhotoUrl] = useState<string>('');
  const [hindiTranscript, setHindiTranscript] = useState<string>('');
  const [englishReport, setEnglishReport] = useState<string>('');
  const [category, setCategory] = useState<string>('MACHINERY');
  const [severity, setSeverity] = useState<string>('HIGH');

  const [latitude, setLatitude] = useState<number | null>(23.6338);
  const [longitude, setLongitude] = useState<number | null>(85.7032);
  const [gpsLoading, setGpsLoading] = useState(false);

  // Modals
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  // Pre-fill if routed from Hub with state
  useEffect(() => {
    if (location.state?.prefilledEquipment) {
      setEquipment(location.state.prefilledEquipment);
      if (location.state.prefilledEquipment.mineId) {
        setSelectedMineId(location.state.prefilledEquipment.mineId);
      }
      if (location.state.prefilledEquipment.sectionId) {
        setSelectedSectionId(location.state.prefilledEquipment.sectionId);
      }
      setCurrentStep(4);
    }
    if (location.state?.prefilledHindi && location.state?.prefilledEnglish) {
      setHindiTranscript(location.state.prefilledHindi);
      setEnglishReport(location.state.prefilledEnglish);
    }
  }, [location.state]);

  // Load mines and sections
  useEffect(() => {
    const fetchMines = async () => {
      try {
        const data = await apiFetch('/mines');
        if (data.success && data.mines) {
          setMines(data.mines);
          if (!selectedMineId && data.mines.length > 0) {
            setSelectedMineId(data.mines[0].id);
          }
        }
      } catch (e) {
        // Fallback default demo mine if offline
        setMines([
          { id: 'MINE-05-ID', code: 'MINE-05', name: 'Rajrappa Open Cast Mine #05' },
        ]);
      }
    };
    fetchMines();
  }, []);

  useEffect(() => {
    if (!selectedMineId) return;
    const fetchSections = async () => {
      try {
        const data = await apiFetch(`/sections?mineId=${selectedMineId}`);
        if (data.success && data.sections) {
          setSections(data.sections);
          if (!selectedSectionId && data.sections.length > 0) {
            setSelectedSectionId(data.sections[0].id);
          }
        }
      } catch (e) {
        // Fallback default demo section if offline
        setSections([
          { id: 'SEC-B12-ID', code: 'B-12', name: 'Section B-12 Overburden & Conveyor Line' },
        ]);
      }
    };
    fetchSections();
  }, [selectedMineId]);

  // Geolocation grabber
  const captureGpsLocation = () => {
    setGpsLoading(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude);
          setLongitude(pos.coords.longitude);
          setGpsLoading(false);
        },
        (err) => {
          console.warn('GPS location error:', err);
          // Default to Section B-12 surface benchmark coordinates
          setLatitude(23.6338);
          setLongitude(85.7032);
          setGpsLoading(false);
        },
        { timeout: 8000 }
      );
    } else {
      setLatitude(23.6338);
      setLongitude(85.7032);
      setGpsLoading(false);
    }
  };

  const categories = [
    { id: 'ELECTRICAL', label: 'Electrical', icon: '⚡' },
    { id: 'MACHINERY', label: 'Machinery', icon: '⚙️' },
    { id: 'ROOF', label: 'Roof / Strata', icon: '🪨' },
    { id: 'VENTILATION', label: 'Ventilation', icon: '💨' },
    { id: 'FIRE', label: 'Fire Hazard', icon: '🔥' },
    { id: 'PPE', label: 'PPE Non-compliance', icon: '🦺' },
    { id: 'ENVIRONMENT', label: 'Environment / Dust', icon: '🌱' },
    { id: 'OTHER', label: 'Other Hazard', icon: '⚠️' },
  ];

  const severities = [
    { id: 'CRITICAL', label: 'Critical', desc: 'Immediate fatal / stoppage risk (SLA 6h)', color: 'bg-red-600 text-white' },
    { id: 'HIGH', label: 'High', desc: 'Major structural/operational threat (SLA 24h)', color: 'bg-amber-600 text-white' },
    { id: 'MEDIUM', label: 'Medium', desc: 'Moderate risk requiring repair (SLA 48h)', color: 'bg-yellow-600 text-white' },
    { id: 'LOW', label: 'Low', desc: 'Minor housekeeping observation (SLA 72h)', color: 'bg-blue-600 text-white' },
  ];

  // SUBMIT FINAL REPORT (Step 10)
  const handleSubmit = async () => {
    setIsSubmitting(true);
    const offlineSyncId = `OFFSYNC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const effectiveMine = mines.find((m) => m.id === selectedMineId) || { name: 'Mine #05', code: 'MINE-05' };
    const effectiveSection = sections.find((s) => s.id === selectedSectionId) || { code: 'B-12', name: 'Section B-12' };

    const payload = {
      offlineSyncId,
      mineId: selectedMineId || 'MINE-05-ID',
      mineName: effectiveMine.name,
      sectionId: selectedSectionId || 'SEC-B12-ID',
      sectionCode: effectiveSection.code,
      equipmentId: equipment?.id || null,
      equipmentName: equipment?.name || null,
      category,
      severity,
      description: englishReport || hindiTranscript || 'Field hazard reported',
      hindiTranscript,
      englishReport,
      photoDataUrl: initialPhotoUrl,
      latitude: latitude || 23.6338,
      longitude: longitude || 85.7032,
      timestamp: new Date().toISOString(),
      userId: user?.id || 'LOCAL-WORKER',
      userName: user?.name || 'Field Inspector',
      syncStatus: 'PENDING' as const,
      retries: 0,
    };

    if (!navigator.onLine) {
      // OFFLINE MODE (Section 9): Store into IndexedDB
      await saveOfflineReport(payload);
      setIsSubmitting(false);
      setSuccessMessage('🟠 Saved to IndexedDB in Offline Mode (Pending Sync)');
      setTimeout(() => {
        navigate('/field/reports');
      }, 1500);
      return;
    }

    // ONLINE MODE: Upload photo and dispatch observation API
    try {
      let uploadedPhotoUrl = initialPhotoUrl;
      if (initialPhotoUrl && initialPhotoUrl.startsWith('data:')) {
        uploadedPhotoUrl = await uploadFile(initialPhotoUrl);
      }

      await apiFetch('/observations', {
        method: 'POST',
        body: JSON.stringify({
          mineId: payload.mineId,
          sectionId: payload.sectionId,
          equipmentId: payload.equipmentId,
          category: payload.category,
          severity: payload.severity,
          description: payload.description,
          hindiTranscript: payload.hindiTranscript,
          englishReport: payload.englishReport,
          initialPhotoUrl: uploadedPhotoUrl,
          latitude: payload.latitude,
          longitude: payload.longitude,
          offlineSyncId,
        }),
      });

      // Also record in local IndexedDB as SYNCED
      await saveOfflineReport({ ...payload, photoDataUrl: uploadedPhotoUrl, syncStatus: 'SYNCED' });

      setSuccessMessage('🟢 Hazard Observation Successfully Submitted & Task Created!');
      setTimeout(() => {
        navigate('/field/reports');
      }, 1500);
    } catch (err: any) {
      console.warn('Online submission failed, falling back to offline IndexedDB store:', err);
      await saveOfflineReport(payload);
      setSuccessMessage('🟠 Network issue encountered. Report safely saved to IndexedDB (Pending Sync)');
      setTimeout(() => {
        navigate('/field/reports');
      }, 1500);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Step Indicator Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl text-slate-100">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400">
            Hazard Report Wizard • Step {currentStep} of 10
          </span>
          <span className="text-xs font-mono font-bold text-slate-400">
            {Math.round((currentStep / 10) * 100)}% Complete
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-amber-500 to-amber-400 h-full rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / 10) * 100}%` }}
          />
        </div>
      </div>

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-950/90 border border-emerald-700 text-emerald-200 font-bold text-sm shadow-xl flex items-center gap-3">
          <Check className="w-6 h-6 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Step Contents Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-slate-100 min-h-[360px] flex flex-col justify-between">
        {/* Step 1: Select Mine */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-black text-white">Step 1: {t('selectMine')}</h2>
            <p className="text-xs text-slate-400">Identify the colliery location of the hazard.</p>
            <div className="space-y-2">
              {mines.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMineId(m.id)}
                  className={`w-full p-4 rounded-xl border text-left transition-all ${
                    selectedMineId === m.id
                      ? 'bg-amber-500/20 border-amber-500 text-white'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <p className="font-bold text-sm">{m.name}</p>
                  <span className="text-xs font-mono text-amber-400">{m.code} • {m.location || 'Jharkhand'}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Select Section */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-black text-white">Step 2: {t('selectSection')}</h2>
            <p className="text-xs text-slate-400">Select working face or pit section.</p>
            <div className="space-y-2">
              {sections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSectionId(s.id)}
                  className={`w-full p-4 rounded-xl border text-left transition-all ${
                    selectedSectionId === s.id
                      ? 'bg-amber-500/20 border-amber-500 text-white'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <p className="font-bold text-sm">Section {s.code}</p>
                  <span className="text-xs text-slate-400">{s.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Scan Equipment QR */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-black text-white">Step 3: Associate Equipment (Optional)</h2>
            <p className="text-xs text-slate-400">Scan QR or select associated heavy machinery.</p>

            {equipment ? (
              <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500 text-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold text-amber-400 uppercase">
                    {equipment.type} • {equipment.equipmentCode}
                  </span>
                  <p className="font-extrabold text-base text-white">{equipment.name}</p>
                  <p className="text-xs text-slate-300">Model: {equipment.model}</p>
                </div>
                <button
                  onClick={() => setEquipment(null)}
                  className="text-xs text-slate-400 hover:text-red-400 underline"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={() => setIsQrModalOpen(true)}
                  className="w-full py-4 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border-2 border-dashed border-amber-500/60 text-amber-400 font-bold text-sm flex items-center justify-center gap-2"
                >
                  <QrCode className="w-5 h-5" /> Tap to Scan Equipment QR Code
                </button>
                <p className="text-center text-xs text-slate-500">
                  Or press Next if this is an area/environmental hazard without specific machinery.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Initial Photo */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-black text-white">Step 4: Capture Photographic Evidence</h2>
            <p className="text-xs text-slate-400">Take an initial photograph showing the damage or violation.</p>

            {initialPhotoUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-700 aspect-video bg-slate-950">
                <img src={initialPhotoUrl} alt="Initial hazard" className="w-full h-full object-cover" />
                <button
                  onClick={() => setInitialPhotoUrl('')}
                  className="absolute top-2 right-2 px-2.5 py-1 rounded bg-slate-900/90 text-xs text-red-300 font-bold border border-slate-700"
                >
                  Retake Photo
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsPhotoModalOpen(true)}
                className="w-full py-8 rounded-xl bg-slate-800 hover:bg-slate-700 border-2 border-dashed border-amber-500/60 text-amber-400 font-bold text-sm flex flex-col items-center justify-center gap-2"
              >
                <Camera className="w-8 h-8" />
                <span>Tap to Open Camera / Select Photo</span>
              </button>
            )}
          </div>
        )}

        {/* Step 5: Voice or Text (Hindi + English) */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-white">Step 5: Voice Description (Hindi / English)</h2>
              <button
                onClick={() => setIsVoiceModalOpen(true)}
                className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5"
              >
                <Mic className="w-3.5 h-3.5" /> Speak Hindi
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Original Hindi Voice / Transcript:
                </label>
                <input
                  type="text"
                  value={hindiTranscript}
                  onChange={(e) => setHindiTranscript(e.target.value)}
                  placeholder="कन्वेयर बेल्ट का गार्ड टूट गया है।"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  English Report (Worker can edit):
                </label>
                <textarea
                  value={englishReport}
                  onChange={(e) => setEnglishReport(e.target.value)}
                  rows={3}
                  placeholder="The conveyor belt guard is damaged."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-emerald-300 font-semibold placeholder-slate-500 focus:outline-none focus:border-emerald-500 leading-relaxed"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Select Category */}
        {currentStep === 6 && (
          <div className="space-y-4">
            <h2 className="text-lg font-black text-white">Step 6: Hazard Category</h2>
            <p className="text-xs text-slate-400">Routes task to the correct department authority.</p>

            <div className="grid grid-cols-2 gap-2.5">
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  className={`p-3.5 rounded-xl border text-left font-bold text-xs flex items-center gap-2.5 transition-all ${
                    category === c.id
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="text-lg">{c.icon}</span>
                  <span>{c.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 7: Select Severity */}
        {currentStep === 7 && (
          <div className="space-y-4">
            <h2 className="text-lg font-black text-white">Step 7: Severity Level &amp; SLA</h2>
            <p className="text-xs text-slate-400">Determines countdown SLA and escalation hierarchy.</p>

            <div className="space-y-2.5">
              {severities.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSeverity(s.id)}
                  className={`w-full p-3.5 rounded-xl border text-left transition-all ${
                    severity === s.id
                      ? 'bg-slate-800 border-amber-500 shadow-md'
                      : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-black px-2.5 py-0.5 rounded-md ${s.color}`}>
                      {s.label}
                    </span>
                    {severity === s.id && <Check className="w-4 h-4 text-amber-400" />}
                  </div>
                  <p className="text-xs text-slate-300">{s.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 8: Capture Location */}
        {currentStep === 8 && (
          <div className="space-y-4">
            <h2 className="text-lg font-black text-white">Step 8: Geolocation Coordinates</h2>
            <p className="text-xs text-slate-400">Record GPS surface coordinates for Leaflet map.</p>

            <div className="p-4 rounded-xl bg-slate-800 border border-slate-700 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Latitude:</span>
                <span className="font-mono font-bold text-white">{latitude?.toFixed(6) || '23.633800'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Longitude:</span>
                <span className="font-mono font-bold text-white">{longitude?.toFixed(6) || '85.703200'}</span>
              </div>
              <p className="text-[10px] text-slate-500 italic">
                * Note: Underground mines use Section reference points if GPS satellite is shielded.
              </p>
            </div>

            <button
              onClick={captureGpsLocation}
              disabled={gpsLoading}
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-amber-400 font-bold text-xs flex items-center justify-center gap-2"
            >
              <MapPin className="w-4 h-4" />
              {gpsLoading ? 'Acquiring GPS...' : 'Refresh GPS Coordinates'}
            </button>
          </div>
        )}

        {/* Step 9: Review the Report */}
        {currentStep === 9 && (
          <div className="space-y-3.5">
            <h2 className="text-lg font-black text-white">Step 9: Review Hazard Report</h2>
            <p className="text-xs text-slate-400">Verify all observation parameters before dispatch.</p>

            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Colliery / Section:</span>
                <span className="font-bold text-white">{mines.find((m) => m.id === selectedMineId)?.name || 'Mine #05'} (Sec B-12)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Equipment:</span>
                <span className="font-bold text-amber-400">{equipment?.name || 'General Area'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Category &amp; Severity:</span>
                <span className="font-bold text-white">{category} • {severity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">English Report:</span>
                <span className="font-bold text-emerald-400 text-right max-w-[60%]">{englishReport || 'Conveyor belt guard damaged'}</span>
              </div>
              {hindiTranscript && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Hindi Voice:</span>
                  <span className="text-slate-300">{hindiTranscript}</span>
                </div>
              )}
              {initialPhotoUrl && (
                <div className="pt-2 border-t border-slate-700">
                  <span className="text-slate-400 block mb-1">Attached Initial Photo Evidence:</span>
                  <img src={initialPhotoUrl} alt="Photo" className="h-20 w-auto rounded border border-slate-600" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 10: Submit Report */}
        {currentStep === 10 && (
          <div className="space-y-4 text-center py-6">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-2">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-white">Step 10: Ready to Submit</h2>
            <p className="text-xs text-slate-300 max-w-md mx-auto">
              Submitting creates an active database observation, auto-assigns the responsible officer, calculates mine risk, triggers SMS alert, and starts the SLA countdown.
            </p>

            <div className="pt-4 max-w-sm mx-auto">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl shadow-amber-500/30 flex items-center justify-center gap-2 transition-all disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Submitting to MineGuard...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    <span>CONFIRM &amp; SUBMIT REPORT</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Wizard Navigation Footer */}
        <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
            className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>

          {currentStep < 10 ? (
            <button
              onClick={() => setCurrentStep((prev) => Math.min(10, prev + 1))}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow transition-all"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Modals */}
      <QrScannerModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        onEquipmentSelected={(eq) => setEquipment(eq)}
      />

      <HindiSpeechModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onConfirm={(hi, en) => {
          setHindiTranscript(hi);
          setEnglishReport(en);
        }}
      />

      <CameraCaptureModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        onPhotoCaptured={(dataUrl) => setInitialPhotoUrl(dataUrl)}
      />
    </div>
  );
};
