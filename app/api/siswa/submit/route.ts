import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { gradeAnswer } from '@/lib/scoring'

export async function POST(request: NextRequest) {
  const { session_id, answers, is_timeout } = await request.json()
  if (!session_id) return NextResponse.json({ error: 'session_id diperlukan' }, { status: 400 })

  const supabase = createServiceClient()

  // Get session & exam info
  const { data: session } = await supabase
    .from('student_sessions')
    .select('*, classes(exam_id)')
    .eq('id', session_id)
    .single()

  if (!session) return NextResponse.json({ error: 'Sesi tidak ditemukan' }, { status: 404 })

  const examId = (session as any).classes?.exam_id
  const { data: exam } = await supabase.from('exams').select('*').eq('id', examId).single()
  const { data: eqs } = await supabase
    .from('exam_questions').select('*, question_bank(*)')
    .eq('exam_id', examId).order('urutan')

  const questions = (eqs || []).map((eq: any) => eq.question_bank)

  // Grade & insert answers
  let skor_pilgan = 0, skor_isian = 0
  const answerRows = questions.map((q: any) => {
    const jawaban = answers?.[q.id] || null
    let benar: boolean | null = null
    if (q.tipe === 'pilgan') { benar = gradeAnswer(jawaban, q.kunci_jawaban, 'pilgan'); if (benar) skor_pilgan++ }
    if (q.tipe === 'isian') { benar = gradeAnswer(jawaban, q.kunci_jawaban, 'isian'); if (benar) skor_isian++ }
    return { session_id, question_id: q.id, tipe: q.tipe, jawaban_siswa: jawaban, benar }
  })

  await supabase.from('answers').insert(answerRows)

  // Calculate total score (essay graded later)
  const totalPilganIsian = questions.filter((q: any) => q.tipe !== 'essay').length
  let skor_total = 0
  if (totalPilganIsian > 0) {
    skor_total = ((skor_pilgan + skor_isian) / totalPilganIsian) * (exam?.bobot_pilgan || 70)
  }

  await supabase.from('student_sessions').update({
    status: is_timeout ? 'timeout' : 'selesai',
    selesai_at: new Date().toISOString(),
    skor_pilgan, skor_isian,
    skor_total: Math.round(skor_total * 100) / 100,
  }).eq('id', session_id)

  // Clean up drafts
  await supabase.from('answer_drafts').delete().eq('session_id', session_id)

  return NextResponse.json({ ok: true, skor_pilgan, skor_isian, skor_total })
}
