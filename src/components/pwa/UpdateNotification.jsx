import { useRegisterSW } from 'virtual:pwa-register/react'
import styles from './UpdateNotification.module.css'

export default function UpdateNotification() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('[PWA] SW registered:', r)
    },
    onRegisterError(err) {
      console.error('[PWA] SW registration error:', err)
    },
  })

  if (!needRefresh) return null

  return (
    <div className={styles.toast} role="alert" aria-live="polite">
      <span className={styles.emoji}>🚀</span>
      <div className={styles.text}>
        <p className={styles.title}>Update available!</p>
        <p className={styles.subtitle}>Reload to get the latest NeoPrep.</p>
      </div>
      <div className={styles.actions}>
        <button
          id="pwa-update-btn"
          className={styles.updateBtn}
          onClick={() => updateServiceWorker(true)}
        >
          Reload
        </button>
        <button
          id="pwa-update-close"
          className={styles.closeBtn}
          onClick={() => setNeedRefresh(false)}
          aria-label="Dismiss update"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
