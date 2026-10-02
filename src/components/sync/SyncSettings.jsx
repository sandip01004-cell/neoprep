import React, { useState } from 'react';
import { useGithubSync } from '../../hooks/useGithubSync';
import { useApp } from '../../context/AppContext';
import styles from './SyncSettings.module.css';

function formatTime(date) {
  if (!date) return 'Never';
  const now  = Date.now();
  const diff = Math.floor((now - date.getTime()) / 1000);
  if (diff < 5)  return 'Just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function SyncSettings() {
  const { state, dispatch } = useApp();

  const onRemoteData = (remoteState) => {
    dispatch({ type: 'IMPORT_DATA', payload: remoteState });
  };

  const {
    syncConfig,
    isSyncing,
    lastSyncedAt,
    error,
    syncNow,
    connect,
    resetSync,
  } = useGithubSync(state, onRemoteData);

  const [expanded, setExpanded] = useState(false);
  const [repo,     setRepo]     = useState(syncConfig?.repo || '');
  const [token,    setToken]    = useState('');
  const [showToken, setShowToken] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState('');
  const [showReset, setShowReset] = useState(false);

  const isEnabled = !!syncConfig?.enabled;

  const handleConnect = async () => {
    if (!repo.trim() || !token.trim()) {
      setConnectError('Both Repo and Token are required.');
      return;
    }
    if (!/^[\w.-]+\/[\w.-]+$/.test(repo.trim())) {
      setConnectError('Repo must be in format: owner/repo');
      return;
    }
    setConnecting(true);
    setConnectError('');
    try {
      await connect(repo.trim(), token.trim());
      setToken(''); // clear token from state after saving
    } catch (e) {
      setConnectError(e.message);
    } finally {
      setConnecting(false);
    }
  };

  const handleReset = () => {
    resetSync();
    setRepo('');
    setToken('');
    setShowReset(false);
  };

  return (
    <div className={styles.wrap}>
      {/* Header toggle */}
      <button
        className={styles.headerBtn}
        onClick={() => setExpanded(v => !v)}
        aria-expanded={expanded}
        id="sync-settings-toggle"
      >
        <span className={styles.headerLeft}>
          <span className={`${styles.statusDot} ${isEnabled ? styles.dotOn : styles.dotOff}`} />
          <span className={styles.headerTitle}>GitHub Auto-Sync</span>
          <span className={styles.badge}>
            {isEnabled ? 'ON' : 'OFF'}
          </span>
        </span>
        <span className={styles.chevron}>{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className={styles.panel}>
          {/* Status bar */}
          <div className={styles.statusBar}>
            <div className={styles.statusItem}>
              <span className={styles.statusLabel}>Status</span>
              <span className={`${styles.statusValue} ${isEnabled ? styles.statusOn : styles.statusOff}`}>
                {isSyncing ? '⟳ Syncing…' : isEnabled ? '● Live' : '○ Disabled'}
              </span>
            </div>
            <div className={styles.statusItem}>
              <span className={styles.statusLabel}>Last synced</span>
              <span className={styles.statusValue}>{formatTime(lastSyncedAt)}</span>
            </div>
            {isEnabled && (
              <div className={styles.statusItem}>
                <span className={styles.statusLabel}>Repo</span>
                <span className={styles.statusValue}>{syncConfig.repo}</span>
              </div>
            )}
          </div>

          {/* Error */}
          {(error || connectError) && (
            <div className={styles.errorBox} role="alert">
              ⚠ {error || connectError}
            </div>
          )}

          {/* Not connected — show setup form */}
          {!isEnabled && (
            <div className={styles.setupForm}>
              <p className={styles.setupNote}>
                Sync your data to a private GitHub repository. You need a
                <a
                  href="https://github.com/settings/tokens?type=beta"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.link}
                >
                  {' '}fine-grained Personal Access Token
                </a>{' '}
                with <strong>Contents: Read &amp; Write</strong> access.
              </p>

              <label className={styles.fieldLabel} htmlFor="sync-repo">
                Repository <span className={styles.hint}>(owner/repo)</span>
              </label>
              <input
                id="sync-repo"
                className="input"
                placeholder="e.g. yourname/neoprep-data"
                value={repo}
                onChange={e => { setRepo(e.target.value); setConnectError(''); }}
                autoComplete="off"
                spellCheck={false}
              />

              <label className={styles.fieldLabel} htmlFor="sync-token">
                Personal Access Token
              </label>
              <div className={styles.tokenRow}>
                <input
                  id="sync-token"
                  className="input"
                  type={showToken ? 'text' : 'password'}
                  placeholder="github_pat_…"
                  value={token}
                  onChange={e => { setToken(e.target.value); setConnectError(''); }}
                  autoComplete="off"
                  spellCheck={false}
                />
                <button
                  className={styles.revealBtn}
                  onClick={() => setShowToken(v => !v)}
                  type="button"
                  aria-label={showToken ? 'Hide token' : 'Show token'}
                >
                  {showToken ? '🙈' : '👁'}
                </button>
              </div>

              <p className={styles.secNote}>
                🔒 Token is stored only in <em>your</em> browser's localStorage and never sent anywhere except GitHub.
              </p>

              <button
                id="sync-connect-btn"
                className={`btn btn-primary ${styles.connectBtn}`}
                onClick={handleConnect}
                disabled={connecting || !repo || !token}
              >
                {connecting ? 'Connecting…' : '🔗 Connect & Initialize'}
              </button>
            </div>
          )}

          {/* Connected — show actions */}
          {isEnabled && (
            <div className={styles.actions}>
              <button
                id="sync-now-btn"
                className="btn btn-secondary btn-sm"
                onClick={syncNow}
                disabled={isSyncing}
              >
                {isSyncing ? '⟳ Syncing…' : '↑ Sync Now'}
              </button>

              <button
                id="sync-reset-btn"
                className={`btn btn-sm ${styles.resetBtn}`}
                onClick={() => setShowReset(true)}
              >
                Disconnect
              </button>
            </div>
          )}

          {/* Reset confirm */}
          {showReset && (
            <>
              <div className={styles.backdrop} onClick={() => setShowReset(false)} />
              <div className={styles.confirmBox} role="dialog">
                <p className={styles.confirmMsg}>
                  Disconnect sync? Your local data stays safe. The remote file in GitHub is <strong>not</strong> deleted.
                </p>
                <div className={styles.confirmActions}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setShowReset(false)}>Cancel</button>
                  <button className="btn btn-danger btn-sm" onClick={handleReset}>Disconnect</button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
