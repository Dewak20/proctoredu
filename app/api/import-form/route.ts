import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { url } = await request.json()
  if (!url) return NextResponse.json({ error: 'URL diperlukan' }, { status: 400 })

  try {
    const res = await fetch(url, { next: { revalidate: 0 } })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    if (!data.questions || !Array.isArray(data.questions)) {
      return NextResponse.json({ error: 'Format response tidak valid' }, { status: 422 })
    }
    return NextResponse.json({ questions: data.questions })
  } catch (e) {
    return NextResponse.json({ error: 'Gagal mengambil soal dari Apps Script' }, { status: 500 })
  }
}
