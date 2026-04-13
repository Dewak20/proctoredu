'use client'

import { Question } from '@/types'

interface SoalIsianProps {
  soal: Question
  jawaban: string
  onJawab: (jawaban: string) => void
  nomor: number
}

export default function SoalIsian({ soal, jawaban, onJawab, nomor }: SoalIsianProps) {
  return (
    <div className="space-y-4">
      <div className="text-gray-800 leading-relaxed">
        <span className="font-semibold text-indigo-600 mr-2">{nomor}.</span>
        <span className="whitespace-pre-wrap">{soal.teks_soal}</span>
      </div>
      <input type="text" value={jawaban} onChange={(e) => onJawab(e.target.value)}
        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm focus:border-indigo-500 outline-none transition-colors"
        placeholder="Ketik jawaban singkat..." />
    </div>
  )
}
