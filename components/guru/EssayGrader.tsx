'use client'

import { useState } from 'react'
import { Answer, Question } from '@/types'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

interface EssayGraderProps {
  answer: Answer & { question_bank?: Question }
  namaSiswa: string
  maxScore?: number
  onSave: (answerId: string, nilai: number) => Promise<void>
}

export default function EssayGrader({ answer, namaSiswa, maxScore = 10, onSave }: EssayGraderProps) {
  const [nilai, setNilai] = useState(answer.nilai_manual?.toString() || '')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(!!answer.nilai_manual)

  const handleSave = async () => {
    const n = parseFloat(nilai)
    if (isNaN(n) || n < 0 || n > maxScore) return
    setLoading(true)
    try { await onSave(answer.id, n); setSaved(true) } finally { setLoading(false) }
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">{namaSiswa}</span>
        {saved && <span className="text-xs text-green-600 font-medium">Tersimpan</span>}
      </div>
      <div className="bg-gray-50 rounded p-3 text-sm text-gray-700">
        <p className="font-medium text-gray-500 text-xs mb-1">Jawaban Siswa:</p>
        {answer.jawaban_siswa || <span className="text-gray-400 italic">Tidak dijawab</span>}
      </div>
      <div className="flex items-center gap-3">
        <div className="w-28">
          <Input type="number" label={`Nilai (0–${maxScore})`} value={nilai} onChange={(e) => { setNilai(e.target.value); setSaved(false) }} min={0} max={maxScore} step={0.5} />
        </div>
        <div className="mt-5">
          <Button size="sm" loading={loading} onClick={handleSave}>Simpan</Button>
        </div>
      </div>
    </div>
  )
}
