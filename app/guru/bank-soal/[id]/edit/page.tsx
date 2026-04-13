'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import SoalForm, { SoalFormData } from '@/components/guru/SoalForm'
import { Card } from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/Toast'
import { Question } from '@/types'

export default function EditSoalPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [question, setQuestion] = useState<Question | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('question_bank').select('*').eq('id', id).single()
      .then(({ data }) => setQuestion(data))
  }, [id])

  const handleSubmit = async (data: SoalFormData) => {
    const supabase = createClient()
    const tags = data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : []
    const { error } = await supabase.from('question_bank').update({
      mata_pelajaran: data.mata_pelajaran || null,
      tipe: data.tipe,
      teks_soal: data.teks_soal,
      pilihan_a: data.pilihan_a || null,
      pilihan_b: data.pilihan_b || null,
      pilihan_c: data.pilihan_c || null,
      pilihan_d: data.pilihan_d || null,
      kunci_jawaban: data.kunci_jawaban || null,
      tags: tags.length > 0 ? tags : null,
    }).eq('id', id)
    if (error) { toast.error('Gagal menyimpan perubahan'); return }
    toast.success('Soal berhasil diperbarui')
    router.push('/guru/bank-soal')
  }

  if (!question) return <div className="py-12 text-center text-gray-400">Memuat...</div>

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Edit Soal</h1>
      <Card>
        <SoalForm
          initialData={{ ...question, tags: question.tags?.join(', ') || '' }}
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
          submitLabel="Simpan Perubahan"
        />
      </Card>
    </div>
  )
}
