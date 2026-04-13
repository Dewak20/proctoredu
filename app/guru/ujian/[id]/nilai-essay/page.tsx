'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Answer, Question, StudentSession, Exam } from '@/types'
import { Card } from '@/components/ui/Card'
import EssayGrader from '@/components/guru/EssayGrader'
import { toast } from '@/components/ui/Toast'

interface EssayGroup {
  question: Question
  answers: (Answer & { question_bank?: Question; session?: StudentSession })[]
}

export default function NilaiEssayPage() {
  const { id } = useParams<{ id: string }>()
  const [exam, setExam] = useState<Exam | null>(null)
  const [groups, setGroups] = useState<EssayGroup[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: e } = await supabase.from('exams').select('*').eq('id', id).single()
      setExam(e)

      const { data: eq } = await supabase
        .from('exam_questions').select('question_id, question_bank(*)')
        .eq('exam_id', id)
      const essayQuestions = (eq || []).filter((q: any) => q.question_bank?.tipe === 'essay')

      const { data: classes } = await supabase.from('classes').select('id').eq('exam_id', id)
      const classIds = (classes || []).map((c: any) => c.id)
      const { data: sessions } = await supabase.from('student_sessions').select('*').in('class_id', classIds)
      const sessionIds = (sessions || []).map((s: any) => s.id)

      const grps: EssayGroup[] = []
      for (const eq of essayQuestions) {
        const { data: answers } = await supabase
          .from('answers').select('*').eq('question_id', eq.question_id).in('session_id', sessionIds)
        grps.push({
          question: (eq as any).question_bank,
          answers: (answers || []).map(a => ({
            ...a,
            question_bank: (eq as any).question_bank,
            session: sessions?.find(s => s.id === a.session_id),
          })),
        })
      }
      setGroups(grps)
      setLoading(false)
    }
    load()
  }, [id])

  const handleSave = async (answerId: string, nilai: number) => {
    const supabase = createClient()
    await supabase.from('answers').update({ nilai_manual: nilai, benar: true, dinilai_at: new Date().toISOString() }).eq('id', answerId)
    toast.success('Nilai disimpan')
  }

  if (loading) return <div className="py-12 text-center text-gray-400">Memuat...</div>

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-bold text-gray-900">Nilai Essay — {exam?.judul}</h1>
      {groups.length === 0 ? (
        <Card className="text-center py-12"><p className="text-gray-400">Tidak ada soal essay</p></Card>
      ) : groups.map((g, gi) => (
        <Card key={gi}>
          <h2 className="font-medium text-gray-900 mb-1">Soal {gi + 1}</h2>
          <p className="text-sm text-gray-600 mb-4 bg-gray-50 rounded p-3">{g.question.teks_soal}</p>
          <div className="space-y-3">
            {g.answers.map(a => (
              <EssayGrader
                key={a.id}
                answer={a}
                namaSiswa={(a.session as any)?.nama_siswa || '-'}
                onSave={handleSave}
              />
            ))}
          </div>
        </Card>
      ))}
    </div>
  )
}
