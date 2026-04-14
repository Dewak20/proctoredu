'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { toast } from '@/components/ui/Toast'

export default function SiswaPage() {
  const router = useRouter()
  const [token, setToken] = useState('')
  const [namaSiswa, setNamaSiswa] = useState('')
  const [classId, setClassId] = useState('')
  const [examJudul, setExamJudul] = useState('')
  const [step, setStep] = useState<'token' | 'nama'>('token')
  const [loading, setLoading] = useState(false)

  const handleToken = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/siswa/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim().toUpperCase() }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Token tidak valid'); return }
      setClassId(data.class_id)
      setExamJudul(data.exam?.judul || '')
      setStep('nama')
    } catch { toast.error('Terjadi kesalahan') } finally { setLoading(false) }
  }

  const handleMulai = async (e: React.FormEvent) => {
    e.preventDefault()
    const nama = namaSiswa.trim()
    if (!nama) { toast.error('Nama tidak boleh kosong'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/siswa/token', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ class_id: classId, nama_siswa: nama }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Gagal memulai ujian'); return }
      router.push(`/siswa/ujian/${data.session_id}`)
    } catch { toast.error('Terjadi kesalahan') } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-indigo-600 text-white text-xl font-bold mb-4">PE</div>
          <h1 className="text-xl font-bold text-gray-900">Masuk Ujian</h1>
          <p className="text-sm text-gray-500 mt-1">Minta token dari guru kamu</p>
        </div>

        {step === 'token' ? (
          <Card>
            <form onSubmit={handleToken} className="space-y-4">
              <Input
                label="Token Ujian"
                value={token}
                onChange={e => setToken(e.target.value.toUpperCase())}
                placeholder="Contoh: UJ4B9X"
                maxLength={6}
                className="font-mono text-center text-xl tracking-widest"
                required
              />
              <Button type="submit" loading={loading} className="w-full">Cek Token</Button>
            </form>
          </Card>
        ) : (
          <Card>
            {examJudul && (
              <div className="mb-4 rounded-lg bg-indigo-50 border border-indigo-100 px-3 py-2 text-sm text-indigo-700 font-medium text-center">
                {examJudul}
              </div>
            )}
            <form onSubmit={handleMulai} className="space-y-4">
              <Input
                label="Nama lengkap kamu"
                value={namaSiswa}
                onChange={e => setNamaSiswa(e.target.value)}
                placeholder="Ketik nama lengkap..."
                autoFocus
                required
              />
              <Button type="submit" loading={loading} disabled={!namaSiswa.trim()} className="w-full">
                Mulai Ujian
              </Button>
            </form>
            <button onClick={() => setStep('token')} className="w-full mt-3 text-xs text-gray-400 hover:text-gray-600">
              Ganti token
            </button>
          </Card>
        )}
      </div>
    </div>
  )
}
