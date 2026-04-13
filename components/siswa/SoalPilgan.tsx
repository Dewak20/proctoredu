'use client'

import { Question } from '@/types'
import { clsx } from 'clsx'

const OPTIONS = ['a', 'b', 'c', 'd'] as const

interface SoalPilganProps {
  soal: Question
  jawaban: string | null
  onJawab: (jawaban: string) => void
  nomor: number
}

export default function SoalPilgan({ soal, jawaban, onJawab, nomor }: SoalPilganProps) {
  return (
    <div className="space-y-4">
      <div className="text-gray-800 leading-relaxed">
        <span className="font-semibold text-indigo-600 mr-2">{nomor}.</span>
        <span className="whitespace-pre-wrap">{soal.teks_soal}</span>
      </div>
      <div className="space-y-2.5">
        {OPTIONS.map((opt) => {
          const text = soal[`pilihan_${opt}` as keyof Question] as string | null
          if (!text) return null
          const selected = jawaban === opt
          return (
            <button key={opt} onClick={() => onJawab(opt)} className={clsx(
              'w-full flex items-start gap-3 rounded-xl border-2 px-4 py-3 text-left transition-colors',
              selected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
            )}>
              <span className={clsx(
                'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold',
                selected ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-600'
              )}>{opt.toUpperCase()}</span>
              <span className="pt-0.5 text-sm text-gray-800">{text}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
