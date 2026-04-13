'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { clsx } from 'clsx'

const navItems = [
  { href: '/guru/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/guru/bank-soal', label: 'Bank Soal', icon: '📝' },
]

export default function GuruLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [namaGuru, setNamaGuru] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/auth/login'); return }
      supabase.from('teachers').select('nama').eq('id', data.user.id).single()
        .then(({ data: t }) => { if (t) setNamaGuru(t.nama) })
    })
  }, [router])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/guru/dashboard" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white text-xs font-bold">PE</span>
              <span className="font-semibold text-gray-900 hidden sm:block">ProctorEdu</span>
            </Link>
            <nav className="flex gap-1">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className={clsx(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  pathname.startsWith(item.href) ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
                )}>
                  <span>{item.icon}</span><span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {namaGuru && <span className="text-sm text-gray-600 hidden sm:block">{namaGuru}</span>}
            <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-700 transition-colors">Keluar</button>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
