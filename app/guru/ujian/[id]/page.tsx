'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Exam, ExamQuestion, Class, StudentSession, Violation } from '@/types'
import { Badge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { toast } from '@/components/ui/Toast'
import { clsx } from 'clsx'

type SessionWithViolations = StudentSession & { violations: Violation[] }

const statusBadge = { draft: 'gray' as const, aktif: 'green' as const, selesai: 'indigo' as const }
const statusLabel = { draft: 'Draft', aktif: 'Aktif', selesai: 'Selesai' }

export default function DetailUjianPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [exam, setExam] = useState<Exam | null>(null)
  const [questions, setQuestions] = useState<ExamQuestion[]>([])
  const [kelas, setKelas] = useState<Class | null>(null)
  const [sessions, setSessions] = useState<SessionWithViolations[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const load = useCallback(async () => {
    const supabase = createClient()
    const [{ data: e }, { data: q }, { data: c }] = await Promise.all([
      supabase.from('exams').select('*').eq('id', id).single(),
      supabase.from('exam_questions').select('*, question_bank(*)').eq('exam_id', id).order('urutan'),
      supabase.from('classes').select('*').eq('exam_id', id).order('created_at').limit(1).single(),
    ])
    setExam(e)
    setQuestions(q || [])
    setKelas(c || null)
    setLoading(false)

    // Ambil sesi via API (service role)
    const res = await fetch(`/api/guru/ujian/${id}/monitor`)
    if (res.ok) {
      const data = await res.json()
      setSessions(data.sessions || [])
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const handleToggleAktif = async () => {
    if (!kelas) return
    const supabase = createClient()
    const newAktif = !kelas.aktif
    if (newAktif && exam?.status === 'draft') {
      await supabase.from('exams').update({ status: 'aktif' }).eq('id', id)
      setExam(prev => prev ? { ...prev, status: 'aktif' } : prev)
    }
    const { error } = await supabase.from('classes').update({ aktif: newAktif }).eq('id', kelas.id)
    if (error) { toast.error('Gagal mengubah status'); return }
    setKelas(prev => prev ? { ...prev, aktif: newAktif } : prev)
    toast.success(newAktif ? 'Token diaktifkan — siswa sudah bisa masuk' : 'Token dinonaktifkan')
  }

  const handleSelesai = async () => {
    if (!confirm('Tandai ujian sebagai selesai? Token akan dinonaktifkan.')) return
    const supabase = createClient()
    await supabase.from('exams').update({ status: 'selesai' }).eq('id', id)
    if (kelas) await supabase.from('classes').update({ aktif: false }).eq('id', kelas.id)
    setExam(prev => prev ? { ...prev, status: 'selesai' } : prev)
    setKelas(prev => prev ? { ...prev, aktif: false } : prev)
    toast.success('Ujian ditandai selesai')
  }

  const handleDeleteExam = async () => {
    if (!confirm('Hapus ujian ini beserta semua data siswa? Tindakan ini tidak bisa dibatalkan.')) return
    const supabase = createClient()
    await supabase.from('exams').delete().eq('id', id)
    router.push('/guru/dashboard')
  }

  const handleDeleteSession = async (sessionId: string, nama: string) => {
    if (!confirm(`Hapus sesi "${nama}"? Semua jawaban dan catatan pelanggaran akan ikut terhapus.`)) return
    const res = await fetch(`/api/guru/ujian/${id}/monitor`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId }),
    })
    if (!res.ok) { toast.error('Gagal menghapus sesi'); return }
    setSessions(prev => prev.filter(s => s.id !== sessionId))
    toast.success(`Sesi ${nama} dihapus`)
  }

  const handleCopyToken = () => {
    if (!kelas) return
    navigator.clipboard.writeText(kelas.token).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="animate-spin h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full" />
    </div>
  )
  if (!exam) return <div className="py-12 text-center text-gray-400">Ujian tidak ditemukan</div>

  const selesaiCount = sessions.filter(s => s.status === 'selesai').length
  const mengerjakanCount = sessions.filter(s => s.status === 'mengerjakan').length

  return (
    <div className="space-y-6 max-w-4xl">

      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge variant={statusBadge[exam.status]}>{statusLabel[exam.status]}</Badge>
              {exam.sumber === 'google_form' && <Badge variant="indigo">Google Form</Badge>}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">{exam.judul}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {exam.mata_pelajaran || 'Tanpa mata pelajaran'} · {exam.durasi_menit} menit
              {' · '}Dibuat {new Date(exam.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Primary actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {exam.status === 'aktif' && (
              <Button variant="danger" size="sm" onClick={handleSelesai}>Selesaikan Ujian</Button>
            )}
            {exam.status !== 'aktif' && (
              <Button variant="danger" size="sm" onClick={handleDeleteExam}>Hapus Ujian</Button>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-3 mt-5">
          {[
            { label: 'Soal',      value: exam.sumber === 'google_form' ? '—' : String(questions.length), color: 'text-gray-900' },
            { label: 'Siswa',     value: String(sessions.length),   color: 'text-gray-900' },
            { label: 'Mengerjakan', value: String(mengerjakanCount), color: 'text-blue-600' },
            { label: 'Selesai',   value: String(selesaiCount),      color: 'text-green-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-3 text-center shadow-sm">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Token card */}
      {kelas && (
        <div className={clsx(
          'rounded-xl border-2 p-5',
          kelas.aktif ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white'
        )}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-semibold text-gray-900">Token Ujian</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {kelas.aktif ? 'Siswa dapat masuk sekarang' : 'Token nonaktif — siswa belum bisa masuk'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={kelas.aktif ? 'green' : 'gray'}>{kelas.aktif ? 'Aktif' : 'Nonaktif'}</Badge>
              {exam.status !== 'selesai' && (
                <Button
                  size="sm"
                  variant={kelas.aktif ? 'secondary' : 'primary'}
                  onClick={handleToggleAktif}
                >
                  {kelas.aktif ? 'Nonaktifkan' : 'Aktifkan'}
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center justify-center rounded-xl bg-white border border-gray-200 py-4 px-6">
              <span className="font-mono text-4xl font-bold tracking-widest text-indigo-700 select-all">
                {kelas.token}
              </span>
            </div>
            <button
              onClick={handleCopyToken}
              className="flex-shrink-0 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              {copied ? '✓ Tersalin' : 'Salin'}
            </button>
          </div>

          <p className="text-xs text-gray-400 mt-3 text-center">
            Siswa buka halaman ujian → masukkan token → ketik nama → mulai
          </p>
        </div>
      )}

      {/* Link cepat */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { href: `/guru/ujian/${id}/monitor`,    label: 'Live Monitor',  active: exam.status === 'aktif' },
          { href: `/guru/ujian/${id}/nilai-essay`, label: 'Nilai Essay',   active: false },
          { href: `/guru/ujian/${id}/laporan`,    label: 'Laporan',       active: false },
        ].map(link => (
          <Link key={link.href} href={link.href}>
            <div className={clsx(
              'rounded-xl border p-4 text-center cursor-pointer transition-colors hover:shadow-sm',
              link.active
                ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            )}>
              {link.active && (
                <span className="inline-block h-2 w-2 rounded-full bg-green-500 animate-pulse mb-2" />
              )}
              <p className="text-sm font-medium">{link.label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Daftar soal */}
      {exam.sumber !== 'google_form' && questions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Daftar Soal</h2>
            <span className="text-sm text-gray-500">{questions.length} soal</span>
          </div>
          <div className="divide-y divide-gray-50">
            {questions.map((eq, i) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const q = (eq as any).question_bank
              return (
                <div key={eq.id} className="flex items-start gap-3 px-5 py-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-xs font-medium flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 line-clamp-2">{q?.teks_soal}</p>
                  </div>
                  <Badge variant="gray">{q?.tipe}</Badge>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Sesi Siswa */}
      {sessions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Sesi Siswa</h2>
            <span className="text-sm text-gray-500">{sessions.length} siswa</span>
          </div>
          <div className="divide-y divide-gray-50">
            {sessions.map(s => {
              const violations = s.violations?.length ?? 0
              return (
                <div key={s.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{s.nama_siswa}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {s.mulai_at ? `Mulai ${new Date(s.mulai_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}` : '—'}
                      {violations > 0 && ` · ${violations} pelanggaran`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {s.skor_total !== null && (
                      <span className="text-sm font-semibold text-gray-900">{s.skor_total}</span>
                    )}
                    <Badge variant={
                      s.status === 'selesai' ? 'green' :
                      s.status === 'timeout' ? 'gray' : 'blue'
                    }>
                      {s.status === 'selesai' ? 'Selesai' : s.status === 'timeout' ? 'Timeout' : 'Mengerjakan'}
                    </Badge>
                    <button
                      onClick={() => handleDeleteSession(s.id, s.nama_siswa)}
                      className="px-2.5 py-1 rounded-lg border border-red-200 text-red-500 text-xs font-medium hover:bg-red-50 transition-colors"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
