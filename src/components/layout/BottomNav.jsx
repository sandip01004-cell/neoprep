import React from 'react';
import styles from './BottomNav.module.css';

const TABS = [
  { id: 'dashboard', label: 'Home',   icon: HomeIcon },
  { id: 'log',       label: 'Log',    icon: PlusIcon,  isFAB: true },
  { id: 'vault',     label: 'Tests',  icon: VaultIcon },
  { id: 'settings',  label: 'More',   icon: SettingsIcon },
];

export default function BottomNav({ activeTab, onChange, onLogPress }) {
  return (
    <nav className={styles.nav} role="navigation" aria-label="Main navigation">
      {TABS.map(({ id, label, icon: Icon, isFAB }) => {
        if (isFAB) {
          return (
            <button
              key={id}
              id="bottom-nav-log"
              className={styles.fab}
              onClick={onLogPress}
              aria-label="Log study session"
            >
              <div className={styles.fabInner}>
                <Icon />
              </div>
              <span className={styles.fabLabel}>{label}</span>
            </button>
          );
        }
        return (
          <button
            key={id}
            id={`bottom-nav-${id}`}
            className={`${styles.tab} ${activeTab === id ? styles.active : ''}`}
            onClick={() => onChange(id)}
            aria-label={label}
            aria-current={activeTab === id ? 'page' : undefined}
          >
            <span className={styles.tabIcon}><Icon /></span>
            <span className={styles.tabLabel}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

// ── Icons (inline SVG, no external dependency) ──────────────────────
function HomeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5"  y1="12" x2="19" y2="12"/>
    </svg>
  );
}

function VaultIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
    </svg>
  );
}
