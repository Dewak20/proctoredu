import { create } from 'zustand'
import { Exam } from '@/types'

interface GuruState {
  exams: Exam[]
  setExams: (exams: Exam[]) => void
  addExam: (exam: Exam) => void
  updateExam: (id: string, data: Partial<Exam>) => void
  removeExam: (id: string) => void
}

export const useGuruStore = create<GuruState>((set) => ({
  exams: [],
  setExams: (exams) => set({ exams }),
  addExam: (exam) => set((s) => ({ exams: [exam, ...s.exams] })),
  updateExam: (id, data) =>
    set((s) => ({ exams: s.exams.map((e) => (e.id === id ? { ...e, ...data } : e)) })),
  removeExam: (id) => set((s) => ({ exams: s.exams.filter((e) => e.id !== id) })),
}))
