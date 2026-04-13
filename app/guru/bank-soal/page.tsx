'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Question } from '@/types'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { toast } from '@/components/ui/Toast'

const tipeBadge = { pilgan: 'blue' as const, essay: 'yellow' as const, isian: 'green' as const }
const tipeLabel = { pilgan: 'Pilgan', essay: 'Essay', isian: 'Isian' }

export default function BankSoalPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.from('question_bank').select('*').order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) toast.error('Gagal memuat bank soal')
        else setQuestions(data || [])
        setLoading(false)
      })
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus soal ini?')) return
    const supabase = createClient()
    const { error } = await supabase.from('question_bank').delete().eq('id', id)
    if (error) toast.error('Gagal menghapus soal')
    else { setQuestions(prev => prev.filter(q => q.id !== id)); toast.success('Soal dihapus') }
  }

  const filtered = questions.filter(q =>
    q.teks_soal.toLowerCase().includes(search.toLowerCase()) ||
    (q.mata_pelajaran || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-gray-900">Bank Soal ({questions.length})</h1>
        <Link href="/guru/bank-soal/buat"><Button>+ Tambah Soal</Button></Link>
      </div>
      <div className="max-w-sm">
        <Input placeholder="Cari soal..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      {loading ? (
        <div className="text-center py-12 text-gray-400">Memuat...</div>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-gray-400">{search ? 'Soal tidak ditemukan' : 'Bank soal masih kosong'}</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((q) => (
            <Card key={q.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <Badge variant={tipeBadge[q.tipe]}>{tipeLabel[q.tipe]}</Badge>
                    {q.mata_pelajaran && <Badge variant="gray">{q.mata_pelajaran}</Badge>}
                  </div>
                  <p className="text-sm text-gray-800 line-clamp-2">{q.teks_soal}</p>
                  {q.tipe !== 'essay' && q.kunci_jawaban && (
                    <p className="text-xs text-green-600 mt-1">Kunci: {q.kunci_jawaban.toUpperCase()}</p>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Link href={`/guru/bank-soal/${q.id}/edit`}><Button size="sm" variant="secondary">Edit</Button></Link>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(q.id)}>Hapus</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
