'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/Toast'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      toast.error(error.message === 'Invalid login credentials' ? 'Email atau password salah' : error.message)
    } else {
      router.push('/guru/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-indigo-600 text-white font-bold text-lg mb-4">PE</Link>
          <h1 className="text-xl font-bold text-gray-900">Masuk Akun Guru</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola ujian dan pantau siswa</p>
        </div>
        <Card>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="guru@sekolah.com" required />
            <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="········" required />
            <Button type="submit" loading={loading} className="w-full">Masuk</Button>
          </form>
        </Card>
        <p className="text-center text-sm text-gray-500">
          Belum punya akun?{' '}
          <Link href="/auth/register" className="text-indigo-600 font-medium hover:underline">Daftar</Link>
        </p>
      </div>
    </div>
  )
}
