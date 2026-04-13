import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const { session_id, jenis, durasi_detik } = await request.json()
  if (!session_id || !jenis) return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })

  const supabase = createServiceClient()
  await supabase.from('violations').insert({
    session_id, jenis, durasi_detik: durasi_detik || null, waktu: new Date().toISOString(),
  })

  return NextResponse.json({ ok: true })
}
