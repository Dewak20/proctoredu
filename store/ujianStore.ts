import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Question } from '@/types'

interface UjianState {
  sessionId: string | null
  questions: Question[]
  answers: Record<string, string>
  currentIndex: number
  startTime: number | null
  setSession: (id: string) => void
  setQuestions: (q: Question[]) => void
  setAnswer: (questionId: string, jawaban: string) => void
  setCurrentIndex: (i: number) => void
  setStartTime: (t: number) => void
  reset: () => void
}

export const useUjianStore = create<UjianState>()(
  persist(
    (set) => ({
      sessionId: null,
      questions: [],
      answers: {},
      currentIndex: 0,
      startTime: null,
      setSession: (sessionId) => set({ sessionId }),
      setQuestions: (questions) => set({ questions }),
      setAnswer: (questionId, jawaban) =>
        set((s) => ({ answers: { ...s.answers, [questionId]: jawaban } })),
      setCurrentIndex: (currentIndex) => set({ currentIndex }),
      setStartTime: (startTime) => set({ startTime }),
      reset: () => set({ sessionId: null, questions: [], answers: {}, currentIndex: 0, startTime: null }),
    }),
    {
      name: 'ujian-storage',
      partialize: (s) => ({
        sessionId: s.sessionId,
        answers: s.answers,
        currentIndex: s.currentIndex,
        startTime: s.startTime,
      }),
    }
  )
)
