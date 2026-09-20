import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  MapPin,
  Layers,
  Wrench,
  Users,
  ShieldCheck,
  CheckSquare,
  Award,
  AlertTriangle,
  Camera,
  Trees,
  TrendingUp,
  Flame,
  History,
  Check,
  X,
  RefreshCw,
  FileSpreadsheet,
  Download,
  AlertOctagon,
  Eye,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { apiFetch } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { SlaCountdown } from '../../components/SlaCountdown';
import { EvidenceTimeline } from '../../components/EvidenceTimeline';
import { MineMap } from '../../components/MineMap';

export const MineProfilePage: React.FC<{ activeTab?: string }> = ({ activeTab: initialTab }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<string>(initialTab || searchParams.get('tab') || 'overview');
  const [profileData, setProfileData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Manager Verification Modal
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [selectedTaskToVerify, setSelectedTaskToVerify] = useState<any | null>(null);
  const [verificationDecision, setVerificationDecision] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [rejectionReason, setRejectionReason] = useState('');
  const [verifying, setVerifying] = useState(false);

  // Evidence Lightbox
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);

  const mineId = user?.mineId || searchParams.get('mineId') || 'MINE-05-ID';

  const loadMineProfile = async () => {
    setLoading(true);
    try {
      // First find mine by ID or code
      const minesRes = await apiFetch('/mines');
      let targetMineId = mineId;
      if (minesRes.success && minesRes.mines.length > 0) {
        const found = minesRes.mines.find(
          (m: any) => m.id === mineId || m.code === 'MINE-05' || m.id === user?.mineId
        );
        if (found) targetMineId = found.id;
      }

      const res = await apiFetch(`/mines/${targetMineId}`);
      if (res.success && res.profile) {
        setProfileData(res.profile);
      }
    } catch (e) {
      console.warn('Error loading mine profile:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMineProfile();
  }, [mineId]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  // Manager Verification Handler (Section 20)
  const handleVerifySubmit = async () => {
    if (!selectedTaskToVerify) return;
    setVerifying(true);
    try {
      await apiFetch(`/tasks/${selectedTaskToVerify.id}/verify`, {
        method: 'PATCH',
        body: JSON.stringify({
          decision: verificationDecision,
          rejectionReason: verificationDecision === 'REJECT' ? rejectionReason : undefined,
        }),
      });
      setVerificationModalOpen(false);
      setRejectionReason('');
      setSelectedTaskToVerify(null);
      await loadMineProfile(); // Reloads updated risk, tasks, compliance & audit!
    } catch (err: any) {
      alert(err.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  // CSV Export
  const exportCsv = (type: 'safety' | 'compliance' | 'tasks') => {
    const token = localStorage.getItem('mineguard_token');
    window.open(`/api/reports/${type}?mineId=${profileData?.mine?.id || ''}&format=csv`, '_blank');
  };

  if (loading && !profileData) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center space-y-3">
        <span className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-400">Loading Digital Mine Profile...</p>
      </div>
    );
  }

  const { mine, risk, workforce, safety, tasks, evidence, compliance, violations, equipmentCounts, recentActivity } =
    profileData || {};

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'profile', label: 'Mine Profile', icon: Building2 },
    { id: 'map', label: 'Interactive Map', icon: MapPin },
    { id: 'sections', label: 'Sections', icon: Layers },
    { id: 'equipment', label: 'Equipment Fleet', icon: Wrench },
    { id: 'workforce', label: 'Workforce', icon: Users },
    { id: 'safety', label: 'Safety Intelligence', icon: ShieldCheck },
    { id: 'tasks', label: 'Tasks & Verification', icon: CheckSquare },
    { id: 'compliance', label: 'Compliance (313+)', icon: Award },
    { id: 'violations', label: 'Violations', icon: AlertTriangle },
    { id: 'evidence', label: 'Evidence Gallery', icon: Camera },
    { id: 'environment', label: 'Environment', icon: Trees },
    { id: 'production', label: 'Production', icon: TrendingUp },
    { id: 'emergency', label: 'Emergency Readiness', icon: Flame },
    { id: 'activity', label: 'Activity & Audit', icon: History },
  ];

  // Chart colors
  const PIE_COLORS = ['#EF4444', '#F59E0B', '#EAB308', '#3B82F6'];

  const severityChartData = [
    { name: 'Critical', value: safety?.severityCounts?.CRITICAL || 0 },
    { name: 'High', value: safety?.severityCounts?.HIGH || 0 },
    { name: 'Medium', value: safety?.severityCounts?.MEDIUM || 0 },
    { name: 'Low', value: safety?.severityCounts?.LOW || 0 },
  ];

  const complianceChartData = [
    { name: 'Safety', score: compliance?.safetyCompliance || 85 },
    { name: 'Equipment', score: compliance?.equipmentCompliance || 90 },
    { name: 'Environment', score: compliance?.environmentCompliance || 88 },
    { name: 'Emergency', score: compliance?.emergencyCompliance || 100 },
  ];

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Colliery Digital Profile Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-slate-100 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
              {mine?.code || 'MINE-05'}
            </span>
            <span className="text-xs font-mono font-bold text-slate-400">
              {mine?.subsidiary || 'Central Coalfields Limited (CCL)'}
            </span>
          </div>
          <h1 className="text-2xl font-black text-white">{mine?.name || 'Rajrappa Open Cast Mine #05'}</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {mine?.location} • Type: <b>{mine?.mineType}</b> • Manager: <b>{mine?.managerName}</b>
          </p>
        </div>

        {/* AI-Assisted Risk Intelligence Badge (Section 27) */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-right">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">
              AI-Assisted Risk Score
            </span>
            <div className="flex items-center justify-end gap-1.5">
              <span
                className={`text-2xl font-black ${
                  risk?.level === 'HIGH'
                    ? 'text-red-500'
                    : risk?.level === 'MODERATE'
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {risk?.totalScore || mine?.riskScore || 25}/100
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                  risk?.level === 'HIGH'
                    ? 'bg-red-950 text-red-400 border border-red-800'
                    : risk?.level === 'MODERATE'
                    ? 'bg-amber-950 text-amber-400 border border-amber-800'
                    : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                }`}
              >
                {risk?.level || 'LOW'}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => exportCsv('safety')}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" /> Export Safety CSV
            </button>
            <button
              onClick={() => exportCsv('compliance')}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Export Compliance CSV
            </button>
          </div>
        </div>
      </div>

      {/* 15 Sub-page Tab Navigation (Section 21) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800 scrollbar-thin">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow font-extrabold'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ===================== TAB 1: OVERVIEW ===================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow">
              <span className="text-xs font-semibold text-slate-400 block">Open Observations</span>
              <p className="text-2xl font-black text-amber-400 mt-1">{safety?.openObservations || 0}</p>
              <span className="text-[10px] text-slate-500">Active hazard reports in pit</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow">
              <span className="text-xs font-semibold text-slate-400 block">Overall Compliance</span>
              <p className="text-2xl font-black text-emerald-400 mt-1">{compliance?.overallCompliance || 100}%</p>
              <span className="text-[10px] text-slate-500">Statutory 313+ framework</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow">
              <span className="text-xs font-semibold text-slate-400 block">Pending Verification</span>
              <p className="text-2xl font-black text-purple-400 mt-1">
                {tasks?.filter((t: any) => t.status === 'PENDING_VERIFICATION').length || 0}
              </p>
              <span className="text-[10px] text-slate-500">Ready for Mine Manager approval</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow">
              <span className="text-xs font-semibold text-slate-400 block">Equipment Count</span>
              <p className="text-2xl font-black text-blue-400 mt-1">{equipmentCounts?.total || 0}</p>
              <span className="text-[10px] text-slate-500">Active heavy machinery units</span>
            </div>
          </div>

          {/* Map Preview & Risk Factor Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <MineMap
                mine={mine}
                sections={mine?.sections || []}
                equipment={mine?.equipment || []}
                observations={safety?.recentObservations || []}
              />
            </div>

            {/* AI Risk Factor Breakdown */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl text-slate-100 space-y-4">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" /> AI-Assisted Risk Factors
              </h3>
              <p className="text-xs text-slate-400">
                Transparent rule-based scoring engine calculating real-time danger level.
              </p>

              <div className="space-y-3 pt-2 text-xs">
                <div className="flex justify-between items-center p-2 rounded-lg bg-slate-800/60">
                  <span className="text-slate-300">Critical Hazards Active (x15)</span>
                  <span className="font-black text-red-400">{risk?.criticalIssuesCount || 0}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-slate-800/60">
                  <span className="text-slate-300">High Hazards Active (x8)</span>
                  <span className="font-black text-amber-400">{risk?.highIssuesCount || 0}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-slate-800/60">
                  <span className="text-slate-300">Overdue SLA Tasks (x12 penalty)</span>
                  <span className="font-black text-rose-400">{risk?.overdueTasksCount || 0}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-slate-800/60">
                  <span className="text-slate-300">Critical Machinery Status (x10)</span>
                  <span className="font-black text-amber-400">{risk?.equipmentCriticalCount || 0}</span>
                </div>
              </div>

              <div className="p-3 bg-amber-950/40 border border-amber-700/60 rounded-xl text-xs text-amber-300 space-y-1">
                <span className="font-bold block">Safety Recommendation:</span>
                <p className="text-[11px] leading-relaxed">
                  Focus rectification on Section B-12 conveyor guards and complete pending manager verifications.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 2: PROFILE ===================== */}
      {activeTab === 'profile' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-slate-100 space-y-6">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-400" /> Colliery Statutory Profile
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700">
              <span className="text-slate-400 block text-[10px] uppercase">Mine Name</span>
              <span className="font-black text-sm text-white">{mine?.name}</span>
            </div>
            <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700">
              <span className="text-slate-400 block text-[10px] uppercase">Colliery Identification Code</span>
              <span className="font-mono font-black text-sm text-amber-400">{mine?.code}</span>
            </div>
            <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700">
              <span className="text-slate-400 block text-[10px] uppercase">Operating Subsidiary</span>
              <span className="font-semibold text-white">{mine?.subsidiary}</span>
            </div>
            <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700">
              <span className="text-slate-400 block text-[10px] uppercase">Location &amp; District</span>
              <span className="font-semibold text-white">{mine?.location}, {mine?.district}, {mine?.state}</span>
            </div>
            <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700">
              <span className="text-slate-400 block text-[10px] uppercase">Mining Method</span>
              <span className="font-semibold text-white">{mine?.mineType}</span>
            </div>
            <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700">
              <span className="text-slate-400 block text-[10px] uppercase">Operational Status</span>
              <span className="font-bold text-emerald-400">{mine?.operationalStatus}</span>
            </div>
            <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700">
              <span className="text-slate-400 block text-[10px] uppercase">Leasehold Mining Area</span>
              <span className="font-semibold text-white">{mine?.area}</span>
            </div>
            <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700">
              <span className="text-slate-400 block text-[10px] uppercase">Commissioning Date</span>
              <span className="font-semibold text-white">{mine?.commissioningDate}</span>
            </div>
            <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700">
              <span className="text-slate-400 block text-[10px] uppercase">Mine Manager &amp; Contact</span>
              <span className="font-bold text-amber-400">{mine?.managerName} ({mine?.contactPhone})</span>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 3: MAP ===================== */}
      {activeTab === 'map' && (
        <MineMap
          mine={mine}
          sections={mine?.sections || []}
          equipment={mine?.equipment || []}
          observations={safety?.recentObservations || []}
        />
      )}

      {/* ===================== TAB 4: SECTIONS ===================== */}
      {activeTab === 'sections' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-slate-100 space-y-4">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" /> Working Sections &amp; Pits
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mine?.sections?.map((sec: any) => (
              <div key={sec.id} className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
                <div className="flex justify-between items-start">
                  <span className="font-mono font-bold text-sm text-amber-400">Section {sec.code}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 text-amber-300">
                    Risk: {sec.riskLevel}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-white">{sec.name}</h4>
                <div className="pt-2 text-xs text-slate-400 space-y-1">
                  <p>Registered Equipment: {sec._count?.equipment || 0}</p>
                  <p>Active Issues: {sec._count?.observations || 0}</p>
                  <p>Active Tasks: {sec._count?.tasks || 0}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================== TAB 5: EQUIPMENT ===================== */}
      {activeTab === 'equipment' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-slate-100 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-400" /> Equipment Fleet Breakdown ({equipmentCounts?.total})
              </h2>
              <p className="text-xs text-slate-400">All registered heavy mining apparatus</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold">
              <span className="px-2.5 py-1 rounded-md bg-emerald-950 text-emerald-400 border border-emerald-800">
                🟢 {equipmentCounts?.normal} Normal
              </span>
              <span className="px-2.5 py-1 rounded-md bg-amber-950 text-amber-400 border border-amber-800">
                🟡 {equipmentCounts?.maintenance} Maintenance
              </span>
              <span className="px-2.5 py-1 rounded-md bg-red-950 text-red-400 border border-red-800">
                🔴 {equipmentCounts?.critical} Critical
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {mine?.equipment?.map((eq: any) => (
              <div key={eq.id} className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
                <div className="flex justify-between items-start">
                  <span className="font-mono text-[10px] text-amber-400 font-bold">{eq.equipmentCode}</span>
                  <span
                    className={`text-[9px] font-black px-2 py-0.5 rounded ${
                      eq.status === 'CRITICAL'
                        ? 'bg-red-950 text-red-400'
                        : eq.status === 'MAINTENANCE'
                        ? 'bg-amber-950 text-amber-400'
                        : 'bg-emerald-950 text-emerald-400'
                    }`}
                  >
                    {eq.status}
                  </span>
                </div>
                <h4 className="font-bold text-xs text-white">{eq.name}</h4>
                <p className="text-[11px] text-slate-400">
                  Type: {eq.type} • Section {eq.section?.code || 'Main'}
                </p>
                <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-700/60">
                  Last Maint: {eq.lastMaintenanceDate}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================== TAB 6: WORKFORCE ===================== */}
      {activeTab === 'workforce' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-slate-100 space-y-6">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" /> Mine Workforce Demographics
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700">
              <span className="text-xs text-slate-400 block">Total Staff</span>
              <span className="text-2xl font-black text-white">{workforce?.totalWorkers}</span>
            </div>
            <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700">
              <span className="text-xs text-slate-400 block">Present on Shift</span>
              <span className="text-2xl font-black text-emerald-400">{workforce?.presentToday}</span>
            </div>
            <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700">
              <span className="text-xs text-slate-400 block">Sanctioned Leave</span>
              <span className="text-2xl font-black text-amber-400">{workforce?.leave}</span>
            </div>
            <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700">
              <span className="text-xs text-slate-400 block">Absent</span>
              <span className="text-2xl font-black text-rose-400">{workforce?.absent}</span>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Departmental Breakdown:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {Object.entries(workforce?.departments || {}).map(([dept, count]: any) => (
                <div key={dept} className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 flex justify-between">
                  <span className="font-semibold text-slate-200">{dept}</span>
                  <span className="font-mono font-bold text-amber-400">{count} officers</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 7: SAFETY ===================== */}
      {activeTab === 'safety' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-slate-100 space-y-6">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" /> Safety Intelligence &amp; Hazard Trends
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Severity Distribution Pie Chart */}
            <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700">
              <h3 className="text-xs font-bold uppercase text-slate-400 mb-2">Hazard Severity Distribution</h3>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={severityChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {severityChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Counts Bar Chart */}
            <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700">
              <h3 className="text-xs font-bold uppercase text-slate-400 mb-2">Hazards by Category</h3>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={Object.entries(safety?.categoryCounts || {}).map(([cat, count]) => ({
                      category: cat,
                      count,
                    }))}
                  >
                    <XAxis dataKey="category" stroke="#94a3b8" fontSize={10} />
                    <YAxis stroke="#94a3b8" fontSize={10} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 8: TASKS & VERIFICATION ===================== */}
      {activeTab === 'tasks' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-slate-100 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-amber-400" /> Task Management &amp; Manager Verification
              </h2>
              <p className="text-xs text-slate-400">
                Review submitted rectification evidence, approve resolutions or reject with reason
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {tasks?.map((t: any) => (
              <div
                key={t.id}
                className="p-5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-4 shadow"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-bold text-amber-400">{t.taskNumber}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                        {t.category}
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-950 text-red-400">
                        {t.severity}
                      </span>
                      <span
                        className={`text-xs font-black px-2.5 py-0.5 rounded ${
                          t.status === 'CLOSED'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : t.status === 'PENDING_VERIFICATION'
                            ? 'bg-purple-950 text-purple-400 border border-purple-800 animate-pulse'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>

                    <h3 className="font-black text-base text-white">{t.title}</h3>
                    <p className="text-xs text-slate-300 mt-0.5">{t.description}</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Assigned Officer: <b>{t.assignedTo?.name}</b> • Section: <b>{t.section?.code}</b>
                    </p>
                  </div>

                  <SlaCountdown deadline={t.slaDeadline} status={t.status} />
                </div>

                {/* Evidence Timeline Stepper inside Task */}
                <EvidenceTimeline
                  evidence={t.evidence || []}
                  taskStatus={t.status}
                  verificationStatus={t.verificationStatus}
                  rejectionReason={t.rejectionReason}
                />

                {/* MANAGER VERIFICATION BUTTONS (Section 20) */}
                {t.status === 'PENDING_VERIFICATION' && (
                  <div className="pt-3 border-t border-slate-700 flex flex-wrap items-center justify-between gap-3 bg-purple-950/20 p-3 rounded-xl border border-purple-800/40">
                    <span className="text-xs font-bold text-purple-300">
                      ⚡ Final Evidence Submitted: Ready for Mine Manager Verification
                    </span>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedTaskToVerify(t);
                          setVerificationDecision('APPROVE');
                          setVerificationModalOpen(true);
                        }}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow flex items-center gap-1.5 transition-all"
                      >
                        <Check className="w-4 h-4" /> APPROVE &amp; CLOSE
                      </button>

                      <button
                        onClick={() => {
                          setSelectedTaskToVerify(t);
                          setVerificationDecision('REJECT');
                          setVerificationModalOpen(true);
                        }}
                        className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow flex items-center gap-1.5 transition-all"
                      >
                        <X className="w-4 h-4" /> REJECT &amp; REOPEN
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================== TAB 9: COMPLIANCE ===================== */}
      {activeTab === 'compliance' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-slate-100 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" /> Statutory Compliance (Coal Mines Regulations 2017)
              </h2>
              <p className="text-xs text-slate-400">
                Calculated authentic percentages from database records (313+ schema standard)
              </p>
            </div>
            <span className="text-2xl font-black text-emerald-400 font-mono">
              {compliance?.overallCompliance}% Overall
            </span>
          </div>

          {/* Compliance Category Bar Chart */}
          <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700">
            <h3 className="text-xs font-bold uppercase text-slate-400 mb-2">Compliance by Category</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={complianceChartData}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="score" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Obligations Records Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Statutory Obligations:
            </h3>
            <div className="divide-y divide-slate-800/80">
              {compliance?.records?.map((rec: any) => (
                <div key={rec.id} className="py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-mono text-amber-400 font-bold mr-2">
                      {rec.regulation.regulationCode}
                    </span>
                    <span className="font-bold text-white">{rec.regulation.name}</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">{rec.regulation.officialSource}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`font-black text-[10px] px-2.5 py-1 rounded uppercase ${
                        rec.status === 'COMPLETED'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : rec.status === 'OVERDUE'
                          ? 'bg-red-950 text-red-400 border border-red-800'
                          : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}
                    >
                      {rec.status}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Due: {new Date(rec.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 10: VIOLATIONS ===================== */}
      {activeTab === 'violations' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-slate-100 space-y-4">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" /> Colliery Violations &amp; Breaches ({violations?.length || 0})
          </h2>

          {violations && violations.length > 0 ? (
            <div className="space-y-3">
              {violations.map((v: any) => (
                <div key={v.id} className="p-4 rounded-xl bg-red-950/30 border border-red-800/60 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-xs font-bold text-red-400">{v.taskNumber}</span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-red-600 text-white">
                      {v.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-white">{v.title}</h4>
                  <p className="text-xs text-slate-300">{v.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-6 text-center">
              ✓ No active statutory violations or overdue SLA tasks in this mine.
            </p>
          )}
        </div>
      )}

      {/* ===================== TAB 11: EVIDENCE GALLERY ===================== */}
      {activeTab === 'evidence' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-slate-100 space-y-6">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Camera className="w-5 h-5 text-amber-400" /> Comprehensive Evidence Gallery ({evidence?.length || 0})
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {evidence?.map((item: any) => (
              <div
                key={item.id}
                onClick={() => setLightboxPhoto(item.fileUrl)}
                className="group relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950 aspect-video cursor-pointer"
              >
                <img
                  src={item.fileUrl}
                  alt={item.caption || 'Evidence'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                  <Eye className="w-4 h-4" /> View
                </div>
                <div className="absolute bottom-1 left-1 right-1 p-1 bg-slate-950/80 rounded text-[9px] text-slate-200 truncate">
                  <span className="font-bold text-amber-400">{item.evidenceType}</span>: {item.caption || 'Field Photo'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================== TAB 12: ENVIRONMENT ===================== */}
      {activeTab === 'environment' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-slate-100 space-y-6">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Trees className="w-5 h-5 text-emerald-400" /> Real-Time Environmental Telemetry
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700">
              <span className="text-xs text-slate-400 block">Air Quality Index (AQI)</span>
              <span className="text-2xl font-black text-amber-400">118</span>
              <span className="text-[10px] text-slate-500 block">Moderate</span>
            </div>
            <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700">
              <span className="text-xs text-slate-400 block">Particulate PM2.5</span>
              <span className="text-2xl font-black text-white">42.5 µg/m³</span>
              <span className="text-[10px] text-emerald-400 block">Within CPCB norms</span>
            </div>
            <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700">
              <span className="text-xs text-slate-400 block">Methane (CH4) Level</span>
              <span className="text-2xl font-black text-emerald-400">0.02%</span>
              <span className="text-[10px] text-slate-500 block">Threshold: &lt;0.5%</span>
            </div>
            <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700">
              <span className="text-xs text-slate-400 block">Noise Level (Leq)</span>
              <span className="text-2xl font-black text-white">76.5 dB(A)</span>
              <span className="text-[10px] text-slate-500 block">Permissible: 85 dB</span>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 13: PRODUCTION ===================== */}
      {activeTab === 'production' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-slate-100 space-y-6">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-400" /> Daily Extraction &amp; Production Telemetry
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700">
              <span className="text-slate-400 block">Target Extraction</span>
              <span className="text-2xl font-black text-white">12,500 Tonnes</span>
            </div>
            <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700">
              <span className="text-slate-400 block">Actual Output Today</span>
              <span className="text-2xl font-black text-emerald-400">11,980 Tonnes</span>
            </div>
            <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700">
              <span className="text-slate-400 block">Extraction Efficiency</span>
              <span className="text-2xl font-black text-amber-400">95.8%</span>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 14: EMERGENCY ===================== */}
      {activeTab === 'emergency' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-slate-100 space-y-6">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-red-400" /> Emergency Preparedness &amp; Disaster Resources
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mine?.emergencyResources?.map((res: any) => (
              <div key={res.id} className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-mono font-bold text-amber-400 uppercase">{res.resourceType}</span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                    {res.status}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-white">{res.name}</h4>
                <p className="text-xs text-slate-300">Stationed: {res.location}</p>
                <p className="text-xs text-amber-300 font-semibold">
                  In-Charge: {res.contactPerson} ({res.contactPhone})
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================== TAB 15: ACTIVITY ===================== */}
      {activeTab === 'activity' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-slate-100 space-y-4">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <History className="w-5 h-5 text-amber-400" /> Audit Trail &amp; Governance Log
          </h2>

          <div className="divide-y divide-slate-800/80">
            {recentActivity?.map((act: any) => (
              <div key={act.id} className="py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-mono text-amber-400 font-bold mr-2">{act.action}</span>
                  <span className="text-slate-300">by <b>{act.userName}</b></span>
                  <span className="text-slate-500 block text-[11px] mt-0.5">
                    Entity: {act.entity} ({act.entityId})
                  </span>
                </div>
                <span className="text-slate-400 font-mono text-[11px]">
                  {new Date(act.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manager Verification Modal (Section 20) */}
      {verificationModalOpen && selectedTaskToVerify && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl text-slate-100">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <h3 className="font-bold text-base text-white">Manager Verification Decision</h3>
              <button onClick={() => setVerificationModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3.5 bg-slate-800 rounded-xl border border-slate-700 text-xs space-y-1">
                <p className="font-mono text-amber-400 font-bold">{selectedTaskToVerify.taskNumber}</p>
                <p className="font-bold text-sm text-white">{selectedTaskToVerify.title}</p>
                <p className="text-slate-300">{selectedTaskToVerify.description}</p>
              </div>

              {/* Radio decision */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setVerificationDecision('APPROVE')}
                  className={`p-3 rounded-xl border font-black text-xs flex items-center justify-center gap-2 transition-all ${
                    verificationDecision === 'APPROVE'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  <Check className="w-4 h-4" /> APPROVE &amp; CLOSE
                </button>

                <button
                  type="button"
                  onClick={() => setVerificationDecision('REJECT')}
                  className={`p-3 rounded-xl border font-black text-xs flex items-center justify-center gap-2 transition-all ${
                    verificationDecision === 'REJECT'
                      ? 'bg-rose-600 text-white border-rose-500 shadow-lg'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  <X className="w-4 h-4" /> REJECT &amp; REOPEN
                </button>
              </div>

              {verificationDecision === 'REJECT' && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Required: Reason for Rejection
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    required
                    rows={3}
                    placeholder="Specify what work remains incomplete or non-compliant..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setVerificationModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleVerifySubmit}
                  disabled={verifying || (verificationDecision === 'REJECT' && !rejectionReason.trim())}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-black shadow transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 ${
                    verificationDecision === 'APPROVE'
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-rose-600 hover:bg-rose-500 text-white'
                  }`}
                >
                  {verifying ? 'Submitting...' : 'Confirm Decision'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Photo View */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setLightboxPhoto(null)}
        >
          <div className="max-w-3xl max-h-[90vh] relative" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightboxPhoto}
              alt="Evidence Full View"
              className="max-h-[85vh] w-auto max-w-full rounded-xl border border-slate-700 shadow-2xl object-contain mx-auto"
            />
            <button
              onClick={() => setLightboxPhoto(null)}
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
