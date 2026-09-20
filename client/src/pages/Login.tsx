import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, Lock, User, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/LanguageContext';
import { LanguageSelector } from '../components/LanguageSelector';

export const Login: React.FC = () => {
  const { login, getDefaultRouteForRole } = useAuth();
  const { t, currentLanguage } = useTranslation();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('field@mineguard.gov.in');
  const [password, setPassword] = useState('Password123!');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const user = await login(identifier, password, currentLanguage);
      const targetRoute = getDefaultRouteForRole(user.role);
      navigate(targetRoute);
    } catch (err: any) {
      setErrorMessage(err.message || t('invalidLogin'));
    } finally {
      setLoading(false);
    }
  };

  // Demo user preset credentials for evaluator testing
  const demoAccounts = [
    { role: 'FIELD_STAFF', label: 'Field Staff (Worker)', id: 'field@mineguard.gov.in', pass: 'Password123!' },
    { role: 'MINE_MANAGER', label: 'Mine Manager (#05)', id: 'manager@mineguard.gov.in', pass: 'Password123!' },
    { role: 'CORPORATE', label: 'Corporate HQ', id: 'corporate@mineguard.gov.in', pass: 'Password123!' },
    { role: 'REGULATOR', label: 'DGMS Regulator', id: 'regulator@mineguard.gov.in', pass: 'Password123!' },
    { role: 'ADMIN', label: 'System Admin', id: 'admin@mineguard.gov.in', pass: 'Password123!' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-amber-500/10 via-blue-600/5 to-transparent blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="w-full max-w-7xl mx-auto px-4 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center p-2 shadow-lg shadow-amber-500/20">
            <Shield className="w-6 h-6 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <span className="font-extrabold text-lg text-white tracking-tight">{t('appName')}</span>
            <span className="ml-2 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
              SIH26024
            </span>
          </div>
        </div>

        {/* 10-Language Selector on Login Screen */}
        <LanguageSelector variant="dark" />
      </div>

      {/* Main Login Form Card */}
      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl p-8 backdrop-blur-md">
          {/* Brand Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-white tracking-tight">{t('appName')}</h1>
            <p className="text-xs font-semibold text-amber-400 mt-1">{t('tagline')}</p>
            <p className="text-[11px] text-slate-400 mt-0.5 tracking-wider uppercase">
              {t('subTagline')}
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-950/70 border border-red-800 text-xs text-red-200 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Employee ID / Email */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                {t('employeeId')}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  placeholder="e.g. EMP-FLD-01 or field@mineguard.gov.in"
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                />
              </div>
            </div>

            {/* Password with Show/Hide */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                {t('password')}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300 transition-colors"
                  title={showPassword ? t('hidePassword') : t('showPassword')}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Login Button with Loading State */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs tracking-wider uppercase shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>{t('loggingIn')}</span>
                </>
              ) : (
                <>
                  <span>{t('login')}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Demo Account Switcher for Instant Testing */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
              Quick Role Test Credentials:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => {
                    setIdentifier(acc.id);
                    setPassword(acc.pass);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg border text-left text-[11px] font-semibold transition-all ${
                    identifier === acc.id
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="block font-bold leading-tight">{acc.label}</span>
                  <span className="text-[9px] text-slate-500 block truncate">{acc.id}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full text-center py-4 text-[11px] text-slate-400 border-t border-slate-900 relative z-10">
        MineGuard AI • SIH26024 Smart Governance &amp; Compliance Monitoring Platform • Ministry of Coal / DGMS
      </footer>
    </div>
  );
};
