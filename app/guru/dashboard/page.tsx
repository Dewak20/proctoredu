'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Exam } from '@/types'
import { Badge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { toast } from '@/components/ui/Toast'

type Filter = 'semua' | 'aktif' | 'draft' | 'selesai'

const statusColor = {
  draft:   'border-l-gray-300',
  aktif:   'border-l-green-400',
  selesai: 'border-l-indigo-400',
}
const statusBadge = {
  draft:   'gray'   as const,
  aktif:   'green'  as const,
  selesai: 'indigo' as const,
}
const statusLabel = { draft: 'Draft', aktif: 'Aktif', selesai: 'Selesai' }

export default function DashboardPage() {
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('semua')

  useEffect(() => {
    const supabase = createClient()
    supabase.from('exams').select('*').order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) toast.error('Gagal memuat ujian')
        else setExams(data || [])
        setLoading(false)
      })
  }, [])

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    if (!confirm('Hapus ujian ini beserta semua soalnya?')) return
    const supabase = createClient()
    const { error } = await supabase.from('exams').delete().eq('id', id)
    if (error) toast.error('Gagal menghapus ujian')
    else { setExams(prev => prev.filter(ex => ex.id !== id)); toast.success('Ujian dihapus') }
  }

  const stats = useMemo(() => ({
    total:   exams.length,
    aktif:   exams.filter(e => e.status === 'aktif').length,
    selesai: exams.filter(e => e.status === 'selesai').length,
    draft:   exams.filter(e => e.status === 'draft').length,
  }), [exams])

  const filtered = useMemo(() =>
    filter === 'semua' ? exams : exams.filter(e => e.status === filter),
    [exams, filter]
  )

  const filters: { key: Filter; label: string; count: number }[] = [
    { key: 'semua',   label: 'Semua',   count: stats.total },
    { key: 'aktif',   label: 'Aktif',   count: stats.aktif },
    { key: 'draft',   label: 'Draft',   count: stats.draft },
    { key: 'selesai', label: 'Selesai', count: stats.selesai },
  ]

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="animate-spin h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full" />
    </div>
  )

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ujian Saya</h1>
          <p className="text-sm text-gray-500 mt-0.5">Kelola dan pantau semua ujian kamu</p>
        </div>
        <Link href="/guru/ujian/buat">
          <Button>+ Buat Ujian</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-xs text-gray-500 mt-1">Total Ujian</p>
        </div>
        <div className="bg-white rounded-xl border border-green-200 p-4 text-center shadow-sm">
          <p className="text-3xl font-bold text-green-600">{stats.aktif}</p>
          <p className="text-xs text-gray-500 mt-1">Sedang Aktif</p>
        </div>
        <div className="bg-white rounded-xl border border-indigo-200 p-4 text-center shadow-sm">
          <p className="text-3xl font-bold text-indigo-600">{stats.selesai}</p>
          <p className="text-xs text-gray-500 mt-1">Selesai</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              filter === f.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {f.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
              filter === f.key ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-500'
            }`}>{f.count}</span>
          </button>
        ))}
      </div>

      {/* Exam list */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
          {exams.length === 0 ? (
            <>
              <p className="text-gray-400 text-sm mb-4">Belum ada ujian. Buat ujian pertamamu sekarang!</p>
              <Link href="/guru/ujian/buat"><Button>Buat Ujian Pertama</Button></Link>
            </>
          ) : (
            <p className="text-gray-400 text-sm">Tidak ada ujian dengan status ini</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(exam => (
            <div
              key={exam.id}
              className={`bg-white rounded-xl border border-gray-200 border-l-4 ${statusColor[exam.status]} shadow-sm hover:shadow-md transition-shadow`}
            >
              <div className="p-4 flex items-center gap-4">
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link href={`/guru/ujian/${exam.id}`}>
                      <h2 className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors">
                        {exam.judul}
                      </h2>
                    </Link>
                    <Badge variant={statusBadge[exam.status]}>{statusLabel[exam.status]}</Badge>
                    {exam.sumber === 'google_form' && (
                      <Badge variant="indigo">Google Form</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {exam.mata_pelajaran || 'Tanpa mapel'}
                    {' · '}{exam.durasi_menit} menit
                    {' · '}{new Date(exam.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {exam.status === 'aktif' && (
                    <Link href={`/guru/ujian/${exam.id}/monitor`}>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm font-medium hover:bg-green-100 transition-colors">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                        Monitor
                      </button>
                    </Link>
                  )}
                  {exam.status === 'selesai' && (
                    <Link href={`/guru/ujian/${exam.id}/laporan`}>
                      <button className="px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-sm font-medium hover:bg-indigo-100 transition-colors">
                        Laporan
                      </button>
                    </Link>
                  )}
                  <Link href={`/guru/ujian/${exam.id}`}>
                    <button className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors">
                      Detail
                    </button>
                  </Link>
                  {exam.status === 'draft' && (
                    <button
                      onClick={(e) => handleDelete(exam.id, e)}
                      className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors"
                    >
                      Hapus
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
