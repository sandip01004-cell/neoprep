import { useState, useEffect } from 'react'
import styles from './InstallPrompt.module.css'

const BASE = import.meta.env.BASE_URL

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem('pwa-dismissed')) return

    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setTimeout(() => setShowBanner(true), 3000)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    setShowBanner(false)
    if (outcome === 'dismissed') sessionStorage.setItem('pwa-dismissed', '1')
  }

  const handleDismiss = () => {
    setShowBanner(false)
    sessionStorage.setItem('pwa-dismissed', '1')
  }

  if (!showBanner) return null

  return (
    <div className={styles.banner} role="dialog" aria-label="Install NeoPrep app">
      <div className={styles.left}>
        <img
          src={`${BASE}pwa-192x192.png`}
          alt="NeoPrep icon"
          className={styles.icon}
          width={40}
          height={40}
        />
        <div className={styles.text}>
          <p className={styles.title}>Install NeoPrep</p>
          <p className={styles.subtitle}>Add to home screen for the best experience</p>
        </div>
      </div>
      <div className={styles.actions}>
        <button id="pwa-install-btn" className={styles.installBtn} onClick={handleInstall}>
          Install
        </button>
        <button id="pwa-dismiss-btn" className={styles.closeBtn} onClick={handleDismiss} aria-label="Dismiss">
          ✕
        </button>
      </div>
    </div>
  )
}
