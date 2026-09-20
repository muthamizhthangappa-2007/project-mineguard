import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  AlertOctagon,
  ShieldAlert,
  Clock,
  Award,
  TrendingUp,
  ArrowRight,
  ExternalLink,
  Download,
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
} from 'recharts';
import { apiFetch } from '../../services/api';

export const CorporateDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCorporate = async () => {
      setLoading(true);
      try {
        const res = await apiFetch('/dashboard/corporate');
        if (res.success) {
          setData(res);
        }
      } catch (e) {
        console.warn('Failed to load corporate dashboard:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchCorporate();
  }, []);

  if (loading || !data) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <span className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { summary, mines } = data;

  const riskPieData = [
    { name: 'Low Risk', value: summary?.riskDistribution?.LOW || 0, color: '#10B981' },
    { name: 'Moderate Risk', value: summary?.riskDistribution?.MODERATE || 0, color: '#F59E0B' },
    { name: 'High Risk', value: summary?.riskDistribution?.HIGH || 0, color: '#EF4444' },
  ];

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-slate-100 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400">
            Coal India Enterprise Governance
          </span>
          <h1 className="text-2xl font-black text-white">Corporate Safety &amp; Governance Directorate</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Multi-colliery risk heatmaps, statutory compliance indexes, and enterprise cross-mine audit
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => window.open('/api/reports/safety?format=csv', '_blank')}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-amber-400" /> Export Enterprise CSV
          </button>
        </div>
      </div>

      {/* Enterprise Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow">
          <span className="text-xs font-semibold text-slate-400 block">Monitored Collieries</span>
          <p className="text-2xl font-black text-white mt-1">{summary?.totalMines || 0}</p>
          <span className="text-[10px] text-slate-500">Connected production pits</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow">
          <span className="text-xs font-semibold text-slate-400 block">Total Open Hazards</span>
          <p className="text-2xl font-black text-amber-400 mt-1">{summary?.totalOpenObservations || 0}</p>
          <span className="text-[10px] text-slate-500">Field observations active</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow">
          <span className="text-xs font-semibold text-slate-400 block">Critical Breaches</span>
          <p className="text-2xl font-black text-red-500 mt-1">{summary?.totalCriticalObservations || 0}</p>
          <span className="text-[10px] text-slate-500">Requires emergency response</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow">
          <span className="text-xs font-semibold text-slate-400 block">Overdue SLA Tasks</span>
          <p className="text-2xl font-black text-rose-400 mt-1">{summary?.totalOverdueTasks || 0}</p>
          <span className="text-[10px] text-slate-500">Escalated to management</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow">
          <span className="text-xs font-semibold text-slate-400 block">Group Compliance</span>
          <p className="text-2xl font-black text-emerald-400 mt-1 font-mono">
            {summary?.overallCompliance || 100}%
          </p>
          <span className="text-[10px] text-slate-500">313+ Statutory obligations</span>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl text-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Enterprise Colliery Risk Distribution
          </h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskPieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {riskPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution Bar Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl text-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Hazard Breakdown Across Mines
          </h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={Object.entries(summary?.categoryDistribution || {}).map(([category, count]) => ({
                  category,
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

      {/* Multi-Mine Comparative Registry (Section 32) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-slate-100 space-y-4">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-400" /> Colliery Comparison Matrix
          </h2>
          <p className="text-xs text-slate-400">
            Click any colliery to drill down into its complete Digital Mine Profile
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-bold bg-slate-950/40">
                <th className="py-3 px-4">Colliery Code &amp; Name</th>
                <th className="py-3 px-3">Subsidiary</th>
                <th className="py-3 px-3">AI Risk Score</th>
                <th className="py-3 px-3">Compliance</th>
                <th className="py-3 px-3">Open Issues</th>
                <th className="py-3 px-3">Overdue Tasks</th>
                <th className="py-3 px-3">Equipment</th>
                <th className="py-3 px-4 text-right">Digital Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {mines?.map((m: any) => (
                <tr
                  key={m.id}
                  onClick={() => navigate(`/mine/profile?mineId=${m.id}`)}
                  className="hover:bg-slate-800/60 cursor-pointer transition-colors group"
                >
                  <td className="py-3.5 px-4">
                    <span className="font-mono font-bold text-amber-400 mr-2">{m.code}</span>
                    <span className="font-bold text-white group-hover:text-amber-300 transition-colors">
                      {m.name}
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">{m.location}</span>
                  </td>
                  <td className="py-3.5 px-3 text-slate-300">{m.subsidiary}</td>
                  <td className="py-3.5 px-3">
                    <span
                      className={`font-black font-mono text-xs px-2 py-0.5 rounded ${
                        m.riskLevel === 'HIGH'
                          ? 'bg-red-950 text-red-400 border border-red-800'
                          : m.riskLevel === 'MODERATE'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      }`}
                    >
                      {m.riskScore}/100 ({m.riskLevel})
                    </span>
                  </td>
                  <td className="py-3.5 px-3 font-mono font-bold text-emerald-400">
                    {m.complianceScore}%
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="font-bold text-amber-400">{m.openIssues}</span>
                    {m.criticalIssues > 0 && (
                      <span className="ml-1 text-[10px] text-red-400 font-black">
                        ({m.criticalIssues} crit)
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-3">
                    <span
                      className={`font-bold ${
                        m.overdueTasks > 0 ? 'text-rose-400 animate-pulse font-black' : 'text-slate-400'
                      }`}
                    >
                      {m.overdueTasks}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-slate-300">{m.equipmentCount} units</td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 group-hover:translate-x-1 transition-transform">
                      Open Profile <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
