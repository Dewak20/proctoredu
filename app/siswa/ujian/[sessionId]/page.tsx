'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Question, StudentSession, Exam, ViolationType } from '@/types'
import { useUjianStore } from '@/store/ujianStore'
import { useProctor } from '@/lib/proctor/hooks'
import { useAutoSave } from '@/lib/autosave/hooks'
import TimerCountdown from '@/components/siswa/TimerCountdown'
import SoalPilgan from '@/components/siswa/SoalPilgan'
import SoalEssay from '@/components/siswa/SoalEssay'
import SoalIsian from '@/components/siswa/SoalIsian'
import ViolationWarning from '@/components/siswa/ViolationWarning'
import Button from '@/components/ui/Button'
import { toast } from '@/components/ui/Toast'
import { clsx } from 'clsx'

export default function UjianPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const router = useRouter()

  const [sessionData, setSessionData] = useState<StudentSession | null>(null)
  const [exam, setExam] = useState<Exam | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [violationWarning, setViolationWarning] = useState<{
    open: boolean; jenis: ViolationType | null; count: number
  }>({ open: false, jenis: null, count: 0 })

  const {
    answers,
    currentIndex,
    setAnswer,
    setCurrentIndex,
    setSession: storeSetSession,
    setQuestions: storeSetQuestions,
  } = useUjianStore()

  const handleViolation = useCallback((jenis: ViolationType) => {
    setViolationWarning(prev => ({ open: true, jenis, count: prev.count + 1 }))
  }, [])

  useProctor({ sessionId, onViolation: handleViolation, enabled: !loading })
  useAutoSave(sessionId, answers, !loading)

  useEffect(() => {
    const onOnline = () => setIsOnline(true)
    const onOffline = () => setIsOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/siswa/session/${sessionId}`)
      if (!res.ok) { router.push('/siswa'); return }
      const data = await res.json()

      if (data.session.status === 'selesai' || data.session.status === 'timeout') {
        router.push('/siswa/selesai')
        return
      }

      setSessionData(data.session)
      setExam(data.exam)
      setQuestions(data.questions)
      storeSetQuestions(data.questions)
      storeSetSession(sessionId)

      // Restore drafts from server
      if (data.drafts?.length) {
        data.drafts.forEach((d: { question_id: string; jawaban_draft: string | null }) => {
          if (d.jawaban_draft) setAnswer(d.question_id, d.jawaban_draft)
        })
      }

      setLoading(false)
    }
    load()
  }, [sessionId, router, storeSetQuestions, storeSetSession, setAnswer])

  const handleSubmit = useCallback(async (isTimeout = false) => {
    if (submitting) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/siswa/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, answers, is_timeout: isTimeout }),
      })
      if (!res.ok) throw new Error()
      useUjianStore.getState().reset()
      router.push('/siswa/selesai')
    } catch {
      toast.error('Gagal submit, coba lagi')
      setSubmitting(false)
    }
  }, [sessionId, answers, submitting, router])

  const handleTimeout = useCallback(() => handleSubmit(true), [handleSubmit])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-gray-500">Memuat soal...</p>
        </div>
      </div>
    )
  }

  // === MODE GOOGLE FORM ===
  if (exam?.sumber === 'google_form' && exam.form_url) {
    const embedUrl = toGoogleFormEmbedUrl(exam.form_url)
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="w-full px-3 h-12 flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate leading-tight">{exam.judul}</p>
              <p className="text-xs text-gray-400 truncate">{sessionData?.nama_siswa}</p>
            </div>
            {sessionData?.mulai_at && (
              <TimerCountdown
                durasiMenit={exam.durasi_menit}
                mulaiAt={sessionData.mulai_at}
                onTimeout={handleTimeout}
              />
            )}
            <Button size="sm" onClick={() => {
              if (confirm('Pastikan kamu sudah submit di Google Form. Selesaikan ujian?')) {
                handleSubmit()
              }
            }} loading={submitting}>
              Selesai
            </Button>
          </div>
        </header>

        {/* Google Form iframe */}
        <main className="flex-1 w-full">
          <iframe
            src={embedUrl}
            className="w-full h-full border-0"
            style={{ minHeight: 'calc(100dvh - 48px)' }}
            title={exam.judul}
            allow="camera; microphone"
          />
        </main>

        <ViolationWarning
          open={violationWarning.open}
          jenis={violationWarning.jenis}
          count={violationWarning.count}
          onClose={() => setViolationWarning(prev => ({ ...prev, open: false }))}
        />
      </div>
    )
  }

  // === MODE MANUAL ===
  const currentQuestion = questions[currentIndex]
  const answered = Object.keys(answers).length

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="w-full px-3 h-12 flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate leading-tight">{exam?.judul}</p>
            <p className="text-xs text-gray-400">{answered}/{questions.length} dijawab</p>
          </div>
          {sessionData?.mulai_at && exam && (
            <TimerCountdown
              durasiMenit={exam.durasi_menit}
              mulaiAt={sessionData.mulai_at}
              onTimeout={handleTimeout}
            />
          )}
        </div>
        {!isOnline && (
          <div className="bg-yellow-50 border-t border-yellow-200 px-3 py-1 text-xs text-yellow-700 text-center">
            Offline — jawaban tersimpan lokal
          </div>
        )}
      </header>

      {/* Soal */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-3 py-4">
        {currentQuestion && (
          <div className="space-y-4">
            {currentQuestion.tipe === 'pilgan' && (
              <SoalPilgan
                soal={currentQuestion}
                jawaban={answers[currentQuestion.id] || null}
                onJawab={j => setAnswer(currentQuestion.id, j)}
                nomor={currentIndex + 1}
              />
            )}
            {currentQuestion.tipe === 'essay' && (
              <SoalEssay
                soal={currentQuestion}
                jawaban={answers[currentQuestion.id] || ''}
                onJawab={j => setAnswer(currentQuestion.id, j)}
                nomor={currentIndex + 1}
              />
            )}
            {currentQuestion.tipe === 'isian' && (
              <SoalIsian
                soal={currentQuestion}
                jawaban={answers[currentQuestion.id] || ''}
                onJawab={j => setAnswer(currentQuestion.id, j)}
                nomor={currentIndex + 1}
              />
            )}
          </div>
        )}
      </main>

      {/* Navigation */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 safe-area-bottom">
        {/* Nomor soal */}
        <div className="px-3 pt-2 pb-1 flex gap-1.5 overflow-x-auto">
          {questions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(i)}
              className={clsx(
                'flex-shrink-0 h-9 w-9 rounded-lg text-sm font-medium transition-colors',
                i === currentIndex ? 'bg-indigo-600 text-white' :
                answers[q.id] ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              )}
            >
              {i + 1}
            </button>
          ))}
        </div>
        {/* Prev / Next */}
        <div className="px-3 py-2 grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            className="w-full"
          >
            &larr; Sebelumnya
          </Button>
          {currentIndex < questions.length - 1 ? (
            <Button onClick={() => setCurrentIndex(currentIndex + 1)} className="w-full">
              Berikutnya &rarr;
            </Button>
          ) : (
            <Button
              onClick={() => {
                if (confirm(`Kamu baru menjawab ${answered} dari ${questions.length} soal. Submit ujian?`)) {
                  handleSubmit()
                }
              }}
              loading={submitting}
              className="w-full"
            >
              Submit Ujian
            </Button>
          )}
        </div>
      </div>

      <ViolationWarning
        open={violationWarning.open}
        jenis={violationWarning.jenis}
        count={violationWarning.count}
        onClose={() => setViolationWarning(prev => ({ ...prev, open: false }))}
      />
    </div>
  )
}

// Konversi berbagai format URL Google Form ke embed URL
function toGoogleFormEmbedUrl(url: string): string {
  // Tangani format /d/e/{responseId}/viewform (format paling umum dari tombol Kirim)
  const matchE = url.match(/\/forms\/d\/e\/([^/?\s]+)/)
  if (matchE) {
    return `https://docs.google.com/forms/d/e/${matchE[1]}/viewform?embedded=true`
  }
  // Tangani format /d/{formId}/... (format edit/draft)
  const match = url.match(/\/forms\/d\/([^/?\s]+)/)
  if (match) {
    return `https://docs.google.com/forms/d/${match[1]}/viewform?embedded=true`
  }
  // Jika sudah embed URL atau format lain, kembalikan apa adanya
  return url.includes('embedded=true') ? url : `${url}${url.includes('?') ? '&' : '?'}embedded=true`
}
