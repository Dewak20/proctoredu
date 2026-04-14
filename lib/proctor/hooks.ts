'use client'

import { useEffect, useRef, useCallback } from 'react'
import { ViolationType } from '@/types'

interface UseProctorOptions {
  sessionId: string
  onViolation?: (jenis: ViolationType, durasi?: number) => void
  enabled?: boolean
}

// Deteksi perangkat touch (HP/tablet)
const isTouchDevice = typeof window !== 'undefined'
  ? ('ontouchstart' in window || navigator.maxTouchPoints > 0)
  : false

export function useProctor({ sessionId, onViolation, enabled = true }: UseProctorOptions) {
  const blurStartRef = useRef<number | null>(null)
  const tabHiddenStartRef = useRef<number | null>(null)
  // Untuk melacak apakah fullscreen pernah berhasil aktif
  const fullscreenActiveRef = useRef(false)

  const logViolation = useCallback(
    async (jenis: ViolationType, durasi_detik?: number) => {
      if (!enabled) return
      onViolation?.(jenis, durasi_detik)
      try {
        await fetch('/api/siswa/violation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId, jenis, durasi_detik }),
        })
      } catch {}
    },
    [sessionId, onViolation, enabled]
  )

  useEffect(() => {
    if (!enabled) return

    // Fullscreen: hanya enforce di desktop (di HP sering tidak didukung & sebabkan false positive)
    if (!isTouchDevice) {
      const el = document.documentElement
      if (el.requestFullscreen) {
        el.requestFullscreen()
          .then(() => { fullscreenActiveRef.current = true })
          .catch(() => {})
      }
    }

    // --- Fullscreen exit ---
    const onFullscreenChange = () => {
      // Hanya catat jika fullscreen pernah aktif sebelumnya (hindari false positive)
      if (!document.fullscreenElement && fullscreenActiveRef.current) {
        logViolation('fullscreen_exit')
        // Coba masuk fullscreen kembali
        document.documentElement.requestFullscreen?.().catch(() => {})
      }
      fullscreenActiveRef.current = !!document.fullscreenElement
    }

    // --- Tab/app switch (visibilitychange) ---
    // Paling andal di HP dan desktop
    const onVisibilityChange = () => {
      if (document.hidden) {
        tabHiddenStartRef.current = Date.now()
        logViolation('tab_switch')
      } else if (tabHiddenStartRef.current) {
        const durasi = Math.round((Date.now() - tabHiddenStartRef.current) / 1000)
        tabHiddenStartRef.current = null
        if (durasi >= 2) {
          // Log durasi jika cukup lama (>= 2 detik)
          logViolation('tab_switch', durasi)
        }
      }
    }

    // --- Blur/focus: HANYA di desktop ---
    // Di HP: keyboard virtual menyebabkan window blur saat mengetik → false positive
    // Gunakan visibilitychange saja untuk deteksi di HP
    const onBlur = isTouchDevice ? undefined : () => {
      blurStartRef.current = Date.now()
      // TIDAK log di sini — tunggu sampai focus kembali untuk tahu durasinya
    }

    const onFocus = isTouchDevice ? undefined : () => {
      if (blurStartRef.current) {
        const durasi = Math.round((Date.now() - blurStartRef.current) / 1000)
        blurStartRef.current = null
        // Hanya catat jika pergi >= 1 detik (hindari false positive dari klik cepat)
        if (durasi >= 1) {
          logViolation('blur', durasi)
        }
      }
    }

    // --- Copy/Cut ---
    const onContextMenu = (e: MouseEvent) => e.preventDefault()
    const onCopy = (e: ClipboardEvent) => { e.preventDefault(); logViolation('copy_attempt') }
    const onCut = (e: ClipboardEvent) => { e.preventDefault(); logViolation('copy_attempt') }
    // Paste TIDAK diblokir: keyboard HP (autocomplete, dikte suara) menggunakan clipboard internal

    document.addEventListener('fullscreenchange', onFullscreenChange)
    document.addEventListener('visibilitychange', onVisibilityChange)
    if (onBlur) window.addEventListener('blur', onBlur)
    if (onFocus) window.addEventListener('focus', onFocus)
    document.addEventListener('contextmenu', onContextMenu)
    document.addEventListener('copy', onCopy)
    document.addEventListener('cut', onCut)

    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      if (onBlur) window.removeEventListener('blur', onBlur)
      if (onFocus) window.removeEventListener('focus', onFocus)
      document.removeEventListener('contextmenu', onContextMenu)
      document.removeEventListener('copy', onCopy)
      document.removeEventListener('cut', onCut)
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    }
  }, [enabled, logViolation])
}
