import React, { useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Setup from './screens/Setup';
import Dashboard from './screens/Dashboard';
import TestVault from './screens/TestVault';
import Settings from './screens/Settings';
import LogSession from './screens/LogSession';
import BottomNav from './components/layout/BottomNav';
import TopBar from './components/layout/TopBar';
import CelebrationOverlay from './components/ui/CelebrationOverlay';

// ── Inner app (has access to context) ─────────────────────────────────
function Inner() {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [logOpen, setLogOpen] = useState(false);
  const [storageWarning, setStorageWarning] = useState(false);

  // Listen for storage-full event from saveState
  useEffect(() => {
    const handler = () => setStorageWarning(true);
    window.addEventListener('neoprep:storage-full', handler);
    return () => window.removeEventListener('neoprep:storage-full', handler);
  }, []);

  if (!state.config.setupDone) {
    return <Setup />;
  }

  const showCelebration = state._lastAllTargetsHit || state._lastDidLevelUp;

  const renderScreen = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard onOpenLog={() => setLogOpen(true)} />;
      case 'vault':     return <TestVault />;
      case 'settings':  return <Settings />;
      default:          return <Dashboard onOpenLog={() => setLogOpen(true)} />;
    }
  };

  return (
    <div className="app-shell">
      <TopBar />

      {storageWarning && (
        <div style={{
          background: 'rgba(244,63,94,0.12)',
          border: '1px solid rgba(244,63,94,0.4)',
          color: '#f87171',
          padding: '10px 16px',
          fontSize: '0.82rem',
          textAlign: 'center',
        }}>
          ⚠️ Storage almost full — export your data in Settings before it's lost.
          <button
            onClick={() => setStorageWarning(false)}
            style={{ marginLeft: 12, color: '#f87171', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Dismiss
          </button>
        </div>
      )}

      <main className="main-content">
        {renderScreen()}
      </main>

      <BottomNav activeTab={activeTab} onChange={setActiveTab} onLogPress={() => setLogOpen(true)} />

      {logOpen && (
        <LogSession onClose={() => setLogOpen(false)} />
      )}

      {showCelebration && (
        <CelebrationOverlay
          isLevelUp={state._lastDidLevelUp}
          newLevel={state._lastNewLevel}
          onDone={() => dispatch({ type: 'CLEAR_SESSION_META' })}
        />
      )}
    </div>
  );
}

// ── Root with provider ─────────────────────────────────────────────────
export default function App() {
  return (
    <AppProvider>
      <Inner />
    </AppProvider>
  );
}
