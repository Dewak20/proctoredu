'use client'

import { useState } from 'react'
import { Class } from '@/types'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { generateToken } from '@/lib/token'

interface KelasManagerProps {
  classes: Class[]
  onAddClass: (nama: string, siswaList: string[], token: string) => Promise<void>
  onToggleAktif?: (classId: string, aktif: boolean) => Promise<void>
  onDeleteClass?: (classId: string) => Promise<void>
  examStatus?: string
}

export default function KelasManager({ classes, onAddClass, onToggleAktif, onDeleteClass, examStatus = 'draft' }: KelasManagerProps) {
  const [showForm, setShowForm] = useState(false)
  const [namaKelas, setNamaKelas] = useState('')
  const [siswaTeks, setSiswaTeks] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAdd = async () => {
    if (!namaKelas.trim()) return
    const siswaList = siswaTeks.split('\n').map(s => s.trim()).filter(Boolean)
    setLoading(true)
    try {
      await onAddClass(namaKelas.trim(), siswaList, generateToken())
      setNamaKelas(''); setSiswaTeks(''); setShowForm(false)
    } finally { setLoading(false) }
  }

  return (
    <div className="space-y-4">
      {classes.map((cls) => (
        <div key={cls.id} className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="font-medium text-gray-900">{cls.nama_kelas}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Token: <code className="font-mono font-bold text-indigo-600">{cls.token}</code>
                &nbsp;·&nbsp;{cls.siswa_list?.length ?? 0} siswa
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={cls.aktif ? 'green' : 'gray'}>{cls.aktif ? 'Aktif' : 'Nonaktif'}</Badge>
              {onToggleAktif && examStatus !== 'selesai' && (
                <Button size="sm" variant={cls.aktif ? 'secondary' : 'primary'} onClick={() => onToggleAktif(cls.id, !cls.aktif)}>
                  {cls.aktif ? 'Nonaktifkan' : 'Aktifkan'}
                </Button>
              )}
              {onDeleteClass && examStatus === 'draft' && (
                <Button size="sm" variant="danger" onClick={() => onDeleteClass(cls.id)}>Hapus</Button>
              )}
            </div>
          </div>
          {cls.siswa_list && cls.siswa_list.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {cls.siswa_list.map((siswa) => (
                <span key={siswa} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{siswa}</span>
              ))}
            </div>
          )}
        </div>
      ))}

      {showForm ? (
        <div className="border border-dashed border-gray-300 rounded-lg p-4 space-y-3">
          <Input label="Nama Kelas" value={namaKelas} onChange={(e) => setNamaKelas(e.target.value)} placeholder="Kelas 8A, 9B, dll" />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Daftar Siswa (satu nama per baris)</label>
            <textarea value={siswaTeks} onChange={(e) => setSiswaTeks(e.target.value)} rows={5} className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none" placeholder="Ahmad Rizki&#10;Budi Santoso&#10;Citra Dewi" />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAdd} loading={loading}>Tambah Kelas</Button>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Batal</Button>
          </div>
        </div>
      ) : (
        <Button variant="secondary" onClick={() => setShowForm(true)}>+ Tambah Kelas</Button>
      )}
    </div>
  )
}
