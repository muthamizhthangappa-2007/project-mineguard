import React, { useState, useEffect } from 'react';
import { Shield, Wifi, WifiOff, RefreshCw, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/LanguageContext';
import { LanguageSelector } from './LanguageSelector';
import { NotificationCenter } from './NotificationCenter';
import { subscribeToSyncStatus, syncOfflineReports } from '../services/syncService';
import { useNavigate } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsubscribe = subscribeToSyncStatus((syncing, count) => {
      setIsSyncing(syncing);
      setPendingCount(count);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);

  const handleManualSync = async () => {
    await syncOfflineReports();
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & App Name */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center p-2 shadow-lg shadow-amber-500/20">
            <Shield className="w-6 h-6 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-white">{t('appName')}</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                SIH26024
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium hidden sm:block">
              {t('subTagline')}
            </p>
          </div>
        </div>

        {/* Right Action Cluster */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Network & Offline Sync Status Indicator */}
          <div className="flex items-center gap-2">
            {isOnline ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <Wifi className="w-3.5 h-3.5" />
                <span className="hidden md:inline">🟢 {t('online')}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-950/80 text-amber-400 border border-amber-800 animate-pulse">
                <WifiOff className="w-3.5 h-3.5" />
                <span>🟠 {t('offline')}</span>
              </span>
            )}

            {/* Pending Sync Badge & Button */}
            {pendingCount > 0 && (
              <button
                onClick={handleManualSync}
                disabled={isSyncing || !isOnline}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 disabled:opacity-50 transition-all shadow"
                title="Sync offline reports now"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{pendingCount} {t('pendingSync')}</span>
              </button>
            )}
          </div>

          {/* 10-Language Selector */}
          <LanguageSelector variant="dark" />

          {/* Notifications */}
          <NotificationCenter />

          {/* User Profile & Role Pill */}
          {user && (
            <div className="hidden lg:flex items-center gap-2.5 pl-3 border-l border-slate-800">
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-amber-400 font-bold border border-slate-700">
                <UserIcon className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-200 leading-tight">{user.name}</p>
                <span className="text-[10px] font-mono text-amber-400/90 font-medium">
                  {user.role} {user.mine ? `• ${user.mine.code}` : ''}
                </span>
              </div>
            </div>
          )}

          {/* Logout Button */}
          {user && (
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800/80 rounded-lg transition-colors"
              title={t('logout')}
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
