import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// POST: validate token, return class info
export async function POST(request: NextRequest) {
  const { token } = await request.json()
  if (!token) return NextResponse.json({ error: 'Token diperlukan' }, { status: 400 })

  const supabase = createServiceClient()
  const { data: cls, error } = await supabase
    .from('classes')
    .select('id, nama_kelas, aktif, siswa_list, exam_id, exams(judul, durasi_menit, status)')
    .eq('token', token)
    .single()

  if (error || !cls) return NextResponse.json({ error: 'Token tidak ditemukan' }, { status: 404 })
  if (!cls.aktif) return NextResponse.json({ error: 'Ujian belum dimulai atau sudah berakhir' }, { status: 403 })

  return NextResponse.json({
    class_id: cls.id,
    nama_kelas: cls.nama_kelas,
    siswa_list: cls.siswa_list || [],
    exam: cls.exams,
  })
}

// PUT: create or resume session
export async function PUT(request: NextRequest) {
  const { class_id, nama_siswa } = await request.json()
  if (!class_id || !nama_siswa) return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })

  const supabase = createServiceClient()

  // Check existing session
  const { data: existing } = await supabase
    .from('student_sessions')
    .select('*')
    .eq('class_id', class_id)
    .eq('nama_siswa', nama_siswa)
    .single()

  if (existing) {
    if (existing.status === 'selesai' || existing.status === 'timeout') {
      return NextResponse.json({ error: 'Kamu sudah menyelesaikan ujian ini.' }, { status: 403 })
    }
    if (existing.status === 'mengerjakan') {
      return NextResponse.json({ error: 'Nama ini sedang dalam sesi ujian aktif. Hubungi guru untuk reset.' }, { status: 409 })
    }
  }

  // Create new session
  const { data: session, error } = await supabase
    .from('student_sessions')
    .insert({ class_id, nama_siswa, mulai_at: new Date().toISOString(), status: 'mengerjakan' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Gagal membuat sesi' }, { status: 500 })
  return NextResponse.json({ session_id: session.id })
}
