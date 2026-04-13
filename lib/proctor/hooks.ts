'use client'

import { useEffect, useRef, useCallback } from 'react'
import { ViolationType } from '@/types'

interface UseProctorOptions {
  sessionId: string
  onViolation?: (jenis: ViolationType, durasi?: number) => void
  enabled?: boolean
}

export function useProctor({ sessionId, onViolation, enabled = true }: UseProctorOptions) {
  const blurStartRef = useRef<number | null>(null)
  const tabHiddenStartRef = useRef<number | null>(null)

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

    const el = document.documentElement
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {})

    const onFullscreenChange = () => {
      if (!document.fullscreenElement) {
        logViolation('fullscreen_exit')
        el.requestFullscreen().catch(() => {})
      }
    }

    const onVisibilityChange = () => {
      if (document.hidden) {
        tabHiddenStartRef.current = Date.now()
        logViolation('tab_switch')
      } else if (tabHiddenStartRef.current) {
        const durasi = Math.round((Date.now() - tabHiddenStartRef.current) / 1000)
        tabHiddenStartRef.current = null
        logViolation('tab_switch', durasi)
      }
    }

    const onBlur = () => { blurStartRef.current = Date.now(); logViolation('blur') }
    const onFocus = () => {
      if (blurStartRef.current) {
        const durasi = Math.round((Date.now() - blurStartRef.current) / 1000)
        blurStartRef.current = null
        logViolation('blur', durasi)
      }
    }

    const onContextMenu = (e: MouseEvent) => e.preventDefault()
    const onCopy = (e: ClipboardEvent) => { e.preventDefault(); logViolation('copy_attempt') }
    const onCut = (e: ClipboardEvent) => { e.preventDefault(); logViolation('copy_attempt') }
    const onPaste = (e: ClipboardEvent) => e.preventDefault()

    document.addEventListener('fullscreenchange', onFullscreenChange)
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('blur', onBlur)
    window.addEventListener('focus', onFocus)
    document.addEventListener('contextmenu', onContextMenu)
    document.addEventListener('copy', onCopy)
    document.addEventListener('cut', onCut)
    document.addEventListener('paste', onPaste)

    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('contextmenu', onContextMenu)
      document.removeEventListener('copy', onCopy)
      document.removeEventListener('cut', onCut)
      document.removeEventListener('paste', onPaste)
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    }
  }, [enabled, logViolation])
}
