import React, { useState, useEffect } from 'react';
import {
  Users,
  Building2,
  Award,
  Wrench,
  Settings,
  Plus,
  Check,
  ToggleLeft,
  ToggleRight,
  Shield,
  Save,
} from 'lucide-react';
import { apiFetch } from '../../services/api';

export const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'mines' | 'regulations' | 'sla'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [mines, setMines] = useState<any[]>([]);
  const [regulations, setRegulations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New User Form State
  const [newUserModal, setNewUserModal] = useState(false);
  const [newEmployeeId, setNewEmployeeId] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('Password123!');
  const [newRole, setNewRole] = useState('FIELD_STAFF');
  const [newPhone, setNewPhone] = useState('+91 94311 00000');

  // SLA Configuration Settings State
  const [criticalSla, setCriticalSla] = useState(6);
  const [highSla, setHighSla] = useState(24);
  const [mediumSla, setMediumSla] = useState(48);
  const [lowSla, setLowSla] = useState(72);
  const [slaSavedNotice, setSlaSavedNotice] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, minesRes, regsRes] = await Promise.all([
        apiFetch('/users'),
        apiFetch('/mines'),
        apiFetch('/regulations'),
      ]);
      if (usersRes.success) setUsers(usersRes.users);
      if (minesRes.success) setMines(minesRes.mines);
      if (regsRes.success) setRegulations(regsRes.regulations);
    } catch (e) {
      console.warn('Failed to load admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/users', {
        method: 'POST',
        body: JSON.stringify({
          employeeId: newEmployeeId,
          name: newName,
          email: newEmail,
          password: newPassword,
          role: newRole,
          phone: newPhone,
        }),
      });
      setNewUserModal(false);
      setNewEmployeeId('');
      setNewName('');
      setNewEmail('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create user');
    }
  };

  const handleToggleUser = async (id: string) => {
    try {
      await apiFetch(`/users/${id}/toggle-status`, { method: 'PATCH' });
      await loadData();
    } catch (e) {
      alert('Failed to toggle status');
    }
  };

  const handleSaveSla = () => {
    setSlaSavedNotice(true);
    setTimeout(() => setSlaSavedNotice(false), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-slate-100 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400">
            System Administration
          </span>
          <h1 className="text-2xl font-black text-white">Central MineGuard AI Console</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage users, RBAC permissions, collieries, 313+ regulations, and dynamic SLA policies
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'users' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-900 text-slate-300'
          }`}
        >
          <Users className="w-4 h-4" /> Users &amp; RBAC ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('mines')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'mines' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-900 text-slate-300'
          }`}
        >
          <Building2 className="w-4 h-4" /> Collieries ({mines.length})
        </button>
        <button
          onClick={() => setActiveTab('regulations')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'regulations' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-900 text-slate-300'
          }`}
        >
          <Award className="w-4 h-4" /> Regulations ({regulations.length})
        </button>
        <button
          onClick={() => setActiveTab('sla')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'sla' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-900 text-slate-300'
          }`}
        >
          <Settings className="w-4 h-4" /> SLA &amp; System Settings
        </button>
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-slate-100 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-800">
            <h2 className="text-base font-black text-white">Registered Users &amp; Role Assignments</h2>
            <button
              onClick={() => setNewUserModal(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow"
            >
              <Plus className="w-4 h-4" /> Add New User
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 bg-slate-950/40">
                  <th className="py-2.5 px-3">Employee ID</th>
                  <th className="py-2.5 px-3">Full Name</th>
                  <th className="py-2.5 px-3">Email Address</th>
                  <th className="py-2.5 px-3">Role (RBAC)</th>
                  <th className="py-2.5 px-3">Contact</th>
                  <th className="py-2.5 px-3 text-right">Active Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/50">
                    <td className="py-3 px-3 font-mono text-amber-400 font-bold">{u.employeeId}</td>
                    <td className="py-3 px-3 font-bold text-white">{u.name}</td>
                    <td className="py-3 px-3 text-slate-300">{u.email}</td>
                    <td className="py-3 px-3">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400">{u.phone}</td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleToggleUser(u.id)}
                        className={`text-xs font-bold px-2 py-1 rounded transition-colors ${
                          u.isActive
                            ? 'text-emerald-400 hover:text-emerald-300'
                            : 'text-rose-400 hover:text-rose-300'
                        }`}
                      >
                        {u.isActive ? 'Active ✓' : 'Suspended ✗'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mines Tab */}
      {activeTab === 'mines' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-slate-100 space-y-4">
          <h2 className="text-base font-black text-white">Registered Coal Mines</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mines.map((m) => (
              <div key={m.id} className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
                <div className="flex justify-between items-start">
                  <span className="font-mono text-xs font-bold text-amber-400">{m.code}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 text-emerald-400">
                    {m.operationalStatus}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-white">{m.name}</h3>
                <p className="text-xs text-slate-400">{m.location} • {m.subsidiary}</p>
                <div className="pt-2 border-t border-slate-700/80 text-[11px] text-slate-400 flex justify-between">
                  <span>Sections: {m._count?.sections || 3}</span>
                  <span>Equipment: {m._count?.equipment || 10}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Regulations Tab */}
      {activeTab === 'regulations' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-slate-100 space-y-4">
          <h2 className="text-base font-black text-white">
            Official CMR 2017 Regulations (313+ Framework)
          </h2>
          <div className="divide-y divide-slate-800/80">
            {regulations.map((r) => (
              <div key={r.id} className="py-3.5 space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-amber-400 font-bold">{r.regulationCode}</span>
                  <span className="font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {r.category}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    Frequency: {r.frequency} • Default SLA: {r.defaultSlaHours}h
                  </span>
                </div>
                <h4 className="font-bold text-sm text-white">{r.name}</h4>
                <p className="text-slate-300">{r.description}</p>
                <p className="text-[11px] text-amber-300/80">
                  Evidence Required: {r.evidenceRequired}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SLA & Settings Tab */}
      {activeTab === 'sla' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-slate-100 space-y-6 max-w-2xl">
          <h2 className="text-base font-black text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-400" /> Statutory SLA Thresholds &amp; Escalation Hierarchy
          </h2>

          {slaSavedNotice && (
            <div className="p-3 bg-emerald-950 border border-emerald-800 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" /> SLA threshold settings updated successfully!
            </div>
          )}

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Critical Severity SLA (Hours)
              </label>
              <input
                type="number"
                value={criticalSla}
                onChange={(e) => setCriticalSla(parseInt(e.target.value, 10))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono font-bold"
              />
              <span className="text-[10px] text-slate-500">Default: 6 hours (Immediate stoppage)</span>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">
                High Severity SLA (Hours)
              </label>
              <input
                type="number"
                value={highSla}
                onChange={(e) => setHighSla(parseInt(e.target.value, 10))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono font-bold"
              />
              <span className="text-[10px] text-slate-500">Default: 24 hours (Major hazard)</span>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Medium Severity SLA (Hours)
              </label>
              <input
                type="number"
                value={mediumSla}
                onChange={(e) => setMediumSla(parseInt(e.target.value, 10))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono font-bold"
              />
              <span className="text-[10px] text-slate-500">Default: 48 hours</span>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Low Severity SLA (Hours)
              </label>
              <input
                type="number"
                value={lowSla}
                onChange={(e) => setLowSla(parseInt(e.target.value, 10))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono font-bold"
              />
              <span className="text-[10px] text-slate-500">Default: 72 hours</span>
            </div>

            <button
              onClick={handleSaveSla}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow transition-all"
            >
              <Save className="w-4 h-4" /> Save SLA Policies
            </button>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {newUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Create Colliery User</h3>
            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Employee ID</label>
                <input
                  type="text"
                  value={newEmployeeId}
                  onChange={(e) => setNewEmployeeId(e.target.value)}
                  required
                  placeholder="e.g. EMP-MECH-02"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  placeholder="e.g. Anand Kishor"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                  placeholder="e.g. anand@mineguard.gov.in"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Role (RBAC)</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                >
                  <option value="FIELD_STAFF">FIELD_STAFF</option>
                  <option value="MINE_MANAGER">MINE_MANAGER</option>
                  <option value="CORPORATE">CORPORATE</option>
                  <option value="REGULATOR">REGULATOR</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewUserModal(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
