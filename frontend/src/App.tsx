import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './components/common/Sidebar';
import { Navbar } from './components/common/Navbar';
import { CommandPalette } from './components/common/CommandPalette';
import { LiquidBackground } from './components/common/LiquidBackground';
import { SimulatorModal } from './components/events/SimulatorModal';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Alerts } from './pages/Alerts';
import { Incidents } from './pages/Incidents';
import { Events } from './pages/Events';
import { Investigation } from './pages/Investigation';
import { MitreMatrix } from './pages/MitreMatrix';
import { ThreatIntel } from './pages/ThreatIntel';
import { Detections } from './pages/Detections';
import { Reports } from './pages/Reports';
import { AuditLogs } from './pages/AuditLogs';
import { Settings } from './pages/Settings';
import { authApi } from './api/auth';
import { eventsApi } from './api/events';
import { User } from './types';

export const AppContent: React.FC = () => {
  const location = useLocation();
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('eye_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [openIncidentsCount, setOpenIncidentsCount] = useState<number>(0);
  const [simulatorOpen, setSimulatorOpen] = useState<boolean>(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState<boolean>(false);

  useEffect(() => {
    const checkAuthAndMetrics = async () => {
      const token = localStorage.getItem('eye_access_token');
      if (token && !user) {
        try {
          const profile = await authApi.getMe();
          setUser(profile);
        } catch {
          setUser(null);
        }
      }

      if (token) {
        try {
          const metrics = await eventsApi.getMetrics();
          setOpenIncidentsCount(metrics.open_incidents || 0);
        } catch {}
      }
    };
    checkAuthAndMetrics();
  }, [location.pathname]);

  // Global Shortcut Listener for Cmd/Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      window.location.href = '/login';
    }
  };

  const isLoginPage = location.pathname === '/login';

  if (!user && !isLoginPage) {
    return <Navigate to="/login" replace />;
  }

  if (isLoginPage) {
    return <Login onLoginSuccess={(u) => setUser(u)} />;
  }

  return (
    <div className="flex h-screen bg-[#05070d] text-eye-text overflow-hidden relative font-sans select-none">
      {/* Atmospheric Liquid Morphism Background */}
      <LiquidBackground />

      {/* Navigation Sidebar */}
      <Sidebar onOpenSimulator={() => setSimulatorOpen(true)} />

      {/* Main Console HUD Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        <Navbar
          user={user}
          onLogout={handleLogout}
          openIncidentsCount={openIncidentsCount}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-6 relative">
          <Routes>
            <Route path="/" element={<Dashboard onOpenSimulator={() => setSimulatorOpen(true)} />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/incidents" element={<Incidents />} />
            <Route path="/events" element={<Events onOpenSimulator={() => setSimulatorOpen(true)} />} />
            <Route path="/investigation" element={<Investigation />} />
            <Route path="/mitre-matrix" element={<MitreMatrix />} />
            <Route path="/threat-intel" element={<ThreatIntel />} />
            <Route path="/detections" element={<Detections />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/audit-logs" element={<AuditLogs />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* Attack Simulator Modal */}
      <SimulatorModal
        isOpen={simulatorOpen}
        onClose={() => setSimulatorOpen(false)}
        onRefreshData={() => {
          eventsApi.getMetrics().then((m) => setOpenIncidentsCount(m.open_incidents || 0));
        }}
      />

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onOpenSimulator={() => {
          setCommandPaletteOpen(false);
          setSimulatorOpen(true);
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
