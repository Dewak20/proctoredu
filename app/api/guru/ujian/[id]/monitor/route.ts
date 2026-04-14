import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params

  // Auth: pastikan guru yang login
  const auth = createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()

  // Verifikasi ujian milik guru
  const { data: exam } = await service.from('exams').select('id, judul, teacher_id').eq('id', id).single()
  if (!exam || exam.teacher_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Ambil semua kelas ujian ini
  const { data: classes } = await service.from('classes').select('id').eq('exam_id', id)
  if (!classes?.length) return NextResponse.json({ sessions: [] })

  const classIds = classes.map((c: { id: string }) => c.id)

  // Ambil semua sesi siswa
  const { data: sessions } = await service
    .from('student_sessions')
    .select('*')
    .in('class_id', classIds)
    .order('created_at', { ascending: true })

  if (!sessions?.length) return NextResponse.json({ sessions: [] })

  // Ambil semua pelanggaran untuk sesi ini
  const sessionIds = sessions.map((s: { id: string }) => s.id)
  const { data: violations } = await service
    .from('violations')
    .select('*')
    .in('session_id', sessionIds)

  const result = sessions.map((s: { id: string }) => ({
    ...s,
    violations: (violations || []).filter((v: { session_id: string }) => v.session_id === s.id),
  }))

  return NextResponse.json({ sessions: result })
}

// Reset sesi siswa
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params
  const { session_id } = await req.json()

  const auth = createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()

  // Verifikasi ujian milik guru
  const { data: exam } = await service.from('exams').select('teacher_id').eq('id', id).single()
  if (!exam || exam.teacher_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await service.from('student_sessions')
    .update({ status: 'mengerjakan', selesai_at: null })
    .eq('id', session_id)

  return NextResponse.json({ ok: true })
}
