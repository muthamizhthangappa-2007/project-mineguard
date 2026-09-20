import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  AlertOctagon,
  Mic,
  QrCode,
  FileText,
  CheckSquare,
  RefreshCw,
  LayoutDashboard,
  Building2,
  MapPin,
  Layers,
  Wrench,
  Users,
  ShieldCheck,
  Award,
  AlertTriangle,
  Camera,
  Trees,
  TrendingUp,
  Flame,
  History,
  Scale,
  Settings,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/LanguageContext';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  if (!user) return null;

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
      isActive
        ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
    }`;

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between shrink-0 hidden md:flex">
      <div className="space-y-6">
        {/* FIELD_STAFF Navigation */}
        {user.role === 'FIELD_STAFF' && (
          <div>
            <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-amber-400 mb-2">
              Field Operations
            </p>
            <nav className="space-y-1">
              <NavLink to="/field" end className={linkClass}>
                <LayoutDashboard className="w-4 h-4" /> Field Hub
              </NavLink>
              <NavLink to="/field/report" className={linkClass}>
                <AlertOctagon className="w-4 h-4" /> {t('reportHazard')}
              </NavLink>
              <NavLink to="/field/equipment" className={linkClass}>
                <QrCode className="w-4 h-4" /> {t('scanEquipment')}
              </NavLink>
              <NavLink to="/field/reports" className={linkClass}>
                <FileText className="w-4 h-4" /> {t('myReports')}
              </NavLink>
              <NavLink to="/field/tasks" className={linkClass}>
                <CheckSquare className="w-4 h-4" /> {t('myTasks')}
              </NavLink>
            </nav>
          </div>
        )}

        {/* MINE_MANAGER Navigation */}
        {user.role === 'MINE_MANAGER' && (
          <div>
            <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-amber-400 mb-2">
              Mine Management ({user.mine?.code || 'MINE-05'})
            </p>
            <nav className="space-y-1">
              <NavLink to="/mine/dashboard" className={linkClass}>
                <LayoutDashboard className="w-4 h-4" /> Mine Overview
              </NavLink>
              <NavLink to="/mine/profile" className={linkClass}>
                <Building2 className="w-4 h-4" /> Digital Profile
              </NavLink>
              <NavLink to="/mine/map" className={linkClass}>
                <MapPin className="w-4 h-4" /> Interactive Map
              </NavLink>
              <NavLink to="/mine/sections" className={linkClass}>
                <Layers className="w-4 h-4" /> Mine Sections
              </NavLink>
              <NavLink to="/mine/equipment" className={linkClass}>
                <Wrench className="w-4 h-4" /> Equipment Fleet
              </NavLink>
              <NavLink to="/mine/tasks" className={linkClass}>
                <CheckSquare className="w-4 h-4" /> Tasks & Verification
              </NavLink>
              <NavLink to="/mine/safety" className={linkClass}>
                <ShieldCheck className="w-4 h-4" /> Safety Dashboard
              </NavLink>
              <NavLink to="/mine/compliance" className={linkClass}>
                <Award className="w-4 h-4" /> Compliance (313+)
              </NavLink>
              <NavLink to="/mine/violations" className={linkClass}>
                <AlertTriangle className="w-4 h-4" /> Violations
              </NavLink>
              <NavLink to="/mine/evidence" className={linkClass}>
                <Camera className="w-4 h-4" /> Evidence Gallery
              </NavLink>
              <NavLink to="/mine/environment" className={linkClass}>
                <Trees className="w-4 h-4" /> Environmental Sensor
              </NavLink>
              <NavLink to="/mine/production" className={linkClass}>
                <TrendingUp className="w-4 h-4" /> Production Daily
              </NavLink>
              <NavLink to="/mine/emergency" className={linkClass}>
                <Flame className="w-4 h-4" /> Emergency Readiness
              </NavLink>
              <NavLink to="/mine/activity" className={linkClass}>
                <History className="w-4 h-4" /> Audit Log
              </NavLink>
            </nav>
          </div>
        )}

        {/* CORPORATE Navigation */}
        {user.role === 'CORPORATE' && (
          <div>
            <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-amber-400 mb-2">
              Corporate Directorate
            </p>
            <nav className="space-y-1">
              <NavLink to="/corporate/dashboard" className={linkClass}>
                <LayoutDashboard className="w-4 h-4" /> Corporate HQ
              </NavLink>
              <NavLink to="/corporate/mines" className={linkClass}>
                <Building2 className="w-4 h-4" /> All Colliery Profiles
              </NavLink>
              <NavLink to="/corporate/analytics" className={linkClass}>
                <TrendingUp className="w-4 h-4" /> Comparative Analytics
              </NavLink>
              <NavLink to="/corporate/risk" className={linkClass}>
                <ShieldCheck className="w-4 h-4" /> AI Risk Intelligence
              </NavLink>
              <NavLink to="/corporate/compliance" className={linkClass}>
                <Award className="w-4 h-4" /> Multi-Mine Compliance
              </NavLink>
            </nav>
          </div>
        )}

        {/* REGULATOR Navigation */}
        {user.role === 'REGULATOR' && (
          <div>
            <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-amber-400 mb-2">
              DGMS Regulatory Oversight
            </p>
            <nav className="space-y-1">
              <NavLink to="/regulator/dashboard" className={linkClass}>
                <LayoutDashboard className="w-4 h-4" /> Oversight Dashboard
              </NavLink>
              <NavLink to="/regulator/mines" className={linkClass}>
                <Building2 className="w-4 h-4" /> Coal Mines Registry
              </NavLink>
              <NavLink to="/regulator/compliance" className={linkClass}>
                <Award className="w-4 h-4" /> Statutory Compliance
              </NavLink>
              <NavLink to="/regulator/violations" className={linkClass}>
                <AlertTriangle className="w-4 h-4" /> Violations Register
              </NavLink>
              <NavLink to="/regulator/audit" className={linkClass}>
                <History className="w-4 h-4" /> Audit Trail Logs
              </NavLink>
              <NavLink to="/regulator/reports" className={linkClass}>
                <Scale className="w-4 h-4" /> Statutory Reports Export
              </NavLink>
            </nav>
          </div>
        )}

        {/* ADMIN Navigation */}
        {user.role === 'ADMIN' && (
          <div>
            <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-amber-400 mb-2">
              System Administration
            </p>
            <nav className="space-y-1">
              <NavLink to="/admin" end className={linkClass}>
                <LayoutDashboard className="w-4 h-4" /> Admin Console
              </NavLink>
              <NavLink to="/admin/users" className={linkClass}>
                <Users className="w-4 h-4" /> Users & RBAC
              </NavLink>
              <NavLink to="/admin/mines" className={linkClass}>
                <Building2 className="w-4 h-4" /> Mines & Sections
              </NavLink>
              <NavLink to="/admin/regulations" className={linkClass}>
                <Award className="w-4 h-4" /> Regulations (313+)
              </NavLink>
              <NavLink to="/admin/equipment" className={linkClass}>
                <Wrench className="w-4 h-4" /> Equipment Register
              </NavLink>
              <NavLink to="/admin/settings" className={linkClass}>
                <Settings className="w-4 h-4" /> System & SLA Settings
              </NavLink>
            </nav>
          </div>
        )}
      </div>

      {/* Footer info */}
      <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
        <p className="font-semibold text-slate-300">MineGuard AI v1.0.0</p>
        <p className="text-[10px] text-slate-400">SIH26024 Coal Mine Governance</p>
      </div>
    </aside>
  );
};
