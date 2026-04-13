'use client'

import { Question } from '@/types'

interface SoalEssayProps {
  soal: Question
  jawaban: string
  onJawab: (jawaban: string) => void
  nomor: number
}

export default function SoalEssay({ soal, jawaban, onJawab, nomor }: SoalEssayProps) {
  return (
    <div className="space-y-4">
      <div className="text-gray-800 leading-relaxed">
        <span className="font-semibold text-indigo-600 mr-2">{nomor}.</span>
        <span className="whitespace-pre-wrap">{soal.teks_soal}</span>
      </div>
      <textarea value={jawaban} onChange={(e) => onJawab(e.target.value)} rows={6}
        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm focus:border-indigo-500 outline-none resize-none transition-colors"
        placeholder="Tulis jawaban kamu di sini..." />
      <p className="text-xs text-gray-400">{jawaban.length} karakter</p>
    </div>
  )
}
