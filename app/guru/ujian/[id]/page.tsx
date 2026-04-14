'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Exam, ExamQuestion, Class } from '@/types'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { toast } from '@/components/ui/Toast'

export default function DetailUjianPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [exam, setExam] = useState<Exam | null>(null)
  const [questions, setQuestions] = useState<ExamQuestion[]>([])
  const [kelas, setKelas] = useState<Class | null>(null)
  const [siswaCount, setSiswaCount] = useState(0)
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

    // Ambil jumlah sesi siswa via API (service role)
    if (c) {
      const res = await fetch(`/api/guru/ujian/${id}/monitor`)
      if (res.ok) {
        const data = await res.json()
        setSiswaCount((data.sessions || []).length)
      }
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
    if (!confirm('Tandai ujian sebagai selesai? Token akan nonaktif.')) return
    const supabase = createClient()
    await supabase.from('exams').update({ status: 'selesai' }).eq('id', id)
    if (kelas) await supabase.from('classes').update({ aktif: false }).eq('id', kelas.id)
    setExam(prev => prev ? { ...prev, status: 'selesai' } : prev)
    setKelas(prev => prev ? { ...prev, aktif: false } : prev)
    toast.success('Ujian selesai')
  }

  const handleCopyToken = () => {
    if (!kelas) return
    navigator.clipboard.writeText(kelas.token).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleDeleteExam = async () => {
    if (!confirm('Hapus ujian ini permanen?')) return
    const supabase = createClient()
    await supabase.from('exams').delete().eq('id', id)
    router.push('/guru/ujian')
  }

  if (loading) return <div className="py-12 text-center text-gray-400">Memuat...</div>
  if (!exam) return <div className="py-12 text-center text-gray-400">Ujian tidak ditemukan</div>

  const statusBadge = { draft: 'gray' as const, aktif: 'green' as const, selesai: 'blue' as const }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900">{exam.judul}</h1>
            <Badge variant={statusBadge[exam.status]}>{exam.status}</Badge>
          </div>
          <p className="text-sm text-gray-500">{exam.mata_pelajaran || 'Tanpa mapel'} · {exam.durasi_menit} menit</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href={`/guru/ujian/${id}/monitor`}><Button variant="secondary" size="sm">Live Monitor</Button></Link>
          <Link href={`/guru/ujian/${id}/nilai-essay`}><Button variant="secondary" size="sm">Nilai Essay</Button></Link>
          <Link href={`/guru/ujian/${id}/laporan`}><Button variant="secondary" size="sm">Laporan</Button></Link>
          <Link href={`/guru/ujian/${id}/duplikasi`}><Button variant="secondary" size="sm">Duplikasi</Button></Link>
          {exam.status === 'aktif' && <Button variant="danger" size="sm" onClick={handleSelesai}>Selesaikan</Button>}
          {exam.status === 'draft' && <Button variant="danger" size="sm" onClick={handleDeleteExam}>Hapus</Button>}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Daftar Soal */}
        <Card>
          <h2 className="font-semibold text-gray-900 mb-4">Daftar Soal ({questions.length})</h2>
          {exam.sumber === 'google_form' ? (
            <div className="rounded-lg bg-indigo-50 border border-indigo-100 p-3 text-sm text-indigo-700">
              Mode Google Form — soal diambil dari form yang terhubung
            </div>
          ) : questions.length === 0 ? (
            <p className="text-sm text-gray-400">Belum ada soal</p>
          ) : (
            <div className="space-y-2">
              {questions.map((eq, i) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const q = (eq as any).question_bank
                return (
                  <div key={eq.id} className="flex items-start gap-2 text-sm">
                    <span className="text-gray-400 w-5 flex-shrink-0">{i + 1}.</span>
                    <div>
                      <span className="text-gray-700 line-clamp-2">{q?.teks_soal}</span>
                      <Badge variant="gray" className="ml-2">{q?.tipe}</Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Token */}
        <Card>
          <h2 className="font-semibold text-gray-900 mb-4">Token Ujian</h2>
          {!kelas ? (
            <p className="text-sm text-gray-400">Token tidak ditemukan</p>
          ) : (
            <div className="space-y-4">
              {/* Token display */}
              <div className="flex items-center gap-3 rounded-xl bg-gray-50 border border-gray-200 p-4">
                <span className="flex-1 font-mono text-3xl font-bold tracking-widest text-indigo-700 select-all text-center">
                  {kelas.token}
                </span>
                <button
                  onClick={handleCopyToken}
                  className="flex-shrink-0 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  {copied ? 'Tersalin!' : 'Salin'}
                </button>
              </div>

              {/* Status + toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Status token</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {kelas.aktif ? 'Siswa dapat masuk ujian' : 'Siswa belum bisa masuk'}
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

              {/* Siswa count */}
              {siswaCount > 0 && (
                <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-2.5 text-sm text-blue-700">
                  <span className="font-bold">{siswaCount}</span> siswa sudah masuk ujian
                </div>
              )}

              {/* Cara masuk */}
              <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-xs text-gray-500 space-y-1">
                <p className="font-medium text-gray-700">Cara siswa masuk ujian:</p>
                <ol className="list-decimal pl-4 space-y-0.5">
                  <li>Buka halaman ujian</li>
                  <li>Masukkan token: <code className="font-mono font-bold text-indigo-600">{kelas.token}</code></li>
                  <li>Ketik nama lengkap dan mulai</li>
                </ol>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
