import Link from 'next/link'
import Button from '@/components/ui/Button'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4">
      <div className="max-w-md w-full text-center space-y-8">
        <div>
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-indigo-600 text-white text-2xl font-bold mb-4 shadow-lg">
            PE
          </div>
          <h1 className="text-3xl font-bold text-gray-900">ProctorEdu</h1>
          <p className="mt-2 text-gray-500">Ujian online dengan pengawasan browser</p>
        </div>

        <div className="space-y-3">
          <Link href="/auth/login" className="block">
            <Button size="lg" className="w-full">Masuk sebagai Guru</Button>
          </Link>
          <Link href="/siswa" className="block">
            <Button size="lg" variant="secondary" className="w-full">Masuk sebagai Siswa</Button>
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[{ icon: '🔒', label: 'Anti-Contek' }, { icon: '⚡', label: 'Real-time' }, { icon: '📊', label: 'Laporan' }].map((f) => (
            <div key={f.label} className="bg-white rounded-xl border border-gray-200 p-3 text-center shadow-sm">
              <div className="text-xl mb-1">{f.icon}</div>
              <p className="text-xs font-medium text-gray-600">{f.label}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400">Untuk SMP · Gratis · Tidak perlu install aplikasi</p>
      </div>
    </main>
  )
}
