import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const { session_id, answers } = await request.json()
  if (!session_id) return NextResponse.json({ error: 'session_id diperlukan' }, { status: 400 })

  const supabase = createServiceClient()
  const rows = Object.entries(answers as Record<string, string>).map(([question_id, jawaban_draft]) => ({
    session_id, question_id, jawaban_draft, updated_at: new Date().toISOString(),
  }))

  if (rows.length > 0) {
    await supabase.from('answer_drafts').upsert(rows, { onConflict: 'session_id,question_id' })
  }

  return NextResponse.json({ ok: true })
}
