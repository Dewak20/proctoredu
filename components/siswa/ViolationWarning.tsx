'use client'

import { ViolationType } from '@/types'
import { Modal } from '@/components/ui/Modal'
import Button from '@/components/ui/Button'

const messages: Record<ViolationType, string> = {
  tab_switch: 'Kamu terdeteksi berpindah tab atau aplikasi lain.',
  fullscreen_exit: 'Kamu terdeteksi keluar dari mode layar penuh.',
  blur: 'Kamu terdeteksi meninggalkan halaman ujian.',
  copy_attempt: 'Kamu terdeteksi mencoba menyalin teks.',
}

interface ViolationWarningProps {
  open: boolean
  jenis: ViolationType | null
  count: number
  onClose: () => void
}

export default function ViolationWarning({ open, jenis, count, onClose }: ViolationWarningProps) {
  const isKeras = count >= 5
  return (
    <Modal open={open} title={isKeras ? 'Peringatan Keras!' : 'Pelanggaran Terdeteksi'} closeOnBackdrop={false} size="sm">
      <div className={`rounded-lg p-4 mb-4 ${isKeras ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'}`}>
        <p className={`text-sm font-medium ${isKeras ? 'text-red-700' : 'text-yellow-700'}`}>
          {jenis ? messages[jenis] : 'Pelanggaran terdeteksi.'}
        </p>
        <p className={`text-xs mt-1 ${isKeras ? 'text-red-600' : 'text-yellow-600'}`}>
          Total pelanggaran: <strong>{count}x</strong>{isKeras && ' — Guru telah mendapat notifikasi.'}
        </p>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Setiap pelanggaran dicatat dan dilaporkan ke guru pengawas.
        {isKeras && ' Jika terus berlanjut, ujian dapat dibatalkan.'}
      </p>
      <Button onClick={onClose} className="w-full">Saya Mengerti</Button>
    </Modal>
  )
}
