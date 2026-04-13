'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { StudentSession, Violation, Exam } from '@/types'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import SiswaMonitorCard from '@/components/guru/SiswaMonitorCard'
import { toast } from '@/components/ui/Toast'

export default function MonitorPage() {
  const { id } = useParams<{ id: string }>()
  const [exam, setExam] = useState<Exam | null>(null)
  const [sessions, setSessions] = useState<(StudentSession & { violations: Violation[] })[]>([])
  const [loading, setLoading] = useState(true)
  const alertRef = useRef<HTMLAudioElement | null>(null)

  const load = async () => {
    const supabase = createClient()
    const { data: e } = await supabase.from('exams').select('*').eq('id', id).single()
    setExam(e)

    const { data: classes } = await supabase.from('classes').select('id').eq('exam_id', id)
    if (!classes?.length) { setLoading(false); return }

    const classIds = classes.map((c: { id: string }) => c.id)
    const { data: sess } = await supabase
      .from('student_sessions').select('*').in('class_id', classIds)

    const sessWithViolations = await Promise.all((sess || []).map(async (s: StudentSession) => {
      const { data: v } = await supabase.from('violations').select('*').eq('session_id', s.id)
      return { ...s, violations: v || [] }
    }))
    setSessions(sessWithViolations)
    setLoading(false)
  }

  useEffect(() => {
    load()
    const supabase = createClient()
    const sub = supabase.channel('monitor')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'student_sessions' }, () => load())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'violations' }, (payload) => {
        const v = payload.new as Violation
        setSessions(prev => prev.map(s => {
          if (s.id !== v.session_id) return s
          const newViolations = [...s.violations, v]
          const tabSwitches = newViolations.filter(x => x.jenis === 'tab_switch').length
          if (tabSwitches >= 5 && alertRef.current) alertRef.current.play().catch(() => {})
          return { ...s, violations: newViolations }
        }))
      })
      .subscribe()
    return () => { supabase.removeChannel(sub) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleReset = async (sessionId: string) => {
    if (!confirm('Reset sesi siswa ini? Siswa dapat masuk kembali.')) return
    const supabase = createClient()
    await supabase.from('student_sessions')
      .update({ status: 'mengerjakan', selesai_at: null })
      .eq('id', sessionId)
    toast.success('Sesi direset')
    load()
  }

  const selesai = sessions.filter(s => s.status === 'selesai').length
  const mengerjakan = sessions.filter(s => s.status === 'mengerjakan').length
  const timeout = sessions.filter(s => s.status === 'timeout').length

  return (
    <div className="space-y-6">
      <audio ref={alertRef} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Live Monitor</h1>
          <p className="text-sm text-gray-500">{exam?.judul}</p>
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
