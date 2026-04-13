'use client'

import { useRouter } from 'next/navigation'
import SoalForm, { SoalFormData } from '@/components/guru/SoalForm'
import { Card } from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/Toast'

export default function BuatSoalPage() {
  const router = useRouter()

  const handleSubmit = async (data: SoalFormData) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const tags = data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : []
    const { error } = await supabase.from('question_bank').insert({
      teacher_id: user.id,
      mata_pelajaran: data.mata_pelajaran || null,
      tipe: data.tipe,
      teks_soal: data.teks_soal,
      pilihan_a: data.pilihan_a || null,
      pilihan_b: data.pilihan_b || null,
      pilihan_c: data.pilihan_c || null,
      pilihan_d: data.pilihan_d || null,
      kunci_jawaban: data.kunci_jawaban || null,
      tags: tags.length > 0 ? tags : null,
    })
    if (error) { toast.error('Gagal menyimpan soal'); return }
    toast.success('Soal berhasil ditambahkan')
    router.push('/guru/bank-soal')
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Tambah Soal Baru</h1>
      <Card><SoalForm onSubmit={handleSubmit} onCancel={() => router.back()} submitLabel="Simpan ke Bank Soal" /></Card>
    </div>
  )
}
