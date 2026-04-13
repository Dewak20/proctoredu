'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Exam } from '@/types'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { toast } from '@/components/ui/Toast'

export default function EditUjianPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [exam, setExam] = useState<Exam | null>(null)
  const [form, setForm] = useState({ judul: '', mata_pelajaran: '', durasi_menit: 60 })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('exams').select('*').eq('id', id).single().then(({ data }) => {
      if (data) {
        setExam(data)
        setForm({ judul: data.judul, mata_pelajaran: data.mata_pelajaran || '', durasi_menit: data.durasi_menit })
      }
    })
  }, [id])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (exam?.status === 'selesai') { toast.error('Ujian sudah selesai, tidak bisa diedit'); return }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('exams').update({
      judul: form.judul,
      mata_pelajaran: form.mata_pelajaran || null,
      ...(exam?.status === 'draft' ? { durasi_menit: form.durasi_menit } : {}),
    }).eq('id', id)
    setLoading(false)
    if (error) { toast.error('Gagal menyimpan'); return }
    toast.success('Ujian diperbarui')
    router.push(`/guru/ujian/${id}`)
  }

  if (!exam) return <div className="py-12 text-center text-gray-400">Memuat...</div>

  return (
    <div className="max-w-md space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Edit Ujian</h1>
      {exam.status === 'selesai' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">Ujian sudah selesai, tidak bisa diedit.</div>
      )}
      <Card>
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Judul" value={form.judul} onChange={e => setForm({ ...form, judul: e.target.value })} required />
          <Input label="Mata Pelajaran" value={form.mata_pelajaran} onChange={e => setForm({ ...form, mata_pelajaran: e.target.value })} />
          {exam.status === 'draft' && (
            <Input label="Durasi (menit)" type="number" value={form.durasi_menit} onChange={e => setForm({ ...form, durasi_menit: parseInt(e.target.value) || 60 })} min={5} />
          )}
          <div className="flex gap-3">
            <Button type="submit" loading={loading} disabled={exam.status === 'selesai'}>Simpan</Button>
            <Button type="button" variant="secondary" onClick={() => router.back()}>Batal</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
