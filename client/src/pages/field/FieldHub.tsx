import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertOctagon,
  Mic,
  QrCode,
  FileText,
  CheckSquare,
  RefreshCw,
  Wifi,
  WifiOff,
  Shield,
  MapPin,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { QrScannerModal } from '../../components/QrScannerModal';
import { HindiSpeechModal } from '../../components/HindiSpeechModal';
import { getPendingReports } from '../../services/db';
import { syncOfflineReports, subscribeToSyncStatus } from '../../services/syncService';

export const FieldHub: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isSpeechModalOpen, setIsSpeechModalOpen] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsubscribe = subscribeToSyncStatus((syncing, count) => {
      setIsSyncing(syncing);
      setPendingCount(count);
    });

    getPendingReports().then((items) => setPendingCount(items.length));

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);

  const handleEquipmentSelected = (equipment: any) => {
    // Navigate directly into hazard report wizard with prefilled equipment
    navigate('/field/report', { state: { prefilledEquipment: equipment } });
  };

  const handleVoiceConfirmed = (hindi: string, english: string) => {
    navigate('/field/report', { state: { prefilledHindi: hindi, prefilledEnglish: english } });
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Worker Greeting & Status Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xl shadow-lg shadow-amber-500/20">
            MG
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400">
              Field Staff Terminal
            </span>
            <h1 className="text-xl font-black text-white">{user?.name}</h1>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5 font-medium">
              <MapPin className="w-3.5 h-3.5 text-amber-500" />
              {user?.mine?.name || 'Mine #05'} • {user?.section?.name || 'Section B-12'}
            </p>
          </div>
        </div>

        {/* Big Online/Offline Indicator */}
        <div className="flex items-center gap-2">
          {isOnline ? (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-700 text-emerald-400 font-black text-xs tracking-wider shadow">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <Wifi className="w-4 h-4" />
              <span>🟢 {t('online')}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-950/80 border border-amber-700 text-amber-400 font-black text-xs tracking-wider animate-pulse shadow">
              <WifiOff className="w-4 h-4" />
              <span>🟠 {t('offline')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Large High-Contrast Touch Buttons (Section 6) */}
      <div className="space-y-3.5">
        {/* REPORT HAZARD (Big Primary Amber Button) */}
        <button
          onClick={() => navigate('/field/report')}
          className="w-full py-5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-lg tracking-tight uppercase shadow-xl shadow-amber-500/25 flex items-center justify-between transition-all transform active:scale-[0.98]"
        >
          <div className="flex items-center gap-4 text-left">
            <div className="w-12 h-12 rounded-xl bg-slate-950 text-amber-400 flex items-center justify-center">
              <AlertOctagon className="w-7 h-7" />
            </div>
            <div>
              <span className="block text-xl leading-tight">{t('reportHazard')}</span>
              <span className="text-xs font-bold text-slate-900/80 normal-case">
                10-step wizard with camera, voice &amp; location
              </span>
            </div>
          </div>
          <span className="text-2xl font-black">➔</span>
        </button>

        {/* 2-Column Action Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* SPEAK (HINDI VOICE) */}
          <button
            onClick={() => setIsSpeechModalOpen(true)}
            className="p-5 rounded-2xl bg-slate-900 hover:bg-slate-800 border-2 border-slate-700 hover:border-amber-400/80 text-white font-bold text-left transition-all group shadow-lg flex items-start justify-between"
          >
            <div className="space-y-1">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Mic className="w-5 h-5" />
              </div>
              <p className="text-base font-black text-white">{t('speak')}</p>
              <p className="text-xs text-slate-400">Hindi Voice STT &amp; Translation</p>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-slate-800 text-amber-400">
              हिन्दी
            </span>
          </button>

          {/* SCAN EQUIPMENT */}
          <button
            onClick={() => setIsQrModalOpen(true)}
            className="p-5 rounded-2xl bg-slate-900 hover:bg-slate-800 border-2 border-slate-700 hover:border-amber-400/80 text-white font-bold text-left transition-all group shadow-lg flex items-start justify-between"
          >
            <div className="space-y-1">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <QrCode className="w-5 h-5" />
              </div>
              <p className="text-base font-black text-white">{t('scanEquipment')}</p>
              <p className="text-xs text-slate-400">Scan Colliery QR Code Tag</p>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-slate-800 text-blue-400">
              QR
            </span>
          </button>

          {/* MY REPORTS */}
          <button
            onClick={() => navigate('/field/reports')}
            className="p-5 rounded-2xl bg-slate-900 hover:bg-slate-800 border-2 border-slate-700 hover:border-amber-400/80 text-white font-bold text-left transition-all group shadow-lg flex items-start justify-between"
          >
            <div className="space-y-1">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <p className="text-base font-black text-white">{t('myReports')}</p>
              <p className="text-xs text-slate-400">Review Submitted Observations</p>
            </div>
          </button>

          {/* MY TASKS */}
          <button
            onClick={() => navigate('/field/tasks')}
            className="p-5 rounded-2xl bg-slate-900 hover:bg-slate-800 border-2 border-slate-700 hover:border-amber-400/80 text-white font-bold text-left transition-all group shadow-lg flex items-start justify-between"
          >
            <div className="space-y-1">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <CheckSquare className="w-5 h-5" />
              </div>
              <p className="text-base font-black text-white">{t('myTasks')}</p>
              <p className="text-xs text-slate-400">Assigned Rectification &amp; SLA</p>
            </div>
          </button>
        </div>

        {/* PENDING SYNC BAR */}
        <div
          onClick={() => syncOfflineReports()}
          className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
            pendingCount > 0
              ? 'bg-amber-950/60 border-amber-600/80 text-amber-200 shadow-lg'
              : 'bg-slate-900/60 border-slate-800 text-slate-400'
          }`}
        >
          <div className="flex items-center gap-3">
            <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin text-amber-400' : ''}`} />
            <div>
              <p className="text-sm font-bold text-white">
                {pendingCount > 0 ? `${pendingCount} ${t('pendingSync')}` : 'All Local Data Synchronized'}
              </p>
              <p className="text-[11px] text-slate-400">
                {isOnline ? 'Tap to trigger immediate sync to database' : 'Will sync automatically when back online'}
              </p>
            </div>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-amber-400 border border-slate-700">
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </span>
        </div>
      </div>

      {/* QR Scanner Modal */}
      <QrScannerModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        onEquipmentSelected={handleEquipmentSelected}
      />

      {/* Hindi Voice Modal */}
      <HindiSpeechModal
        isOpen={isSpeechModalOpen}
        onClose={() => setIsSpeechModalOpen(false)}
        onConfirm={handleVoiceConfirmed}
      />
    </div>
  );
};
