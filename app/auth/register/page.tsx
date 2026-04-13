'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/Toast'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ nama: '', sekolah: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password.length < 6) { toast.error('Password minimal 6 karakter'); return }
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { nama: form.nama, sekolah: form.sekolah } },
    })
    if (error) { toast.error(error.message); setLoading(false); return }
    if (data.user) {
      await supabase.from('teachers').insert({ id: data.user.id, nama: form.nama, sekolah: form.sekolah })
    }
    toast.success('Akun berhasil dibuat!')
    router.push('/guru/dashboard')
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-indigo-600 text-white font-bold text-lg mb-4">PE</Link>
          <h1 className="text-xl font-bold text-gray-900">Daftar Akun Guru</h1>
        </div>
        <Card>
          <form onSubmit={handleRegister} className="space-y-4">
            <Input label="Nama Lengkap" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Nama Guru" required />
            <Input label="Nama Sekolah" value={form.sekolah} onChange={(e) => setForm({ ...form, sekolah: e.target.value })} placeholder="SMP Negeri 1 ..." />
            <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="guru@sekolah.com" required />
            <Input label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min. 6 karakter" required />
            <Button type="submit" loading={loading} className="w-full">Buat Akun</Button>
          </form>
        </Card>
        <p className="text-center text-sm text-gray-500">
          Sudah punya akun?{' '}
          <Link href="/auth/login" className="text-indigo-600 font-medium hover:underline">Masuk</Link>
        </p>
      </div>
    </div>
  )
}
