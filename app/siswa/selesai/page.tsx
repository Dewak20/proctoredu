import Link from 'next/link'
import Button from '@/components/ui/Button'

export default function SelesaiPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-sm w-full text-center space-y-6">
        <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-green-100 text-4xl mx-auto">
          ✅
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ujian Selesai!</h1>
          <p className="text-gray-500 mt-2">
            Jawaban kamu sudah tersimpan. Tunggu guru untuk mengumumkan hasil.
          </p>
        </div>
        <Link href="/siswa">
          <Button variant="secondary" className="w-full">Kembali ke Halaman Awal</Button>
        </Link>
      </div>
    </div>
  )
}
