'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Exam } from '@/types'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { toast } from '@/components/ui/Toast'

const statusBadge = { draft: 'gray' as const, aktif: 'green' as const, selesai: 'blue' as const }
const statusLabel = { draft: 'Draft', aktif: 'Aktif', selesai: 'Selesai' }

export default function DashboardPage() {
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('exams').select('*').order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) toast.error('Gagal memuat ujian')
        else setExams(data || [])
        setLoading(false)
      })
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus ujian ini?')) return
    const supabase = createClient()
    const { error } = await supabase.from('exams').delete().eq('id', id)
    if (error) toast.error('Gagal menghapus ujian')
    else { setExams(prev => prev.filter(e => e.id !== id)); toast.success('Ujian dihapus') }
  }

  if (loading) return <div className="text-center py-12 text-gray-400">Memuat...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <Link href="/guru/ujian/buat"><Button>+ Buat Ujian</Button></Link>
      </div>

      {exams.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-gray-400 mb-4">Belum ada ujian</p>
          <Link href="/guru/ujian/buat"><Button>Buat Ujian Pertama</Button></Link>
        </Card>
      ) : (
        <div className="grid gap-4">
          {exams.map((exam) => (
            <Card key={exam.id} className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-semibold text-gray-900 truncate">{exam.judul}</h2>
                  <Badge variant={statusBadge[exam.status]}>{statusLabel[exam.status]}</Badge>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {exam.mata_pelajaran || 'Tanpa mapel'} · {exam.durasi_menit} menit · {new Date(exam.created_at).toLocaleDateString('id-ID')}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                <Link href={`/guru/ujian/${exam.id}/monitor`}><Button size="sm" variant="ghost">Monitor</Button></Link>
                <Link href={`/guru/ujian/${exam.id}/laporan`}><Button size="sm" variant="ghost">Laporan</Button></Link>
                <Link href={`/guru/ujian/${exam.id}`}><Button size="sm" variant="secondary">Detail</Button></Link>
                {exam.status === 'draft' && (
                  <Button size="sm" variant="danger" onClick={() => handleDelete(exam.id)}>Hapus</Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
