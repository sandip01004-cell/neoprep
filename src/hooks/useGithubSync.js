/**
 * useGithubSync — optional GitHub-backed sync for NeoPrep
 *
 * Stores sync config in localStorage under 'neoprep_github_sync'.
 * Uses GitHub Contents API (no backend required).
 */

import { useState, useEffect, useRef, useCallback } from 'react';

// ── Constants ──────────────────────────────────────────────────────────
const SYNC_STORAGE_KEY = 'neoprep_github_sync';
const GITHUB_FILE_PATH = 'data.json';
const DEBOUNCE_MS      = 3000;   // push after 3s idle
const POLL_INTERVAL_MS = 45000;  // pull every 45s

// ── Helpers ────────────────────────────────────────────────────────────

function getSyncConfig() {
  try {
    const raw = localStorage.getItem(SYNC_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSyncConfig(cfg) {
  localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(cfg));
}

function clearSyncConfig() {
  localStorage.removeItem(SYNC_STORAGE_KEY);
}

function toBase64(str) {
  // btoa with UTF-8 safe encoding
  return btoa(unescape(encodeURIComponent(str)));
}

function fromBase64(b64) {
  try {
    return decodeURIComponent(escape(atob(b64)));
  } catch {
    return atob(b64);
  }
}

function apiUrl(repo, path = '') {
  return `https://api.github.com/repos/${repo}/contents/${path}`;
}

function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept:        'application/vnd.github+json',
    'Content-Type': 'application/json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

/**
 * Classify GitHub API errors into user-friendly messages.
 */
function classifyError(status, body) {
  if (status === 401) return 'Invalid or expired token. Check your GitHub PAT.';
  if (status === 403) {
    if (body?.message?.includes('rate limit')) return 'GitHub API rate limit hit. Try again in a minute.';
    return 'Permission denied. Ensure your token has repo read/write access.';
  }
  if (status === 404) return 'Repository or file not found. Check the repo name.';
  if (status === 409) return 'Conflict: file was modified elsewhere. Refresh to re-sync.';
  if (status === 422) return 'Validation error from GitHub. Check the repo name format (owner/repo).';
  if (status >= 500) return 'GitHub server error. Try again shortly.';
  return body?.message || `GitHub API error (HTTP ${status})`;
}

// ── Core API functions ─────────────────────────────────────────────────

/**
 * Fetch data.json from GitHub. Returns { content, sha } or null if 404.
 */
async function fetchFile(repo, token) {
  const res = await fetch(apiUrl(repo, GITHUB_FILE_PATH), {
    headers: authHeaders(token),
  });

  if (res.status === 404) return null;

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(classifyError(res.status, body));
  }

  const data = await res.json();
  const content = fromBase64(data.content.replace(/\n/g, ''));
  return { content: JSON.parse(content), sha: data.sha };
}

/**
 * Push state to GitHub. Creates or updates data.json.
 * Returns the new SHA.
 */
async function pushFile(repo, token, state, sha) {
  const content = toBase64(JSON.stringify(state, null, 2));
  const body = {
    message: `NeoPrep sync — ${new Date().toISOString()}`,
    content,
    ...(sha ? { sha } : {}),
  };

  const res = await fetch(apiUrl(repo, GITHUB_FILE_PATH), {
    method:  'PUT',
    headers: authHeaders(token),
    body:    JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(classifyError(res.status, errBody));
  }

  const data = await res.json();
  return data.content.sha;
}

/**
 * Validate that a repo + token pair is accessible.
 * Also checks/creates data.json.
 * Returns { sha, initialData } — initialData is null if file was just created.
 */
async function connectAndInit(repo, token, currentState) {
  // 1. Validate repo access
  const repoRes = await fetch(`https://api.github.com/repos/${repo}`, {
    headers: authHeaders(token),
  });

  if (!repoRes.ok) {
    const body = await repoRes.json().catch(() => ({}));
    throw new Error(classifyError(repoRes.status, body));
  }

  // 2. Check if data.json exists
  const existing = await fetchFile(repo, token);

  if (existing) {
    // File already exists → return it so caller can decide to hydrate
    return { sha: existing.sha, initialData: existing.content };
  } else {
    // Create data.json with current state
    const newSha = await pushFile(repo, token, currentState, null);
    return { sha: newSha, initialData: null };
  }
}

// ── Hook ───────────────────────────────────────────────────────────────

/**
 * useGithubSync(state, onRemoteData)
 *
 * @param {object}   state         — current app state (from useReducer)
 * @param {function} onRemoteData  — callback(remoteState) called when remote data should replace local
 *
 * @returns {object} {
 *   syncConfig,       // current sync config or null
 *   isSyncing,        // boolean
 *   lastSyncedAt,     // Date | null
 *   error,            // string | null
 *   syncNow,          // () => Promise<void>
 *   connect,          // (repo, token) => Promise<void>
 *   resetSync,        // () => void
 * }
 */
export function useGithubSync(state, onRemoteData) {
  const [syncConfig,   setSyncConfig]   = useState(getSyncConfig);
  const [isSyncing,    setIsSyncing]    = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [error,        setError]        = useState(null);

  // Refs to avoid stale closures
  const stateRef      = useRef(state);
  const syncConfigRef = useRef(syncConfig);
  const debounceTimer = useRef(null);
  const pollTimer     = useRef(null);
  const isMounted     = useRef(true);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    syncConfigRef.current = syncConfig;
  }, [syncConfig]);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // ── Pull from GitHub ──
  const pullNow = useCallback(async () => {
    const cfg = syncConfigRef.current;
    if (!cfg?.enabled) return;

    try {
      setIsSyncing(true);
      setError(null);
      const result = await fetchFile(cfg.repo, cfg.token);
      if (!result) return; // file gone; skip

      // Update SHA
      const newCfg = { ...cfg, sha: result.sha };
      saveSyncConfig(newCfg);
      if (isMounted.current) setSyncConfig(newCfg);
      syncConfigRef.current = newCfg;

      // Hydrate if remote is newer (last-write-wins via timestamp)
      const remoteTs = result.content?._syncedAt || 0;
      const localTs  = stateRef.current?._syncedAt || 0;
      if (remoteTs > localTs) {
        onRemoteData(result.content);
      }

      if (isMounted.current) setLastSyncedAt(new Date());
    } catch (e) {
      if (isMounted.current) setError(e.message);
    } finally {
      if (isMounted.current) setIsSyncing(false);
    }
  }, [onRemoteData]);

  // ── Push to GitHub ──
  const pushNow = useCallback(async () => {
    const cfg = syncConfigRef.current;
    if (!cfg?.enabled) return;

    try {
      setIsSyncing(true);
      setError(null);
      const stateWithTs = { ...stateRef.current, _syncedAt: Date.now() };
      const newSha = await pushFile(cfg.repo, cfg.token, stateWithTs, cfg.sha || null);

      const newCfg = { ...cfg, sha: newSha };
      saveSyncConfig(newCfg);
      if (isMounted.current) {
        setSyncConfig(newCfg);
        setLastSyncedAt(new Date());
      }
      syncConfigRef.current = newCfg;
    } catch (e) {
      if (isMounted.current) setError(e.message);
    } finally {
      if (isMounted.current) setIsSyncing(false);
    }
  }, []);

  // ── Debounced push on state change ──
  useEffect(() => {
    if (!syncConfig?.enabled) return;

    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      pushNow();
    }, DEBOUNCE_MS);

    return () => clearTimeout(debounceTimer.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, syncConfig?.enabled]);

  // ── Periodic pull ──
  useEffect(() => {
    if (!syncConfig?.enabled) return;

    // Initial pull on enable
    pullNow();

    pollTimer.current = setInterval(pullNow, POLL_INTERVAL_MS);
    return () => clearInterval(pollTimer.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncConfig?.enabled]);

  // ── connect ──
  const connect = useCallback(async (repo, token) => {
    setIsSyncing(true);
    setError(null);
    try {
      const { sha, initialData } = await connectAndInit(repo, token, stateRef.current);
      const cfg = { enabled: true, repo, token, sha };
      saveSyncConfig(cfg);
      setSyncConfig(cfg);
      syncConfigRef.current = cfg;
      setLastSyncedAt(new Date());

      // If remote had existing data, hydrate it
      if (initialData) {
        onRemoteData(initialData);
      }
    } catch (e) {
      setError(e.message);
      throw e; // re-throw so UI can handle
    } finally {
      setIsSyncing(false);
    }
  }, [onRemoteData]);

  // ── resetSync ──
  const resetSync = useCallback(() => {
    clearTimeout(debounceTimer.current);
    clearInterval(pollTimer.current);
    clearSyncConfig();
    setSyncConfig(null);
    syncConfigRef.current = null;
    setError(null);
    setLastSyncedAt(null);
  }, []);

  return {
    syncConfig,
    isSyncing,
    lastSyncedAt,
    error,
    syncNow:   pushNow,
    pullNow,
    connect,
    resetSync,
  };
}
