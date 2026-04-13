import { NextRequest, NextResponse } from 'next/server'

// Resolve forms.gle short link ke full Google Form URL
export async function POST(request: NextRequest) {
  const { url } = await request.json()
  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'URL diperlukan' }, { status: 400 })
  }

  try {
    const resolved = await resolveFormUrl(url.trim())
    return NextResponse.json({ url: resolved })
  } catch {
    return NextResponse.json({ error: 'URL Google Form tidak valid atau tidak bisa diakses' }, { status: 422 })
  }
}

async function resolveFormUrl(url: string): Promise<string> {
  // Sudah full URL Google Forms
  if (url.includes('docs.google.com/forms')) {
    return url.split('?')[0] // Buang query params lama
  }

  // forms.gle short link — perlu di-resolve lewat redirect
  if (url.includes('forms.gle')) {
    const res = await fetch(url, { redirect: 'follow' })
    const finalUrl = res.url
    if (finalUrl.includes('docs.google.com/forms')) {
      return finalUrl.split('?')[0]
    }
    throw new Error('Redirect tidak mengarah ke Google Forms')
  }

  throw new Error('Bukan URL Google Form yang dikenali')
}
