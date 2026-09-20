import React, { useState, useEffect } from 'react';
import {
  Scale,
  Award,
  AlertTriangle,
  History,
  FileSpreadsheet,
  Download,
  Filter,
  Search,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { apiFetch } from '../../services/api';

export const RegulatoryDashboard: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters (Section 33)
  const [selectedMine, setSelectedMine] = useState<string>('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchRegulatory = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/dashboard/regulatory');
      if (res.success) {
        setData(res);
      }
    } catch (e) {
      console.warn('Failed to load regulatory data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegulatory();
  }, []);

  if (loading || !data) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <span className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { compliance, violations, overdueObligations, mines, auditLogs } = data;

  // Filtered violations
  const filteredViolations = violations.filter((v: any) => {
    if (selectedMine && v.mineId !== selectedMine) return false;
    if (selectedSeverity && v.severity !== selectedSeverity) return false;
    if (selectedCategory && v.category !== selectedCategory) return false;
    if (selectedStatus && v.status !== selectedStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        v.title.toLowerCase().includes(q) ||
        v.taskNumber.toLowerCase().includes(q) ||
        v.mine.name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-slate-100 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400">
            Directorate General of Mines Safety (DGMS)
          </span>
          <h1 className="text-2xl font-black text-white">Statutory Regulatory Oversight &amp; Compliance</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Mines Act 1952 &amp; Coal Mines Regulations 2017 Enforcement Platform
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => window.open('/api/reports/compliance?format=csv', '_blank')}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-emerald-400" /> Export Compliance Register
          </button>
          <button
            onClick={() => window.open('/api/reports/tasks?format=csv', '_blank')}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-400" /> Export Violations CSV
          </button>
        </div>
      </div>

      {/* Regulatory Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow">
          <span className="text-xs font-semibold text-slate-400 block">Overall National Compliance</span>
          <p className="text-2xl font-black text-emerald-400 mt-1">{compliance?.overallCompliance || 100}%</p>
          <span className="text-[10px] text-slate-500">Across monitored collieries</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow">
          <span className="text-xs font-semibold text-slate-400 block">Active Breaches / Violations</span>
          <p className="text-2xl font-black text-red-500 mt-1">{violations?.length || 0}</p>
          <span className="text-[10px] text-slate-500">Overdue SLA or Safety issues</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow">
          <span className="text-xs font-semibold text-slate-400 block">Overdue Statutory Obligations</span>
          <p className="text-2xl font-black text-rose-400 mt-1">{overdueObligations?.length || 0}</p>
          <span className="text-[10px] text-slate-500">CMR 2017 missed deadlines</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow">
          <span className="text-xs font-semibold text-slate-400 block">Inspected Colliery Sites</span>
          <p className="text-2xl font-black text-blue-400 mt-1">{mines?.length || 0}</p>
          <span className="text-[10px] text-slate-500">Active regional jurisdictions</span>
        </div>
      </div>

      {/* Filter Bar (Section 33) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl text-slate-100 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
          <Filter className="w-4 h-4" /> Filter By:
        </div>

        {/* Mine filter */}
        <select
          value={selectedMine}
          onChange={(e) => setSelectedMine(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-xs rounded-xl px-3 py-1.5 text-slate-200 outline-none"
        >
          <option value="">All Mines</option>
          {mines.map((m: any) => (
            <option key={m.id} value={m.id}>
              {m.code} - {m.name}
            </option>
          ))}
        </select>

        {/* Severity filter */}
        <select
          value={selectedSeverity}
          onChange={(e) => setSelectedSeverity(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-xs rounded-xl px-3 py-1.5 text-slate-200 outline-none"
        >
          <option value="">All Severities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>

        {/* Category filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-xs rounded-xl px-3 py-1.5 text-slate-200 outline-none"
        >
          <option value="">All Categories</option>
          <option value="MACHINERY">Machinery</option>
          <option value="ELECTRICAL">Electrical</option>
          <option value="ROOF">Roof / Strata</option>
          <option value="VENTILATION">Ventilation</option>
          <option value="FIRE">Fire</option>
          <option value="ENVIRONMENT">Environment</option>
        </select>

        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search task or colliery..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        {(selectedMine || selectedSeverity || selectedCategory || searchQuery) && (
          <button
            onClick={() => {
              setSelectedMine('');
              setSelectedSeverity('');
              setSelectedCategory('');
              setSearchQuery('');
            }}
            className="text-xs text-amber-400 hover:text-white font-semibold underline"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Violations & Overdue Tasks Register */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-slate-100 space-y-4">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" /> Regulatory Violations &amp; SLA Breaches Register ({filteredViolations.length})
          </h2>
          <p className="text-xs text-slate-400">
            Mandatory notice list subject to Section 22 DGMS improvement notices
          </p>
        </div>

        <div className="divide-y divide-slate-800/80">
          {filteredViolations.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              ✓ No statutory violations matching selected filter criteria.
            </p>
          ) : (
            filteredViolations.map((v: any) => (
              <div key={v.id} className="py-4 flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-red-400">{v.taskNumber}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {v.category}
                    </span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800">
                      {v.severity}
                    </span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-rose-600 text-white animate-pulse">
                      {v.status}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-white">{v.title}</h4>
                  <p className="text-xs text-slate-300">{v.description}</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Colliery: <b>{v.mine.name}</b> • Section: <b>{v.section.code}</b> • Officer: <b>{v.assignedTo.name} ({v.assignedTo.phone})</b>
                  </p>
                </div>

                <div className="text-right space-y-1">
                  <span className="text-[10px] text-slate-400 block font-mono">
                    SLA Deadline: {new Date(v.slaDeadline).toLocaleString()}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded bg-red-950 text-red-400 border border-red-800">
                    Statutory Escalation Triggered
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Regulatory Audit History (Section 34) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-slate-100 space-y-4">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <History className="w-5 h-5 text-amber-400" /> Regulatory Governance Audit Trail
          </h2>
          <p className="text-xs text-slate-400">
            System actions, approvals, and statutory state transitions
          </p>
        </div>

        <div className="divide-y divide-slate-800/80 max-h-80 overflow-y-auto">
          {auditLogs?.map((log: any) => (
            <div key={log.id} className="py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div>
                <span className="font-mono text-amber-400 font-bold mr-2">{log.action}</span>
                <span className="text-slate-300">by <b>{log.userName}</b></span>
                <span className="text-slate-500 block text-[11px] mt-0.5">
                  Entity: {log.entity} ({log.entityId})
                </span>
              </div>
              <span className="text-slate-400 font-mono text-[11px]">
                {new Date(log.timestamp).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
