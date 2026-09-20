import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageProvider } from './i18n/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Login } from './pages/Login';
import { FieldHub } from './pages/field/FieldHub';
import { ReportHazard } from './pages/field/ReportHazard';
import { MyReports } from './pages/field/MyReports';
import { MyTasks } from './pages/field/MyTasks';
import { EquipmentScannerPage } from './pages/field/EquipmentScannerPage';
import { MineProfilePage } from './pages/mine/MineProfilePage';
import { CorporateDashboard } from './pages/corporate/CorporateDashboard';
import { RegulatoryDashboard } from './pages/regulator/RegulatoryDashboard';
import { AdminPanel } from './pages/admin/AdminPanel';

const queryClient = new QueryClient();

// Protected Layout with Navbar and Sidebar
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-100">
        <span className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
};

// Root redirect based on role
const RootRedirect: React.FC = () => {
  const { user, loading, getDefaultRouteForRole } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={getDefaultRouteForRole(user.role)} replace />;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <Router>
            <Routes>
              {/* Public Login */}
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<RootRedirect />} />

              {/* Field Staff Routes */}
              <Route path="/field" element={<AppLayout><FieldHub /></AppLayout>} />
              <Route path="/field/report" element={<AppLayout><ReportHazard /></AppLayout>} />
              <Route path="/field/reports" element={<AppLayout><MyReports /></AppLayout>} />
              <Route path="/field/tasks" element={<AppLayout><MyTasks /></AppLayout>} />
              <Route path="/field/equipment" element={<AppLayout><EquipmentScannerPage /></AppLayout>} />

              {/* Mine Manager Routes */}
              <Route path="/mine/dashboard" element={<AppLayout><MineProfilePage activeTab="overview" /></AppLayout>} />
              <Route path="/mine/profile" element={<AppLayout><MineProfilePage activeTab="profile" /></AppLayout>} />
              <Route path="/mine/map" element={<AppLayout><MineProfilePage activeTab="map" /></AppLayout>} />
              <Route path="/mine/sections" element={<AppLayout><MineProfilePage activeTab="sections" /></AppLayout>} />
              <Route path="/mine/equipment" element={<AppLayout><MineProfilePage activeTab="equipment" /></AppLayout>} />
              <Route path="/mine/workforce" element={<AppLayout><MineProfilePage activeTab="workforce" /></AppLayout>} />
              <Route path="/mine/safety" element={<AppLayout><MineProfilePage activeTab="safety" /></AppLayout>} />
              <Route path="/mine/tasks" element={<AppLayout><MineProfilePage activeTab="tasks" /></AppLayout>} />
              <Route path="/mine/compliance" element={<AppLayout><MineProfilePage activeTab="compliance" /></AppLayout>} />
              <Route path="/mine/violations" element={<AppLayout><MineProfilePage activeTab="violations" /></AppLayout>} />
              <Route path="/mine/evidence" element={<AppLayout><MineProfilePage activeTab="evidence" /></AppLayout>} />
              <Route path="/mine/environment" element={<AppLayout><MineProfilePage activeTab="environment" /></AppLayout>} />
              <Route path="/mine/production" element={<AppLayout><MineProfilePage activeTab="production" /></AppLayout>} />
              <Route path="/mine/emergency" element={<AppLayout><MineProfilePage activeTab="emergency" /></AppLayout>} />
              <Route path="/mine/activity" element={<AppLayout><MineProfilePage activeTab="activity" /></AppLayout>} />

              {/* Corporate Routes */}
              <Route path="/corporate/dashboard" element={<AppLayout><CorporateDashboard /></AppLayout>} />
              <Route path="/corporate/mines" element={<AppLayout><CorporateDashboard /></AppLayout>} />
              <Route path="/corporate/analytics" element={<AppLayout><CorporateDashboard /></AppLayout>} />
              <Route path="/corporate/risk" element={<AppLayout><CorporateDashboard /></AppLayout>} />
              <Route path="/corporate/compliance" element={<AppLayout><CorporateDashboard /></AppLayout>} />

              {/* Regulator Routes */}
              <Route path="/regulator/dashboard" element={<AppLayout><RegulatoryDashboard /></AppLayout>} />
              <Route path="/regulator/mines" element={<AppLayout><RegulatoryDashboard /></AppLayout>} />
              <Route path="/regulator/compliance" element={<AppLayout><RegulatoryDashboard /></AppLayout>} />
              <Route path="/regulator/violations" element={<AppLayout><RegulatoryDashboard /></AppLayout>} />
              <Route path="/regulator/audit" element={<AppLayout><RegulatoryDashboard /></AppLayout>} />
              <Route path="/regulator/reports" element={<AppLayout><RegulatoryDashboard /></AppLayout>} />

              {/* Admin Routes */}
              <Route path="/admin" element={<AppLayout><AdminPanel /></AppLayout>} />
              <Route path="/admin/users" element={<AppLayout><AdminPanel /></AppLayout>} />
              <Route path="/admin/mines" element={<AppLayout><AdminPanel /></AppLayout>} />
              <Route path="/admin/regulations" element={<AppLayout><AdminPanel /></AppLayout>} />
              <Route path="/admin/equipment" element={<AppLayout><AdminPanel /></AppLayout>} />
              <Route path="/admin/settings" element={<AppLayout><AdminPanel /></AppLayout>} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
};

export default App;
