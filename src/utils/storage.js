// ── Storage Utilities ──────────────────────────────────────────────────

const STORAGE_KEY = 'neoprep_v1';

/** Load full app state from localStorage */
export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn('[NeoPrep] Failed to load state:', e);
    return null;
  }
}

/**
 * Persist full app state to localStorage.
 *
 * FIX: On QuotaExceededError, emits a custom DOM event so the UI can
 *      show a warning banner instead of silently losing data.
 */
export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    if (e.name === 'QuotaExceededError' || e.code === 22) {
      window.dispatchEvent(new CustomEvent('neoprep:storage-full'));
    }
    console.warn('[NeoPrep] Failed to save state:', e);
  }
}

/** Export app state as a downloadable JSON file */
export function exportJSON(state) {
  const blob = new Blob(
    [JSON.stringify({
      neoprep_export: true,
      version: 1,
      exportedAt: new Date().toISOString(),
      data: state,
    }, null, 2)],
    { type: 'application/json' }
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `neoprep_backup_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Import and validate state from JSON file. Returns parsed state or throws.
 *
 * FIX: Now validates the shape of the imported data before accepting it,
 *      preventing corrupted backups from silently overwriting good state.
 */
export async function importJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (!parsed.neoprep_export) {
          throw new Error('Not a valid NeoPrep backup file.');
        }
        if (!validateImportShape(parsed.data)) {
          throw new Error('Backup file is corrupted or from an incompatible version.');
        }
        resolve(parsed.data);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsText(file);
  });
}

/**
 * Basic shape validation for imported state.
 * Prevents accepting a totally malformed object.
 */
function validateImportShape(data) {
  return (
    data &&
    typeof data === 'object' &&
    data.config &&
    Array.isArray(data.config.subjects) &&
    data.config.subjects.length > 0 &&
    typeof data.logs === 'object' &&
    data.xp &&
    typeof data.xp.total === 'number'
  );
}

/**
 * Get approximate localStorage usage for the NeoPrep key in KB.
 * Displayed in Settings so users know if their storage is getting full.
 */
export function getStorageUsedKB() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || '';
    // UTF-16: each char is 2 bytes in JS strings
    return Math.round((raw.length * 2) / 1024);
  } catch {
    return 0;
  }
}

/** Clear all app data */
export function clearState() {
  localStorage.removeItem(STORAGE_KEY);
}
