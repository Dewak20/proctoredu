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
  const [siswList, setSiswaList] = useState<string[]>([])
  const [classId, setClassId] = useState('')
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
      setSiswaList(data.siswa_list || [])
      setClassId(data.class_id)
      setStep('nama')
    } catch { toast.error('Terjadi kesalahan') } finally { setLoading(false) }
  }

  const handleMulai = async () => {
    if (!namaSiswa) { toast.error('Pilih nama kamu'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/siswa/token', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ class_id: classId, nama_siswa: namaSiswa }),
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
          <p className="text-sm text-gray-500 mt-1">Minta token kelas dari guru</p>
        </div>

        {step === 'token' ? (
          <Card>
            <form onSubmit={handleToken} className="space-y-4">
              <Input
                label="Token Kelas"
                value={token}
                onChange={e => setToken(e.target.value.toUpperCase())}
                placeholder="Contoh: UJ4B9X"
                maxLength={6}
                className="font-mono text-center text-lg tracking-widest"
                required
              />
              <Button type="submit" loading={loading} className="w-full">Cek Token</Button>
            </form>
          </Card>
        ) : (
          <Card className="space-y-4">
            <p className="text-sm font-medium text-gray-700">Pilih nama kamu:</p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {siswList.map(nama => (
                <button
                  key={nama}
                  onClick={() => setNamaSiswa(nama)}
                  className={`w-full text-left px-4 py-2.5 rounded-lg border-2 text-sm transition-colors ${
                    namaSiswa === nama ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-medium' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >{nama}</button>
              ))}
            </div>
            <Button onClick={handleMulai} loading={loading} disabled={!namaSiswa} className="w-full">Mulai Ujian</Button>
            <button onClick={() => setStep('token')} className="w-full text-xs text-gray-400 hover:text-gray-600">Ganti token</button>
          </Card>
        )}
      </div>
    </div>
  )
}
