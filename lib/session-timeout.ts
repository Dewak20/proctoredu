import { SupabaseClient } from '@supabase/supabase-js'
import { gradeAnswer } from '@/lib/scoring'

/**
 * Cek apakah sesi sudah kedaluwarsa dan tandai sebagai timeout secara server-side.
 * Digunakan ketika sesi dimuat ulang (reload/recovery) agar server jadi sumber kebenaran,
 * bukan bergantung pada timer client yang bisa terhenti karena HP macet atau sinyal putus.
 *
 * @returns true jika sesi baru saja di-timeout oleh fungsi ini
 */
export async function autoTimeoutIfExpired(
  supabase: SupabaseClient,
  sessionId: string
): Promise<boolean> {
  const { data: session } = await supabase
    .from('student_sessions')
    .select('*, classes(exam_id, exams(durasi_menit))')
    .eq('id', sessionId)
    .single()

  if (!session || session.status !== 'aktif') return false

  const exam = (session as any).classes?.exams
  if (!exam?.durasi_menit || !session.mulai_at) return false

  const mulaiMs = new Date(session.mulai_at).getTime()
  const batasMs = mulaiMs + exam.durasi_menit * 60 * 1000
  if (Date.now() <= batasMs) return false

  // Waktu sudah habis — ambil draft jawaban sebagai fallback
  const examId = (session as any).classes?.exam_id
  const { data: eqs } = await supabase
    .from('exam_questions')
    .select('*, question_bank(*)')
    .eq('exam_id', examId)
    .order('urutan')

  const questions = (eqs || []).map((eq: any) => eq.question_bank)

  const { data: drafts } = await supabase
    .from('answer_drafts')
    .select('question_id, jawaban_draft')
    .eq('session_id', sessionId)

  const draftMap: Record<string, string> = {}
  for (const d of drafts || []) {
    if (d.jawaban_draft) draftMap[d.question_id] = d.jawaban_draft
  }

  const { data: examDetail } = await supabase
    .from('exams')
    .select('bobot_pilgan')
    .eq('id', examId)
    .single()

  let skor_pilgan = 0, skor_isian = 0
  const answerRows = questions.map((q: any) => {
    const jawaban = draftMap[q.id] ?? null
    let benar: boolean | null = null
    if (q.tipe === 'pilgan') { benar = gradeAnswer(jawaban, q.kunci_jawaban, 'pilgan'); if (benar) skor_pilgan++ }
    if (q.tipe === 'isian') { benar = gradeAnswer(jawaban, q.kunci_jawaban, 'isian'); if (benar) skor_isian++ }
    return { session_id: sessionId, question_id: q.id, tipe: q.tipe, jawaban_siswa: jawaban, benar }
  })

  if (answerRows.length > 0) {
    await supabase.from('answers').insert(answerRows)
  }

  const totalPilganIsian = questions.filter((q: any) => q.tipe !== 'essay').length
  let skor_total = 0
  if (totalPilganIsian > 0) {
    skor_total = ((skor_pilgan + skor_isian) / totalPilganIsian) * (examDetail?.bobot_pilgan || 70)
  }

  await supabase.from('student_sessions').update({
    status: 'timeout',
    selesai_at: new Date(batasMs).toISOString(), // waktu selesai = tepat batas waktu, bukan sekarang
    skor_pilgan, skor_isian,
    skor_total: Math.round(skor_total * 100) / 100,
  }).eq('id', sessionId)

  await supabase.from('answer_drafts').delete().eq('session_id', sessionId)

  return true
}
