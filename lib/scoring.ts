import { Exam } from '@/types'

export function gradeAnswer(
  jawaban: string | null,
  kunci: string | null,
  tipe: 'pilgan' | 'isian'
): boolean {
  if (!jawaban || !kunci) return false
  if (tipe === 'pilgan') return jawaban.toLowerCase() === kunci.toLowerCase()
  return jawaban.trim().toLowerCase() === kunci.trim().toLowerCase()
}

export function calculateTotalWithEssay(
  skor_pilgan: number,
  skor_isian: number,
  skor_essay: number | null,
  totalPilganIsian: number,
  totalEssay: number,
  exam: Exam
): number {
  let total = 0
  if (totalPilganIsian > 0) {
    total += ((skor_pilgan + skor_isian) / totalPilganIsian) * exam.bobot_pilgan
  }
  if (totalEssay > 0 && skor_essay !== null) {
    total += (skor_essay / totalEssay) * exam.bobot_essay
  }
  return Math.round(total * 100) / 100
}
