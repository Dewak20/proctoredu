'use client'

import { useEffect, useRef } from 'react'

const SYNC_INTERVAL = 15000

export function useAutoSave(
  sessionId: string,
  answers: Record<string, string>,
  enabled = true
) {
  const isOnlineRef = useRef(true)

  const syncToSupabase = async (data: Record<string, string>) => {
    if (!enabled || !sessionId) return
    try {
      await fetch('/api/siswa/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, answers: data }),
      })
    } catch {}
  }

  useEffect(() => {
    const onOnline = () => { isOnlineRef.current = true; syncToSupabase(answers) }
    const onOffline = () => { isOnlineRef.current = false }
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  })

  useEffect(() => {
    if (!enabled) return
    const interval = setInterval(() => {
      if (isOnlineRef.current) syncToSupabase(answers)
    }, SYNC_INTERVAL)
    return () => clearInterval(interval)
  }, [answers, enabled, sessionId])
}
