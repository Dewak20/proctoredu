'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { StudentSession, Exam, Violation } from '@/types'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import LaporanChart from '@/components/guru/LaporanChart'
import { exportToExcel, exportToPDF } from '@/lib/export'

export default function LaporanPage() {
  const { id } = useParams<{ id: string }>()
  const [exam, setExam] = useState<Exam | null>(null)
  const [sessions, setSessions] = useState<(StudentSession & { violations?: Violation[] })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: e } = await supabase.from('exams').select('*').eq('id', id).single()
      setExam(e)
      const { data: classes } = await supabase.from('classes').select('id').eq('exam_id', id)
      const classIds = (classes || []).map((c: any) => c.id)
      const { data: sess } = await supabase.from('student_sessions').select('*').in('class_id', classIds).order('skor_total', { ascending: false })
      const sessWithV = await Promise.all((sess || []).map(async s => {
        const { data: v } = await supabase.from('violations').select('*').eq('session_id', s.id)
        return { ...s, violations: v || [] }
      }))
      setSessions(sessWithV)
      setLoading(false)
    }
    load()
  }, [id])

  const selesai = sessions.filter(s => s.status !== 'mengerjakan' && s.skor_total !== null)
  const avgScore = selesai.length ? selesai.reduce((sum, s) => sum + (s.skor_total || 0), 0) / selesai.length : 0
  const maxScore = selesai.length ? Math.max(...selesai.map(s => s.skor_total || 0)) : 0
  const minScore = selesai.length ? Math.min(...selesai.map(s => s.skor_total || 0)) : 0

  const chartData = [0, 20, 40, 60, 80].map(lower => ({
    label: `${lower}-${lower + 19}`,
    count: selesai.filter(s => (s.skor_total || 0) >= lower && (s.skor_total || 0) < lower + 20).length,
  }))

  if (loading) return <div className="py-12 text-center text-gray-400">Memuat...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Laporan — {exam?.judul}</h1>
          <p className="text-sm text-gray-500">{sessions.length} siswa terdaftar · {selesai.length} selesai</p>
        </div>
        {exam && (
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => exportToExcel(sessions, exam)}>Export Excel</Button>
            <Button variant="secondary" size="sm" onClick={() => exportToPDF(sessions, exam)}>Export PDF</Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center">
          <p className="text-2xl font-bold text-indigo-600">{avgScore.toFixed(1)}</p>
          <p className="text-xs text-gray-500 mt-1">Rata-rata</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-green-600">{maxScore}</p>
          <p className="text-xs text-gray-500 mt-1">Tertinggi</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-red-500">{minScore}</p>
          <p className="text-xs text-gray-500 mt-1">Terendah</p>
        </Card>
      </div>

      <Card><LaporanChart data={chartData} title="Distribusi Nilai" /></Card>

      <Card padding={false}>
        <div className="px-5 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Daftar Nilai</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {sessions.map((s, i) => (
            <div key={s.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{s.nama_siswa}</p>
                <p className="text-xs text-gray-400">Pelanggaran: {s.violations?.length ?? 0}x</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-900">{s.skor_total ?? '-'}</span>
                <Badge variant={s.status === 'selesai' ? 'green' : s.status === 'timeout' ? 'gray' : 'blue'}>
                  {s.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
