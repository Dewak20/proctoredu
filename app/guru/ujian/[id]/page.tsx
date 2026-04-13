'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Exam, ExamQuestion, Class } from '@/types'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import KelasManager from '@/components/guru/KelasManager'
import { toast } from '@/components/ui/Toast'
import { generateToken } from '@/lib/token'

export default function DetailUjianPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [exam, setExam] = useState<Exam | null>(null)
  const [questions, setQuestions] = useState<ExamQuestion[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const supabase = createClient()
    const [{ data: e }, { data: q }, { data: c }] = await Promise.all([
      supabase.from('exams').select('*').eq('id', id).single(),
      supabase.from('exam_questions').select('*, question_bank(*)').eq('exam_id', id).order('urutan'),
      supabase.from('classes').select('*').eq('exam_id', id).order('created_at'),
    ])
    setExam(e); setQuestions(q || []); setClasses(c || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  const handleAddClass = async (nama: string, siswaList: string[], token: string) => {
    const supabase = createClient()
    const { data, error } = await supabase.from('classes').insert({
      exam_id: id, nama_kelas: nama, token, aktif: false, siswa_list: siswaList,
    }).select().single()
    if (error) { toast.error('Gagal menambah kelas'); return }
    setClasses(prev => [...prev, data])
    toast.success('Kelas ditambahkan')
  }

  const handleToggleAktif = async (classId: string, aktif: boolean) => {
    const supabase = createClient()
    if (aktif && exam?.status === 'draft') {
      await supabase.from('exams').update({ status: 'aktif' }).eq('id', id)
      setExam(prev => prev ? { ...prev, status: 'aktif' } : prev)
    }
    const { error } = await supabase.from('classes').update({ aktif }).eq('id', classId)
    if (error) { toast.error('Gagal mengubah status kelas'); return }
    setClasses(prev => prev.map(c => c.id === classId ? { ...c, aktif } : c))
  }

  const handleDeleteClass = async (classId: string) => {
    if (!confirm('Hapus kelas ini?')) return
    const supabase = createClient()
    await supabase.from('classes').delete().eq('id', classId)
    setClasses(prev => prev.filter(c => c.id !== classId))
    toast.success('Kelas dihapus')
  }

  const handleSelesai = async () => {
    if (!confirm('Tandai ujian sebagai selesai? Token akan nonaktif.')) return
    const supabase = createClient()
    await supabase.from('exams').update({ status: 'selesai' }).eq('id', id)
    await supabase.from('classes').update({ aktif: false }).eq('exam_id', id)
    setExam(prev => prev ? { ...prev, status: 'selesai' } : prev)
    toast.success('Ujian ditandai selesai')
  }

  if (loading) return <div className="py-12 text-center text-gray-400">Memuat...</div>
  if (!exam) return <div className="py-12 text-center text-gray-400">Ujian tidak ditemukan</div>

  const statusBadge = { draft: 'gray' as const, aktif: 'green' as const, selesai: 'blue' as const }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
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
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-semibold text-gray-900 mb-4">Daftar Soal ({questions.length})</h2>
          {questions.length === 0 ? (
            <p className="text-sm text-gray-400">Belum ada soal</p>
          ) : (
            <div className="space-y-2">
              {questions.map((eq, i) => {
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

        <Card>
          <h2 className="font-semibold text-gray-900 mb-4">Kelas & Token</h2>
          <KelasManager
            classes={classes}
            onAddClass={handleAddClass}
            onToggleAktif={handleToggleAktif}
            onDeleteClass={handleDeleteClass}
            examStatus={exam.status}
          />
        </Card>
      </div>
    </div>
  )
}
