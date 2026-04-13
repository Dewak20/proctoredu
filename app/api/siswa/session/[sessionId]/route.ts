import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest, { params }: { params: { sessionId: string } }) {
  const supabase = createServiceClient()
  const { data: session } = await supabase
    .from('student_sessions')
    .select('*, classes(*, exams(*))')
    .eq('id', params.sessionId)
    .single()

  if (!session) return NextResponse.json({ error: 'Sesi tidak ditemukan' }, { status: 404 })

  const cls = (session as any).classes
  const exam = cls?.exams

  // Get questions
  const { data: eqs } = await supabase
    .from('exam_questions')
    .select('*, question_bank(*)')
    .eq('exam_id', exam?.id)
    .order('urutan')

  const questions = (eqs || []).map((eq: any) => eq.question_bank)

  // Load drafts
  const { data: drafts } = await supabase
    .from('answer_drafts')
    .select('question_id, jawaban_draft')
    .eq('session_id', params.sessionId)

  return NextResponse.json({ session, exam, questions, drafts: drafts || [] })
}
