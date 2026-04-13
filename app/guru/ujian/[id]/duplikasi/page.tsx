'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Exam } from '@/types'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { toast } from '@/components/ui/Toast'
import { generateToken } from '@/lib/token'

export default function DuplikasiPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [exam, setExam] = useState<Exam | null>(null)
  const [judulBaru, setJudulBaru] = useState('')
  const [namaKelas, setNamaKelas] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('exams').select('*').eq('id', id).single()
      .then(({ data }) => { setExam(data); if (data) setJudulBaru(`${data.judul} (Duplikat)`) })
  }, [id])

  const handleDuplikasi = async () => {
    if (!judulBaru.trim() || !namaKelas.trim()) { toast.error('Judul dan nama kelas wajib diisi'); return }
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !exam) return

      const { data: newExam } = await supabase.from('exams').insert({
        teacher_id: user.id, judul: judulBaru,
        mata_pelajaran: exam.mata_pelajaran,
        durasi_menit: exam.durasi_menit,
        sumber: exam.sumber,
        bobot_pilgan: exam.bobot_pilgan,
        bobot_essay: exam.bobot_essay,
      }).select().single()

      const { data: origQuestions } = await supabase
        .from('exam_questions').select('question_id, urutan').eq('exam_id', id)
      if (origQuestions?.length) {
        await supabase.from('exam_questions').insert(
          origQuestions.map(q => ({ exam_id: newExam.id, question_id: q.question_id, urutan: q.urutan }))
        )
      }

      await supabase.from('classes').insert({
        exam_id: newExam.id, nama_kelas: namaKelas, token: generateToken(), aktif: false,
      })

      toast.success('Ujian berhasil diduplikasi')
      router.push(`/guru/ujian/${newExam.id}`)
    } catch { toast.error('Gagal menduplikasi ujian') } finally { setLoading(false) }
  }

  if (!exam) return <div className="py-12 text-center text-gray-400">Memuat...</div>

  return (
    <div className="max-w-md space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Duplikasi Ujian</h1>
      <Card className="space-y-4">
        <p className="text-sm text-gray-500">Duplikasi ujian <strong>{exam.judul}</strong> dengan kelas baru.</p>
        <Input label="Judul Ujian Baru" value={judulBaru} onChange={e => setJudulBaru(e.target.value)} />
        <Input label="Nama Kelas Baru" value={namaKelas} onChange={e => setNamaKelas(e.target.value)} placeholder="Kelas 9B" />
        <div className="flex gap-3">
          <Button onClick={handleDuplikasi} loading={loading}>Duplikasi</Button>
          <Button variant="secondary" onClick={() => router.back()}>Batal</Button>
        </div>
      </Card>
    </div>
  )
}
