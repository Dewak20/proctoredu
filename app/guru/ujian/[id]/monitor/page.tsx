'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { StudentSession, Violation } from '@/types'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import SiswaMonitorCard from '@/components/guru/SiswaMonitorCard'
import { toast } from '@/components/ui/Toast'

type SessionWithViolations = StudentSession & { violations: Violation[] }

export default function MonitorPage() {
  const { id } = useParams<{ id: string }>()
  const [examJudul, setExamJudul] = useState('')
  const [sessions, setSessions] = useState<SessionWithViolations[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const alertRef = useRef<HTMLAudioElement | null>(null)
  const prevViolationCount = useRef<Record<string, number>>({})

  const load = useCallback(async () => {
    const res = await fetch(`/api/guru/ujian/${id}/monitor`)
    if (!res.ok) return
    const data = await res.json()
    if (data.exam?.judul) setExamJudul(data.exam.judul)

    // Cek pelanggaran baru → bunyikan alert
    const newSessions: SessionWithViolations[] = data.sessions || []
    newSessions.forEach((s: SessionWithViolations) => {
      const prev = prevViolationCount.current[s.id] ?? 0
      const curr = s.violations.length
      if (curr > prev && alertRef.current) {
        const tabSwitches = s.violations.filter(v => v.jenis === 'tab_switch').length
        if (tabSwitches >= 5) alertRef.current.play().catch(() => {})
      }
      prevViolationCount.current[s.id] = curr
    })

    setSessions(newSessions)
    setLastUpdated(new Date())
    setLoading(false)
  }, [id])

  useEffect(() => {
    load()

    // Auto-refresh setiap 8 detik sebagai fallback
    const interval = setInterval(load, 8000)

    // Realtime sebagai trigger tambahan
    const supabase = createClient()
    const sub = supabase.channel(`monitor-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'student_sessions' }, load)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'violations' }, load)
      .subscribe()

    return () => {
      clearInterval(interval)
      supabase.removeChannel(sub)
    }
  }, [id, load])

  const handleReset = async (sessionId: string) => {
    if (!confirm('Reset sesi siswa ini? Siswa dapat masuk kembali.')) return
    const res = await fetch(`/api/guru/ujian/${id}/monitor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId }),
    })
    if (!res.ok) { toast.error('Gagal reset sesi'); return }
    toast.success('Sesi direset')
    load()
  }

  const selesai = sessions.filter(s => s.status === 'selesai').length
  const mengerjakan = sessions.filter(s => s.status === 'mengerjakan').length
  const timeout = sessions.filter(s => s.status === 'timeout').length

  return (
    <div className="space-y-6">
      <audio ref={alertRef} />
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Live Monitor</h1>
          <p className="text-sm text-gray-500">{examJudul}</p>
          {lastUpdated && (
            <p className="text-xs text-gray-400">Update: {lastUpdated.toLocaleTimeString('id-ID')}</p>
          )}
        </div>
        <Button variant="secondary" size="sm" onClick={load}>Refresh</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center">
          <p className="text-2xl font-bold text-blue-600">{mengerjakan}</p>
          <p className="text-xs text-gray-500 mt-1">Mengerjakan</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-green-600">{selesai}</p>
          <p className="text-xs text-gray-500 mt-1">Selesai</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-gray-400">{timeout}</p>
          <p className="text-xs text-gray-500 mt-1">Timeout</p>
        </Card>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Memuat...</div>
      ) : sessions.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-gray-400">Belum ada siswa yang masuk ujian</p>
          <p className="text-xs text-gray-400 mt-1">Halaman ini auto-refresh setiap 8 detik</p>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sessions.map(s => (
            <SiswaMonitorCard key={s.id} session={s} onReset={handleReset} />
          ))}
        </div>
      )}
    </div>
  )
}
